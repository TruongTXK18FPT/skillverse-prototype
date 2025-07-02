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
    <div className="spt-skillpoints-tab">
      {/* Points Overview */}
      <div className="spt-overview">
        <div className="spt-points-summary">
          <div className="spt-total-points">
            <span className="spt-points-icon">🪙</span>
            <div>
              <h2>{totalPoints}</h2>
              <p>Tổng Điểm Kỹ Năng</p>
              {justLeveledUp && (
                <div className="spt-level-up-badge">
                  🎉 Vừa lên cấp!
                </div>
              )}
            </div>
          </div>
          
          <div className="spt-level-info">
            <div className="spt-level">
              <span className="spt-level-icon">🏆</span>
              <div>
                <h3>Cấp {currentLevel}</h3>
                <p>{pointsToNextLevel} điểm để lên cấp tiếp theo</p>
                <div className="spt-coin-reward">
                  <span className="spt-coin-icon">🪙</span>
                  <span className="spt-coin-text">
                    Hiện tại: {currentLevelCoins} xu | Tiếp theo: {nextLevelCoins} xu
                  </span>
                </div>
              </div>
            </div>
            
            <div className="spt-progress-bar">
              <div 
                className="spt-progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <div className="spt-progress-text">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="spt-badges-section">
          <h3>Thành Tích</h3>
          <div className="spt-badges-grid">
            {badges.map((badge) => (
              <div key={badge.id} className="spt-badge">
                <div className="spt-badge-icon">{badge.icon}</div>
                <div className="spt-badge-info">
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  <span className="spt-badge-date">
                    Đạt được {formatDate(badge.earnedDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activities Section */}
      <div className="spt-activities-section">
        <div className="spt-activities-header">
          <h3>Hoạt Động Gần Đây</h3>
          <div className="spt-period-filter">
            <button
              className={`spt-period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              Tuần Này
            </button>
            <button
              className={`spt-period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Tháng Này
            </button>
            <button
              className={`spt-period-btn ${selectedPeriod === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('all')}
            >
              Tất Cả
            </button>
          </div>
        </div>

        <div className="spt-activities-list">
          {filteredActivities.length === 0 ? (
            <div className="spt-no-activities">
              <p>Không tìm thấy hoạt động nào cho khoảng thời gian đã chọn.</p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="spt-activity-item">
                <div className="spt-activity-content">
                  <div className="spt-activity-main">
                    <h4>{activity.activity}</h4>
                    <p>{activity.description}</p>
                  </div>
                  <div className="spt-activity-meta">
                    <span className="spt-activity-points">+{activity.points}</span>
                    <span className="spt-activity-date">{formatDate(activity.date)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Points Guide */}
      <div className="spt-guide-section">
        <h3>Cách Kiếm Điểm Kỹ Năng</h3>
        <div className="spt-guide-grid">
          <div className="spt-guide-item">
            <span className="spt-guide-icon">📚</span>
            <div>
              <h4>Hoàn Thành Buổi Học</h4>
              <p>50 điểm cho mỗi buổi học hoàn thành</p>
            </div>
          </div>
          <div className="spt-guide-item">
            <span className="spt-guide-icon">⭐</span>
            <div>
              <h4>Nhận Đánh Giá</h4>
              <p>25 điểm cho mỗi đánh giá 5 sao</p>
            </div>
          </div>
          <div className="spt-guide-item">
            <span className="spt-guide-icon">🎯</span>
            <div>
              <h4>Mục Tiêu Hàng Tuần</h4>
              <p>75 điểm khi hoàn thành 5+ buổi học mỗi tuần</p>
            </div>
          </div>
          <div className="spt-guide-item">
            <span className="spt-guide-icon">🏆</span>
            <div>
              <h4>Thành Công Của Học Viên</h4>
              <p>150 điểm khi học viên vượt qua chứng chỉ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Up Modal */}
      {showLevelUpModal && (
        <div className="spt-modal-overlay">
          <div className="spt-modal-content spt-levelup-modal">
            <div className="spt-levelup-animation">
              <div className="spt-levelup-icon">🎉</div>
              <h2>LÊN CẤP!</h2>
              <div className="spt-levelup-details">
                <div className="spt-new-level">Cấp {currentLevel}</div>
                <div className="spt-coin-reward-display">
                  <span className="spt-coin-icon-large">🪙</span>
                  <span className="spt-coin-amount">+{currentLevelCoins} Xu</span>
                </div>
                <p>Chúc mừng! Bạn đã kiếm được {currentLevelCoins} xu khi đạt Cấp {currentLevel}!</p>
              </div>
              <div className="spt-levelup-actions">
                <button 
                  className="spt-levelup-btn"
                  onClick={() => {
                    setShowLevelUpModal(false);
                    setJustLeveledUp(false);
                  }}
                >
                  Tuyệt vời! 🚀
                </button>
                <button 
                  className="spt-test-levelup-btn"
                  onClick={checkLevelUp}
                >
                  Thử Lên Cấp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillPointsTab;
