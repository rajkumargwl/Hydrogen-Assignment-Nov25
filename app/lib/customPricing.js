/**
 * Custom Pricing Utility Library
 * Handles custom pricing calculations using metafields
 */

/**
 * @typedef {Object} CustomPriceMetafields
 * @property {string|null} price - Custom price from metafield (Money type)
 * @property {string|null} discountPercentage - Discount percentage from metafield (Decimal type)
 * @property {string|null} discountFixedAmount - Fixed discount amount from metafield (Money type)
 */

/**
 * @typedef {Object} CalculatedPrice
 * @property {string} originalPrice - Original price (from custom.price metafield)
 * @property {string} finalPrice - Final price after discount
 * @property {string} discountAmount - Amount of discount applied
 * @property {'percentage' | 'fixed' | null} discountType - Type of discount applied
 * @property {string|null} discountValue - The discount value (percentage or fixed amount)
 * @property {string} currencyCode - Currency code
 */

/**
 * Extracts metafield value from Shopify metafield object
 * @param {Object|null|undefined} metafield - Shopify metafield object
 * @returns {string|null} - The value or null if not found
 */
export function getMetafieldValue(metafield) {
  if (!metafield) return null;
  
  // Handle Money type metafields
  // In Storefront API, Money metafields return value as a JSON string
  // The structure is: {"amount":"100.00","currencyCode":"USD"}
  if (metafield.type === 'money' || metafield.type === 'money_decimal') {
    try {
      let parsed;
      if (typeof metafield.value === 'string') {
        parsed = JSON.parse(metafield.value);
      } else if (metafield.value && typeof metafield.value === 'object') {
        parsed = metafield.value;
      }
      
      if (parsed?.amount) {
        return String(parsed.amount);
      }
    } catch (e) {
      // If parsing fails, try direct access
      if (metafield.value?.amount) {
        return String(metafield.value.amount);
      }
      // Sometimes the value might be directly the amount
      if (typeof metafield.value === 'string' && !metafield.value.startsWith('{')) {
        return metafield.value;
      }
    }
  }
  
  // Handle Decimal/Number type metafields
  // For decimal types, value is typically a string or number
  if (metafield.value !== null && metafield.value !== undefined) {
    return String(metafield.value);
  }
  
  return null;
}

/**
 * Gets custom pricing metafields from a product
 * @param {Object} product - Product object with metafields
 * @returns {CustomPriceMetafields}
 */
export function getCustomPriceMetafields(product) {
  if (!product?.metafields) {
    return {
      price: null,
      discountPercentage: null,
      discountFixedAmount: null,
    };
  }

  // Handle both array and connection-style metafields
  let metafields = [];
  if (Array.isArray(product.metafields)) {
    metafields = product.metafields.filter((mf) => mf != null);
  } else if (product.metafields?.edges) {
    metafields = product.metafields.edges
      .map((edge) => edge?.node)
      .filter((node) => node != null);
  } else if (product.metafields?.nodes) {
    metafields = product.metafields.nodes.filter((mf) => mf != null);
  }

  // Filter out any null/undefined metafields and ensure they have required properties
  metafields = metafields.filter(
    (mf) => mf != null && mf.namespace != null && mf.key != null
  );

  const customPrice = metafields.find(
    (mf) => mf?.namespace === 'custom' && mf?.key === 'price'
  );
  const discountPercentage = metafields.find(
    (mf) => mf?.namespace === 'custom' && mf?.key === 'discount_percentage'
  );
  const discountFixedAmount = metafields.find(
    (mf) => mf?.namespace === 'custom' && mf?.key === 'discount_fixed_amount'
  );

  return {
    price: getMetafieldValue(customPrice),
    discountPercentage: getMetafieldValue(discountPercentage),
    discountFixedAmount: getMetafieldValue(discountFixedAmount),
  };
}

/**
 * Calculates the maximum discount and final price
 * @param {CustomPriceMetafields} metafields - Custom price metafields
 * @param {string} currencyCode - Currency code (default: 'USD')
 * @returns {CalculatedPrice|null} - Calculated price or null if no custom price
 */
export function calculateCustomPrice(metafields, currencyCode = 'USD') {
  const {price, discountPercentage, discountFixedAmount} = metafields;

  // If no custom price metafield, return null (fallback to Shopify default)
  if (!price) {
    return null;
  }

  const originalPrice = parseFloat(price);
  if (isNaN(originalPrice) || originalPrice <= 0) {
    return null;
  }

  let discountAmount = 0;
  let discountType = null;
  let discountValue = null;

  // Calculate percentage discount
  const percentageDiscount =
    discountPercentage && !isNaN(parseFloat(discountPercentage))
      ? (originalPrice * parseFloat(discountPercentage)) / 100
      : 0;

  // Calculate fixed discount
  const fixedDiscount =
    discountFixedAmount && !isNaN(parseFloat(discountFixedAmount))
      ? parseFloat(discountFixedAmount)
      : 0;

  // Apply maximum discount (whichever gives more savings)
  if (percentageDiscount > fixedDiscount) {
    discountAmount = percentageDiscount;
    discountType = 'percentage';
    discountValue = discountPercentage;
  } else if (fixedDiscount > 0) {
    discountAmount = fixedDiscount;
    discountType = 'fixed';
    discountValue = discountFixedAmount;
  }

  // Calculate final price (ensure it doesn't go below 0)
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    originalPrice: originalPrice.toFixed(2),
    finalPrice: finalPrice.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    discountType,
    discountValue,
    currencyCode,
  };
}

/**
 * Formats calculated price as MoneyV2 object for Hydrogen components
 * @param {CalculatedPrice} calculatedPrice - Calculated price object
 * @returns {Object} - MoneyV2 formatted object
 */
export function formatAsMoneyV2(calculatedPrice) {
  return {
    amount: calculatedPrice.finalPrice,
    currencyCode: calculatedPrice.currencyCode,
  };
}

/**
 * Formats original price as MoneyV2 object for Hydrogen components
 * @param {CalculatedPrice} calculatedPrice - Calculated price object
 * @returns {Object} - MoneyV2 formatted object
 */
export function formatOriginalAsMoneyV2(calculatedPrice) {
  return {
    amount: calculatedPrice.originalPrice,
    currencyCode: calculatedPrice.currencyCode,
  };
}

/**
 * Gets custom pricing for a product variant
 * For variants, we check the variant's metafields first, then fall back to product metafields
 * @param {Object} variant - Product variant object
 * @param {Object} product - Product object
 * @param {string} currencyCode - Currency code
 * @returns {CalculatedPrice|null}
 */
export function getVariantCustomPrice(variant, product, currencyCode = 'USD') {
  // Try variant metafields first
  if (variant?.metafields) {
    const variantMetafields = getCustomPriceMetafields(variant);
    const variantPrice = calculateCustomPrice(variantMetafields, currencyCode);
    if (variantPrice) {
      return variantPrice;
    }
  }

  // Fall back to product metafields
  if (product) {
    const productMetafields = getCustomPriceMetafields(product);
    return calculateCustomPrice(productMetafields, currencyCode);
  }

  return null;
}

/**
 * Gets the minimum custom price from a product's price range
 * Used for collection pages where we show minVariantPrice
 * @param {Object} product - Product object
 * @param {string} currencyCode - Currency code
 * @returns {CalculatedPrice|null}
 */
export function getProductMinCustomPrice(product, currencyCode = 'USD') {
  const metafields = getCustomPriceMetafields(product);
  return calculateCustomPrice(metafields, currencyCode);
}

