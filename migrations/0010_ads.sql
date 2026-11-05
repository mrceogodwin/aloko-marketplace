create table if not exists aloko_ads (
  id text primary key,
  user_id text not null,
  slot text not null,
  image text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint aloko_ads_slot check (slot in ('ribbon_top', 'ribbon_mid', 'portrait')),
  constraint aloko_ads_status check (status in ('pending', 'active', 'rejected'))
);

alter table aloko_orders drop constraint if exists aloko_orders_kind;
alter table aloko_orders add constraint aloko_orders_kind check (kind in (
  'extra_listing', 'feature_listing', 'business_month', 'service_month', 'ad_category', 'ad_home', 'tape_line', 'ad_ribbon', 'ad_portrait'
));
