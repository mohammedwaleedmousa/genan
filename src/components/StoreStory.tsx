import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { getSiteText } from "@/hooks/useSiteContent";
import "./StoreStory.css";

type StoryFrameProps = {
  id?: string;
  photo: "opening" | "selection" | "details";
  alt: string;
  children: ReactNode;
};

const StoryFrame = ({ id, photo, alt, children }: StoryFrameProps) => {
  const section = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isOpening = photo === "opening";
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });

  // Keep the shot and its copy driven by the same frame progress in both scroll directions.
  const photoY = useTransform(() => `${(scrollYProgress.get() - 0.5) * (isOpening ? 7 : 13)}%`);
  const photoScale = useTransform(() => (isOpening ? 1.075 : 1.135) + scrollYProgress.get() * 0.105);
  const copyY = useTransform(() => isOpening ? 0 : Math.max(0, 1 - scrollYProgress.get() / 0.42) * 46);
  const copyOpacity = useTransform(() => isOpening ? 1 : Math.min(1, 0.5 + scrollYProgress.get() / 0.72));
  const edge = useTransform(() => `inset(${Math.max(0, 1 - scrollYProgress.get() / 0.42) * 12}% 0 0)`);
  const asset = `/story/${photo}`;

  return (
    <section ref={section} id={id} className={`store-story__frame store-story__frame--${photo}`}>
      <motion.div className="store-story__copy" style={reducedMotion ? undefined : { y: copyY, opacity: copyOpacity }}>
        {children}
      </motion.div>
      <motion.figure className="store-story__photo" style={reducedMotion || isOpening ? undefined : { clipPath: edge }}>
        <motion.img
          src={`${asset}-960.webp`}
          srcSet={`${asset}-480.webp 480w, ${asset}-960.webp 960w`}
          sizes="(min-width: 1280px) 680px, (min-width: 768px) 55vw, 94vw"
          width={960} height={isOpening ? 960 : 720}
          loading={isOpening ? "eager" : "lazy"} decoding="async" alt={alt}
          style={reducedMotion ? undefined : { y: photoY, scale: photoScale }}
        />
      </motion.figure>
    </section>
  );
};

const StoreStory = ({ content }: { content?: Record<string, string> }) => (
  <section className="store-story" aria-labelledby="genan-story-title">
    <div className="store-story__cover">
      <StoryFrame id="about" photo="opening" alt="إطلالة بألوان حيادية مع حقيبة">
        <p className="store-story__label">عن جنان</p>
        <h1 id="genan-story-title">لكل إطلالة<br /><em>حكايتها.</em></h1>
        <p>تبدأ بقطعة تلفت نظركِ، وتكتمل بالطريقة التي تختارين ارتداءها بها.</p>
        <a className="store-story__button" href="#our-selection">تابعي الحكاية <ArrowDown size={15} aria-hidden="true" /></a>
      </StoryFrame>
    </div>

    <StoryFrame id="our-selection" photo="selection" alt="تشكيلة أزياء بدرجات حيادية على رف">
      <h2>{getSiteText(content, "store_info_hero_title", "اختيارات من عالم الموضة")}</h2>
      <p>{getSiteText(content, "store_info_hero_description", "نجمع في بوتيك جنان مختارات من الأحذية والملابس والحقائب والإكسسوارات من ماركات عالمية. ننتقي قطعًا تنسجم مع أسلوبكِ، من إطلالاتكِ اليومية إلى مناسباتكِ الخاصة.")}</p>
    </StoryFrame>

    <StoryFrame photo="details" alt="حقيبة داكنة بتفاصيل معدنية على قماش فاتح">
      <h2>التفاصيل التي تكمل الإطلالة.</h2>
      <p>{getSiteText(content, "store_info_pillar_2_desc", "نحرص على توضيح تفاصيل القطعة بالصور والوصف لتختاريها بثقة.")}</p>
      <Link to="/products" className="store-story__button">تصفّحي التشكيلة <ArrowLeft size={16} aria-hidden="true" /></Link>
    </StoryFrame>
  </section>
);

export default StoreStory;
