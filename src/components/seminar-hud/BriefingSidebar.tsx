import React from 'react';
import './briefing-styles.css';

interface BriefingSidebarProps {
  totalSeminars: number;
  activeSeminars: number;
}

const BriefingSidebar: React.FC<BriefingSidebarProps> = ({ totalSeminars, activeSeminars }) => {
  return (
    <aside className="briefing-sidebar">
      {/* System Radar Widget */}
      <div className="sidebar-widget sidebar-radar">
        <div className="widget-header"><span className="widget-title">QUÉT RADAR</span><span className="widget-status">HOẠT ĐỘNG</span></div>
        <div className="radar-display">
          <div className="radar-circle radar-outer"></div>
          <div className="radar-circle radar-mid"></div>
          <div className="radar-circle radar-inner"></div>
          <div className="radar-sweep"></div>
          <div className="radar-blip" style={{ top: '30%', left: '60%' }}></div>
          <div className="radar-blip" style={{ top: '70%', left: '40%' }}></div>
          <div className="radar-blip" style={{ top: '50%', left: '80%' }}></div>
        </div>
      </div>

      {/* System Status Widget */}
      <div className="sidebar-widget sidebar-status">
        <div className="widget-header"><span className="widget-title">TRẠNG THÁI HỆ THỐNG</span></div>
        <div className="status-list">
          <div className="status-item"><span className="status-label">TÍN HIỆU:</span><span className="status-value status-green">100%</span></div>
          <div className="status-item"><span className="status-label">KÊNH:</span><span className="status-value status-cyan">{totalSeminars}</span></div>
          <div className="status-item"><span className="status-label">HOẠT ĐỘNG:</span><span className="status-value status-cyan">{activeSeminars}</span></div>
          <div className="status-item"><span className="status-label">THỜI GIAN HOẠT ĐỘNG:</span><span className="status-value status-green">99.9%</span></div>
        </div>
      </div>

      {/* Top Speakers Widget */}
      <div className="sidebar-widget sidebar-speakers">
        <div className="widget-header"><span className="widget-title">DIỄN GIẢ NỔI BẬT</span></div>
        <div className="speakers-list">
          <div className="speaker-item">
            <span className="speaker-rank">#1</span>
            <span className="speaker-name">DR. SARAH CHEN</span>
          </div>
          <div className="speaker-item">
            <span className="speaker-rank">#2</span>
            <span className="speaker-name">PROF. JAMES WRIGHT</span>
          </div>
          <div className="speaker-item">
            <span className="speaker-rank">#3</span>
            <span className="speaker-name">DR. MAYA PATEL</span>
          </div>
          <div className="speaker-item">
            <span className="speaker-rank">#4</span>
            <span className="speaker-name">COL. ALEX MORGAN</span>
          </div>
        </div>
      </div>

      {/* Mission Stats */}
      <div className="sidebar-widget sidebar-mission">
        <div className="widget-header"><span className="widget-title">THỐNG KÊ NHIỆM VỤ</span></div>
        <div className="mission-stats">
          <div className="mission-stat"><div className="mission-stat-label">HOÀN THÀNH</div><div className="mission-stat-value">847</div></div>
          <div className="mission-stat"><div className="mission-stat-label">ĐANG DIỄN RA</div><div className="mission-stat-value">{activeSeminars}</div></div>
        </div>
      </div>
    </aside>
  );
};

export default BriefingSidebar;
