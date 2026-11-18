'use client';

import { useActionState } from 'react';
import { login, type AuthState } from '@/app/actions';
import Link from 'next/link';

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Вход</h1>
      <form action={formAction} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          required
          className="w-full border rounded px-3 py-2"
        />
        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p className="mt-4 text-sm text-center">
        Нет аккаунта? <Link href="/register" className="underline">Зарегистрироваться</Link>
      </p>
    </div>
  );
}