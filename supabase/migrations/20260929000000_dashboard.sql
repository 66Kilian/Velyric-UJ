-- Velyric – a kezelőfelület (kezelo.velyric.com) adatai.
-- Futtatás: Supabase dashboard → SQL Editor → illeszd be és futtasd (az onboarding migráció UTÁN).
--
-- Adatvédelmi alapelv: minden sor egy felhasználóhoz tartozik, és csak ő látja (RLS).
-- Hívásokat, ügyeket és foglalásokat KIZÁRÓLAG a szerver ír (hangplatform-webhook, service role),
-- a felhasználó csak olvas, illetve az állapotot módosíthatja (pl. „megoldva”).

-- 1) Munkaterület: megjelenés, bemutató-túra, adatfeldolgozási hozzájárulás, adatmegőrzés
create table if not exists public.workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  studio_done boolean not null default false,
  tour_done boolean not null default false,
  dpa_version text,
  dpa_accepted_at timestamptz,
  retention_days integer not null default 90 check (retention_days in (30, 90, 180, 365)),
  idle_minutes integer not null default 30 check (idle_minutes in (0, 15, 30, 60)),
  notify jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint workspaces_prefs_size check (pg_column_size(prefs) < 16000)
);
alter table public.workspaces enable row level security;

drop policy if exists "workspaces: own read" on public.workspaces;
create policy "workspaces: own read" on public.workspaces
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "workspaces: own insert" on public.workspaces;
create policy "workspaces: own insert" on public.workspaces
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "workspaces: own update" on public.workspaces;
create policy "workspaces: own update" on public.workspaces
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2) Hívások
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  external_id text,
  status text not null default 'active' check (status in ('active', 'completed', 'missed', 'transferred')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  caller_number text,
  caller_name text,
  language text,
  summary text,
  category text,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  outcome text check (outcome in ('resolved', 'booked', 'transferred', 'callback', 'unresolved')),
  transcript jsonb,
  unique (user_id, external_id)
);
create index if not exists calls_user_started on public.calls (user_id, started_at desc);
alter table public.calls enable row level security;
drop policy if exists "calls: own read" on public.calls;
create policy "calls: own read" on public.calls
  for select to authenticated using ((select auth.uid()) = user_id);

-- 3) Ügyek / teendők – az MI szedi ki a hívásokból
create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  call_id uuid references public.calls (id) on delete set null,
  title text not null,
  detail text,
  category text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists issues_user_status on public.issues (user_id, status, created_at desc);
alter table public.issues enable row level security;
drop policy if exists "issues: own read" on public.issues;
create policy "issues: own read" on public.issues
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "issues: own update" on public.issues;
create policy "issues: own update" on public.issues
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A felhasználó csak az állapotot módosíthatja, a tartalmat (amit az MI rögzített) nem
create or replace function public.issues_guard_update() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then
    new.title := old.title; new.detail := old.detail; new.category := old.category;
    new.call_id := old.call_id; new.user_id := old.user_id; new.created_at := old.created_at;
    new.contact_name := old.contact_name; new.contact_phone := old.contact_phone;
    new.resolved_at := case when new.status = 'resolved' then coalesce(old.resolved_at, now()) else null end;
  end if;
  return new;
end $$;
drop trigger if exists issues_guard on public.issues;
create trigger issues_guard before update on public.issues for each row execute function public.issues_guard_update();

-- 4) Foglalások / időpontok (időpontos és asztalfoglalós vállalkozásoknál)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  call_id uuid references public.calls (id) on delete set null,
  starts_at timestamptz not null,
  service text,
  party_size integer,
  name text,
  phone text,
  notes text,
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists bookings_user_start on public.bookings (user_id, starts_at);
alter table public.bookings enable row level security;
drop policy if exists "bookings: own read" on public.bookings;
create policy "bookings: own read" on public.bookings
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "bookings: own update" on public.bookings;
create policy "bookings: own update" on public.bookings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.bookings_guard_update() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then
    -- csak az állapot és a megjegyzés módosítható
    new.user_id := old.user_id; new.call_id := old.call_id; new.starts_at := old.starts_at;
    new.service := old.service; new.party_size := old.party_size; new.name := old.name;
    new.phone := old.phone; new.created_at := old.created_at;
  end if;
  return new;
end $$;
drop trigger if exists bookings_guard on public.bookings;
create trigger bookings_guard before update on public.bookings for each row execute function public.bookings_guard_update();

-- 5) Súgó-üzenetek (a felhasználó ír nekünk). Csak beküldeni és a sajátját látni tudja.
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  topic text,
  message text not null check (char_length(message) between 5 and 4000),
  created_at timestamptz not null default now()
);
alter table public.support_requests enable row level security;
drop policy if exists "support: own read" on public.support_requests;
create policy "support: own read" on public.support_requests
  for select to authenticated using ((select auth.uid()) = user_id);

-- 6) Biztonsági napló (belépés, kétlépcsős azonosítás, adatexport…) – csak olvasható a felhasználónak
create table if not exists public.security_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);
create index if not exists security_events_user on public.security_events (user_id, created_at desc);
alter table public.security_events enable row level security;
drop policy if exists "security: own read" on public.security_events;
create policy "security: own read" on public.security_events
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "security: own insert" on public.security_events;
create policy "security: own insert" on public.security_events
  for insert to authenticated with check (
    (select auth.uid()) = user_id and type in ('login', 'logout', 'mfa_enabled', 'mfa_disabled', 'password_changed', 'settings_changed')
  );

-- 7) Élő hívások valós időben (Supabase Realtime) – az RLS itt is érvényes
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'calls') then
    alter publication supabase_realtime add table public.calls;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'issues') then
    alter publication supabase_realtime add table public.issues;
  end if;
end $$;

-- 8) Adatmegőrzés: a beállított napnál régebbi hívások átiratát és telefonszámát töröljük
--    (a statisztika megmarad). Ütemezés: Database → Cron → naponta: select public.purge_expired_call_data();
create or replace function public.purge_expired_call_data() returns void
language sql security definer set search_path = public as $$
  update public.calls c
     set transcript = null, caller_number = null, caller_name = null, summary = null
    from public.workspaces w
   where w.user_id = c.user_id
     and c.started_at < now() - make_interval(days => w.retention_days)
     and (c.transcript is not null or c.caller_number is not null);
  update public.issues i
     set contact_phone = null, contact_name = null, detail = null
    from public.workspaces w
   where w.user_id = i.user_id and i.status = 'resolved'
     and i.created_at < now() - make_interval(days => w.retention_days);
$$;
revoke all on function public.purge_expired_call_data() from public, anon, authenticated;
