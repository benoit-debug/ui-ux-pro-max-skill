-- RLS regression test. Run with: `npx supabase test db`
--
-- Verifies (1) RLS is enabled and policied on every table, (2) the leaderboard
-- function is SECURITY DEFINER, and (3) the core privacy guarantee: a group
-- co-member can read another member's *composite* via the aggregate function
-- but never their raw scores, check-ins, or profile details directly.

begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- --- (1) RLS enabled on every table -----------------------------------------
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS on profiles');
select ok((select relrowsecurity from pg_class where oid = 'public.daily_checkins'::regclass), 'RLS on daily_checkins');
select ok((select relrowsecurity from pg_class where oid = 'public.calendar_connections'::regclass), 'RLS on calendar_connections');
select ok((select relrowsecurity from pg_class where oid = 'public.calendar_data'::regclass), 'RLS on calendar_data');
select ok((select relrowsecurity from pg_class where oid = 'public.daily_scores'::regclass), 'RLS on daily_scores');
select ok((select relrowsecurity from pg_class where oid = 'public.groups'::regclass), 'RLS on groups');
select ok((select relrowsecurity from pg_class where oid = 'public.group_members'::regclass), 'RLS on group_members');
select ok((select relrowsecurity from pg_class where oid = 'public.group_invites'::regclass), 'RLS on group_invites');

-- --- (2) Every table has at least one policy; leaderboard is definer ---------
select is(
  (select count(distinct tablename)::int from pg_policies
   where schemaname = 'public'
     and tablename in ('profiles','daily_checkins','calendar_connections',
       'calendar_data','daily_scores','groups','group_members','group_invites')),
  8,
  'all 8 tables have at least one policy'
);
select ok(
  (select prosecdef from pg_proc where proname = 'group_leaderboard' limit 1),
  'group_leaderboard is SECURITY DEFINER'
);

-- --- Fixtures: two users, A owns a group that B also belongs to -------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111',
   'authenticated','authenticated','a@test.dev','x', now(), now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222',
   'authenticated','authenticated','b@test.dev','x', now(), now(), now(), '{}', '{}');

insert into public.daily_checkins (user_id, day, goals)
values ('11111111-1111-1111-1111-111111111111', current_date, '[{"id":"g","text":"secret goal","difficulty":"high","achieved":true}]'::jsonb);

insert into public.daily_scores
  (user_id, day, composite_score, focus_explanation, output_explanation, consistency_explanation)
values ('11111111-1111-1111-1111-111111111111', current_date, 80, 'x', 'x', 'x');

insert into public.groups (id, name, owner_id)
values ('33333333-3333-3333-3333-333333333333', 'Test group', '11111111-1111-1111-1111-111111111111');
insert into public.group_members (group_id, user_id)
values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');

-- --- (3a) User B (a group co-member of A) is walled off from A's raw data ----
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is((select count(*) from public.daily_checkins)::int, 0,
  'B cannot read A''s check-ins (goal content stays private)');
select is((select count(*) from public.daily_scores)::int, 0,
  'B cannot read A''s scores directly');
select is((select count(*) from public.profiles)::int, 1,
  'B sees only their own profile row');
select ok(
  (select exists (
    select 1 from public.group_leaderboard('33333333-3333-3333-3333-333333333333'::uuid, current_date)
    where user_id = '11111111-1111-1111-1111-111111111111'::uuid
  )),
  'B sees A''s composite via the leaderboard aggregate only'
);

reset role;

-- --- (3b) Owner A sees their own data ---------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*) from public.daily_checkins)::int, 1,
  'A can read their own check-ins');

reset role;

select * from finish();
rollback;
