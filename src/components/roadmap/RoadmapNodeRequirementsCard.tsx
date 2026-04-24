import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GitBranch,
  Lightbulb,
  Target,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { NodeAssignmentResponse } from '../../types/NodeMentoring';
import type { RoadmapNode } from '../../types/Roadmap';
import { normalizeRoadmapMarkdown } from '../../utils/roadmapMarkdown';
import {
  getRoadmapNodeRequirementSections,
  hasMentorAssignmentContent,
  hasRoadmapNodeRequirementContent,
} from '../../utils/roadmapNodeRequirements';
import './RoadmapNodeRequirementsCard.css';

interface RoadmapNodeRequirementsCardProps {
  node?: RoadmapNode | null;
  allNodes?: RoadmapNode[] | null;
  assignment?: NodeAssignmentResponse | null;
  heading?: string;
  intro?: string;
  emptyMessage?: string;
  footerNote?: string;
  className?: string;
  showMentorAssignment?: boolean;
  showNodeDescription?: boolean;
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  learningObjectives: Target,
  keyConcepts: Lightbulb,
  practicalExercises: ClipboardList,
  successCriteria: CheckCircle2,
  prerequisites: GitBranch,
};

const resolveAssignmentSourceLabel = (
  assignment?: NodeAssignmentResponse | null,
): string => {
  if (assignment?.assignmentSource === 'MENTOR_REFINED') {
    return 'Mentor cập nhật';
  }

  if (assignment?.assignmentSource === 'SYSTEM_GENERATED') {
    return 'Hệ thống gợi ý';
  }

  return 'Assignment';
};

const RoadmapNodeRequirementsCard: React.FC<RoadmapNodeRequirementsCardProps> = ({
  node,
  allNodes,
  assignment,
  heading = 'Yêu cầu của node',
  intro,
  emptyMessage = 'Node này chưa có mô tả yêu cầu chi tiết.',
  footerNote,
  className = '',
  showMentorAssignment = true,
  showNodeDescription = true,
}) => {
  const nodeDescription = useMemo(
    () => normalizeRoadmapMarkdown(node?.description),
    [node?.description],
  );
  const assignmentDescription = useMemo(
    () => normalizeRoadmapMarkdown(assignment?.description),
    [assignment?.description],
  );
  const sections = useMemo(
    () => getRoadmapNodeRequirementSections(node, allNodes),
    [allNodes, node],
  );

  const hasAssignment = hasMentorAssignmentContent(assignment);
  const hasContent =
    (showMentorAssignment && hasAssignment) ||
    (showNodeDescription && hasRoadmapNodeRequirementContent(node)) ||
    sections.length > 0;

  return (
    <section className={`roadmap-node-requirements-card ${className}`.trim()}>
      <header className="roadmap-node-requirements-card__header">
        <div className="roadmap-node-requirements-card__title-wrap">
          <p className="roadmap-node-requirements-card__eyebrow">Node Requirements</p>
          <h3 className="roadmap-node-requirements-card__title">{heading}</h3>
        </div>
        {node?.title && (
          <span className="roadmap-node-requirements-card__node-pill">
            {node.title}
          </span>
        )}
      </header>

      {intro && (
        <p className="roadmap-node-requirements-card__intro">{intro}</p>
      )}

      {!hasContent ? (
        <div className="roadmap-node-requirements-card__empty">
          <ClipboardList size={18} />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="roadmap-node-requirements-card__body">
          {showMentorAssignment && hasAssignment && (
            <article className="roadmap-node-requirements-card__section roadmap-node-requirements-card__section--assignment">
              <div className="roadmap-node-requirements-card__section-head">
                <span className="roadmap-node-requirements-card__section-title">
                  <ClipboardList size={15} />
                  Assignment từ mentor
                </span>
                <span className="roadmap-node-requirements-card__source-badge">
                  {resolveAssignmentSourceLabel(assignment)}
                </span>
              </div>

              {assignment?.title?.trim() && (
                <h4 className="roadmap-node-requirements-card__assignment-title">
                  {assignment.title}
                </h4>
              )}

              {assignmentDescription && (
                <div className="roadmap-node-requirements-card__markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {assignmentDescription}
                  </ReactMarkdown>
                </div>
              )}
            </article>
          )}

          {showNodeDescription && nodeDescription && (
            <article className="roadmap-node-requirements-card__section">
              <div className="roadmap-node-requirements-card__section-head">
                <span className="roadmap-node-requirements-card__section-title">
                  <BookOpen size={15} />
                  Mô tả node
                </span>
              </div>
              <div className="roadmap-node-requirements-card__markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {nodeDescription}
                </ReactMarkdown>
              </div>
            </article>
          )}

          {sections.map((section) => {
            const Icon = SECTION_ICONS[section.key] || ClipboardList;

            return (
              <article
                key={section.key}
                className="roadmap-node-requirements-card__section"
              >
                <div className="roadmap-node-requirements-card__section-head">
                  <span className="roadmap-node-requirements-card__section-title">
                    <Icon size={15} />
                    {section.title}
                  </span>
                  <span className="roadmap-node-requirements-card__count-pill">
                    {section.items.length}
                  </span>
                </div>
                <ul className="roadmap-node-requirements-card__list">
                  {section.items.map((item, index) => (
                    <li key={`${section.key}-${index}`}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      {footerNote && (
        <p className="roadmap-node-requirements-card__footer-note">{footerNote}</p>
      )}
    </section>
  );
};

export default RoadmapNodeRequirementsCard;
