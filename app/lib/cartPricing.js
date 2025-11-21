/**
 * Cart Pricing Utilities
 * Handles storing and retrieving custom pricing in cart attributes
 */

/**
 * Stores custom pricing data in cart line item attributes
 * @param {Object} variant - Product variant
 * @param {Object} product - Product object
 * @param {Object} calculatedPrice - Calculated custom price
 * @returns {Object} - Cart line attributes
 */
export function getCartLineAttributes(variant, product, calculatedPrice) {
  if (!calculatedPrice) {
    return {};
  }

  return {
    _customPrice: calculatedPrice.originalPrice,
    _customFinalPrice: calculatedPrice.finalPrice,
    _customDiscountType: calculatedPrice.discountType || '',
    _customDiscountValue: calculatedPrice.discountValue || '',
    _customDiscountAmount: calculatedPrice.discountAmount,
    _customCurrency: calculatedPrice.currencyCode,
  };
}

/**
 * Retrieves custom pricing from cart line item attributes
 * @param {Object} line - Cart line item
 * @returns {Object|null} - Custom pricing data or null
 */
export function getCustomPriceFromCartLine(line) {
  if (!line?.attributes) {
    return null;
  }

  const attrs = {};
  line.attributes.forEach((attr) => {
    if (attr.key && attr.key.startsWith('_custom')) {
      attrs[attr.key] = attr.value;
    }
  });

  if (!attrs._customPrice) {
    return null;
  }

  return {
    originalPrice: attrs._customPrice,
    finalPrice: attrs._customFinalPrice || attrs._customPrice,
    discountType: attrs._customDiscountType || null,
    discountValue: attrs._customDiscountValue || null,
    discountAmount: attrs._customDiscountAmount || '0',
    currencyCode: attrs._customCurrency || 'USD',
  };
}

/**
 * Calculates cart totals with custom pricing
 * @param {Object} cart - Cart object
 * @returns {Object} - Updated cart totals
 */
export function calculateCartTotalsWithCustomPricing(cart) {
  if (!cart?.lines?.nodes || cart.lines.nodes.length === 0) {
    return null;
  }

  let subtotal = 0;
  const currencyCode = cart.cost?.subtotalAmount?.currencyCode || 'USD';
  let hasCustomPricing = false;

  cart.lines.nodes.forEach((line) => {
    if (!line || !line.quantity) return;
    
    const customPrice = getCustomPriceFromCartLine(line);
    if (customPrice && customPrice.finalPrice) {
      const lineTotal =
        parseFloat(customPrice.finalPrice) * parseInt(line.quantity, 10);
      if (!isNaN(lineTotal)) {
        subtotal += lineTotal;
        hasCustomPricing = true;
      }
    } else if (line.cost?.totalAmount?.amount) {
      // Fallback to Shopify's price if no custom pricing
      const lineTotal = parseFloat(line.cost.totalAmount.amount);
      if (!isNaN(lineTotal)) {
        subtotal += lineTotal;
      }
    }
  });

  // Only return custom totals if we found custom pricing, otherwise return null to use Shopify's totals
  if (hasCustomPricing) {
    return {
      subtotal: {
        amount: subtotal.toFixed(2),
        currencyCode,
      },
    };
  }

  return null;
}

