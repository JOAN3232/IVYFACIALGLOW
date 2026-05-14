-- IvyFacialGlow products + product image storage setup
-- Run this once in Supabase SQL Editor.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  name text not null,
  price numeric not null default 0,
  image_url text not null,
  category text not null,
  mood text not null,
  description text,
  fun_fact text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists legacy_id text;
create unique index if not exists products_legacy_id_key
on public.products (legacy_id);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.products to service_role;

alter table public.products enable row level security;

drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
on public.products
for select
using (is_active = true);

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products"
on public.products
for select
to authenticated
using (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
)
with check (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (
  auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

notify pgrst, 'reload schema';

drop policy if exists "Anyone can view product images" on storage.objects;
create policy "Anyone can view product images"
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
)
with check (
  bucket_id = 'product-images'
  and auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and auth.jwt() ->> 'email' in ('ivyfacialsaesthetics@gmail.com')
);
