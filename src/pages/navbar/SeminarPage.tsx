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
      {/* Mission Control Hero Header */}
      <BriefingHero
        totalSeminars={seminars.length}
        activeSeminars={filteredSeminars.length}
        totalParticipants={5000}
      />

      {/* 2-Column Layout: Feed (75%) + Sidebar (25%) */}
      <div className="briefing-layout-grid">
        {/* Left Column: Main Feed */}
        <div className="briefing-feed">
          {/* Search Section */}
          <div className="briefing-search-container">
            <span className="briefing-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search Intel Briefings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="briefing-search-input"
            />
          </div>

          {/* Frequency Tuner - Category Filter */}
          <FrequencyTuner
            categories={['ALL', 'TECHNOLOGY', 'BUSINESS', 'DESIGN']}
            activeCategory={filterCategory.toUpperCase()}
            onCategoryChange={(category) => setFilterCategory(category.toLowerCase())}
          />

          {/* Briefing Rows (List) */}
          {filteredSeminars.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">📅</div>
              <h3>No Intel Briefings Found</h3>
              <p>Try adjusting your search parameters or frequency selection</p>
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
