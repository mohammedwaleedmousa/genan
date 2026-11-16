-- Admin writes retain caller RLS and the existing per-feature permission gates.
-- Keep cost prices in their private-to-admin table, never in the product response.
create or replace function public.admin_save_product(
  p_product_id uuid,
  p_product jsonb,
  p_cost_price numeric,
  p_inventory_items jsonb,
  p_create boolean default false
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_input public.products%rowtype;
  v_id uuid;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role)
     or not private.admin_permission_gate(array['products.edit'])
     or not private.admin_permission_gate(array['inventory.adjust']) then
    raise exception 'غير مصرح بحفظ المنتج والمخزون' using errcode = '42501';
  end if;
  if p_product_id is null or p_product is null or jsonb_typeof(p_product) <> 'object'
     or p_inventory_items is null or jsonb_typeof(p_inventory_items) <> 'array' then
    raise exception 'بيانات المنتج أو المخزون غير صالحة' using errcode = '22023';
  end if;
  if p_cost_price is null or p_cost_price < 0 or p_cost_price::text in ('NaN','Infinity','-Infinity') then
    raise exception 'سعر التكلفة غير صالح' using errcode = '22023';
  end if;
  v_input := jsonb_populate_record(null::public.products, p_product);
  if nullif(btrim(v_input.name), '') is null or nullif(btrim(v_input.name_ar), '') is null
     or nullif(btrim(v_input.slug), '') is null or v_input.price is null or v_input.price < 0
     or v_input.price::text in ('NaN','Infinity','-Infinity') then
    raise exception 'اسم المنتج والرابط وسعر البيع مطلوبون' using errcode = '22023';
  end if;

  select id into v_id from public.products where id = p_product_id for update;
  if v_id is null then
    if not p_create then raise exception 'المنتج غير موجود' using errcode = 'P0002'; end if;
    insert into public.products(id, name, name_ar, slug, price, original_price, discount, description, description_ar, category, brand, category_id, audience, brand_id, in_stock, stock_quantity, is_featured, is_best_seller, is_active, countries, section_ids, home_collections, has_sizes, sizes, accessories, features, color_variants, return_policy, specs, has_quality_variants, quality_variants)
    values(p_product_id, v_input.name, v_input.name_ar, v_input.slug, v_input.price, v_input.original_price, v_input.discount, v_input.description, v_input.description_ar, v_input.category, v_input.brand, v_input.category_id, v_input.audience, v_input.brand_id, v_input.in_stock, v_input.stock_quantity, v_input.is_featured, v_input.is_best_seller, v_input.is_active, v_input.countries, v_input.section_ids, v_input.home_collections, v_input.has_sizes, v_input.sizes, v_input.accessories, v_input.features, v_input.color_variants, v_input.return_policy, v_input.specs, v_input.has_quality_variants, v_input.quality_variants)
    returning id into v_id;
  else
    update public.products set
      name = v_input.name,
      name_ar = v_input.name_ar,
      slug = v_input.slug,
      price = v_input.price,
      original_price = v_input.original_price,
      discount = v_input.discount,
      description = v_input.description,
      description_ar = v_input.description_ar,
      category = v_input.category,
      brand = v_input.brand,
      category_id = v_input.category_id,
      audience = v_input.audience,
      brand_id = v_input.brand_id,
      in_stock = v_input.in_stock,
      stock_quantity = v_input.stock_quantity,
      is_featured = v_input.is_featured,
      is_best_seller = v_input.is_best_seller,
      is_active = v_input.is_active,
      countries = v_input.countries,
      section_ids = v_input.section_ids,
      home_collections = v_input.home_collections,
      has_sizes = v_input.has_sizes,
      sizes = v_input.sizes,
      accessories = v_input.accessories,
      features = v_input.features,
      color_variants = v_input.color_variants,
      return_policy = v_input.return_policy,
      specs = v_input.specs,
      has_quality_variants = v_input.has_quality_variants,
      quality_variants = v_input.quality_variants
    where id = v_id;
    if not found then raise exception 'تعذر تحديث المنتج' using errcode = '42501'; end if;
  end if;

  insert into public.product_costs(product_id,cost_price,updated_at)
  values(v_id,p_cost_price,now())
  on conflict(product_id) do update
    set cost_price = excluded.cost_price, updated_at = excluded.updated_at;

  perform public.replace_product_inventory_skus(v_id,p_inventory_items);
  return v_id;
