import React from "react";
import {
  FiSettings,
  FiList,
  FiPlus,
  FiTrash2,
  FiX,
  FiHelpCircle,
} from "react-icons/fi";
import { LessonDraft, QuizQuestionDraft, QuizOptionDraft } from "../courseBuilderTypes";
import { QuestionType } from "../../../../data/quizDTOs";
import {
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
} from "../courseBuilderValidation";
import { createId } from "../courseBuilderConstants";

interface LessonEditorQuizProps {
  lesson: LessonDraft;
  moduleId: string;
  lessonEditorTab: "settings" | "questions";
  lessonErrors: AssignmentFieldErrors | undefined;
  onUpdateLessonField: (moduleId: string, lessonId: string, update: Partial<LessonDraft>) => void;
  onClearAssignmentError: (lessonId: string, field: keyof AssignmentFieldErrors) => void;
  onSetLessonEditorTab: (tab: "settings" | "questions") => void;
  createDefaultQuestion: (type?: QuestionType) => QuizQuestionDraft;
  blurOnWheel: (e: React.WheelEvent<HTMLInputElement>) => void;
}

const LessonEditorQuiz: React.FC<LessonEditorQuizProps> = ({
  lesson,
  moduleId,
  lessonEditorTab,
  lessonErrors,
  onUpdateLessonField,
  onClearAssignmentError,
  onSetLessonEditorTab,
  createDefaultQuestion,
  blurOnWheel,
}) => {
  return (
    <div className="cb-quiz-editor">
      <div className="cb-tabs">
        <button
          className={`cb-tab ${lessonEditorTab === "settings" ? "cb-tab--active" : ""}`}
          onClick={() => onSetLessonEditorTab("settings")}
        >
          <FiSettings /> Cấu hình
        </button>
        <button
          className={`cb-tab ${lessonEditorTab === "questions" ? "cb-tab--active" : ""}`}
          onClick={() => onSetLessonEditorTab("questions")}
        >
          <FiList /> Câu hỏi ({lesson.questions?.length || 0})
        </button>
      </div>

      {lessonEditorTab === "settings" ? (
        <>
          <div className="cb-form-group">
            <label className="cb-label">Mô tả bài kiểm tra</label>
            <textarea
              className="cb-input cb-textarea"
              style={{ height: 100 }}
              value={lesson.quizDescription || ""}
              onChange={(e) =>
                onUpdateLessonField(moduleId, lesson.id, {
                  quizDescription: e.target.value,
                })
              }
              placeholder="Hướng dẫn làm bài, quy định..."
            />
          </div>

          <div className="cb-grid cb-grid--2" style={{ marginTop: 16 }}>
            <div className="cb-form-group">
              <label className="cb-label">Điểm đạt (%)</label>
              <input
                type="number"
                className="cb-input"
                value={lesson.passScore ?? 80}
                onWheel={blurOnWheel}
                onChange={(e) =>
                  onUpdateLessonField(moduleId, lesson.id, {
                    passScore: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="cb-form-group">
              <label className="cb-label">Số lần làm lại</label>
              <input
                type="number"
                className="cb-input"
                value={lesson.quizMaxAttempts ?? 3}
                onWheel={blurOnWheel}
                onChange={(e) =>
                  onUpdateLessonField(moduleId, lesson.id, {
                    quizMaxAttempts: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="cb-form-group">
              <label className="cb-label">Thời gian (phút)</label>
              <input
                type="number"
                className="cb-input"
                value={lesson.quizTimeLimitMinutes ?? ""}
                placeholder="Không giới hạn"
                onWheel={blurOnWheel}
                onChange={(e) =>
                  onUpdateLessonField(moduleId, lesson.id, {
                    quizTimeLimitMinutes: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="cb-form-group">
              <label className="cb-label">Phương pháp tính điểm</label>
              <div
                className="cb-input cb-select"
                style={{ pointerEvents: "none" }}
              >
                Điểm cao nhất
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="cb-questions-manager" style={{ marginTop: 16 }}>
          {(lesson.questions || []).map((q: QuizQuestionDraft, idx: number) => (
            <div key={q.id} className="cb-question-card">
              <div className="cb-question-header">
                <span>Câu {idx + 1}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--cb-text-dim)",
                      }}
                    >
                      Điểm
                    </span>
                    <input
                      type="number"
                      min={1}
                      className="cb-input cb-input--compact"
                      style={{ width: 80, height: 32 }}
                      value={q.score ?? 1}
                      onWheel={blurOnWheel}
                      onChange={(e) => {
                        const nextScore = parseInt(e.target.value, 10);
                        const newQ = [...(lesson.questions || [])];
                        newQ[idx].score =
                          Number.isFinite(nextScore) && nextScore > 0
                            ? nextScore
                            : 1;
                        onUpdateLessonField(moduleId, lesson.id, {
                          questions: newQ,
                        });
                      }}
                    />
                  </div>
                  <select
                    className="cb-input cb-select"
                    style={{
                      width: "auto",
                      padding: "4px 8px",
                      height: 32,
                      backgroundColor: "var(--cb-bg-secondary)",
                      color: "var(--cb-text-primary)",
                      borderColor: "var(--cb-border-color)",
                    }}
                    value={q.type || QuestionType.MULTIPLE_CHOICE}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      const defaultQ = createDefaultQuestion(newType);
                      const newQ = [...(lesson.questions || [])];
                      newQ[idx] = {
                        ...newQ[idx],
                        type: newType,
                        options: defaultQ.options,
                      };
                      onUpdateLessonField(moduleId, lesson.id, {
                        questions: newQ,
                      });
                    }}
                  >
                    <option value={QuestionType.MULTIPLE_CHOICE}>
                      Trắc nghiệm
                    </option>
                    <option value={QuestionType.TRUE_FALSE}>Đúng/Sai</option>
                    <option value={QuestionType.SHORT_ANSWER}>Điền từ</option>
                  </select>
                  <button
                    className="cb-icon-button cb-icon-button--danger"
                    onClick={() => {
                      const newQ = lesson.questions?.filter(
                        (qi) => qi.id !== q.id,
                      );
                      onUpdateLessonField(moduleId, lesson.id, {
                        questions: newQ,
                      });
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <input
                className="cb-input"
                value={q.text}
                placeholder="Nhập nội dung câu hỏi..."
                onChange={(e) => {
                  const newQ = [...(lesson.questions || [])];
                  newQ[idx].text = e.target.value;
                  onUpdateLessonField(moduleId, lesson.id, {
                    questions: newQ,
                  });
                }}
              />

              {/* Options UI based on Type */}
              <div className="cb-options" style={{ marginTop: 12 }}>
                {/* MULTIPLE CHOICE */}
                {(q.type === QuestionType.MULTIPLE_CHOICE || !q.type) && (
                  <>
                    {q.options.map((opt: QuizOptionDraft, oIdx: number) => (
                      <div key={opt.id} className="cb-option-row">
                        <input
                          className="cb-input cb-input--compact"
                          value={opt.text}
                          placeholder={`Lựa chọn ${oIdx + 1}`}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown" || e.key === "Enter") {
                              e.preventDefault();
                              const nextInput =
                                e.currentTarget.parentElement?.nextElementSibling?.querySelector(
                                  "input",
                                ) as HTMLInputElement;
                              if (nextInput) nextInput.focus();
                            }
                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              const prevInput =
                                e.currentTarget.parentElement?.previousElementSibling?.querySelector(
                                  "input",
                                ) as HTMLInputElement;
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          onChange={(e) => {
                            const newQ = [...(lesson.questions || [])];
                            newQ[idx].options[oIdx].text = e.target.value;
                            onUpdateLessonField(moduleId, lesson.id, {
                              questions: newQ,
                            });
                          }}
                        />
                        <div
                          className="cb-option-correct"
                          title="Đánh dấu đáp án đúng"
                        >
                          <input
                            type="checkbox"
                            checked={opt.correct}
                            onChange={(e) => {
                              const newQ = [...(lesson.questions || [])];
                              newQ[idx].options[oIdx].correct =
                                e.target.checked;
                              onUpdateLessonField(moduleId, lesson.id, {
                                questions: newQ,
                              });
                            }}
                          />
                        </div>
                        <button
                          className="cb-icon-button"
                          onClick={() => {
                            const newQ = [...(lesson.questions || [])];
                            newQ[idx].options = newQ[idx].options.filter(
                              (o: QuizOptionDraft) => o.id !== opt.id,
                            );
                            onUpdateLessonField(moduleId, lesson.id, {
                              questions: newQ,
                            });
                          }}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                    <button
                      className="cb-button cb-button--ghost cb-button--sm"
                      onClick={() => {
                        const newQ = [...(lesson.questions || [])];
                        newQ[idx].options.push({
                          id: createId(),
                          text: "",
                          correct: false,
                        });
                        onUpdateLessonField(moduleId, lesson.id, {
                          questions: newQ,
                        });
                      }}
                    >
                      <FiPlus /> Thêm lựa chọn
                    </button>
                  </>
                )}

                {/* TRUE/FALSE */}
                {q.type === QuestionType.TRUE_FALSE && (
                  <div style={{ display: "flex", gap: 16 }}>
                    {q.options.map((opt: QuizOptionDraft, oIdx: number) => (
                      <label
                        key={opt.id}
                        className={`cb-tf-option ${opt.correct ? "is-selected" : ""}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: opt.correct
                            ? "1px solid var(--cb-success-color)"
                            : "1px solid var(--cb-border-color)",
                          backgroundColor: opt.correct
                            ? "rgba(var(--cb-success-rgb), 0.1)"
                            : "transparent",
                          cursor: "pointer",
                          color: "var(--cb-text-primary)",
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={opt.correct}
                          onChange={() => {
                            const newQ = [...(lesson.questions || [])];
                            newQ[idx].options.forEach(
                              (o: QuizOptionDraft) => (o.correct = false),
                            );
                            newQ[idx].options[oIdx].correct = true;
                            onUpdateLessonField(moduleId, lesson.id, {
                              questions: newQ,
                            });
                          }}
                        />
                        <span style={{ color: "var(--cb-text-primary)" }}>
                          {opt.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* SHORT ANSWER */}
                {q.type === QuestionType.SHORT_ANSWER && (
                  <div className="cb-option-row">
                    <input
                      className="cb-input"
                      value={q.options[0]?.text || ""}
                      placeholder="Nhập câu trả lời chính xác..."
                      onChange={(e) => {
                        const newQ = [...(lesson.questions || [])];
                        if (!newQ[idx].options[0]) {
                          newQ[idx].options[0] = {
                            id: createId(),
                            text: "",
                            correct: true,
                          };
                        }
                        newQ[idx].options[0].text = e.target.value;
                        newQ[idx].options[0].correct = true;
                        onUpdateLessonField(moduleId, lesson.id, {
                          questions: newQ,
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            className="cb-button cb-button--secondary"
            onClick={() => {
              const newQ = createDefaultQuestion();
              onUpdateLessonField(moduleId, lesson.id, {
                questions: [...(lesson.questions || []), newQ],
              });
            }}
          >
            <FiPlus /> Thêm câu hỏi
          </button>
        </div>
      )}
    </div>
  );
};

export default LessonEditorQuiz;
