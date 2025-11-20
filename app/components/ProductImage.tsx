
// import {Image} from '@shopify/hydrogen';
// import {useMemo} from 'react';

// export function ProductImage({
//   image,
//   allMedia = [],
//   selectedVariant,
// }) {
//   if (!image) {
//     return <div className="product-image" />;
//   }

//   // Find selected color from variant
//   const selectedColor = selectedVariant?.selectedOptions?.find(
//     (opt) => opt.name.toLowerCase() === "color"
//   )?.value?.toLowerCase();

//   // Filter based on image alt text
//   const filteredImages = useMemo(() => {
//     if (!selectedColor) return allMedia;

//     return allMedia.filter((img) => {
//       const alt = img?.image?.altText?.toLowerCase() || "";
//       return alt.includes(selectedColor) || alt.includes("default");
//     });
//   }, [allMedia, selectedColor]);

//   // Determine the main image to show
//   const mainImage = filteredImages[0]?.image || image;

//   return (
//     <div className="product-image-wrapper">
//       {/* Main Image Container */}
//       <div className="main-image-container">
//         <Image
//           alt={mainImage.altText || 'Product Image'}
//           aspectRatio="1/1"
//           data={mainImage}
//           key={mainImage.id}
//           sizes="(min-width: 45em) 50vw, 100vw"
//           className="main-product-image"
//         />
//       </div>

//       {/* Thumbnails */}
//       {filteredImages.length > 1 && (
//         <div className="thumbnails-container">
//           {filteredImages.map((img) => (
//             <div 
//               key={img.id}
//               className={`thumbnail-wrapper ${
//                 img.image.url === mainImage.url ? 'thumbnail-active' : ''
//               }`}
//             >
//               <Image
//                 data={img.image}
//                 alt={img.image.altText || ""}
//                 className="thumbnail-image"
//               />
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
import {Image} from '@shopify/hydrogen';
import {useMemo, useState} from 'react';

export function ProductImage({
  image,
  allMedia = [],
  selectedVariant,
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!image) {
    return <div className="product-image" />;
  }

  // Find selected color from variant
  const selectedColor = selectedVariant?.selectedOptions?.find(
    (opt) => opt.name.toLowerCase() === "color"
  )?.value?.toLowerCase();

  // Filter images based on selected color alt text
  const filteredImages = useMemo(() => {
    if (!selectedColor) return allMedia;

    const colorImages = allMedia.filter((img) => {
      const alt = img?.image?.altText?.toLowerCase() || "";
      return alt.includes(selectedColor);
    });

    // If no color-specific images found, return all images
    return colorImages.length > 0 ? colorImages : allMedia;
  }, [allMedia, selectedColor]);

  // Reset selected image index when color changes
  useState(() => {
    setSelectedImageIndex(0);
  }, [selectedColor]);

  // Determine the main image to show
  const mainImage = filteredImages[selectedImageIndex]?.image || image;

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="product-image-wrapper">
      {/* Main Image Container */}
      <div className="main-image-container">
        <Image
          alt={mainImage.altText || 'Product Image'}
          aspectRatio="1/1"
          data={mainImage}
          key={mainImage.id}
          sizes="(min-width: 45em) 50vw, 100vw"
          className="main-product-image"
        />
      </div>

      {/* Thumbnails */}
      {filteredImages.length > 1 && (
        <div className="thumbnails-container">
          {filteredImages.map((img, index) => (
            <div 
              key={img.id}
              className={`thumbnail-wrapper ${
                index === selectedImageIndex ? 'thumbnail-active' : ''
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <Image
                data={img.image}
                alt={img.image.altText || ""}
                className="thumbnail-image"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}