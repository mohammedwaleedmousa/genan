-- Retire the disabled customer assistant only after verifying it has no data.
-- Its Edge Function is not deployed, and its storefront entry has been disabled.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DO $cleanup$
BEGIN
  IF to_regclass('public.customer_assistant_rate_limits') IS NOT NULL THEN
    LOCK TABLE public.customer_assistant_rate_limits IN ACCESS EXCLUSIVE MODE;
    IF EXISTS (SELECT 1 FROM public.customer_assistant_rate_limits LIMIT 1) THEN
      RAISE EXCEPTION 'Refusing to remove customer assistant data: table is not empty';
    END IF;
  END IF;
END;
$cleanup$;

DROP FUNCTION IF EXISTS public.consume_customer_assistant_rate_limit(text, integer, integer) RESTRICT;
DROP TABLE IF EXISTS public.customer_assistant_rate_limits RESTRICT;
