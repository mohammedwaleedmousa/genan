import type { MouseEvent } from "react";
import { useLocation } from "react-router-dom";

export type CatalogListState = {
  count?: number;
  sort?: string;
  inStockOnly?: boolean;
};

type CatalogScrollSnapshot = {
  productId: string;
  occurrence: number;
  viewportTop: number;
  list?: CatalogListState;
};

type CatalogHistoryState = {
  catalogScroll?: CatalogScrollSnapshot;
  catalogSource?: string;
};

export const isSameTabClick = (event: MouseEvent) =>
  !event.defaultPrevented && event.button === 0 && !event.metaKey &&
  !event.ctrlKey && !event.shiftKey && !event.altKey;

export const getCatalogScroll = (state: unknown) =>
  (state as CatalogHistoryState | null)?.catalogScroll;

export const getCatalogSource = (state: unknown) =>
  (state as CatalogHistoryState | null)?.catalogSource;

export const useCatalogListSnapshot = () => getCatalogScroll(useLocation().state)?.list;

const findProductCards = (productId: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(
    `[data-catalog-product-id="${CSS.escape(productId)}"]`,
  )).filter((card) => card.getClientRects().length > 0);

export const saveCatalogScroll = (target: HTMLElement, list?: CatalogListState) => {
  const card = target.closest<HTMLElement>("[data-catalog-product-id]");
  const productId = card?.dataset.catalogProductId;
  if (!card || !productId) return;

  const snapshot: CatalogScrollSnapshot = {
    productId,
    occurrence: findProductCards(productId).indexOf(card),
    viewportTop: card.getBoundingClientRect().top,
    list,
  };

  try {
    // Add the snapshot to this BrowserRouter entry, keeping its key, index and user state.
    const entry = window.history.state;
    window.history.replaceState({ ...entry, usr: { ...entry?.usr, catalogScroll: snapshot } }, "");
    window.history.scrollRestoration = "manual";
  } catch {
    // Opening the product still works if the browser blocks history writes.
  }
};

export const restoreCatalogScroll = (snapshot: CatalogScrollSnapshot) => {
  let frame = 0;
  let settleTimer: number | undefined;
  const root = document.getElementById("root") || document.body;
  const observer = new MutationObserver(schedule);
  const resize = new ResizeObserver(schedule);
  const timeout = window.setTimeout(stop, 8000);
  const interruptEvents = ["pointerdown", "touchstart", "wheel", "keydown"] as const;

  function stop() {
    observer.disconnect();
    resize.disconnect();
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
    window.clearTimeout(settleTimer);
    interruptEvents.forEach((event) => window.removeEventListener(event, stop, true));
  }

  function restore() {
    const cards = findProductCards(snapshot.productId);
    const card = cards[snapshot.occurrence] || cards[0];
    if (!card) return false;

    const delta = card.getBoundingClientRect().top - snapshot.viewportTop;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" });

    // Allow lazy sections above the card to settle without overriding customer input.
    settleTimer ??= window.setTimeout(stop, 600);
    return true;
  }

  function schedule() {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(restore);
  }

  if (!restore()) window.scrollTo({ top: 0, behavior: "instant" });
  observer.observe(root, { childList: true, subtree: true });
  resize.observe(root);
  interruptEvents.forEach((event) => window.addEventListener(event, stop, { capture: true, passive: true }));

  return stop;
};
