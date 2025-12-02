import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import CustomPrice from '~/components/CustomPrice';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Hydrogen | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader({context, params, request}:Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

    if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  return {product};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function getCustomPrice(product, variant = null) {
  // --- 1. Base Price ---
   const productOriginal = parseFloat(product.priceRange?.minVariantPrice?.amount) || 0;
  const variantOriginal = parseFloat(variant?.price?.amount || 0);

  // ---- 2️⃣ CUSTOM PRICE (if exists) ----
  const customMeta = variant?.customPrice?.value || product.customPrice?.value;
  const customPrice = customMeta ? parseFloat(JSON.parse(customMeta).amount) : null;

  // ---- 3️⃣ PICK BASE PRICE ----
  // Priority: variant custom > product custom > variant original > product original
const base = customPrice ?? (variantOriginal || productOriginal);
  // --- 2. Discount Percentage ---
  const percentage =
    parseFloat(variant?.discountPercentage?.value) ||
    parseFloat(product.discountPercentage?.value) ||
    0;

  // --- 3. Fixed Discount ---
  const fixedMeta =
    variant?.discountFixedAmount?.value ||
    product.discountFixedAmount?.value;

  const fixed = fixedMeta ? parseFloat(JSON.parse(fixedMeta).amount) : 0;

  // --- 4. Apply Discount ---
  const percentageDiscount = (base * percentage) / 100;
  const maxDiscount = Math.max(percentageDiscount, fixed);

  const finalPrice = base - maxDiscount;

  return {
    basePrice: base,
    finalPrice,
    discountApplied: maxDiscount,
    discountPercentage: percentage,
    isVariantPrice: !!variant, // helpful for debugging
  };
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  const customPrice = getCustomPrice(product, selectedVariant);
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;
  return (
    <div className="product">
      <ProductImage image={selectedVariant?.image} />
      <div className="product-main">
        <h1>{title}</h1>
        <CustomPrice
          finalPrice={customPrice.finalPrice}
          basePrice={customPrice.basePrice}
          discountPercentage={customPrice.discountPercentage}
        />
        <br />
        <ProductForm
          productOptions={productOptions}
          selectedVariant={selectedVariant}
          customPrice={customPrice}
        />
        <br />
        <br />
        <p>
          <strong>Description</strong>
        </p>
        <br />
        <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
        <br />
      </div>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    customPrice: metafield(namespace: "custom_pricing", key: "price") {
        value
      }
    discountPercentage: metafield(namespace: "custom_pricing", key: "discount_percentage") {
      value
    }
    discountFixedAmount: metafield(namespace: "custom_pricing", key: "discount_fixed_amount") {
      value
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    customPrice: metafield(namespace: "custom_pricing", key: "price") {
        value
      }
    discountPercentage: metafield(namespace: "custom_pricing", key: "discount_percentage") {
      value
    }
    discountFixedAmount: metafield(namespace: "custom_pricing", key: "discount_fixed_amount") {
      value
    }
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
