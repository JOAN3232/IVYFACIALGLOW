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
  payment_method text not null default 'bank-transfer',
  payment_status text not null default 'awaiting_confirmation',
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
alter table public.orders add column if not exists payment_method text not null default 'bank-transfer';
alter table public.orders add column if not exists payment_status text not null default 'awaiting_confirmation';
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
  and status in ('awaiting_payment', 'pending')
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
  and status in ('awaiting_payment', 'pending')
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

create index if not exists orders_payment_status_created_at_idx
on public.orders (payment_status, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  type text not null default 'order_update',
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.notifications add column if not exists order_id uuid references public.orders(id) on delete cascade;
alter table public.notifications add column if not exists type text not null default 'order_update';
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists read_at timestamptz;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

alter table public.notifications enable row level security;

drop policy if exists "Customers can read their own notifications" on public.notifications;
create policy "Customers can read their own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Customers can update their own notifications" on public.notifications;
create policy "Customers can update their own notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can create customer notifications" on public.notifications;
create policy "Admins can create customer notifications"
on public.notifications
for insert
to authenticated
with check (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Admins can read customer notifications" on public.notifications;
create policy "Admins can read customer notifications"
on public.notifications
for select
to authenticated
using (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

create index if not exists notifications_user_id_created_at_idx
on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_id_read_at_idx
on public.notifications (user_id, read_at);

create table if not exists public.checkout_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  address text,
  notes text,
  delivery numeric not null default 0,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.checkout_drafts add column if not exists full_name text;
alter table public.checkout_drafts add column if not exists phone text;
alter table public.checkout_drafts add column if not exists email text;
alter table public.checkout_drafts add column if not exists address text;
alter table public.checkout_drafts add column if not exists notes text;
alter table public.checkout_drafts add column if not exists delivery numeric not null default 0;
alter table public.checkout_drafts add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.checkout_drafts add column if not exists updated_at timestamptz not null default now();

alter table public.checkout_drafts enable row level security;

drop policy if exists "Customers can manage their own checkout draft" on public.checkout_drafts;
create policy "Customers can manage their own checkout draft"
on public.checkout_drafts
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

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

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

alter table public.orders replica identity full;
alter table public.notifications replica identity full;

notify pgrst, 'reload schema';
