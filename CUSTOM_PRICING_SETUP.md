# Custom Pricing and Discount Management System

This document describes the custom pricing and discount management system implemented for the Shopify Hydrogen store.

## Overview

The system uses Shopify metafields to override default product pricing and apply custom discounts. It maintains price consistency throughout the entire customer journey from product pages to order confirmation.

## Metafields Setup

Three product metafields are required in Shopify Admin:

1. **custom.price** (Money type)
   - Namespace: `custom`
   - Key: `price`
   - Type: Money
   - Storefront API access: Enabled

2. **custom.discount_percentage** (Decimal type)
   - Namespace: `custom`
   - Key: `discount_percentage`
   - Type: Decimal
   - Storefront API access: Enabled

3. **custom.discount_fixed_amount** (Money type)
   - Namespace: `custom`
   - Key: `discount_fixed_amount`
   - Type: Money
   - Storefront API access: Enabled

## Pricing Logic

1. **Primary Price Source**: Always uses `custom.price` metafield, completely ignoring Shopify's default prices
2. **Discount Calculation**: Implements maximum discount logic:
   - Calculates discount from `custom.discount_percentage` (e.g., 15% of $100 = $15 off)
   - Calculates discount from `custom.discount_fixed_amount` (e.g., $35 off)
   - Applies whichever discount gives the customer MORE savings
   - Example: For a $100 product with 15% discount ($15 off) vs $35 fixed discount → Applies the $35 discount

## Implementation Details

### Frontend Components

#### Product Listing Pages (Collection Pages)
- **File**: `app/components/ProductItem.jsx`
- Displays custom price from metafields on every product card
- Shows original price with strikethrough formatting
- Shows final discounted price prominently
- Displays which discount type was applied (percentage or fixed amount)

#### Product Detail Pages
- **File**: `app/routes/($locale).products.$handle.jsx`
- Displays custom pricing system with full variant support
- Shows discount breakdown clearly
- Maintains same pricing logic as collection pages

#### Cart Page
- **File**: `app/components/CartLineItem.jsx`
- Displays custom calculated prices for all line items
- Shows discount information for each item
- Custom pricing is stored in cart line item attributes

#### Product Price Component
- **File**: `app/components/ProductPrice.jsx`
- Reusable component that handles custom pricing display
- Shows original price with strikethrough when discount is applied
- Displays discount information

### Utility Libraries

#### Custom Pricing Utilities
- **File**: `app/lib/customPricing.js`
- Functions:
  - `getCustomPriceMetafields(product)` - Extracts metafields from product
  - `calculateCustomPrice(metafields, currencyCode)` - Calculates maximum discount
  - `getVariantCustomPrice(variant, product, currencyCode)` - Gets pricing for variants
  - `formatAsMoneyV2(calculatedPrice)` - Formats for Hydrogen Money component

#### Cart Pricing Utilities
- **File**: `app/lib/cartPricing.js`
- Functions:
  - `getCartLineAttributes(variant, product, calculatedPrice)` - Stores pricing in cart attributes
  - `getCustomPriceFromCartLine(line)` - Retrieves pricing from cart line
  - `calculateCartTotalsWithCustomPricing(cart)` - Calculates cart totals

#### Order Pricing Utilities
- **File**: `app/lib/orderPricing.js`
- Functions:
  - `extractCustomPricingFromLineItem(lineItem)` - Extracts pricing from order line items
  - `prepareOrderMetafields(order)` - Prepares metafields for order

### GraphQL Queries

All product queries have been updated to fetch metafields:
- Collection queries (`app/routes/($locale).collections.$handle.jsx`)
- Product detail queries (`app/routes/($locale).products.$handle.jsx`)
- Cart queries (`app/lib/fragments.js`)

### Webhook Handler

- **File**: `app/routes/($locale).api.webhooks.orders.create.jsx`
- Handles order creation webhooks
- Saves custom pricing to order metafields
- Requires Admin API access token for full functionality

## Setup Instructions

### 1. Create Metafields in Shopify Admin

1. Go to Settings > Custom data > Products
2. Create the three metafields listed above
3. Ensure Storefront API access is enabled for all

### 2. Configure Webhook (Optional)

To save custom pricing to order metafields:

1. Go to Settings > Notifications > Webhooks
2. Click "Create webhook"
3. Event: Order creation
4. Format: JSON
5. URL: `https://your-store-domain.com/api/webhooks/orders/create`
6. API version: Latest

### 3. Environment Variables

If using the webhook to save order metafields, add to your `.env`:

```
SHOPIFY_ADMIN_API_TOKEN=your_admin_api_token
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
```

## Usage

### Adding Custom Pricing to Products

1. Go to a product in Shopify Admin
2. Scroll to the Metafields section
3. Set `custom.price` to your custom price (e.g., 100.00)
4. Optionally set `custom.discount_percentage` (e.g., 15 for 15%)
5. Optionally set `custom.discount_fixed_amount` (e.g., 35.00)
6. The system will automatically apply the maximum discount

### How It Works

1. **Product Pages**: Custom pricing is fetched via GraphQL and displayed
2. **Add to Cart**: Custom pricing is stored in cart line item attributes
3. **Cart Display**: Custom pricing is retrieved from attributes and displayed
4. **Checkout**: Custom pricing persists through checkout via cart attributes
5. **Order Creation**: Webhook saves custom pricing to order metafields

## Error Handling

The system gracefully handles:
- Missing metafields (falls back to Shopify default pricing)
- Invalid metafield values
- Missing currency codes (defaults to USD)
- Missing products/variants

## Performance Considerations

- Metafields are fetched in the same GraphQL query as products (no additional requests)
- Pricing calculations are done client-side for fast rendering
- Cart attributes are used to persist pricing without additional API calls

## Limitations

1. **Cart Totals**: Shopify's cart API still shows original prices in totals. Custom pricing is displayed in the UI but cart totals reflect Shopify's calculations.

2. **Checkout Pricing**: To fully override checkout pricing, you would need to:
   - Use Shopify Functions (cart transform)
   - Use Admin API to create draft orders
   - Use a custom checkout solution

3. **Order Metafields**: The webhook handler requires Admin API access to save metafields. Without it, the data is logged but not saved.

## Future Enhancements

- Implement Shopify Functions for cart price transformation
- Add Admin API integration for draft order creation
- Add order confirmation email customization with custom pricing
- Add analytics tracking for custom pricing usage

## Testing

To test the system:

1. Create a product with custom pricing metafields
2. Visit the product page - should show custom price
3. Add to cart - should show custom price in cart
4. Complete checkout - custom pricing should persist
5. Check order - custom pricing should be in order metafields (if webhook is configured)

## Support

For issues or questions, refer to:
- Shopify Metafields Documentation: https://shopify.dev/docs/apps/custom-data/metafields
- Hydrogen Documentation: https://shopify.dev/docs/custom-storefronts/hydrogen
- Storefront API: https://shopify.dev/docs/api/storefront

