alter table aloko_listings add column if not exists condition text not null default 'Good';
alter table aloko_listings add column if not exists open_to_offers boolean not null default true;
