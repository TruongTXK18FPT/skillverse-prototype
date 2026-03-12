import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Star, ExternalLink, Plus, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import HUDCard from "./HUDCard";
import "./ActiveModules.css";

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

  return (
    <HUDCard title={title} subtitle={`${mentors?.length || 0} Registered Mentors`} variant="chamfer" delay={0.4}>
      <div className="active-modules">
        {!mentors || mentors.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              gap: "1rem",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => navigate("/mentorship")}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(0, 255, 255, 0.1)",
                border: "2px dashed rgba(0, 255, 255, 0.4)",
                color: "#00ffff",
                fontSize: "2rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "#00ffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
              }}
            >
              <Plus size={28} />
            </button>
            <p style={{ color: "#a0c0ff", fontSize: "14px", margin: 0 }}>
              Chưa có mentor yêu thích
            </p>
            <button
              onClick={() => navigate("/mentorship")}
              className="active-modules__button"
              style={{ marginTop: "8px" }}
            >
              Xem trang Mentorship
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
                className="active-modules__card"
                style={{ 
                  cursor: "default",
                  borderLeft: "1px solid rgba(6, 182, 212, 0.2)",
                  transform: "none",
                  background: "rgba(6, 182, 212, 0.03)"
                }}
              >
                <style>{`
                  .active-modules__card:hover { 
                    transform: none !important; 
                    background: rgba(6, 182, 212, 0.05) !important;
                    border-color: rgba(6, 182, 212, 0.2) !important;
                  }
                  .active-modules__card::before { display: none !important; }
                `}</style>
                
                {/* Avatar as Thumbnail */}
                <div className="active-modules__thumbnail" style={{ width: "100px", height: "100px" }}>
                  <img
                    src={mentor.avatar || "/images/meowl.jpg"}
                    alt={`${mentor.firstName} ${mentor.lastName}`}
                  />
                  <div className="active-modules__thumbnail-overlay" style={{ opacity: 0 }}>
                    <User size={24} className="active-modules__play-icon" />
                  </div>
                </div>

                {/* Content */}
                <div className="active-modules__content" style={{ flex: 1 }}>
                  <div className="active-modules__header">
                    <h4 
                      className="active-modules__title" 
                      style={{ cursor: "pointer", display: "inline-block" }} 
                      onClick={() => mentor.slug && navigate(`/portfolio/${mentor.slug}`)}
                    >
                      {mentor.firstName} {mentor.lastName}
                    </h4>
                    <p className="active-modules__instructor">
                      SPECIALIZATION: {(mentor.specialization || "Mentor").toUpperCase()}
                    </p>
                  </div>

                  {/* Info Stats (Like course units/objective) */}
                  <div className="active-modules__stats">
                    <div className="active-modules__stat">
                      <span className="active-modules__stat-label">STATUS</span>
                      <span className="active-modules__stat-value" style={{ color: "#10b981" }}>
                        AVAILABLE
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="active-modules__footer">
                    <div className="active-modules__time">
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <span>Top Mentor</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                      <button 
                        className="active-modules__button"
                        style={{ 
                          background: 'rgba(6, 182, 212, 0.1)', 
                          color: '#06b6d4',
                          borderColor: '#06b6d4',
                          pointerEvents: 'auto'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(mentor);
                        }}
                      >
                        <MessageSquare size={14} />
                        Chat
                      </button>
                      <button 
                        className="active-modules__button"
                        style={{ pointerEvents: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mentor.slug) {
                            navigate(`/portfolio/${mentor.slug}`);
                          }
                        }}
                      >
                        <ExternalLink size={14} />
                        Profile
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

