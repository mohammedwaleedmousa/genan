export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  const update = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.error("[pwa] service worker registration failed", error);
    }
  };

  if (document.readyState === "complete") void update();
  else window.addEventListener("load", update, { once: true });
};
