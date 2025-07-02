// pages/SeminarPage.tsx
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/SeminarPage.css';
import Pagination from '../../components/Pagination';
import { useNavigate } from 'react-router-dom';

interface Seminar {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  schedule: string;
  speakers: string;
  registration: string;
  tags: string;
  sponsors: string;
  backgroundImageUrl: string;
}

const SeminarPage: React.FC = () => {
  const { theme } = useTheme();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch('https://685174ec8612b47a2c0a2925.mockapi.io/Seminar')
      .then(res => res.json())
      .then(data => {
        setSeminars(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRegister = (url: string) => {
    window.open(url, '_blank');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/seminar/${id}`);
  };

  const filteredSeminars = seminars.filter(seminar => {
    const matchesSearch = seminar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seminar.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || seminar.tags?.toLowerCase().includes(filterCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const paginatedSeminars = filteredSeminars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time ? `${time}:00` : '';
  };

  if (loading) {
    return (
      <div className={`seminar-page ${theme}`} data-theme={theme}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin seminar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`seminar-page ${theme}`} data-theme={theme}>
      {/* Hero Section */}
      <div className="seminar-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="seminar-hero-icon">🎓</span>
            {' '}Khám Phá Các Seminar Hấp Dẫn
          </h1>
          <p className="hero-description">
            Tham gia những buổi seminar chất lượng cao, học hỏi từ các chuyên gia hàng đầu
          </p>
          <div className="hero-stats">
            <div className="seminar-stat-item">
              <span className="stat-number">{seminars.length}</span>
              <span className="seminar-stat-label">Seminars</span>
            </div>
            <div className="seminar-stat-item">
              <span className="stat-number">100+</span>
              <span className="seminar-stat-label">Diễn giả</span>
            </div>
            <div className="seminar-stat-item">
              <span className="stat-number">5000+</span>
              <span className="seminar-stat-label">Người tham gia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm seminar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Tất cả
          </button>
          <button 
            className={`filter-btn ${filterCategory === 'technology' ? 'active' : ''}`}
            onClick={() => setFilterCategory('technology')}
          >
            Công nghệ
          </button>
          <button 
            className={`filter-btn ${filterCategory === 'business' ? 'active' : ''}`}
            onClick={() => setFilterCategory('business')}
          >
            Kinh doanh
          </button>
          <button 
            className={`filter-btn ${filterCategory === 'design' ? 'active' : ''}`}
            onClick={() => setFilterCategory('design')}
          >
            Thiết kế
          </button>
        </div>
      </div>

      {/* Seminars Grid */}
      <div className="seminars-section">
        <div className="section-header">
          <h2 className="section-title">
            Seminars Sắp Diễn Ra
            {' '}<span className="results-count">({filteredSeminars.length} kết quả)</span>
          </h2>
        </div>

        {filteredSeminars.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">📅</div>
            <h3>Không tìm thấy seminar phù hợp</h3>
            <p>Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc của bạn</p>
          </div>
        ) : (
          <div className="seminar-grid">
            {paginatedSeminars.map((seminar, index) => (
              <div 
                key={seminar.id} 
                className="seminar-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-image-wrapper">
                  <img 
                    src={seminar.backgroundImageUrl} 
                    alt={seminar.title} 
                    className="seminar-image" 
                  />
                  <div className="image-overlay">
                    <span className="seminar-category">
                      {seminar.tags || 'Chung'}
                    </span>
                  </div>
                </div>
                
                <div className="seminar-info">
                  <div className="seminar-header">
                    <h3 className="seminar-title">{seminar.title}</h3>
                    <p className="seminar-description">{seminar.description}</p>
                  </div>
                  
                  <div className="seminar-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">{formatDate(seminar.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span className="detail-text">
                        {formatTime(seminar.startTime)} - {formatTime(seminar.endTime)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">{seminar.location}</span>
                    </div>
                    {seminar.organizer && (
                      <div className="detail-item">
                        <span className="detail-icon">🎯</span>
                        <span className="detail-text">{seminar.organizer}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="seminar-actions">
                    <button 
                      className="btn btn-primary"
                      // onClick={() => handleRegister(seminar.registration)}
                    >
                      <span className="btn-icon">✨</span>
                      {' '}Đăng ký ngay
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleViewDetails(seminar.id)}
                    >
                      <span className="btn-icon">👁️</span>
                      {' '}Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredSeminars.length > itemsPerPage && (
        <div className="pagination-wrapper">
          <Pagination
            totalItems={filteredSeminars.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default SeminarPage;
