-- StorTrack Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/govlprbfgjilgndasngj/sql

-- Salespeople
create table if not exists salespeople (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- Sales
create table if not exists sales (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  customer text not null,
  phone text,
  items text,
  address text,
  price numeric(10,2) not null default 0,
  cost numeric(10,2) not null default 0,
  salesperson text,
  delivery_date date,
  delivery_time text,
  delivered boolean not null default false,
  created_at timestamptz default now()
);

-- Payments (linked to sales)
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid not null references sales(id) on delete cascade,
  date date not null,
  amount numeric(10,2) not null,
  method text not null,
  note text,
  created_at timestamptz default now()
);

-- Expenses
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  category text not null,
  vendor text not null,
  amount numeric(10,2) not null,
  note text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table salespeople enable row level security;
alter table sales enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;

-- Allow full access with anon key (app is protected by password gate)
create policy "Allow all for anon" on salespeople for all to anon using (true) with check (true);
create policy "Allow all for anon" on sales for all to anon using (true) with check (true);
create policy "Allow all for anon" on payments for all to anon using (true) with check (true);
create policy "Allow all for anon" on expenses for all to anon using (true) with check (true);
