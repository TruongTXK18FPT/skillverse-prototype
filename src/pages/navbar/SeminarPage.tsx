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
  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://685174ec8612b47a2c0a2925.mockapi.io/Seminar')
      .then(res => res.json())
      .then(data => setSeminars(data));
  }, []);

  const handleRegister = (url: string) => {
    window.open(url, '_blank');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/seminar/${id}`);
  };

  const paginatedSeminars = seminars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  return (
    <div className={`seminar-page ${theme}`} data-theme={theme}>
      <h1 className="page-title">Upcoming Seminars</h1>
      <div className="seminar-grid">
        {paginatedSeminars.map(seminar => (
          <div key={seminar.id} className="seminar-card">
            <img src={seminar.backgroundImageUrl} alt={seminar.title} className="seminar-image" />
            <div className="seminar-info">
              <h2>{seminar.title}</h2>
              <p>{seminar.description}</p>
              <p><strong>Date:</strong> {new Date(Number(seminar.date) * 1000).toLocaleDateString()}</p>
              <p><strong>Location:</strong> {seminar.location}</p>
              <div className="seminar-buttons">
                <button onClick={() => handleRegister(seminar.registration)}>Register</button>
                <button onClick={() => handleViewDetails(seminar.id)}>View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination
        totalItems={seminars.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default SeminarPage;
