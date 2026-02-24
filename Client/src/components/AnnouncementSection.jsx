import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getSocket } from "../utils/realtime";
import { getCachedData, setCachedData } from "../utils/apiCache";

const ANNOUNCEMENTS_CACHE_KEY = "announcements_list";
const ANNOUNCEMENTS_CACHE_TTL_MS = 90 * 1000;

export default function AnnouncementSection() {
  const sectionRef = useRef(null);
  const shouldPinAfterPageChangeRef = useRef(false);
  // Announcements state (public)
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? 2 : 4
  );
  const [page, setPage] = useState(1);

  const loadAnnouncements = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedAnnouncements = getCachedData(
        ANNOUNCEMENTS_CACHE_KEY,
        ANNOUNCEMENTS_CACHE_TTL_MS
      );
      if (Array.isArray(cachedAnnouncements)) {
        setAnnouncements(cachedAnnouncements);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load announcements");
      const nextAnnouncements = Array.isArray(data) ? data : [];
      setAnnouncements(nextAnnouncements);
      setCachedData(ANNOUNCEMENTS_CACHE_KEY, nextAnnouncements);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load announcements from API
  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const next = window.innerWidth < 768 ? 2 : 4;
      setItemsPerPage(next);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [itemsPerPage]);

  // Realtime refresh
  useEffect(() => {
    const socket = getSocket();
    const handler = () => loadAnnouncements(true);
    socket.on("announcements:update", handler);
    return () => {
      socket.off("announcements:update", handler);
    };
  }, []);

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPages = Math.max(1, Math.ceil(announcements.length / itemsPerPage));
  const paginatedAnnouncements = announcements.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const keepFocusOnAnnouncements = () => {
    const el = sectionRef.current;
    if (!el) return;
    const navOffset = 90;
    const y = el.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: y, behavior: "auto" });
  };

  useEffect(() => {
    if (!shouldPinAfterPageChangeRef.current) return;
    shouldPinAfterPageChangeRef.current = false;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        keepFocusOnAnnouncements();
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [page]);

  return (
    <section
      ref={sectionRef}
      className="bg-[#fff6e5] relative w-full py-10 reveal overflow-hidden"
    >
      {/* ===== HEADING ===== */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h2 className="text-4xl md:text-5xl font-serif text-[#7a1f1f] tracking-tight">
          Latest <span className="italic text-yellow-600">Announcements</span>
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-[#7a1f1f] to-yellow-500 mt-2 rounded-full" />
      </div>

      {/* ===== ANNOUNCEMENTS GRID ===== */}
      <div className="grid container max-w-7xl mx-auto px-6 md:px-8 lg:px-12 grid-cols-1 md:grid-cols-2 gap-6">
        {loading && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#7a1f1f]/30">
            Loading announcements...
          </div>
        )}
        {error && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#7a1f1f]/30 text-red-600">
            {error}
          </div>
        )}
        {!loading && !error && announcements.length === 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#7a1f1f]/30">
            No announcements right now.
          </div>
        )}
        {paginatedAnnouncements.map((item) => (
          (() => {
            const showSubmitButton = item.showSubmitButton === true;
            const dateLabel = formatDisplayDate(item.eventDate);
            return (
              <div
                key={item._id}
                className="bg-white p-8 rounded-3xl shadow-lg border border-[#7a1f1f] transition-all duration-300 cursor-pointer hover:shadow-2xl hover:border-yellow-400 hover:-translate-y-1 hover:scale-[1.02]"
              >
                <h3 className="text-xl font-semibold text-[#7a1f1f] mb-2">
                  {item.title}
                </h3>
                {dateLabel && (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e8c267] bg-[#fff5d8] px-3 py-1 text-xs font-semibold text-[#7a1f1f] shadow-sm">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#d97706]" />
                    {dateLabel}
                  </div>
                )}
                <p className="text-gray-700 leading-relaxed mb-4">
                  {item.message}
                </p>
                {showSubmitButton && (
                  <Link
                    to="/SubmitResult"
                    state={{ activeSection: "announcements" }}
                    className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-yellow-500 transition"
                  >
                    {item.submitButtonLabel || "Submit Result"}
                  </Link>
                )}
              </div>
            );
          })()
        ))}
      </div>
      {!loading && !error && announcements.length > itemsPerPage && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              shouldPinAfterPageChangeRef.current = true;
              setPage((p) => Math.max(1, p - 1));
            }}
            disabled={page === 1}
            className="rounded-full border border-[#d9b88e] bg-white px-4 py-1.5 text-sm text-[#7a1f1f] disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-[#7a1f1f]">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              shouldPinAfterPageChangeRef.current = true;
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            disabled={page === totalPages}
            className="rounded-full border border-[#d9b88e] bg-white px-4 py-1.5 text-sm text-[#7a1f1f] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
    </section>
  );
}
