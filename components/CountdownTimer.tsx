'use client';

import { useEffect, useState } from 'react';

export function CountdownTimer({ endDate }: { endDate: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Пока время не прочитано на клиенте — показываем плейсхолдер
  if (now === null) {
    return <span className="text-xs text-muted-foreground">Загрузка...</span>;
  }

  const end = new Date(endDate).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return <span className="text-xs font-medium text-destructive">Срок истёк</span>;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const colorClass =
    days < 3 ? 'text-destructive' : days < 7 ? 'text-amber-600' : 'text-green-700';

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      Осталось: {days} д {hours} ч {minutes} мин
    </span>
  );
}