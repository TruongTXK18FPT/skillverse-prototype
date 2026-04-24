import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppToast } from "../../context/ToastContext";
import {
  getAllMentors,
  toggleFavoriteMentor,
  getMyFavoriteMentors,
  getVerifiedSkillsByMentorId,
} from "../../services/mentorProfileService";
import { getMentorReviewStats } from "../../services/reviewService";
import MeowlGuide from "../../components/meowl/MeowlGuide";
import UplinkHeader from "../../components/mentorship-hud/UplinkHeader";
import UplinkGrid from "../../components/mentorship-hud/UplinkGrid";
import MasterProfileCard from "../../components/mentorship-hud/MasterProfileCard";
import Pagination from "../../components/shared/Pagination";
import BookingModal from "../../components/mentorship-hud/BookingModal";
import LoginRequiredModal from "../../components/auth/LoginRequiredModal";
import "../../components/mentorship-hud/uplink-styles.css";

interface Mentor {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  roadmapMentoringPrice?: number;
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
  verifiedSkills?: string[]; // Skills đã được admin xác thực
  hasVerifiedSkills?: boolean; // Có ít nhất 1 skill đã xác thực
}

const MentorshipPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { showInfo } = useAppToast();
  const primaryRole = user?.primaryRole?.toUpperCase() ?? "";
  const canUseMentorshipActions =
    primaryRole === "USER" || primaryRole === "LEARNER" || primaryRole === "";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [categories, setCategories] = useState<
    { id: string; name: string; count: number }[]
  >([{ id: "all", name: "Tất cả", count: 0 }]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMentorForBooking, setSelectedMentorForBooking] =
    useState<Mentor | null>(null);
  const [bookingContext, setBookingContext] = useState<
    { bookingType: "GENERAL" | "ROADMAP_MENTORING" } | undefined
  >(undefined);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);
  const navigate = useNavigate();

  const mentorsPerPage = 6;

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from Mentor Service and Favorites in parallel
      const [profiles, favorites] = await Promise.all([
        getAllMentors(),
        getMyFavoriteMentors().catch(() => []), // Handle error gracefully if not logged in
      ]);

      const favoriteIds = new Set(favorites.map((f) => f.id.toString()));

      if (Array.isArray(profiles)) {
        // Transform API data to match our interface
        const transformedMentors: Mentor[] = profiles.map((profile: any) => {
          // Fallback hourly rate in VND based on experience if missing
          const experienceYears = profile.experience || 0;
          const calculatedRate = 200000 + experienceYears * 50000;
          const finalRate =
            profile.hourlyRate && profile.hourlyRate > 0
              ? profile.hourlyRate
              : calculatedRate;

          return {
            id: profile.id.toString(),
            name:
              `${profile.firstName} ${profile.lastName}`.trim() || "Ẩn danh",
            title: profile.specialization || "Mentor chuyên nghiệp",
            rating:
              typeof profile.ratingAverage === "number"
                ? profile.ratingAverage
                : 0,
            reviews:
              typeof profile.ratingCount === "number" ? profile.ratingCount : 0,
            hourlyRate: finalRate,
            roadmapMentoringPrice:
              profile.roadmapMentoringPrice && profile.roadmapMentoringPrice > 0
                ? profile.roadmapMentoringPrice
                : undefined,
            expertise:
              profile.skills && profile.skills.length > 0
                ? profile.skills
                : ["Chung"],
            languages: ["Tiếng Anh"], // Default for now
            availability: "Linh hoạt", // Default for now
            experience: profile.experience
              ? `${profile.experience} năm`
              : "Chưa cập nhật",
            bio: profile.bio || "Mentor chưa cập nhật giới thiệu.",
            avatar: profile.avatar || "/images/meowl.jpg",
            badges:
              profile.achievements && profile.achievements.length > 0
                ? profile.achievements
                : [],
            isFavorite: favoriteIds.has(profile.id.toString()),
            slug: profile.slug,
            preChatEnabled: profile.preChatEnabled,
          };
        });
        setMentors(transformedMentors);

        // Enrich ratings and verified skills simultaneously
        let enrichedMentors = [...transformedMentors];
        try {
          enrichedMentors = await Promise.all(
            transformedMentors.map(async (mentor) => {
              const updatedMentor = { ...mentor };

              // 1. Fetch verified skills
              try {
                const verifiedSkills = await getVerifiedSkillsByMentorId(
                  Number(mentor.id),
                );
                updatedMentor.verifiedSkills = verifiedSkills;
                updatedMentor.hasVerifiedSkills = verifiedSkills.length > 0;
              } catch {
                updatedMentor.verifiedSkills = [];
                updatedMentor.hasVerifiedSkills = false;
              }

              // 2. Fetch missing ratings using the new stats endpoint
              if ((updatedMentor.reviews ?? 0) === 0) {
                try {
                  const stats = await getMentorReviewStats(Number(mentor.id));
                  updatedMentor.rating = stats.averageRating;
                  updatedMentor.reviews = stats.totalReviews;
                } catch {
                  // Keep original 0 values
                }
              }

              return updatedMentor;
            }),
          );
          setMentors(enrichedMentors);
        } catch {
          // If fetching fails completely, fallback to transformedMentors
          setMentors(transformedMentors);
        }

        // Generate Dynamic Categories from Skills
        const skillCounts: Record<string, { name: string; count: number }> = {};

        enrichedMentors.forEach((mentor) => {
          mentor.expertise.forEach((skill: string) => {
            const normalizedKey = skill.trim().toLowerCase();
            if (!skillCounts[normalizedKey]) {
              skillCounts[normalizedKey] = { name: skill.trim(), count: 0 };
            }
            skillCounts[normalizedKey].count++;
          });
        });

        const dynamicCategories = [
          { id: "all", name: "Tất cả", count: transformedMentors.length },
          {
            id: "favorites",
            name: "Yêu thích",
            count: transformedMentors.filter((m) => m.isFavorite).length,
          },
          ...Object.entries(skillCounts)
            .map(([key, val]) => ({
              id: key,
              name: val.name,
              count: val.count,
            }))
            .sort((a, b) => b.count - a.count), // Sort by popularity
        ];

        setCategories(dynamicCategories);
      } else {
        console.error("Invalid data format from API");
        setMentors(mockMentors);
      }
    } catch (error) {
      console.error("Error fetching mentors:", error);
      // Fallback to mock data
      // setMentors(mockMentors);
    } finally {
      setLoading(false);
    }
  }, [user?.id, mockMentors]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMentors([]);
      setLoading(false);
      return;
    }

    fetchMentors();
  }, [fetchMentors, isAuthenticated]);

  useEffect(() => {
    const shouldLock = bookingModalOpen || showLoginModal;

    if (shouldLock) {
      document.body.classList.add("uplink-scroll-lock");
      document.documentElement.classList.add("uplink-scroll-lock");
    } else {
      document.body.classList.remove("uplink-scroll-lock");
      document.documentElement.classList.remove("uplink-scroll-lock");
    }

    return () => {
      document.body.classList.remove("uplink-scroll-lock");
      document.documentElement.classList.remove("uplink-scroll-lock");
    };
  }, [bookingModalOpen, showLoginModal]);

  const handleToggleFavorite = async (mentorId: string) => {
    try {
      const id = parseInt(mentorId);
      const newStatus = await toggleFavoriteMentor(id);

      setMentors((prev) =>
        prev.map((m) =>
          m.id === mentorId ? { ...m, isFavorite: newStatus } : m,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      // Optionally show a toast notification here
    }
  };

  const location = useLocation();

  useEffect(() => {
    const searchFromUrl = new URLSearchParams(location.search)
      .get("search")
      ?.trim();

    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    if (location.state && (location.state as any).openChatWith) {
      showInfo(
        "Chat chỉ mở sau khi đặt lịch",
        "Mentor chat không còn mở trực tiếp từ trang mentorship. Hãy vào booking hoặc Messenger sau khi đã đặt lịch.",
      );
    }
  }, [location.state, showInfo]);

  // Mock data as fallback
  const mockMentors: Mentor[] = [
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      title: "Senior Frontend Developer", // Use direct string instead of translation
      rating: 4.9,
      reviews: 128,
      hourlyRate: 120000,
      roadmapMentoringPrice: 1500000,
      expertise: ["React", "Vue.js", "TypeScript", "UI/UX Design"],
      languages: ["English", "Spanish"], // Use direct strings
      availability: "Weekdays", // Use direct string
      experience: "12+ years",
      bio: "Experienced frontend developer with expertise in modern web technologies and mentoring.",
      avatar:
        "https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Top Rated", "Pro Mentor", "Google Expert"], // Use direct strings
      isFavorite: false,
    },
    {
      id: "2",
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
      avatar:
        "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["AWS Certified", "System Design Expert"], // Use direct strings
      isFavorite: true,
    },
    {
      id: "3",
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
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Verified", "Mentor"],
      isFavorite: false,
    },
    {
      id: "4",
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
      avatar:
        "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400",
      badges: ["Top Rated", "Mobile Expert"],
      isFavorite: false,
    },
  ];

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.some((skill: string) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    let matchesCategory = true;
    if (selectedCategory === "all") {
      matchesCategory = true;
    } else if (selectedCategory === "favorites") {
      matchesCategory = mentor.isFavorite;
    } else {
      matchesCategory = mentor.expertise.some(
        (skill: string) => skill.trim().toLowerCase() === selectedCategory,
      );
    }

    // Filter by verified skills toggle
    const matchesVerifiedFilter = showVerifiedOnly
      ? mentor.hasVerifiedSkills
      : true;

    return matchesSearch && matchesCategory && matchesVerifiedFilter;
  });

  const startIndex = (currentPage - 1) * mentorsPerPage;
  const currentMentors = filteredMentors.slice(
    startIndex,
    startIndex + mentorsPerPage,
  );

  const handleBookSession = (mentor: Mentor) => {
    if (!canUseMentorshipActions) {
      showInfo(
        "Chỉ học viên được đặt lịch",
        "Tính năng đặt lịch mentorship chỉ dành cho tài khoản học viên.",
      );
      return;
    }

    if (mentor.id === String(user?.id)) {
      showInfo(
        "Không thể tự đặt lịch",
        "Bạn không thể đặt lịch mentorship với chính tài khoản mentor của mình.",
      );
      return;
    }

    // Check if user is logged in before allowing booking
    if (!isAuthenticated) {
      setSelectedMentorForBooking(mentor);
      setShowLoginModal(true);
      return;
    }

    setSelectedMentorForBooking(mentor);
    setBookingContext(undefined);
    setBookingModalOpen(true);
  };

  const handleBookRoadmap = (mentor: Mentor) => {
    if (!canUseMentorshipActions) {
      showInfo(
        "Chỉ học viên được đặt lịch",
        "Tính năng đặt lịch mentorship chỉ dành cho tài khoản học viên.",
      );
      return;
    }

    if (mentor.id === String(user?.id)) {
      showInfo(
        "Không thể tự đặt lịch",
        "Bạn không thể đặt lịch mentorship với chính tài khoản mentor của mình.",
      );
      return;
    }

    if (!isAuthenticated) {
      setSelectedMentorForBooking(mentor);
      setShowLoginModal(true);
      return;
    }

    setSelectedMentorForBooking(mentor);
    setBookingContext({ bookingType: "ROADMAP_MENTORING" });
    setBookingModalOpen(true);
  };

  const handleToggleFavoriteWrapper = (mentorId: string) => {
    // Check if user is logged in before allowing favorites
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    handleToggleFavorite(mentorId);
  };

  if (!isAuthenticated) {
    return (
      <div className="uplink-container">
        <div className="uplink-content">
          <div className="uplink-empty">
            <Lock className="uplink-empty-icon" />
            <h3 className="uplink-empty-title">
              Đăng nhập để truy cập Mentorship
            </h3>
            <p className="uplink-empty-text">
              Bạn cần đăng nhập để xem danh sách mentor, đặt lịch và nhắn tin
              trong khu vực này.
            </p>
            <button
              type="button"
              className="uplink-establish-btn"
              onClick={() => setShowLoginModal(true)}
            >
              Đăng nhập để tiếp tục
            </button>
          </div>
        </div>

        <MeowlGuide currentPage="profile" />

        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Đăng nhập để vào Mentorship"
          message="Bạn cần đăng nhập để kết nối mentor, đặt lịch và trò chuyện trực tiếp"
          feature="Mentorship"
        />
      </div>
    );
  }

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

        {/* Verified Skills Filter Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "0 1.5rem 1rem",
          }}
        >
          <button
            onClick={() => {
              setShowVerifiedOnly(!showVerifiedOnly);
              setCurrentPage(1);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: showVerifiedOnly
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(15, 23, 42, 0.6)",
              border: showVerifiedOnly
                ? "1px solid rgba(34, 197, 94, 0.5)"
                : "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
              color: showVerifiedOnly ? "#22c55e" : "#94a3b8",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title={
              showVerifiedOnly
                ? "Hiển thị tất cả mentor"
                : "Chỉ hiển thị mentor đã xác thực kỹ năng"
            }
          >
            <ShieldCheck size={16} />
            <span>
              {showVerifiedOnly
                ? "Đang lọc: Đã xác thực"
                : "Lọc: Chỉ mentor đã xác thực"}
            </span>
          </button>
        </div>

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
              roadmapMentoringPrice={mentor.roadmapMentoringPrice}
              expertise={mentor.expertise}
              languages={mentor.languages}
              availability={mentor.availability}
              experience={mentor.experience}
              bio={mentor.bio}
              avatar={mentor.avatar}
              badges={mentor.badges}
              isFavorite={mentor.isFavorite}
              preChatEnabled={mentor.preChatEnabled}
              verifiedSkills={mentor.verifiedSkills}
              onEstablishLink={() => handleBookSession(mentor)}
              onBookRoadmap={() => handleBookRoadmap(mentor)}
              onToggleFavorite={() => handleToggleFavoriteWrapper(mentor.id)}
              onViewProfile={() => {
                if (mentor.slug) {
                  navigate(`/portfolio/${mentor.slug}`);
                } else {
                  showInfo(
                    "Chưa có portfolio công khai",
                    "Mentor này chưa có đường dẫn portfolio công khai.",
                  );
                }
              }}
            />
          ))}
        </UplinkGrid>

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

      {/* Booking Modal */}
      {selectedMentorForBooking && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          mentorId={selectedMentorForBooking.id}
          mentorName={selectedMentorForBooking.name}
          hourlyRate={selectedMentorForBooking.hourlyRate}
          roadmapMentoringPrice={selectedMentorForBooking.roadmapMentoringPrice}
          journeyContext={bookingContext as any}
        />
      )}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để tiếp tục"
        message="Bạn cần đăng nhập để sử dụng tính năng mentorship."
        feature="Đặt lịch và nhắn tin cùng mentor"
      />
    </div>
  );
};

export default MentorshipPage;
