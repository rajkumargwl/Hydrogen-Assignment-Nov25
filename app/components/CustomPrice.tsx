import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";

export default function CustomPrice({
  finalPrice,
  basePrice,
  currencyCode = "INR",
  discountPercentage,
  showBadge = true,
}: {
  finalPrice: number;
  basePrice?: number;
  currencyCode?: MoneyV2["currencyCode"];
  discountPercentage?: number | null;
  showBadge?: boolean;
}) {
const safeDiscount = discountPercentage
  ? Math.abs(Number(discountPercentage))
  : 0;
  const hasDiscount = safeDiscount > 0 && basePrice && basePrice > finalPrice;

   return (
    <div className="flex items-center gap-2">
      {/* Final Price */}
      <span className="text-lg font-bold text-gray-900">
        <Money data={{ amount: String(finalPrice), currencyCode }} />
      </span>

      {/* Base Price (striked out) */}
      {basePrice && basePrice > finalPrice && (
        <span className="line-through text-gray-500 text-sm">
          <Money data={{ amount: String(basePrice), currencyCode }} />
        </span>
      )}

      {/* Discount Badge */}
      {showBadge && hasDiscount && (
        <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
          -{safeDiscount}% OFF
        </span>
      )}
    </div>
  );
}
