import React, { useState, useMemo } from 'react';
import { Radar, Star, Briefcase, DollarSign, User, Crosshair, Search, Filter, ChevronDown } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';
import { FreelancerCardDisplay } from '../../data/portfolioDTOs';
import './fleet-styles.css';

interface MercenaryRadarProps {
  freelancers?: FreelancerCardDisplay[]; // Optional now
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

const MercenaryRadar: React.FC<MercenaryRadarProps> = ({ freelancers = [], pagination }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('Tất cả');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useClickOutside<HTMLDivElement>(() => {
    setIsDropdownOpen(false);
  });

  // Extract all unique skills for the filter
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    freelancers.forEach(f => f.skills.forEach(s => skills.add(s)));
    return ['Tất cả', ...Array.from(skills).sort()];
  }, [freelancers]);

  // Filter freelancers
  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(merc => {
      const matchesSearch = merc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSkill = selectedSkill === 'Tất cả' || merc.skills.includes(selectedSkill);
      return matchesSearch && matchesSkill;
    });
  }, [freelancers, searchTerm, selectedSkill]);

  const handleViewProfile = (merc: FreelancerCardDisplay) => {
    const url = merc.customUrlSlug 
      ? `/portfolio/${merc.customUrlSlug}` 
      : `/portfolio/profile/${merc.id}`;
    window.open(url, '_blank');
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rate);
  };

  // If no freelancers provided, show loading or empty state
  if (freelancers.length === 0) {
    return (
      <div className="fleet-panel">
        <div className="fleet-header-row">
          <div className="fleet-title">
            <Radar size={24} />
            Radar Nhân Tài
          </div>
        </div>
        <div className="fleet-no-results">
          <p>Đang tìm kiếm ứng viên... (Chưa có dữ liệu)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fleet-panel">
      <div className="fleet-header-row">
        <div className="fleet-title">
          <Radar size={24} />
          Radar Nhân Tài
        </div>
        
        <div className="fleet-filter-bar">
          <div className="fleet-search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân tài..." 
              className="fleet-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="fleet-filter-wrapper" ref={dropdownRef}>
            <Filter size={16} className="filter-icon" />
            <div 
              className={`fleet-custom-select ${isDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{selectedSkill}</span>
              <ChevronDown size={14} className={`dropdown-arrow ${isDropdownOpen ? 'rotate' : ''}`} />
            </div>
            
            {isDropdownOpen && (
              <div className="fleet-dropdown-menu">
                {allSkills.map(skill => (
                  <div 
                    key={skill} 
                    className={`fleet-dropdown-item ${selectedSkill === skill ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSkill(skill);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="fleet-radar-grid">
        {filteredFreelancers.length > 0 ? (
          filteredFreelancers.map((merc) => (
            <div key={merc.id} className="fleet-merc-card-detailed">
              <div className="merc-card-header">
                <div className="merc-avatar-large">
                  {merc.avatar ? (
                    <img src={merc.avatar} alt={merc.name} />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div className="merc-header-info">
                  <h3 className="merc-name">{merc.name}</h3>
                  <div className="merc-rating">
                    <Star size={14} className="star-icon filled" fill="currentColor" />
                    <span>{merc.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="merc-card-stats">
                <div className="merc-stat-simple">
                  <DollarSign size={16} className="stat-icon-simple" />
                  <span>{formatRate(merc.hourlyRate)}/giờ</span>
                </div>
                <div className="merc-stat-simple">
                  <Briefcase size={16} className="stat-icon-simple" />
                  <span>{merc.completedProjects} Dự án</span>
                </div>
              </div>

              <div className="merc-skills-section">
                <div className="merc-skills-list">
                  {merc.skills.map(skill => (
                    <span key={skill} className="fleet-chip">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="merc-card-actions">
                <button className="fleet-btn-secondary" onClick={() => handleViewProfile(merc)}>Xem Hồ Sơ</button>
                <button className="fleet-btn-primary-small">
                  <Crosshair size={16} /> Chiêu Mộ
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="fleet-no-results">
            <p>Không tìm thấy nhân tài phù hợp.</p>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="fleet-pagination">
          <button
            className="fleet-pagination-btn"
            disabled={pagination.page === 0}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
          >
            &lt; Trước
          </button>
          <span className="fleet-pagination-info">
            Trang {pagination.page + 1} / {pagination.totalPages}
          </span>
          <button
            className="fleet-pagination-btn"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
          >
            Sau &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default MercenaryRadar;
