/**
 * API Route to create draft order with custom pricing
 * This route intercepts checkout and creates a draft order with custom pricing
 * 
 * POST /api/checkout/create-draft-order
 * Body: { cartId: string }
 */

import {data, redirect} from 'react-router';
import {createDraftOrderFromCart} from '~/lib/draftOrder';
import {getCustomPriceFromCartLine} from '~/lib/cartPricing';

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  try {
    const {env, cart} = context;

    // Check for Admin API token
    if (!env.SHOPIFY_ADMIN_API_TOKEN) {
      console.error('SHOPIFY_ADMIN_API_TOKEN is not set');
      return data(
        {
          error: 'Admin API token not configured',
          message:
            'Please set SHOPIFY_ADMIN_API_TOKEN in your .env file. See DRAFT_ORDER_SETUP.md for instructions.',
        },
        {status: 500},
      );
    }

    // Validate token format
    if (!env.SHOPIFY_ADMIN_API_TOKEN.startsWith('shpat_')) {
      return data(
        {
          error: 'Invalid Admin API token format',
          message:
            'The Admin API token should start with "shpat_". Please check your .env file and ensure you copied the correct token from Shopify Admin.',
        },
        {status: 500},
      );
    }

    // Get cart data
    const formData = await request.formData();
    const cartId = formData.get('cartId');

    if (!cartId) {
      return data({error: 'Cart ID is required'}, {status: 400});
    }

    // Fetch full cart data
    const cartData = await cart.get(cartId);
    // you will gewt cart data here
    if (!cartData || !cartData.lines?.nodes || cartData.lines.nodes.length === 0) {
      return data({error: 'Cart is empty'}, {status: 400});
    }

    // Check if cart has custom pricing
    let hasCustomPricing = false;
    cartData.lines.nodes.forEach((line) => {
      const customPrice = getCustomPriceFromCartLine(line);
      if (customPrice) {
        hasCustomPricing = true;
      }
    });

    // Get shop domain
    const shopDomain = env.PUBLIC_STORE_DOMAIN || env.PUBLIC_CHECKOUT_DOMAIN;
    if (!shopDomain) {
      console.error('Shop domain not found in env:', {
        PUBLIC_STORE_DOMAIN: env.PUBLIC_STORE_DOMAIN,
        PUBLIC_CHECKOUT_DOMAIN: env.PUBLIC_CHECKOUT_DOMAIN,
      });
      return data({error: 'Shop domain not configured'}, {status: 500});
    }

    console.log('Preparing to create draft order:', {
      cartId,
      lineItemsCount: cartData.lines.nodes.length,
      shopDomain,
      hasCustomPricing,
    });

    // Create draft order with custom pricing
    // This will work even if some items don't have custom pricing
    const draftOrder = await createDraftOrderFromCart(
      cartData,
      env.SHOPIFY_ADMIN_API_TOKEN,
      shopDomain,
    );

    console.log('Draft order created successfully:', {
      draftOrderId: draftOrder.id,
      draftOrderName: draftOrder.name,
      checkoutUrl: draftOrder.checkoutUrl,
      invoiceUrl: draftOrder.invoiceUrl,
    });

    // Draft order invoice URL is the checkout URL
    // This should be a URL like: https://gwl-adarsh.myshopify.com/.../invoices/...
    const checkoutUrl = draftOrder.invoiceUrl || draftOrder.checkoutUrl;
    
    if (!checkoutUrl) {
      console.error('No checkout URL in draft order:', draftOrder);
      return data(
        {error: 'Draft order created but no checkout URL available'},
        {status: 500},
      );
    }

    // Verify it's an invoice URL, not a regular checkout URL
    if (checkoutUrl.includes('/checkouts/do/')) {
      console.error(' ERROR: Got regular checkout URL instead of draft order invoice URL!');
      console.error('Expected invoice URL format: https://{shop}/.../invoices/...');
      console.error('Got:', checkoutUrl);
      console.error('This means invoice_url was not returned from the API.');
      console.error('Draft order details:', {
        id: draftOrder.id,
        name: draftOrder.name,
        invoiceUrl: draftOrder.invoiceUrl,
        checkoutUrl: draftOrder.checkoutUrl,
      });
      
      return data(
        {
          error: 'Draft order created but invoice URL not available',
          message: 'The draft order was created successfully, but the invoice URL is not available. Please check the draft order in Shopify Admin and use the invoice URL from there.',
          draftOrderId: draftOrder.id,
          draftOrderName: draftOrder.name,
        },
        {status: 500},
      );
    }

    console.log(' Redirecting to draft order checkout:', checkoutUrl);
    
    // Redirect to draft order checkout (invoice URL)
    return redirect(checkoutUrl);
  } catch (error) {
    console.error('Error creating draft order:', error);
    return data(
      {
        error: 'Failed to create draft order',
        message: error.message,
      },
      {status: 500},
    );
  }
}

/** @typedef {import('./+types/api.checkout.create-draft-order').Route} Route */

