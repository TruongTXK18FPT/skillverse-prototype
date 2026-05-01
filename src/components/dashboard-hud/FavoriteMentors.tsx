import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Star, ExternalLink, Plus, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import HUDCard from "./HUDCard";
import "./ActiveModules.css";
import { useAppToast } from "../../context/ToastContext";
import { getMentorProfile } from "../../services/mentorProfileService";
import { useScrollToListTopOnPagination } from "../../hooks/useScrollToListTopOnPagination";

interface Mentor {
  id: number;
  firstName: string;
  lastName: string;
  specialization?: string;
  avatar?: string;
  slug?: string;
  customUrlSlug?: string;
  portfolioSlug?: string;
  profileSlug?: string;
}

interface FavoriteMentorsProps {
  mentors: Mentor[];
  title?: string;
}

const MENTORS_PER_PAGE = 3;

const FavoriteMentors: React.FC<FavoriteMentorsProps> = ({
  mentors,
  title = "Mentor Yêu Thích",
}) => {
  const navigate = useNavigate();
  const { showInfo } = useAppToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { withPaginationScroll } = useScrollToListTopOnPagination();
  const [resolvingMentorId, setResolvingMentorId] = useState<number | null>(
    null,
  );
  const [resolvedSlugs, setResolvedSlugs] = useState<Record<number, string>>(
    {},
  );

  const filteredMentors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return mentors;
    }

    return mentors.filter((mentor) =>
      [mentor.firstName, mentor.lastName, mentor.specialization]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [mentors, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mentors.length, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMentors.length / MENTORS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMentors = useMemo(() => {
    const start = (currentPage - 1) * MENTORS_PER_PAGE;
    return filteredMentors.slice(start, start + MENTORS_PER_PAGE);
  }, [currentPage, filteredMentors]);

  const showingStart =
    filteredMentors.length === 0 ? 0 : (currentPage - 1) * MENTORS_PER_PAGE + 1;
  const showingEnd =
    filteredMentors.length === 0
      ? 0
      : Math.min(currentPage * MENTORS_PER_PAGE, filteredMentors.length);

  const getMentorSlug = (mentor: Mentor): string => {
    const rawSlug =
      resolvedSlugs[mentor.id] ||
      mentor.slug ||
      mentor.customUrlSlug ||
      mentor.portfolioSlug ||
      mentor.profileSlug ||
      "";
    return rawSlug.trim();
  };

  const handleOpenMentorProfile = async (mentor: Mentor) => {
    const mentorSlug = getMentorSlug(mentor);
    if (mentorSlug) {
      navigate(`/portfolio/${encodeURIComponent(mentorSlug)}`);
      return;
    }

    if (resolvingMentorId === mentor.id) {
      return;
    }

    try {
      setResolvingMentorId(mentor.id);
      const profile = await getMentorProfile(mentor.id);
      const fetchedSlug = profile?.slug?.trim() || "";

      if (!fetchedSlug) {
        showInfo(
          "Chưa có portfolio công khai",
          "Mentor này chưa có đường dẫn portfolio công khai.",
        );
        return;
      }

      setResolvedSlugs((prev) => ({
        ...prev,
        [mentor.id]: fetchedSlug,
      }));
      navigate(`/portfolio/${encodeURIComponent(fetchedSlug)}`);
    } catch {
      showInfo(
        "Không thể mở hồ sơ mentor",
        "Không thể tải đường dẫn hồ sơ vào lúc này. Vui lòng thử lại.",
      );
    } finally {
      setResolvingMentorId((prev) => (prev === mentor.id ? null : prev));
    }
  };

  const handleQuickBookMentor = (mentor: Mentor) => {
    const mentorName = [mentor.firstName, mentor.lastName]
      .filter((part) => Boolean(part && part.trim()))
      .join(" ")
      .trim();

    if (mentorName) {
      navigate(`/mentorship?search=${encodeURIComponent(mentorName)}`);
      return;
    }

    navigate("/mentorship");
  };

  return (
    <HUDCard
      title={title}
      subtitle={`${mentors?.length || 0} mentor đã theo dõi`}
      variant="chamfer"
      delay={0.4}
    >
      <div className="active-modules favorite-mentors">
        {!mentors || mentors.length === 0 ? (
          <div className="favorite-mentors__empty">
            <button
              onClick={() => navigate("/mentorship")}
              className="favorite-mentors__empty-add"
            >
              <Plus size={28} />
            </button>
            <p className="favorite-mentors__empty-text">
              Chưa có mentor yêu thích
            </p>
            <button
              onClick={() => navigate("/mentorship")}
              className="active-modules__button favorite-mentors__empty-button"
            >
              Xem trang Cố vấn
            </button>
          </div>
        ) : (
          <>
            <div className="active-modules__toolbar">
              <div className="active-modules__control">
                <label htmlFor="favorite-mentors-search">Tìm kiếm</label>
                <input
                  id="favorite-mentors-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo tên mentor, chuyên môn..."
                />
              </div>
              <div className="active-modules__summary">
                {filteredMentors.length === 0
                  ? "Không có mentor phù hợp."
                  : `Hiển thị ${showingStart}-${showingEnd} / ${filteredMentors.length}`}
              </div>
            </div>

            {paginatedMentors.length === 0 ? (
              <div className="active-modules__empty">
                Không tìm thấy mentor phù hợp với từ khóa đã nhập.
              </div>
            ) : (
              paginatedMentors.map((mentor, index) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + index * 0.1,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="active-modules__card favorite-mentors__card"
                >
                  <div className="active-modules__thumbnail favorite-mentors__thumbnail">
                    <img
                      src={mentor.avatar || "/images/meowl.jpg"}
                      alt={`${mentor.firstName} ${mentor.lastName}`}
                    />
                    <div className="active-modules__thumbnail-overlay favorite-mentors__thumbnail-overlay">
                      <User size={24} className="active-modules__play-icon" />
                    </div>
                  </div>

                  <div className="active-modules__content favorite-mentors__content">
                    <div className="active-modules__header">
                      <h4
                        className="active-modules__title favorite-mentors__title"
                        onClick={() => {
                          void handleOpenMentorProfile(mentor);
                        }}
                      >
                        {mentor.firstName} {mentor.lastName}
                      </h4>
                      <p className="active-modules__instructor">
                        CHUYÊN MÔN:{" "}
                        {(
                          mentor.specialization || "Người hướng dẫn"
                        ).toUpperCase()}
                      </p>
                    </div>

                    <div className="active-modules__stats">
                      <div className="active-modules__stat">
                        <span className="active-modules__stat-label">
                          TRẠNG THÁI
                        </span>
                        <span className="active-modules__stat-value favorite-mentors__status">
                          SẴN SÀNG
                        </span>
                      </div>
                    </div>

                    <div className="active-modules__footer">
                      <div className="active-modules__time">
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <span>Mentor nổi bật</span>
                      </div>
                      <div className="favorite-mentors__actions">
                        <button
                          className="active-modules__button"
                          type="button"
                          disabled={resolvingMentorId === mentor.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleOpenMentorProfile(mentor);
                          }}
                        >
                          <ExternalLink size={14} />
                          {resolvingMentorId === mentor.id
                            ? "Đang mở..."
                            : "Hồ sơ"}
                        </button>
                        <button
                          className="active-modules__button active-modules__button--primary favorite-mentors__book-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickBookMentor(mentor);
                          }}
                        >
                          <CalendarDays size={14} />
                          Book ngay
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {filteredMentors.length > MENTORS_PER_PAGE && (
              <div className="active-modules__pagination">
                <button
                  type="button"
                  className="active-modules__page-btn"
                  onClick={withPaginationScroll(() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  )}
                  disabled={currentPage === 1}
                >
                  Trang trước
                </button>
                <span className="active-modules__page-indicator">
                  Trang {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  className="active-modules__page-btn"
                  onClick={withPaginationScroll(() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  )}
                  disabled={currentPage === totalPages}
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </HUDCard>
  );
};

export default FavoriteMentors;
