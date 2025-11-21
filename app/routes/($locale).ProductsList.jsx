import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem2';
import { useEffect, useState } from 'react';

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
	// Start fetching non-critical data without blocking time to first byte
	const deferredData = loadDeferredData(args);

	// Await the critical data required to render initial state of the page
	const criticalData = await loadCriticalData(args);

	const metaobject = await args.context.storefront.query(`query GetQuickViewMetaobject {
    metaobjects(type: "quick_view", first: 1) {
      edges {
        node {
          id
          fields {
            key
            value
          }
        }
      }
    }
  }`);

  const metaobject_order_of_elements = await args.context.storefront.query(`query GetQuickViewMetaobject {
    metaobjects(type: "order_of_elements", first: 1) {
      edges {
        node {
          id
          fields {
            key
            value
          }
        }
      }
    }
  }`);

   const metaobject_font_color = await args.context.storefront.query(`query GetFontandColor
	{
    metaobjects(type: "font_size", first: 1) {
      edges {
        node {
          id
          fields {
            key
            value
          }
        }
      }
    }}`);



	return {...deferredData, ...criticalData, metaobject, metaobject_order_of_elements, metaobject_font_color};
}

/**
 * Load critical data required to render products listing above the fold.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, request}) {
	const paginationVariables = getPaginationVariables(request, {
		pageBy: 8,
	});

	const [{products}] = await Promise.all([
		context.storefront.query(PRODUCTS_QUERY, {
			variables: paginationVariables,
		}),
	]);

	return {products};
}

function loadDeferredData() {
	return {};
}

export default function ProductsList() {
	const {products, metaobject, metaobject_order_of_elements, metaobject_font_color} = useLoaderData();
	console.log("metaobject: ",metaobject?.metaobjects.edges[0]?.node.fields);
	console.log("metaobject_order_of_elements: ",metaobject_order_of_elements?.metaobjects.edges[0]?.node.fields[0]?.value);
	console.log("metaobject_font_color: ",metaobject_font_color?.metaobjects.edges[0]?.node.fields[0]?.value," and ", metaobject_font_color?.metaobjects.edges[0]?.node.fields[1]?.value);
	console.log("products",products);

	// const show = metaobject?.metaobjects.edges[0]?.node.fields[0]?.value == 'true';
	const show = metaobject?.metaobjects.edges[0]?.node.fields[3]?.value == 'true';

	// console.log("show quick view: ", show);

	const [displayMessage, setDisplayMessage] = useState(false);

	useEffect(() => {
		console.log("displayMessage changed: ", displayMessage);
        
		if (displayMessage) {
			const timer = setTimeout(() => {
				setDisplayMessage(false);
			}, 3000);
		} 


	}, [displayMessage]);

	return (
		<div className="products">

            {displayMessage && (
                <div className="absolute top-0 left-0 right-0 bg-green-100 text-green-800 p-2 text-center rounded-t-lg z-100 w-[10%] m-auto mt-5">
                    Item added to cart!
                </div>
            )}

			<h1>Products</h1>
			<PaginatedResourceSection
				connection={products}
				resourcesClassName="products-grid"
			>
				{({node: product, index}) => (
					<ProductItem
						key={product.id}
						product={product}
						loading={index < 3 ? 'eager' : undefined}
						showQuickView={show}
						displayMessage={displayMessage}
						setDisplayMessage={setDisplayMessage}
						// orderOfElements={metaobject_order_of_elements?.metaobjects.edges[0]?.node.fields[0]?.value}
						// font={metaobject_font_color?.metaobjects.edges[0]?.node.fields[1]?.value}
						// color={metaobject_font_color?.metaobjects.edges[0]?.node.fields[0]?.value}
						orderOfElements={metaobject?.metaobjects.edges[0]?.node.fields[2]?.value}
						font={metaobject?.metaobjects.edges[0]?.node.fields[1]?.value}
						color={metaobject?.metaobjects.edges[0]?.node.fields[0]?.value}
					/>
				)}
			</PaginatedResourceSection>
		</div>
	);
}

const PRODUCTS_QUERY = `#graphql
	fragment ProductListItem on Product {
		id
		title
		handle
		featuredImage {
			id
			url
			altText
			width
			height
		}
		images(first: 250) {
			nodes {
				id
				url
				altText
				width
				height
			}
		}
  options {
    name
    values
  }
		variants(first: 250) {
			nodes {
				id
				title
				sku
				availableForSale
				selectedOptions {
					name
					value
				}
				image {
					id
					url
					altText
					width
					height
				}
				priceV2 {
					amount
					currencyCode
				}
				compareAtPriceV2 {
					amount
					currencyCode
				}
			}
		}
		priceRange {
			minVariantPrice {
				amount
				currencyCode
			}
		}
	}
	query StoreProducts(
		$country: CountryCode
		$endCursor: String
		$first: Int
		$language: LanguageCode
		$last: Int
		$startCursor: String
	) @inContext(country: $country, language: $language) {
		products(
			first: $first,
			last: $last,
			before: $startCursor,
			after: $endCursor
		) {
			nodes {
				...ProductListItem
			}
			pageInfo {
				hasNextPage
				hasPreviousPage
				startCursor
				endCursor
			}
		}
	}
`;

/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */

