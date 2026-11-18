'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/utils/supabase-server';


// АУТЕНТИФИКАЦИЯ

export type AuthState = { error: string | null };

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('full_name') as string },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/login?registered=1');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}


// ПОКУПКА И АРЕНДА КНИГ

export type PurchaseState = { error: string | null; success: boolean };

const RENTAL_DURATION_DAYS = { '2w': 14, '1m': 30, '3m': 90 } as const;
type RentalPeriod = keyof typeof RENTAL_DURATION_DAYS;

export async function purchaseBook(
  _prevState: PurchaseState,
  formData: FormData
): Promise<PurchaseState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Необходимо войти в аккаунт', success: false };
  }

  const bookId = Number(formData.get('book_id'));
  if (!bookId) {
    return { error: 'Неверный ID книги', success: false };
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (bookError || !book) {
    return { error: 'Книга не найдена', success: false };
  }
  if (book.stock <= 0) {
    return { error: 'Книга закончилась', success: false };
  }
  if (book.status !== 'available') {
    return { error: 'Книга недоступна для покупки', success: false };
  }

  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      book_id: book.id,
      type: 'purchase',
      rental_period: null,
      price_paid: book.price,
      status: 'completed',
      end_date: null,
    });

  if (txError) {
    return { error: `Ошибка оформления: ${txError.message}`, success: false };
  }

  const { error: stockError } = await supabase
    .from('books')
    .update({ stock: book.stock - 1 })
    .eq('id', book.id);

  if (stockError) {
    return { error: `Ошибка обновления остатка: ${stockError.message}`, success: false };
  }

  revalidatePath(`/books/${bookId}`);
  revalidatePath('/my-rentals');
  revalidatePath('/');
  return { error: null, success: true };
}

export async function rentBook(
  _prevState: PurchaseState,
  formData: FormData
): Promise<PurchaseState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Необходимо войти в аккаунт', success: false };
  }

  const bookId = Number(formData.get('book_id'));
  const period = formData.get('rental_period') as RentalPeriod;

  if (!bookId || !period || !(period in RENTAL_DURATION_DAYS)) {
    return { error: 'Неверный период аренды', success: false };
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (bookError || !book) {
    return { error: 'Книга не найдена', success: false };
  }
  if (book.stock <= 0) {
    return { error: 'Книга закончилась', success: false };
  }
  if (book.status !== 'available') {
    return { error: 'Книга недоступна для аренды', success: false };
  }

  const priceForPeriod =
    period === '2w' ? book.rent_price_2w
    : period === '1m' ? book.rent_price_1m
    : book.rent_price_3m;

  if (!priceForPeriod) {
    return { error: 'Цена аренды не указана', success: false };
  }

 
  await connection();
  const startDate = new Date();
  const endDate = new Date(
    startDate.getTime() + RENTAL_DURATION_DAYS[period] * 24 * 60 * 60 * 1000
  );

  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      book_id: book.id,
      type: 'rent',
      rental_period: period,
      price_paid: priceForPeriod,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      reminder_sent: false,
    });

  if (txError) {
    return { error: `Ошибка оформления аренды: ${txError.message}`, success: false };
  }

  const { error: stockError } = await supabase
    .from('books')
    .update({ stock: book.stock - 1 })
    .eq('id', book.id);

  if (stockError) {
    return { error: `Ошибка обновления остатка: ${stockError.message}`, success: false };
  }

  revalidatePath(`/books/${bookId}`);
  revalidatePath('/my-rentals');
  revalidatePath('/');
  return { error: null, success: true };
}


// ВОЗВРАТ АРЕНДОВАННОЙ КНИГИ

export type ReturnState = { error: string | null; success: boolean };

export async function returnBook(
  _prevState: ReturnState,
  formData: FormData
): Promise<ReturnState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Необходимо войти в аккаунт', success: false };
  }

  const txId = Number(formData.get('transaction_id'));
  if (!txId) {
    return { error: 'Неверный ID транзакции', success: false };
  }

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('*, books(id, stock)')
    .eq('id', txId)
    .eq('user_id', user.id)
    .single();

  if (txError || !tx) {
    return { error: 'Аренда не найдена', success: false };
  }
  if (tx.type !== 'rent') {
    return { error: 'Это не аренда', success: false };
  }
  if (tx.status !== 'active') {
    return { error: 'Аренда уже завершена', success: false };
  }

  const { error: updateTxError } = await supabase
    .from('transactions')
    .update({ status: 'returned' })
    .eq('id', txId);

  if (updateTxError) {
    return { error: `Ошибка: ${updateTxError.message}`, success: false };
  }

  const book = tx.books as { id: number; stock: number } | null;
  if (book) {
    const { error: stockError } = await supabase
      .from('books')
      .update({ stock: book.stock + 1 })
      .eq('id', book.id);

    if (stockError) {
      return { error: `Ошибка возврата остатка: ${stockError.message}`, success: false };
    }
  }

  revalidatePath('/my-rentals');
  revalidatePath(`/books/${book?.id}`);
  revalidatePath('/');
  return { error: null, success: true };
}




// УПРАВЛЕНИЕ КНИГАМИ (только админ)

export type BookFormState = { error: string | null; success: boolean };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: 'Не авторизован' as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { supabase, error: 'Нет прав' as const };
  return { supabase, error: null };
}

