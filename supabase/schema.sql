
-- КНИЖНЫЙ МАГАЗИН — Схема базы данных
-- Supabase / PostgreSQL

-- 1. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Триггер автосоздания профиля при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. КНИГИ
create table public.books (
  id bigint primary key generated always as identity,
  title text not null,
  author text not null,
  category text not null,
  year_written int check (year_written > 0 and year_written <= extract(year from now())),
  description text,
  cover_url text,
  price numeric(10, 2) not null check (price >= 0),
  rent_price_2w numeric(10, 2) check (rent_price_2w >= 0),
  rent_price_1m numeric(10, 2) check (rent_price_1m >= 0),
  rent_price_3m numeric(10, 2) check (rent_price_3m >= 0),
  stock int default 1 check (stock >= 0),
  status text default 'available' check (status in ('available', 'hidden', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.books enable row level security;

create index idx_books_category on public.books(category);
create index idx_books_author on public.books(author);
create index idx_books_year on public.books(year_written);

-- Триггер updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on public.books
  for each row execute procedure public.set_updated_at();


-- 3. ТРАНЗАКЦИИ (покупка / аренда)
create table public.transactions (
  id bigint primary key generated always as identity,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id bigint references public.books(id) on delete cascade not null,
  type text not null check (type in ('purchase', 'rent')),
  rental_period text check (rental_period in ('2w', '1m', '3m')),
  price_paid numeric(10, 2) not null,
  start_date timestamptz default now(),
  end_date timestamptz,
  status text default 'active' check (status in ('active', 'expired', 'returned', 'completed')),
  reminder_sent boolean default false,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_end_date on public.transactions(end_date) where end_date is not null;


-- 4. УВЕДОМЛЕНИЯ
create table public.notifications (
  id bigint primary key generated always as identity,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, read) where read = false;


-- 5. RLS-ПОЛИТИКИ
-- Функция проверки роли (security definer — избегаем рекурсии в RLS)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

-- PROFILES
create policy "Users view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles
  for all using (public.is_admin());

-- BOOKS
create policy "Anyone reads visible books" on public.books
  for select using (status != 'hidden' or public.is_admin());
create policy "Admins manage books" on public.books
  for all using (public.is_admin());

-- TRANSACTIONS
create policy "Users view own transactions" on public.transactions
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Users create own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "Admins manage transactions" on public.transactions
  for all using (public.is_admin());

-- NOTIFICATIONS
create policy "Users view own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Admins manage notifications" on public.notifications
  for all using (public.is_admin());


-- 6. GRANT (права на таблицы)
grant select on public.books to anon, authenticated;
grant insert, update, delete on public.books to authenticated;

grant select, insert on public.transactions to authenticated;
grant update on public.transactions to authenticated;

grant select, update on public.notifications to authenticated;

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant delete on public.profiles to authenticated;


-- 7. ФУНКЦИЯ АВТОМАТИЧЕСКИХ НАПОМИНАНИЙ
create or replace function public.mark_rentals_expired()
returns void as $$
begin
  -- Уведомления для аренд, истекающих через 3 дня
  insert into public.notifications (user_id, message)
  select
    t.user_id,
    'Аренда книги «' || coalesce(b.title, 'книга') ||
    '» заканчивается через 3 дня. Пожалуйста, верните книгу или продлите аренду.'
  from public.transactions t
  left join public.books b on b.id = t.book_id
  where t.type = 'rent'
    and t.status = 'active'
    and t.reminder_sent = false
    and t.end_date between now() + interval '3 days' and now() + interval '3 days 1 minute';

  -- Помечаем флаг
  update public.transactions
  set reminder_sent = true
  where type = 'rent'
    and status = 'active'
    and reminder_sent = false
    and end_date between now() + interval '3 days' and now() + interval '3 days 1 minute';

  -- Истекаем просроченные
  update public.transactions
  set status = 'expired'
  where type = 'rent'
    and status = 'active'
    and end_date < now();
end;
$$ language plpgsql security definer;


-- 8. ТЕСТОВЫЕ ДАННЫЕ
insert into public.books (title, author, category, year_written, price, rent_price_2w, rent_price_1m, rent_price_3m, stock, description)
values
  ('Евгений Онегин', 'Александр Пушкин', 'Классика', 1833, 1000, 120, 250, 600, 7, 'Знаменитый роман в стихах о любви и судьбе'),
  ('1984', 'Джордж Оруэлл', 'Антиутопия', 1949, 1200, 150, 280, 700, 5, 'Классика антиутопии'),
  ('Гарри Поттер и философский камень', 'Дж. К. Роулинг', 'Фэнтези', 1997, 1800, 250, 450, 1100, 10, 'Первая книга о юном волшебнике'),
  ('Анна Каренина', 'Лев Толстой', 'Классика', 1878, 1800, 200, 400, 950, 2, 'История любви, семьи и сложного выбора'),
  ('451 градус по Фаренгейту', 'Рэй Брэдбери', 'Антиутопия', 1953, 1300, 150, 300, 700, 6, 'Мир будущего, в котором книги запрещены');


-- 9. НАЗНАЧЕНИЕ ПЕРВОГО АДМИНИСТРАТОРА
-- ВЫПОЛНИТЕ ПОСЛЕ РЕГИСТРАЦИИ ПЕРВОГО ПОЛЬЗОВАТЕЛЯ:
-- update public.profiles set role = 'admin' where email = 'test-email@example.com';