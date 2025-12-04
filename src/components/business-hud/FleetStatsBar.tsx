import React from 'react';
import './fleet-styles.css';

interface FleetStatsProps {
  activeOps: number;
  crewCount: number;
  openSlots: number;
}

const FleetStatsBar: React.FC<FleetStatsProps> = ({ activeOps, crewCount, openSlots }) => {
  return (
    <div className="fleet-stats-bar">
      <div className="fleet-stat-card">
        <span className="fleet-stat-value">{activeOps}</span>
        <span className="fleet-stat-label">Chiến Dịch Đang Chạy</span>
      </div>
      <div className="fleet-stat-card">
        <span className="fleet-stat-value">{crewCount}</span>
        <span className="fleet-stat-label">Thành Viên Phi Hành Đoàn</span>
      </div>
      <div className="fleet-stat-card">
        <span className="fleet-stat-value">{openSlots}</span>
        <span className="fleet-stat-label">Vị Trí Còn Trống</span>
      </div>
      {/* Decorative filler to make it look like a dashboard */}
      <div className="fleet-stat-card" style={{ opacity: 0.5 }}>
        <span className="fleet-stat-value" style={{ fontSize: '1.5rem', color: 'var(--fleet-success)' }}>TRỰC TUYẾN</span>
        <span className="fleet-stat-label">Trạng Thái Hệ Thống</span>
      </div>
    </div>
  );
};

export default FleetStatsBar;
