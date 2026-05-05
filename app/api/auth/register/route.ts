import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { validateCredentials } from '@/lib/validation';
import { pickColor } from '@/lib/colors';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const { username, password } = (body ?? {}) as { username?: string; password?: string };
  const err = validateCredentials(username, password);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { count, error: countErr } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true });
  if (countErr) {
    return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  }

  const color = pickColor(count ?? 0);
  const password_hash = await hashPassword(password!);

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ username, password_hash, color })
    .select('id, username, color')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Имя уже занято' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  }

  await setSessionCookie({ sub: data.id, username: data.username, color: data.color });
  return NextResponse.json({ user: data });
}
