import React from 'react';
import { TopSpeaker } from '../../types/seminar';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import './briefing-styles.css';

interface BriefingSidebarProps {
  totalSeminars: number;
  activeSeminars: number;
  completedSeminars: number;
  topSpeakers: TopSpeaker[];
  loading: boolean;
  onRefresh: () => void;
}

const BriefingSidebar: React.FC<BriefingSidebarProps> = ({ 
  totalSeminars, 
  activeSeminars,
  completedSeminars,
  topSpeakers,
  loading,
  onRefresh
}) => {
  if (loading) {
    return (
      <aside className="briefing-sidebar">
        <div className="briefing-sidebar-loading">
          <MeowlKuruLoader size="small" text="Đang tải thống kê..." />
        </div>
      </aside>
    );
  }

  return (
    <aside className="briefing-sidebar">
      <button 
        className="briefing-refresh-btn" 
        onClick={onRefresh}
        title="Làm mới thống kê"
      >
        <span className="refresh-icon">↻</span>
      </button>
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
          {topSpeakers.length > 0 ? (
            topSpeakers.map((speaker, index) => (
              <div key={speaker.creatorId} className="speaker-item">
                <span className="speaker-rank">#{index + 1}</span>
                <div className="speaker-info">
                  <div className="speaker-name">{speaker.companyName}</div>
                  <div className="speaker-tickets">{speaker.totalTicketsSold} vé</div>
                </div>
              </div>
            ))
          ) : (
            <div className="briefing-empty-state">
              📊 Chưa có dữ liệu diễn giả
            </div>
          )}
        </div>
      </div>

      {/* Mission Stats */}
      <div className="sidebar-widget sidebar-mission">
        <div className="widget-header"><span className="widget-title">THỐNG KÊ NHIỆM VỤ</span></div>
        <div className="mission-stats">
          <div className="mission-stat"><div className="mission-stat-label">HOÀN THÀNH</div><div className="mission-stat-value">{completedSeminars}</div></div>
          <div className="mission-stat"><div className="mission-stat-label">ĐANG DIỄN RA</div><div className="mission-stat-value">{activeSeminars}</div></div>
        </div>
      </div>
    </aside>
  );
};

export default BriefingSidebar;
