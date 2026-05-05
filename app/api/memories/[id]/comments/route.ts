import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_COMMENT_LEN = 500;

type Row = {
  id: string;
  memory_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

type UserRow = { id: string; username: string; color: string };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('id, memory_id, user_id, text, created_at')
    .eq('memory_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET comments] error:', error);
    return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return NextResponse.json({ comments: [] });

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const usersRes = await supabaseAdmin
    .from('users')
    .select('id, username, color')
    .in('id', userIds);

  const userById = new Map<string, UserRow>();
  for (const u of (usersRes.data ?? []) as UserRow[]) userById.set(u.id, u);

  const comments = rows.map((c) => {
    const u = userById.get(c.user_id);
    return {
      id: c.id,
      memory_id: c.memory_id,
      user_id: c.user_id,
      text: c.text,
      created_at: c.created_at,
      username: u?.username ?? 'unknown',
      color: u?.color ?? '#888',
    };
  });

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const { text } = (body ?? {}) as { text?: unknown };
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_COMMENT_LEN) {
    return NextResponse.json(
      { error: `Комментарий: 1–${MAX_COMMENT_LEN} символов` },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ user_id: session.sub, memory_id: id, text: text.trim() })
    .select('id, memory_id, user_id, text, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });

  return NextResponse.json({
    comment: {
      ...data,
      username: session.username,
      color: session.color,
    },
  });
}
