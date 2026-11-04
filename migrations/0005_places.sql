alter table aloko_profiles add column if not exists state text not null default '';
alter table aloko_profiles add column if not exists area text not null default '';
alter table aloko_profiles add column if not exists lat double precision;
alter table aloko_profiles add column if not exists lng double precision;
alter table aloko_profiles add column if not exists radius_km integer not null default 0;
alter table aloko_profiles add column if not exists coverage text not null default 'city';

alter table aloko_listings add column if not exists area text not null default '';
alter table aloko_listings add column if not exists state text not null default '';
alter table aloko_listings add column if not exists lat double precision;
alter table aloko_listings add column if not exists lng double precision;
alter table aloko_listings add column if not exists coverage text not null default 'city';
