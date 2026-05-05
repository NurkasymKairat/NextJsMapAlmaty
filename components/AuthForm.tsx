'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

type Mode = 'login' | 'register';

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Что-то пошло не так');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Сеть недоступна');
    } finally {
      setLoading(false);
    }
  }

  const title = mode === 'login' ? 'Войти' : 'Создать профиль';
  const submitLabel = mode === 'login' ? 'Войти' : 'Создать профиль';
  const altHref = mode === 'login' ? '/register' : '/login';
  const altLabel =
    mode === 'login' ? 'Нет аккаунта? Создать новый' : 'Уже есть профиль? Войти';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-sm text-stone-500 mb-8 hover:text-stone-900">
          ← К карте
        </Link>

        <div className="mb-8 p-4 rounded-xl bg-stone-100 border border-stone-200">
          <p className="text-sm text-stone-700 leading-snug">
            <strong className="text-stone-900">Алматы помнит</strong> — карта памяти города.
            Каждый отмечает места, важные именно для него. Из заметок незнакомцев складывается
            общий портрет города.
          </p>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mb-1">{title}</h1>
        <p className="text-sm text-stone-500 mb-8">
          {mode === 'register'
            ? 'Только имя и пароль — без почты и подтверждений. Имя увидят все на карте.'
            : 'Введите имя и пароль, которые вы выбрали при регистрации.'}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-stone-500">Имя</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
              minLength={3}
              maxLength={20}
              className="mt-1 w-full h-12 px-4 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-base"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-stone-500">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              className="mt-1 w-full h-12 px-4 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-base"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '…' : submitLabel}
          </button>
        </form>

        <Link
          href={altHref}
          className="block text-center text-sm text-stone-500 mt-6 hover:text-stone-900"
        >
          {altLabel}
        </Link>
      </div>
    </div>
  );
}
