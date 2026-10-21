-- Recover missing legacy orders region field required by fulfillment validation.
alter table public.orders add column if not exists customer_region text;
