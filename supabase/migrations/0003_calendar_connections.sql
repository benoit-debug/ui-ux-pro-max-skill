-- Stores the Google OAuth refresh token used to read the user's calendar
-- (step 2 will add calendar_data for the derived daily metrics). Only
-- server-side code (route handlers, server components) should query this
-- table; never fetch it from a 'use client' component.
create table public.calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null default 'google',
  refresh_token text not null,
  scope text not null,
  connected_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.calendar_connections enable row level security;

create policy "calendar_connections_select_own"
  on public.calendar_connections for select
  using (auth.uid() = user_id);

create policy "calendar_connections_insert_own"
  on public.calendar_connections for insert
  with check (auth.uid() = user_id);

create policy "calendar_connections_update_own"
  on public.calendar_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "calendar_connections_delete_own"
  on public.calendar_connections for delete
  using (auth.uid() = user_id);
