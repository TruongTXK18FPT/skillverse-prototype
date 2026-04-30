import { MouseEvent, TouchEvent, WheelEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  BookMarked,
  CheckCircle2,
  Circle,
  Clock3,
  Compass,
  GitBranch,
  TrendingUp,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuestProgress, RoadmapNode } from "../../types/Roadmap";
import {
  NodeLearningContext,
  resolveRoadmapNodeTimeEstimate,
} from "./nodeLearningContext";
import { normalizeRoadmapMarkdown } from "../../utils/roadmapMarkdown";
import { confirmAction } from "../../context/ConfirmDialogContext";
import "./RoadmapNodeFocusPanel.css";

export type RoadmapNodeFocusPanelPlacement = "left" | "right";

export type RoadmapNodeFocusPanelVariant = "overlay" | "inline";

export type RoadmapNodeFocusPanelProps = {
  isOpen: boolean;
  node: RoadmapNode | null;
  progress?: QuestProgress;
  learningContext?: NodeLearningContext | null;
  hasStudyTask: boolean;
  linkedTaskId?: string | null;
  canCreateStudyTask: boolean;
  studyPlanLockedReason?: string | null;
  isCreatingStudyTask: boolean;
  onClose: () => void;
  onCreateStudyPlan: (nodeId: string) => void;
  onOpenStudyPlanner: (nodeId: string, taskId?: string | null) => void;
  onNavigateToCourse: (courseId: number) => void;
  variant?: RoadmapNodeFocusPanelVariant;
  placement?: RoadmapNodeFocusPanelPlacement;
  /** All nodes in the roadmap — used to resolve prerequisite IDs to titles */
  allNodes?: RoadmapNode[];
  /** Called when user confirms "Mark Done" — to mark the node complete */
  onMarkNodeDone?: (nodeId: string) => Promise<void>;
  /** Number of tasks linked to this node — drives ConfirmDialog visibility */
  linkedTaskCount?: number;
  /** Whether courses are being loaded — used to prevent empty state flash */
  isLoadingCourses?: boolean;
  /** Error from loading courses — used to show error state */
  coursesError?: Error | null;
};

const clampProgress = (value?: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Number(value)));
};

const resolveStatusLabel = (
  node: RoadmapNode | null,
  progress?: QuestProgress,
): string => {
  if (!node) {
    return "N/A";
  }

  if (progress?.status === "COMPLETED") {
    return "Hoàn thành";
  }

  if ((progress?.progress ?? 0) > 0 || progress?.status === "IN_PROGRESS") {
    return "Đang học";
  }

  if (node.nodeStatus === "LOCKED") {
    return "Đang khóa";
  }

  return "Sẵn sàng";
};

const resolveCompletionModeLabel = (
  learningContext?: NodeLearningContext | null,
): string => {
  if (!learningContext) {
    return "Đang đồng bộ nguồn tiến độ";
  }

  // Task 2 fix: course enrollment no longer drives roadmap progress.
  // Progress is derived solely from Study Planner (Task/StudySession).
  // Display study_planner for all cases — course is only a learning resource suggestion.
  return "Theo tiến độ study planner";
};

const pickNonEmptyItems = (items?: string[], limit = 4): string[] =>
  (items ?? [])
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .slice(0, limit);

