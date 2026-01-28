import axiosInstance from "./axiosInstance";

// =============================================
// ADMIN GAMIFICATION SERVICE - API INTEGRATION
// =============================================
// Handles all admin gamification-related API calls
// for dashboard, badge/game management, activity tracking

// --- Types ---
export interface AdminGamificationStats {
  totalUsers: number;
  activeUsers: number;
  totalCoinsDistributed: number;
  totalCoinsSpent: number;
  totalBadgesAwarded: number;
  totalGameSessions: number;
  coinsDistributedToday: number;
  coinsDistributedThisWeek: number;
  badgesAwardedToday: number;
  badgesAwardedThisWeek: number;
  gameSessionsToday: number;
  gameSessionsThisWeek: number;
  topCoinEarners: LeaderboardEntry[];
  topXpEarners: LeaderboardEntry[];
  mostActiveUsers: UserActivitySummary[];
  gameStats: GameStatsSummary[];
  badgeStats: BadgeStatsSummary[];
  activityTrends: ActivityTrendData[];
  generatedAt: string;
}

export interface LeaderboardEntry {
  userId: number;
  userName: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userAvatar: string | null;
  userAvatarUrl?: string | null; // Alias for compatibility
  avatarMediaUrl?: string; // From UserProfileResponse
  rankPosition: number;
  totalCoins: number;
  totalXp: number;
  streakDays: number;
  badgesCount?: number;
  badgeCount?: number; // Alias for compatibility
}

export interface UserActivitySummary {
  userId: number;
  userName: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userAvatar: string | null;
  userAvatarUrl?: string | null; // Alias for compatibility
  avatarMediaUrl?: string; // From UserProfileResponse
  totalActivities: number;
  coursesCompleted: number;
  postsCreated: number;
  gamesPlayed: number;
  badgesEarned: number;
  totalCoins: number;
  totalXp: number;
  currentStreak: number;
  streakDays?: number; // Alias for compatibility
  lastActivityAt: string | null;
}

export interface GameStatsSummary {
  gameDefId: number;
  gameKey: string;
  gameTitle: string;
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  totalCoinsAwarded: number;
  totalXpAwarded: number;
  averageScore: number;
  completionRate: number;
  uniquePlayers: number;
}

export interface BadgeStatsSummary {
  badgeDefId: number;
  badgeKey: string;
  badgeTitle: string;
  badgeCategory: string;
  badgeRarity: string;
  totalAwarded: number;
  awardedThisWeek: number;
  awardRate: number;
}

export interface ActivityTrendData {
  date: string;
  coinsDistributed: number;
  badgesAwarded: number;
  gameSessions: number;
  activeUsers: number;
  newUsers: number;
}

export interface UserActivityTracking {
  userId: number;
  userName: string;
  fullName?: string;
  userAvatar: string | null;
  avatarMediaUrl?: string | null;
  counters: ActivityCounters;
  achievements: AchievementProgress[];
  recentActivities: RecentActivity[];
  milestones: MilestoneReached[];
}

export interface ActivityCounters {
  totalActivities: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  quizzesPerfectScore: number;
  assignmentsSubmitted: number;
  certificatesEarned: number;
  postsCreated: number;
  commentsWritten: number;
  likesReceived: number;
  mentorSessionsBooked: number;
  mentorSessionsCompleted: number;
  reviewsWritten: number;
  helpfulAnswers: number;
  gamesPlayed: number;
  gamesWon: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  badgesEarned: number;
  currentStreak: number;
  longestStreak: number;
  seminarsAttended: number;
  eventsParticipated: number;
  challengesCompleted: number;
  loginDays: number;
  profileViews: number;
  referrals: number;
}

export interface AchievementProgress {
  achievementKey: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementIcon: string;
  category: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  isCompleted: boolean;
  completedAt: string | null;
  coinReward: number;
  xpReward: number;
}

export interface RecentActivity {
  activityType: string;
  activityDescription: string;
  entityType: string;
  entityId: number;
  coinsEarned: number;
  xpEarned: number;
  occurredAt: string;
}

