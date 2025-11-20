import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import QuickViewButton from './QuickViewButton';
import { useQuickViewSettings } from '~/hooks/useQuickViewSettings';
import {cn} from '~/lib/cn';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 *   quickViewPosition?: 
 *     'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
 * }}
 */
export function ProductItem({
  product,
  loading,
  quickViewPosition = 'bottom-right'
}) {

   const {settings} = useQuickViewSettings();
const showOnHover = true;

const visibilityClass = showOnHover
  ? "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200"
  : "opacity-100";
  
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  quickViewPosition = settings?.button_position || quickViewPosition;

  const positionClass = getPositionClass(quickViewPosition);

  return (
    <div className="relative product-item group">
      
      <div className="relative w-full">
        <Link to={variantUrl} prefetch="intent" className="block">
          {image && (
            <Image
              alt={image.altText || product.title}
              data={image}
              loading={loading}
              sizes="(min-width: 45em) 400px, 100vw"
              className="w-full"
            />
          )}
        </Link>

        {/* Quick View Button */}
        {settings?.enable_quick_view && settings?.enable_quick_view === "true"  && (
          <div  className={cn(
            positionClass,
            visibilityClass,
            "pointer-events-auto"
          )}>
            <QuickViewButton handle={product.handle} />
          </div>
        )}
      </div>

      {/* PRODUCT INFO */}
      <Link to={variantUrl} prefetch="intent" className="block">
      <h4 className="mt-2">{product.title}</h4>
      <small><Money data={product.priceRange.minVariantPrice} /></small>
      </Link>
    </div>
  );
}

/**
 * Get the position class for the quick view button
 * @param {*} position 
 * @returns the class string for positioning
 */
function getPositionClass(position) {
  switch (position) {
    case "top-left":
      return "absolute top-2 left-2 z-1 pointer-events-auto";
    case "top-right":
      return "absolute top-2 right-2 z-1 pointer-events-auto";
    case "bottom-left":
      return "absolute bottom-2 left-2 z-1 pointer-events-auto";
    case "bottom-right":
      return "absolute bottom-2 right-2 z-1 pointer-events-auto";
    case "center":
      return `
        absolute
        top-1/2 left-1/2
        -translate-x-1/2 -translate-y-1/2
        z-1
        pointer-events-auto
      `;
    default:
      return "absolute bottom-2 right-2 z-1";
  }
}

