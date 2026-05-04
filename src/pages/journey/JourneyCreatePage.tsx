import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Check, ChevronRight, X } from "lucide-react";
import {
  GOAL_OPTIONS,
  JourneyType,
  GoalType,
  LEVEL_OPTIONS,
  LevelType,
  StartJourneyRequest,
} from "../../types/Journey";
import MeowlGuide from "../../components/meowl/MeowlGuide";
import SkillForm from "../../components/journey/SkillForm";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import TicTacToeGame from "../../components/game/tic-tac-toe/TicTacToeGame";
import journeyService from "../../services/journeyService";
import { getExpertDomainMeta } from "../../utils/expertFieldPresentation";
import "./../../styles/GSJJourney.css";

const TOTAL_STEPS = 2;
const JOURNEY_CREATE_GAME_DELAY_MS = 8000;

type JourneyCompatibilityWarning = {
  title: string;
  lines: string[];
  cta?: {
    label: string;
    goal: GoalType;
  };
};

const getJourneyCompatibilityWarning = (
  goal?: GoalType,
  level?: LevelType,
): JourneyCompatibilityWarning | null => {
  if (!goal || !level) {
    return null;
  }

  if (goal === "REVIEW" && level === "BEGINNER") {
    return {
      title: "Có vẻ bạn chưa có nền tảng với kỹ năng này",
      lines: [
        "Bạn có thể bắt đầu với lộ trình học từ đầu để đạt hiệu quả tốt hơn.",
        "Bạn vẫn có thể tiếp tục.",
      ],
      cta: {
        label: 'Chuyển sang "Học từ đầu"',
        goal: "FROM_SCRATCH",
      },
    };
  }

  if (goal === "INTERNSHIP" && level === "BEGINNER") {
    return {
      title: "Mục tiêu này thường cần thêm nền tảng",
      lines: [
        "Bạn có thể bắt đầu từ cơ bản và dần hướng tới internship.",
        "Bạn vẫn có thể tiếp tục.",
      ],
    };
  }

  if (goal === "FROM_SCRATCH" && level === "INTERMEDIATE") {
    return {
      title: "Bạn đã làm được dự án thực tế",
      lines: [
        "Lộ trình 'Học từ đầu' lúc này có thể dài hơn mức cần thiết.",
        "Bạn có thể tiết kiệm thời gian nếu chuyển sang lộ trình phù hợp hơn.",
        "Bạn vẫn có thể tiếp tục.",
      ],
      cta: {
        label: 'Chuyển sang "Tăng tốc lên cấp độ tiếp theo"',
        goal: "LEVEL_UP",
      },
    };
  }

  if (goal === "FROM_SCRATCH" && level === "ADVANCED") {
    return {
      title: "Bạn đã có thể xử lý công việc phức tạp",
      lines: [
        "Lộ trình 'Học từ đầu' lúc này có thể không còn tối ưu về thời gian.",
        "Bạn có thể tiết kiệm thời gian nếu chọn một lộ trình phù hợp hơn.",
        "Bạn vẫn có thể tiếp tục.",
      ],
      cta: {
        label: 'Chuyển sang "Tăng tốc lên cấp độ tiếp theo"',
        goal: "LEVEL_UP",
      },
    };
  }

  if (
    goal === "CAREER_CHANGE" &&
    (level === "INTERMEDIATE" || level === "ADVANCED")
  ) {
    return {
      title: "Bạn đã có nền tảng thực tế với kỹ năng này",
      lines: [
        "Bạn có thể phù hợp hơn với mục tiêu nâng cao hoặc phát triển chuyên sâu.",
        "Bạn vẫn có thể tiếp tục.",
      ],
      cta: {
        label: 'Chuyển sang "Tăng tốc lên cấp độ tiếp theo"',
        goal: "LEVEL_UP",
      },
    };
  }

  return null;
};

const JourneyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLoadingGame, setShowLoadingGame] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const journeyType = JourneyType.SKILL;
  const [error, setError] = useState<string | null>(null);
  const [activeJourneyCheck, setActiveJourneyCheck] = useState(true);

  // V3 Phase 3: Block journey creation if user already has an active journey
  useEffect(() => {
    let cancelled = false;
    const checkActiveJourney = async () => {
      try {
        const activeJourneys = await journeyService.getActiveJourneys();
        if (!cancelled && activeJourneys.length > 0) {
          navigate("/journey", {
            state: {
              blockReason:
                "Bạn đang có một hành trình chưa hoàn thành. Hãy hoàn thành hoặc xóa hành trình cũ trước khi tạo mới.",
            },
          });
          return;
        }
      } catch {
        // If check fails, allow creation — backend will enforce
      }
      if (!cancelled) {
        setActiveJourneyCheck(false);
      }
    };
    void checkActiveJourney();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
    type: JourneyType.SKILL,
    domain: "",
    goal: "",
    level: "BEGINNER",
    language: "VI",
    duration: "STANDARD",
    skills: [],
    existingSkills: [],
  });

  // Available skill suggestions from selected career role keywords + domain fallback

  const selectedGoal = GOAL_OPTIONS.find(
    (option) => option.value === formData.goal,
  );
  const selectedLevel = LEVEL_OPTIONS.find(
    (option) => option.value === formData.level,
  );
  const selectedTargetSkills = formData.skills || [];
  const journeyCompatibilityWarning = getJourneyCompatibilityWarning(
    selectedGoal?.value,
    selectedLevel?.value,
  );
  const targetSkillSummary =
    selectedTargetSkills.length === 0
      ? "Chưa chọn"
      : selectedTargetSkills.length === 1
        ? selectedTargetSkills[0]
        : `${selectedTargetSkills[0]} +${selectedTargetSkills.length - 1} kỹ năng`;
  const domainMeta = formData.domain
    ? getExpertDomainMeta(formData.domain)
    : null;
  const journeyTypeLabel = "Học kỹ năng mới";

  const handleSkillComplete = (data: {
    domain: string;
    subCategory: string;
    jobRole: string;
    skills: string[];
  }) => {
    setFormData((prev) => ({
      ...prev,
      domain: data.domain,
      subCategory: data.subCategory,
      industry: data.subCategory,
      jobRole: data.jobRole,
      roleKeywords: undefined,
      skills: data.skills,
      existingSkills: (prev.existingSkills || []).filter(
        (skill) => !data.skills.includes(skill),
      ),
    }));
    setCurrentStep(2);
    setError(null);
  };

  const handleGoalSelect = (goal: string) => {
    setFormData((prev) => ({ ...prev, goal }));
  };

  const handleLevelSelect = (level: string) => {
    setFormData((prev) => ({ ...prev, level }));
  };

  const handleWarningCtaClick = (goal: GoalType) => {
    setFormData((prev) => ({ ...prev, goal }));
  };

  const canSubmit = () => {
    return Boolean(
      formData.goal && formData.level && selectedTargetSkills.length > 0,
    );
  };

  const handleBack = () => {
    if (currentStep <= 1) {
      navigate("/journey");
      return;
    }
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit()) {
      return;
    }

    if (selectedTargetSkills.length === 0) {
      setError(
        "Vui lòng chọn ít nhất 1 kỹ năng mục tiêu trước khi tạo bài test.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const journey = await journeyService.startJourney(formData);
      await journeyService.generateAssessmentTest(journey.id);
      navigate("/journey", { state: { autoOpenJourneyId: journey.id } });
    } catch (submitError) {
      console.error("Failed to create journey:", submitError);
      setError("Không thể tạo bài test lúc này. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  // Step 2: Goal + Level + Skills — all in one page
  const renderStep2 = () => (
    <div className="gsj-wizard-step">
      {/* Mục tiêu */}
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Cấu hình bài đánh giá</h2>
        <p className="gsj-wizard-step__subtitle">
          Hoàn thiện các lựa chọn để hệ thống tạo bài đánh giá phù hợp với mục
          tiêu và trình độ của bạn.
        </p>
      </div>

      <div className="gsj-wizard-section">
        <h3 className="gsj-wizard-section__title">
          Bạn muốn làm gì với kỹ năng này?
        </h3>
        <div className="gsj-card-grid gsj-card-grid--2col gsj-card-grid--goal">
          {GOAL_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-card ${formData.goal === option.value ? "gsj-card--selected" : ""}`}
              onClick={() => handleGoalSelect(option.value)}
            >
              <span className="gsj-card__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="gsj-card__label">{option.label}</span>
              <span className="gsj-card__desc">{option.description}</span>
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
        <h3 className="gsj-wizard-section__title">
          Bạn đã có kinh nghiệm ở mức nào?
        </h3>
        <div className="gsj-segmented-control">
          {LEVEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsj-segmented-control__item ${formData.level === option.value ? "gsj-segmented-control__item--active" : ""}`}
              onClick={() => handleLevelSelect(option.value)}
            >
              <span className="gsj-segmented-control__label">
                {option.label}
              </span>
              <span className="gsj-segmented-control__desc">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        {journeyCompatibilityWarning && (
          <div className="gsj-journey-warning" role="status" aria-live="polite">
            <div className="gsj-journey-warning__icon">⚠️</div>
            <div className="gsj-journey-warning__body">
              <div className="gsj-journey-warning__title">
                {journeyCompatibilityWarning.title}
              </div>
              <div className="gsj-journey-warning__text">
                {journeyCompatibilityWarning.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
            {journeyCompatibilityWarning.cta && (
              <button
                type="button"
                className="gsj-journey-warning__cta"
                onClick={() =>
                  handleWarningCtaClick(journeyCompatibilityWarning.cta!.goal)
                }
              >
                {journeyCompatibilityWarning.cta.label}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="gsj-wizard-section gsj-target-summary">
        <div className="gsj-target-summary__title">Bạn đã chọn:</div>

        <div className="gsj-target-summary__content">
          {/* Left: Skill */}
          <div className="gsj-target-summary__group">
            <span className="gsj-target-summary__label">Kỹ năng:</span>
            {selectedTargetSkills.map((skill) => (
              <span
                key={skill}
                className="gsj-chip gsj-chip--selected gsj-target-summary__chip"
              >
                <Check size={14} />
                {skill}
              </span>
            ))}
          </div>

          {/* Right: Career Path */}
          <div className="gsj-target-summary__group">
            <span className="gsj-target-summary__label">Ngành:</span>
            <div className="gsj-target-summary__path">
              <span>{formData.domain}</span>
              <ChevronRight
                size={12}
                className="gsj-target-summary__path-separator"
              />
              <span>{formData.subCategory}</span>
              <ChevronRight
                size={12}
                className="gsj-target-summary__path-separator"
              />
              <strong className="gsj-target-summary__role">
                {formData.jobRole}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (activeJourneyCheck) {
    return (
      <div
        className="gsj-page gsj-create-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "var(--gsj-text-secondary, #9ca3af)",
          }}
        >
          <p>Đang kiểm tra hành trình hiện tại...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gsj-page gsj-create-page">
        <div
          className={`gsj-hud-loader ${showLoadingGame ? "gsj-hud-loader--split" : ""}`}
        >
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
                  <div className="gsj-hud-loader__text-main">
                    AI ĐANG TẠO BÀI TEST PHÙ HỢP
                  </div>
                  <div className="gsj-hud-loader__scan-line"></div>
                  <div className="gsj-hud-loader__text-sub">
                    Vui lòng chờ trong giây lát...
                  </div>
                </div>

                {showLoadingGame && (
                  <p className="gsj-hud-loader__game-helper">
                    Hệ thống đang xử lý lâu hơn dự kiến. Chơi một ván caro với
                    Meowl trong lúc chờ nhé.
                  </p>
                )}
              </div>
            </div>

            <aside
              className="gsj-hud-loader__game-pane"
              aria-hidden={!showLoadingGame}
            >
              {showLoadingGame && (
                <>
                  <header className="gsj-hud-loader__game-header">
                    <span className="gsj-hud-loader__game-eyebrow">
                      MINI GAME KHI CHỜ
                    </span>
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
            <button
              type="button"
              className="gsj-create-header__back"
              onClick={handleBack}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="gsj-create-header__content">
              <h1 className="gsj-create-header__title">
                <Briefcase size={24} />
                Tạo bài test đánh giá
              </h1>
              <p className="gsj-create-header__subtitle">
                Hoàn thiện thông tin theo từng bước để hệ thống tạo đề đầu vào
                đúng trọng tâm và đúng số lượng câu hỏi bạn mong muốn.
              </p>
            </div>
          </div>

          <section className="gsj-create-overview">
            <div className="gsj-create-overview__highlights">
              <span className="gsj-create-overview__chip">
                Bước {currentStep}/{TOTAL_STEPS}
              </span>
              <span className="gsj-create-overview__chip">
                {journeyTypeLabel}
              </span>
              {domainMeta && (
                <span className="gsj-create-overview__chip">
                  {domainMeta.label}
                </span>
              )}
            </div>
          </section>

          <div className="gsj-progress gsj-progress--framed">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`gsj-progress__step ${currentStep >= step ? "gsj-progress__step--active" : ""} ${currentStep > step ? "gsj-progress__step--completed" : ""}`}
              >
                <div className="gsj-progress__step-number">
                  {currentStep > step ? <Check size={14} /> : step}
                </div>
                <span className="gsj-progress__step-label">
                  {step === 1 && "Chọn Kỹ năng"}
                  {step === 2 && "Cấu hình test"}
                </span>
              </div>
            ))}
            <div className="gsj-progress__bar">
              <div
                className="gsj-progress__bar-fill"
                style={{
                  width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`,
                }}
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

          <form
            onSubmit={handleSubmit}
            className="gsj-wizard-form gsj-wizard-form--framed"
          >
            {currentStep === 1 && (
              <SkillForm onComplete={handleSkillComplete} onBack={handleBack} />
            )}
            {currentStep === 2 && renderStep2()}

            {currentStep !== 1 && (
              <div className="gsj-wizard-nav">
                <button
                  type="button"
                  className="gsj-btn gsj-btn--secondary"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                  Quay lại
                </button>

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
                  <button
                    type="submit"
                    className="gsj-btn gsj-btn--primary"
                    disabled={!canSubmit()}
                  >
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
                <span className="gsj-create-summary-item__label">
                  Loại hành trình
                </span>
                <strong>{journeyTypeLabel}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Lĩnh vực</span>
                <strong>{domainMeta?.label || "Chưa chọn"}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">
                  Ngành / nhóm kỹ năng
                </span>
                <strong>
                  {formData.industry || formData.subCategory || "Chưa chọn"}
                </strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">
                  Vai trò / kỹ năng
                </span>
                <strong>
                  {formData.jobRole || "Chưa chọn"}
                  {" · "}
                  {targetSkillSummary}
                </strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">Mục tiêu</span>
                <strong>{selectedGoal?.label || "Chưa chọn"}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">
                  Trình độ hiện tại
                </span>
                <strong>{selectedLevel?.label || "Chưa chọn"}</strong>
              </div>
              <div className="gsj-create-summary-item">
                <span className="gsj-create-summary-item__label">
                  Thời lượng
                </span>
                <strong>15 phút / 25 câu (Tiêu chuẩn)</strong>
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
                  <p>
                    Lĩnh vực, ngành và vai trò hoặc nhóm kỹ năng sẽ quyết định
                    ngân hàng câu hỏi và hướng đánh giá.
                  </p>
                </div>
              </div>
              <div className="gsj-create-process__item">
                <span className="gsj-create-process__step">2</span>
                <div>
                  <strong>Thiết lập đề đầu vào</strong>
                  <p>
                    Chọn mục tiêu và trình độ để hệ thống tạo đúng khung đề (15
                    phút / 25 câu).
                  </p>
                </div>
              </div>
              <div className="gsj-create-process__item">
                <span className="gsj-create-process__step">3</span>
                <div>
                  <strong>Mở bài test và xem kết quả</strong>
                  <p>
                    Sau khi tạo, bạn sẽ được chuyển thẳng về Journey để mở bài
                    test và xem lại phân tích.
                  </p>
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
