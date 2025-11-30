import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2 | { amount: number; currencyCode: string };
  compareAtPrice?: MoneyV2 | { amount: number; currencyCode: string } | null;
}) {
  if (!price) return <span>&nbsp;</span>;

  const isCustom = typeof price.amount === "number";

  return (
    <div className="product-price">
      {compareAtPrice ? (
        <div className="product-price-on-sale flex gap-2 items-center">
          {isCustom ? (
            <span>{price.currencyCode} {price.amount.toFixed(2)}</span>
          ) : (
            <Money data={price} />
          )}

          <s>
            {compareAtPrice && typeof compareAtPrice.amount === "number"
              ? `${compareAtPrice.currencyCode} ${compareAtPrice.amount.toFixed(2)}`
              : <Money data={compareAtPrice as MoneyV2} />}
          </s>
        </div>
      ) : (
        <>
          {isCustom ? (
            <span>{price.currencyCode} {price.amount.toFixed(2)}</span>
          ) : (
            <Money data={price} />
          )}
        </>
      )}
    </div>
  );
}
