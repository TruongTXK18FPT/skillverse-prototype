import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, Zap, Trophy, Target, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import './QuizSprint.css';

interface QuizSprintProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number, coins: number) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  category: string;
}

const QuizSprint: React.FC<QuizSprintProps> = ({ isOpen, onClose, onComplete }) => {
  const [questions] = useState<Question[]>([
    {
      id: '1',
      question: 'React Hook nào được sử dụng để quản lý state?',
      options: ['useEffect', 'useState', 'useContext', 'useRef'],
      correct: 1,
      category: 'React'
    },
    {
      id: '2',
      question: 'CSS Grid được sử dụng cho mục đích gì?',
      options: ['Làm layout 2D', 'Chỉ cho responsive', 'Chỉ cho mobile', 'Thay thế JavaScript'],
      correct: 0,
      category: 'CSS'
    },
    {
      id: '3',
      question: 'TypeScript là gì?',
      options: ['Ngôn ngữ lập trình mới', 'Superset của JavaScript', 'Framework của React', 'Database'],
      correct: 1,
      category: 'TypeScript'
    },
    {
      id: '4',
      question: 'npm viết tắt của gì?',
      options: ['New Package Manager', 'Node Package Manager', 'Next Package Manager', 'Network Package Manager'],
      correct: 1,
      category: 'Node.js'
    },
    {
      id: '5',
      question: 'Git merge dùng để làm gì?',
      options: ['Xóa branch', 'Tạo branch mới', 'Kết hợp các branch', 'Đổi tên branch'],
      correct: 2,
      category: 'Git'
    }
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showRules] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const finishGame = useCallback(() => {
    setGameState('finished');
    setShowResult(true);
    
    // Calculate coins based on performance
    const baseCoins = correctAnswers * 10;
    const timeBonus = Math.floor(timeLeft / 10) * 5;
    const streakBonus = maxStreak >= 3 ? 20 : maxStreak >= 2 ? 10 : 0;
    const totalCoins = baseCoins + timeBonus + streakBonus;
    
    onComplete(correctAnswers, totalCoins);
  }, [correctAnswers, timeLeft, maxStreak, onComplete]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      finishGame();
    }
  }, [timeLeft, gameState, finishGame]);

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setTimeLeft(60);
    setStreak(0);
    setMaxStreak(0);
    setShowResult(false);
    setAnswerFeedback(null);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || gameState !== 'playing') return;

    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === currentQuestion.correct;
    setAnswerFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    // Move to next question or finish
    setTimeout(() => {
      if (isLastQuestion) {
        finishGame();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswerFeedback(null);
      }
    }, 1500);
  };

  const resetGame = () => {
    setGameState('waiting');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setTimeLeft(60);
    setStreak(0);
    setMaxStreak(0);
    setShowResult(false);
    setAnswerFeedback(null);
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100;
  };

  const getAnswerClass = (index: number) => {
    if (selectedAnswer === null) return '';
    if (selectedAnswer === index) {
      return answerFeedback === 'correct' ? 'correct' : 'incorrect';
    }
    if (index === currentQuestion.correct && answerFeedback === 'incorrect') {
      return 'correct-answer';
    }
    return 'disabled';
  };

  if (!isOpen) return null;

  return (
    <div className="quiz-sprint-overlay">
      <div className="quiz-sprint-modal">
        <div className="modal-header">
          <div className="header-info">
            <Zap className="header-icon" />
            <div>
              <h2>⚡ Quiz Sprint</h2>
              <p>5 câu hỏi trong 60 giây</p>
            </div>
          </div>
          <div className="header-actions">
            {/* <button 
              className="rules-btn"
              onClick={() => setShowRules(!showRules)}
            >
              Quy tắc
            </button> */}
            <button className="rules-btn" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        {showRules && (
          <div className="rules-section">
            <h3>⚡ Quy Tắc Quiz Sprint</h3>
            <ul>
              <li>🎯 Trả lời 5 câu hỏi trong vòng 60 giây</li>
              <li>💰 Mỗi câu đúng = 10 xu</li>
              <li>⏱️ Bonus thời gian: 5 xu cho mỗi 10 giây còn lại</li>
              <li>🔥 Bonus chuỗi: 2+ đúng liên tiếp = 10 xu, 3+ = 20 xu</li>
              <li>🎪 Không thể thay đổi câu trả lời sau khi chọn</li>
              <li>💡 Câu trả lời đúng sẽ được hiển thị nếu bạn chọn sai</li>
            </ul>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="waiting-screen">
            <div className="game-preview">
              <Target className="preview-icon" />
              <h3>Sẵn sàng thử thách?</h3>
              <p>5 câu hỏi về lập trình trong 60 giây. Bạn có thể làm được bao nhiêu?</p>
              <div className="stats-preview">
                <div className="stat-item">
                  <span className="stat-value">5</span>
                  <span className="stat-label">Câu hỏi</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">60s</span>
                  <span className="stat-label">Thời gian</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">50+</span>
                  <span className="stat-label">Xu tối đa</span>
                </div>
              </div>
              <button className="start-btn" onClick={startGame}>
                <Zap className="start-icon" />
                Bắt đầu Sprint!
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="game-screen">
            {/* Game Header */}
            <div className="game-header">
              <div className="timer-section">
                <Clock className="timer-icon" />
                <div className="timer-display">
                  <span className={`timer-value ${timeLeft <= 10 ? 'urgent' : ''}`}>
                    {timeLeft}s
                  </span>
                  <div className="timer-bar">
                    <div 
                      className="timer-fill"
                      style={{ width: `${(timeLeft / 60) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="score-section">
                <div className="score-item">
                  <span className="score-label">Điểm</span>
                  <span className="score-value">{correctAnswers}/{questions.length}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Chuỗi</span>
                  <span className={`score-value ${streak >= 2 ? 'streak-active' : ''}`}>
                    {streak}🔥
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <span className="progress-text">
                Câu {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>

            {/* Question */}
            <div className="question-section">
              <div className="category-tag">{currentQuestion.category}</div>
              <h3 className="question-text">{currentQuestion.question}</h3>
            </div>

            {/* Answers */}
            <div className="answers-section">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`answer-btn ${getAnswerClass(index)}`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                >
                    <span className="answer-letter">
                    {String.fromCharCode(65 + index)}.
                    </span>
                  <span className="answer-text">{option}</span>
                  {selectedAnswer === index && (
                    <span className="answer-feedback">
                      {answerFeedback === 'correct' ? (
                        <CheckCircle className="feedback-icon correct" />
                      ) : (
                        <XCircle className="feedback-icon incorrect" />
                      )}
                    </span>
                  )}
                  {index === currentQuestion.correct && 
                   selectedAnswer !== null && 
                   selectedAnswer !== index && (
                    <CheckCircle className="feedback-icon correct-answer" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {showResult && (
          <div className="result-screen">
            <div className="result-header">
              <div className="result-icon">
                {correctAnswers >= 4 ? '🏆' : correctAnswers >= 3 ? '🎯' : correctAnswers >= 2 ? '👍' : '💪'}
              </div>
              <h3>
                {correctAnswers >= 4 ? 'Xuất sắc!' : 
                 correctAnswers >= 3 ? 'Tốt lắm!' : 
                 correctAnswers >= 2 ? 'Khá ổn!' : 'Cố gắng lên!'}
              </h3>
            </div>

            <div className="result-stats">
              <div className="stat-card">
                <span className="stat-label">Điểm số</span>
                <span className="stat-value">{correctAnswers}/{questions.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Thời gian còn lại</span>
                <span className="stat-value">{timeLeft}s</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Chuỗi cao nhất</span>
                <span className="stat-value">{maxStreak}🔥</span>
              </div>
            </div>

            <div className="coin-breakdown">
              <h4>💰 Phân tích xu thưởng:</h4>
              <div className="breakdown-item">
                <span>Câu trả lời đúng ({correctAnswers} × 10)</span>
                <span>{correctAnswers * 10} xu</span>
              </div>
              <div className="breakdown-item">
                <span>Bonus thời gian ({Math.floor(timeLeft / 10)} × 5)</span>
                <span>{Math.floor(timeLeft / 10) * 5} xu</span>
              </div>
              <div className="breakdown-item">
                <span>Bonus chuỗi</span>
                <span>{maxStreak >= 3 ? 20 : maxStreak >= 2 ? 10 : 0} xu</span>
              </div>
              <div className="breakdown-total">
                <span>Tổng cộng</span>
                <span>{correctAnswers * 10 + Math.floor(timeLeft / 10) * 5 + (maxStreak >= 3 ? 20 : maxStreak >= 2 ? 10 : 0)} xu</span>
              </div>
            </div>

            <div className="result-actions">
              <button className="play-again-btn" onClick={resetGame}>
                <RotateCcw className="action-icon" />
                Chơi lại
              </button>
              <button className="play-again-btn" onClick={onClose}>
                <Trophy className="action-icon" />
                Hoàn thành
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSprint;
