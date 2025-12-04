import React, { useEffect, useMemo, useState } from 'react';
import { SkillPointActivity } from '../../pages/main/MentorPage';
import { getMySkillTab, SkillTabResponseDTO, SkillTabBadgeInfo } from '../../services/mentorProfileService';
import { getMyBookings } from '../../services/bookingService';
import { getUserReviews } from '../../services/portfolioService';
import { getMentorCoursePurchases, CoursePurchaseDTO } from '../../services/courseService';
import './SkillPointsTab.css';
import QuickStatsCard from './QuickStatsCard';

const SkillPointsTab: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillTab, setSkillTab] = useState<SkillTabResponseDTO | null>(null);

  const [activities, setActivities] = useState<SkillPointActivity[]>([]);

  const [badges, setBadges] = useState<SkillTabBadgeInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [skill, bookingsPage, reviews, purchasesPage] = await Promise.all([
          getMySkillTab(),
          getMyBookings(true, 0, 50),
          getUserReviews().catch(() => []),
          getMentorCoursePurchases(0, 50).catch(() => ({ content: [] as CoursePurchaseDTO[] }))
        ]);
        if (!mounted) return;
        setSkillTab(skill);
        setBadges(skill.badges || []);
        const bookingActs: SkillPointActivity[] = (bookingsPage.content || [])
          .filter(b => b.status === 'COMPLETED')
          .map(b => ({
            id: `booking-${b.id}`,
            activity: 'Hoàn Thành Buổi Học',
            points: 20,
            date: b.endTime || b.startTime,
            description: b.learnerName ? `Buổi học với ${b.learnerName}` : 'Buổi học đã hoàn thành'
          }));
        const reviewActs: SkillPointActivity[] = (reviews || [])
          .filter(r => (r.rating || 0) >= 5)
          .map(r => ({
            id: `review-${r.id}`,
            activity: 'Nhận Đánh Giá 5 Sao',
            points: 0,
            date: r.createdAt || new Date().toISOString(),
            description: r.feedback || 'Đánh giá 5 sao'
          }));
        const purchaseActs: SkillPointActivity[] = (purchasesPage.content || [])
          .filter(p => p.status === 'PAID' || p.status === 'CAPTURED' || p.status === 'SUCCESS')
          .map(p => ({
            id: `purchase-${p.id}`,
            activity: 'Bán Khóa Học Thành Công',
            points: 0,
            date: p.purchasedAt,
            description: `Khóa học #${p.courseId}`
          }));
        const merged = [...bookingActs, ...reviewActs, ...purchaseActs]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivities(merged);
      } catch {
        if (!mounted) return;
        setError('Không thể tải SkillTab.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const totalPoints = skillTab?.skillPoints ?? 0;
  const currentLevel = skillTab?.currentLevel ?? Math.floor(totalPoints / 100);
  const pointsToNextLevel = skillTab?.nextLevelPoints ?? Math.max(0, (Math.floor(totalPoints / 100) + 1) * 100 - totalPoints);
  const progressPercentage = useMemo(() => {
    const remainder = totalPoints % 100;
    return (remainder / 100) * 100;
  }, [totalPoints]);
  
  // Calculate coin reward based on level (level * 10 coins)
  const getCoinsForLevel = (level: number) => level * 10;
  const currentLevelCoins = getCoinsForLevel(currentLevel);
  const nextLevelCoins = getCoinsForLevel(currentLevel + 1);

  // Check for level up (this would normally be triggered by backend)
  const checkLevelUp = () => {
    setJustLeveledUp(true);
    setShowLevelUpModal(true);
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
      {loading && (
        <div className="mentor-skillpoints-loading">Đang tải SkillTab...</div>
      )}
      {!!error && (
        <div className="mentor-skillpoints-error">{error}</div>
      )}
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
            <a className="mentor-skillpoints-view-all-btn" href="/mentor/badges">Xem Tất Cả</a>
          </div>
          
          <div className="mentor-skillpoints-badges-grid">
            {badges.map(badge => (
              <div key={badge.code} className={`mentor-skillpoints-badge-card ${badge.earned ? 'earned' : 'locked'}`}>
                <div className="mentor-skillpoints-badge-icon">{mapBadgeIcon(badge.code)}</div>
                <div className="mentor-skillpoints-badge-info">
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  {!badge.earned && (
                    <div className="mentor-skillpoints-badge-progress">
                      <div className="mentor-skillpoints-progress-bar small">
                        <div className="mentor-skillpoints-progress-fill" style={{ width: `${Math.min(100, Math.round((badge.progressCurrent / badge.progressTarget) * 100))}%` }}></div>
                      </div>
                      <span>{badge.progressCurrent}/{badge.progressTarget}</span>
                    </div>
                  )}
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
          <QuickStatsCard
            sessionsCompleted={skillTab?.sessionsCompleted ?? 0}
            fiveStarCount={skillTab?.fiveStarCount ?? 0}
            courseSales={skillTab?.courseSales ?? 0}
            revenueVnd={skillTab?.revenueVnd ?? 0}
          />
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
const mapBadgeIcon = (code: string): string => {
  if (code === 'FIRST_SESSION') return '🎯';
  if (code === 'TEN_SESSIONS') return '📅';
  if (code === 'HUNDRED_SESSIONS') return '🏅';
  if (code === 'FIRST_FIVE_STAR') return '⭐';
  if (code === 'TEN_FIVE_STAR') return '🌟';
  if (code === 'HUNDRED_FIVE_STAR') return '💫';
  if (code === 'FIRST_COURSE_SALE') return '🛒';
  if (code === 'TEN_COURSE_SALES') return '💼';
  if (code === 'HUNDRED_COURSE_SALES') return '🏆';
  return '🔖';
};
