import React, { useState } from 'react';
import jobService from '../../services/jobService';
import { useToast } from '../../hooks/useToast';
import './fleet-styles.css';

interface MissionLaunchPadProps {
  onMissionLaunched?: () => void;
}

const MissionLaunchPad: React.FC<MissionLaunchPadProps> = ({ onMissionLaunched }) => {
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    minBudget: '',
    maxBudget: '',
    deadline: '',
    isRemote: true,
    location: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox manually since type narrowing can be tricky
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()]
        }));
        setSkillInput('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await jobService.createJob({
        title: formData.title,
        description: formData.description,
        requiredSkills: formData.skills,
        minBudget: Number(formData.minBudget),
        maxBudget: Number(formData.maxBudget),
        deadline: formData.deadline,
        isRemote: formData.isRemote,
        location: formData.location
      });
      
      showSuccess('Mission Initialized', 'Operation has been successfully launched.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        skills: [],
        minBudget: '',
        maxBudget: '',
        deadline: '',
        isRemote: true,
        location: ''
      });
      
      if (onMissionLaunched) {
        onMissionLaunched();
      }
    } catch (error) {
      console.error('Mission Launch Failed:', error);
      showError('Launch Aborted', 'Failed to initialize mission protocol.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fleet-panel">
      <div className="fleet-title">
        <i className="fas fa-rocket"></i>
        Initialize Mission Protocol
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: Input Fields */}
        <form onSubmit={handleSubmit}>
          <div className="fleet-input-group">
            <label className="fleet-label">Operation Codename (Title)</label>
            <input
              type="text"
              name="title"
              className="fleet-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Frontend React Overhaul"
              required
            />
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">Mission Brief (Description)</label>
            <textarea
              name="description"
              className="fleet-input"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the objectives..."
              rows={4}
              required
            />
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">Required Modules (Skills) - Press Enter</label>
            <input
              type="text"
              className="fleet-input"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillAdd}
              placeholder="Type skill and press Enter"
            />
            <div className="fleet-merc-skills" style={{ marginTop: '10px' }}>
              {formData.skills.map(skill => (
                <span key={skill} className="fleet-chip">{skill}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="fleet-input-group">
              <label className="fleet-label">Min Budget (VND)</label>
              <input
                type="number"
                name="minBudget"
                className="fleet-input"
                value={formData.minBudget}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">Max Budget (VND)</label>
              <input
                type="number"
                name="maxBudget"
                className="fleet-input"
                value={formData.maxBudget}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">Deadline</label>
            <input
              type="date"
              name="deadline"
              className="fleet-input"
              value={formData.deadline}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="fleet-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Initializing...' : 'Launch Mission'}
          </button>
        </form>

        {/* Right: Preview */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
          <div className="fleet-label" style={{ marginBottom: '10px' }}>Mission Preview</div>
          
          <div className="fleet-panel" style={{ border: '1px dashed var(--fleet-cyan)' }}>
            <h3 style={{ color: '#fff', margin: '0 0 10px 0' }}>{formData.title || 'Operation Title'}</h3>
            <p style={{ color: 'var(--fleet-text-muted)', fontSize: '0.9rem' }}>
              {formData.description || 'Mission description will appear here...'}
            </p>
            
            <div style={{ marginTop: '15px' }}>
              <div className="fleet-label">Budget Allocation</div>
              <div style={{ color: 'var(--fleet-success)', fontWeight: 'bold' }}>
                {formData.minBudget ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(formData.minBudget)) : '0'} - 
                {formData.maxBudget ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(formData.maxBudget)) : '0'}
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <div className="fleet-label">Required Tech</div>
              <div className="fleet-merc-skills">
                {formData.skills.length > 0 ? formData.skills.map(s => (
                  <span key={s} className="fleet-chip">{s}</span>
                )) : <span style={{ color: 'var(--fleet-text-muted)', fontStyle: 'italic' }}>No skills specified</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionLaunchPad;
