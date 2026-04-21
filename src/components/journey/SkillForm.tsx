import { useEffect, useMemo, useState } from "react";
import {
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  getExpertFields,
  ExpertFieldResponse,
} from "../../services/expertPromptService";
import {
  ExpertDomainMeta,
  getExpertDomainMeta,
} from "../../utils/expertFieldPresentation";
import {
  DOMAIN_OPTIONS,
  JOBS_BY_DOMAIN_INDUSTRY,
  SKILLS_BY_JOB_ROLE,
} from "../../types/Journey";

interface SkillFormProps {
  onComplete: (data: {
    domain: string;
    subCategory: string;
    jobRole: string;
    skills: string[];
  }) => void;
  onBack: () => void;
}

type SkillJobRoleOption = {
  value: string;
  label: string;
  icon: string;
  desc?: string;
  keywords?: string;
  skillKey?: string;
};

const parseKeywords = (keywords?: string): string[] =>
  (keywords || "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword, index, array) => array.indexOf(keyword) === index);

const normalizeLookupValue = (value?: string | null): string =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const findStaticRoleMatch = (
  domain: string | null,
  industry: string | null,
  jobRole: string,
):
  | { value: string; label: string; icon: string; desc?: string }
  | undefined => {
  if (!domain) return undefined;

  const normalizedJobRole = normalizeLookupValue(jobRole);
  const domainRolesByIndustry = JOBS_BY_DOMAIN_INDUSTRY[domain] || {};
  const rolesInSelectedIndustry = industry
    ? domainRolesByIndustry[industry] || []
    : [];
  const rolesInSelectedDomain = Object.values(domainRolesByIndustry).flat();

  return [...rolesInSelectedIndustry, ...rolesInSelectedDomain].find((role) => {
    return (
      normalizeLookupValue(role.value) === normalizedJobRole ||
      normalizeLookupValue(role.label) === normalizedJobRole
    );
  });
};

const resolveRoleSkills = (role?: SkillJobRoleOption): string[] => {
  const lookupKeys = [role?.skillKey, role?.value, role?.label].filter(
    Boolean,
  ) as string[];

  for (const lookupKey of lookupKeys) {
    const mappedSkills = SKILLS_BY_JOB_ROLE[lookupKey];
    if (mappedSkills?.length) {
      return mappedSkills;
    }
  }

  return parseKeywords(role?.keywords);
};

const SkillForm: React.FC<SkillFormProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expertFields, setExpertFields] = useState<ExpertFieldResponse[]>([]);

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedJobRole, setSelectedJobRole] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState("");

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

  const domainOptions: ExpertDomainMeta[] = useMemo(() => {
    const allowedLabels = ["Công nghệ thông tin", "Thiết kế", "Kinh doanh"];
    return expertFields
      .map((field) => getExpertDomainMeta(field.domain))
      .filter(
        (meta, idx, self) =>
          allowedLabels.includes(meta.label) &&
          self.findIndex((m) => m.label === meta.label) === idx,
      );
  }, [expertFields]);

  const currentDomain = useMemo(() => {
    return expertFields.find((field) => field.domain === selectedDomain);
  }, [expertFields, selectedDomain]);

  // Step 2: industries/sub-categories for selected domain
  const currentIndustries = useMemo(() => {
    return (currentDomain?.industries || []).map((industry) => ({
      value: industry.industry,
      label: industry.industry,
    }));
  }, [currentDomain]);

  // Step 3: job roles filtered by (domain, industry)
  const currentJobRoles: SkillJobRoleOption[] = useMemo(() => {
    if (!currentDomain || !selectedIndustry) return [];

    const industry = currentDomain.industries.find(
      (item) => item.industry === selectedIndustry,
    );
    if (!industry) return [];

    return industry.roles.map((role) => {
      const staticMatch = findStaticRoleMatch(
        selectedDomain,
        selectedIndustry,
        role.jobRole,
      );
      const keywordHints = parseKeywords(role.keywords);

      return {
        value: role.jobRole,
        label: role.jobRole,
        icon: staticMatch?.icon || "💼",
        desc:
          staticMatch?.desc || keywordHints.slice(0, 2).join(", ") || undefined,
        keywords: role.keywords,
        skillKey: staticMatch?.value,
      };
    });
  }, [currentDomain, selectedDomain, selectedIndustry]);

  const selectedDomainMeta = useMemo(() => {
    return selectedDomain
      ? domainOptions.find((d) => d.value === selectedDomain)
      : undefined;
  }, [domainOptions, selectedDomain]);

  const selectedIndustryLabel = useMemo(() => {
    return (
      currentIndustries.find((i) => i.value === selectedIndustry)?.label || ""
    );
  }, [currentIndustries, selectedIndustry]);

  const selectedJobRoleMeta = useMemo(() => {
    return currentJobRoles.find((r) => r.value === selectedJobRole);
  }, [currentJobRoles, selectedJobRole]);

  // Step 4: predefined skills for selected job role
  const predefinedSkills = useMemo(() => {
    if (!selectedJobRoleMeta) return [];
    return resolveRoleSkills(selectedJobRoleMeta);
  }, [selectedJobRoleMeta]);

  const filteredPredefinedSkills = useMemo(() => {
    if (!skillSearch.trim()) return predefinedSkills;
    const normalizedQuery = skillSearch.trim().toLowerCase();
    return predefinedSkills.filter((skill) =>
      skill.toLowerCase().includes(normalizedQuery),
    );
  }, [predefinedSkills, skillSearch]);

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
    setSelectedIndustry(null);
    setSelectedJobRole(null);
    setSelectedSkills([]);
    setSkillSearch("");
  };

  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    setSelectedJobRole(null);
    setSelectedSkills([]);
    setSkillSearch("");
  };

  const handleJobRoleSelect = (role: string) => {
    setSelectedJobRole(role);
    const roleEntry = currentJobRoles.find((item) => item.value === role);
    const allSkills = resolveRoleSkills(roleEntry);
    setSelectedSkills(allSkills);
    setSkillSearch("");
  };

  const handleDeselectSkill = (skill: string) => {
    if (selectedSkills.length <= 1) return;
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const handleSelectSkill = (skill: string) => {
    // V3 Single-skill policy: override previous selection
    setSelectedSkills([skill]);
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const mapDomainToEnum = (domainStr: string) => {
    const meta = getExpertDomainMeta(domainStr);
    if (meta.label === "Công nghệ thông tin") return "IT";
    if (meta.label === "Thiết kế") return "DESIGN";
    if (meta.label === "Kinh doanh") return "BUSINESS";
    return "IT"; // Fallback to avoid breaking backend
  };

  const handleSubmit = () => {
    if (
      selectedDomain &&
      selectedIndustry &&
      selectedJobRole &&
      selectedSkills.length > 0
    ) {
      onComplete({
        domain: mapDomainToEnum(selectedDomain),
        subCategory: selectedIndustry,
        jobRole: selectedJobRole,
        skills: selectedSkills,
      });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedDomain;
      case 2:
        return !!selectedIndustry;
      case 3:
        return !!selectedJobRole;
      case 4:
        return selectedSkills.length > 0;
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
          Bạn muốn học kỹ năng trong lĩnh vực nào?
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

  // Step 2: Select Industry
  const renderStep2 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Chọn ngành chi tiết</h2>
        <p className="gsj-wizard-step__subtitle">
          {selectedDomainMeta?.label} — Bạn muốn học về ngành nào?
        </p>
      </div>
      <div className="gsj-subcategory-grid">
        {currentIndustries.map((ind) => (
          <button
            key={ind.value}
            type="button"
            className={`gsj-subcategory-card ${selectedIndustry === ind.value ? "gsj-subcategory-card--selected" : ""}`}
            onClick={() => handleIndustrySelect(ind.value)}
          >
            <span className="gsj-subcategory-card__label">{ind.label}</span>
            {selectedIndustry === ind.value && (
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
          {selectedDomainMeta?.label} &rsaquo; {selectedIndustryLabel} — Bạn
          hướng đến vị trí nào?
        </p>
      </div>
      {currentJobRoles.length === 0 ? (
        <div className="gsj-no-roles">
          Không tìm thấy vị trí cho ngành này. Vui lòng quay lại và chọn ngành
          khác.
        </div>
      ) : (
        <div className="gsj-job-grid">
          {currentJobRoles.map((role) => {
            const roleKeywords = parseKeywords(role.keywords);

            return (
              <button
                key={role.value}
                type="button"
                className={`gsj-job-card ${selectedJobRole === role.value ? "gsj-job-card--selected" : ""}`}
                onClick={() => handleJobRoleSelect(role.value)}
              >
                <div className="gsj-job-card__content">
                  <span className="gsj-job-card__eyebrow">
                    Vai trò chuyên môn
                  </span>
                  <span className="gsj-job-card__label">{role.label}</span>
                  <span className="gsj-job-card__desc">
                    {role.desc || selectedIndustryLabel}
                  </span>

                  {roleKeywords.length > 0 && (
                    <div className="gsj-job-card__keywords">
                      {roleKeywords.slice(0, 4).map((keyword) => (
                        <span
                          key={`${role.value}-${keyword}`}
                          className="gsj-job-card__keyword"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span className="gsj-job-card__icon-badge" aria-hidden="true">
                  {role.icon}
                </span>

                {selectedJobRole === role.value && (
                  <span className="gsj-job-card__check">
                    <Check size={16} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Step 4: Skill chips — pre-selected, user deselects known skills
  const renderStep4 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Chọn 1 kỹ năng phát triển chính</h2>
        <p className="gsj-wizard-step__subtitle">
          Trong phiên bản V3, mỗi Journey chỉ tập trung vào 1 kỹ năng cốt lõi. Hãy chọn kỹ năng bạn muốn master.
        </p>
      </div>

      <div className="gsj-selection-banner">
        <span className="gsj-selection-banner__item">
          {selectedDomainMeta?.label || "—"}
        </span>
        <span className="gsj-selection-banner__item">
          {selectedIndustryLabel || "—"}
        </span>
        <span className="gsj-selection-banner__item">
          {selectedJobRoleMeta?.label || "—"}
        </span>
      </div>

      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">
          Kỹ năng chuyên môn cho vị trí {selectedJobRoleMeta?.label}
          <span className="gsj-hint-text">
            {" "}
            — chọn 1 kỹ năng để bắt đầu hành trình
          </span>
        </h3>

        {predefinedSkills.length > 0 && (
          <div className="gsj-skill-picker-toolbar">
            <div className="gsj-search-input gsj-search-input--compact">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm kỹ năng..."
                value={skillSearch}
                onChange={(event) => setSkillSearch(event.target.value)}
              />
              {skillSearch && (
                <button type="button" onClick={() => setSkillSearch("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="gsj-hint-text gsj-hint-text--inline">
              Đã chọn: {selectedSkills.length > 0 ? selectedSkills[0] : "Chưa chọn"}
            </p>
          </div>
        )}

        <div className="gsj-skill-grid gsj-skill-grid--dense">
          {filteredPredefinedSkills.map((skill) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                className={`gsj-skill-chip ${isSelected ? "gsj-skill-chip--selected" : "gsj-skill-chip--deselected"}`}
                onClick={() =>
                  isSelected
                    ? handleDeselectSkill(skill)
                    : handleSelectSkill(skill)
                }
              >
                {isSelected ? <Check size={14} /> : <X size={14} />}
                {skill}
              </button>
            );
          })}
        </div>

        {predefinedSkills.length > 0 &&
          filteredPredefinedSkills.length === 0 && (
            <p className="gsj-skill-filter-empty">
              Không tìm thấy kỹ năng phù hợp với từ khóa &quot;{skillSearch}
              &quot;.
            </p>
          )}
      </div>

      {predefinedSkills.length === 0 && (
        <p className="gsj-hint-text">
          Không tìm thấy danh sách kỹ năng cho vị trí này. Vui lòng quay lại và
          chọn vị trí khác.
        </p>
      )}
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
            Không thể tải danh sách ngành nghề
          </h2>
          <p className="gsj-wizard-step__subtitle">{loadError}</p>
        </div>
        <div className="gsj-wizard-nav">
          <button
            type="button"
            className="gsj-btn gsj-btn--secondary"
            onClick={onBack}
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleRetry}
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  const stepLabels = ["Lĩnh vực", "Ngành", "Vị trí", "Kỹ năng"];

  return (
    <div className="gsj-skill-form">
      {/* Progress */}
      <div className="gsj-career-progress">
        <div className="gsj-career-progress__steps">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`gsj-career-progress__step ${step >= s ? "gsj-career-progress__step--active" : ""} ${step > s ? "gsj-career-progress__step--completed" : ""}`}
            >
              <div className="gsj-career-progress__step-dot">
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className="gsj-career-progress__step-label">
                {stepLabels[s - 1]}
              </span>
            </div>
          ))}
        </div>
        <div className="gsj-career-progress__bar">
          <div
            className="gsj-career-progress__bar-fill"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

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

        {step < 4 ? (
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Tiếp theo <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleSubmit}
            disabled={!canProceed()}
          >
            <Check size={16} /> Xác nhận lựa chọn
          </button>
        )}
      </div>
    </div>
  );
};

export default SkillForm;
