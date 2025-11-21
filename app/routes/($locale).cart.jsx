import {useLoaderData} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';

// Custom price calculation logic 
/**
 * @param {object} productData 
 * @param {object} variantData 
 * @returns {object} 
 */
function calculateCustomPrice(productData, variantData) {
  const product = productData;
  const variant = variantData;

  if (!product || !variant) {
    return { customPrice: null, originalPrice: null, appliedDiscountType: null };
  }

  let originalPrice = null;
  let currencyCode = 'INR';
  let fixedAmount = 0;
  
  // --- 1. Extract and Parse Base Price (Product Metafield) ---
  const basePriceMetafieldValue = product.customPrice?.value; 
  
  if (basePriceMetafieldValue) {
    try {
      const parsedBasePriceObject = JSON.parse(basePriceMetafieldValue);
      
      originalPrice = parseFloat(parsedBasePriceObject.amount);
      currencyCode = parsedBasePriceObject.currency_code || currencyCode; 

    } catch (e) {
      console.error("Error parsing base price JSON string:", e);
    }
  }
  
  // Fallback if metafield base price is missing: use the variant's current price
  if (isNaN(originalPrice) || originalPrice <= 0) {
     if (variant.price?.amount) {
         originalPrice = parseFloat(variant.price.amount);
         currencyCode = variant.price.currencyCode;
     } else {
         return { customPrice: null, originalPrice: null, appliedDiscountType: null };
     }
  }

  let finalPrice = originalPrice;
  let appliedDiscountType = 'None';

  // --- 2. Extract and Parse Discount Values ---
  const percentageValue = parseFloat(product.discountPercentage?.value);
  
  // Fixed Discount Amount (Money type, needs parsing)
  const fixedAmountMetafieldValue = product.discountFixedAmount?.value;
  if (fixedAmountMetafieldValue) {
      try {
          const parsedFixedObject = JSON.parse(fixedAmountMetafieldValue);
          fixedAmount = parseFloat(parsedFixedObject.amount);
      } catch (e) {
          console.error("Error parsing fixed discount JSON string:", e);
      }
  }

  // --- 3. Implement Max Discount Logic ---
  let percentageSavings = 0;
  if (!isNaN(percentageValue) && percentageValue > 0) {
    percentageSavings = (originalPrice * percentageValue) / 100;
  }

  let fixedSavings = fixedAmount;

  if (percentageSavings >= fixedSavings) {
    if (percentageSavings > 0) {
      finalPrice = originalPrice - percentageSavings;
      appliedDiscountType = `${Math.round(percentageValue)}% OFF`;
    }
  } else {
    finalPrice = originalPrice - fixedSavings;
    appliedDiscountType = `SAVED ${fixedSavings.toFixed(2)} ${currencyCode}`; 
  }

  finalPrice = Math.max(0, finalPrice);

  return {
    customPrice: finalPrice.toFixed(2),
    originalPrice: originalPrice.toFixed(2),
    appliedDiscountType,
  };
}

// Convert Storefront API ID to Admin API ID format
function convertStorefrontIdToAdmin(storefrontId) {
  try {
    const match = storefrontId.match(/\/ProductVariant\/(\d+)/);
    if (match) {
      return `gid://shopify/ProductVariant/${match[1]}`;
    }
    return storefrontId;
  } catch (error) {
    console.error('Error converting storefront ID:', error);
    return storefrontId;
  }
}

