import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase-server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { markNotificationRead } from '@/app/actions';
import { Bell } from 'lucide-react';

export const instant = false;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-destructive p-8">Ошибка: {error.message}</div>;
  }

  const list = data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Bell className="w-6 h-6" /> Уведомления
      </h1>

      {list.length === 0 ? (
        <p className="text-muted-foreground">Уведомлений пока нет.</p>
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1">
                  <p className={n.read ? 'text-muted-foreground' : 'font-medium'}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>

                {!n.read && (
                  <>
                    <Badge variant="destructive">Новое</Badge>

                    <form action={markNotificationRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Прочитано
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/my-rentals" className="underline">
          К моим арендам
        </Link>
      </p>
    </div>
  );
}