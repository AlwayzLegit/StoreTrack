-- ============================================================
-- StorTrack — Complete Production Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Salespeople ───────────────────────────────────────────────
create table if not exists salespeople (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null unique,
  created_at timestamptz default now()
);

-- ── Vendors ───────────────────────────────────────────────────
create table if not exists vendors (
  id            uuid        default gen_random_uuid() primary key,
  name          text        not null,
  contact_name  text,
  phone         text,
  email         text,
  address       text,
  payment_terms text,
  notes         text,
  created_at    timestamptz default now()
);

-- ── Products ──────────────────────────────────────────────────
create table if not exists products (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null,
  brand      text,
  vendor_id  uuid        references vendors(id) on delete set null,
  notes      text,
  created_at timestamptz default now()
);

-- ── Product Variants ──────────────────────────────────────────
create table if not exists product_variants (
  id               uuid          default gen_random_uuid() primary key,
  product_id       uuid          not null references products(id) on delete cascade,
  size             text,
  cost             numeric(10,2) not null default 0,
  retail_price     numeric(10,2) not null default 0,
  quantity_on_hand integer       not null default 0,
  created_at       timestamptz   default now()
);

-- ── Sales ─────────────────────────────────────────────────────
create table if not exists sales (
  id               uuid          default gen_random_uuid() primary key,
  date             date          not null,
  customer         text          not null,
  phone            text,
  items            text,
  address          text,
  price            numeric(10,2) not null default 0,
  cost             numeric(10,2) not null default 0,
  salesperson      text,
  delivery_date    date,
  delivery_time    text,
  delivered        boolean       not null default false,
  notes            text,
  cancelled_at     timestamptz,
  cancelled_reason text,
  deleted_at       timestamptz,
  deleted_reason   text,
  created_at       timestamptz   default now()
);

-- ── Sale Items (line items linked to a sale) ──────────────────
create table if not exists sale_items (
  id            uuid          default gen_random_uuid() primary key,
  sale_id       uuid          not null references sales(id) on delete cascade,
  variant_id    uuid          references product_variants(id) on delete set null,
  vendor_id     uuid          references vendors(id) on delete set null,
  description   text,
  quantity      integer       not null default 1,
  price_at_sale numeric(10,2) not null default 0,
  cost_at_sale  numeric(10,2) not null default 0,
  created_at    timestamptz   default now()
);

-- ── Payments (deposits linked to a sale) ─────────────────────
create table if not exists payments (
  id             uuid          default gen_random_uuid() primary key,
  sale_id        uuid          not null references sales(id) on delete cascade,
  date           date          not null,
  amount         numeric(10,2) not null,
  method         text          not null,
  note           text,
  deleted_at     timestamptz,
  deleted_reason text,
  created_at     timestamptz   default now()
);

-- ── Expenses ──────────────────────────────────────────────────
create table if not exists expenses (
  id             uuid          default gen_random_uuid() primary key,
  date           date          not null,
  category       text          not null,
  vendor         text          not null,
  amount         numeric(10,2) not null,
  note           text,
  deleted_at     timestamptz,
  deleted_reason text,
  created_at     timestamptz   default now()
);

-- ── Vendor Purchases ──────────────────────────────────────────
create table if not exists vendor_purchases (
  id             uuid          default gen_random_uuid() primary key,
  vendor_id      uuid          not null references vendors(id) on delete cascade,
  date           date          not null,
  invoice_number text,
  notes          text,
  amount_paid    numeric(10,2) not null default 0,
  deleted_at     timestamptz,
  created_at     timestamptz   default now()
);

-- ── Vendor Purchase Items ─────────────────────────────────────
create table if not exists vendor_purchase_items (
  id          uuid          default gen_random_uuid() primary key,
  purchase_id uuid          not null references vendor_purchases(id) on delete cascade,
  variant_id  uuid          references product_variants(id) on delete set null,
  description text,
  quantity    integer       not null default 1,
  unit_cost   numeric(10,2) not null default 0,
  created_at  timestamptz   default now()
);

-- ── Audit Logs ────────────────────────────────────────────────
create table if not exists audit_logs (
  id          uuid        default gen_random_uuid() primary key,
  action      text        not null,
  entity_type text        not null,
  entity_id   uuid,
  reason      text,
  data_before jsonb,
  data_after  jsonb,
  user_id     uuid        references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
create index if not exists idx_sales_date           on sales(date);
create index if not exists idx_sales_deleted        on sales(deleted_at) where deleted_at is null;
create index if not exists idx_payments_sale_id     on payments(sale_id);
create index if not exists idx_payments_deleted     on payments(deleted_at) where deleted_at is null;
create index if not exists idx_expenses_date        on expenses(date);
create index if not exists idx_expenses_deleted     on expenses(deleted_at) where deleted_at is null;
create index if not exists idx_sale_items_sale_id   on sale_items(sale_id);
create index if not exists idx_variants_product_id  on product_variants(product_id);
create index if not exists idx_vp_vendor_id         on vendor_purchases(vendor_id);
create index if not exists idx_vpi_purchase_id      on vendor_purchase_items(purchase_id);
create index if not exists idx_audit_logs_created   on audit_logs(created_at desc);

-- ============================================================
-- Atomic Inventory RPC Functions (prevent race conditions)
-- ============================================================

-- Decrement stock when a sale is made
create or replace function decrement_stock(variant_id uuid, qty integer)
returns void language plpgsql security definer as $$
begin
  update product_variants
  set    quantity_on_hand = greatest(0, quantity_on_hand - qty)
  where  id = variant_id;
end;
$$;

-- Increment stock when a vendor purchase is received
create or replace function increment_stock(variant_id uuid, qty integer)
returns void language plpgsql security definer as $$
begin
  update product_variants
  set    quantity_on_hand = quantity_on_hand + qty
  where  id = variant_id;
end;
$$;

-- ============================================================
-- Row Level Security (RLS)
-- All tables are restricted to authenticated users only.
-- ============================================================
alter table salespeople           enable row level security;
alter table vendors               enable row level security;
alter table products              enable row level security;
alter table product_variants      enable row level security;
alter table sales                 enable row level security;
alter table sale_items            enable row level security;
alter table payments              enable row level security;
alter table expenses              enable row level security;
alter table vendor_purchases      enable row level security;
alter table vendor_purchase_items enable row level security;
alter table audit_logs            enable row level security;

-- Authenticated users have full access to all tables
create policy "Authenticated users: full access" on salespeople           for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on vendors               for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on products              for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on product_variants      for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on sales                 for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on sale_items            for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on payments              for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on expenses              for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on vendor_purchases      for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on vendor_purchase_items for all to authenticated using (true) with check (true);
create policy "Authenticated users: full access" on audit_logs            for all to authenticated using (true) with check (true);

-- Grant RPC function execution to authenticated users
grant execute on function decrement_stock(uuid, integer) to authenticated;
grant execute on function increment_stock(uuid, integer) to authenticated;
