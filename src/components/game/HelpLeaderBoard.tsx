import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Crown, Users, TrendingUp, Gift, Star, Zap } from 'lucide-react';
import '../../styles/HelpLeaderBoard.css';

interface HelpLeaderBoardProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsEarned: (coins: number) => void;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  helpCount: number;
  coinsEarned: number;
  rank: number;
  badge: 'gold' | 'silver' | 'bronze' | 'participant';
  isCurrentUser?: boolean;
}

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
}

const HelpLeaderBoard: React.FC<HelpLeaderBoardProps> = ({ isOpen, onClose, onCoinsEarned }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'challenges' | 'rewards'>('leaderboard');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallenge[]>([]);
  const [userStats, setUserStats] = useState({ helpCount: 0, coinsEarned: 0, rank: 0 });

  useEffect(() => {
    if (isOpen) {
      // Generate mock leaderboard data
      const mockData: LeaderboardEntry[] = [
        { id: '1', name: 'Minh Tú', avatar: '👨‍💻', helpCount: 45, coinsEarned: 2250, rank: 1, badge: 'gold' },
        { id: '2', name: 'Lan Anh', avatar: '👩‍🎓', helpCount: 38, coinsEarned: 1900, rank: 2, badge: 'silver' },
        { id: '3', name: 'Đức Việt', avatar: '👨‍🏫', helpCount: 32, coinsEarned: 1600, rank: 3, badge: 'bronze' },
        { id: '4', name: 'Thu Hà', avatar: '👩‍💼', helpCount: 28, coinsEarned: 1400, rank: 4, badge: 'participant' },
        { id: '5', name: 'Quang Minh', avatar: '👨‍🎨', helpCount: 25, coinsEarned: 1250, rank: 5, badge: 'participant' },
        { id: '6', name: 'Bích Ngọc', avatar: '👩‍🔬', helpCount: 22, coinsEarned: 1100, rank: 6, badge: 'participant' },
        { id: '7', name: 'Văn Hùng', avatar: '👨‍⚕️', helpCount: 18, coinsEarned: 900, rank: 7, badge: 'participant' },
        { id: '8', name: 'Bạn', avatar: '🧑‍💻', helpCount: 15, coinsEarned: 750, rank: 8, badge: 'participant', isCurrentUser: true },
        { id: '9', name: 'Thảo My', avatar: '👩‍🎤', helpCount: 12, coinsEarned: 600, rank: 9, badge: 'participant' },
        { id: '10', name: 'Hoàng Nam', avatar: '👨‍🍳', helpCount: 10, coinsEarned: 500, rank: 10, badge: 'participant' },
      ];
      setLeaderboardData(mockData);

      // Generate mock challenges
      const mockChallenges: WeeklyChallenge[] = [
        {
          id: '1',
          title: 'Người Trợ Giúp Tận Tâm',
          description: 'Trả lời 10 câu hỏi trong tuần này',
          target: 10,
          current: 6,
          reward: 200,
          completed: false
        },
        {
          id: '2',
          title: 'Chuyên Gia Chia Sẻ',
          description: 'Nhận 25 lượt thích cho câu trả lời',
          target: 25,
          current: 18,
          reward: 300,
          completed: false
        },
        {
          id: '3',
          title: 'Người Mentor Xuất Sắc',
          description: 'Giúp đỡ 5 người dùng mới',
          target: 5,
          current: 5,
          reward: 500,
          completed: true
        }
      ];
      setWeeklyChallenges(mockChallenges);

      // Set user stats
      const currentUser = mockData.find(entry => entry.isCurrentUser);
      if (currentUser) {
        setUserStats({
          helpCount: currentUser.helpCount,
          coinsEarned: currentUser.coinsEarned,
          rank: currentUser.rank
        });
      }
    }
  }, [isOpen]);

  const getBadgeIcon = (badge: string, size = 24) => {
    switch (badge) {
      case 'gold': return <Crown size={size} className="badge-gold" />;
      case 'silver': return <Medal size={size} className="badge-silver" />;
      case 'bronze': return <Trophy size={size} className="badge-bronze" />;
      default: return <Star size={size} className="badge-participant" />;
    }
  };

  const claimReward = (challengeId: string, reward: number) => {
    setWeeklyChallenges(prev => 
      prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, completed: true }
          : challenge
      )
    );
    onCoinsEarned(reward);
  };

  if (!isOpen) return null;

  return (
    <div className="help-leaderboard-overlay">
      <div className="help-leaderboard-modal">
        <div className="help-leaderboard-header">
          <div className="header-left">
            <h3>🫶 Bảng Xếp Hạng Giúp Đỡ</h3>
            <p>Cùng nhau xây dựng cộng đồng học tập tích cực!</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy className="tab-icon" />
              Xếp Hạng
            </button>
            <button 
              className={`tab ${activeTab === 'challenges' ? 'active' : ''}`}
              onClick={() => setActiveTab('challenges')}
            >
              <Zap className="tab-icon" />
              Thử Thách
            </button>
            <button 
              className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
              onClick={() => setActiveTab('rewards')}
            >
              <Gift className="tab-icon" />
              Phần Thưởng
            </button>
          </div>
        </div>

        <div className="content">
          {activeTab === 'leaderboard' && (
            <div className="leaderboard-content">
              {/* User Stats */}
              <div className="user-stats-card">
                <div className="stats-header">
                  <h4>📊 Thống Kê Của Bạn</h4>
                </div>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Users />
                    </div>
                    <div className="stat-details">
                      <div className="stat-value">{userStats.helpCount}</div>
                      <div className="stat-label">Lần giúp đỡ</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Gift />
                    </div>
                    <div className="stat-details">
                      <div className="stat-value">{userStats.coinsEarned}</div>
                      <div className="stat-label">Xu kiếm được</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <TrendingUp />
                    </div>
                    <div className="stat-details">
                      <div className="stat-value">#{userStats.rank}</div>
                      <div className="stat-label">Xếp hạng</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 3 Podium */}
              <div className="podium-container">
                <h4>🏆 Top 3 Tuần Này</h4>
                <div className="podium">
                  {leaderboardData.slice(0, 3).map((user, index) => (
                    <div key={user.id} className={`podium-place place-${index + 1}`}>
                      <div className="podium-rank">{index + 1}</div>
                      <div className="podium-avatar">{user.avatar}</div>
                      <div className="podium-name">{user.name}</div>
                      <div className="podium-stats">
                        <div className="podium-badge">
                          {getBadgeIcon(user.badge, 20)}
                        </div>
                        <div className="podium-help">{user.helpCount} lần</div>
                        <div className="podium-coins">{user.coinsEarned} xu</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Leaderboard */}
              <div className="full-leaderboard">
                <h4>📋 Bảng Xếp Hạng Đầy Đủ</h4>
                <div className="leaderboard-list">
                  {leaderboardData.map((user) => (
                    <div 
                      key={user.id} 
                      className={`leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`}
                    >
                      <div className="rank-section">
                        <div className="rank-number">#{user.rank}</div>
                        <div className="rank-badge">{getBadgeIcon(user.badge, 16)}</div>
                      </div>
                      
                      <div className="user-section">
                        <div className="user-avatar">{user.avatar}</div>
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                          <div className="user-subtitle">
                            {user.helpCount} lần giúp đỡ
                          </div>
                        </div>
                      </div>

                      <div className="coins-section">
                        <div className="coins-earned">{user.coinsEarned}</div>
                        <div className="coins-label">xu</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="challenges-content">
              <div className="challenges-header">
                <h4>⚡ Thử Thách Tuần Này</h4>
                <p>Hoàn thành thử thách để nhận thưởng đặc biệt!</p>
              </div>

              <div className="challenges-list">
                {weeklyChallenges.map((challenge) => (
                  <div 
                    key={challenge.id} 
                    className={`challenge-card ${challenge.completed ? 'completed' : ''}`}
                  >
                    <div className="challenge-header">
                      <div className="challenge-title">{challenge.title}</div>
                      {challenge.completed && (
                        <div className="completed-badge">
                          <Star className="completed-icon" />
                          Hoàn thành
                        </div>
                      )}
                    </div>

                    <div className="challenge-description">
                      {challenge.description}
                    </div>

                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="progress-text">
                        {challenge.current} / {challenge.target}
                      </div>
                    </div>

                    <div className="challenge-footer">
                      <div className="reward-info">
                        <Gift className="reward-icon" />
                        <span>+{challenge.reward} xu</span>
                      </div>
                      
                      {challenge.completed && (
                        <button 
                          className="claim-reward-btn"
                          onClick={() => claimReward(challenge.id, challenge.reward)}
                        >
                          Nhận thưởng
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="rewards-content">
              <div className="rewards-header">
                <h4>🎁 Hệ Thống Phần Thưởng</h4>
                <p>Các phần thưởng dành cho những người giúp đỡ cộng đồng</p>
              </div>

              <div className="rewards-grid">
                <div className="reward-tier">
                  <div className="tier-icon bronze">
                    <Trophy />
                  </div>
                  <h5>Người Mới Bắt Đầu</h5>
                  <div className="tier-requirement">1-5 lần giúp đỡ</div>
                  <div className="tier-rewards">
                    <div className="reward-item">🪙 10 xu/lần giúp đỡ</div>
                    <div className="reward-item">⭐ Huy hiệu "Người Hỗ Trợ"</div>
                  </div>
                </div>

                <div className="reward-tier">
                  <div className="tier-icon silver">
                    <Medal />
                  </div>
                  <h5>Người Hỗ Trợ Tích Cực</h5>
                  <div className="tier-requirement">6-20 lần giúp đỡ</div>
                  <div className="tier-rewards">
                    <div className="reward-item">🪙 25 xu/lần giúp đỡ</div>
                    <div className="reward-item">🎖️ Huy hiệu "Người Mentor"</div>
                    <div className="reward-item">🎁 Bonus 100 xu/tuần</div>
                  </div>
                </div>

                <div className="reward-tier">
                  <div className="tier-icon gold">
                    <Crown />
                  </div>
                  <h5>Chuyên Gia Cộng Đồng</h5>
                  <div className="tier-requirement">21+ lần giúp đỡ</div>
                  <div className="tier-rewards">
                    <div className="reward-item">🪙 50 xu/lần giúp đỡ</div>
                    <div className="reward-item">👑 Huy hiệu "Chuyên Gia"</div>
                    <div className="reward-item">🎁 Bonus 300 xu/tuần</div>
                    <div className="reward-item">🌟 Ưu tiên hiển thị câu trả lời</div>
                  </div>
                </div>
              </div>

              <div className="special-rewards">
                <h5>🌟 Phần Thưởng Đặc Biệt</h5>
                <div className="special-rewards-list">
                  <div className="special-reward-item">
                    <div className="special-icon">🏆</div>
                    <div className="special-details">
                      <div className="special-title">Top 1 Tuần</div>
                      <div className="special-description">Nhận 1000 xu bonus + huy hiệu đặc biệt</div>
                    </div>
                  </div>
                  <div className="special-reward-item">
                    <div className="special-icon">🎯</div>
                    <div className="special-details">
                      <div className="special-title">Chuỗi Giúp Đỡ</div>
                      <div className="special-description">Giúp đỡ 7 ngày liên tiếp: +500 xu</div>
                    </div>
                  </div>
                  <div className="special-reward-item">
                    <div className="special-icon">💎</div>
                    <div className="special-details">
                      <div className="special-title">Câu Trả Lời Xuất Sắc</div>
                      <div className="special-description">Nhận 50+ lượt thích: +200 xu</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpLeaderBoard;
