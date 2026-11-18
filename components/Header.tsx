import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/utils/supabase-server';
import { buttonVariants } from '@/components/ui/button';
import { LogoutButton } from '@/components/LogoutButton';
import { cn } from '@/lib/utils';
import { BookOpen, Shield, User } from 'lucide-react';

export async function Header() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { role: string; full_name: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    unreadCount = count ?? 0;
  }

  const isAdmin = profile?.role === 'admin';

  // Fraunces для логотипа и навигации 
  const headingFont = 'font-[family-name:var(--font-fraunces)]';

  return (
    <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <BookOpen className="w-5 h-5 text-primary" />
          </span>
          <span className={cn(headingFont, 'text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors')}>
            Книжный
          </span>
        </Link>

        {/* Навигация */}
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/"
            className={cn(headingFont, 'px-3 py-1.5 rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors')}
          >
            Каталог
          </Link>

          {user && (
            <Link
              href="/my-rentals"
              className={cn(headingFont, 'px-3 py-1.5 rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors')}
            >
              Мои аренды
            </Link>
          )}

          {user && (
            <Link
              href="/notifications"
              className={cn(headingFont, 'relative px-3 py-1.5 rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors')}
            >
              Уведомления
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(headingFont, 'flex items-center gap-1 px-3 py-1.5 rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors')}
            >
              <Shield className="w-4 h-4" /> Админ
            </Link>
          )}
        </nav>

        {/* Пользователь */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                href="/profile"
                className={cn(headingFont, 'hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors')}
              >
                <User className="w-4 h-4" />
                {profile?.full_name || user.email}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                Войти
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}