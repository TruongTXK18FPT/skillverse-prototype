import React, { useState, useMemo } from 'react';
import { Radar, Star, Briefcase, DollarSign, User, Crosshair, Search, Filter, ChevronDown } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';
import './fleet-styles.css';

// Redefining interface here to avoid circular dependency or complex imports for now
// In a real refactor, this should be in a shared types file
export interface Freelancer {
  id: string;
  name: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  hourlyRate: number;
  avatar?: string;
}

interface MercenaryRadarProps {
  freelancers: Freelancer[];
}

const MercenaryRadar: React.FC<MercenaryRadarProps> = ({ freelancers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
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
                  <span>${merc.hourlyRate}/giờ</span>
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
                <button className="fleet-btn-secondary">Xem Hồ Sơ</button>
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
    </div>
  );
};

export default MercenaryRadar;
