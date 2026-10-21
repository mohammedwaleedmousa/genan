-- Bootstrap catalog structures missing from legacy tracked migrations.
-- Existing deployments may already have these objects.
alter table public.products
  add column if not exists category_id uuid,
  add column if not exists brand_id uuid;

create table if not exists public.inventory_skus (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_key text not null,
  label text not null,
  color_name text,
  color_hex text,
  color_hex2 text,
  size text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, variant_key)
);

create index if not exists inventory_skus_product_id_idx on public.inventory_skus(product_id);
alter table public.inventory_skus enable row level security;
drop policy if exists "genan public reads active sku availability" on public.inventory_skus;
create policy "genan public reads active sku availability" on public.inventory_skus
  for select to anon,authenticated
  using (exists (select 1 from public.products p where p.id=product_id and p.is_active=true));
drop policy if exists "genan admins manage sku inventory" on public.inventory_skus;
create policy "genan admins manage sku inventory" on public.inventory_skus
  for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
grant select on public.inventory_skus to anon,authenticated;
grant insert,update,delete on public.inventory_skus to authenticated;
