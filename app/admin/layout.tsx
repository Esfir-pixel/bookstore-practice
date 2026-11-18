import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase-server';
import { LayoutDashboard, BookOpen, Users, Clock } from 'lucide-react';

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  const nav = [
    { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
    { href: '/admin/books', label: 'Книги', icon: BookOpen },
    { href: '/admin/rentals', label: 'Аренды', icon: Clock },
    { href: '/admin/users', label: 'Пользователи', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Админ-панель</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors whitespace-nowrap"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}