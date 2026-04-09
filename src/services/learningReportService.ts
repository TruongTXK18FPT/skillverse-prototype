import axiosInstance from "./axiosInstance";

// ==================== Types ====================

export type ReportType =
  | "COMPREHENSIVE"
  | "WEEKLY_SUMMARY"
  | "MONTHLY_SUMMARY"
  | "SKILL_ASSESSMENT"
  | "GOAL_TRACKING";

export interface ReportSections {
  currentSkills: string;
  learningGoals: string;
  progress: string; // Maps to backend 'progressSummary'
  progressSummary?: string; // Direct mapping from backend
  strengths: string;
  areasToImprove: string;
  recommendations: string;
  skillGaps: string;
  nextSteps: string;
  motivation: string;
}

export interface SkillInfo {
  id: number;
  skillName: string;
  status: "completed" | "in_progress" | "not_started";
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export interface RoadmapProgress {
  roadmapId: number;
  roadmapTitle: string;
  totalSkills: number;
  completedSkills: number;
  progressPercentage: number;
  createdAt: string;
  skills: SkillInfo[];
}

export interface StudentMetrics {
  totalStudyHours: number;
  totalStudySessions: number;
  totalTasksCompleted: number;
  totalTasksPending: number;
  totalRoadmaps: number;
  completedRoadmaps: number;
  totalChatSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  averageSessionDuration: number;
  mostActiveTime?: string;
  preferredSkillCategory?: string;
  roadmapProgressList: RoadmapProgress[];
  averageProgress?: number;  // Backend field mapping
  // Backend-only fields that may be present
  totalTasks?: number;
  completedTasks?: number;
  streakDays?: number;
  roadmapDetails?: RoadmapProgress[];  // Backend field name
}

export interface StudentLearningReportResponse {
  reportId: number;
  reportName?: string;
  studentId: number;
  studentName: string;
  reportType: ReportType;
  generatedAt: string;
  validUntil?: string;

  // AI-generated content
  sections: ReportSections;

  // Raw metrics
  metrics: StudentMetrics;

  // Summary
  overallProgress: number;
  learningTrend: "improving" | "stable" | "declining";
  recommendedFocus?: string;
}

export interface GenerateReportRequest {
  reportType?: ReportType;
  includeChatHistory?: boolean;
  includeDetailedSkills?: boolean;
  customPrompt?: string;
}

export interface CanGenerateResponse {
  canGenerate: boolean;
  nextAvailableAt?: string;
  remainingCooldownMinutes?: number;
  reason?: string;
}

export interface ReportTypeInfo {
  type: ReportType;
  name: string;
  description: string;
  cooldownHours: number;
}

// ==================== Validation Helpers ====================

/**
 * Validate if a reportId is valid
 */
function isValidReportId(id: number | string | null | undefined): boolean {
  if (id === null || id === undefined) return false;
  if (typeof id === "string") {
    if (id === "undefined" || id === "null" || id.trim() === "") return false;
    const parsed = parseInt(id, 10);
    return !isNaN(parsed) && parsed > 0;
  }
  return typeof id === "number" && !isNaN(id) && id > 0;
}

/**
 * Parse and validate reportId
 */
function parseReportId(id: number | string | null | undefined): number {
  if (!isValidReportId(id)) {
    throw new Error("Invalid report ID. Please select a valid report.");
  }
  if (typeof id === "number") return id;
  return parseInt(id as string, 10);
}

/**
 * Normalize report response to handle backend field naming differences
 * Maps backend fields to frontend expected fields
 */
function normalizeReportResponse(
   
  response: any,
): StudentLearningReportResponse {
  // Map 'id' to 'reportId' if needed
  const normalized: StudentLearningReportResponse = {
    ...response,
    reportId: response.reportId || response.id,
    reportName: response.reportName,
  };

  // Map sections fields
  if (normalized.sections) {
    // Map progressSummary to progress if progress is missing
    if (!normalized.sections.progress && normalized.sections.progressSummary) {
      normalized.sections.progress = normalized.sections.progressSummary;
    }
  }

  // Map metrics fields
  if (normalized.metrics) {
    // Map streakDays to currentStreak if needed
    if (
      normalized.metrics.currentStreak === undefined &&
      (normalized.metrics as any).streakDays !== undefined
    ) {
      normalized.metrics.currentStreak = (normalized.metrics as any).streakDays;
    }

    // Map totalStudyMinutesWeek to totalStudyHours
    if (
      normalized.metrics.totalStudyHours === undefined &&
      (normalized.metrics as any).totalStudyMinutesWeek !== undefined
    ) {
      normalized.metrics.totalStudyHours = Math.round(
        ((normalized.metrics as any).totalStudyMinutesWeek || 0) / 60,
      );
    }

    // Map totalStudyHours from backend if available
    if (
      normalized.metrics.totalStudyHours === undefined &&
      (normalized.metrics as any).totalStudyHours !== undefined
    ) {
      normalized.metrics.totalStudyHours = (normalized.metrics as any).totalStudyHours;
    }

    // Map completedTasks to totalTasksCompleted
    if (
      normalized.metrics.totalTasksCompleted === undefined &&
      (normalized.metrics as any).completedTasks !== undefined
    ) {
      normalized.metrics.totalTasksCompleted = (
        normalized.metrics as any
      ).completedTasks;
    }
  }

  // Map averageProgress to overallProgress if not set
  if (normalized.overallProgress === undefined) {
    if (normalized.metrics?.averageProgress !== undefined) {
      normalized.overallProgress = normalized.metrics.averageProgress;
    } else if ((normalized.metrics as any)?.averageProgress !== undefined) {
      normalized.overallProgress = (normalized.metrics as any).averageProgress;
    }
  }

  // learningTrend default
  if (!normalized.learningTrend) {
    normalized.learningTrend = "stable";
  }

  // recommendedFocus default
  if (normalized.recommendedFocus === undefined) {
    normalized.recommendedFocus = undefined;
  }

  // Map metrics fields (continued)
  if (normalized.metrics) {
    // roadmapDetails -> roadmapProgressList (backend name vs frontend name)
    if (
      (normalized.metrics as any).roadmapDetails &&
      !normalized.metrics.roadmapProgressList
    ) {
      normalized.metrics.roadmapProgressList = (normalized.metrics as any).roadmapDetails;
    }

    // totalTasksPending = totalTasks - totalTasksCompleted
    if (
      normalized.metrics.totalTasksPending === undefined &&
      normalized.metrics.totalTasks !== undefined &&
      normalized.metrics.totalTasksCompleted !== undefined
    ) {
      normalized.metrics.totalTasksPending =
        normalized.metrics.totalTasks - normalized.metrics.totalTasksCompleted;
    }
  }

  if (!normalized.reportName) {
    normalized.reportName = buildReportTitle(normalized.generatedAt);
  }

  return normalized;
}

function buildReportTitle(dateString?: string): string {
  if (!dateString) {
    return "Báo cáo";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Báo cáo";
  }

  return `Báo cáo ${new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)}`;
}

function buildReportFileDate(dateString?: string): string {
  if (!dateString) {
    return new Date().toISOString().split("T")[0];
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split("T")[0];
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ==================== Service Class ====================

class LearningReportService {
  private readonly BASE_URL = "/student/learning-report";

  /**
   * Generate a new learning report
   * Rate limit: 1 comprehensive report per 6 hours
   */
  async generateReport(
    request: GenerateReportRequest = {},
  ): Promise<StudentLearningReportResponse> {
    const response = await axiosInstance.post<StudentLearningReportResponse>(
      `${this.BASE_URL}/generate`,
      {
        reportType: request.reportType || "COMPREHENSIVE",
        includeChatHistory: request.includeChatHistory ?? true,
        includeDetailedSkills: request.includeDetailedSkills ?? true,
        customPrompt: request.customPrompt,
      },
    );
    return normalizeReportResponse(response.data);
  }

  /**
   * Generate a quick report with default settings
   */
  async generateQuickReport(): Promise<StudentLearningReportResponse> {
    const response = await axiosInstance.post<StudentLearningReportResponse>(
      `${this.BASE_URL}/generate/quick`,
    );
    return normalizeReportResponse(response.data);
  }

  /**
   * Get report history with pagination
   */
  async getReportHistory(
    page = 0,
    size = 10,
  ): Promise<StudentLearningReportResponse[]> {
    const response = await axiosInstance.get<StudentLearningReportResponse[]>(
      `${this.BASE_URL}/history`,
      { params: { page, size } },
    );
    return response.data.map(normalizeReportResponse);
  }

  /**
   * Get the most recent report
   */
  async getLatestReport(): Promise<StudentLearningReportResponse | null> {
    try {
      const response = await axiosInstance.get<StudentLearningReportResponse>(
        `${this.BASE_URL}/latest`,
      );
      return normalizeReportResponse(response.data);
    } catch (error: any) {
      if (error.response?.status === 204) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get a specific report by ID with validation
   */
  async getReportById(
    reportId: number | string,
  ): Promise<StudentLearningReportResponse> {
    // Validate reportId before making the request
    const validatedId = parseReportId(reportId);

    try {
      const response = await axiosInstance.get<StudentLearningReportResponse>(
        `${this.BASE_URL}/${validatedId}`,
      );
      return normalizeReportResponse(response.data);
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error("Báo cáo không tồn tại hoặc đã bị xóa.");
      }
      if (error.response?.status === 403) {
        throw new Error("Bạn không có quyền xem báo cáo này.");
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.message || "ID báo cáo không hợp lệ.",
        );
      }
      throw error;
    }
  }

  /**
   * Get current metrics without generating a report
   */
  async getCurrentMetrics(): Promise<StudentMetrics> {
    const response = await axiosInstance.get<StudentMetrics>(
      `${this.BASE_URL}/metrics`,
    );
    return response.data;
  }

  /**
   * Check if user can generate a new report (rate limiting)
   */
  async canGenerateReport(): Promise<CanGenerateResponse> {
    const response = await axiosInstance.get<CanGenerateResponse>(
      `${this.BASE_URL}/can-generate`,
    );
    return response.data;
  }

  /**
   * Get available report types with descriptions
   */
  async getReportTypes(): Promise<ReportTypeInfo[]> {
    const response = await axiosInstance.get<ReportTypeInfo[]>(
      `${this.BASE_URL}/report-types`,
    );
    return response.data;
  }

  /**
   * Helper: Format report date for display
   */
  formatReportDate(dateString: string): string {
    if (!dateString) {
      return "Thời gian không xác định";
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  formatReportTitle(dateString?: string): string {
    return buildReportTitle(dateString);
  }

  formatReportFileName(report: Pick<StudentLearningReportResponse, "generatedAt" | "reportName">): string {
    const safeDate = buildReportFileDate(report.generatedAt);
    return `learning-report-${safeDate}`;
  }

  /**
   * Helper: Get trend icon based on learning trend
   */
  getTrendIcon(trend: "improving" | "stable" | "declining"): string {
    switch (trend) {
      case "improving":
        return "📈";
      case "stable":
        return "➡️";
      case "declining":
        return "📉";
      default:
        return "📊";
    }
  }

  /**
   * Helper: Get status color class
   */
  getStatusColor(trend: "improving" | "stable" | "declining"): string {
    switch (trend) {
      case "improving":
        return "text-green-500";
      case "stable":
        return "text-yellow-500";
      case "declining":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }

  /**
   * Helper: Calculate time until next report available
   */
  getTimeUntilNextReport(remainingMinutes: number): string {
    if (remainingMinutes <= 0) return "Có thể tạo ngay";

    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m nữa`;
    }
    return `${mins} phút nữa`;
  }
}

// Export singleton instance
const learningReportService = new LearningReportService();
export default learningReportService;

// Also export the class for testing
export { LearningReportService };

// Export validation helpers for use in components
export { isValidReportId, parseReportId };
