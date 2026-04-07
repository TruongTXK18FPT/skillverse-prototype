import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { useAuth } from '../../context/AuthContext';
import {
  getMyLatestQuizReview,
  getQuizAttemptStatus,
  getQuizForAttemptById,
  getUserQuizAttempts,
  heartbeatQuizAttemptSession,
  startQuizAttempt,
  submitQuiz
} from '../../services/quizService';
import {
  QuizAttemptAnswerOptionReviewDTO,
  QuizAttemptAnswerReviewDTO,
  QuizAttemptReviewDTO,
  QuizDetailDTO,
  QuizAttemptDTO,
  QuizQuestionDetailDTO,
  QuizOptionDTO,
  QuestionType
} from '../../data/quizDTOs';
import {
  buildCourseLearningDestination,
  CourseLearningLocationState,
  readStoredCourseLearningReturnContext,
} from '../../utils/courseLearningNavigation';
import {
  BREAKING_ITEM_RETAKE_MESSAGE as BREAKING_ITEM_MESSAGE,
  resolveRevisionItemWarning,
} from '../../utils/courseRevisionMessages';
import { showAppError, showAppInfo, showAppWarning } from '../../context/ToastContext';
import '../../styles/QuizAttemptPage-HUD.css';

type AnswerDraft = {
  selectedOptionIds?: number[];
  textAnswer?: string;
};

const extractApiErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof responseData === 'string') return responseData;
  if (responseData && typeof responseData === 'object') {
    const responseObj = responseData as { message?: string; error?: string };
    if (responseObj.message) return responseObj.message;
    if (responseObj.error) return responseObj.error;
  }

  return 'Unknown error';
};

const QuizAttemptPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const locationState = (location.state as CourseLearningLocationState | null) ?? null;
  const viewLatestResult = useMemo(
    () => new URLSearchParams(location.search).get('view') === 'result',
    [location.search]
  );

  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, AnswerDraft>>({});
  const [viewMode, setViewMode] = useState<'start' | 'taking' | 'result'>('start');
  const [result, setResult] = useState<QuizAttemptDTO | null>(null);
  const [latestAttemptResult, setLatestAttemptResult] = useState<QuizAttemptDTO | null>(null);
  const [latestAttemptReview, setLatestAttemptReview] = useState<QuizAttemptReviewDTO | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptDTO[]>([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [canRetry, setCanRetry] = useState(true);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [hasPassed, setHasPassed] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [nextRetryAt, setNextRetryAt] = useState<string | null>(null);
  const [attemptSessionToken, setAttemptSessionToken] = useState<string | null>(null);
  const hasRevisionItemWarning = useMemo(
    () => Boolean(quiz && resolveRevisionItemWarning(quiz)),
    [quiz]
  );

  const getOptionReviewTone = useCallback((option: QuizAttemptAnswerOptionReviewDTO, revealCorrect: boolean) => {
    if (option.correct && option.selected) {
      return 'is-correct-selected';
    }
    if (revealCorrect && option.correct) {
      return 'is-correct';
    }
    if (option.selected) {
      return 'is-selected-wrong';
    }
    return 'is-neutral';
  }, []);

  const renderReviewOptionList = useCallback((answer: QuizAttemptAnswerReviewDTO, revealCorrect: boolean) => {
    if (!answer.optionsSnapshot || answer.optionsSnapshot.length === 0) {
      return null;
    }

    return (
      <div className="hud-quiz-attempt-review-options">
        {answer.optionsSnapshot.map((option) => {
          const tone = getOptionReviewTone(option, revealCorrect);
          return (
            <div
              key={option.optionId}
              className={`hud-quiz-attempt-review-option ${tone}`}
            >
              <div className="hud-quiz-attempt-review-option-indicator">
                {option.selected ? '✓' : ''}
              </div>
              <div className="hud-quiz-attempt-review-option-body">
                <div className="hud-quiz-attempt-review-option-text">{option.optionText}</div>
                <div className="hud-quiz-attempt-review-option-tags">
                  {option.selected && (
                    <span className="hud-quiz-attempt-review-option-tag is-selected">Bạn chọn</span>
                  )}
                  {revealCorrect && option.correct && (
                    <span className="hud-quiz-attempt-review-option-tag is-correct">Đáp án đúng</span>
                  )}
                </div>
                {option.feedback && (option.selected || (revealCorrect && option.correct)) && (
                  <p className="hud-quiz-attempt-review-option-feedback">{option.feedback}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [getOptionReviewTone]);

  const renderReviewAnswerBody = useCallback((answer: QuizAttemptAnswerReviewDTO, revealCorrect: boolean) => {
    if (answer.questionType === QuestionType.SHORT_ANSWER) {
      return (
        <>
          <div className="hud-quiz-attempt-review-block">
            <span>Câu trả lời của bạn</span>
            <p>{answer.submittedAnswer?.textAnswer?.trim() || answer.submittedAnswerText || 'Không trả lời'}</p>
          </div>
          {revealCorrect && (
            <div className="hud-quiz-attempt-review-block">
              <span>Đáp án chấp nhận</span>
              <p>{answer.correctAnswerText || 'Đang cập nhật'}</p>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <div className="hud-quiz-attempt-review-block">
          <span>Lựa chọn của bạn</span>
          <p>
            {answer.submittedAnswer?.selectedOptionTexts?.length
              ? answer.submittedAnswer.selectedOptionTexts.join('\n')
              : answer.submittedAnswerText || 'Không trả lời'}
          </p>
        </div>
        {renderReviewOptionList(answer, revealCorrect)}
      </>
    );
  }, [renderReviewOptionList]);

  // Load quiz and attempts
  useEffect(() => {
    if (!quizId || !user) return;

    setLoading(true);
    Promise.all([
      getQuizForAttemptById(Number(quizId)),
      getQuizAttemptStatus(Number(quizId), user.id).catch(() => null),
      getUserQuizAttempts(Number(quizId), user.id).catch(() => []),
      getMyLatestQuizReview(Number(quizId), user.id).catch(() => null)
    ])
      .then(([quizData, attemptStatus, attempts, latestReview]) => {
        setQuiz(quizData);
        setAttemptHistory(attempts);
        setLatestAttemptReview(latestReview);

        const latestAttempt = attempts[0] || null;
        const passedAttempt = attempts.find((attempt) => attempt.passed) || null;
        setLatestAttemptResult(latestAttempt);

        if (attemptStatus) {
          setAttemptsUsed(attemptStatus.attemptsUsed ?? 0);
          setCanRetry(attemptStatus.canRetry ?? true);
          setHasPassed(Boolean(attemptStatus.hasPassed));
          setMaxAttempts(attemptStatus.maxAttempts ?? quizData.maxAttempts ?? 3);
          setCooldownSeconds(attemptStatus.secondsUntilRetry ?? 0);
          setNextRetryAt(attemptStatus.nextRetryAt ?? null);

          if (attemptStatus.attemptsUsed > 0) {
            setBestScore(attemptStatus.bestScore ?? 0);
          } else {
            setBestScore(null);
          }

          if (viewLatestResult && latestAttempt) {
            setResult(latestAttempt);
            setViewMode('result');
            return;
          }

          if (attemptStatus.hasPassed && (passedAttempt || latestAttempt)) {
            setResult(passedAttempt || latestAttempt);
            setViewMode('result');
          }
        } else {
          setMaxAttempts(quizData.maxAttempts ?? 3);
          if (viewLatestResult && latestAttempt) {
            setResult(latestAttempt);
            setViewMode('result');
          }
        }
      })
      .catch((err) => {
        console.error('[QUIZ] Failed to load:', err);
      })
      .finally(() => setLoading(false));
  }, [quizId, user, viewLatestResult]);

  const handleSelectSingleOption = (questionId: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedOptionIds: [optionId] }
    }));
  };

  const handleToggleOption = (questionId: number, optionId: number) => {
    setAnswers(prev => {
      const current = prev[questionId]?.selectedOptionIds ?? [];
      const next = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return {
        ...prev,
        [questionId]: { ...prev[questionId], selectedOptionIds: next }
      };
    });
  };

  const handleShortAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], textAnswer: value }
    }));
  };

  const beginQuizAttempt = useCallback(async () => {
    if (!quiz || !user) {
      return false;
    }
    try {
      const session = await startQuizAttempt(quiz.id, user.id);
      setAttemptSessionToken(session.sessionToken ?? null);
      setViewMode('taking');
      setAnswers({});
      setResult(null);
      return true;
    } catch (err) {
      console.error('[QUIZ_SESSION] Failed to start session:', err);
      const message = extractApiErrorMessage(err);
      if (message.includes('QUIZ_RETRY_LOCKED_BY_PASS')) {
        setCanRetry(false);
        setHasPassed(true);
        showAppInfo('Quiz đã khóa làm lại', 'Bạn đã đạt quiz này, hệ thống đã khóa làm lại.');
      } else {
        showAppError('Không thể bắt đầu quiz', 'Không thể bắt đầu phiên làm bài lúc này. Vui lòng thử lại.');
      }
      return false;
    }
  }, [quiz, user]);

  // Handler để làm lại quiz - chuyển thẳng vào chế độ làm bài
  const handleRetryQuiz = useCallback(async () => {
    await beginQuizAttempt();
  }, [beginQuizAttempt]);

  const handleReviewLatestResult = useCallback(() => {
    if (!latestAttemptResult) {
      return;
    }

    setResult(latestAttemptResult);
    setViewMode('result');
  }, [latestAttemptResult]);

  const handleBackToCourseLearning = useCallback(() => {
    const returnContext = locationState?.courseId
      ? locationState
      : readStoredCourseLearningReturnContext();

    if (returnContext?.courseId) {
      navigate(buildCourseLearningDestination(returnContext), { state: returnContext });
      return;
    }

    navigate(-1);
  }, [locationState, navigate]);

  const handleStartQuiz = async () => {
    if (hasPassed) {
      showAppInfo('Đã đạt bài kiểm tra', 'Bạn đã đạt bài kiểm tra này, không cần làm lại.');
      return;
    }
    if (!canRetry) {
      if (cooldownSeconds > 0) {
        const hours = Math.ceil(cooldownSeconds / 3600);
        showAppWarning(
          'Đã hết lượt làm bài',
          `Bạn đã hết lượt làm bài. Vui lòng quay lại sau ${hours} giờ (tính từ lần làm đầu tiên).`
        );
      } else {
        showAppWarning('Đã hết lượt làm bài', 'Bạn đã hết lượt làm bài.');
      }
      return;
    }
    await beginQuizAttempt();
  };

  useEffect(() => {
    if (viewMode !== 'taking' || !quiz || !attemptSessionToken) {
      return;
    }

    const intervalId = window.setInterval(() => {
      heartbeatQuizAttemptSession(quiz.id, attemptSessionToken)
        .then((session) => {
          if (session.sessionToken && session.sessionToken !== attemptSessionToken) {
            setAttemptSessionToken(session.sessionToken);
          }
        })
        .catch((error) => {
          console.warn('[QUIZ_SESSION] Heartbeat failed:', error);
        });
    }, 20000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [attemptSessionToken, quiz, viewMode]);

  const isQuestionAnswered = useCallback((question: QuizQuestionDetailDTO) => {
    const answer = answers[question.id];
    if (!answer) return false;
    if (question.questionType === QuestionType.SHORT_ANSWER) {
      return Boolean(answer.textAnswer && answer.textAnswer.trim().length > 0);
    }
    return (answer.selectedOptionIds?.length ?? 0) > 0;
  }, [answers]);

  const getQuestionHint = useCallback((question: QuizQuestionDetailDTO) => {
    const selectionCount = question.correctOptionCount ?? 0;
    if (question.questionType === QuestionType.MULTIPLE_CHOICE) {
      if (selectionCount > 1) {
        return `Chọn ${selectionCount} đáp án đúng.`;
      }
      if (selectionCount === 1) {
        return 'Chọn 1 đáp án đúng.';
      }
      return 'Chọn đáp án phù hợp nhất.';
    }
    if (question.questionType === QuestionType.TRUE_FALSE) {
      return 'Chọn một đáp án đúng nhất.';
    }
    return 'Điền câu trả lời ngắn. Hệ thống không phân biệt chữ hoa, chữ thường và sẽ bỏ qua khoảng trắng thừa.';
  }, []);

  const handleSubmit = async () => {
    if (!user || !quiz) return;

    const totalQuestions = quiz.questions?.length || 0;
    const answeredCount = quiz.questions?.filter(isQuestionAnswered).length || 0;

    if (answeredCount < totalQuestions) {
      if (!(await confirmAction(`Bạn mới trả lời ${answeredCount}/${totalQuestions} câu. Xác nhận nộp bài?`))) {
        return;
      }
    }

    try {

      const submitData = {
        quizId: quiz.id,
        sessionToken: attemptSessionToken ?? undefined,
        answers: Object.entries(answers)
          .map(([questionId, answer]) => ({
            questionId: Number(questionId),
            selectedOptionIds: answer.selectedOptionIds && answer.selectedOptionIds.length > 0
              ? answer.selectedOptionIds
              : undefined,
            textAnswer: answer.textAnswer?.trim() ? answer.textAnswer.trim() : undefined
          }))
          .filter((answer) => (answer.selectedOptionIds && answer.selectedOptionIds.length > 0) || answer.textAnswer)
      };

      const res = await submitQuiz(submitData, user.id);


      setResult(res.attempt);
      setLatestAttemptResult(res.attempt);
      setAttemptHistory((prev) => [res.attempt, ...prev.filter((attempt) => attempt.id !== res.attempt.id)]);
      setViewMode('result');
      setAttemptSessionToken(null);

      try {
        const [status, attempts, latestReview] = await Promise.all([
          getQuizAttemptStatus(quiz.id, user.id),
          getUserQuizAttempts(quiz.id, user.id).catch(() => []),
          getMyLatestQuizReview(quiz.id, user.id).catch(() => null),
        ]);
        setAttemptHistory(attempts);
        setLatestAttemptResult(attempts[0] ?? res.attempt);
        setLatestAttemptReview(latestReview);
        setAttemptsUsed(status.attemptsUsed ?? attemptsUsed + 1);
        setCanRetry(status.canRetry ?? false);
        setBestScore(status.bestScore ?? bestScore);
        setHasPassed(Boolean(status.hasPassed));
        setMaxAttempts(status.maxAttempts ?? maxAttempts);
        setCooldownSeconds(status.secondsUntilRetry ?? 0);
        setNextRetryAt(status.nextRetryAt ?? null);
      } catch {
        setAttemptsUsed(attemptsUsed + 1);
        if (res.passed) {
          setHasPassed(true);
          setCanRetry(false);
        } else {
          setCanRetry(attemptsUsed + 1 < maxAttempts);
        }
      }
    } catch (err: unknown) {
      console.error('[QUIZ_SUBMIT] Failed:', err);
      const errorMessage = extractApiErrorMessage(err);
      if (errorMessage.includes('QUIZ_RETRY_LOCKED_BY_PASS')) {
        setCanRetry(false);
        setHasPassed(true);
        showAppInfo('Quiz đã khóa làm lại', 'Bạn đã đạt quiz này, hệ thống đã khóa làm lại.');
        return;
      }
      showAppError('Không thể nộp bài', errorMessage);
    }
  };
  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = quiz?.questions?.filter(isQuestionAnswered).length || 0;

  if (loading) {
    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-loading">
          <MeowlKuruLoader size="small" text="" />
          <p>ĐANG TẢI BÀI KIỂM TRA...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-error">
          <AlertCircle size={48} />
          <h2>Không tìm thấy bài kiểm tra</h2>
          <p>Không thể kết nối đến dữ liệu bài kiểm tra</p>
          <button onClick={handleBackToCourseLearning} className="hud-quiz-attempt-btn-back">
            <ArrowLeft size={18} />
            Quay lại khóa học
          </button>
        </div>
      </div>
    );
  }

  // START SCREEN - Màn hình bắt đầu
  if (viewMode === 'start') {
    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-header">
          <button onClick={handleBackToCourseLearning} className="hud-quiz-attempt-back-btn">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
        </div>

        <div className="hud-quiz-attempt-start-screen">
          {hasRevisionItemWarning && (
            <div className="lhud-revision-banner is-warning">
              <div>
                <strong>Nội dung cần làm lại</strong>
                <p>{BREAKING_ITEM_MESSAGE}</p>
              </div>
            </div>
          )}
          <h1 className="hud-quiz-attempt-start-title">{quiz.title}</h1>
          <p className="hud-quiz-attempt-start-description">
            {quiz.description || 'Hoàn thành bài kiểm tra để đánh giá kiến thức của bạn'}
          </p>

          <div className="hud-quiz-attempt-start-info">
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">Số câu hỏi</span>
              <span className="hud-quiz-attempt-info-value">{totalQuestions}</span>
            </div>
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">Điểm đạt</span>
              <span className="hud-quiz-attempt-info-value">{quiz.passScore}%</span>
            </div>
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">Số lần đã thử</span>
              <span className="hud-quiz-attempt-info-value">{attemptsUsed}/{maxAttempts}</span>
            </div>
            {bestScore !== null && (
              <div className="hud-quiz-attempt-info-item">
                <span className="hud-quiz-attempt-info-label">Điểm cao nhất</span>
                <span className="hud-quiz-attempt-info-value">{bestScore}%</span>
              </div>
            )}
          </div>

          {attemptHistory.length > 0 && (
            <div className="hud-quiz-attempt-history">
              <h3>Lịch sử làm bài</h3>
              <div className="hud-quiz-attempt-history-list">
                {attemptHistory.slice(0, 5).map((attempt, index) => (
                  <div key={attempt.id} className="hud-quiz-attempt-history-item">
                    <div>
                      <strong>Lần {attemptHistory.length - index}</strong>
                      <p>
                        {attempt.score ?? 0}% • {attempt.passed ? 'Đạt' : 'Chưa đạt'}
                        {attempt.submittedAt ? ` • ${new Date(attempt.submittedAt).toLocaleString('vi-VN')}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="hud-quiz-attempt-btn-secondary"
                      onClick={() => {
                        setResult(attempt);
                        setViewMode('result');
                      }}
                    >
                      Xem lại
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasPassed ? (
            <div className="hud-quiz-attempt-passed-notice">
              <h3>Đã hoàn thành</h3>
              <p className="hud-quiz-attempt-passed-score">
                Điểm: {bestScore}% | Yêu cầu: {quiz.passScore}%
              </p>
              <p className="hud-quiz-attempt-passed-message">Bạn đã đạt điểm yêu cầu. Không cần làm lại bài kiểm tra.</p>
              <button onClick={handleBackToCourseLearning} className="hud-quiz-attempt-btn-primary">
                <ArrowLeft size={18} />
                Quay lại khóa học
              </button>
            </div>
          ) : latestAttemptResult ? (
            <div className="hud-quiz-attempt-passed-notice">
              <h3>Kết quả gần nhất</h3>
              <p className="hud-quiz-attempt-passed-score">
                Điểm: {latestAttemptResult.score ?? 0}% | Yêu cầu: {quiz.passScore}%
              </p>
              <p className="hud-quiz-attempt-passed-message">
                Bạn có thể xem lại summary lần làm gần nhất trước khi quyết định làm lại bài kiểm tra.
              </p>
              <div className="hud-quiz-attempt-start-actions">
                <button onClick={handleReviewLatestResult} className="hud-quiz-attempt-btn-primary">
                  Xem kết quả gần nhất
                </button>
                {canRetry && attemptsUsed < maxAttempts && (
                  <button onClick={handleStartQuiz} className="hud-quiz-attempt-btn-start">
                    Làm lại ({attemptsUsed}/{maxAttempts})
                  </button>
                )}
              </div>
            </div>
          ) : !canRetry ? (
            <div className="hud-quiz-attempt-no-attempts">
              <h3>Hết lượt làm bài</h3>
              <p>Bạn đã sử dụng hết {maxAttempts} lượt làm bài.</p>
              <p className="hud-quiz-attempt-cooldown">
                Lượt làm bài sẽ được reset sau 8 giờ kể từ lần làm đầu tiên.
              </p>
              {cooldownSeconds > 0 && (
                <p className="hud-quiz-attempt-cooldown">
                  Thời gian chờ: {Math.ceil(cooldownSeconds / 3600)} giờ
                </p>
              )}
              {nextRetryAt && (
                <p className="hud-quiz-attempt-cooldown">
                  Có thể làm lại sau: {new Date(nextRetryAt).toLocaleString('vi-VN')}
                </p>
              )}
              <button onClick={handleBackToCourseLearning} className="hud-quiz-attempt-btn-secondary">
                <ArrowLeft size={18} />
                Quay lại
              </button>
            </div>
          ) : (
            <div className="hud-quiz-attempt-start-actions">
              <button onClick={handleStartQuiz} className="hud-quiz-attempt-btn-start">
                {attemptsUsed > 0 ? `Làm lại (${attemptsUsed}/${maxAttempts})` : 'Bắt đầu làm bài'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULT SCREEN - Màn hình kết quả
  if (viewMode === 'result' && result) {
    const passed = result.passed || (result.score >= quiz.passScore);
    const revealCorrectAnswers = passed;
    const shouldShowLatestReviewDetail = Boolean(
      latestAttemptReview &&
      latestAttemptReview.attempt?.id === result.id
    );

    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-result">
          {hasRevisionItemWarning && (
            <div className="lhud-revision-banner is-warning">
              <div>
                <strong>Nội dung cần làm lại</strong>
                <p>{BREAKING_ITEM_MESSAGE}</p>
              </div>
            </div>
          )}
          <div className={`hud-quiz-attempt-result-header ${passed ? 'passed' : 'failed'}`}>
            <h2>{passed ? 'Chúc mừng! Bạn đã đạt' : 'Chưa đạt yêu cầu'}</h2>
            <p className="hud-quiz-attempt-result-subtitle">
              {passed ? 'Bạn đã hoàn thành bài kiểm tra thành công!' : 'Hãy xem lại bài học và thử lại nhé!'}
            </p>
          </div>

          <div className="hud-quiz-attempt-result-score">
            <div className={`hud-quiz-attempt-score-circle ${passed ? 'passed' : 'failed'}`}>
              <span className="hud-quiz-attempt-score-value">{result.score || 0}%</span>
            </div>
          </div>

          <div className="hud-quiz-attempt-result-details">
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">Điểm đạt được</span>
              <span className="hud-quiz-attempt-detail-value">
                {(result.correctAnswers ?? 0)}/{result.totalQuestions ?? totalQuestions}
              </span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">Số câu đúng</span>
              <span className="hud-quiz-attempt-detail-value">
                {(result.correctAnswers ?? 0)}/{result.totalQuestions ?? totalQuestions}
              </span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">Điểm yêu cầu</span>
              <span className="hud-quiz-attempt-detail-value">{quiz.passScore}%</span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">Số lần đã thử</span>
              <span className="hud-quiz-attempt-detail-value">{attemptsUsed}/{maxAttempts}</span>
            </div>
          </div>

          {shouldShowLatestReviewDetail && latestAttemptReview && (
            <div className="hud-quiz-attempt-review">
              <div className="hud-quiz-attempt-review-header">
                <h3>Chi tiết đáp án lần làm mới nhất</h3>
                <p>Đây là bản ghi tại thời điểm nộp bài của bạn.</p>
              </div>
              {latestAttemptReview.answers.length > 0 ? (
                <div className="hud-quiz-attempt-review-list">
                  {latestAttemptReview.answers.map((answer, index) => (
                    <article
                      key={`${answer.questionId}-${index}`}
                      className={`hud-quiz-attempt-review-card ${answer.correct ? 'is-correct' : 'is-incorrect'}`}
                    >
                      <div className="hud-quiz-attempt-review-card-head">
                        <strong>Câu {answer.questionOrderIndex ?? index + 1}</strong>
                        <span>{answer.scoreEarned}/{answer.maxScore} điểm</span>
                      </div>
                      <h4>{answer.questionText}</h4>
                      {renderReviewAnswerBody(answer, revealCorrectAnswers)}
                      <div className={`hud-quiz-attempt-review-status ${answer.correct ? 'is-correct' : 'is-incorrect'}`}>
                        {answer.correct ? 'Đúng' : 'Sai'}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="hud-quiz-attempt-review-empty">
                  Lần làm mới nhất này chưa có dữ liệu đáp án chi tiết.
                </div>
              )}
            </div>
          )}

          {!shouldShowLatestReviewDetail && latestAttemptReview && (
            <div className="hud-quiz-attempt-review-empty">
              Chi tiết đáp án hiện chỉ hiển thị cho lần làm mới nhất của bạn.
            </div>
          )}

          <div className="hud-quiz-attempt-result-actions">
            <button onClick={handleBackToCourseLearning} className="hud-quiz-attempt-btn-back">
              Quay lại khóa học
            </button>
            {!hasPassed && canRetry && attemptsUsed < maxAttempts && (
              <button onClick={handleRetryQuiz} className="hud-quiz-attempt-btn-retry">
                Làm lại ({attemptsUsed}/{maxAttempts})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TAKING QUIZ SCREEN - Màn hình làm bài
  return (
    <div className="hud-quiz-attempt-container hud-quiz-attempt-taking">
      {hasRevisionItemWarning && (
        <div className="lhud-revision-banner is-warning">
          <div>
            <strong>Nội dung cần làm lại</strong>
            <p>{BREAKING_ITEM_MESSAGE}</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="hud-quiz-attempt-header">
        <button onClick={handleBackToCourseLearning} className="hud-quiz-attempt-back-btn">
          <ArrowLeft size={20} />
          <span>Thoát</span>
        </button>
        <h1 className="hud-quiz-attempt-title">{quiz.title}</h1>
        <div className="hud-quiz-attempt-progress-indicator">
          <span>{answeredCount}/{totalQuestions}</span>
        </div>
      </div>

      {/* ALL QUESTIONS - Hiển thị tất cả câu hỏi */}
      <div className="hud-quiz-attempt-all-questions">
        {quiz.questions?.map((question: QuizQuestionDetailDTO, idx: number) => (
          <div key={question.id} className="hud-quiz-attempt-question-card">
            <div className="hud-quiz-attempt-question-header">
              <span className="hud-quiz-attempt-question-number">Câu hỏi {idx + 1}</span>
              {isQuestionAnswered(question) && (
                <span className="hud-quiz-attempt-question-answered">
                  Đã trả lời
                </span>
              )}
            </div>

            <p className="hud-quiz-attempt-question-text">{question.questionText}</p>
            <div className="hud-quiz-attempt-question-hint">
              <span>{getQuestionHint(question)}</span>
              {question.questionType === QuestionType.MULTIPLE_CHOICE &&
                (answers[question.id]?.selectedOptionIds?.length ?? 0) > 0 && (
                  <span className="hud-quiz-attempt-question-hint-badge">
                    Đã chọn {(answers[question.id]?.selectedOptionIds?.length ?? 0)} đáp án
                  </span>
                )}
            </div>

            {question.questionType === QuestionType.SHORT_ANSWER ? (
              <div className="hud-quiz-attempt-short-answer">
                <textarea
                  className="hud-quiz-attempt-short-answer-input"
                  placeholder="Nhập câu trả lời ngắn của bạn..."
                  rows={4}
                  value={answers[question.id]?.textAnswer || ''}
                  onChange={(e) => handleShortAnswerChange(question.id, e.target.value)}
                />
              </div>
            ) : (
              <div className="hud-quiz-attempt-options">
                {question.options?.map((option: QuizOptionDTO, optionIndex: number) => {
                  const selectedIds = answers[question.id]?.selectedOptionIds || [];
                  const isSelected = selectedIds.includes(option.id);
                  const isMulti = question.questionType === QuestionType.MULTIPLE_CHOICE
                    && (question.correctOptionCount ?? 0) > 1;
                  const optionLabel = optionIndex < 26 ? String.fromCharCode(65 + optionIndex) : `${optionIndex + 1}`;

                  return (
                    <label
                      key={option.id}
                      className={`hud-quiz-attempt-option ${isSelected ? 'selected' : ''} ${isMulti ? 'multi' : 'single'}`}
                    >
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => {
                          if (isMulti) {
                            handleToggleOption(question.id, option.id);
                          } else {
                            handleSelectSingleOption(question.id, option.id);
                          }
                        }}
                        className="hud-quiz-attempt-option-input"
                        aria-label={option.optionText}
                      />
                      <div className={`hud-quiz-attempt-option-indicator ${isMulti ? 'multi' : 'single'}`}>
                        {isSelected && (
                          <div className={`hud-quiz-attempt-option-selected ${isMulti ? 'multi' : 'single'}`}></div>
                        )}
                      </div>
                      <span className="hud-quiz-attempt-option-key">{optionLabel}.</span>
                      <span className="hud-quiz-attempt-option-text">{option.optionText}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button - Nút nộp bài */}
      <div className="hud-quiz-attempt-navigation">
        <div className="hud-quiz-attempt-answer-status">
          <span className="hud-quiz-attempt-status-label">Tiến độ</span>
          <span className="hud-quiz-attempt-status-value">{answeredCount}/{totalQuestions} câu đã trả lời</span>
        </div>

        <button
          onClick={handleSubmit}
          className="hud-quiz-attempt-submit-btn"
          disabled={answeredCount === 0}
        >
          Nộp bài
        </button>
      </div>
    </div>
  );
};

export default QuizAttemptPage;