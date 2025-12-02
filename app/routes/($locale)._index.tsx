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