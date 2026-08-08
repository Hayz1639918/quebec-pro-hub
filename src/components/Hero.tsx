import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/home-construction-hero.webp";
import renovationImage from "@/assets/home-project-renovation.webp";
import houseImage from "@/assets/home-project-house.webp";
import commercialImage from "@/assets/home-project-commercial.webp";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const stats = [
    { icon: Users, value: "2 500+", label: t("hero.stats.professionals") },
    { icon: ClipboardList, value: "15 000+", label: t("hero.stats.projects") },
    { icon: Star, value: "4,8/5", label: t("hero.stats.satisfaction") },
  ];

  const featuredProjects = [
    { image: renovationImage, label: t("hero.featured.items.renovation") },
    { image: houseImage, label: t("hero.featured.items.new_home") },
    { image: commercialImage, label: t("hero.featured.items.commercial") },
  ];

  return (
    <section className="reference-home" aria-labelledby="reference-home-title">
      <div
        className="reference-home__hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="reference-home__shade" aria-hidden="true" />

        <div className="reference-home__copy">
          <span className="reference-home__eyebrow">{t("hero.badge")}</span>
          <h1 id="reference-home-title">{t("hero.title")}</h1>
          <p>{t("hero.subtitle")}</p>

          <div className="reference-home__cta">
            <button
              type="button"
              className="reference-home__button reference-home__button--primary"
              onClick={() => navigate("/auth?mode=signup")}
            >
              {t("hero.cta_client")}
              <ArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              className="reference-home__button reference-home__button--secondary"
              onClick={() => navigate("/auth?mode=signup")}
            >
              {t("hero.cta_pro")}
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <aside className="reference-home__verified" aria-label={t("hero.verified_card.eyebrow")}>
          <div className="reference-home__verified-heading">
            <span className="reference-home__verified-shield">
              <ShieldCheck aria-hidden="true" />
            </span>
            {t("hero.verified_card.eyebrow")}
          </div>

          <div className="reference-home__verified-profile">
            <span className="reference-home__verified-avatar">
              <Home aria-hidden="true" />
            </span>
            <div>
              <strong>{t("hero.verified_card.company")}</strong>
              <span>{t("hero.verified_card.role")}</span>
              <span>{t("hero.verified_card.location")}</span>
            </div>
          </div>

          <div className="reference-home__rating">
            <span className="reference-home__stars" aria-label="5 étoiles">★★★★★</span>
            <strong>4,8</strong>
            <span>({t("hero.verified_card.reviews")})</span>
          </div>

          <span className="reference-home__license">
            {t("hero.verified_card.license")}
            <i aria-hidden="true" />
          </span>
        </aside>

        <div className="reference-home__search" aria-label={t("hero.search.button")}>
          <button type="button" className="reference-home__field" onClick={() => navigate("/professionals")}>
            <Search aria-hidden="true" />
            <span>
              <strong>{t("hero.search.service_label")}</strong>
              <small>{t("hero.search.service_placeholder")}</small>
            </span>
            <ChevronDown className="reference-home__chevron" aria-hidden="true" />
          </button>

          <button type="button" className="reference-home__field" onClick={() => navigate("/professionals")}>
            <MapPin aria-hidden="true" />
            <span>
              <strong>{t("hero.search.location_label")}</strong>
              <small>{t("hero.search.location_placeholder")}</small>
            </span>
            <ChevronDown className="reference-home__chevron" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="reference-home__search-button"
            onClick={() => navigate("/professionals")}
          >
            {t("hero.search.button")}
            <Search aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="reference-home__lower">
        <div className="reference-home__stats">
          {stats.map(({ icon: Icon, value, label }) => (
            <div className="reference-home__stat" key={label}>
              <span className="reference-home__stat-icon">
                <Icon aria-hidden="true" />
              </span>
              <span>
                <strong>{value}</strong>
                <small>{label}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="reference-home__projects-heading">
          <h2>{t("hero.featured.title")}</h2>
          <button type="button" onClick={() => navigate("/projects")}>
            {t("hero.featured.view_all")}
            <ArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="reference-home__projects">
          {featuredProjects.map(({ image, label }) => (
            <button
              type="button"
              className="reference-home__project"
              style={{ backgroundImage: `url(${image})` }}
              onClick={() => navigate("/projects")}
              key={label}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
