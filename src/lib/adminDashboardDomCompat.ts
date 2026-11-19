if (typeof window !== "undefined" && typeof Element !== "undefined" && window.location.pathname.startsWith("/admin")) {
  const prototype = Element.prototype as Element & { __genanAdminClosestPatched?: boolean };

  if (!prototype.__genanAdminClosestPatched) {
    const nativeClosest = Element.prototype.closest;

    Element.prototype.closest = function closest(selector: string) {
      if (selector === "div.rounded-[16px]") {
        const findRoundedPanel = (element: Element | null): Element | null => {
          if (!element) return null;
          if (element.tagName === "DIV" && element.classList.contains("rounded-[16px]")) return element;
          return findRoundedPanel(element.parentElement);
        };

        return findRoundedPanel(this);
      }

      return nativeClosest.call(this, selector);
    };

    Object.defineProperty(Element.prototype, "__genanAdminClosestPatched", {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
}
