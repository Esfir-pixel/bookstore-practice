import Link from 'next/link';
import { createClient } from '@/utils/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ReturnBookButton } from '@/components/ReturnBookButton';
import type { TransactionWithBook } from '@/utils/types';
import { BookOpen, ShoppingBag } from 'lucide-react';



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


export const instant = false;

const RENTAL_LABEL: Record<string, string> = {
  '2w': '2 недели',
  '1m': '1 месяц',
  '3m': '3 месяца',
};

const STATUS_LABEL: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { text: 'Активна', variant: 'default' },
  expired: { text: 'Истекла', variant: 'destructive' },
  returned: { text: 'Возвращена', variant: 'secondary' },
  completed: { text: 'Завершена', variant: 'outline' },
};

export default async function MyRentalsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('transactions')
    .select('*, books(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-destructive">
        Ошибка: {error.message}
      </div>
    );
  }

  const transactions = (data ?? []) as TransactionWithBook[];

  const activeRentals = transactions.filter(
    (t) => t.type === 'rent' && t.status === 'active'
  );

  const history = transactions.filter(
    (t) => t.type === 'purchase' || t.status !== 'active'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Мои аренды и покупки</h1>

      {/* Активные аренды */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Активные аренды ({activeRentals.length})
        </h2>

        {activeRentals.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Нет активных аренд.{' '}
            <Link href="/" className="underline">
              Перейти в каталог
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {activeRentals.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">{tx.books.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.books.author}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <Badge variant="secondary">
                        {RENTAL_LABEL[tx.rental_period ?? ''] ?? tx.rental_period}
                      </Badge>

                      <Badge variant={STATUS_LABEL[tx.status].variant}>
                        {STATUS_LABEL[tx.status].text}
                      </Badge>

                      {tx.end_date && (
                        <CountdownTimer endDate={tx.end_date} />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/books/${tx.book_id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' })
                      )}
                    >
                      Подробнее
                    </Link>

                    <ReturnBookButton transactionId={tx.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* История */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          История ({history.length})
        </h2>

        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Пока ничего нет.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((tx) => (
              <Card key={tx.id}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">
                    {tx.books.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex flex-wrap gap-2 items-center text-sm">
                  <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>
                    {tx.type === 'purchase' ? 'Покупка' : 'Аренда'}
                  </Badge>

                  <Badge variant={STATUS_LABEL[tx.status].variant}>
                    {STATUS_LABEL[tx.status].text}
                  </Badge>

                  <span className="text-muted-foreground">
                    {formatPrice(Number(tx.price_paid))}
                  </span>

                  <span className="text-muted-foreground text-xs">
                    {formatDate(tx.created_at)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}