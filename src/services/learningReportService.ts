import axiosInstance from "./axiosInstance";

export type ReportType = "COMPREHENSIVE";
export type ReportRange = "7d" | "30d" | "90d";
export type LearningTrend = "improving" | "stable" | "declining";

export interface ReportSections {
  currentSkills?: string;
  learningGoals?: string;
  progress?: string;
  progressSummary?: string;
  strengths?: string;
  areasToImprove?: string;
  recommendations?: string;
  skillGaps?: string;
  nextSteps?: string;
  motivation?: string;
}

export interface LearningOverview {
  overallProgress: number;
  learningTrend: LearningTrend;
  recommendations: string[];
}

export interface StudyStats {
  studyMinutesToday: number;
  studyMinutesWeek: number;
  studyMinutesMonth: number;
  totalStudyHours: number;
  currentStreak: number;
}

export interface RoadmapStats {
  totalRoadmaps: number;
  completedRoadmaps: number;
  inProgressRoadmaps: number;
  totalMissions: number;
  completedMissions: number;
  pendingMissions: number;
  roadmapProgress: number;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  taskProgress: number;
}

export interface CourseStats {
  activeCourses: number;
  completedCourses: number;
  averageActiveCourseProgress: number;
}

export interface ShortTermJobStats {
  totalJobsApplied: number;
  completedJobs: number;
  inProgressJobs: number;
  pendingApplications: number;
  rejectedApplications: number;
  totalEarnings: number;
  averageRating: number | null;
  totalMilestonesDelivered: number;
  onTimeDeliveryRate: number;
}

export interface JobBreakdownItem {
  jobId: number;
  jobTitle: string;
  recruiterName: string;
  status: string;
  budget: number;
  earnedAmount: number;
  milestonesTotal: number;
  milestonesCompleted: number;
  appliedAt?: string;
  completedAt?: string;
  rating?: number;
  primarySkill?: string;
  skillsDemonstrated: string[];
}

export interface TimelinePoint {
  bucketLabel: string;
  bucketStart: string;
  studyMinutes: number;
  missionsCompleted: number;
  tasksCompleted: number;
  jobsCompleted: number;
  earnings: number;
}

export interface RoadmapBreakdownItem {
  roadmapId: number;
  title: string;
  goal?: string;
  status: string;
  totalMissions: number;
  completedMissions: number;
  pendingMissions: number;
  progressPercent: number;
  nextMissionTitle?: string;
  lastCompletedAt?: string;
}

export interface CourseBreakdownItem {
  courseId: number;
  courseTitle: string;
  status: string;
  progressPercent: number;
  completedAt?: string;
  enrolledAt?: string;
}

export interface SkillInfo {
  skillName: string;
  level: string;
  progressPercent: number;
  source?: string;
}

export interface RoadmapProgress {
  roadmapId: number;
  title: string;
  goal?: string;
  totalQuests: number;
  completedQuests: number;
  progressPercent: number;
  totalEstimatedHours?: number;
  createdAt?: string;
  lastActivityAt?: string;
}

export interface StudentMetrics {
  totalRoadmaps: number;
  completedRoadmaps: number;
  inProgressRoadmaps: number;
  averageProgress: number;
  totalStudyMinutesToday: number;
  totalStudyMinutesWeek: number;
  totalStudyMinutesMonth: number;
  totalStudyHours: number;
  streakDays: number;
  currentStreak: number;
  totalChatSessions: number;
  totalTasks: number;
  completedTasks: number;
  totalTasksCompleted: number;
  totalTasksPending: number;
  totalEnrolledCourses: number;
  completedCourses: number;
  topSkills: SkillInfo[];
  roadmapDetails: RoadmapProgress[];
}

export interface StudentLearningReportResponse {
  id?: number;
  reportId: number;
  reportName?: string;
  studentId: number;
  studentName: string;
  reportType: ReportType;
  generatedAt: string;
  range: ReportRange;
  snapshot: boolean;
  overview: LearningOverview;
  studyStats: StudyStats;
  roadmapStats: RoadmapStats;
  taskStats: TaskStats;
  courseStats: CourseStats;
  jobStats?: ShortTermJobStats;
  roadmapBreakdown: RoadmapBreakdownItem[];
  courseBreakdown: CourseBreakdownItem[];
  jobBreakdown?: JobBreakdownItem[];
  timeline: TimelinePoint[];
  timelineByRange?: Partial<Record<ReportRange, TimelinePoint[]>>;
  sections?: ReportSections;
  metrics: StudentMetrics;
  overallProgress: number;
  learningTrend: LearningTrend;
  recommendedFocus?: string;
}

