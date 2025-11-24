// /home/gwl/Hydrogen-Friday/metaobject/hydrogen-storefront/app/components/ProductItem.tsx
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {QuickViewButton} from './QuickViewButton';
import {useQuickViewConfig} from '~/hooks/useQuickViewConfig';

interface ProductItemProps {
  product: any;
  loading?: 'eager' | 'lazy';
  quickViewConfig?: any;
}

export function ProductItem({product, loading, quickViewConfig}: ProductItemProps) {
  const variantUrl = useVariantUrl(product.handle);
  const {parseMetaobjectConfig} = useQuickViewConfig();
  
  // metaobject config
  const config = parseMetaobjectConfig(quickViewConfig ? [quickViewConfig] : []);
  
  // Get all variants with their images
  const getVariantsWithImages = () => {
    if (!product.variants?.nodes) return [];
    
    return product.variants.nodes.map((variant: any) => ({
      id: variant.id,
      title: variant.title,
      image: variant.image,
      price: variant.price,
      availableForSale: variant.availableForSale,
      selectedOptions: variant.selectedOptions
    }));
  };

  const variantsWithImages = getVariantsWithImages();
  
  // Find the best display variant (one with image, or first available)
  const findBestDisplayVariant = () => {
    // First, try to find a variant with an image
    const variantWithImage = variantsWithImages.find((variant: any) => variant.image);
    if (variantWithImage) return variantWithImage;
    
    // If no variant has image, use the first available variant
    const firstAvailable = variantsWithImages.find((variant: any) => variant.availableForSale);
    if (firstAvailable) return firstAvailable;
    
    // Fallback to first variant
    return variantsWithImages[0];
  };
  
  const displayVariant = findBestDisplayVariant();
  const displayImage = displayVariant?.image || product.featuredImage;
  const displayPrice = displayVariant?.price || product.priceRange.minVariantPrice;
  
  console.log('🔍 [ProductItem] Variants with images:', {
    productTitle: product.title,
    variantsCount: variantsWithImages.length,
    variantsWithImages: variantsWithImages.map((v: any) => ({
      title: v.title,
      hasImage: !!v.image,
      imageUrl: v.image?.url
    })),
    selectedVariant: displayVariant?.title
  });

  return (
    
    <div className=" relative max-w-[300px] border-2 border-gray-200 p-4 rounded-lg">
      <Link
        key={product.id}
        prefetch="intent"
        to={variantUrl}
        className="block"
      >
      
        {displayImage && (
          <Image
            alt={displayImage.altText || product.title}
            aspectRatio="1/1"
            data={displayImage}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        <h4 className="font-semibold text-gray-900 mt-2">{product.title}</h4>
        
        {/* Show variant name if available */}
        {displayVariant?.title && displayVariant.title !== 'Default Title' && (
          <p className="text-sm text-gray-600 mt-1">{displayVariant.title}</p>
        )}
        
        <small className="text-gray-900 font-medium">
          <Money data={displayPrice} />
        </small>
      </Link>
      
      {/* Quick View Button with global config */}
       <div className="m-4 ">
      <QuickViewButton 
        product={product} 
        config={config}
      />
      </div>
    </div>
  );
}