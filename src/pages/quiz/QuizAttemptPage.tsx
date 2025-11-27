import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, RefreshCw, Award, AlertCircle, Lock, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getQuizById, submitQuiz, getUserQuizAttempts } from '../../services/quizService';
import '../../styles/QuizAttemptPage-HUD.css';

const MAX_ATTEMPTS = 3;
const RESET_HOURS = 24;

const QuizAttemptPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [viewMode, setViewMode] = useState<'start' | 'taking' | 'result'>('start');
  const [result, setResult] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
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
        console.log('[QUIZ] Loaded:', quizData);
        console.log('[QUIZ] Attempts:', attemptsData);
        
        setQuiz(quizData);
        setAttempts(attemptsData);
        
        // Calculate attempts in last 24h
        const now = new Date();
        const recentAttempts = attemptsData.filter((a: any) => {
          const attemptTime = new Date(a.submittedAt || a.createdAt);
          const hoursDiff = (now.getTime() - attemptTime.getTime()) / (1000 * 60 * 60);
          return hoursDiff < RESET_HOURS;
        });
        
        setAttemptsUsed(recentAttempts.length);
        setCanRetry(recentAttempts.length < MAX_ATTEMPTS);
        
        // Check if already passed
        const passedAttempt = attemptsData.find((a: any) => a.passed === true);
        if (passedAttempt) {
          setHasPassed(true);
          setBestScore(passedAttempt.score);
          setResult(passedAttempt);
          setViewMode('result');
        } else {
          // Get best score
          const scores = attemptsData.map((a: any) => a.score || 0);
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
      console.log('[QUIZ_SUBMIT] Submitting answers:', answers);
      const submitData = {
        quizId: quiz.id,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId: Number(questionId),
          selectedOptionId: optionId
        }))
      };
      
      const res = await submitQuiz(submitData, user.id);
      console.log('[QUIZ_SUBMIT] Result:', res);
      
      setResult(res);
      setViewMode('result');
      setAttemptsUsed(attemptsUsed + 1);
      
      if (res.passed) {
        setHasPassed(true);
      }
    } catch (err: any) {
      console.error('[QUIZ_SUBMIT] Failed:', err);
      alert('Không thể nộp bài: ' + (err.response?.data?.message || err.message));
    }
  };

  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-loading">
          <div className="hud-quiz-attempt-spinner"></div>
          <p>INITIALIZING NEURAL VERIFICATION</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-error">
          <AlertCircle size={48} />
          <h2>QUIZ DATA NOT FOUND</h2>
          <p>Unable to establish connection to quiz database</p>
          <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-back">
            <ArrowLeft size={18} />
            RETURN TO COURSE
          </button>
        </div>
      </div>
    );
  }

  // START SCREEN
  if (viewMode === 'start') {
    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-header">
          <button onClick={() => navigate(-1)} className="hud-quiz-attempt-back-btn">
            <ArrowLeft size={20} />
            <span>RETURN</span>
          </button>
        </div>

        <div className="hud-quiz-attempt-start-screen">
          <div className="hud-quiz-attempt-start-icon">
            <Zap size={64} />
          </div>
          <h1 className="hud-quiz-attempt-start-title">{quiz.title}</h1>
          <p className="hud-quiz-attempt-start-description">
            {quiz.description || 'Knowledge verification checkpoint'}
          </p>

          <div className="hud-quiz-attempt-start-info">
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">QUESTIONS:</span>
              <span className="hud-quiz-attempt-info-value">{totalQuestions}</span>
            </div>
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">PASS SCORE:</span>
              <span className="hud-quiz-attempt-info-value">{quiz.passScore}%</span>
            </div>
            <div className="hud-quiz-attempt-info-item">
              <span className="hud-quiz-attempt-info-label">ATTEMPTS:</span>
              <span className="hud-quiz-attempt-info-value">{attemptsUsed}/{MAX_ATTEMPTS}</span>
            </div>
            {bestScore !== null && (
              <div className="hud-quiz-attempt-info-item">
                <span className="hud-quiz-attempt-info-label">BEST SCORE:</span>
                <span className="hud-quiz-attempt-info-value">{bestScore}%</span>
              </div>
            )}
          </div>

          {hasPassed ? (
            <div className="hud-quiz-attempt-passed-notice">
              <div className="hud-quiz-attempt-passed-icon">
                <Award size={48} />
              </div>
              <h3>VERIFICATION COMPLETE</h3>
              <p className="hud-quiz-attempt-passed-score">
                SCORE: {bestScore}% | REQUIRED: {quiz.passScore}%
              </p>
              <p className="hud-quiz-attempt-passed-message">Neural sync verified. No re-attempt necessary.</p>
              <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-primary">
                <ArrowLeft size={18} />
                RETURN TO COURSE
              </button>
            </div>
          ) : !canRetry ? (
            <div className="hud-quiz-attempt-no-attempts">
              <div className="hud-quiz-attempt-locked-icon">
                <Lock size={48} />
              </div>
              <h3>ATTEMPTS DEPLETED</h3>
              <p>You have used all {MAX_ATTEMPTS} verification attempts.</p>
              <p className="hud-quiz-attempt-cooldown">Cooldown period: {RESET_HOURS} hours remaining</p>
              <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-secondary">
                <ArrowLeft size={18} />
                RETURN
              </button>
            </div>
          ) : (
            <div className="hud-quiz-attempt-start-actions">
              <button onClick={handleStartQuiz} className="hud-quiz-attempt-btn-start">
                <Zap size={20} />
                {attemptsUsed > 0 ? `RETRY VERIFICATION (${attemptsUsed}/${MAX_ATTEMPTS})` : 'BEGIN VERIFICATION'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULT SCREEN
  if (viewMode === 'result' && result) {
    const passed = result.passed || (result.score >= quiz.passScore);

    return (
      <div className="hud-quiz-attempt-container">
        <div className="hud-quiz-attempt-result">
          <div className={`hud-quiz-attempt-result-header ${passed ? 'passed' : 'failed'}`}>
            <div className="hud-quiz-attempt-result-icon">
              {passed ? <CheckCircle size={48} /> : <AlertCircle size={48} />}
            </div>
            <h2>{passed ? 'VERIFICATION SUCCESSFUL' : 'VERIFICATION FAILED'}</h2>
            <p className="hud-quiz-attempt-result-subtitle">
              {passed ? 'Neural sync complete - Data verified' : 'Neural sync incomplete - Retry required'}
            </p>
          </div>

          <div className="hud-quiz-attempt-result-score">
            <div className={`hud-quiz-attempt-score-circle ${passed ? 'passed' : 'failed'}`}>
              <span className="hud-quiz-attempt-score-value">{result.score || 0}%</span>
              <span className="hud-quiz-attempt-score-label">SCORE</span>
            </div>
          </div>

          <div className="hud-quiz-attempt-result-details">
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">CORRECT ANSWERS:</span>
              <span className="hud-quiz-attempt-detail-value">{result.correctCount || 0}/{totalQuestions}</span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">REQUIRED SCORE:</span>
              <span className="hud-quiz-attempt-detail-value">{quiz.passScore}%</span>
            </div>
            <div className="hud-quiz-attempt-detail-item">
              <span className="hud-quiz-attempt-detail-label">ATTEMPTS USED:</span>
              <span className="hud-quiz-attempt-detail-value">{attemptsUsed}/{MAX_ATTEMPTS}</span>
            </div>
          </div>

          <div className="hud-quiz-attempt-result-actions">
            <button onClick={() => navigate(-1)} className="hud-quiz-attempt-btn-back">
              <ArrowLeft size={18} />
              RETURN TO COURSE
            </button>
            {!passed && canRetry && attemptsUsed < MAX_ATTEMPTS && (
              <button onClick={() => window.location.reload()} className="hud-quiz-attempt-btn-retry">
                <RefreshCw size={18} />
                RETRY ({attemptsUsed}/{MAX_ATTEMPTS})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TAKING QUIZ SCREEN
  return (
    <div className="hud-quiz-attempt-container hud-quiz-attempt-taking">
      {/* Header */}
      <div className="hud-quiz-attempt-header">
        <button onClick={() => navigate(-1)} className="hud-quiz-attempt-back-btn">
          <ArrowLeft size={20} />
          <span>ABORT</span>
        </button>
        <h1 className="hud-quiz-attempt-title">{quiz.title}</h1>
        <div className="hud-quiz-attempt-progress-indicator">
          <span>{answeredCount}/{totalQuestions}</span>
        </div>
      </div>

      {/* ALL QUESTIONS - Show all at once */}
      <div className="hud-quiz-attempt-all-questions">
        {quiz.questions?.map((question: any, idx: number) => (
          <div key={question.id} className="hud-quiz-attempt-question-card">
            <div className="hud-quiz-attempt-question-header">
              <span className="hud-quiz-attempt-question-number">QUESTION {idx + 1}</span>
              {answers[question.id] && (
                <span className="hud-quiz-attempt-question-answered">
                  <CheckCircle size={16} />
                  ANSWERED
                </span>
              )}
            </div>

            <p className="hud-quiz-attempt-question-text">{question.questionText}</p>

            {/* Options */}
            <div className="hud-quiz-attempt-options">
              {question.options?.map((option: any) => (
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

      {/* Submit Button */}
      <div className="hud-quiz-attempt-navigation">
        <div className="hud-quiz-attempt-answer-status">
          <span className="hud-quiz-attempt-status-label">PROGRESS:</span>
          <span className="hud-quiz-attempt-status-value">{answeredCount}/{totalQuestions} ANSWERED</span>
        </div>

        <button
          onClick={handleSubmit}
          className="hud-quiz-attempt-submit-btn"
          disabled={answeredCount === 0}
        >
          <CheckCircle size={20} />
          SUBMIT VERIFICATION
        </button>
      </div>
    </div>
  );
};

export default QuizAttemptPage;
