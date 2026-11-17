import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { getSiteText } from "@/hooks/useSiteContent";

type StoryImage = {
  name: "opening" | "selection" | "details";
  alt: string;
  sizes: string;
  aspect: string;
};

const openingImage: StoryImage = {
  name: "opening",
  alt: "إطلالة بألوان حيادية مع حقيبة",
  sizes: "(min-width: 1280px) 590px, (min-width: 768px) 49vw, 92vw",
  aspect: "aspect-[5/6] md:aspect-[1/1]",
};

const selectionImage: StoryImage = {
  name: "selection",
  alt: "ملابس بألوان حيادية معلّقة على رف أزياء",
  sizes: "(min-width: 1280px) 570px, (min-width: 768px) 46vw, 92vw",
  aspect: "aspect-[4/3]",
};

const detailImage: StoryImage = {
  name: "details",
  alt: "حقيبة داكنة بتفاصيل معدنية على قماش فاتح",
  sizes: "(min-width: 1280px) 530px, (min-width: 768px) 46vw, 92vw",
  aspect: "aspect-[4/3]",
};

const StoryPhoto = ({ image, priority = false }: { image: StoryImage; priority?: boolean }) => {
  const path = "/story/" + image.name;

  return (
    <img
      src={path + "-960.webp"}
      srcSet={path + "-480.webp 480w, " + path + "-960.webp 960w"}
      sizes={image.sizes}
      alt={image.alt}
      width={960}
      height={image.name === "opening" ? 960 : 720}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={"w-full bg-[#E9E1D4] object-cover " + image.aspect}
    />
  );
};

const StoryArcs = ({ className }: { className: string }) => (
  <div aria-hidden="true" className={"pointer-events-none absolute aspect-square " + className}>
    <span className="absolute inset-0 rounded-full border border-current" />
    <span className="absolute inset-[11%] rounded-full border border-current" />
    <span className="absolute inset-[22%] rounded-full border border-current" />
  </div>
);