const DRAFT_ORDER_CREATE_MUTATION = `#graphql
  mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        invoiceUrl
        lineItems(first: 250) {
          nodes {
            id
            title
            variant {
              id
            }
            originalUnitPriceSet {
              shopMoney {
                amount
              }
            }
            discountedUnitPriceSet {
              shopMoney {
                amount
              }
            }
            image {
              url
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

//Fetch the entire product by handle
const GET_PRODUCT_AND_VARIANT_DATA_FOR_CART_REFRESH = `#graphql
  query getProductAndVariantDataForCartRefresh($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage {
        url
        altText
      }
      priceRange {
          minVariantPrice {
              amount
              currencyCode
          }
      }
      # Fetch custom price metafields
      customPrice: metafield(key: "price", namespace: "custom_pricing") {
          value
      }
      discountPercentage: metafield(key: "discount_percentage", namespace: "custom_pricing") {
          value
      }
      discountFixedAmount: metafield(key: "discount_fixed_amount", namespace: "custom_pricing") {
          value
      }
      # Fetch all variants to find the specific one by ID
      variants(first: 10) { 
          nodes {
              id
              price {
                  amount
                  currencyCode
              }
              compareAtPrice {
                  amount
                  currencyCode
              }
          }
      }
    }
  }
`;

// Extract and inject custom price from line item attributes
function injectCustomPrice(line) {
  try {
    const customPriceAttribute = (line.attributes ?? []).find(
      (attr) => attr.key === '_custom_unit_price',
    );
    const customPriceValue = customPriceAttribute?.value;

    if (customPriceValue) {
      const priceAmount = parseFloat(customPriceValue);
      
      if (!isNaN(priceAmount) && priceAmount >= 0) {
        const priceString = priceAmount.toFixed(2);
        
        return {
          ...line,
          cost: {
            amount: priceString,
          },
          customPriceString: priceString,
        };
      }
    }
    
    return line;
  } catch (error) {
    console.error('Error injecting custom price:', error);
    return line;
  }
}

// Convert cart to draft order with proper discount handling
async function convertCartToDraftOrder({adminClient, storefrontCart}) {
  if (!adminClient) {
    throw new Error('Admin client not available.');
  }
  if (!storefrontCart) {
    throw new Error('Cart data is required to create a draft order.');
  }
  if (!storefrontCart.lines?.nodes?.length) {
    throw new Error('Cannot create draft order from an empty cart.');
  }

  const finalLineItemsInput = [];
  const errors = [];

  // Process each line item
  for (const line of storefrontCart.lines.nodes) {
    try {
      const lineWithCustomPrice = injectCustomPrice({
        id: line.id,
        quantity: line.quantity,
        attributes: line.attributes,
        merchandise: line.merchandise,
      });

      const customPrice = lineWithCustomPrice.customPriceString;
      const adminVariantId = convertStorefrontIdToAdmin(line.merchandise.id);

      if (customPrice) {
        // Create custom line item for products with a custom/discounted price
        const customLineItem = {
          title: line.merchandise.product?.title || 'Product',
          quantity: line.quantity,
          originalUnitPrice: parseFloat(customPrice), 
          taxable: true,
          customAttributes: [
            ...line.attributes.map(attr => ({ key: attr.key, value: attr.value })),
            { key: '_variant_id', value: line.merchandise.id }
          ]
        };
        
        finalLineItemsInput.push(customLineItem);
        
      } else {
        // No custom price - use regular variant line item without any modifications
        const regularLineItem = {
          variantId: adminVariantId,
          quantity: line.quantity,
          customAttributes: line.attributes.map(attr => ({ 
            key: attr.key, 
            value: attr.value 
          })),
        };
        
        finalLineItemsInput.push(regularLineItem);
      }
    } catch (error) {
      console.error(`Error processing line item ${line.id}:`, error);
      errors.push(`Failed to process item: ${line.merchandise.product?.title || 'Unknown'}`);
    }
  }

  if (errors.length > 0) {
    console.warn('Some line items had errors:', errors);
  }

  if (finalLineItemsInput.length === 0) {
    throw new Error('No valid line items to create draft order.');
  }

  // Prepare draft order input
  const createDraftOrderInput = {
    lineItems: finalLineItemsInput,
    email: storefrontCart.buyerIdentity?.email,
  };

  // Create the draft order
  try {
    const createResult = await adminClient.request(
      DRAFT_ORDER_CREATE_MUTATION,
      {
        variables: {
          input: createDraftOrderInput,
        },
      },
    );

    const draftOrder = createResult.data?.draftOrderCreate?.draftOrder;
    const userErrors = createResult.data?.draftOrderCreate?.userErrors;

    if (userErrors?.length || !draftOrder?.id) {
      const errorMessage = userErrors?.map(e => `${e.field}: ${e.message}`).join(', ') || 'Unknown error';
      throw new Error(`Failed to create Draft Order: ${errorMessage}`);
    }
    
    return draftOrder.invoiceUrl;
  } catch (error) {
    console.error('Draft order creation failed:', error);
    throw new Error(`Failed to create draft order: ${error.message}`);
  }
}

export const meta = () => {
  return [{title: `Hydrogen | Cart`}];
};

export const headers = ({actionHeaders}) => actionHeaders;

const CUSTOM_ACTIONS = {
  CHECKOUT_REDIRECT: 'CHECKOUT_REDIRECT'
};

export async function action({request, context}) {
  try {
    const {cart, admin} = context;

    const formData = await request.formData();
    const {action, inputs} = CartForm.getFormInput(formData);

    if (!action) {
      throw new Error('No action provided');
    }

    let result;
    const currentCart = await cart.get();
    const cartId = currentCart?.id;

    const inputLines = Array.isArray(inputs.lines) ? inputs.lines : [];
    let linesWithInjectedPrice;

    switch (action) {
      case CartForm.ACTIONS.LinesAdd:
        linesWithInjectedPrice = inputLines.map(injectCustomPrice);
        result = await cart.addLines(linesWithInjectedPrice);
        break;

      case CartForm.ACTIONS.LinesUpdate:
        linesWithInjectedPrice = inputLines.map(injectCustomPrice);
        result = await cart.updateLines(linesWithInjectedPrice);
        break;

      case CUSTOM_ACTIONS.CHECKOUT_REDIRECT:
        if (!cartId || !currentCart?.lines?.nodes?.length) {
          throw new Error('Cannot checkout an empty cart.');
        }
        
        const invoiceUrl = await convertCartToDraftOrder({
          adminClient: admin,
          storefrontCart: currentCart,
        });
        
        const headers = cartId ? cart.setCartId(cartId) : new Headers();
        headers.set('Location', invoiceUrl);
              
        return new Response(null, {status: 303, headers});

      case CartForm.ACTIONS.LinesRemove:
        result = await cart.removeLines(inputs.lineIds);
        break;

      case CartForm.ACTIONS.DiscountCodesUpdate: {
        const formDiscountCode = inputs.discountCode;
        const discountCodes = formDiscountCode ? [formDiscountCode] : [];
        discountCodes.push(...(Array.isArray(inputs.discountCodes) ? inputs.discountCodes : []));
        result = await cart.updateDiscountCodes(discountCodes);
        break;
      }

      case CartForm.ACTIONS.GiftCardCodesUpdate: {
        const formGiftCardCode = inputs.giftCardCode;
        const giftCardCodes = formGiftCardCode ? [formGiftCardCode] : [];
        giftCardCodes.push(...(Array.isArray(inputs.giftCardCodes) ? inputs.giftCardCodes : []));
        result = await cart.updateGiftCardCodes(giftCardCodes);
        break;
      }

      case CartForm.ACTIONS.GiftCardCodesRemove: {
        const appliedGiftCardIds = inputs.giftCardCodes;
        result = await cart.removeGiftCardCodes(appliedGiftCardIds);
        break;
      }

      case CartForm.ACTIONS.BuyerIdentityUpdate: {
        result = await cart.updateBuyerIdentity({
          ...inputs.buyerIdentity,
        });
        break;
      }

      default:
        throw new Error(`${action} cart action is not defined`);
    }

    let status = 200;
    const finalCart = result?.cart || (await cart.get());
    const finalCartId = finalCart?.id;
    const headers = finalCartId ? cart.setCartId(finalCartId) : new Headers();

    const redirectTo = formData.get('redirectTo') ?? null;
    if (typeof redirectTo === 'string') {
      status = 303;
      headers.set('Location', redirectTo);
      return new Response(null, {status, headers});
    }

    const responseData = {
      cart: finalCart,
      errors: result?.errors,
      warnings: result?.warnings,
      analytics: {
        cartId: finalCartId,
      },
    };
    
    return new Response(JSON.stringify(responseData), {
      status,
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Cart action error:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred processing your request',
      cart: null,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function loader({context}) {
  try {
    const {cart, storefront} = context;
    const currentCart = await cart.get();
    
    if (!currentCart?.lines?.nodes?.length) {
      return currentCart;
    }

    const linesToUpdate = [];
    
    for (const line of currentCart.lines.nodes) {
      try {
        const variantId = line.merchandise.id;
        const productHandle = line.merchandise.product.handle;

        if (!productHandle) {
          console.warn(`Could not find product handle for variant ${variantId}. Skipping line update.`);
          linesToUpdate.push({
            id: line.id,
            quantity: line.quantity,
            attributes: line.attributes || [],
          });
          continue;
        }

        // 1. Query backend for the entire product data using the handle
        const result = await storefront.query(GET_PRODUCT_AND_VARIANT_DATA_FOR_CART_REFRESH, {
          variables: {handle: productHandle},
        });
        
        const productData = result?.product; 
        
        if (productData) { 
          // 2. Find the specific variant within the fetched product data
          const specificVariant = productData.variants.nodes.find(
              (v) => v.id === variantId
          );

          if (specificVariant) {
            
            // 3. Pass BOTH the product data (for metafields) and the specific variant (for price/ID checks)
            const {customPrice, originalPrice, appliedDiscountType} = 
                calculateCustomPrice(productData, specificVariant); 
                
            // Ensure we have a valid custom price to apply
            if (customPrice) {
              
              // Get existing attributes excluding the custom price attributes
              const existingAttributes = (line.attributes || []).filter(
                attr => attr.key !== '_custom_unit_price' && 
                        attr.key !== '_original_unit_price' &&
                        attr.key !== '_discount_type'
              );
              
              // 4. Update cart line attributes with the newly calculated prices
              const updatedAttributes = [
                ...existingAttributes,
                { key: '_custom_unit_price', value: customPrice },
                { key: '_original_unit_price', value: originalPrice }, 
                { key: '_discount_type', value: appliedDiscountType }, 
              ];
              
              linesToUpdate.push({
                id: line.id,
                quantity: line.quantity,
                attributes: updatedAttributes,
              });
              
            } else {
              // No custom price calculated, keep existing line attributes
              linesToUpdate.push({
                id: line.id,
                quantity: line.quantity,
                attributes: line.attributes || [],
              });
            }
          } else {
             linesToUpdate.push({
              id: line.id,
              quantity: line.quantity,
              attributes: line.attributes || [],
            });
          }
          
        } else {
          linesToUpdate.push({
            id: line.id,
            quantity: line.quantity,
            attributes: line.attributes || [],
          });
        }
      } catch (error) {
        linesToUpdate.push({
          id: line.id,
          quantity: line.quantity,
          attributes: line.attributes || [],
        });
      }
    }
    
    // 5. Update the cart with the new attributes
    if (linesToUpdate.length > 0) {
      await cart.updateLines(linesToUpdate);
      return await cart.get();
    }
    
    // Return original cart if no updates were needed or items were found
    return currentCart;
    
  } catch (error) {
    console.error('Cart loader error:', error);
    throw new Response('Failed to load cart', {status: 500});
  }
}


export default function Cart() {
  const cart = useLoaderData();

  return (
    <div className="cart">
      <h1>Cart</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}