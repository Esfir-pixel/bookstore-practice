'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { rentBook, type PurchaseState } from '@/app/actions';
import { BookOpen, Check } from 'lucide-react';
import type { Book } from '@/utils/types';

const initial: PurchaseState = { error: null, success: false };

const PERIODS = [
  { value: '2w', label: '2 недели', field: 'rent_price_2w' as const },
  { value: '1m', label: '1 месяц', field: 'rent_price_1m' as const },
  { value: '3m', label: '3 месяца', field: 'rent_price_3m' as const },
];

export function RentButton({
  book,
  disabled,
}: {
  book: Book;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(rentBook, initial);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<'2w' | '1m' | '3m'>('2w');

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success('Аренда оформлена!');
      setOpen(false);
    }
  }, [state]);

  if (state.success) {
    return (
      <Button disabled className="flex-1" variant="outline">
        <Check className="w-4 h-4 mr-2" /> Арендовано
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
          render={
           <Button variant="secondary" className="flex-1" disabled={disabled} />
          }
        >
          <BookOpen className="w-4 h-4 mr-2" /> Арендовать
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Аренда: {book.title}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="book_id" value={book.id} />
          <input type="hidden" name="rental_period" value={selected} />

          <div className="space-y-2">
            {PERIODS.map((p) => {
              const price = book[p.field];
              return (
                <label
                  key={p.value}
                  className={`flex items-center justify-between p-3 border rounded cursor-pointer ${
                    selected === p.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="period_radio"
                      value={p.value}
                      checked={selected === p.value}
                      onChange={() => setSelected(p.value as '2w' | '1m' | '3m')}
                    />
                    <span className="font-medium">{p.label}</span>
                  </div>
                  <span className="font-bold">
                    {price ? `${Number(price).toLocaleString('ru-RU')} ₸` : '—'}
                  </span>
                </label>
              );
            })}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Оформление...' : 'Подтвердить аренду'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}