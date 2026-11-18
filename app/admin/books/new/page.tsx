import Link from 'next/link';
import { createBook } from '@/app/actions';
import { BookForm } from '@/components/admin/BookForm';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const instant = false;

export default function NewBookPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/books"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад
        </Link>
        <h2 className="text-xl font-semibold mt-2">Новая книга</h2>
      </div>

      <BookForm action={createBook} />
    </div>
  );
}