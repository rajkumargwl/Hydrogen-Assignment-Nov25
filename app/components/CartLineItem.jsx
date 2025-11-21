import {CartForm, Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from './Aside';

export function CartLineItem({layout, line}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();

  // Access attributes from line.attributes
  const customPriceAttribute = (line.attributes ?? []).find(
    (attr) => attr.key === '_custom_unit_price',
  );
  const originalPriceAttribute = (line.attributes ?? []).find(
    (attr) => attr.key === '_original_unit_price',
  );

  const customPriceValue = customPriceAttribute?.value;
  const originalPriceValue = originalPriceAttribute?.value;

  const hasCustomPrice = !!customPriceValue && !!originalPriceValue;
  
  const currencyCode = line.cost?.amountPerQuantity?.currencyCode || 'INR';
  
  let hasDiscount = false;
  let customUnitAmount = 0;
  let originalUnitAmount = 0;
  
  if (hasCustomPrice) {
    customUnitAmount = parseFloat(customPriceValue);
    originalUnitAmount = parseFloat(originalPriceValue);
    
    if (!isNaN(customUnitAmount) && !isNaN(originalUnitAmount)) {
      hasDiscount = customUnitAmount < originalUnitAmount;
    }
  }

  const createMoneyData = (amount) => ({
    amount: amount.toFixed(2), 
    currencyCode: currencyCode,
  });

  return (
    <li key={id} className="cart-line">
      {image && (
        <Image
          alt={title}
          aspectRatio="1/1"
          data={image}
          height={100}
          loading="lazy"
          width={100}
        />
      )}

      <div>
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') {
              close();
            }
          }}
        >
          <p>
            <strong>{product.title}</strong>
          </p>
        </Link>
        
        {hasCustomPrice ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              {hasDiscount && (
                <s className="text-gray-500 text-sm">
                  <Money data={createMoneyData(originalUnitAmount)} />
                </s>
              )}
              
              <p className={hasDiscount ? 'font-bold text-red-600' : 'font-bold'}>
                <Money data={createMoneyData(customUnitAmount)} />
              </p>
            </div>
            
            <p className="text-sm text-gray-600">
              Total: <Money data={createMoneyData(customUnitAmount * line.quantity)} />
            </p>
          </div>
        ) : (
          line.cost ? (
            <div>
              <Money data={line.cost.amountPerQuantity} />
              <p className="text-sm text-gray-600">
                Total: <Money data={line.cost.totalAmount} />
              </p>
            </div>
          ) : (
             <p className="text-sm text-gray-500">Loading price...</p>
          )
        )}
        
        <ul>
          {selectedOptions.map((option) => (
            <li key={option.name}>
              <small>
                {option.name}: {option.value}
              </small>
            </li>
          ))}
        </ul>
        <CartLineQuantity line={line} />
      </div>
    </li>
  );
}

function CartLineQuantity({line}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="cart-line-quantity">
      <small>Quantity: {quantity} &nbsp;&nbsp;</small>
      <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          aria-label="Decrease quantity"
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
        >
          <span>&#8722; </span>
        </button>
      </CartLineUpdateButton>
      &nbsp;
      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          aria-label="Increase quantity"
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
        >
          <span>&#43;</span>
        </button>
      </CartLineUpdateButton>
      &nbsp;
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

function CartLineRemoveButton({lineIds, disabled}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button disabled={disabled} type="submit">
        Remove
      </button>
    </CartForm>
  );
}

/**
 * @param {{
 * children: React.ReactNode;
 * lines: CartLineUpdateInput[];
 * }}
 */
function CartLineUpdateButton({children, lines}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

function getUpdateKey(lineIds) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}