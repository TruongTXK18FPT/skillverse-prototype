import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  Trophy,
  Crown,
  Medal,
  Target,
  Users,
  Coins,
  Calendar,
  Star,
  Zap,
  TrendingUp,
  Award,
  Flame,
  BookOpen,
  CheckCircle,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import "../../styles/Gamification.css";
import MeowlGuide from "../../components/meowl/MeowlGuide";
import TicTacToeGame from "../../components/game/tic-tac-toe/TicTacToeGame";
import MeowlAdventure from "../../components/game/meowl-adventure/MeowlAdventure";
import gamificationService, {
  LeaderboardEntry,
  LeaderboardResponse,
  MiniGameDefinition,
  UserWallet,
  UserBadge,
  BadgeDefinition,
  formatTotalActivityTime,
  calculateActivityDays,
} from "../../services/gamificationService";

interface User {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  coins: number;
  xp: number;
  badges: number;
  streak: number;
  contributions: number;
  skins: number;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: any; // Changed from string to any to support components
  imageUrl?: string; // Badge image URL from backend
  category: "learning" | "community" | "events" | "coins";
  criteria: string;
  reward: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Type definitions
type Difficulty = "easy" | "medium" | "hard";
type GameType = "spin" | "quiz" | "hunt" | "help" | "game";

interface MiniGame {
  id: string;
  title: string;
  description: string;
  icon: any; // Changed from string to any
  type: GameType;
  difficulty: Difficulty;
  coins: string | number; // coins earned from the game
  cooldown: number; // in minutes
  lastPlayed?: Date;
  available: boolean;
  premium?: {
    enabled: boolean;
    title: string;
    description: string;
    coins: string | number;
    cooldown: number;
    features: string[];
    requiredPlan: "basic" | "premium" | "pro";
  };
}

// Mock badge data (kept for display since backend doesn't have full badge system yet)
const mockBadges: Badge[] = [
  {
    id: "speed-learner",
    title: "Người Học Nhanh",
    description: "Hoàn thành 5 bài học trong 1 ngày",
    icon: <Zap className="w-5 h-5 text-yellow-500" />,
    category: "learning",
    criteria: "Hoàn thành 5 bài học trong 1 ngày",
    reward: 50,
    unlocked: true,
    rarity: "common",
  },
  {
    id: "quiz-master",
    title: "Thầy Quiz",
    description: "Đạt 100% trong 3 bài kiểm tra",
    icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
    category: "learning",
    criteria: "Đạt 100% trong 3 bài kiểm tra",
    reward: 100,
    unlocked: true,
    rarity: "rare",
  },
  {
    id: "inspiring-peer",
    title: "Người Truyền Cảm Hứng",
    description: "Nhận 10 phản hồi tích cực",
    icon: <Users className="w-5 h-5 text-blue-500" />,
    category: "community",
    criteria: "Nhận 10 phản hồi tích cực",
    reward: 30,
    unlocked: false,
    progress: 7,
    maxProgress: 10,
    rarity: "common",
  },
  {
    id: "coin-collector",
    title: "Thợ Sưu Tầm Xu",
    description: "Kiếm được tổng cộng 1,000 xu",
    icon: <Coins className="w-5 h-5 text-yellow-500" />,
    category: "coins",
    criteria: "Kiếm được tổng cộng 1,000 xu",
    reward: 200,
    unlocked: true,
    rarity: "epic",
  },
  {
    id: "weekly-champion",
    title: "Nhà Vô Địch Tuần",
    description: "Đứng đầu bảng xếp hạng tuần",
    icon: <Trophy className="w-5 h-5 text-purple-500" />,
    category: "coins",
    criteria: "Đứng đầu bảng xếp hạng tuần",
    reward: 150,
    unlocked: false,
    rarity: "legendary",
  },
  {
    id: "streak-warrior",
    title: "Chiến Binh Chuỗi",
    description: "Duy trì chuỗi học tập 30 ngày",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    category: "learning",
    criteria: "Duy trì chuỗi học tập 30 ngày",
    reward: 300,
    unlocked: false,
    progress: 15,
    maxProgress: 30,
    rarity: "epic",
  },
  {
    id: "helper-hero",
    title: "Anh Hùng Hỗ Trợ",
    description: "Giúp đỡ 50 thành viên khác",
    icon: <Target className="w-5 h-5 text-red-500" />,
    category: "community",
    criteria: "Giúp đỡ 50 thành viên khác",
    reward: 250,
    unlocked: false,
    progress: 23,
    maxProgress: 50,
    rarity: "rare",
  },
  {
    id: "event-enthusiast",
    title: "Người Đam Mê Sự Kiện",
    description: "Tham gia 10 sự kiện SkillVerse",
    icon: <Calendar className="w-5 h-5 text-green-500" />,
    category: "events",
    criteria: "Tham gia 10 sự kiện SkillVerse",
    reward: 180,
    unlocked: false,
    progress: 6,
    maxProgress: 10,
    rarity: "rare",
  },
];

const Gamification: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // State Management
  const [activeTab, setActiveTab] = useState<
    "leaderboard" | "badges" | "games" | "achievements"
  >("leaderboard");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<
    "week" | "month" | "all"
  >("week");
  const [leaderboardType, setLeaderboardType] = useState<
    "learning" | "community" | "coins" | "streak" | "skins"
  >("coins");
  const [selectedBadgeCategory, setSelectedBadgeCategory] =
    useState<string>("all");

