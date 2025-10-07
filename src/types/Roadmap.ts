/**
 * TypeScript types for AI Roadmap feature
 */

/**
 * Node type in the roadmap tree
 */
export enum NodeType {
  MAIN = 'MAIN',
  SIDE = 'SIDE'
}

/**
 * Progress status for individual quests
 */
export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

/**
 * Individual node/quest in the roadmap tree
 */
export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  type: NodeType;
  children: string[];
}

/**
 * Request to generate a new roadmap
 */
export interface GenerateRoadmapRequest {
  goal: string;
  duration: string;
  experience: string;
  style: string;
}

/**
 * Full roadmap response with nodes
 */
export interface RoadmapResponse {
  sessionId: number;
  title: string;
  goal: string;
  duration: string;
  experience: string;
  style: string;
  roadmap: RoadmapNode[];
  createdAt: string;
}

/**
 * Summary of a roadmap session (for list view)
 */
export interface RoadmapSessionSummary {
  sessionId: number;
  title: string;
  goal: string;
  duration: string;
  experience: string;
  totalQuests: number;
  completedQuests: number;
  progressPercentage: number;
  createdAt: string;
}

/**
 * Quest progress tracking
 */
export interface QuestProgress {
  questId: string;
  status: ProgressStatus;
  progress: number;
  completedAt?: string;
}

/**
 * React Flow node data
 */
export interface FlowNodeData {
  node: RoadmapNode;
  progress?: QuestProgress;
  onExpand?: (nodeId: string) => void;
  onComplete?: (nodeId: string) => void;
  isExpanded?: boolean;
}
