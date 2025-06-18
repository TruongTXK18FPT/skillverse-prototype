import React, { useState } from 'react';
import {
  Star, MessageCircle, Calendar, Clock, DollarSign, Award,
  Briefcase, Book, Globe, Heart, Filter, Search, ChevronRight,
  CheckCircle, User, Send
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/MentorshipPage.css';

interface Mentor {
  id: number;
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
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const { translations } = useLanguage();

  const categories = [
    { id: 'all', name: translations.mentorship.categories.all, count: 156 },
    { id: 'frontend', name: translations.mentorship.categories.frontend, count: 45 },
    { id: 'backend', name: translations.mentorship.categories.backend, count: 38 },
    { id: 'fullstack', name: translations.mentorship.categories.fullstack, count: 34 },
    { id: 'mobile', name: translations.mentorship.categories.mobile, count: 28 },
    { id: 'devops', name: translations.mentorship.categories.devops, count: 11 }
  ];

  const mentors: Mentor[] = [
    {
      id: 1,
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
      id: 2,
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
    },
    {
      id: 3,
      name: "Emily Davis",
      title: translations.mentorship.roles.fullstack,
      rating: 4.7,
      reviews: 82,
      hourlyRate: 100,
      expertise: ["React", "Node.js", "MongoDB", "Azure"],
      languages: [translations.common.languages.english],
      availability: translations.mentorship.availability.evenings,
      experience: "8+ years",
      bio: translations.mentorship.bios.fullstack,
      avatar: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: [translations.mentorship.badges.microsoftMvp, translations.mentorship.badges.mernExpert],
      isFavorite: false
    }
  ];

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
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={translations.mentorship.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="filter-button">
            <Filter className="filter-icon" />
            <span>{translations.common.filter}</span>
          </button>
        </div>

        {/* Categories */}
        <div className="categories-list">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
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
        <div className="mentors-grid">
          {mentors.map((mentor) => (
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
                  <button className="book-session-btn">
                    {translations.mentorship.bookSession}
                    <ChevronRight className="btn-icon" />
                  </button>
                  <button className="message-btn">
                    <MessageCircle className="btn-icon" />
                    {translations.common.message}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Modal */}
        {showBookingModal && selectedMentor && (
          <div className="modal-overlay">
            <div className="modal-content booking-modal">
              <h2>Book a Session with {selectedMentor.name}</h2>
              {/* Add booking form here */}
              <button onClick={() => setShowBookingModal(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && selectedMentor && (
          <div className="modal-overlay">
            <div className="modal-content chat-modal">
              <div className="chat-header">
                <img
                  src={selectedMentor.avatar}
                  alt={selectedMentor.name}
                  className="chat-avatar"
                />
                <div>
                  <h3>{selectedMentor.name}</h3>
                  <p>{selectedMentor.title}</p>
                </div>
                <button
                  className="close-button"
                  onClick={() => setShowChatModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="chat-messages">
                {/* Add chat messages here */}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="message-input"
                />
                <button className="send-button">
                  <Send className="send-icon" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipPage;
