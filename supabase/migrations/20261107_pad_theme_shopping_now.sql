-- 2026-11-07, owner's picks from the ideas round:
--  * each household picks its notepad paper (owner sets it; households_update already allows the owner)
--  * "I'm at the store now": any member can say so on a list; everyone else gets told (realtime on shopping_lists)
alter table public.households add column if not exists pad_theme text;
alter table public.shopping_lists
  add column if not exists shopping_now_by uuid,
  add column if not exists shopping_now_at timestamptz;

create or replace function public.set_shopping_now(p_list_id uuid, p_on boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_hh uuid;
begin
  select household_id into v_hh from shopping_lists where id = p_list_id and status = 'open';
  if v_hh is null then raise exception 'list not open'; end if;
  if not is_household_member(v_hh) then raise exception 'not a member'; end if;
  if p_on then
    update shopping_lists set shopping_now_by = auth.uid(), shopping_now_at = now() where id = p_list_id;
  else
    update shopping_lists set shopping_now_by = null, shopping_now_at = null where id = p_list_id and shopping_now_by = auth.uid();
  end if;
end; $$;
revoke all on function public.set_shopping_now(uuid, boolean) from public, anon;
grant execute on function public.set_shopping_now(uuid, boolean) to authenticated;
