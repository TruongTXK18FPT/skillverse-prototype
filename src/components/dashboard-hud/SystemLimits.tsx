import React from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  BriefcaseBusiness,
  Clock3,
  Coins,
  Database,
  Infinity as InfinityIcon,
  Map,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FeatureLimitInfo } from "../../services/usageLimitService";
import "./SystemLimits.css";

interface SystemLimitsProps {
  usageLimits?: {
    CHATBOT_REQUESTS: number;
    ROADM_MAPS_LIMIT: number;
    COIN_MULTIPLIER: number;
  };
  featureUsage?: FeatureLimitInfo[];
  isLoading?: boolean;
  error?: string | null;
  roleNames?: string[];
}

type LimitCardKind = "usage" | "multiplier" | "boolean";
type LimitTone = "healthy" | "warning" | "danger" | "accent";

interface LimitItem {
  id: string;
  order: number;
  name: string;
  caption: string;
  icon: React.ReactNode;
  current: number;
  max: number | null;
  remaining: number | null;
  isUnlimited: boolean;
  multiplier: number | null;
  type: LimitCardKind;
  isEnabled: boolean | null;
  usagePercentage: number;
  progressPercentage: number;
  progressText: string;
  nextResetAt: string | null;
  resetText: string;
  statusText: string;
  tone: LimitTone;
}

const RECRUITER_ONLY_FEATURES = new Set<string>([
  "JOB_POSTING_MONTHLY",
  "SHORT_TERM_JOB_POSTING",
  "JOB_BOOST_MONTHLY",
  "HIGHLIGHT_JOB_POST",
  "AI_CANDIDATE_SUGGESTION",
  "COMPANY_PROFILE_PREMIUM",
  "ANALYTICS_DASHBOARD",
  "CANDIDATE_DATABASE_ACCESS",
  "AUTOMATED_OUTREACH",
  "BULK_IMPORT_CANDIDATES",
  "API_ACCESS",
  "RECRUITER_PRIORITY_SUPPORT",
]);

const PRIORITY_SUPPORT_FEATURES = new Set<string>([
  "PRIORITY_SUPPORT",
  "RECRUITER_PRIORITY_SUPPORT",
]);

const HIDDEN_FEATURES_ON_DASHBOARD = new Set<string>([
  "PRIORITY_SUPPORT",
  "RECRUITER_PRIORITY_SUPPORT",
]);

const FEATURE_META: Record<
  string,
  { name: string; caption: string; order: number; icon: React.ReactNode }
> = {
  AI_CHATBOT_REQUESTS: {
    name: "Chat nghề nghiệp AI",
    caption: "Lượt hội thoại với trợ lý AI",
    order: 0,
    icon: <Bot size={18} />,
  },
  AI_ROADMAP_GENERATION: {
    name: "Lộ trình AI",
    caption: "Số lần tạo lộ trình học tập",
    order: 1,
    icon: <Map size={18} />,
  },
  COIN_EARNING_MULTIPLIER: {
    name: "Hệ số coin",
    caption: "Hệ số thưởng khi nhận coin",
    order: 2,
    icon: <Coins size={18} />,
  },
  MENTOR_BOOKING_MONTHLY: {
    name: "Đặt lịch Mentor",
    caption: "Lượt đặt lịch mentor trong kỳ",
    order: 3,
    icon: <Sparkles size={18} />,
  },
  PRIORITY_SUPPORT: {
    name: "Hỗ trợ ưu tiên",
    caption: "Ưu tiên hỗ trợ khi cần",
    order: 4,
    icon: <ShieldCheck size={18} />,
  },
  JOB_POSTING_MONTHLY: {
    name: "Đăng tuyển dụng",
    caption: "Tin tuyển dụng dài hạn",
    order: 10,
    icon: <BriefcaseBusiness size={18} />,
  },
  SHORT_TERM_JOB_POSTING: {
    name: "Đăng việc ngắn hạn",
    caption: "Tin việc ngắn hạn / gig",
    order: 11,
    icon: <BriefcaseBusiness size={18} />,
  },
  JOB_BOOST_MONTHLY: {
    name: "Đẩy tin tuyển dụng",
    caption: "Lượt đẩy tin lên đầu",
    order: 12,
    icon: <Sparkles size={18} />,
  },
  HIGHLIGHT_JOB_POST: {
    name: "Tin nổi bật",
    caption: "Đánh dấu nổi bật tin đăng",
    order: 13,
    icon: <Sparkles size={18} />,
  },
  AI_CANDIDATE_SUGGESTION: {
    name: "Gợi ý ứng viên AI",
    caption: "AI gợi ý ứng viên phù hợp",
    order: 14,
    icon: <Bot size={18} />,
  },
  COMPANY_PROFILE_PREMIUM: {
    name: "Hồ sơ công ty nâng cao",
    caption: "Trang hồ sơ công ty cao cấp",
    order: 15,
    icon: <Database size={18} />,
  },
  ANALYTICS_DASHBOARD: {
    name: "Bảng phân tích",
    caption: "Báo cáo và thống kê nâng cao",
    order: 16,
    icon: <Activity size={18} />,
  },
  CANDIDATE_DATABASE_ACCESS: {
    name: "Kho ứng viên",
    caption: "Truy cập kho dữ liệu ứng viên",
    order: 17,
    icon: <Database size={18} />,
  },
  AUTOMATED_OUTREACH: {
    name: "Tiếp cận tự động",
    caption: "Tự động tiếp cận ứng viên",
    order: 18,
    icon: <Sparkles size={18} />,
  },
  BULK_IMPORT_CANDIDATES: {
    name: "Nhập hàng loạt",
    caption: "Nhập dữ liệu ứng viên hàng loạt",
    order: 19,
    icon: <Database size={18} />,
  },
  API_ACCESS: {
    name: "Truy cập API",
    caption: "Kết nối hệ thống qua API",
    order: 20,
    icon: <Database size={18} />,
  },
  RECRUITER_PRIORITY_SUPPORT: {
    name: "Hỗ trợ ưu tiên Recruiter",
    caption: "Ưu tiên hỗ trợ cho recruiter",
    order: 21,
    icon: <ShieldCheck size={18} />,
  },
};

