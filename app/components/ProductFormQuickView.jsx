import {Link} from 'react-router';
import {AddToCartButtonQuickView} from './AddToCartButtonQuickView';
import {useAside} from './Aside';
import {useQuickView} from '~/providers/QuickViewProvider';
import {useEffect, useState} from 'react'; 
import {cn} from '~/lib/cn';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 * }}
 */
export function ProductFormQuickView({product, productOptions, selectedVariant, orderMap, settings, orderClsMap, updateCurrentVariant}) {
  const {open} = useAside();
  const {close} = useQuickView();

  const [currentVariant, setCurrentVariant] = useState(selectedVariant);

  const [selectedOptions, setSelectedOptions] = useState(() => {
  const map = {};
  productOptions.forEach(opt => {
    const selectedValue = opt.optionValues.find(v => v.selected)?.name;
    map[opt.name] = selectedValue;
  });
  return map;
});

useEffect(() => {
  if (!selectedVariant) return;

  const map = {};
  productOptions.forEach(opt => {
    const selectedValue = opt.optionValues.find(v => v.selected)?.name;
    map[opt.name] = selectedValue;
  });

  setCurrentVariant(selectedVariant);
  updateCurrentVariant(selectedVariant); 

  setSelectedOptions(map);
}, [selectedVariant]);

function findVariant(options) {

  return product.variants.nodes.find(variant => {
    return Object.entries(options).every(([name, value]) => {
      return variant.selectedOptions.some(o => o.name === name && o.value === value);
    });
  });
}

  return (
    <>

      <div className={cn("product-options-container",
      `${orderClsMap[orderMap.options]}`
      )}>
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-options" key={option.name}>
            <h5>{option.name}</h5>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                 const isSelected = selectedOptions[option.name] === name;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        border: isSelected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={` px-4 py-2 rounded-sm text-sm font-medium
        border transition product-options-item-qv${
                        !isSelected ? ' bg-white text-gray-800 border-black-300' : '  bg-black text-white border-black'
                      }`}
                      key={option.name + name}
                      
                      disabled={!exists}
                         onClick={() => {
                      const updatedOptions = {
                        ...selectedOptions,
                        [option.name]: name,
                      };

                      setSelectedOptions(updatedOptions);

                      const matchedVariant = findVariant(updatedOptions);

                      if (matchedVariant) {
                        setCurrentVariant(matchedVariant);
                         updateCurrentVariant(matchedVariant); 
                      };
                    }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
            
          </div>
        );
      })}
      </div>
      <div style={{
        "--font-size-mobile": settings?.button_font_size_mobile,
        "--font-size-desktop": settings?.button_font_size_desktop
      }}
      
      className={cn("product-atc-quickview",
      `${orderClsMap[orderMap.add_to_cart]}`
      )}>
      <AddToCartButtonQuickView
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          setTimeout(() => {
            close();
          }, 200);
           open('cart');
        }}

        lines={
          currentVariant
            ? [
                {
                  merchandiseId: currentVariant.id,
                  quantity: 1,
                  currentVariant,
                },
              ]
            : []
        }
      >
        {currentVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButtonQuickView>
      </div>
    </>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
