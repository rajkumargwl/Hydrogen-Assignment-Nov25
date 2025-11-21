# How to Get Your Admin API Access Token

## The Problem
Your Admin API access token is masked (hidden) and you can't see it again. You need to **regenerate** it to get a new one.

## Solution: Regenerate the Token

### Option 1: Regenerate Existing Token (If Available)

1. Go to **Shopify Admin** > **Settings** > **Apps and sales channels**
2. Click **"Develop apps"**
3. Find your app (the one you created earlier)
4. Click on it to open
5. Go to **"API credentials"** tab
6. Look for **"Admin API access token"** section
7. If you see a **"Regenerate"** or **"Reveal token"** button, click it
8. **Copy the new token immediately** (it starts with `shpat_`)
9. Add it to your `.env` file

### Option 2: Create a New App (Recommended)

If you can't regenerate, create a fresh app:

1. Go to **Shopify Admin** > **Settings** > **Apps and sales channels**
2. Click **"Develop apps"**
3. Click **"Create an app"**
4. Name it: **"Custom Pricing Draft Orders"**
5. Click **"Create app"**

6. **Set Permissions:**
   - Go to **"Configuration"** tab
   - Scroll to **"Admin API access scopes"**
   - Find and enable: **`write_draft_orders`**
   - Click **"Save"**

7. **Get the Token:**
   - Go to **"API credentials"** tab
   - Click **"Install app"** button
   - After installation, you'll see **"Admin API access token"**
   - **Copy it immediately** (it starts with `shpat_`)
   - ⚠️ **You can only see it once!** Save it somewhere safe.

8. **Add to .env:**
   ```bash
   SHOPIFY_ADMIN_API_TOKEN=shpat_paste_your_token_here
   ```

9. **Restart your dev server**

## Important Notes:

- ✅ Token must start with `shpat_`
- ✅ Must have `write_draft_orders` permission enabled
- ✅ Copy it immediately - you can't see it again
- ✅ Add to `.env` file (root directory)
- ✅ Restart server after adding

## Verify Token Format:

Your token should look like:
```
shpat_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

If it doesn't start with `shpat_`, it's the wrong token type.

## After Getting Token:

1. Add to `.env`:
   ```bash
   SHOPIFY_ADMIN_API_TOKEN=shpat_your_actual_token_here
   ```

2. Restart dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. Test checkout - should work now!

## About the `/private_access_tokens` Error

The error you're seeing for `/private_access_tokens` is a different issue - that's related to customer account authentication, not Admin API. The Admin API token we need is separate and should fix the draft order creation.

