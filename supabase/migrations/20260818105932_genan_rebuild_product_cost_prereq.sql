-- Required legacy column used by the following cost migration on clean projects.
alter table public.products add column if not exists cost_price numeric;
