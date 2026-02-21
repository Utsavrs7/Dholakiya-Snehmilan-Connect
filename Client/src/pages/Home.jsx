import { lazy, Suspense, useEffect, useRef, useState } from "react";
import IntroSection from "../components/IntroSection";
import HeroSlider from "../components/HeroSlider";
import AnnouncementSection from "../components/AnnouncementSection";
import { getSocket } from "../utils/realtime";

const GallerySection = lazy(() => import("../components/GallerySection"));
const AboutSection = lazy(() => import("../components/AboutSection"));
const FooterSection = lazy(() => import("../components/FooterSection"));

function DeferredSection({ minHeightClass = "min-h-[40vh]", anchorId, children }) {
  const mountRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = mountRef.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={mountRef} id={anchorId}>
      {visible ? (
        <Suspense fallback={<div className={`w-full ${minHeightClass}`} />}>{children}</Suspense>
      ) : (
        <div className={`w-full ${minHeightClass}`} />
      )}
    </div>
  );
}

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    const refreshHome = () => {
      setRefreshKey((prev) => prev + 1);
    };

    socket.on("hero:update", refreshHome);
    socket.on("gallery:update", refreshHome);
    socket.on("announcements:update", refreshHome);

    return () => {
      socket.off("hero:update", refreshHome);
      socket.off("gallery:update", refreshHome);
      socket.off("announcements:update", refreshHome);
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const observed = new WeakSet();

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: isMobile ? 0.05 : 0.15,
        rootMargin: isMobile ? "0px 0px 20% 0px" : "0px 0px 10% 0px",
      }
    );

    const registerRevealElement = (el) => {
      if (!el || observed.has(el)) return;
      observed.add(el);

      const isScrollOnly = el.getAttribute("data-reveal-on-scroll") === "true";
      if (!isScrollOnly) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85) {
          el.classList.add("show", "reveal-no-anim");
          return;
        }
      }

      revealObserver.observe(el);
    };

    const scanAndRegister = () => {
      document.querySelectorAll(".reveal").forEach(registerRevealElement);
    };

    scanAndRegister();

    const mutationObserver = new MutationObserver(() => {
      scanAndRegister();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <main className="w-full min-h-screen">

      {/* INTRO FIRST */}
      <div id="home">
        <IntroSection />
      </div>

      {/* SLIDER SECOND */}
      <div id="highlights">
        <HeroSlider key={`hero-${refreshKey}`} />
      </div>

      {/* ANNOUNCEMENTS */}
      <div id="announcements">
        <AnnouncementSection key={`announ-${refreshKey}`} />
      </div>

      {/* GALLERY */}
      <DeferredSection minHeightClass="min-h-[70vh]" anchorId="gallery">
        <GallerySection key={`gallery-${refreshKey}`} />
      </DeferredSection>

      {/* ABOUT */}
      <DeferredSection minHeightClass="min-h-[30vh]" anchorId="about">
        <AboutSection />
      </DeferredSection>

      {/* FOOTER */}
      <DeferredSection minHeightClass="min-h-[20vh]">
        <FooterSection />
      </DeferredSection>

    </main>
  );
}
