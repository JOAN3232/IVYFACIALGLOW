-- IvyFacialGlow orders setup
-- Run this once in Supabase SQL Editor.
-- If your orders table already exists, this will add any missing columns and refresh policies.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  address text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  delivery numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.orders add column if not exists full_name text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists email text;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists subtotal numeric not null default 0;
alter table public.orders add column if not exists delivery numeric not null default 0;
alter table public.orders add column if not exists total numeric not null default 0;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists created_at timestamptz not null default now();

alter table public.orders enable row level security;

drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can read all orders" on public.orders;
create policy "Admins can read all orders"
on public.orders
for select
to authenticated
using (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Admins can approve orders" on public.orders;
create policy "Admins can approve orders"
on public.orders
for update
to authenticated
using (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
)
with check (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Customers can mark pending orders cancelled" on public.orders;
create policy "Customers can mark pending orders cancelled"
on public.orders
for update
to authenticated
using (
  user_id = auth.uid()
  and status = 'pending'
)
with check (
  user_id = auth.uid()
  and status = 'cancelled'
);

drop policy if exists "Customers can cancel pending orders" on public.orders;
create policy "Customers can cancel pending orders"
on public.orders
for delete
to authenticated
using (
  user_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders
for delete
to authenticated
using (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

create index if not exists orders_user_id_created_at_idx
on public.orders (user_id, created_at desc);

create index if not exists orders_status_created_at_idx
on public.orders (status, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

alter table public.orders replica identity full;

notify pgrst, 'reload schema';
