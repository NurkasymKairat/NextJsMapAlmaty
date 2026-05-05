import { getSession } from '@/lib/auth';
import { fetchAllMemories } from '@/lib/memories';
import type { Memory, PublicUser } from '@/lib/types';
import TopBar from '@/components/TopBar';
import MapClient from '@/components/MapClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession().catch(() => null);
  const user: PublicUser | null = session
    ? { id: session.sub, username: session.username, color: session.color }
    : null;

  let memories: Memory[] = [];
  try {
    memories = await fetchAllMemories(user?.id ?? null);
  } catch {
    memories = [];
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <TopBar user={user} />
      <MapClient user={user} initialMemories={memories} />
    </main>
  );
}
