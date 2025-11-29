import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MeowlGuide from '../../components/MeowlGuide';
import UplinkHeader from '../../components/mentorship-hud/UplinkHeader';
import UplinkGrid from '../../components/mentorship-hud/UplinkGrid';
import MasterProfileCard from '../../components/mentorship-hud/MasterProfileCard';
import HoloPagination from '../../components/mentorship-hud/HoloPagination';
import '../../components/mentorship-hud/uplink-styles.css';

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
        name: mentor.name || 'Ẩn danh',
        title: mentor.title || 'Mentor chuyên nghiệp',
        rating: mentor.rating || (Math.random() * 2 + 3).toFixed(1),
        reviews: mentor.reviews || Math.floor(Math.random() * 200 + 50),
        hourlyRate: mentor.hourlyRate || Math.floor(Math.random() * 100 + 50),
        expertise: mentor.expertise || ['Chung'],
        languages: mentor.languages || ['Tiếng Anh'],
        availability: mentor.availability || 'Linh hoạt',
        experience: mentor.experience || '5+ năm',
        bio: mentor.bio || 'Mentor giàu kinh nghiệm, sẵn sàng hỗ trợ bạn phát triển.',
        avatar: mentor.avatar || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=400`,
        badges: mentor.badges || ['Đã xác minh'],
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
    <div className="uplink-container">
      <div className="uplink-content">
        {/* Neural Uplink Header */}
        <UplinkHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={(categoryId) => {
            setSelectedCategory(categoryId);
            setCurrentPage(1);
          }}
        />

        {/* Master Archives Grid */}
        <UplinkGrid
          loading={loading}
          isEmpty={filteredMentors.length === 0 && !loading}
        >
          {currentMentors.map((mentor) => (
            <MasterProfileCard
              key={mentor.id}
              id={mentor.id}
              name={mentor.name}
              title={mentor.title}
              rating={mentor.rating}
              reviews={mentor.reviews}
              hourlyRate={mentor.hourlyRate}
              expertise={mentor.expertise}
              languages={mentor.languages}
              availability={mentor.availability}
              experience={mentor.experience}
              bio={mentor.bio}
              avatar={mentor.avatar}
              badges={mentor.badges}
              isFavorite={mentor.isFavorite}
              onEstablishLink={() => handleBookSession(mentor)}
              onMessage={() => {
                // Handle message action
                console.log('Message mentor:', mentor.name);
              }}
              onToggleFavorite={() => {
                // Handle favorite toggle
                console.log('Toggle favorite:', mentor.name);
              }}
            />
          ))}
        </UplinkGrid>

        {/* Holo Pagination - Data Stream Nodes */}
        {filteredMentors.length > mentorsPerPage && (
          <HoloPagination
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
