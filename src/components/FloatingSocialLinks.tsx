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
    { key: "instagram" as const, label: "إنستغرام", Icon: Instagram, color: "bg-[#171717]" },
    { key: "whatsapp" as const, label: "واتساب", Icon: MessageCircle, color: "bg-[#217C62]" },
    { key: "snapchat" as const, label: "سناب شات", Icon: null, color: "bg-[#FFEB53]" },
  ].filter((item) => Boolean(links[item.key]));
  if (!items.length) return null;
  return (
    <div ref={rootRef} className="fixed bottom-[calc(env(safe-area-inset-bottom)+24px)] left-4 z-[55] flex flex-col items-start gap-2 sm:bottom-8 sm:left-7" dir="rtl">
      <div id="genan-social-options" className={`flex flex-col gap-2 transition-all duration-200 ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`} aria-hidden={!open}>
        {items.map(({ key, label, Icon, color }) => (
          <a key={key} href={links[key]} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1} aria-label={label} className="group flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl shadow-lg transition-transform group-hover:scale-105 ${color} ${key === "snapchat" ? "text-[#171717]" : "text-white"}`}>
              {Icon ? <Icon className="h-5 w-5" strokeWidth={1.8} /> : <span className="text-[10px] font-black">SNAP</span>}
            </span>
            <span className="rounded-xl bg-white/95 px-3 py-2 text-[11px] font-semibold text-[#29231A] shadow-sm">{label}</span>
          </a>
        ))}
      </div>
      <button type="button" aria-label={open ? "إغلاق روابط التواصل" : "فتح روابط التواصل"} aria-expanded={open} aria-controls="genan-social-options" onClick={() => setOpen((current) => !current)} className="grid h-14 w-14 place-items-center rounded-2xl border border-[#CEB98E] bg-[#171717] text-[#EBD4A8] shadow-[0_12px_30px_rgba(0,0,0,.22)] transition-transform active:scale-95">
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
};
export default FloatingSocialLinks;
