import React from 'react';
import './QuickStatsCard.css';

type Props = {
  sessionsCompleted: number;
  fiveStarCount: number;
  courseSales: number;
  revenueVnd: number;
};

const QuickStatsCard: React.FC<Props> = ({ sessionsCompleted, fiveStarCount, courseSales, revenueVnd }) => {
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  return (
    <div className="quickstats">
      <div className="quickstats__item">
        <div className="quickstats__icon">📚</div>
        <div className="quickstats__label">Buổi mentoring</div>
        <div className="quickstats__value">{fmt(sessionsCompleted)}</div>
      </div>
      <div className="quickstats__item">
        <div className="quickstats__icon">⭐</div>
        <div className="quickstats__label">Đánh giá 5 sao</div>
        <div className="quickstats__value">{fmt(fiveStarCount)}</div>
      </div>
      <div className="quickstats__item">
        <div className="quickstats__icon">🛒</div>
        <div className="quickstats__label">Khóa học bán</div>
        <div className="quickstats__value">{fmt(courseSales)}</div>
      </div>
      <div className="quickstats__item">
        <div className="quickstats__icon">₫</div>
        <div className="quickstats__label">Doanh thu</div>
        <div className="quickstats__value">{fmt(revenueVnd)}</div>
      </div>
    </div>
  );
};

export default QuickStatsCard;
