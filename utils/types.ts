export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

export type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  year_written: number | null;
  description: string | null;
  cover_url: string | null;
  price: number;
  rent_price_2w: number | null;
  rent_price_1m: number | null;
  rent_price_3m: number | null;
  stock: number;
  status: 'available' | 'hidden' | 'archived';
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: number;
  user_id: string;
  book_id: number;
  type: 'purchase' | 'rent';
  rental_period: '2w' | '1m' | '3m' | null;
  price_paid: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'expired' | 'returned' | 'completed';
  reminder_sent: boolean;
  created_at: string;
};

// Расширенный тип для отображения в UI (join с books)
export type TransactionWithBook = Transaction & { books: Book };