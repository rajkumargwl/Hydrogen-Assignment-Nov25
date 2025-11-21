import React, {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router'; 
import {CartForm, Money} from '@shopify/hydrogen';

export function CartSummary({cart, layout = 'aside'}) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  const {customSubtotal, regularSubtotal, totalSavings} =
    calculateCartTotals(cart);

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <h4 id="cart-summary">Totals</h4>

      {totalSavings > 0 && (
        <div
          style={{
            backgroundColor: '#e8f5e9',
            padding: '10px',
            marginBottom: '12px',
            borderRadius: '4px',
          }}
        >
          <dl className="cart-discount-info">
            <dt style={{color: '#666', fontSize: '0.9em'}}>Regular Price:</dt>
            <dd style={{textDecoration: 'line-through', color: '#999'}}>
              ₹{regularSubtotal.toFixed(2)}
            </dd>
          </dl>

          <dl className="cart-discount-info" style={{marginTop: '6px'}}>
            <dt
              style={{
                color: '#2e7d32',
                fontWeight: 'bold',
                fontSize: '0.9em',
              }}
            >
              You Save:
            </dt>
            <dd style={{color: '#2e7d32', fontWeight: 'bold'}}>
              ₹{totalSavings.toFixed(2)}
            </dd>
          </dl>
        </div>
      )}

      <dl className="cart-subtotal">
        <dt>Subtotal</dt>
        <dd>
          {customSubtotal > 0 ? (
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>
              ₹{customSubtotal.toFixed(2)}
            </span>
          ) : cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart?.cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>

      <CartDiscounts discountCodes={cart?.discountCodes} />
      <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />
      
      <DraftOrderCheckoutActions cart={cart} />

      <style>{`
        .cart-summary-page {
          max-width: 420px;
        }
        .cart-summary-aside {
          width: 320px;
        }
        .cart-subtotal dt,
        .cart-subtotal dd {
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function parseAttributeFloat(value) {
  if (value == null) return 0;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateCartTotals(cart) {
  let customSubtotal = 0;
  let regularSubtotal = 0;

  const lines = cart?.lines?.nodes ?? [];

  for (const line of lines) {
    const attrs = line.attributes ?? [];
    const customAttr = attrs.find((a) => a.key === '_custom_unit_price');
    const originalAttr = attrs.find((a) => a.key === '_original_unit_price');

    const fallback =
      line?.cost?.amountPerQuantity?.amount
        ? parseFloat(line.cost.amountPerQuantity.amount)
        : 0;

    const custom = customAttr ? parseAttributeFloat(customAttr.value) : fallback;
    const original = originalAttr
      ? parseAttributeFloat(originalAttr.value)
      : fallback;

    customSubtotal += custom * line.quantity;
    regularSubtotal += original * line.quantity;
  }

  return {
    customSubtotal,
    regularSubtotal,
    totalSavings: Math.max(0, regularSubtotal - customSubtotal),
  };
}

const CHECKOUT_REDIRECT_ACTION = 'CHECKOUT_REDIRECT';

function DraftOrderCheckoutActions({cart}) {
  const hasItems = (cart?.lines?.nodes?.length ?? 0) > 0;
  
  if (!hasItems) return null;

  return (
    <CartForm
        route="/cart"
        action={CHECKOUT_REDIRECT_ACTION}
    >
        {({state}) => (
            <div>
                <button
                    type="submit"
                    disabled={state !== 'idle'}
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        borderRadius: '4px',
                        border: 'none',
                        textAlign: 'center',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '1em',
                        fontWeight: 'bold',
                        opacity: state !== 'idle' ? 0.7 : 1,
                    }}
                >
                    {state === 'submitting' ? 'Creating Checkout...' : 'Continue to Checkout →'}
                </button>

                <p style={{fontSize: '0.75em', color: '#666', marginTop: '8px'}}>
                    Custom pricing will be applied via Draft Order.
                </p>
            </div>
        )}
    </CartForm>
  );
}

function CartDiscounts({discountCodes}) {
  const codes =
    discountCodes?.filter((d) => d.applicable)?.map((d) => d.code) ?? [];

  return (
    <div style={{marginBottom: '12px'}}>
      <dl hidden={!codes.length}>
        <dt>Discount(s)</dt>
        <UpdateDiscountForm>
          <div className="cart-discount">
            <code>{codes.join(', ')}</code>
            &nbsp;
            <button type="submit">Remove</button>
          </div>
        </UpdateDiscountForm>
      </dl>

      <UpdateDiscountForm discountCodes={codes}>
        <div style={{marginTop: codes.length ? '8px' : 0}}>
          <input type="text" name="discountCode" placeholder="Discount code" />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function CartGiftCard({giftCardCodes}) {
  const appliedGiftCardCodes = useRef([]);
  const inputRef = useRef(null);
  const fetcher = useFetcher({key: 'gift-card-add'});

  useEffect(() => {
    if (fetcher.data && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [fetcher.data]);

  return (
    <div style={{marginBottom: '12px'}}>
      {giftCardCodes?.length > 0 && (
        <dl>
          <dt>Applied Gift Card(s)</dt>
          {giftCardCodes.map((gc) => (
            <RemoveGiftCardForm key={gc.id} giftCardId={gc.id}>
              <div className="cart-discount">
                <code>***{gc.lastCharacters}</code>
                &nbsp;
                <Money data={gc.amountUsed} />
                &nbsp;
                <button type="submit">Remove</button>
              </div>
            </RemoveGiftCardForm>
          ))}
        </dl>
      )}

      <UpdateGiftCardForm
        giftCardCodes={appliedGiftCardCodes.current}
        fetcherKey="gift-card-add"
      >
        <div style={{marginTop: '8px'}}>
          <input
            ref={inputRef}
            type="text"
            name="giftCardCode"
            placeholder="Gift card code"
          />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateGiftCardForm>
    </div>
  );
}

function UpdateDiscountForm({discountCodes = [], children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{discountCodes}}
    >
      {() => children}
    </CartForm>
  );
}

function UpdateGiftCardForm({giftCardCodes = [], fetcherKey, children}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesUpdate}
      inputs={{giftCardCodes}}
    >
      {() => children}
    </CartForm>
  );
}

function RemoveGiftCardForm({giftCardId, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{giftCardCodes: [giftCardId]}}
    >
      {() => children}
    </CartForm>
  );
}

export default CartSummary;