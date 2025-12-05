import React, { useState } from 'react';
import { MentorProfileUpdateDTO } from '../../../services/mentorProfileService';
import { Plus, X, Award } from 'lucide-react';
import './CommanderStyles.css';

interface ExperienceTimelineProps {
  formData: MentorProfileUpdateDTO;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddAchievement: (achievement: string) => void;
  onRemoveAchievement: (achievement: string) => void;
}

const ExperienceTimeline: React.FC<ExperienceTimelineProps> = ({ formData, onChange, onAddAchievement, onRemoveAchievement }) => {
  const [newAchievement, setNewAchievement] = useState('');

  const handleAdd = () => {
    if (newAchievement.trim()) {
      onAddAchievement(newAchievement.trim());
      setNewAchievement('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="cmdr-panel">
      <div className="cmdr-panel-title">
        SERVICE RECORD & ACHIEVEMENTS
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>REC-LOG-03</span>
      </div>

      <div className="cmdr-input-group" style={{ maxWidth: '200px' }}>
        <label className="cmdr-label">Years in Service</label>
        <input 
          type="number" 
          name="experience" 
          className="cmdr-input" 
          value={formData.experience} 
          onChange={onChange} 
        />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <label className="cmdr-label" style={{ marginBottom: '1.5rem' }}>Mission Log (Achievements)</label>
        
        <div className="cmdr-timeline">
          {formData.achievements?.map((achievement, index) => (
            <div key={index} className="cmdr-timeline-node">
              <div className="cmdr-timeline-title">
                {achievement}
                <X 
                  size={14} 
                  style={{ cursor: 'pointer', marginLeft: '10px', color: 'var(--cmdr-text-dim)' }} 
                  onClick={() => onRemoveAchievement(achievement)}
                />
              </div>
              <div className="cmdr-timeline-date">MISSION COMPLETED</div>
            </div>
          ))}

          {/* Add New Node */}
          <div className="cmdr-timeline-node">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="cmdr-input" 
                placeholder="Log new achievement..."
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                onClick={handleAdd}
                style={{ background: 'none', border: '1px solid var(--cmdr-accent-cyan)', color: 'var(--cmdr-accent-cyan)', cursor: 'pointer', padding: '5px' }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceTimeline;