const StoreStory = ({ content }: { content?: Record<string, string> }) => {
  const reduceMotion = useReducedMotion();
  const reveal = {
    initial: reduceMotion ? false as const : { opacity: 0.65, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.22 },
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <article aria-labelledby="genan-story-title">
      <section id="about" className="relative isolate scroll-mt-24 overflow-hidden bg-[#F6F1E8]">
        <StoryArcs className="-right-36 -top-48 w-[420px] text-[#9D7B40]/20 md:-right-32 md:w-[560px]" />
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-8 px-5 py-9 sm:px-8 md:grid-cols-[0.95fr_1.05fr] md:gap-12 md:px-10 md:py-16 lg:gap-20 lg:py-20">
          <div className="max-w-[550px]">
            <p className="mb-5 flex items-center gap-2.5 text-[12px] font-medium text-[#796341]">
              <span aria-hidden="true" className="inline-block h-px w-8 bg-[#A78855]" />
              حكاية بوتيك جنان
            </p>
            <h1 id="genan-story-title" className="text-[clamp(2.5rem,7vw,5.25rem)] font-semibold leading-[1.17] tracking-[-0.045em] text-[#27251E]">
              الأناقة تبدأ{" "}
              <span className="block text-[#687358]">من اختياركِ.</span>
            </h1>
            <p className="mt-5 max-w-[440px] text-[15px] leading-8 text-[#5A5448] md:mt-7 md:text-[17px] md:leading-9">
              تبدأ الحكاية بقطعة تلفت نظركِ. في جنان، ننتقي القطع التي تلبسينها بطريقتكِ وتعودين إليها مرة بعد مرة.
            </p>
            <a href="#our-selection" className="mt-7 inline-flex min-h-11 items-center gap-3 rounded-full border border-[#BEB096] px-5 text-sm font-semibold text-[#2F3728] transition-colors hover:bg-[#EDE5D8] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#796341]">
              اقرئي الحكاية
              <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0.82 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative pb-3 pr-3 sm:pb-4 sm:pr-4"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 left-4 top-4 rounded-[140px_140px_12px_12px] border border-[#B39A72] md:rounded-[180px_180px_14px_14px]" />
            <div className="relative overflow-hidden rounded-[140px_140px_12px_12px] md:rounded-[180px_180px_14px_14px]">
              <StoryPhoto image={openingImage} priority />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative mx-auto max-w-[1200px] space-y-16 px-5 py-14 sm:px-8 md:space-y-24 md:py-20 lg:px-10">
        <section id="our-selection" className="grid scroll-mt-28 items-center gap-6 md:grid-cols-[1fr_0.9fr] md:gap-14 lg:gap-20">
          <motion.figure {...reveal} className="relative order-2 md:order-1">
            <div className="overflow-hidden rounded-[24px] md:rounded-[32px]">
              <StoryPhoto image={selectionImage} />
            </div>
            <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-14 w-14 rounded-br-lg border-b border-r border-white/85 md:bottom-4 md:right-4" />
          </motion.figure>
          <div className="order-1 max-w-[460px] md:order-2">
            <p className="mb-3 text-xs font-semibold text-[#796341]">حين نختار</p>
            <h2 className="text-[clamp(1.9rem,4vw,3.2rem)] font-semibold leading-[1.28] tracking-[-0.04em] text-[#2C3026]">
              {getSiteText(content, "store_info_hero_title", "اختيارات من عالم الموضة")}
            </h2>
            <p className="mt-4 text-[15px] leading-8 text-[#625A4E] md:text-base md:leading-9">
              {getSiteText(content, "store_info_hero_description", "نجمع في بوتيك جنان مختارات من الأحذية والملابس والحقائب والإكسسوارات من ماركات عالمية. ننتقي قطعًا تنسجم مع أسلوبكِ، من إطلالاتكِ اليومية إلى مناسباتكِ الخاصة.")}
            </p>
          </div>
        </section>

        <section className="grid items-center gap-6 border-t border-[#E8DED0] pt-12 md:grid-cols-[0.9fr_1fr] md:gap-14 md:pt-20 lg:gap-20">
          <div className="max-w-[460px]">
            <p className="mb-3 text-xs font-semibold text-[#796341]">حين تتكوّن الإطلالة</p>
            <h2 className="text-[clamp(1.9rem,4vw,3.2rem)] font-semibold leading-[1.28] tracking-[-0.04em] text-[#2C3026]">
              التفاصيل التي تكملها
            </h2>
            <p className="mt-4 text-[15px] leading-8 text-[#625A4E] md:text-base md:leading-9">
              قد تبدأ الإطلالة بحقيبة، أو بلمسة لون، أو بحذاء يغيّر طابعها.
              {" "}{getSiteText(content, "store_info_pillar_2_desc", "نحرص على توضيح تفاصيل القطعة بالصور والوصف لتختاريها بثقة.")}
            </p>
          </div>
          <motion.figure {...reveal} className="relative isolate pb-3 pl-3 md:pb-4 md:pl-4">
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 left-0 top-4 -z-10 rounded-[24px] border border-[#B7A484] md:rounded-[32px]" />
            <div className="overflow-hidden rounded-[24px] md:rounded-[32px]">
              <StoryPhoto image={detailImage} />
            </div>
          </motion.figure>
        </section>
      </div>

      <section className="relative isolate overflow-hidden bg-[#273429] px-5 py-12 text-[#F8F1E6] md:py-16">
        <StoryArcs className="-bottom-72 -left-24 w-[420px] text-[#C7AD7F]/35 md:-bottom-96 md:w-[600px]" />
        <div className="relative mx-auto max-w-[1120px] md:flex md:items-end md:justify-between md:gap-10">
          <div className="max-w-[650px]">
            <h2 className="text-[clamp(1.9rem,4.5vw,3.3rem)] font-semibold leading-[1.22] tracking-[-0.04em]">
              من اختياركِ إلى باب بيتكِ
            </h2>
            <p className="mt-4 max-w-[470px] text-[15px] leading-8 text-[#DDD4C4]">
              نوضّح لكِ تفاصيل الطلب قبل تأكيده. وتُحدّد خيارات التوصيل داخل اليمن بحسب منطقة الاستلام وتغطية شركات التوصيل.
            </p>
          </div>
          <Link to="/products" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#F4E8D4] px-6 text-sm font-semibold text-[#293227] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#F4E8D4] md:mt-0">
            تصفّحي التشكيلة
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
};

export default StoreStory;
