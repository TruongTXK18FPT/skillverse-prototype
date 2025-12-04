import React from 'react';
import { LayoutDashboard, PlusCircle, Users } from 'lucide-react';
import './fleet-styles.css';

interface FleetHeaderProps {
  activeTab: 'dashboard' | 'mission' | 'radar';
  onTabChange: (tab: 'dashboard' | 'mission' | 'radar') => void;
}

const FleetHeader: React.FC<FleetHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fleet-header-banner">
      <div className="fleet-header-content">
        <h1 className="fleet-header-title">
          <LayoutDashboard size={32} style={{ marginRight: '15px' }} />
          TRUNG TÂM ĐIỀU HÀNH DOANH NGHIỆP
        </h1>
        <p className="fleet-header-subtitle">
          HỆ THỐNG: TRỰC TUYẾN // KHU VỰC: DOANH NGHIỆP // CẤP ĐỘ: CHỈ HUY
        </p>
        
        <div className="fleet-nav-tabs">
          <button 
            className={`fleet-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>TỔNG QUAN</span>
          </button>
          <button 
            className={`fleet-nav-btn ${activeTab === 'mission' ? 'active' : ''}`}
            onClick={() => onTabChange('mission')}
          >
            <PlusCircle size={18} />
            <span>ĐĂNG TUYỂN DỤNG</span>
          </button>
          <button 
            className={`fleet-nav-btn ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => onTabChange('radar')}
          >
            <Users size={18} />
            <span>TÌM KIẾM ỨNG VIÊN</span>
          </button>
        </div>
      </div>
      <div className="fleet-header-decoration"></div>
    </div>
  );
};

export default FleetHeader;
