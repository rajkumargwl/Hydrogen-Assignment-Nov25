import {CartForm} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 * }}
 */
export function AddToCartButtonQuickView({
  analytics,
  children,
  disabled,
  lines,
  onClick
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => {
        
       return  <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          

          <button
          type="submit"
          onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          className="w-50 bg-black text-white py-3 rounded-md font-medium 
          hover:bg-opacity-80 transition-colors"
          >
           {children}
          </button>

        </>
}
      }
    </CartForm>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
