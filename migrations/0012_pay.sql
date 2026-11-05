alter table aloko_orders add column if not exists reference text;
create unique index if not exists aloko_orders_reference_idx on aloko_orders (reference) where reference is not null;
