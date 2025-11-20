import React from "react";
// import type { ProductFragment } from "~/types/shopify"; // You will create this later if needed

interface ProductCardProps {
  product: any; // For now keep as any, we can type it later
  showQuickView?: boolean;
  onQuickView?: (product: any) => void;
}

export default function ProductCard({
  product,
  showQuickView = true,
  onQuickView,
}: ProductCardProps) {
  const image = product?.featuredImage?.url;
  const title = product?.title;

  return (
    <div className="group relative border rounded-xl p-3 shadow-sm hover:shadow-md transition">
      {/* Product Image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Title */} 
      <h3 className="mt-3 text-base font-medium">{title}</h3>

      {/* Price */}
      <p className="text-sm text-gray-600">
        {product?.priceRange?.minVariantPrice?.amount}{" "}
        {product?.priceRange?.minVariantPrice?.currencyCode}
      </p>

      {/* Quick View Button */}
      {showQuickView && (
        <button
          onClick={() => onQuickView?.(product)}
          className="absolute left-1/2 -translate-x-1/2 bottom-4 bg-black text-white text-sm px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition"
        >
          Quick View
        </button>
      )}
    </div>
  );
}
