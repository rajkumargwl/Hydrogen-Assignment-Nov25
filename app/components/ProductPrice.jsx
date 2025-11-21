import {Money} from '@shopify/hydrogen';

/**
 * @param {{
 * price?: MoneyV2; // Standard Shopify price (now ignored)
 * compareAtPrice?: MoneyV2 | null; // Standard Shopify compareAtPrice (now ignored)
 * customPrice: string | null; // ⬅️ The calculated final price (e.g., "75.00")
 * originalPrice: string | null; // ⬅️ The base price (e.g., "100.00")
 * appliedDiscountType: string | null; // ⬅️ The discount type text
 * }}
 */
export function ProductPrice({
  price, 
  compareAtPrice,
  customPrice, 
  originalPrice,
  appliedDiscountType,
}) {
  const hasDiscount = customPrice && originalPrice && customPrice !== originalPrice;
  const isCustomPriceValid = customPrice && originalPrice;

  if (isCustomPriceValid) {
    if (hasDiscount) {
      return (
        <div className="product-price-on-sale custom-price-display">
          <span className="text-2xl font-bold text-red-600">
            ₹{customPrice} 
          </span>
          <s className="ml-3 text-lg text-gray-500">
            ₹{originalPrice} 
          </s>
          {appliedDiscountType && appliedDiscountType !== 'None' && (
            <span className="ml-3 text-sm font-semibold text-green-600">
              ({appliedDiscountType}) 
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="product-price">
        <span className="text-2xl font-bold">₹{originalPrice}</span>
      </div>
    );
  }

  return (
    <div className="product-price">
      {compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <Money data={price} /> : null}
          <s>
            <Money data={compareAtPrice} />
          </s>
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