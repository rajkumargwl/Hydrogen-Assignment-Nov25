# Fixing 401 Authentication Error

## Error: "Failed to load resource: the server responded with a status of 401"

This means your Admin API token is either missing, invalid, or doesn't have the right permissions.

## Quick Fix Steps:

### Step 1: Verify Token is Set

Check your `.env` file has:
```bash
SHOPIFY_ADMIN_API_TOKEN=shpat_your_token_here
```

**Important:**
- Token must start with `shpat_`
- No spaces around the `=`
- Restart your dev server after adding/updating

### Step 2: Get a Valid Token

1. Go to **Shopify Admin** > **Settings** > **Apps and sales channels**
2. Click **"Develop apps"**
3. Find your app (or create new: "Custom Pricing Admin API")
4. Go to **"Configuration"** > **"Admin API access scopes"**
5. Make sure **`write_draft_orders`** is enabled
6. Click **"Save"**
7. Go to **"API credentials"** tab
8. Click **"Install app"** (if not already installed)
9. **Copy the "Admin API access token"** (starts with `shpat_`)

### Step 3: Update .env File

Replace the token in your `.env`:
```bash
SHOPIFY_ADMIN_API_TOKEN=shpat_paste_your_new_token_here
```

### Step 4: Restart Server

**Stop your dev server** (Ctrl+C) and **restart it**:
```bash
npm run dev
```

## Common Issues:

### Token doesn't start with "shpat_"
- You might have copied the wrong token
- Make sure you're copying the **"Admin API access token"**, not the Client ID or Client Secret

### Token has wrong permissions
- Go to app settings > Admin API access scopes
- Enable: `write_draft_orders`
- Click "Save"
- Reinstall the app to get a new token with permissions

### Token expired
- If you regenerated the token, you need to update `.env`
- Old tokens stop working when regenerated

### .env file not being read
- Make sure `.env` is in the root directory (same level as `package.json`)
- Restart dev server after changes
- Check for typos in variable name: `SHOPIFY_ADMIN_API_TOKEN`

## Verify It's Working:

1. Check server logs - should NOT show "SHOPIFY_ADMIN_API_TOKEN is not set"
2. Try checkout again
3. Should create draft order successfully (check Shopify Admin > Orders > Drafts)

## Still Getting 401?

1. **Double-check token** - Copy it fresh from Shopify Admin
2. **Verify permissions** - `write_draft_orders` must be enabled
3. **Check shop domain** - Make sure `PUBLIC_STORE_DOMAIN` matches your shop
4. **Check server logs** - Look for detailed error messages

## Test Token Manually:

You can test if your token works by running this in your browser console (on your site):

```javascript
fetch('https://YOUR_SHOP.myshopify.com/admin/api/2024-01/draft_orders.json', {
  headers: {
    'X-Shopify-Access-Token': 'YOUR_TOKEN_HERE'
  }
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e));
```

If you get 401, the token is invalid. If you get 200 or 403, the token works but might need permissions.

