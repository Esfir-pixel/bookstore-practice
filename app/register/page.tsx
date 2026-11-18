'use client';

import { useActionState } from 'react';
import { register, type AuthState } from '@/app/actions';
import Link from 'next/link';

const initialState: AuthState = { error: null };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Регистрация</h1>
      <form action={formAction} className="space-y-4">
        <input
          name="full_name"
          placeholder="Имя"
          required
          className="w-full border rounded px-3 py-2"
        />
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
          placeholder="Пароль (мин. 6 символов)"
          minLength={6}
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
          {isPending ? 'Создание...' : 'Создать аккаунт'}
        </button>
      </form>
      <p className="mt-4 text-sm text-center">
        Есть аккаунт? <Link href="/login" className="underline">Войти</Link>
      </p>
    </div>
  );
}