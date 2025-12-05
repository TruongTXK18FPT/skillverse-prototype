import React, { useEffect, useMemo, useState } from 'react';
import { SkillPointActivity } from '../../pages/main/MentorPage';
import { getMySkillTab, SkillTabResponseDTO, SkillTabBadgeInfo } from '../../services/mentorProfileService';
import { getMyBookings } from '../../services/bookingService';
import { getUserReviews } from '../../services/portfolioService';
import { getMentorCoursePurchases, CoursePurchaseDTO } from '../../services/courseService';
import './SkillPointsTab.css';
import PowerCoreConsole from '../profile-hud/gamification/PowerCoreConsole';
import UniversalBadge from '../profile-hud/gamification/UniversalBadge';
import '../profile-hud/gamification/cmd-game-styles.css';

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
    const loadAll = async (isFirstLoad = false) => {
      if (isFirstLoad) setLoading(true);
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
        if (mounted && isFirstLoad) {
          setLoading(false);
        }
      }
    };
    loadAll(true);
    const interval = setInterval(() => loadAll(false), 30000);
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

  if (loading) return <div className="p-4 text-white" style={{ fontFamily: 'var(--cmd-game-font-mono)' }}>INITIALIZING POWER CORE...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="skill-points-tab">
      <PowerCoreConsole
        totalPoints={totalPoints}
        currentLevel={currentLevel}
        nextLevelPoints={pointsToNextLevel}
        progressPercentage={progressPercentage}
        stats={[
          { label: 'SESSIONS', value: skillTab?.sessionsCompleted || 0 },
          { label: '5-STAR REVIEWS', value: skillTab?.fiveStarCount || 0 },
          { label: 'COURSE SALES', value: skillTab?.courseSales || 0 },
          { label: 'REVENUE (VND)', value: (skillTab?.revenueVnd || 0).toLocaleString() }
        ]}
      />

      {/* Level Rewards Section */}
      <div className="cmd-game-rewards-panel">
        <div className="cmd-game-section-header" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
          <h3 className="cmd-game-section-title" style={{ fontSize: '1.2rem' }}>LEVEL REWARDS</h3>
          <span style={{ fontSize: '1.5rem' }}>🪙</span>
        </div>
        <div className="cmd-game-reward-row">
          <span className="cmd-game-reward-label">Current (Level {currentLevel}):</span>
          <span className="cmd-game-reward-value">+{currentLevelCoins} Coins/Session</span>
        </div>
        <div className="cmd-game-reward-row">
          <span className="cmd-game-reward-label">Next (Level {currentLevel + 1}):</span>
          <span className="cmd-game-reward-value" style={{ color: 'var(--cmd-game-accent-cyan)' }}>+{nextLevelCoins} Coins/Session</span>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--cmd-game-text-dim)', fontStyle: 'italic' }}>
          * Increase your rank to earn more coins per completed session.
        </div>
      </div>

      {/* Badges Preview Section */}
      <div className="cmd-game-section">
        <div className="cmd-game-section-header">
          <h3 className="cmd-game-section-title">MY BADGES</h3>
          <a href="/mentor/badges" className="cmd-game-link-btn">VIEW ALL</a>
        </div>
        
        <div className="cmd-game-badges-preview">
          {badges.slice(0, 4).map(badge => (
            <UniversalBadge
              key={badge.code}
              size="sm"
              data={{
                id: badge.code,
                name: badge.name,
                description: badge.description,
                iconUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(badge.name)}&background=0a0f1c&color=00f0ff&length=1`,
                rarity: 'COMMON',
                isUnlocked: badge.earned,
                progressCurrent: badge.progressCurrent,
                progressTarget: badge.progressTarget
              }}
            />
          ))}
          {badges.length === 0 && (
            <div className="cmd-game-empty-state">No badges acquired yet.</div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="cmd-game-section">
        <div className="cmd-game-section-header">
          <h3 className="cmd-game-section-title">ACTIVITY LOG</h3>
          
          <div className="cmd-game-filter-tabs">
            {(['week', 'month', 'all'] as const).map(period => (
              <button 
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`cmd-game-filter-btn ${selectedPeriod === period ? 'active' : ''}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="cmd-game-activity-list">
          {filteredActivities.slice(0, 10).map(act => (
            <div key={act.id} className="cmd-game-activity-item">
              <div className="cmd-game-activity-left">
                <div className="cmd-game-activity-icon">{act.points > 0 ? '⚡' : '💠'}</div>
                <div>
                  <div className="cmd-game-activity-title">{act.activity}</div>
                  <div className="cmd-game-activity-desc">{act.description}</div>
                </div>
              </div>
              <div className="cmd-game-activity-right">
                <div className="cmd-game-activity-points">+{act.points} PTS</div>
                <div className="cmd-game-activity-date">{formatDate(act.date)}</div>
              </div>
            </div>
          ))}
          {filteredActivities.length === 0 && (
            <div className="cmd-game-empty-state">No recent activity detected in this sector.</div>
          )}
        </div>
      </div>

      {/* Level Up Modal */}
      {showLevelUpModal && (
        <div className="mentor-skillpoints-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--cmd-game-bg-dark)',
            border: '2px solid var(--cmd-game-accent-gold)',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)',
            position: 'relative'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--cmd-game-font-header)', color: 'var(--cmd-game-accent-gold)', fontSize: '2rem', marginBottom: '0.5rem' }}>
              RANK PROMOTION!
            </h2>
            <h3 style={{ color: 'var(--cmd-game-text-white)', marginBottom: '1.5rem' }}>
              LEVEL {currentLevel + (justLeveledUp ? 1 : 0)} ACHIEVED
            </h3>
            
            <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '1rem', border: '1px dashed var(--cmd-game-accent-gold)', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--cmd-game-accent-gold)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>New Clearance Level Unlocked</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--cmd-game-text-white)' }}>
                <span>🪙</span>
                <span>+{getCoinsForLevel(currentLevel + (justLeveledUp ? 1 : 0))} Coins / Session</span>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setShowLevelUpModal(false);
                setJustLeveledUp(false);
              }}
              style={{
                background: 'var(--cmd-game-accent-gold)',
                color: '#000',
                border: 'none',
                padding: '0.8rem 2rem',
                fontFamily: 'var(--cmd-game-font-header)',
                fontWeight: 'bold',
                cursor: 'pointer',
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
              }}
            >
              ACKNOWLEDGE
            </button>
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
