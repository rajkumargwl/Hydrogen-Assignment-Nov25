/**
 * Draft Order Utilities
 * Creates draft orders with custom pricing via Shopify Admin API
 */

/**
 * Creates a draft order from cart with custom pricing
 * @param {Object} cart - Cart object from Storefront API
 * @param {string} adminApiToken - Shopify Admin API access token
 * @param {string} shopDomain - Shop domain (e.g., 'your-store.myshopify.com')
 * @returns {Promise<Object>} - Draft order object with checkout URL
 */
export async function createDraftOrderFromCart(
  cart,
  adminApiToken,
  shopDomain,
) {
  if (!adminApiToken) {
    throw new Error('Admin API token is required');
  }

  if (!cart?.lines?.nodes || cart.lines.nodes.length === 0) {
    throw new Error('Cart is empty');
  }

  // Ensure shop domain doesn't have https:// prefix
  const cleanShopDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const apiVersion = '2024-01';
  const url = `https://${cleanShopDomain}/admin/api/${apiVersion}/draft_orders.json`;

  // Build line items with custom pricing
  const lineItems = cart.lines.nodes
    .map((line) => {
      const {merchandise, quantity} = line;

      // Log line attributes for debugging
      console.log('Processing cart line:', {
        lineId: line.id,
        quantity,
        attributes: line.attributes,
        merchandisePrice: merchandise.price?.amount,
      });

      // Get custom pricing from cart line attributes
      const customPriceAttr = line.attributes?.find(
        (attr) => attr.key === '_customFinalPrice',
      );
      const customCurrencyAttr = line.attributes?.find(
        (attr) => attr.key === '_customCurrency',
      );

      console.log('Custom price attributes:', {
        customPriceAttr: customPriceAttr?.value,
        customCurrencyAttr: customCurrencyAttr?.value,
        allAttributes: line.attributes?.map(a => ({key: a.key, value: a.value})),
      });

      // Extract variant ID (remove 'gid://shopify/ProductVariant/' prefix)
      let variantId = merchandise.id;
      if (variantId.startsWith('gid://shopify/ProductVariant/')) {
        variantId = variantId.replace('gid://shopify/ProductVariant/', '');
      }

      const variantIdNum = parseInt(variantId, 10);
      if (isNaN(variantIdNum)) {
        console.error('Invalid variant ID:', merchandise.id);
        return null;
      }

      // Apply custom pricing if available
      let lineItem;
      
      if (customPriceAttr?.value && customCurrencyAttr?.value) {
        const customPrice = parseFloat(customPriceAttr.value);
        console.log('Applying custom price:', {
          rawValue: customPriceAttr.value,
          parsedPrice: customPrice,
          isValid: !isNaN(customPrice) && customPrice > 0,
        });
        
        if (!isNaN(customPrice) && customPrice > 0) {
          // For custom pricing, create a custom line item (without variant_id)
          // This allows us to set any price while still tracking the variant
          // We'll include variant info in the title for reference
          const productTitle = merchandise.product?.title || merchandise.title || 'Product';
          const variantTitle = merchandise.title || '';
          const fullTitle = variantTitle ? `${productTitle} - ${variantTitle}` : productTitle;
          
          lineItem = {
            title: fullTitle,
            price: customPrice.toString(),
            quantity: quantity || 1,
            requires_shipping: merchandise.requiresShipping !== false,
            taxable: merchandise.taxable !== false,
            // Store variant ID in properties for reference
            properties: [
              {name: '_variant_id', value: String(variantIdNum)},
              {name: '_product_id', value: String(merchandise.product?.id?.replace('gid://shopify/Product/', '') || '')},
            ],
          };
          
          // Add SKU if available
          if (merchandise.sku) {
            lineItem.sku = merchandise.sku;
          }
          
          console.log(' Custom line item created with custom price:', {
            title: lineItem.title,
            price: lineItem.price,
            quantity: lineItem.quantity,
          });
        } else {
          console.warn(' Custom price is invalid or zero, using variant with default price');
          // Fall through to variant-based line item
        }
      }
      
      // If no custom pricing or fallback, use variant-based line item
      if (!lineItem) {
        lineItem = {
          variant_id: variantIdNum,
          quantity: quantity || 1,
        };
        
        // Use default variant price if available
        if (merchandise.price?.amount) {
          lineItem.price = merchandise.price.amount;
          console.log('Using default variant price:', lineItem.price);
        } else {
          console.error('❌ No price available for variant!');
        }
      }

      console.log('Final line item:', lineItem);
      return lineItem;
    })
    .filter((item) => item !== null); // Remove null items

  if (lineItems.length === 0) {
    throw new Error('No valid line items to create draft order');
  }

  // Get customer email from cart if available
  // This helps generate invoice_url for the draft order
  const customerEmail = cart.buyerIdentity?.email || cart.buyerIdentity?.customer?.email;
  
  // Create draft order payload
  // Note: Including customer email helps ensure invoice_url is generated
  const draftOrderData = {
    draft_order: {
      line_items: lineItems,
      use_customer_default_address: true,
      note: 'Custom pricing applied from metafields',
      tags: 'custom-pricing',
      // Include customer email if available - this helps generate invoice_url
      ...(customerEmail && {email: customerEmail}),
      // Ensure invoice is sent (this helps generate invoice_url)
      send_receipt: false,
      send_fulfillment_receipt: false,
    },
  };
  
  console.log('Draft order payload:', {
    lineItemsCount: lineItems.length,
    hasCustomerEmail: !!customerEmail,
    customerEmail: customerEmail ? '***' : 'none',
    lineItems: lineItems.map(item => ({
      hasVariantId: !!item.variant_id,
      hasTitle: !!item.title,
      price: item.price,
      quantity: item.quantity,
      custom: item.custom,
    })),
  });

  try {
    // Validate token format
    if (!adminApiToken || !adminApiToken.startsWith('shpat_')) {
      throw new Error(
        'Invalid Admin API token format. Token should start with "shpat_"',
      );
    }

    console.log('Creating draft order:', {
      url,
      shopDomain: cleanShopDomain,
      lineItemsCount: lineItems.length,
      tokenPrefix: adminApiToken.substring(0, 10) + '...',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminApiToken,
      },
      body: JSON.stringify(draftOrderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to create draft order: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed (401). Please check your SHOPIFY_ADMIN_API_TOKEN. Make sure it has write_draft_orders permission and is correctly set in .env file.';
      } else if (response.status === 403) {
        errorMessage = 'Permission denied (403). The Admin API token needs write_draft_orders scope. Go to app settings and enable this permission.';
      } else if (response.status === 404) {
        errorMessage = 'Shop not found (404). Please check PUBLIC_STORE_DOMAIN is correct in .env file.';
      }
      
      console.error('Draft order creation failed:', {
        status: response.status,
        statusText: response.statusText,
        url,
        shopDomain: cleanShopDomain,
        error: errorText,
      });
      
      throw new Error(`${errorMessage} - ${errorText}`);
    }

    const data = await response.json();
    const draftOrder = data.draft_order;

    // Log full response for debugging
    console.log('=== DRAFT ORDER API RESPONSE ===');
    console.log('Full draft order object:', JSON.stringify(draftOrder, null, 2));
    console.log('Invoice URL:', draftOrder.invoice_url);
    console.log('Order object:', draftOrder.order);
    console.log('Status:', draftOrder.status);
    console.log('All fields:', Object.keys(draftOrder));
    console.log('================================');

    // Draft orders use invoice_url for checkout
    // This is the URL that customers use to complete the order
    // invoice_url is the direct link to pay for the draft order
    let invoiceUrl = draftOrder.invoice_url;
    
    // If invoice_url is not immediately available, we need to send the invoice
    // or fetch the draft order again to get the invoice_url
    if (!invoiceUrl) {
      console.log('Invoice URL not in initial response, fetching draft order details...');
      
      // Fetch the draft order again to get invoice_url
      // Sometimes it's generated asynchronously
      const getUrl = `https://${cleanShopDomain}/admin/api/${apiVersion}/draft_orders/${draftOrder.id}.json`;
      
      try {
        const getResponse = await fetch(getUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': adminApiToken,
          },
        });

        if (getResponse.ok) {
          const getData = await getResponse.json();
          invoiceUrl = getData.draft_order?.invoice_url;
          console.log('Fetched invoice URL:', invoiceUrl);
        }
      } catch (fetchError) {
        console.warn('Could not fetch draft order details:', fetchError);
      }
    }
    
    if (!invoiceUrl) {
      console.error('Draft order response:', JSON.stringify(draftOrder, null, 2));
      throw new Error('Draft order created but invoice_url is not available. You may need to send the invoice first or check draft order settings.');
    }

    return {
      id: draftOrder.id,
      name: draftOrder.name,
      checkoutUrl: invoiceUrl, // Use invoice_url as checkout URL
      invoiceUrl: invoiceUrl,
      status: draftOrder.status,
    };
  } catch (error) {
    console.error('Error creating draft order:', error);
    throw error;
  }
}

