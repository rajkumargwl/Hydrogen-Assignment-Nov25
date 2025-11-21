import { Link } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { AddToCartButton } from './AddToCartButton';
import {useAside} from './Aside';
import { useLoaderData } from 'react-router';


// Import Swiper styles
import 'swiper/css';


import ImagesSwiper from './SwpierComponent';
import OptionsComponent from './OptionsComponent';
import TitleComponent from './TitleComponent';
import AddToCartButtonComponent from './AddToCartButtonComponent';
import PriceComponent from './PriceComponent';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({ product, loading, showQuickView, displayMessage, setDisplayMessage,orderOfElements, font, color }) {

    const [productImages, setProductImages] = useState(product?.images);

    const variantUrl = useVariantUrl(product.handle);
    const image = product.featuredImage;

    const orderOfElementsArray = orderOfElements ? orderOfElements.split(" ") : [];

    const Price = orderOfElementsArray.indexOf("Price");;
    const Images = orderOfElementsArray.indexOf("Images");
    const Title = orderOfElementsArray.indexOf("Title");
    const Variants = orderOfElementsArray.indexOf("Variants");
    const AddToCart = orderOfElementsArray.indexOf("AddToCart");

    // console.log("Price: ", Price);
    // console.log("Images: ", Images);
    // console.log("Title: ", Title);
    // console.log("Variants: ", Variants);
    // console.log("AddToCart: ", AddToCart);

    // console.log("orderOfElementsArray: ", orderOfElementsArray);

    const {open} = useAside();

    console.log("product rendered: ", product); 
    console.log("product images: ", product?.images?.nodes);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    
    // const selectedVariant = product?.variants?.nodes[0];

    const [selectedVariant, setSelectedVariant] = useState(product?.variants?.nodes[0]);


    //In future if i need to make any change in the selected options i can do it directly from here
    const [selectedOptions, setSelectedOptions] = useState({
     Color: product?.variants?.nodes[0]?.selectedOptions[0]?.value || '',
     Size: product?.variants?.nodes[0]?.selectedOptions[1]?.value  || '',
     Fabric: product?.variants?.nodes[0]?.selectedOptions[2]?.value || ''    
    });

    // console.log("Selected Options: ", selectedOptions);

    const updateImages = (optionValue) => {
        let optionV = optionValue;
        optionV = optionV.replaceAll(' ', '').toLowerCase();
        console.log("updateImages: ", optionValue);
       const filteredImages = product?.images?.nodes.filter((img) => {
        const data = img?.url.split('/');
        return data[data.length - 1].startsWith(optionV)===true;
       });

       console.log("Filtered Images: ", filteredImages);
       setProductImages({nodes: filteredImages});  
    //    console.log("Updated productImages: ", productImages);
    }

    // useEffect(()=> {
    //   updateImages(selectedOptions.Color);              
    // }, [selectedOptions]);

    const handleAllImages = () => {
     setProductImages(product?.images);
    }



    const handleClick = (optionName, optionValue) => {
        console.log(`Option Selected: ${optionName} - ${optionValue}`);

        if(optionName == "Color"){
         updateImages(optionValue);    
        }
         
        const newSelectedOptions = {
          ...selectedOptions,
          [optionName]: optionValue,
        };
        setSelectedOptions(newSelectedOptions);

        let variant = product?.variants?.nodes.find((vari) => {
          return vari.selectedOptions[0]?.value === newSelectedOptions.Color &&
                 vari.selectedOptions[1]?.value === newSelectedOptions.Size &&
                 vari.selectedOptions[2]?.value === newSelectedOptions.Fabric; 
        });


        // variant?.image.url = productImages?.nodes[0]?.url;

        // if (variant?.image) {
        //     variant.image.url = productImages?.nodes[0];
        // }
        
        console.log("Selected Variant: ", variant);
        setSelectedVariant(variant);
    
    };
       
    useEffect(() => {
     console.log("Selected Variant changed: ", selectedVariant);     
    }, [selectedVariant]);


    useEffect(()=> {
       handleCloseModal(); 
    }, [displayMessage])


    useEffect(() => {
      console.log("Selected Variant changed in productImages: ", selectedVariant);  
      console.log("Product Images changed: ", productImages?.nodes?.[0]?.url);

      // if (variant?.image) {
        //     variant.image.url = productImages?.nodes[0].url;
        // }

        // setSelectedVariant((prevVariant) => {
        //   return {
        //         ...prevVariant,
        //         image: {
        //                 url: productImages?.nodes?.[0]?.url,
        //          },
        //        };
        //     });

        selectedVariant.image.url = productImages?.nodes?.[0]?.url;


            console.log("Updated Selected Variant: ", selectedVariant);


    }, [productImages]);

        const componentArray = {
            Images: <ImagesSwiper product={product} productImages={productImages} loading={loading} Images={Images} font={font} color={color}/>,
            Variants: <OptionsComponent product={product} selectedOptions={selectedOptions} handleClick={handleClick} handleAllImages={handleAllImages} Variants={Variants} font={font} color={color}/>,
            Title: <TitleComponent product={product} Title={Title} font={font} color={color}/>,
            AddToCart: <AddToCartButtonComponent selectedVariant={selectedVariant} AddToCart={AddToCart} setDisplayMessage={setDisplayMessage} font={font} color={color}/>,
            Price: <PriceComponent selectedVariant={selectedVariant} Price={Price} font={font} color={color}/>
        };


    return (
        <div className="product-item relative border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border-gray-200">


            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-3 max-w-md w-[90%] mx-auto"
                        role="document"
                    >
                        <div className="flex justify-between items-start">
                            <h2 style={{color: color, fontSize: font}} className="text-lg font-semibold">Quick View</h2>
                            <button
                                onClick={handleCloseModal}
                                className="ml-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="text-sm text-gray-700 flex flex-col">
                            {
                            orderOfElementsArray.map((item)=>{
                             return componentArray[item];   
                            })
                        }

                            
                            {/* `componentArray` is declared above the return and can be used here */}
                            

                            {/* <Swiper
                                spaceBetween={50}
                                slidesPerView={1}
                                onSlideChange={() => console.log('slide change')}
                                onSwiper={(swiper) => console.log(swiper)}
                                className={`w-full order-${Images}`}
                            >
                                  {
                                    product?.images?.nodes.map((img) => (
                                        <SwiperSlide key={img.id}>
                                            <Image 
                                                alt={img.altText || product.title}
                                                aspectRatio="1/1"
                                                data={img}
                                                loading={loading}
                                                // sizes="(min-width: 1em) 40px, 10vw"
                                                className="w-full h-auto rounded-md flex-none"
                                            />
                                        </SwiperSlide>
                                    ))
                                  }
                            </Swiper> */}
                            

                             {/* <div className={`optionss mt-4 order-${Variants}`}>
                            {
                               product?.options?.length>=3 && product?.options?.map((option) => (
                                    <div key={option.name} className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {option.name}
                                        </label>
                                        <select
                                            value={
                                             selectedOptions[option.name]    
                                            }
                                            onChange={(e) => { handleClick(option.name, e.target.value) }}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            {option.values.map((value) => (
                                                <option key={value} value={value}>{value}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))
                            }
                            </div> */}
                            

                            {/* <h4 className={`mt-3 text-sm font-medium text-gray-900 order-${Title}`}>{product.title}</h4> */}
                            
                             
                       
                        {/* <div className={`mt-4 order-${AddToCart}`}>
                            <AddToCartButton
                                    disabled={!selectedVariant?.availableForSale}
                                    // onClick={() => {
                                    //   open('cart');
                                    // }}

                                    onClick={() => {
                                     setDisplayMessage(true);      
                                    }}

                                    lines={
                                      selectedVariant
                                        ? [
                                            {
                                              merchandiseId: selectedVariant?.id,
                                              quantity: 1,
                                              selectedVariant,
                                            },
                                          ]
                                        : []
                                    }
                                  >
                                    {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
                                  </AddToCartButton>
                        </div>           */}
                        


                            
                            {/* <small className={`block mt-2 text-gray-600 order-${Price}`}>
                                <Money data={selectedVariant?.priceV2} />
                            </small> */}

                        </div>

                        {/* <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                            >
                                Close
                            </button>
                        </div> */}
                    </div>
                </div>
            )}
       
            {image && (
                <Link
                    className={`block order-${Images}`}
                    key={product.id}
                    prefetch="intent"
                    to={variantUrl}
                >
                <Image
                    alt={image.altText || product.title}
                    aspectRatio="1/1"
                    data={image}
                    loading={loading}
                    sizes="(min-width: 45em) 400px, 100vw"
                    className="w-full h-auto rounded-md object-cover"
                />
                </Link>
            )}

            <h4 className="mt-3 text-sm font-medium text-gray-900">{product.title}</h4>


            <small className="block mt-2 text-gray-600">
                <Money data={product.priceRange.minVariantPrice} />
            </small>

            {showQuickView && (
            <button
                onClick={handleOpenModal}
                className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 focus:outline-none"
            >
                Quick View
            </button>
            )}
        </div>
    );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
