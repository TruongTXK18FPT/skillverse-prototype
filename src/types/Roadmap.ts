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
 * Difficulty level for nodes and roadmaps
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

/**
 * Detected intention/pattern from user goal
 */
export enum DetectedIntention {
  TEST_PREPARATION = 'TEST_PREPARATION',
  CERTIFICATE = 'CERTIFICATE',
  CAREER_PREPARATION = 'CAREER_PREPARATION',
  SKILL_ACQUISITION = 'SKILL_ACQUISITION',
  KNOWLEDGE_EXPLORATION = 'KNOWLEDGE_EXPLORATION'
}

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

/**
 * Individual node/quest in the roadmap tree (V2 Enhanced)
 */
export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  type: NodeType;
  children: string[];
  
  // V2 Enhanced fields
  difficulty?: DifficultyLevel;
  learningObjectives?: string[];
  keyConcepts?: string[];
  practicalExercises?: string[];
  suggestedResources?: string[];
  successCriteria?: string[];
  prerequisites?: string[];
  estimatedCompletionRate?: number;
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
 * Roadmap metadata (V2)
 */
export interface RoadmapMetadata {
  title: string;
  originalGoal: string;
  validatedGoal?: string;
  duration: string;
  experienceLevel: string;
  learningStyle: string;
  detectedIntention?: DetectedIntention;
  validationNotes?: string | string[]; // Backend returns string, may contain array in future
  difficultyLevel?: DifficultyLevel;
  prerequisites?: string[];
  careerRelevance?: string;
}

/**
 * Roadmap statistics (V2)
 */
export interface RoadmapStatistics {
  totalNodes: number;
  mainNodes: number;
  sideNodes: number;
  totalEstimatedHours: number;
  difficultyDistribution?: Record<string, number>;
}

/**
 * Validation result (for pre-validation)
 */
export interface ValidationResult {
  severity: ValidationSeverity;
  message: string;
  code?: string;
}

/**
 * Full roadmap response with nested structure (V2 Breaking Change)
 */
export interface RoadmapResponse {
  sessionId: number;
  metadata: RoadmapMetadata;
  roadmap: RoadmapNode[];
  statistics: RoadmapStatistics;
  learningTips: string | string[]; // Backend returns List<String>, but may vary
  createdAt: string;
  progress?: Record<string, QuestProgress>; // Quest progress from backend
}

/**
 * Summary of a roadmap session (for list view) - V2 Fields
 */
export interface RoadmapSessionSummary {
  sessionId: number;
  title: string;
  
  // V2 field names
  originalGoal: string;
  validatedGoal?: string;
  duration: string;
  experienceLevel: string;
  learningStyle: string;
  
  // Progress tracking
  totalQuests: number;
  completedQuests: number;
  progressPercentage: number;
  
  // Metadata
  difficultyLevel?: string;
  schemaVersion?: number;
  
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
  onComplete?: (nodeId: string, completed: boolean) => void;
  isExpanded?: boolean;
}
