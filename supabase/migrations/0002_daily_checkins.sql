-- One row per user per calendar day. Morning check-in creates the row with
-- goals; evening check-out fills in achieved/energy/focus on the same row.
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  -- goals: [{ id: string, text: string, difficulty: 'low' | 'medium' | 'high', achieved: boolean | null }]
  goals jsonb not null default '[]'::jsonb,
  energy smallint check (energy between 1 and 5),
  focus smallint check (focus between 1 and 5),
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index daily_checkins_user_day_idx on public.daily_checkins (user_id, day desc);

alter table public.daily_checkins enable row level security;

create policy "daily_checkins_select_own"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

create policy "daily_checkins_insert_own"
  on public.daily_checkins for insert
  with check (auth.uid() = user_id);

create policy "daily_checkins_update_own"
  on public.daily_checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_checkins_delete_own"
  on public.daily_checkins for delete
  using (auth.uid() = user_id);

create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute function public.set_updated_at();
