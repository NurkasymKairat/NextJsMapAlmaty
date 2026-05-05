'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import Wordmark from './Wordmark';

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

  const title = mode === 'login' ? 'Войти' : 'Новый профиль';
  const submitLabel = mode === 'login' ? 'Войти' : 'Создать профиль';
  const altHref = mode === 'login' ? '/register' : '/login';
  const altLabel = mode === 'login' ? 'Нет аккаунта? Создать новый' : 'Уже есть профиль? Войти';

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--paper-50)', padding: '40px 24px' }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--paper-500)',
            marginBottom: 32,
          }}
        >
          ← К карте
        </Link>

        <div style={{ marginBottom: 24 }}>
          <Wordmark size={28} />
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>
          {mode === 'register' ? '01 — Регистрация' : '01 — Вход'}
        </div>
        <h1
          className="display"
          style={{ fontSize: 28, margin: '0 0 8px', lineHeight: 1.1 }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--paper-500)',
            lineHeight: 1.5,
            marginBottom: 28,
          }}
        >
          {mode === 'register'
            ? 'Только имя и пароль — без почты и подтверждений. Имя увидят все на карте.'
            : 'Введите имя и пароль, которые выбрали при регистрации.'}
        </p>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="block">
            <span className="label">Имя</span>
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
              className="field"
            />
          </label>

          <label className="block">
            <span className="label">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              className="field"
            />
            {mode === 'register' && (
              <span
                className="mono"
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'var(--paper-400)',
                  marginTop: 6,
                  letterSpacing: '0.04em',
                }}
              >
                Минимум 6 символов · 3–20 латиница
              </span>
            )}
          </label>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--error)' }} role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary"
            style={{ width: '100%', padding: '14px 20px', fontSize: 14, marginTop: 4 }}
          >
            {loading ? '…' : submitLabel}
          </button>
        </form>

        <Link
          href={altHref}
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--paper-500)',
            marginTop: 20,
          }}
        >
          {altLabel}
        </Link>
      </div>
    </div>
  );
}
