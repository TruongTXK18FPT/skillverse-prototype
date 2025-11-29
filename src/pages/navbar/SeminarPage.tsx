// pages/SeminarPage.tsx
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import '../../components/seminar-hud/briefing-styles.css';
import HoloPagination from '../../components/mentorship-hud/HoloPagination';
import BriefingHero from '../../components/seminar-hud/BriefingHero';
import BriefingRow from '../../components/seminar-hud/BriefingRow';
import BriefingSidebar from '../../components/seminar-hud/BriefingSidebar';
import FrequencyTuner from '../../components/seminar-hud/FrequencyTuner';
import { useNavigate } from 'react-router-dom';
import MeowGuide from '../../components/MeowlGuide';

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
  const categoryLabels = ['TẤT CẢ', 'CÔNG NGHỆ', 'KINH DOANH', 'THIẾT KẾ'];
  const labelToValue: Record<string, string> = {
    'TẤT CẢ': 'all',
    'CÔNG NGHỆ': 'technology',
    'KINH DOANH': 'business',
    'THIẾT KẾ': 'design'
  };

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

  const handleViewDetails = (id: string) => {
    navigate(`/seminar/${id}`);
  };

  const filteredSeminars = seminars.filter(seminar => {
    const matchesSearch = seminar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seminar.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' ||
                           (typeof seminar.tags === 'string' && seminar.tags.toLowerCase().includes(filterCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const paginatedSeminars = filteredSeminars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  

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
      {/* Mission Control Hero Header */}
      <BriefingHero />

      {/* 2-Column Layout: Feed (75%) + Sidebar (25%) */}
      <div className="briefing-layout-grid">
        {/* Left Column: Main Feed */}
        <div className="briefing-feed">
          {/* Search Section */}
          <div className="briefing-search-container">
            <span className="briefing-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm hội thảo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="briefing-search-input"
            />
          </div>

          {/* Frequency Tuner - Category Filter */}
          <FrequencyTuner
            categories={categoryLabels}
            activeCategory={categoryLabels.find((l) => labelToValue[l] === filterCategory) || 'TẤT CẢ'}
            onCategoryChange={(label) => setFilterCategory(labelToValue[label])}
          />

          {/* Briefing Rows (List) */}
          {filteredSeminars.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">📅</div>
              <h3>Không tìm thấy hội thảo</h3>
              <p>Hãy thử thay đổi từ khóa hoặc chuyên mục</p>
            </div>
          ) : (
            <div className="briefing-list">
              {paginatedSeminars.map((seminar) => (
                <BriefingRow
                  key={seminar.id}
                  seminar={seminar}
                  onAction={handleViewDetails}
                />
              ))}
            </div>
          )}

          {/* HoloPagination */}
          {filteredSeminars.length > itemsPerPage && (
            <div className="pagination-wrapper">
              <HoloPagination
                totalItems={filteredSeminars.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <BriefingSidebar
          totalSeminars={seminars.length}
          activeSeminars={filteredSeminars.length}
        />
      </div>

      <MeowGuide currentPage="seminars" />
    </div>
  );
};

export default SeminarPage;
