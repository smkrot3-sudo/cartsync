-- Split the bill after a shopping trip (owner's request 2026-10-25): the household owner enters the
-- final total and a suggested share per member; each member pays through the owner's personal Bit
-- link (Bit has no API, so the app can't verify) and marks "paid" with the amount.
alter table public.households add column if not exists bit_link text;
alter table public.shopping_lists
  add column if not exists total numeric(10,2),
  add column if not exists total_by uuid,
  add column if not exists total_at timestamptz,
  add column if not exists split jsonb,      -- {"<user_id>": amount, ...}
  add column if not exists pay_link text;    -- snapshot of the Bit link at request time

create table if not exists public.trip_payments(
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  household_id uuid not null,
  user_id uuid not null,
  amount numeric(10,2) not null,
  paid_at timestamptz not null default now(),
  marked_by uuid,
  primary key(list_id, user_id)
);
alter table public.trip_payments enable row level security;
drop policy if exists trip_payments_select on public.trip_payments;
create policy trip_payments_select on public.trip_payments for select using (is_household_member(household_id));
-- all writes go through the RPCs below
alter table public.trip_payments replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.trip_payments;
exception when duplicate_object then null; end $$;

create or replace function public.set_trip_total(p_list_id uuid, p_total numeric, p_split jsonb, p_pay_link text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_hh uuid;
begin
  select household_id into v_hh from shopping_lists where id = p_list_id;
  if v_hh is null then raise exception 'list not found'; end if;
  if household_role_of(v_hh) <> 'owner' then raise exception 'only the household owner can request payment'; end if;
  if p_total is null or p_total <= 0 or p_total > 100000 then raise exception 'bad total'; end if;
  if p_pay_link is not null and p_pay_link <> '' and p_pay_link !~* '^https://' then raise exception 'bad link'; end if;
  if nullif(p_pay_link, '') is not null then update households set bit_link = p_pay_link where id = v_hh; end if;
  update shopping_lists set total = round(p_total, 2), total_by = auth.uid(), total_at = now(),
    split = coalesce(p_split, '{}'::jsonb), pay_link = coalesce(nullif(p_pay_link, ''), (select bit_link from households where id = v_hh))
  where id = p_list_id;
end; $$;

-- p_amount null = un-mark. A member marks themself; the owner may mark anyone (e.g. paid in cash).
create or replace function public.mark_trip_paid(p_list_id uuid, p_amount numeric, p_user uuid default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_hh uuid; v_user uuid := coalesce(p_user, auth.uid());
begin
  select household_id into v_hh from shopping_lists where id = p_list_id;
  if v_hh is null then raise exception 'list not found'; end if;
  if not is_household_member(v_hh) then raise exception 'not a member'; end if;
  if v_user <> auth.uid() and household_role_of(v_hh) <> 'owner' then raise exception 'only the owner can mark others'; end if;
  if p_amount is null then
    delete from trip_payments where list_id = p_list_id and user_id = v_user;
  else
    if p_amount < 0 or p_amount > 100000 then raise exception 'bad amount'; end if;
    insert into trip_payments(list_id, household_id, user_id, amount, marked_by)
      values (p_list_id, v_hh, v_user, round(p_amount, 2), auth.uid())
    on conflict (list_id, user_id) do update set amount = excluded.amount, paid_at = now(), marked_by = excluded.marked_by;
  end if;
end; $$;

revoke all on function public.set_trip_total(uuid, numeric, jsonb, text) from public, anon;
revoke all on function public.mark_trip_paid(uuid, numeric, uuid) from public, anon;
grant execute on function public.set_trip_total(uuid, numeric, jsonb, text) to authenticated;
grant execute on function public.mark_trip_paid(uuid, numeric, uuid) to authenticated;
