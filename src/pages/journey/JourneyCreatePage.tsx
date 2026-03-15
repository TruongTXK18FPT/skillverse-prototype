import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Check, ChevronRight, Search, X,
  Briefcase, Lightbulb
} from 'lucide-react';
import {
  StartJourneyRequest,
  JourneyType,
  DOMAIN_OPTIONS,
  SUB_CATEGORIES,
  GOAL_OPTIONS,
  LEVEL_OPTIONS,
  LANGUAGE_OPTIONS,
  DURATION_OPTIONS,
  JOBS_BY_DOMAIN,
  DomainType
} from '../../types/Journey';
import journeyService from '../../services/journeyService';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import CareerForm from '../../components/journey/CareerForm';
import SkillForm from '../../components/journey/SkillForm';
import './../../styles/GSJJourney.css';

const JourneyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyType, setJourneyType] = useState<JourneyType | null>(null);

  // Form state
  const [formData, setFormData] = useState<StartJourneyRequest>({
    type: JourneyType.CAREER,
    domain: '',
    subCategory: '',
    jobRole: '',
    goal: '',
    level: 'BEGINNER',
    skills: [],
    language: 'VI',
    duration: 'STANDARD'
  });

  // Skill search for career path
  const [skillSearch, setSkillSearch] = useState('');
  const availableSkills = formData.domain ? JOBS_BY_DOMAIN[formData.domain]?.map(j => j.label) || [] : [];

  const handleTypeSelect = (type: JourneyType) => {
    setJourneyType(type);
    setFormData(prev => ({ ...prev, type }));
    setCurrentStep(2);
  };

  const handleCareerComplete = (data: { domain: string; subCategory: string; jobRole: string }) => {
    setFormData(prev => ({
      ...prev,
      domain: data.domain,
      subCategory: data.subCategory,
      jobRole: data.jobRole
    }));
    setCurrentStep(3);
  };

  const handleSkillComplete = (data: { domain: string; subCategory: string; skills: string[] }) => {
    setFormData(prev => ({
      ...prev,
      domain: data.domain,
      subCategory: data.subCategory,
      skills: data.skills
    }));
    setCurrentStep(3);
  };

  const handleGoalSelect = (goal: string) => {
    setFormData(prev => ({ ...prev, goal }));
  };

  const handleLevelSelect = (level: string) => {
    setFormData(prev => ({ ...prev, level }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => {
      const skills = prev.skills || [];
      if (skills.includes(skill)) {
        return { ...prev, skills: skills.filter(s => s !== skill) };
      }
      return { ...prev, skills: [...skills, skill] };
    });
  };

  const handleLanguageSelect = (language: string) => {
    setFormData(prev => ({ ...prev, language }));
  };

  const handleDurationSelect = (duration: string) => {
    setFormData(prev => ({ ...prev, duration }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return journeyType !== null;
      case 2:
        return true; // CareerForm/SkillForm handles its own validation
      case 3:
        return !!formData.goal;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      if (currentStep === 2) {
        setJourneyType(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create journey
      const journey = await journeyService.startJourney(formData);

      // 2. Generate assessment test
      await journeyService.generateAssessmentTest(journey.id);

      // 3. Navigate to journey page where user can take the test
      navigate('/journey');
    } catch (error) {
      console.error('Failed to create journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDomainLabel = () => {
    const domain = DOMAIN_OPTIONS.find(d => d.value === formData.domain);
    return domain?.label || formData.domain;
  };

  const getGoalLabel = () => {
    const goal = GOAL_OPTIONS.find(g => g.value === formData.goal);
    return goal?.label || formData.goal;
  };

  const getLevelLabel = () => {
    const level = LEVEL_OPTIONS.find(l => l.value === formData.level);
    return level?.label || formData.level;
  };

  const getDurationLabel = () => {
    const duration = DURATION_OPTIONS.find(d => d.value === formData.duration);
    return duration?.description || '';
  };

  const getSubCategoryLabel = () => {
    if (!formData.domain || !formData.subCategory) return '';
    const subs = SUB_CATEGORIES[formData.domain];
    if (!subs) return formData.subCategory;
    const sub = subs.find(s => s.value === formData.subCategory);
    return sub?.label || formData.subCategory;
  };

  // Render Step 1 - Type Selection
  const renderStep1 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Bạn muốn làm gì?</h2>
        <p className="gsj-wizard-step__subtitle">Chọn loại đánh giá phù hợp với bạn</p>
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
            Chọn ngành và vị trí công việc để đánh giá kỹ năng và nhận lộ trình phát triển sự nghiệp
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
            Nhập kỹ năng cụ thể bạn muốn học để nhận bài đánh giá và lộ trình học tập
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

  // Render Step 3 - Goal + Level
  const renderStep3 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Mục tiêu của bạn là gì?</h2>
        <p className="gsj-wizard-step__subtitle">Chọn mục tiêu và đánh giá trình độ của bạn</p>
      </div>

      {/* Goal Selection */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Mục tiêu</h3>
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

      {/* Level Selection */}
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

      {/* Known Skills (for career path) */}
      {journeyType === JourneyType.CAREER && (
        <div className="gsj-wizard-section">
          <h3 className="gsj-wizard-section__title">Kỹ năng bạn đã có (tùy chọn)</h3>

          {formData.skills && formData.skills.length > 0 && (
            <div className="gsj-chip-list">
              {formData.skills.map((skill) => (
                <span key={skill} className="gsj-chip gsj-chip--removable">
                  {skill}
                  <button type="button" onClick={() => handleSkillToggle(skill)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="gsj-search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm kỹ năng..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
            />
          </div>

          <div className="gsj-skill-grid">
            {availableSkills
              .filter(skill => skill.toLowerCase().includes(skillSearch.toLowerCase()))
              .filter(skill => !(formData.skills || []).includes(skill))
              .slice(0, 10)
              .map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className="gsj-skill-chip"
                  onClick={() => handleSkillToggle(skill)}
                >
                  + {skill}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Step 4 - Test Configuration + Summary
  const renderStep4 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Cấu hình bài test</h2>
        <p className="gsj-wizard-step__subtitle">Chọn ngôn ngữ và thời lượng bài test</p>
      </div>

      {/* Language Selection */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Ngôn ngữ bài test</h3>
        <div className="gsj-button-group">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-button-group__btn ${formData.language === option.value ? 'gsj-button-group__btn--active' : ''}`}
              onClick={() => handleLanguageSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selection */}
      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">Thời lượng bài test</h3>
        <div className="gsj-card-grid gsj-card-grid--3col">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-card ${formData.duration === option.value ? 'gsj-card--selected' : ''}`}
              onClick={() => handleDurationSelect(option.value)}
            >
              <span className="gsj-card__icon">{option.icon}</span>
              <span className="gsj-card__label">{option.label}</span>
              <span className="gsj-card__desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="gsj-wizard-summary">
        <h3 className="gsj-wizard-summary__title">Tóm tắt</h3>
        <div className="gsj-wizard-summary__content">
          <div className="gsj-wizard-summary__item">
            <span className="gsj-wizard-summary__label">Loại:</span>
            <span className="gsj-wizard-summary__value">
              {journeyType === JourneyType.CAREER ? 'Định hướng nghề nghiệp' : 'Học kỹ năng'}
            </span>
          </div>
          <div className="gsj-wizard-summary__item">
            <span className="gsj-wizard-summary__label">Lĩnh vực:</span>
            <span className="gsj-wizard-summary__value">{getDomainLabel()}</span>
          </div>
          {formData.subCategory && (
            <div className="gsj-wizard-summary__item">
              <span className="gsj-wizard-summary__label">Ngành:</span>
              <span className="gsj-wizard-summary__value">{getSubCategoryLabel()}</span>
            </div>
          )}
          {journeyType === JourneyType.CAREER && formData.jobRole && (
            <div className="gsj-wizard-summary__item">
              <span className="gsj-wizard-summary__label">Vị trí:</span>
              <span className="gsj-wizard-summary__value">{formData.jobRole}</span>
            </div>
          )}
          {journeyType === JourneyType.SKILL && formData.skills && formData.skills.length > 0 && (
            <div className="gsj-wizard-summary__item">
              <span className="gsj-wizard-summary__label">Kỹ năng:</span>
              <span className="gsj-wizard-summary__value">{formData.skills.join(', ')}</span>
            </div>
          )}
          <div className="gsj-wizard-summary__item">
            <span className="gsj-wizard-summary__label">Mục tiêu:</span>
            <span className="gsj-wizard-summary__value">{getGoalLabel()}</span>
          </div>
          <div className="gsj-wizard-summary__item">
            <span className="gsj-wizard-summary__label">Level:</span>
            <span className="gsj-wizard-summary__value">{getLevelLabel()}</span>
          </div>
          <div className="gsj-wizard-summary__item">
            <span className="gsj-wizard-summary__label">Thời lượng:</span>
            <span className="gsj-wizard-summary__value">{getDurationLabel()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading Screen
  if (loading) {
    return (
      <div className="gsj-page gsj-create-page">
        <div className="gsj-loading-screen">
          <div className="gsj-loading-screen__icon">
            <Sparkles size={48} className="gsj-spinner" />
          </div>
          <h2 className="gsj-loading-screen__title">AI đang tạo bài test phù hợp với bạn...</h2>
          <p className="gsj-loading-screen__subtitle">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gsj-page gsj-create-page">
      {/* Background decorations */}
      <div className="gsj-create-bg">
        <div className="gsj-create-bg__circle gsj-create-bg__circle--1"></div>
        <div className="gsj-create-bg__circle gsj-create-bg__circle--2"></div>
        <div className="gsj-create-bg__circle gsj-create-bg__circle--3"></div>
      </div>

      <div className="gsj-container">
        {/* Header */}
        <div className="gsj-create-header">
          <button className="gsj-create-header__back" onClick={() => navigate('/journey')}>
            <ArrowLeft size={20} />
          </button>
          <div className="gsj-create-header__content">
            <h1 className="gsj-create-header__title">
              <Sparkles size={24} />
              Tạo bài test đánh giá
            </h1>
            <p className="gsj-create-header__subtitle">
              Trả lời một số câu hỏi để AI tạo bài test phù hợp với bạn
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="gsj-progress">
          {[1, 2, 3, 4].map((step) => (
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
                {step === 3 && 'Mục tiêu'}
                {step === 4 && 'Cấu hình'}
              </span>
            </div>
          ))}
          <div className="gsj-progress__bar">
            <div
              className="gsj-progress__bar-fill"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="gsj-wizard-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && journeyType === JourneyType.CAREER && (
            <CareerForm
              onComplete={handleCareerComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 2 && journeyType === JourneyType.SKILL && (
            <SkillForm
              onComplete={handleSkillComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
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

              {currentStep < 4 ? (
                <button
                  type="button"
                  className="gsj-btn gsj-btn--primary"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Tiếp theo
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="gsj-btn gsj-btn--primary"
                >
                  <Sparkles size={16} />
                  Tạo bài test cho tôi
                </button>
              )}
            </div>
          )}
        </form>

        {/* Meowl Helper */}
        <MeowlGuide currentPage="journey/create" />
      </div>
    </div>
  );
};

export default JourneyCreatePage;
