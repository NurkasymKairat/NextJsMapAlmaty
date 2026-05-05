create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  color text not null,
  created_at timestamptz default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  lat double precision not null,
  lng double precision not null,
  association text not null check (char_length(association) <= 200),
  order_index int not null,
  created_at timestamptz default now()
);

create index if not exists memories_user_id_idx on memories (user_id);
create index if not exists memories_lat_lng_idx on memories (lat, lng);
