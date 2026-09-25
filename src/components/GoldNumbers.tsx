import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { ADMIN_BASE_PATH } from "@/lib/adminRoutes";

const DIGIT_PATTERN = /[0-9\u0660-\u0669\u06F0-\u06F9]+(?:[.,٬٫:/-][0-9\u0660-\u0669\u06F0-\u06F9]+)*/g;

const GoldNumbers = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const isAdmin = pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`) || pathname.startsWith("/admin");
    const highlights = (CSS as any)?.highlights;
    const HighlightCtor = (window as any)?.Highlight;

    if (isAdmin || !highlights || !HighlightCtor) {
      highlights?.delete?.("genan-numbers");
      return;
    }

    let raf = 0;

    const rebuild = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const ranges: Range[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

        let node = walker.nextNode();
        while (node) {
          const textNode = node as Text;
          const parent = textNode.parentElement;
          const text = textNode.nodeValue || "";

          if (
            parent &&
            text &&
            !parent.closest(
              "script,style,noscript,textarea,code,pre,[contenteditable='true'],[data-no-gold-numbers],.admin-workspace",
            )
          ) {
            DIGIT_PATTERN.lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = DIGIT_PATTERN.exec(text))) {
              const range = document.createRange();
              range.setStart(textNode, match.index);
              range.setEnd(textNode, match.index + match[0].length);
              ranges.push(range);
            }
          }

          node = walker.nextNode();
        }

        highlights.set("genan-numbers", new HighlightCtor(...ranges));
      });
    };

    rebuild();

    const observer = new MutationObserver(() => rebuild());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      highlights.delete("genan-numbers");
    };
  }, [location.pathname]);

  return null;
};

export default GoldNumbers;
