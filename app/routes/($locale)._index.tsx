import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import ProductsSection from '~/components/ProductsSection';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({ context}: LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte

  const {storefront} = context;

  const data = await storefront.query(PRODUCTS_QUERY);
  return {products: data?.products?.nodes || [], };
}
/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const { products } = data;
 return (
   <div className="w-full">
    <ProductsSection
        title="Featured Products"
        products={products.map((p: any) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          price: p.priceRange?.minVariantPrice?.amount
            ? `$${p.priceRange.minVariantPrice.amount}`
            : "",
          image: {
            url: p.images?.nodes[0]?.url,
            altText: p.images?.nodes[0]?.altText,
          },
          hoverImage: {
            url: p.images?.nodes[1]?.url,
            altText: p.images?.nodes[1]?.altText,
          },
          customPrice: p.customPrice,
          discountPercentage: p.discountPercentage,
          discountFixedAmount: p.discountFixedAmount,
        }))}
      />
  </div>
  );
}
const PRODUCTS_QUERY = `#graphql
  query HomePageProducts {
    products(first: 8) {
      nodes {
        id
        title
        handle
        priceRange {
          minVariantPrice {
            amount
          }
        }
        images(first: 2) {
          nodes {
            url
            altText
          }
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
    }
  }
`;