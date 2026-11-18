import Link from 'next/link';
import { createClient } from '@/utils/supabase-server';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toggleBookStatus, deleteBook } from '@/app/actions';
import { Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { Book } from '@/utils/types';

export const instant = false;

function formatPrice(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
}

export default async function AdminBooksPage() {
  const supabase = await createClient();

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (books ?? []) as Book[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Книги ({list.length})</h2>
        <Link
          href="/admin/books/new"
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          <Plus className="w-4 h-4 mr-1" /> Добавить книгу
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Книг пока нет
                </TableCell>
              </TableRow>
            ) : (
              list.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {b.title}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{b.author}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{b.category}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(b.price)}</TableCell>
                  <TableCell>{b.stock}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        b.status === 'available'
                          ? 'default'
                          : b.status === 'hidden'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {b.status === 'available'
                        ? 'Доступна'
                        : b.status === 'hidden'
                          ? 'Скрыта'
                          : 'Архив'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/books/${b.id}/edit`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>

                      <form action={toggleBookStatus}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="current_status" value={b.status} />
                        <Button type="submit" variant="ghost" size="sm" title="Скрыть/показать">
                          {b.status === 'hidden' ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </form>

                      <form action={deleteBook}>
                        <input type="hidden" name="id" value={b.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}