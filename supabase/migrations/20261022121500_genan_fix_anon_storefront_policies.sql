-- Restrict administrative RLS policies to authenticated users.
-- Calling has_role from an anonymous public policy causes permission-denied errors
-- once public execution of role-checking helpers is correctly revoked.
DO $policy_guard$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND roles='{public}'::name[]
      AND (coalesce(qual,'') ILIKE '%has_role%' OR coalesce(with_check,'') ILIKE '%has_role%')
      AND policyname NOT IN ('Public can view active brand sections','Public reads active campaign pages')
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated',r.policyname,r.tablename);
  END LOOP;
END $policy_guard$;

ALTER POLICY "Public can view active brand sections" ON public.brand_sections
  TO anon,authenticated USING (is_active = true);
ALTER POLICY "Public reads active campaign pages" ON public.campaign_pages
  TO anon,authenticated USING (is_active = true);
ALTER POLICY "Anyone can view active brand filters" ON public.brand_filters
  TO anon,authenticated USING (is_active = true);
