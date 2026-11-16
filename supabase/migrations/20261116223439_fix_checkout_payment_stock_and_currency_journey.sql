SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';

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
  v_reservations jsonb := '{}'::jsonb;
  v_reservation jsonb;
  v_res_key text;
  v_prev_reserved integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'invalid_items';
  end if;

  if nullif(btrim(coalesce(p_customer_name,'')),'') is null then raise exception 'name_required'; end if;
  if nullif(btrim(coalesce(p_customer_phone,'')),'') is null then raise exception 'phone_required'; end if;
  if nullif(btrim(coalesce(p_customer_address,'')),'') is null then raise exception 'address_required'; end if;
  if nullif(btrim(coalesce(p_customer_city,'')),'') is null then raise exception 'city_required'; end if;

  v_currency_code := case upper(btrim(coalesce(nullif(p_currency_code,''),nullif(p_currency_mode,''),'SAR')))
    when 'YER_SOUTH' then 'YER_S'
    when 'YER_NORTH' then 'YER_N'
    else upper(btrim(coalesce(nullif(p_currency_code,''),nullif(p_currency_mode,''),'SAR')))
  end;
  select * into v_currency
  from public.currencies
  where code = v_currency_code and is_active = true and rate_to_base > 0
  limit 1;

  if v_currency.code is null then raise exception 'invalid_currency'; end if;
  v_rate := v_currency.rate_to_base;
  v_precision := case when v_currency.code='SAR' then 2 else 0 end;

  if not exists (
    select 1 from public.payment_methods pm
    where pm.is_active=true and (pm.code=p_payment_method or (p_payment_method='cod' and pm.type='cash' and pm.code in ('cash','cod')))
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
    if v_qty is null or v_qty < 1 or v_qty > 100 then raise exception 'invalid_quantity'; end if;

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
        select * into v_sku from public.inventory_skus where product_id=v_product.id and is_default=false and lower(btrim(coalesce(color_name,'')))=lower(v_selected_color) and btrim(coalesce(size,''))=v_selected_size order by created_at limit 1 for update;
      elsif v_selected_size is not null then
        if (select count(*) from public.inventory_skus where product_id=v_product.id and is_default=false and btrim(coalesce(size,''))=v_selected_size)=1 then
          select * into v_sku from public.inventory_skus where product_id=v_product.id and is_default=false and btrim(coalesce(size,''))=v_selected_size limit 1 for update;
        end if;
      elsif v_selected_color is not null then
        select * into v_sku from public.inventory_skus where product_id=v_product.id and is_default=false and lower(btrim(coalesce(color_name,'')))=lower(v_selected_color) and size is null order by created_at limit 1 for update;
      else
        select * into v_sku from public.inventory_skus where product_id=v_product.id and is_default=true order by created_at limit 1 for update;
        if v_sku.id is null and v_sku_count=1 then select * into v_sku from public.inventory_skus where product_id=v_product.id limit 1 for update; end if;
      end if;

      -- Legacy storefront variants may carry a display color/size while inventory is tracked
      -- by one default SKU only. In that case reserve the default SKU instead of rejecting
      -- a valid in-stock product. Detailed SKU products still require an exact match.
      if v_sku.id is null and v_sku_count = 1 then
        select * into v_sku
        from public.inventory_skus
        where product_id = v_product.id and is_default = true
        limit 1
        for update;
      end if;

      if v_sku.id is null then raise exception 'variant_selection_required'; end if;
      v_res_key := 's:' || v_sku.id::text;
      v_prev_reserved := coalesce((v_reservations->v_res_key->>'qty')::integer,0);
      if v_sku.stock_quantity < v_prev_reserved + v_qty then raise exception 'insufficient_stock'; end if;
      v_reservations := jsonb_set(v_reservations,array[v_res_key],jsonb_build_object('kind','sku','id',v_sku.id,'product_id',v_product.id,'qty',v_prev_reserved+v_qty),true);
    else
      v_res_key := 'p:' || v_product.id::text;
      v_prev_reserved := coalesce((v_reservations->v_res_key->>'qty')::integer,0);
      if coalesce(v_product.stock_quantity,0) < v_prev_reserved + v_qty then raise exception 'insufficient_stock'; end if;
      v_reservations := jsonb_set(v_reservations,array[v_res_key],jsonb_build_object('kind','product','id',v_product.id,'product_id',v_product.id,'qty',v_prev_reserved+v_qty),true);
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

      IF v_accessory_qty IS NULL OR v_accessory_qty < 1 OR v_accessory_qty > 100 THEN
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

      IF v_accessory_price IS NULL OR v_accessory_price < 0 OR v_accessory_price > 1000000 THEN
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
      ((coalesce(v_product.price,0) + public.get_product_size_price_adjustment(v_product.id,v_selected_size)) * (1 - coalesce(v_product.discount,0)::numeric/100.0))::numeric,
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
    coupon_code,discount_amount,delivery_company_id,stock_reserved_at
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
    case v_currency_code when 'YER_S' then 'YER_SOUTH' when 'YER_N' then 'YER_NORTH' else v_currency_code end,
    v_currency_code,
    v_rate,
    greatest(0,v_subtotal_base+v_delivery_base-v_discount_base),
    case when v_discount_native>0 then upper(btrim(p_coupon_code)) else null end,
    v_discount_native,
    v_delivery.id,
    now()
  )
  returning * into v_order;

  for v_res_key,v_reservation in select key,value from jsonb_each(v_reservations) loop
    if v_reservation->>'kind'='sku' then
      update public.inventory_skus set stock_quantity=stock_quantity-(v_reservation->>'qty')::integer where id=(v_reservation->>'id')::uuid;
      perform public.sync_product_inventory_from_skus((v_reservation->>'product_id')::uuid);
    else
      update public.products set stock_quantity=stock_quantity-(v_reservation->>'qty')::integer,in_stock=((stock_quantity-(v_reservation->>'qty')::integer)>0) where id=(v_reservation->>'id')::uuid;
    end if;
  end loop;


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
$function$
;