end;
$function$;

revoke execute on function public.admin_save_product(uuid,jsonb,numeric,jsonb,boolean) from public, anon;
grant execute on function public.admin_save_product(uuid,jsonb,numeric,jsonb,boolean) to authenticated;

-- Coupon policies already restrict writes to admins with marketing.manage.
grant insert,update,delete on public.coupons to authenticated;

CREATE OR REPLACE FUNCTION public.coupon_usage_summary()
 RETURNS TABLE(code text, usage_count bigint, last_used_at timestamp with time zone)
 LANGUAGE sql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  select
    upper(trim(o.coupon_code)) as code,
    count(*)::bigint as usage_count,
    max(o.created_at) as last_used_at
  from public.orders o
  where o.coupon_code is not null
    and trim(o.coupon_code) <> ''
    and auth.uid() is not null
    and has_role(auth.uid(), 'admin'::app_role)
    and private.admin_permission_gate(array['marketing.view','marketing.manage'])
  group by upper(trim(o.coupon_code));
$function$
;
revoke execute on function public.coupon_usage_summary() from public, anon;
grant execute on function public.coupon_usage_summary() to authenticated;

CREATE OR REPLACE FUNCTION public.create_manual_journal_entry(p_entry_date date, p_reference text, p_description text, p_currency_code text, p_lines jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_transaction_id uuid;
  v_line jsonb;
  v_debit numeric := 0;
  v_credit numeric := 0;
  v_account_id uuid;
  v_line_debit numeric;
  v_line_credit numeric;
  v_rate numeric := 1;
  v_line_count integer := 0;
begin
  if not private.admin_permission_gate(array['finance.manage']) then
    raise exception 'admin permission finance.manage required' using errcode = '42501';
  end if;
  if auth.uid() is null or not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Admin access required';
  end if;

  if p_entry_date is null then
    raise exception 'Entry date is required';
  end if;

  if coalesce(trim(p_description), '') = '' then
    raise exception 'Description is required';
  end if;

  if jsonb_typeof(p_lines) <> 'array' then
    raise exception 'Lines must be an array';
  end if;

  if jsonb_array_length(p_lines) < 2 then
    raise exception 'At least two journal lines are required';
  end if;

  select rate_to_base
  into v_rate
  from public.currencies
  where code = p_currency_code and is_active = true;

  if v_rate is null or v_rate <= 0 then
    raise exception 'Invalid or inactive currency';
  end if;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_account_id := nullif(v_line->>'account_id', '')::uuid;
    v_line_debit := coalesce((v_line->>'debit')::numeric, 0);
    v_line_credit := coalesce((v_line->>'credit')::numeric, 0);

    if v_account_id is null then
      raise exception 'Every line requires an account';
    end if;

    if not exists (
      select 1 from public.chart_of_accounts
      where id = v_account_id and is_active = true
    ) then
      raise exception 'Invalid or inactive account';
    end if;

    if v_line_debit < 0 or v_line_credit < 0 then
      raise exception 'Debit and credit cannot be negative';
    end if;

    if not ((v_line_debit > 0 and v_line_credit = 0) or (v_line_credit > 0 and v_line_debit = 0)) then
      raise exception 'Each line must contain debit or credit, not both';
    end if;

    v_debit := v_debit + v_line_debit;
    v_credit := v_credit + v_line_credit;
    v_line_count := v_line_count + 1;
  end loop;

  if v_line_count < 2 then
    raise exception 'At least two valid journal lines are required';
  end if;

  if v_debit <= 0 or abs(v_debit - v_credit) >= 0.01 then
    raise exception 'Journal entry is not balanced';
  end if;

  insert into public.financial_transactions (
    entry_date,
    reference,
    description,
    source_type,
    source_id,
    is_posted,
    created_by,
    currency_code,
    amount_base
  )
  values (
    p_entry_date,
    nullif(trim(p_reference), ''),
    trim(p_description),
    'manual',
    null,
    true,
    auth.uid(),
    p_currency_code,
    round(v_debit / v_rate, 4)
  )
  returning id into v_transaction_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into public.transaction_lines (
      transaction_id,
      account_id,
      debit,
      credit,
      description
    )
    values (
      v_transaction_id,
      (v_line->>'account_id')::uuid,
      coalesce((v_line->>'debit')::numeric, 0),
      coalesce((v_line->>'credit')::numeric, 0),
      nullif(trim(v_line->>'description'), '')
    );
  end loop;

  return v_transaction_id;
end;
$function$
;
revoke execute on function public.create_manual_journal_entry(date,text,text,text,jsonb) from public, anon;
grant execute on function public.create_manual_journal_entry(date,text,text,text,jsonb) to authenticated;

CREATE OR REPLACE FUNCTION public.currency_usage_summary()
 RETURNS TABLE(code text, order_count bigint, refund_count bigint, expense_count bigint, transaction_count bigint, country_count bigint)
 LANGUAGE sql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  select
    c.code,
    (select count(*) from public.orders o where o.currency_code = c.code),
    (select count(*) from public.refunds r where r.currency_code = c.code),
    (select count(*) from public.expenses e where e.currency_code = c.code),
    (select count(*) from public.financial_transactions f where f.currency_code = c.code),
    (select count(*) from public.countries co where co.default_currency = c.code)
  from public.currencies c
  where auth.uid() is not null and has_role(auth.uid(), 'admin'::app_role)
    and private.admin_permission_gate(array['finance.view','finance.manage'])
  order by c.sort_order, c.code;
$function$
;
revoke execute on function public.currency_usage_summary() from public, anon;
grant execute on function public.currency_usage_summary() to authenticated;

CREATE OR REPLACE FUNCTION public.delete_coupon_safe(p_coupon_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_code text;
  v_usage bigint;
begin
  if not private.admin_permission_gate(array['marketing.manage']) then
    raise exception 'admin permission marketing.manage required' using errcode = '42501';
  end if;
  if auth.uid() is null or not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Admin access required';
  end if;

  select code into v_code
  from public.coupons
  where id = p_coupon_id;

  if not found then
    raise exception 'Coupon not found';
  end if;

  select count(*) into v_usage
  from public.orders
  where coupon_code is not null
    and upper(trim(coupon_code)) = upper(trim(v_code));

  if v_usage > 0 then
    raise exception 'Coupon has usage history and cannot be deleted; disable it instead';
  end if;

  delete from public.coupons where id = p_coupon_id;
end;
$function$
;
revoke execute on function public.delete_coupon_safe(uuid) from public, anon;
grant execute on function public.delete_coupon_safe(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.delete_currency_safe(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_code text := upper(trim(p_code));
  v_is_base boolean;
  v_usage bigint;
begin
  if not private.admin_permission_gate(array['finance.manage']) then
    raise exception 'admin permission finance.manage required' using errcode = '42501';
  end if;
  if auth.uid() is null or not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Admin access required';
  end if;

  select is_base into v_is_base from public.currencies where code = v_code;
  if not found then
    raise exception 'Currency not found';
  end if;

  if v_is_base then
    raise exception 'Base currency cannot be deleted';
  end if;

  select
    (select count(*) from public.orders where currency_code = v_code) +
    (select count(*) from public.refunds where currency_code = v_code) +
    (select count(*) from public.expenses where currency_code = v_code) +
    (select count(*) from public.financial_transactions where currency_code = v_code) +
    (select count(*) from public.countries where default_currency = v_code)
  into v_usage;

  if v_usage > 0 then
    raise exception 'Currency is already used and cannot be deleted; disable it instead';
  end if;

  delete from public.currencies where code = v_code;
end;
$function$
;
revoke execute on function public.delete_currency_safe(text) from public, anon;
grant execute on function public.delete_currency_safe(text) to authenticated;

CREATE OR REPLACE FUNCTION public.delete_product_from_inventory(p_product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not private.admin_permission_gate(array['products.delete']) then
    raise exception 'admin permission products.delete required' using errcode = '42501';
  end if;
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'غير مصرح بحذف المنتج' using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'المنتج غير موجود';
  end if;

  delete from public.products where id = p_product_id;
end;
$function$
;
revoke execute on function public.delete_product_from_inventory(uuid) from public, anon;
grant execute on function public.delete_product_from_inventory(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.delete_refund_safe(p_refund_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_status text;
begin
  if not private.admin_permission_gate(array['finance.manage']) then
    raise exception 'admin permission finance.manage required' using errcode = '42501';
  end if;
  if auth.uid() is null or not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Admin access required';
  end if;

  select status into v_status
  from public.refunds
  where id = p_refund_id
  for update;

  if not found then
    raise exception 'Refund not found';
  end if;

  if v_status in ('approved','processing','completed') then
    raise exception 'Approved or processed refunds cannot be deleted';
  end if;

  delete from public.refunds where id = p_refund_id;
end;
$function$
;
revoke execute on function public.delete_refund_safe(uuid) from public, anon;
grant execute on function public.delete_refund_safe(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.reverse_journal_entry(p_transaction_id uuid, p_entry_date date, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_original public.financial_transactions%rowtype;
  v_reversal_id uuid;
  v_reason text;
begin
  if not private.admin_permission_gate(array['finance.manage']) then
    raise exception 'admin permission finance.manage required' using errcode = '42501';
  end if;
  if auth.uid() is null or not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Admin access required';
  end if;

  select * into v_original
  from public.financial_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Journal entry not found';
  end if;

  if v_original.source_type = 'journal_reversal' then
    raise exception 'A reversal entry cannot be reversed from this action';
  end if;

  if exists (
    select 1 from public.financial_transactions
    where source_type = 'journal_reversal' and source_id = p_transaction_id
  ) then
    raise exception 'This journal entry has already been reversed';
  end if;

  if not v_original.is_posted then
    raise exception 'Only posted journal entries can be reversed';
  end if;

  v_reason := coalesce(nullif(trim(p_reason), ''), 'عكس القيد');

  insert into public.financial_transactions (
    entry_date,
    reference,
    description,
    source_type,
    source_id,
    is_posted,
    created_by,
    currency_code,
    amount_base
  )
  values (
    coalesce(p_entry_date, current_date),
    case when v_original.reference is null then 'REV-' || left(v_original.id::text, 8) else 'REV-' || v_original.reference end,
    v_reason || ': ' || v_original.description,
    'journal_reversal',
    v_original.id,
    true,
    auth.uid(),
    v_original.currency_code,
    v_original.amount_base
  )
  returning id into v_reversal_id;

  insert into public.transaction_lines (
    transaction_id,
    account_id,
    debit,
    credit,
    description
  )
  select
    v_reversal_id,
    account_id,
    credit,
    debit,
    coalesce(description, 'عكس السطر الأصلي')
  from public.transaction_lines
  where transaction_id = p_transaction_id;

  return v_reversal_id;
end;
$function$
;
revoke execute on function public.reverse_journal_entry(uuid,date,text) from public, anon;
grant execute on function public.reverse_journal_entry(uuid,date,text) to authenticated;
