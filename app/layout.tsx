import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Fraunces } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// ✅ Новый шрифт для логотипа и заголовков
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Книжный магазин',
  description: 'Покупка и аренда книг',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <Suspense fallback={<div className="h-16 border-b bg-card" />}>
          <Header />
        </Suspense>

        <main className="flex-1">{children}</main>

        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}