export interface LearningReportTimelineResponse {
  range: ReportRange;
  snapshotId?: number;
  generatedAt?: string;
  timeline: TimelinePoint[];
}

export interface GenerateReportRequest {
  reportType?: ReportType;
  range?: ReportRange;
  includeChatHistory?: boolean;
  includeDetailedSkills?: boolean;
  customPrompt?: string;
}

export interface CanGenerateResponse {
  canGenerate: boolean;
  nextAvailableAt?: string;
  remainingCooldownMinutes?: number;
  reason?: string;
  message?: string;
}

export interface ReportTypeInfo {
  type: ReportType;
  name: string;
  description: string;
  cooldownHours: number;
}

function isValidRange(range: string | null | undefined): range is ReportRange {
  return range === "7d" || range === "30d" || range === "90d";
}

function normalizeRange(range?: string | null): ReportRange {
  return isValidRange(range) ? range : "30d";
}

function isValidReportId(id: number | string | null | undefined): boolean {
  if (id === null || id === undefined) return false;
  if (typeof id === "string") {
    if (id === "undefined" || id === "null" || id.trim() === "") return false;
    const parsed = parseInt(id, 10);
    return !isNaN(parsed) && parsed > 0;
  }
  return typeof id === "number" && !isNaN(id) && id > 0;
}

function parseReportId(id: number | string | null | undefined): number {
  if (!isValidReportId(id)) {
    throw new Error("Invalid report ID. Please select a valid report.");
  }
  if (typeof id === "number") {
    return id;
  }
  // At this point, id must be a valid string
  return parseInt(id as string, 10);
}

function createEmptyMetrics(): StudentMetrics {
  return {
    totalRoadmaps: 0,
    completedRoadmaps: 0,
    inProgressRoadmaps: 0,
    averageProgress: 0,
    totalStudyMinutesToday: 0,
    totalStudyMinutesWeek: 0,
    totalStudyMinutesMonth: 0,
    totalStudyHours: 0,
    streakDays: 0,
    currentStreak: 0,
    totalChatSessions: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalTasksCompleted: 0,
    totalTasksPending: 0,
    totalEnrolledCourses: 0,
    completedCourses: 0,
    topSkills: [],
    roadmapDetails: [],
  };
}

function normalizeTimelinePoint(point: any): TimelinePoint {
  return {
    bucketLabel: point?.bucketLabel || "",
    bucketStart: point?.bucketStart || "",
    studyMinutes: point?.studyMinutes || 0,
    missionsCompleted: point?.missionsCompleted || 0,
    tasksCompleted: point?.tasksCompleted || 0,
    jobsCompleted: point?.jobsCompleted || 0,
    earnings: point?.earnings || 0,
  };
}

