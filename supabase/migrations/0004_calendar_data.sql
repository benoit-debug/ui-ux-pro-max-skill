-- Per-day metrics derived from the user's Google Calendar (see
-- lib/calendar/sync.ts). Absent for a day means either no calendar
-- connection or a sync that hasn't run yet - never a hard error.
create table public.calendar_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  meeting_minutes integer not null default 0,
  deep_work_slots integer not null default 0,
  transitions integer not null default 0,
  synced_at timestamptz not null default now(),
  unique (user_id, day)
);

create index calendar_data_user_day_idx on public.calendar_data (user_id, day desc);

alter table public.calendar_data enable row level security;

create policy "calendar_data_select_own"
  on public.calendar_data for select
  using (auth.uid() = user_id);

create policy "calendar_data_insert_own"
  on public.calendar_data for insert
  with check (auth.uid() = user_id);

create policy "calendar_data_update_own"
  on public.calendar_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "calendar_data_delete_own"
  on public.calendar_data for delete
  using (auth.uid() = user_id);