CREATE OR REPLACE FUNCTION public.notify_customer_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_title text;
  v_message text;
  v_type text;
begin
  if tg_op = 'INSERT' then
    v_title := 'تم استلام طلبك';
    v_message := concat('تم استلام الطلب ', new.order_number, ' وسيتم مراجعته قريباً.');
    v_type := 'order_created';
  elsif new.status is not distinct from old.status then
    return new;
  else
    v_type := concat('order_status_', coalesce(new.status, 'updated'));
    case new.status
      when 'pending' then
        v_title := 'طلبك قيد المراجعة';
        v_message := concat('الطلب ', new.order_number, ' قيد المراجعة حالياً.');
      when 'confirmed' then
        v_title := 'تم تأكيد طلبك';
        v_message := concat('تم تأكيد الطلب ', new.order_number, ' ويجري تجهيزه.');
      when 'processing' then
        v_title := 'جاري تجهيز طلبك';
        v_message := concat('الطلب ', new.order_number, ' قيد التجهيز الآن.');
      when 'shipped' then
        v_title := 'تم شحن طلبك';
        v_message := concat('الطلب ', new.order_number, ' خرج للتوصيل.');
      when 'delivered' then
        v_title := 'تم تسليم طلبك';
        v_message := concat('تم تسليم الطلب ', new.order_number, '. شكراً لتسوقك من جنان.');
      when 'cancelled' then
        v_title := 'تم إلغاء الطلب';
        v_message := concat('تم إلغاء الطلب ', new.order_number, '.');
      else
        v_title := 'تحديث على طلبك';
        v_message := concat('تم تحديث حالة الطلب ', new.order_number, '.');
    end case;
  end if;

  if new.owner_user_id is null and new.customer_id is null then
    return new;
  end if;

  insert into public.customer_notifications(
    user_id,
    customer_id,
    customer_phone,
    country,
    title,
    message,
    body,
    type,
    broadcast,
    related_order_id,
    link
  ) values (
    new.owner_user_id,
    new.customer_id,
    new.customer_phone,
    new.country,
    v_title,
    v_message,
    v_message,
    v_type,
    false,
    new.id,
    '/my-orders'
  );

  return new;
end;
$function$
;
