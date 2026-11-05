alter table aloko_profiles add column if not exists last_seen timestamptz;

create table if not exists aloko_follows (
  user_id text not null,
  seller_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, seller_id)
);

create table if not exists aloko_notes (
  id text primary key,
  user_id text not null,
  seller_id text not null,
  body text not null,
  listing_id text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table aloko_ads drop constraint if exists aloko_ads_slot;
alter table aloko_ads add constraint aloko_ads_slot check (slot in (
  'ribbon_top', 'ribbon_mid', 'portrait', 'ribbon_picks', 'ribbon_drops', 'ribbon_furniture'
));
