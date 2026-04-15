import React from "react";
import {
  FiBookOpen,
  FiList,
  FiFileText,
  FiPlay,
  FiHelpCircle,
  FiClipboard,
  FiPlus,
  FiTrash2,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiArrowLeft,
  FiSave,
  FiCheck,
  FiImage,
  FiX,
  FiAlertTriangle,
  FiArrowUp,
  FiArrowDown,
  FiCpu,
  FiLink,
  FiUpload,
} from "react-icons/fi";

import { SubmissionType } from "../../../../data/assignmentDTOs";
import {
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
} from "../courseBuilderValidation";
import {
  createId,
  getLessonTypeMeta,
  LESSON_TYPES,
} from "../courseBuilderConstants";
import {
  getModuleChangeInfo,
  getLessonChangeInfo,
  findMatchingModule,
} from "../courseBuilderUtils";
import {
  ModuleDraft,
  LessonDraft,
  LessonKind,
  QuizQuestionDraft,
  QuizOptionDraft,
  AssignmentCriteriaDraft,
  LessonAttachmentDraft,
} from "../courseBuilderTypes";

// ============================================================================
// TYPES
// ============================================================================

type SidebarViewState =
  | { type: "course_info" }
  | { type: "module"; moduleId: string }
  | { type: "lesson"; moduleId: string; lessonId: string };

interface CourseBuilderSidebarProps {
  modules: ModuleDraft[];
  activeView: SidebarViewState;
  isEditable: boolean;
  isRevisionMode: boolean;
  baselineSnapshotModules: ModuleDraft[];
  collapsedModules: Record<string, boolean>;
  onViewChange: (
    view: SidebarViewState,
  ) => void;
  onToggleCollapse: (moduleId: string) => void;
  onMoveModule: (moduleId: string, direction: "up" | "down") => void;
  onMoveLesson: (
    moduleId: string,
    lessonId: string,
    direction: "up" | "down",
  ) => void;
  onAddLesson: (
    moduleId: string,
    lessonId: string,
  ) => void;
  onAddModule: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CourseBuilderSidebar: React.FC<CourseBuilderSidebarProps> = ({
  modules,
  activeView,
  isEditable,
  isRevisionMode,
  baselineSnapshotModules,
  collapsedModules,
  onViewChange,
  onToggleCollapse,
  onMoveModule,
  onMoveLesson,
  onAddLesson,
  onAddModule,
}) => {
  const handleAddLessonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    moduleId: string,
  ) => {
    if (!isEditable) return;
    e.stopPropagation();
    const newLessonId = createId();
    const newLesson: LessonDraft = {
      id: newLessonId,
      title: "Bài học mới",
      type: "reading",
      contentText: "",
      questions: [],
      assignmentSubmissionType: SubmissionType.TEXT,
    };
    onAddLesson(moduleId, newLessonId);
    onViewChange({
      type: "lesson",
      moduleId: moduleId,
      lessonId: newLessonId,
    });
  };

  const handleModuleClick = (moduleId: string) => {
    onViewChange({ type: "module", moduleId: moduleId });
  };

  const handleCollapseToggle = (
    e: React.MouseEvent<HTMLButtonElement>,
    moduleId: string,
  ) => {
    e.stopPropagation();
    onToggleCollapse(moduleId);
  };

