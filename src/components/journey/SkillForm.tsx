import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { getExpertFields, ExpertFieldResponse } from '../../services/expertPromptService';
import { ExpertDomainMeta, getExpertDomainMeta } from '../../utils/expertFieldPresentation';

const SKILL_SUGGESTIONS_BY_DOMAIN_LABEL: Record<string, string[]> = {
  'Công nghệ thông tin': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git'],
  'Thiết kế': ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping'],
  'Kinh doanh': ['Digital Marketing', 'Sales', 'Project Management', 'Analytics'],
  'Kỹ thuật': ['AutoCAD', 'SolidWorks', 'MATLAB', 'Production Planning'],
  'Y tế & Sức khỏe': ['Patient Care', 'Medical Terminology', 'Clinical Procedures'],
  'Giáo dục': ['Instructional Design', 'Curriculum Development', 'Teaching'],
  'Logistics': ['Supply Chain Management', 'Warehouse Operations', 'Inventory Management'],
  'Pháp luật': ['Contract Drafting', 'Legal Research', 'Compliance'],
  'Nghệ thuật': ['Photography', 'Video Editing', 'Illustration', '3D Modeling'],
  'Dịch vụ': ['Customer Service', 'Event Planning', 'Hospitality Management'],
  'Cộng đồng': ['Community Management', 'Fundraising', 'Volunteer Coordination'],
  'Nông nghiệp & Môi trường': ['Sustainable Agriculture', 'Environmental Assessment', 'Water Management'],
};

const getSuggestedSkills = (domainLabel?: string) => {
  if (!domainLabel) return [];
  return SKILL_SUGGESTIONS_BY_DOMAIN_LABEL[domainLabel] || [];
};

const getDomainLabel = (domain: string) => getExpertDomainMeta(domain).label;

interface SkillFormProps {
  onComplete: (data: { domain: string; subCategory: string; skills: string[] }) => void;
  onBack: () => void;
}

