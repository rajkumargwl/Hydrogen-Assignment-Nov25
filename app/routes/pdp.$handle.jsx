import {useLoaderData} from 'react-router';
import {useEffect, useState} from 'react';
import {Slider} from '~/components/ProductItemtest';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import No_image from '../assets/No_image.png';
import {getVariantImages} from '~/components/ProductItemtest';

export async function loader({context, params, request}) {
  try {
    const {handle} = params;

    if (!handle) {
      throw new Response('Product handle is required', {status: 400});
    }

    const variables = {
      handle,
      country: context?.storefront?.i18n?.country,
      language: context?.storefront?.i18n?.language,
    };

    const data = await context.storefront.query(GET_PRODUCT_BY_HANDLE_QUERY, {
      variables,
    });

    if (!data.product) {
      throw new Response('Product not found', {status: 404});
    }

    return {product: data?.product};
  } catch (error) {
    console.error('Loader error:', error);
    return {product: null};
  }
}

export default function ProductDetail() {
  const {product} = useLoaderData();

  if (!product) return <p>Product not found</p>;

  const [isDisabled, setIsDisabled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredImages, setFilteredImages] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.nodes[0],
  );

  useEffect(() => {
    const imgs = getVariantImages(selectedVariant, product);
    setFilteredImages(imgs);
    setActiveIndex(0);
  }, [selectedVariant]);

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    setIsDisabled(true);
    setTimeout(() => setIsDisabled(false), 2000);
  };

  const increaseQty = () => setQuantity((q) => (q < 49 ? q + 1 : 49));
  const decreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col md:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-4">
        <Slider
          images={filteredImages}
          activeIndex={activeIndex}
          onChangeIndex={setActiveIndex}
        />

        <div className="flex gap-2 mt-2 overflow-x-auto">
          {filteredImages.map((img, index) => (
            <img
              key={index}
              src={img || No_image}
              alt={selectedVariant?.title || 'no_image'}
              className={`w-20 h-20 object-contain rounded cursor-pointer border ${
                activeIndex === index ? 'border-blue-700' : 'border-gray-300'
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{product.title}</h1>

        <p className="text-gray-700">
          {product.description || 'No description available.'}
        </p>

        <div className="flex flex-col gap-2 mt-4">
          <p className="font-semibold">Select Variant:</p>

          <div className="flex gap-2 flex-wrap">
            {product.variants.nodes.map((variant) => {
              const variantThumb = variant?.image?.src || No_image;

              return (
                <button
                  key={variant?.id}
                  onClick={() => handleVariantChange(variant)}
                  className={`flex cursor-pointer flex-col items-center p-2 border rounded hover:border-blue-500 ${
                    selectedVariant.id === variant.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                >
                  <img
                    src={variantThumb}
                    alt={variant?.title}
                    className="w-16 h-16 object-contain rounded mb-1 "
                  />
                  <span className="text-sm font-medium">{variant?.title}</span>
                  <span className="text-sm text-gray-600">
                    {variant?.price?.amount} {variant?.price?.currencyCode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="font-semibold text-gray-600">
          Price: {selectedVariant?.price?.amount}{' '}
          {selectedVariant?.price?.currencyCode}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={decreaseQty}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            min={1}
            max={49}
            onChange={(e) =>
              setQuantity(
                Math.min(49, Math.max(1, parseInt(e.target.value) || 1)),
              )
            }
            className="w-18 text-center border rounded"
          />

          <button
            onClick={increaseQty}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
          >
            +
          </button>
        </div>

        <div className="flex justify-center items-center p-2 rounded-lg mt-2 bg-amber-900 text-white">
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={handleAddToCart}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant?.id,
                      quantity,
                      selectedVariant,
                    },
                  ]
                : []
            }
          >
            {!isDisabled ? (
              selectedVariant?.availableForSale ? (
                <div className="cursor-pointer">Add to cart</div>
              ) : (
                <div>Soldout</div>
              )
            ) : (
              <div>Adding to cart...</div>
            )}
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
}

const GET_PRODUCT_BY_HANDLE_QUERY = `#graphql
fragment ProductFields on Product {
  id
  title
  handle
  description
  productType
  images(first: 50) {
    nodes {
      id
      url
      width
      height
      altText
    }
  }
  variants(first: 50) {
    nodes {
      id
      title
      sku
      quantityAvailable
      availableForSale
      price {
        amount
        currencyCode
      }
      image {
        src
        altText
      }
      product {
        title
        handle
      }
    }
  }
}

query GetProductByHandle(
  $handle: String!
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  product(handle: $handle) {
    ...ProductFields
  }
}
`;
