import React from 'react';
import { MentorProfileUpdateDTO } from '../../../services/mentorProfileService';
import './CommanderStyles.css';

interface IdentityModuleProps {
  formData: MentorProfileUpdateDTO;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const IdentityModule: React.FC<IdentityModuleProps> = ({ formData, onChange }) => {
  return (
    <div className="cmdr-panel">
      <div className="cmdr-panel-title">
        IDENTITY MODULE
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>ID-MOD-01</span>
      </div>

      <div className="cmdr-grid-2">
        <div className="cmdr-input-group">
          <label className="cmdr-label">First Name</label>
          <input 
            type="text" 
            name="firstName" 
            className="cmdr-input" 
            value={formData.firstName} 
            onChange={onChange} 
          />
        </div>
        <div className="cmdr-input-group">
          <label className="cmdr-label">Last Name</label>
          <input 
            type="text" 
            name="lastName" 
            className="cmdr-input" 
            value={formData.lastName} 
            onChange={onChange} 
          />
        </div>
      </div>

      <div className="cmdr-grid-2">
        <div className="cmdr-input-group">
          <label className="cmdr-label">Specialization (Class)</label>
          <input 
            type="text" 
            name="specialization" 
            className="cmdr-input" 
            value={formData.specialization} 
            onChange={onChange} 
          />
        </div>
        <div className="cmdr-input-group">
          <label className="cmdr-label">Hourly Rate (Credits)</label>
          <input 
            type="number" 
            name="hourlyRate" 
            className="cmdr-input" 
            value={formData.hourlyRate || ''} 
            onChange={onChange} 
          />
        </div>
      </div>

      <div className="cmdr-input-group">
        <label className="cmdr-label">Bio / Mission Log</label>
        <textarea 
          name="bio" 
          className="cmdr-bio-area" 
          value={formData.bio} 
          onChange={onChange}
          placeholder="Enter personnel biography..."
        />
      </div>
    </div>
  );
};

export default IdentityModule;
