import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase-server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseButton } from '@/components/PurchaseButton';
import { RentButton } from '@/components/RentButton';
import { ArrowLeft } from 'lucide-react';
import type { Book } from '@/utils/types';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Детерминированное форматирование цены — без locale, без Date
function formatPrice(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
}

export const instant = false;

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = Number(id);
  if (!bookId) notFound();

  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (error || !book) notFound();

  const b = book as Book;
  const available = b.stock > 0 && b.status === 'available';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: 'ghost' }), 'mb-6')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Назад в каталог
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Обложка */}
        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {b.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.cover_url}
              alt={b.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-center px-6">
              {b.title}
            </span>
          )}
        </div>

        {/* Информация */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">{b.title}</h1>
          <p className="text-lg text-muted-foreground mt-2">{b.author}</p>

          <div className="flex gap-2 mt-4">
            <Badge variant="secondary">{b.category}</Badge>
            {b.year_written && (
              <Badge variant="outline">{b.year_written}</Badge>
            )}
            <Badge variant={available ? 'default' : 'destructive'}>
              {available ? `В наличии: ${b.stock}` : 'Нет в наличии'}
            </Badge>
          </div>

          {b.description && (
            <p className="mt-6 text-muted-foreground leading-relaxed">
              {b.description}
            </p>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Цены</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Покупка</span>
                <span className="font-bold">{formatPrice(b.price)}</span>
              </div>
              {b.rent_price_2w && (
                <div className="flex justify-between">
                  <span>Аренда 2 недели</span>
                  <span>{formatPrice(Number(b.rent_price_2w))}</span>
                </div>
              )}
              {b.rent_price_1m && (
                <div className="flex justify-between">
                  <span>Аренда 1 месяц</span>
                  <span>{formatPrice(Number(b.rent_price_1m))}</span>
                </div>
              )}
              {b.rent_price_3m && (
                <div className="flex justify-between">
                  <span>Аренда 3 месяца</span>
                  <span>{formatPrice(Number(b.rent_price_3m))}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <PurchaseButton bookId={b.id} disabled={!available} />
            <RentButton book={b} disabled={!available} />
          </div>
        </div>
      </div>
    </div>
  );
}