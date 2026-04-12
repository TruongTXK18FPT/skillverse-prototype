import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  Lightbulb,
  Search,
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
import TicTacToeGame from '../../components/game/tic-tac-toe/TicTacToeGame';
import journeyService from '../../services/journeyService';
import { getExpertDomainMeta } from '../../utils/expertFieldPresentation';
import './../../styles/GSJJourney.css';

const parseRoleKeywords = (keywords?: string): string[] => {
  if (!keywords) return [];
  return keywords
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
    .filter((k, idx, arr) => arr.indexOf(k) === idx);
};

const SKILL_SUGGESTIONS_BY_DOMAIN: Record<string, string[]> = {
  'Information Technology': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git'],
  'Thiết kế – Sáng tạo – Nội dung': ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping'],
  'Kinh doanh – Marketing – Quản trị': ['Digital Marketing', 'Sales', 'Project Management', 'Analytics'],
  'Kỹ thuật – Công nghiệp – Sản xuất': ['AutoCAD', 'SolidWorks', 'MATLAB', 'Production Planning'],
  Healthcare: ['Patient Care', 'Medical Terminology', 'Clinical Procedures'],
  'Education – Đào tạo – EdTech': ['Instructional Design', 'Curriculum Development', 'Teaching'],
  'Logistics – Chuỗi cung ứng – Xuất nhập khẩu': ['Supply Chain Management', 'Warehouse Operations', 'Inventory Management'],
  'Legal & Public Administration': ['Contract Drafting', 'Legal Research', 'Compliance'],
  'Arts & Entertainment': ['Photography', 'Video Editing', 'Illustration', '3D Modeling'],
  'Service & Hospitality': ['Customer Service', 'Event Planning', 'Hospitality Management'],
  'Công tác xã hội – Dịch vụ cộng đồng – Tổ chức phi lợi nhuận': ['Community Management', 'Fundraising', 'Volunteer Coordination'],
  'Agriculture – Environment': ['Sustainable Agriculture', 'Environmental Assessment', 'Water Management'],
};

const getDomainSkillSuggestions = (domain?: string) => {
  if (!domain) return [];
  return SKILL_SUGGESTIONS_BY_DOMAIN[domain] || [];
};

const mergeUniqueSkills = (a: string[], b: string[]) => {
  const merged = [...a, ...b];
  return merged.filter((s, idx) => merged.indexOf(s) === idx);
};


const TOTAL_STEPS = 3;
const JOURNEY_CREATE_GAME_DELAY_MS = 8000;

const JourneyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLoadingGame, setShowLoadingGame] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyType, setJourneyType] = useState<typeof JourneyType[keyof typeof JourneyType] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingGame(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowLoadingGame(true);
    }, JOURNEY_CREATE_GAME_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
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

  // Available skill suggestions from selected career role keywords + domain fallback
  const skillSuggestions = (() => {
    const fromRole = parseRoleKeywords(formData.roleKeywords);
    const fromDomain = getDomainSkillSuggestions(formData.domain);
    return mergeUniqueSkills(fromRole, fromDomain);
  })();

  const selectedGoal = GOAL_OPTIONS.find((option) => option.value === formData.goal);
  const selectedLevel = LEVEL_OPTIONS.find((option) => option.value === formData.level);
  const selectedLanguage = LANGUAGE_OPTIONS.find((option) => option.value === formData.language);
  const selectedDuration = DURATION_OPTIONS.find((option) => option.value === formData.duration);
  const domainMeta = formData.domain ? getExpertDomainMeta(formData.domain) : null;
  const journeyTypeLabel = journeyType === JourneyType.CAREER ? 'Định hướng nghề nghiệp' : journeyType === JourneyType.SKILL ? 'Nâng cấp kỹ năng' : 'Chưa chọn';

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
    setError(null);
  };

  const handleCareerComplete = (data: { domain: string; industry: string; jobRole: string; roleKeywords?: string }) => {
    setFormData((prev) => ({
      ...prev,
      domain: data.domain,
      industry: data.industry,
      jobRole: data.jobRole,
      subCategory: prev.subCategory || '',
      roleKeywords: data.roleKeywords
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
        <h2 className="gsj-wizard-step__title">Chọn loại hành trình</h2>
        <p className="gsj-wizard-step__subtitle">
          Mỗi lựa chọn sẽ mở ra bộ câu hỏi đầu vào và roadmap khác nhau. Chọn đúng mục đích để kết quả sát với nhu cầu của bạn.
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
            Chọn lĩnh vực, ngành và vị trí mục tiêu để kiểm tra mức độ sẵn sàng trước khi đi theo một hướng nghề nghiệp cụ thể.
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
            Chọn nhóm kỹ năng bạn muốn tập trung để nhận bài đánh giá đầu vào và kế hoạch luyện tập phù hợp.
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
        <h2 className="gsj-wizard-step__title">Cấu hình bài đánh giá</h2>
        <p className="gsj-wizard-step__subtitle">
          Hoàn thiện các lựa chọn để hệ thống tạo bài đánh giá phù hợp với mục tiêu và trình độ của bạn.
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
        <div className={`gsj-hud-loader ${showLoadingGame ? 'gsj-hud-loader--split' : ''}`}>
          <div className="gsj-hud-loader__shell">
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

                {showLoadingGame && (
                  <p className="gsj-hud-loader__game-helper">
                    Hệ thống đang xử lý lâu hơn dự kiến. Chơi một ván caro với Meowl trong lúc chờ nhé.
                  </p>
                )}
              </div>
            </div>

            <aside className="gsj-hud-loader__game-pane" aria-hidden={!showLoadingGame}>
              {showLoadingGame && (
                <>
                  <header className="gsj-hud-loader__game-header">
                    <span className="gsj-hud-loader__game-eyebrow">MINI GAME KHI CHỜ</span>
                    <h3>MEOWL TIC-TAC-TOE</h3>
                  </header>
                  <div className="gsj-hud-loader__game-body">
                    <TicTacToeGame mode="embedded" />
                  </div>
                </>
              )}
            </aside>
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

      <div className="gsj-container gsj-create-shell">
        <div className="gsj-create-main">
          <div className="gsj-create-header">
            <button type="button" className="gsj-create-header__back" onClick={handleBack}>
              <ArrowLeft size={20} />
            </button>
            <div className="gsj-create-header__content">
              <h1 className="gsj-create-header__title">
                <Briefcase size={24} />
                Tạo bài test đánh giá
              </h1>
              <p className="gsj-create-header__subtitle">
                Hoàn thiện thông tin theo từng bước để hệ thống tạo đề đầu vào đúng trọng tâm và đúng số lượng câu hỏi bạn mong muốn.
              </p>
            </div>
          </div>

          <section className="gsj-create-overview">
            <div className="gsj-create-overview__highlights">
              <span className="gsj-create-overview__chip">Bước {currentStep}/{TOTAL_STEPS}</span>
              <span className="gsj-create-overview__chip">{journeyTypeLabel}</span>
              {domainMeta && <span className="gsj-create-overview__chip">{domainMeta.label}</span>}
            </div>
          </section>

          <div className="gsj-progress gsj-progress--framed">
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

          <form onSubmit={handleSubmit} className="gsj-wizard-form gsj-wizard-form--framed">
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
                    <ChevronRight size={16} />
                    Tạo bài test cho tôi
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        <aside className="gsj-create-sidebar">
          <section className="gsj-create-sidecard">
            <h3 className="gsj-create-sidecard__title">Thông tin đang chọn</h3>
            <div className="gsj-create-summary-list">
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Loại hành trình</span>
                <strong>{journeyTypeLabel}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Lĩnh vực</span>
                <strong>{domainMeta?.label || 'Chưa chọn'}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Ngành / nhóm kỹ năng</span>
                <strong>{formData.industry || formData.subCategory || 'Chưa chọn'}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Vai trò / kỹ năng</span>
                <strong>{formData.jobRole || (formData.skills && formData.skills.length > 0 ? `${formData.skills.length} kỹ năng đã chọn` : 'Chưa chọn')}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Mục tiêu</span>
                <strong>{selectedGoal?.label || 'Chưa chọn'}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Trình độ hiện tại</span>
                <strong>{selectedLevel?.label || 'Chưa chọn'}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Ngôn ngữ / thời lượng</span>
                <strong>
                  {selectedLanguage?.label || 'Chưa chọn'}
                  {' · '}
                  {selectedDuration?.label || 'Chưa chọn'}
                </strong>
              </div>
            </div>
          </section>

          <section className="gsj-create-sidecard">
            <h3 className="gsj-create-sidecard__title">Cách hoạt động</h3>
            <div className="gsj-create-process">
              <div className="gsj-create-process__item">
                <span className="gsj-create-process__step">1</span>
                <div>
                  <strong>Chọn đúng bối cảnh</strong>
                  <p>Lĩnh vực, ngành và vai trò hoặc nhóm kỹ năng sẽ quyết định ngân hàng câu hỏi và hướng đánh giá.</p>
                </div>
              </div>
              <div className="gsj-create-process__item">
                <span className="gsj-create-process__step">2</span>
                <div>
                  <strong>Thiết lập đề đầu vào</strong>
                  <p>Chọn mục tiêu, trình độ, thời lượng và số lượng câu hỏi để hệ thống tạo đúng khung đề.</p>
                </div>
              </div>
              <div className="gsj-create-process__item">
                <span className="gsj-create-process__step">3</span>
                <div>
                  <strong>Mở bài test và xem kết quả</strong>
                  <p>Sau khi tạo, bạn sẽ được chuyển thẳng về Journey để mở bài test và xem lại phân tích.</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <MeowlGuide currentPage="journey/create" />
    </div>
  );
};

export default JourneyCreatePage;
