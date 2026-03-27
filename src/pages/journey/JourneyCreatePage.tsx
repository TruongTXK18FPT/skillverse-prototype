import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  Lightbulb,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import {
  GOAL_OPTIONS,
  JourneyType,
  LEVEL_OPTIONS,
  LANGUAGE_OPTIONS,
  DURATION_OPTIONS,
  StartJourneyRequest
} from '../../types/Journey';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import CareerForm from '../../components/journey/CareerForm';
import SkillForm from '../../components/journey/SkillForm';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import journeyService from '../../services/journeyService';
import { COMMON_SKILLS } from '../../types/domainExpertMapper';
import './../../styles/GSJJourney.css';

const TOTAL_STEPS = 3;

const JourneyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyType, setJourneyType] = useState<typeof JourneyType[keyof typeof JourneyType] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  const [formData, setFormData] = useState<StartJourneyRequest>({
    type: JourneyType.CAREER,
    domain: '',
    goal: '',
    level: 'BEGINNER',
    language: 'VI',
    duration: 'STANDARD',
    skills: []
  });

  const [skillInput, setSkillInput] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  // Available skill suggestions based on domain
  const skillSuggestions = journeyType && formData.domain
    ? COMMON_SKILLS[formData.domain] || []
    : [];

  const handleTypeSelect = (type: typeof JourneyType[keyof typeof JourneyType]) => {
    setJourneyType(type);
    setFormData((prev) => ({
      ...prev,
      type,
      domain: '',
      subCategory: '',
      industry: '',
      jobRole: '',
      goal: '',
      level: 'BEGINNER',
      skills: [],
      language: 'VI',
      duration: 'STANDARD'
    }));
    setCurrentStep(2);
    setSkillInput('');
    setSkillSearch('');
    setError(null);
  };

  const handleCareerComplete = (data: { domain: string; industry: string; jobRole: string }) => {
    setFormData((prev) => ({
      ...prev,
      domain: data.domain,
      industry: data.industry,
      jobRole: data.jobRole,
      subCategory: prev.subCategory || ''
    }));
    setCurrentStep(3);
    setError(null);
  };

  const handleSkillComplete = (data: { domain: string; subCategory: string; skills: string[] }) => {
    setFormData((prev) => ({
      ...prev,
      domain: data.domain,
      subCategory: data.subCategory,
      skills: data.skills
    }));
    setCurrentStep(3);
    setError(null);
  };

  const handleGoalSelect = (goal: string) => {
    setFormData((prev) => ({ ...prev, goal }));
  };

  const handleLevelSelect = (level: string) => {
    setFormData((prev) => ({ ...prev, level }));
  };

  const handleLanguageSelect = (language: string) => {
    setFormData((prev) => ({ ...prev, language }));
  };

  const handleDurationSelect = (duration: string) => {
    setFormData((prev) => ({ ...prev, duration }));
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills?.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), trimmed]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skill)
    }));
  };

  const handleAddSuggestedSkill = (skill: string) => {
    if (!formData.skills?.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill]
      }));
    }
  };

  const canSubmit = () => {
    return Boolean(
      formData.goal &&
      formData.level &&
      formData.language &&
      formData.duration
    );
  };

  const handleBack = () => {
    if (currentStep <= 1) {
      navigate('/journey');
      return;
    }
    setCurrentStep((prev) => prev - 1);
    if (currentStep === 2) {
      setJourneyType(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const journey = await journeyService.startJourney(formData);
      await journeyService.generateAssessmentTest(journey.id);
      navigate('/journey', { state: { autoOpenJourneyId: journey.id } });
    } catch (submitError) {
      console.error('Failed to create journey:', submitError);
      setError('Không thể tạo bài test lúc này. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Bạn muốn làm gì?</h2>
        <p className="gsj-wizard-step__subtitle">
          Chọn loại hành trình để Meowl tạo bài đánh giá phù hợp nhất.
        </p>
      </div>

      <div className="gsj-type-grid">
        <button
          type="button"
          className={`gsj-type-card ${journeyType === JourneyType.CAREER ? 'gsj-type-card--selected' : ''}`}
          onClick={() => handleTypeSelect(JourneyType.CAREER)}
        >
          <span className="gsj-type-card__icon">
            <Briefcase size={48} />
          </span>
          <span className="gsj-type-card__label">Định hướng nghề nghiệp</span>
          <span className="gsj-type-card__desc">
            Chọn lĩnh vực và vị trí mục tiêu để đánh giá mức độ sẵn sàng cho công việc bạn hướng tới.
          </span>
          {journeyType === JourneyType.CAREER && (
            <span className="gsj-type-card__check">
              <Check size={20} />
            </span>
          )}
        </button>

        <button
          type="button"
          className={`gsj-type-card ${journeyType === JourneyType.SKILL ? 'gsj-type-card--selected' : ''}`}
          onClick={() => handleTypeSelect(JourneyType.SKILL)}
        >
          <span className="gsj-type-card__icon">
            <Lightbulb size={48} />
          </span>
          <span className="gsj-type-card__label">Học kỹ năng mới</span>
          <span className="gsj-type-card__desc">
            Nhập nhóm kỹ năng muốn học để nhận quiz đầu vào và lộ trình luyện tập cá nhân hóa.
          </span>
          {journeyType === JourneyType.SKILL && (
            <span className="gsj-type-card__check">
              <Check size={20} />
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // Step 3: Goal + Level + Skills + Language + Duration — all in one page
  const renderStep3 = () => (
    <div className="gsj-wizard-step">
      {/* Mục tiêu */}
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Mục tiêu của bạn là gì?</h2>
        <p className="gsj-wizard-step__subtitle">
          Chọn mục tiêu chính để AI tạo bài test đúng trọng tâm.
        </p>
      </div>

      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Mục tiêu chính</h3>
        <div className="gsj-card-grid gsj-card-grid--2col">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-card ${formData.goal === option.value ? 'gsj-card--selected' : ''}`}
              onClick={() => handleGoalSelect(option.value)}
            >
              <span className="gsj-card__icon">{option.icon}</span>
              <span className="gsj-card__label">{option.label}</span>
              {formData.goal === option.value && (
                <span className="gsj-card__check">
                  <Check size={16} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Trình độ hiện tại */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Trình độ hiện tại</h3>
        <div className="gsj-segmented-control">
          {LEVEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-segmented-control__item ${formData.level === option.value ? 'gsj-segmented-control__item--active' : ''}`}
              onClick={() => handleLevelSelect(option.value)}
            >
              <span className="gsj-segmented-control__label">{option.label}</span>
              <span className="gsj-segmented-control__desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ngôn ngữ */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Ngôn ngữ bài test</h3>
        <div className="gsj-language-options">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-language-btn ${formData.language === option.value ? 'gsj-language-btn--active' : ''}`}
              onClick={() => handleLanguageSelect(option.value)}
            >
              {option.label}
              {formData.language === option.value && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Thời lượng */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Thời lượng bài test</h3>
        <div className="gsj-duration-options">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-duration-btn ${formData.duration === option.value ? 'gsj-duration-btn--active' : ''}`}
              onClick={() => handleDurationSelect(option.value)}
            >
              <span className="gsj-duration-btn__icon">{option.icon}</span>
              <span className="gsj-duration-btn__label">{option.label}</span>
              <span className="gsj-duration-btn__desc">{option.description}</span>
              {formData.duration === option.value && (
                <span className="gsj-duration-btn__check">
                  <Check size={14} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Kỹ năng đã có */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Kỹ năng bạn đã có (tùy chọn)</h3>
        <p className="gsj-hint-text gsj-hint-text--sm">
          Thêm kỹ năng bạn đã nắm vững để AI đánh giá chính xác hơn.
        </p>

        {formData.skills && formData.skills.length > 0 && (
          <div className="gsj-chip-list">
            {formData.skills.map((skill) => (
              <span key={skill} className="gsj-chip gsj-chip--removable">
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)}>
                  <X size={14} />
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
              placeholder="Nhập kỹ năng bạn đã biết..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
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
            onClick={handleAddSkill}
            disabled={!skillInput.trim()}
          >
            Thêm
          </button>
        </div>

        {skillSuggestions.length > 0 && (
          <div className="gsj-skill-grid">
            {skillSuggestions
              .filter((skill) => !formData.skills?.includes(skill))
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
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="gsj-page gsj-create-page">
        <div className="gsj-hud-loader">
          <div className="gsj-hud-loader__container">
            <div className="gsj-hud-loader__corners">
              <div className="gsj-hud-loader__corner gsj-hud-loader__corner--tl"></div>
              <div className="gsj-hud-loader__corner gsj-hud-loader__corner--tr"></div>
              <div className="gsj-hud-loader__corner gsj-hud-loader__corner--bl"></div>
              <div className="gsj-hud-loader__corner gsj-hud-loader__corner--br"></div>
            </div>
            <div className="gsj-hud-loader__content">
              <MeowlKuruLoader
                text="MEOWL ĐANG CHUẨN BỊ CHO BẠN..."
                layout="vertical"
                className="gsj-hud-loader__meowl"
              />
              <div className="gsj-hud-loader__status">
                <div className="gsj-hud-loader__text-main">AI ĐANG TẠO BÀI TEST PHÙ HỢP</div>
                <div className="gsj-hud-loader__scan-line"></div>
                <div className="gsj-hud-loader__text-sub">Vui lòng chờ trong giây lát...</div>
              </div>
            </div>
          </div>
          <div className="gsj-hud-loader__overlay"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="gsj-page gsj-create-page">
      <div className="gsj-create-bg">
        <div className="gsj-create-bg__circle gsj-create-bg__circle--1"></div>
        <div className="gsj-create-bg__circle gsj-create-bg__circle--2"></div>
        <div className="gsj-create-bg__circle gsj-create-bg__circle--3"></div>
      </div>

      <div className="gsj-container">
        <div className="gsj-create-header">
          <button type="button" className="gsj-create-header__back" onClick={handleBack}>
            <ArrowLeft size={20} />
          </button>
          <div className="gsj-create-header__content">
            <h1 className="gsj-create-header__title">
              <Sparkles size={24} />
              Tạo bài test đánh giá
            </h1>
            <p className="gsj-create-header__subtitle">
              Trả lời vài bước ngắn để AI tạo quiz đầu vào sát với nhu cầu của bạn.
            </p>
          </div>
        </div>

        <div className="gsj-progress">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`gsj-progress__step ${currentStep >= step ? 'gsj-progress__step--active' : ''} ${currentStep > step ? 'gsj-progress__step--completed' : ''}`}
            >
              <div className="gsj-progress__step-number">
                {currentStep > step ? <Check size={14} /> : step}
              </div>
              <span className="gsj-progress__step-label">
                {step === 1 && 'Chọn loại'}
                {step === 2 && (journeyType === JourneyType.CAREER ? 'Nghề nghiệp' : 'Kỹ năng')}
                {step === 3 && 'Cấu hình'}
              </span>
            </div>
          ))}
          <div className="gsj-progress__bar">
            <div
              className="gsj-progress__bar-fill"
              style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="gsj-alert gsj-alert--error gsj-mb-16">
            {error}
            <button type="button" onClick={() => setError(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="gsj-wizard-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && journeyType === JourneyType.CAREER && (
            <CareerForm onComplete={handleCareerComplete} onBack={handleBack} />
          )}
          {currentStep === 2 && journeyType === JourneyType.SKILL && (
            <SkillForm onComplete={handleSkillComplete} onBack={handleBack} />
          )}
          {currentStep === 3 && renderStep3()}

          {currentStep !== 2 && (
            <div className="gsj-wizard-nav">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="gsj-btn gsj-btn--secondary"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                  Quay lại
                </button>
              )}

              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  className="gsj-btn gsj-btn--primary"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                >
                  Tiếp theo
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" className="gsj-btn gsj-btn--primary" disabled={!canSubmit()}>
                  <Sparkles size={16} />
                  Tạo bài test cho tôi
                </button>
              )}
            </div>
          )}
        </form>

        <MeowlGuide currentPage="journey/create" />
      </div>
    </div>
  );
};

export default JourneyCreatePage;
