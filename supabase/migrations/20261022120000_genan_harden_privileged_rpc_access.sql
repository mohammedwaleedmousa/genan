-- Restrict privileged legacy and internal RPC endpoints before production traffic.
-- The current anonymous storefront calls only v4 checkout, coupon validation, order tracking
-- and verified purchase analytics; keep those public paths intact.
DO $revoke$ DECLARE sig text; BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.apply_inventory_adjustment(uuid,text,integer,text,text,text,uuid)',
    'public.get_inventory_summary()',
    'public.replace_product_inventory_skus(uuid,jsonb)',
    'public.link_authenticated_customer(boolean)',
    'public.validate_customer_coupon(text)',
    'public.create_secure_order_v2(text,text,text,text,text,text,text,jsonb,text,text,text,text,uuid)',
    'public.create_secure_order_v3(text,text,text,text,text,text,text,jsonb,text,text,text,text,uuid)',
    'public.create_secure_order(text,text,text,text,text,text,text,text,uuid,text,jsonb)'
  ] LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',sig);
    END IF;
  END LOOP;
  FOREACH sig IN ARRAY ARRAY[
    'public.capture_product_cost_price()',
    'public.handle_customer_auth_signup()',
    'public.inventory_skus_sync_product_trigger()',
    'public.sync_notification_read_status()'
  ] LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',sig);
    END IF;
  END LOOP;
END $revoke$;
