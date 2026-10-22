-- jsonb_object_agg fails on a NULL key: one item with no category broke the whole admin dashboard
-- ("field name must not be null"). Patch the live function in place: count NULL categories as 'other'.
do $$ declare d text; begin
  d := pg_get_functiondef('public.cart_admin_dashboard()'::regprocedure);
  d := replace(d, 'select category, count(*) n from public.list_items group by 1', 'select coalesce(category,''other'') category, count(*) n from public.list_items group by 1');
  execute d;
end $$;
