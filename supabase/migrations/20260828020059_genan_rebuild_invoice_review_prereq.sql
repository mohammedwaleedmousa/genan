-- Fresh Genan restores need the review-state column before its constraint migration.
alter table public.orders add column if not exists invoice_review_status text not null default 'unreviewed';
alter table public.orders add column if not exists invoice_reviewed_at timestamptz;
alter table public.orders add column if not exists invoice_reviewed_by uuid references auth.users(id) on delete set null;
