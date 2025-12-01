import React, { useState } from 'react';
import { SkillPointActivity, Badge } from '../../pages/main/MentorPage';
import './SkillPointsTab.css';

const SkillPointsTab: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [justLeveledUp, setJustLeveledUp] = useState(false);

  // Mock data for skill points activities
  const [activities] = useState<SkillPointActivity[]>([
    {
      id: '1',
      activity: 'Hoàn Thành Buổi Học',
      points: 50,
      date: '2025-01-15T10:00:00',
      description: 'Buổi học Thực Hành Tốt Nhất React với Nguyễn Văn An'
    },
    {
      id: '2',
      activity: 'Nhận Đánh Giá 5 Sao',
      points: 25,
      date: '2025-01-14T16:30:00',
      description: 'Phản hồi xuất sắc từ Trần Thị Bình'
    },
    {
      id: '3',
      activity: 'Thưởng Buổi Học Đầu Tiên',
      points: 100,
      date: '2025-01-13T14:15:00',
      description: 'Thưởng chào mừng cho buổi hướng dẫn mới'
    },
    {
      id: '4',
      activity: 'Đạt Mục Tiêu Tuần',
      points: 75,
      date: '2025-01-12T09:00:00',
      description: 'Hoàn thành 5 buổi học trong tuần này'
    },
    {
      id: '5',
      activity: 'Chứng Chỉ Học Viên',
      points: 150,
      date: '2025-01-11T11:20:00',
      description: 'Học viên đã vượt qua chứng chỉ sau khi được hướng dẫn'
    }
  ]);

  // Mock data for badges
  const [badges] = useState<Badge[]>([
    {
      id: '1',
      name: 'Mentor Đầu Tiên',
      icon: '🎯',
      description: 'Hoàn thành buổi hướng dẫn đầu tiên của bạn',
      earnedDate: '2025-01-13T14:15:00'
    },
    {
      id: '2',
      name: 'Mentor Ngôi Sao',
      icon: '⭐',
      description: 'Duy trì đánh giá trung bình 4.5+ sao',
      earnedDate: '2025-01-14T16:30:00'
    },
    {
      id: '3',
      name: 'Mentor Nhất Quán',
      icon: '📅',
      description: 'Hoàn thành buổi học trong 7 ngày liên tiếp',
      earnedDate: '2025-01-15T10:00:00'
    }
  ]);

  const totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
  const currentLevel = Math.floor(totalPoints / 100) + 1;
  const pointsToNextLevel = (currentLevel * 100) - totalPoints;
  const progressPercentage = ((totalPoints % 100) / 100) * 100;
  
  // Calculate coin reward based on level (level * 10 coins)
  const getCoinsForLevel = (level: number) => level * 10;
  const currentLevelCoins = getCoinsForLevel(currentLevel);
  const nextLevelCoins = getCoinsForLevel(currentLevel + 1);

  // Check for level up (this would normally be triggered by backend)
  const checkLevelUp = () => {
    const newTotalPoints = totalPoints + 50; // Example: adding 50 points
    const newLevel = Math.floor(newTotalPoints / 100) + 1;
    if (newLevel > currentLevel) {
      setJustLeveledUp(true);
      setShowLevelUpModal(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredActivities = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      switch (selectedPeriod) {
        case 'week':
          return activityDate >= oneWeekAgo;
        case 'month':
          return activityDate >= oneMonthAgo;
        default:
          return true;
      }
    });
  };

  const filteredActivities = getFilteredActivities();

  return (
    <div className="mentor-skillpoints-tab">
      {/* Overview Section */}
      <div className="mentor-skillpoints-overview">
        <div className="mentor-skillpoints-points-summary">
          <div className="mentor-skillpoints-total-points">
            <div className="mentor-skillpoints-points-icon">✨</div>
            <div>
              <h2>{totalPoints}</h2>
              <p>Tổng Điểm Kỹ Năng</p>
              {justLeveledUp && (
                <div className="mentor-skillpoints-level-up-badge">
                  🎉 Vừa lên cấp!
                </div>
              )}
            </div>
          </div>
          
          <div className="mentor-skillpoints-level-info">
            <div className="mentor-skillpoints-level">
              <div className="mentor-skillpoints-level-icon">🏆</div>
              <div>
                <h3>Cấp Độ {currentLevel}</h3>
                <p>{pointsToNextLevel} điểm đến cấp tiếp theo</p>
                <div className="mentor-skillpoints-coin-reward">
                  <span className="mentor-skillpoints-coin-icon">🪙</span>
                  <span className="mentor-skillpoints-coin-text">
                    Hiện tại: {currentLevelCoins} xu | Tiếp theo: {nextLevelCoins} xu
                  </span>
                </div>
              </div>
            </div>
            <div className="mentor-skillpoints-progress-bar">
              <div 
                className="mentor-skillpoints-progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <div className="mentor-skillpoints-progress-text">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>
        </div>

        {/* Level Rewards Card */}
        <div className="mentor-skillpoints-rewards-card">
          <div className="mentor-skillpoints-rewards-header">
            <h3>Phần Thưởng Cấp Độ</h3>
            <span className="mentor-skillpoints-coin-icon">🪙</span>
          </div>
          <div className="mentor-skillpoints-rewards-content">
            <div className="mentor-skillpoints-current-reward">
              <span className="mentor-skillpoints-reward-label">Hiện Tại (Cấp {currentLevel}):</span>
              <span className="mentor-skillpoints-reward-value">+{currentLevelCoins} Coins/Buổi</span>
            </div>
            <div className="mentor-skillpoints-next-reward">
              <span className="mentor-skillpoints-reward-label">Tiếp Theo (Cấp {currentLevel + 1}):</span>
              <span className="mentor-skillpoints-reward-value">+{nextLevelCoins} Coins/Buổi</span>
            </div>
            <p className="mentor-skillpoints-reward-note">
              Tăng cấp để kiếm thêm Coins cho mỗi buổi hướng dẫn hoàn thành!
            </p>
          </div>
        </div>
      </div>

      <div className="mentor-skillpoints-content-grid">
        {/* Badges Section */}
        <div className="mentor-skillpoints-badges-section">
          <div className="mentor-skillpoints-section-header">
            <h3>Huy Hiệu Của Tôi</h3>
            <button className="mentor-skillpoints-view-all-btn">Xem Tất Cả</button>
          </div>
          
          <div className="mentor-skillpoints-badges-grid">
            {badges.map(badge => (
              <div key={badge.id} className="mentor-skillpoints-badge-card">
                <div className="mentor-skillpoints-badge-icon">{badge.icon}</div>
                <div className="mentor-skillpoints-badge-info">
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  <span className="mentor-skillpoints-badge-date">Đạt được: {formatDate(badge.earnedDate)}</span>
                </div>
              </div>
            ))}
            
            {/* Locked Badge Example */}
            <div className="mentor-skillpoints-badge-card locked">
              <div className="mentor-skillpoints-badge-icon">🔒</div>
              <div className="mentor-skillpoints-badge-info">
                <h4>Siêu Mentor</h4>
                <p>Hoàn thành 100 buổi hướng dẫn</p>
                <div className="mentor-skillpoints-badge-progress">
                  <div className="mentor-skillpoints-progress-bar small">
                    <div className="mentor-skillpoints-progress-fill" style={{ width: '15%' }}></div>
                  </div>
                  <span>15/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity History Section */}
        <div className="mentor-skillpoints-activity-section">
          <div className="mentor-skillpoints-section-header">
            <h3>Lịch Sử Hoạt Động</h3>
            <div className="mentor-skillpoints-filter-tabs">
              <button 
                className={`mentor-skillpoints-filter-tab ${selectedPeriod === 'week' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('week')}
              >
                Tuần
              </button>
              <button 
                className={`mentor-skillpoints-filter-tab ${selectedPeriod === 'month' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('month')}
              >
                Tháng
              </button>
              <button 
                className={`mentor-skillpoints-filter-tab ${selectedPeriod === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('all')}
              >
                Tất Cả
              </button>
            </div>
          </div>

          <div className="mentor-skillpoints-activity-list">
            {filteredActivities.length === 0 ? (
              <div className="mentor-skillpoints-no-activities">
                <p>Không tìm thấy hoạt động nào cho khoảng thời gian đã chọn.</p>
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div key={activity.id} className="mentor-skillpoints-activity-item">
                  <div className="mentor-skillpoints-activity-left">
                    <div className="mentor-skillpoints-activity-icon">
                      {activity.points > 50 ? '🌟' : '✨'}
                    </div>
                    <div className="mentor-skillpoints-activity-details">
                      <h4>{activity.activity}</h4>
                      <p>{activity.description}</p>
                      <span className="mentor-skillpoints-activity-date">{formatDate(activity.date)}</span>
                    </div>
                  </div>
                  <div className="mentor-skillpoints-activity-points">
                    +{activity.points} SP
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Demo button to trigger level up modal */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="mentor-skillpoints-demo-btn" onClick={checkLevelUp}>
              Demo: Tăng Điểm & Cấp Độ
            </button>
          </div>
        </div>
      </div>

      {/* Points Guide - Optional, maybe remove or restyle if needed, but I'll keep it out for now to match the new design or add it back if space permits. 
          Actually, the new design has "Rewards Card" in the overview, so maybe we don't need the full guide grid.
          I'll omit the guide grid for now as it wasn't in my generated newString in the previous attempt.
      */}

      {/* Level Up Modal */}
      {showLevelUpModal && (
        <div className="mentor-skillpoints-modal-overlay">
          <div className="mentor-skillpoints-levelup-modal">
            <div className="mentor-skillpoints-levelup-content">
              <div className="mentor-skillpoints-levelup-icon">🎉</div>
              <h2>Chúc Mừng!</h2>
              <h3>Bạn Đã Đạt Cấp Độ {currentLevel + (justLeveledUp ? 1 : 0)}</h3>
              
              <div className="mentor-skillpoints-levelup-rewards">
                <p>Phần Thưởng Mới Đã Mở Khóa:</p>
                <div className="mentor-skillpoints-reward-badge">
                  <span className="mentor-skillpoints-coin-icon">🪙</span>
                  <span>+{getCoinsForLevel(currentLevel + (justLeveledUp ? 1 : 0))} Coins mỗi buổi học</span>
                </div>
              </div>
              
              <button 
                className="mentor-skillpoints-levelup-close-btn"
                onClick={() => {
                  setShowLevelUpModal(false);
                  setJustLeveledUp(false);
                }}
              >
                Tuyệt Vời!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillPointsTab;
