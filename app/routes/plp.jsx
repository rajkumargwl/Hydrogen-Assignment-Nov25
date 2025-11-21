import {useLoaderData, useFetcher} from 'react-router';
import {useEffect, useState} from 'react';
import ProductItemtest from '../components/ProductItemtest';

export async function loader({context, request}) {
  try {
    const url = new URL(request.url);

    const handle = 'frontpage';
    const after = url.searchParams.get('after');
    const before = url.searchParams.get('before');

    let variables = {
      handle,
      country: context?.storefront?.i18n?.country,
      language: context?.storefront?.i18n?.language,
    };

    if (!after && !before) {
      variables.first = 6;
    }

    if (after) {
      variables.first = 6;
      variables.after = after;
    }

    if (before) {
      variables.last = 6;
      variables.before = before;
    }

    const data = await context.storefront.query(GET_COLLECTION_PRODUCTS_QUERY, {
      variables,
    });

    const products = data?.collection?.products?.edges;
    const pageInfo = data?.collection?.products?.pageInfo;

    const QUICK_VIEW = await context.storefront.query(METAOBJECTS_QUERY, {
      variables: {
        input: 'quick_view_button',
      },
    });

    const fields = QUICK_VIEW?.metaobjects?.nodes[0]?.fields || [];
    const QV_Settings = {};

    fields.forEach((f) => {
      if (f.key === 'customization') {
        let refField = f.reference.fields[0];
        if (refField.key === 'where_you_want_to_show') {
          QV_Settings['quickViewPosition'] = refField.value;
        }
      } else if (f.key === 'settings') {
        QV_Settings['settings'] = f.value;
      } else if (f.key === 'field_customization') {
        f.reference.fields.forEach((refField) => {
          if (refField.key === 'field_position') {
            QV_Settings['elementOrder'] = JSON.parse(refField.value);
          } else if (refField.key === 'colour') {
            QV_Settings['fontColor'] = refField.value;
          } else if (refField.key === 'font_size') {
            QV_Settings['fontSize'] = refField.value;
          } else if (refField.key === 'title_colour') {
            QV_Settings['titleColor'] = refField.value;
          } else if (refField.key === 'title_font_size') {
            QV_Settings['titleFontSize'] = refField.value;
          } else if (refField.key === 'price_font_colour') {
            QV_Settings['priceColor'] = refField.value;
          } else if (refField.key === 'price_font_size') {
            QV_Settings['priceFontSize'] = refField.value;
          } else if (refField.key === 'variant_colour') {
            QV_Settings['variantColor'] = refField.value;
          } else if (refField.key === 'variant_font_size') {
            QV_Settings['variantFontSize'] = refField.value;
          } else if (refField.key === 'cartbutton_font_colour') {
            QV_Settings['cartButtonColor'] = refField.value;
          } else if (refField.key === 'cartbutton_font_size') {
            QV_Settings['cartButtonFontSize'] = refField.value;
          }
        });
      }
    });

    return {products, pageInfo, QV_Settings};
  } catch (error) {
    console.error('Loader error:', error);
    return {products: [], pageInfo: {}, QV_Settings: {}};
  }
}

export default function ProductLine() {
  const {products, pageInfo, QV_Settings} = useLoaderData();
  const fetcher = useFetcher();
  const [productsToShow, setProductsToShow] = useState(products);
  const [pageInfoToShow, setPageInfoToShow] = useState(pageInfo);
  const [showQuickView, setShowQuickView] = useState(true);
  const [quickViewPosition, setQuickViewPosition] = useState('Top-Right');

  useEffect(() => {
    if (fetcher.data?.products) {
      setProductsToShow(fetcher?.data?.products);
      setPageInfoToShow(fetcher?.data?.pageInfo);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (QV_Settings?.settings === 'enabled') {
      setShowQuickView(true);
      setQuickViewPosition(QV_Settings?.quickViewPosition || 'Top-Right');
    } else {
      setShowQuickView(false);
    }
  }, [QV_Settings]);

  const loadNext = () => {
    if (!pageInfoToShow.endCursor) return;
    fetcher.load(`/plp?after=${pageInfoToShow?.endCursor}`);
  };

  const loadPrev = () => {
    if (!pageInfoToShow.startCursor) return;
    fetcher.load(`/plp?before=${pageInfoToShow?.startCursor}`);
  };

  return (
    <div>
      <h1 className="text-xl font-bold">Product Listing Page</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {productsToShow.map((p) => (
          <ProductItemtest
            key={p.node.id}
            product={p.node}
            showQuickView={showQuickView}
            quickViewPosition={quickViewPosition}
            QV_Settings={QV_Settings}
          />
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        {pageInfoToShow?.hasPreviousPage && (
          <button
            onClick={loadPrev}
            className="px-4 py-2 bg-gray-800 text-white rounded"
          >
            Previous
          </button>
        )}
        {pageInfoToShow?.hasNextPage && (
          <button
            onClick={loadNext}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

const METAOBJECTS_QUERY = `#graphql
query metaobjects($input: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  metaobjects(type: $input, first: 250) {
    nodes {
      handle
      id
      fields {
        key
        type
        value
        reference {
          ... on Metaobject {
            id
            handle
            fields {
              key
              type
              value
            }
          }
        }
      }
    }
  }
}
`;

const GET_COLLECTION_PRODUCTS_QUERY = ` #graphql
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

query GetCollectionProducts(
  $handle: String!
  $first: Int
  $after: String
  $last: Int
  $before: String
  $country: CountryCode
  $language: LanguageCode
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    id
    title
    products(
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges {
        cursor
        node {
          ...ProductFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
}`;
