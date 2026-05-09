-- IvyFacialGlow order cleanup helper
-- Run SELECT queries first. Only run DELETE after you identify the exact unwanted IDs.

-- 1. See all orders newest first.
select
  id,
  user_id,
  full_name,
  email,
  phone,
  total,
  status,
  created_at,
  jsonb_array_length(items) as item_count
from public.orders
order by created_at desc;

-- 2. See possible duplicates grouped by buyer + amount + close timestamp text.
select
  user_id,
  email,
  total,
  status,
  date_trunc('minute', created_at) as created_minute,
  count(*) as duplicate_count,
  array_agg(id order by created_at desc) as order_ids
from public.orders
group by user_id, email, total, status, date_trunc('minute', created_at)
having count(*) > 1
order by created_minute desc;

-- 3. Delete ONLY unwanted orders after copying their IDs from query 1 or 2.
-- Replace the sample IDs below, then remove the -- before delete.
--
-- delete from public.orders
-- where id in (
--   'replace-with-unwanted-order-id-1',
--   'replace-with-unwanted-order-id-2'
-- );

-- 4. If an approved order belongs to the correct buyer email but has the wrong user_id,
-- find the buyer's current auth user id first:
--
-- select id, email
-- from auth.users
-- where email = 'buyer-email@example.com';
--
-- Then repair that specific order:
--
-- update public.orders
-- set user_id = 'replace-with-buyer-auth-user-id'
-- where id = 'replace-with-approved-order-id';
