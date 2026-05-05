'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicUser } from '@/lib/types';

export default function TopBar({ user }: { user: PublicUser | null }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-[700] bg-white/90 backdrop-blur-sm border-b border-stone-200">
      <div className="flex items-center justify-between h-14 px-3 gap-2">
        <h1 className="text-[15px] font-semibold tracking-tight whitespace-nowrap">
          Алматы помнит
        </h1>

        {user ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: user.color }}
              />
              <span className="text-sm text-stone-700 truncate max-w-[100px]">
                {user.username}
              </span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-stone-500 hover:text-stone-900 px-2 h-11 flex items-center flex-shrink-0"
            >
              Выйти
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-stone-900 px-3 h-11 flex items-center hover:text-stone-700 flex-shrink-0"
          >
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
