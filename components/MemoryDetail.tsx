'use client';

import { useEffect, useRef, useState } from 'react';
import type { Comment, Memory, PublicUser } from '@/lib/types';
import { MAX_ASSOCIATION_LEN } from '@/lib/validation';

type Props = {
  memories: Memory[];
  user: PublicUser | null;
  onClose: () => void;
  onMemoryUpdate: (m: Memory) => void;
  onMemoryDelete: (id: string) => void;
};

export default function MemoryDetail({
  memories,
  user,
  onClose,
  onMemoryUpdate,
  onMemoryDelete,
}: Props) {
  const visible = memories.length > 0;
  useEffect(() => {
    if (!visible) onClose();
  }, [visible, onClose]);
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col animate-[slideUp_220ms_cubic-bezier(0.2,0.9,0.3,1.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-stone-100">
          <span className="text-xs uppercase tracking-wider text-stone-500">
            {memories.length === 1 ? 'Место' : `Место — ${memories.length} воспоминаний`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 w-11 h-11 -mr-2 flex items-center justify-center"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {memories.map((m, idx) => (
            <MemoryCard
              key={m.id}
              memory={m}
              user={user}
              onUpdate={onMemoryUpdate}
              onDelete={onMemoryDelete}
              defaultOpen={memories.length === 1}
              isLast={idx === memories.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryCard({
  memory,
  user,
  onUpdate,
  onDelete,
  defaultOpen,
  isLast,
}: {
  memory: Memory;
  user: PublicUser | null;
  onUpdate: (m: Memory) => void;
  onDelete: (id: string) => void;
  defaultOpen: boolean;
  isLast: boolean;
}) {
  const [showComments, setShowComments] = useState(defaultOpen);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(memory.association);
  const [editBusy, setEditBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOwner = !!user && user.id === memory.user_id;

  useEffect(() => {
    if (!showComments || comments !== null) return;
    setLoadingComments(true);
    fetch(`/api/memories/${memory.id}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [showComments, comments, memory.id]);

  async function toggleLike() {
    if (!user || likeBusy) return;
    setLikeBusy(true);
    const wasLiked = memory.liked_by_me;
    onUpdate({
      ...memory,
      liked_by_me: !wasLiked,
      like_count: memory.like_count + (wasLiked ? -1 : 1),
    });
    try {
      const res = await fetch(`/api/memories/${memory.id}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      onUpdate({
        ...memory,
        liked_by_me: data.liked,
        like_count: data.like_count,
      });
    } catch {
      onUpdate(memory);
    } finally {
      setLikeBusy(false);
    }
  }

  async function postComment() {
    const trimmed = commentText.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/memories/${memory.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Не удалось отправить');
        return;
      }
      setComments((prev) => [...(prev ?? []), data.comment]);
      onUpdate({ ...memory, comment_count: memory.comment_count + 1 });
      setCommentText('');
    } finally {
      setPosting(false);
    }
  }

  async function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || editBusy) return;
    setEditBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/memories/${memory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ association: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Не удалось сохранить');
        return;
      }
      onUpdate({ ...memory, association: trimmed });
      setEditing(false);
    } finally {
      setEditBusy(false);
    }
  }

  async function doDelete() {
    setEditBusy(true);
    try {
      const res = await fetch(`/api/memories/${memory.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Не удалось удалить');
        return;
      }
      onDelete(memory.id);
    } finally {
      setEditBusy(false);
    }
  }

  return (
    <article className={isLast ? 'pb-2' : 'pb-4 mb-4 border-b border-stone-100'}>
      <header className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: memory.color }}
        />
        <span className="text-sm font-medium text-stone-900">{memory.username}</span>
        {isOwner && (
          <span className="text-[10px] uppercase tracking-wider text-stone-400 ml-1">
            • вы
          </span>
        )}
        <span className="text-xs text-stone-400 ml-auto">{formatDate(memory.created_at)}</span>
      </header>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value.slice(0, MAX_ASSOCIATION_LEN))}
            rows={3}
            className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-[15px] resize-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 tabular-nums">
              {editText.length} / {MAX_ASSOCIATION_LEN}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditText(memory.association);
                setError(null);
              }}
              disabled={editBusy}
              className="h-9 px-3 rounded-lg text-sm text-stone-600 hover:bg-stone-100 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={editBusy || !editText.trim() || editText.trim() === memory.association}
              className="h-9 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editBusy ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[15px] leading-snug text-stone-800 whitespace-pre-wrap break-words">
          {memory.association}
        </p>
      )}

      <div className="flex items-center gap-1 mt-3 flex-wrap">
        <button
          type="button"
          onClick={toggleLike}
          disabled={!user || likeBusy}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium transition ${
            memory.liked_by_me
              ? 'bg-rose-50 text-rose-600'
              : 'text-stone-600 hover:bg-stone-100 disabled:opacity-50'
          }`}
          aria-label="Нравится"
        >
          <HeartIcon filled={memory.liked_by_me} />
          <span className="tabular-nums">{memory.like_count}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100"
        >
          <CommentIcon />
          <span className="tabular-nums">{memory.comment_count}</span>
        </button>

        {isOwner && !editing && (
          <>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setEditText(memory.association);
                setError(null);
              }}
              className="h-9 px-3 rounded-full text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              aria-label="Редактировать"
            >
              Изменить
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="h-9 px-3 rounded-full text-sm text-stone-500 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Удалить"
            >
              Удалить
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {confirmingDelete && (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-100">
          <p className="text-sm text-stone-800 mb-2">Удалить эту запись? Это нельзя отменить.</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={editBusy}
              className="h-9 px-3 rounded-lg text-sm text-stone-600 hover:bg-white disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={doDelete}
              disabled={editBusy}
              className="h-9 px-3 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
            >
              {editBusy ? '…' : 'Удалить'}
            </button>
          </div>
        </div>
      )}

      {showComments && !editing && (
        <div className="mt-3 space-y-2">
          {loadingComments && <p className="text-xs text-stone-400">Загрузка…</p>}
          {!loadingComments && comments?.length === 0 && (
            <p className="text-xs text-stone-400">Пока нет комментариев.</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-2 py-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <div className="text-sm flex-1 min-w-0">
                <span className="font-medium text-stone-900 mr-1.5">{c.username}</span>
                <span className="text-stone-700 break-words">{c.text}</span>
              </div>
            </div>
          ))}

          {user ? (
            <div className="mt-3 flex items-end gap-2">
              <textarea
                ref={commentRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                rows={1}
                placeholder="Добавить комментарий…"
                className="flex-1 px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    postComment();
                  }
                }}
              />
              <button
                type="button"
                onClick={postComment}
                disabled={!commentText.trim() || posting}
                className="h-10 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? '…' : '➤'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-500 mt-2">
              <a href="/login" className="underline hover:text-stone-900">
                Войдите
              </a>
              , чтобы комментировать.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return `${min} мин назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ч назад`;
    const day = Math.floor(h / 24);
    if (day < 7) return `${day} дн назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}
