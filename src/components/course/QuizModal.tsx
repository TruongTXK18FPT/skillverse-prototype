import React, { useEffect, useState } from "react";
import { X, Plus, GripVertical, Trash2, CheckCircle, Circle, AlertCircle } from "lucide-react";

import {
  QuizCreateDTO,
  QuizUpdateDTO,
  QuestionType,
} from "../../data/quizDTOs";
import { createQuiz, updateQuiz, addQuizQuestion, addQuizOption } from "../../services/quizService";
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
  optionText: string;
  correct: boolean;
  orderIndex: number;
}

interface QuestionForm {
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
      setQuestions([]); // editing basic info only here
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
        // Update basic info only
        const updateData: QuizUpdateDTO = {
          title: formData.title,
          description: formData.description,
          passScore: formData.passScore,
        };
        await updateQuiz(quizToEdit.id, updateData, user.id);
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
                  <button type="submit" className="quiz-modal-submit-btn" disabled={loading}>
                    {loading ? "Đang lưu..." : "Cập nhật"}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step 2: Questions (create only) */}
          {!quizToEdit && step === "questions" && (
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
                          onChange={(e) => updateQuestion(qIndex, "questionType", e.target.value as QuestionType)}
                          className="quiz-form-select"
                          disabled={loading}
                        >
                          <option value={QuestionType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                          <option value={QuestionType.TRUE_FALSE}>Đúng/Sai</option>
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

                    <div className="quiz-options-section">
                      <label className="quiz-form-label" style={{ marginBottom: "0.75rem" }}>
                        Lựa chọn <span className="required">*</span>
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
                            placeholder={`Lựa chọn ${oIndex + 1}`}
                            disabled={loading}
                            maxLength={200}
                          />

                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="quiz-remove-option-btn"
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}

                      <button type="button" onClick={() => addOption(qIndex)} className="quiz-add-option-btn" disabled={loading}>
                        <Plus size={16} /> Thêm lựa chọn
                      </button>
                    </div>
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
                  {loading ? "Đang lưu..." : "Tạo quiz"}
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

