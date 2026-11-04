create table if not exists aloko_profiles (
  user_id text primary key,
  display_name text not null default '',
  account_type text not null default 'buyer',
  service_area text not null default '',
  updated_at timestamptz not null default now(),
  constraint aloko_profiles_account_type check (
    account_type in (
      'buyer',
      'individual',
      'reseller',
      'business',
      'bulk_distributor',
      'decluttering_provider'
    )
  )
);

create table if not exists aloko_listings (
  id text primary key,
  user_id text not null,
  title text not null,
  description text not null,
  price_naira integer not null,
  city text not null,
  category text not null,
  kind text not null,
  image text not null,
  status text not null default 'pending',
  seller_name text not null default '',
  created_at timestamptz not null default now(),
  constraint aloko_listings_kind check (kind in ('sale', 'giveaway', 'bulk')),
  constraint aloko_listings_status check (status in ('pending', 'active', 'rejected'))
);

create index if not exists aloko_listings_user_idx on aloko_listings (user_id);
create index if not exists aloko_listings_status_idx on aloko_listings (status);
