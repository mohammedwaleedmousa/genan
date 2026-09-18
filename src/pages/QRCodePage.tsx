import { useRef } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Download, Link2, Share2 } from "lucide-react";

import { toast } from "@/hooks/use-toast";

const genanLogo = "/icons/app-icon-1024.png";

const websiteUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "";

const QRCodePage = () => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(qrRef.current, {
        scale: 4,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = "genan-qr.png";
      link.href = canvas.toDataURL("image/png", 1);
      link.click();

      toast({
        title: "تم التحميل",
        description: "تم حفظ باركود جنان.",
      });
    } catch {
      toast({
        title: "تعذر التحميل",
        description: "حدث خطأ أثناء إنشاء صورة الباركود.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(websiteUrl);

      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط جنان.",
      });
    } catch {
      toast({
        title: "تعذر النسخ",
        description: "لم نتمكن من نسخ الرابط.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: "Genan",
        text: "تسوق من جنان",
        url: websiteUrl,
      });
    } catch {
      return;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8" dir="rtl">
      <div className="w-full max-w-[390px]">
        {/* BACK */}

        <div className="mb-6">
          <Link to="/home" className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-[#9D7B40]">
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            العودة للرئيسية
          </Link>
        </div>

        {/* HEADER */}

        <div className="mb-6 text-center">
          <img src={genanLogo} alt="Genan" className="mx-auto h-[64px] w-auto object-contain" />

          <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-[#173A2D]">جنان</h1>

          <p className="mx-auto mt-2 max-w-[280px] text-[11px] leading-6 text-muted-foreground">امسح الباركود لزيارة متجر جنان مباشرة.</p>
        </div>

        {/* QR CARD */}

        <div className="overflow-hidden rounded-[20px] border border-[#E2DCCE] bg-white">
          <div ref={qrRef} className="bg-white px-7 pb-7 pt-8">
            <div className="flex justify-center">
              <div className="rounded-[16px] border border-[#E5DED0] bg-white p-4">
                <QRCodeSVG value={websiteUrl} size={220} level="H" includeMargin={false} bgColor="#FFFFFF" fgColor="#2F2927" />
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="font-serif text-[9px] uppercase tracking-[0.24em] text-[#9D7B40]">GENAN</p>

              <p className="mt-1.5 text-[11px] text-[#766A65]">امسح للتسوق</p>
            </div>
          </div>

          {/* WEBSITE */}

          <div className="border-t border-[#E5DED0] px-4 py-3">
            <button type="button" onClick={handleCopy} className="flex w-full items-center justify-between gap-3 rounded-[10px] px-1 py-1 text-right">
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">رابط المتجر</p>

                <p dir="ltr" className="mt-1 truncate text-left text-[10px] font-medium text-[#3F5147]">الرابط الحالي للمتجر</p>
              </div>

              <Link2 className="h-4 w-4 shrink-0 text-[#9D7B40]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={handleDownload} className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#173A2D] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#214C3B] active:bg-[#9D7B40]">
            <Download className="h-4 w-4" strokeWidth={1.6} />
            <span>تحميل الباركود</span>
          </button>

          <button type="button" onClick={handleShare} className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[11px] border border-[#DDD7C8] bg-white px-3 text-[11px] font-semibold text-[#3F5147] transition-colors hover:border-[#C6B17F] hover:bg-[#F6F3EA] hover:text-[#9D7B40] active:bg-[#EFE9DD]">
            <Share2 className="h-4 w-4" strokeWidth={1.6} />
            <span>مشاركة</span>
          </button>
        </div>

        {/* NOTE */}

        <p className="mt-5 text-center text-[9px] leading-5 text-muted-foreground">وجّه كاميرا الهاتف نحو الباركود وسيظهر رابط المتجر مباشرة.</p>
      </div>
    </main>
  );
};

export default QRCodePage;