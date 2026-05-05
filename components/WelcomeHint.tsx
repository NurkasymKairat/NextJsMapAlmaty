'use client';

import { useEffect, useState } from 'react';
import type { PublicUser } from '@/lib/types';

const STORAGE_KEY = 'almaty_welcome_dismissed_v3';

const STEPS = [
  { n: 1, title: 'Тапните по карте', body: 'Найдите место в Алматы, которое для вас что-то значит.' },
  { n: 2, title: 'Оставьте заметку', body: 'До 200 символов — воспоминание, чувство, история.' },
  { n: 3, title: 'Прочтите чужие', body: 'Стикеры людей складываются в нити памяти по всему городу.' },
];

export default function WelcomeHint({ user }: { user: PublicUser | null }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === '1';
      if (!dismissed) setShown(true);
    } catch {
      setShown(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setShown(false);
  }

  if (!shown) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[1100] flex items-center justify-center"
      style={{ background: 'rgba(28,22,12,0.42)', backdropFilter: 'blur(2px)', padding: 16 }}
      onClick={dismiss}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--paper-0)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-modal)',
          padding: '28px 22px 22px',
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          Городской архив воспоминаний
        </div>
        <h2
          className="display"
          style={{
            fontSize: 30,
            margin: '0 0 8px',
            lineHeight: 1.05,
          }}
        >
          Алматы
          <br />
          помнит
        </h2>
        <p
          style={{
            margin: '0 0 26px',
            color: 'var(--paper-500)',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Карта общих воспоминаний о городе. Каждая точка — чья-то история.
        </p>

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 24px',
            display: 'grid',
            gap: 16,
          }}
        >
          {STEPS.map((s) => (
            <li key={s.n} style={{ display: 'flex', gap: 14 }}>
              <span
                className="display"
                style={{
                  width: 32,
                  height: 32,
                  flex: '0 0 auto',
                  background: 'var(--paper-100)',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--paper-ink)',
                }}
              >
                {s.n}
              </span>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--paper-ink)',
                    marginBottom: 2,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--paper-500)',
                    lineHeight: 1.45,
                  }}
                >
                  {s.body}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {user ? (
          <button
            type="button"
            onClick={dismiss}
            className="btn btn--primary"
            style={{ width: '100%', padding: '14px 20px', fontSize: 14 }}
          >
            Начать
          </button>
        ) : (
          <>
            <a
              href="/login"
              className="btn btn--primary"
              style={{ width: '100%', padding: '14px 20px', fontSize: 14 }}
            >
              Войти и начать
            </a>
            <button
              type="button"
              onClick={dismiss}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                padding: '12px 0 0',
                fontSize: 13,
                color: 'var(--paper-500)',
              }}
            >
              Просто посмотреть карту
            </button>
          </>
        )}
      </div>
    </div>
  );
}
