import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {calculateCustomPrice} from '~/lib/price-utils'; // Already imported!

/**
 * @param {{
 * product:
 * | CollectionItemFragment
 * | ProductItemFragment
 * | RecommendedProductFragment;
 * loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  const {customPrice, originalPrice, appliedDiscountType} = 
    calculateCustomPrice(product);

  const hasDiscount = customPrice && originalPrice && customPrice !== originalPrice;
  const isCustomPriceValid = customPrice && originalPrice;

  const fallbackPrice = product.priceRange.minVariantPrice;


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
      
      {isCustomPriceValid ? (
        <small className="custom-price-container">
          {hasDiscount && (
            <s className="text-gray-500 mr-2">₹{originalPrice}</s> 
          )}
          <span className={hasDiscount ? 'text-red-600 font-semibold' : 'text-black'}>
            ₹{customPrice}
          </span>
          {hasDiscount && (
            <span className="text-sm text-green-600 ml-1">({appliedDiscountType})</span>
          )}
        </small>
      ) : (
        <small>
          <Money data={fallbackPrice} />
        </small>
      )}
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */