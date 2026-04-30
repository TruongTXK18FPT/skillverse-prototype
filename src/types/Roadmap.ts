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

export enum RoadmapNodeAvailability {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
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
  estimatedTimeMinutes: number | null;
  type: NodeType;
  phaseId?: string | null;
  orderIndex?: number | null;
  mainPathIndex?: number | null;
  children: string[];
  isCore?: boolean;
  parentId?: string | null;
  suggestedCourseIds?: string[];
  /** Phase 2: Module IDs suggested for this node (from MultiLevelCourseMatcher). */
  suggestedModuleIds?: string[];
  nodeStatus?: RoadmapNodeAvailability | string;
  difficulty?: DifficultyLevel | string;
  
  // V2 Enhanced fields
  learningObjectives?: string[];
  keyConcepts?: string[];
  practicalExercises?: string[];
  suggestedResources?: string[];
  successCriteria?: string[];
  prerequisites?: string[];
  estimatedCompletionRate?: number;
  importanceScore?: number | null;          // 0.0–1.0, how critical relative to goal
  confidenceScore?: number | null;          // 0.0–1.0, 0.5 means heuristic (not AI-scored)
  reason?: string | null;                   // 1-sentence explanation
  evidence?: string[];                      // signals used to derive the score
  importanceValidationStatus?: 'ACCEPTED' | 'ADJUSTED' | 'LOW_CONFIDENCE' | 'FALLBACK' | null;
}

/**
 * Request to generate a new roadmap
 */
export interface GenerateRoadmapRequest {
  goal: string;
  duration: string;
  experience: string;
  style: string;
  industry?: string;
  roadmapType?: string;
  target?: string;
  finalObjective?: string;
  currentLevel?: string;
  desiredDuration?: string;
  background?: string;
  dailyTime?: string;
  learningStyle?: string;
  targetEnvironment?: string;
  location?: string;
  priority?: string;
  toolPreferences?: string[];
  difficultyConcern?: string;
  incomeGoal?: boolean;

  // Skill-based specific fields
  roadmapMode?: 'SKILL_BASED' | 'CAREER_BASED';
  aiAgentMode?: 'NORMAL' | 'DEEP_RESEARCH' | 'deep-research-pro-preview-12-2025';
  skillName?: string;
  skillCategory?: string;
  desiredDepth?: string;
  learnerType?: string;
  currentSkillLevel?: string;
  learningGoal?: string;
  dailyLearningTime?: string;
  assessmentPreference?: string;
  difficultyTolerance?: string;
  toolPreference?: string[]; // Note: singular in backend DTO for skill mode list? Backend has toolPreference (singular name, list type)

  // Career-based specific fields
  targetRole?: string;
  careerTrack?: string;
  targetSeniority?: string;
  workMode?: string;
  targetMarket?: string;
  companyType?: string;
  timelineToWork?: string;
  incomeExpectation?: boolean;
  workExperience?: string;
  transferableSkills?: boolean;
  confidenceLevel?: string;
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
  roadmapType?: string;
  target?: string;
  finalObjective?: string;
  currentLevel?: string;
  desiredDuration?: string;
  background?: string;
  dailyTime?: string;
  targetEnvironment?: string;
  location?: string;
  priority?: string;
  toolPreferences?: string[];
  difficultyConcern?: string;
  incomeGoal?: boolean;
  
  // New V2 Metadata Fields
  roadmapMode?: 'SKILL_BASED' | 'CAREER_BASED';
  skillMode?: {
    skillName?: string;
    skillCategory?: string;
    desiredDepth?: string;
    learnerType?: string;
    currentSkillLevel?: string;
    learningGoal?: string;
    dailyLearningTime?: string;
    assessmentPreference?: string;
    difficultyTolerance?: string;
    toolPreference?: string[];
  };
  careerMode?: {
    targetRole?: string;
    careerTrack?: string;
    targetSeniority?: string;
    workMode?: string;
    targetMarket?: string;
    companyType?: string;
    timelineToWork?: string;
    incomeExpectation?: boolean;
    workExperience?: string;
    transferableSkills?: boolean;
    confidenceLevel?: string;
  };
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
  roadmapStatus?: string;
  metadata: RoadmapMetadata;
  roadmap: RoadmapNode[];
  statistics: RoadmapStatistics;
  learningTips: string | string[]; // Backend returns List<String>, but may vary
  warnings?: string[];
  createdAt: string;
  progress?: Record<string, QuestProgress>; // Quest progress from backend
  overview?: {
    purpose?: string;
    audience?: string;
    postRoadmapState?: string;
  };
  structure?: {
    phaseId?: string;
    title?: string;
    timeframe?: string;
    goal?: string;
    skillFocus?: string[];
    mindsetGoal?: string;
    expectedOutput?: string;
  }[];
  thinkingProgression?: string[];
  projectsEvidence?: {
    phaseId?: string;
    project?: string;
    objective?: string;
    skillsProven?: string[];
    kpi?: string[];
  }[];
  nextSteps?: {
    jobs?: string[];
    nextSkills?: string[];
    mentorsMicroJobs?: string[];
  };
  skillDependencies?: { from: string; to: string; }[];
}

/**
 * Optional preferences when creating study tasks from a roadmap node.
 * The backend merges these preferences with node content before calling AI.
 */
export interface RoadmapNodeStudyPlanRequest {
  subjectName?: string;
  startDate?: string;
  deadline?: string;
  timezone?: string;
  preferredDays?: string[];
  preferredTimeWindows?: string[];
  topics?: string[];
  freeTimeDescription?: string;
  desiredOutcome?: string;
  intensityLevel?: string;
  durationMinutes?: number;
  maxSessionsPerDay?: number;
  breakMinutesBetweenSessions?: number;
  maxDailyStudyMinutes?: number;
  studyMethod?: string;
  resourcesPreference?: string;
  studyPreference?: string;
  earliestStartLocalTime?: string;
  latestEndLocalTime?: string;
  avoidLateNight?: boolean;
  allowLateNight?: boolean;
  confirmLateNight?: boolean;
  chronotype?: string;
  idealFocusWindows?: string[];
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
  status?: string;
  
  createdAt: string;
}

export interface RoadmapStatusCounts {
  active: number;
  paused: number;
  deleted: number;
  total: number;
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
  onCreateStudyTask?: (nodeId: string) => void;
  isCreatingStudyTask?: boolean;
  isEligibleForStudyTask?: boolean;
  hasStudyTask?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
}
