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
        className="absolute z-[500] inline-flex items-center"
        style={{
          top: 84,
          right: 14,
          background: 'var(--paper-0)',
          boxShadow: 'var(--shadow-paper)',
          border: 'none',
          borderRadius: 999,
          padding: '10px 16px 10px 14px',
          gap: 10,
          cursor: 'pointer',
          fontFamily: 'var(--font-text)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--paper-700)',
        }}
      >
        <ThreadsIcon />
        <span>Нити памяти</span>
        <span
          className="mono"
          style={{
            background: 'var(--paper-100)',
            color: 'var(--paper-500)',
            padding: '2px 7px',
            borderRadius: 999,
            fontSize: 11,
          }}
        >
          {authors.length}
        </span>
      </button>

      {open && (
        <div
          className="modal-backdrop fixed inset-0 z-[600]"
          style={{ background: 'rgba(28,22,12,0.25)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-card absolute"
            onClick={(e) => e.stopPropagation()}
            style={{
              top: 84,
              right: 14,
              width: 'min(320px, calc(100vw - 28px))',
              background: 'var(--paper-0)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px 10px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div className="eyebrow">Нити памяти</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                style={{
                  width: 28,
                  height: 28,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--paper-500)',
                  borderRadius: '50%',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: 8 }}>
              {authors.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--paper-500)',
                    padding: '10px 12px',
                  }}
                >
                  Пока никто ничего не отметил.
                </p>
              ) : (
                <>
                  <label
                    className="cursor-pointer flex items-center gap-3"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      borderBottom: '1px solid var(--line)',
                      marginBottom: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allOn}
                      onChange={() => onToggleAll(!allOn)}
                      style={{ width: 16, height: 16, accentColor: 'var(--paper-ink)' }}
                    />
                    <span className="eyebrow">Показать все</span>
                  </label>
                  {authors.map((a) => (
                    <label
                      key={a.id}
                      className="cursor-pointer flex items-center gap-3"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleIds.has(a.id)}
                        onChange={() => onToggle(a.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--paper-ink)' }}
                      />
                      <span
                        className="inline-block flex-shrink-0"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: a.color,
                        }}
                      />
                      <span
                        className="flex-1 truncate"
                        style={{ fontSize: 14, color: 'var(--paper-700)' }}
                      >
                        {a.username}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: 'var(--paper-400)' }}
                      >
                        {a.count}
                      </span>
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
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="6" r="1.6" fill="currentColor" />
      <circle cx="13" cy="11" r="1.6" fill="currentColor" />
      <circle cx="8" cy="18" r="1.6" fill="currentColor" />
      <circle cx="19" cy="16" r="1.6" fill="currentColor" />
      <path d="M5 6L13 11 8 18 19 16" />
    </svg>
  );
}
