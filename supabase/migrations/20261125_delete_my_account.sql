-- 2026-11-25, Google Play requirement: a person can delete their own account and data,
-- from inside the app (Settings) and from the web page docs/delete-account.html.
--
-- What happens to each household the person belongs to:
--  * nobody else in it  -> the household is deleted with all its lists, items and history
--  * other members left -> the household stays for them; if the person was its only owner,
--    the longest-standing remaining member becomes the owner. Items and lists the person
--    created stay on the list (credited to that member), since the others still use them.
-- Then the login itself is deleted; profile, settings and every per-user row go with it (ON DELETE CASCADE).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid();
  v_hh record;
  v_heir uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  for v_hh in select household_id, role from household_members where user_id = v_uid loop
    select user_id into v_heir from household_members
      where household_id = v_hh.household_id and user_id <> v_uid
      order by (role = 'owner') desc, (role = 'editor') desc, joined_at
      limit 1;

    if v_heir is null then
      delete from households where id = v_hh.household_id; -- cascades lists, items, activity, invites, members
    else
      if not exists (select 1 from household_members
                     where household_id = v_hh.household_id and user_id <> v_uid and role = 'owner') then
        update household_members set role = 'owner' where household_id = v_hh.household_id and user_id = v_heir;
      end if;
      update households set created_by = v_heir where id = v_hh.household_id and created_by = v_uid;
      update household_invites set created_by = v_heir where household_id = v_hh.household_id and created_by = v_uid;
      update shopping_lists set created_by = v_heir where household_id = v_hh.household_id and created_by = v_uid;
      update shopping_lists set closed_by = null where household_id = v_hh.household_id and closed_by = v_uid;
      update shopping_lists set total_by = null where household_id = v_hh.household_id and total_by = v_uid;
      update shopping_lists set shopping_now_by = null, shopping_now_at = null where household_id = v_hh.household_id and shopping_now_by = v_uid;
      update list_items set created_by = v_heir where household_id = v_hh.household_id and created_by = v_uid;
      update list_items set checked_by = null where household_id = v_hh.household_id and checked_by = v_uid;
      delete from trip_payments where household_id = v_hh.household_id and user_id = v_uid;
      update trip_payments set marked_by = null where household_id = v_hh.household_id and marked_by = v_uid;
    end if;
  end loop;

  -- anything left pointing at the person from households they had already left
  delete from households h where h.created_by = v_uid -- no members at all: nothing to keep
    and not exists (select 1 from household_members m where m.household_id = h.id and m.user_id <> v_uid);
  update households h set created_by = (select m.user_id from household_members m where m.household_id = h.id
                                        and m.user_id <> v_uid order by (m.role = 'owner') desc, m.joined_at limit 1)
    where h.created_by = v_uid;
  delete from household_invites where created_by = v_uid;
  update shopping_lists set closed_by = null where closed_by = v_uid;
  update list_items set checked_by = null where checked_by = v_uid;
  update shopping_lists s set created_by = null where s.created_by = v_uid;
  update list_items i set created_by = (select h.created_by from households h where h.id = i.household_id)
    where i.created_by = v_uid;

  delete from auth.users where id = v_uid;
end; $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
