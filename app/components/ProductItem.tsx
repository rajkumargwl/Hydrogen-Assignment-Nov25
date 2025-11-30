import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import { AddToCartButton } from './AddToCartButton';
import CustomPrice from './CustomPrice';
import { useAside } from './Aside';
function getCustomPrice(product: { customPrice: { value: any; }; discountPercentage: { value: any; }; discountFixedAmount: { value: any; }; }) {
  const baseMeta = product.customPrice?.value;
  let base = 0;
  if (baseMeta) {
    try {
      const parsed = JSON.parse(baseMeta) as { amount?: string | number };
      base = parsed.amount != null ? parseFloat(String(parsed.amount)) : 0;
    } catch {
      base = 0;
    }
  }

  const percentage = parseFloat(String(product.discountPercentage?.value ?? '0')) || 0;

  const fixedMeta = product.discountFixedAmount?.value;
  let fixed = 0;
  if (fixedMeta) {
    try {
      const parsedFixed = JSON.parse(fixedMeta) as { amount?: string | number };
      fixed = parsedFixed.amount != null ? parseFloat(String(parsedFixed.amount)) : 0;
    } catch {
      fixed = 0;
    }
  }

  const percentageDiscount = (base * percentage) / 100;
  const maxDiscount = Math.max(percentageDiscount, fixed);

  const finalPrice = base - maxDiscount;

  return {
    basePrice: base,
    finalPrice,
    discountApplied: maxDiscount,
    discountPercentage: percentage,
  };
}
export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const customPrice = getCustomPrice(product);
  const firstAvailableVariant = product.variants?.nodes[0];
  const isAvailable = firstAvailableVariant?.availableForSale || false;
  const {open} = useAside();
  return (
    <div className="product-item" key={product.id}>
    <Link
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {image && (
        <Image
          alt={image.altText || product.title}
          aspectRatio="1/1"
          data={image}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <CustomPrice
            finalPrice={customPrice.finalPrice}
            basePrice={customPrice.basePrice}
            discountPercentage={customPrice.discountPercentage}
        />
      </small>
      </Link>
      {/* ADD TO CART BUTTON */}
      {firstAvailableVariant && (
        <AddToCartButton
          disabled={!isAvailable}
          // Use the `open` function from useAside to open the cart drawer
          onClick={() => open('cart')}
          lines={
            [
              {
                merchandiseId: firstAvailableVariant.id,
                quantity: 1,
                // Pass custom price attributes if needed for the custom checkout logic
                attributes: [
                  {
                    key: "finalPrice",
                    value: String(customPrice.finalPrice),
                  },
                  {
                      key: "basePrice",
                      value: String(customPrice?.basePrice ),
                    },
                  {
                    key: "discountPercentage",
                    value: String(
                      customPrice.discountPercentage
                    ),
                  },
                ],
              },
            ]
          }
        >
          {isAvailable ? 'Add to Cart' : 'Sold out'}
        </AddToCartButton>
      )}
    </div>
  );
}
