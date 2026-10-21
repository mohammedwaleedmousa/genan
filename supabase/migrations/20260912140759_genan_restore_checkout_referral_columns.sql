-- Required order referral metadata absent from the legacy tracked schema.
alter table public.orders add column if not exists referral_code_issued text;
alter table public.orders add column if not exists referral_code_expires_at timestamptz;
alter table public.orders add column if not exists discount_source text;
