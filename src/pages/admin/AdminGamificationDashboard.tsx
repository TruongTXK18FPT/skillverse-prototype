import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Users,
  Coins,
  Gamepad2,
  Award,
  TrendingUp,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Gift,
  Loader2,
  Eye,
  Upload,
  X,
} from "lucide-react";
import adminGamificationService, {
  AdminGamificationStats,
  UserActivitySummary,
  BadgeDefinition,
  MiniGameDefinition,
  UserActivityTracking,
  BadgeTriggerType,
} from "../../services/adminGamificationService";
import {
  uploadImage,
  validateImage,
  UploadProgress,
} from "../../services/fileUploadService";
import "./AdminGamificationDashboard.css";

type TabType =
  | "overview"
  | "leaderboard"
  | "badges"
  | "games"
  | "settings"
  | "users";

const AdminGamificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<AdminGamificationStats | null>(null);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [games, setGames] = useState<MiniGameDefinition[]>([]);
  const [users, setUsers] = useState<UserActivitySummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserActivityTracking | null>(
    null,
  );
  const [fullLeaderboard, setFullLeaderboard] = useState<any>(null);

  // Modal states
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGameConfigModal, setShowGameConfigModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(
    null,
  );
  const [editingGame, setEditingGame] = useState<MiniGameDefinition | null>(
    null,
  );

  // Form states
  const [badgeForm, setBadgeForm] = useState({
    badgeKey: "",
    badgeTitle: "",
    badgeDescription: "",
    badgeIcon: "🏆",
    badgeImageUrl: "", // URL ảnh từ Cloudinary
    badgeCategory: "learning",
    badgeRarity: "common",
    triggerType: "MANUAL" as BadgeTriggerType,
    triggerThreshold: 1,
    triggerMetric: "",
    coinReward: 100,
    xpReward: 50,
    isActive: true,
  });

  // Badge image upload states
  const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string>("");
  const [uploadingBadgeImage, setUploadingBadgeImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const badgeImageInputRef = useRef<HTMLInputElement>(null);

  // Trigger type options for badges
  const triggerTypeOptions: {
    value: BadgeTriggerType;
    label: string;
    metric?: string;
  }[] = [
    { value: "MANUAL", label: "Trao thủ công (Admin)" },
    {
      value: "COURSES_COMPLETED",
      label: "Hoàn thành khóa học",
      metric: "khóa học",
    },
    {
      value: "LESSONS_COMPLETED",
      label: "Hoàn thành bài học",
      metric: "bài học",
    },
    {
      value: "TOTAL_TIME_MINUTES",
      label: "Tổng thời gian học",
      metric: "phút",
    },
    { value: "STREAK_DAYS", label: "Chuỗi học tập", metric: "ngày liên tiếp" },
    {
      value: "LONGEST_STREAK",
      label: "Chuỗi học tập lâu nhất",
      metric: "ngày",
    },
    { value: "COINS_EARNED", label: "Xu kiếm được", metric: "xu" },
    { value: "GAMES_PLAYED", label: "Số game đã chơi", metric: "lượt chơi" },
    { value: "GAMES_WON", label: "Số game thắng", metric: "lượt thắng" },
    { value: "QUIZZES_COMPLETED", label: "Hoàn thành quiz", metric: "quiz" },
    {
      value: "QUIZZES_PERFECT_SCORE",
      label: "Điểm tuyệt đối quiz",
      metric: "lần",
    },
    { value: "POSTS_CREATED", label: "Bài viết đã tạo", metric: "bài viết" },
    {
      value: "COMMENTS_WRITTEN",
      label: "Bình luận đã viết",
      metric: "bình luận",
    },
    {
      value: "HELPFUL_ANSWERS",
      label: "Câu trả lời hữu ích",
      metric: "câu trả lời",
    },
    {
      value: "LIKES_RECEIVED",
      label: "Lượt thích nhận được",
      metric: "lượt thích",
    },
    { value: "MENTOR_SESSIONS", label: "Buổi mentor", metric: "buổi" },
    {
      value: "CERTIFICATES_EARNED",
      label: "Chứng chỉ đạt được",
      metric: "chứng chỉ",
    },
    { value: "LOGIN_DAYS", label: "Số ngày đăng nhập", metric: "ngày" },
    { value: "REFERRALS", label: "Người được giới thiệu", metric: "người" },
    {
      value: "EVENTS_PARTICIPATED",
      label: "Sự kiện tham gia",
      metric: "sự kiện",
    },
  ];

  const [gameForm, setGameForm] = useState({
    gameKey: "",
    gameTitle: "",
    gameDescription: "",
    gameIcon: "🎮",
    baseCoinReward: 100,
    maxCoinReward: 500,
    xpReward: 50,
    cooldownMinutes: 60,
    maxPlaysPerDay: 10,
    maxCoinsPerDay: 1000,
    isActive: true,
    isPremiumOnly: false,
  });

  const [coinForm, setCoinForm] = useState({
    userId: 0,
    coinAmount: 0,
    reason: "",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchFullLeaderboard();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, badgesData, gamesData] = await Promise.all([
        adminGamificationService.getDashboardStats().catch(() => null),
        adminGamificationService.getAllBadges().catch(() => []),
        adminGamificationService.getAllGames().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setBadges(badgesData);
      setGames(gamesData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminGamificationService.getAllUserActivities(
        0,
        50,
      );
      setUsers(response.content);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleViewUserActivity = async (userId: number) => {
    try {
      const activity =
        await adminGamificationService.getUserActivityTracking(userId);
      setSelectedUser(activity);
      setShowUserModal(true);
    } catch (err) {
      console.error("Error fetching user activity:", err);
    }
  };

  const handleCreateBadge = async () => {
    try {
      // Upload image first if selected
      let imageUrl = badgeForm.badgeImageUrl;
      if (badgeImageFile) {
        setUploadingBadgeImage(true);
        const uploadResult = await uploadImage(
          badgeImageFile,
          undefined,
          (progress) => {
            setUploadProgress(progress);
          },
        );
        imageUrl = uploadResult.url;
        setUploadingBadgeImage(false);
      }

      await adminGamificationService.createBadge({
        ...badgeForm,
        badgeImageUrl: imageUrl,
      });
      setShowBadgeModal(false);
      fetchDashboardData();
      resetBadgeForm();
    } catch (err) {
      console.error("Error creating badge:", err);
      setUploadingBadgeImage(false);
    }
  };

  const handleUpdateBadge = async () => {
    if (!editingBadge) return;
    try {
      // Upload image first if a new one was selected
      let imageUrl = badgeForm.badgeImageUrl;
      if (badgeImageFile) {
        setUploadingBadgeImage(true);
        const uploadResult = await uploadImage(
          badgeImageFile,
          undefined,
          (progress) => {
            setUploadProgress(progress);
          },
        );
        imageUrl = uploadResult.url;
        setUploadingBadgeImage(false);
      }

      await adminGamificationService.updateBadge(editingBadge.badgeDefId, {
        ...badgeForm,
        badgeImageUrl: imageUrl,
      });
      setShowBadgeModal(false);
      setEditingBadge(null);
      fetchDashboardData();
      resetBadgeForm();
    } catch (err) {
      console.error("Error updating badge:", err);
      setUploadingBadgeImage(false);
    }
  };

  // Handle badge image selection
  const handleBadgeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setBadgeImageFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setBadgeImagePreview(previewUrl);
  };

  // Clear badge image
  const clearBadgeImage = () => {
    setBadgeImageFile(null);
    setBadgeImagePreview("");
    setBadgeForm({ ...badgeForm, badgeImageUrl: "" });
    if (badgeImageInputRef.current) {
      badgeImageInputRef.current.value = "";
    }
  };

  const handleDeleteBadge = async (badgeDefId: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa huy hiệu này?")) return;
    try {
      await adminGamificationService.deleteBadge(badgeDefId);
      fetchDashboardData();
    } catch (err) {
      console.error("Error deleting badge:", err);
    }
  };

  const handleCreateGame = async () => {
    try {
      await adminGamificationService.createGame(gameForm);
      setShowGameModal(false);
      fetchDashboardData();
      resetGameForm();
    } catch (err) {
      console.error("Error creating game:", err);
    }
  };

  const handleUpdateGame = async () => {
    if (!editingGame) return;
    try {
      await adminGamificationService.updateGame(
        editingGame.gameDefId,
        gameForm,
      );
      setShowGameModal(false);
      setEditingGame(null);
      fetchDashboardData();
      resetGameForm();
    } catch (err) {
      console.error("Error updating game:", err);
    }
  };

  const handleToggleGame = async (gameDefId: number, active: boolean) => {
    try {
      await adminGamificationService.toggleGameStatus(gameDefId, active);
      fetchDashboardData();
    } catch (err) {
      console.error("Error toggling game:", err);
    }
  };

  const handleGiftCoins = async () => {
    try {
      await adminGamificationService.giftCoins(
        coinForm.userId,
        coinForm.coinAmount,
        coinForm.reason,
      );
      setShowCoinModal(false);
      setCoinForm({ userId: 0, coinAmount: 0, reason: "" });
      fetchDashboardData();
    } catch (err) {
      console.error("Error gifting coins:", err);
    }
  };

  const handleRefreshLeaderboard = async () => {
    try {
      await adminGamificationService.refreshLeaderboard();
      await fetchFullLeaderboard();
      fetchDashboardData();
    } catch (err) {
      console.error("Error refreshing leaderboard:", err);
    }
  };

  const fetchFullLeaderboard = async () => {
    try {
      const data = await adminGamificationService.getFullLeaderboard("all");
      setFullLeaderboard(data);
    } catch (err) {
      console.error("Error fetching full leaderboard:", err);
    }
  };

  const handleUpdateGameConfig = async () => {
    if (!editingGame) return;
    try {
      await Promise.all([
        adminGamificationService.updateGameRewards(
          editingGame.gameDefId,
          gameForm.baseCoinReward,
          gameForm.maxCoinReward,
          gameForm.xpReward,
        ),
        adminGamificationService.updateGameCooldown(
          editingGame.gameDefId,
          gameForm.cooldownMinutes,
          gameForm.maxPlaysPerDay,
          gameForm.maxCoinsPerDay,
        ),
      ]);
      setShowGameConfigModal(false);
      setEditingGame(null);
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating game config:", err);
    }
  };

  const resetBadgeForm = () => {
    setBadgeForm({
      badgeKey: "",
      badgeTitle: "",
      badgeDescription: "",
      badgeIcon: "🏆",
      badgeImageUrl: "",
      badgeCategory: "learning",
      badgeRarity: "common",
      triggerType: "MANUAL",
      triggerThreshold: 1,
      triggerMetric: "",
      coinReward: 100,
      xpReward: 50,
      isActive: true,
    });
    setBadgeImageFile(null);
    setBadgeImagePreview("");
    setUploadProgress(null);
  };

  const resetGameForm = () => {
    setGameForm({
      gameKey: "",
      gameTitle: "",
      gameDescription: "",
      gameIcon: "🎮",
      baseCoinReward: 100,
      maxCoinReward: 500,
      xpReward: 50,
      cooldownMinutes: 60,
      maxPlaysPerDay: 10,
      maxCoinsPerDay: 1000,
      isActive: true,
      isPremiumOnly: false,
    });
  };

  const openEditBadge = (badge: BadgeDefinition) => {
    setEditingBadge(badge);
    setBadgeForm({
      badgeKey: badge.badgeKey,
      badgeTitle: badge.badgeTitle,
      badgeDescription: badge.badgeDescription || "",
      badgeIcon: badge.badgeIcon || "🏆",
      badgeImageUrl: badge.badgeImageUrl || "",
      badgeCategory: badge.badgeCategory,
      badgeRarity: badge.badgeRarity,
      triggerType: badge.triggerType || "MANUAL",
      triggerThreshold: badge.triggerThreshold || 1,
      triggerMetric: badge.triggerMetric || "",
      coinReward: badge.coinReward,
      xpReward: badge.xpReward,
      isActive: badge.isActive,
    });
    // Set preview if there's an existing image
    if (badge.badgeImageUrl) {
      setBadgeImagePreview(badge.badgeImageUrl);
    } else {
      setBadgeImagePreview("");
    }
    setBadgeImageFile(null);
    setShowBadgeModal(true);
  };

  const openEditGame = (game: MiniGameDefinition) => {
    setEditingGame(game);
    setGameForm({
      gameKey: game.gameKey,
      gameTitle: game.gameTitle,
      gameDescription: game.gameDescription || "",
      gameIcon: game.gameIcon || "🎮",
      baseCoinReward: game.baseCoinReward,
      maxCoinReward: game.maxCoinReward,
      xpReward: game.xpReward,
      cooldownMinutes: game.cooldownMinutes,
      maxPlaysPerDay: game.maxPlaysPerDay || 10,
      maxCoinsPerDay: game.maxCoinsPerDay || 1000,
      isActive: game.isActive,
      isPremiumOnly: game.isPremiumOnly,
    });
    setShowGameModal(true);
  };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="admgami-overview">
      {/* Stats Cards */}
      <div className="admgami-stats-grid">
        <div className="admgami-stat-card" data-type="users">
          <div className="admgami-stat-icon">
            <Users />
          </div>
          <div className="admgami-stat-content">
            <h3>{stats?.totalUsers?.toLocaleString() || 0}</h3>
            <p>Tổng người dùng</p>
            <span className="admgami-stat-sub">
              <TrendingUp className="admgami-trend-up" />
              {stats?.activeUsers || 0} hoạt động tuần này
            </span>
          </div>
        </div>

        <div className="admgami-stat-card" data-type="coins">
          <div className="admgami-stat-icon">
            <Coins />
          </div>
          <div className="admgami-stat-content">
            <h3>{stats?.totalCoinsDistributed?.toLocaleString() || 0}</h3>
            <p>Xu đã phân phối</p>
            <span className="admgami-stat-sub">
              +{stats?.coinsDistributedThisWeek?.toLocaleString() || 0} tuần này
            </span>
          </div>
        </div>

        <div className="admgami-stat-card" data-type="badges">
          <div className="admgami-stat-icon">
            <Award />
          </div>
          <div className="admgami-stat-content">
            <h3>{stats?.totalBadgesAwarded?.toLocaleString() || 0}</h3>
            <p>Huy hiệu đã trao</p>
            <span className="admgami-stat-sub">
              +{stats?.badgesAwardedThisWeek || 0} tuần này
            </span>
          </div>
        </div>

        <div className="admgami-stat-card" data-type="games">
          <div className="admgami-stat-icon">
            <Gamepad2 />
          </div>
          <div className="admgami-stat-content">
            <h3>{stats?.totalGameSessions?.toLocaleString() || 0}</h3>
            <p>Lượt chơi game</p>
            <span className="admgami-stat-sub">
              +{stats?.gameSessionsThisWeek || 0} tuần này
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admgami-quick-actions">
        <h3>⚡ Thao tác nhanh</h3>
        <div className="admgami-action-buttons">
          <button
            onClick={() => {
              resetBadgeForm();
              setEditingBadge(null);
              setShowBadgeModal(true);
            }}
            className="admgami-action-btn badge"
          >
            <Plus /> Tạo huy hiệu
          </button>
          <button
            onClick={() => {
              resetGameForm();
              setEditingGame(null);
              setShowGameModal(true);
            }}
            className="admgami-action-btn game"
          >
            <Gamepad2 /> Tạo game
          </button>
          <button
            onClick={handleRefreshLeaderboard}
            className="admgami-action-btn refresh"
          >
            <RefreshCw /> Làm mới BXH
          </button>
        </div>
      </div>

      {/* Top Earners & Active Users */}
      <div className="admgami-lists-grid">
        <div className="admgami-list-card">
          <div className="admgami-list-header">
            <h3>
              <Trophy className="icon-gold" /> Top kiếm xu
            </h3>
          </div>
          <div className="admgami-list-content">
            {stats?.topCoinEarners?.slice(0, 5).map((user, index) => {
              // Giống Gamification.tsx - chỉ dùng userName
              const displayName = user.userName || "Unknown";

              // Avatar logic giống Gamification.tsx
              const avatarSrc =
                user.userAvatar ||
                user.userAvatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

              return (
                <div key={user.userId} className="admgami-list-item">
                  <span className="admgami-rank">#{index + 1}</span>
                  <img
                    className="admgami-avatar"
                    src={avatarSrc}
                    alt={displayName}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                    }}
                  />
                  <span className="admgami-name">{displayName}</span>
                  <span className="admgami-value">
                    🪙 {user.totalCoins?.toLocaleString() || 0} xu
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admgami-list-card">
          <div className="admgami-list-header">
            <h3>
              <Activity className="icon-green" /> Hoạt động nhiều nhất
            </h3>
          </div>
          <div className="admgami-list-content">
            {stats?.mostActiveUsers?.slice(0, 5).map((user, index) => {
              // Giống Gamification.tsx - chỉ dùng userName
              const displayName = user.userName || "Unknown";

              // Avatar logic giống Gamification.tsx
              const avatarSrc =
                user.userAvatar ||
                user.userAvatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

              return (
                <div key={user.userId} className="admgami-list-item">
                  <span className="admgami-rank">#{index + 1}</span>
                  <img
                    className="admgami-avatar"
                    src={avatarSrc}
                    alt={displayName}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                    }}
                  />
                  <span className="admgami-name">{displayName}</span>
                  <span className="admgami-value">
                    🎮 {user.gamesPlayed || 0} games
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game & Badge Stats */}
      <div className="admgami-stats-tables">
        <div className="admgami-table-card">
          <div className="admgami-table-header">
            <h3>
              <Gamepad2 /> Thống kê Game
            </h3>
          </div>
          <table className="admgami-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Lượt chơi</th>
                <th>Hoàn thành</th>
                <th>Tỷ lệ</th>
                <th>Xu phát</th>
              </tr>
            </thead>
            <tbody>
              {stats?.gameStats?.map((game) => (
                <tr key={game.gameDefId}>
                  <td>{game.gameTitle}</td>
                  <td>{game.totalSessions}</td>
                  <td>{game.completedSessions}</td>
                  <td>{game.completionRate.toFixed(1)}%</td>
                  <td>{game.totalCoinsAwarded.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admgami-table-card">
          <div className="admgami-table-header">
            <h3>
              <Award /> Thống kê Huy hiệu
            </h3>
          </div>
          <table className="admgami-table">
            <thead>
              <tr>
                <th>Huy hiệu</th>
                <th>Loại</th>
                <th>Độ hiếm</th>
                <th>Đã trao</th>
                <th>Tuần này</th>
              </tr>
            </thead>
            <tbody>
              {stats?.badgeStats?.map((badge) => (
                <tr key={badge.badgeDefId}>
                  <td>{badge.badgeTitle}</td>
                  <td>{badge.badgeCategory}</td>
                  <td>
                    <span
                      className={`admgami-rarity-badge admgami-rarity-${badge.badgeRarity}`}
                    >
                      {badge.badgeRarity}
                    </span>
                  </td>
                  <td>{badge.totalAwarded}</td>
                  <td>+{badge.awardedThisWeek}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render Badges Tab
  const renderBadges = () => (
    <div className="admgami-badges-tab">
      <div className="admgami-tab-header">
        <h2>
          <Award /> Quản lý Huy hiệu
        </h2>
        <button
          onClick={() => {
            resetBadgeForm();
            setEditingBadge(null);
            setShowBadgeModal(true);
          }}
          className="admgami-add-btn"
        >
          <Plus /> Tạo huy hiệu mới
        </button>
      </div>

      <div className="admgami-badges-grid">
        {badges.map((badge) => (
          <div
            key={badge.badgeDefId}
            className={`admgami-badge-card admgami-rarity-${badge.badgeRarity}`}
          >
            <div className="admgami-badge-icon">
              {badge.badgeImageUrl ? (
                <img
                  src={badge.badgeImageUrl}
                  alt={badge.badgeTitle}
                  className="admgami-badge-image"
                />
              ) : (
                badge.badgeIcon || "🏆"
              )}
            </div>
            <div className="admgami-badge-info">
              <h4>{badge.badgeTitle}</h4>
              <p>{badge.badgeDescription}</p>
              <div className="admgami-badge-meta">
                <span className="admgami-category">{badge.badgeCategory}</span>
                <span
                  className={`admgami-rarity admgami-rarity-${badge.badgeRarity}`}
                >
                  {badge.badgeRarity}
                </span>
              </div>
              {/* Badge trigger logic display */}
              <div className="admgami-badge-trigger">
                <span className="admgami-trigger-type">
                  {badge.triggerType === "MANUAL"
                    ? "🔧 Trao thủ công"
                    : `⚡ ${triggerTypeOptions.find((t) => t.value === badge.triggerType)?.label || badge.triggerType}`}
                </span>
                {badge.triggerType !== "MANUAL" && (
                  <span className="admgami-trigger-threshold">
                    Ngưỡng: {badge.triggerThreshold}{" "}
                    {triggerTypeOptions.find(
                      (t) => t.value === badge.triggerType,
                    )?.metric || ""}
                  </span>
                )}
              </div>
              <div className="admgami-badge-rewards">
                <span>
                  <Coins /> {badge.coinReward}
                </span>
                <span>⭐ {badge.xpReward} XP</span>
              </div>
            </div>
            <div className="admgami-badge-actions">
              <button
                onClick={() => openEditBadge(badge)}
                className="admgami-edit-btn"
              >
                <Edit />
              </button>
              <button
                onClick={() => handleDeleteBadge(badge.badgeDefId)}
                className="admgami-delete-btn"
              >
                <Trash2 />
              </button>
            </div>
            <div
              className={`admgami-badge-status ${badge.isActive ? "admgami-active" : "admgami-inactive"}`}
            >
              {badge.isActive ? "Hoạt động" : "Tắt"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Games Tab
  const renderGames = () => (
    <div className="admgami-games-tab">
      <div className="admgami-tab-header">
        <h2>
          <Gamepad2 /> Quản lý Mini Games
        </h2>
        <button
          onClick={() => {
            resetGameForm();
            setEditingGame(null);
            setShowGameModal(true);
          }}
          className="admgami-add-btn"
        >
          <Plus /> Tạo game mới
        </button>
      </div>

      <div className="admgami-games-grid">
        {games.map((game) => (
          <div
            key={game.gameDefId}
            className={`admgami-game-card ${!game.isActive ? "admgami-inactive" : ""}`}
          >
            <div className="admgami-game-header">
              <span className="admgami-game-icon">{game.gameIcon || "🎮"}</span>
              <div className="admgami-game-toggle">
                <label className="admgami-switch">
                  <input
                    type="checkbox"
                    checked={game.isActive}
                    onChange={() =>
                      handleToggleGame(game.gameDefId, !game.isActive)
                    }
                  />
                  <span className="admgami-slider"></span>
                </label>
              </div>
            </div>
            <div className="admgami-game-info">
              <h4>{game.gameTitle}</h4>
              <p className="admgami-key">{game.gameKey}</p>
              <p>{game.gameDescription}</p>
            </div>
            <div className="admgami-game-rewards">
              <div className="admgami-reward-item">
                <span className="admgami-label">Xu cơ bản</span>
                <span className="admgami-value">{game.baseCoinReward}</span>
              </div>
              <div className="admgami-reward-item">
                <span className="admgami-label">Xu tối đa</span>
                <span className="admgami-value">{game.maxCoinReward}</span>
              </div>
              <div className="admgami-reward-item">
                <span className="admgami-label">XP</span>
                <span className="admgami-value">{game.xpReward}</span>
              </div>
              <div className="admgami-reward-item">
                <span className="admgami-label">Cooldown</span>
                <span className="admgami-value">
                  {game.cooldownMinutes} phút
                </span>
              </div>
            </div>
            {game.isPremiumOnly && (
              <div className="admgami-premium-badge">💎 Premium Only</div>
            )}
            <div className="admgami-game-actions">
              <button
                onClick={() => openEditGame(game)}
                className="admgami-edit-btn"
              >
                <Edit /> Sửa
              </button>
              <button
                onClick={() => {
                  setEditingGame(game);
                  setGameForm({
                    gameKey: game.gameKey,
                    gameTitle: game.gameTitle,
                    gameDescription: game.gameDescription || "",
                    gameIcon: game.gameIcon || "🎮",
                    baseCoinReward: game.baseCoinReward,
                    maxCoinReward: game.maxCoinReward,
                    xpReward: game.xpReward,
                    cooldownMinutes: game.cooldownMinutes,
                    maxPlaysPerDay: game.maxPlaysPerDay || 10,
                    maxCoinsPerDay: game.maxCoinsPerDay || 1000,
                    isActive: game.isActive,
                    isPremiumOnly: game.isPremiumOnly,
                  });
                  setShowGameConfigModal(true);
                }}
                className="admgami-config-btn"
              >
                <Settings /> Cài đặt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Users Tab
  const renderUsers = () => {
    // Fetch users on tab switch
    if (users.length === 0) fetchUsers();

    return (
      <div className="admgami-users-tab">
        <div className="admgami-tab-header">
          <h2>
            <Users /> Theo dõi Hoạt động Người dùng
          </h2>
          <button onClick={fetchUsers} className="admgami-refresh-btn">
            <RefreshCw /> Làm mới
          </button>
        </div>

        <table className="admgami-users-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Xu</th>
              <th>XP</th>
              <th>Huy hiệu</th>
              <th>Games</th>
              <th>Streak</th>
              <th>Hoạt động</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId}>
                <td>
                  <div className="admgami-user-cell">
                    <img
                      src={
                        user.avatarMediaUrl ||
                        user.userAvatar ||
                        `https://ui-avatars.com/api/?name=${user.fullName || user.userName}`
                      }
                      alt=""
                    />
                    <span>{user.fullName || user.userName}</span>
                  </div>
                </td>
                <td>{user.totalCoins?.toLocaleString()}</td>
                <td>{user.totalXp?.toLocaleString()}</td>
                <td>{user.badgesEarned}</td>
                <td>{user.gamesPlayed}</td>
                <td>{user.currentStreak} 🔥</td>
                <td>
                  {user.lastActivityAt
                    ? new Date(user.lastActivityAt).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
                <td>
                  <button
                    onClick={() => handleViewUserActivity(user.userId)}
                    className="admgami-view-btn"
                  >
                    <Eye /> Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Leaderboard Tab
  const renderLeaderboard = () => (
    <div className="admgami-leaderboard-tab">
      <div className="admgami-tab-header">
        <h2>
          <Trophy /> Bảng Xếp Hạng
        </h2>
        <button
          onClick={handleRefreshLeaderboard}
          className="admgami-refresh-btn"
        >
          <RefreshCw /> Cập nhật BXH
        </button>
      </div>

      <div className="admgami-leaderboard-lists">
        <div className="admgami-leaderboard-section">
          <h3>
            🪙 Top Xu ({fullLeaderboard?.topCoinEarners?.length || 0} người)
          </h3>
          <div className="admgami-leaderboard-list">
            {fullLeaderboard?.topCoinEarners?.map(
              (user: any, index: number) => (
                <div
                  key={user.userId}
                  className={`admgami-leaderboard-item rank-${index + 1}`}
                >
                  <span className="admgami-rank">
                    {index === 0
                      ? "👑"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `#${index + 1}`}
                  </span>
                  <img
                    src={
                      user.avatarMediaUrl ||
                      user.userAvatar ||
                      `https://ui-avatars.com/api/?name=${user.fullName || user.userName}`
                    }
                    alt=""
                  />
                  <div className="admgami-info">
                    <span className="admgami-name">
                      {user.fullName || user.userName}
                    </span>
                    <span className="admgami-stats">
                      {user.totalCoins?.toLocaleString()} xu • {user.streakDays}{" "}
                      ngày streak
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="admgami-leaderboard-section">
          <h3>
            ⭐ Top XP ({fullLeaderboard?.topXpEarners?.length || 0} người)
          </h3>
          <div className="admgami-leaderboard-list">
            {fullLeaderboard?.topXpEarners?.map((user: any, index: number) => (
              <div
                key={user.userId}
                className={`admgami-leaderboard-item rank-${index + 1}`}
              >
                <span className="admgami-rank">
                  {index === 0
                    ? "👑"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : `#${index + 1}`}
                </span>
                <img
                  src={
                    user.avatarMediaUrl ||
                    user.userAvatar ||
                    `https://ui-avatars.com/api/?name=${user.fullName || user.userName}`
                  }
                  alt=""
                />
                <div className="admgami-info">
                  <span className="admgami-name">
                    {user.fullName || user.userName}
                  </span>
                  <span className="admgami-stats">
                    {user.totalXp?.toLocaleString()} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Badge Modal
  const renderBadgeModal = () => (
    <div
      className="admgami-modal-overlay"
      onClick={() => setShowBadgeModal(false)}
    >
      <div
        className="admgami-modal admgami-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{editingBadge ? "Sửa huy hiệu" : "Tạo huy hiệu mới"}</h3>
        <div className="admgami-form">
          {/* Basic Info Section */}
          <div className="admgami-form-section">
            <h4>📝 Thông tin cơ bản</h4>
            <div className="admgami-form-row">
              <label>Key (unique)</label>
              <input
                type="text"
                value={badgeForm.badgeKey}
                onChange={(e) =>
                  setBadgeForm({ ...badgeForm, badgeKey: e.target.value })
                }
                placeholder="course-master"
              />
            </div>
            <div className="admgami-form-row">
              <label>Tiêu đề</label>
              <input
                type="text"
                value={badgeForm.badgeTitle}
                onChange={(e) =>
                  setBadgeForm({ ...badgeForm, badgeTitle: e.target.value })
                }
                placeholder="Bậc thầy khóa học"
              />
            </div>
            <div className="admgami-form-row">
              <label>Mô tả</label>
              <textarea
                value={badgeForm.badgeDescription}
                onChange={(e) =>
                  setBadgeForm({
                    ...badgeForm,
                    badgeDescription: e.target.value,
                  })
                }
                placeholder="Hoàn thành 10 khóa học bất kỳ"
              />
            </div>
          </div>

          {/* Icon & Image Section */}
          <div className="admgami-form-section">
            <h4>🎨 Icon & Hình ảnh</h4>
            <div className="admgami-form-row-grid">
              <div className="admgami-form-row">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  value={badgeForm.badgeIcon}
                  onChange={(e) =>
                    setBadgeForm({ ...badgeForm, badgeIcon: e.target.value })
                  }
                  placeholder="🏆"
                />
              </div>
              <div className="admgami-form-row">
                <label>Loại</label>
                <select
                  value={badgeForm.badgeCategory}
                  onChange={(e) =>
                    setBadgeForm({
                      ...badgeForm,
                      badgeCategory: e.target.value,
                    })
                  }
                >
                  <option value="learning">Học tập</option>
                  <option value="social">Cộng đồng</option>
                  <option value="game">Trò chơi</option>
                  <option value="special">Đặc biệt</option>
                </select>
              </div>
            </div>

            {/* Badge Image Upload */}
            <div className="admgami-form-row">
              <label>Hình ảnh huy hiệu (tùy chọn)</label>
              <div className="admgami-image-upload-container">
                {badgeImagePreview || badgeForm.badgeImageUrl ? (
                  <div className="admgami-image-preview">
                    <img
                      src={badgeImagePreview || badgeForm.badgeImageUrl}
                      alt="Badge preview"
                    />
                    <button
                      type="button"
                      className="admgami-image-remove-btn"
                      onClick={clearBadgeImage}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="admgami-image-upload-area"
                    onClick={() => badgeImageInputRef.current?.click()}
                  >
                    <Upload size={24} />
                    <span>Click để upload ảnh</span>
                    <small>PNG, JPG, GIF, WebP (max 10MB)</small>
                  </div>
                )}
                <input
                  ref={badgeImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleBadgeImageSelect}
                  style={{ display: "none" }}
                />
                {uploadingBadgeImage && uploadProgress && (
                  <div className="admgami-upload-progress">
                    <div
                      className="admgami-upload-progress-bar"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                    <span>{uploadProgress.percentage}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rarity & Rewards Section */}
          <div className="admgami-form-section">
            <h4>💎 Độ hiếm & Phần thưởng</h4>
            <div className="admgami-form-row-grid">
              <div className="admgami-form-row">
                <label>Độ hiếm</label>
                <select
                  value={badgeForm.badgeRarity}
                  onChange={(e) =>
                    setBadgeForm({ ...badgeForm, badgeRarity: e.target.value })
                  }
                >
                  <option value="common">Thường</option>
                  <option value="rare">Hiếm</option>
                  <option value="epic">Sử thi</option>
                  <option value="legendary">Huyền thoại</option>
                </select>
              </div>
              <div className="admgami-form-row">
                <label>Thưởng Xu</label>
                <input
                  type="number"
                  value={badgeForm.coinReward}
                  onChange={(e) =>
                    setBadgeForm({
                      ...badgeForm,
                      coinReward: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="admgami-form-row">
              <label>Thưởng XP</label>
              <input
                type="number"
                value={badgeForm.xpReward}
                onChange={(e) =>
                  setBadgeForm({
                    ...badgeForm,
                    xpReward: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          {/* Trigger Logic Section */}
          <div className="admgami-form-section admgami-trigger-section">
            <h4>⚡ Logic tự động trao huy hiệu</h4>
            <p className="admgami-section-desc">
              Cấu hình điều kiện để hệ thống tự động trao huy hiệu khi người
              dùng đạt ngưỡng
            </p>

            <div className="admgami-form-row">
              <label>Loại điều kiện</label>
              <select
                value={badgeForm.triggerType}
                onChange={(e) =>
                  setBadgeForm({
                    ...badgeForm,
                    triggerType: e.target.value as BadgeTriggerType,
                  })
                }
              >
                {triggerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {badgeForm.triggerType !== "MANUAL" && (
              <div className="admgami-form-row">
                <label>
                  Ngưỡng (
                  {triggerTypeOptions.find(
                    (t) => t.value === badgeForm.triggerType,
                  )?.metric || "giá trị"}
                  )
                </label>
                <input
                  type="number"
                  min="1"
                  value={badgeForm.triggerThreshold}
                  onChange={(e) =>
                    setBadgeForm({
                      ...badgeForm,
                      triggerThreshold: parseInt(e.target.value) || 1,
                    })
                  }
                  placeholder="Nhập ngưỡng để đạt huy hiệu"
                />
                <small className="admgami-trigger-hint">
                  {badgeForm.triggerType === "TOTAL_TIME_MINUTES" &&
                    `Ví dụ: ${badgeForm.triggerThreshold} phút = ${Math.floor(badgeForm.triggerThreshold / 60)} giờ ${badgeForm.triggerThreshold % 60} phút = ${(badgeForm.triggerThreshold / 1440).toFixed(1)} ngày học`}
                  {badgeForm.triggerType === "STREAK_DAYS" &&
                    `Người dùng cần học ${badgeForm.triggerThreshold} ngày liên tiếp để nhận huy hiệu`}
                  {badgeForm.triggerType === "COURSES_COMPLETED" &&
                    `Người dùng cần hoàn thành ${badgeForm.triggerThreshold} khóa học để nhận huy hiệu`}
                  {badgeForm.triggerType === "COINS_EARNED" &&
                    `Người dùng cần kiếm tổng cộng ${badgeForm.triggerThreshold} xu để nhận huy hiệu`}
                </small>
              </div>
            )}

            {badgeForm.triggerType === "MANUAL" && (
              <div className="admgami-manual-badge-info">
                <Gift size={20} />
                <span>
                  Huy hiệu này sẽ được admin trao thủ công cho người dùng
                </span>
              </div>
            )}
          </div>

          <div className="admgami-form-row admgami-checkbox">
            <label>
              <input
                type="checkbox"
                checked={badgeForm.isActive}
                onChange={(e) =>
                  setBadgeForm({ ...badgeForm, isActive: e.target.checked })
                }
              />
              Kích hoạt huy hiệu
            </label>
          </div>
        </div>
        <div className="admgami-modal-actions">
          <button
            onClick={() => setShowBadgeModal(false)}
            className="admgami-cancel-btn"
            disabled={uploadingBadgeImage}
          >
            Hủy
          </button>
          <button
            onClick={editingBadge ? handleUpdateBadge : handleCreateBadge}
            className="admgami-save-btn"
            disabled={uploadingBadgeImage}
          >
            {uploadingBadgeImage ? (
              <>
                <Loader2 className="admgami-spin" size={16} />
                Đang upload...
              </>
            ) : editingBadge ? (
              "Cập nhật"
            ) : (
              "Tạo mới"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Game Modal
  const renderGameModal = () => (
    <div
      className="admgami-modal-overlay"
      onClick={() => setShowGameModal(false)}
    >
      <div className="admgami-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editingGame ? "Sửa game" : "Tạo game mới"}</h3>
        <div className="admgami-form">
          <div className="admgami-form-row">
            <label>Key (unique)</label>
            <input
              type="text"
              value={gameForm.gameKey}
              onChange={(e) =>
                setGameForm({ ...gameForm, gameKey: e.target.value })
              }
              placeholder="tic-tac-toe"
            />
          </div>
          <div className="admgami-form-row">
            <label>Tên game</label>
            <input
              type="text"
              value={gameForm.gameTitle}
              onChange={(e) =>
                setGameForm({ ...gameForm, gameTitle: e.target.value })
              }
              placeholder="Tic-Tac-Toe"
            />
          </div>
          <div className="admgami-form-row">
            <label>Mô tả</label>
            <textarea
              value={gameForm.gameDescription}
              onChange={(e) =>
                setGameForm({ ...gameForm, gameDescription: e.target.value })
              }
              placeholder="Chơi cờ caro với AI"
            />
          </div>
          <div className="admgami-form-row">
            <label>Icon (emoji)</label>
            <input
              type="text"
              value={gameForm.gameIcon}
              onChange={(e) =>
                setGameForm({ ...gameForm, gameIcon: e.target.value })
              }
              placeholder="🎮"
            />
          </div>
          <div className="admgami-form-row-grid">
            <div className="admgami-form-row">
              <label>Xu cơ bản</label>
              <input
                type="number"
                value={gameForm.baseCoinReward}
                onChange={(e) =>
                  setGameForm({
                    ...gameForm,
                    baseCoinReward: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="admgami-form-row">
              <label>Xu tối đa</label>
              <input
                type="number"
                value={gameForm.maxCoinReward}
                onChange={(e) =>
                  setGameForm({
                    ...gameForm,
                    maxCoinReward: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="admgami-form-row">
            <label>XP thưởng</label>
            <input
              type="number"
              value={gameForm.xpReward}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  xpReward: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="admgami-form-row-grid">
            <div className="admgami-form-row">
              <label>Cooldown (phút)</label>
              <input
                type="number"
                value={gameForm.cooldownMinutes}
                onChange={(e) =>
                  setGameForm({
                    ...gameForm,
                    cooldownMinutes: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="admgami-form-row">
              <label>Max lượt/ngày</label>
              <input
                type="number"
                value={gameForm.maxPlaysPerDay}
                onChange={(e) =>
                  setGameForm({
                    ...gameForm,
                    maxPlaysPerDay: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="admgami-form-row">
            <label>Max xu/ngày</label>
            <input
              type="number"
              value={gameForm.maxCoinsPerDay}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  maxCoinsPerDay: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="admgami-form-row admgami-checkbox">
            <label>
              <input
                type="checkbox"
                checked={gameForm.isPremiumOnly}
                onChange={(e) =>
                  setGameForm({ ...gameForm, isPremiumOnly: e.target.checked })
                }
              />
              Chỉ dành cho Premium
            </label>
          </div>
          <div className="admgami-form-row admgami-checkbox">
            <label>
              <input
                type="checkbox"
                checked={gameForm.isActive}
                onChange={(e) =>
                  setGameForm({ ...gameForm, isActive: e.target.checked })
                }
              />
              Kích hoạt game
            </label>
          </div>
        </div>
        <div className="admgami-modal-actions">
          <button
            onClick={() => setShowGameModal(false)}
            className="admgami-cancel-btn"
          >
            Hủy
          </button>
          <button
            onClick={editingGame ? handleUpdateGame : handleCreateGame}
            className="admgami-save-btn"
          >
            {editingGame ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </div>
    </div>
  );

  // Game Config Modal
  const renderGameConfigModal = () => (
    <div
      className="admgami-modal-overlay"
      onClick={() => setShowGameConfigModal(false)}
    >
      <div className="admgami-modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          <Settings /> Cài đặt Game: {editingGame?.gameTitle}
        </h3>
        <div className="admgami-form">
          <div className="admgami-form-section">
            <h4>💰 Phần thưởng</h4>
            <div className="admgami-form-row-grid">
              <div className="admgami-form-row">
                <label>Xu cơ bản</label>
                <input
                  type="number"
                  value={gameForm.baseCoinReward}
                  onChange={(e) =>
                    setGameForm({
                      ...gameForm,
                      baseCoinReward: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="admgami-form-row">
                <label>Xu tối đa</label>
                <input
                  type="number"
                  value={gameForm.maxCoinReward}
                  onChange={(e) =>
                    setGameForm({
                      ...gameForm,
                      maxCoinReward: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="admgami-form-row">
              <label>XP thưởng</label>
              <input
                type="number"
                value={gameForm.xpReward}
                onChange={(e) =>
                  setGameForm({
                    ...gameForm,
                    xpReward: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="admgami-form-section">
            <h4>⏱️ Giới hạn</h4>
            <div className="admgami-form-row">
              <label>Cooldown (phút)</label>
              <input
                type="number"
                value={gameForm.cooldownMinutes}
                onChange={(e) =>
                  setGameForm({
                    ...gameForm,
                    cooldownMinutes: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="admgami-form-row-grid">
              <div className="admgami-form-row">
                <label>Số lần chơi/ngày</label>
                <input
                  type="number"
                  value={gameForm.maxPlaysPerDay}
                  onChange={(e) =>
                    setGameForm({
                      ...gameForm,
                      maxPlaysPerDay: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="admgami-form-row">
                <label>Tối đa xu/ngày</label>
                <input
                  type="number"
                  value={gameForm.maxCoinsPerDay}
                  onChange={(e) =>
                    setGameForm({
                      ...gameForm,
                      maxCoinsPerDay: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="admgami-modal-actions">
          <button
            onClick={() => setShowGameConfigModal(false)}
            className="admgami-cancel-btn"
          >
            Hủy
          </button>
          <button onClick={handleUpdateGameConfig} className="admgami-save-btn">
            Cập nhật cấu hình
          </button>
        </div>
      </div>
    </div>
  );

  // Coin Gift Modal
  const renderCoinModal = () => (
    <div
      className="admgami-modal-overlay"
      onClick={() => setShowCoinModal(false)}
    >
      <div className="admgami-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🎁 Tặng xu cho người dùng</h3>
        <div className="admgami-form">
          <div className="form-row">
            <label>User ID</label>
            <input
              type="number"
              value={coinForm.userId || ""}
              onChange={(e) =>
                setCoinForm({
                  ...coinForm,
                  userId: parseInt(e.target.value) || 0,
                })
              }
              placeholder="123"
            />
          </div>
          <div className="form-row">
            <label>Số xu</label>
            <input
              type="number"
              value={coinForm.coinAmount || ""}
              onChange={(e) =>
                setCoinForm({
                  ...coinForm,
                  coinAmount: parseInt(e.target.value) || 0,
                })
              }
              placeholder="100"
            />
          </div>
          <div className="form-row">
            <label>Lý do</label>
            <textarea
              value={coinForm.reason}
              onChange={(e) =>
                setCoinForm({ ...coinForm, reason: e.target.value })
              }
              placeholder="Phần thưởng sự kiện..."
            />
          </div>
        </div>
        <div className="admgami-modal-actions">
          <button
            onClick={() => setShowCoinModal(false)}
            className="admgami-cancel-btn"
          >
            Hủy
          </button>
          <button onClick={handleGiftCoins} className="admgami-save-btn">
            Tặng xu
          </button>
        </div>
      </div>
    </div>
  );

  // User Activity Modal
  const renderUserModal = () =>
    selectedUser && (
      <div
        className="admgami-modal-overlay"
        onClick={() => setShowUserModal(false)}
      >
        <div
          className="admgami-modal large"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>📊 Chi tiết hoạt động: {selectedUser.userName}</h3>
          <div className="admgami-user-detail">
            <div className="admgami-user-header">
              <img
                src={
                  selectedUser.avatarMediaUrl ||
                  selectedUser.userAvatar ||
                  `https://ui-avatars.com/api/?name=${selectedUser.fullName || selectedUser.userName}`
                }
                alt=""
              />
              <div>
                <h4>{selectedUser.fullName || selectedUser.userName}</h4>
                <p>User ID: {selectedUser.userId}</p>
              </div>
            </div>

            <div className="admgami-counters-grid">
              <div className="admgami-counter-item">
                <span className="admgami-label">Activities</span>
                <span className="admgami-value">
                  {selectedUser.counters.totalActivities}
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Courses</span>
                <span className="admgami-value">
                  {selectedUser.counters.coursesCompleted}
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Games Played</span>
                <span className="admgami-value">
                  {selectedUser.counters.gamesPlayed}
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Games Won</span>
                <span className="admgami-value">
                  {selectedUser.counters.gamesWon}
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Badges</span>
                <span className="admgami-value">
                  {selectedUser.counters.badgesEarned}
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Coins Earned</span>
                <span className="admgami-value">
                  {selectedUser.counters.totalCoinsEarned}
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Coins Spent</span>
                <span className="admgami-value">
                  {selectedUser.counters.totalCoinsSpent}
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Current Streak</span>
                <span className="admgami-value">
                  {selectedUser.counters.currentStreak} 🔥
                </span>
              </div>
              <div className="admgami-counter-item">
                <span className="admgami-label">Longest Streak</span>
                <span className="admgami-value">
                  {selectedUser.counters.longestStreak}
                </span>
              </div>
            </div>

            <div className="admgami-achievements-section">
              <h4>🏆 Thành tựu đã đạt</h4>
              <div className="admgami-achievements-list">
                {selectedUser.achievements.map((ach, index) => (
                  <div key={index} className="admgami-achievement-item">
                    <span className="admgami-icon">{ach.achievementIcon}</span>
                    <span className="admgami-title">
                      {ach.achievementTitle}
                    </span>
                    <span className="admgami-reward">+{ach.coinReward} xu</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="admgami-recent-section">
              <h4>📝 Hoạt động gần đây</h4>
              <div className="admgami-recent-list">
                {selectedUser.recentActivities.map((act, index) => (
                  <div key={index} className="admgami-recent-item">
                    <span className="admgami-desc">
                      {act.activityDescription}
                    </span>
                    <span className="admgami-reward">
                      +{act.coinsEarned} xu, +{act.xpEarned} XP
                    </span>
                    <span className="admgami-time">
                      {new Date(act.occurredAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="admgami-modal-actions">
            <button
              onClick={() => setShowUserModal(false)}
              className="admgami-cancel-btn"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );

  if (loading) {
    return (
      <div className="admgami-loading">
        <Loader2 className="admgami-spin" />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="admgami-wrapper">
      <div className="admgami-container">
        {/* Header */}
        <div className="admgami-header">
          <h1>🎮 Admin Gamification Dashboard</h1>
          <p>
            Quản lý hệ thống gamification, theo dõi hoạt động và thiết lập phần
            thưởng
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="admgami-error">
            <span>⚠️ {error}</span>
            <button onClick={fetchDashboardData}>Thử lại</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="admgami-tabs">
          {[
            { key: "overview", label: "Tổng quan", icon: BarChart3 },
            { key: "leaderboard", label: "Bảng xếp hạng", icon: Trophy },
            { key: "badges", label: "Huy hiệu", icon: Award },
            { key: "games", label: "Mini Games", icon: Gamepad2 },
            { key: "users", label: "Người dùng", icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`admgami-tab ${activeTab === tab.key ? "admgami-active" : ""}`}
              onClick={() => setActiveTab(tab.key as TabType)}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="admgami-content">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "leaderboard" && renderLeaderboard()}
          {activeTab === "badges" && renderBadges()}
          {activeTab === "games" && renderGames()}
          {activeTab === "users" && renderUsers()}
        </div>

        {/* Modals */}
        {showBadgeModal && renderBadgeModal()}
        {showGameModal && renderGameModal()}
        {showGameConfigModal && renderGameConfigModal()}
        {showCoinModal && renderCoinModal()}
        {showUserModal && renderUserModal()}
      </div>
    </div>
  );
};

export default AdminGamificationDashboard;
