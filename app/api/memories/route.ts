import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { MAX_ASSOCIATION_LEN } from '@/lib/validation';
import { fetchAllMemories } from '@/lib/memories';

export async function GET() {
  try {
    const session = await getSession();
    const memories = await fetchAllMemories(session?.sub ?? null);
    return NextResponse.json({ memories });
  } catch (e) {
    console.error('[GET /api/memories] failed:', e);
    return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const { lat, lng, association } = (body ?? {}) as {
    lat?: unknown;
    lng?: unknown;
    association?: unknown;
  };

  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ error: 'Неверные координаты' }, { status: 400 });
  }
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

  const { data: maxRow, error: maxErr } = await supabaseAdmin
    .from('memories')
    .select('order_index')
    .eq('user_id', session.sub)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) {
    console.error('[POST /api/memories] order_index lookup failed:', maxErr);
  }

  const order_index = maxRow ? maxRow.order_index + 1 : 0;

  const { data, error } = await supabaseAdmin
    .from('memories')
    .insert({
      user_id: session.sub,
      lat,
      lng,
      association: association.trim(),
      order_index,
    })
    .select('id, user_id, lat, lng, association, order_index, created_at')
    .single();

  if (error) {
    console.error('[POST /api/memories] insert failed:', error, {
      user_id: session.sub,
      lat,
      lng,
      order_index,
    });
    return NextResponse.json(
      { error: `Ошибка БД: ${error.message}`, code: error.code },
      { status: 500 },
    );
  }
  if (!data) {
    console.error('[POST /api/memories] insert returned no data');
    return NextResponse.json({ error: 'Insert вернул пусто' }, { status: 500 });
  }

  return NextResponse.json({
    memory: {
      ...data,
      username: session.username,
      color: session.color,
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
    },
  });
}
