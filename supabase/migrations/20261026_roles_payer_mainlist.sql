-- Restructure (owner's decisions 2026-10-25):
-- 1. "viewer" and "requester" are one role now: anyone who isn't owner/editor requests items for approval.
--    The enum value stays (dropping enum values is painful); a trigger maps any new 'viewer' to 'requester'.
-- 2. Whoever paid at the till (owner or editor) enters the total and collects through their OWN Bit link,
--    saved per person per household (household_members.bit_link). households.bit_link stays as a fallback.
-- 3. A household can mark one open list as its main list: Home's quick-add goes there.

update public.household_members set role = 'requester' where role = 'viewer';
update public.household_invites set role = 'requester' where role = 'viewer';

create or replace function public.no_viewer_role()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.role = 'viewer' then new.role := 'requester'; end if;
  return new;
end; $$;
drop trigger if exists household_members_no_viewer on public.household_members;
create trigger household_members_no_viewer before insert or update of role on public.household_members
  for each row execute function public.no_viewer_role();
drop trigger if exists household_invites_no_viewer on public.household_invites;
create trigger household_invites_no_viewer before insert or update of role on public.household_invites
  for each row execute function public.no_viewer_role();

alter table public.household_members add column if not exists bit_link text;
alter table public.households add column if not exists main_list_id uuid references public.shopping_lists(id) on delete set null;

-- owner or editor may request payment; once a total exists only its author or the owner may change it
create or replace function public.set_trip_total(p_list_id uuid, p_total numeric, p_split jsonb, p_pay_link text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_hh uuid; v_by uuid; v_role household_role; v_link text;
begin
  select household_id, total_by into v_hh, v_by from shopping_lists where id = p_list_id;
  if v_hh is null then raise exception 'list not found'; end if;
  v_role := household_role_of(v_hh);
  if v_role is null or v_role not in ('owner','editor') then raise exception 'forbidden'; end if;
  if v_by is not null and v_by <> auth.uid() and v_role <> 'owner' then raise exception 'forbidden'; end if;
  if p_total is null or p_total <= 0 or p_total > 100000 then raise exception 'bad total'; end if;
  if p_pay_link is not null and p_pay_link <> '' and p_pay_link !~* '^https://' then raise exception 'bad link'; end if;
  if nullif(p_pay_link, '') is not null then
    update household_members set bit_link = p_pay_link where household_id = v_hh and user_id = auth.uid();
  end if;
  select coalesce(nullif(p_pay_link, ''), m.bit_link, case when v_role = 'owner' then h.bit_link end) into v_link
    from household_members m join households h on h.id = m.household_id
    where m.household_id = v_hh and m.user_id = auth.uid();
  update shopping_lists set total = round(p_total, 2), total_by = auth.uid(), total_at = now(),
    split = coalesce(p_split, '{}'::jsonb), pay_link = v_link
  where id = p_list_id;
end; $$;

-- a member marks themself; whoever collected (or the owner) may mark anyone, e.g. paid in cash
create or replace function public.mark_trip_paid(p_list_id uuid, p_amount numeric, p_user uuid default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_hh uuid; v_by uuid; v_user uuid := coalesce(p_user, auth.uid());
begin
  select household_id, total_by into v_hh, v_by from shopping_lists where id = p_list_id;
  if v_hh is null then raise exception 'list not found'; end if;
  if not is_household_member(v_hh) then raise exception 'not a member'; end if;
  if v_user <> auth.uid() and household_role_of(v_hh) <> 'owner' and v_by is distinct from auth.uid() then
    raise exception 'only the collector or the owner can mark others';
  end if;
  if p_amount is null then
    delete from trip_payments where list_id = p_list_id and user_id = v_user;
  else
    if p_amount < 0 or p_amount > 100000 then raise exception 'bad amount'; end if;
    insert into trip_payments(list_id, household_id, user_id, amount, marked_by)
      values (p_list_id, v_hh, v_user, round(p_amount, 2), auth.uid())
    on conflict (list_id, user_id) do update set amount = excluded.amount, paid_at = now(), marked_by = excluded.marked_by;
  end if;
end; $$;

-- main list: owner or editor; null clears it
create or replace function public.set_main_list(p_household uuid, p_list_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_role household_role;
begin
  v_role := household_role_of(p_household);
  if v_role is null or v_role not in ('owner','editor') then raise exception 'forbidden'; end if;
  if p_list_id is not null and not exists (select 1 from shopping_lists where id = p_list_id and household_id = p_household) then
    raise exception 'invalid_list';
  end if;
  update households set main_list_id = p_list_id where id = p_household;
end; $$;

revoke all on function public.set_main_list(uuid, uuid) from public, anon;
grant execute on function public.set_main_list(uuid, uuid) to authenticated;
revoke all on function public.set_trip_total(uuid, numeric, jsonb, text) from public, anon;
revoke all on function public.mark_trip_paid(uuid, numeric, uuid) from public, anon;
grant execute on function public.set_trip_total(uuid, numeric, jsonb, text) to authenticated;
grant execute on function public.mark_trip_paid(uuid, numeric, uuid) to authenticated;
