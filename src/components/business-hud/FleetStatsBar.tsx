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
        <span className="fleet-stat-label">Active Operations</span>
      </div>
      <div className="fleet-stat-card">
        <span className="fleet-stat-value">{crewCount}</span>
        <span className="fleet-stat-label">Crew Members</span>
      </div>
      <div className="fleet-stat-card">
        <span className="fleet-stat-value">{openSlots}</span>
        <span className="fleet-stat-label">Open Slots</span>
      </div>
      {/* Decorative filler to make it look like a dashboard */}
      <div className="fleet-stat-card" style={{ opacity: 0.5 }}>
        <span className="fleet-stat-value" style={{ fontSize: '1.5rem', color: 'var(--fleet-success)' }}>ONLINE</span>
        <span className="fleet-stat-label">System Status</span>
      </div>
    </div>
  );
};

export default FleetStatsBar;
