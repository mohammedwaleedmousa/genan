-- Manual invoice lines are admin-only and never reserve physical inventory.

CREATE OR REPLACE FUNCTION public.validate_order_item_sku_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_size text;
  v_color text;
  v_has_sized_skus boolean;
  v_sku_stock integer;
begin
  if jsonb_typeof(new.items) <> 'array' then
    raise exception 'invalid_items';
  end if;

  for v_item in select value from jsonb_array_elements(new.items) loop
    if coalesce(v_item->>'product_id','') like 'manual-%' then
      if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
        raise exception 'manual_invoice_items_require_admin' using errcode='42501';
      end if;
      continue;
    end if;
    v_product_id := nullif(v_item->>'product_id','')::uuid;
    v_qty := greatest(1, coalesce((v_item->>'quantity')::integer,1));
    v_size := nullif(btrim(coalesce(v_item->>'selected_size','')), '');
    v_color := nullif(btrim(coalesce(v_item->>'selected_color','')), '');

    if v_product_id is null then raise exception 'invalid_product'; end if;

    select exists(
      select 1 from public.inventory_skus s
      where s.product_id=v_product_id and nullif(btrim(coalesce(s.size,'')),'') is not null
    ) into v_has_sized_skus;

    if v_has_sized_skus then
      if v_size is null then raise exception 'size_required'; end if;

      select s.stock_quantity into v_sku_stock
      from public.inventory_skus s
      where s.product_id=v_product_id
        and btrim(coalesce(s.size,''))=v_size
        and (v_color is null or s.color_name is null or btrim(coalesce(s.color_name,''))=v_color)
      order by case when v_color is not null and btrim(coalesce(s.color_name,''))=v_color then 0 else 1 end, s.is_default desc
      limit 1;

      if v_sku_stock is null then raise exception 'invalid_size'; end if;
      if v_qty > v_sku_stock then raise exception 'insufficient_size_stock'; end if;
    end if;
  end loop;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.release_reserved_stock_on_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  it jsonb;
  pid uuid;
  qty integer;
  v_color text;
  v_size text;
  v_sku public.inventory_skus%rowtype;
  v_sku_count integer;
begin
  if old.status in ('cancelled','canceled') and new.status not in ('cancelled','canceled') then
    raise exception 'cancelled_order_is_final';
  end if;

  if new.status not in ('cancelled','canceled') or old.status in ('cancelled','canceled') then return new; end if;
  if old.stock_reserved_at is null then return new; end if;
  if new.items is null then return new; end if;

  for it in select value from jsonb_array_elements(new.items)
  loop
    -- Manual IDs are accepted only by the admin-gated validation trigger.
    if coalesce(it->>'product_id','') like 'manual-%' then continue; end if;
    begin
      pid := (it->>'product_id')::uuid;
      qty := greatest(1, coalesce((it->>'quantity')::integer,1));
      v_color := nullif(btrim(it->>'selected_color'),'');
      v_size := nullif(btrim(it->>'selected_size'),'');
    exception when others then
      continue;
    end;

    if pid is null then continue; end if;
    v_sku.id := null;
    select count(*) into v_sku_count from public.inventory_skus where product_id = pid;

    if v_sku_count > 0 then
      if v_color is not null and v_size is not null then
        select * into v_sku from public.inventory_skus where product_id = pid and is_default = false and lower(btrim(coalesce(color_name,''))) = lower(v_color) and btrim(coalesce(size,'')) = v_size order by created_at limit 1 for update;
      elsif v_size is not null then
        if (select count(*) from public.inventory_skus where product_id = pid and is_default = false and btrim(coalesce(size,'')) = v_size) = 1 then
          select * into v_sku from public.inventory_skus where product_id = pid and is_default = false and btrim(coalesce(size,'')) = v_size limit 1 for update;
        end if;
      elsif v_color is not null then
        select * into v_sku from public.inventory_skus where product_id = pid and is_default = false and lower(btrim(coalesce(color_name,''))) = lower(v_color) and size is null order by created_at limit 1 for update;
      else
        select * into v_sku from public.inventory_skus where product_id = pid and is_default = true order by created_at limit 1 for update;
        if v_sku.id is null and v_sku_count = 1 then select * into v_sku from public.inventory_skus where product_id = pid limit 1 for update; end if;
      end if;

      if v_sku.id is not null then
        update public.inventory_skus set stock_quantity = stock_quantity + qty where id = v_sku.id;
        perform public.sync_product_inventory_from_skus(pid);
        continue;
      end if;
    end if;

    update public.products set stock_quantity = greatest(0,coalesce(stock_quantity,0)) + qty, in_stock = true where id = pid;
  end loop;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reserve_legacy_order_stock_on_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  it jsonb;
  pid uuid;
  qty integer;
  v_color text;
  v_size text;
  v_sku public.inventory_skus%rowtype;
  v_sku_count integer;
  v_product_stock integer;
