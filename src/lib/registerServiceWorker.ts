const GENAN_SW_VERSION = "20260925-3";

export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `/sw.js?v=${GENAN_SW_VERSION}`,
        { updateViaCache: "none" },
      );

      await registration.update();

      // Never reload a customer mid-visit just because the SW gained control.
      // This also prevents a surprise second page load on the first installation.
    } catch (error) {
      console.error("[pwa] service worker registration failed", error);
    }
  });
};
