import React from 'react';
import { MentorProfile } from '../../../services/mentorProfileService';
import { Camera } from 'lucide-react';
import './CommanderStyles.css';

interface CommanderHeaderProps {
  profile: MentorProfile | null;
  onAvatarUpload: (file: File) => void;
  preChatEnabled: boolean;
  onTogglePreChat: () => void;
}

const CommanderHeader: React.FC<CommanderHeaderProps> = ({ profile, onAvatarUpload, preChatEnabled, onTogglePreChat }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAvatarUpload(e.target.files[0]);
    }
  };

  return (
    <div className="cmdr-header">
      <div className="cmdr-avatar-container">
        <div className="cmdr-avatar-ring"></div>
        <img 
          src={profile?.avatar || 'https://via.placeholder.com/150'} 
          alt="Commander Avatar" 
          className="cmdr-avatar-img"
        />
        
        {/* Hidden File Input for Avatar Upload */}
        <input 
          type="file" 
          id="avatar-upload" 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
        />
        <label 
          htmlFor="avatar-upload" 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            right: 0, 
            background: 'var(--cmdr-accent-blue)', 
            color: '#fff', 
            padding: '5px', 
            borderRadius: '50%', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <Camera size={24} />
        </label>
      </div>

      <div className="cmdr-info-col">
        <div className="cmdr-rank-badge">
          {profile?.specialization ? profile.specialization.toUpperCase() : "NO SPECIALIZATION"}
        </div>
        <h1 className="cmdr-name">
          {profile?.firstName} {profile?.lastName}
        </h1>
        
        <div className="cmdr-stats-row">
          <div className="cmdr-stat-item">
            <span className="cmdr-stat-label">Students</span>
            <span className="cmdr-stat-value">50+</span>
          </div>
          <div className="cmdr-stat-item">
            <span className="cmdr-stat-label">Rating</span>
            <span className="cmdr-stat-value">4.9</span>
          </div>
          <div className="cmdr-stat-item">
            <span className="cmdr-stat-label">Missions</span>
            <span className="cmdr-stat-value">120</span>
          </div>
          <div className="cmdr-stat-item">
            <span className="cmdr-stat-label">EXP Level</span>
            <span className="cmdr-stat-value">{profile?.experience || 0} YRS</span>
          </div>
        </div>
      </div>

      <div className="cmdr-actions-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', marginLeft: 'auto' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--cmdr-text-dim)', marginBottom: '0.5rem', letterSpacing: '1px' }}>
          SYSTEM STATUS
        </div>
        <button 
          type="button"
          className={`cmdr-btn ${preChatEnabled ? 'cmdr-btn-primary' : 'cmdr-btn-danger'}`}
          onClick={onTogglePreChat}
          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
        >
          {preChatEnabled ? 'COMMS ONLINE' : 'COMMS OFFLINE'}
        </button>
      </div>
    </div>
  );
};

export default CommanderHeader;
