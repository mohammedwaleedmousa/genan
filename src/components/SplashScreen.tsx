import { useEffect, useState } from "react";

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [leaving, setLeaving] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverflow = html.style.overflow;
    const previousOverscroll = html.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      html.style.overflow = previousHtmlOverflow;
      html.style.overscrollBehavior = previousOverscroll;
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };
  }, []);

  useEffect(() => {
    const leaveAt = reduceMotion ? 350 : 1250;
    const doneAt = reduceMotion ? 500 : 1550;

    const leaveTimer = window.setTimeout(() => setLeaving(true), leaveAt);
    const doneTimer = window.setTimeout(onDone, doneAt);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone, reduceMotion]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex h-[100dvh] w-screen touch-none items-center justify-center overflow-hidden bg-[#F7F5F0] transition-opacity duration-300 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-label="جاري فتح جنان"
    >
      <div className={`relative flex min-h-[220px] w-[240px] items-center justify-center ${reduceMotion ? "" : "genan-splash-enter"}`}>
        <div className="absolute inset-0 border border-[#D8C29A]/30" />
        <div className="absolute -right-3 top-8 h-px w-16 bg-[#0E0E0E]/35" />
        <div className="absolute -left-1 bottom-10 h-2 w-2 bg-[#A9D8D3]" />

        <div className="text-center">
          <div className="genan-splash-word text-[38px] font-medium tracking-[.22em] text-[#0E0E0E]">GENAN</div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#D8C29A]" />
            <span className="text-[7px] font-semibold tracking-[.32em] text-[#9A825B]">CURATED STORE</span>
            <span className="h-px w-8 bg-[#D8C29A]" />
          </div>
        </div>
      </div>

      <style>{`
        .genan-splash-enter {
          animation: genan-splash-enter .7s cubic-bezier(.22,1,.36,1) both;
        }

        .genan-splash-word {
          animation: genan-splash-word 1.15s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes genan-splash-enter {
          from { opacity: 0; transform: scale(.975); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes genan-splash-word {
          from { opacity: 0; letter-spacing: .34em; transform: translateY(8px); }
          to { opacity: 1; letter-spacing: .22em; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .genan-splash-enter,
          .genan-splash-word { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
