import React from 'react';
import { Building2, CheckCircle } from 'lucide-react';
import './corp-styles.css';

interface CorporateHeaderProps {
  profile: any; // Using any for flexibility with RecruiterProfileData
  onEdit?: () => void;
}

const CorporateHeader: React.FC<CorporateHeaderProps> = ({ profile, onEdit }) => {
  if (!profile) return null;

  return (
    <div className="corp-header">
      <div className="corp-logo-frame">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="Corp Logo" className="corp-logo" />
        ) : (
          <Building2 size={60} color="#fbbf24" />
        )}
      </div>
      
      <div className="corp-info">
        <h1 className="corp-name">{profile.companyName || profile.fullName || 'UNREGISTERED CORP'}</h1>
        
        <div className="corp-meta">
          <span>ID: {profile.id?.substring(0, 8).toUpperCase()}</span>
          <span>EST: {new Date(profile.createdAt || Date.now()).getFullYear()}</span>
          
          {profile.applicationStatus === 'APPROVED' && (
            <div className="corp-verified-badge">
              <CheckCircle size={14} />
              VERIFIED ENTITY
            </div>
          )}
        </div>
      </div>

      {onEdit && (
        <button className="corp-btn" style={{ width: 'auto' }} onClick={onEdit}>
          UPDATE REGISTRY
        </button>
      )}
    </div>
  );
};

export default CorporateHeader;
