-- Any household member (owner, editor, requester or viewer) may move an item: reorder it and/or put it
-- in another category. Only position/category/emoji can change through this; text, status etc. stay
-- behind the normal role-based RLS. Owner's call 2026-10-25.
create or replace function public.move_list_item(p_item_id uuid, p_position double precision, p_category text, p_emoji text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_hh uuid; v_list uuid;
begin
  select household_id, list_id into v_hh, v_list from list_items where id = p_item_id;
  if v_hh is null then raise exception 'item not found'; end if;
  if not is_household_member(v_hh) then raise exception 'not a member'; end if;
  if not exists (select 1 from shopping_lists where id = v_list and status = 'open') then raise exception 'list closed'; end if;
  update list_items set
    position = coalesce(p_position, position),
    category = coalesce(nullif(p_category, ''), category),
    emoji    = coalesce(nullif(p_emoji, ''), emoji)
  where id = p_item_id;
end; $$;
revoke all on function public.move_list_item(uuid, double precision, text, text) from public, anon;
grant execute on function public.move_list_item(uuid, double precision, text, text) to authenticated;

-- a requester's update (now possible via move_list_item) must not knock an approved item back to pending:
-- only force pending on insert, or when a requester actually tries to change the status
create or replace function public.list_items_force_pending()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if household_role_of(new.household_id) = 'requester'
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.status := 'pending';
    new.checked_by := null;
    new.checked_at := null;
  end if;
  new.updated_at := now();
  return new;
end; $$;
