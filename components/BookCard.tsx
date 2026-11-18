import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Book } from '@/utils/types';

function formatPrice(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
}

type Props = { book: Book };

export function BookCard({ book }: Props) {
  const available = book.stock > 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full p-0 gap-0">
      <Link href={`/books/${book.id}`} className="flex flex-col h-full">
        <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-sm px-4 text-center">
              {book.title}
            </span>
          )}
        </div>

        <CardHeader className="p-4 pb-2">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground">{book.author}</p>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">{book.category}</Badge>
          {book.year_written && (
            <Badge variant="outline" className="text-xs">{book.year_written}</Badge>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-2 mt-auto flex items-center justify-between gap-2">
          <span className="font-bold">{formatPrice(book.price)}</span>
          <Badge variant={available ? 'default' : 'destructive'} className="text-xs">
            {available ? `В наличии: ${book.stock}` : 'Нет в наличии'}
          </Badge>
        </CardFooter>
      </Link>
    </Card>
  );
}