import { createClient } from '@/utils/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ShoppingBag, Clock, Users } from 'lucide-react';

export const instant = false;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [booksRes, activeRentalsRes, purchasesRes, usersRes] =
    await Promise.all([
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'rent')
        .eq('status', 'active'),
      supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'purchase'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ]);

  const stats = [
    {
      label: 'Книг в каталоге',
      value: booksRes.count ?? 0,
      icon: BookOpen,
      color: 'text-blue-600',
    },
    {
      label: 'Активных аренд',
      value: activeRentalsRes.count ?? 0,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      label: 'Покупок',
      value: purchasesRes.count ?? 0,
      icon: ShoppingBag,
      color: 'text-green-600',
    },
    {
      label: 'Пользователей',
      value: usersRes.count ?? 0,
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Обзор</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}