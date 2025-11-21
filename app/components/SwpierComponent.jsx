
import { Swiper, SwiperSlide } from 'swiper/react';
import {Image} from '@shopify/hydrogen';
// Import Swiper styles
import 'swiper/css';
import { useEffect, useRef } from 'react';

export default function ImagesSwiper({product, productImages, loading, Images, font, color}) {
    console.log("ImagesSwiper productImages: ", productImages);

    const swiperRef = useRef(null);

    useEffect(()=>{
          if (swiperRef.current) {
           swiperRef.current.slideTo(0);
          }         
    },[productImages])

    return (
        <Swiper
            spaceBetween={50}
            slidesPerView={1}
            onSlideChange={() => console.log('slide change')}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            className={`w-full max-w-[300px] order-${Images}`}
        >
            {
                productImages?.nodes?.map((img) => (
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
        </Swiper>
    )
}