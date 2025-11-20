import {
  getSelectedProductOptions,
  useOptimisticVariant,
  getProductOptions,
  useSelectedOptionInUrlParam,
  getAdjacentAndFirstAvailableVariants
} from '@shopify/hydrogen';

import {useState, useMemo, useEffect} from 'react';

import {Money} from '@shopify/hydrogen';

import {ProductFormQuickView} from '~/components/ProductFormQuickView';
import {ProductPrice} from '~/components/ProductPrice';
import { useQuickViewSettings } from '~/hooks/useQuickViewSettings';
import {cn} from '~/lib/cn';
import { Slider } from './Slider';

export default function QuickViewContent({product}) {

    // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

    // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const [currentVariant, setCurrentVariant] = useState(selectedVariant);
  const [variantImageIndex, setVariantImageIndex] = useState(0);
  const images = product.images.nodes;

  // React to variant change
useEffect(() => {

  if (!currentVariant) return;

  const variantImgId = currentVariant?.image?.id;

  if (!variantImgId) {
    setVariantImageIndex(0);
    return;
  }

  const idx = images.findIndex((img) => img.id === variantImgId);

  setVariantImageIndex(idx === -1 ? 0 : idx);

}, [currentVariant, images]);

  const {settings} = useQuickViewSettings();

  let element_order = [];

  if(typeof settings?.element_order !== "undefined") {

     element_order = JSON.parse(settings?.element_order) || [
    'images',
    'title',
    'price',
    'options',
    'add_to_cart'
  ];
  
  }

  const orderMap = element_order.reduce((acc, key, index) => {
  acc[key] = index;
  return acc;
}, {});

/**
 * Mapping of order index to CSS class names to worlk with Tailwind CSS
 */
const orderClsMap= {
  0: "order-0",
  1: "order-1",
  2: "order-2",
  3: "order-3",
  4: "order-4",
  5: "order-5",
};

  return (
    <div className="space-y-4 flex flex-col gap-1">

      <div className={cn("w-full",
    `${orderClsMap[orderMap.images]}`
      )}>



<Slider images={images} 
startIndex={variantImageIndex}
/>
  
      </div>
   
      <h2 
      style={{
        "--font-size-mobile": settings?.title_font_size_mobile,
        "--font-size-desktop": settings?.title_font_size_desktop
      }}

      className={cn(
    `${orderClsMap[orderMap.title]}`,
    "font-semibold quickview-product-title"
  )}
  >{product.title}</h2>

         <div 
           style={{
        "--font-size-mobile": settings?.price_font_size_mobile,
        "--font-size-desktop": settings?.price_font_size_desktop,
      }}
      
         className={("product-price quickview-price",
    `${orderClsMap[orderMap.price]}`
         )}>
      {selectedVariant?.compareAtPrice ? (
        <div className="product-price-on-sale">
          {selectedVariant?.price ? <Money data={selectedVariant?.price} /> : null}
          <s>
            <Money data={selectedVariant?.compareAtPrice} />
          </s>
        </div>
      ) : selectedVariant?.price ? (
        <Money data={selectedVariant?.price} />
      ) : (
        <span>&nbsp;</span>
      )}
    </div>

        <ProductFormQuickView
          updateCurrentVariant={setCurrentVariant}
          orderMap={orderMap}
          orderClsMap={orderClsMap}
          settings={settings}
          product={product}
          productOptions={productOptions}
          selectedVariant={selectedVariant}
        />

    </div>
  );
}
