import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, RefreshCw, Award, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getQuizById, submitQuiz, getUserQuizAttempts } from '../../services/quizService';
import '../../styles/QuizAttemptPage.css';

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
      <div className="quiz-attempt-container">
        <div className="quiz-loading">Đang tải quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-attempt-container">
        <div className="quiz-error">Không tìm thấy quiz</div>
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  // START SCREEN
  if (viewMode === 'start') {
    return (
      <div className="quiz-attempt-container">
        <div className="quiz-header">
          <button onClick={() => navigate(-1)} className="quiz-back-btn">
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        <div className="quiz-start-screen">
          <h1 className="quiz-start-title">{quiz.title}</h1>
          <p className="quiz-start-description">{quiz.description || 'Kiểm tra kiến thức của bạn'}</p>
          
          <div className="quiz-start-info">
            <div className="quiz-info-item">
              <strong>Số câu hỏi:</strong> {totalQuestions}
            </div>
            <div className="quiz-info-item">
              <strong>Điểm đạt:</strong> {quiz.passScore}%
            </div>
            <div className="quiz-info-item">
              <strong>Số lần làm:</strong> {attemptsUsed}/{MAX_ATTEMPTS}
            </div>
            {bestScore !== null && (
              <div className="quiz-info-item">
                <strong>Điểm cao nhất:</strong> {bestScore}%
              </div>
            )}
          </div>

          {hasPassed ? (
            <div className="quiz-passed-notice">
              <Award size={48} style={{ color: '#28a745', marginBottom: '16px' }} />
              <h3>✅ Bạn đã hoàn thành quiz này!</h3>
              <p>Điểm số: {bestScore}% (Đạt yêu cầu: {quiz.passScore}%)</p>
              <button onClick={() => navigate(-1)} className="quiz-start-btn">
                Quay lại khóa học
              </button>
            </div>
          ) : !canRetry ? (
            <div className="quiz-no-attempts">
              <AlertCircle size={48} style={{ color: '#dc3545', marginBottom: '16px' }} />
              <h3>Đã hết lượt làm bài</h3>
              <p>Bạn đã sử dụng hết {MAX_ATTEMPTS} lần làm bài.</p>
              <p>Vui lòng quay lại sau {RESET_HOURS} giờ để làm lại.</p>
              <button onClick={() => navigate(-1)} className="quiz-start-btn secondary">
                Quay lại
              </button>
            </div>
          ) : (
            <div className="quiz-start-actions">
              <button onClick={handleStartQuiz} className="quiz-start-btn">
                {attemptsUsed > 0 ? `Làm lại (${attemptsUsed}/${MAX_ATTEMPTS})` : 'Bắt đầu Quiz'}
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
      <div className="quiz-attempt-container">
        <div className="quiz-result">
          <h2>🎉 Kết quả Quiz</h2>
          <div className="quiz-attempt-result-score">
            <div className="quiz-attempt-score-circle">
              <span className="quiz-attempt-score-value">{result.score || 0}%</span>
            </div>
            <p className={passed ? 'passed' : 'failed'}>
              {passed ? '✅ Đạt' : '❌ Chưa đạt'} (Yêu cầu: {quiz.passScore}%)
            </p>
          </div>
          
          <div className="quiz-result-details">
            <p>Số câu đúng: {result.correctCount || 0}/{totalQuestions}</p>
            <p>Lần làm: {attemptsUsed}/{MAX_ATTEMPTS}</p>
          </div>
          
          <div className="quiz-attempt-result-actions">
            <button onClick={() => navigate(-1)} className="quiz-attempt-btn-back">
              Quay lại khóa học
            </button>
            {!passed && canRetry && attemptsUsed < MAX_ATTEMPTS && (
              <button onClick={() => window.location.reload()} className="quiz-attempt-btn-retry">
                <RefreshCw size={18} />
                Làm lại ({attemptsUsed}/{MAX_ATTEMPTS})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TAKING QUIZ SCREEN
  return (
    <div className="quiz-attempt-container">
      {/* Header */}
      <div className="quiz-header">
        <button onClick={() => navigate(-1)} className="quiz-back-btn">
          <ArrowLeft size={20} />
          Quay lại
        </button>
        <h1 className="quiz-title">{quiz.title}</h1>
      </div>

      {/* ALL QUESTIONS - Show all at once like Coursera */}
      <div className="quiz-all-questions">
        {quiz.questions?.map((question: any, idx: number) => (
          <div key={question.id} className="quiz-question-container">
            <h2 className="quiz-attempt-question-title">
              Câu hỏi {idx + 1}
            </h2>
            <p className="quiz-attempt-question-text">{question.questionText}</p>

            {/* Options */}
            <div className="quiz-options">
              {question.options?.map((option: any) => (
                <label
                  key={option.id}
                  className={`quiz-option ${answers[question.id] === option.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => handleSelectAnswer(question.id, option.id)}
                  />
                  <span className="quiz-attempt-option-text">{option.optionText}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="quiz-attempt-navigation">
        <div className="quiz-answer-status">
          {answeredCount}/{totalQuestions} câu đã trả lời
        </div>

        <button 
          onClick={handleSubmit} 
          className="quiz-attempt-nav-btn quiz-attempt-submit-btn"
          disabled={answeredCount === 0}
        >
          <CheckCircle size={20} />
          Nộp bài ({answeredCount}/{totalQuestions})
        </button>
      </div>
    </div>
  );
};

export default QuizAttemptPage;
