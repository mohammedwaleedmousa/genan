-- Legacy sales attribution compatibility; private schema is not exposed to the Data API.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.flamingo_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_phone_key text NOT NULL,
  source_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_percentage numeric NOT NULL DEFAULT 10,
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS private.flamingo_discount_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_key text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  source text NOT NULL,
  referral_code text,
  discount_percentage numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referral_codes_owner_phone_idx ON private.flamingo_referral_codes(owner_phone_key);
CREATE INDEX IF NOT EXISTS discount_benefits_phone_idx ON private.flamingo_discount_benefits(phone_key);
ALTER TABLE private.flamingo_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.flamingo_discount_benefits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.flamingo_referral_codes, private.flamingo_discount_benefits FROM public,anon,authenticated;
