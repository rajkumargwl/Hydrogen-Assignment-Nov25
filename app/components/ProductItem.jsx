import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {ProductPrice} from './ProductPrice';
import {
  getProductMinCustomPrice,
  getCustomPriceMetafields,
  calculateCustomPrice,
  formatAsMoneyV2,
  formatOriginalAsMoneyV2,
} from '~/lib/customPricing';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  console.log("products....................",product);
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  // Get custom pricing
  const metafields = getCustomPriceMetafields(product);
  const customPrice = calculateCustomPrice(
    metafields,
    product.priceRange?.minVariantPrice?.currencyCode || 'USD',
  );

  // Determine price to display
  let price = product.priceRange?.minVariantPrice;
  let compareAtPrice = null;

  if (customPrice) {
    price = formatAsMoneyV2(customPrice);
    compareAtPrice = formatOriginalAsMoneyV2(customPrice);
  }

  return (
    <Link
      className="product-item"
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
      <ProductPrice
        price={price}
        compareAtPrice={compareAtPrice}
        product={product}
        showDiscountInfo={true}
      />
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
