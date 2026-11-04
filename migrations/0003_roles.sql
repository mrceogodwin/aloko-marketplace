update aloko_profiles
set account_type = 'business'
where account_type in ('reseller', 'bulk_distributor');

update aloko_profiles
set account_type = 'service'
where account_type = 'decluttering_provider';

alter table aloko_profiles drop constraint if exists aloko_profiles_account_type;

alter table aloko_profiles add column if not exists business_name text not null default '';
alter table aloko_profiles add column if not exists city text not null default '';
alter table aloko_profiles add column if not exists interests text not null default '';
alter table aloko_profiles add column if not exists verification text not null default 'none';
alter table aloko_profiles add column if not exists cac_ref text not null default '';
alter table aloko_profiles add column if not exists suspended boolean not null default false;

alter table aloko_profiles drop constraint if exists aloko_profiles_account_type_v2;
alter table aloko_profiles add constraint aloko_profiles_account_type_v2 check (
  account_type in ('buyer', 'individual', 'business', 'service', 'moderator', 'super_admin')
);

create table if not exists aloko_memberships (
  user_id text not null,
  role text not null,
  primary key (user_id, role),
  constraint aloko_memberships_role check (
    role in ('buyer', 'individual', 'business', 'service', 'moderator', 'super_admin')
  )
);

insert into aloko_memberships (user_id, role)
select user_id, account_type from aloko_profiles
on conflict do nothing;

insert into aloko_memberships (user_id, role)
select user_id, 'buyer' from aloko_profiles
on conflict do nothing;

alter table aloko_listings add column if not exists product_code text not null default '';
alter table aloko_listings add column if not exists paused boolean not null default false;
alter table aloko_listings add column if not exists sold_at timestamptz;
alter table aloko_listings add column if not exists stock integer not null default 1;

create unique index if not exists aloko_listings_code_idx
  on aloko_listings (product_code) where product_code <> '';

create table if not exists aloko_codes (
  id integer primary key,
  n integer not null
);
insert into aloko_codes (id, n) values (1, 100) on conflict (id) do nothing;

create table if not exists aloko_services (
  id text primary key,
  user_id text not null,
  title text not null,
  description text not null,
  areas text not null,
  price_note text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint aloko_services_status check (status in ('pending', 'active', 'rejected'))
);
create index if not exists aloko_services_user_idx on aloko_services (user_id);

create table if not exists aloko_threads (
  id text primary key,
  listing_id text not null,
  product_code text not null,
  buyer_id text not null,
  seller_id text not null,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create table if not exists aloko_messages (
  id text primary key,
  thread_id text not null,
  sender_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists aloko_saves (
  user_id text not null,
  listing_id text not null,
  primary key (user_id, listing_id)
);

create table if not exists aloko_views (
  user_id text not null,
  listing_id text not null,
  title text not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists aloko_audit (
  id text primary key,
  actor_id text not null,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);
