import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase-server';
import { updateBook } from '@/app/actions';
import { BookForm } from '@/components/admin/BookForm';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Book } from '@/utils/types';

export const instant = false;

export default async function EditBookPage({
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/books"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад
        </Link>
        <h2 className="text-xl font-semibold mt-2">
          Редактирование: {book.title}
        </h2>
      </div>

      <BookForm action={updateBook} book={book as Book} />
    </div>
  );
}