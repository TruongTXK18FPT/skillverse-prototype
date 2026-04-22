import { MouseEvent, TouchEvent, WheelEvent, useMemo } from 'react';
import { BookOpen, BookMarked, CalendarDays, CheckCircle2, Circle, Clock3, Compass, GitBranch, Layers3, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QuestProgress, RoadmapNode } from '../../types/Roadmap';
import { NodeLearningContext, resolveRoadmapNodeTimeEstimate } from './nodeLearningContext';
import { normalizeRoadmapMarkdown } from '../../utils/roadmapMarkdown';
import { confirmAction } from '../../context/ConfirmDialogContext';
import NodeEvidenceSubmissionPanel from '../journey/NodeEvidenceSubmissionPanel';
import './RoadmapNodeFocusPanel.css';

export type RoadmapNodeFocusPanelPlacement = 'left' | 'right';

export type RoadmapNodeFocusPanelVariant = 'overlay' | 'inline';

export type RoadmapNodeFocusPanelProps = {
  isOpen: boolean;
  node: RoadmapNode | null;
  progress?: QuestProgress;
  learningContext?: NodeLearningContext | null;
  /** Primary course ID for the "Go to course" action button */
  primaryCourseId?: number | null;
  /** Whether the user is already enrolled in the primary course */
  isEnrolled?: boolean;
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
  /** V3 Phase 1 — when set, an evidence submission panel is rendered for this node. */
  journeyId?: number;
};

const clampProgress = (value?: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Number(value)));
};

const resolveStatusLabel = (node: RoadmapNode | null, progress?: QuestProgress): string => {
  if (!node) {
    return 'N/A';
  }

  if (progress?.status === 'COMPLETED') {
    return 'Hoàn thành';
  }

  if ((progress?.progress ?? 0) > 0 || progress?.status === 'IN_PROGRESS') {
    return 'Đang học';
  }

  if (node.nodeStatus === 'LOCKED') {
    return 'Đang khóa';
  }

  return 'Sẵn sàng';
};

const resolveCompletionModeLabel = (learningContext?: NodeLearningContext | null): string => {
  if (!learningContext) {
    return 'Đang đồng bộ nguồn tiến độ';
  }

  // Task 2 fix: course enrollment no longer drives roadmap progress.
  // Progress is derived solely from Study Planner (Task/StudySession).
  // Display study_planner for all cases — course is only a learning resource suggestion.
  return 'Theo tiến độ study planner';
};

const pickNonEmptyItems = (items?: string[], limit = 4): string[] => (
  (items ?? [])
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .slice(0, limit)
);

