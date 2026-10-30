-- Monthly summary: from the evening of the month's last day, each member sees a summary of the household's month.
-- Steady users (see cart_month_steady) also get a few words from the AI assistant, written once and cached here.

-- one row per user per day they were in the app (Israel time), recorded by cart_ping
create table if not exists public.cart_active_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.cart_active_days enable row level security; -- no policies: written by cart_ping, read by the functions below

create or replace function public.cart_ping(p_platform text, p_version text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.cart_seen(user_id, platform, version)
  values (auth.uid(), left(p_platform, 40), left(p_version, 40))
  on conflict (user_id) do update
    set last_seen = now(),
        -- one "open" per 30 minutes, so token refreshes / quick app switches don't inflate it
        opens = public.cart_seen.opens + case when public.cart_seen.last_seen < now() - interval '30 minutes' then 1 else 0 end,
        platform = excluded.platform, version = excluded.version;
  insert into public.cart_active_days(user_id, day)
  values (auth.uid(), (now() at time zone 'Asia/Jerusalem')::date)
  on conflict do nothing;
end $$;
revoke all on function public.cart_ping(text, text) from public, anon;
grant execute on function public.cart_ping(text, text) to authenticated;

-- the cached summary per user, household and month (month = its first day)
create table if not exists public.cart_month_summaries (
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  month date not null,
  ai_text text,
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  primary key (user_id, household_id, month)
);
alter table public.cart_month_summaries enable row level security;
drop policy if exists "own summaries" on public.cart_month_summaries;
create policy "own summaries" on public.cart_month_summaries for select to authenticated using (user_id = auth.uid());

-- the days a user was active in a month: opened the app, or did anything on a list
create or replace function public.cart_user_days(p_user uuid, p_from date, p_to date)
returns setof date language sql stable security definer set search_path = '' as $$
  select day from public.cart_active_days where user_id = p_user and day >= p_from and day < p_to
  union
  select (created_at at time zone 'Asia/Jerusalem')::date from public.list_activity
   where actor = p_user and created_at >= (p_from::timestamp at time zone 'Asia/Jerusalem') and created_at < (p_to::timestamp at time zone 'Asia/Jerusalem')
$$;
revoke all on function public.cart_user_days(uuid, date, date) from public, anon, authenticated;

-- "steady": active on at least 8 different days of the month, spread over at least 3 different weeks
create or replace function public.cart_month_steady(p_user uuid, p_month date)
returns boolean language sql stable security definer set search_path = '' as $$
  select count(*) >= 8 and count(distinct date_trunc('week', d)) >= 3
  from public.cart_user_days(p_user, p_month, (p_month + interval '1 month')::date) d
$$;
revoke all on function public.cart_month_steady(uuid, date) from public, anon, authenticated;

-- the month's numbers for one household, from the caller's point of view
create or replace function public.cart_month_stats(p_household uuid, p_month date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  m date := date_trunc('month', p_month)::date;
  n date := (date_trunc('month', p_month) + interval '1 month')::date;
  t0 timestamptz := m::timestamp at time zone 'Asia/Jerusalem';
  t1 timestamptz := n::timestamp at time zone 'Asia/Jerusalem';
  p0 timestamptz := (m - interval '1 month')::timestamp at time zone 'Asia/Jerusalem';
  r jsonb;
begin
  if not exists(select 1 from public.household_members where household_id = p_household and user_id = auth.uid()) then
    raise exception 'not a member' using errcode = '42501';
  end if;
  with act as (
    select * from public.list_activity where household_id = p_household and created_at >= t0 and created_at < t1
  ), trips as (
    select * from public.shopping_lists where household_id = p_household and status = 'closed' and closed_at >= t0 and closed_at < t1
  )
  select jsonb_build_object(
    'month', m,
    'household', (select name from public.households where id = p_household),
    'trips', (select count(*) from trips),
    'spent', (select coalesce(sum(total), 0) from trips),
    'spent_prev', (select coalesce(sum(total), 0) from public.shopping_lists where household_id = p_household and status = 'closed' and closed_at >= p0 and closed_at < t0),
    'lists_new', (select count(*) from public.shopping_lists where household_id = p_household and created_at >= t0 and created_at < t1),
    'added', (select count(*) from act where action in ('added', 'requested')),
    'bought', greatest(0, (select count(*) from act where action = 'checked') - (select count(*) from act where action = 'unchecked')),
    'requests', (select count(*) from act where action = 'requested'),
    'biggest', (select jsonb_build_object('name', name, 'total', total) from trips where total is not null order by total desc limit 1),
    'top_items', coalesce((select jsonb_agg(jsonb_build_object('text', x, 'n', c)) from (
        select lower(trim(item_text)) x, count(*) c from act where action in ('added', 'requested') and coalesce(trim(item_text), '') <> ''
        group by 1 having count(*) > 1 order by c desc, x limit 5) q), '[]'::jsonb),
    'top_cats', coalesce((select jsonb_agg(jsonb_build_object('cat', category, 'n', c)) from (
        select coalesce(category, 'other') category, count(*) c from public.list_items
        where household_id = p_household and created_at >= t0 and created_at < t1 group by 1 order by c desc limit 4) q), '[]'::jsonb),
    'busiest_dow', (select extract(dow from created_at at time zone 'Asia/Jerusalem')::int from act group by 1 order by count(*) desc limit 1),
    'members', coalesce((select jsonb_agg(x order by (x->>'added')::int + (x->>'bought')::int desc) from (
        select jsonb_build_object(
          'user_id', hm.user_id,
          'name', coalesce(hm.display_name, u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
          'added', (select count(*) from act where actor = hm.user_id and action in ('added', 'requested')),
          'bought', greatest(0, (select count(*) from act where actor = hm.user_id and action = 'checked') - (select count(*) from act where actor = hm.user_id and action = 'unchecked')),
          'trips', (select count(*) from trips where closed_by = hm.user_id),
          'paid', (select coalesce(sum(tp.amount), 0) from public.trip_payments tp join trips on trips.id = tp.list_id where tp.user_id = hm.user_id and tp.paid_at is not null),
          'collected', (select coalesce(sum(total), 0) from trips where total_by = hm.user_id)
        ) x
        from public.household_members hm join auth.users u on u.id = hm.user_id
        where hm.household_id = p_household) q), '[]'::jsonb),
    'me', jsonb_build_object(
      'days', (select count(*) from public.cart_user_days(auth.uid(), m, n)),
      'steady', public.cart_month_steady(auth.uid(), m)
    ),
    'ai_text', (select ai_text from public.cart_month_summaries where user_id = auth.uid() and household_id = p_household and month = m)
  ) into r;
  return r;
end $$;
revoke all on function public.cart_month_stats(uuid, date) from public, anon;
grant execute on function public.cart_month_stats(uuid, date) to authenticated;

-- the app marks the summary as seen (so it pops up once, and the owner can see who opened it)
create or replace function public.cart_month_seen(p_household uuid, p_month date)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.household_members where household_id = p_household and user_id = auth.uid()) then return; end if;
  insert into public.cart_month_summaries(user_id, household_id, month, seen_at)
  values (auth.uid(), p_household, date_trunc('month', p_month)::date, now())
  on conflict (user_id, household_id, month) do update set seen_at = coalesce(public.cart_month_summaries.seen_at, now());
end $$;
revoke all on function public.cart_month_seen(uuid, date) from public, anon;
grant execute on function public.cart_month_seen(uuid, date) to authenticated;
