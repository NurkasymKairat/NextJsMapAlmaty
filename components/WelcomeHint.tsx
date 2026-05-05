'use client';

import { useEffect, useState } from 'react';
import type { PublicUser } from '@/lib/types';

const STORAGE_KEY = 'almaty_welcome_dismissed_v2';

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
      className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_220ms_ease-out]"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-[slideUp_280ms_cubic-bezier(0.2,0.9,0.3,1.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center text-3xl">
            📍
          </div>
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-center mb-2">
          Алматы помнит
        </h2>
        <p className="text-sm text-stone-600 text-center mb-5 leading-relaxed">
          Это карта памяти города. Каждый отмечает места, важные для него — и из заметок
          незнакомцев складывается общий портрет Алматы.
        </p>

        <div className="space-y-3 mb-6">
          <Step n={1} text="Полистайте карту — другие уже оставили свои места." />
          <Step
            n={2}
            text={
              user
                ? 'Нажмите на любую точку, чтобы оставить там свою заметку.'
                : 'Войдите, чтобы добавить своё место.'
            }
          />
          <Step n={3} text="Открывайте чужие заметки, ставьте лайки, оставляйте комментарии." />
        </div>

        {user ? (
          <button
            type="button"
            onClick={dismiss}
            className="w-full h-12 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 transition"
          >
            Понятно, начинаем
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 h-12 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition"
            >
              Просто посмотреть
            </button>
            <a
              href="/login"
              className="flex-1 h-12 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 transition flex items-center justify-center"
            >
              Войти
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-sm text-stone-700 leading-snug">{text}</p>
    </div>
  );
}