const RoadmapNodeFocusPanel = ({
  isOpen,
  node,
  progress,
  learningContext,
  primaryCourseId,
  isEnrolled,
  hasStudyTask,
  linkedTaskId,
  canCreateStudyTask,
  studyPlanLockedReason,
  isCreatingStudyTask,
  onClose,
  onCreateStudyPlan,
  onOpenStudyPlanner,
  onNavigateToCourse,
  variant = 'overlay',
  placement = 'right',
  allNodes,
  onMarkNodeDone,
  linkedTaskCount = 0,
  journeyId,
}: RoadmapNodeFocusPanelProps) => {
  const progressPercent = clampProgress(progress?.progress ?? (progress?.status === 'COMPLETED' ? 100 : 0));
  const statusLabel = resolveStatusLabel(node, progress);
  const objectiveItems = useMemo(() => pickNonEmptyItems(node?.learningObjectives, 99), [node?.learningObjectives]);
  const keyConceptItems = useMemo(() => pickNonEmptyItems(node?.keyConcepts, 99), [node?.keyConcepts]);
  const prerequisiteItems = useMemo(() => {
    const raw = pickNonEmptyItems(node?.prerequisites, 99);
    if (!allNodes) return raw;
    return raw.map((id) => {
      const found = allNodes.find((n) => n.id === id);
      return found ? found.title : id;
    });
  }, [node?.prerequisites, allNodes]);
  const practicalExerciseItems = useMemo(() => pickNonEmptyItems(node?.practicalExercises, 99), [node?.practicalExercises]);
  const successCriteriaItems = useMemo(() => pickNonEmptyItems(node?.successCriteria, 99), [node?.successCriteria]);
  const normalizedDescription = useMemo(
    () => normalizeRoadmapMarkdown(node?.description),
    [node?.description],
  );


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
    if (!node || !onMarkNodeDone || node.nodeStatus === 'LOCKED') return;

    // Case A: no linked tasks → done immediately
    if (linkedTaskCount === 0) {
      try {
        await onMarkNodeDone(node.id);
      } catch (err) {
        console.error('Mark node done failed:', err);
      }
      return;
    }

    // Case B: has linked tasks → show ConfirmDialog
    const confirmed = await confirmAction({
      title: 'Xác nhận đánh dấu hoàn thành',
      message: `Có ${linkedTaskCount} tasks trong node này. Đánh dấu hoàn thành node sẽ đồng thời hoàn thành toàn bộ ${linkedTaskCount} tasks. Bạn có muốn tiếp tục?`,
      confirmLabel: 'Xác nhận',
      cancelLabel: 'Hủy',
      variant: 'default',
    });

    if (!confirmed) return;

    try {
      await onMarkNodeDone(node.id);
    } catch (err) {
      console.error('Mark node done failed:', err);
    }
  };

  const timeEstimate = resolveRoadmapNodeTimeEstimate(node, learningContext?.primaryCourse);
  const nodeTypeLabel = node.type === 'MAIN' ? 'Mục tiêu chính' : 'Mục tiêu phụ';
  const courseLabel = learningContext?.primaryCourse?.title || 'Chưa gắn khóa học';
  const parentLabel = learningContext?.parentNode?.title || 'Không có node cha';
  const childCount = learningContext?.childNodes.length ?? 0;
  const canMarkNodeDone = Boolean(onMarkNodeDone) && node.nodeStatus !== 'LOCKED';

  const panelClassName = [
    'roadmap-node-focus-panel',
    variant === 'inline' ? 'roadmap-node-focus-panel--inline' : '',
    variant === 'inline' ? `roadmap-node-focus-panel--${placement}` : '',
  ].filter(Boolean).join(' ');

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
            <span className="roadmap-node-focus-panel__chip-label">Trạng thái</span>
            <span className="roadmap-node-focus-panel__chip-value">
              {progress?.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              {statusLabel}
            </span>
          </article>
          <article className="roadmap-node-focus-panel__chip">
            <span className="roadmap-node-focus-panel__chip-label">Tiến độ node</span>
            <span className="roadmap-node-focus-panel__chip-value">{progressPercent}%</span>
          </article>
          <article className="roadmap-node-focus-panel__chip">
            <span className="roadmap-node-focus-panel__chip-label">Thời lượng ước tính</span>
            <span className="roadmap-node-focus-panel__chip-value">
              <Clock3 size={14} />
              {timeEstimate}
            </span>
          </article>
          <article className="roadmap-node-focus-panel__chip">
            <span className="roadmap-node-focus-panel__chip-label">Nguồn hoàn thành</span>
            <span className="roadmap-node-focus-panel__chip-value">{resolveCompletionModeLabel(learningContext)}</span>
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
              {learningContext?.objectiveSummary || 'Node này chưa có mô tả chi tiết.'}
            </p>
          )}

          <div className="roadmap-node-focus-panel__meta-grid">
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title"><Layers3 size={13} /> Vai trò</span>
              <span className="roadmap-node-focus-panel__meta-value">{nodeTypeLabel}</span>
            </article>
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title"><Compass size={13} /> Khóa học</span>
              <span className="roadmap-node-focus-panel__meta-value">{courseLabel}</span>
              {primaryCourseId != null && (
                <button
                  type="button"
                  className="roadmap-node-focus-panel__course-action"
                  onClick={() => onNavigateToCourse(primaryCourseId)}
                  aria-label={isEnrolled ? 'Mở trang khóa học để tiếp tục học' : 'Mở trang chi tiết khóa học'}
                >
                  <><BookOpen size={13} /> Xem khóa học</>
                </button>
              )}
            </article>
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title"><GitBranch size={13} /> Node cha</span>
              <span className="roadmap-node-focus-panel__meta-value">{parentLabel}</span>
            </article>
            <article className="roadmap-node-focus-panel__meta-card">
              <span className="roadmap-node-focus-panel__meta-title"><GitBranch size={13} /> Nhánh con</span>
              <span className="roadmap-node-focus-panel__meta-value">{childCount} node</span>
            </article>
          </div>

          {/* Phase 2: Suggested Modules list */}
          {learningContext?.suggestedModulesOrdered && learningContext.suggestedModulesOrdered.length > 0 && (
            <div className="roadmap-node-focus-panel__module-section">
              <div className="roadmap-node-focus-panel__module-header">
                <Layers3 size={14} />
                Modules gợi ý cho node này ({learningContext.suggestedModulesOrdered.length})
              </div>
              <div className="roadmap-node-focus-panel__module-list">
                {learningContext.suggestedModulesOrdered.map((module, index) => {
                  const moduleIdStr = String(module.id);
                  const isHighlighted = node.suggestedModuleIds?.includes(moduleIdStr) ?? false;
                  return (
                    <div
                      key={moduleIdStr}
                      className={`roadmap-node-focus-panel__module-item${isHighlighted ? ' is-highlighted' : ''}`}
                      onClick={() => {
                        // Navigate to module in course learning (open primary course at this module)
                        if (learningContext.primaryCourse) {
                          onNavigateToCourse(learningContext.primaryCourse.id);
                        }
                      }}
                      title={module.description || module.title}
                    >
                      <span className="roadmap-node-focus-panel__module-index">
                        {index + 1}
                      </span>
                      <div className="roadmap-node-focus-panel__module-info">
                        <div className="roadmap-node-focus-panel__module-title">{module.title}</div>
                      </div>
                      {isHighlighted && (
                        <span className="roadmap-node-focus-panel__module-badge">Node này</span>
                      )}
                      {!isEnrolled && primaryCourseId != null && (
                        <button
                          type="button"
                          className="roadmap-node-focus-panel__module-enroll-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToCourse(primaryCourseId);
                          }}
                        >
                          <BookMarked size={10} /> Đăng ký
                        </button>
                      )}
                    </div>
                  );
                })}
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
            <div className="roadmap-node-focus-panel__list-group">
              <span>Bài luyện tập ({practicalExerciseItems.length})</span>
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

          <p className="roadmap-node-focus-panel__hint">{learningContext?.howToLearnSummary || 'Bám theo node này trước, sau đó mở rộng sang nhánh tiếp theo.'}</p>
        </section>

        <section className="roadmap-node-focus-panel__action-block">
          <button
            type="button"
            className="roadmap-node-focus-panel__planner-cta"
            onClick={handlePlannerAction}
            disabled={isCreatingStudyTask || (!hasStudyTask && !canCreateStudyTask)}
          >
            {hasStudyTask ? <CalendarDays size={16} /> : <Sparkles size={16} />}
            <span>
              {hasStudyTask
                ? 'Đi tới Study Planner cho node này'
                : isCreatingStudyTask
                  ? 'Đang tạo study plan...'
                  : 'Tạo study plan cho node này'}
            </span>
          </button>
          {!hasStudyTask && !canCreateStudyTask && (
            <p className="roadmap-node-focus-panel__action-note">
              {studyPlanLockedReason || 'Hoàn thành node hiện tại trước để mở kế hoạch cho node này.'}
            </p>
          )}
        </section>

        {progress?.status !== 'COMPLETED' && (
          <section className="roadmap-node-focus-panel__mark-done-section">
            <hr className="roadmap-node-focus-panel__mark-done-divider" />
            <button
              type="button"
              className="roadmap-node-focus-panel__mark-done-btn"
              onClick={handleMarkDone}
              disabled={!canMarkNodeDone}
            >
              <CheckCircle2 size={15} />
              <span>Đánh dấu hoàn thành</span>
            </button>
            {node.nodeStatus === 'LOCKED' && (
              <p className="roadmap-node-focus-panel__action-note">
                Hoàn thành node hiện tại trước để đánh dấu hoàn thành node này.
              </p>
            )}
          </section>
        )}

        {journeyId != null && node?.id && (
          <section className="roadmap-node-focus-panel__section">
            <NodeEvidenceSubmissionPanel journeyId={journeyId} nodeId={node.id} />
          </section>
        )}

      </>
    </aside>
  );

  if (variant === 'inline') {
    return panelContent;
  }

  return (
    <div className="roadmap-node-focus-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      {panelContent}
    </div>
  );
};

export default RoadmapNodeFocusPanel;