const SkillForm: React.FC<SkillFormProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expertFields, setExpertFields] = useState<ExpertFieldResponse[]>([]);

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getExpertFields();
        setExpertFields(data || []);
      } catch (error) {
        console.error('Failed to load expert fields:', error);
        setLoadError('Không tải được danh sách ngành nghề. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, []);

  const domainOptions: ExpertDomainMeta[] = useMemo(() => {
    return expertFields.map(field => getExpertDomainMeta(field.domain));
  }, [expertFields]);

  const currentDomain = useMemo(() => {
    return expertFields.find(field => field.domain === selectedDomain);
  }, [expertFields, selectedDomain]);

  const currentSubCategories = useMemo(() => {
    return (currentDomain?.industries || []).map(industry => ({
      value: industry.industry,
      label: industry.industry,
    }));
  }, [currentDomain]);

  const suggestedSkills = useMemo(() => {
    return getSuggestedSkills(selectedDomain ? getDomainLabel(selectedDomain) : undefined);
  }, [selectedDomain]);

  const selectedDomainMeta = useMemo(() => {
    return selectedDomain ? domainOptions.find((domain) => domain.value === selectedDomain) : undefined;
  }, [domainOptions, selectedDomain]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getExpertFields();
      setExpertFields(data || []);
    } catch (error) {
      console.error('Failed to load expert fields:', error);
      setLoadError('Không tải được danh sách ngành nghề. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setSelectedSubCategory(null);
    setCustomSkills([]);
    setSkillInput('');
  };

  const handleSubCategorySelect = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
  };

  const handleAddCustomSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !customSkills.includes(trimmed)) {
      setCustomSkills([...customSkills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setCustomSkills(customSkills.filter(s => s !== skill));
  };

  const handleAddSuggestedSkill = (skill: string) => {
    if (!customSkills.includes(skill)) {
      setCustomSkills([...customSkills, skill]);
    }
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
    if (selectedDomain && selectedSubCategory && customSkills.length > 0) {
      onComplete({
        domain: selectedDomain,
        subCategory: selectedSubCategory,
        skills: customSkills
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
        return customSkills.length > 0;
      default:
        return false;
    }
  };

  // Step 1: Select Domain
  const renderStep1 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Chọn lĩnh vực</h2>
        <p className="gsj-wizard-step__subtitle">Bạn muốn học kỹ năng trong lĩnh vực nào?</p>
      </div>

      <div className="gsj-domain-grid">
        {domainOptions.map((domain) => (
          <button
            key={domain.value}
            type="button"
            className={`gsj-domain-card ${selectedDomain === domain.value ? 'gsj-domain-card--selected' : ''}`}
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
              <span className="gsj-domain-card__desc">{domain.description}</span>
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
          {domainOptions.find(d => d.value === selectedDomain)?.label} - Bạn muốn học về ngành nào?
        </p>
      </div>

      <div className="gsj-subcategory-grid">
        {currentSubCategories.map((sub) => (
          <button
            key={sub.value}
            type="button"
            className={`gsj-subcategory-card ${selectedSubCategory === sub.value ? 'gsj-subcategory-card--selected' : ''}`}
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

  // Step 3: Input Skills
  const renderStep3 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Nhập kỹ năng</h2>
        <p className="gsj-wizard-step__subtitle">
          Nhập các kỹ năng bạn muốn học trong ngành {currentSubCategories.find(s => s.value === selectedSubCategory)?.label}
        </p>
      </div>

      <div className="gsj-selection-banner">
        <span className="gsj-selection-banner__item">{selectedDomainMeta?.label || 'Chưa chọn lĩnh vực'}</span>
        <span className="gsj-selection-banner__item">{currentSubCategories.find(s => s.value === selectedSubCategory)?.label || 'Chưa chọn ngành'}</span>
      </div>

      {/* Custom skill input */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Nhập kỹ năng</h3>
        <div className="gsj-skill-input-wrapper">
          <div className="gsj-search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Nhập kỹ năng muốn học..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
            />
            {skillInput && (
              <button type="button" onClick={() => setSkillInput('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="gsj-btn gsj-btn--primary gsj-btn--sm"
            onClick={handleAddCustomSkill}
            disabled={!skillInput.trim()}
          >
            Thêm
          </button>
        </div>

        {/* Added skills display */}
        {customSkills.length > 0 && (
          <div className="gsj-chip-list">
            {customSkills.map((skill) => (
              <span key={skill} className="gsj-chip gsj-chip--removable">
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested skills */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Gợi ý kỹ năng phổ biến</h3>
        <div className="gsj-skill-grid">
          {suggestedSkills
            .filter(skill => !customSkills.includes(skill))
            .slice(0, 12)
            .map((skill) => (
              <button
                key={skill}
                type="button"
                className="gsj-skill-chip"
                onClick={() => handleAddSuggestedSkill(skill)}
              >
                + {skill}
              </button>
            ))}
        </div>
      </div>

      {customSkills.length === 0 && (
        <p className="gsj-hint-text">
          Nhập ít nhất 1 kỹ năng bạn muốn học hoặc chọn từ gợi ý bên dưới
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="gsj-wizard-step">
        <div className="gsj-wizard-step__header">
          <h2 className="gsj-wizard-step__title">Đang tải dữ liệu nghề nghiệp...</h2>
          <p className="gsj-wizard-step__subtitle">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="gsj-wizard-step">
        <div className="gsj-wizard-step__header">
          <h2 className="gsj-wizard-step__title">Không thể tải danh sách ngành nghề</h2>
          <p className="gsj-wizard-step__subtitle">{loadError}</p>
        </div>
        <div className="gsj-wizard-nav">
          <button type="button" className="gsj-btn gsj-btn--secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <button type="button" className="gsj-btn gsj-btn--primary" onClick={handleRetry}>
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gsj-skill-form">
      {/* Progress */}
      <div className="gsj-career-progress">
        <div className="gsj-career-progress__steps">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`gsj-career-progress__step ${step >= s ? 'gsj-career-progress__step--active' : ''} ${step > s ? 'gsj-career-progress__step--completed' : ''}`}
            >
              <div className="gsj-career-progress__step-dot">
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className="gsj-career-progress__step-label">
                {s === 1 ? 'Lĩnh vực' : s === 2 ? 'Ngành' : 'Kỹ năng'}
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
          {step === 1 ? 'Quay lại' : 'Trước đó'}
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

export default SkillForm;
