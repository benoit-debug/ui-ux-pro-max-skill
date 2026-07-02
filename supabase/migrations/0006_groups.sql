-- Groups, memberships, invites, and the weekly leaderboard.
--
-- Privacy model (strict, per the product spec): members of a group may see
-- each other's composite scores and week-over-week progression, and never
-- goal details or task content. This is enforced structurally:
--   * daily_scores stays owner-only (unchanged) - no group can read it.
--   * daily_checkins (which holds goal text) is never touched by group code.
--   * the leaderboard is served by group_leaderboard(), a SECURITY DEFINER
--     function that emits ONLY composite aggregates per member.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Opt-out flag: a user can stay in the group with full personal analytics
  -- but be excluded from (and hidden on) the leaderboard.
  participates_in_ranking boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index group_invites_group_idx on public.group_invites (group_id);

-- ---------------------------------------------------------------------------
-- Helper: membership check as SECURITY DEFINER to avoid RLS recursion on
-- group_members (a policy on the table can't query the table under its own
-- RLS). Runs as owner, which bypasses RLS on the inner read.
-- ---------------------------------------------------------------------------
create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- Auto-add the owner as a participating member when a group is created.
create function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, participates_in_ranking)
  values (new.id, new.owner_id, true);
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- Join via an invite token. SECURITY DEFINER so the joining user (not yet a
-- member) can resolve a token they can't SELECT under the members-only policy.
create function public.join_group_with_token(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select group_id into v_group_id from public.group_invites where token = p_token;
  if v_group_id is null then
    raise exception 'Invalid invite token';
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group_id, auth.uid())
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- Weekly leaderboard for a group the caller belongs to. Emits only composite
-- aggregates + display identity - never sub-scores, explanations, or goals.
-- Week boundary is Monday (date_trunc('week', ...)); passing the caller's
-- local "today" keeps the reset aligned to their timezone.
create function public.group_leaderboard(p_group_id uuid, p_today date)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  current_avg numeric,
  previous_avg numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select
      date_trunc('week', p_today::timestamp)::date as this_start,
      (date_trunc('week', p_today::timestamp) - interval '7 days')::date as prev_start
  )
  select
    m.user_id,
    p.full_name,
    p.avatar_url,
    avg(ds.composite_score) filter (
      where ds.day >= b.this_start and ds.day <= p_today
    ) as current_avg,
    avg(ds.composite_score) filter (
      where ds.day >= b.prev_start and ds.day < b.this_start
    ) as previous_avg
  from public.group_members m
  cross join bounds b
  join public.profiles p on p.id = m.user_id
  left join public.daily_scores ds
    on ds.user_id = m.user_id
    and ds.day >= b.prev_start
    and ds.day <= p_today
  where m.group_id = p_group_id
    and m.participates_in_ranking = true
    -- Authorization: only a member of this group gets any rows.
    and public.is_group_member(p_group_id)
  group by m.user_id, p.full_name, p.avatar_url;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;

-- groups: visible to the owner and to members; only the owner mutates it.
create policy "groups_select_member"
  on public.groups for select
  using (owner_id = auth.uid() or public.is_group_member(id));

create policy "groups_insert_own"
  on public.groups for insert
  with check (owner_id = auth.uid());

create policy "groups_update_own"
  on public.groups for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "groups_delete_own"
  on public.groups for delete
  using (owner_id = auth.uid());

-- group_members: members see the full roster of their groups; a user manages
-- only their own row (toggle ranking, leave).
create policy "group_members_select_member"
  on public.group_members for select
  using (public.is_group_member(group_id));

create policy "group_members_insert_self"
  on public.group_members for insert
  with check (user_id = auth.uid());

create policy "group_members_update_self"
  on public.group_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "group_members_delete_self"
  on public.group_members for delete
  using (user_id = auth.uid());

-- group_invites: any member can create and view invite links for their group.
create policy "group_invites_select_member"
  on public.group_invites for select
  using (public.is_group_member(group_id));

create policy "group_invites_insert_member"
  on public.group_invites for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());
