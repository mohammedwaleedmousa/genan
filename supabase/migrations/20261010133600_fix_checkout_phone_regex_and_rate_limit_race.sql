-- Correct E.164 phone validation and serialize rate-limit checks per phone.
CREATE OR REPLACE FUNCTION public.create_secure_order_v4(
  p_request_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_customer_notes text,
  p_country text,
  p_customer_city text,
  p_customer_region text,
  p_items jsonb,
  p_payment_method text,
  p_currency_mode text,
  p_currency_code text,
  p_coupon_code text DEFAULT NULL,
  p_delivery_company_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_request_hash text;
  v_phone_hash text;
  v_existing_hash text;
  v_existing_response jsonb;
  v_payload jsonb;
  v_recent_orders integer;
  v_response json;
BEGIN
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'invalid_request_id';
  END IF;

  IF p_customer_phone IS NULL OR p_customer_phone !~ '^\+[1-9][0-9]{7,14}$' THEN
    RAISE EXCEPTION 'invalid_checkout_phone';
  END IF;

  v_payload := pg_catalog.jsonb_build_object(
    'customer_name', p_customer_name,
    'customer_phone', p_customer_phone,
    'customer_address', p_customer_address,
    'customer_notes', p_customer_notes,
    'country', p_country,
    'customer_city', p_customer_city,
    'customer_region', p_customer_region,
    'items', p_items,
    'payment_method', p_payment_method,
    'currency_mode', p_currency_mode,
    'currency_code', p_currency_code,
    'coupon_code', p_coupon_code,
    'delivery_company_id', p_delivery_company_id
  );

  v_request_hash := pg_catalog.encode(
    extensions.digest(v_payload::text, 'sha256'),
    'hex'
  );
  v_phone_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g'), 'sha256'),
    'hex'
  );

  -- Serialize concurrent retries that share the same idempotency key.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_request_id::text, 0)
  );

  SELECT request_hash, response
    INTO v_existing_hash, v_existing_response
    FROM private.checkout_request_idempotency_v4
   WHERE request_id = p_request_id
   FOR UPDATE;

  IF FOUND THEN
    IF v_existing_hash <> v_request_hash THEN
      RAISE EXCEPTION 'idempotency_key_reused';
    END IF;
    RETURN v_existing_response::json;
  END IF;

  -- Serialize new requests for the same normalized phone before checking the
  -- hourly cap, so concurrent submissions cannot race past the limit.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_phone_hash, 1)
  );

  -- Keep stored tracking responses bounded; clients only retain an idempotency key for a pending same-tab attempt.
  DELETE FROM private.checkout_request_idempotency_v4
   WHERE created_at < pg_catalog.now() - interval '30 days';

  -- Limit successful new order submissions to five per normalized phone per hour.
  -- A retry with the same request ID is returned above and does not consume another slot.
  SELECT pg_catalog.count(*)::integer
    INTO v_recent_orders
    FROM private.checkout_request_idempotency_v4
   WHERE phone_hash = v_phone_hash
     AND created_at >= pg_catalog.now() - interval '1 hour';

  IF v_recent_orders >= 5 THEN
    RAISE EXCEPTION 'order_rate_limit';
  END IF;

  v_response := public.create_secure_order_v3(
    p_customer_name => p_customer_name,
    p_customer_phone => p_customer_phone,
    p_customer_address => p_customer_address,
    p_customer_notes => p_customer_notes,
    p_country => p_country,
    p_customer_city => p_customer_city,
    p_customer_region => p_customer_region,
    p_items => p_items,
    p_payment_method => p_payment_method,
    p_currency_mode => p_currency_mode,
    p_currency_code => p_currency_code,
    p_coupon_code => p_coupon_code,
    p_delivery_company_id => p_delivery_company_id
  );

  INSERT INTO private.checkout_request_idempotency_v4 (
    request_id, request_hash, phone_hash, response
  ) VALUES (
    p_request_id, v_request_hash, v_phone_hash, v_response::jsonb
  );

  RETURN v_response;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_secure_order_v4(uuid, text, text, text, text, text, text, text, jsonb, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_secure_order_v4(uuid, text, text, text, text, text, text, text, jsonb, text, text, text, text, uuid) TO anon, authenticated;
