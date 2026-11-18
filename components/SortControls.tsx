'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type SortField = 'category' | 'author' | 'year_written';
type SortOrder = 'asc' | 'desc';

export function SortControls() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentField = (params.get('sort') as SortField) || 'category';
  const currentOrder = (params.get('order') as SortOrder) || 'asc';

  function update(field: string, order: string) {
    const next = new URLSearchParams(params.toString());
    next.set('sort', field);
    next.set('order', order);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Label htmlFor="sort-select" className="text-sm">
        Сортировать по:
      </Label>

      <Select
        value={currentField}
        onValueChange={(v) => {
        if (v) update(v, currentOrder);
       }}
      >
        <SelectTrigger id="sort-select" className="w-[180px]">
          <SelectValue placeholder="Выберите поле" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="category">Категории</SelectItem>
          <SelectItem value="author">Автору</SelectItem>
          <SelectItem value="year_written">Году написания</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => update(currentField, currentOrder === 'asc' ? 'desc' : 'asc')}
        title={currentOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
      >
        {currentOrder === 'asc' ? (
          <>
            <ArrowUp className="w-4 h-4 mr-1" /> По возрастанию
          </>
        ) : (
          <>
            <ArrowDown className="w-4 h-4 mr-1" /> По убыванию
          </>
        )}
      </Button>
    </div>
  );
}