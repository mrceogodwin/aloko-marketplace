create table if not exists aloko_home (
  id text primary key,
  title text not null,
  enabled boolean not null default true,
  sort integer not null
);

create table if not exists aloko_tickets (
  id text primary key,
  user_id text not null default '',
  email text not null,
  name text not null default '',
  subject text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint aloko_tickets_status check (status in ('open', 'closed'))
);

create table if not exists aloko_ticket_messages (
  id text primary key,
  ticket_id text not null,
  sender text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint aloko_ticket_sender check (sender in ('user', 'staff'))
);