  // User Premium Status
  const [userPremium] = useState<"free" | "basic" | "premium" | "pro">("free"); // Mock user status

  // Mini Games State
  const [selectedGameMode, setSelectedGameMode] = useState<"free" | "premium">(
    "free",
  );
  const [activeGame, setActiveGame] = useState<
    "tic-tac-toe" | "meowl-adventure" | null
  >(null);

  // API Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<User[]>([]);
  const [miniGames, setMiniGames] = useState<MiniGame[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  // Convert API data to display format
  const convertLeaderboardEntry = (
    entry: LeaderboardEntry,
    rank: number,
    currentType: string,
  ): User => {
    // Map scoreValue to appropriate field based on leaderboard type
    let scoreMapping = {
      coins: entry.totalCoins,
      xp: entry.totalXp,
      streak: entry.scoreValue || entry.streakDays || 0, // scoreValue is longest streak
      contributions: entry.contributionsCount || 0,
      skins: entry.skinsCount || 0,
    };

    return {
      id: entry.userId?.toString() || "",
      name: entry.fullName || entry.userName || "Unknown",
      avatar:
        entry.avatarMediaUrl ||
        entry.userAvatar ||
        entry.userAvatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.fullName || entry.userName || "User")}&background=random`,
      rank: entry.rankPosition || rank,
      coins: scoreMapping.coins,
      xp: scoreMapping.xp,
      badges: entry.badgesCount || entry.badgeCount || 0,
      streak: scoreMapping.streak,
      contributions: scoreMapping.contributions,
      skins: scoreMapping.skins,
    };
  };

  const convertUserBadgeToBadge = (userBadge: UserBadge): Badge => {
    const badgeDef = userBadge.badgeDefinition;
    const categoryMap: Record<
      string,
      "learning" | "community" | "events" | "coins"
    > = {
      learning: "learning",
      community: "community",
      event: "events",
      events: "events",
      coin: "coins",
      coins: "coins",
    };
    const rarityMap: Record<string, "common" | "rare" | "epic" | "legendary"> =
      {
        common: "common",
        rare: "rare",
        epic: "epic",
        legendary: "legendary",
      };

    return {
      id: badgeDef.badgeKey,
      title: badgeDef.badgeTitle,
      description: badgeDef.badgeDescription,
      icon: badgeDef.badgeIcon,
      imageUrl: badgeDef.badgeImageUrl,
      category:
        categoryMap[badgeDef.badgeCategory?.toLowerCase()] || "learning",
      criteria: `${badgeDef.triggerType}: ${badgeDef.triggerThreshold}`,
      reward: badgeDef.coinReward,
      unlocked: true, // User already has this badge
      progress: badgeDef.triggerThreshold,
      maxProgress: badgeDef.triggerThreshold,
      rarity: rarityMap[badgeDef.badgeRarity?.toLowerCase()] || "common",
    };
  };

  const convertBadgeDefinitionToBadge = (
    badgeDef: BadgeDefinition,
    unlocked: boolean = false,
  ): Badge => {
    const categoryMap: Record<
      string,
      "learning" | "community" | "events" | "coins"
    > = {
      learning: "learning",
      community: "community",
      event: "events",
      events: "events",
      coin: "coins",
      coins: "coins",
    };
    const rarityMap: Record<string, "common" | "rare" | "epic" | "legendary"> =
      {
        common: "common",
        rare: "rare",
        epic: "epic",
        legendary: "legendary",
      };

    return {
      id: badgeDef.badgeKey,
      title: badgeDef.badgeTitle,
      description: badgeDef.badgeDescription,
      icon: badgeDef.badgeIcon,
      imageUrl: badgeDef.badgeImageUrl,
      category:
        categoryMap[badgeDef.badgeCategory?.toLowerCase()] || "learning",
      criteria: `${badgeDef.triggerType}: ${badgeDef.triggerThreshold}`,
      reward: badgeDef.coinReward,
      unlocked: unlocked,
      progress: unlocked ? badgeDef.triggerThreshold : 0,
      maxProgress: badgeDef.triggerThreshold,
      rarity: rarityMap[badgeDef.badgeRarity?.toLowerCase()] || "common",
    };
  };

  // Handle coins earned from games
  const handleCoinsEarned = (coins: number) => {
    console.log(`Coins earned from game: ${coins}`);
    // Refresh wallet data
    gamificationService
      .getWallet()
      .then((wallet) => {
        setUserWallet(wallet);
        console.log("Wallet updated after game:", wallet);
      })
      .catch((err) => console.error("Failed to refresh wallet:", err));
  };

  const convertGameDefinition = (game: MiniGameDefinition): MiniGame => {
    const gameIcons: Record<string, any> = {
      "meowl-adventure": <Target className="w-5 h-5 text-indigo-500" />,
      "tic-tac-toe": <Crown className="w-5 h-5 text-yellow-500" />,
      quiz: <BookOpen className="w-5 h-5 text-green-500" />,
      spin: <Flame className="w-5 h-5 text-red-500" />,
    };
    const gameTypes: Record<string, GameType> = {
      "meowl-adventure": "hunt",
      "tic-tac-toe": "game",
      quiz: "quiz",
      spin: "spin",
    };
    const difficultyMap: Record<string, Difficulty> = {
      EASY: "easy",
      MEDIUM: "medium",
      HARD: "hard",
      easy: "easy",
      medium: "medium",
      hard: "hard",
    };

    return {
      id: game.gameKey,
      title: game.gameTitle,
      description: game.gameDescription,
      icon: game.gameIcon || gameIcons[game.gameKey] || (
        <Trophy className="w-5 h-5 text-gray-500" />
      ),
      type: gameTypes[game.gameKey] || "game",
      difficulty: difficultyMap[game.difficultyLevel] || "medium",
      coins: game.maxCoinReward,
      cooldown: game.cooldownMinutes,
      available: game.isActive && !game.isPremiumOnly,
      premium: game.isPremiumOnly
        ? {
            enabled: true,
            title: `${game.gameTitle} Pro`,
            description: "Chế độ nâng cao với phần thưởng lớn hơn",
            coins: Math.floor(
              game.maxCoinReward * (game.premiumCoinMultiplier || 2),
            ),
            cooldown: Math.floor(game.cooldownMinutes / 2),
            features: ["Xu thưởng cao hơn", "Thời gian chờ ngắn hơn"],
            requiredPlan:
              (game.requiredPremiumPlan as "basic" | "premium" | "pro") ||
              "premium",
          }
        : undefined,
    };
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // If user is not authenticated, only fetch public data (leaderboard and badge definitions)
        if (!isAuthenticated) {
          const [leaderboardResponse, badgeDefinitionsResponse] =
            await Promise.all([
              gamificationService
                .getLeaderboard(
                  leaderboardPeriod === "all" ? "all_time" : leaderboardPeriod,
                  leaderboardType,
                  0,
                  100,
                )
                .catch((err) => {
                  console.error("Leaderboard API error:", err);
                  return null;
                }),
              gamificationService.getBadgeDefinitions().catch((err) => {
                console.error("Badge definitions API error:", err);
                return null;
              }),
            ]);

          // Process leaderboard data for non-authenticated users
          const leaderboardEntries =
            leaderboardResponse?.topEntries ||
            (Array.isArray(leaderboardResponse) ? leaderboardResponse : []);

          if (leaderboardEntries.length > 0) {
            const convertedLeaderboard = leaderboardEntries.map(
              (entry: LeaderboardEntry, index: number) =>
                convertLeaderboardEntry(entry, index + 1, leaderboardType),
            );
            setLeaderboardData(convertedLeaderboard);
          } else {
            setLeaderboardData([]);
          }

          // Process badge definitions for non-authenticated users (all locked)
          if (badgeDefinitionsResponse && badgeDefinitionsResponse.length > 0) {
            const allBadges = badgeDefinitionsResponse
              .filter((def: BadgeDefinition) => def.isActive)
              .map((def: BadgeDefinition) =>
                convertBadgeDefinitionToBadge(def, false),
              ); // All locked for non-auth users
            setBadges(allBadges);
          } else {
            setBadges([]);
          }

          // Set empty states for authenticated-only data
          setMiniGames([]);
          setUserWallet(null);
          setLoading(false);
          return;
        }

        // For authenticated users, fetch all data
        const [
          leaderboardResponse,
          gamesResponse,
          walletResponse,
          badgesResponse,
          badgeDefinitionsResponse,
        ] = await Promise.all([
          gamificationService
            .getLeaderboard(
              leaderboardPeriod === "all" ? "all_time" : leaderboardPeriod,
              leaderboardType,
              0,
              100, // Get top 100 users
            )
            .catch((err) => {
              console.error(
                "Leaderboard API error:",
                err?.response?.data || err?.message || err,
              );
              console.error("Full error object:", err);
              return null;
            }),
          gamificationService.getAvailableGames().catch((err) => {
            console.error("Games API error:", err);
            return null;
          }),
          gamificationService.getWallet().catch((err) => {
            console.error("Wallet API error:", err);
            return null;
          }),
          gamificationService.getUserBadges().catch((err) => {
            console.error("Badges API error:", err);
            return null;
          }),
          gamificationService.getBadgeDefinitions().catch((err) => {
            console.error("Badge definitions API error:", err);
            return null;
          }),
        ]);

        // Process leaderboard data - API returns LeaderboardResponse object with topEntries array
        console.log("Leaderboard API Response:", leaderboardResponse);
        const leaderboardEntries =
          leaderboardResponse?.topEntries ||
          (Array.isArray(leaderboardResponse) ? leaderboardResponse : []);
        console.log("Leaderboard Entries:", leaderboardEntries);
        if (leaderboardEntries.length > 0) {
          let convertedLeaderboard = leaderboardEntries.map(
            (entry: LeaderboardEntry, index: number) =>
              convertLeaderboardEntry(entry, index + 1, leaderboardType),
          );

          // Backend already sorted correctly, no need to re-sort
          // Just ensure ranks are sequential
          convertedLeaderboard = convertedLeaderboard.map((user, index) => ({
            ...user,
            rank: index + 1,
          }));

          // Add current user from response or wallet if not in leaderboard
          if (leaderboardResponse?.currentUserPosition) {
            const currentUserEntry = convertLeaderboardEntry(
              leaderboardResponse.currentUserPosition,
              leaderboardResponse.currentUserPosition.rankPosition,
              leaderboardType,
            );
            currentUserEntry.id = "current";
            currentUserEntry.name = "Bạn";
            if (!convertedLeaderboard.find((u) => u.id === "current")) {
              convertedLeaderboard.push(currentUserEntry);
            }
          } else if (walletResponse) {
            convertedLeaderboard.push({
              id: "current",
              name: "Bạn",
              avatar: `https://ui-avatars.com/api/?name=You&background=6366f1&color=fff`,
              rank: convertedLeaderboard.length + 1,
              coins: walletResponse.coinBalance,
              xp: walletResponse.totalXp,
              badges: 0,
              streak: walletResponse.currentStreak,
              contributions: 0,
              skins: 0,
            });
          }
          setLeaderboardData(convertedLeaderboard);
        } else {
          // No leaderboard data - show empty state
          console.warn("No leaderboard data received from API");
          setLeaderboardData([]);
        }

        // Process games data
        console.log("Games API Response:", gamesResponse);
        if (gamesResponse && gamesResponse.length > 0) {
          const convertedGames = gamesResponse.map(convertGameDefinition);
          console.log("Converted Games:", convertedGames);
          setMiniGames(convertedGames);
        } else {
          // No games data - show empty state
          console.warn("No games data received from API");
          setMiniGames([]);
        }

        // Process wallet data
        console.log("Wallet API Response:", walletResponse);
        if (walletResponse) {
          setUserWallet(walletResponse);
        }

        // Process badges data - merge earned badges with all definitions
        console.log("Badges API Response:", badgesResponse);
        console.log(
          "Badge Definitions API Response:",
          badgeDefinitionsResponse,
        );
        if (badgeDefinitionsResponse && badgeDefinitionsResponse.length > 0) {
          const earnedBadgeKeys = new Set(
            badgesResponse?.map(
              (ub: UserBadge) => ub.badgeDefinition.badgeKey,
            ) || [],
          );

          // Convert all badge definitions, marking earned ones as unlocked
          const allBadges = badgeDefinitionsResponse
            .filter((def: BadgeDefinition) => def.isActive)
            .map((def: BadgeDefinition) =>
              convertBadgeDefinitionToBadge(
                def,
                earnedBadgeKeys.has(def.badgeKey),
              ),
            );

          setBadges(allBadges);
        } else if (badgesResponse && badgesResponse.length > 0) {
          // Fallback: only show earned badges if definitions fetch fails
          const convertedBadges = badgesResponse.map(convertUserBadgeToBadge);
          setBadges(convertedBadges);
        } else {
          // No badges data - show empty state
          console.warn("No badges data received from API");
          setBadges([]);
        }
      } catch (err) {
        console.error("Error fetching gamification data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        // Show empty states on error
        setLeaderboardData([]);
        setMiniGames([]);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    // Wait for auth to complete before fetching data
    if (!authLoading) {
      fetchData();
    }
  }, [leaderboardPeriod, leaderboardType, isAuthenticated, authLoading]);

  const [currentUserData, setCurrentUserData] = useState<User | null>({
    id: "user-1",
    name: "Bạn",
    avatar: "https://ui-avatars.com/api/?name=You&background=random",
    rank: 0,
    coins: 0,
    xp: 0,
    badges: 0,
    streak: 0,
    contributions: 0,
    skins: 0,
  });

  useEffect(() => {
    if (leaderboardData.length > 0) {
      const found = leaderboardData.find((user) => user.id === "current");
      if (found) {
        setCurrentUserData(found);
      }
    }
  }, [leaderboardData]);

  const currentUser = currentUserData;
  const currentUserRank = currentUser?.rank ?? 12;
  const coinsToNextRank =
    currentUserRank > 1
      ? (leaderboardData.find((user) => user.rank === currentUserRank - 1)
          ?.coins ?? 0) - (currentUser?.coins ?? 0)
      : 0;

  // Filter badges by category
  const filteredBadges =
    selectedBadgeCategory === "all"
      ? badges
      : badges.filter((badge) => badge.category === selectedBadgeCategory);

  // Helper functions for better readability
  const getRankIcon = (rank: number) => {
    if (rank === 1) return "👑";
    if (rank === 2) return "🥈";
    return "🥉";
  };

  const getCooldownText = (cooldown: number) => {
    if (cooldown >= 1440) return `${Math.floor(cooldown / 1440)} ngày`;
    if (cooldown >= 60) return `${Math.floor(cooldown / 60)} giờ`;
    return `${cooldown} phút`;
  };

  const getDifficultyText = (difficulty: "easy" | "medium" | "hard") => {
    if (difficulty === "easy") return "Dễ";
    if (difficulty === "medium") return "Trung bình";
    return "Khó";
  };

  const getDifficultyStars = (difficulty: "easy" | "medium" | "hard") => {
    if (difficulty === "easy") return "⭐";
    if (difficulty === "medium") return "⭐⭐";
    return "⭐⭐⭐";
  };

  const canAccessPremium = (requiredPlan: "basic" | "premium" | "pro") => {
    const planHierarchy = { free: 0, basic: 1, premium: 2, pro: 3 };
    return planHierarchy[userPremium] >= planHierarchy[requiredPlan];
  };

  // Render Methods
  const renderLeaderboard = () => (
    <div className="leaderboard-content">
      <div className="leaderboard-header">
        <h2>🏆 Bảng Xếp Hạng</h2>
        <p>Cạnh tranh lành mạnh và thể hiện tiến bộ học tập</p>
      </div>

      {/* Period Filters */}
      <div className="leaderboard-filters">
        <div className="period-filters">
          {[
            { key: "week", label: "Tuần này" },
            { key: "month", label: "Tháng này" },
            { key: "all", label: "Tất cả" },
          ].map((period) => (
            <button
              key={period.key}
              className={`filter-btn ${leaderboardPeriod === period.key ? "active" : ""}`}
              onClick={() =>
                setLeaderboardPeriod(period.key as "week" | "month" | "all")
              }
            >
              {period.label}
            </button>
          ))}
        </div>

        <div className="type-filters">
          {[
            { key: "coins", label: "Xu kiếm được", icon: Coins },
            { key: "learning", label: "Tiến độ học tập", icon: BookOpen },
            { key: "streak", label: "Chuỗi học lâu nhất", icon: Flame },
            { key: "community", label: "Đóng góp cộng đồng", icon: Users },
            { key: "skins", label: "Bộ sưu tập", icon: ShoppingBag },
          ].map((type) => (
            <button
              key={type.key}
              className={`type-btn ${leaderboardType === type.key ? "active" : ""}`}
              onClick={() =>
                setLeaderboardType(
                  type.key as "learning" | "community" | "coins" | "streak",
                )
              }
            >
              <type.icon className="type-icon" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Position */}
      {currentUser && (
        <div className="current-user-position">
          <div className="position-info">
            <div className="rank-badge">
              <span className="rank-number">#{currentUserRank}</span>
            </div>
            <div className="user-details">
              <h3>Vị trí của bạn</h3>
              <p>
                {coinsToNextRank > 0
                  ? `Chỉ cần ${coinsToNextRank} xu nữa để lên Top ${currentUserRank - 1}!`
                  : "Bạn đang dẫn đầu!"}
              </p>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width:
                  coinsToNextRank > 0
                    ? `${Math.max(0, 100 - (coinsToNextRank / (currentUser.coins + coinsToNextRank)) * 100)}%`
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {loading ? (
          <div className="empty-state">
            <Loader2 className="spin" size={48} />
            <p>Đang tải bảng xếp hạng...</p>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="empty-state">
            <Trophy size={48} style={{ opacity: 0.3 }} />
            <p>Chưa có dữ liệu bảng xếp hạng</p>
            <small>Cách tạo dữ liệu bảng xếp hạng:</small>
            <small style={{ marginTop: "0.5rem", color: "#ffaa00" }}>
              1. Chơi mini games (Tic-Tac-Toe hoặc Meowl Adventure) để kiếm xu
            </small>
            <small style={{ color: "#ffaa00" }}>
              2. Wallet sẽ tự động được tạo và cập nhật
            </small>
            <small style={{ color: "#ffaa00" }}>
              3. Bảng xếp hạng sẽ tự động hiển thị dữ liệu từ wallet
            </small>
            <small style={{ marginTop: "0.5rem", opacity: 0.7 }}>
              Nếu vẫn không hiển thị, kiểm tra console log để xem lỗi API.
            </small>
          </div>
        ) : (
          leaderboardData.map((user) => (
            <div
              key={user.id}
              className={`leaderboard-item ${user.id === "current" ? "current-user" : ""}`}
            >
              <div className="rank-section">
                {user.rank <= 3 ? (
                  <div className={`crown crown-${user.rank}`}>
                    {getRankIcon(user.rank)}
                  </div>
                ) : (
                  <span className="rank-number">#{user.rank}</span>
                )}
              </div>

              <div className="user-info">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="user-avatar"
                />
                <div className="user-details">
                  <h4 className="user-name">{user.name}</h4>
                  <div className="user-stats">
                    <span className="stat coin">
                      <Coins />
                      <span style={{ color: "#ffff00" }}>
                        {user.coins.toLocaleString()}
                      </span>
                    </span>
                    <span className="stat medal">
                      <Medal />
                      <span style={{ color: "#ff8800" }}>{user.badges}</span>
                    </span>
                    <span className="stat flame">
                      <Flame />
                      <span style={{ color: "#ff0088" }}>{user.streak}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-score">
                <span className="score-value">
                  {leaderboardType === "coins" &&
                    `${user.coins.toLocaleString()} xu`}
                  {leaderboardType === "learning" &&
                    `${user.xp.toLocaleString()} XP`}
                  {leaderboardType === "streak" && `${user.streak} ngày`}
                  {leaderboardType === "community" &&
                    `${user.contributions} đóng góp`}
                  {leaderboardType === "skins" && `${user.skins} trang phục`}
                </span>
                {user.rank <= 3 && (
                  <span className="trending-up">
                    <TrendingUp className="trending-icon" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderBadges = () => (
    <div className="badges-content">
      <div className="badges-header">
        <h2>🏅 Huy Hiệu & Thành Tựu</h2>
        <p>Thu thập huy hiệu để thể hiện thành tựu và kiếm xu thưởng</p>
      </div>

      {/* Badge Categories */}
      <div className="badge-filters">
        {[
          { key: "all", label: "Tất cả", icon: Star },
          { key: "learning", label: "Học tập", icon: BookOpen },
          { key: "community", label: "Cộng đồng", icon: Users },
          { key: "events", label: "Sự kiện", icon: Calendar },
          { key: "coins", label: "Xu", icon: Coins },
        ].map((category) => (
          <button
            key={category.key}
            className={`category-btn ${selectedBadgeCategory === category.key ? "active" : ""}`}
            onClick={() => setSelectedBadgeCategory(category.key)}
          >
            <category.icon className="category-icon" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="badges-grid">
        {loading ? (
          <div className="empty-state">
            <Loader2 className="spin" size={48} />
            <p>Đang tải huy hiệu...</p>
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="empty-state">
            <Award size={48} style={{ opacity: 0.3 }} />
            <p>Chưa có huy hiệu nào</p>
            <small>Hoàn thành các thử thách để nhận huy hiệu!</small>
          </div>
        ) : (
          filteredBadges.map((badge) => (
            <div
              key={badge.id}
              className={`badge-card ${badge.unlocked ? "unlocked" : "locked"} rarity-${badge.rarity}`}
            >
              <div className="badge-header">
                <div className="badge-icon" data-category={badge.category}>
                  {badge.imageUrl ? (
                    <img
                      src={badge.imageUrl}
                      alt={badge.title}
                      className="badge-image"
                      style={{
                        width: "48px",
                        height: "48px",
                        objectFit: "contain",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    badge.icon
                  )}
                </div>
                {badge.unlocked && (
                  <div className="unlock-indicator">
                    <CheckCircle className="unlock-icon" />
                  </div>
                )}
              </div>

              <div className="badge-content">
                <h3 className="badge-title">{badge.title}</h3>
                <p className="badge-description">{badge.description}</p>
                <p className="badge-criteria">{badge.criteria}</p>

                {!badge.unlocked && badge.progress !== undefined && (
                  <div className="badge-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${((badge.progress ?? 0) / (badge.maxProgress ?? 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {badge.progress}/{badge.maxProgress}
                    </span>
                  </div>
                )}

                <div className="badge-reward">
                  <Coins className="reward-icon" />
                  <span>+{badge.reward} xu</span>
                </div>
              </div>

              <div className={`rarity-indicator rarity-${badge.rarity}`}>
                {badge.rarity === "common" && "⚪"}
                {badge.rarity === "rare" && "🟢"}
                {badge.rarity === "epic" && "🟣"}
                {badge.rarity === "legendary" && "🟡"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMiniGames = () => {
    // Check authentication for minigames tab
    if (!isAuthenticated) {
      return (
        <div className="minigames-auth-required">
          <div className="minigames-auth-card">
            <div className="minigames-auth-icon">
              <Trophy size={64} />
              <div className="minigames-auth-lock">🔒</div>
            </div>
            <h2 className="minigames-auth-title">
              Đăng nhập để chơi Mini Games
            </h2>
            <p className="minigames-auth-description">
              Bạn cần đăng nhập để có thể chơi mini games, kiếm xu và nhận phần
              thưởng hấp dẫn!
            </p>
            <div className="minigames-auth-features">
              <div className="minigames-auth-feature">
                <Coins size={20} />
                <span>Kiếm xu miễn phí</span>
              </div>
              <div className="minigames-auth-feature">
                <Star size={20} />
                <span>Nhận huy hiệu đặc biệt</span>
              </div>
              <div className="minigames-auth-feature">
                <Flame size={20} />
                <span>Duy trì chuỗi ngày</span>
              </div>
            </div>
            <button
              className="minigames-auth-login-btn"
              onClick={() => navigate("/login")}
            >
              <span>Đăng nhập ngay</span>
              <span className="minigames-auth-arrow">→</span>
            </button>
            <button
              className="minigames-auth-register-btn"
              onClick={() => navigate("/choose-role")}
            >
              Chưa có tài khoản? Đăng ký
            </button>
          </div>
        </div>
      );
    }

    // Render games for authenticated users
    return (
      <div className="mini-games-section">
        <div className="mini-games-header">
          <h2>🎮 Mini Games</h2>
          <p>Chơi game vui vẻ để kiếm xu và duy trì động lực học tập</p>

          {/* Premium Status Banner */}
          {/* <div className="premium-status-banner">
          <div className="current-plan">
            <span className={`plan-badge ${userPremium}`}>
              {userPremium === 'free' && '🆓 Miễn phí'}
              {userPremium === 'basic' && '⭐ Basic'}
              {userPremium === 'premium' && '💎 Premium'}
              {userPremium === 'pro' && '👑 Pro'}
            </span>
            {userPremium === 'free' && (
              <button 
                className="upgrade-btn"
                onClick={() => navigate('/premium')}
              >
                🚀 Nâng cấp Premium
              </button>
            )}
          </div>
        </div> */}

          {/* Game Mode Toggle */}
          <div className="game-mode-toggle">
            <button
              className={`mode-btn ${selectedGameMode === "free" ? "active" : ""}`}
              onClick={() => setSelectedGameMode("free")}
            >
              🆓 Miễn phí
            </button>
            <button
              className={`mode-btn ${selectedGameMode === "premium" ? "active" : ""}`}
              onClick={() => setSelectedGameMode("premium")}
            >
              💎 Premium
            </button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="games-grid">
          {loading ? (
            <div className="empty-state">
              <Loader2 className="spin" size={48} />
              <p>Đang tải mini games...</p>
            </div>
          ) : miniGames.length === 0 ? (
            <div className="empty-state">
              <Target size={48} style={{ opacity: 0.3 }} />
              <p>Chưa có game nào</p>
              <small>Vui lòng quay lại sau!</small>
            </div>
          ) : (
            miniGames.map((game) => {
              const isPremiumMode = selectedGameMode === "premium";
              const isLocked =
                isPremiumMode &&
                game.premium &&
                !canAccessPremium(game.premium.requiredPlan);

              return (
                <div
                  key={`${game.id}-${selectedGameMode}`}
                  className={`game-card ${game.type}-game ${!game.available ? "unavailable" : ""} ${isPremiumMode ? "premium-mode" : ""} ${isLocked ? "locked" : ""}`}
                >
                  {/* Game Status & Premium Badge */}
                  <div className="game-status-row">
                    <div
                      className={`game-status ${game.available ? "available" : "unavailable"}`}
                    >
                      {game.available ? "Có sẵn" : "Không có sẵn"}
                    </div>
                    {/* {isPremiumMode && (
                  <div className={`premium-badge ${isLocked ? 'locked' : 'unlocked'}`}>
                    {isLocked ? '🔒 Cần Premium' : '💎 Premium'}
                  </div>
                )} */}
                  </div>

                  {/* Game Header */}
                  <div className="game-header">
                    <div className="game-icon">{game.icon}</div>
                    <div className="game-info">
                      <h3>
                        {isPremiumMode && game.premium
                          ? game.premium.title
                          : game.title}
                      </h3>
                      <p>
                        {isPremiumMode && game.premium
                          ? game.premium.description
                          : game.description}
                      </p>
                    </div>
                    <div className="game-difficulty">
                      {getDifficultyText(game.difficulty)}
                    </div>
                  </div>

                  {/* Premium Features */}
                  {/* {isPremiumMode && game.premium && (
                <div className="premium-features">
                  <h4>✨ Tính năng Premium:</h4>
                  <ul>
                    {game.premium.features.map((feature, index) => (
                      <li key={`${game.id}-feature-${index}`}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )} */}

                  {/* Game Stats */}
                  <div className="game-stats">
                    <div className="game-stat">
                      <div className="game-stat-value">
                        {isPremiumMode && game.premium
                          ? game.premium.coins
                          : game.coins}
                      </div>
                      <div className="game-stat-label">Xu tối đa</div>
                    </div>
                    <div className="game-stat">
                      <div className="game-stat-value">
                        {getCooldownText(
                          isPremiumMode && game.premium
                            ? game.premium.cooldown
                            : game.cooldown,
                        )}
                      </div>
                      <div className="game-stat-label">Thời gian chờ</div>
                    </div>
                    <div className="game-stat">
                      <div className="game-stat-value">
                        {getDifficultyStars(game.difficulty)}
                      </div>
                      <div className="game-stat-label">Độ khó</div>
                    </div>
                  </div>

                  {/* Game Actions */}
                  <div className="game-actions">
                    {isLocked ? (
                      <>
                        <button className="game-btn locked" disabled>
                          🔒 Cần {game.premium?.requiredPlan}
                        </button>
                        <button
                          className="game-btn upgrade"
                          onClick={() => navigate("/premium")}
                        >
                          🚀 Nâng cấp ngay
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`game-btn primary ${!game.available ? "disabled" : ""}`}
                          onClick={() => {
                            if (game.available) {
                              if (game.id === "meowl-adventure")
                                setActiveGame("meowl-adventure");
                              if (game.id === "tic-tac-toe")
                                setActiveGame("tic-tac-toe");
                            }
                          }}
                          disabled={!game.available}
                        >
                          {game.available ? "Chơi ngay" : "Chờ làm mới"}
                        </button>
                        <button className="game-btn secondary">
                          Xem quy tắc
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Game Components - Rendered inline */}
        {activeGame === "tic-tac-toe" && (
          <TicTacToeGame
            onCoinsEarned={handleCoinsEarned}
            onClose={() => setActiveGame(null)}
          />
        )}

        {activeGame === "meowl-adventure" && (
          <MeowlAdventure
            onCoinsEarned={handleCoinsEarned}
            onClose={() => setActiveGame(null)}
          />
        )}
      </div>
    );
  };

  const renderAchievements = () => (
    <div className="achievements-section">
      <div className="achievements-header">
        <h2>🎯 Tổng Quan Thành Tựu</h2>
        <p>Theo dõi tiến độ tổng thể và mục tiêu cá nhân</p>
      </div>

      {/* Stats Cards */}
      <div className="achievements-summary">
        <div className="summary-card" data-type="completed">
          <div className="summary-icon">
            <Trophy />
          </div>
          <div className="summary-value">
            {badges.filter((b) => b.unlocked).length}
          </div>
          <div className="summary-label">Huy hiệu đã mở</div>
        </div>

        <div className="summary-card" data-type="points">
          <div className="summary-icon">
            <Coins />
          </div>
          <div className="summary-value">
            {userWallet?.coinBalance.toLocaleString() ??
              currentUser?.coins.toLocaleString() ??
              "0"}
          </div>
          <div className="summary-label">Tổng xu kiếm được</div>
        </div>

        <div className="summary-card" data-type="total">
          <div className="summary-icon">
            <Flame />
          </div>
          <div className="summary-value">
            {userWallet?.currentStreak ?? currentUser?.streak ?? 0}
          </div>
          <div className="summary-label">Chuỗi học tập hiện tại</div>
        </div>

        <div className="summary-card" data-type="rare">
          <div className="summary-icon">
            <Crown />
          </div>
          <div className="summary-value">#{currentUserRank}</div>
          <div className="summary-label">Xếp hạng hiện tại</div>
        </div>
      </div>

      {/* Activity Stats - Detailed */}
      <div className="activity-stats-section">
        <h3>📊 Thống Kê Hoạt Động Chi Tiết</h3>
        <div className="activity-stats-grid">
          {/* Longest Streak */}
          <div className="activity-stat-card" data-type="streak">
            <div className="activity-stat-icon">🔥</div>
            <div className="activity-stat-content">
              <span className="activity-stat-value">
                {userWallet?.longestStreak ?? 0} ngày
              </span>
              <span className="activity-stat-label">
                Chuỗi học tập lâu nhất
              </span>
            </div>
          </div>

          {/* Total Activity Time */}
          <div className="activity-stat-card" data-type="time">
            <div className="activity-stat-icon">⏱️</div>
            <div className="activity-stat-content">
              <span className="activity-stat-value">
                {formatTotalActivityTime(userWallet?.totalActivityMinutes ?? 0)}
              </span>
              <span className="activity-stat-label">
                Tổng thời gian hoạt động
              </span>
            </div>
          </div>

          {/* Activity Days from Time */}
          <div className="activity-stat-card" data-type="days">
            <div className="activity-stat-icon">📅</div>
            <div className="activity-stat-content">
              <span className="activity-stat-value">
                {calculateActivityDays(userWallet?.totalActivityMinutes ?? 0)}{" "}
                ngày
              </span>
              <span className="activity-stat-label">
                Quy đổi từ thời gian học
              </span>
              <span className="activity-stat-hint">
                ({userWallet?.totalActivityMinutes ?? 0} phút ÷ 1440 = ngày)
              </span>
            </div>
          </div>

          {/* Total XP */}
          <div className="activity-stat-card" data-type="xp">
            <div className="activity-stat-icon">⭐</div>
            <div className="activity-stat-content">
              <span className="activity-stat-value">
                {(userWallet?.totalXp ?? 0).toLocaleString()} XP
              </span>
              <span className="activity-stat-label">Tổng kinh nghiệm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="recent-achievements">
        <h3>Thành Tựu Gần Đây</h3>
        <div className="recent-list">
          {badges
            .filter((b) => b.unlocked)
            .slice(0, 3)
            .map((badge) => (
              <div key={badge.id} className="recent-item">
                <div
                  className="achievement-icon-wrapper"
                  data-type={badge.category}
                >
                  {badge.imageUrl ? (
                    <img
                      src={badge.imageUrl}
                      alt={badge.title}
                      className="achievement-badge-image"
                      style={{
                        width: "32px",
                        height: "32px",
                        objectFit: "contain",
                        borderRadius: "6px",
                      }}
                    />
                  ) : (
                    badge.icon
                  )}
                </div>
                <div className="achievement-content">
                  <h4>{badge.title}</h4>
                  <p>
                    +{badge.reward} xu • {badge.description}
                  </p>
                </div>
                <div className="achievement-time">Hôm nay</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="gami-wrapper">
      <div className="gami-container">
        {/* Loading State */}
        {loading && (
          <div className="gami-loading">
            <Loader2 className="gami-loading-spinner" />
            <span>Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="gami-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Header */}
        <div className="gami-header">
          <div className="gami-header-content">
            <div className="gami-title-section">
              <h1>🎮 Trung Tâm Trò Chơi</h1>
              <p>
                Học tập thông qua trò chơi, cạnh tranh lành mạnh và thu thập
                thành tựu
              </p>
            </div>

            <div className="gami-stats-row">
              <div className="gami-stat-box">
                <Coins style={{ color: "#ffff00" }} />
                <span style={{ color: "#ffff00" }}>
                  {userWallet?.coinBalance.toLocaleString() ??
                    currentUser?.coins.toLocaleString() ??
                    "0"}{" "}
                  xu
                </span>
              </div>
              <div className="gami-stat-box">
                <Trophy style={{ color: "#ff8800" }} />
                <span style={{ color: "#ff8800" }}>#{currentUserRank}</span>
              </div>
              <div className="gami-stat-box">
                <Flame style={{ color: "#ff0088" }} />
                <span style={{ color: "#ff0088" }}>
                  {userWallet?.currentStreak ?? currentUser?.streak ?? 0} ngày
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="gami-nav">
          {[
            { key: "leaderboard", label: "Bảng Xếp Hạng", icon: Trophy },
            { key: "badges", label: "Huy Hiệu", icon: Award },
            { key: "games", label: "Mini Games", icon: Zap },
            { key: "achievements", label: "Thành Tựu", icon: Target },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`gami-nav-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() =>
                setActiveTab(
                  tab.key as
                    | "leaderboard"
                    | "badges"
                    | "games"
                    | "achievements",
                )
              }
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="gami-content">
          <div className="gamification">
            <div className="gamification-content">
              {activeTab === "leaderboard" && renderLeaderboard()}
              {activeTab === "badges" && renderBadges()}
              {activeTab === "games" && renderMiniGames()}
              {activeTab === "achievements" && renderAchievements()}
            </div>
          </div>
        </div>
      </div>
      <MeowlGuide currentPage="games" />
    </div>
  );
};

export default Gamification;
