import {useRef, useState, useEffect} from 'react';

export function Slider({
  images,
  loop = false,
  showDots = true,
  showArrows = true,
  autoplay = false,
  autoplaySpeed = 3000,
  startIndex = 0
}) {
  const sliderRef = useRef(null);
  const [index, setIndex] = useState(startIndex);
  const autoplayRef = useRef(null);
  const isHovering = useRef(false);

  const next = () => {
    if (loop) {
      setIndex((prev) => (prev + 1) % images.length);
    } else {
      setIndex((prev) => Math.min(prev + 1, images.length - 1));
    }
  };

  const prev = () => {
    if (loop) {
      setIndex((prev) => (prev - 1 + images.length) % images.length);
    } else {
      setIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  useEffect(() => {
  setIndex(0);
}, [images]);

// Update index when startIndex changes
useEffect(() => {
  setIndex(startIndex);
}, [startIndex]);

  /** ------------------------------
   * AUTOPLAY WITH PAUSE ON HOVER
   * ------------------------------ */
  useEffect(() => {
    if (!autoplay) return;

    autoplayRef.current = setInterval(() => {
      if (!isHovering.current) {
        next();
      }
    }, autoplaySpeed);

    return () => clearInterval(autoplayRef.current);
  }, [index, autoplay, autoplaySpeed]);

  const handleMouseEnter = () => {
    isHovering.current = true;
  };

  const handleMouseLeave = () => {
    isHovering.current = false;
  };

  /** ------------------------------
   * SWIPE SUPPORT
   * ------------------------------ */
  let startX = 0;

  const onTouchStart = (e) => {
    startX = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (diff > 50) {
      if (loop || index < images.length - 1) next();
    }
    if (diff < -50) {
      if (loop || index > 0) prev();
    }
  };

  return (
    <div
      className="relative overflow-hidden w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={sliderRef}
        className="flex transition-transform duration-500"
        style={{transform: `translateX(-${index * 100}%)`}}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img) => (
          <div key={img.id} className="min-w-full">
           
            <img
              src={img.url}
              alt={img.altText}
              className="w-full h-auto object-cover"
            />
            
          </div>
        ))}
      </div>

      {/* ARROWS */}
      {showArrows && images.length > 1 && (
        <>
          {/* Prev */}
          <button
            onClick={prev}
            disabled={!loop && index === 0}
            className={`absolute top-1/2 left-3 -translate-y-1/2 
              bg-black/60 text-white w-10 h-10 flex items-center justify-center
              rounded-full backdrop-blur-sm transition
              ${!loop && index === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-black/80"}
            `}
          >
            <span className="text-xl leading-none">‹</span>
          </button>

          {/* Next */}
          <button
            onClick={next}
            disabled={!loop && index === images.length - 1}
            className={`absolute top-1/2 right-3 -translate-y-1/2 
              bg-black/60 text-white w-10 h-10 flex items-center justify-center
              rounded-full backdrop-blur-sm transition
              ${!loop && index === images.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-black/80"}
            `}
          >
            <span className="text-xl leading-none">›</span>
          </button>
        </>
      )}

      {/* DOTS */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-2 w-full flex justify-center gap-2">
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition
                ${i === index ? "bg-gray-700 shadow-[0_0_4px_rgba(0,0,0,0.6)]" 
                  : "bg-white/40 shadow-[0_0_3px_rgba(0,0,0,0.5)]"}`}
                  
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
