alter table aloko_profiles add column if not exists onboarded boolean not null default false;
alter table aloko_profiles add column if not exists wallpaper text not null default 'mint';
update aloko_profiles set onboarded = true;

alter table aloko_listings add column if not exists sold_price integer;
alter table aloko_listings add column if not exists buyer_id text not null default '';
alter table aloko_listings add column if not exists buyer_name text not null default '';
alter table aloko_listings add column if not exists negotiated boolean not null default false;

create table if not exists aloko_offers (
  id text primary key,
  thread_id text not null,
  listing_id text not null,
  buyer_id text not null,
  amount integer not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint aloko_offers_status check (status in ('open', 'accepted', 'declined'))
);
create index if not exists aloko_offers_thread_idx on aloko_offers (thread_id);

create table if not exists aloko_ratings (
  thread_id text not null,
  rater_id text not null,
  stars integer not null,
  primary key (thread_id, rater_id),
  constraint aloko_ratings_stars check (stars between 1 and 5)
);
