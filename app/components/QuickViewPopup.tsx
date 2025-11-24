// /home/gwl/Hydrogen-Friday/metaobject/hydrogen-storefront/app/components/QuickViewPopup.tsx
import {useState, useEffect} from 'react';
import {CartForm} from '@shopify/hydrogen';
import {useNavigate} from 'react-router';
import {useAside} from './Aside';

interface QuickViewPopupProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  config?: any;
}

export function QuickViewPopup({
  product,
  isOpen,
  onClose,
  config = {}
}: QuickViewPopupProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCartVariants, setAddedToCartVariants] = useState<Set<string>>(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const navigate = useNavigate();
  const {close: closeAside} = useAside();

  
  const {
    colors = {},
    popupConfig = {}
  } = config;

  const {
    typography = {
      titleSize: 'text-2xl',
      priceSize: 'text-xl'
    },
    // default element order
    elementOrder = ['image', 'title', 'price', 'variants', 'addToCart']
  } = popupConfig;

  console.log('🔍 [QuickViewPopup] Config received:', {
    colors,
    popupConfig,
    elementOrder
  });


  const formatPrice = (amount: string) => {
    const numericAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };


  const formatPriceAmount = (amount: string) => {
    const numericAmount = parseFloat(amount);
    return `₹${numericAmount.toLocaleString('en-IN')}`;
  };

  // Calculate savings in rupees
  const calculateSavings = (compareAtPrice: string, price: string) => {
    const savings = parseFloat(compareAtPrice) - parseFloat(price);
    return savings.toLocaleString('en-IN');
  };

  // Create mapping between images and variants
  const getImagesWithVariantMapping = () => {
    const productImages = product?.images?.nodes || [];
    const featuredImage = product?.featuredImage;
    
    let allImages = [];
    if (featuredImage) {
      allImages = [featuredImage, ...productImages.filter((img: any) => img.url !== featuredImage.url)];
    } else {
      allImages = [...productImages];
    }

    return allImages.map((image: any, index: number) => {
      const matchingVariant = product?.variants?.nodes.find((variant: any) => 
        variant?.image?.url === image.url
      );

      return {
        ...image,
        variant: matchingVariant || product?.variants?.nodes[index] || product?.variants?.nodes[0]
      };
    });
  };

  const imagesWithVariants = getImagesWithVariantMapping();

  useEffect(() => {
    if (product?.variants?.nodes?.[0]) {
      const firstVariant = product.variants.nodes[0];
      setSelectedVariant(firstVariant);
      setCurrentImageIndex(0);
    }
  }, [product]);

  useEffect(() => {
    if (!isOpen) {
  
    }
  }, [isOpen]);

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleGoToCart = () => {
    onClose();
    closeAside();
    navigate('/cart');
  };

  const handleImageChange = (newImageIndex: number) => {
    setCurrentImageIndex(newImageIndex);
    const imageData = imagesWithVariants[newImageIndex];
    if (imageData?.variant) {
      setSelectedVariant(imageData.variant);
    }
  };

  const isCurrentVariantAdded = selectedVariant?.id ? addedToCartVariants.has(selectedVariant.id) : false;

  if (!product || !isOpen || !selectedVariant) return null;

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % imagesWithVariants.length;
    handleImageChange(newIndex);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + imagesWithVariants.length) % imagesWithVariants.length;
    handleImageChange(newIndex);
  };

  const elements = {
    image: (
   
      <div className="relative group">
        {/* Main Image with Slider */}
        <div className="w-full h-72 md:h-96  rounded-2xl overflow-hidden relative shadow-lg">
          {imagesWithVariants.length > 0 ? (
            <>
              <img
                src={imagesWithVariants[currentImageIndex]?.url}
                alt={imagesWithVariants[currentImageIndex]?.altText || product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" //zooming
              />
              
              {/* Image Slider Controls */}
              {imagesWithVariants.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Dots Indicator */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                    {imagesWithVariants.map((_: any, index: number) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleImageChange(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          index === currentImageIndex 
                            ? 'bg-white scale-125 shadow-lg' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Image Counter */}
                  <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                    {currentImageIndex + 1} / {imagesWithVariants.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-500 text-sm">No image available</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Thumbnail Gallery */}
        {imagesWithVariants.length > 1 && (
          <div className="flex space-x-3 mt-6 overflow-x-auto pb-2 px-1">
            {imagesWithVariants.map((image: any, index: number) => (
              <button
                key={index}
                type="button"
                onClick={() => handleImageChange(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
                  index === currentImageIndex 
                    ? 'border-blue-500 shadow-lg scale-105' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    ),
    title: (
      <h2 style={{
        fontSize: typography?.titleSize
      }} className={`font-bold text-gray-900 leading-tight`}>
        {product.title}
      </h2>
    ),
    price: (
      <div style={{
        fontSize: typography.priceSize
      }} className="font-bold text-gray-900">
        {selectedVariant?.price ? (
          <div className="flex items-center space-x-3">
            <span>{formatPrice(selectedVariant.price.amount)}</span>
            {selectedVariant.compareAtPrice && (
              <span className="text-gray-500 line-through text-lg font-normal">
                {formatPrice(selectedVariant.compareAtPrice.amount)}
              </span>
            )}
            {selectedVariant.compareAtPrice && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                Save ₹{calculateSavings(selectedVariant.compareAtPrice.amount, selectedVariant.price.amount)}
              </span>
            )}
          </div>
        ) : (
          <span>{formatPrice(product.priceRange?.minVariantPrice?.amount)}</span>
        )}
      </div>
    ),
    variants: (
      <div className="space-y-6 w-full"> 
        {product.options?.map((option: any, optionIndex: number) => (
          <div key={option.name} className="bg-gray-50 rounded-xl p-4 w-full"> 
            <label className="block text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
              {option.name}
            </label>
            <div className="flex flex-wrap gap-3">
              {option.values.map((value: string) => {
                const isSelected = 
                  selectedVariant?.selectedOptions?.[optionIndex]?.value === value;
                
                return (
                
                  <button
                    key={value}
                    onClick={() => {
                        const newOptions = selectedVariant.selectedOptions.map((opt: any, idx: number) => {
                            if (idx === optionIndex) {
                                return { ...opt, value };
                            }
                            return opt;
                        });
                        const newVariant = product.variants.nodes.find((v: any) =>
                            v.selectedOptions.every((opt: any) =>
                                newOptions.some((newOpt: any) => newOpt.name === opt.name && newOpt.value === opt.value)
                            )
                        );
                        if (newVariant) setSelectedVariant(newVariant);
                    }}
                    className={`
                      px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500 text-white shadow-lg transform scale-105' 
                        : 'border-gray-300 text-gray-700 bg-white hover:border-gray-400 hover:shadow-md'
                      }
                    `}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    ),
    addToCart: (
      <div className="space-y-4 w-full">
        {!isCurrentVariantAdded ? (
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesAdd}
            inputs={{
              lines: [
                {
                  merchandiseId: selectedVariant?.id,
                  quantity: 1,
                },
              ],
            }}
          >
            {(fetcher: any) => {
              // Handle the submission state properly
              useEffect(() => {
                if (fetcher.state === 'submitting') {
                  setIsAddingToCart(true);
                } else if (fetcher.state === 'idle' && isAddingToCart) {
   
                  setAddedToCartVariants(prev => new Set([...prev, selectedVariant.id]));
                  setIsAddingToCart(false);
                }
              }, [fetcher.state, isAddingToCart, selectedVariant.id]);

              return (
                <button 
                  type="submit"
                  style={{
                    backgroundColor: colors.buttonColor || '#000000',
                    color: colors.textColor || '#ffffff'
                  }}
                  className="w-full py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
                  disabled={!selectedVariant?.availableForSale || fetcher.state !== 'idle'}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.buttonHoverColor || '#333333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.buttonColor || '#000000';
                  }}
                >
                  {fetcher.state !== 'idle' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </div>
                  ) : selectedVariant?.availableForSale ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add to Cart - {formatPriceAmount(selectedVariant?.price?.amount)}</span>
                    </div>
                  ) : (
                    'Out of Stock'
                  )}
                </button>
              );
            }}
          </CartForm>
        ) : (
          <button 
            type="button"
            onClick={handleGoToCart}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Go to Cart</span>
            </div>
          </button>
        )}
        
        {/* Product Description */}
        {product.description && (
          <div className="bg-gray-50 rounded-xl p-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {product.description}
            </p>
          </div>
        )}
      </div>
    )
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
      
        className="relative mx-auto max-w-6xl w-full bg-white rounded-3xl shadow-2xl max-h-[95vh] h-full flex flex-col overflow-hidden animate-in fade-in-90 zoom-in-90 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Quick View</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

  
        <div className="p-8 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 gap-8">
            
            {/* 1. Image */}
            {elements.image}

            {/* 2. Details (Title, Price, Variants, Cart) */}
            <div className="space-y-6"> 
              {elementOrder.filter(key => key !== 'image').map((elementKey: string, index: number) => (
                <div 
                  key={index} 
                  className="w-full"
                >
                  {elements[elementKey as keyof typeof elements]}
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}