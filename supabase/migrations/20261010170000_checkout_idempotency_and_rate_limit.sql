-- Add server-side idempotency and a successful-order rate limit for checkout.
-- Deploy this migration before deploying the storefront version that calls v4.
-- Keep v3 temporarily available during rollout; revoke it in a follow-up migration
-- after the new storefront has been deployed and verified.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.checkout_request_idempotency (
  request_id uuid PRIMARY KEY,
  request_hash text NOT NULL,
  phone_hash text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkout_request_idempotency_phone_created_idx
  ON private.checkout_request_idempotency (phone_hash, created_at DESC);

REVOKE ALL ON TABLE private.checkout_request_idempotency FROM PUBLIC, anon, authenticated;

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
    extensions.digest(lower(pg_catalog.btrim(pg_catalog.coalesce(p_customer_phone, ''))), 'sha256'),
    'hex'
  );

  -- Serialize concurrent retries that share the same idempotency key.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_request_id::text, 0)
  );

  SELECT request_hash, response
    INTO v_existing_hash, v_existing_response
    FROM private.checkout_request_idempotency
   WHERE request_id = p_request_id
   FOR UPDATE;

  IF FOUND THEN
    IF v_existing_hash <> v_request_hash THEN
      RAISE EXCEPTION 'idempotency_key_reused';
    END IF;
    RETURN v_existing_response::json;
  END IF;

  -- Limit successful new order submissions to five per normalized phone per hour.
  -- A retry with the same request ID is returned above and does not consume another slot.
  SELECT pg_catalog.count(*)::integer
    INTO v_recent_orders
    FROM private.checkout_request_idempotency
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

  INSERT INTO private.checkout_request_idempotency (
    request_id, request_hash, phone_hash, response
  ) VALUES (
    p_request_id, v_request_hash, v_phone_hash, v_response::jsonb
  );

  RETURN v_response;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_secure_order_v4(uuid, text, text, text, text, text, text, text, jsonb, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_secure_order_v4(uuid, text, text, text, text, text, text, text, jsonb, text, text, text, text, uuid) TO anon, authenticated;
