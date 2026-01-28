import axiosInstance from "./axiosInstance";

// =============================================
// GAMIFICATION SERVICE - API INTEGRATION
// =============================================
// Handles all gamification-related API calls
// including mini-games, leaderboards, badges, and wallet

// --- Types ---
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
  available: boolean;
  lastPlayed: string | null;
  remainingPlaysToday: number | null;
  createdAt: string;
}

export interface GameSessionResponse {
  sessionId: number;
  userId: number;
  gameDefinition: MiniGameDefinition;
  sessionStatus: string;
  scoreAchieved: number | null;
  coinsEarned: number | null;
  xpEarned: number | null;
  isVerified: boolean;
  playedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
}

export interface StartGameRequest {
  gameKey: string;
  sessionMetadata?: string;
}

export interface CompleteGameRequest {
  sessionId: number;
  sessionStatus: "COMPLETED" | "FAILED" | "ABANDONED";
  scoreAchieved?: number;
  durationSeconds?: number;
  sessionData?: string;
  verificationData?: string;
}

export interface LeaderboardEntry {
  userId: number;
  userName: string;
  fullName?: string;
  userAvatar: string | null;
  userAvatarUrl?: string | null; // Alias for compatibility
  avatarMediaUrl?: string | null;
  rankPosition: number;
  scoreValue: number;
  totalCoins: number;
  totalXp: number;
  badgesCount: number;
  badgeCount?: number; // Alias for compatibility
  streakDays: number;
  currentStreak?: number; // Alias for compatibility
  contributionsCount: number;
  skinsCount?: number;
  isCurrentUser: boolean;
  rankChange: number;
}

export interface LeaderboardResponse {
  leaderboardPeriod: string;
  leaderboardType: string;
  currentUserPosition: LeaderboardEntry | null;
  topEntries: LeaderboardEntry[];
  totalParticipants: number;
  coinsToNextRank: number;
}

export interface UserWallet {
  walletId?: number;
  userId: number;
  totalCoins: number;
  coinBalance: number; // Alias for totalCoins
  earnedCoins: number;
  spentCoins: number;
  totalXp: number;
  streakDays: number;
  currentStreak: number; // Alias for streakDays
  longestStreak?: number; // Chuỗi học tập lâu nhất
  totalActivityMinutes?: number; // Tổng thời gian hoạt động (phút)
  totalActivityDays?: number; // Tổng số ngày hoạt động (tính từ totalActivityMinutes)
  lastActivityDate: string | null;
  updatedAt?: string;
}

export interface BadgeDefinition {
  badgeDefId: number;
  badgeKey: string;
  badgeTitle: string;
  badgeDescription: string;
  badgeIcon: string;
  badgeImageUrl?: string; // Badge image URL from Cloudinary
  badgeCategory: string;
  triggerType: string;
  triggerThreshold: number;
  coinReward: number;
  xpReward: number;
  badgeRarity: string;
  isActive: boolean;
}

export interface UserBadge {
  userBadgeId: number;
  userId: number;
  badgeDefinition: BadgeDefinition;
  earnedAt: string;
  coinsAwarded: number;
  xpAwarded: number;
}

export interface GamificationDashboard {
  wallet: UserWallet;
  recentBadges: UserBadge[];
  availableGames: MiniGameDefinition[];
  leaderboardPosition: LeaderboardEntry | null;
}

// --- API Functions ---

/**
 * Get user's gamification dashboard summary
 */
export const getDashboard = async (): Promise<GamificationDashboard> => {
  const response = await axiosInstance.get("/gamification/dashboard");
  return response.data;
};

/**
 * Get user's wallet information (from main wallet service)
 */
export const getWallet = async (): Promise<UserWallet> => {
  const response = await axiosInstance.get("/wallet/my-wallet");
  const data = response.data;

  // Calculate total activity days from minutes (1 day = 1440 minutes)
  const totalActivityMinutes = data.totalActivityMinutes || 0;
  const totalActivityDays =
    totalActivityMinutes > 0
      ? Math.floor(totalActivityMinutes / 1440) +
        (totalActivityMinutes % 1440 > 0 ? 1 : 0)
      : 0;

  // Map main wallet fields to gamification interface
  return {
    walletId: data.walletId,
    userId: data.userId,
    totalCoins: data.coinBalance || 0,
    coinBalance: data.coinBalance || 0,
    earnedCoins: data.totalCoinsEarned || 0,
    spentCoins: data.totalCoinsSpent || 0,
    totalXp: data.totalXp || 0,
    streakDays: data.currentStreak || 0,
    currentStreak: data.currentStreak || 0,
    longestStreak: data.longestStreak || 0,
    totalActivityMinutes: totalActivityMinutes,
    totalActivityDays: totalActivityDays,
    lastActivityDate: data.lastActivityDate || null,
    updatedAt: data.updatedAt,
  };
};

/**
 * Get user's coin transaction history (from main wallet service)
 */
export const getTransactions = async (page = 0, size = 20) => {
  const response = await axiosInstance.get("/wallet/transactions", {
    params: {
      page,
      size,
      type: "COIN", // Filter for coin transactions only
    },
  });
  return response.data;
};

// --- Badge APIs ---

/**
 * Get user's earned badges
 */
