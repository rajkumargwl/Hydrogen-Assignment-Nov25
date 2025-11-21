import No_image from '../assets/No_image.png';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {useEffect, useState} from 'react';
import {Link} from 'react-router';

export default function ProductItemtest({
  product,
  showQuickView,
  quickViewPosition,
  QV_Settings,
}) {
  const [showQuickViewPopup, setShowQuickViewPopup] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [sliderImages, setSliderImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const {elementOrder} = QV_Settings;

  useEffect(() => {
    if (!showQuickViewPopup) return;

    const defaultVariant = product?.variants?.nodes[0];
    setSelectedVariant(defaultVariant);

    const imgs = getVariantImages(defaultVariant, product);
    setSliderImages(imgs);

    setActiveImageIndex(0);

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showQuickViewPopup]);

  const handleVariantChange = (e) => {
    const variant = product?.variants?.nodes.find(
      (v) => v.id === e.target.value,
    );
    setSelectedVariant(variant);

    const imgs = getVariantImages(variant, product);
    setSliderImages(imgs);
    setActiveImageIndex(0);
  };

  const handleAddToCart = () => {
    setIsDisabled(true);
    setTimeout(() => setIsDisabled(false), 2000);
  };

  const getQuickViewPositionClass = (position) => {
    switch (position) {
      case 'Top-left':
        return 'top-2 left-2';
      case 'Top-Right':
        return 'top-2 right-2';
      case 'Bottom-left':
        return 'bottom-2 left-2';
      case 'Bottom-Right':
        return 'bottom-2 right-2';
      default:
        return 'top-2 right-2';
    }
  };

  const QuickViewPosition = getQuickViewPositionClass(quickViewPosition);

  return (
    <div className="border rounded relative overflow-hidden group">
      <div className="relative">
        <Link to={`/pdp/${product?.handle}`}>
          <img
            src={product?.variants?.nodes?.[0]?.image?.src || No_image}
            alt={product?.title}
            className="cursor-auto w-full h-150 object-contain rounded"
          />
        </Link>

        {showQuickView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickViewPopup(true);
            }}
            className={`absolute py-1 px-2 sm:py-2 sm:px-3 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer ${QuickViewPosition} opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-sm sm:text-base`}
          >
            Quick View
          </button>
        )}
      </div>

      <div className="flex flex-row justify-between mt-2 px-2">
        <Link to={`/pdp/${product?.handle}`}>
          <h3 className="font-bold">{product?.title}</h3>
        </Link>
        <h3 className="font-bold">
          {product?.variants?.nodes[0]?.price?.amount}{' '}
          {product?.variants?.nodes[0]?.price?.currencyCode}
        </h3>
      </div>

      {showQuickViewPopup && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQuickViewPopup(false)}
        >
          <div
            className="bg-white p-6 pt-12 rounded-xl max-w-2xl w-full relative overflow-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-white bg-red-600 hover:bg-red-700 font-bold text-2xl w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              onClick={() => setShowQuickViewPopup(false)}
            >
              ✕
            </button>

            {elementOrder.map((element) => (
              <QuickViewElementPosition
                key={element}
                element={element}
                product={product}
                selectedVariant={selectedVariant}
                sliderImages={sliderImages}
                activeImageIndex={activeImageIndex}
                setActiveImageIndex={setActiveImageIndex}
                handleVariantChange={handleVariantChange}
                handleAddToCart={handleAddToCart}
                isDisabled={isDisabled}
                QV_Settings={QV_Settings}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Slider({images, activeIndex, onChangeIndex}) {
  if (!images || images?.length === 0) {
    return (
      <div className="w-full h-56 md:h-96 flex items-center justify-center bg-gray-100 rounded">
        <img
          src={No_image}
          alt="No images available"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  const totalIndex = images?.length - 1;

  const prevSlide = () => {
    const newIndex = activeIndex === 0 ? totalIndex : activeIndex - 1;
    onChangeIndex(newIndex);
  };

  const nextSlide = () => {
    const newIndex = activeIndex === totalIndex ? 0 : activeIndex + 1;
    onChangeIndex(newIndex);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-base h-56 md:h-96">
      <div
        className="flex transition-transform duration-500"
        style={{transform: `translateX(-${activeIndex * 100}%)`}}
      >
        {images?.map((img, index) => (
          <div key={index} className="shrink-0 w-full h-56 md:h-96">
            <img
              src={img || No_image}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>

      {images?.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 text-black hover:bg-black/40 cursor-pointer"
          >
            {'<'}
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 text-black hover:bg-black/40 cursor-pointer"
          >
            {'>'}
          </button>
        </>
      )}
    </div>
  );
}

function QuickViewElementPosition({
  element,
  product,
  selectedVariant,
  sliderImages,
  activeImageIndex,
  setActiveImageIndex,
  handleVariantChange,
  handleAddToCart,
  isDisabled,
  QV_Settings,
}) {
  const {
    cartButtonColor,
    cartButtonFontSize,
    priceColor,
    priceFontSize,
    titleColor,
    titleFontSize,
    variantColor,
    variantFontSize,
  } = QV_Settings;

  switch (element) {
    case 'title':
      return (
        <div
          className={`font-bold mb-2 ${titleFontSize}`}
          style={{color: titleColor}}
        >
          {product.title}
        </div>
      );

    case 'slider':
      return (
        <div className="mb-3">
          <Slider
            images={sliderImages}
            activeIndex={activeImageIndex}
            onChangeIndex={setActiveImageIndex}
          />
        </div>
      );

    case 'variant':
      return (
        product.variants.nodes.length > 0 && (
          <div className="mb-3">
            <label
              className={`block font-semibold mb-1 ${variantFontSize}`}
              style={{color: variantColor}}
            >
              Select Variant
            </label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={selectedVariant?.id}
              onChange={handleVariantChange}
            >
              {product.variants.nodes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>
        )
      );

    case 'price':
      return (
        selectedVariant?.price && (
          <div
            className={`mt-1 mb-3 font-semibold ${priceFontSize}`}
            style={{color: priceColor}}
          >
            Price: {selectedVariant.price.amount}{' '}
            {selectedVariant.price.currencyCode}
          </div>
        )
      );

    case 'cartbutton':
      return (
        <div
          className={`flex justify-center items-center p-2 rounded-lg mt-2 ${cartButtonFontSize}`}
          style={{backgroundColor: cartButtonColor}}
        >
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={handleAddToCart}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant,
                    },
                  ]
                : []
            }
          >
            {!isDisabled ? (
              selectedVariant?.availableForSale ? (
                <div className="cursor-pointer">Add to cart</div>
              ) : (
                <div>Soldout</div>
              )
            ) : (
              <div>Adding to cart...</div>
            )}
          </AddToCartButton>
        </div>
      );

    default:
      return null;
  }
}

export const getVariantImages = (variant, product) => {
  if (!variant) return [];
  const variantName = variant.title.toLowerCase();

  let matches = product.images.nodes
    .filter((img) => img.url.toLowerCase().includes(variantName))
    .map((img) => img.url);

  let uniquVariantImages = [...new Set(matches)];

  if (uniquVariantImages.length === 0) {
    let image = [variant?.image?.src];
    return image;
  }

  const getNumber = (url) => {
    const regex = new RegExp(`${variantName}[\\s_-]*(\\d+)`);
    const match = url.toLowerCase().match(regex);
    return match ? parseInt(match[1], 10) : 99;
  };

  uniquVariantImages.sort((a, b) => {
    return getNumber(a) - getNumber(b);
  });

  return uniquVariantImages;
};
