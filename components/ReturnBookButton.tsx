'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { returnBook, type ReturnState } from '@/app/actions';
import { RotateCcw } from 'lucide-react';

const initial: ReturnState = { error: null, success: false };

export function ReturnBookButton({ transactionId }: { transactionId: number }) {
  const [state, formAction, isPending] = useActionState(returnBook, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success('Книга возвращена!');
  }, [state]);

  if (state.success) {
    return (
      <Button disabled variant="outline" size="sm">
        Возвращено
      </Button>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="transaction_id" value={transactionId} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <RotateCcw className="w-4 h-4 mr-1" />
        {isPending ? 'Возврат...' : 'Вернуть'}
      </Button>
    </form>
  );
}