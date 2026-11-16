import "./genan-loader.css";

/** Lightweight route fallback; animation ends naturally when the route loads. */
const LoadingScreen = () => (
  <main
    className="genan-loading-screen"
    dir="rtl"
    role="status"
    aria-live="polite"
    aria-label="جاري تحميل الصفحة"
  >
    <div className="genan-loading-brand" aria-hidden="true" dir="ltr">
      <span className="genan-loading-wordmark">GENAN</span>
      <span className="genan-loading-track">
        <span className="genan-loading-track__glide" />
      </span>
    </div>
  </main>
);

export default LoadingScreen;
