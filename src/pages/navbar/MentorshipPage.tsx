import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MessageCircle, Clock, DollarSign, Award,
  Briefcase, Globe, Heart, ChevronRight,
  CheckCircle, User
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import MeowlGuide from '../../components/MeowlGuide';
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
  const navigate = useNavigate();

  const mentorsPerPage = 6;

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from MockAPI
      const response = await fetch('https://68426af6e1347494c31cbc60.mockapi.io/api/skillverse/Mentorship');
      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedMentors = data.map((mentor: Record<string, unknown>) => ({
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
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  // Mock data as fallback
  const mockMentors: Mentor[] = [
    {
      id: '1',
      name: "Dr. Sarah Johnson",
      title: "Senior Frontend Developer", // Use direct string instead of translation
      rating: 4.9,
      reviews: 128,
      hourlyRate: 120,
      expertise: ["React", "Vue.js", "TypeScript", "UI/UX Design"],
      languages: ["English", "Spanish"], // Use direct strings
      availability: "Weekdays", // Use direct string
      experience: "12+ years",
      bio: "Experienced frontend developer with expertise in modern web technologies and mentoring.",
      avatar: "https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Top Rated", "Pro Mentor", "Google Expert"], // Use direct strings
      isFavorite: false
    },
    {
      id: '2',
      name: "Michael Chen",
      title: "Lead Backend Developer", // Use direct string
      rating: 4.8,
      reviews: 95,
      hourlyRate: 150,
      expertise: ["Node.js", "Python", "AWS", "System Design"],
      languages: ["English", "Mandarin"], // Use direct strings
      availability: "Weekends", // Use direct string
      experience: "10+ years",
      bio: "Backend specialist with extensive experience in scalable systems and cloud architecture.",
      avatar: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["AWS Certified", "System Design Expert"], // Use direct strings
      isFavorite: true
    },
    {
      id: '3',
      name: "Emily Rodriguez",
      title: "Full Stack Developer",
      rating: 4.7,
      reviews: 76,
      hourlyRate: 100,
      expertise: ["JavaScript", "React", "Node.js", "MongoDB"],
      languages: ["English", "Spanish"],
      availability: "Flexible",
      experience: "8+ years",
      bio: "Full stack developer passionate about clean code and mentoring new developers.",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Verified", "Mentor"],
      isFavorite: false
    },
    {
      id: '4',
      name: "David Kim",
      title: "Mobile Developer",
      rating: 4.9,
      reviews: 112,
      hourlyRate: 130,
      expertise: ["React Native", "Flutter", "iOS", "Android"],
      languages: ["English", "Korean"],
      availability: "Weekdays",
      experience: "10+ years",
      bio: "Mobile development expert with experience in cross-platform solutions.",
      avatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Top Rated", "Mobile Expert"],
      isFavorite: false
    }
  ];

  const categories = [
    { id: 'all', name: 'Tất cả', count: mentors.length },
    { id: 'frontend', name: 'Frontend', count: Math.floor(mentors.length * 0.3) },
    { id: 'backend', name: 'Backend', count: Math.floor(mentors.length * 0.25) },
    { id: 'fullstack', name: 'Full Stack', count: Math.floor(mentors.length * 0.2) },
    { id: 'mobile', name: 'Mobile', count: Math.floor(mentors.length * 0.15) },
    { id: 'devops', name: 'DevOps', count: Math.floor(mentors.length * 0.1) }
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
          <h1 className="mentorship-title">Tìm Mentor</h1>
          <p className="mentorship-description">
            Kết nối với các chuyên gia hàng đầu để phát triển kỹ năng và sự nghiệp của bạn
          </p>
        </div>

        {/* Search and Filter */}
        <div className="search-section">
            <input
              type="text"
              placeholder="Tìm kiếm mentor theo tên hoặc kỹ năng..."
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
                    <span className="review-count">{mentor.rating}</span>
                    <span className="review-count">
                      ({mentor.reviews} đánh giá)
                    </span>
                  </div>

                  <div className="mentor-badges">
                    {mentor.badges.map((badge, index) => (
                      <span key={index} className="mentor-badge">
                        <Award className="mentor-badge-icon" />
                        {badge}
                      </span>
                    ))}
                  </div>

                  <div className="mentor-details">
                    <div className="mentor-detail-item">
                      <Briefcase className="mentor-detail-icon" />
                      <span>{mentor.experience}</span>
                    </div>
                    <div className="mentor-detail-item">
                      <DollarSign className="mentor-detail-icon" />
                      <span>${mentor.hourlyRate}/giờ</span>
                    </div>
                    <div className="mentor-detail-item">
                      <Globe className="mentor-detail-icon" />
                      <span>{mentor.languages.join(", ")}</span>
                    </div>
                    <div className="mentor-detail-item">
                      <Clock className="mentor-detail-icon" />
                      <span>{mentor.availability}</span>
                    </div>
                  </div>

                  <div className="mentor-expertise">
                    <h4>Chuyên môn</h4>
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
                      Đặt lịch hướng dẫn
                      <ChevronRight className="btn-icon" />
                    </button>
                    <button className="chat-button">
                      <MessageCircle className="btn-icon" />
                      Nhắn tin
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

      {/* Meowl Guide */}
      <MeowlGuide currentPage="profile" />
    </div>
  );
};

export default MentorshipPage;