const RESET_PERIOD_LABELS: Record<string, string> = {
  HOURLY: "Mỗi giờ",
  DAILY: "Mỗi ngày",
  MONTHLY: "Mỗi tháng",
  NEVER: "Không có làm mới",
  CUSTOM_8_HOURS: "Mỗi 8 giờ",
};

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

const formatMultiplier = (value: number) =>
  value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");

const normalizeRoleName = (role: string) =>
  role.toUpperCase().replace(/^ROLE_/, "").trim();

const shouldHideRecruiterFeatures = (roleNames: string[]) => {
  const normalized = roleNames.map(normalizeRoleName);
  const isStudentRole = normalized.some((role) =>
    ["USER", "STUDENT", "CANDIDATE"].includes(role),
  );
  const hasRecruiterRole = normalized.includes("RECRUITER");
  return isStudentRole && !hasRecruiterRole;
};

const toRelativeReset = (nextResetAt: string | null) => {
  if (!nextResetAt) {
    return "Không có lịch làm mới";
  }

  const target = new Date(nextResetAt);
  if (Number.isNaN(target.getTime())) {
    return "Đang cập nhật lịch làm mới";
  }

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return "Sắp làm mới";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    return `${totalDays} ngày nữa`;
  }

  if (totalHours >= 1) {
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${totalHours}h ${minutes}m nữa` : `${totalHours}h nữa`;
  }

  return `${Math.max(1, totalMinutes)} phút nữa`;
};

const toAbsoluteReset = (nextResetAt: string | null) => {
  if (!nextResetAt) {
    return "Không có mốc làm mới";
  }

  const target = new Date(nextResetAt);
  if (Number.isNaN(target.getTime())) {
    return "Không xác định";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(target);
};

const getDefaultFeatureName = (featureType: string) =>
  featureType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const isPrioritySupportFeature = (featureType: string) =>
  PRIORITY_SUPPORT_FEATURES.has(featureType);

const shouldDisplayFeature = (
  feature: FeatureLimitInfo,
  hideRecruiterFeaturesForStudent: boolean,
) => {
  if (HIDDEN_FEATURES_ON_DASHBOARD.has(feature.featureType)) {
    return false;
  }

  if (
    hideRecruiterFeaturesForStudent &&
    RECRUITER_ONLY_FEATURES.has(feature.featureType)
  ) {
    return false;
  }

  return (
    feature.isEnabled !== false ||
    feature.bonusMultiplier !== null ||
    feature.limit !== null ||
    feature.isUnlimited
  );
};

const getTone = (
  type: LimitCardKind,
  usagePercentage: number,
  isEnabled: boolean | null,
): LimitTone => {
  if (type === "usage") {
    if (usagePercentage >= 90) return "danger";
    if (usagePercentage >= 70) return "warning";
    return "healthy";
  }

  if (type === "boolean") {
    return isEnabled ? "healthy" : "warning";
  }

  return "accent";
};

const toFeatureItem = (feature: FeatureLimitInfo): LimitItem => {
  const meta = FEATURE_META[feature.featureType];
  const isPrioritySupport = isPrioritySupportFeature(feature.featureType);
  const type: LimitCardKind =
    isPrioritySupport
      ? "boolean"
      : feature.bonusMultiplier !== null
      ? "multiplier"
      : feature.limit === null && !feature.isUnlimited
        ? "boolean"
        : "usage";

  const usagePercentage =
    type === "usage" && !feature.isUnlimited && feature.limit
      ? clampPercentage(
          feature.usagePercentage || (feature.currentUsage / feature.limit) * 100,
        )
      : 0;

  const remaining =
    feature.remaining !== null && feature.remaining !== undefined
      ? feature.remaining
      : feature.limit !== null
        ? Math.max(0, feature.limit - feature.currentUsage)
        : null;

  const resetPeriodLabel = feature.resetPeriod
    ? RESET_PERIOD_LABELS[feature.resetPeriod] ?? feature.resetPeriod
    : "Không có làm mới";

  const resetText =
    isPrioritySupport
      ? feature.isEnabled
        ? "Hiệu lực đến khi gói hết hạn"
        : "Chưa kích hoạt"
      : type === "boolean"
      ? feature.isEnabled
        ? "Đang bật trong gói hiện tại"
        : "Chưa được kích hoạt"
      : feature.isUnlimited
        ? "Hiệu lực đến khi gói hết hạn"
        : `${resetPeriodLabel} • ${toRelativeReset(feature.nextResetAt)}`;

  let statusText = "Sẵn sàng sử dụng";
  if (isPrioritySupport) {
    statusText = feature.isEnabled ? "Không giới hạn trong thời gian gói" : "Chưa mở khóa";
  } else if (type === "usage") {
    if (feature.isUnlimited) {
      statusText = "Hiệu lực đến khi gói hết hạn";
    } else if ((remaining ?? 0) <= 0) {
      statusText = "Đã dùng hết lượt trong kỳ";
    } else {
      statusText = `${remaining} lượt còn lại`;
    }
  } else if (type === "multiplier") {
    statusText = `Nhận thưởng x${formatMultiplier(feature.bonusMultiplier ?? 1)}`;
  } else {
    statusText = feature.isEnabled ? "Đã mở khóa" : "Tạm khóa";
  }

  const progressPercentage =
    type === "usage"
      ? feature.isUnlimited
        ? 100
        : usagePercentage
      : type === "multiplier"
        ? clampPercentage((feature.bonusMultiplier ?? 1) * 50)
        : feature.isEnabled
          ? 100
          : 0;

  const progressText =
    isPrioritySupport
      ? feature.isEnabled
        ? "Đang hoạt động"
        : "Chưa hoạt động"
      : type === "usage"
      ? feature.isUnlimited
        ? "Không giới hạn"
        : `Đã dùng ${feature.currentUsage}/${feature.limit ?? 0}`
      : type === "multiplier"
        ? `Hệ số hiện tại x${formatMultiplier(feature.bonusMultiplier ?? 1)}`
        : feature.isEnabled
          ? "Tính năng đang bật"
          : "Tính năng đang tắt";

  const tone = getTone(type, usagePercentage, feature.isEnabled);

  return {
    id: feature.featureType,
    order: meta?.order ?? Number.MAX_SAFE_INTEGER,
    name:
      meta?.name ??
      (feature.featureNameVi ||
        feature.featureName ||
        getDefaultFeatureName(feature.featureType)),
    caption: meta?.caption ?? "Quyền lợi hiện tại của gói đang dùng",
    icon: meta?.icon ?? <ShieldCheck size={18} />,
    current: feature.currentUsage ?? 0,
    max: feature.limit,
    remaining,
    isUnlimited: Boolean(feature.isUnlimited),
    multiplier: feature.bonusMultiplier,
    type,
    isEnabled: feature.isEnabled,
    usagePercentage,
    progressPercentage,
    progressText,
    nextResetAt: feature.nextResetAt ?? null,
    resetText,
    statusText,
    tone,
  };
};

const buildFallbackItems = (
  usageLimits?: SystemLimitsProps["usageLimits"],
): LimitItem[] => {
  if (!usageLimits) {
    return [];
  }

  const fallbackFeatures: FeatureLimitInfo[] = [
    {
      featureType: "AI_CHATBOT_REQUESTS",
      featureName: "AI Chatbot Requests",
      featureNameVi: "Chat nghề nghiệp AI",
      limit: usageLimits.CHATBOT_REQUESTS,
      currentUsage: 0,
      resetPeriod: "CUSTOM_8_HOURS",
      nextResetAt: null,
      timeUntilReset: null,
      isUnlimited: false,
      remaining: usageLimits.CHATBOT_REQUESTS,
      usagePercentage: 0,
      bonusMultiplier: null,
      isEnabled: true,
    },
    {
      featureType: "AI_ROADMAP_GENERATION",
      featureName: "AI Roadmap Generation",
      featureNameVi: "Lộ trình AI",
      limit: usageLimits.ROADM_MAPS_LIMIT,
      currentUsage: 0,
      resetPeriod: "DAILY",
      nextResetAt: null,
      timeUntilReset: null,
      isUnlimited: false,
      remaining: usageLimits.ROADM_MAPS_LIMIT,
      usagePercentage: 0,
      bonusMultiplier: null,
      isEnabled: true,
    },
    {
      featureType: "COIN_EARNING_MULTIPLIER",
      featureName: "Coin Earning Multiplier",
      featureNameVi: "Hệ số coin",
      limit: null,
      currentUsage: 0,
      resetPeriod: "NEVER",
      nextResetAt: null,
      timeUntilReset: null,
      isUnlimited: true,
      remaining: null,
      usagePercentage: 0,
      bonusMultiplier: usageLimits.COIN_MULTIPLIER,
      isEnabled: true,
    },
  ];

  return fallbackFeatures.map(toFeatureItem);
};

const SystemLimits: React.FC<SystemLimitsProps> = ({
  usageLimits,
  featureUsage,
  isLoading = false,
  error = null,
  roleNames = [],
}) => {
  const hideRecruiterFeaturesForStudent = shouldHideRecruiterFeatures(roleNames);
  const items =
    featureUsage && featureUsage.length > 0
      ? featureUsage
          .filter((feature) =>
            shouldDisplayFeature(feature, hideRecruiterFeaturesForStudent),
          )
          .map(toFeatureItem)
      : buildFallbackItems(usageLimits);

  items.sort((left, right) => left.order - right.order);

  const recurringCount = items.filter(
    (item) => item.type === "usage" && !item.isUnlimited,
  ).length;
  const enabledCount = items.filter(
    (item) => item.type !== "boolean" || item.isEnabled,
  ).length;

  if (isLoading) {
    return (
      <section className="sv-usage-panel">
        <div className="sv-usage-panel__header">
          <div>
            <div className="sv-usage-panel__eyebrow">Kiểm soát sử dụng</div>
            <h2 className="sv-usage-panel__title">Giới hạn hiện tại</h2>
          </div>
          <div className="sv-usage-panel__status">Đang tải dữ liệu...</div>
        </div>

        <div className="sv-usage-panel__grid">
          {[0, 1, 2].map((index) => (
            <div key={index} className="sv-usage-card sv-usage-card--skeleton">
              <div className="sv-usage-skeleton sv-usage-skeleton--title" />
              <div className="sv-usage-skeleton sv-usage-skeleton--value" />
              <div className="sv-usage-skeleton sv-usage-skeleton--line" />
              <div className="sv-usage-skeleton sv-usage-skeleton--line short" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0 && !error) {
    return (
      <section className="sv-usage-panel">
        <div className="sv-usage-panel__header">
          <div>
            <div className="sv-usage-panel__eyebrow">Kiểm soát sử dụng</div>
            <h2 className="sv-usage-panel__title">Giới hạn hiện tại</h2>
          </div>
        </div>

        <div className="sv-usage-panel__empty">
          <Activity size={18} />
          Chưa có dữ liệu giới hạn cho gói hiện tại.
        </div>
      </section>
    );
  }

  return (
    <section className="sv-usage-panel">
      <div className="sv-usage-panel__header">
        <div>
          <div className="sv-usage-panel__eyebrow">Kiểm soát sử dụng</div>
          <h2 className="sv-usage-panel__title">Giới hạn hiện tại</h2>
          <p className="sv-usage-panel__subtitle">
            Theo dõi lượt còn lại, quyền lợi đang mở khóa và mốc làm mới trên dashboard.
          </p>
        </div>

        <div className="sv-usage-panel__status">
          <Activity size={16} />
          {items.length} khả năng
        </div>
      </div>

      {error && (
        <div className="sv-usage-panel__notice">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="sv-usage-panel__summary">
        <div className="sv-usage-summary-card">
          <span className="sv-usage-summary-card__label">Quyền lợi đang bật</span>
          <strong className="sv-usage-summary-card__value">{enabledCount}</strong>
        </div>

        <div className="sv-usage-summary-card">
          <span className="sv-usage-summary-card__label">Mục có làm mới định kỳ</span>
          <strong className="sv-usage-summary-card__value">{recurringCount}</strong>
        </div>

        <div className="sv-usage-summary-card">
          <span className="sv-usage-summary-card__label">Trạng thái</span>
          <strong className="sv-usage-summary-card__value">
            {error ? "Cần xem lại API" : "Hoạt động tốt"}
          </strong>
        </div>
      </div>

      <div className="sv-usage-panel__grid">
        {items.map((item) => {
          const hideSecondaryMeta =
            item.isUnlimited || isPrioritySupportFeature(item.id);

          return (
          <article key={item.id} className={`sv-usage-card sv-usage-card--${item.tone}`}>
            <div className="sv-usage-card__header">
              <div className="sv-usage-card__identity">
                <div className="sv-usage-card__icon">{item.icon}</div>
                <div>
                  <h3 className="sv-usage-card__name">{item.name}</h3>
                  <p className="sv-usage-card__caption">{item.caption}</p>
                </div>
              </div>

              <span className={`sv-usage-card__pill sv-usage-card__pill--${item.type}`}>
                {item.type === "usage"
                  ? item.isUnlimited
                    ? "Không giới hạn"
                    : "Giới hạn"
                  : item.type === "multiplier"
                    ? "Thưởng"
                    : "Bật"}
              </span>
            </div>

            <div className="sv-usage-card__metric">
              {item.type === "multiplier" ? (
                <>
                  <div className="sv-usage-card__value">
                    x{formatMultiplier(item.multiplier ?? 1)}
                  </div>
                  <div className="sv-usage-card__value-label">Hệ số thưởng hiện tại</div>
                </>
              ) : item.type === "boolean" ? (
                <>
                  <div className="sv-usage-card__value">{item.isEnabled ? "BẬT" : "TẮT"}</div>
                  <div className="sv-usage-card__value-label">
                    {isPrioritySupportFeature(item.id)
                      ? "Trạng thái hỗ trợ"
                      : "Tính năng trong gói đang dùng"}
                  </div>
                </>
              ) : item.isUnlimited ? (
                <>
                  <div className="sv-usage-card__value sv-usage-card__value--infinite">
                    <InfinityIcon size={22} />
                    Không giới hạn
                  </div>
                  <div className="sv-usage-card__value-label">Không giới hạn số lần sử dụng</div>
                </>
              ) : (
                <>
                  <div className="sv-usage-card__value">{item.remaining ?? 0}</div>
                  <div className="sv-usage-card__value-label">Lượt còn lại trong kỳ</div>
                </>
              )}
            </div>

            {!isPrioritySupportFeature(item.id) && (
              <div className="sv-usage-card__progress-block">
                <div className="sv-usage-card__progress-meta">
                  <span>{item.progressText}</span>
                  <span>{Math.round(item.progressPercentage)}%</span>
                </div>

                <div className="sv-usage-card__progress-track">
                  <div
                    className={`sv-usage-card__progress-fill sv-usage-card__progress-fill--${item.tone}`}
                    style={{ width: `${item.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="sv-usage-card__footer">
              <div className="sv-usage-card__meta">
                <RefreshCcw size={14} />
                <span>{item.resetText}</span>
              </div>

              {!hideSecondaryMeta && (
                <div className="sv-usage-card__meta">
                  <Clock3 size={14} />
                  <span>
                    {item.type === "usage" && !item.isUnlimited
                      ? `Làm mới: ${toAbsoluteReset(item.nextResetAt)}`
                      : item.statusText}
                  </span>
                </div>
              )}
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
};

export default SystemLimits;
