import {CartForm} from '@shopify/hydrogen';

// Using consistent attribute keys (e.g., starting with underscore for custom data)
const CUSTOM_PRICE_KEY = '_custom_unit_price';
const ORIGINAL_PRICE_KEY = '_original_unit_price';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  customPrice,
  originalPrice,
}) {
  const linesArray = lines || [];

  const linesWithCustomPrice = linesArray.map((line) => {
    // Check if the required price props are provided before adding attributes
    if (customPrice && originalPrice) {
      return {
        ...line,
        attributes: [
          {
            key: CUSTOM_PRICE_KEY,
            value: customPrice.toString(), 
          },
          {
            key: ORIGINAL_PRICE_KEY,
            value: originalPrice.toString(), 
          },
        ],
      };
    }
    return line;
  });

  return (
    <CartForm 
      route="/cart" 
      inputs={{lines: linesWithCustomPrice}} 
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}