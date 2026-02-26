import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { clearAuth, getToken, getUser, setAuthUser } from "../utils/auth"
import { getSocket } from "../utils/realtime"
import { apiUrl } from "../utils/api"
import Lottie from "lottie-react"
import boyProfileAnimation from "../../public/Lottie/profile.json"
import girlProfileAnimation from "../../public/Lottie/girlProfile.json"

export default function Navbar() {
  const ANNOUNCEMENT_SEEN_KEY = "announcements_last_seen_at"
  const SCROLL_CLOSE_GUARD_MS = 6000
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(getUser())
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0)
  const [latestAnnouncementMs, setLatestAnnouncementMs] = useState(0)
  const profileRef = useRef(null)
  const profileOpenedAtRef = useRef(0)
  const [activeSection, setActiveSection] = useState("home")
  const location = useLocation()
  const navigate = useNavigate()
  const navOffset = 80

  const sections = [
    { id: "home", label: "Home" },
    { id: "highlights", label: "Highlights" },
    { id: "announcements", label: "Announce" },
    { id: "gallery", label: "Gallery" },
    { id: "about", label: "About" },
  ]

  const scrollToSection = (id, attempt = 0) => {
    const el = document.getElementById(id)
    if (!el) {
      if (attempt < 8) {
        window.requestAnimationFrame(() => scrollToSection(id, attempt + 1))
      }
      return
    }
    const y = el.getBoundingClientRect().top + window.scrollY - navOffset
    window.scrollTo({ top: y, behavior: "smooth" })
  }

  const handleNavClick = (id) => {
    if (id === "announcements") {
      markAnnouncementsSeen()
    }
    setActiveSection(id)
    if (location.pathname === "/") {
      scrollToSection(id)
      return
    }
    navigate(`/#${id}`, { state: { scrollTo: id } })
  }

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(location.state?.activeSection ?? null)
      return
    }

    const targetFromState = location.state?.scrollTo
    const targetFromHash = location.hash?.replace("#", "")
    const target = targetFromState || targetFromHash

    if (target) {
      setTimeout(() => scrollToSection(target), 60)
      navigate("/", { replace: true, state: {} })
    }
  }, [location.pathname, location.state, location.hash, navigate])

  const loadAnnouncementNotifications = async () => {
    try {
      const res = await fetch(apiUrl("/api/announcements"))
      const data = await res.json()
      if (!res.ok) return
      const list = Array.isArray(data) ? data : []
      const latestMs = list.reduce((max, item) => {
        const ms = new Date(item.createdAt).getTime()
        if (Number.isNaN(ms)) return max
        return Math.max(max, ms)
      }, 0)
      setLatestAnnouncementMs(latestMs)

      const seenRaw = localStorage.getItem(ANNOUNCEMENT_SEEN_KEY)
      const seenMs = seenRaw ? Number(seenRaw) : 0
      const unread = list.filter((item) => {
        const ms = new Date(item.createdAt).getTime()
        return !Number.isNaN(ms) && ms > seenMs
      }).length
      setUnreadAnnouncementCount(unread)
    } catch {
      // Ignore badge failures to avoid blocking nav interactions.
    }
  }

  const markAnnouncementsSeen = () => {
    const seenMs = latestAnnouncementMs || Date.now()
    localStorage.setItem(ANNOUNCEMENT_SEEN_KEY, String(seenMs))
    setUnreadAnnouncementCount(0)
  }

  useEffect(() => {
    if (location.pathname !== "/") return

    let lastRun = 0
    const THROTTLE_MS = 150

    const checkActiveSection = () => {
      const viewportHeight = window.innerHeight
      const effectiveHeight = viewportHeight - navOffset
      let maxVisibility = 0
      let bestSection = activeSection // Keep current if no better match found

      // Find the section that occupies the most vertical space in the viewport
      sections.forEach((s) => {
        const el = document.getElementById(s.id)
        if (!el) return

        const rect = el.getBoundingClientRect()

        // Calculate intersection with the "viewable" area (below navbar)
        // Viewable area is from y=navOffset to y=viewportHeight
        const viewableTop = navOffset
        const viewableBottom = viewportHeight

        const itemTop = rect.top
        const itemBottom = rect.bottom

        // Overlap calculation
        const overlapTop = Math.max(viewableTop, itemTop)
        const overlapBottom = Math.min(viewableBottom, itemBottom)
        const visibleHeight = Math.max(0, overlapBottom - overlapTop)

        // Ratio of screen occupied by this section
        const coverageRatio = visibleHeight / effectiveHeight

        if (coverageRatio > maxVisibility) {
          maxVisibility = coverageRatio
          bestSection = s.id
        }
      })

      // If we are at the very top, force 'home'
      if (window.scrollY < 50) {
        setActiveSection("home")
        return
      }

      if (maxVisibility > 0) {
        setActiveSection(bestSection)
      }
    }

    const handleScroll = () => {
      const now = Date.now()
      if (now - lastRun < THROTTLE_MS) return
      lastRun = now
      window.requestAnimationFrame(checkActiveSection)
    }

    checkActiveSection() // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [location.pathname])

  useEffect(() => {
    loadAnnouncementNotifications()
    const socket = getSocket()
    const handler = () => loadAnnouncementNotifications()
    socket.on("announcements:update", handler)
    return () => {
      socket.off("announcements:update", handler)
    }
  }, [])

  useEffect(() => {
    if (location.pathname === "/" && activeSection === "announcements") {
      markAnnouncementsSeen()
    }
  }, [activeSection, location.pathname])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!profileRef.current) return
      if (!profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    const handleScrollLike = () => {
      if (Date.now() - profileOpenedAtRef.current < SCROLL_CLOSE_GUARD_MS) return
      setProfileOpen(false)
    }
    const handleEscape = (e) => {
      if (e.key === "Escape") setProfileOpen(false)
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
      window.addEventListener("scroll", handleScrollLike, true)
      window.addEventListener("wheel", handleScrollLike, { passive: true })
      window.addEventListener("touchmove", handleScrollLike, { passive: true })
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
      window.removeEventListener("scroll", handleScrollLike, true)
      window.removeEventListener("wheel", handleScrollLike)
      window.removeEventListener("touchmove", handleScrollLike)
    }
  }, [profileOpen])

  useEffect(() => {
    const refresh = () => setUser(getUser())
    window.addEventListener("auth_changed", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("auth_changed", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    let ignore = false
    const syncProfile = async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const me = await res.json()
        if (ignore) return
        setAuthUser(me)
      } catch {
        // Ignore profile sync failures in navbar.
      }
    }
    syncProfile()
    return () => {
      ignore = true
    }
  }, [])

  const userStatus = String(user?.accountStatus || "active").toLowerCase()
  const statusLabel =
    userStatus === "pending"
      ? "Pending Approval"
      : userStatus === "rejected"
        ? "Rejected"
        : "Active"
  const statusBadgeClass =
    userStatus === "pending"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : userStatus === "rejected"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"

  const handleLogout = () => {
    clearAuth()
    setProfileOpen(false)
    setOpen(false)
    navigate("/")
  }

  return (
    <>
      {/* ================= NAVBAR ================= */}
      {/* 
        fixed => navbar scroll pe chipka rahe
        h-16 => navbar height fixed
        backdrop-blur => glass effect
      */}
      <nav className="fixed left-0 w-full h-20 z-[1000] bg-[#6b1d1d] backdrop-blur-md text-white shadow-md">
        <div className="w-full h-full px-4 md:px-8 flex justify-between items-center">

          {/* ===== LOGO ===== */}
          <Link
            to="/"
            className="flex items-center"
            onClick={() => {
              setOpen(false)
              setProfileOpen(false)
              setActiveSection("home")
              if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            }}
          >
            <img
              src="Logo/NavLogo.png"
              alt="Dholakiya Parivar"
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* ===== DESKTOP MENU ===== */}
          <ul className="hidden md:flex gap-6 text-sm font-medium items-center">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`
                  group relative rounded-full p-[1px] transition-all duration-300 hover:-translate-y-[1px]
                  after:absolute after:left-0 after:-bottom-1
                  after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#ffd166] after:to-[#ffe9a3]
                  after:transition-all after:duration-300
                  hover:after:w-full
                  ${activeSection === item.id ? "after:w-full" : ""}
                `}
              >
                <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="absolute -inset-[1px] rounded-full bg-[conic-gradient(from_0deg,_#ffd166,_#ff8a5b,_#ffe9a3,_#ffd166)] animate-[spin_2.2s_linear_infinite]" />
                  <span className="absolute inset-[1px] rounded-full bg-[#6b1d1d]" />
                </span>
                <span className={`relative z-10 inline-flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-300 ${activeSection === item.id ? "bg-white/10 text-white" : "text-white group-hover:bg-white/10"}`}>
                  {item.label}
                  {item.id === "announcements" && unreadAnnouncementCount > 0 && (
                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[11px] font-bold text-black">
                      {unreadAnnouncementCount > 99 ? "99+" : unreadAnnouncementCount}
                    </span>
                  )}
                </span>
              </button>
            ))}

            {!user ? (
              <Link
                to="/login"
                className="group relative ml-2 rounded-full p-[1px] transition-all duration-300 hover:-translate-y-[1px]"
              >
                <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="absolute -inset-[1px] rounded-full bg-[conic-gradient(from_0deg,_#ffd166,_#ff8a5b,_#ffe9a3,_#ffd166)] animate-[spin_2.2s_linear_infinite]" />
                  <span className="absolute inset-[1px] rounded-full bg-[#6b1d1d]" />
                </span>
                <span className="relative z-10 inline-block rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black transition-colors duration-300 group-hover:bg-yellow-500">
                  Login
                </span>
              </Link>
            ) : (
              <div className="relative ml-2" ref={profileRef}>
                <button
                  onClick={() => {
                    setProfileOpen((v) => {
                      const next = !v
                      if (next) profileOpenedAtRef.current = Date.now()
                      return next
                    })
                  }}
                  className="w-12 h-12 rounded-full border border-yellow-300/70 flex items-center justify-center bg-yellow-50 overflow-hidden shadow-sm transition hover:scale-105"
                  title={user.name}
                >
                  {/* Lottie Profile Icon */}
                  <div className="w-full h-full overflow-hidden rounded-full flex items-center justify-center bg-yellow-50">
                    <Lottie
                      animationData={user.gender === "Female" ? girlProfileAnimation : boyProfileAnimation}
                      loop={true}
                      className="w-full h-full scale-[1.15]"
                    />
                  </div>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-gradient-to-b from-white to-[#fff8ee] text-[#7a1f1f] shadow-[0_18px_45px_rgba(58,31,31,0.25)] border border-[#ead8c4] p-0 z-50 overflow-hidden text-left transition-all duration-200 origin-top-right hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(58,31,31,0.3)]">
                    <div className="px-5 py-4 border-b border-[#f1e4d3] transition-colors duration-200 hover:bg-[#fff3e1]">
                      <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7a1f1f]/55">
                        Profile
                      </p>
                      <p className="mt-1 text-base font-extrabold tracking-[0.01em]">
                        {/* If name starts with Dholakiya/ધોળકિયા, just show name. Else prefix? Actually user said name is full Gujarati now. */}
                        {user.name}
                      </p>
                      <p className="mt-1 text-xs text-[#7a1f1f]/75 break-all">{user.email}</p>
                      <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    {user.mobile && (
                      <p className="px-5 pt-2 text-xs font-medium text-[#7a1f1f]/70 transition-colors duration-200 hover:text-[#7a1f1f]">{user.mobile}</p>
                    )}
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        handleLogout()
                      }}
                      className="mt-3 w-full text-left px-5 py-3.5 text-sm font-bold tracking-wide text-[#7a1f1f] hover:bg-[#fff0da] hover:tracking-[0.06em] hover:pl-6 transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </ul>

          {/* ===== MOBILE MENU BUTTON ===== */}
          <button
            onClick={() => setOpen(true)}
            className="
    md:hidden text-2xl
    transition-transform duration-150
    active:scale-90
  "
          >
            ☰
          </button>

        </div>
      </nav>

      {/* ================= MOBILE BACKDROP ================= */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="
      fixed inset-0 z-40
      bg-black/30 backdrop-blur-sm
      transition-opacity duration-300
      animate-fadeIn
    "
        />
      )}


      {/* ================= MOBILE RIGHT DRAWER ================= */}
      <div
        className={`
    fixed top-0 right-0 h-full w-[80%] max-w-sm z-[2000]
    bg-gradient-to-b from-[#7a1f1f]/75 to-[#9b2c2c]/60
    backdrop-blur-2xl
    transform transition-all duration-400
    ease-[cubic-bezier(0.34,1.56,0.64,1)]
    ${open
            ? "translate-x-0 scale-100 opacity-100"
            : "translate-x-full scale-90 opacity-0"}
  `}
      >

        {/* ===== DRAWER HEADER ===== */}
        <div className="flex justify-between items-center px-5 h-16 border-b border-white/20">
          <span className="text-yellow-300 font-semibold">DHOLAKIYA PARIVAR
          </span>
          <button
            onClick={() => setOpen(false)}
            className={`
    text-2xl text-white/80
    transition-all duration-300
    ${open ? "rotate-90 scale-110" : ""}
    hover:rotate-180 hover:text-white
    active:scale-90
  `}
          >
            ✕
          </button>

        </div>

        {/* ===== DRAWER MENU ===== */}
        <div className="flex flex-col gap-2 px-6 py-6 text-white font-medium">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setOpen(false)
                handleNavClick(item.id)
              }}
              className={`
                text-left px-4 py-3 rounded-xl transition
                hover:bg-white/10
                ${activeSection === item.id ? "text-yellow-300 border-l-4 border-yellow-300 bg-white/5 pl-3" : ""}
              `}
            >
              <span className="inline-flex items-center gap-2">
                {item.label}
                {item.id === "announcements" && unreadAnnouncementCount > 0 && (
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[11px] font-bold text-black">
                    {unreadAnnouncementCount > 99 ? "99+" : unreadAnnouncementCount}
                  </span>
                )}
              </span>
            </button>
          ))}

          {!user ? (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="mt-4 bg-yellow-400 text-black text-center py-3 rounded-full font-semibold hover:bg-yellow-500 transition"
            >
              Login
            </Link>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-yellow-200/50 bg-white/10 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full scale-[1.2]">
                    <Lottie
                      animationData={user.gender === "Female" ? girlProfileAnimation : boyProfileAnimation}
                      loop={true}
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-white/70">{user.email}</p>
                  <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
              {user.mobile && (
                <p className="text-xs text-white/70 mt-2">{user.mobile}</p>
              )}
              <button
                onClick={handleLogout}
                className="mt-3 w-full bg-yellow-400 text-black text-center py-2 rounded-full font-semibold hover:bg-yellow-500 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
