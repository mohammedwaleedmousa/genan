import "./genan-loader.css";

/** Lightweight route fallback; animation ends naturally when the route loads. */
const LoadingScreen = ({ message }: { message?: string }) => (
  <main
    className="genan-loading-screen"
    dir="rtl"
    role="status"
    aria-live="polite"
    aria-label={message || "جاري تحميل الصفحة"}
  >
    <div className="genan-loading-brand">
      <span className="genan-loading-wordmark" aria-hidden="true" dir="ltr">GENAN</span>
      <span className="genan-loading-track" aria-hidden="true" dir="ltr">
        <span className="genan-loading-track__glide" />
      </span>
      {message && <p className="text-sm text-[#5E4B47]">{message}</p>}
    </div>
  </main>
);

export default LoadingScreen;
