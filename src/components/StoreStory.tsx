import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { getSiteText } from "@/hooks/useSiteContent";
import "./StoreStory.css";

const StoreStory = ({ content }: { content?: Record<string, string> }) => {
  const opening = useRef<HTMLElement>(null);
  const sequence = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress: openingProgress } = useScroll({ target: opening, offset: ["start start", "end start"] });
  const { scrollYProgress: sceneProgress } = useScroll({ target: sequence, offset: ["start start", "end end"] });

  const openingScale = useTransform(openingProgress, [0, 1], [1, 1.16]);
  const openingText = useTransform(openingProgress, [0.1, 0.84], [1, 0]);
  const openingLift = useTransform(openingProgress, [0.1, 0.9], [0, 66]);
  const selectionOpacity = useTransform(sceneProgress, [0.35, 0.53], [1, 0]);
  const selectionScale = useTransform(sceneProgress, [0, 0.56], [1, 1.19]);
  const selectionLift = useTransform(sceneProgress, [0.31, 0.55], [0, -42]);
  const detailOpacity = useTransform(sceneProgress, [0.42, 0.61], [0, 1]);
  const detailScale = useTransform(sceneProgress, [0.42, 1], [1.23, 1]);
  const detailLift = useTransform(sceneProgress, [0.44, 0.68], [48, 0]);
  const detailWipe = useTransform(sceneProgress, [0.38, 0.63], ["inset(0 0 100% 0)", "inset(0 0 0% 0)"]);

  return (
    <article className="store-story" aria-labelledby="genan-story-title">
      <section ref={opening} id="about" className="store-story__opening">
        <motion.div className="store-story__opening-shot" style={reduceMotion ? undefined : { scale: openingScale }}>
          <picture>
            <source media="(max-width: 639px)" srcSet="/story/cinema-opening-mobile.webp" />
            <img src="/story/cinema-opening.webp" alt="حقيبة جلدية على حجر داكن تحت ضوء دافئ" width={1440} height={960} decoding="async" />
          </picture>
        </motion.div>
        <div className="store-story__opening-shade" aria-hidden="true" />
        <div className="store-story__frame" aria-hidden="true" />
        <motion.div className="store-story__intro" style={reduceMotion ? undefined : { opacity: openingText, y: openingLift }}>
          <p className="store-story__eyebrow">حكاية بوتيك جنان</p>
          <h1 id="genan-story-title">لكل إطلالة<br /><em>حكايتها.</em></h1>
          <p>تبدأ بقطعة تلفت نظركِ، وتكتمل بالطريقة التي تختارين ارتداءها بها.</p>
          <a className="store-story__start" href="#our-selection">
            تابعي الحكاية <ArrowDown aria-hidden="true" size={16} />
          </a>
        </motion.div>
      </section>

      <section ref={sequence} id="our-selection" className="store-story__sequence" aria-label="من اختيار القطعة إلى اكتمال الإطلالة">
        <div className="store-story__stage">
          <section className="store-story__scene store-story__scene--selection">
            <div className="store-story__scene-image">
              <motion.img
                src="/story/selection-960.webp"
                srcSet="/story/selection-480.webp 480w, /story/selection-960.webp 960w"
                sizes="(min-width: 760px) 60vw, 100vw"
                width={960} height={720} loading="lazy" decoding="async"
                alt="تشكيلة أزياء بدرجات حيادية على رف"
                style={reduceMotion ? undefined : { scale: selectionScale }}
              />
            </div>
            <motion.div className="store-story__scene-copy" style={reduceMotion ? undefined : { opacity: selectionOpacity, y: selectionLift }}>
              <h2>{getSiteText(content, "store_info_hero_title", "اختيارات من عالم الموضة")}</h2>
              <p>{getSiteText(content, "store_info_hero_description", "نجمع في بوتيك جنان مختارات من الأحذية والملابس والحقائب والإكسسوارات من ماركات عالمية. ننتقي قطعًا تنسجم مع أسلوبكِ، من إطلالاتكِ اليومية إلى مناسباتكِ الخاصة.")}</p>
            </motion.div>
          </section>

          <motion.section className="store-story__scene store-story__scene--details" style={reduceMotion ? undefined : { clipPath: detailWipe }}>
            <div className="store-story__scene-image">
              <motion.img
                src="/story/details-960.webp"
                srcSet="/story/details-480.webp 480w, /story/details-960.webp 960w"
                sizes="(min-width: 760px) 60vw, 100vw"
                width={960} height={720} loading="lazy" decoding="async"
                alt="تفاصيل حقيبة داكنة بإكسسوارات معدنية"
                style={reduceMotion ? undefined : { scale: detailScale }}
              />
            </div>
            <motion.div className="store-story__scene-copy" style={reduceMotion ? undefined : { opacity: detailOpacity, y: detailLift }}>
              <h2>التفاصيل التي تكمل الإطلالة.</h2>
              <p>{getSiteText(content, "store_info_pillar_2_desc", "من شكل الحقيبة إلى ملمس القماش، نوضّح تفاصيل القطعة بالصور والوصف لتختاريها بثقة.")}</p>
            </motion.div>
          </motion.section>
          <div className="store-story__progress" aria-hidden="true">
            <motion.span style={reduceMotion ? undefined : { scaleX: sceneProgress }} />
          </div>
        </div>
      </section>

      <section className="store-story__close">
        <div>
          <h2>اختاري ما يشبهكِ.</h2>
          <p>من القطع اليومية إلى ما تحتفظين به لمناسبة خاصة.</p>
        </div>
        <Link to="/products" className="store-story__shop">
          تصفّحي التشكيلة <ArrowLeft aria-hidden="true" size={17} />
        </Link>
      </section>
    </article>
  );
};

export default StoreStory;
