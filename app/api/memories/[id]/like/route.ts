import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getCount(memoryId: string) {
  const { count } = await supabaseAdmin
    .from('likes')
    .select('user_id', { count: 'exact', head: true })
    .eq('memory_id', memoryId);
  return count ?? 0;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('likes')
    .insert({ user_id: session.sub, memory_id: id });

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  }

  return NextResponse.json({ liked: true, like_count: await getCount(id) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('likes')
    .delete()
    .eq('user_id', session.sub)
    .eq('memory_id', id);

  if (error) return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });

  return NextResponse.json({ liked: false, like_count: await getCount(id) });
}
