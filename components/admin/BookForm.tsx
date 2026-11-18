'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BookFormState } from '@/app/actions';
import type { Book } from '@/utils/types';

type Props = {
  action: (
    state: BookFormState,
    formData: FormData
  ) => Promise<BookFormState>;
  book?: Book;
};

const initial: BookFormState = { error: null, success: false };

const STATUSES = [
  { value: 'available', label: 'Доступна' },
  { value: 'hidden', label: 'Скрыта' },
  { value: 'archived', label: 'Архив' },
];

export function BookForm({ action, book }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      {book && <input type="hidden" name="id" value={book.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Название *</Label>
          <Input id="title" name="title" defaultValue={book?.title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="author">Автор *</Label>
          <Input id="author" name="author" defaultValue={book?.author} required />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Категория *</Label>
          <Input
            id="category"
            name="category"
            defaultValue={book?.category}
            placeholder="Классика, Фантастика..."
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year_written">Год написания</Label>
          <Input
            id="year_written"
            name="year_written"
            type="number"
            min={1}
            max={currentYear ?? undefined}
            defaultValue={book?.year_written ?? ''}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Цена покупки (₸) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={book?.price ?? ''}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">В наличии (шт.)</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={book?.stock ?? 1}
          />
        </div>
      </div>

      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="px-2 text-sm font-medium">Цены аренды (₸)</legend>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rent_price_2w">2 недели</Label>
            <Input
              id="rent_price_2w"
              name="rent_price_2w"
              type="number"
              min={0}
              step="0.01"
              defaultValue={book?.rent_price_2w ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rent_price_1m">1 месяц</Label>
            <Input
              id="rent_price_1m"
              name="rent_price_1m"
              type="number"
              min={0}
              step="0.01"
              defaultValue={book?.rent_price_1m ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rent_price_3m">3 месяца</Label>
            <Input
              id="rent_price_3m"
              name="rent_price_3m"
              type="number"
              min={0}
              step="0.01"
              defaultValue={book?.rent_price_3m ?? ''}
            />
          </div>
        </div>
      </fieldset>

      {book && (
        <div className="space-y-1.5">
          <Label htmlFor="status">Статус</Label>
          <Select name="status" defaultValue={book.status}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="cover_url">URL обложки</Label>
        <Input
          id="cover_url"
          name="cover_url"
          type="url"
          defaultValue={book?.cover_url ?? ''}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Описание</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={book?.description ?? ''}
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm resize-y"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Сохранение...'
            : book
              ? 'Сохранить изменения'
              : 'Создать книгу'}
        </Button>
      </div>
    </form>
  );
}