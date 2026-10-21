-- Required products home collection metadata missing from legacy rebuilds.
alter table public.products add column if not exists home_collections text[] not null default '{}'::text[];
