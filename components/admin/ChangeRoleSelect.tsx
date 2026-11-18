'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { changeUserRole, type UserActionState } from '@/app/actions';

const initial: UserActionState = { error: null, success: false };

export function ChangeRoleSelect({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const [state, formAction, isPending] = useActionState(changeUserRole, initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success('Роль обновлена');
  }, [state]);

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground">(это вы)</span>
    );
  }

  return (
    <form
      action={(fd) => startTransition(() => { formAction(fd); })}
      className="inline-block"
    >
      <input type="hidden" name="user_id" value={userId} />
      <Select
        name="role"
        defaultValue={currentRole}
        disabled={isPending || pending}
        onValueChange={(v) => {
          if (!v) return;
          const fd = new FormData();
          fd.set('user_id', userId);
          fd.set('role', v);
          startTransition(() => { formAction(fd); });
        }}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">Пользователь</SelectItem>
          <SelectItem value="admin">Администратор</SelectItem>
        </SelectContent>
      </Select>
    </form>
  );
}