'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { purchaseBook, type PurchaseState } from '@/app/actions';
import { ShoppingCart, Check } from 'lucide-react';

const initial: PurchaseState = { error: null, success: false };

export function PurchaseButton({
  bookId,
  disabled,
}: {
  bookId: number;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(purchaseBook, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success('Книга успешно куплена!');
  }, [state]);

  if (state.success) {
    return (
      <Button disabled className="flex-1" variant="outline">
        <Check className="w-4 h-4 mr-2" /> Куплено
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex-1">
      <input type="hidden" name="book_id" value={bookId} />
      <Button
        type="submit"
        disabled={disabled || isPending}
        className="w-full"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {isPending ? 'Оформление...' : 'Купить'}
      </Button>
    </form>
  );
}