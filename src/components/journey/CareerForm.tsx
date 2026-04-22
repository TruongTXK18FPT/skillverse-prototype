import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  getExpertFields,
  ExpertFieldResponse,
} from "../../services/expertPromptService";
import {
  ExpertDomainMeta,
  getExpertDomainMeta,
} from "../../utils/expertFieldPresentation";

interface RoleItem {
  code: string;
  label: string;
  backendRole: string;
  keywords?: string;
}

interface CareerFormProps {
  onComplete: (data: {
    domain: string;
    industry: string;
    jobRole: string;
    roleKeywords?: string;
  }) => void;
  onBack: () => void;
  allowedDomains?: string[];
}

const parseKeywords = (keywords?: string): string[] =>
  (keywords || "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword, index, array) => array.indexOf(keyword) === index);

const CareerForm: React.FC<CareerFormProps> = ({ onComplete, onBack, allowedDomains }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expertFields, setExpertFields] = useState<ExpertFieldResponse[]>([]);

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getExpertFields();
        setExpertFields(data || []);
      } catch (error) {
        console.error("Failed to load expert fields:", error);
        setLoadError("Không tải được danh sách ngành nghề. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, []);

  const visibleFields = useMemo(() => {
    if (!allowedDomains || allowedDomains.length === 0) {
      return expertFields;
    }

    const allowedDomainSet = new Set(allowedDomains.map((domain) => domain.toUpperCase()));
    return expertFields.filter((field) => allowedDomainSet.has(field.domain.toUpperCase()));
  }, [allowedDomains, expertFields]);

  const domainOptions: ExpertDomainMeta[] = useMemo(() => {
    return visibleFields.map((field) => getExpertDomainMeta(field.domain));
  }, [visibleFields]);

  const currentDomain = useMemo(() => {
    return visibleFields.find((field) => field.domain === selectedDomain);
  }, [visibleFields, selectedDomain]);

  const currentSubCategories = useMemo(() => {
    return (currentDomain?.industries || []).map((industry) => ({
      value: industry.industry,
      label: industry.industry,
    }));
  }, [currentDomain]);

  const currentRoles: RoleItem[] = useMemo(() => {
    if (!currentDomain || !selectedSubCategory) return [];
    const industry = currentDomain.industries.find(
      (i) => i.industry === selectedSubCategory,
    );
    if (!industry) return [];
    return industry.roles.map((role) => ({
      code: role.jobRole,
      label: role.jobRole,
      backendRole: role.jobRole,
      keywords: role.keywords,
    }));
  }, [currentDomain, selectedSubCategory]);

  const filteredRoles = currentRoles.filter((role) =>
    role.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedRoleEntry = useMemo(() => {
    if (!selectedJob) return undefined;
    return currentRoles.find((r) => r.code === selectedJob);
  }, [currentRoles, selectedJob]);

  const selectedDomainMeta = useMemo(() => {
    return selectedDomain
      ? domainOptions.find((domain) => domain.value === selectedDomain)
      : undefined;
  }, [domainOptions, selectedDomain]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getExpertFields();
      setExpertFields(data || []);
    } catch (error) {
      console.error("Failed to load expert fields:", error);
      setLoadError("Không tải được danh sách ngành nghề. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setSelectedSubCategory(null);
    setSelectedJob(null);
    setSearchQuery("");
  };

  const handleSubCategorySelect = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setSelectedJob(null);
    setSearchQuery("");
  };

  const handleJobSelect = (roleCode: string) => {
    setSelectedJob(roleCode);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = () => {
    if (selectedDomain && selectedSubCategory && selectedJob) {
      onComplete({
        domain: selectedDomain,
        industry: selectedSubCategory,
        jobRole: selectedJob,
        roleKeywords: selectedRoleEntry?.keywords,
      });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedDomain;
      case 2:
        return !!selectedSubCategory;
      case 3:
        return !!selectedJob;
      default:
        return false;
    }
  };

  // Step 1: Select Domain
  const renderStep1 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Chọn lĩnh vực</h2>
        <p className="gsj-wizard-step__subtitle">
          Bạn quan tâm đến lĩnh vực nào?
        </p>
      </div>

      <div className="gsj-domain-grid">
        {domainOptions.map((domain) => (
          <button
            key={domain.value}
            type="button"
            className={`gsj-domain-card ${selectedDomain === domain.value ? "gsj-domain-card--selected" : ""}`}
            onClick={() => handleDomainSelect(domain.value)}
          >
            {domain.image ? (
              <div className="gsj-domain-card__image-wrap">
                <img
                  src={domain.image}
                  alt={domain.label}
                  className="gsj-domain-card__image"
                />
              </div>
            ) : (
              <div className="gsj-domain-card__image-wrap">
                <span className="gsj-domain-card__icon">{domain.icon}</span>
              </div>
            )}
            <div className="gsj-domain-card__content">
              <span className="gsj-domain-card__label">{domain.label}</span>
              <span className="gsj-domain-card__desc">
                {domain.description}
              </span>
            </div>
            {selectedDomain === domain.value && (
              <span className="gsj-domain-card__check">
                <Check size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: Select Sub-category
  const renderStep2 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Chọn ngành chi tiết</h2>
        <p className="gsj-wizard-step__subtitle">
          {domainOptions.find((d) => d.value === selectedDomain)?.label} - Bạn
          muốn học về ngành nào?
        </p>
      </div>

      <div className="gsj-subcategory-grid">
        {currentSubCategories.map((sub) => (
          <button
            key={sub.value}
            type="button"
            className={`gsj-subcategory-card ${selectedSubCategory === sub.value ? "gsj-subcategory-card--selected" : ""}`}
            onClick={() => handleSubCategorySelect(sub.value)}
          >
            <span className="gsj-subcategory-card__label">{sub.label}</span>
            {selectedSubCategory === sub.value && (
              <span className="gsj-subcategory-card__check">
                <Check size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 3: Select Job Role
  const renderStep3 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Chọn vị trí công việc</h2>
        <p className="gsj-wizard-step__subtitle">
          {selectedDomainMeta?.label} &rsaquo; {selectedSubCategory || ""} — Bạn
          hướng đến vị trí nào?
        </p>
      </div>

      <div className="gsj-selection-banner">
        <span className="gsj-selection-banner__item">
          {selectedDomainMeta?.label || "Chưa chọn lĩnh vực"}
        </span>
        <span className="gsj-selection-banner__item">
          {selectedSubCategory || "Chưa chọn ngành"}
        </span>
      </div>

      <div className="gsj-search-input">
        <Search size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm vị trí theo tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            <X size={16} />
          </button>
        )}
      </div>

      <p className="gsj-hint-text gsj-hint-text--inline gsj-role-meta">
        Hiển thị {filteredRoles.length} / {currentRoles.length} vị trí
      </p>

      <div className="gsj-job-grid">
        {filteredRoles.length === 0 && (
          <div className="gsj-no-roles">
            Không tìm thấy vị trí phù hợp. Thử từ khóa khác hoặc quay lại chọn
            ngành khác.
          </div>
        )}
        {filteredRoles.map((role) => {
          const roleKeywords = parseKeywords(role.keywords);

          return (
            <button
              key={role.code}
              type="button"
              className={`gsj-job-card ${selectedJob === role.code ? "gsj-job-card--selected" : ""}`}
              onClick={() => handleJobSelect(role.code)}
            >
              <div className="gsj-job-card__content">
                <span className="gsj-job-card__eyebrow">Vị trí mục tiêu</span>
                <span className="gsj-job-card__label">{role.label}</span>
                <span className="gsj-job-card__desc">
                  {selectedSubCategory}
                </span>
                {roleKeywords.length > 0 && (
                  <div className="gsj-job-card__keywords">
                    {roleKeywords.slice(0, 4).map((keyword) => (
                      <span
                        key={`${role.code}-${keyword}`}
                        className="gsj-job-card__keyword"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {selectedJob === role.code && (
                <span className="gsj-job-card__check">
                  <Check size={16} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="gsj-wizard-step">
        <div className="gsj-wizard-step__header">
          <h2 className="gsj-wizard-step__title">
            Đang tải dữ liệu nghề nghiệp...
          </h2>
          <p className="gsj-wizard-step__subtitle">
            Vui lòng chờ trong giây lát.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="gsj-wizard-step">
        <div className="gsj-wizard-step__header">
          <h2 className="gsj-wizard-step__title">
            Không thể tải danh sách nghề nghiệp
          </h2>
          <p className="gsj-wizard-step__subtitle">{loadError}</p>
        </div>
        <div className="gsj-wizard-nav">
          <button
            type="button"
            className="gsj-btn gsj-btn--secondary"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleRetry}
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gsj-career-form">
      {/* Progress */}
      <div className="gsj-career-progress">
        <div className="gsj-career-progress__steps">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`gsj-career-progress__step ${step >= s ? "gsj-career-progress__step--active" : ""} ${step > s ? "gsj-career-progress__step--completed" : ""}`}
            >
              <div className="gsj-career-progress__step-dot">
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className="gsj-career-progress__step-label">
                {s === 1 ? "Lĩnh vực" : s === 2 ? "Ngành" : "Nghề"}
              </span>
            </div>
          ))}
        </div>
        <div className="gsj-career-progress__bar">
          <div
            className="gsj-career-progress__bar-fill"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Navigation */}
      <div className="gsj-wizard-nav">
        <button
          type="button"
          className="gsj-btn gsj-btn--secondary"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
          {step === 1 ? "Quay lại" : "Trước đó"}
        </button>

        {step < 3 ? (
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Tiếp theo
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleSubmit}
            disabled={!canProceed()}
          >
            <Check size={16} />
            Xác nhận lựa chọn
          </button>
        )}
      </div>
    </div>
  );
};

export default CareerForm;