export async function createBook(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: false };

  const title = (formData.get('title') as string)?.trim();
  const author = (formData.get('author') as string)?.trim();
  const category = (formData.get('category') as string)?.trim();
  const year = formData.get('year_written')
    ? Number(formData.get('year_written'))
    : null;
  const price = Number(formData.get('price'));
  const rent2w = formData.get('rent_price_2w')
    ? Number(formData.get('rent_price_2w'))
    : null;
  const rent1m = formData.get('rent_price_1m')
    ? Number(formData.get('rent_price_1m'))
    : null;
  const rent3m = formData.get('rent_price_3m')
    ? Number(formData.get('rent_price_3m'))
    : null;
  const stock = Number(formData.get('stock')) || 0;
  const description = (formData.get('description') as string)?.trim() || null;
  const cover_url = (formData.get('cover_url') as string)?.trim() || null;

  if (!title || !author || !category || !price) {
    return { error: 'Заполните обязательные поля', success: false };
  }

  const { error } = await supabase.from('books').insert({
    title,
    author,
    category,
    year_written: year,
    price,
    rent_price_2w: rent2w,
    rent_price_1m: rent1m,
    rent_price_3m: rent3m,
    stock,
    description,
    cover_url,
    status: 'available',
  });

  if (error) return { error: error.message, success: false };

  revalidatePath('/admin/books');
  revalidatePath('/');
  redirect('/admin/books');
}

export async function updateBook(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: false };

  const id = Number(formData.get('id'));
  if (!id) return { error: 'Неверный ID', success: false };

  const title = (formData.get('title') as string)?.trim();
  const author = (formData.get('author') as string)?.trim();
  const category = (formData.get('category') as string)?.trim();
  const year = formData.get('year_written')
    ? Number(formData.get('year_written'))
    : null;
  const price = Number(formData.get('price'));
  const rent2w = formData.get('rent_price_2w')
    ? Number(formData.get('rent_price_2w'))
    : null;
  const rent1m = formData.get('rent_price_1m')
    ? Number(formData.get('rent_price_1m'))
    : null;
  const rent3m = formData.get('rent_price_3m')
    ? Number(formData.get('rent_price_3m'))
    : null;
  const stock = Number(formData.get('stock')) || 0;
  const description = (formData.get('description') as string)?.trim() || null;
  const cover_url = (formData.get('cover_url') as string)?.trim() || null;
  const status = formData.get('status') as string;

  if (!title || !author || !category || !price) {
    return { error: 'Заполните обязательные поля', success: false };
  }

  const { error } = await supabase
    .from('books')
    .update({
      title,
      author,
      category,
      year_written: year,
      price,
      rent_price_2w: rent2w,
      rent_price_1m: rent1m,
      rent_price_3m: rent3m,
      stock,
      description,
      cover_url,
      status: status === 'hidden' || status === 'archived' ? status : 'available',
    })
    .eq('id', id);

  if (error) return { error: error.message, success: false };

  revalidatePath('/admin/books');
  revalidatePath(`/books/${id}`);
  revalidatePath('/');
  redirect('/admin/books');
}

export async function toggleBookStatus(formData: FormData): Promise<void> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return;

  const id = Number(formData.get('id'));
  const current = formData.get('current_status') as string;
  if (!id) return;

  const next = current === 'hidden' ? 'available' : 'hidden';

  await supabase.from('books').update({ status: next }).eq('id', id);

  revalidatePath('/admin/books');
  revalidatePath(`/books/${id}`);
  revalidatePath('/');
}

export async function deleteBook(formData: FormData): Promise<void> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return;

  const id = Number(formData.get('id'));
  if (!id) return;

  await supabase.from('books').delete().eq('id', id);

  revalidatePath('/admin/books');
  revalidatePath('/');
}



// НАПОМИНАНИЕ ОБ ОКОНЧАНИИ АРЕНДЫ
export async function sendRentalReminder(formData: FormData): Promise<void> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return;

  const txId = Number(formData.get('transaction_id'));
  if (!txId) return;

  const { data: tx } = await supabase
    .from('transactions')
    .select('*, profiles(email, full_name), books(title)')
    .eq('id', txId)
    .single();

  if (!tx || tx.status !== 'active' || !tx.end_date) return;

  // Здесь можно интегрировать реальную отправку email.
  // Пока — логируем в консоль и ставим флаг reminder_sent = true.
  console.log(
    `[REMINDER] ${tx.profiles?.email}: аренда книги «${tx.books?.title}» ` +
      `заканчивается ${tx.end_date}`
  );

  await supabase
    .from('transactions')
    .update({ reminder_sent: true })
    .eq('id', txId);

  revalidatePath('/admin/rentals');
}



// ОТМЕТКА УВЕДОМЛЕНИЯ КАК ПРОЧИТАННОГО

export async function markNotificationRead(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = Number(formData.get('id'));
  if (!id) return;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id);

  revalidatePath('/notifications');
}





// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (только админ)

export type UserActionState = { error: string | null; success: boolean };

export async function changeUserRole(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError, success: false };

  const userId = formData.get('user_id') as string;
  const newRole = formData.get('role') as string;

  if (!userId || !['user', 'admin'].includes(newRole)) {
    return { error: 'Неверные данные', success: false };
  }

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (userId === currentUser?.id) {
    return { error: 'Нельзя изменить свою собственную роль', success: false };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) return { error: error.message, success: false };

  revalidatePath('/admin/users');
  return { error: null, success: true };
}

export async function deleteUserProfile(formData: FormData): Promise<void> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return;

  const userId = formData.get('user_id') as string;
  if (!userId) return;

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (userId === currentUser?.id) return;

  // Удаляем профиль (CASCADE удалит транзакции и уведомления)
  await supabase.from('profiles').delete().eq('id', userId);

  // Удаляем auth-пользователя через admin-клиент
  const { createAdminClient } = await import('@/utils/supabase-server');
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);

  revalidatePath('/admin/users');
}