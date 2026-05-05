import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { MAX_ASSOCIATION_LEN } from '@/lib/validation';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const { association } = (body ?? {}) as { association?: unknown };
  if (
    typeof association !== 'string' ||
    association.trim().length === 0 ||
    association.length > MAX_ASSOCIATION_LEN
  ) {
    return NextResponse.json(
      { error: `Текст: 1–${MAX_ASSOCIATION_LEN} символов` },
      { status: 400 },
    );
  }

  const { data: existing, error: findErr } = await supabaseAdmin
    .from('memories')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  if (existing.user_id !== session.sub) {
    return NextResponse.json({ error: 'Чужая запись' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('memories')
    .update({ association: association.trim() })
    .eq('id', id)
    .select('id, association')
    .single();

  if (error) return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  return NextResponse.json({ memory: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { data: existing, error: findErr } = await supabaseAdmin
    .from('memories')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  if (existing.user_id !== session.sub) {
    return NextResponse.json({ error: 'Чужая запись' }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from('memories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
