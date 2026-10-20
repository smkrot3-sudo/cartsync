-- Admin dashboard for CartSync: a "last seen in the app" ping, and admin-only read/manage RPCs.
-- Admin = a row in public.app_admins (shared with tsaad-katan), checked via public.is_admin().

create table if not exists public.cart_seen (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  opens integer not null default 1,
  platform text,
  version text
);
alter table public.cart_seen enable row level security; -- no policies: only reachable through the functions below

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
end $$;
revoke all on function public.cart_ping(text, text) from public, anon;
grant execute on function public.cart_ping(text, text) to authenticated;

create or replace function public.cart_admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'not admin' using errcode = '42501'; end if;

  with cu as ( -- CartSync users: in a household, seen in the app, or signed up without a tsaad-katan profile
    select u.* from auth.users u
    where exists(select 1 from public.household_members m where m.user_id = u.id)
       or exists(select 1 from public.cart_seen s where s.user_id = u.id)
       or not exists(select 1 from public.profiles p where p.user_id = u.id)
  ), act as (
    select a.*, coalesce(m.display_name, u.raw_user_meta_data->>'full_name', u.email) actor_name
    from public.list_activity a
    left join auth.users u on u.id = a.actor
    left join public.household_members m on m.user_id = a.actor and m.household_id = a.household_id
  )
  select jsonb_build_object(
    'generated_at', now(),
    'totals', jsonb_build_object(
      'users', (select count(*) from cu),
      'households', (select count(*) from public.households),
      'lists_open', (select count(*) from public.shopping_lists where status = 'open'),
      'lists_closed', (select count(*) from public.shopping_lists where status <> 'open'),
      'items', (select count(*) from public.list_items),
      'items_pending', (select count(*) from public.list_items where status = 'pending'),
      'active_today', (select count(distinct actor) from public.list_activity where created_at >= date_trunc('day', now() at time zone 'Asia/Jerusalem') at time zone 'Asia/Jerusalem'),
      'active_7d', (select count(distinct actor) from public.list_activity where created_at >= now() - interval '7 days'),
      'new_users_7d', (select count(*) from cu where created_at >= now() - interval '7 days')
    ),
    'users', coalesce((select jsonb_agg(x order by x->>'last_any' desc nulls last) from (
      select jsonb_build_object(
        'id', u.id, 'email', u.email,
        'name', coalesce(u.raw_user_meta_data->>'full_name', ''),
        'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
        'confirmed', u.email_confirmed_at is not null,
        'last_seen', s.last_seen, 'opens', s.opens, 'platform', s.platform, 'version', s.version,
        'last_activity', (select max(created_at) from public.list_activity a where a.actor = u.id),
        'last_any', greatest(s.last_seen, u.last_sign_in_at, (select max(created_at) from public.list_activity a where a.actor = u.id)),
        'items_added', (select count(*) from public.list_activity a where a.actor = u.id and a.action in ('added','requested')),
        'items_checked', (select count(*) from public.list_activity a where a.actor = u.id and a.action = 'checked'),
        'is_admin', exists(select 1 from public.app_admins ad where ad.user_id = u.id),
        'households', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name, 'role', m.role))
                        from public.household_members m join public.households h on h.id = m.household_id
                        where m.user_id = u.id), '[]'::jsonb)
      ) x
      from cu u left join public.cart_seen s on s.user_id = u.id
    ) q), '[]'::jsonb),
    'households', coalesce((select jsonb_agg(x order by x->>'last_activity' desc nulls last) from (
      select jsonb_build_object(
        'id', h.id, 'name', h.name, 'created_at', h.created_at,
        'members', coalesce((select jsonb_agg(jsonb_build_object('user_id', m.user_id, 'name', coalesce(m.display_name, u.raw_user_meta_data->>'full_name', u.email), 'role', m.role, 'joined_at', m.joined_at) order by m.joined_at)
                     from public.household_members m join auth.users u on u.id = m.user_id where m.household_id = h.id), '[]'::jsonb),
        'lists', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status, 'created_at', l.created_at, 'closed_at', l.closed_at,
                     'active', (select count(*) from public.list_items i where i.list_id = l.id and i.status = 'active'),
                     'checked', (select count(*) from public.list_items i where i.list_id = l.id and i.status = 'checked'),
                     'pending', (select count(*) from public.list_items i where i.list_id = l.id and i.status = 'pending')) order by l.created_at desc)
                   from public.shopping_lists l where l.household_id = h.id), '[]'::jsonb),
        'last_activity', (select max(created_at) from public.list_activity a where a.household_id = h.id),
        'invites', coalesce((select jsonb_agg(jsonb_build_object('code', v.code, 'role', v.role, 'uses', v.uses, 'max_uses', v.max_uses, 'expires_at', v.expires_at))
                     from public.household_invites v where v.household_id = h.id and (v.expires_at is null or v.expires_at > now())), '[]'::jsonb)
      ) x from public.households h
    ) q), '[]'::jsonb),
    'activity', coalesce((select jsonb_agg(jsonb_build_object('at', a.created_at, 'who', a.actor_name, 'action', a.action, 'item', a.item_text,
                     'household', (select name from public.households h where h.id = a.household_id),
                     'list', (select name from public.shopping_lists l where l.id = a.list_id)) order by a.created_at desc)
                 from (select * from act order by created_at desc limit 150) a), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', d::date,
                     'actions', (select count(*) from public.list_activity a where (a.created_at at time zone 'Asia/Jerusalem')::date = d::date),
                     'people', (select count(distinct actor) from public.list_activity a where (a.created_at at time zone 'Asia/Jerusalem')::date = d::date),
                     'signups', (select count(*) from cu where (cu.created_at at time zone 'Asia/Jerusalem')::date = d::date)) order by d)
                 from generate_series((now() at time zone 'Asia/Jerusalem')::date - 13, (now() at time zone 'Asia/Jerusalem')::date, interval '1 day') d), '[]'::jsonb),
    'uncategorized', coalesce((select jsonb_agg(jsonb_build_object('text', t, 'n', n) order by n desc, t)
                 from (select lower(trim(text)) t, count(*) n from public.list_items where category = 'other' group by 1 limit 100) q), '[]'::jsonb),
    'categories', coalesce((select jsonb_object_agg(category, n) from (select category, count(*) n from public.list_items group by 1) q), '{}'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function public.cart_admin_dashboard() from public, anon;
grant execute on function public.cart_admin_dashboard() to authenticated;

-- change a member's role (never to/from owner: ownership moves only through transfer_household_ownership)
create or replace function public.cart_admin_set_role(p_household uuid, p_user uuid, p_role public.household_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not admin' using errcode = '42501'; end if;
  if p_role = 'owner' then raise exception 'use ownership transfer instead'; end if;
  update public.household_members set role = p_role
   where household_id = p_household and user_id = p_user and role <> 'owner';
  if not found then raise exception 'member not found or is the owner'; end if;
end $$;
revoke all on function public.cart_admin_set_role(uuid, uuid, public.household_role) from public, anon;
grant execute on function public.cart_admin_set_role(uuid, uuid, public.household_role) to authenticated;
