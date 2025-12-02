import React from 'react';
import './fleet-styles.css';

// Redefining interface here to avoid circular dependency or complex imports for now
// In a real refactor, this should be in a shared types file
export interface Freelancer {
  id: string;
  name: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  hourlyRate: number;
  avatar?: string;
}

interface MercenaryRadarProps {
  freelancers: Freelancer[];
}

const MercenaryRadar: React.FC<MercenaryRadarProps> = ({ freelancers }) => {
  return (
    <div className="fleet-panel">
      <div className="fleet-title">
        <i className="fas fa-radar"></i>
        Talent Radar
      </div>
      
      <div className="fleet-radar-list">
        {freelancers.map((merc) => (
          <div key={merc.id} className="fleet-merc-card">
            <div className="fleet-merc-avatar">
              {merc.avatar ? <img src={merc.avatar} alt={merc.name} /> : merc.name.charAt(0)}
            </div>
            <div className="fleet-merc-info">
              <span className="fleet-merc-name">{merc.name}</span>
              <div className="fleet-merc-skills">
                {merc.skills.slice(0, 3).map(skill => (
                  <span key={skill} className="fleet-chip">{skill}</span>
                ))}
                {merc.skills.length > 3 && <span className="fleet-chip">+{merc.skills.length - 3}</span>}
              </div>
            </div>
            <button className="fleet-btn-recruit" title="Recruit Pilot">
              <i className="fas fa-crosshairs"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MercenaryRadar;
