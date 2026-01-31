import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Award, AlertCircle, Lock, Zap, RotateCcw } from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { useAuth } from '../../context/AuthContext';
import { getQuizById, submitQuiz, getUserQuizAttempts } from '../../services/quizService';
import { QuizDetailDTO, QuizAttemptDTO, QuizQuestionDetailDTO, QuizOptionDTO } from '../../data/quizDTOs';
import '../../styles/QuizAttemptPage-HUD.css';

const MAX_ATTEMPTS = 3;
const RESET_HOURS = 24;

const QuizAttemptPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [viewMode, setViewMode] = useState<'start' | 'taking' | 'result'>('start');
  const [result, setResult] = useState<QuizAttemptDTO | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [canRetry, setCanRetry] = useState(true);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [hasPassed, setHasPassed] = useState(false);

  // Load quiz and attempts
  useEffect(() => {
    if (!quizId || !user) return;
    
    setLoading(true);
    Promise.all([
      getQuizById(Number(quizId)),
      getUserQuizAttempts(Number(quizId), user.id).catch(() => [])
    ])
      .then(([quizData, attemptsData]) => {
        setQuiz(quizData);
        
        // Calculate attempts in last 24h
        const now = new Date();
        const recentAttempts = attemptsData.filter((a) => {
          const attemptTime = new Date(a.completedAt || a.startedAt);
          const hoursDiff = (now.getTime() - attemptTime.getTime()) / (1000 * 60 * 60);
          return hoursDiff < RESET_HOURS;
        });
        
        setAttemptsUsed(recentAttempts.length);
        setCanRetry(recentAttempts.length < MAX_ATTEMPTS);
        
        // Check if already passed
        const passedAttempt = attemptsData.find((a) => a.passed === true);
        if (passedAttempt) {
          setHasPassed(true);
          setBestScore(passedAttempt.score);
          setResult(passedAttempt);
          setViewMode('result');
        } else {
          // Get best score
          const scores = attemptsData.map((a) => a.score || 0);
          if (scores.length > 0) {
            setBestScore(Math.max(...scores));
          }
        }
      })
      .catch((err) => {
        console.error('[QUIZ] Failed to load:', err);
      })
      .finally(() => setLoading(false));
  }, [quizId, user]);

  const handleSelectAnswer = (questionId: number, optionId: number) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  // Handler để làm lại quiz - reset state thay vì reload page
  const handleRetryQuiz = useCallback(() => {
    setViewMode('start');
    setAnswers({});
    setResult(null);
  }, []);

  const handleStartQuiz = () => {
    if (!canRetry) {
      alert(`Bạn đã hết lượt làm bài. Vui lòng quay lại sau ${RESET_HOURS} giờ.`);
      return;
    }
    setViewMode('taking');
    setAnswers({});
  };

  const handleSubmit = async () => {
    if (!user || !quiz) return;
    
    const totalQuestions = quiz.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    
    if (answeredCount < totalQuestions) {
      if (!window.confirm(`Bạn mới trả lời ${answeredCount}/${totalQuestions} câu. Xác nhận nộp bài?`)) {
        return;
      }
    }

    try {
      
      const submitData = {
        quizId: quiz.id,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId: Number(questionId),
          selectedOptionId: optionId
        }))
      };
      
      const res = await submitQuiz(submitData, user.id);
      
      
      setResult(res);
      setViewMode('result');
      setAttemptsUsed(attemptsUsed + 1);
      
      if (res.passed) {
        setHasPassed(true);
      }
    } catch (err: unknown) {
      console.error('[QUIZ_SUBMIT] Failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Không thể nộp bài: ' + errorMessage);
    }
  };

  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;

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
          <h2>KHÔNG TÌM THẤY BÀI KIỂM TRA</h2>
          <p>Không thể kết nối đến dữ liệu bài kiểm tra</p>
          <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-back">
            <ArrowLeft size={18} />
            QUAY LẠI KHÓA HỌC
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
          <button onClick={() => navigate(-1)} className="hud-quiz-attempt-back-btn">
            <ArrowLeft size={20} />
            <span>QUAY LẠI</span>
          </button>
        </div>

        <div className="hud-quiz-attempt-start-screen">
          <div className="hud-quiz-attempt-start-icon">
            <Zap size={64} />
          </div>
          <h1 className="hud-quiz-attempt-start-title">{quiz.title}</h1>
          <p className="hud-quiz-attempt-start-description">
            {quiz.description || 'Hoàn thành bài kiểm tra để đánh giá kiến thức của bạn'}
          </p>

          <div className="hud-quiz-attempt-start-info">
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">SỐ CÂU HỎI:</span>
              <span className="hud-quiz-attempt-info-value">{totalQuestions}</span>
            </div>
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">ĐIỂM ĐẠT:</span>
              <span className="hud-quiz-attempt-info-value">{quiz.passScore}%</span>
            </div>
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">SỐ LẦN ĐÃ THỬ:</span>
              <span className="hud-quiz-attempt-info-value">{attemptsUsed}/{MAX_ATTEMPTS}</span>
            </div>
            {bestScore !== null && (
              <div className="hud-quiz-attempt-info-item">
                <span className="hud-quiz-attempt-info-label">ĐIỂM CAO NHẤT:</span>
                <span className="hud-quiz-attempt-info-value">{bestScore}%</span>
              </div>
            )}
          </div>

          {hasPassed ? (
            <div className="hud-quiz-attempt-passed-notice">
              <div className="hud-quiz-attempt-passed-icon">
                <Award size={48} />
              </div>
              <h3>ĐÃ HOÀN THÀNH</h3>
              <p className="hud-quiz-attempt-passed-score">
                ĐIỂM: {bestScore}% | YÊU CẦU: {quiz.passScore}%
              </p>
              <p className="hud-quiz-attempt-passed-message">Bạn đã đạt điểm yêu cầu. Không cần làm lại bài kiểm tra.</p>
              <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-primary">
                <ArrowLeft size={18} />
                QUAY LẠI KHÓA HỌC
              </button>
            </div>
          ) : !canRetry ? (
            <div className="hud-quiz-attempt-no-attempts">
              <div className="hud-quiz-attempt-locked-icon">
                <Lock size={48} />
              </div>
              <h3>HẾT LƯỢT LÀM BÀI</h3>
              <p>Bạn đã sử dụng hết {MAX_ATTEMPTS} lượt làm bài.</p>
              <p className="hud-quiz-attempt-cooldown">Thời gian chờ: {RESET_HOURS} giờ</p>
              <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-secondary">
                <ArrowLeft size={18} />
                QUAY LẠI
              </button>
            </div>
          ) : (
            <div className="hud-quiz-attempt-start-actions">
              <button onClick={handleStartQuiz} className="hud-quiz-attempt-btn-start">
                <Zap size={20} />
                {attemptsUsed > 0 ? `LÀM LẠI BÀI KIỂM TRA (${attemptsUsed}/${MAX_ATTEMPTS})` : 'BẮT ĐẦU LÀM BÀI'}
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

    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-result">
          <div className={`hud-quiz-attempt-result-header ${passed ? 'passed' : 'failed'}`}>
            <div className="hud-quiz-attempt-result-icon">
              {passed ? <CheckCircle size={48} /> : <AlertCircle size={48} />}
            </div>
            <h2>{passed ? 'CHÚC MỪNG! BẠN ĐÃ ĐẠT' : 'CHƯA ĐẠT YÊU CẦU'}</h2>
            <p className="hud-quiz-attempt-result-subtitle">
              {passed ? 'Bạn đã hoàn thành bài kiểm tra thành công!' : 'Hãy xem lại bài học và thử lại nhé!'}
            </p>
          </div>

          <div className="hud-quiz-attempt-result-score">
            <div className={`hud-quiz-attempt-score-circle ${passed ? 'passed' : 'failed'}`}>
              <span className="hud-quiz-attempt-score-value">{result.score || 0}%</span>
              <span className="hud-quiz-attempt-score-label">ĐIỂM</span>
            </div>
          </div>

          <div className="hud-quiz-attempt-result-details">
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">ĐIỂM ĐẠT ĐƯỢC:</span>
              <span className="hud-quiz-attempt-detail-value">
                {result.scoreEarned !== undefined 
                  ? result.scoreEarned 
                  : (Math.round((result.correctCount / totalQuestions) * 100))
                }
                /
                {result.totalPossibleScore !== undefined
                  ? result.totalPossibleScore
                  : 100
                }
              </span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">SỐ CÂU ĐÚNG:</span>
              <span className="hud-quiz-attempt-detail-value">{result.correctCount || 0}/{totalQuestions}</span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">ĐIỂM YÊU CẦU:</span>
              <span className="hud-quiz-attempt-detail-value">{quiz.passScore}%</span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">SỐ LẦN ĐÃ THỬ:</span>
              <span className="hud-quiz-attempt-detail-value">{attemptsUsed}/{MAX_ATTEMPTS}</span>
            </div>
          </div>

          <div className="hud-quiz-attempt-result-actions">
            <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-back">
              <ArrowLeft size={18} />
              QUAY LẠI KHÓA HỌC
            </button>
            {!passed && canRetry && attemptsUsed < MAX_ATTEMPTS && (
              <button onClick={handleRetryQuiz} className="hud-quiz-attempt-btn-retry">
                <RotateCcw size={18} />
                LÀM LẠI ({attemptsUsed}/{MAX_ATTEMPTS})
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
      {/* Header */}
      <div className="hud-quiz-attempt-header">
        <button onClick={() => navigate(-1)} className="hud-quiz-attempt-back-btn">
          <ArrowLeft size={20} />
          <span>THOÁT</span>
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
              <span className="hud-quiz-attempt-question-number">CÂU HỎI {idx + 1}</span>
              {answers[question.id] && (
                <span className="hud-quiz-attempt-question-answered">
                  <CheckCircle size={16} />
                  ĐÃ TRẢ LỜI
                </span>
              )}
            </div>

            <p className="hud-quiz-attempt-question-text">{question.questionText}</p>

            {/* Options */}
            <div className="hud-quiz-attempt-options">
              {question.options?.map((option: QuizOptionDTO) => (
                <label
                  key={option.id}
                  className={`hud-quiz-attempt-option ${answers[question.id] === option.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => handleSelectAnswer(question.id, option.id)}
                    style={{ display: 'none' }}
                  />
                  <div className="hud-quiz-attempt-option-indicator">
                    {answers[question.id] === option.id && <div className="hud-quiz-attempt-option-selected"></div>}
                  </div>
                  <span className="hud-quiz-attempt-option-text">{option.optionText}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button - Nút nộp bài */}
      <div className="hud-quiz-attempt-navigation">
        <div className="hud-quiz-attempt-answer-status">
          <span className="hud-quiz-attempt-status-label">TIẾN ĐỘ:</span>
          <span className="hud-quiz-attempt-status-value">{answeredCount}/{totalQuestions} CÂU ĐÃ TRẢ LỜI</span>
        </div>

        <button
          onClick={handleSubmit}
          className="hud-quiz-attempt-submit-btn"
          disabled={answeredCount === 0}
        >
          <CheckCircle size={20} />
          NỘP BÀI
        </button>
      </div>
    </div>
  );
};

export default QuizAttemptPage;
