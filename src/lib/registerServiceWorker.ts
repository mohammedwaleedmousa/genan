export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  const update = async () => {
    try {
      await navigator.serviceWorker.register("/sw.js?v=5", { updateViaCache: "none" });
    } catch (error) {
      console.error("[pwa] service worker registration failed", error);
    }
  };

  // Start revision checks while route modules load, including on image-heavy pages.
  void update();
};
