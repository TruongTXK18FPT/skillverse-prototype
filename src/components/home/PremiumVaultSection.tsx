import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Check, Crown, Sparkles } from "lucide-react";
import { premiumService } from "../../services/premiumService";
import { PremiumPlan } from "../../data/premiumDTOs";
import "./PremiumVaultSection.css";

type DoorState = "closed" | "opening" | "open";

const DOOR_ANIMATION_MS = 620;

const PremiumVaultSection = () => {
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);
  const [loadingPremiumPlans, setLoadingPremiumPlans] = useState(false);
  const [doorState, setDoorState] = useState<DoorState>("closed");

  const openVault = () => {
    if (doorState !== "closed") {
      return;
    }

    setDoorState("opening");
    window.setTimeout(() => {
      setDoorState("open");
    }, DOOR_ANIMATION_MS);
  };

  const filteredPremiumPlans = useMemo(() => {
    const activePlans = premiumPlans.filter(
      (plan) => plan.isActive && plan.planType !== "FREE_TIER",
    );

    return activePlans
      .filter(
        (plan) =>
          plan.targetRole !== "RECRUITER" && plan.planType !== "RECRUITER_PRO",
      )
      .slice(0, 3);
  }, [premiumPlans]);

  const parsePlanFeatures = (features: string): string[] => {
    if (!features) return [];

    return features
      .replace(/[\[\]"]+/g, "")
      .split(/\n|,|;/)
      .map((item) => item.trim().replace(/^[-*\s]+/, ""))
      .filter(Boolean)
      .slice(0, 4);
  };

  const formatPlanPrice = (price: string) => {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
      return price;
    }
    return `${numericPrice.toLocaleString("vi-VN")} đ`;
  };

  useEffect(() => {
    const fetchPremiumPlans = async () => {
      try {
        setLoadingPremiumPlans(true);
        const plans = await premiumService.getPremiumPlans(true);
        setPremiumPlans(plans);
      } catch (error) {
        console.error("Failed to fetch premium plans for premium vault", error);
      } finally {
        setLoadingPremiumPlans(false);
      }
    };

    fetchPremiumPlans();
  }, []);

  return (
    <section className={`premium-vault-section premium-vault--${doorState}`}>
      <div className="premium-vault-ambient" aria-hidden="true"></div>

      <div className="premium-vault-doors" aria-hidden="true">
        <div className="premium-vault-door premium-vault-door--left">
          <span className="premium-vault-door-label">VAULT ACCESS / AUTHORIZED</span>
        </div>
        <div className="premium-vault-door premium-vault-door--right"></div>
      </div>

      <div className="premium-vault-lock-layer" aria-hidden={doorState === "open"}>
        <div className="premium-vault-teaser-card">
          <p className="premium-vault-tease">Hành trình thực sự bây giờ mới bắt đầu....</p>
          <p className="premium-vault-tease-sub">Mở khóa toàn bộ sức mạnh của Skillverse?</p>
          <div className="premium-vault-teaser-meter" aria-hidden="true">
            <span></span>
          </div>
        </div>

        <button
          type="button"
          className="premium-vault-lock-button"
          onClick={openVault}
          disabled={doorState !== "closed"}
          aria-label="Mở kho Premium"
        >
          <span className="premium-vault-lock-ring"></span>
          <span className="premium-vault-lock-glyph"></span>
        </button>
      </div>

      <div className="section-container premium-vault-content">
        <div className="section-header premium-vault-header">
          <p className="premium-vault-manifesto">
            <Crown className="premium-vault-heading-icon" size={24} />
            SkillVerse Premium: mở khóa sức mạnh AI, bứt tốc lộ trình, dẫn đầu cuộc chơi.
          </p>
        </div>

        <div className="premium-vault-grid">
          {loadingPremiumPlans && (
            <div className="premium-vault-state">Đang đồng bộ dữ liệu premium vault...</div>
          )}

          {!loadingPremiumPlans && filteredPremiumPlans.length === 0 && (
            <div className="premium-vault-state">Hiện chưa có gói phù hợp cho vai trò này.</div>
          )}

          {!loadingPremiumPlans &&
            filteredPremiumPlans.map((plan) => (
              <article className="premium-vault-card" key={plan.id}>
                <div className="premium-vault-card-top">
                  <div>
                    <p className="premium-vault-plan-type">
                      {plan.planType.replace(/_/g, " ")}
                    </p>
                    <h3 className="premium-vault-plan-name">{plan.displayName}</h3>
                  </div>
                  <Sparkles size={20} className="premium-vault-plan-icon" />
                </div>

                <p className="premium-vault-plan-price">{formatPlanPrice(plan.price)}</p>
                <p className="premium-vault-plan-duration">
                  {plan.durationMonths} tháng truy cập
                </p>

                <ul className="premium-vault-features">
                  {parsePlanFeatures(plan.features).map((feature, idx) => (
                    <li key={`${plan.id}-${idx}`}>
                      <Check size={14} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link className="premium-vault-cta" to="/premium">
                  Kích Hoạt Gói Này
                  <ChevronRight size={16} />
                </Link>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumVaultSection;
