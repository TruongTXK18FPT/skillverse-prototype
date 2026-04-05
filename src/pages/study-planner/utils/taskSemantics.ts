import { RoadmapNode } from '../../../types/Roadmap';
import { TaskResponse } from '../../../types/TaskBoard';

export type RoadmapTaskLink = {
  journeyId?: string;
  roadmapSessionId: number;
  nodeId: string;
  nodeOrder?: string;
  step?: string;
};

export type PlannerTaskKind = 'roadmap-course' | 'roadmap-fallback' | 'manual';
export type PlannerExecutionState = 'todo' | 'in-progress' | 'done';

const ROADMAP_NOTE_MARKER_PATTERN =
  /\[ROADMAP_NODE_LINK\](?:\s+journey=(\d+))?\s+roadmap=(\d+)\s+node=([^\s]+)(?:\s+nodeOrder=([^\s]+))?(?:\s+step=([^\s]+))?/i;

export const parseRoadmapTaskLink = (
  notes?: string | null,
): RoadmapTaskLink | null => {
  if (!notes || !notes.trim()) {
    return null;
  }

  const match = notes.match(ROADMAP_NOTE_MARKER_PATTERN);
  if (!match) {
    return null;
  }

  const [, journeyId, roadmapSessionIdRaw, nodeId, nodeOrder, step] = match;
  const roadmapSessionId = Number(roadmapSessionIdRaw);
  if (!Number.isFinite(roadmapSessionId) || !nodeId?.trim()) {
    return null;
  }

  return {
    journeyId: journeyId?.trim() || undefined,
    roadmapSessionId,
    nodeId: nodeId.trim(),
    nodeOrder: nodeOrder?.trim() || undefined,
    step: step?.trim() || undefined,
  };
};

export const getPlannerTaskKind = (
  task: TaskResponse,
  linkedNode?: RoadmapNode | null,
): PlannerTaskKind => {
  const link = parseRoadmapTaskLink(task.userNotes);
  if (!link) {
    return 'manual';
  }

  if ((linkedNode?.suggestedCourseIds?.length ?? 0) > 0) {
    return 'roadmap-course';
  }

  return 'roadmap-fallback';
};

export const isTaskDone = (task: TaskResponse | undefined): boolean => {
  if (!task) {
    return false;
  }

  if ((task.userProgress ?? 0) >= 100) {
    return true;
  }

  return task.status?.trim().toLowerCase() === 'done';
};

const normalizeStatus = (rawStatus?: string | null): string =>
  (rawStatus || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '');

const TODO_STATUS = new Set(['todo', 'pending', 'backlog']);
const IN_PROGRESS_STATUS = new Set(['inprogress', 'doing', 'ongoing']);
const DONE_STATUS = new Set(['done', 'completed', 'finished']);

export const resolvePlannerExecutionState = (
  task: TaskResponse | undefined,
): PlannerExecutionState => {
  if (!task) {
    return 'todo';
  }

  const normalizedStatus = normalizeStatus(task.status);

  if ((task.userProgress ?? 0) >= 100 || DONE_STATUS.has(normalizedStatus)) {
    return 'done';
  }

  if (IN_PROGRESS_STATUS.has(normalizedStatus)) {
    return 'in-progress';
  }

  if (TODO_STATUS.has(normalizedStatus)) {
    return 'todo';
  }

  if ((task.userProgress ?? 0) > 0) {
    return 'in-progress';
  }

  return 'todo';
};
