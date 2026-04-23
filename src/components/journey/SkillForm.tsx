import { useState, useCallback } from "react";
import { ArrowLeft, Search, Plus, X, Check } from "lucide-react";
import SkillAutoResolve from "../shared/SkillAutoResolve";

interface SkillFormProps {
  onComplete: (data: {
    domain: string;
    subCategory: string;
    jobRole: string;
    skills: string[];
  }) => void;
  onBack: () => void;
}

const mapDomainToEnum = (domain: string): string => {
  const upper = domain.toUpperCase();
  if (
    upper === "IT" ||
    upper.includes("INFORMATION TECHNOLOGY") ||
    upper.includes("CÔNG NGHỆ THÔNG TIN")
  )
    return "IT";
  if (
    upper === "BUSINESS" ||
    upper.includes("BUSINESS") ||
    upper.includes("KINH DOANH") ||
    upper.includes("MARKETING")
  )
    return "BUSINESS";
  if (
    upper === "DESIGN" ||
    upper.includes("DESIGN") ||
    upper.includes("THIẾT KẾ") ||
    upper.includes("SÁNG TẠO")
  )
    return "DESIGN";
  return upper;
};

const SkillForm: React.FC<SkillFormProps> = ({ onComplete, onBack }) => {
  const [skillInput, setSkillInput] = useState("");
  const [resolvedCareer, setResolvedCareer] = useState<{
    domain: string;
    industry: string;
    jobRole: string;
  } | null>(null);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const handleResolve = useCallback(
    (data: {
      domain: string;
      industry: string;
      jobRole: string;
      keywords?: string;
    }) => {
      setResolvedCareer({
        domain: mapDomainToEnum(data.domain),
        industry: data.industry,
        jobRole: data.jobRole,
      });
      const trimmed = skillInput.trim();
      if (trimmed) setSelectedSkills([trimmed]);
      setConfirmed(true);
    },
    [skillInput],
  );

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    setSelectedSkills([trimmed]);
    setCustomSkillInput("");
  };

  const canSubmit = resolvedCareer && selectedSkills.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      domain: resolvedCareer!.domain,
      subCategory: resolvedCareer!.industry,
      jobRole: resolvedCareer!.jobRole,
      skills: selectedSkills,
    });
  };

  return (
    <div className="gsj-skill-form">
      <div className="gsj-wizard-step">
        <div className="gsj-wizard-step__header">
          <h2 className="gsj-wizard-step__title">Nhập kỹ năng muốn học</h2>
          <p className="gsj-wizard-step__subtitle">
            Nhập tên kỹ năng — AI sẽ tự động xác định lĩnh vực và lộ trình phù
            hợp.
          </p>
        </div>

        <SkillAutoResolve
          skillInput={skillInput}
          onSkillChange={(val) => {
            setSkillInput(val);
            setResolvedCareer(null);
            setConfirmed(false);
            setSelectedSkills([]);
          }}
          onResolve={handleResolve}
          showManualFallback={false}
          onBack={onBack}
          label="Kỹ năng bạn muốn phát triển"
          description="Nhập bất kỳ kỹ năng nào — AI sẽ tự động gợi ý lộ trình phù hợp."
          placeholder="Ví dụ: React, Java Spring Boot, UI Design, Digital Marketing..."
          useAi={true}
        />

        {confirmed && resolvedCareer && (
          <div className="gsj-wizard-section" style={{ marginTop: 24 }}>
            <h3 className="gsj-wizard-section__title">
              Kỹ năng mục tiêu sẽ học
            </h3>
            <p className="gsj-hint-text gsj-hint-text--sm">
              Xác nhận kỹ năng chính bạn muốn học. Bạn có thể nhập tên khác nếu
              muốn.
            </p>

            {selectedSkills.length > 0 && (
              <div
                className="gsj-chip-list gsj-chip-list--wrap"
                style={{ marginBottom: 12 }}
              >
                {selectedSkills.map((skill) => (
                  <span key={skill} className="gsj-chip gsj-chip--selected">
                    <Check size={14} style={{ marginRight: 4 }} />
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSelectedSkills([])}
                      style={{ marginLeft: 4 }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="gsj-skill-input-wrapper">
              <div className="gsj-search-input">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Hoặc nhập tên kỹ năng khác..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                />
                {customSkillInput && (
                  <button type="button" onClick={() => setCustomSkillInput("")}>
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="gsj-btn gsj-btn--primary gsj-btn--sm"
                onClick={handleAddCustomSkill}
                disabled={!customSkillInput.trim()}
              >
                <Plus size={16} />
                Dùng kỹ năng này
              </button>
            </div>

            <p
              className="gsj-hint-text gsj-hint-text--sm"
              style={{ marginTop: 8 }}
            >
              Lộ trình: <strong>{resolvedCareer.domain}</strong> &rsaquo;{" "}
              {resolvedCareer.industry} &rsaquo; {resolvedCareer.jobRole}
            </p>
          </div>
        )}
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
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          <Check size={16} />
          Xác nhận kỹ năng
        </button>
      </div>
    </div>
  );
};

export default SkillForm;
