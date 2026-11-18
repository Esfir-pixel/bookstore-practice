import { Suspense } from 'react';
import { connection } from 'next/server';
import { createClient } from '@/utils/supabase-server';
import { BookCard } from '@/components/BookCard';
import { SortControls } from '@/components/SortControls';
import type { Book } from '@/utils/types';

type SearchParams = Promise<{
  sort?: 'category' | 'author' | 'year_written';
  order?: 'asc' | 'desc';
}>;

async function BooksContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // ✅ Помечаем компонент как request-bound — исключаем из prerender
  await connection();

  const params = await searchParams;
  const sortField = params.sort || 'category';
  const sortOrder = params.order || 'asc';

  const supabase = await createClient();

  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .neq('status', 'hidden')
    .order(sortField, { ascending: sortOrder === 'asc' });

  if (error) {
    return (
      <div className="p-6 text-destructive">
        Ошибка загрузки книг: {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Каталог книг</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего книг: {books?.length ?? 0}
          </p>
        </div>

        <Suspense fallback={<div className="h-10 w-64 bg-muted animate-pulse rounded" />}>
          <SortControls />
        </Suspense>
      </div>

      {!books || books.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          Пока нет книг. Администратор скоро добавит.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book as Book} />
          ))}
        </div>
      )}
    </>
  );
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="py-12 text-center text-muted-foreground">
            Загрузка каталога...
          </div>
        }
      >
        <BooksContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}