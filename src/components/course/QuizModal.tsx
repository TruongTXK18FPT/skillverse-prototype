import React, { useEffect, useState } from "react";
import { X, Plus, GripVertical, Trash2, CheckCircle, Circle, AlertCircle } from "lucide-react";

import {
  QuizCreateDTO,
  QuizUpdateDTO,
  QuestionType,
} from "../../data/quizDTOs";
import { createQuiz, updateQuiz, addQuizQuestion, addQuizOption, updateQuizQuestion, updateQuizOption, deleteQuizOption, getQuizById } from "../../services/quizService";
import { useAuth } from "../../context/AuthContext";
import "../../styles/ModalsEnhanced.css";

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

  return (
    <div className="quiz-modal-overlay" onClick={onClose}>
      <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quiz-modal-header">
          <h2 className="quiz-modal-title">{quizToEdit ? "Chỉnh sửa quiz" : "Tạo quiz mới"}</h2>
          <button type="button" onClick={onClose} className="quiz-modal-close-btn" disabled={loading}>
            <X size={24} />
          </button>
        </div>

        {/* Progress only for new quiz */}
        {!quizToEdit && (
          <div className="quiz-progress">
            <div className={`quiz-progress-step ${step === "basic" ? "active" : "completed"}`}>
              <span className="step-number">1</span>
              <span className="step-label">Thông tin cơ bản</span>
            </div>
            <div className="quiz-progress-line" />
            <div className={`quiz-progress-step ${step === "questions" ? "active" : ""}`}>
              <span className="step-number">2</span>
              <span className="step-label">Câu hỏi</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="quiz-modal-form">
          {/* Step 1: Basic */}
          {step === "basic" && (
            <>
              <div className="quiz-form-section">
                <label htmlFor="title" className="quiz-form-label">
                  Tiêu đề quiz <span className="required">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="quiz-form-input"
                  placeholder="VD: Kiểm tra kiến thức về React"
                  disabled={loading}
                  maxLength={200}
                />
              </div>

              <div className="quiz-form-section">
                <label htmlFor="description" className="quiz-form-label">
                  Mô tả <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="quiz-form-textarea"
                  placeholder="Mô tả nội dung quiz..."
                  rows={3}
                  disabled={loading}
                  maxLength={1000}
                />
              </div>

              <div className="quiz-form-section">
                <label htmlFor="passScore" className="quiz-form-label">
                  Điểm đạt (%) <span className="required">*</span>
                </label>
                <input
                  id="passScore"
                  name="passScore"
                  type="number"
                  value={formData.passScore}
                  onChange={handleInputChange}
                  className="quiz-form-input"
                  placeholder="70"
                  min={0}
                  max={100}
                  disabled={loading}
                />
                <p className="quiz-form-hint">Phần trăm điểm tối thiểu để đạt quiz</p>
              </div>

              {error && (
                <div className="quiz-form-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="quiz-modal-actions">
                <button type="button" onClick={onClose} className="quiz-modal-cancel-btn" disabled={loading}>
                  Hủy
                </button>
                {!quizToEdit && (
                  <button type="button" onClick={handleNext} className="quiz-modal-submit-btn" disabled={loading}>
                    Tiếp theo
                  </button>
                )}
                {quizToEdit && (
                  <button type="button" onClick={() => setStep("questions")} className="quiz-modal-submit-btn" disabled={loading}>
                    Tiếp tục chỉnh sửa câu hỏi
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step 2: Questions (create only) */}
          {step === "questions" && (
            <>
              <div className="quiz-questions-section">
                <div className="quiz-questions-header">
                  <h3>Câu hỏi ({questions.length})</h3>
                  <button type="button" onClick={addQuestion} className="quiz-add-question-btn" disabled={loading}>
                    <Plus size={16} /> Thêm câu hỏi
                  </button>
                </div>

                {questions.length === 0 && (
                  <div className="quiz-no-questions">
                    <p>Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
                  </div>
                )}

                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="quiz-question-card">
                    <div className="quiz-question-header">
                      <div className="quiz-question-drag">
                        <GripVertical size={20} />
                        <span className="quiz-question-number">Câu {qIndex + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="quiz-remove-question-btn"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="quiz-form-section">
                      <label className="quiz-form-label">Nội dung câu hỏi</label>
                      <textarea
                        value={q.questionText}
                        onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)}
                        className="quiz-form-textarea"
                        placeholder="Nhập nội dung câu hỏi..."
                        rows={2}
                        disabled={loading}
                        maxLength={500}
                      />
                    </div>

                    <div className="quiz-question-meta">
                      <div className="quiz-form-section">
                        <label className="quiz-form-label">Loại câu hỏi</label>
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
                          className="quiz-form-select"
                          disabled={loading}
                        >
                          <option value={QuestionType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                          <option value={QuestionType.TRUE_FALSE}>Đúng/Sai</option>
                          <option value={QuestionType.SHORT_ANSWER}>Điền ngắn</option>
                        </select>
                      </div>

                      <div className="quiz-form-section">
                        <label className="quiz-form-label">Điểm</label>
                        <input
                          type="number"
                          value={q.score}
                          onChange={(e) => updateQuestion(qIndex, "score", Number(e.target.value))}
                          className="quiz-score-input"
                          placeholder="Điểm"
                          min={1}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Multiple Choice and True/False Options */}
                    {(q.questionType === QuestionType.MULTIPLE_CHOICE || q.questionType === QuestionType.TRUE_FALSE) && (
                    <div className="quiz-options-section">
                      <label className="quiz-form-label" style={{ marginBottom: "0.75rem" }}>
                        {q.questionType === QuestionType.TRUE_FALSE ? "Lựa chọn Đúng/Sai" : "Lựa chọn"} <span className="required">*</span>
                      </label>

                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="quiz-option-row">
                          <button
                            type="button"
                            onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                            className={`quiz-option-check ${opt.correct ? "checked" : ""}`}
                            disabled={loading}
                            title={opt.correct ? "Đáp án đúng" : "Đáp án sai"}
                          >
                            {opt.correct ? <CheckCircle size={20} /> : <Circle size={20} />}
                          </button>

                          <input
                            type="text"
                            value={opt.optionText}
                            onChange={(e) => updateOption(qIndex, oIndex, "optionText", e.target.value)}
                            className="quiz-option-input"
                            placeholder={q.questionType === QuestionType.TRUE_FALSE ? 
                              (oIndex === 0 ? "True" : "False") : 
                              `Lựa chọn ${oIndex + 1}`
                            }
                            disabled={loading}
                            maxLength={200}
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
                              className="quiz-remove-option-btn"
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Show add option button based on question type and current count */}
                      {q.questionType === QuestionType.MULTIPLE_CHOICE && (
                        <button 
                          type="button" 
                          onClick={() => addOption(qIndex)} 
                          className="quiz-add-option-btn" 
                          disabled={loading}
                        >
                          <Plus size={16} /> Thêm lựa chọn
                        </button>
                      )}
                      
                      {q.questionType === QuestionType.TRUE_FALSE && q.options.length < 2 && (
                        <button 
                          type="button" 
                          onClick={() => addOption(qIndex)} 
                          className="quiz-add-option-btn" 
                          disabled={loading}
                        >
                          <Plus size={16} /> Thêm lựa chọn
                        </button>
                      )}
                      
                      {(q.questionType as QuestionType) === QuestionType.SHORT_ANSWER && q.options.length < 1 && (
                        <button 
                          type="button" 
                          onClick={() => addOption(qIndex)} 
                          className="quiz-add-option-btn" 
                          disabled={loading}
                        >
                          <Plus size={16} /> Thêm đáp án
                        </button>
                      )}
                    </div>
                    )}
                    {/* Short Answer - Correct Answer Input */}
                    {q.questionType === QuestionType.SHORT_ANSWER && (
                      <div className="quiz-form-section">
                        <label className="quiz-form-label">
                          Đáp án đúng <span className="required">*</span>
                          <span className="quiz-form-hint">(Tối đa 2 từ, ví dụ: "động vật", "máy tính")</span>
                        </label>
                        <input
                          type="text"
                          className="quiz-option-input"
                          placeholder="Nhập đáp án đúng (ví dụ: động vật)"
                          value={q.options[0]?.optionText || ''}
                          onChange={(e) => updateOption(qIndex, 0, 'optionText', e.target.value)}
                          disabled={loading}
                          maxLength={50}
                        />
                        {!q.options[0] && (
                          <button type="button" className="quiz-add-option-btn" onClick={() => addOption(qIndex)}>
                            <Plus size={16}/> Thêm đáp án
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="quiz-form-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="quiz-modal-actions">
                <button type="button" onClick={() => setStep("basic")} className="quiz-modal-cancel-btn" disabled={loading}>
                  Quay lại
                </button>
                <button type="submit" className="quiz-modal-submit-btn" disabled={loading}>
                  {loading ? "Đang lưu..." : (quizToEdit ? "Lưu thay đổi" : "Tạo quiz")}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default QuizModal;

