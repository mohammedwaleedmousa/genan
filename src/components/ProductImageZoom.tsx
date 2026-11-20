import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

type ProductImageZoomProps = {
  children: ReactNode;
  onSwipe?: (direction: "left" | "right") => void;
};

const minScale = 1;
const maxScale = 4;
const zoomButtonClass = "inline-flex size-11 items-center justify-center rounded-lg text-[#40352D] transition-colors hover:bg-[#F3EAE0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy disabled:opacity-35 disabled:hover:bg-transparent";

const ProductImageZoom = ({ children, onSwipe }: ProductImageZoomProps) => {
  const [zoomLevel, setZoomLevel] = useState<"normal" | "zoomed" | "maximum">("normal");
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const isZoomed = zoomLevel !== "normal";

  const startSwipe = (event: PointerEvent<HTMLDivElement>) => {
    swipeStart.current = event.isPrimary && event.button === 0 && !isZoomed && onSwipe
      ? { id: event.pointerId, x: event.clientX, y: event.clientY }
      : null;
  };

  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.id !== event.pointerId || isZoomed) return;

    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.abs(x) >= 55 && Math.abs(x) > Math.abs(y) * 1.2) {
      onSwipe?.(x < 0 ? "left" : "right");
    }
  };

  const cancelSwipe = () => { swipeStart.current = null; };

  return (
    <TransformWrapper
      minScale={minScale}
      maxScale={maxScale}
      centerZoomedOut
      disablePadding
      smooth={false}
      wheel={{ wheelDisabled: true }}
      trackPadPanning={{ disabled: true }}
      panning={{ disabled: !isZoomed, allowLeftClickPan: isZoomed, velocityDisabled: true }}
      doubleClick={{ mode: "toggle", step: 1, animationTime: 160 }}
      zoomAnimation={{ disabled: true }}
      onPinchStart={cancelSwipe}
      onTransform={(_, { scale }) => {
        if (scale > minScale) cancelSwipe();
        setZoomLevel(scale <= minScale ? "normal" : scale >= maxScale ? "maximum" : "zoomed");
      }}
    >
      {({ instance, zoomIn, zoomOut, resetTransform }) => (
        <>
          <TransformComponent
            wrapperClass={`!h-full !w-full !overflow-hidden ${isZoomed || onSwipe ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
            contentClass="!h-full !w-full"
            wrapperStyle={{ touchAction: isZoomed ? "none" : "pan-y" }}
            wrapperProps={{
              onPointerDown: startSwipe,
              onPointerUp: finishSwipe,
              onPointerCancel: cancelSwipe,
              onPointerLeave: cancelSwipe,
              onTouchCancel: (event) => instance.onTouchPanningStop(event.nativeEvent),
            }}
          >
            {children}
          </TransformComponent>
          <div aria-label="تقريب صورة المنتج" role="group" className="absolute bottom-10 left-3 z-20 flex items-center gap-0.5 rounded-xl border border-[#E2DDD3] bg-white/95 p-0.5 shadow-sm md:bottom-3">
            <button type="button" title="تكبير الصورة" aria-label="تكبير الصورة" disabled={zoomLevel === "maximum"} onClick={() => zoomIn(0.5, 0)} className={zoomButtonClass}>
              <ZoomIn aria-hidden="true" className="size-4" />
            </button>
            <button type="button" title="تصغير الصورة" aria-label="تصغير الصورة" disabled={!isZoomed} onClick={() => zoomOut(0.5, 0)} className={zoomButtonClass}>
              <ZoomOut aria-hidden="true" className="size-4" />
            </button>
            <button type="button" title="العودة للحجم الطبيعي" aria-label="العودة للحجم الطبيعي" disabled={!isZoomed} onClick={() => resetTransform(0)} className={zoomButtonClass}>
              <RotateCcw aria-hidden="true" className="size-4" />
            </button>
          </div>
        </>
      )}
    </TransformWrapper>
  );
};

export default ProductImageZoom;