  return (
    <div className="cb-sidebar">
      <div className="cb-sidebar__header">
        <span>NỘI DUNG KHÓA HỌC</span>
      </div>

      <div className="cb-sidebar__section">
        <div
          className={`cb-sidebar__item ${
            activeView.type === "course_info" ? "is-active" : ""
          }`}
          onClick={() => onViewChange({ type: "course_info" })}
        >
          <div className="cb-sidebar__item-label">
            <FiBookOpen /> Thông tin chung
          </div>
        </div>
      </div>

      <div className="cb-sidebar__section">
        <div
          className="cb-sidebar__header"
          style={{ fontSize: "0.8rem", opacity: 0.7 }}
        >
          MODULES
        </div>

        {modules.map((module, index) => {
          const moduleDiff = getModuleChangeInfo(
            module,
            index,
            baselineSnapshotModules,
          );
          const hasModuleChanges =
            moduleDiff.info.isNew ||
            moduleDiff.info.changedFields.length > 0;

          return (
            <div key={module.id} className="cb-sidebar__module-group">
              <div
                className={`cb-sidebar__item ${
                  activeView.type === "module" &&
                  activeView.moduleId === module.id
                    ? "is-active"
                    : ""
                }`}
                onClick={() => handleModuleClick(module.id)}
              >
                <div className="cb-sidebar__item-label">
                  <FiList />
                  <span style={{ fontWeight: 500 }}>
                    {index + 1}. {module.title || "(Chưa có tiêu đề)"}
                  </span>
                  {isRevisionMode && hasModuleChanges && (
                    <span
                      className="cb-sidebar__lesson-badge"
                      style={{
                        marginLeft: 8,
                        backgroundColor: "rgba(245, 158, 11, 0.18)",
                        color: "#f59e0b",
                        borderColor: "rgba(245, 158, 11, 0.35)",
                      }}
                      title={
                        moduleDiff.info.changedFields.length > 0
                          ? `Đã thay đổi: ${moduleDiff.info.changedFields.join(", ")}`
                          : "Module mới tạo"
                      }
                    >
                      {moduleDiff.info.isNew ? "Mới" : "Đã đổi"}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                  {isEditable && index > 0 && (
                    <button
                      className="cb-icon-button"
                      style={{ width: 22, height: 22, fontSize: 11 }}
                      title="Di chuyển lên"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveModule(module.id, "up");
                      }}
                    >
                      <FiArrowUp />
                    </button>
                  )}
                  {isEditable && index < modules.length - 1 && (
                    <button
                      className="cb-icon-button"
                      style={{ width: 22, height: 22, fontSize: 11 }}
                      title="Di chuyển xuống"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveModule(module.id, "down");
                      }}
                    >
                      <FiArrowDown />
                    </button>
                  )}
                  <button
                    className="cb-icon-button"
                    style={{ width: 24, height: 24, fontSize: 12 }}
                    onClick={(e) => handleCollapseToggle(e, module.id)}
                  >
                    {collapsedModules[module.id] ? (
                      <FiChevronDown />
                    ) : (
                      <FiChevronUp />
                    )}
                  </button>
                </div>
              </div>

              {!collapsedModules[module.id] && (
                <div className="cb-sidebar__sub-list">
                  {module.lessons.map((lesson, lIndex) => {
                    const meta = getLessonTypeMeta(lesson.type);
                    const baselineModule = findMatchingModule(
                      baselineSnapshotModules,
                      module,
                      index,
                    );
                    const lessonDiff = getLessonChangeInfo(
                      lesson,
                      lIndex,
                      baselineModule?.lessons || [],
                    );
                    const hasLessonChanges =
                      lessonDiff.isNew || lessonDiff.changedFields.length > 0;

                    return (
                      <div
                        key={lesson.id}
                        className={`cb-sidebar__item cb-sidebar__sub-item ${
                          activeView.type === "lesson" &&
                          activeView.lessonId === lesson.id
                            ? "is-active"
                            : ""
                        }`}
                        onClick={() =>
                          onViewChange({
                            type: "lesson",
                            moduleId: module.id,
                            lessonId: lesson.id,
                          })
                        }
                      >
                        <div className="cb-sidebar__item-label">
                          <span
                            className="cb-sidebar__lesson-icon"
                            style={{
                              backgroundColor: `${meta.color}20`,
                              color: meta.color,
                            }}
                          >
                            <meta.Icon size={12} />
                          </span>
                          <span className="cb-sidebar__lesson-text">
                            <span>
                              {lIndex + 1}.{" "}
                              {lesson.title || "(Chưa có tiêu đề)"}
                            </span>
                            <span
                              className="cb-sidebar__lesson-badge"
                              style={{
                                backgroundColor: `${meta.color}18`,
                                color: meta.color,
                                borderColor: `${meta.color}40`,
                              }}
                            >
                              {meta.label}
                            </span>
                            {isRevisionMode && hasLessonChanges && (
                              <span
                                className="cb-sidebar__lesson-badge"
                                style={{
                                  marginLeft: 6,
                                  backgroundColor: "rgba(245, 158, 11, 0.18)",
                                  color: "#f59e0b",
                                  borderColor: "rgba(245, 158, 11, 0.35)",
                                }}
                                title={
                                  lessonDiff.changedFields.length > 0
                                    ? `Đã thay đổi: ${lessonDiff.changedFields.join(", ")}`
                                    : "Bài học mới tạo"
                                }
                              >
                                {lessonDiff.isNew ? "Mới" : "Đã đổi"}
                              </span>
                            )}
                          </span>
                        </div>
                        {isEditable && (
                          <div
                            style={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                              marginLeft: "auto",
                            }}
                          >
                            {lIndex > 0 && (
                              <button
                                className="cb-icon-button"
                                style={{
                                  width: 20,
                                  height: 20,
                                  fontSize: 10,
                                  border: "none",
                                }}
                                title="Di chuyển lên"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveLesson(module.id, lesson.id, "up");
                                }}
                              >
                                <FiArrowUp />
                              </button>
                            )}
                            {lIndex < module.lessons.length - 1 && (
                              <button
                                className="cb-icon-button"
                                style={{
                                  width: 20,
                                  height: 20,
                                  fontSize: 10,
                                  border: "none",
                                }}
                                title="Di chuyển xuống"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveLesson(
                                    module.id,
                                    lesson.id,
                                    "down",
                                  );
                                }}
                              >
                                <FiArrowDown />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    className="cb-sidebar__add-btn"
                    disabled={!isEditable}
                    onClick={(e) => handleAddLessonClick(e, module.id)}
                  >
                    <FiPlus /> Thêm bài học
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          className="cb-button cb-button--ghost"
          disabled={!isEditable}
          style={{
            width: "100%",
            justifyContent: "flex-start",
            padding: "12px 16px",
            color: "var(--cb-accent-cyan)",
            opacity: !isEditable ? 0.5 : 1,
            cursor: !isEditable ? "not-allowed" : "pointer",
          }}
          onClick={() => {
            if (!isEditable) return;
            onAddModule();
          }}
        >
          <FiPlus /> Thêm Module
        </button>
      </div>
    </div>
  );
};

export default CourseBuilderSidebar;