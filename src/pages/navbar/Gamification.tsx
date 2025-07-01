import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  Trophy,
  Crown,
  Medal,
  Target,
  Users,
  Coins,
  Calendar,
  Star,
  Gift,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  BookOpen,
  CheckCircle,
  Wallet
} from 'lucide-react';
import DailySpin from '../../components/game/DailySpin';
import QuizSprint from '../../components/game/QuizSprint';
import CoinHunt from '../../components/game/CoinHunt';
import HelpLeaderBoard from '../../components/game/HelpLeaderBoard';
import '../../styles/Gamification.css';
import { color } from 'framer-motion';

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
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'community' | 'events' | 'coins';
  criteria: string;
  reward: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Type definitions
type Difficulty = 'easy' | 'medium' | 'hard';
type GameType = 'spin' | 'quiz' | 'hunt' | 'help';

interface MiniGame {
  id: string;
  title: string;
  description: string;
  icon: string;
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
    requiredPlan: 'basic' | 'premium' | 'pro';
  };
}

const Gamification: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // State Management
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'games' | 'achievements'>('leaderboard');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [leaderboardType, setLeaderboardType] = useState<'learning' | 'community' | 'coins'>('coins');
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<string>('all');
  
  // User Premium Status
  const [userPremium] = useState<'free' | 'basic' | 'premium' | 'pro'>('free'); // Mock user status
  
  // Mini Games State
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showQuizGame, setShowQuizGame] = useState(false);
  const [showCoinHunt, setShowCoinHunt] = useState(false);
  const [showHelpLeaderBoard, setShowHelpLeaderBoard] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<'free' | 'premium'>('free');
  
  // Mock Data - Leaderboard
  const [leaderboardData] = useState<User[]>([
    {
      id: '1',
      name: 'Nguyễn Minh Anh',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b5e38469?w=80&h=80&fit=crop&crop=face&auto=format',
      rank: 1,
      coins: 2847,
      xp: 15420,
      badges: 28,
      streak: 15,
      contributions: 142
    },
    {
      id: '2',
      name: 'Trần Hoàng Long',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&auto=format',
      rank: 2,
      coins: 2654,
      xp: 14890,
      badges: 25,
      streak: 12,
      contributions: 128
    },
    {
      id: '3',
      name: 'Lê Thị Mai',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face&auto=format',
      rank: 3,
      coins: 2540,
      xp: 14200,
      badges: 22,
      streak: 10,
      contributions: 115
    },
    {
      id: '4',
      name: 'Phạm Văn Đức',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face&auto=format',
      rank: 4,
      coins: 2398,
      xp: 13750,
      badges: 20,
      streak: 8,
      contributions: 98
    },
    {
      id: '5',
      name: 'Vũ Thị Hương',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face&auto=format',
      rank: 5,
      coins: 2287,
      xp: 13200,
      badges: 19,
      streak: 7,
      contributions: 87
    },
    // Current user
    {
      id: 'current',
      name: 'Bạn',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face&auto=format',
      rank: 12,
      coins: 1850,
      xp: 10500,
      badges: 15,
      streak: 5,
      contributions: 45
    }
  ]);

  // Mock Data - Badges
  const [badges] = useState<Badge[]>([
    {
      id: 'speed-learner',
      title: 'Người Học Nhanh',
      description: 'Hoàn thành 5 bài học trong 1 ngày',
      icon: '🎯',
      category: 'learning',
      criteria: 'Hoàn thành 5 bài học trong 1 ngày',
      reward: 50,
      unlocked: true,
      rarity: 'common'
    },
    {
      id: 'quiz-master',
      title: 'Thầy Quiz',
      description: 'Đạt 100% trong 3 bài kiểm tra',
      icon: '🧠',
      category: 'learning',
      criteria: 'Đạt 100% trong 3 bài kiểm tra',
      reward: 100,
      unlocked: true,
      rarity: 'rare'
    },
    {
      id: 'inspiring-peer',
      title: 'Người Truyền Cảm Hứng',
      description: 'Nhận 10 phản hồi tích cực',
      icon: '💬',
      category: 'community',
      criteria: 'Nhận 10 phản hồi tích cực',
      reward: 30,
      unlocked: false,
      progress: 7,
      maxProgress: 10,
      rarity: 'common'
    },
    {
      id: 'coin-collector',
      title: 'Thợ Sưu Tầm Xu',
      description: 'Kiếm được tổng cộng 1,000 xu',
      icon: '💎',
      category: 'coins',
      criteria: 'Kiếm được tổng cộng 1,000 xu',
      reward: 200,
      unlocked: true,
      rarity: 'epic'
    },
    {
      id: 'weekly-champion',
      title: 'Nhà Vô Địch Tuần',
      description: 'Đứng đầu bảng xếp hạng tuần',
      icon: '🏆',
      category: 'coins',
      criteria: 'Đứng đầu bảng xếp hạng tuần',
      reward: 150,
      unlocked: false,
      rarity: 'legendary'
    },
    {
      id: 'streak-warrior',
      title: 'Chiến Binh Chuỗi',
      description: 'Duy trì chuỗi học tập 30 ngày',
      icon: '🔥',
      category: 'learning',
      criteria: 'Duy trì chuỗi học tập 30 ngày',
      reward: 300,
      unlocked: false,
      progress: 15,
      maxProgress: 30,
      rarity: 'epic'
    },
    {
      id: 'helper-hero',
      title: 'Anh Hùng Hỗ Trợ',
      description: 'Giúp đỡ 50 thành viên khác',
      icon: '🦸',
      category: 'community',
      criteria: 'Giúp đỡ 50 thành viên khác',
      reward: 250,
      unlocked: false,
      progress: 23,
      maxProgress: 50,
      rarity: 'rare'
    },
    {
      id: 'event-enthusiast',
      title: 'Người Đam Mê Sự Kiện',
      description: 'Tham gia 10 sự kiện SkillVerse',
      icon: '🎉',
      category: 'events',
      criteria: 'Tham gia 10 sự kiện SkillVerse',
      reward: 180,
      unlocked: false,
      progress: 6,
      maxProgress: 10,
      rarity: 'rare'
    }
  ]);

  // Mock Data - Mini Games
  const [miniGames] = useState<MiniGame[]>([
    {
      id: 'spin-wheel',
      title: 'Vòng Quay May Mắn',
      description: 'Quay để nhận xu ngẫu nhiên mỗi ngày',
      icon: '🎰',
      type: 'spin',
      difficulty: 'easy',
      coins: 100,
      cooldown: 1440, // 24 hours
      available: true,
      premium: {
        enabled: true,
        title: 'Vòng Quay Premium',
        description: 'Phần thưởng cao hơn + quay thêm lần',
        coins: 300,
        cooldown: 720, // 12 hours
        features: ['Phần thưởng 3x cao hơn', 'Quay 2 lần/ngày', 'Ưu tiên phần thưởng rare'],
        requiredPlan: 'premium'
      }
    },
    {
      id: 'quiz-challenge',
      title: 'Quiz Sprint',
      description: '5 câu hỏi trong 60 giây',
      icon: '⚡',
      type: 'quiz',
      difficulty: 'medium',
      coins: 150,
      cooldown: 1440, // 24 hours
      available: true,
      premium: {
        enabled: true,
        title: 'Quiz Sprint Pro',
        description: '10 câu hỏi khó + thời gian bonus',
        coins: 500,
        cooldown: 480, // 8 hours
        features: ['10 câu hỏi thay vì 5', '+30 giây thời gian', 'Câu hỏi nâng cao', 'Streak bonus'],
        requiredPlan: 'premium'
      }
    },
    {
      id: 'coin-hunt',
      title: 'Săn Xu Ẩn',
      description: 'Tìm xu ẩn trong các bài học',
      icon: '🔍',
      type: 'hunt',
      difficulty: 'easy',
      coins: '1000+',
      cooldown: 10080, // 1 week
      available: true,
      premium: {
        enabled: true,
        title: 'Săn Kho Báu Premium',
        description: 'Nhiều xu hơn + gợi ý vị trí + daily hunt',
        coins: '5000+',
        cooldown: 1440, // Daily for premium
        features: ['Chơi hàng ngày', 'Gợi ý vị trí xu', 'Xu ẩn 5x nhiều hơn', 'Combo multiplier', 'Special treasure maps'],
        requiredPlan: 'premium'
      }
    },
    {
      id: 'help-win',
      title: 'Giúp Đỡ & Thắng',
      description: 'Sự kiện hàng tuần - giúp đỡ để thắng',
      icon: '🤝',
      type: 'help',
      difficulty: 'hard',
      coins: 'Không giới hạn',
      cooldown: 10080, // 1 week
      available: true,
      premium: {
        enabled: true,
        title: 'VIP Community Champion',
        description: 'Thưởng cao hơn + exclusive events',
        coins: 'Không giới hạn + Bonus',
        cooldown: 4320, // 3 days
        features: ['Sự kiện VIP riêng', 'Thưởng 2x điểm', 'Ưu tiên support', 'Exclusive badges'],
        requiredPlan: 'pro'
      }
    }
  ]);

  // Current user position calculation
  const currentUser = leaderboardData.find(user => user.id === 'current');
  const currentUserRank = currentUser?.rank ?? 12;
  const coinsToNextRank = currentUserRank > 1 ? 
    (leaderboardData.find(user => user.rank === currentUserRank - 1)?.coins ?? 0) - (currentUser?.coins ?? 0) : 0;

  // Filter badges by category
  const filteredBadges = selectedBadgeCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedBadgeCategory);

  // Helper functions for better readability
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    return '🥉';
  };

  const getCooldownText = (cooldown: number) => {
    if (cooldown >= 1440) return `${Math.floor(cooldown / 1440)} ngày`;
    if (cooldown >= 60) return `${Math.floor(cooldown / 60)} giờ`;
    return `${cooldown} phút`;
  };

  const getDifficultyText = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (difficulty === 'easy') return 'Dễ';
    if (difficulty === 'medium') return 'Trung bình';
    return 'Khó';
  };

  const getDifficultyStars = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (difficulty === 'easy') return '⭐';
    if (difficulty === 'medium') return '⭐⭐';
    return '⭐⭐⭐';
  };

  const canAccessPremium = (requiredPlan: 'basic' | 'premium' | 'pro') => {
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
            { key: 'week', label: 'Tuần này' },
            { key: 'month', label: 'Tháng này' },
            { key: 'all', label: 'Tất cả' }
          ].map(period => (
            <button
              key={period.key}
              className={`filter-btn ${leaderboardPeriod === period.key ? 'active' : ''}`}
              onClick={() => setLeaderboardPeriod(period.key as any)}
            >
              {period.label}
            </button>
          ))}
        </div>

        <div className="type-filters">
          {[
            { key: 'coins', label: 'Xu kiếm được', icon: Coins },
            { key: 'learning', label: 'Tiến độ học tập', icon: BookOpen },
            { key: 'community', label: 'Đóng góp cộng đồng', icon: Users }
          ].map(type => (
            <button
              key={type.key}
              className={`type-btn ${leaderboardType === type.key ? 'active' : ''}`}
              onClick={() => setLeaderboardType(type.key as any)}
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
                  : 'Bạn đang dẫn đầu!'
                }
              </p>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: coinsToNextRank > 0 
                  ? `${Math.max(0, 100 - (coinsToNextRank / (currentUser.coins + coinsToNextRank)) * 100)}%`
                  : '100%'
              }}
            />
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {leaderboardData.slice(0, 10).map((user) => (
          <div 
            key={user.id} 
            className={`leaderboard-item ${user.id === 'current' ? 'current-user' : ''}`}
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
              <img src={user.avatar} alt={user.name} className="user-avatar" />
              <div className="user-details">
                <h4 className="user-name">{user.name}</h4>
                <div className="user-stats">
                  <span className="stat coin">
                    <Coins/>
                    <span style={{ color: '#ffff00' }}>{user.coins.toLocaleString()}</span>
                  </span>
                  <span className="stat medal">
                    <Medal/>
                    <span style={{ color: '#ff8800' }}>{user.badges}</span>
                  </span>
                  <span className="stat flame">
                    <Flame/>
                    <span style={{ color: '#ff0088' }}>{user.streak}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="user-score">
              <span className="score-value">
                {leaderboardType === 'coins' && `${user.coins.toLocaleString()} xu`}
                {leaderboardType === 'learning' && `${user.xp.toLocaleString()} XP`}
                {leaderboardType === 'community' && `${user.contributions} đóng góp`}
              </span>
              {user.rank <= 3 && (
                <span className="trending-up">
                  <TrendingUp className="trending-icon" />
                </span>
              )}
            </div>
          </div>
        ))}
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
          { key: 'all', label: 'Tất cả', icon: Star },
          { key: 'learning', label: 'Học tập', icon: BookOpen },
          { key: 'community', label: 'Cộng đồng', icon: Users },
          { key: 'events', label: 'Sự kiện', icon: Calendar },
          { key: 'coins', label: 'Xu', icon: Coins }
        ].map(category => (
          <button
            key={category.key}
            className={`category-btn ${selectedBadgeCategory === category.key ? 'active' : ''}`}
            onClick={() => setSelectedBadgeCategory(category.key)}
          >
            <category.icon className="category-icon" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="badges-grid">
        {filteredBadges.map(badge => (
          <div 
            key={badge.id} 
            className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'} rarity-${badge.rarity}`}
          >
            <div className="badge-header">
              <div className="badge-icon" data-category={badge.category}>
                {badge.icon}
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
                      style={{ width: `${(badge.progress ?? 0) / (badge.maxProgress ?? 1) * 100}%` }}
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
              {badge.rarity === 'common' && '⚪'}
              {badge.rarity === 'rare' && '🟢'}
              {badge.rarity === 'epic' && '🟣'}
              {badge.rarity === 'legendary' && '🟡'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMiniGames = () => (
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
            className={`mode-btn ${selectedGameMode === 'free' ? 'active' : ''}`}
            onClick={() => setSelectedGameMode('free')}
          >
            🆓 Miễn phí
          </button>
          <button
            className={`mode-btn ${selectedGameMode === 'premium' ? 'active' : ''}`}
            onClick={() => setSelectedGameMode('premium')}
          >
            💎 Premium
          </button>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-grid">
        {miniGames.map(game => {
          const isPremiumMode = selectedGameMode === 'premium';
          const isLocked = isPremiumMode && game.premium && !canAccessPremium(game.premium.requiredPlan);
          
          return (
            <div key={`${game.id}-${selectedGameMode}`} className={`game-card ${game.type}-game ${!game.available ? 'unavailable' : ''} ${isPremiumMode ? 'premium-mode' : ''} ${isLocked ? 'locked' : ''}`}>
              
              {/* Game Status & Premium Badge */}
              <div className="game-status-row">
                <div className={`game-status ${game.available ? 'available' : 'unavailable'}`}>
                  {game.available ? 'Có sẵn' : 'Không có sẵn'}
                </div>
                {/* {isPremiumMode && (
                  <div className={`premium-badge ${isLocked ? 'locked' : 'unlocked'}`}>
                    {isLocked ? '🔒 Cần Premium' : '💎 Premium'}
                  </div>
                )} */}
              </div>

              {/* Game Header */}
              <div className="game-header">
                <div className="game-icon">
                  {game.icon}
                </div>
                <div className="game-info">
                  <h3>{isPremiumMode && game.premium ? game.premium.title : game.title}</h3>
                  <p>{isPremiumMode && game.premium ? game.premium.description : game.description}</p>
                </div>
                <div className="game-difficulty">{getDifficultyText(game.difficulty)}</div>
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
                    {isPremiumMode && game.premium ? game.premium.coins : game.coins}
                  </div>
                  <div className="game-stat-label">Xu tối đa</div>
                </div>
                <div className="game-stat">
                  <div className="game-stat-value">
                    {getCooldownText(isPremiumMode && game.premium ? game.premium.cooldown : game.cooldown)}
                  </div>
                  <div className="game-stat-label">Thời gian chờ</div>
                </div>
                <div className="game-stat">
                  <div className="game-stat-value">{getDifficultyStars(game.difficulty)}</div>
                  <div className="game-stat-label">Độ khó</div>
                </div>
              </div>

              {/* Game Actions */}
              <div className="game-actions">
                {isLocked ? (
                  <>
                    <button
                      className="game-btn locked"
                      disabled
                    >
                      🔒 Cần {game.premium?.requiredPlan}
                    </button>
                    <button 
                      className="game-btn upgrade"
                      onClick={() => navigate('/premium')}
                    >
                      🚀 Nâng cấp ngay
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`game-btn primary ${!game.available ? 'disabled' : ''}`}
                      onClick={() => {
                        if (game.available) {
                          if (game.type === 'spin') setShowSpinWheel(true);
                          if (game.type === 'quiz') setShowQuizGame(true);
                          if (game.type === 'hunt') setShowCoinHunt(true);
                          if (game.type === 'help') setShowHelpLeaderBoard(true);
                        }
                      }}
                      disabled={!game.available}
                    >
                      {game.available ? 'Chơi ngay' : 'Chờ làm mới'}
                    </button>
                    <button className="game-btn secondary">
                      Xem quy tắc
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Game Components */}
      <DailySpin 
        isOpen={showSpinWheel}
        onClose={() => setShowSpinWheel(false)}
        onWin={(coins) => {
          // Handle coins earned from Daily Spin
          console.log(`Earned ${coins} coins from Daily Spin!`);
        }}
      />

      <QuizSprint 
        isOpen={showQuizGame}
        onClose={() => setShowQuizGame(false)}
        onComplete={(score, coins) => {
          // Handle quiz completion
          console.log(`Quiz completed! Score: ${score}, Coins: ${coins}`);
        }}
      />

      <CoinHunt 
        isOpen={showCoinHunt}
        onClose={() => setShowCoinHunt(false)}
        onCoinsEarned={(coins) => {
          // Handle coins earned from Coin Hunt
          console.log(`Earned ${coins} coins from Coin Hunt!`);
        }}
      />

      <HelpLeaderBoard 
        isOpen={showHelpLeaderBoard}
        onClose={() => setShowHelpLeaderBoard(false)}
        onCoinsEarned={(coins) => {
          // Handle coins earned from Help Leaderboard
          console.log(`Earned ${coins} coins from Help Leaderboard!`);
        }}
      />
    </div>
  );

  const renderAchievements = () => (
    <div className="achievements-section">
      <div className="achievements-header">
        <h2>📊 Tổng Quan Thành Tựu</h2>
        <p>Theo dõi tiến độ tổng thể và mục tiêu cá nhân</p>
      </div>

      {/* Stats Cards */}
      <div className="achievements-summary">
        <div className="summary-card" data-type="completed">
          <div className="summary-icon">
            <Trophy />
          </div>
          <div className="summary-value">{badges.filter(b => b.unlocked).length}</div>
          <div className="summary-label">Huy hiệu đã mở</div>
        </div>

        <div className="summary-card" data-type="points">
          <div className="summary-icon">
            <Coins />
          </div>
          <div className="summary-value">2,540</div>
          <div className="summary-label">Tổng xu kiếm được</div>
        </div>

        <div className="summary-card" data-type="total">
          <div className="summary-icon">
            <Flame />
          </div>
          <div className="summary-value">15</div>
          <div className="summary-label">Chuỗi học tập</div>
        </div>

        <div className="summary-card" data-type="rare">
          <div className="summary-icon">
            <Crown />
          </div>
          <div className="summary-value">#{currentUserRank}</div>
          <div className="summary-label">Xếp hạng hiện tại</div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="recent-achievements">
        <h3>Thành Tựu Gần Đây</h3>
        <div className="recent-list">
          {badges.filter(b => b.unlocked).slice(0, 3).map(badge => (
            <div key={badge.id} className="recent-item">
              <div className="achievement-icon-wrapper" data-type={badge.category}>
                {badge.icon}
              </div>
              <div className="achievement-content">
                <h4>{badge.title}</h4>
                <p>+{badge.reward} xu • {badge.description}</p>
              </div>
              <div className="achievement-time">Hôm nay</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`gamification ${theme}`}>
      <div className="gamification-container">
        {/* Header */}
        <div className="gamification-header">
          <div className="header-content">
            <div className="title-section">
              <h1>🎮 Trung Tâm Trò Chơi</h1>
              <p>Học tập thông qua trò chơi, cạnh tranh lành mạnh và thu thập thành tựu</p>
            </div>
            
            <div className="header-stats">
              <div className="header-stat">
                <Coins style={{ color: '#ffff00' }} />
                <span style={{ color: '#ffff00' }} >2,540 xu</span>
              </div>
              <div className="header-stat">
                <Trophy style={{ color: '#ff8800' }} />
                <span style={{ color: '#ff8800' }}>#{currentUserRank}</span>
              </div>
                <div className="header-stat">
                <Flame style={{ color: '#ff0088' }} />
                <span style={{ color: '#ff0088' }}>15 ngày</span>
                </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="gamification-nav">
          {[
            { key: 'leaderboard', label: 'Bảng Xếp Hạng', icon: Trophy },
            { key: 'badges', label: 'Huy Hiệu', icon: Award },
            { key: 'games', label: 'Mini Games', icon: Zap },
            { key: 'achievements', label: 'Thành Tựu', icon: Target }
          ].map(tab => (
            <button
              key={tab.key}
              className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <tab.icon className="tab-icon" />
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="gamification-content">
          {activeTab === 'leaderboard' && renderLeaderboard()}
          {activeTab === 'badges' && renderBadges()}
          {activeTab === 'games' && renderMiniGames()}
          {activeTab === 'achievements' && renderAchievements()}
        </div>
      </div>
    </div>
  );
};

export default Gamification;
