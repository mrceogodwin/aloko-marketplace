alter table aloko_profiles add column if not exists plan_until timestamptz;
alter table aloko_listings add column if not exists featured_until timestamptz;

create table if not exists aloko_orders (
  id text primary key,
  user_id text not null,
  kind text not null,
  amount integer not null,
  status text not null default 'unpaid',
  listing_id text not null default '',
  created_at timestamptz not null default now(),
  constraint aloko_orders_status check (status in ('unpaid', 'paid', 'cancelled')),
  constraint aloko_orders_kind check (kind in ('extra_listing', 'feature_listing', 'business_month', 'service_month', 'ad_category', 'ad_home'))
);
create index if not exists aloko_orders_user_idx on aloko_orders (user_id);
