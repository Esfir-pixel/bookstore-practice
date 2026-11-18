import { createClient } from '@/utils/supabase-server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SendReminderButton } from '@/components/admin/SendReminderButton';
import type { TransactionWithBook } from '@/utils/types';

export const instant = false;

const RENTAL_LABEL: Record<string, string> = {
  '2w': '2 недели',
  '1m': '1 месяц',
  '3m': '3 месяца',
};

function formatPrice(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function AdminRentalsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*, books(title, author), profiles(email, full_name)')
    .eq('type', 'rent')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-destructive">Ошибка: {error.message}</div>;
  }

  const rentals = (data ?? []) as (TransactionWithBook & {
    profiles: { email: string; full_name: string | null } | null;
  })[];

  const active = rentals.filter((r) => r.status === 'active');

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Аренды (активных: {active.length}, всего: {rentals.length})
      </h2>

      {rentals.length === 0 ? (
        <p className="text-muted-foreground">Аренд пока нет.</p>
      ) : (
        <div className="space-y-3">
          {rentals.map((r) => {
            const left = daysLeft(r.end_date);
            const urgent = r.status === 'active' && left !== null && left <= 3;

            return (
              <Card key={r.id} className={urgent ? 'border-destructive' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{r.books.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {r.books.author}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Пользователь: {r.profiles?.full_name || r.profiles?.email || '—'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="secondary">
                        {RENTAL_LABEL[r.rental_period ?? ''] ?? r.rental_period}
                      </Badge>
                      <Badge
                        variant={
                          r.status === 'active'
                            ? 'default'
                            : r.status === 'expired'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {r.status === 'active'
                          ? 'Активна'
                          : r.status === 'expired'
                            ? 'Истекла'
                            : r.status === 'returned'
                              ? 'Возвращена'
                              : 'Завершена'}
                      </Badge>
                      <span className="text-sm">{formatPrice(Number(r.price_paid))}</span>
                    </div>

                    <div className="text-sm text-right">
                      <p className="text-muted-foreground text-xs">До</p>
                      <p className="font-medium">
                        {r.end_date ? formatDate(r.end_date) : '—'}
                      </p>
                      {r.status === 'active' && left !== null && (
                        <p className={`text-xs ${urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {left > 0 ? `осталось ${left} дн.` : 'истекла'}
                        </p>
                      )}

                      {r.status === 'active' && r.end_date && left !== null && left <= 7 && (
                        <SendReminderButton
                          transactionId={r.id}
                          alreadySent={r.reminder_sent}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}