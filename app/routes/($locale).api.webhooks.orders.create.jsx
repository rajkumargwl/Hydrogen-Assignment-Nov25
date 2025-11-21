// /**
//  * Webhook handler for order creation
//  * Saves custom pricing information to order metafields
//  * 
//  * To set up this webhook in Shopify Admin:
//  * 1. Go to Settings > Notifications > Webhooks
//  * 2. Click "Create webhook"
//  * 3. Event: Order creation
//  * 4. Format: JSON
//  * 5. URL: https://your-store.myshopify.com/api/webhooks/orders/create
//  * 6. API version: Latest
//  */

// import {json} from 'react-router';

// /**
//  * @param {Route.ActionArgs}
//  */
// export async function action({request, context}) {
//   if (request.method !== 'POST') {
//     return json({error: 'Method not allowed'}, {status: 405});
//   }

//   try {
//     const {env} = context;
//     const webhookData = await request.json();

//     // Verify webhook authenticity (optional but recommended)
//     // You should verify the X-Shopify-Hmac-SHA256 header
//     const hmac = request.headers.get('X-Shopify-Hmac-SHA256');
//     if (!hmac) {
//       console.warn('Webhook missing HMAC header');
//     }

//     const order = webhookData;

//     if (!order || !order.id) {
//       return json({error: 'Invalid order data'}, {status: 400});
//     }

//     // Extract custom pricing from line items
//     const orderMetafields = [];
    
//     if (order.line_items) {
//       for (const lineItem of order.line_items) {
//         // Check if line item has custom pricing attributes
//         const customPrice = lineItem.properties?.find(
//           (prop) => prop.name === '_customPrice'
//         );
//         const customFinalPrice = lineItem.properties?.find(
//           (prop) => prop.name === '_customFinalPrice'
//         );
//         const customDiscountType = lineItem.properties?.find(
//           (prop) => prop.name === '_customDiscountType'
//         );
//         const customDiscountValue = lineItem.properties?.find(
//           (prop) => prop.name === '_customDiscountValue'
//         );
//         const customDiscountAmount = lineItem.properties?.find(
//           (prop) => prop.name === '_customDiscountAmount'
//         );

//         if (customPrice) {
//           // Store custom pricing for this line item
//           orderMetafields.push({
//             namespace: 'custom',
//             key: `line_item_${lineItem.id}_original_price`,
//             value: customPrice.value,
//             type: 'single_line_text_field',
//           });

//           if (customFinalPrice) {
//             orderMetafields.push({
//               namespace: 'custom',
//               key: `line_item_${lineItem.id}_final_price`,
//               value: customFinalPrice.value,
//               type: 'single_line_text_field',
//             });
//           }

//           if (customDiscountType) {
//             orderMetafields.push({
//               namespace: 'custom',
//               key: `line_item_${lineItem.id}_discount_type`,
//               value: customDiscountType.value,
//               type: 'single_line_text_field',
//             });
//           }

//           if (customDiscountValue) {
//             orderMetafields.push({
//               namespace: 'custom',
//               key: `line_item_${lineItem.id}_discount_value`,
//               value: customDiscountValue.value,
//               type: 'single_line_text_field',
//             });
//           }

//           if (customDiscountAmount) {
//             orderMetafields.push({
//               namespace: 'custom',
//               key: `line_item_${lineItem.id}_discount_amount`,
//               value: customDiscountAmount.value,
//               type: 'single_line_text_field',
//             });
//           }
//         }
//       }
//     }

//     // Calculate and store order-level custom pricing totals
//     if (orderMetafields.length > 0) {
//       const totalCustomPrice = order.line_items
//         .map((item) => {
//           const customPrice = item.properties?.find(
//             (prop) => prop.name === '_customFinalPrice'
//           );
//           return customPrice
//             ? parseFloat(customPrice.value) * item.quantity
//             : parseFloat(item.price) * item.quantity;
//         })
//         .reduce((sum, price) => sum + price, 0);

//       orderMetafields.push({
//         namespace: 'custom',
//         key: 'order_custom_total',
//         value: totalCustomPrice.toFixed(2),
//         type: 'single_line_text_field',
//       });
//     }

//     // Note: To actually save these metafields, you need Admin API access
//     // This is a placeholder - you'll need to implement the Admin API call
//     // using Shopify Admin API or a serverless function with proper authentication
    
//     console.log('Order custom pricing data:', {
//       orderId: order.id,
//       orderName: order.name,
//       metafields: orderMetafields,
//     });

//     // In production, you would call Shopify Admin API here:
//     // await saveOrderMetafields(order.id, orderMetafields, env.SHOPIFY_ADMIN_API_TOKEN);

//     return json({
//       success: true,
//       message: 'Custom pricing data processed',
//       orderId: order.id,
//     });
//   } catch (error) {
//     console.error('Webhook error:', error);
//     return json({error: 'Internal server error'}, {status: 500});
//   }
// }

// /**
//  * Helper function to save order metafields via Admin API
//  * This requires Admin API access token
//  * @param {string} orderId - Shopify order ID
//  * @param {Array} metafields - Array of metafield objects
//  * @param {string} adminApiToken - Shopify Admin API access token
//  */
// async function saveOrderMetafields(orderId, metafields, adminApiToken) {
//   if (!adminApiToken) {
//     console.warn('Admin API token not configured');
//     return;
//   }

//   const shopDomain = process.env.PUBLIC_STORE_DOMAIN;
//   const apiVersion = '2024-01';

//   for (const metafield of metafields) {
//     try {
//       const response = await fetch(
//         `https://${shopDomain}/admin/api/${apiVersion}/orders/${orderId}/metafields.json`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'X-Shopify-Access-Token': adminApiToken,
//           },
//           body: JSON.stringify({
//             metafield: {
//               namespace: metafield.namespace,
//               key: metafield.key,
//               value: metafield.value,
//               type: metafield.type,
//             },
//           }),
//         },
//       );

//       if (!response.ok) {
//         console.error(
//           `Failed to save metafield ${metafield.key}:`,
//           await response.text(),
//         );
//       }
//     } catch (error) {
//       console.error(`Error saving metafield ${metafield.key}:`, error);
//     }
//   }
// }

// /** @typedef {import('./+types/api.webhooks.orders.create').Route} Route */

