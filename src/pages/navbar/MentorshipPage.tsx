import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MessageCircle, Calendar, Clock, DollarSign, Award,
  Briefcase, Book, Globe, Heart, Filter, Search, ChevronRight,
  CheckCircle, User, Send
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination';
import '../../styles/MentorshipPage.css';

interface Mentor {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  expertise: string[];
  languages: string[];
  availability: string;
  experience: string;
  bio: string;
  avatar: string;
  badges: string[];
  isFavorite: boolean;
}

const MentorshipPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { translations } = useLanguage();
  const navigate = useNavigate();

  const mentorsPerPage = 6;

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      // Fetch from MockAPI
      const response = await fetch('https://685159d58612b47a2c09b031.mockapi.io/mentorship');
      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedMentors = data.map((mentor: any) => ({
        id: mentor.id,
        name: mentor.name || 'Anonymous Mentor',
        title: mentor.title || 'Professional Mentor',
        rating: mentor.rating || (Math.random() * 2 + 3).toFixed(1),
        reviews: mentor.reviews || Math.floor(Math.random() * 200 + 50),
        hourlyRate: mentor.hourlyRate || Math.floor(Math.random() * 100 + 50),
        expertise: mentor.expertise || ['General'],
        languages: mentor.languages || ['English'],
        availability: mentor.availability || 'Flexible',
        experience: mentor.experience || '5+ years',
        bio: mentor.bio || 'Experienced professional ready to help you grow.',
        avatar: mentor.avatar || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=400`,
        badges: mentor.badges || ['Verified'],
        isFavorite: false
      }));
      
      setMentors(transformedMentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      // Fallback to mock data
      setMentors(mockMentors);
    } finally {
      setLoading(false);
    }
  };

  // Mock data as fallback
  const mockMentors: Mentor[] = [
    {
      id: '1',
      name: "Dr. Sarah Johnson",
      title: translations.mentorship.roles.seniorFrontend,
      rating: 4.9,
      reviews: 128,
      hourlyRate: 120,
      expertise: ["React", "Vue.js", "TypeScript", "UI/UX Design"],
      languages: [translations.common.languages.english, translations.common.languages.spanish],
      availability: translations.mentorship.availability.weekdays,
      experience: "12+ years",
      bio: translations.mentorship.bios.frontend,
      avatar: "https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: [translations.mentorship.badges.topRated, translations.mentorship.badges.proMentor, translations.mentorship.badges.googleExpert],
      isFavorite: false
    },
    {
      id: '2',
      name: "Michael Chen",
      title: translations.mentorship.roles.leadBackend,
      rating: 4.8,
      reviews: 95,
      hourlyRate: 150,
      expertise: ["Node.js", "Python", "AWS", "System Design"],
      languages: [translations.common.languages.english, translations.common.languages.mandarin],
      availability: translations.mentorship.availability.weekends,
      experience: "10+ years",
      bio: translations.mentorship.bios.backend,
      avatar: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: [translations.mentorship.badges.awsCertified, translations.mentorship.badges.systemDesign],
      isFavorite: true
    }
  ];

  const categories = [
    { id: 'all', name: translations.mentorship.categories.all, count: mentors.length },
    { id: 'frontend', name: translations.mentorship.categories.frontend, count: Math.floor(mentors.length * 0.3) },
    { id: 'backend', name: translations.mentorship.categories.backend, count: Math.floor(mentors.length * 0.25) },
    { id: 'fullstack', name: translations.mentorship.categories.fullstack, count: Math.floor(mentors.length * 0.2) },
    { id: 'mobile', name: translations.mentorship.categories.mobile, count: Math.floor(mentors.length * 0.15) },
    { id: 'devops', name: translations.mentorship.categories.devops, count: Math.floor(mentors.length * 0.1) }
  ];

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentor.expertise.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                           mentor.expertise.some(skill => 
                             skill.toLowerCase().includes(selectedCategory.toLowerCase())
                           );
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredMentors.length / mentorsPerPage);
  const startIndex = (currentPage - 1) * mentorsPerPage;
  const currentMentors = filteredMentors.slice(startIndex, startIndex + mentorsPerPage);

  const handleBookSession = (mentor: Mentor) => {
    // Navigate to payment page with mentor data
    navigate('/payment', {
      state: {
        type: 'mentorship',
        title: `Buổi hướng dẫn với ${mentor.name}`,
        price: mentor.hourlyRate * 23000, // Convert USD to VND
        instructor: mentor.name
      }
    });
  };

  return (
    <div className="mentorship-container">
      <div className="mentorship-content">
        {/* Header */}
        <div className="mentorship-header">
          <h1 className="mentorship-title">{translations.mentorship.title}</h1>
          <p className="mentorship-description">
            {translations.mentorship.description}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="search-section">
            <input
              type="text"
              placeholder={translations.mentorship.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
        </div>

        {/* Categories */}
        <div className="categories-list">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setCurrentPage(1);
              }}
              className={`category-button ${
                selectedCategory === category.id ? 'active' : ''
              }`}
            >
              <span>{category.name}</span>
              <span className="category-count">({category.count})</span>
            </button>
          ))}
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách mentor...</p>
          </div>
        ) : (
          <div className="mentors-grid">
            {currentMentors.map((mentor) => (
              <div key={mentor.id} className="mentor-card">
                <div className="mentor-header">
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="mentor-avatar"
                  />
                  <button
                    className={`favorite-button ${mentor.isFavorite ? 'active' : ''}`}
                  >
                    <Heart className="heart-icon" />
                  </button>
                </div>

                <div className="mentor-info">
                  <h3 className="mentor-name">{mentor.name}</h3>
                  <p className="mentor-title">{mentor.title}</p>

                  <div className="mentor-rating">
                    <Star className="star-icon" />
                    <span>{mentor.rating}</span>
                    <span className="review-count">
                      ({mentor.reviews} {translations.common.reviews})
                    </span>
                  </div>

                  <div className="mentor-badges">
                    {mentor.badges.map((badge, index) => (
                      <span key={index} className="badge">
                        <Award className="badge-icon" />
                        {badge}
                      </span>
                    ))}
                  </div>

                  <div className="mentor-details">
                    <div className="detail-item">
                      <Briefcase className="detail-icon" />
                      <span>{mentor.experience}</span>
                    </div>
                    <div className="detail-item">
                      <DollarSign className="detail-icon" />
                      <span>${mentor.hourlyRate}/{translations.common.hour}</span>
                    </div>
                    <div className="detail-item">
                      <Globe className="detail-icon" />
                      <span>{mentor.languages.join(", ")}</span>
                    </div>
                    <div className="detail-item">
                      <Clock className="detail-icon" />
                      <span>{mentor.availability}</span>
                    </div>
                  </div>

                  <div className="mentor-expertise">
                    <h4>{translations.mentorship.expertise}</h4>
                    <div className="expertise-tags">
                      {mentor.expertise.map((skill, index) => (
                        <span key={index} className="expertise-tag">
                          <CheckCircle className="tag-icon" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="mentor-bio">{mentor.bio}</p>

                  <div className="mentor-actions">
                    <button 
                      className="book-button"
                      onClick={() => handleBookSession(mentor)}
                    >
                      {translations.mentorship.bookSession}
                      <ChevronRight className="btn-icon" />
                    </button>
                    <button className="chat-button">
                      <MessageCircle className="btn-icon" />
                      {translations.common.message}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredMentors.length === 0 && !loading && (
              <div className="empty-state">
                <User className="empty-icon" />
                <h3>Không tìm thấy mentor</h3>
                <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredMentors.length > mentorsPerPage && (
          <Pagination
            totalItems={filteredMentors.length}
            itemsPerPage={mentorsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default MentorshipPage;