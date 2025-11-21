# Quick Fix - Add Your Token

## Your Token:
```
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
```

## Steps:

### 1. Add to `.env` file (root directory):

```bash
SHOPIFY_ADMIN_API_TOKEN=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
PUBLIC_STORE_DOMAIN=gwl-adarsh.myshopify.com
```

**Important:**
- No spaces around `=`
- No quotes around the token
- Make sure `PUBLIC_STORE_DOMAIN` matches your shop (from the error URL: `gwl-adarsh.myshopify.com`)

### 2. Restart Your Dev Server:

```bash
# Stop server (Ctrl+C in terminal)
npm run dev
```

### 3. Verify Token Has Permission:

1. Go to **Shopify Admin** > **Settings** > **Apps and sales channels**
2. Click **"Develop apps"**
3. Find the app that has this token
4. Go to **"Configuration"** > **"Admin API access scopes"**
5. Make sure **`write_draft_orders`** is enabled
6. If not, enable it and click **"Save"**

### 4. Test:

1. Add product to cart
2. Go to cart page
3. Click **"Continue to Checkout"**
4. Should create draft order and redirect

## About the `/private_access_tokens` Error

The error you're seeing:
```
GET https://gwl-adarsh.myshopify.com/private_access_tokens?id=...
```

This is a **Shopify internal endpoint** for checkout authentication. It's **NOT related to our draft order solution**. This error might appear in the console but won't affect draft order creation.

The draft order will use a different checkout URL (draft order invoice URL), so this error can be ignored.

## If Still Getting 401 on Draft Order:

Check your server console logs. You should see detailed error messages. Common issues:

1. **Token not in .env** → Add it
2. **Server not restarted** → Restart after adding token
3. **Wrong shop domain** → Should be `gwl-adarsh.myshopify.com`
4. **Missing permission** → Enable `write_draft_orders` scope

