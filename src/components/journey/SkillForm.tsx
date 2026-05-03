import { useState, useCallback } from "react";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
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
            Nhập tên kỹ năng — hệ thống sẽ tự động xác định lĩnh vực và lộ trình phù
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
          description="Nhập bất kỳ kỹ năng nào — smart search sẽ tự động gợi ý lộ trình phù hợp."
          placeholder="Ví dụ: React, Java Spring Boot, UI Design, Digital Marketing..."
          useAi={true}
        />

        {confirmed && resolvedCareer && (
          <div className="gsj-wizard-section gsj-target-summary" style={{ marginTop: 24 }}>
            <div className="gsj-target-summary__title">Bạn đã chọn:</div>

            <div className="gsj-target-summary__content">
              {/* Left: Skill */}
              <div className="gsj-target-summary__group">
                <span className="gsj-target-summary__label">Kỹ năng:</span>
                <span className="gsj-chip gsj-chip--selected gsj-target-summary__chip">
                  <Check size={14} />
                  {selectedSkills[0] || "Chưa chọn"}
                </span>
              </div>

              {/* Right: Career Path */}
              <div className="gsj-target-summary__group">
                <span className="gsj-target-summary__label">Ngành:</span>
                <div className="gsj-target-summary__path">
                  <span>{resolvedCareer.domain}</span>
                  <ChevronRight size={12} className="gsj-target-summary__path-separator" />
                  <span>{resolvedCareer.industry}</span>
                  <ChevronRight size={12} className="gsj-target-summary__path-separator" />
                  <strong className="gsj-target-summary__role">{resolvedCareer.jobRole}</strong>
                </div>
              </div>
            </div>
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
