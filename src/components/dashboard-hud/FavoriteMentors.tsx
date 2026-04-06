import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Star, ExternalLink, Plus, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import HUDCard from "./HUDCard";
import "./ActiveModules.css";
import { useAppToast } from "../../context/ToastContext";

interface Mentor {
  id: number;
  firstName: string;
  lastName: string;
  specialization?: string;
  avatar?: string;
  slug?: string;
}

interface FavoriteMentorsProps {
  mentors: Mentor[];
  title?: string;
  onOpenChat: (mentor: Mentor) => void;
}

const FavoriteMentors: React.FC<FavoriteMentorsProps> = ({
  mentors,
  title = "Mentor Yêu Thích",
  onOpenChat
}) => {
  const navigate = useNavigate();
  const { showInfo } = useAppToast();

  return (
    <HUDCard title={title} subtitle={`${mentors?.length || 0} mentor đã theo dõi`} variant="chamfer" delay={0.4}>
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
          mentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.5 + index * 0.1,
                ease: [0.4, 0, 0.2, 1]
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
                    onClick={() => mentor.slug && navigate(`/portfolio/${mentor.slug}`)}
                  >
                    {mentor.firstName} {mentor.lastName}
                  </h4>
                  <p className="active-modules__instructor">
                    CHUYÊN MÔN: {(mentor.specialization || "Người hướng dẫn").toUpperCase()}
                  </p>
                </div>

                <div className="active-modules__stats">
                  <div className="active-modules__stat">
                    <span className="active-modules__stat-label">TRẠNG THÁI</span>
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
                      className="active-modules__button favorite-mentors__chat-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(mentor);
                      }}
                    >
                      <MessageSquare size={14} />
                      Nhắn tin
                    </button>
                    <button
                      className="active-modules__button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mentor.slug) {
                          navigate(`/portfolio/${mentor.slug}`);
                        } else {
                          showInfo(
                            "Chưa có portfolio công khai",
                            "Mentor này chưa có đường dẫn portfolio công khai.",
                          );
                        }
                      }}
                    >
                      <ExternalLink size={14} />
                      Hồ sơ
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </HUDCard>
  );
};

export default FavoriteMentors;

