-- Restore internal inventory helpers omitted from the legacy schema bootstrap.
-- SKU rows remain the source of truth; do not rewrite existing product quantities here.

CREATE OR REPLACE FUNCTION public.rebuild_product_variant_stock(p_product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO ''
AS $function$
declare
  v_variants jsonb;
  v_result jsonb := '[]'::jsonb;
  v_variant jsonb;
  v_color text;
  v_color_stock integer;
  v_size_stock jsonb;
  v_sizes_json jsonb;
  v_non_default_count integer;
  v_all_sizes text[];
begin
  select color_variants into v_variants
  from public.products
  where id = p_product_id;

  if not found then return; end if;

  select count(*) into v_non_default_count
  from public.inventory_skus
  where product_id = p_product_id and is_default = false;

  select coalesce(array_agg(distinct size order by size) filter (where size is not null), '{}'::text[])
  into v_all_sizes
  from public.inventory_skus
  where product_id = p_product_id and is_default = false;

  update public.products
  set has_sizes = cardinality(v_all_sizes) > 0,
      sizes = v_all_sizes
  where id = p_product_id;

  if jsonb_array_length(coalesce(v_variants, '[]'::jsonb)) = 0 then
    return;
  end if;

  for v_variant in select value from jsonb_array_elements(coalesce(v_variants, '[]'::jsonb))
  loop
    v_color := nullif(btrim(v_variant->>'name'), '');

    if v_color is null then
      v_result := v_result || jsonb_build_array(v_variant);
      continue;
    end if;

    select coalesce(sum(stock_quantity),0)::integer
    into v_color_stock
    from public.inventory_skus
    where product_id = p_product_id
      and is_default = false
      and lower(btrim(coalesce(color_name,''))) = lower(v_color);

    select coalesce(jsonb_object_agg(size, qty), '{}'::jsonb),
           coalesce(jsonb_agg(jsonb_build_object('size', size, 'stock', qty) order by size), '[]'::jsonb)
    into v_size_stock, v_sizes_json
    from (
      select size, sum(stock_quantity)::integer as qty
      from public.inventory_skus
      where product_id = p_product_id
        and is_default = false
        and lower(btrim(coalesce(color_name,''))) = lower(v_color)
        and size is not null
      group by size
    ) s;

    v_variant := jsonb_set(v_variant, '{stock}', to_jsonb(v_color_stock), true);
    v_variant := jsonb_set(v_variant, '{size_stock}', v_size_stock, true);
    -- Always overwrite sizes so deleted sizes disappear from storefront legacy JSON too.
    v_variant := jsonb_set(v_variant, '{sizes}', v_sizes_json, true);

    v_result := v_result || jsonb_build_array(v_variant);
  end loop;

  update public.products
  set color_variants = v_result
  where id = p_product_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_product_inventory_from_skus(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
declare
  v_total integer;
begin
  select coalesce(sum(stock_quantity), 0)::integer into v_total
  from public.inventory_skus where product_id = p_product_id;
  update public.products
  set stock_quantity = greatest(0, v_total), in_stock = (v_total > 0)
  where id = p_product_id;
  perform public.rebuild_product_variant_stock(p_product_id);
end;
$function$;

-- Only existing privileged inventory RPCs/triggers and the service role call these helpers.
REVOKE EXECUTE ON FUNCTION public.rebuild_product_variant_stock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_product_inventory_from_skus(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rebuild_product_variant_stock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_product_inventory_from_skus(uuid) TO service_role;

CREATE TRIGGER inventory_skus_sync_product
AFTER INSERT OR DELETE OR UPDATE ON public.inventory_skus
FOR EACH ROW EXECUTE FUNCTION public.inventory_skus_sync_product_trigger();

CREATE TRIGGER update_inventory_skus_updated_at
BEFORE UPDATE ON public.inventory_skus
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
