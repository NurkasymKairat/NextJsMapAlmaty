import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { setSessionCookie, verifyPassword } from '@/lib/auth';
import { validateCredentials } from '@/lib/validation';

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

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, color, password_hash')
    .eq('username', username)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });

  const ok = await verifyPassword(password!, data.password_hash);
  if (!ok) return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });

  await setSessionCookie({ sub: data.id, username: data.username, color: data.color });
  return NextResponse.json({ user: { id: data.id, username: data.username, color: data.color } });
}
