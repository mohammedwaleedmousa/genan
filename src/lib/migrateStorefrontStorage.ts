const previousKeys = new Map([
  ["flamingo-store", "genan-store"],
  ["flamingo-recently-viewed", "genan-recently-viewed"],
  ["flamingopark-favorites", "genan-favorites"],
  ["flamingopark-favorites-owner", "genan-favorites-owner"],
  ["flamingo-post-auth-redirect", "genan-post-auth-redirect"],
  ["flamingo-admin-route-unlocked", "genan-admin-route-unlocked"],
]);
const previousFavoriteSyncPrefix = "flamingopark-favorites-db-synced:";

const migrateStorage = (storage: Storage) => {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));

  for (const key of keys) {
    if (!key) continue;
    const newKey = previousKeys.get(key) ?? (key.startsWith(previousFavoriteSyncPrefix)
      ? `genan-favorites-db-synced:${key.slice(previousFavoriteSyncPrefix.length)}`
      : undefined);
    if (!newKey) continue;

    const value = storage.getItem(key);
    if (value === null) continue;
    if (storage.getItem(newKey) === null) storage.setItem(newKey, value);
    storage.removeItem(key);
  }
};

if (typeof window !== "undefined") {
  for (const kind of ["localStorage", "sessionStorage"] as const) {
    try {
      migrateStorage(window[kind]);
    } catch {
      // Storage restrictions must not stop the app from opening.
    }
  }
}
