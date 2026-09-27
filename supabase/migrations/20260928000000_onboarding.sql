-- Velyric – a bejelentkezés utáni beállítás adatai.
-- Futtatás: Supabase dashboard → SQL Editor → illeszd be és futtasd (egyszer kell).

-- 1) A beállítás állapota (felhasználónként egy sor). Csak a saját sorát látja és írja.
create table if not exists public.onboarding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint onboarding_data_size check (pg_column_size(data) < 64000)
);

alter table public.onboarding enable row level security;

drop policy if exists "onboarding: own row read" on public.onboarding;
create policy "onboarding: own row read" on public.onboarding
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "onboarding: own row insert" on public.onboarding;
create policy "onboarding: own row insert" on public.onboarding
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "onboarding: own row update" on public.onboarding;
create policy "onboarding: own row update" on public.onboarding
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2) Előfizetés állapota. A felhasználó csak OLVASNI tudja; írni kizárólag a szerver
--    (Stripe webhook / fizetés-ellenőrzés, service role kulccsal) – így nem jelölheti magát fizetőnek.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  checkout_session_id text,
  status text not null default 'none',
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions: own row read" on public.subscriptions;
create policy "subscriptions: own row read" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- 3) Tudásbázis-fájlok (árlista, GYIK, étlap…): privát tároló, mindenki csak a saját mappáját
--    (<user_id>/...) éri el. Max. 20 MB fájlonként, csak dokumentum- és képformátumok.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge',
  'knowledge',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "knowledge: own folder read" on storage.objects;
create policy "knowledge: own folder read" on storage.objects
  for select to authenticated
  using (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "knowledge: own folder upload" on storage.objects;
create policy "knowledge: own folder upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "knowledge: own folder delete" on storage.objects;
create policy "knowledge: own folder delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);
