-- Validate and price optional product accessories on the server.
-- This replaces the existing checkout function without changing its RPC signature.
-- Prices and names come from products.accessories; browser-supplied prices are ignored.
CREATE OR REPLACE FUNCTION public.create_secure_order_v3(p_customer_name text, p_customer_phone text, p_customer_address text, p_customer_notes text, p_country text, p_customer_city text, p_customer_region text, p_items jsonb, p_payment_method text, p_currency_mode text, p_currency_code text, p_coupon_code text DEFAULT NULL::text, p_delivery_company_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_customer public.customers%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_accessory jsonb;
  v_catalog_accessory jsonb;
  v_selected_accessories jsonb;
  v_accessory_qty integer;
  v_accessory_total numeric;
  v_accessory_name text;
  v_accessory_price numeric;
  v_sku public.inventory_skus%rowtype;
  v_qty integer;
  v_unit numeric;
  v_subtotal_base numeric := 0;
  v_subtotal_native numeric := 0;
  v_discount_base numeric := 0;
  v_discount_native numeric := 0;
  v_delivery public.delivery_companies%rowtype;
  v_delivery_base numeric := 0;
  v_delivery_native numeric := 0;
  v_currency public.currencies%rowtype;
  v_currency_code text;
  v_rate numeric;
  v_precision integer;
  v_safe_items jsonb := '[]'::jsonb;
  v_tracking text := encode(extensions.gen_random_bytes(24),'hex');
  v_order public.orders%rowtype;
  v_coupon public.coupons%rowtype;
  v_selected_size text;
  v_selected_color text;
  v_sku_count integer;
  v_order_number text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'invalid_items';
  end if;

  if nullif(btrim(coalesce(p_customer_name,'')),'') is null then raise exception 'name_required'; end if;
  if nullif(btrim(coalesce(p_customer_phone,'')),'') is null then raise exception 'phone_required'; end if;
  if nullif(btrim(coalesce(p_customer_address,'')),'') is null then raise exception 'address_required'; end if;
  if nullif(btrim(coalesce(p_customer_city,'')),'') is null then raise exception 'city_required'; end if;

  v_currency_code := upper(btrim(coalesce(nullif(p_currency_code,''),nullif(p_currency_mode,''),'SAR')));
  select * into v_currency
  from public.currencies
  where code = v_currency_code and is_active = true and rate_to_base > 0
  limit 1;

  if v_currency.code is null then raise exception 'invalid_currency'; end if;
  v_rate := v_currency.rate_to_base;
  v_precision := case when v_currency.code='SAR' then 2 else 0 end;

  if not exists (
    select 1 from public.payment_methods pm
    where pm.is_active=true and pm.code=p_payment_method
  ) then
    raise exception 'invalid_payment_method';
  end if;

  if p_delivery_company_id is null then raise exception 'delivery_company_required'; end if;
  select * into v_delivery
  from public.delivery_companies
  where id=p_delivery_company_id and is_active=true
  limit 1;
  if v_delivery.id is null then raise exception 'invalid_delivery_company'; end if;

  v_delivery_base := greatest(0,coalesce(v_delivery.base_fee,0));
  v_delivery_native := round(v_delivery_base*v_rate,v_precision);

  if v_user_id is not null then
    select * into v_customer
    from public.customers
    where user_id=v_user_id
    limit 1;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_qty := (v_item->>'quantity')::integer;
    exception when others then
      raise exception 'invalid_quantity';
    end;
    if v_qty < 1 or v_qty > 100 then raise exception 'invalid_quantity'; end if;

    begin
      select * into v_product
      from public.products
      where id=(v_item->>'product_id')::uuid
        and is_active=true
      for update;
    exception when others then
      raise exception 'invalid_product';
    end;

    if v_product.id is null or coalesce(v_product.in_stock,true)=false then
      raise exception 'product_unavailable';
    end if;

    v_selected_size := nullif(btrim(v_item->>'selected_size'),'');
    v_selected_color := nullif(btrim(v_item->>'selected_color'),'');
    v_sku.id := null;

    select count(*) into v_sku_count
    from public.inventory_skus
    where product_id=v_product.id;

    if v_sku_count > 0 then
      if v_selected_color is not null and v_selected_size is not null then
        select * into v_sku
        from public.inventory_skus
        where product_id=v_product.id
          and lower(btrim(coalesce(color_name,'')))=lower(v_selected_color)
          and btrim(coalesce(size,''))=v_selected_size
        order by is_default desc, created_at
        limit 1
        for update;
      elsif v_selected_size is not null then
        select * into v_sku
        from public.inventory_skus
        where product_id=v_product.id
          and btrim(coalesce(size,''))=v_selected_size
        order by is_default desc, created_at
        limit 1
        for update;
      elsif v_selected_color is not null then
        select * into v_sku
        from public.inventory_skus
        where product_id=v_product.id
          and lower(btrim(coalesce(color_name,'')))=lower(v_selected_color)
        order by is_default desc, created_at
        limit 1
        for update;
      else
        select * into v_sku
        from public.inventory_skus
        where product_id=v_product.id
        order by is_default desc, created_at
        limit 1
        for update;
      end if;

      if v_sku.id is null then raise exception 'variant_selection_required'; end if;
      if v_sku.stock_quantity < v_qty then raise exception 'insufficient_stock'; end if;
    else
      if coalesce(v_product.stock_quantity,0) < v_qty then raise exception 'insufficient_stock'; end if;
    end if;

    -- Accessory names and prices are resolved from the product catalog, never trusted from the browser.
    v_selected_accessories := '[]'::jsonb;
    v_accessory_total := 0;

    IF v_item ? 'selected_accessories'
       AND jsonb_typeof(v_item->'selected_accessories') NOT IN ('array', 'null') THEN
      RAISE EXCEPTION 'invalid_accessories';
    END IF;

    FOR v_accessory IN
      SELECT value
      FROM jsonb_array_elements(coalesce(v_item->'selected_accessories', '[]'::jsonb))
    LOOP
      BEGIN
        v_accessory_qty := (v_accessory->>'quantity')::integer;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'invalid_accessory_quantity';
      END;

      IF v_accessory_qty < 1 OR v_accessory_qty > 100 THEN
        RAISE EXCEPTION 'invalid_accessory_quantity';
      END IF;

      v_accessory_name := lower(btrim(coalesce(v_accessory->>'name_ar', v_accessory->>'name', '')));
      IF v_accessory_name = '' THEN
        RAISE EXCEPTION 'invalid_accessory';
      END IF;

      v_catalog_accessory := NULL;
      SELECT candidate.value
        INTO v_catalog_accessory
        FROM jsonb_array_elements(coalesce(v_product.accessories, '[]'::jsonb)) AS candidate(value)
       WHERE lower(btrim(coalesce(candidate.value->>'name_ar', candidate.value->>'name', ''))) = v_accessory_name
       LIMIT 1;

      IF v_catalog_accessory IS NULL THEN
        RAISE EXCEPTION 'invalid_accessory';
      END IF;

      BEGIN
        v_accessory_price := (v_catalog_accessory->>'price')::numeric;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'invalid_accessory_price';
      END;

      IF v_accessory_price < 0 OR v_accessory_price > 1000000 THEN
        RAISE EXCEPTION 'invalid_accessory_price';
      END IF;

      v_accessory_total := v_accessory_total + (v_accessory_price * v_accessory_qty);
      v_selected_accessories := v_selected_accessories || jsonb_build_array(jsonb_build_object(
        'name', coalesce(v_catalog_accessory->>'name', v_catalog_accessory->>'name_ar', ''),
        'name_ar', coalesce(v_catalog_accessory->>'name_ar', v_catalog_accessory->>'name', ''),
        'price', round(v_accessory_price * v_rate, v_precision),
        'quantity', v_accessory_qty,
        'image_url', coalesce(v_catalog_accessory->>'image_url', '')
      ));
    END LOOP;

    v_unit := round(
      (coalesce(v_product.price,0) * (1 - coalesce(v_product.discount,0)::numeric/100.0))::numeric,
      2
    ) + v_accessory_total;

    v_subtotal_base := v_subtotal_base + v_unit*v_qty;
    v_subtotal_native := v_subtotal_native + round(v_unit*v_rate,v_precision)*v_qty;

    v_safe_items := v_safe_items || jsonb_build_array(jsonb_build_object(
      'product_id',v_product.id,
      'product_name',coalesce(v_product.name_ar,v_product.name),
      'product_image',coalesce(v_product.images[1],''),
      'quantity',v_qty,
      'price',round(v_unit*v_rate,v_precision),
      'selected_size',v_selected_size,
      'selected_color',v_selected_color,
      'selected_accessories',v_selected_accessories
    ));

    if v_sku.id is not null then
      update public.inventory_skus
      set stock_quantity=stock_quantity-v_qty, updated_at=now()
      where id=v_sku.id;

      update public.products
      set stock_quantity=greatest(0,(
        select coalesce(sum(stock_quantity),0)
        from public.inventory_skus
        where product_id=v_product.id
      )),
      in_stock=((
        select coalesce(sum(stock_quantity),0)
        from public.inventory_skus
        where product_id=v_product.id
      ) > 0),
      updated_at=now()
      where id=v_product.id;
    else
      update public.products
      set stock_quantity=greatest(0,stock_quantity-v_qty),
          in_stock=(stock_quantity-v_qty)>0,
          updated_at=now()
      where id=v_product.id;
    end if;
  end loop;

  if nullif(btrim(coalesce(p_coupon_code,'')),'') is not null then
    select * into v_coupon
    from public.coupons
    where upper(btrim(code))=upper(btrim(p_coupon_code))
      and coalesce(is_active,true)=true
    limit 1;

    if v_coupon.id is null then raise exception 'invalid_coupon'; end if;

    if v_coupon.type='percentage' then
      v_discount_base := least(v_subtotal_base,v_subtotal_base*greatest(0,v_coupon.value)/100.0);
      v_discount_native := least(v_subtotal_native,round(v_subtotal_native*greatest(0,v_coupon.value)/100.0,v_precision));
    elsif v_coupon.type='fixed' then
      v_discount_base := least(v_subtotal_base,greatest(0,v_coupon.value));
      v_discount_native := least(v_subtotal_native,round(greatest(0,v_coupon.value)*v_rate,v_precision));
    else
      raise exception 'invalid_coupon';
    end if;
  end if;

  v_order_number := 'GN-' || to_char(current_date,'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.orders(
    order_number,tracking_token,tracking_token_hash,owner_user_id,customer_id,
    customer_name,customer_phone,customer_address,customer_notes,country,
    customer_city,customer_region,items,subtotal,delivery_fee,total,
    payment_method,status,currency_mode,currency_code,exchange_rate_snapshot,total_base,
    coupon_code,discount_amount,delivery_company_id
  ) values (
    v_order_number,
    v_tracking,
    encode(extensions.digest(v_tracking,'sha256'),'hex'),
    v_user_id,
    v_customer.id,
    left(btrim(p_customer_name),150),
    left(btrim(p_customer_phone),40),
    left(btrim(p_customer_address),500),
    nullif(left(btrim(coalesce(p_customer_notes,'')),1000),''),
    coalesce(nullif(p_country,''),'YE'),
    left(btrim(p_customer_city),120),
    nullif(btrim(coalesce(p_customer_region,'')),''),
    v_safe_items,
    v_subtotal_native,
    v_delivery_native,
    greatest(0,v_subtotal_native+v_delivery_native-v_discount_native),
    p_payment_method,
    'pending',
    v_currency_code,
    v_currency_code,
    v_rate,
    greatest(0,v_subtotal_base+v_delivery_base-v_discount_base),
    case when v_discount_native>0 then upper(btrim(p_coupon_code)) else null end,
    v_discount_native,
    v_delivery.id
  )
  returning * into v_order;

  return jsonb_build_object(
    'order_id',v_order.id,
    'order_number',v_order.order_number,
    'tracking_token',v_tracking,
    'created_at',v_order.created_at,
    'items',v_order.items,
    'subtotal',v_order.subtotal,
    'delivery_fee',v_order.delivery_fee,
    'total',v_order.total,
    'discount_amount',v_order.discount_amount,
    'currency_mode',v_order.currency_mode,
    'currency_code',v_order.currency_code,
    'exchange_rate_snapshot',v_order.exchange_rate_snapshot,
    'total_base',v_order.total_base,
    'delivery_company',v_delivery.name,
    'referral_code',null,
    'referral_expires_at',null,
    'discount_source',case when v_discount_native>0 then 'coupon' else null end
  )::json;
end;
$function$;
