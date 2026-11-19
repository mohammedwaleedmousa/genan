import files from "./catalogThumbnailFiles.json";
import { handleImageError } from "./imageUrl";

const catalogFiles: Readonly<Record<string, string>> = files;
const backfilledHost = "ydpvfsemhbrkhtjjjwqs.supabase.co";
const pairedUploadPath = /^\/storage\/v1\/object\/public\/uploads\/(color-variants\/previews\/[^/.]+)\.(?:webp|jpg|png|avif)$/;

export const getCatalogThumbnail = (original?: string | null): string | undefined => {
  if (!original) return undefined;

  try {
    const url = new URL(original);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) return undefined;

    const filename = url.hostname === backfilledHost ? catalogFiles[url.pathname] : undefined;
    if (filename) return `/assets/catalog-thumbnails/${filename}?preview=2`;

    if (pairedUploadPath.test(url.pathname)) {
      return url.origin + url.pathname.replace(/\.[^.]+$/, ".thumb.webp");
    }
  } catch {
    // Relative and third-party images keep their existing source.
  }
};

export const handleCatalogThumbnailError = (image: HTMLImageElement, original: string) => {
  const thumbnail = getCatalogThumbnail(original);
  if (thumbnail && image.getAttribute("src") === thumbnail) {
    image.src = original;
    return;
  }

  handleImageError({ currentTarget: image });
};
