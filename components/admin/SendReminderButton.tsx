'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { sendRentalReminder } from '@/app/actions';

export function SendReminderButton({
  transactionId,
  alreadySent,
}: {
  transactionId: number;
  alreadySent: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (alreadySent) {
    return (
      <Button disabled variant="outline" size="sm">
        <Bell className="w-4 h-4 mr-1" /> Отправлено
      </Button>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await sendRentalReminder(fd);
          toast.success('Напоминание отправлено');
        })
      }
    >
      <input type="hidden" name="transaction_id" value={transactionId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Bell className="w-4 h-4 mr-1" />
        {pending ? 'Отправка...' : 'Напомнить'}
      </Button>
    </form>
  );
}