import { MouseEvent, useMemo } from 'react';
import { BookOpen, BookMarked, CalendarDays, CheckCircle2, Circle, Clock3, Compass, GitBranch, Layers3, PlayCircle, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QuestProgress, RoadmapNode } from '../../types/Roadmap';
import { NodeLearningContext, resolveRoadmapNodeTimeEstimate } from './nodeLearningContext';
import './RoadmapNodeFocusPanel.css';

type RoadmapNodeFocusPanelProps = {
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
  isCreatingStudyTask: boolean;
  onClose: () => void;
  onCreateStudyPlan: (nodeId: string) => void;
  onOpenStudyPlanner: (nodeId: string, taskId?: string | null) => void;
  onNavigateToCourse: (courseId: number) => void;
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

  return learningContext.completionMode === 'course_progress'
    ? 'Theo tiến độ khóa học'
    : 'Theo tiến độ study planner';
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
  isCreatingStudyTask,
  onClose,
  onCreateStudyPlan,
  onOpenStudyPlanner,
  onNavigateToCourse,
}: RoadmapNodeFocusPanelProps) => {
  const progressPercent = clampProgress(progress?.progress ?? (progress?.status === 'COMPLETED' ? 100 : 0));
  const statusLabel = resolveStatusLabel(node, progress);
  const objectiveItems = useMemo(() => pickNonEmptyItems(node?.learningObjectives, 99), [node?.learningObjectives]);
  const keyConceptItems = useMemo(() => pickNonEmptyItems(node?.keyConcepts, 99), [node?.keyConcepts]);
  const prerequisiteItems = useMemo(() => pickNonEmptyItems(node?.prerequisites, 99), [node?.prerequisites]);
  const practicalExerciseItems = useMemo(() => pickNonEmptyItems(node?.practicalExercises, 99), [node?.practicalExercises]);
  const successCriteriaItems = useMemo(() => pickNonEmptyItems(node?.successCriteria, 99), [node?.successCriteria]);


  if (!isOpen || !node) {
    return null;
  }

  const handleOverlayClick = () => {
    if (isCreatingStudyTask) {
      return;
    }
    onClose();
  };

  const handlePanelClick = (event: MouseEvent<HTMLDivElement>) => {
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

  const timeEstimate = resolveRoadmapNodeTimeEstimate(node, learningContext?.primaryCourse);
  const nodeTypeLabel = node.type === 'MAIN' ? 'Mục tiêu chính' : 'Mục tiêu phụ';
  const courseLabel = learningContext?.primaryCourse?.title || 'Chưa gắn khóa học';
  const parentLabel = learningContext?.parentNode?.title || 'Không có node cha';
  const childCount = learningContext?.childNodes.length ?? 0;

  return (
    <div className="roadmap-node-focus-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <aside className="roadmap-node-focus-panel" onClick={handlePanelClick}>
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
              {node.description ? (
                <div className="node-description-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {node.description}
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
                      aria-label={isEnrolled ? 'Tiếp tục học khóa học' : 'Kích hoạt khóa học'}
                    >
                      {isEnrolled
                        ? <><PlayCircle size={13} /> Tiếp tục học</>
                        : <><BookMarked size={13} /> Kích hoạt</>}
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
                  Hoàn thành node hiện tại trước để mở kế hoạch cho node này.
                </p>
              )}
            </section>
        </>
      </aside>
    </div>
  );
};

export default RoadmapNodeFocusPanel;
