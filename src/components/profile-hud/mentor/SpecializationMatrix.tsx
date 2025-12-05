import React, { useState } from 'react';
import { MentorProfileUpdateDTO } from '../../../services/mentorProfileService';
import { X, Plus, Globe, Github, Linkedin } from 'lucide-react';
import './CommanderStyles.css';

interface SpecializationMatrixProps {
  formData: MentorProfileUpdateDTO;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
}

const SpecializationMatrix: React.FC<SpecializationMatrixProps> = ({ formData, onChange, onAddSkill, onRemoveSkill }) => {
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <div className="cmdr-panel">
      <div className="cmdr-panel-title">
        SPECIALIZATION MATRIX
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>SPEC-MAT-02</span>
      </div>

      {/* Skills Section */}
      <div className="cmdr-input-group">
        <label className="cmdr-label">Equipped Modules (Skills)</label>
        <div className="cmdr-modules-grid">
          {formData.skills?.map((skill, index) => (
            <div key={index} className="cmdr-module-chip">
              <div className="cmdr-module-icon"></div>
              {skill}
              <X 
                size={14} 
                style={{ cursor: 'pointer', marginLeft: '5px', opacity: 0.7 }} 
                onClick={() => onRemoveSkill(skill)}
              />
            </div>
          ))}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="cmdr-input" 
              style={{ width: '150px', padding: '0.2rem' }}
              placeholder="Add Module..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleAddSkill}
              style={{ background: 'none', border: '1px solid var(--cmdr-accent-cyan)', color: 'var(--cmdr-accent-cyan)', cursor: 'pointer', padding: '2px' }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Social Links / Domain */}
      <div style={{ marginTop: '2rem' }}>
        <label className="cmdr-label" style={{ marginBottom: '1rem' }}>Comms Uplinks</label>
        
        <div className="cmdr-grid-2">
          <div className="cmdr-input-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Linkedin size={18} color="var(--cmdr-accent-blue)" />
              <input 
                type="text" 
                name="socialLinks.linkedin" 
                className="cmdr-input" 
                placeholder="LinkedIn Frequency"
                value={formData.socialLinks?.linkedin || ''} 
                onChange={onChange} 
              />
            </div>
          </div>
          <div className="cmdr-input-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Github size={18} color="var(--cmdr-text-white)" />
              <input 
                type="text" 
                name="socialLinks.github" 
                className="cmdr-input" 
                placeholder="GitHub Repository"
                value={formData.socialLinks?.github || ''} 
                onChange={onChange} 
              />
            </div>
          </div>
        </div>

        <div className="cmdr-input-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={18} color="var(--cmdr-accent-cyan)" />
            <input 
              type="text" 
              name="socialLinks.website" 
              className="cmdr-input" 
              placeholder="Personal Domain URL"
              value={formData.socialLinks?.website || ''} 
              onChange={onChange} 
            />
          </div>
        </div>

        {formData.socialLinks?.website && (
          <div style={{ marginTop: '1rem' }}>
            <a 
              href={formData.socialLinks.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="cmdr-warp-link"
            >
              <Globe size={16} />
              INITIATE WARP TO DOMAIN
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecializationMatrix;
