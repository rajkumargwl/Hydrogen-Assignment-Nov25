// /home/gwl/Hydrogen-Friday/metaobject/hydrogen-storefront/app/components/ProductPrice.tsx
import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  const discountPercent = compareAtPrice && price ? 
    Math.round(((parseFloat(compareAtPrice.amount) - parseFloat(price.amount)) / parseFloat(compareAtPrice.amount)) * 100) : 
    0;

  return (
    <div className="product-price mb-4">
      {compareAtPrice ? (
        <div className="product-price-on-sale flex items-center gap-3">
          <div className="current-price text-2xl font-bold text-gray-900">
            {price ? <Money data={price} /> : null}
          </div>
          <div className="original-price flex items-center gap-2">
            <s className="text-lg text-gray-500">
              <Money data={compareAtPrice} />
            </s>
            {discountPercent > 0 && (
              <span className="discount-badge bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                {discountPercent}% Off
              </span>
            )}
          </div>
        </div>
      ) : price ? (
        <div className="current-price text-2xl font-bold text-gray-900">
          <Money data={price} />
        </div>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}