export const getUserBadges = async (): Promise<UserBadge[]> => {
  const response = await axiosInstance.get("/gamification/badges");
  return response.data;
};

/**
 * Get all available badge definitions
 */
export const getBadgeDefinitions = async (): Promise<BadgeDefinition[]> => {
  const response = await axiosInstance.get("/gamification/badges/definitions");
  return response.data;
};

// --- Mini Game APIs ---

/**
 * Get list of available mini-games
 */
export const getAvailableGames = async (): Promise<MiniGameDefinition[]> => {
  const response = await axiosInstance.get("/gamification/games");
  return response.data;
};

/**
 * Get specific game details
 */
export const getGame = async (gameKey: string): Promise<MiniGameDefinition> => {
  const response = await axiosInstance.get(`/gamification/games/${gameKey}`);
  return response.data;
};

/**
 * Start a new game session
 * Call this when user starts playing a game
 */
export const startGameSession = async (
  request: StartGameRequest,
): Promise<GameSessionResponse> => {
  const response = await axiosInstance.post(
    "/gamification/games/start",
    request,
  );
  return response.data;
};

/**
 * Complete a game session
 * Call this when user finishes/loses/abandons a game
 */
export const completeGameSession = async (
  request: CompleteGameRequest,
): Promise<GameSessionResponse> => {
  const response = await axiosInstance.post(
    "/gamification/games/complete",
    request,
  );
  return response.data;
};

/**
 * Get user's game history
 */
export const getGameHistory = async (
  page = 0,
  size = 20,
): Promise<GameSessionResponse[]> => {
  const response = await axiosInstance.get("/gamification/games/history", {
    params: { page, size },
  });
  return response.data;
};

// --- Leaderboard APIs ---

/**
 * Get leaderboard data
 * @param period - 'week' | 'month' | 'all'
 * @param type - 'coins' | 'learning' | 'community'
 */
export const getLeaderboard = async (
  period: string = "week",
  type: string = "coins",
  page = 0,
  size = 10,
): Promise<LeaderboardResponse> => {
  const response = await axiosInstance.get("/gamification/leaderboard", {
    params: { period, type, page, size },
  });
  return response.data;
};

/**
 * Get current user's leaderboard position
 */
export const getUserLeaderboardPosition = async (
  period: string = "week",
  type: string = "coins",
): Promise<LeaderboardEntry> => {
  const response = await axiosInstance.get(
    "/gamification/leaderboard/position",
    {
      params: { period, type },
    },
  );
  return response.data;
};

// --- Admin APIs (for admin panel) ---

export const adminCreateGame = async (
  gameData: Partial<MiniGameDefinition>,
) => {
  const response = await axiosInstance.post(
    "/admin/gamification/games",
    gameData,
  );
  return response.data;
};

export const adminUpdateGame = async (
  gameDefId: number,
  gameData: Partial<MiniGameDefinition>,
) => {
  const response = await axiosInstance.put(
    `/admin/gamification/games/${gameDefId}`,
    gameData,
  );
  return response.data;
};

export const adminDeleteGame = async (gameDefId: number) => {
  const response = await axiosInstance.delete(
    `/admin/gamification/games/${gameDefId}`,
  );
  return response.data;
};

export const adminGetAllGames = async (): Promise<MiniGameDefinition[]> => {
  const response = await axiosInstance.get("/admin/gamification/games");
  return response.data;
};

export const adminAdjustCoins = async (
  userId: number,
  coinAmount: number,
  reason: string,
) => {
  const response = await axiosInstance.post(
    "/admin/gamification/adjust-coins",
    {
      userId,
      coinAmount,
      reason,
    },
  );
  return response.data;
};

export const adminAwardBadge = async (userId: number, badgeDefId: number) => {
  const response = await axiosInstance.post("/admin/gamification/award-badge", {
    userId,
    badgeDefId,
  });
  return response.data;
};

// --- Export default object for convenience ---

/**
 * Format total activity time for display
 * @param totalMinutes - Total activity time in minutes
 * @returns Formatted string like "5 ngày 3 giờ" or "2 giờ 30 phút"
 */
export const formatTotalActivityTime = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return "0 phút";

  const days = Math.floor(totalMinutes / 1440); // 1440 minutes = 1 day
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} phút`); // Only show minutes if less than a day

  return parts.length > 0 ? parts.join(" ") : "0 phút";
};

/**
 * Calculate days from total activity minutes
 * Uses actual time spent (24 hours = 1 day of activity)
 * @param totalMinutes - Total activity time in minutes
 * @returns Number of days (can be fractional for display purposes)
 */
export const calculateActivityDays = (totalMinutes: number): number => {
  if (totalMinutes <= 0) return 0;
  return parseFloat((totalMinutes / 1440).toFixed(1));
};

const gamificationService = {
  // Dashboard
  getDashboard,
  getWallet,
  getTransactions,

  // Badges
  getUserBadges,
  getBadgeDefinitions,

  // Games
  getAvailableGames,
  getGame,
  startGameSession,
  completeGameSession,
  getGameHistory,

  // Leaderboard
  getLeaderboard,
  getUserLeaderboardPosition,

  // Admin
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame,
  adminGetAllGames,
  adminAdjustCoins,
  adminAwardBadge,
};

export default gamificationService;
