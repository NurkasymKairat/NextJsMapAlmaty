'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicUser } from '@/lib/types';
import Wordmark from './Wordmark';

export default function TopBar({ user }: { user: PublicUser | null }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[700] pointer-events-none"
      style={{ padding: '12px 14px' }}
    >
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        <div
          className="inline-flex items-center"
          style={{
            background: 'var(--paper-0, #fafaf9)',
            borderRadius: 999,
            padding: '8px 14px',
            boxShadow:
              'var(--shadow-paper, 0 1px 0 rgba(60,40,20,0.04), 0 2px 6px rgba(60,40,20,0.06))',
          }}
        >
          <Wordmark size={24} />
        </div>

        {user ? (
          <div
            className="inline-flex items-center min-w-0"
            style={{
              gap: 8,
              background: 'var(--paper-0, #fafaf9)',
              borderRadius: 999,
              padding: '7px 7px 7px 14px',
              boxShadow:
                'var(--shadow-paper, 0 1px 0 rgba(60,40,20,0.04), 0 2px 6px rgba(60,40,20,0.06))',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--paper-700, #4d4438)',
            }}
          >
            <span
              className="inline-block flex-shrink-0"
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: user.color,
              }}
            />
            <span className="truncate" style={{ maxWidth: 100 }}>
              {user.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="btn btn--quiet"
              style={{ padding: '6px 10px', fontSize: 12 }}
            >
              Выйти
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="btn btn--primary"
            style={{ padding: '10px 16px', fontSize: 13 }}
          >
            Войти
          </Link>
        )}
      </div>
    </div>
  );
}
