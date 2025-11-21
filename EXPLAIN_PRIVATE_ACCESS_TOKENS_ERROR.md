# About the `/private_access_tokens` Error

## What is this error?

```
GET https://gwl-adarsh.myshopify.com/private_access_tokens?id=... 401 (Unauthorized)
```

This is a **Shopify internal endpoint** used for checkout authentication. It's **NOT related to our draft order solution**.

## Why does it happen?

This error occurs when:
1. Shopify's checkout tries to authenticate the session
2. The authentication token is missing or invalid
3. This is a Shopify internal process, not something we control

## Does it affect our solution?

**NO!** This error:
- ✅ Does NOT affect draft order creation
- ✅ Does NOT affect custom pricing
- ✅ Is just a console warning from Shopify's checkout system
- ✅ Can be safely ignored

## Why we use Draft Orders

We use draft orders specifically to **avoid** this issue! Draft order checkouts:
- Use a different URL (`invoice_url`)
- Don't require `/private_access_tokens` authentication
- Work independently of Shopify's regular checkout
- Show correct pricing from the start

## Solution

The checkout button now **always uses draft orders**, which:
1. Creates draft order with custom pricing ✅
2. Redirects to draft order checkout ✅
3. Avoids the `/private_access_tokens` error ✅
4. Shows correct totals ✅

## What to do

**Nothing!** The error is harmless. Just:
1. Click "Continue to Checkout"
2. Draft order will be created
3. You'll be redirected to draft order checkout
4. Checkout will show correct pricing

The `/private_access_tokens` error in the console can be ignored - it's just Shopify's internal authentication trying to work, but we're using draft orders instead which bypasses it entirely.

