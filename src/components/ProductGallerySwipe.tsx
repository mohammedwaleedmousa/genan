import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

type ProductGallerySwipeProps = {
  children: ReactNode;
  onSwipe?: (direction: "left" | "right") => void;
};

const ProductGallerySwipe = ({ children, onSwipe }: ProductGallerySwipeProps) => {
  const [isPageZoomed, setIsPageZoomed] = useState(false);
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const canSwipe = Boolean(onSwipe) && !isPageZoomed;

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncPageZoom = () => setIsPageZoomed(viewport.scale > 1.01);
    syncPageZoom();
    viewport.addEventListener("resize", syncPageZoom);
    return () => viewport.removeEventListener("resize", syncPageZoom);
  }, []);

  const startSwipe = (event: PointerEvent<HTMLDivElement>) => {
    swipeStart.current = event.isPrimary && event.button === 0 && canSwipe
      ? { id: event.pointerId, x: event.clientX, y: event.clientY }
      : null;
  };

  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.id !== event.pointerId || !canSwipe) return;

    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.abs(x) >= 55 && Math.abs(x) > Math.abs(y) * 1.2) {
      onSwipe?.(x < 0 ? "left" : "right");
    }
  };

  const cancelSwipe = () => { swipeStart.current = null; };

  return (
    <div
      className={`h-full w-full ${canSwipe ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ touchAction: canSwipe ? "pan-y pinch-zoom" : "auto" }}
      onPointerDown={startSwipe}
      onPointerUp={finishSwipe}
      onPointerCancel={cancelSwipe}
      onPointerLeave={cancelSwipe}
    >
      {children}
    </div>
  );
};

export default ProductGallerySwipe;
