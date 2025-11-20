
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


  const selectedColor = selectedVariant?.selectedOptions?.find(
    (opt) => opt.name.toLowerCase() === "color"
  )?.value?.toLowerCase();

 
  const filteredImages = useMemo(() => {
    if (!selectedColor) return allMedia;

    const colorImages = allMedia?.filter((img) => {
      const alt = img?.image?.altText?.toLowerCase() || "";
      return alt?.includes(selectedColor);
    });

  
    return colorImages.length > 0 ? colorImages : allMedia;
  }, [allMedia, selectedColor]);

  useState(() => {
    setSelectedImageIndex(0);
  }, [selectedColor]);


  const mainImage = filteredImages[selectedImageIndex]?.image || image;

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="product-image-wrapper">
      
      <div className="main-image-container">
        <Image
          alt={mainImage?.altText || 'Product Image'}
          aspectRatio="1/1"
          data={mainImage || {}}
          key={mainImage?.id}
          sizes="(min-width: 45em) 50vw, 100vw"
          className="main-product-image"
        />
      </div>
      {filteredImages?.length > 1 && (
        <div className="thumbnails-container">
          {filteredImages?.map((img, index) => (
            <div 
              key={img?.id || `thumb-${index}`}
              className={`thumbnail-wrapper ${
                index === selectedImageIndex ? 'thumbnail-active' : ''
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <Image
                data={img?.image  || {} }
                alt={img?.image?.altText || ""}
                className="thumbnail-image"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}