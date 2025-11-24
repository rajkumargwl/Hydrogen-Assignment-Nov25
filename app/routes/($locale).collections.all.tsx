import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import {QUICK_VIEW_METAOBJECT_QUERY, PRODUCT_ITEM_FRAGMENT} from '~/lib/queries';

export const meta = () => {
  return [{title: `Hydrogen | Products`}];
};

export async function loader(args: any) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: any) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const [{products}, quickViewConfig] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
    context.storefront.query(QUICK_VIEW_METAOBJECT_QUERY),
  ]);
  
  return {
    products,
    quickViewConfig: quickViewConfig.metaobjects?.nodes?.[0] || null,
  };
}

function loadDeferredData({context}: any) {
  return {};
}

export default function Collection() {
  const {products, quickViewConfig}: any = useLoaderData();

  return (
    <div className="collection">
      <h1>Products</h1>
      <PaginatedResourceSection
        connection={products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}: any) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
            quickViewConfig={quickViewConfig}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}

const CATALOG_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
`;