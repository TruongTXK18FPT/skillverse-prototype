import React, { useState } from 'react';
import {
  Star, MessageCircle, Calendar, Clock, DollarSign, Award,
  Briefcase, Book, Globe, Heart, Filter, Search, ChevronRight,
  CheckCircle, User, Send
} from 'lucide-react';
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

  const categories = [
    { id: 'all', name: 'All Mentors', count: 156 },
    { id: 'frontend', name: 'Frontend Development', count: 45 },
    { id: 'backend', name: 'Backend Development', count: 38 },
    { id: 'fullstack', name: 'Full Stack', count: 34 },
    { id: 'mobile', name: 'Mobile Development', count: 28 },
    { id: 'devops', name: 'DevOps', count: 11 }
  ];

  const mentors: Mentor[] = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      title: "Senior Frontend Developer at Google",
      rating: 4.9,
      reviews: 128,
      hourlyRate: 120,
      expertise: ["React", "Vue.js", "TypeScript", "UI/UX Design"],
      languages: ["English", "Spanish"],
      availability: "Mon-Fri, 9 AM - 5 PM EST",
      experience: "12+ years",
      bio: "Passionate about teaching and mentoring the next generation of frontend developers. Specialized in modern JavaScript frameworks and performance optimization.",
      avatar: "https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Top Rated", "Pro Mentor", "Google Expert"],
      isFavorite: false
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "Lead Backend Engineer at Amazon",
      rating: 4.8,
      reviews: 95,
      hourlyRate: 150,
      expertise: ["Node.js", "Python", "AWS", "System Design"],
      languages: ["English", "Mandarin"],
      availability: "Weekends, Flexible Hours",
      experience: "10+ years",
      bio: "Expert in scalable backend systems and cloud architecture. Love helping developers level up their backend skills.",
      avatar: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["AWS Certified", "System Design Expert"],
      isFavorite: true
    },
    {
      id: 3,
      name: "Emily Davis",
      title: "Full Stack Developer at Microsoft",
      rating: 4.7,
      reviews: 82,
      hourlyRate: 100,
      expertise: ["React", "Node.js", "MongoDB", "Azure"],
      languages: ["English"],
      availability: "Tue-Thu, 6 PM - 10 PM PST",
      experience: "8+ years",
      bio: "Full stack developer with a passion for teaching. Specialized in MERN stack and cloud deployment.",
      avatar: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Microsoft MVP", "MERN Expert"],
      isFavorite: false
    }
  ];

  return (
    <div className="mentorship-container">
      <div className="mentorship-content">
        {/* Header */}
        <div className="mentorship-header">
          <h1 className="mentorship-title">Find Your Perfect Mentor</h1>
          <p className="mentorship-description">
            Connect with experienced developers who can guide you through your coding journey
          </p>
        </div>

        {/* Search and Filter */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search mentors by name, expertise, or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="filter-button">
            <Filter className="filter-icon" />
            <span>Filters</span>
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
                  <span className="review-count">({mentor.reviews} reviews)</span>
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
                    <span>${mentor.hourlyRate}/hour</span>
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
                  <h4>Expertise</h4>
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
                    onClick={() => {
                      setSelectedMentor(mentor);
                      setShowBookingModal(true);
                    }}
                  >
                    <Calendar className="button-icon" />
                    Book Session
                  </button>
                  <button
                    className="chat-button"
                    onClick={() => {
                      setSelectedMentor(mentor);
                      setShowChatModal(true);
                    }}
                  >
                    <MessageCircle className="button-icon" />
                    Chat Now
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
