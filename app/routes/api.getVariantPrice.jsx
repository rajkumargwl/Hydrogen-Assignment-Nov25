export async function action({ request, context }) {
  try {
    const { variantId } = await request.json();

    if (!variantId) {
      return Response.json({ error: "variantId is required" }, { status: 400 });
    }

    // GraphQL query to fetch variant & product metafields
    const QUERY = `
      query ProductFromVariant($id: ID!) {
        node(id: $id) {
          ... on ProductVariant {
            id
            price {
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
      
            product {
              id
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
      }
    `;

    const result = await context.storefront.query(QUERY, {
      variables: { id: variantId },
    });

    const variant = result?.node;
    if (!variant) {
      return Response.json({ error: "Variant not found" }, { status: 404 });
    }

    // Determine customPrice: variant metafield first, then product metafield
     let customPrice = null;
    if (variant.customPrice?.value) {
      try {
        const parsed = JSON.parse(variant.customPrice.value);
        customPrice = parsed.amount ?? null;
      } catch {
        customPrice = null;
      }
    } else if (variant.product?.customPrice?.value) {
      try {
        const parsed = JSON.parse(variant.product.customPrice.value);
        customPrice = parsed.amount ?? null;
      } catch {
        customPrice = null;
      }
    }

    // Determine discountPercentage
    const discountPercentage =
      variant.discountPercentage?.value ??
      variant.product?.discountPercentage?.value ??
      null;

    // Determine discountFixedAmount
    let discountFixedAmount = null;
    if (variant.discountFixedAmount?.value) {
      try {
        const parsed = JSON.parse(variant.discountFixedAmount.value);
        discountFixedAmount = parsed.amount ?? null;
      } catch {}
    } else if (variant.product?.discountFixedAmount?.value) {
      try {
        const parsed = JSON.parse(variant.product.discountFixedAmount.value);
        discountFixedAmount = parsed.amount ?? null;
      } catch {}
    }

    return Response.json({
      variantId: variant.id,
      productId: variant.product?.id ?? null,
      basePrice: variant.price?.amount ?? null,
      customPrice,
      discountPercentage,
      discountFixedAmount,
      currency: variant.price?.currencyCode ?? "INR",
    });
  } catch (error) {
    console.error("getVariantPrice error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}