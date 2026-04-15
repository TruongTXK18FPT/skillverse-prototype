import React from "react";
import { FiCpu, FiPlus, FiTrash2, FiAlertTriangle, FiInfo } from "react-icons/fi";
import { LessonDraft, AssignmentCriteriaDraft } from "../courseBuilderTypes";
import { SubmissionType } from "../../../../data/assignmentDTOs";
import {
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
} from "../courseBuilderValidation";
import RichTextEditor from "../../../../components/shared/RichTextEditor";

interface LessonEditorAssignmentProps {
  lesson: LessonDraft;
  moduleId: string;
  lessonErrors: AssignmentFieldErrors | undefined;
  onUpdateLessonField: (moduleId: string, lessonId: string, update: Partial<LessonDraft>) => void;
  onClearAssignmentError: (lessonId: string, field: keyof AssignmentFieldErrors, criteriaIndex?: number, criteriaField?: keyof AssignmentCriteriaItemErrors) => void;
  validateAssignmentScore: (lesson: LessonDraft) => boolean;
  blurOnWheel: (e: React.WheelEvent<HTMLInputElement>) => void;
}

const LessonEditorAssignment: React.FC<LessonEditorAssignmentProps> = ({
  lesson,
  moduleId,
  lessonErrors,
  onUpdateLessonField,
  onClearAssignmentError,
  validateAssignmentScore,
  blurOnWheel,
}) => {
  return (
    <div className="cb-form-group">
      <label className="cb-label">Hình thức nộp bài</label>
      <select
        className="cb-input cb-select"
        value={lesson.assignmentSubmissionType || SubmissionType.TEXT}
        onChange={(e) => {
          onUpdateLessonField(moduleId, lesson.id, {
            assignmentSubmissionType: e.target.value as SubmissionType,
          });
          onClearAssignmentError(lesson.id, "submissionType");
        }}
      >
        <option value={SubmissionType.TEXT}>Nộp văn bản</option>
        <option value={SubmissionType.FILE}>Tải file</option>
      </select>
      {lessonErrors?.submissionType && (
        <div className="cb-error-text">{lessonErrors.submissionType}</div>
      )}

      <label className="cb-label">Mô tả bài tập</label>
      <RichTextEditor
        key={`assign-${lesson.id}`}
        initialContent={lesson.assignmentDescription || ""}
        onChange={(val) => {
          onUpdateLessonField(moduleId, lesson.id, {
            assignmentDescription: val,
          });
          onClearAssignmentError(lesson.id, "description");
        }}
        placeholder="Mô tả yêu cầu bài tập, hướng dẫn nộp bài..."
      />
      {lessonErrors?.description && (
        <div className="cb-error-text">{lessonErrors.description}</div>
      )}

      <div className="cb-grid cb-grid--2" style={{ marginTop: 16 }}>
        <div className="cb-form-group">
          <label className="cb-label">Điểm tối đa</label>
          <input
            type="number"
            className="cb-input"
            value={lesson.assignmentMaxScore ?? 100}
            onWheel={blurOnWheel}
            onChange={(e) => {
              onUpdateLessonField(moduleId, lesson.id, {
                assignmentMaxScore: parseInt(e.target.value),
              });
              onClearAssignmentError(lesson.id, "maxScore");
            }}
          />
          {lessonErrors?.maxScore && (
            <div className="cb-error-text">{lessonErrors.maxScore}</div>
          )}
        </div>
        <div className="cb-form-group">
          <label className="cb-label">Điểm đạt</label>
          <input
            type="number"
            className="cb-input"
            value={lesson.assignmentPassingScore ?? 50}
            onWheel={blurOnWheel}
            onChange={(e) => {
              onUpdateLessonField(moduleId, lesson.id, {
                assignmentPassingScore: parseInt(e.target.value),
              });
              onClearAssignmentError(lesson.id, "passingScore");
            }}
          />
          {lessonErrors?.passingScore && (
            <div className="cb-error-text">{lessonErrors.passingScore}</div>
          )}
        </div>
      </div>

      <div className="cb-form-group" style={{ marginTop: 24 }}>
        <label className="cb-label">
          Tiêu chí chấm điểm (Rubric){" "}
          <span style={{ color: "var(--cb-error-color)" }}>*</span>
        </label>
        {lessonErrors?.criteriaRequired && (
          <div className="cb-error-text" style={{ marginBottom: 8 }}>
            {lessonErrors.criteriaRequired}
          </div>
        )}
        <div className="cb-criteria-list">
          {(lesson.assignmentCriteria || []).map(
            (crit: AssignmentCriteriaDraft, idx: number) => {
              const criteriaError = lessonErrors?.criteriaItems?.[idx];
              return (
                <div
                  key={idx}
                  className="cb-criteria-item"
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: 16,
                    border: "1px solid var(--cb-border-color)",
                    borderRadius: 8,
                    marginBottom: 12,
                    backgroundColor: "var(--cb-bg-secondary)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <input
                      className="cb-input"
                      value={crit.name}
                      placeholder="Tên tiêu chí (VD: Sáng tạo, Kỹ thuật...)"
                      style={{ marginBottom: 8 }}
                      onChange={(e) => {
                        const newCrit = [...(lesson.assignmentCriteria || [])];
                        newCrit[idx].name = e.target.value;
                        onUpdateLessonField(moduleId, lesson.id, {
                          assignmentCriteria: newCrit,
                        });
                        onClearAssignmentError(
                          lesson.id,
                          "criteriaItems",
                          idx,
                          "name",
                        );
                      }}
                    />
                    {criteriaError?.name && (
                      <div className="cb-error-text">{criteriaError.name}</div>
                    )}
                    <textarea
                      className="cb-input cb-textarea"
                      value={crit.description || ""}
                      placeholder="Mô tả tiêu chí..."
                      style={{ height: 60, fontSize: "0.9rem" }}
                      onChange={(e) => {
                        const newCrit = [...(lesson.assignmentCriteria || [])];
                        newCrit[idx].description = e.target.value;
                        onUpdateLessonField(moduleId, lesson.id, {
                          assignmentCriteria: newCrit,
                        });
                      }}
                    />
                  </div>
                  <div style={{ width: 100 }}>
                    <input
                      type="number"
                      className="cb-input"
                      value={crit.maxPoints}
                      placeholder="Điểm"
                      title="Điểm tối đa"
                      onWheel={blurOnWheel}
                      onChange={(e) => {
                        const newCrit = [...(lesson.assignmentCriteria || [])];
                        newCrit[idx].maxPoints = parseInt(e.target.value) || 0;
                        onUpdateLessonField(moduleId, lesson.id, {
                          assignmentCriteria: newCrit,
                        });
                        onClearAssignmentError(
                          lesson.id,
                          "criteriaItems",
                          idx,
                          "maxPoints",
                        );
                      }}
                    />
                    {criteriaError?.maxPoints && (
                      <div className="cb-error-text">
                        {criteriaError.maxPoints}
                      </div>
                    )}
                  </div>
                  <button
                    className="cb-icon-button cb-icon-button--danger"
                    style={{ marginTop: 4 }}
                    onClick={() => {
                      const newCrit = lesson.assignmentCriteria?.filter(
                        (_, i) => i !== idx,
                      );
                      onUpdateLessonField(moduleId, lesson.id, {
                        assignmentCriteria: newCrit,
                      });
                      onClearAssignmentError(lesson.id, "criteriaItems");
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              );
            },
          )}
          <div
            style={{
              marginTop: 8,
              fontSize: "0.9rem",
              color: validateAssignmentScore(lesson)
                ? "var(--cb-success-color)"
                : "var(--cb-error-color)",
            }}
          >
            Tổng điểm tiêu chí:{" "}
            {lesson.assignmentCriteria?.reduce(
              (sum, c) => sum + (c.maxPoints || 0),
              0,
            ) || 0}{" "}
            / {lesson.assignmentMaxScore || 100}
            {!validateAssignmentScore(lesson) &&
              " (Tổng điểm tiêu chí phải bằng Điểm tối đa)"}
          </div>
          {lessonErrors?.criteriaTotal && (
            <div className="cb-error-text">{lessonErrors.criteriaTotal}</div>
          )}
          <button
            className="cb-button cb-button--secondary"
            onClick={() => {
              const newCrit: AssignmentCriteriaDraft = {
                name: "",
                description: "",
                maxPoints: 10,
                orderIndex: lesson.assignmentCriteria?.length || 0,
              };
              onUpdateLessonField(moduleId, lesson.id, {
                assignmentCriteria: [
                  ...(lesson.assignmentCriteria || []),
                  newCrit,
                ],
              });
              onClearAssignmentError(lesson.id, "criteriaRequired");
            }}
          >
            <FiPlus /> Thêm tiêu chí
          </button>
        </div>
      </div>

      {/* AI Grading Section */}
      <div className="cb-form-group cb-ai-grading">
        <div className="cb-ai-grading__header">
          <div className="cb-ai-grading__title-wrap">
            <span className="cb-ai-grading__icon" aria-hidden="true">
              <FiCpu />
            </span>
            <div>
              <p className="cb-ai-grading__title">AI chấm bài</p>
              <p className="cb-ai-grading__subtitle">
                Tự động gợi ý điểm dựa trên rubric và phong cách chấm.
              </p>
            </div>
          </div>
          <label
            className="cb-ai-grading-toggle"
            aria-label="Bật AI chấm bài"
          >
            <input
              type="checkbox"
              checked={Boolean(lesson.aiGradingEnabled)}
              onChange={(e) => {
                onUpdateLessonField(moduleId, lesson.id, {
                  aiGradingEnabled: e.target.checked,
                  // trustAiEnabled mirrors aiGradingEnabled — when AI grading is enabled, all results are auto-confirmed
                  trustAiEnabled: e.target.checked,
                });
              }}
            />
            <span className="cb-ai-grading-toggle__track">
              <span className="cb-ai-grading-toggle__thumb" />
            </span>
            <span className="cb-ai-grading-toggle__state">
              {lesson.aiGradingEnabled ? "ON" : "OFF"}
            </span>
          </label>
        </div>

        {lesson.aiGradingEnabled && (
          <div className="cb-ai-grading__body">
            <div className="cb-grid cb-grid--2 cb-ai-grading__grid">
              <div className="cb-form-group">
                <label className="cb-label">Phong cách chấm điểm</label>
                <select
                  className="cb-input cb-select"
                  value={lesson.gradingStyle || "STANDARD"}
                  onChange={(e) => {
                    onUpdateLessonField(moduleId, lesson.id, {
                      gradingStyle: e.target.value,
                    });
                  }}
                >
                  <option value="STANDARD">Cân bằng</option>
                  <option value="STRICT">Nghiêm ngặt</option>
                  <option value="LENIENT">Linh hoạt</option>
                </select>
              </div>
            </div>

            <div className="cb-form-group">
              <label className="cb-label">
                Hướng dẫn thêm cho AI (tùy chọn)
              </label>
              <textarea
                className="cb-input cb-textarea"
                placeholder="VD: Ưu tiên đánh giá tính sáng tạo hơn kỹ năng trình bày..."
                value={lesson.aiGradingPrompt || ""}
                onChange={(e) => {
                  onUpdateLessonField(moduleId, lesson.id, {
                    aiGradingPrompt: e.target.value,
                  });
                }}
                rows={3}
              />
            </div>

            {(!lesson.assignmentCriteria ||
              lesson.assignmentCriteria.length === 0) && (
              <div className="cb-ai-grading__warning">
                <FiAlertTriangle />
                <span>
                  Bật AI chấm bài cần có rubric (tiêu chí chấm điểm). Vui lòng
                  thêm tiêu chí ở trên.
                </span>
              </div>
            )}

            <div className="cb-ai-grading__note">
              <FiInfo />
              <span>
                Khi bật AI chấm bài: chỉ chấp nhận file <strong>PDF</strong> và{" "}
                <strong>DOCX</strong>, tối đa 10MB. Mentor luôn xác nhận kết quả
                trước khi student nhận điểm.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonEditorAssignment;
