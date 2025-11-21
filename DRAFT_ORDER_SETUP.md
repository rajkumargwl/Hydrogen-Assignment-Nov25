# Draft Order Setup for Checkout Pricing

## Problem
Checkout shows $0.00 total even though cart has items with custom pricing.

## Solution
Use Draft Orders via Admin API to create orders with correct custom pricing before checkout.

## Quick Setup (5 Minutes)

### Step 1: Get Admin API Token

**⚠️ IMPORTANT: You can only see the Admin API access token ONCE after creating it. Copy it immediately!**

1. Go to **Shopify Admin** > **Settings** > **Apps and sales channels**
2. Click **"Develop apps"** (or "Create an app" if first time)
3. Click **"Create an app"**
4. Name it: **"Custom Pricing Draft Orders"**
5. Click **"Create app"**
6. Go to **"Configuration"** tab
7. Scroll to **"Admin API access scopes"**
8. Enable this scope:
   - ✅ `write_draft_orders` (REQUIRED)
9. Click **"Save"**
10. Go to **"API credentials"** tab
11. Click **"Install app"** button
12. **IMMEDIATELY copy the "Admin API access token"** (starts with `shpat_...`)
    - ⚠️ **You can only see it once!** 
    - ⚠️ If you see it masked (••••••), you need to create a NEW app
    - ⚠️ Save it somewhere safe before closing the page

### Step 2: Add to Environment Variables

Add to your `.env` file:

```bash
SHOPIFY_ADMIN_API_TOKEN=shpat_your_token_here
```

**Important:** 
- Never commit `.env` to git
- Restart your dev server after adding

### Step 3: Test

1. Add products with custom pricing to cart
2. Go to cart page
3. Click **"Continue to Checkout"**
4. System will:
   - Create draft order with custom pricing
   - Redirect to draft order checkout
   - Show correct total (not $0.00)

## How It Works

1. **User clicks checkout** → Form submits to `/api/checkout/create-draft-order`
2. **Server creates draft order** via Admin API with:
   - All cart items
   - Custom pricing from cart attributes
   - Correct totals
3. **Redirects to draft order checkout** → Shows correct pricing

## Troubleshooting

### "Admin API token not configured"
- Make sure `SHOPIFY_ADMIN_API_TOKEN` is in `.env`
- Restart your dev server
- Check the token starts with `shpat_`

### "Failed to create draft order"
- Verify token has `write_draft_orders` permission
- Check shop domain is correct (`PUBLIC_STORE_DOMAIN` in `.env`)
- Check token is valid (not expired)

### Still showing $0.00
- Check draft order was created (Shopify Admin > Orders > Drafts)
- Verify custom pricing is in cart attributes
- Check browser console for errors

### "Cart is empty"
- Make sure cart has items before clicking checkout
- Verify cart ID is being passed

## Files Created

- `app/lib/draftOrder.js` - Draft order creation utility
- `app/routes/($locale).api.checkout.create-draft-order.jsx` - API route handler
- `app/components/CartSummary.jsx` - Updated checkout button

## Security Notes

- Admin API token has full store access
- Never expose token in client-side code (we're using server-side only ✅)
- Rotate tokens regularly
- Use environment variables only

## What Happens

1. **Cart Page**: Shows custom pricing correctly ✅
2. **Click Checkout**: Creates draft order with custom pricing ✅
3. **Draft Order Checkout**: Shows correct total ✅
4. **Order Created**: Order has correct pricing ✅

## Alternative: Shopify Functions

If you prefer not to use Admin API, you can use Shopify Functions (Cart Transform). See the `functions/cart-transform/` directory for that solution.

