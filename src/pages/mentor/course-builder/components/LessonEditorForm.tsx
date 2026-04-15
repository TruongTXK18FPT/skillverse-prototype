import React from "react";
import { FiTrash2, FiHelpCircle, FiPlay, FiFileText } from "react-icons/fi";
import { LessonDraft, LessonKind, ModuleDraft } from "../courseBuilderTypes";
import { QuestionType } from "../../../../data/quizDTOs";
import {
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
} from "../courseBuilderValidation";
import { LESSON_TYPES } from "../courseBuilderConstants";
import LessonEditorReading from "./LessonEditorReading";
import LessonEditorVideo from "./LessonEditorVideo";
import LessonEditorQuiz from "./LessonEditorQuiz";
import LessonEditorAssignment from "./LessonEditorAssignment";

interface LessonEditorFormProps {
  lesson: LessonDraft;
  moduleId: string;
  isRevisionMode: boolean;
  isEditable: boolean;
  lessonEditorTab: "settings" | "questions";
  lessonErrors: AssignmentFieldErrors | undefined;
  baselineModule?: ModuleDraft;
  lessonDiff: { isNew: boolean; changedFields: string[] };
  onUpdateLessonField: (moduleId: string, lessonId: string, update: Partial<LessonDraft>) => void;
  onClearAssignmentError: (lessonId: string, field: keyof AssignmentFieldErrors, criteriaIndex?: number, criteriaField?: keyof AssignmentCriteriaItemErrors) => void;
  onLessonTypeSwitch: (moduleId: string, lesson: LessonDraft, newType: LessonKind) => void;
  onRemoveLesson: (moduleId: string, lessonId: string) => void;
  onSetLessonEditorTab: (tab: "settings" | "questions") => void;
  onCreateDefaultQuestion: (type?: QuestionType) => import("../courseBuilderTypes").QuizQuestionDraft;
  onValidateAssignmentScore: (lesson: LessonDraft) => boolean;
  blurOnWheel: (e: React.WheelEvent<HTMLInputElement>) => void;
  // Video refs
  videoInputRef: React.RefObject<HTMLInputElement>;
  onVideoUpload: (file: File) => void;
  // Reading refs
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (file: File) => void;
  onOpenReadingLinkDialog: (moduleId: string, lessonId: string, value: string) => void;
}

const LessonEditorForm: React.FC<LessonEditorFormProps> = ({
  lesson,
  moduleId,
  isRevisionMode,
  isEditable,
  lessonEditorTab,
  lessonErrors,
  lessonDiff,
  onUpdateLessonField,
  onClearAssignmentError,
  onLessonTypeSwitch,
  onRemoveLesson,
  onSetLessonEditorTab,
  onCreateDefaultQuestion,
  onValidateAssignmentScore,
  blurOnWheel,
  videoInputRef,
  onVideoUpload,
  fileInputRef,
  onFileUpload,
  onOpenReadingLinkDialog,
}) => {
  const hasLessonChanges = lessonDiff.isNew || lessonDiff.changedFields.length > 0;

  return (
    <div className="cb-main-content">
      <div className="cb-panel">
        <div className="cb-panel__header">
          <div className="cb-panel__title">
            {lesson.type === "quiz" && <FiHelpCircle />}
            {lesson.type === "video" && <FiPlay />}
            {lesson.type === "reading" && <FiFileText />}
            <span style={{ marginLeft: 8 }}>{lesson.title}</span>
            {isRevisionMode && hasLessonChanges && (
              <span
                className="cb-sidebar__lesson-badge"
                style={{
                  marginLeft: 10,
                  backgroundColor: "rgba(245, 158, 11, 0.18)",
                  color: "#f59e0b",
                  borderColor: "rgba(245, 158, 11, 0.35)",
                }}
                title={
                  lessonDiff.changedFields.length > 0
                    ? `Da thay doi: ${lessonDiff.changedFields.join(", ")}`
                    : "Bai hoc moi tao"
                }
              >
                {lessonDiff.isNew ? "Moi" : "Da doi"}
              </span>
            )}
          </div>
          <button
            className="cb-button cb-button--danger cb-button--sm"
            onClick={() => onRemoveLesson(moduleId, lesson.id)}
          >
            <FiTrash2 /> Xoa
          </button>
        </div>
        <div className="cb-panel__body">
          <div className="cb-form-group">
            <label className="cb-label">Loai bai hoc</label>
            <div className="cb-chips">
              {LESSON_TYPES.map((type) => (
                <button
                  key={type.value}
                  className={`cb-chip ${lesson.type === type.value ? "is-active" : ""}`}
                  onClick={() =>
                    onLessonTypeSwitch(
                      moduleId,
                      lesson,
                      type.value as LessonKind,
                    )
                  }
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="cb-form-group">
            <label className="cb-label">Tieu de</label>
            <input
              className="cb-input"
              value={lesson.title}
              onChange={(e) =>
                onUpdateLessonField(moduleId, lesson.id, {
                  title: e.target.value,
                })
              }
            />
          </div>

          {lesson.type === "reading" && (
            <LessonEditorReading
              lesson={lesson}
              moduleId={moduleId}
              isEditable={isEditable}
              onUpdateLessonField={onUpdateLessonField}
              onOpenReadingLinkDialog={onOpenReadingLinkDialog}
              onFileUpload={onFileUpload}
              fileInputRef={fileInputRef}
            />
          )}
          {lesson.type === "video" && (
            <LessonEditorVideo
              lesson={lesson}
              moduleId={moduleId}
              onUpdateLessonField={onUpdateLessonField}
              onVideoUpload={onVideoUpload}
              videoInputRef={videoInputRef}
            />
          )}
          {lesson.type === "quiz" && (
            <LessonEditorQuiz
              lesson={lesson}
              moduleId={moduleId}
              lessonEditorTab={lessonEditorTab}
              lessonErrors={lessonErrors}
              onUpdateLessonField={onUpdateLessonField}
              onClearAssignmentError={onClearAssignmentError}
              onSetLessonEditorTab={onSetLessonEditorTab}
              createDefaultQuestion={onCreateDefaultQuestion}
              blurOnWheel={blurOnWheel}
            />
          )}
          {lesson.type === "assignment" && (
            <LessonEditorAssignment
              lesson={lesson}
              moduleId={moduleId}
              lessonErrors={lessonErrors}
              onUpdateLessonField={onUpdateLessonField}
              onClearAssignmentError={onClearAssignmentError}
              validateAssignmentScore={onValidateAssignmentScore}
              blurOnWheel={blurOnWheel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonEditorForm;
