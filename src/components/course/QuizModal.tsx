import React, { useEffect, useState } from "react";
import { X, Plus, GripVertical, Trash2, CheckCircle, Circle, AlertCircle } from "lucide-react";

import {
  QuizCreateDTO,
  QuizUpdateDTO,
  QuestionType,
} from "../../data/quizDTOs";
import { createQuiz, updateQuiz, addQuizQuestion, addQuizOption, updateQuizQuestion, updateQuizOption, deleteQuizOption, getQuizById } from "../../services/quizService";
import { useAuth } from "../../context/AuthContext";
import { NeuralCard, NeuralButton } from '../learning-hud';
import '../../components/learning-hud/learning-hud.css';

// ---------- Types ----------
interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  onSuccess: () => void;
  quizToEdit?: {
    id: number;
    title: string;
    description: string;
    passScore: number;
  };
}

interface OptionForm {
  id?: number;
  optionText: string;
  correct: boolean;
  orderIndex: number;
}

interface QuestionForm {
  id?: number;
  questionText: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  options: OptionForm[];
}

// ---------- Component ----------
const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, moduleId, onSuccess, quizToEdit }) => {
  const { user } = useAuth();

  // Stepper only for creating new quiz
  const [step, setStep] = useState<"basic" | "questions">("basic");

  // Basic info
  const [formData, setFormData] = useState<{ title: string; description: string; passScore: number }>(
    { title: "", description: "", passScore: 70 }
  );

  // Questions (new quiz only)
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset / hydrate when opening
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setStep("basic");

    if (quizToEdit) {
      setFormData({
        title: quizToEdit.title,
        description: quizToEdit.description,
        passScore: quizToEdit.passScore,
      });
      // Load existing questions + options for editing
      getQuizById(quizToEdit.id).then(detail => {
        const qs: QuestionForm[] = (detail.questions || []).sort((a,b)=> (a.orderIndex??0)-(b.orderIndex??0)).map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          score: q.score,
          orderIndex: q.orderIndex ?? 0,
          options: (q.options || []).sort((a,b)=> (a.orderIndex??0)-(b.orderIndex??0)).map(o => ({
            id: o.id,
            optionText: o.optionText,
            correct: !!o.correct,
            orderIndex: o.orderIndex ?? 0
          }))
        }));
        setQuestions(qs);
        setStep("questions");
      }).catch(()=>{
        setQuestions([]);
      });
    } else {
      setFormData({ title: "", description: "", passScore: 70 });
      setQuestions([]);
    }
  }, [isOpen, quizToEdit]);

  // ---------- Helpers ----------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "passScore" ? Number(value) : value }));
  };

  const addQuestion = () => {
    const newQ: QuestionForm = {
      questionText: "",
      questionType: QuestionType.MULTIPLE_CHOICE,
      score: 10,
      orderIndex: questions.length,
      options: [
        { optionText: "", correct: true, orderIndex: 0 },
        { optionText: "", correct: false, orderIndex: 1 },
      ],
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const removeQuestion = (qIndex: number) => {
    const updated = questions.filter((_, i) => i !== qIndex).map((q, i) => ({ ...q, orderIndex: i }));
    setQuestions(updated);
  };

  const updateQuestion = (qIndex: number, field: keyof QuestionForm, value: any) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], [field]: value } as QuestionForm;
      return next;
    });
  };

  const addOption = (qIndex: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = next[qIndex];

      // Kiểm tra giới hạn options dựa trên loại câu hỏi
      if (q.questionType === QuestionType.SHORT_ANSWER) {
        // Short Answer chỉ có 1 option
        if (q.options.length >= 1) {
          return next; // Không add thêm
        }
      } else if (q.questionType === QuestionType.TRUE_FALSE) {
        // True/False chỉ có 2 options
        if (q.options.length >= 2) {
          return next; // Không add thêm
        }
      }

      const newOpt: OptionForm = { optionText: "", correct: false, orderIndex: q.options.length };
      q.options = [...q.options, newOpt];
      next[qIndex] = { ...q };
      return next;
    });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = next[qIndex];

      // Kiểm tra giới hạn tối thiểu dựa trên loại câu hỏi
      if (q.questionType === QuestionType.SHORT_ANSWER) {
        // Short Answer phải có ít nhất 1 option
        if (q.options.length <= 1) {
          return next; // Không xóa
        }
      } else if (q.questionType === QuestionType.TRUE_FALSE) {
        // True/False phải có ít nhất 2 options
        if (q.options.length <= 2) {
          return next; // Không xóa
        }
      } else if (q.questionType === QuestionType.MULTIPLE_CHOICE) {
        // Multiple Choice phải có ít nhất 2 options
        if (q.options.length <= 2) {
          return next; // Không xóa
        }
      }

      q.options = q.options.filter((_, i) => i !== oIndex).map((opt, i) => ({ ...opt, orderIndex: i }));
      next[qIndex] = { ...q };
      return next;
    });
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof OptionForm, value: any) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = next[qIndex];
      const opt = { ...q.options[oIndex], [field]: value } as OptionForm;
      q.options = q.options.map((o, i) => (i === oIndex ? opt : o));
      next[qIndex] = { ...q };
      return next;
    });
  };

  const toggleCorrectAnswer = (qIndex: number, oIndex: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = next[qIndex];
      if (q.questionType === QuestionType.TRUE_FALSE || q.questionType === QuestionType.MULTIPLE_CHOICE) {
        // single-correct behavior for TRUE_FALSE; for MULTIPLE_CHOICE allow multi by toggling below if desired
        const singleCorrect = q.questionType === QuestionType.TRUE_FALSE;
        if (singleCorrect) {
          q.options = q.options.map((opt, i) => ({ ...opt, correct: i === oIndex }));
        } else {
          q.options = q.options.map((opt, i) => (i === oIndex ? { ...opt, correct: !opt.correct } : opt));
        }
      }
      next[qIndex] = { ...q };
      return next;
    });
  };

  // ---------- Validation ----------
  const validateBasicInfo = (): boolean => {
    if (!formData.title.trim()) return setError("Tiêu đề quiz là bắt buộc"), false;
    if (!formData.description.trim()) return setError("Mô tả quiz là bắt buộc"), false;
    if (formData.passScore < 0 || formData.passScore > 100) return setError("Điểm đạt phải từ 0 đến 100"), false;
    return true;
  };

  const validateQuestions = (): boolean => {
    if (quizToEdit) return true; // editing basic info only

    if (questions.length === 0) return setError("Quiz phải có ít nhất một câu hỏi"), false;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return setError(`Câu hỏi ${i + 1} không được để trống`), false;
      if (q.score <= 0) return setError(`Điểm số câu ${i + 1} phải lớn hơn 0`), false;

      if (q.questionType === QuestionType.SHORT_ANSWER) {
        // Yêu cầu một đáp án ngắn (≤ 2 từ)
        if (q.options.length !== 1) return setError(`Câu hỏi ${i + 1} (Short Answer) cần đúng 1 đáp án`), false;
        const ans = (q.options[0].optionText || '').trim();
        if (!ans) return setError(`Câu hỏi ${i + 1} (Short Answer) chưa nhập đáp án`), false;
        const words = ans.split(/\s+/).filter(Boolean);
        if (words.length > 2) return setError(`Đáp án câu ${i + 1} quá dài (tối đa 2 từ)`), false;
        continue;
      }

      if (q.questionType === QuestionType.TRUE_FALSE) {
        if (q.options.length !== 2) return setError(`Câu hỏi ${i + 1} (True/False) phải có đúng 2 lựa chọn`), false;
        if (q.options.some(o => !o.optionText.trim())) return setError(`True/False: lựa chọn không được trống (câu ${i + 1})`), false;
        continue;
      }

      // MULTIPLE_CHOICE
      if (q.options.length < 2) return setError(`Câu hỏi ${i + 1} phải có ít nhất 2 lựa chọn`), false;
      const hasCorrect = q.options.some(o => o.correct);
      if (!hasCorrect) return setError(`Câu hỏi ${i + 1} phải có ít nhất 1 đáp án đúng`), false;
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].optionText.trim()) return setError(`Lựa chọn ${j + 1} của câu ${i + 1} không được để trống`), false;
      }
    }
    return true;
  };

  // ---------- Submit ----------
  const handleNext = () => {
    if (validateBasicInfo()) {
      setError(null);
      setStep("questions");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateBasicInfo() || !validateQuestions()) return;

    setLoading(true);
    setError(null);

    try {
      if (quizToEdit) {
        // Update basic info
        const updateData: QuizUpdateDTO = {
          title: formData.title,
          description: formData.description,
          passScore: formData.passScore,
        };
        await updateQuiz(quizToEdit.id, updateData, user.id);

        // Sync questions and options
        // Strategy: update existing, create new; removal handled by remove buttons invoking delete APIs below
        for (const q of questions) {
          let questionId = q.id;
          if (questionId) {
            await updateQuizQuestion(questionId, {
              questionText: q.questionText,
              questionType: q.questionType,
              score: q.score,
              orderIndex: q.orderIndex
            }, user.id);
          } else {
            const createdQ = await addQuizQuestion(quizToEdit.id, {
              questionText: q.questionText,
              questionType: q.questionType,
              score: q.score,
              orderIndex: q.orderIndex,
              options: []
            }, user.id);
            questionId = createdQ.id;
          }
          // options
          for (const opt of q.options) {
            if (opt.id) {
              await updateQuizOption(opt.id, { optionText: opt.optionText, correct: opt.correct }, user.id);
            } else if (questionId) {
              await addQuizOption(questionId, { optionText: opt.optionText, correct: opt.correct }, user.id);
            }
          }
        }
      } else {
        // Create base quiz first (no nested questions to avoid backend 500)
        const baseData: QuizCreateDTO = {
          title: formData.title,
          description: formData.description,
          passScore: formData.passScore
        } as any;
        const created = await createQuiz(moduleId, baseData, user.id);
        const quizId = created.id;
        // Add questions and options sequentially
        for (const q of questions) {
          const createdQ = await addQuizQuestion(quizId, {
            questionText: q.questionText,
            questionType: q.questionType,
            score: q.score,
            orderIndex: q.orderIndex,
            options: []
          }, user.id);
          const questionId = createdQ.id;
          for (const opt of q.options) {
            await addQuizOption(questionId, {
              optionText: opt.optionText,
              correct: opt.correct
            }, user.id);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving quiz", err);
      setError(err?.response?.data?.message || "Đã xảy ra lỗi khi lưu quiz");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--lhud-surface)',
    border: '1px solid var(--lhud-border)',
    borderRadius: '6px',
    color: 'var(--lhud-text-primary)',
    fontSize: '0.875rem',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s'
  } as const;

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontFamily: 'Space Habitat, monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--lhud-cyan)',
    marginBottom: '0.5rem'
  } as const;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'learning-hud-fade-in 0.3s ease-out'
      }}
      onClick={onClose}
    >
      <NeuralCard
        style={{
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'learning-hud-modal-slide-up 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--lhud-border)',
          background: 'rgba(6, 182, 212, 0.03)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--lhud-text-primary)',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            {quizToEdit ? "Chỉnh sửa quiz" : "Tạo quiz mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--lhud-text-dim)',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
              borderRadius: '4px',
              opacity: loading ? 0.3 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.color = 'var(--lhud-cyan)';
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--lhud-text-dim)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Stepper - only for new quiz */}
        {!quizToEdit && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1.5rem',
            borderBottom: '1px solid var(--lhud-border)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: step === "basic" ? 'var(--lhud-cyan)' : 'var(--lhud-green)',
              fontSize: '0.875rem',
              fontFamily: 'Space Habitat, monospace'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid currentColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>
                {step === "basic" ? "1" : "✓"}
              </div>
              <span>Thông tin cơ bản</span>
            </div>
            <div style={{
              width: '60px',
              height: '2px',
              background: 'var(--lhud-border)'
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: step === "questions" ? 'var(--lhud-cyan)' : 'var(--lhud-text-dim)',
              fontSize: '0.875rem',
              fontFamily: 'Space Habitat, monospace'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid currentColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>
                2
              </div>
              <span>Câu hỏi</span>
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} style={{
          overflowY: 'auto',
          flex: 1,
          padding: '1.5rem'
        }}>
          {/* Step 1: Basic */}
          {step === "basic" && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="title" style={labelStyle}>
                  Tiêu đề quiz <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="VD: Kiểm tra kiến thức về React"
                  disabled={loading}
                  maxLength={200}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="description" style={labelStyle}>
                  Mô tả <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    resize: 'vertical' as const,
                    minHeight: '100px'
                  }}
                  placeholder="Mô tả nội dung quiz..."
                  rows={3}
                  disabled={loading}
                  maxLength={1000}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="passScore" style={labelStyle}>
                  Điểm đạt (%) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="passScore"
                  name="passScore"
                  type="number"
                  value={formData.passScore}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="70"
                  min={0}
                  max={100}
                  disabled={loading}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--lhud-text-dim)',
                  marginTop: '0.5rem',
                  marginBottom: 0
                }}>
                  Phần trăm điểm tối thiểu để đạt quiz
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid var(--lhud-border)'
              }}>
                <NeuralButton variant="secondary" onClick={onClose} disabled={loading}>
                  Hủy
                </NeuralButton>
                {!quizToEdit && (
                  <NeuralButton variant="primary" onClick={handleNext} disabled={loading}>
                    Tiếp theo
                  </NeuralButton>
                )}
                {quizToEdit && (
                  <NeuralButton variant="primary" onClick={() => setStep("questions")} disabled={loading}>
                    Tiếp tục chỉnh sửa câu hỏi
                  </NeuralButton>
                )}
              </div>
            </>
          )}

          {/* Step 2: Questions */}
          {step === "questions" && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--lhud-text-primary)',
                    margin: 0
                  }}>
                    Câu hỏi ({questions.length})
                  </h3>
                  <NeuralButton
                    variant="primary"
                    onClick={addQuestion}
                    disabled={loading}
                  >
                    <Plus size={16} /> Thêm câu hỏi
                  </NeuralButton>
                </div>

                {questions.length === 0 && (
                  <div style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    color: 'var(--lhud-text-dim)',
                    fontStyle: 'italic'
                  }}>
                    <p>Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
                  </div>
                )}

                {questions.map((q, qIndex) => (
                  <NeuralCard
                    key={qIndex}
                    style={{
                      marginBottom: '1rem',
                      padding: '1.5rem'
                    }}
                  >
                    {/* Question Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--lhud-border)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--lhud-text-secondary)'
                      }}>
                        <GripVertical size={20} />
                        <span style={{
                          fontFamily: 'Space Habitat, monospace',
                          fontSize: '0.875rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--lhud-cyan)'
                        }}>
                          Câu {qIndex + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={loading}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = 'var(--lhud-deep-space)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Question Text */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Nội dung câu hỏi</label>
                      <textarea
                        value={q.questionText}
                        onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)}
                        style={{
                          ...inputStyle,
                          resize: 'vertical' as const,
                          minHeight: '80px'
                        }}
                        placeholder="Nhập nội dung câu hỏi..."
                        rows={2}
                        disabled={loading}
                        maxLength={500}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                      />
                    </div>

                    {/* Question Meta (Type and Score) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <label style={labelStyle}>Loại câu hỏi</label>
                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const newType = e.target.value as QuestionType;

                            // Reset options based on question type
                            let newOptions: OptionForm[] = [];

                            if (newType === QuestionType.SHORT_ANSWER) {
                              // Short answer: only one option for correct answer
                              newOptions = [{ optionText: "", correct: true, orderIndex: 0 }];
                            } else if (newType === QuestionType.TRUE_FALSE) {
                              // True/False: exactly 2 options
                              newOptions = [
                                { optionText: "True", correct: true, orderIndex: 0 },
                                { optionText: "False", correct: false, orderIndex: 1 }
                              ];
                            } else if (newType === QuestionType.MULTIPLE_CHOICE) {
                              // Multiple choice: at least 2 options
                              newOptions = [
                                { optionText: "", correct: true, orderIndex: 0 },
                                { optionText: "", correct: false, orderIndex: 1 }
                              ];
                            }

                            updateQuestion(qIndex, "questionType", newType);
                            updateQuestion(qIndex, "options", newOptions);
                          }}
                          style={inputStyle}
                          disabled={loading}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                        >
                          <option value={QuestionType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                          <option value={QuestionType.TRUE_FALSE}>Đúng/Sai</option>
                          <option value={QuestionType.SHORT_ANSWER}>Điền ngắn</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Điểm</label>
                        <input
                          type="number"
                          value={q.score}
                          onChange={(e) => updateQuestion(qIndex, "score", Number(e.target.value))}
                          style={inputStyle}
                          placeholder="Điểm"
                          min={1}
                          disabled={loading}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                        />
                      </div>
                    </div>

                    {/* Multiple Choice and True/False Options */}
                    {(q.questionType === QuestionType.MULTIPLE_CHOICE || q.questionType === QuestionType.TRUE_FALSE) && (
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>
                          {q.questionType === QuestionType.TRUE_FALSE ? "Lựa chọn Đúng/Sai" : "Lựa chọn"}{" "}
                          <span style={{ color: '#ef4444' }}>*</span>
                        </label>

                        {q.options.map((opt, oIndex) => (
                          <div
                            key={oIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginBottom: '0.75rem'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                              disabled={loading}
                              title={opt.correct ? "Đáp án đúng" : "Đáp án sai"}
                              style={{
                                background: opt.correct ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                border: opt.correct ? '2px solid var(--lhud-green)' : '2px solid var(--lhud-border)',
                                color: opt.correct ? 'var(--lhud-green)' : 'var(--lhud-text-dim)',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s'
                              }}
                            >
                              {opt.correct ? <CheckCircle size={20} /> : <Circle size={20} />}
                            </button>

                            <input
                              type="text"
                              value={opt.optionText}
                              onChange={(e) => updateOption(qIndex, oIndex, "optionText", e.target.value)}
                              style={{ ...inputStyle, flex: 1 }}
                              placeholder={q.questionType === QuestionType.TRUE_FALSE ?
                                (oIndex === 0 ? "True" : "False") :
                                `Lựa chọn ${oIndex + 1}`
                              }
                              disabled={loading}
                              maxLength={200}
                              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                            />

                            {/* Show remove button based on question type and option count */}
                            {((q.questionType === QuestionType.MULTIPLE_CHOICE && q.options.length > 2) ||
                              (q.questionType === QuestionType.TRUE_FALSE && q.options.length > 2) ||
                              (q.questionType === QuestionType.SHORT_ANSWER && q.options.length > 1)) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  // If option has id and editing existing quiz, call API delete
                                  if (quizToEdit && q.options[oIndex]?.id) {
                                    try {
                                      await deleteQuizOption(q.options[oIndex].id!, user?.id || 0);
                                    } catch (error) {
                                      console.error('Error deleting option:', error);
                                    }
                                  }
                                  removeOption(qIndex, oIndex);
                                }}
                                disabled={loading}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid #ef4444',
                                  color: '#ef4444',
                                  padding: '0.5rem',
                                  borderRadius: '4px',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexShrink: 0,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!loading) {
                                    e.currentTarget.style.background = '#ef4444';
                                    e.currentTarget.style.color = 'var(--lhud-deep-space)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Show add option button based on question type and current count */}
                        {q.questionType === QuestionType.MULTIPLE_CHOICE && (
                          <NeuralButton
                            variant="secondary"
                            onClick={() => addOption(qIndex)}
                            disabled={loading}
                            style={{ marginTop: '0.5rem' }}
                          >
                            <Plus size={16} /> Thêm lựa chọn
                          </NeuralButton>
                        )}

                        {q.questionType === QuestionType.TRUE_FALSE && q.options.length < 2 && (
                          <NeuralButton
                            variant="secondary"
                            onClick={() => addOption(qIndex)}
                            disabled={loading}
                            style={{ marginTop: '0.5rem' }}
                          >
                            <Plus size={16} /> Thêm lựa chọn
                          </NeuralButton>
                        )}

                        {(q.questionType as QuestionType) === QuestionType.SHORT_ANSWER && q.options.length < 1 && (
                          <NeuralButton
                            variant="secondary"
                            onClick={() => addOption(qIndex)}
                            disabled={loading}
                            style={{ marginTop: '0.5rem' }}
                          >
                            <Plus size={16} /> Thêm đáp án
                          </NeuralButton>
                        )}
                      </div>
                    )}

                    {/* Short Answer - Correct Answer Input */}
                    {q.questionType === QuestionType.SHORT_ANSWER && (
                      <div>
                        <label style={labelStyle}>
                          Đáp án đúng <span style={{ color: '#ef4444' }}>*</span>
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--lhud-text-dim)',
                            marginLeft: '0.5rem',
                            textTransform: 'none',
                            letterSpacing: 'normal'
                          }}>
                            (Tối đa 2 từ, ví dụ: "động vật", "máy tính")
                          </span>
                        </label>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="Nhập đáp án đúng (ví dụ: động vật)"
                          value={q.options[0]?.optionText || ''}
                          onChange={(e) => updateOption(qIndex, 0, 'optionText', e.target.value)}
                          disabled={loading}
                          maxLength={50}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                        />
                        {!q.options[0] && (
                          <NeuralButton
                            variant="secondary"
                            onClick={() => addOption(qIndex)}
                            style={{ marginTop: '0.5rem' }}
                          >
                            <Plus size={16} /> Thêm đáp án
                          </NeuralButton>
                        )}
                      </div>
                    )}
                  </NeuralCard>
                ))}
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid var(--lhud-border)'
              }}>
                <NeuralButton variant="secondary" onClick={() => setStep("basic")} disabled={loading}>
                  Quay lại
                </NeuralButton>
                <NeuralButton variant="success" type="submit" disabled={loading}>
                  {loading ? "Đang lưu..." : (quizToEdit ? "Lưu thay đổi" : "Tạo quiz")}
                </NeuralButton>
              </div>
            </>
          )}
        </form>
      </NeuralCard>
    </div>
  );
};

export default QuizModal;