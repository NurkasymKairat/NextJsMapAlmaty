# Алматы помнит

Карта коллективной памяти города. Цифровой компаньон выставки МСПЗ (Нархоз). Посетители заходят по QR, добавляют значимое место на карту и видят, как из точек разных людей складывается общая карта города.

## Стек

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- react-leaflet + OpenStreetMap
- Supabase (Postgres) — только база, без Supabase Auth
- Кастомная авторизация: bcryptjs + jose JWT в httpOnly cookie

## Локальный запуск

1. `npm install`
2. Создайте проект Supabase (https://supabase.com).
3. В SQL Editor выполните `supabase/migrations/001_init.sql`.
4. Скопируйте `.env.local.example` в `.env.local` и заполните:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — из настроек проекта → API
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — там же
   - `JWT_SECRET` — длинная случайная строка (`openssl rand -hex 32`)
5. `npm run dev` → http://localhost:3000

## Деплой на Vercel

1. Запушьте проект в GitHub.
2. На vercel.com → Import Project, выберите репозиторий.
3. В разделе Environment Variables добавьте все 5 переменных из `.env.local`.
4. Deploy. Vercel сам подцепит Next.js.
5. В Project → Domains добавьте кастомный домен (`almaty.kyronix.kz`) и настройте DNS у регистратора домена.

## Архитектура

```
app/
  api/auth/{register,login,logout,me}/route.ts   # авторизация
  api/memories/route.ts                           # GET все, POST новое
  login/, register/                               # формы
  page.tsx                                        # главная карта
components/
  Map.tsx               # клиентский компонент карты
  MapClient.tsx         # обёртка с dynamic import (Leaflet не SSR)
  AddMemoryModal.tsx
  AuthForm.tsx
  ThreadsPanel.tsx
  TopBar.tsx
lib/
  auth.ts               # bcrypt + JWT + cookies
  supabase.ts           # серверный клиент (service_role)
  supabase-public.ts    # публичный клиент (anon)
  cluster.ts            # haversine + группировка точек
  colors.ts             # палитра из 20 цветов
  validation.ts         # правила имени/пароля
  types.ts
supabase/migrations/001_init.sql
```

## Структура БД

- `users(id, username, password_hash, color, created_at)` — `username` уникален; `color` назначается из палитры по очереди при регистрации.
- `memories(id, user_id, lat, lng, association, order_index, created_at)` — `order_index` — порядок точек одного автора (для рисования нити).

## Поведение

- Незалогиненные видят все точки и кластеры, но не могут добавлять. Снизу — кнопка «Войти».
- Клик по карте (для авторизованных) → модалка → текст до 200 символов → POST.
- Точки в радиусе 50м сливаются в один маркер с числом, цвет — преобладающий или нейтральный.
- Каждый пользователь имеет свой цвет; точки одного автора соединяются ломаной (нитью) в порядке добавления.
- Панель «Нити памяти» справа — переключатели по каждому автору.

## Админ-операции

Удалить запись или пользователя — через Supabase SQL Editor:

```sql
delete from memories where id = '...';
delete from users where username = '...';
```
