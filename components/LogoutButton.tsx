'use client';

import { logout } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="w-4 h-4 mr-1" /> Выйти
      </Button>
    </form>
  );
}