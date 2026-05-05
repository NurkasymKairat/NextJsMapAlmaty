'use client';

import dynamic from 'next/dynamic';
import type { Memory, PublicUser } from '@/lib/types';

const MemoryMap = dynamic(() => import('./Map'), { ssr: false });

export default function MapClient({
  user,
  initialMemories,
}: {
  user: PublicUser | null;
  initialMemories: Memory[];
}) {
  return <MemoryMap user={user} initialMemories={initialMemories} />;
}
