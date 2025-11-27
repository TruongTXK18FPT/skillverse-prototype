import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, Clock, BookOpen, Award, X } from 'lucide-react';
import { QuizDetailDTO, QuestionType, QuizAnswerDTO, SubmitQuizDTO } from '../../data/quizDTOs';
import { submitQuiz } from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { NeuralCard, NeuralButton } from '../learning-hud';
import '../learning-hud/learning-hud.css';

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
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <NeuralCard style={{ marginBottom: '1.5rem', padding: '2rem' }}>
        {/* Question Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--lhud-border)'
        }}>
          <div style={{
            fontFamily: 'Space Habitat, monospace',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--lhud-cyan)'
          }}>
            Câu {currentQuestionIndex + 1} / {quiz.questions.length}
          </div>
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid var(--lhud-cyan)',
            borderRadius: '4px',
            fontFamily: 'Space Habitat, monospace',
            fontSize: '0.875rem',
            color: 'var(--lhud-cyan)'
          }}>
            {currentQuestion.score} điểm
          </div>
        </div>

        {/* Question Text */}
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--lhud-text-primary)',
          marginBottom: '1.5rem',
          lineHeight: 1.6
        }}>
          {currentQuestion.questionText}
        </h3>

        {/* Multiple Choice Questions */}
        {currentQuestion.questionType === QuestionType.MULTIPLE_CHOICE && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer?.selectedOptionIds.includes(option.id) || false;
              return (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'var(--lhud-surface)',
                    border: isSelected ? '2px solid var(--lhud-cyan)' : '2px solid var(--lhud-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--lhud-cyan)';
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--lhud-border)';
                      e.currentTarget.style.background = 'var(--lhud-surface)';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: isSelected ? '2px solid var(--lhud-cyan)' : '2px solid var(--lhud-border)',
                    background: isSelected ? 'var(--lhud-cyan)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}>
                    {isSelected && <CheckCircle size={16} color="var(--lhud-deep-space)" />}
                  </div>
                  <span style={{
                    fontSize: '0.95rem',
                    color: 'var(--lhud-text-primary)',
                    lineHeight: 1.5
                  }}>
                    {option.optionText}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* True/False Questions */}
        {currentQuestion.questionType === QuestionType.TRUE_FALSE && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer?.selectedOptionIds.includes(option.id) || false;
              return (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'var(--lhud-surface)',
                    border: isSelected ? '2px solid var(--lhud-cyan)' : '2px solid var(--lhud-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--lhud-cyan)';
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--lhud-border)';
                      e.currentTarget.style.background = 'var(--lhud-surface)';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: isSelected ? '2px solid var(--lhud-cyan)' : '2px solid var(--lhud-border)',
                    background: isSelected ? 'var(--lhud-cyan)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}>
                    {isSelected && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--lhud-deep-space)'
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.95rem',
                    color: 'var(--lhud-text-primary)',
                    lineHeight: 1.5
                  }}>
                    {option.optionText}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* Short Answer Questions */}
        {currentQuestion.questionType === QuestionType.SHORT_ANSWER && (
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              {currentQuestion.questionText.includes('___')
                ? currentQuestion.questionText.split('___').map((part, index, array) => (
                    <span key={index} style={{
                      fontSize: '1rem',
                      color: 'var(--lhud-text-primary)',
                      lineHeight: 1.8
                    }}>
                      {part}
                      {index < array.length - 1 && (
                        <input
                          type="text"
                          value={currentAnswer?.textAnswer || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                          placeholder="..."
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'var(--lhud-surface)',
                            border: '2px solid var(--lhud-border)',
                            borderRadius: '4px',
                            color: 'var(--lhud-cyan)',
                            fontSize: '0.95rem',
                            fontFamily: 'Inter, sans-serif',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            minWidth: '200px',
                            margin: '0 0.5rem'
                          }}
                          maxLength={50}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                        />
                      )}
                    </span>
                  ))
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={currentAnswer?.textAnswer || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                      placeholder="Nhập câu trả lời..."
                      style={{
                        padding: '0.75rem',
                        background: 'var(--lhud-surface)',
                        border: '2px solid var(--lhud-border)',
                        borderRadius: '6px',
                        color: 'var(--lhud-text-primary)',
                        fontSize: '0.95rem',
                        fontFamily: 'Inter, sans-serif',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      maxLength={50}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                    />
                  </div>
                )
              }
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--lhud-text-dim)',
              fontFamily: 'Space Habitat, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Nhập câu trả lời ngắn gọn (tối đa 2 từ)
            </div>
          </div>
        )}
      </NeuralCard>
    );
  };

  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div className="learning-hud-quiz-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 14, 23, 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      animation: 'learning-hud-fade-in 0.3s ease-out'
    }}>
      <NeuralCard style={{
        maxWidth: '900px',
        width: '100%',
        maxHeight: 'calc(90vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'learning-hud-modal-slide-up 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--lhud-border)',
          background: 'rgba(6, 182, 212, 0.03)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <BookOpen size={24} color="var(--lhud-cyan)" />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--lhud-text-primary)',
              margin: 0
            }}>
              {quiz.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: timeRemaining < 300 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)',
              border: timeRemaining < 300 ? '1px solid #ef4444' : '1px solid var(--lhud-cyan)',
              borderRadius: '4px'
            }}>
              <Clock size={20} color={timeRemaining < 300 ? '#ef4444' : 'var(--lhud-cyan)'} />
              <span style={{
                fontFamily: 'Space Habitat, monospace',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: timeRemaining < 300 ? '#ef4444' : 'var(--lhud-cyan)'
              }}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--lhud-text-dim)',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--lhud-cyan)';
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--lhud-text-dim)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '4px',
          background: 'var(--lhud-space-light)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--lhud-cyan), #0ea5e9)',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px var(--lhud-cyan-glow)'
          }} />
        </div>

        {/* Question Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid var(--lhud-border)',
          background: 'rgba(6, 182, 212, 0.02)'
        }}>
          {/* Question Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {quiz.questions.map((_, index) => {
              const isAnswered = answers.find(a => a.questionId === quiz.questions[index].id)?.selectedOptionIds.length > 0 ||
                                answers.find(a => a.questionId === quiz.questions[index].id)?.textAnswer.trim() !== '';
              const isActive = index === currentQuestionIndex;

              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    border: isActive ? '2px solid var(--lhud-cyan)' : isAnswered ? '2px solid var(--lhud-green)' : '2px solid var(--lhud-border)',
                    background: isActive ? 'var(--lhud-cyan)' : isAnswered ? 'rgba(16, 185, 129, 0.1)' : 'var(--lhud-surface)',
                    color: isActive ? 'var(--lhud-deep-space)' : isAnswered ? 'var(--lhud-green)' : 'var(--lhud-text-secondary)',
                    fontFamily: 'Space Habitat, monospace',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--lhud-cyan)';
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = isAnswered ? 'var(--lhud-green)' : 'var(--lhud-border)';
                      e.currentTarget.style.background = isAnswered ? 'rgba(16, 185, 129, 0.1)' : 'var(--lhud-surface)';
                    }
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <NeuralButton
              variant="secondary"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={isFirstQuestion}
            >
              ← Câu trước
            </NeuralButton>

            <div style={{ flex: 1 }}>
              {error && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <NeuralButton
              variant="secondary"
              onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
              disabled={isLastQuestion}
            >
              Câu tiếp →
            </NeuralButton>
          </div>

          {/* Submit Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            <NeuralButton
              variant="success"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ minWidth: '200px' }}
            >
              {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài'}
            </NeuralButton>
          </div>
        </div>
      </NeuralCard>
    </div>
  );
};

export default QuizDisplay;