begin
  if new.stock_reserved_at is not null then return new; end if;
  if new.status is null or new.status not in ('confirmed','shipped','delivered','completed') then return new; end if;
  if old.status in ('confirmed','shipped','delivered','completed') then return new; end if;
  if new.items is null then return new; end if;

  for it in select value from jsonb_array_elements(new.items)
  loop
    -- Manual IDs are accepted only by the admin-gated validation trigger.
    if coalesce(it->>'product_id','') like 'manual-%' then continue; end if;
    begin
      pid := (it->>'product_id')::uuid;
      qty := greatest(1, coalesce((it->>'quantity')::integer,1));
      v_color := nullif(btrim(it->>'selected_color'),'');
      v_size := nullif(btrim(it->>'selected_size'),'');
    exception when others then
      raise exception 'invalid_order_item';
    end;

    v_sku.id := null;
    select count(*) into v_sku_count from public.inventory_skus where product_id = pid;

    if v_sku_count > 0 then
      if v_color is not null and v_size is not null then
        select * into v_sku from public.inventory_skus
        where product_id = pid and is_default = false
          and lower(btrim(coalesce(color_name,''))) = lower(v_color)
          and btrim(coalesce(size,'')) = v_size
        order by created_at limit 1 for update;
      elsif v_size is not null then
        if (select count(*) from public.inventory_skus where product_id = pid and is_default = false and btrim(coalesce(size,'')) = v_size) = 1 then
          select * into v_sku from public.inventory_skus where product_id = pid and is_default = false and btrim(coalesce(size,'')) = v_size limit 1 for update;
        end if;
      elsif v_color is not null then
        select * into v_sku from public.inventory_skus
        where product_id = pid and is_default = false
          and lower(btrim(coalesce(color_name,''))) = lower(v_color)
          and size is null
        order by created_at limit 1 for update;
      else
        select * into v_sku from public.inventory_skus where product_id = pid and is_default = true order by created_at limit 1 for update;
        if v_sku.id is null and v_sku_count = 1 then
          select * into v_sku from public.inventory_skus where product_id = pid limit 1 for update;
        end if;
      end if;

      if v_sku.id is null then raise exception 'variant_selection_required'; end if;
      if v_sku.stock_quantity < qty then raise exception 'insufficient_stock'; end if;
      update public.inventory_skus set stock_quantity = stock_quantity - qty where id = v_sku.id;
      perform public.sync_product_inventory_from_skus(pid);
    else
      select stock_quantity into v_product_stock from public.products where id = pid for update;
      if not found or coalesce(v_product_stock,0) < qty then raise exception 'insufficient_stock'; end if;
      update public.products set stock_quantity = stock_quantity - qty, in_stock = ((stock_quantity - qty) > 0) where id = pid;
    end if;
  end loop;

  update public.orders set stock_reserved_at = now() where id = new.id;
  new.stock_reserved_at := now();
  return new;
end;
$function$
;
