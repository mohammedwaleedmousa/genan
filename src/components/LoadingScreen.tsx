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
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen touch-none items-center justify-center overflow-hidden bg-white"
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E7E2D9] border-t-[#0E0E0E]" />
    </div>
  );
};

export default LoadingScreen;
