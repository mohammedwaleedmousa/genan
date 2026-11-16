-- Regression checks use one temporary product and roll back all writes.
begin;
do $test$
declare
  v_product uuid := gen_random_uuid();
  v_admin uuid;
  v_items jsonb := '[{"variant_key":"color:1:red:size:m","label":"Red / M","color_name":"Red","color_hex":"#ff0000","size":"M","stock_quantity":3,"is_default":false},{"variant_key":"color:1:red:size:l","label":"Red / L","color_name":"Red","color_hex":"#ff0000","size":"L","stock_quantity":4,"is_default":false}]';
  v_result integer;
  v_product_row record;
begin
  select ur.user_id into v_admin
  from public.user_roles ur
  where ur.role='admin'::public.app_role
    and not exists(select 1 from public.admin_user_permissions a
      where a.user_id=ur.user_id and a.permission='inventory.adjust' and not a.granted)
  limit 1;
  if v_admin is null then raise exception 'An admin with inventory permission is required'; end if;

  insert into public.products(id,name,name_ar,slug,price,is_active,color_variants)
  values(v_product,'Inventory regression','Inventory regression','inventory-regression-'||v_product,1,false,
    '[{"name":"Red","hex":"#ff0000","images":["/inventory-regression.webp"],"sizes":[],"stock":0}]');

  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2')::text,true);
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('role','authenticated',true);

  v_result := public.replace_product_inventory_skus(v_product,v_items);
  assert v_result=2, 'RPC did not save both color/size SKUs';
  select stock_quantity,in_stock,has_sizes,sizes,color_variants into strict v_product_row from public.products where id=v_product;
  assert v_product_row.stock_quantity=7 and v_product_row.in_stock, 'Total stock did not synchronize';
  assert v_product_row.has_sizes and v_product_row.sizes @> array['L','M'], 'Size list did not synchronize';
  assert (v_product_row.color_variants->0->>'stock')::integer=7, 'Color total did not synchronize';
  assert (v_product_row.color_variants->0->'size_stock'->>'M')::integer=3, 'Size stock JSON did not synchronize';
  assert v_product_row.color_variants->0->'images'='["/inventory-regression.webp"]'::jsonb, 'Variant images changed';

  v_result := public.replace_product_inventory_skus(v_product,v_items);
  assert v_result=2, 'Unchanged inventory save failed';

  update public.inventory_skus set stock_quantity=0 where product_id=v_product and size='M';
  assert (select stock_quantity=4 from public.products where id=v_product), 'Row UPDATE trigger failed';
  update public.inventory_skus set stock_quantity=0 where product_id=v_product and size='L';
  assert (select stock_quantity=0 and not in_stock from public.products where id=v_product), 'Out-of-stock state failed';
  delete from public.inventory_skus where product_id=v_product and size='L';
  assert (select sizes=array['M'] from public.products where id=v_product), 'Deleted size remains in product';

  begin
    perform public.replace_product_inventory_skus(v_product,'[{"variant_key":"invalid","stock_quantity":-1}]');
    raise exception 'Negative stock was accepted';
  exception when raise_exception then
    if sqlerrm='Negative stock was accepted' then raise; end if;
    if sqlerrm not like '%سالب%' then raise; end if;
  end;

  v_result := public.replace_product_inventory_skus(v_product,'[{"variant_key":"default","label":"General","stock_quantity":5,"is_default":true}]');
  assert v_result=1, 'Default stock save failed';
  assert (select stock_quantity=5 and in_stock and not has_sizes and sizes='{}'::text[] from public.products where id=v_product), 'Default stock did not synchronize';

  v_result := public.replace_product_inventory_skus(v_product,'[]');
  assert v_result=1, 'Empty inventory normalization failed';
  assert (select stock_quantity=0 and not in_stock from public.products where id=v_product), 'Empty inventory state failed';

  assert not has_function_privilege('anon','public.sync_product_inventory_from_skus(uuid)','EXECUTE'), 'Anon can call internal helper';
  assert not has_function_privilege('authenticated','public.sync_product_inventory_from_skus(uuid)','EXECUTE'), 'Authenticated can call internal helper';
  assert not has_function_privilege('authenticated','public.rebuild_product_variant_stock(uuid)','EXECUTE'), 'Authenticated can call internal rebuild';
end;
$test$;
rollback;
select 'PASS: admin inventory RPC, unchanged save, row updates, size deletion, zero stock, default stock, empty inventory, negative rejection, image preservation and helper permissions; all fixture writes rolled back' as result;
