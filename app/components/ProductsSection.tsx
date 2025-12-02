import React, { useState } from "react";
import {ProductPrice} from '~/components/ProductPrice';
import CustomPrice from "./CustomPrice";

interface ProductImage {
  url: string;
  altText?: string;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  price?: string;
  image?: ProductImage;       
  hoverImage?: ProductImage;
}

interface ProductsSectionProps {
  title?: string;
  products?: Product[];
}

export default function ProductsSection({
  title = "Featured Products",
  products = [],
}: ProductsSectionProps) {
  if (!products.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          return <ProductCard key={product.id} product={product} />;
        })}
      </div>
    </section>
  );
}
function getCustomPrice(product) {
 const customMeta = product.customPrice?.value;
  const custom = customMeta ? parseFloat(JSON.parse(customMeta).amount) : null;
  const originalPrice = parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0;
  const base = custom ?? originalPrice;

  const percentage = parseFloat(product.discountPercentage?.value || 0);

  const fixedMeta = product.discountFixedAmount?.value;
  const fixed = fixedMeta ? parseFloat(JSON.parse(fixedMeta).amount) : 0;

  const percentageDiscount = (base * percentage) / 100;
  const maxDiscount = Math.max(percentageDiscount, fixed);

  const finalPrice = base - maxDiscount;

  return {
    basePrice: base,
    finalPrice,
    discountApplied: maxDiscount,
    discountPercentage: percentage, 
  };
}

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const mainImg = product.image?.url;
  const hoverImg = product.hoverImage?.url;
  const customPrice = getCustomPrice(product);
  return (
    <a
      href={`/products/${product.handle}`}
      className="block border rounded-lg overflow-hidden hover:shadow-lg transition relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-64 overflow-hidden">
        {/* Main Image */}
        <img
          src={mainImg}
          alt={product.image?.altText || product.title}
          className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${
            isHovered && hoverImg ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Hover Image */}
        {hoverImg && (
          <img
            src={hoverImg}
            alt={product.hoverImage?.altText || product.title}
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
      <br />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {product.title}
        </h3>
        <CustomPrice
        finalPrice={customPrice.finalPrice}
        basePrice={customPrice.basePrice}
        discountPercentage={customPrice.discountPercentage}
      />
      </div>
    </a>
  );
}
