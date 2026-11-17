import { ArrowDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { getSiteText } from "@/hooks/useSiteContent";
import "./StoreStory.css";

const StoreStory = ({ content }: { content?: Record<string, string> }) => (
  <section className="store-story" aria-labelledby="genan-story-title">
    <div id="about" className="store-story__cover">
      <picture className="store-story__hero-photo">
        <source media="(max-width: 767px)" srcSet="/story/editorial-cover-mobile.webp" />
        <img src="/story/editorial-cover.webp" alt="أزياء مختارة وحقيبة جلدية على منصة بلون عاجي" width={1440} height={960} decoding="async" />
      </picture>
      <div className="store-story__cover-content">
        <p className="store-story__label">عن بوتيك جنان</p>
        <h1 id="genan-story-title">تبدأ الحكاية<br />بقطعة تختارينها.</h1>
        <p>أزياء وحقائب وأحذية وإكسسوارات من ماركات عالمية، تختارين منها ما يشبه أسلوبكِ.</p>
        <a className="store-story__primary" href="#our-selection">
          اكتشفي اختياراتنا <ArrowDown size={16} aria-hidden="true" />
        </a>
      </div>
    </div>

    <section id="our-selection" aria-labelledby="genan-selection-title" className="store-story__selection">
      <div className="store-story__selection-intro">
        <h2 id="genan-selection-title">{getSiteText(content, "store_info_hero_title", "اختيارات من عالم الموضة")}</h2>
        <p>{getSiteText(content, "store_info_hero_description", "ننتقي قطعًا تنسجم مع أسلوبكِ وترافقكِ من الإطلالات اليومية إلى المناسبات الخاصة.")}</p>
      </div>

      <div className="store-story__spread">
        <figure className="store-story__chapter store-story__reveal">
          <div className="store-story__image">
            <img src="/story/selection-960.webp" srcSet="/story/selection-480.webp 480w, /story/selection-960.webp 960w" sizes="(min-width: 1280px) 650px, (min-width: 768px) 53vw, 92vw" width={960} height={720} loading="lazy" decoding="async" alt="تشكيلة أزياء بدرجات حيادية على رف" />
          </div>
          <figcaption>
            <h3>قطع تعودين إليها</h3>
            <p>قطعة ترتدينها بأكثر من طريقة وتنسّقينها مع ما تحبينه في خزانتكِ.</p>
          </figcaption>
        </figure>

        <figure className="store-story__chapter store-story__reveal">
          <div className="store-story__image store-story__image--detail">
            <img src="/story/details-960.webp" srcSet="/story/details-480.webp 480w, /story/details-960.webp 960w" sizes="(min-width: 1280px) 475px, (min-width: 768px) 37vw, 92vw" width={960} height={720} loading="lazy" decoding="async" alt="حقيبة داكنة بتفاصيل معدنية على قماش فاتح" />
          </div>
          <figcaption>
            <h3>التفاصيل عن قرب</h3>
            <p>{getSiteText(content, "store_info_pillar_2_desc", "نوضّح تفاصيل القطعة بالصور والوصف لتختاريها بثقة.")}</p>
          </figcaption>
        </figure>
      </div>

      <div className="store-story__finish">
        <h2>اختاري ما يشبهكِ.</h2>
        <Link to="/products" className="store-story__primary">
          تصفّحي التشكيلة <ArrowLeft size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  </section>
);

export default StoreStory;
