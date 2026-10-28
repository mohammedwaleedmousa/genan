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
    <div className="genan-loading-mark" aria-hidden="true">
      <span className="genan-loading-mark__base" />
      <span className="genan-loading-mark__reveal" />
      <span className="genan-loading-mark__shine" />
    </div>
  </main>
);

export default LoadingScreen;
