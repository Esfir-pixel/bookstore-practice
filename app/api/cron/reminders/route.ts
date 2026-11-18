import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase-server';



export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Вызываем SQL-функцию через RPC
  const { error } = await supabase.rpc('mark_rentals_expired');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

console.log('CRON_SECRET exists:', !!process.env.CRON_SECRET);