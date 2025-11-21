
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import { useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import QuickViewModal from './QuickViewModal';

interface ProductItem {
  product: any;
  showQuickView?: boolean;
  onQuickView?: (product: any) => void;
}

export function ProductItem({
  product,
  loading,
  showQuickView = true,
  onQuickView,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  showQuickView?: boolean;
  onQuickView?: (product: any) => void;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const rootData = useRouteLoaderData("root");
  const quickViewConfig = rootData?.quickViewConfig;

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
   
  const openQuickView = () => {
    if (quickViewConfig?.quick_view_enabled === "true") {
      setIsQuickViewOpen(true);
       onQuickView?.(product);
    }
  };
  
  const shouldShowQuickView = showQuickView && quickViewConfig?.quick_view_enabled === "true";
    const getButtonPositionClass = () => {
    const position = quickViewConfig?.quick_view_position || 'bottom_center_image';
    
    switch (position) {
      case 'bottom_center_image':
        return 'bottom-2 left-1/2 -translate-x-1/2';
      case 'Top_center_image':
    return 'top-1 left-1/2 -translate-x-1/2';

      default:
        return 'bottom-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div className="relative group">
      <Link
        className="product-item"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        {image && (
          <Image
            alt={image?.altText || product?.title}
            aspectRatio="1/1"
            data={image || {}}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}

        <h4>{product.title}</h4>
        <small>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
      </Link>
         <div className="w-full md:w-1/2 mt-3 md:mt-0">
{shouldShowQuickView && (
      <button
  className={`
    absolute ${getButtonPositionClass()}
    px-4 py-2 text-white text-sm font-medium rounded
    opacity-100 transition-opacity duration-300
     whitespace-nowrap
    ${quickViewConfig?.button_font_size ? `text-[${quickViewConfig.button_font_size}px]` : 'text-sm'}
  `}
  style={{
    backgroundColor: quickViewConfig?.button_color || "black",
  }}
  onClick={openQuickView}
>
  Quick View
</button>


          )}
          </div>
      {quickViewConfig?.quick_view_enabled === "true" && (
        <QuickViewModal
          product={product}
          settings={quickViewConfig}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </div>
   
  );
}
