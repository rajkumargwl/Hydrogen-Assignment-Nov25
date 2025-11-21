/**
 * Order Pricing Utilities
 * Handles saving custom pricing to order metafields
 */

/**
 * Extracts custom pricing from cart line item attributes
 * @param {Object} lineItem - Cart line item
 * @returns {Object|null} - Custom pricing data
 */
export function extractCustomPricingFromLineItem(lineItem) {
  if (!lineItem?.attributes) {
    return null;
  }

  const attrs = {};
  lineItem.attributes.forEach((attr) => {
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
 * Prepares order metafields for saving custom pricing
 * @param {Object} order - Order object
 * @returns {Array} - Array of metafield objects
 */
export function prepareOrderMetafields(order) {
  const metafields = [];

  if (!order?.lineItems?.nodes) {
    return metafields;
  }

  order.lineItems.nodes.forEach((lineItem) => {
    const customPrice = extractCustomPricingFromLineItem(lineItem);

    if (customPrice) {
      metafields.push(
        {
          namespace: 'custom',
          key: `line_item_${lineItem.id}_original_price`,
          value: customPrice.originalPrice,
          type: 'single_line_text_field',
        },
        {
          namespace: 'custom',
          key: `line_item_${lineItem.id}_final_price`,
          value: customPrice.finalPrice,
          type: 'single_line_text_field',
        },
      );

      if (customPrice.discountType) {
        metafields.push({
          namespace: 'custom',
          key: `line_item_${lineItem.id}_discount_type`,
          value: customPrice.discountType,
          type: 'single_line_text_field',
        });

        if (customPrice.discountValue) {
          metafields.push({
            namespace: 'custom',
            key: `line_item_${lineItem.id}_discount_value`,
            value: customPrice.discountValue,
            type: 'single_line_text_field',
          });
        }

        metafields.push({
          namespace: 'custom',
          key: `line_item_${lineItem.id}_discount_amount`,
          value: customPrice.discountAmount,
          type: 'single_line_text_field',
        });
      }
    }
  });

  return metafields;
}

