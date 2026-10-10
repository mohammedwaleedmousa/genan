-- Restore verified, idempotent purchase analytics RPC used by the storefront.
-- This function intentionally accepts anonymous callers, but only records a purchase
-- after validating the order's high-entropy tracking token against its stored hash.
CREATE OR REPLACE FUNCTION public.record_purchase_analytics(
  p_order_id uuid,
  p_tracking_token text,
  p_session_id text DEFAULT NULL,
  p_path text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content text DEFAULT NULL,
  p_device text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF p_order_id IS NULL
     OR p_tracking_token IS NULL
     OR length(p_tracking_token) < 32
     OR length(p_tracking_token) > 256 THEN
    RETURN false;
  END IF;

  -- Serialize concurrent requests for the same order so retries do not double count.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_order_id::text, 0)
  );

  SELECT *
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     AND tracking_token_hash = pg_catalog.encode(
       extensions.digest(p_tracking_token, 'sha256'), 'hex'
     )
   LIMIT 1;

  IF v_order.id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.analytics_events
     WHERE event_type = 'purchase'
       AND order_id = v_order.id
  ) THEN
    RETURN true;
  END IF;

  INSERT INTO public.analytics_events (
    event_type, session_id, user_id, path, referrer,
    utm_source, utm_medium, utm_campaign, utm_content,
    device, country, order_id, value, metadata
  ) VALUES (
    'purchase',
    left(nullif(p_session_id, ''), 200),
    v_order.owner_user_id,
    left(nullif(p_path, ''), 1000),
    left(nullif(p_referrer, ''), 2000),
    left(nullif(p_utm_source, ''), 500),
    left(nullif(p_utm_medium, ''), 500),
    left(nullif(p_utm_campaign, ''), 500),
    left(nullif(p_utm_content, ''), 500),
    CASE WHEN p_device IN ('mobile', 'tablet', 'desktop') THEN p_device ELSE NULL END,
    v_order.country,
    v_order.id,
    v_order.total,
    pg_catalog.jsonb_build_object(
      'order_number', v_order.order_number,
      'currency_code', v_order.currency_code
    )
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_purchase_analytics(uuid, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_purchase_analytics(uuid, text, text, text, text, text, text, text, text, text) TO anon, authenticated;
