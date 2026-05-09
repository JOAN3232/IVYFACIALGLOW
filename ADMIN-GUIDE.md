# IvyFacialGlow Admin Guide

This guide is for the store owner or anyone managing products and orders.

## Admin Login

Open this page to sign in as admin:

```text
admin-login.html
```

The current admin email allowed in Supabase is:

```text
ivyfacialsaesthetics@gmail.com
```

If the owner wants to use a different admin email, update that email in both SQL setup files, then run the files again in Supabase SQL Editor.

Files to update:

```text
supabase-products-setup.sql
supabase-orders-setup.sql
```

## First-Time Supabase Setup

Before the live website is used, run these files in Supabase SQL Editor:

```text
supabase-products-setup.sql
supabase-orders-setup.sql
```

The products setup creates the online product table and product image upload bucket.
The orders setup creates the online order table and permissions.

## Managing Products

From the admin dashboard, the admin can:

- Add a new product
- Upload a product image from the phone or computer
- Edit product name, price, category, description, fun fact, and image
- Edit both original products and newly added products
- Remove products that are no longer available

After editing a product, refresh the shop page to confirm the update appears.

## Managing Orders

When a customer places an order:

- The order appears in the admin dashboard
- The order status starts as pending
- The admin can move the order through each delivery stage
- The buyer will see the status update on their orders page

If a customer cancels a pending order, it should no longer appear on the buyer side or admin side.

Delivery stages:

```text
Pending -> Approved -> Preparing -> Out for Delivery -> Delivered
```

The admin should click the next status button whenever the order moves forward.

## Buyer Login

Customers should use:

```text
login.html
signup.html
```

Admin should use only:

```text
admin-login.html
```

This keeps admin login separate from buyer login.

## Before Publishing

Check these before giving the website to the owner:

- Confirm product add, edit, and remove work
- Confirm image upload works from a phone
- Confirm buyer checkout creates only one order
- Confirm admin can approve the order
- Confirm buyer sees the approved status
- Confirm pending order cancel works
- Confirm all main pages open on mobile
- Confirm the final admin email is correct in both SQL files

## Important Note

This project uses Supabase in the browser, so the admin email rules in the SQL files are important. Do not give admin access to a normal customer email unless that person should manage the store.
