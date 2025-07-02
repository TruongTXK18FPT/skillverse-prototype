import React, { useState } from 'react';
import { Freelancer } from '../../pages/main/BusinessPage';
import './SuggestedFreelancersTab.css';

interface SuggestedFreelancersTabProps {
  freelancers: Freelancer[];
}

const SuggestedFreelancersTab: React.FC<SuggestedFreelancersTabProps> = ({ freelancers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'rate' | 'projects'>('rating');

  // Get all unique skills for filter dropdown
  const allSkills = Array.from(
    new Set(freelancers.flatMap(freelancer => freelancer.skills))
  ).sort((a, b) => a.localeCompare(b));

  // Filter freelancers based on search and skill filter
  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         freelancer.skills.some(skill => 
                           skill.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesSkill = !skillFilter || freelancer.skills.includes(skillFilter);
    return matchesSearch && matchesSkill;
  });

  // Sort filtered freelancers
  const sortedFreelancers = [...filteredFreelancers].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'rate':
        return a.hourlyRate - b.hourlyRate;
      case 'projects':
        return b.completedProjects - a.completedProjects;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="sft-star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="sft-star half">★</span>);
      } else {
        stars.push(<span key={i} className="sft-star empty">☆</span>);
      }
    }
    return stars;
  };

  const handleViewProfile = (freelancer: Freelancer) => {
    // In a real app, this would navigate to the freelancer's profile
    alert(`Xem hồ sơ của ${freelancer.name} sẽ được triển khai tại đây`);
  };

  const handleInviteToJob = (freelancer: Freelancer) => {
    // In a real app, this would open an invitation modal
    alert(`Mời ${freelancer.name} vào công việc sẽ được triển khai tại đây`);
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(rate * 24000) + '/giờ'; // Convert to VND (approximate rate)
  };

  return (
    <div className="sft-suggested-freelancers-tab">
      <div className="sft-tab-header">
        <div className="sft-header-icon">
          <i className="fas fa-users"></i>
        </div>
        <h2>Freelancer Được Đề Xuất</h2>
        <p>Tìm và kết nối với các freelancer hàng đầu cho dự án của bạn</p>
      </div>

      <div className="sft-freelancers-controls">
        <div className="sft-search-section">
          <div className="sft-search-wrapper">
            <i className="fas fa-search sft-search-icon"></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc kỹ năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sft-search-input"
            />
          </div>
        </div>

        <div className="sft-filter-section">
          <div className="sft-filter-wrapper">
            <i className="fas fa-filter sft-filter-icon"></i>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="sft-skill-filter"
            >
              <option value="">Tất cả kỹ năng</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          <div className="sft-sort-wrapper">
            <i className="fas fa-sort sft-sort-icon"></i>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'rate' | 'projects')}
              className="sft-sort-select"
            >
              <option value="rating">Sắp xếp theo đánh giá</option>
              <option value="rate">Sắp xếp theo giá (thấp đến cao)</option>
              <option value="projects">Sắp xếp theo dự án</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sft-results-info">
        <span className="sft-results-count">
          <i className="fas fa-user-friends"></i>
          Tìm thấy {sortedFreelancers.length} freelancer
        </span>
      </div>

      {sortedFreelancers.length === 0 ? (
        <div className="sft-empty-state">
          <div className="sft-empty-icon">🔍</div>
          <h3>Không tìm thấy freelancer</h3>
          <p>Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc để tìm thêm freelancer.</p>
        </div>
      ) : (
        <div className="sft-freelancers-grid">
          {sortedFreelancers.map((freelancer, index) => (
            <div 
              key={freelancer.id} 
              className="sft-freelancer-card"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="sft-card-header">
                <div className="sft-freelancer-avatar">
                  {freelancer.avatar ? (
                    <img src={freelancer.avatar} alt={freelancer.name} />
                  ) : (
                    <div className="sft-avatar-placeholder">
                      {freelancer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="sft-online-indicator"></div>
                </div>
                <div className="sft-freelancer-info">
                  <h3 className="sft-freelancer-name">{freelancer.name}</h3>
                  <div className="sft-rating-section">
                    <div className="sft-stars">
                      {renderStars(freelancer.rating)}
                    </div>
                    <span className="sft-rating-value">({freelancer.rating})</span>
                  </div>
                </div>
              </div>

              <div className="sft-card-body">
                <div className="sft-top-skills">
                  <h4><i className="fas fa-star"></i> Kỹ năng hàng đầu</h4>
                  <div className="sft-skills-list">
                    {freelancer.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="sft-skill-badge">
                        {skill}
                      </span>
                    ))}
                    {freelancer.skills.length > 4 && (
                      <span className="sft-skill-badge more-skills">
                        +{freelancer.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="sft-freelancer-stats">
                  <div className="sft-stat-item">
                    <div className="sft-stat-icon">
                      <i className="fas fa-project-diagram"></i>
                    </div>
                    <span className="sft-stat-value">{freelancer.completedProjects}</span>
                    <span className="sft-stat-label">Dự án</span>
                  </div>
                  <div className="sft-stat-item">
                    <div className="sft-stat-icon">
                      <i className="fas fa-coins"></i>
                    </div>
                    <span className="sft-stat-value">{formatRate(freelancer.hourlyRate)}</span>
                    <span className="sft-stat-label">Giá theo giờ</span>
                  </div>
                </div>
              </div>

              <div className="sft-card-actions">
                <button
                  className="sft-action-btn sft-view-profile-btn"
                  onClick={() => handleViewProfile(freelancer)}
                >
                  <i className="fas fa-user"></i>{' '}
                  Xem hồ sơ
                </button>
                <button
                  className="sft-action-btn sft-invite-btn"
                  onClick={() => handleInviteToJob(freelancer)}
                >
                  <i className="fas fa-envelope"></i>{' '}
                  Mời vào công việc
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestedFreelancersTab;
