-- Deleting a household (or a list) cascades to its list_items; the item DELETE trigger then tried to
-- log a 'deleted' row into list_activity for a list/household that is already gone, which failed the
-- foreign key and aborted the whole delete. Skip logging when the parent list no longer exists.
CREATE OR REPLACE FUNCTION public.log_list_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    insert into list_activity(list_id, household_id, actor, action, item_text)
    values (new.list_id, new.household_id, new.created_by, case when new.status='pending' then 'requested' else 'added' end, new.text);
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status='pending' and new.status='active' then
      insert into list_activity(list_id, household_id, actor, action, item_text)
      values (new.list_id, new.household_id, auth.uid(), 'approved', new.text);
    elsif old.status<>'checked' and new.status='checked' then
      insert into list_activity(list_id, household_id, actor, action, item_text)
      values (new.list_id, new.household_id, coalesce(new.checked_by, auth.uid()), 'checked', new.text);
    elsif old.status='checked' and new.status<>'checked' then
      insert into list_activity(list_id, household_id, actor, action, item_text)
      values (new.list_id, new.household_id, auth.uid(), 'unchecked', new.text);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if not exists (select 1 from shopping_lists where id = old.list_id) then
      return old; -- cascade from deleting the list/household: nothing left to log against
    end if;
    insert into list_activity(list_id, household_id, actor, action, item_text)
    values (old.list_id, old.household_id, auth.uid(), case when old.status='pending' then 'rejected' else 'deleted' end, old.text);
    return old;
  end if;
  return null;
end; $function$;
