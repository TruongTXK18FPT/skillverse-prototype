import { TaskColumnResponse, TaskResponse } from "../../types/TaskBoard";

const ROADMAP_NODE_LINK_PATTERN =
  /\[ROADMAP_NODE_LINK\](?:\s+journey=\d+)?\s+roadmap=(\d+)\s+node=([^\s]+)/i;

export type NodeStudyPlanSummary = {
  nodeId: string;
  totalLinkedTasks: number;
  completedLinkedTasks: number;
  linkedTaskIds: string[];
  hasLinkedPlan: boolean;
  isCompleted: boolean;
};

export const isPlannerTaskCompleted = (task?: TaskResponse | null): boolean => {
  if (!task) {
    return false;
  }

  if ((task.userProgress ?? 0) >= 100) {
    return true;
  }

  return task.status?.trim().toLowerCase() === "done";
};

export const extractNodeStudyPlanSummaries = (
  board: TaskColumnResponse[],
  roadmapSessionId: number,
): Record<string, NodeStudyPlanSummary> => {
  const summaries: Record<string, NodeStudyPlanSummary> = {};

  if (!Number.isFinite(roadmapSessionId)) {
    return summaries;
  }

  board.forEach((column) => {
    column.tasks?.forEach((task) => {
      const notes = task.userNotes?.trim();
      if (!notes) {
        return;
      }

      const match = notes.match(ROADMAP_NODE_LINK_PATTERN);
      if (!match) {
        return;
      }

      const matchedRoadmapId = Number(match[1]);
      const matchedNodeId = match[2]?.trim();
      if (matchedRoadmapId !== roadmapSessionId || !matchedNodeId) {
        return;
      }

      const existing = summaries[matchedNodeId] ?? {
        nodeId: matchedNodeId,
        totalLinkedTasks: 0,
        completedLinkedTasks: 0,
        linkedTaskIds: [],
        hasLinkedPlan: true,
        isCompleted: false,
      };

      existing.totalLinkedTasks += 1;
      if (isPlannerTaskCompleted(task)) {
        existing.completedLinkedTasks += 1;
      }
      existing.linkedTaskIds.push(task.id);
      existing.isCompleted =
        existing.totalLinkedTasks > 0 &&
        existing.completedLinkedTasks >= existing.totalLinkedTasks;

      summaries[matchedNodeId] = existing;
    });
  });

  return summaries;
};
