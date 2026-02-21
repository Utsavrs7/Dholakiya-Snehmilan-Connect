import { useState, useEffect, useRef, useCallback } from "react";
import {
  IoClose,
  IoDownloadOutline,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import { DEFAULT_GALLERY_IMAGES } from "../utils/galleryData";
import { getSocket } from "../utils/realtime";

// ==========================
// GALLERY DATA (LOCAL + DEFAULT)
// ==========================

// ==========================
// MEMOIZED GALLERY ITEM
// ==========================
import { memo } from "react";

const GalleryItem = memo(({ img, index, onClick }) => (
  <div
    className="
      mb-3 overflow-hidden rounded-2xl
      border border-[#e7d7c6]
      bg-white
      shadow-sm hover:shadow-xl
      hover:border-[#d9b98f]
      hover:-translate-y-1
      transition-all duration-300 cursor-pointer
    "
    style={{ breakInside: "avoid" }}
    onClick={() => onClick(index)}
  >
    <img
      src={img.imageUrl}
      alt="gallery"
      loading="lazy"
      className="w-full h-auto object-cover rounded-2xl"
    />
  </div>
));

export default function GallerySection() {
  // Gallery data (admin managed via localStorage, fallback to defaults)
  const [galleryItems, setGalleryItems] = useState(DEFAULT_GALLERY_IMAGES);
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesPerPage, setImagesPerPage] = useState(15);
  const [activeFilter, setActiveFilter] = useState("all");

  // Anchor ref for clean scrolling
  const galleryAnchorRef = useRef(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeAnim, setSwipeAnim] = useState(null);
  const swipeTimerRef = useRef(null);
  const touchStartTimeRef = useRef(0);
  const closeBtnRef = useRef(null);

  const loadGallery = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        const normalized = data.map((item) => ({
          ...item,
          imageUrl:
            item.imageUrl?.startsWith("/uploads")
              ? `${import.meta.env.VITE_API_URL}${item.imageUrl}`
              : item.imageUrl,
        }));
        setGalleryItems(normalized);
      } else {
        setGalleryItems(DEFAULT_GALLERY_IMAGES);
      }
    } catch {
      setGalleryItems(DEFAULT_GALLERY_IMAGES);
    }
  };

  // Load gallery items from API (fallback to defaults)
  useEffect(() => {
    loadGallery();
  }, []);

  // Realtime refresh
  useEffect(() => {
    const socket = getSocket();
    const handler = () => loadGallery();
    socket.on("gallery:update", handler);
    return () => {
      socket.off("gallery:update", handler);
    };
  }, []);

  // ===== RESPONSIVE IMAGES PER PAGE =====
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setImagesPerPage(8);
      } else {
        setImagesPerPage(15);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ===== PAGINATION LOGIC =====
  const lastIndex = currentPage * imagesPerPage;
  const firstIndex = lastIndex - imagesPerPage;
  const filteredImages =
    activeFilter === "all"
      ? galleryItems
      : galleryItems.filter((img) => img.category === activeFilter);
  const currentImages = filteredImages.slice(firstIndex, lastIndex);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredImages.length / imagesPerPage)
  );

  // ===== MODAL FUNCTIONS =====
  const openModal = useCallback((index) => {
    setCurrentImageIndex(firstIndex + index);
    setIsModalOpen(true);
    setZoomLevel(1);
    setIsZoomed(false);
    document.body.style.overflow = "hidden"; // stop background scroll
  }, [firstIndex]);

  const closeModal = () => {
    setIsModalOpen(false);
    setZoomLevel(1);
    setIsZoomed(false);
    document.body.style.overflow = "unset";
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
    setZoomLevel(1);
    setIsZoomed(false);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + filteredImages.length) % filteredImages.length
    );
    setZoomLevel(1);
    setIsZoomed(false);
  };

  const toggleZoom = () => {
    if (isZoomed) {
      setZoomLevel(1);
      setIsZoomed(false);
    } else {
      setZoomLevel(2);
      setIsZoomed(true);
    }
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    const url = filteredImages[currentImageIndex]?.imageUrl;
    link.href = url;
    link.download = `gallery-file-${currentImageIndex + 1}`;
    link.click();
  };

  // Touch swipe for mobile
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchMove = (e) =>
    setTouchEnd(e.targetTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const elapsed = Date.now() - touchStartTimeRef.current;
    const threshold = elapsed < 220 ? 30 : 50;
    if (distance > threshold) {
      setSwipeAnim("next");
      if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
      swipeTimerRef.current = setTimeout(() => {
        nextImage();
        setSwipeAnim(null);
      }, 180);
    }
    if (distance < -threshold) {
      setSwipeAnim("prev");
      if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
      swipeTimerRef.current = setTimeout(() => {
        prevImage();
        setSwipeAnim(null);
      }, 180);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen) return;
    if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    setSwipeAnim(null);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (closeBtnRef.current) closeBtnRef.current.focus();
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (filteredImages.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % filteredImages.length;
    const prevIndex =
      (currentImageIndex - 1 + filteredImages.length) % filteredImages.length;
    const preloadNext = new Image();
    const preloadPrev = new Image();
    preloadNext.src = filteredImages[nextIndex].imageUrl;
    preloadPrev.src = filteredImages[prevIndex].imageUrl;
  }, [isModalOpen, currentImageIndex, filteredImages]);

  // Scroll fix
  const scrollToGalleryAnchor = () => {
    if (!galleryAnchorRef.current) return;

    const offset = window.innerWidth < 768 ? 70 : 80;

    const top =
      galleryAnchorRef.current.getBoundingClientRect().top +
      window.scrollY -
      offset;

    window.scrollTo({ top, behavior: "smooth" });
  };

  const goNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      setTimeout(scrollToGalleryAnchor, 120);
    }
  };

  const goPrev = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      setTimeout(scrollToGalleryAnchor, 120);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setIsModalOpen(false);
  }, [activeFilter]);


  return (
    <section
      className="bg-[#fff6e5] w-full py-12"
    >
      {/* ===== TITLE ===== */}
      <div
        ref={galleryAnchorRef}
        className="max-w-7xl mx-auto px-6 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif text-[#7a1f1f] tracking-tight">
              Photo <span className="italic text-yellow-600">Gallery</span>
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#7a1f1f] to-yellow-500 mt-2 rounded-full" />
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { id: "all", label: "All" },
              { id: "snehmilan", label: "Snehmilan" },
              { id: "cricket", label: "Cricket" },
              { id: "butbhavani_havan", label: "Butbhavani Maa Havan" },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={
                    `px-4 py-1.5 rounded-full border text-sm md:text-base ` +
                    `transition-all duration-300 ` +
                    (isActive
                      ? "bg-[#7a1f1f] text-white border-[#7a1f1f] shadow-md"
                      : "bg-white text-[#7a1f1f] border-[#7a1f1f]/30 hover:bg-[#7a1f1f] hover:text-white hover:shadow-lg hover:-translate-y-0.5")
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== PINTEREST GRID (no blank gaps) ===== */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="columns-2 md:columns-4 lg:columns-5 gap-3">
          {currentImages.map((img, idx) => (
            <GalleryItem
              key={idx}
              index={idx}
              img={img}
              onClick={openModal}
            />
          ))}
        </div>
      </div>

      {/* ===== PAGINATION ===== */}
      <div className="flex justify-center items-center gap-8 mt-10">
        <button
          onClick={goPrev}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="text-gray-800 text-4xl disabled:opacity-40"
        >
          <IoChevronBack />
        </button>

        <span className="text-gray-700 font-medium">
          Page {currentPage} / {totalPages}
        </span>

        <button
          onClick={goNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="text-gray-800 text-4xl disabled:opacity-40"
        >
          <IoChevronForward />
        </button>
      </div>

      {/* ===== MODAL (BIG FIX HERE) ===== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] gallery-modal-fade"
          onClick={closeModal} // 🔥 CLICK OUTSIDE = CLOSE
        >
          <div
            className="relative w-full h-full flex items-center justify-center p-4 gallery-modal-pop"
            role="dialog"
            aria-modal="true"
            aria-label="Gallery image viewer"
          >
            {/* Close */}
            <button
              ref={closeBtnRef}
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 focus:outline-none "
            >
              <IoClose />
            </button>

            {/* Download */}
            <button
              onClick={downloadImage}
              aria-label="Download image"
              className="absolute top-4 left-4 text-white text-2xl hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/60 rounded"
            >
              <IoDownloadOutline />
            </button>

            <style>{`
              @keyframes gallerySwipeNext {
                from { transform: translateX(0) scale(1); opacity: 1; }
                to { transform: translateX(-40px) scale(0.98); opacity: 0.6; }
              }
              @keyframes gallerySwipePrev {
                from { transform: translateX(0) scale(1); opacity: 1; }
                to { transform: translateX(40px) scale(0.98); opacity: 0.6; }
              }
              @keyframes gallerySwipeHint {
                0%, 75% { transform: translateX(0) scale(1); }
                82% { transform: translateX(-8px) scale(0.99); }
                90% { transform: translateX(8px) scale(0.99); }
                100% { transform: translateX(0) scale(1); }
              }
              @keyframes galleryModalFade {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes galleryModalPop {
                from { opacity: 0; transform: scale(0.98); }
                to { opacity: 1; transform: scale(1); }
              }
              .gallery-swipe-next {
                animation: gallerySwipeNext 0.18s ease-in both;
              }
              .gallery-swipe-prev {
                animation: gallerySwipePrev 0.18s ease-in both;
              }
              .gallery-swipe-hint {
                animation: gallerySwipeHint 6s ease-in-out infinite;
              }
              .gallery-modal-fade {
                animation: galleryModalFade 0.18s ease-out both;
              }
              .gallery-modal-pop {
                animation: galleryModalPop 0.22s ease-out both;
              }
              @media (min-width: 768px) {
                .gallery-swipe-hint { animation: none; }
              }
            `}</style>

            {/* Image */}
            <div
              className={`${swipeAnim === "next"
                ? "gallery-swipe-next"
                : swipeAnim === "prev"
                  ? "gallery-swipe-prev"
                  : "gallery-swipe-hint"
                }`}
              onClick={(e) => e.stopPropagation()} // keep image clicks from closing modal
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={filteredImages[currentImageIndex]?.imageUrl}
                alt="gallery"
                className="max-w-[90vw] max-h-[80vh] object-contain transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
                onDoubleClick={toggleZoom}
              />
            </div>

            {/* Navigation (desktop only) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Previous image"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 
                         text-white text-3xl md:text-4xl
                         rounded-full w-12 h-12 md:w-14 md:h-14
                         flex items-center justify-center"
            >
              <IoChevronBack />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Next image"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 
                         text-white text-3xl md:text-4xl
                         rounded-full w-12 h-12 md:w-14 md:h-14
                         flex items-center justify-center"
            >
              <IoChevronForward />
            </button>

            {/* Image counter */}
            <div
              role="status"
              aria-live="polite"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg"
            >
              {filteredImages.length
                ? `${currentImageIndex + 1} / ${filteredImages.length}`
                : "0 / 0"}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
