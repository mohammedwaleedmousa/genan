-- Fresh Genan restores need the review-state column before its constraint migration.
alter table public.orders add column if not exists invoice_review_status text not null default 'unreviewed';
