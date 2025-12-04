import React from 'react';
import './BadgeCard.css';

type Props = {
  code: string;
  name: string;
  description: string;
  progressCurrent: number;
  progressTarget: number;
  earned: boolean;
};

const iconFor = (code: string): string => {
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

const BadgeCard: React.FC<Props> = ({ code, name, description, progressCurrent, progressTarget, earned }) => {
  const pct = Math.min(100, Math.round((progressCurrent / Math.max(1, progressTarget)) * 100));
  return (
    <div className={`badgecard ${earned ? 'earned' : 'locked'}`}>
      <div className="badgecard__icon">{iconFor(code)}</div>
      <div className="badgecard__content">
        <div className="badgecard__title">{name}</div>
        <div className="badgecard__desc">{description}</div>
        {!earned && (
          <div className="badgecard__progress">
            <div className="badgecard__bar"><div className="badgecard__fill" style={{ width: `${pct}%` }} /></div>
            <div className="badgecard__counter">{progressCurrent}/{progressTarget}</div>
          </div>
        )}
        {earned && (
          <div className="badgecard__earned">Đã đạt</div>
        )}
      </div>
    </div>
  );
};

export default BadgeCard;
