import { AddToCartButton } from './AddToCartButton';

export default function AddToCartButtonComponent({ selectedVariant, AddToCart, setDisplayMessage, color, font }) {
    return (
        <div className={`order-${AddToCart}`}>
            <AddToCartButton
                disabled={!selectedVariant?.availableForSale}
                // onClick={() => {
                //   open('cart');
                // }}

                onClick={() => {
                    setDisplayMessage(true);
                }}

                lines={
                    selectedVariant
                        ? [
                            {
                                merchandiseId: selectedVariant?.id,
                                quantity: 1,
                                selectedVariant,
                            },
                        ]
                        : []
                }
            >
                {selectedVariant?.availableForSale ? <div style={{color: color, fontSize: font}}>Add to cart</div> : <div style={{color: color, fontSize: font}}>Sold out</div>}
            </AddToCartButton>
        </div>
    )
}