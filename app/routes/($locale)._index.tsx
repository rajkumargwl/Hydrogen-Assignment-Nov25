import {Await, useLoaderData, Link} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {QUICK_VIEW_METAOBJECT_QUERY, PRODUCT_ITEM_FRAGMENT} from '~/lib/queries';

export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader(args: any) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: any) {
  const [quickViewConfig, allProducts] = await Promise.all([
    context.storefront.query(QUICK_VIEW_METAOBJECT_QUERY),
    context.storefront.query(ALL_PRODUCTS_QUERY),
  ]);

  return {
    quickViewConfig: quickViewConfig.metaobjects?.nodes?.[0] || null,
    allProducts,
  };
}

function loadDeferredData({context}: any) {

  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: any) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data: any = useLoaderData();
  return (
    <div className="home">
      <AllProducts 
        products={data.allProducts} 
        quickViewConfig={data.quickViewConfig}
      />
     
    </div>
  );
}


function AllProducts({products, quickViewConfig}: any) {
  if (!products?.products?.nodes?.length) return null;
  
  return (
    <div className="all-products ">
     <h2 className="all-products-heading">All Products</h2>
    <div className=" grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {products.products.nodes.map((product: any) => (
          <ProductItem 
            key={product.id} 
            product={product} 
            quickViewConfig={quickViewConfig}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendedProducts({products, quickViewConfig}: any) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response: any) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product: any) => (
                    <ProductItem 
                      key={product.id} 
                      product={product} 
                      quickViewConfig={quickViewConfig}
                    />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...ProductItem
      }
    }
  }
`;


const ALL_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query AllProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 50, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...ProductItem
      }
    }
  }
`;