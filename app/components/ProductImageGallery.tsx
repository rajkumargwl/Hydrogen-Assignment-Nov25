import {useState, useEffect} from 'react';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {Image} from '@shopify/hydrogen';

interface ProductImageGalleryProps {
  selectedVariant: ProductVariantFragment;
  metaobjectImageData: Record<string, any[]>;
}

export function ProductImageGallery({selectedVariant, metaobjectImageData}: ProductImageGalleryProps) {
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  // Get actual images from metaobject data
  const getVariantImages = () => {
    console.log('🔄 Getting images for variant:', selectedVariant?.title);
    console.log('📦 Available metaobject data:', Object.keys(metaobjectImageData).length);
    
    if (!selectedVariant) {
      setDebugInfo('No variant selected');
      return [];
    }

    // Get the metaobject IDs from variant metafield
    const metafieldValue = selectedVariant?.metafield?.value;
    
    if (!metafieldValue) {
      setDebugInfo('No metaobject reference found');
      return selectedVariant?.image ? [selectedVariant.image] : [];
    }

    try {
      const metaobjectIds = JSON.parse(metafieldValue);
      console.log('🔍 Metaobject IDs for variant:', metaobjectIds);

      if (!Array.isArray(metaobjectIds) || metaobjectIds.length === 0) {
        setDebugInfo('No valid metaobject IDs found');
        return selectedVariant?.image ? [selectedVariant.image] : [];
      }

      // Collect all images from all linked metaobjects
      const allImages: any[] = [];
      
      metaobjectIds.forEach((metaobjectId: string) => {
        const images = metaobjectImageData[metaobjectId];
        if (images && Array.isArray(images)) {
          console.log(`✅ Found ${images.length} images in metaobject ${metaobjectId}`);
          allImages.push(...images);
        } else {
          console.log(`❌ No images found in metaobject ${metaobjectId}`);
        }
      });

      if (allImages.length > 0) {
        setDebugInfo(`Showing ${allImages.length} actual product images for ${selectedVariant.title}`);
        return allImages;
      }

      // Fallback to variant image
      if (selectedVariant?.image) {
        setDebugInfo('Using single variant image as fallback');
        return [selectedVariant.image];
      }

      setDebugInfo('No images available');
      return [];

    } catch (e) {
      console.error('Error processing metaobject data:', e);
      setDebugInfo('Error loading images');
      return selectedVariant?.image ? [selectedVariant.image] : [];
    }
  };

  // Update gallery when variant changes
  useEffect(() => {
    const images = getVariantImages();
    console.log('🔄 Setting gallery images:', images.length);
    setGalleryImages(images);
    setCurrentImageIndex(0);
  }, [selectedVariant, metaobjectImageData]);

  const currentImage = galleryImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  if (galleryImages.length === 0) {
    return (
      <div className="product-image">
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">No image available</span>
        </div>
        <div className="mt-2 text-xs bg-red-100 p-2 rounded border border-red-300">
          <strong>Debug:</strong> {debugInfo}
        </div>
      </div>
    );
  }

  return (
    <div className="product-image-gallery">
      <div className="product-image relative">
        {galleryImages.length > 0 && (
          <Image
            alt={currentImage.altText || 'Product Image'}
            aspectRatio="1/1"
            data={currentImage}
            sizes="(min-width: 45em) 50vw, 100vw"
          />
        )}
        
        {galleryImages.length > 1 && ( //slider
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image Counter */}
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {galleryImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {galleryImages.length > 1 && (
        <div className="thumbnail-gallery mt-4 flex gap-2 overflow-x-auto">
          {galleryImages.map((image, index) => (
            <button
              key={image.id || index}
              type="button"
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 border-2 rounded-md overflow-hidden transition-all ${
                index === currentImageIndex ? 'border-blue-500 scale-105' : 'border-transparent'
              }`}
              aria-label={`View ${image.altText || `image ${index + 1}`}`}
            >
              <Image
                data={image}
                sizes="64px"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

    
    </div>
  );
}