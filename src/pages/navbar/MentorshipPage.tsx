import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllMentors, toggleFavoriteMentor, getMyFavoriteMentors } from '../../services/mentorProfileService';
import { getPublicBookingReviewsByMentor } from '../../services/reviewService';
import MeowlGuide from '../../components/MeowlGuide';
import UplinkHeader from '../../components/mentorship-hud/UplinkHeader';
import UplinkGrid from '../../components/mentorship-hud/UplinkGrid';
import MasterProfileCard from '../../components/mentorship-hud/MasterProfileCard';
import HoloPagination from '../../components/mentorship-hud/HoloPagination';
import MentorChatModal from '../../components/mentorship-hud/MentorChatModal';
import BookingModal from '../../components/mentorship-hud/BookingModal';
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
  slug?: string;
  preChatEnabled?: boolean;
}

const MentorshipPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, count: number}[]>([
    { id: 'all', name: 'Tất cả', count: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMentorForChat, setSelectedMentorForChat] = useState<Partial<Mentor> | null>(null);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<Mentor | null>(null);
  const [isMyRoleMentorForChat, setIsMyRoleMentorForChat] = useState(false);
  const navigate = useNavigate();

  const mentorsPerPage = 6;

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from Mentor Service and Favorites in parallel
      const [profiles, favorites] = await Promise.all([
        getAllMentors(),
        getMyFavoriteMentors().catch(() => []) // Handle error gracefully if not logged in
      ]);
      
      const favoriteIds = new Set(favorites.map(f => f.id.toString()));

      if (Array.isArray(profiles)) {
        // Transform API data to match our interface
        const transformedMentors = profiles.map((profile: any) => {
          // Fallback hourly rate in VND based on experience if missing
          const experienceYears = profile.experience || 0;
          const calculatedRate = 200000 + (experienceYears * 50000);
          const finalRate = profile.hourlyRate && profile.hourlyRate > 0 ? profile.hourlyRate : calculatedRate;

          return {
            id: profile.id.toString(),
            name: `${profile.firstName} ${profile.lastName}`.trim() || 'Ẩn danh',
            title: profile.specialization || 'Mentor chuyên nghiệp',
            rating: typeof profile.ratingAverage === 'number' ? profile.ratingAverage : 0,
            reviews: typeof profile.ratingCount === 'number' ? profile.ratingCount : 0,
            hourlyRate: finalRate,
            expertise: profile.skills && profile.skills.length > 0 ? profile.skills : ['Chung'],
            languages: ['Tiếng Anh'], // Default for now
            availability: 'Linh hoạt', // Default for now
            experience: profile.experience ? `${profile.experience} năm` : 'Chưa cập nhật',
            bio: profile.bio || 'Mentor chưa cập nhật giới thiệu.',
            avatar: profile.avatar || '/images/meowl.jpg',
            badges: profile.achievements && profile.achievements.length > 0 ? profile.achievements : [],
            isFavorite: favoriteIds.has(profile.id.toString()),
            slug: profile.slug,
            preChatEnabled: profile.preChatEnabled
          };
        });
        setMentors(transformedMentors);

        // Enrich ratings if missing: fetch public reviews and compute average for current page mentors
        try {
          const toEnrich = transformedMentors.filter(m => (m.reviews ?? 0) === 0);
          const updates = await Promise.all(toEnrich.map(async (m) => {
            try {
              const reviews = await getPublicBookingReviewsByMentor(Number(m.id));
              const ratings = reviews.map(r => r.rating).filter((n) => typeof n === 'number');
              const count = ratings.length;
              const avg = count === 0 ? 0 : ratings.reduce((a, b) => a + b, 0) / count;
              return { id: m.id, rating: avg, reviews: count };
            } catch {
              return { id: m.id, rating: m.rating, reviews: m.reviews };
            }
          }));
          if (updates.length > 0) {
            setMentors(prev => prev.map(m => {
              const upd = updates.find(u => u.id === m.id);
              return upd ? { ...m, rating: upd.rating, reviews: upd.reviews } : m;
            }));
          }
        } catch {
          // ignore enrichment failures
        }

        // Generate Dynamic Categories from Skills
        const skillCounts: Record<string, { name: string, count: number }> = {};
        
        transformedMentors.forEach(mentor => {
          mentor.expertise.forEach((skill: string) => {
            const normalizedKey = skill.trim().toLowerCase();
            if (!skillCounts[normalizedKey]) {
              skillCounts[normalizedKey] = { name: skill.trim(), count: 0 };
            }
            skillCounts[normalizedKey].count++;
          });
        });

        const dynamicCategories = [
          { id: 'all', name: 'Tất cả', count: transformedMentors.length },
          { id: 'favorites', name: 'Yêu thích', count: transformedMentors.filter(m => m.isFavorite).length },
          ...Object.entries(skillCounts)
            .map(([key, val]) => ({
              id: key,
              name: val.name,
              count: val.count
            }))
            .sort((a, b) => b.count - a.count) // Sort by popularity
        ];
        
        setCategories(dynamicCategories);

      } else {
        console.error('Invalid data format from API');
        setMentors(mockMentors);
      }
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

  const handleToggleFavorite = async (mentorId: string) => {
    try {
      const id = parseInt(mentorId);
      const newStatus = await toggleFavoriteMentor(id);
      
      setMentors(prev => prev.map(m => 
        m.id === mentorId ? { ...m, isFavorite: newStatus } : m
      ));
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      // Optionally show a toast notification here
    }
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).openChatWith) {
      const state = location.state as any;
      const mentorId = state.openChatWith;
      
      // Check if we have full details in state (from MessageDropdown)
      if (state.name && state.avatar) {
        setSelectedMentorForChat({
          id: mentorId,
          name: state.name,
          avatar: state.avatar
        });
        setIsMyRoleMentorForChat(!!state.isMyRoleMentor);
        setChatModalOpen(true);
      } else if (mentors.length > 0) {
        // Fallback to finding in list
        const mentor = mentors.find(m => m.id === mentorId);
        if (mentor) {
          setSelectedMentorForChat(mentor);
          setIsMyRoleMentorForChat(false); // Default to learner if picking from list
          setChatModalOpen(true);
        }
      }
    }
  }, [location.state, mentors]);

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

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentor.expertise.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = true;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'favorites') {
      matchesCategory = mentor.isFavorite;
    } else {
      matchesCategory = mentor.expertise.some((skill: string) => 
        skill.trim().toLowerCase() === selectedCategory
      );
    }

    return matchesSearch && matchesCategory;
  });

  const startIndex = (currentPage - 1) * mentorsPerPage;
  const currentMentors = filteredMentors.slice(startIndex, startIndex + mentorsPerPage);

  const handleBookSession = (mentor: Mentor) => {
    setSelectedMentorForBooking(mentor);
    setBookingModalOpen(true);
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
              preChatEnabled={mentor.preChatEnabled}
              onEstablishLink={() => handleBookSession(mentor)}
              onMessage={() => {
                setSelectedMentorForChat(mentor);
                setChatModalOpen(true);
              }}
              onToggleFavorite={() => handleToggleFavorite(mentor.id)}
              onViewProfile={() => {
                if (mentor.slug) {
                  navigate(`/portfolio/${mentor.slug}`);
                } else {
                  alert('Mentor này chưa có đường dẫn portfolio công khai.');
                }
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

      {/* Mentor Chat Modal */}
      {selectedMentorForChat && selectedMentorForChat.id && (
        <MentorChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          mentorId={selectedMentorForChat.id}
          mentorName={selectedMentorForChat.name || 'User'}
          mentorAvatar={selectedMentorForChat.avatar || ''}
          isMyRoleMentor={isMyRoleMentorForChat}
        />
      )}

      {/* Booking Modal */}
      {selectedMentorForBooking && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          mentorId={selectedMentorForBooking.id}
          mentorName={selectedMentorForBooking.name}
          hourlyRate={selectedMentorForBooking.hourlyRate}
        />
      )}
    </div>
  );
};

export default MentorshipPage;
