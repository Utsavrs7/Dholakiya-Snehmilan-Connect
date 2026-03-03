import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Icons
import { getCachedData, setCachedData } from "../utils/apiCache";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

const fallbackImages = [
  { imageUrl: "/Background Images/Bg-1.jpg" },
  { imageUrl: "/Background Images/Bg-2.jpeg" },
  { imageUrl: "/Background Images/Bg-3.jpeg" },
  { imageUrl: "/Background Images/Bg-4.jpeg" },
  { imageUrl: "/Background Images/bg2.jpg" },
];
const HERO_CACHE_KEY = "hero_slides";
const HERO_CACHE_TTL_MS = 2 * 60 * 1000;

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Fetch Logic
  useEffect(() => {
    const loadSlides = async (forceRefresh = false) => {
      if (!forceRefresh) {
        const cachedSlides = getCachedData(HERO_CACHE_KEY, HERO_CACHE_TTL_MS);
        if (Array.isArray(cachedSlides) && cachedSlides.length > 0) {
          setSlides(cachedSlides);
          return;
        }
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero`);
        const data = await res.json();

        if (res.ok && Array.isArray(data) && data.length > 0) {
          const normalized = data.map((s) => ({
            ...s,
            imageUrl: s.imageUrl?.startsWith("/uploads")
              ? `${import.meta.env.VITE_API_URL}${s.imageUrl}`
              : s.imageUrl,
          }));
          setSlides(normalized);
          setCachedData(HERO_CACHE_KEY, normalized);
        } else {
          setSlides(fallbackImages);
        }
      } catch {
        setSlides(fallbackImages);
      }
    };
    loadSlides();
  }, []);

  // Ensure enough slides for loop
  const rawSlides = slides.length > 0 ? slides : fallbackImages;
  const displaySlides =
    rawSlides.length < 6
      ? [...rawSlides, ...rawSlides, ...rawSlides]
      : rawSlides;


  return (
    <section className="relative w-full bg-[#fff6e5] reveal py-16 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#7a1f1f]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {/* Header */}
      <div className="relative max-w-7xl mx-auto px-6 mb-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif text-[#7a1f1f] tracking-tight">
            Our <span className="italic text-yellow-600">Highlights</span>
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-[#7a1f1f] to-yellow-500 mt-2 rounded-full" />
        </div>
      </div>

      {/* Slider */}
      <div className="relative w-full pb-10">
        <Swiper
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={"auto"}
          loop={true}
          speed={800} // Smooth transition speed
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 150, // Creates the 3D depth
            modifier: 2.5,
            slideShadows: false, // Shadows handled via CSS for better performance
          }}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true, dynamicBullets: true }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
          className="hero-swiper !overflow-visible"
        >
          {displaySlides.map((slide, i) => (
            <SwiperSlide
              key={i}
              className="group relative !w-[80vw] md:!w-[600px] lg:!w-[800px] aspect-[16/10] rounded-2xl overflow-hidden transition-all duration-500"
            >
              {/* Image Container with Ken Burns Effect */}
              <div className="w-full h-full overflow-hidden bg-gray-200">
                <img
                  src={slide.imageUrl}
                  alt={slide.title || `highlight-${i}`}
                  className="w-full h-full object-cover transition-transform duration-[5000ms] ease-linear group-[.swiper-slide-active]:scale-110"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>

              {/* Overlay Gradient (Always visible but stronger on non-active) */}
              <div className="absolute inset-0 bg-black/40 group-[.swiper-slide-active]:bg-transparent transition-colors duration-500 pointer-events-none" />

              {/* Text Content - CONDITIONAL RENDERING */}
              {(slide.title || slide.subtitle) && (
                <>
                  {/* Bottom Gradient for Text contrast */}
                  <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-[.swiper-slide-active]:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Slide Content (Only visible when active) */}
                  <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 translate-y-4 opacity-0 group-[.swiper-slide-active]:translate-y-0 group-[.swiper-slide-active]:opacity-100 transition-all duration-700 delay-100">
                    {slide.title && (
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs text-white uppercase tracking-wider mb-2">
                        {slide.title}
                      </span>
                    )}
                    {slide.subtitle && (
                      <h3 className="text-white text-2xl md:text-3xl font-serif">
                        {slide.subtitle}
                      </h3>
                    )}
                  </div>
                </>
              )}
            </SwiperSlide>
          ))}


        </Swiper>
        <button ref={prevRef} className="nav-btn nav-btn-prev group" aria-label="Previous slide">
          <ChevronLeft className="w-5 h-5 text-white transition-transform group-hover:-translate-x-0.5" />
        </button>
        <button ref={nextRef} className="nav-btn nav-btn-next group" aria-label="Next slide">
          <ChevronRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <style>{`
        /* Navigation Buttons */
        .nav-btn {
          width: 44px;
          height: 44px;
          padding: 0;
          border-radius: 14px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 40;
          transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
        }
        .nav-btn-prev {
          left: 12px;
        }
        .nav-btn-next {
          right: 12px;
        }
        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.92);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.26);
        }
        .nav-btn:active {
          opacity: 0.9;
        }
        .nav-btn.swiper-button-disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }
        @media (max-width: 767px) {
          .nav-btn {
            width: 38px;
            height: 38px;
          }
          .nav-btn-prev {
            left: 8px;
          }
          .nav-btn-next {
            right: 8px;
          }
        }
        @media (min-width: 1280px) {
          .nav-btn-prev {
            left: 18px;
          }
          .nav-btn-next {
            right: 18px;
          }
        }

        /* Swiper Slide Styling */
        .hero-swiper .swiper-slide {
          transform-origin: center bottom;
          /* Non-active slides styling */
          opacity: 0.6;
          /* Filters only on desktop to save mobile GPU */
        }
        
        @media (min-width: 768px) {
          .hero-swiper .swiper-slide {
            filter: blur(1px) grayscale(30%);
          }
        }
        
        .hero-swiper .swiper-slide-active {
          opacity: 1;
          z-index: 20;
          /* Simplified shadow for mobile */
          box-shadow: 0 10px 20px -5px rgba(122, 31, 31, 0.3);
        }

        @media (min-width: 768px) {
          .hero-swiper .swiper-slide-active {
            filter: blur(0) grayscale(0%);
            box-shadow: 0 25px 60px -12px rgba(122, 31, 31, 0.5);
            transform: scale(1.02); /* Subtle pop */
          }
        }

        /* Pagination Dots */
        .hero-swiper .swiper-pagination-bullet {
          background-color: #7a1f1f;
          opacity: 0.3;
          width: 8px;
          height: 8px;
          transition: all 0.3s;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          width: 24px;
          border-radius: 4px;
          background-color: #7a1f1f;
        }
      `}</style>

    </section>

  );
}
