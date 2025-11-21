
import React, {useEffect, useState, useRef, useMemo} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {Swiper, SwiperSlide} from 'swiper/react';
import { Navigation, Thumbs, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/zoom';
import { useFetcher, useNavigate } from "react-router";

import {AddToCartButton} from '~/components/AddToCartButton';
import {ProductPrice} from '~/components/ProductPrice';

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  settings = {},
  elementOrder = ['image', 'title', 'price', 'variant_picker', 'description', 'add_to_cart'],
  typography = {
    title: 'text-xl font-semibold',
    price: 'text-lg font-medium',
    variant: 'text-base font-normal',
    description: 'text-sm font-normal',
    button: 'text-base font-medium',
  },
}) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSwiperReady, setIsSwiperReady] = useState(false);
  const mainSwiperRef = useRef(null);
  const thumbsSwiperRef = useRef(null);
  const navigate = useNavigate();
  

  const meta = settings || {};
  

  const layoutOrder = meta.layout_order ? 
    meta.layout_order.split('\n').filter(item => item.trim() !== '') : 
    elementOrder;
  

  const getTypographyClass = (element) => {
    const fontSize = meta[`${element}_font_size`];
    if (!fontSize) return typography[element] || '';
    const sizeMap = {
      '10': 'text-xs',
      '12': 'text-sm',
      '14': 'text-sm',
      '15': 'text-base',
      '16': 'text-base',
      '18': 'text-lg',
      '19': 'text-xl',
      '20': 'text-xl',
      '22': 'text-2xl',
      '24': 'text-2xl',
    };
    
    const sizeClass = sizeMap[fontSize] || 'text-base';
    const weightClass = element === 'title' ? 'font-semibold' : 
                       element === 'price' ? 'font-medium' : 
                       element === 'button' ? 'font-medium' : 'font-normal';
    
    return `${sizeClass} ${weightClass}`;
  };

 
  const getSpacingClass = () => {
    const spacing = meta.spacing || '12';
    const spacingMap = {
      '8': 'gap-2',
      '12': 'gap-3',
      '16': 'gap-4',
      '20': 'gap-5',
      '24': 'gap-6',
    };
    return spacingMap[spacing] || 'gap-3';
  };

  const getThemeClasses = () => {
    const theme = meta.theme || 'light';
    if (theme === 'dark') {
      return {
        background: 'bg-gray-900',
        text: 'text-white',
        border: 'border-gray-700',
        button: 'bg-white text-black hover:bg-gray-200',
      };
    }
    return {
      background: 'bg-white',
      text: 'text-gray-900',
      border: 'border-gray-200',
      button: 'bg-black text-white hover:bg-gray-800',
    };
  };

  const themeClasses = getThemeClasses();
  const spacingClass = getSpacingClass();


  const images = product?.images?.nodes || [];
  const variants = product?.variants?.nodes || [];
  
  
  const displayVariants = variants.length > 0 ? variants : [{
    id: product.id,
    title: 'Default',
    availableForSale: true,
    price: product.priceRange?.minVariantPrice,
    compareAtPrice: null,
    selectedOptions: [],
  }];

  const displayImages = images.length > 0 ? images : 
    product?.featuredImage ? [product?.featuredImage] : [];

 
  const selectedColor = selectedOptions?.Color?.toLowerCase();

  const filteredImages = useMemo(() => {
    if (!selectedColor) return displayImages;

    const colorImages = displayImages?.filter((img) => {
      const alt = img?.altText?.toLowerCase() || "";
      return alt.includes(selectedColor);
    });

   
    return colorImages?.length > 0 ? colorImages : displayImages;
  }, [displayImages, selectedColor]);


  useEffect(() => {
    setActiveImageIndex(0);
    if (mainSwiperRef.current && !mainSwiperRef.current.destroyed) {
      mainSwiperRef.current.slideTo(0);
    }
  }, [selectedColor]);



  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Set initial selected variant and options when product changes
  useEffect(() => {
    if (product?.variants?.nodes?.[0]) {
      const initialVariant = product.variants.nodes[0];
      setSelectedVariant(initialVariant);
      
      // Initialize selected options from the first variant
      const initialOptions = {};
      if (initialVariant.selectedOptions) {
        initialVariant.selectedOptions.forEach(option => {
          initialOptions[option.name] = option.value;
        });
      }
      setSelectedOptions(initialOptions);
    } else if (product) {
      // Create a fallback variant if no variants are available
      const fallbackVariant = {
        id: product.id,
        title: 'Default Title',
        availableForSale: true,
        price: product.priceRange?.minVariantPrice,
        compareAtPrice: null,
        selectedOptions: [],
      };
      setSelectedVariant(fallbackVariant);
      setSelectedOptions({});
    }
  }, [product]);

  // Reset active image index and swiper state when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
  
      const timer = setTimeout(() => {
        setIsSwiperReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsSwiperReady(false);
    }
  }, [product, isOpen]);

  // Cleanup swipers when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (thumbsSwiper) {
        thumbsSwiper.destroy(true, true);
        setThumbsSwiper(null);
      }
      if (mainSwiperRef.current) {
        mainSwiperRef.current.destroy(true, true);
        mainSwiperRef.current = null;
      }
      setIsSwiperReady(false);
    }
  }, [isOpen, thumbsSwiper]);

  // Get available options for variant selection
  const getAvailableValues = (optionName) => {
    if (!product?.variants?.nodes) return [];
    
    const availableVariants = product.variants.nodes.filter(variant => {
      return Object.entries(selectedOptions).every(([name, value]) => {
        if (name === optionName) return true; 
        const option = variant.selectedOptions?.find(opt => opt.name === name);
        return option && option.value === value;
      });
    });

    const availableValues = new Set();
    availableVariants.forEach(variant => {
      const option = variant?.selectedOptions?.find(opt => opt?.name === optionName);
      if (option) {
        availableValues.add(option?.value);
      }
    });

    return Array.from(availableValues);
  };

  const isOptionAvailable = (optionName, optionValue) => {
    return getAvailableValues(optionName).includes(optionValue);
  };

  const handleOptionChange = (optionName, optionValue) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [optionName]: optionValue,
    };
    
    setSelectedOptions(newSelectedOptions);
    
    // Find matching variant
    const matchingVariant = product.variants.nodes.find(variant => 
      variant.selectedOptions?.every(
        option => newSelectedOptions[option.name] === option.value
      )
    );
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      
      // Reset to first image when color changes - filteredImages will update automatically
      if (optionName === 'Color') {
        setActiveImageIndex(0);
        if (mainSwiperRef.current && !mainSwiperRef.current.destroyed) {
          mainSwiperRef.current.slideTo(0);
        }
      }
    }
  };

  // Extract unique product options
  const getProductOptions = () => {
    if (!product?.options) return [];
    
    return product.options.map(option => ({
      name: option.name,
      values: option.values || []
    }));
  };

  const handleSlideChange = (swiper) => {
    setActiveImageIndex(swiper.activeIndex);
  };

  const handleMainSwiperInit = (swiper) => {
    mainSwiperRef.current = swiper;
  };

  const handleThumbsSwiperInit = (swiper) => {
    thumbsSwiperRef.current = swiper;
    setThumbsSwiper(swiper);
  };

  // Custom navigation handlers to prevent errors
  const handleNextSlide = () => {
    if (mainSwiperRef.current && !mainSwiperRef.current.destroyed) {
      mainSwiperRef.current.slideNext();
    }
  };

  const handlePrevSlide = () => {
    if (mainSwiperRef.current && !mainSwiperRef.current.destroyed) {
      mainSwiperRef.current.slidePrev();
    }
  };

  const handleThumbsNext = () => {
    if (thumbsSwiperRef.current && !thumbsSwiperRef.current.destroyed) {
      thumbsSwiperRef.current.slideNext();
    }
  };

  const handleThumbsPrev = () => {
    if (thumbsSwiperRef.current && !thumbsSwiperRef.current.destroyed) {
      thumbsSwiperRef.current.slidePrev();
    }
  };

  const productOptions = getProductOptions();
  const shouldShowAdvancedVariantPicker = productOptions.length > 1;

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className={`${themeClasses?.background} rounded-lg p-6 max-w-4xl w-full relative overflow-auto max-h-[90vh] ${spacingClass}`}
        onClick={(e) => e.stopPropagation()}
      >
     
        <button
          className={`absolute right-4 top-4 text-xl font-bold z-10 ${themeClasses.button} rounded-full w-8 h-8 flex items-center justify-center hover:opacity-80 border ${themeClasses.border} transition-opacity`}
          onClick={onClose}
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {layoutOrder.includes('image') && (
              <div className="mb-4">
                {filteredImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative">
                      {isSwiperReady && (
                        <Swiper
                          modules={[Navigation, Thumbs, Zoom]}
                          spaceBetween={10}
                          slidesPerView={1}
                          navigation={false}
                          thumbs={{ swiper: thumbsSwiper }}
                          zoom={true}
                          onSlideChange={handleSlideChange}
                          onSwiper={handleMainSwiperInit}
                          initialSlide={activeImageIndex}
                          className="rounded-lg overflow-hidden main-swiper"
                        >
                          {filteredImages?.map((img, index) => (
                            <SwiperSlide key={img?.id || index}>
                              <div className="swiper-zoom-container">
                                <Image 
                                  data={img} 
                                  alt={product?.title}
                                  className="w-full h-80 md:h-96 object-cover cursor-zoom-in"
                                  widths={[400, 600, 800]}
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              </div>
                            </SwiperSlide>
                          ))}
                          
                
                          {filteredImages?.length > 1 && (
                            <>
                              <button 
                                className="swiper-button-custom-next absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                                onClick={handleNextSlide}
                              >
                                <span className="text-black font-bold text-lg">›</span>
                              </button>
                              <button 
                                className="swiper-button-custom-prev absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                                onClick={handlePrevSlide}
                              >
                                <span className="text-black font-bold text-lg">‹</span>
                              </button>
                            </>
                          )}
                          {filteredImages?.length > 1 && (
                            <div className="absolute top-4 right-4 z-10 bg-black/60 text-white px-2 py-1 rounded text-sm">
                              {activeImageIndex + 1} / {filteredImages?.length}
                            </div>
                          )}
                        </Swiper>
                      )}
                    </div>

                
                    {filteredImages.length > 1 && isSwiperReady && (
                      <div className="px-8 relative">
                        <Swiper
                          modules={[Navigation, Thumbs]}
                          spaceBetween={8}
                          slidesPerView={Math.min(4, filteredImages?.length)}
                          watchSlidesProgress={true}
                          onSwiper={handleThumbsSwiperInit}
                          navigation={false}
                          breakpoints={{
                            320: {
                              slidesPerView: Math.min(3, filteredImages?.length),
                            },
                            640: {
                              slidesPerView: Math.min(4, filteredImages?.length),
                            },
                            768: {
                              slidesPerView: Math.min(5, filteredImages?.length),
                            },
                          }}
                          className="thumbs-swiper"
                        >
                          {filteredImages.map((img, index) => (
                            <SwiperSlide key={img.id || `thumb-${index}`}>
                              <button
                                className={`w-full h-20 border-2 rounded-md overflow-hidden transition-all ${
                                  activeImageIndex === index 
                                    ? 'border-black ring-2 ring-black' 
                                    : `${themeClasses.border} hover:border-gray-400`
                                }`}
                                onClick={() => {
                                  setActiveImageIndex(index);
                                  if (mainSwiperRef?.current && !mainSwiperRef?.current.destroyed) {
                                    mainSwiperRef.current.slideTo(index);
                                  }
                                }}
                              >
                                <Image 
                                  data={img} 
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                  widths={[80]}
                                  sizes="80px"
                                />
                              </button>
                            </SwiperSlide>
                          ))}
                          
                      
                          {filteredImages?.length > 4 && (
                            <>
                              <button 
                                className="thumbs-button-prev absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 rounded-r shadow-lg w-6 h-8 flex items-center justify-center cursor-pointer hover:bg-white"
                                onClick={handleThumbsPrev}
                              >
                                ‹
                              </button>
                              <button 
                                className="thumbs-button-next absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 rounded-l shadow-lg w-6 h-8 flex items-center justify-center cursor-pointer hover:bg-white"
                                onClick={handleThumbsNext}
                              >
                                ›
                              </button>
                            </>
                          )}
                        </Swiper>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-80 md:h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {layoutOrder?.map((element) => {
              switch (element) {
                case 'image':
                  return null;

                case 'title':
                  return (
                    <h2
                      key="title"
                      className={`${getTypographyClass('title')} ${themeClasses?.text} mb-3`}
                    >
                      {product.title}
                    </h2>
                  );

                case 'price':
                  return (
                    <div key="price" className={`${getTypographyClass('price')} ${themeClasses?.text} mb-4`}>
                      {selectedVariant ? (
                        <ProductPrice 
                          price={selectedVariant?.price} 
                          compareAtPrice={selectedVariant?.compareAtPrice} 
                        />
                      ) : (
                        <Money data={product.priceRange?.minVariantPrice} />
                      )}
                    </div>
                  );

                case 'description':
                  return (
                    <div key="description" className="mb-4">
                      <p className={`${getTypographyClass('description')} ${themeClasses?.text} opacity-80`}>
                        {product.description || 'No description available.'}
                      </p>
                    </div>
                  );

                case 'variant_picker':
                  return (
                    <div key="variant_picker" className="mb-6">
                      <h3 className={`${getTypographyClass('variant')} ${themeClasses.text} font-medium mb-3`}>
                        {shouldShowAdvancedVariantPicker ? 'Select Options' : 'Select Option'}
                      </h3>
                      
                
                      {shouldShowAdvancedVariantPicker ? (
                        <div className="space-y-4">
                          {productOptions.map((option) => (
                            <div key={option.name} className="flex flex-col space-y-2">
                              <label className={`text-sm font-medium ${themeClasses?.text} capitalize`}>
                                {option.name}:
                                <span className="ml-1 font-semibold">
                                  {selectedOptions[option.name] || `Select ${option?.name}`}
                                </span>
                              </label>
                              
                              <div className="flex flex-wrap gap-2">
                                {option.values.map((value) => {
                                  const isAvailable = isOptionAvailable(option.name, value);
                                  const isSelected = selectedOptions[option.name] === value;
                                  
                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => handleOptionChange(option.name, value)}
                                      disabled={!isAvailable}
                                      className={`
                                        px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200
                                        ${isSelected 
                                          ? 'border-black bg-black text-white' 
                                          : `${themeClasses.border} bg-white text-gray-700 hover:border-gray-400`
                                        }
                                        ${!isAvailable 
                                          ? 'opacity-50 cursor-not-allowed line-through' 
                                          : 'cursor-pointer'
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
                          {selectedVariant && (
                            <div className={`mt-3 p-3 ${themeClasses.background === 'bg-white' ? 'bg-gray-50' : 'bg-gray-800'} rounded-lg`}>
                              <div className="text-sm">
                                <span className="font-medium">Selected:</span> {selectedVariant.title}
                                {!selectedVariant.availableForSale && (
                                  <span className="ml-2 text-red-600 font-medium">(Sold Out)</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                       
                        <div className="flex flex-wrap gap-2">
                          {displayVariants?.map((variant) => (
                            <button
                              key={variant?.id}
                              onClick={() => {
                                setSelectedVariant(variant);
                                
                            
                                const newOptions = {};
                                if (variant?.selectedOptions) {
                                  variant?.selectedOptions.forEach(opt => {
                                    newOptions[opt.name] = opt?.value;
                                  });
                                }
                                setSelectedOptions(newOptions);
                              }}
                              className={`px-4 py-2 border rounded-lg transition-colors ${
                                selectedVariant?.id === variant?.id
                                  ? 'bg-black text-white border-black'
                                  : `${themeClasses.border} bg-white text-gray-700 hover:border-gray-400`
                              } ${!variant.availableForSale ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!variant.availableForSale}
                            >
                              {variant?.title === 'Default Title' ? 'Default' : variant?.title}
                              {!variant.availableForSale && ' (Sold Out)'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );

                case 'add_to_cart':
                  return (
                    <div key="add_to_cart" className="mt-auto">
                      <AddToCartButton
                        disabled={!selectedVariant || !selectedVariant?.availableForSale}
                        onClick={() => {
                         
                          setTimeout(() => {
                            onClose();
                            navigate("/cart"); 
                          }, 500);
                        }}
                        lines={
                          selectedVariant
                            ? [
                                {
                                  merchandiseId: selectedVariant?.id,
                                  quantity: 1,
                                },
                              ]
                            : []
                        }
                        analytics={{
                          products: [
                            {
                              productGid: product?.id,
                              variantGid: selectedVariant?.id,
                              name: product?.title,
                              variant: selectedVariant?.title,
                              price: selectedVariant?.price?.amount,
                              quantity: 1,
                            },
                          ],
                        }}
                      >
                        <span className={`px-6 py-3 ${themeClasses?.button} rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed block w-full text-center ${getTypographyClass('button')}`}>
                          {!selectedVariant
                            ? "Select Option"
                            : selectedVariant?.availableForSale
                            ? "Add to Cart"
                            : "Sold Out"}
                        </span>
                      </AddToCartButton>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}