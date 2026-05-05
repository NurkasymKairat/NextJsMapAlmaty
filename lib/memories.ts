import { supabaseAdmin } from './supabase';
import type { Memory } from './types';

type MemoryRow = {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  association: string;
  order_index: number;
  created_at: string;
};

type UserRow = { id: string; username: string; color: string };
type LikeRow = { memory_id: string; user_id: string };
type CommentCountRow = { memory_id: string };

export async function fetchAllMemories(currentUserId: string | null): Promise<Memory[]> {
  const memoriesRes = await supabaseAdmin
    .from('memories')
    .select('id, user_id, lat, lng, association, order_index, created_at')
    .order('created_at', { ascending: true });

  if (memoriesRes.error) {
    console.error('[fetchAllMemories] memories query error:', memoriesRes.error);
    return [];
  }
  if (!memoriesRes.data) return [];
  const rows = memoriesRes.data as MemoryRow[];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const [usersRes, likesRes, commentsRes] = await Promise.all([
    supabaseAdmin.from('users').select('id, username, color').in('id', userIds),
    supabaseAdmin.from('likes').select('memory_id, user_id'),
    supabaseAdmin.from('comments').select('memory_id'),
  ]);

  if (usersRes.error) console.error('[fetchAllMemories] users query error:', usersRes.error);
  if (likesRes.error) console.error('[fetchAllMemories] likes query error:', likesRes.error);
  if (commentsRes.error)
    console.error('[fetchAllMemories] comments query error:', commentsRes.error);

  const userById = new Map<string, UserRow>();
  if (usersRes.data) {
    for (const u of usersRes.data as UserRow[]) userById.set(u.id, u);
  }

  const likeCountByMemory = new Map<string, number>();
  const likedByMe = new Set<string>();
  if (likesRes.data) {
    for (const l of likesRes.data as LikeRow[]) {
      likeCountByMemory.set(l.memory_id, (likeCountByMemory.get(l.memory_id) ?? 0) + 1);
      if (currentUserId && l.user_id === currentUserId) likedByMe.add(l.memory_id);
    }
  }

  const commentCountByMemory = new Map<string, number>();
  if (commentsRes.data) {
    for (const c of commentsRes.data as CommentCountRow[]) {
      commentCountByMemory.set(c.memory_id, (commentCountByMemory.get(c.memory_id) ?? 0) + 1);
    }
  }

  return rows.map((m) => {
    const u = userById.get(m.user_id);
    return {
      id: m.id,
      user_id: m.user_id,
      lat: m.lat,
      lng: m.lng,
      association: m.association,
      order_index: m.order_index,
      created_at: m.created_at,
      username: u?.username ?? 'unknown',
      color: u?.color ?? '#888',
      like_count: likeCountByMemory.get(m.id) ?? 0,
      comment_count: commentCountByMemory.get(m.id) ?? 0,
      liked_by_me: likedByMe.has(m.id),
    };
  });
}
