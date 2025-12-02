import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {useEffect} from 'react';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

function getCustomPrice(product, variant = null) {
  // --- 1. Base Price ---
  const baseMeta = product.customPrice?.value;
  const custom = baseMeta ? parseFloat(JSON.parse(baseMeta).amount) : null;

  // If customPrice is null → fallback to variant.VariantPrice
  const variantPrice = product?.VariantPrice
    ? parseFloat(String(product.VariantPrice))
    : 0;
  const base = custom ?? variantPrice;
  
  const percentage =
    parseFloat(variant?.discountPercentage?.value) ||
    parseFloat(product.discountPercentage?.value) ||
    0;

  // --- 3. Fixed Discount ---
  const fixedMeta =
    variant?.discountFixedAmount?.value ||
    product.discountFixedAmount?.value;

  const fixed = fixedMeta ? parseFloat(JSON.parse(fixedMeta).amount) : 0;

  // --- 4. Apply Discount ---
  const percentageDiscount = (base * percentage) / 100;
  const maxDiscount = Math.max(percentageDiscount, fixed);

  const finalPrice = base - maxDiscount;
  return {
    basePrice: base,
    finalPrice,
    discountApplied: maxDiscount,
    discountPercentage: percentage,
    isVariantPrice: !!variant, 
  };
}

async function testUpdateCatalogPrice(variantID,newPrice,compareAtPrice :any) {
    if(!variantID || !newPrice){
    return 'NO product in cart';
  }
    const res = await fetch("/api/updateCatalogPrice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: variantID,
        finalPrice: newPrice,
        compareAtPrice:compareAtPrice
      }),
    });

    const data = await res.json();
  }
  
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const lines = cart?.lines?.nodes || [];
  useEffect(() => {
    async function updateCartPrices() {
      for (const line of lines) {
        const variantID = line.merchandise?.id;
        
        if (!variantID) continue;

        // --- 1. Fetch latest variant/product price ---
        const res = await fetch("/api/getVariantPrice", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({variantId: variantID}),
        });
        const variantData = await res.json();
        if (!variantData) continue;

       const productObj = {
        VariantPrice:variantData.basePrice,
        customPrice: variantData.customPrice
          ? { value: `{"amount":"${variantData.customPrice}","currency_code":"INR"}` }
          : null,
        discountPercentage: { value: variantData.discountPercentage ?? "0" },
        discountFixedAmount: { value: `{"amount":"${variantData.discountFixedAmount ?? "0"}","currency_code":"INR"}` },
      };
      // --- 3. Calculate final price ---
      const finalPriceObj = getCustomPrice(productObj);
      // --- 4. Compare with current cart line finalPrice ---

      const attrs = line.attributes || [];
      const currentFinalPriceAttr = attrs.find(a => a.key === "finalPrice");
      const currentFinalPrice = currentFinalPriceAttr ? parseFloat(currentFinalPriceAttr.value) : null;
      const variantPrice = variantData?.basePrice;
        if(finalPriceObj.basePrice!==0){
          await testUpdateCatalogPrice(variantID, finalPriceObj.finalPrice,finalPriceObj.basePrice);
        }else{
          await testUpdateCatalogPrice(variantID,finalPriceObj.finalPrice,variantPrice);
        }
      }
  }

  updateCartPrices();
}, [cart]);
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <div aria-labelledby="cart-lines">
          <ul>
            {(cart?.lines?.nodes ?? []).map((line) => (
              <CartLineItem key={line.id} line={line} layout={layout} />
            ))}
          </ul>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </div>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div hidden={hidden}>
      <br />
      <p>
        Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
        started!
      </p>
      <br />
      <Link to="/collections" onClick={close} prefetch="viewport">
        Continue shopping →
      </Link>
    </div>
  );
}