export interface MilestoneReached {
  milestoneKey: string;
  milestoneTitle: string;
  milestoneDescription: string;
  threshold: number;
  coinReward: number;
  reachedAt: string;
}

export interface BadgeDefinition {
  badgeDefId: number;
  badgeKey: string;
  badgeTitle: string;
  badgeDescription: string;
  badgeIcon: string;
  badgeImageUrl?: string; // URL ảnh huy hiệu từ Cloudinary
  badgeCategory: string;
  badgeRarity: string;
  criteriaDescription: string;
  criteriaConfig: string;
  // Logic trigger fields
  triggerType: BadgeTriggerType;
  triggerThreshold: number;
  triggerMetric?: string; // e.g., 'TOTAL_TIME_MINUTES', 'COURSES_COMPLETED', etc.
  coinReward: number;
  xpReward: number;
  isActive: boolean;
  displayOrder: number;
}

// Badge trigger types - defines when a badge is automatically awarded
export type BadgeTriggerType =
  | "COURSES_COMPLETED" // Hoàn thành X khóa học
  | "LESSONS_COMPLETED" // Hoàn thành X bài học
  | "TOTAL_TIME_MINUTES" // Tổng thời gian học (phút)
  | "STREAK_DAYS" // Chuỗi học tập X ngày liên tiếp
  | "LONGEST_STREAK" // Chuỗi học tập lâu nhất
  | "COINS_EARNED" // Kiếm được X xu
  | "GAMES_PLAYED" // Chơi X game
  | "GAMES_WON" // Thắng X game
  | "QUIZZES_COMPLETED" // Hoàn thành X quiz
  | "QUIZZES_PERFECT_SCORE" // Đạt điểm tuyệt đối X quiz
  | "POSTS_CREATED" // Tạo X bài viết
  | "COMMENTS_WRITTEN" // Viết X comment
  | "HELPFUL_ANSWERS" // X câu trả lời hữu ích
  | "LIKES_RECEIVED" // Nhận X lượt like
  | "MENTOR_SESSIONS" // Tham gia X buổi mentor
  | "CERTIFICATES_EARNED" // Đạt X chứng chỉ
  | "LOGIN_DAYS" // Đăng nhập X ngày
  | "REFERRALS" // Giới thiệu X người
  | "EVENTS_PARTICIPATED" // Tham gia X sự kiện
  | "MANUAL"; // Trao thủ công bởi admin

export interface BadgeDefinitionRequest {
  badgeKey: string;
  badgeTitle: string;
  badgeDescription?: string;
  badgeIcon?: string;
  badgeImageUrl?: string; // URL ảnh huy hiệu từ Cloudinary
  badgeCategory: string;
  badgeRarity: string;
  criteriaDescription?: string;
  criteriaConfig?: string;
  // Logic trigger fields
  triggerType: BadgeTriggerType;
  triggerThreshold: number;
  triggerMetric?: string;
  coinReward: number;
  xpReward: number;
  isActive?: boolean;
  displayOrder?: number;
}

export interface MiniGameDefinition {
  gameDefId: number;
  gameKey: string;
  gameTitle: string;
  gameDescription: string;
  gameIcon: string;
  gameType: string;
  difficultyLevel: string;
  baseCoinReward: number;
  maxCoinReward: number;
  xpReward: number;
  cooldownMinutes: number;
  maxPlaysPerDay: number | null;
  maxCoinsPerDay: number | null;
  isActive: boolean;
  isPremiumOnly: boolean;
  requiredPremiumPlan: string | null;
  premiumCoinMultiplier: number;
}

export interface MiniGameDefinitionRequest {
  gameKey: string;
  gameTitle: string;
  gameDescription?: string;
  gameIcon?: string;
  gameType?: string;
  difficultyLevel?: string;
  baseCoinReward: number;
  maxCoinReward: number;
  xpReward: number;
  cooldownMinutes: number;
  maxPlaysPerDay?: number | null;
  maxCoinsPerDay?: number | null;
  isActive?: boolean;
  isPremiumOnly?: boolean;
  requiredPremiumPlan?: string | null;
  premiumCoinMultiplier?: number;
}