const RoadmapNodeFocusPanel = ({
  isOpen,
  node,
  progress,
  learningContext,
  hasStudyTask,
  linkedTaskId,
  canCreateStudyTask,
  studyPlanLockedReason,
  isCreatingStudyTask,
  onClose,
  onCreateStudyPlan,
  onOpenStudyPlanner,
  onNavigateToCourse,
  variant = "overlay",
  placement = "right",
  allNodes,
  onMarkNodeDone,
  linkedTaskCount = 0,
  isLoadingCourses = false,
  coursesError = null,
}: RoadmapNodeFocusPanelProps) => {
  const progressPercent = clampProgress(
    progress?.progress ?? (progress?.status === "COMPLETED" ? 100 : 0),
  );
  const statusLabel = resolveStatusLabel(node, progress);
  const objectiveItems = useMemo(
    () => pickNonEmptyItems(node?.learningObjectives, 99),
    [node?.learningObjectives],
  );
  const keyConceptItems = useMemo(
    () => pickNonEmptyItems(node?.keyConcepts, 99),
    [node?.keyConcepts],
  );
  const prerequisiteItems = useMemo(() => {
    const raw = pickNonEmptyItems(node?.prerequisites, 99);
    if (!allNodes) return raw;
    return raw.map((id) => {
      const found = allNodes.find((n) => n.id === id);
      return found ? found.title : id;
    });
  }, [node?.prerequisites, allNodes]);
  const practicalExerciseItems = useMemo(
    () => pickNonEmptyItems(node?.practicalExercises, 99),
    [node?.practicalExercises],
  );
  const successCriteriaItems = useMemo(
    () => pickNonEmptyItems(node?.successCriteria, 99),
    [node?.successCriteria],
  );
  const hasImportanceScoring = useMemo(
    () => node != null && (node.importanceScore != null || !!node.reason),
    [node],
  );
  const importanceLevelLabel = useMemo(() => {
    if (node?.importanceScore == null) return null;
    const s = node.importanceScore;
    if (s >= 0.8) return "Cốt lõi";
    if (s >= 0.6) return "Quan trọng";
    if (s >= 0.4) return "Hữu ích";
    return "Tùy chọn";
  }, [node?.importanceScore]);
  const normalizedDescription = useMemo(
    () => normalizeRoadmapMarkdown(node?.description),
    [node?.description],
  );
  const navigate = useNavigate();

  if (!isOpen || !node) {
    return null;
  }

  const handleOverlayClick = () => {
    if (isCreatingStudyTask) {
      return;
    }
    onClose();
  };

  const handlePanelClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handlePanelWheel = (event: WheelEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handlePanelTouchMove = (event: TouchEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handlePlannerAction = () => {
    if (hasStudyTask) {
      onOpenStudyPlanner(node.id, linkedTaskId);
      return;
    }

    if (!canCreateStudyTask || isCreatingStudyTask) {
      return;
    }

    onCreateStudyPlan(node.id);
  };

  const handleMarkDone = async () => {
    if (!node || !onMarkNodeDone || node.nodeStatus === "LOCKED") return;

    // Case A: no linked tasks → done immediately
    if (linkedTaskCount === 0) {
      try {
        await onMarkNodeDone(node.id);
      } catch (err) {
        console.error("Mark node done failed:", err);
      }
      return;
    }

    // Case B: has linked tasks → show ConfirmDialog
    const confirmed = await confirmAction({
      title: "Xác nhận đánh dấu hoàn thành",
      message: `Có ${linkedTaskCount} tasks trong node này. Đánh dấu hoàn thành node sẽ đồng thời hoàn thành toàn bộ ${linkedTaskCount} tasks. Bạn có muốn tiếp tục?`,
      confirmLabel: "Xác nhận",
      cancelLabel: "Hủy",
      variant: "default",
    });

    if (!confirmed) return;

    try {
      await onMarkNodeDone(node.id);
    } catch (err) {
      console.error("Mark node done failed:", err);
    }
  };

  const timeEstimate = resolveRoadmapNodeTimeEstimate(
    node,
    learningContext?.primaryCourse,
  );
  const nodeTypeLabel =
    node.type === "MAIN" ? "Mục tiêu chính" : "Mục tiêu phụ";
  const courseLabel =
    learningContext?.primaryCourse?.title || "Chưa gắn khóa học";
  const parentLabel = learningContext?.parentNode?.title || "Không có node cha";
  const childCount = learningContext?.childNodes.length ?? 0;
  const canMarkNodeDone =
    Boolean(onMarkNodeDone) && node.nodeStatus !== "LOCKED";

  const panelClassName = [
    "roadmap-node-focus-panel",
    variant === "inline" ? "roadmap-node-focus-panel--inline" : "",
    variant === "inline" ? `roadmap-node-focus-panel--${placement}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const panelContent = (
    <aside
      className={panelClassName}
      onClick={handlePanelClick}
      onWheel={handlePanelWheel}
      onTouchMove={handlePanelTouchMove}
    >
      <header className="roadmap-node-focus-panel__header">
        <div>
          <p className="roadmap-node-focus-panel__eyebrow">Node Focus</p>
          <h2 className="roadmap-node-focus-panel__title">{node.title}</h2>
        </div>
        <button
          type="button"
          className="roadmap-node-focus-panel__close"
          onClick={onClose}
          disabled={isCreatingStudyTask}
          aria-label="Đóng panel"
        >
          <X size={16} />
        </button>
      </header>

      {/* Overview tab content */}
      <>
        <section className="roadmap-node-focus-panel__summary">
          <article className="roadmap-node-focus-panel__chip">
            <span className="roadmap-node-focus-panel__chip-label">
              Trạng thái
            </span>
            <span className="roadmap-node-focus-panel__chip-value">
              {progress?.status === "COMPLETED" ? (
                <CheckCircle2 size={14} />
              ) : (
                <Circle size={14} />
              )}
              {statusLabel}
            </span>
          </article>
          <article className="roadmap-node-focus-panel__chip">
            <span className="roadmap-node-focus-panel__chip-label">
              Tiến độ node
            </span>
            <span className="roadmap-node-focus-panel__chip-value">
              {progressPercent}%
            </span>
          </article>
          <article className="roadmap-node-focus-panel__chip">
            <span className="roadmap-node-focus-panel__chip-label">
              Thời lượng ước tính
            </span>
            <span className="roadmap-node-focus-panel__chip-value">
              <Clock3 size={14} />
              {timeEstimate}
            </span>
          </article>
          <article className="roadmap-node-focus-panel__chip">
            <span className="roadmap-node-focus-panel__chip-label">
              Nguồn hoàn thành
            </span>
            <span className="roadmap-node-focus-panel__chip-value">
              {resolveCompletionModeLabel(learningContext)}
            </span>
          </article>
        </section>

        <section className="roadmap-node-focus-panel__detail-block">
          <h3>
            <BookOpen size={15} />
            Tổng quan node
          </h3>
          {normalizedDescription ? (
            <div className="node-description-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {normalizedDescription}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="node-empty-description">
              {learningContext?.objectiveSummary ||
                "Node này chưa có mô tả chi tiết."}
            </p>
          )}

          {hasImportanceScoring && (
            <div className="roadmap-node-focus-panel__scoring">
              {node.importanceScore != null && (
                <div className="roadmap-node-focus-panel__scoring-row">
                  <TrendingUp size={13} />
                  <span className="roadmap-node-focus-panel__scoring-label">Mức quan trọng</span>
                  <span
                    className={`roadmap-node-focus-panel__scoring-status roadmap-node-focus-panel__scoring-status--${
                      node.importanceScore != null
                        ? node.importanceScore >= 0.8 ? 'core'
                          : node.importanceScore >= 0.6 ? 'important'
                          : node.importanceScore >= 0.4 ? 'useful'
                          : 'optional'
                        : 'optional'
                    }`}
                  >
                    {importanceLevelLabel ?? `${Math.round(node.importanceScore * 100)}%`}
                  </span>
                </div>
              )}
              {node.reason && (
                <p className="roadmap-node-focus-panel__scoring-reason">{node.reason}</p>
              )}
            </div>
          )}

          <div className="roadmap-node-focus-panel__meta-grid">
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title">
                <Circle size={13} /> Vai trò
              </span>
              <span className="roadmap-node-focus-panel__meta-value">
                {nodeTypeLabel}
              </span>
            </article>
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title">
                <Compass size={13} /> Khóa học
              </span>
              <span className="roadmap-node-focus-panel__meta-value">
                {courseLabel}
              </span>
            </article>
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title">
                <GitBranch size={13} /> Node cha
              </span>
              <span className="roadmap-node-focus-panel__meta-value">
                {parentLabel}
              </span>
            </article>
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title">
                <GitBranch size={13} /> Nhánh con
              </span>
              <span className="roadmap-node-focus-panel__meta-value">
                {childCount} node
              </span>
            </article>
          </div>

          {/* Phase 2: Suggested Courses list - Primary + Alternatives */}
          {(learningContext?.primaryCourse ||
            (learningContext?.supportingCourses &&
              learningContext.supportingCourses.length > 0) ||
            (node?.suggestedCourseIds && node.suggestedCourseIds.length > 0)) && (
            <div className="roadmap-node-focus-panel__course-section">
              <div className="roadmap-node-focus-panel__course-header">
                <BookOpen size={14} />
                Khóa học gợi ý
              </div>
              <p className="roadmap-node-focus-panel__course-hint">
                Các khóa học liên quan đến nội dung node này — học là tùy chọn, không bắt buộc
              </p>

              {/* Error state: failed to load courses */}
              {!isLoadingCourses && coursesError && (
                <div className="roadmap-node-focus-panel__course-error">
                  Không tải được khóa học gợi ý. Vui lòng thử lại.
                </div>
              )}

              {/* Empty state: no PUBLIC courses available after successful fetch */}
              {!isLoadingCourses && !coursesError &&
                !learningContext?.primaryCourse &&
                (!learningContext?.supportingCourses ||
                  learningContext.supportingCourses.length === 0) && (
                  <div className="roadmap-node-focus-panel__course-unavailable">
                    Khóa học gợi ý hiện chưa khả dụng.
                  </div>
              )}
              <div className="roadmap-node-focus-panel__course-list">
                {/* PRIMARY COURSE - Best match */}
                {learningContext?.primaryCourse && (
                  <div
                    key={learningContext.primaryCourse.id}
                    className="roadmap-node-focus-panel__course-item roadmap-node-focus-panel__course-item--primary"
                    onClick={() =>
                      onNavigateToCourse(learningContext.primaryCourse!.id)
                    }
                    title={learningContext.primaryCourse.description}
                  >
                    <span className="roadmap-node-focus-panel__course-badge roadmap-node-focus-panel__course-badge--primary">
                      Phù hợp nhất
                    </span>
                    {((learningContext.primaryCourse.modules?.length || 0) > 0 && (learningContext.primaryCourse.modules?.length || 0) <= 5) && (
                      <span className="roadmap-node-focus-panel__course-badge roadmap-node-focus-panel__course-badge--compact">
                        Ngắn gọn
                      </span>
                    )}
                    <div className="roadmap-node-focus-panel__course-info">
                      <div className="roadmap-node-focus-panel__course-title">
                        {learningContext.primaryCourse.title}
                      </div>
                      <div className="roadmap-node-focus-panel__course-meta">
                        {learningContext.primaryCourse.level} ·{" "}
                        {learningContext.primaryCourse.modules?.length || 0}{" "}
                        modules
                      </div>
                    </div>
                    <button
                      type="button"
                      className="roadmap-node-focus-panel__course-action-btn roadmap-node-focus-panel__course-action-btn--primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToCourse(learningContext.primaryCourse!.id);
                      }}
                    >
                      <BookMarked size={12} /> Xem khóa học
                    </button>
                  </div>
                )}

                {/* ALTERNATIVE COURSES - Optional choices */}
                {learningContext?.supportingCourses?.map((course, index) => (
                  <div
                    key={course.id}
                    className="roadmap-node-focus-panel__course-item roadmap-node-focus-panel__course-item--alternative"
                    onClick={() => onNavigateToCourse(course.id)}
                    title={course.description}
                  >
                    <span className="roadmap-node-focus-panel__course-badge roadmap-node-focus-panel__course-badge--alternative">
                      Thay thế {index + 1}
                    </span>
                    {((course.modules?.length || 0) > 0 && (course.modules?.length || 0) <= 5) && (
                      <span className="roadmap-node-focus-panel__course-badge roadmap-node-focus-panel__course-badge--compact">
                        Ngắn gọn
                      </span>
                    )}
                    <div className="roadmap-node-focus-panel__course-info">
                      <div className="roadmap-node-focus-panel__course-title">
                        {course.title}
                      </div>
                      <div className="roadmap-node-focus-panel__course-meta">
                        {course.level} · {course.modules?.length || 0} modules
                      </div>
                    </div>
                    <button
                      type="button"
                      className="roadmap-node-focus-panel__course-action-btn roadmap-node-focus-panel__course-action-btn--alternative"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToCourse(course.id);
                      }}
                    >
                      <BookMarked size={12} /> Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {objectiveItems.length > 0 && (
            <div className="roadmap-node-focus-panel__list-group">
              <span>Mục tiêu học tập ({objectiveItems.length})</span>
              <ul>
                {objectiveItems.map((item, index) => (
                  <li key={`obj-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {keyConceptItems.length > 0 && (
            <div className="roadmap-node-focus-panel__list-group">
              <span>Khái niệm trọng tâm ({keyConceptItems.length})</span>
              <ul>
                {keyConceptItems.map((item, index) => (
                  <li key={`con-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {practicalExerciseItems.length > 0 && (
            <div className="roadmap-node-focus-panel__list-group roadmap-node-focus-panel__list-group--assignment">
              <span>Bài tập ({practicalExerciseItems.length})</span>
              <ul>
                {practicalExerciseItems.map((item, index) => (
                  <li key={`ex-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {successCriteriaItems.length > 0 && (
            <div className="roadmap-node-focus-panel__list-group">
              <span>Tiêu chí hoàn thành ({successCriteriaItems.length})</span>
              <ul>
                {successCriteriaItems.map((item, index) => (
                  <li key={`sc-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {prerequisiteItems.length > 0 && (
            <div className="roadmap-node-focus-panel__list-group">
              <span>Prerequisite gợi ý ({prerequisiteItems.length})</span>
              <ul>
                {prerequisiteItems.map((item, index) => (
                  <li key={`pre-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="roadmap-node-focus-panel__hint">
            {learningContext?.howToLearnSummary ||
              "Bám theo node này trước, sau đó mở rộng sang nhánh tiếp theo."}
          </p>
        </section>

        <section className="roadmap-node-focus-panel__footer-actions">
          <div className="roadmap-node-focus-panel__primary-actions">
            {hasStudyTask || canCreateStudyTask ? (
              <button
                type="button"
                className="roadmap-node-focus-panel__planner-cta"
                onClick={handlePlannerAction}
                disabled={isCreatingStudyTask}
              >
                <span>
                  {hasStudyTask
                    ? "Đi tới Study Planner"
                    : isCreatingStudyTask
                      ? "Đang tạo..."
                      : "Tạo study plan"}
                </span>
              </button>
            ) : studyPlanLockedReason ? (
              <button
                type="button"
                className="roadmap-node-focus-panel__planner-cta roadmap-node-focus-panel__planner-cta--locked"
                onClick={() => navigate('/premium')}
              >
                <span>Mở khóa Study Plan</span>
              </button>
            ) : null}
            
            {progress?.status !== "COMPLETED" && (
              <button
                type="button"
                className="roadmap-node-focus-panel__mark-done-btn"
                onClick={handleMarkDone}
                disabled={!canMarkNodeDone}
              >
                <CheckCircle2 size={15} />
                <span>Hoàn thành</span>
              </button>
            )}
          </div>

          <div className="roadmap-node-focus-panel__action-notes">
            {!hasStudyTask && !canCreateStudyTask && studyPlanLockedReason && (
              <p className="roadmap-node-focus-panel__action-note roadmap-node-focus-panel__action-note--premium">
                Nâng cấp Premium để sử dụng tính năng lập kế hoạch học tập AI
              </p>
            )}
            {!hasStudyTask && !canCreateStudyTask && !studyPlanLockedReason && progress?.status !== "COMPLETED" && (
              <p className="roadmap-node-focus-panel__action-note">
                Hoàn thành node hiện tại trước để mở kế hoạch.
              </p>
            )}
            {progress?.status !== "COMPLETED" && node.nodeStatus === "LOCKED" && (
              <p className="roadmap-node-focus-panel__action-note">
                Hoàn thành node hiện tại trước để đánh dấu hoàn thành.
              </p>
            )}
          </div>
        </section>
      </>
    </aside>
  );

  if (variant === "inline") {
    return panelContent;
  }

  return (
    <div
      className="roadmap-node-focus-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      {panelContent}
    </div>
  );
};

export default RoadmapNodeFocusPanel;
