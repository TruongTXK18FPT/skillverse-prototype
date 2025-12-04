import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Star, ExternalLink } from 'lucide-react';
import './hud-styles.module.css';

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
}

const FavoriteMentors: React.FC<FavoriteMentorsProps> = ({ 
  mentors, 
  title = 'Favorite Mentors' 
}) => {
  const navigate = useNavigate();

  if (!mentors || mentors.length === 0) {
    return null;
  }

  return (
    <div className="hud-panel active-modules">
      <div className="hud-panel-header">
        <div className="hud-panel-title">
          <Star size={18} className="hud-icon" />
          {title}
        </div>
        <div className="hud-panel-controls">
          <div className="hud-control-dot red"></div>
          <div className="hud-control-dot yellow"></div>
          <div className="hud-control-dot green"></div>
        </div>
      </div>
      
      <div className="hud-panel-content">
        <div className="favorite-mentors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {mentors.map((mentor) => (
            <div 
              key={mentor.id} 
              className="favorite-mentor-card"
              style={{
                background: 'rgba(0, 20, 40, 0.4)',
                border: '1px solid rgba(0, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="mentor-avatar" style={{ position: 'relative' }}>
                <img 
                  src={mentor.avatar || '/images/meowl.jpg'} 
                  alt={`${mentor.firstName} ${mentor.lastName}`}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #00ffff'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: '#000',
                  borderRadius: '50%',
                  padding: '2px'
                }}>
                  <User size={12} color="#00ffff" />
                </div>
              </div>
              
              <div className="mentor-info" style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>
                  {mentor.firstName} {mentor.lastName}
                </h4>
                <p style={{ margin: '4px 0 0', color: '#a0c0ff', fontSize: '12px' }}>
                  {mentor.specialization || 'Mentor'}
                </p>
              </div>

              <button
                onClick={() => mentor.slug ? navigate(`/portfolio/${mentor.slug}`) : alert('No portfolio available')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#00ffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="View Profile"
              >
                <ExternalLink size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FavoriteMentors;