function buildCompatibilityMetrics(response: any): StudentMetrics {
  const roadmapStats = response.roadmapStats || {};
  const studyStats = response.studyStats || {};
  const taskStats = response.taskStats || {};
  const courseStats = response.courseStats || {};
  const roadmapBreakdown = Array.isArray(response.roadmapBreakdown)
    ? response.roadmapBreakdown
    : [];

  return {
    totalRoadmaps: roadmapStats.totalRoadmaps || 0,
    completedRoadmaps: roadmapStats.completedRoadmaps || 0,
    inProgressRoadmaps: roadmapStats.inProgressRoadmaps || 0,
    averageProgress:
      response.overview?.overallProgress ??
      response.overallProgress ??
      roadmapStats.roadmapProgress ??
      0,
    totalStudyMinutesToday: studyStats.studyMinutesToday || 0,
    totalStudyMinutesWeek: studyStats.studyMinutesWeek || 0,
    totalStudyMinutesMonth: studyStats.studyMinutesMonth || 0,
    totalStudyHours: studyStats.totalStudyHours || 0,
    streakDays: studyStats.currentStreak || 0,
    currentStreak: studyStats.currentStreak || 0,
    totalChatSessions: 0,
    totalTasks: taskStats.totalTasks || 0,
    completedTasks: taskStats.completedTasks || 0,
    totalTasksCompleted: taskStats.completedTasks || 0,
    totalTasksPending: taskStats.pendingTasks || 0,
    totalEnrolledCourses:
      (courseStats.activeCourses || 0) + (courseStats.completedCourses || 0),
    completedCourses: courseStats.completedCourses || 0,
    topSkills: [],
    roadmapDetails: roadmapBreakdown.map((item: any) => ({
      roadmapId: item.roadmapId,
      title: item.title,
      goal: item.goal,
      totalQuests: item.totalMissions || 0,
      completedQuests: item.completedMissions || 0,
      progressPercent: item.progressPercent || 0,
      lastActivityAt: item.lastCompletedAt,
    })),
  };
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

function normalizeReportResponse(response: any): StudentLearningReportResponse {
  const overview = response?.overview || {};
  const studyStats = response?.studyStats || {};
  const roadmapStats = response?.roadmapStats || {};
  const taskStats = response?.taskStats || {};
  const courseStats = response?.courseStats || {};
  const recommendations = Array.isArray(overview.recommendations)
    ? overview.recommendations.filter(Boolean)
    : [];

  const normalized: StudentLearningReportResponse = {
    ...response,
    id: response?.id,
    reportId: response?.reportId ?? response?.id ?? 0,
    reportName: response?.reportName || buildReportTitle(response?.generatedAt),
    studentId: response?.studentId ?? 0,
    studentName: response?.studentName || "Học viên",
    reportType: "COMPREHENSIVE",
    generatedAt: response?.generatedAt || new Date().toISOString(),
    range: normalizeRange(response?.range),
    snapshot: Boolean(response?.snapshot),
    overview: {
      overallProgress:
        overview.overallProgress ?? response?.overallProgress ?? 0,
      learningTrend:
        overview.learningTrend ?? response?.learningTrend ?? "stable",
      recommendations,
    },
    studyStats: {
      studyMinutesToday: studyStats.studyMinutesToday || 0,
      studyMinutesWeek: studyStats.studyMinutesWeek || 0,
      studyMinutesMonth: studyStats.studyMinutesMonth || 0,
      totalStudyHours: studyStats.totalStudyHours || 0,
      currentStreak: studyStats.currentStreak || 0,
    },
    roadmapStats: {
      totalRoadmaps: roadmapStats.totalRoadmaps || 0,
      completedRoadmaps: roadmapStats.completedRoadmaps || 0,
      inProgressRoadmaps: roadmapStats.inProgressRoadmaps || 0,
      totalMissions: roadmapStats.totalMissions || 0,
      completedMissions: roadmapStats.completedMissions || 0,
      pendingMissions: roadmapStats.pendingMissions || 0,
      roadmapProgress: roadmapStats.roadmapProgress || 0,
    },
    taskStats: {
      totalTasks: taskStats.totalTasks || 0,
      completedTasks: taskStats.completedTasks || 0,
      pendingTasks: taskStats.pendingTasks || 0,
      overdueTasks: taskStats.overdueTasks || 0,
      taskProgress: taskStats.taskProgress || 0,
    },
    courseStats: {
      activeCourses: courseStats.activeCourses || 0,
      completedCourses: courseStats.completedCourses || 0,
      averageActiveCourseProgress: courseStats.averageActiveCourseProgress || 0,
    },
    roadmapBreakdown: Array.isArray(response?.roadmapBreakdown)
      ? response.roadmapBreakdown
      : [],
    courseBreakdown: Array.isArray(response?.courseBreakdown)
      ? response.courseBreakdown
      : [],
    timeline: Array.isArray(response?.timeline)
      ? response.timeline.map(normalizeTimelinePoint)
      : [],
    timelineByRange: response?.timelineByRange,
    sections: response?.sections || {},
    metrics: response?.metrics || createEmptyMetrics(),
    overallProgress: overview.overallProgress ?? response?.overallProgress ?? 0,
    learningTrend:
      overview.learningTrend ?? response?.learningTrend ?? "stable",
    recommendedFocus:
      response?.recommendedFocus ||
      (recommendations.length > 0 ? recommendations[0] : undefined),
  };

  if (!response?.metrics) {
    normalized.metrics = buildCompatibilityMetrics(normalized);
  }

  return normalized;
}

class LearningReportService {
  private readonly BASE_URL = "/student/learning-report";

  async getSummary(
    range: ReportRange = "30d",
  ): Promise<StudentLearningReportResponse> {
    const response = await axiosInstance.get<StudentLearningReportResponse>(
      `${this.BASE_URL}/summary`,
      { params: { range } },
    );
    return normalizeReportResponse(response.data);
  }

  async getTimeline(
    range: ReportRange = "30d",
    snapshotId?: number,
  ): Promise<LearningReportTimelineResponse> {
    const response = await axiosInstance.get<LearningReportTimelineResponse>(
      `${this.BASE_URL}/timeline`,
      {
        params: {
          range,
          ...(snapshotId ? { snapshotId } : {}),
        },
      },
    );

    return {
      ...response.data,
      range: normalizeRange(response.data?.range),
      timeline: Array.isArray(response.data?.timeline)
        ? response.data.timeline.map(normalizeTimelinePoint)
        : [],
    };
  }

  async createSnapshot(
    range: ReportRange = "30d",
  ): Promise<StudentLearningReportResponse> {
    const response = await axiosInstance.post<StudentLearningReportResponse>(
      `${this.BASE_URL}/snapshots`,
      null,
      { params: { range } },
    );
    return normalizeReportResponse(response.data);
  }

  async generateReport(
    request: GenerateReportRequest = {},
  ): Promise<StudentLearningReportResponse> {
    const response = await axiosInstance.post<StudentLearningReportResponse>(
      `${this.BASE_URL}/generate`,
      {
        reportType: "COMPREHENSIVE",
        range: normalizeRange(request.range),
        includeChatHistory: request.includeChatHistory ?? false,
        includeDetailedSkills: request.includeDetailedSkills ?? false,
        customPrompt: request.customPrompt,
      },
    );
    return normalizeReportResponse(response.data);
  }

  async generateQuickReport(): Promise<StudentLearningReportResponse> {
    const response = await axiosInstance.post<StudentLearningReportResponse>(
      `${this.BASE_URL}/generate/quick`,
    );
    return normalizeReportResponse(response.data);
  }

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

  async getReportById(
    reportId: number | string,
  ): Promise<StudentLearningReportResponse> {
    const validatedId = parseReportId(reportId);
    try {
      const response = await axiosInstance.get<StudentLearningReportResponse>(
        `${this.BASE_URL}/${validatedId}`,
      );
      return normalizeReportResponse(response.data);
    } catch (error: any) {
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

  async getCurrentMetrics(): Promise<StudentMetrics> {
    const response = await axiosInstance.get<StudentMetrics>(
      `${this.BASE_URL}/metrics`,
    );
    return response.data;
  }

  async canGenerateReport(): Promise<CanGenerateResponse> {
    const response = await axiosInstance.get<CanGenerateResponse>(
      `${this.BASE_URL}/can-generate`,
    );
    return response.data;
  }

  async getReportTypes(): Promise<ReportTypeInfo[]> {
    const response = await axiosInstance.get<ReportTypeInfo[]>(
      `${this.BASE_URL}/report-types`,
    );
    return response.data;
  }

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

  formatReportFileName(
    report: Pick<StudentLearningReportResponse, "generatedAt" | "reportName">,
  ): string {
    const safeDate = buildReportFileDate(report.generatedAt);
    return `learning-report-${safeDate}`;
  }

  getTrendIcon(trend: LearningTrend): string {
    switch (trend) {
      case "improving":
        return "▲";
      case "stable":
        return "■";
      case "declining":
        return "▼";
      default:
        return "•";
    }
  }

  getStatusColor(trend: LearningTrend): string {
    switch (trend) {
      case "improving":
        return "text-emerald-600";
      case "stable":
        return "text-amber-600";
      case "declining":
        return "text-rose-600";
      default:
        return "text-slate-500";
    }
  }

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

const learningReportService = new LearningReportService();

export default learningReportService;
export {
  LearningReportService,
  isValidReportId,
  parseReportId,
  normalizeRange,
};
