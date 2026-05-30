import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle, ChevronRight, Clock, RefreshCw, Globe, Cpu, Bookmark } from 'lucide-react';
import { AssessmentTestResponse } from '../../types/Journey';
import { confirmAction } from '../../context/ConfirmDialogContext';
import { decodeHtml } from '../../utils/htmlDecoder';
import journeyService from '../../services/journeyService';

interface GSJTestTakingProps {
  test: AssessmentTestResponse;
  onSubmit: (answers: Record<number, string>, timeSpent: number) => void;
  onBack: () => void;
  loading: boolean;
}

const GSJTestTaking: React.FC<GSJTestTakingProps> = ({ test, onSubmit, onBack, loading }) => {
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    if (test.userAnswersJson) {
      try {
        const parsed = JSON.parse(test.userAnswersJson);
        const answersObj: Record<number, string> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          const numKey = Number(key);
          if (!isNaN(numKey) && typeof val === 'string') {
            answersObj[numKey] = val;
          }
        });
        return answersObj;
      } catch (err) {
        console.error('Failed to parse userAnswersJson:', err);
      }
    }
    return {};
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (test.userAnswersJson) {
      try {
        const parsed = JSON.parse(test.userAnswersJson);
        // Find the first question index that is NOT answered
        const firstUnanswered = test.questions.findIndex(
          (q) => !parsed[q.questionId] && !parsed[String(q.questionId)]
        );
        return firstUnanswered !== -1 ? firstUnanswered : 0;
      } catch (err) {
        console.error('Failed to calculate initial question index:', err);
      }
    }
    return 0;
  });

  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`assessment_bookmarks_${test.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uniqueSkills = useMemo(() => {
    return Array.from(new Set(test.questions.map(q => q.skillArea).filter(Boolean)));
  }, [test.questions]);

  const currentQuestion = test.questions[currentIndex];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const getDifficultyClass = (difficulty?: string): string => {
    const value = (difficulty || '').toUpperCase();
    if (value === 'BEGINNER' || value === 'ELEMENTARY' || value === 'EASY') return 'gsj-test__question-difficulty--easy';
    if (value === 'INTERMEDIATE' || value === 'MEDIUM') return 'gsj-test__question-difficulty--medium';
    if (value === 'ADVANCED' || value === 'HARD' || value === 'EXPERT') return 'gsj-test__question-difficulty--hard';
    return '';
  };

  const getDifficultyLabel = (difficulty?: string): string => {
    const value = (difficulty || '').toUpperCase();
    if (value === 'BEGINNER' || value === 'EASY') return 'Cơ bản';
    if (value === 'ELEMENTARY') return 'Sơ cấp';
    if (value === 'INTERMEDIATE' || value === 'MEDIUM') return 'Trung cấp';
    if (value === 'ADVANCED' || value === 'HARD') return 'Nâng cao';
    if (value === 'EXPERT') return 'Chuyên gia';
    return difficulty || 'Không xác định';
  };

  const getOptionLabel = (index: number): string => String.fromCharCode(65 + index);

  const normalizeOptionText = (option: string): string =>
    option.replace(/^[A-Z]\s*[.):-]\s*/i, '').trim() || option;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionText: string) => {
    const updatedAnswers = {
      ...answers,
      [currentQuestion.questionId]: optionText
    };
    setAnswers(updatedAnswers);

    // Save temporary progress to the backend asynchronously
    journeyService.saveTestProgress(test.journeyId, test.id, updatedAnswers)
      .catch((err) => {
        console.error('Failed to auto-save test progress:', err);
      });
  };

  const toggleBookmark = (questionId: number) => {
    setBookmarks((prev) => {
      const updated = {
        ...prev,
        [questionId]: !prev[questionId]
      };
      localStorage.setItem(`assessment_bookmarks_${test.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmed = await confirmAction(
        `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu. Bạn có muốn nộp bài ngay không?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    await onSubmit(answers, timeElapsed);
    setIsSubmitting(false);
  };

  const renderQuestionNav = () => (
    <div className="gsj-test-nav">
      <div className="gsj-test-nav__title">Câu hỏi</div>
      <div className="gsj-test-nav__dots">
        {test.questions.map((q, index) => (
          <button
            key={q.questionId}
            className={`gsj-test-nav__dot ${
              index === currentIndex ? 'gsj-test-nav__dot--active' : ''
            } ${answers[q.questionId] ? 'gsj-test-nav__dot--answered' : ''} ${
              bookmarks[q.questionId] ? 'gsj-test-nav__dot--bookmarked' : ''
            }`}
            onClick={() => goToQuestion(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="gsj-test-nav__hint">
        Đã trả lời: {answeredCount}/{totalQuestions}
      </div>

      {uniqueSkills.length > 0 && (
        <div className="gsj-test-nav__skills">
          <div className="gsj-test-nav__skills-title">Kỹ năng đánh giá</div>
          <div className="gsj-test-nav__skills-list">
            {uniqueSkills.map((skill) => (
              <span key={skill} className="gsj-test-nav__skill-badge" title={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <div className="gsj-test">
        <div className="gsj-test__header">
          <button className="gsj-test__back" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div className="gsj-test__info">
            <h2 className="gsj-test__title">{test.title}</h2>
            <div className="gsj-test__meta">
              <span className="gsj-test__meta-item">
                <Clock size={14} />
                Không thể tải câu hỏi
              </span>
            </div>
          </div>
        </div>

        <div className="gsj-test__question-container">
          <div className="gsj-empty-state">
            <p>Đề thi này chưa có dữ liệu câu hỏi hợp lệ. Vui lòng quay lại và mở lại bài test.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gsj-test">
      <div className="gsj-test__header">
        <button className="gsj-test__back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="gsj-test__info">
          <h2 className="gsj-test__title">{test.title}</h2>
          <div className="gsj-test__meta">
            <span className="gsj-test__meta-item">
              <Clock size={14} />
              {formatTime(timeElapsed)}
            </span>
            <span className="gsj-test__meta-item">
              <CheckCircle size={14} />
              {answeredCount}/{totalQuestions} đã trả lời
            </span>
          </div>
        </div>
      </div>

      <div className="gsj-test__progress">
        <div className="gsj-test__progress-meta">
          <span>Tiến độ làm bài</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="gsj-test__progress-track">
          <div className="gsj-test__progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="gsj-test__content">
        {renderQuestionNav()}

        <div className="gsj-test__question-container">
          <div className="gsj-test__question-header">
            <span className="gsj-test__question-number">
              <span className="gsj-question__number">{currentIndex + 1}</span>
              <span className="gsj-test__question-total">/ {totalQuestions}</span>
            </span>
            <div className="gsj-test__question-meta-tags">
              {(test.domain || test.targetField) && (
                <span className="gsj-test__tag gsj-test__tag--domain" title="Lĩnh vực đánh giá">
                  <Globe size={11} />
                  <span>{test.domain || test.targetField}</span>
                </span>
              )}
              {currentQuestion.skillArea && (
                <span className="gsj-test__tag gsj-test__tag--skill" title="Kỹ năng câu hỏi">
                  <Cpu size={11} />
                  <span>{currentQuestion.skillArea}</span>
                </span>
              )}
              <span className={`gsj-test__tag gsj-test__tag--difficulty ${getDifficultyClass(currentQuestion.difficulty)}`}>
                {getDifficultyLabel(currentQuestion.difficulty)}
              </span>

              <button
                className={`gsj-test__tag gsj-test__tag--bookmark ${
                  bookmarks[currentQuestion.questionId] ? 'gsj-test__tag--bookmark-active' : ''
                }`}
                onClick={() => toggleBookmark(currentQuestion.questionId)}
                title={bookmarks[currentQuestion.questionId] ? 'Bỏ đánh dấu câu hỏi' : 'Đánh dấu câu hỏi này'}
              >
                <Bookmark size={11} fill={bookmarks[currentQuestion.questionId] ? '#ffffff' : 'none'} />
                <span>{bookmarks[currentQuestion.questionId] ? 'Đã lưu' : 'Đánh dấu'}</span>
              </button>
            </div>
          </div>

          <div className="gsj-test__question-text">{decodeHtml(currentQuestion.question)}</div>

          <div className="gsj-test__options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={`${currentQuestion.questionId}-${index}`}
                className={`gsj-option ${answers[currentQuestion.questionId] === option ? 'gsj-option--selected' : ''}`}
                onClick={() => handleAnswer(option)}
              >
                <span className="gsj-option__marker"></span>
                <span className="gsj-option__label">{getOptionLabel(index)}.</span>
                <span className="gsj-option__text">{decodeHtml(normalizeOptionText(option))}</span>
              </button>
            ))}
          </div>

          <div className="gsj-test__nav-buttons">
            <button
              className="gsj-btn gsj-btn--secondary"
              onClick={prevQuestion}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} />
              Trước
            </button>
            {currentIndex < totalQuestions - 1 ? (
              <button className="gsj-btn gsj-btn--primary" onClick={nextQuestion}>
                Tiếp theo
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="gsj-btn gsj-btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang nộp bài...
                  </>
                ) : (
                  <>
                    Nộp bài đánh giá
                    <CheckCircle size={16} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Dynamic Meowl Tip Block to fill empty space and provide helpful onboarding */}
          <div className="gsj-test__meowl-tip">
            <div className="gsj-test__meowl-tip-avatar">
              <span className="gsj-test__meowl-tip-emoji">🐱</span>
            </div>
            <div className="gsj-test__meowl-tip-content">
              <span className="gsj-test__meowl-tip-title">Mẹo nhỏ từ Meowl:</span>
              <p className="gsj-test__meowl-tip-text">
                {currentIndex % 3 === 0 && "Hệ thống tự động lưu tiến trình làm bài. Bạn có thể yên tâm quay lại sau mà không sợ mất câu trả lời cũ!"}
                {currentIndex % 3 === 1 && "Nhấp vào nút 'Đánh dấu' phía trên để lưu câu hỏi khó. Điểm chấm trên dot câu hỏi giúp bạn quay lại nhanh."}
                {currentIndex % 3 === 2 && "Đánh giá này nhằm đo lường cấp độ phù hợp để AI thiết kế lộ trình chuẩn nhất cho bạn. Cố lên nhé!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSJTestTaking;
