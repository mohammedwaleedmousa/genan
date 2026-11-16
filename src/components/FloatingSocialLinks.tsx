import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaSnapchat, FaPhone } from "react-icons/fa";
import { supabase } from "@/integrations/supabase/client";

type SocialKey = "instagram" | "whatsapp" | "snapchat" | "phone";
const safeWebUrl = (value: string) => {
  const url = value.trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
};
const FloatingSocialLinks = () => {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<Record<SocialKey, string>>({ instagram: "", whatsapp: "", snapchat: "", phone: "" });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let mounted = true;
    supabase.from("site_settings").select("key,value").in("key", ["social_instagram", "social_whatsapp", "social_snapchat", "whatsapp", "store_info", "phone", "phone_ye", "phone_sa"]).then(({ data }) => {
      if (!mounted || !data) return;
      const settings: Record<string, string> = {};
      let storeInfo: Record<string, unknown> = {};
      data.forEach((row) => {
        const value = row.value;
        settings[row.key] = typeof value === "string" ? value : "";
        if (row.key === "store_info") {
          try {
            const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              storeInfo = parsed as Record<string, unknown>;
            }
          } catch { /* An invalid setting should not block the social buttons. */ }
        }
      });
      const whats = (settings.social_whatsapp || settings.whatsapp || "").trim();
      const whatsapp = /^https?:\/\//i.test(whats)
        ? safeWebUrl(whats)
        : whats.replace(/\D/g, "") ? `https://wa.me/${whats.replace(/\D/g, "")}` : "";
      const insta = (settings.social_instagram || "").trim();
      const snap = (settings.social_snapchat || "").trim();
      const rawPhone = String(storeInfo.phone || storeInfo.phone_ye || storeInfo.phone_sa || settings.phone || settings.phone_ye || settings.phone_sa || "").trim();
      const digits = rawPhone.replace(/\D/g, "");
      const phone = /^[+0-9\s()-]+$/.test(rawPhone) && digits.length >= 7 && digits.length <= 15
        ? "tel:" + (rawPhone.startsWith("+") ? "+" : "") + digits
        : "";
      setLinks({
        instagram: safeWebUrl(insta) || (insta.replace(/^@/, "").match(/^[a-zA-Z0-9._]+$/) ? `https://www.instagram.com/${insta.replace(/^@/, "")}/` : ""),
        whatsapp,
        snapchat: safeWebUrl(snap) || (snap.replace(/^@/, "").match(/^[a-zA-Z0-9._-]+$/) ? `https://www.snapchat.com/add/${snap.replace(/^@/, "")}` : ""),
        phone,
      });
    });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onClick = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);
  // Display only recognizable official application icons, no panel or card.
  const items = [
    { key: "whatsapp" as const, label: "واتساب", Icon: FaWhatsapp, color: "bg-[#25D366] text-white" },
    { key: "instagram" as const, label: "إنستغرام", Icon: FaInstagram, color: "bg-gradient-to-br from-[#F9CE34] via-[#EE2A7B] to-[#6228D7] text-white" },
    { key: "snapchat" as const, label: "سناب شات", Icon: FaSnapchat, color: "bg-[#FFFC00] text-[#111111]" },
    { key: "phone" as const, label: "اتصال", Icon: FaPhone, color: "bg-[#171717] text-white" },
  ].filter((item) => Boolean(links[item.key]));

  if (!items.length) return null;

  return (
    <div ref={rootRef} className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-4 z-[55] sm:bottom-7 sm:left-7" dir="rtl">
      <div
        id="genan-social-options"
        aria-label="خيارات التواصل"
        aria-hidden={!open}
        className={"absolute bottom-[54px] left-0 flex flex-col-reverse items-center gap-2.5 transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none " + (open ? "visible translate-y-0 opacity-100" : "invisible pointer-events-none translate-y-3 opacity-0")}
      >
        {items.map(({ key, label, Icon, color }) => (
          <a
            key={key}
            href={links[key]}
            target={key === "phone" ? undefined : "_blank"}
            rel={key === "phone" ? undefined : "noopener noreferrer"}
            aria-label={label}
            title={label}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            className={"grid h-11 w-11 place-items-center rounded-full border border-white/75 shadow-[0_5px_16px_rgba(20,17,12,.18)] transition-transform hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B89562] " + color}
          >
            <Icon aria-hidden="true" className="h-[21px] w-[21px]" />
          </a>
        ))}
      </div>

      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "إغلاق خيارات التواصل" : "تواصل معنا"}
        title={open ? "إغلاق خيارات التواصل" : "تواصل معنا"}
        aria-expanded={open}
        aria-controls="genan-social-options"
        onClick={() => setOpen((current) => !current)}
        className="grid h-11 w-11 place-items-center rounded-full border border-[#B9A17A] bg-[#171717] text-[#D8C29A] shadow-[0_6px_20px_rgba(20,17,12,.2)] transition-transform hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B89562]"
      >
        {open ? <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} /> : <MessageCircle aria-hidden="true" className="h-[21px] w-[21px]" strokeWidth={1.8} />}
      </button>
    </div>
  );
};
export default FloatingSocialLinks;
