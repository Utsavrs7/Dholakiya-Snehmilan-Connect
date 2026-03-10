import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function FooterSection() {
  const year = new Date().getFullYear();
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    try {
      const base = 12840;
      const stored = Number.parseInt(localStorage.getItem("visitor_count") || "", 10);
      const next = Number.isFinite(stored) && stored > 0 ? stored + 1 : base;
      localStorage.setItem("visitor_count", String(next));
      setVisitorCount(next);
    } catch {
      setVisitorCount(12840);
    }
  }, []);

  return (
    <footer className="relative w-full bg-[#6b1d1d] text-white overflow-hidden">
      <style>{`
        @keyframes visitorGlow {
          0% { box-shadow: 0 0 0 rgba(253,224,71,0.0); }
          50% { box-shadow: 0 0 18px rgba(253,224,71,0.35); }
          100% { box-shadow: 0 0 0 rgba(253,224,71,0.0); }
        }
        @keyframes visitorSweep {
          0% { transform: translateX(-60%); opacity: 0.15; }
          50% { transform: translateX(10%); opacity: 0.45; }
          100% { transform: translateX(70%); opacity: 0.15; }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "100% 28px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link to="/" className="inline-flex">
              <img
                src="Logo/NavLogo.png"
                alt="Dholakiya Parivar"
                className="h-14 w-auto object-contain mb-4"
              />
            </Link>

            <p className="text-sm text-white/80 leading-relaxed max-w-sm">
              Dholakiya Parivar - ek parivar, ek parampara. Amara sambandho,
              sanskar ane seva no safar satat vikas pame.
            </p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-yellow-300/50 bg-yellow-200/10 px-4 py-2 text-xs font-semibold text-yellow-200 relative overflow-hidden animate-[visitorGlow_4.5s_ease-in-out_infinite]">
              <span className="uppercase tracking-[0.2em] text-[10px] text-yellow-100/80">
                Visitors
              </span>
              <span className="h-4 w-px bg-yellow-200/40" />
              <span className="text-sm text-yellow-100 font-bold">
                {visitorCount.toLocaleString("en-IN")}
              </span>
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent animate-[visitorSweep_6s_ease-in-out_infinite]" />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-yellow-300 mb-4">
              Quick Links
            </h4>
            <ul className="grid grid-cols-2 grid-rows-3 gap-2 text-sm text-white/80">
              <li>
                <a className="hover:text-yellow-300 transition" href="#home">
                  Home
                </a>
              </li>
              <li>
                <a className="hover:text-yellow-300 transition" href="#highlights">
                  Highlights
                </a>
              </li>
              <li>
                <a className="hover:text-yellow-300 transition" href="#announcements">
                  Announcements
                </a>
              </li>
              <li>
                <a className="hover:text-yellow-300 transition" href="#gallery">
                  Gallery
                </a>
              </li>
              <li>
                <a className="hover:text-yellow-300 transition" href="#about">
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-yellow-300 mb-4">
              Contact
            </h4>
            <div className="text-sm text-white/80 space-y-2">
              <div>Village: Dholakiya Parivar</div>
              <div>Email: info@dholakiyaparivar.com</div>
              <div>Phone: +91 9XXXXXXXXX</div>
            </div>
            <div className="mt-5 flex gap-3">
              <div className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-[#6b1d1d] transition grid place-items-center">
                f
              </div>
              <div className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-[#6b1d1d] transition grid place-items-center">
                i
              </div>
              <div className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-[#6b1d1d] transition grid place-items-center">
                y
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-white/20 text-sm text-white/70 flex flex-col md:flex-row justify-between gap-2">
          <span>© {year} Dholakiya Parivar. All rights reserved.</span>
          <span>Design by Leo Infotech</span>
        </div>
      </div>
    </footer>
  );
}

