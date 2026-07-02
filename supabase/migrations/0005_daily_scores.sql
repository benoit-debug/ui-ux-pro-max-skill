-- One row per user per day, computed by lib/scoring (see
-- lib/scoring/persist.ts). `components` stores the raw inputs behind each
-- sub-score so the UI can always explain "why" a score came out as it did.
create table public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  focus_score integer check (focus_score between 0 and 100),
  output_score integer check (output_score between 0 and 100),
  consistency_score integer check (consistency_score between 0 and 100),
  composite_score integer check (composite_score between 0 and 100),
  focus_explanation text not null,
  output_explanation text not null,
  consistency_explanation text not null,
  components jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (user_id, day)
);

create index daily_scores_user_day_idx on public.daily_scores (user_id, day desc);

alter table public.daily_scores enable row level security;

create policy "daily_scores_select_own"
  on public.daily_scores for select
  using (auth.uid() = user_id);

create policy "daily_scores_insert_own"
  on public.daily_scores for insert
  with check (auth.uid() = user_id);

create policy "daily_scores_update_own"
  on public.daily_scores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_scores_delete_own"
  on public.daily_scores for delete
  using (auth.uid() = user_id);
