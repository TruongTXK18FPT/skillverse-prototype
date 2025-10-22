import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, Clock, BookOpen, Award } from 'lucide-react';
import { QuizDetailDTO, QuestionType, QuizAnswerDTO, SubmitQuizDTO } from '../../data/quizDTOs';
import { submitQuiz } from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/QuizDisplay.css';

interface QuizDisplayProps {
  quiz: QuizDetailDTO;
  onComplete: (score: number, passed: boolean) => void;
  onClose: () => void;
}

interface StudentAnswer {
  questionId: number;
  selectedOptionIds: number[];
  textAnswer: string;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz, onComplete, onClose }) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize answers array
  useEffect(() => {
    const initialAnswers: StudentAnswer[] = quiz.questions.map(q => ({
      questionId: q.id,
      selectedOptionIds: [],
      textAnswer: ''
    }));
    setAnswers(initialAnswers);
  }, [quiz]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, optionId?: number, textAnswer?: string) => {
    setAnswers(prev => prev.map(answer => {
      if (answer.questionId === questionId) {
        if (optionId !== undefined) {
          // For multiple choice and true/false
          const currentSelected = answer.selectedOptionIds;
          const isSelected = currentSelected.includes(optionId);
          
          return {
            ...answer,
            selectedOptionIds: isSelected 
              ? currentSelected.filter(id => id !== optionId)
              : [...currentSelected, optionId]
          };
        } else if (textAnswer !== undefined) {
          // For short answer
          return {
            ...answer,
            textAnswer: textAnswer
          };
        }
      }
      return answer;
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const submitData: SubmitQuizDTO = {
        quizId: quiz.id,
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedOptionIds: answer.selectedOptionIds.length > 0 ? answer.selectedOptionIds : undefined,
          textAnswer: answer.textAnswer || undefined
        }))
      };

      const result = await submitQuiz(submitData, user.id);
      onComplete(result.score, result.passed);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="quiz-question-container">
        <div className="quiz-question-header">
          <div className="quiz-question-number">
            Câu {currentQuestionIndex + 1} / {quiz.questions.length}
          </div>
          <div className="quiz-question-score">
            {currentQuestion.score} điểm
          </div>
        </div>

        <div className="quiz-question-content">
          <h3 className="quiz-question-text">{currentQuestion.questionText}</h3>

          {/* Multiple Choice Questions */}
          {currentQuestion.questionType === QuestionType.MULTIPLE_CHOICE && (
            <div className="quiz-options-container">
              {currentQuestion.options.map((option, index) => (
                <label key={option.id} className="quiz-option-label">
                  <input
                    type="checkbox"
                    checked={currentAnswer?.selectedOptionIds.includes(option.id) || false}
                    onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                    className="quiz-option-checkbox"
                  />
                  <span className="quiz-option-text">{option.optionText}</span>
                </label>
              ))}
            </div>
          )}

          {/* True/False Questions */}
          {currentQuestion.questionType === QuestionType.TRUE_FALSE && (
            <div className="quiz-options-container">
              {currentQuestion.options.map((option, index) => (
                <label key={option.id} className="quiz-option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={currentAnswer?.selectedOptionIds.includes(option.id) || false}
                    onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                    className="quiz-option-radio"
                  />
                  <span className="quiz-option-text">{option.optionText}</span>
                </label>
              ))}
            </div>
          )}

          {/* Short Answer Questions */}
          {currentQuestion.questionType === QuestionType.SHORT_ANSWER && (
            <div className="quiz-short-answer-container">
              <div className="quiz-fill-blank-question">
                <p className="quiz-fill-blank-text">
                  {currentQuestion.questionText.includes('___') 
                    ? currentQuestion.questionText.split('___').map((part, index, array) => (
                        <span key={index}>
                          {part}
                          {index < array.length - 1 && (
                            <input
                              type="text"
                              value={currentAnswer?.textAnswer || ''}
                              onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                              placeholder="..."
                              className="quiz-fill-blank-input"
                              maxLength={50}
                            />
                          )}
                        </span>
                      ))
                    : (
                      <span>
                        {currentQuestion.questionText}
                        <input
                          type="text"
                          value={currentAnswer?.textAnswer || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                          placeholder="..."
                          className="quiz-fill-blank-input"
                          maxLength={50}
                        />
                      </span>
                    )
                  }
                </p>
              </div>
              <div className="quiz-short-answer-hint">
                Nhập câu trả lời ngắn gọn (tối đa 2 từ)
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div className="quiz-display-overlay">
      <div className="quiz-display-container">
        {/* Header */}
        <div className="quiz-display-header">
          <div className="quiz-display-title">
            <BookOpen size={24} />
            <h2>{quiz.title}</h2>
          </div>
          <div className="quiz-display-timer">
            <Clock size={20} />
            <span className={timeRemaining < 300 ? 'time-warning' : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <button onClick={onClose} className="quiz-display-close">
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="quiz-progress-bar">
          <div 
            className="quiz-progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        {/* Question Content */}
        <div className="quiz-display-content">
          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div className="quiz-display-navigation">
          <div className="quiz-navigation-buttons">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={isFirstQuestion}
              className="quiz-nav-button quiz-nav-prev"
            >
              ← Câu trước
            </button>

            <div className="quiz-question-indicators">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`quiz-question-indicator ${
                    index === currentQuestionIndex ? 'active' : ''
                  } ${
                    answers.find(a => a.questionId === quiz.questions[index].id)?.selectedOptionIds.length > 0 ||
                    answers.find(a => a.questionId === quiz.questions[index].id)?.textAnswer.trim() !== ''
                      ? 'answered' : ''
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
              disabled={isLastQuestion}
              className="quiz-nav-button quiz-nav-next"
            >
              Câu tiếp →
            </button>
          </div>

          {/* Submit Button */}
          <div className="quiz-submit-section">
            {error && (
              <div className="quiz-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="quiz-submit-button"
            >
              {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDisplay;
