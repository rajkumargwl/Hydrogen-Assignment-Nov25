import { Money } from '@shopify/hydrogen';

export default function PriceComponent({ Price, selectedVariant, font,color }) {
    console.log("Selected Variant Price: ", selectedVariant?.priceV2);
    return (
        <small style={{color: color, fontSize: font}} className={`block mt-2 text-gray-600 order-${Price}`}>
         <Money data={selectedVariant?.priceV2} />
        </small>
    )
}