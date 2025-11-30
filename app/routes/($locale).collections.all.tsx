import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables, Image, Money} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import type {CollectionItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = () => {
  return [{title: `Hydrogen | Products`}];
};

export async function loader({context, request}: Route.LoaderArgs) {
 const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const [{products}] = await Promise.all([
    storefront.query(PRODUCTS_QUERY, {
      variables: {...paginationVariables},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);
  return {products};
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


export default function Collection() {
  const {products} = useLoaderData<typeof loader>();
  return (
    <div className="collection">
      <h1>Products</h1>
      <PaginatedResourceSection<CollectionItemFragment>
        connection={products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}


const PRODUCTS_QUERY = `#graphql
query Catalog (
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
) {
  products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
    edges {
      cursor
      node {
        id
        title
        description
        publishedAt
        handle
        vendor
        tags
        media(first:1){
          nodes{
            ... on MediaImage{
              image{
                url
                altText
                width
                height
              }
            }
          }
        }
        featuredImage {
      id
      altText
      url
      width
      height
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
        variants(first: 1) {
          nodes {
            id
            sku
            availableForSale
            image {
              url
              altText
              width
              height
            }
            selectedOptions {
              name
              value
            }
            product {
              handle
              title
              description
            }
            
          }
        }
      }
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
  }
}
` as const;
