// /home/gwl/Hydrogen-Friday/metaobject/hydrogen-storefront/app/components/ProductForm.tsx
import {Link, useNavigate} from 'react-router';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {Image} from '@shopify/hydrogen';

interface ProductFormProps {
  productOptions: any[]; // color , size
  selectedVariant: any; 
}

export function ProductForm({productOptions, selectedVariant}: ProductFormProps) {
  const navigate = useNavigate(); // update the URL query when new variant is selected
  const {open} = useAside(); // Open sidebar(cart)
  
  return (
    <div className="product-form">
      {/* Product Options */}
      {productOptions.map((option: any) => {  // productOptions array map
        if (option.optionValues.length === 1) return null; // if only option like S thn stop rendering (s,m,l)

        return (
          <div className="product-options mb-3" key={option.name}>  
            <div className="flex items-center justify-between">
              <h5 className="font-semibold text-gray-900">{option.name}</h5>
            </div>
            <div className="product-options-grid grid grid-cols-2 sm:grid-cols-4 gap-3">
              {option.optionValues.map((value: any) => {
                const { //Destructures the values (variant data like for small)
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                  firstSelectableVariant, 
                } = value;

                //  Get variant image from firstSelectableVariant
                const variantImage = firstSelectableVariant?.image; // image with variant 
                const hasVariantImage = !!variantImage?.url;

                if (isDifferentProduct) { // variant as separate product
                  return (
                    <Link
                      className={`product-options-item relative rounded-lg border-2
                         p-3 transition-all duration-200 ${
                        selected 
                          ? 'border-black shadow-md' 
                          : 'border-gray-200 hover:border-gray-400'
                      } ${!available ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                      key={option.name + name}
                      prefetch="intent" // fast loading
                      preventScrollReset 
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      {/* ✅ Show variant image if available, otherwise use swatch */}
                      {hasVariantImage ? (
                        <div className="w-20 h-20 mx-auto mb-2 rounded-md overflow-hidden border border-gray-200">
                          <Image
                            data={variantImage}
                            sizes="60px"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <ProductOptionSwatch swatch={swatch} name={name} />
                      )}
                      <span className="block text-center text-xs mt-2 font-medium">{name}</span>
                    </Link>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      className={`product-options-item relative rounded-lg border-2 p-3  ${
                        selected 
                          ? 'border-black shadow-md' 
                          : 'border-gray-200 hover:border-gray-400'
                      } ${!exists ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                      key={option.name + name}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      {/* ✅ Show variant image if available, otherwise use swatch */}
                      {hasVariantImage ? (
                        <div className="w-12 h-12 mx-auto mb-2 rounded-md overflow-hidden border border-gray-200">
                          <Image
                            data={variantImage}
                            sizes="48px"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <ProductOptionSwatch swatch={swatch} name={name} />
                      )}
                      <span className="block text-center text-xs mt-2 font-medium">{name}</span>
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}

      {/* Add to Cart Button */}
      <div className="add-to-cart-section mt-8">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]
              : []
          }
          className="w-full bg-black text-white py-4 px-6 rounded-lg bold
           hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'}
        </AddToCartButton>
      </div>
    </div>
  );
}

interface ProductOptionSwatchProps {
  swatch?: any;
  name: string;
}

function ProductOptionSwatch({swatch, name}: ProductOptionSwatchProps) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  // If no image or color, show text label in a styled box
  if (!image && !color) {
    return (
      <div className="product-option-text-swatch w-12 h-12 mx-auto flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
        <span className="text-xs font-medium text-gray-700">{name}</span>
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch w-12 h-12 mx-auto rounded-md border border-gray-300 overflow-hidden shadow-sm"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && (
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}