export interface CoinAdjustmentRequest {
  userId: number;
  coinAmount: number;
  reason: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// --- API Functions ---

// =============================================
// DASHBOARD & STATISTICS
// =============================================

export const getDashboardStats = async (): Promise<AdminGamificationStats> => {
  const response = await axiosInstance.get(
    "/admin/gamification/dashboard/stats",
  );
  return response.data;
};

export const getActivityTrends = async (
  startDate: string,
  endDate: string,
): Promise<ActivityTrendData[]> => {
  const response = await axiosInstance.get(
    "/admin/gamification/dashboard/trends",
    {
      params: { startDate, endDate },
    },
  );
  return response.data;
};

export const getTopCoinEarners = async (
  limit = 10,
): Promise<UserActivitySummary[]> => {
  const response = await axiosInstance.get(
    "/admin/gamification/dashboard/top-earners",
    {
      params: { limit },
    },
  );
  return response.data;
};

export const getMostActiveUsers = async (
  limit = 10,
): Promise<UserActivitySummary[]> => {
  const response = await axiosInstance.get(
    "/admin/gamification/dashboard/active-users",
    {
      params: { limit },
    },
  );
  return response.data;
};

export const getGameStats = async (): Promise<GameStatsSummary[]> => {
  const response = await axiosInstance.get(
    "/admin/gamification/dashboard/game-stats",
  );
  return response.data;
};

export const getBadgeStats = async (): Promise<BadgeStatsSummary[]> => {
  const response = await axiosInstance.get(
    "/admin/gamification/dashboard/badge-stats",
  );
  return response.data;
};

// =============================================
// USER ACTIVITY TRACKING
// =============================================

export const getAllUserActivities = async (
  page = 0,
  size = 20,
): Promise<PageResponse<UserActivitySummary>> => {
  const response = await axiosInstance.get(
    "/admin/gamification/users/activities",
    {
      params: { page, size },
    },
  );
  return response.data;
};

export const getUserActivityTracking = async (
  userId: number,
): Promise<UserActivityTracking> => {
  const response = await axiosInstance.get(
    `/admin/gamification/users/${userId}/activity`,
  );
  return response.data;
};

// =============================================
// LEADERBOARD MANAGEMENT
// =============================================

export const getLeaderboard = async (
  period = "week",
  type = "coins",
  page = 0,
  size = 50,
) => {
  const response = await axiosInstance.get("/admin/gamification/leaderboard", {
    params: { period, type, page, size },
  });
  return response.data;
};

export const refreshLeaderboard = async (): Promise<void> => {
  await axiosInstance.post("/admin/gamification/leaderboard/refresh");
};

export const getFullLeaderboard = async (period = "week") => {
  const response = await axiosInstance.get(
    "/admin/gamification/leaderboard/full",
    {
      params: { period },
    },
  );
  return response.data;
};

// =============================================
// BADGE MANAGEMENT
// =============================================

export const getAllBadges = async (): Promise<BadgeDefinition[]> => {
  const response = await axiosInstance.get("/admin/gamification/badges");
  return response.data;
};

export const createBadge = async (
  request: BadgeDefinitionRequest,
): Promise<BadgeDefinition> => {
  const response = await axiosInstance.post(
    "/admin/gamification/badges",
    request,
  );
  return response.data;
};

export const updateBadge = async (
  badgeDefId: number,
  request: BadgeDefinitionRequest,
): Promise<BadgeDefinition> => {
  const response = await axiosInstance.put(
    `/admin/gamification/badges/${badgeDefId}`,
    request,
  );
  return response.data;
};

export const deleteBadge = async (badgeDefId: number): Promise<void> => {
  await axiosInstance.delete(`/admin/gamification/badges/${badgeDefId}`);
};

export const awardBadgeToUser = async (
  userId: number,
  badgeKey: string,
): Promise<void> => {
  await axiosInstance.post(
    `/admin/gamification/badges/award/${userId}/${badgeKey}`,
  );
};

export const bulkAwardBadge = async (badgeKey: string): Promise<number> => {
  const response = await axiosInstance.post(
    `/admin/gamification/badges/bulk-award/${badgeKey}`,
  );
  return response.data;
};

// =============================================
// GAME MANAGEMENT
// =============================================

export const getAllGames = async (): Promise<MiniGameDefinition[]> => {
  const response = await axiosInstance.get("/admin/gamification/games");
  return response.data;
};

export const createGame = async (
  request: MiniGameDefinitionRequest,
): Promise<MiniGameDefinition> => {
  const response = await axiosInstance.post(
    "/admin/gamification/games",
    request,
  );
  return response.data;
};

export const updateGame = async (
  gameDefId: number,
  request: MiniGameDefinitionRequest,
): Promise<MiniGameDefinition> => {
  const response = await axiosInstance.put(
    `/admin/gamification/games/${gameDefId}`,
    request,
  );
  return response.data;
};

export const deleteGame = async (gameDefId: number): Promise<void> => {
  await axiosInstance.delete(`/admin/gamification/games/${gameDefId}`);
};

export const toggleGameStatus = async (
  gameDefId: number,
  active: boolean,
): Promise<MiniGameDefinition> => {
  const response = await axiosInstance.put(
    `/admin/gamification/games/${gameDefId}/toggle`,
    null,
    {
      params: { active },
    },
  );
  return response.data;
};

export const updateGameRewards = async (
  gameDefId: number,
  baseCoinReward: number,
  maxCoinReward: number,
  xpReward: number,
): Promise<MiniGameDefinition> => {
  const response = await axiosInstance.put(
    `/admin/gamification/games/${gameDefId}/rewards`,
    null,
    {
      params: { baseCoinReward, maxCoinReward, xpReward },
    },
  );
  return response.data;
};

export const updateGameCooldown = async (
  gameDefId: number,
  cooldownMinutes: number,
  maxPlaysPerDay?: number,
  maxCoinsPerDay?: number,
): Promise<MiniGameDefinition> => {
  const response = await axiosInstance.put(
    `/admin/gamification/games/${gameDefId}/cooldown`,
    null,
    {
      params: { cooldownMinutes, maxPlaysPerDay, maxCoinsPerDay },
    },
  );
  return response.data;
};

// =============================================
// COIN MANAGEMENT
// =============================================

export const adjustUserCoins = async (request: CoinAdjustmentRequest) => {
  const response = await axiosInstance.post(
    "/admin/gamification/coins/adjust",
    request,
  );
  return response.data;
};

export const giftCoins = async (
  userId: number,
  amount: number,
  reason: string,
) => {
  const response = await axiosInstance.post(
    "/admin/gamification/coins/gift",
    null,
    {
      params: { userId, amount, reason },
    },
  );
  return response.data;
};

// =============================================
// ACHIEVEMENT MANAGEMENT
// =============================================

export const recalculateAchievements = async (): Promise<number> => {
  const response = await axiosInstance.post(
    "/admin/gamification/achievements/recalculate",
  );
  return response.data;
};

// --- Export default object ---
const adminGamificationService = {
  // Dashboard
  getDashboardStats,
  getActivityTrends,
  getTopCoinEarners,
  getMostActiveUsers,
  getGameStats,
  getBadgeStats,

  // User Activity
  getAllUserActivities,
  getUserActivityTracking,

  // Leaderboard
  getLeaderboard,
  refreshLeaderboard,

  // Badges
  getAllBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  awardBadgeToUser,
  bulkAwardBadge,

  // Games
  getAllGames,
  createGame,
  updateGame,
  deleteGame,
  toggleGameStatus,
  updateGameRewards,
  updateGameCooldown,

  // Leaderboard (Full)
  getFullLeaderboard,

  // Coins
  adjustUserCoins,
  giftCoins,

  // Achievements
  recalculateAchievements,
};

export default adminGamificationService;
