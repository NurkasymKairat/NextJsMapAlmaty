create table if not exists likes (
  user_id uuid references users(id) on delete cascade not null,
  memory_id uuid references memories(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, memory_id)
);

create index if not exists likes_memory_id_idx on likes (memory_id);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  memory_id uuid references memories(id) on delete cascade not null,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz default now()
);

create index if not exists comments_memory_id_idx on comments (memory_id);
