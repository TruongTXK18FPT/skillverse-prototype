import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { AssessmentTestResponse } from '../../types/Journey';
import { confirmAction } from '../../context/ConfirmDialogContext';

interface GSJTestTakingProps {
  test: AssessmentTestResponse;
  onSubmit: (answers: Record<number, string>, timeSpent: number) => void;
  onBack: () => void;
  loading: boolean;
}

const GSJTestTaking: React.FC<GSJTestTakingProps> = ({ test, onSubmit, onBack, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = test.questions[currentIndex];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const getDifficultyClass = (difficulty?: string): string => {
    const value = (difficulty || '').toUpperCase();
    if (value === 'BEGINNER' || value === 'EASY') return 'gsj-test__question-difficulty--easy';
    if (value === 'INTERMEDIATE' || value === 'MEDIUM') return 'gsj-test__question-difficulty--medium';
    if (value === 'ADVANCED' || value === 'HARD' || value === 'EXPERT') return 'gsj-test__question-difficulty--hard';
    return '';
  };

  const getDifficultyLabel = (difficulty?: string): string => {
    const value = (difficulty || '').toUpperCase();
    if (value === 'BEGINNER' || value === 'EASY') return 'Cơ bản';
    if (value === 'INTERMEDIATE' || value === 'MEDIUM') return 'Trung cấp';
    if (value === 'ADVANCED' || value === 'HARD' || value === 'EXPERT') return 'Nâng cao';
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

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionId]: answer
    }));
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
            } ${answers[q.questionId] ? 'gsj-test-nav__dot--answered' : ''}`}
            onClick={() => goToQuestion(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="gsj-test-nav__hint">
        Đã trả lời: {answeredCount}/{totalQuestions}
      </div>
    </div>
  );

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
            <span className={`gsj-test__question-difficulty ${getDifficultyClass(currentQuestion.difficulty)}`}>
              {getDifficultyLabel(currentQuestion.difficulty)}
            </span>
          </div>

          <div className="gsj-test__question-text">{currentQuestion.question}</div>

          <div className="gsj-test__options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={`${currentQuestion.questionId}-${index}`}
                className={`gsj-option ${answers[currentQuestion.questionId] === option ? 'gsj-option--selected' : ''}`}
                onClick={() => handleAnswer(option)}
              >
                <span className="gsj-option__marker"></span>
                <span className="gsj-option__label">{getOptionLabel(index)}.</span>
                <span className="gsj-option__text">{normalizeOptionText(option)}</span>
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
        </div>
      </div>
    </div>
  );
};

export default GSJTestTaking;
