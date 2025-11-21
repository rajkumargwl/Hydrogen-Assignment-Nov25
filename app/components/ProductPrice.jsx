import {Money} from '@shopify/hydrogen';
import {
  getVariantCustomPrice,
  formatAsMoneyV2,
  formatOriginalAsMoneyV2,
} from '~/lib/customPricing';

/**
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 *   product?: Object;
 *   variant?: Object;
 *   showDiscountInfo?: boolean;
 * }}
 */
export function ProductPrice({
  price,
  compareAtPrice,
  product,
  variant,
  showDiscountInfo = false,
}) {
  // Try to get custom pricing
  let customPrice = null;
  let originalPrice = null;
  let discountInfo = null;

  if (product || variant) {
    // Use getVariantCustomPrice which checks variant first, then product
    // Always use the product prop (which has full metafields) rather than variant.product
    // (which only has title/handle)
    customPrice = getVariantCustomPrice(
      variant,
      product, // Use the full product object passed as prop
      price?.currencyCode || variant?.price?.currencyCode || 'USD',
    );

    if (customPrice) {
      originalPrice = formatOriginalAsMoneyV2(customPrice);
      price = formatAsMoneyV2(customPrice);

      // Build discount info
      if (customPrice.discountType) {
        discountInfo = {
          type: customPrice.discountType,
          value: customPrice.discountValue,
          amount: customPrice.discountAmount,
        };
      }
    }
  }

  return (
    <div className="product-price">
      {originalPrice || compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <Money data={price} /> : null}
          <s>
            <Money data={originalPrice || compareAtPrice} />
          </s>
          {showDiscountInfo && discountInfo && (
            <small className="discount-info">
              {discountInfo.type === 'percentage'
                ? `${discountInfo.value}% off`
                : `$${discountInfo.amount} off`}
            </small>
          )}
        </div>
      ) : price ? (
        <Money data={price} />
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
