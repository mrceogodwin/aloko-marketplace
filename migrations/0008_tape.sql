create table if not exists aloko_tape (
  id text primary key,
  user_id text not null,
  body text not null,
  kind text not null default 'free',
  status text not null default 'pending',
  week_key text not null,
  created_at timestamptz not null default now(),
  constraint aloko_tape_kind check (kind in ('free', 'paid')),
  constraint aloko_tape_status check (status in ('hold', 'pending', 'active', 'rejected'))
);

alter table aloko_orders drop constraint if exists aloko_orders_kind;
alter table aloko_orders add constraint aloko_orders_kind check (kind in ('extra_listing', 'feature_listing', 'business_month', 'service_month', 'ad_category', 'ad_home', 'tape_line'));
