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
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductImageGallery} from '~/components/ProductImageGallery';
import {PRODUCT_QUERY} from '~/lib/queries';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Hydrogen | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const {context, params, request} = args;
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // Fetch product data
  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions: getSelectedProductOptions(request)},
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // Fetch metaobject data for all variants
  const metaobjectImageData = await fetchMetaobjectImageData(product, storefront);


  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
    metaobjectImageData,
  };
}

/**
 * Fetch image data from metaobjects
 */
async function fetchMetaobjectImageData(product: any, storefront: any) {
  const imageData: Record<string, any[]> = {};

  // Get all unique metaobject IDs from all variants
  const metaobjectIds = new Set<string>();
  
  product.variants?.nodes?.forEach((variant: any) => {
    const metafieldValue = variant.metafield?.value;
    if (metafieldValue) {
      try {
        const ids = JSON.parse(metafieldValue);
        if (Array.isArray(ids)) {
          ids.forEach((id: string) => metaobjectIds.add(id));
        }
      } catch (e) {
        console.error('Error parsing metafield value:', e);
      }
    }
  });

  // Fetch all metaobjects and their actual images
  const metaobjectPromises = Array.from(metaobjectIds).map(async (metaobjectId) => {
    try {
      const result = await storefront.query(`#graphql
        query MetaobjectWithImages($id: ID!) {
          metaobject(id: $id) {
            id
            type
            fields {
              key
              value
              type
            }
          }
        }
      `, {
        variables: { id: metaobjectId }
      });

      return result.metaobject;
    } catch (error) {
      console.error(`Error fetching metaobject ${metaobjectId}:`, error);
      return null;
    }
  });

  const metaobjects = (await Promise.all(metaobjectPromises)).filter(Boolean);

  // Process each metaobject to extract image data
  for (const metaobject of metaobjects) {
    const galleryField = metaobject.fields.find((field: any) => field.key === 'gallery_images');
    
    if (galleryField?.value) {
      try {
        const imageReferences = JSON.parse(galleryField.value);
        console.log(`📸 Metaobject ${metaobject.id} has ${imageReferences.length} image references:`, imageReferences);

        if (Array.isArray(imageReferences)) {
       
          const imagePromises = imageReferences.map(async (imageRef: string) => {
            try {
              // Extract the MediaImage ID
              const match = imageRef.match(/gid:\/\/shopify\/MediaImage\/(\d+)/);
              if (match) {
                const mediaId = `gid://shopify/MediaImage/${match[1]}`;
                
                const imageResult = await storefront.query(`#graphql
                  query MediaImage($id: ID!) {
                    mediaImage: node(id: $id) {
                      ... on MediaImage {
                        id
                        image {
                          url
                          altText
                          width
                          height
                        }
                      }
                    }
                  }
                `, {
                  variables: { id: mediaId }
                });

                return imageResult.mediaImage?.image;
              }
            } catch (error) {
              console.error(`Error fetching image ${imageRef}:`, error);
            }
            return null;
          });

          const images = (await Promise.all(imagePromises)).filter(Boolean);
          console.log(`✅ Fetched ${images.length} actual images for metaobject ${metaobject.id}`);
          
          // Store the images by metaobject ID
          imageData[metaobject.id] = images;
        }
      } catch (e) {
        console.error('Error parsing gallery images:', e);
      }
    }
  }

  return imageData;
}

export default function Product() {
  const {product, metaobjectImageData} = useLoaderData<typeof loader>();


  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;

  return (
    <div className="product">
      <ProductImageGallery 
        selectedVariant={selectedVariant}
        metaobjectImageData={metaobjectImageData}
      />
      <div className="product-main">
        <h1>{title}</h1>
        <ProductPrice
          price={selectedVariant?.price}
          compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <br />
        <ProductForm
          productOptions={productOptions}
          selectedVariant={selectedVariant}
        />
        <br />
        <br />
        <p>
     
          <strong>Product Overview</strong>
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