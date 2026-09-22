import { useEffect } from "react";

const AUTO_RETRY_WINDOW_MS = 30_000;

const LoadingScreen = () => {
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

    const retryKey = `genan-stalled-route-retry:${window.location.pathname}`;
    const autoRetryTimer = window.setTimeout(() => {
      const previousRetry = Number(window.sessionStorage.getItem(retryKey) || 0);
      if (previousRetry && Date.now() - previousRetry < AUTO_RETRY_WINDOW_MS) return;

      window.sessionStorage.setItem(retryKey, String(Date.now()));
      window.location.reload();
    }, 12000);

    return () => {
      window.clearTimeout(autoRetryTimer);
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

  return (
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen touch-none items-center justify-center overflow-hidden bg-[#F7F5F0]"
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <div className="relative flex h-[150px] w-[210px] items-center justify-center border border-[#D8C29A]/30">
        <div className="absolute -right-4 top-7 h-px w-14 bg-[#0E0E0E]/25" />
        <div className="absolute -left-1 bottom-7 h-2 w-2 bg-[#A9D8D3]" />

        <div className="text-center">
          <div className="text-[27px] font-medium tracking-[.22em] text-[#0E0E0E]">GENAN</div>
          <div className="mx-auto mt-4 h-px w-20 overflow-hidden bg-[#DED8CD]">
            <span className="genan-loader-line block h-full w-1/2 bg-[#9A825B]" />
          </div>
        </div>
      </div>

      <style>{`
        .genan-loader-line {
          animation: genan-loader-line 1.2s ease-in-out infinite alternate;
          transform-origin: right center;
        }

        @keyframes genan-loader-line {
          from { transform: translateX(90%); opacity: .35; }
          to { transform: translateX(-90%); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .genan-loader-line { animation: none; transform: none; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
