import type { ActionFunctionArgs } from "@remix-run/node";

async function shopifyAdminRequest(storeUrl: string, adminToken: string, query: string, variables?: Record<string, any>) {
  const res = await fetch(`https://${storeUrl}/admin/api/2025-04/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json();
  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }
  return data.data;
}

async function getCompanyLocationCatalogId(storeUrl: string, adminToken: string): Promise<string> {
  const query = `
    query GetCompanyLocationCatalogs($first: Int = 10) {
      catalogs(first: $first, type: COMPANY_LOCATION) {
        nodes {
          id
          title
          status
        }
      }
    }
  `;
  const data = await shopifyAdminRequest(storeUrl, adminToken, query);
  if (!data.catalogs.nodes.length) throw new Error("No company location catalogs found");
  return data.catalogs.nodes[0].id;
}

async function getPriceListIdFromCatalog(storeUrl: string, adminToken: string, catalogId: string): Promise<string> {
  const query = `
    query GetCatalogPriceLists($catalogId: ID!) {
      catalog(id: $catalogId) {
        ... on CompanyLocationCatalog {
          id
          title
          priceList {
              id
              name
          }
        }
      }
    }
  `;
  const data = await shopifyAdminRequest(storeUrl, adminToken, query, { catalogId });
  const priceList = data.catalog.priceList;
  if (!priceList) throw new Error("No price list found in catalog");
  return priceList.id;
}

async function updateVariantPrice(
  storeUrl: string,
  adminToken: string,
  priceListId: string,
  variantId: string,
  finalPrice: string,
  compareAtPrice?: string
) {
  const mutation = `
    mutation UpdatePriceListVariantPrice(
      $priceListId: ID!
      $variantId: ID!
      $price: MoneyInput!
      $compareAtPrice: MoneyInput
    ) {
      priceListFixedPricesAdd(
        priceListId: $priceListId
        prices: [
          {
            variantId: $variantId
            price: $price
            compareAtPrice: $compareAtPrice
          }
        ]
      ) {
        userErrors {
          field
          message
        }
      }
    }
  `;
  const variables = {
    priceListId,
    variantId,
    price: { amount: finalPrice, currencyCode: "INR" },
    compareAtPrice: compareAtPrice
      ? { amount: compareAtPrice, currencyCode: "INR" }
      : null,
  };

  const data = await shopifyAdminRequest(storeUrl, adminToken, mutation, variables);
  return data.priceListFixedPricesAdd;
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const storeUrl = context.env.PUBLIC_STORE_DOMAIN;
    const adminToken = context.env.PRIVATE_STOREFRONT_API_TOKEN;
    const { variantId, finalPrice, compareAtPrice } = body;

    if (!variantId || !finalPrice) {
      return Response.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const catalogId = await getCompanyLocationCatalogId(storeUrl, adminToken);
    const priceListId = await getPriceListIdFromCatalog(storeUrl, adminToken, catalogId);
    const result = await updateVariantPrice(storeUrl, adminToken, priceListId, variantId, finalPrice, compareAtPrice);

    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}