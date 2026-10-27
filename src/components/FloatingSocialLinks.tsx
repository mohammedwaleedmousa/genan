import { useEffect, useRef, useState } from "react";
import { Instagram, MessageCircle, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SocialKey = "instagram" | "whatsapp" | "snapchat";
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
  const [links, setLinks] = useState<Record<SocialKey, string>>({ instagram: "", whatsapp: "", snapchat: "" });
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mounted = true;
    supabase.from("site_settings").select("key,value").in("key", ["social_instagram", "social_whatsapp", "social_snapchat", "whatsapp"]).then(({ data }) => {
      if (!mounted || !data) return;
      const settings: Record<string, string> = {};
      data.forEach((row) => {
        const value = row.value;
        settings[row.key] = typeof value === "string" ? value : "";
      });
      const whats = (settings.social_whatsapp || settings.whatsapp || "").trim();
      const whatsapp = /^https?:\/\//i.test(whats)
        ? safeWebUrl(whats)
        : whats.replace(/\D/g, "") ? `https://wa.me/${whats.replace(/\D/g, "")}` : "";
      const insta = (settings.social_instagram || "").trim();
      const snap = (settings.social_snapchat || "").trim();
      setLinks({
        instagram: safeWebUrl(insta) || (insta.replace(/^@/, "").match(/^[a-zA-Z0-9._]+$/) ? `https://www.instagram.com/${insta.replace(/^@/, "")}/` : ""),
        whatsapp,
        snapchat: safeWebUrl(snap) || (snap.replace(/^@/, "").match(/^[a-zA-Z0-9._-]+$/) ? `https://www.snapchat.com/add/${snap.replace(/^@/, "")}` : ""),
      });
    });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onClick = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const items = [
    { key: "instagram" as const, label: "Instagram", subtitle: "تابعينا على إنستغرام", Icon: Instagram },
    { key: "whatsapp" as const, label: "WhatsApp", subtitle: "تواصلي معنا مباشرة", Icon: MessageCircle },
    { key: "snapchat" as const, label: "Snapchat", subtitle: "شاهدي جديد جنان", Icon: null },
  ].filter((item) => Boolean(links[item.key]));

  if (!items.length) return null;

  return (
    <div ref={rootRef} className="fixed bottom-[calc(env(safe-area-inset-bottom)+20px)] left-3 z-[55] sm:bottom-7 sm:left-7" dir="rtl">
      <div
        id="genan-social-options"
        aria-hidden={!open}
        className={`absolute bottom-[70px] left-0 w-[min(315px,calc(100vw-24px))] origin-bottom-left overflow-hidden rounded-[24px] border border-[#E6D8BF] bg-[#FFFEFB] shadow-[0_22px_65px_rgba(28,24,17,.19)] transition-[opacity,transform,visibility] duration-300 motion-reduce:transition-none ${open ? "visible translate-y-0 scale-100 opacity-100" : "invisible pointer-events-none translate-y-3 scale-[.96] opacity-0"}`}
      >
        <div className="relative overflow-hidden bg-[#1C1A18] px-5 pb-5 pt-5 text-white">
          <div className="absolute -left-8 -top-12 h-32 w-32 rounded-full border border-[#AB946A]/25" aria-hidden="true" />
          <div className="absolute -left-3 -top-8 h-24 w-24 rounded-full border border-[#AB946A]/20" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[.28em] text-[#D8C29A]">GENAN SOCIAL CLUB</span>
          <h2 className="mt-2 text-[18px] font-semibold">كوني أقرب إلى جنان</h2>
          <p className="mt-1 text-[11px] leading-5 text-[#E5DED2]">تسوق، إلهام، وجديدنا في مكان واحد.</p>
        </div>
        <div className="space-y-1 p-2.5">
          {items.map(({ key, label, subtitle, Icon }) => (
            <a
              key={key}
              href={links[key]}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              aria-label={label}
              className="group flex min-h-[67px] items-center gap-3 rounded-2xl px-3 py-2 text-right transition-colors hover:bg-[#F7F2E9] focus-visible:bg-[#F7F2E9] focus-visible:outline-none"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-[#E9DCC7] bg-[#F7F2E9] text-[#8B724E]">
                {Icon ? <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} /> : <span className="text-[10px] font-extrabold tracking-tight">SNAP</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[#29241E]" dir="ltr">{label}</span>
                <span className="mt-0.5 block text-[10px] text-[#847A6A]">{subtitle}</span>
              </span>
              <span className="text-lg text-[#B69F78] transition-transform group-hover:-translate-x-1" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <div className="mx-5 h-px bg-[#EEE6D9]" />
        <p className="px-5 py-3 text-center text-[9px] tracking-[.12em] text-[#A28D6A]">EVERY DETAIL, A LITTLE LUXURY</p>
      </div>

      <button
        type="button"
        aria-label={open ? "إغلاق قائمة التواصل" : "فتح قائمة التواصل"}
        aria-expanded={open}
        aria-controls="genan-social-options"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-[56px] items-center gap-2.5 rounded-full border border-[#B9A17A] bg-[#1C1A18] py-2 pl-3.5 pr-2.5 text-white shadow-[0_12px_30px_rgba(20,17,12,.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#C9B38B] text-[#1C1A18]">
          {open ? <X className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />}
        </span>
        <span className="text-[12px] font-semibold tracking-wide">{open ? "إغلاق" : "تواصلي معنا"}</span>
      </button>
    </div>
  );
};
export default FloatingSocialLinks;
