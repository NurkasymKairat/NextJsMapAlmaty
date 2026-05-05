'use client';

import { useState } from 'react';

export type AuthorInfo = {
  id: string;
  username: string;
  color: string;
  count: number;
};

type Props = {
  authors: AuthorInfo[];
  visibleIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (visible: boolean) => void;
};

export default function ThreadsPanel({ authors, visibleIds, onToggle, onToggleAll }: Props) {
  const [open, setOpen] = useState(false);
  const allOn = authors.length > 0 && authors.every((a) => visibleIds.has(a.id));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Нити памяти"
        className="absolute top-16 right-3 z-[500] h-11 pl-3 pr-4 bg-white rounded-full shadow-md flex items-center gap-2 hover:bg-stone-50 text-sm font-medium text-stone-900"
      >
        <ThreadsIcon />
        <span>Нити</span>
        {authors.length > 0 && (
          <span className="text-xs text-stone-400 tabular-nums">{authors.length}</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[600] bg-black/30 animate-[fadeIn_180ms_ease-out]"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-16 right-3 w-[min(280px,calc(100vw-1.5rem))] bg-white rounded-xl shadow-xl border border-stone-200 max-h-[70vh] overflow-hidden flex flex-col animate-[slideUp_220ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-stone-100 flex items-center">
              <span className="text-xs uppercase tracking-wider text-stone-500 flex-1">
                Нити памяти
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-900 w-7 h-7 flex items-center justify-center"
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {authors.length === 0 ? (
                <p className="text-xs text-stone-500 px-2 py-3">
                  Пока никто ничего не отметил.
                </p>
              ) : (
                <>
                  <label className="flex items-center gap-3 px-2 py-2 rounded hover:bg-stone-50 cursor-pointer border-b border-stone-100 mb-1">
                    <input
                      type="checkbox"
                      checked={allOn}
                      onChange={() => onToggleAll(!allOn)}
                      className="w-4 h-4 accent-stone-900"
                    />
                    <span className="text-xs uppercase tracking-wider text-stone-500">
                      Показать все
                    </span>
                  </label>
                  {authors.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-3 px-2 py-2 rounded hover:bg-stone-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleIds.has(a.id)}
                        onChange={() => onToggle(a.id)}
                        className="w-4 h-4 accent-stone-900"
                      />
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: a.color }}
                      />
                      <span className="flex-1 text-sm text-stone-800 truncate">
                        {a.username}
                      </span>
                      <span className="text-xs text-stone-400 tabular-nums">{a.count}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ThreadsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
