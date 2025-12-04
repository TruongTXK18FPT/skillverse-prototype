import React, { useState, useEffect } from 'react';
import { User, Save, Upload, Github, Linkedin, Globe, Award, Plus, X, Power } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getMyMentorProfile, updateMyMentorProfile, uploadMyMentorAvatar, setPreChatEnabled, MentorProfile, MentorProfileUpdateDTO } from '../../services/mentorProfileService';
import '../../styles/MentorProfilePage.css';

const MentorProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [_profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preChatEnabled, setPreChatEnabledState] = useState(true);
  
  const [formData, setFormData] = useState<MentorProfileUpdateDTO>({
    firstName: '',
    lastName: '',
    bio: '',
    specialization: '',
    experience: 0,
    hourlyRate: undefined,
    socialLinks: {
      linkedin: '',
      github: '',
      website: ''
    },
    skills: [],
    achievements: []
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [fileName, setFileName] = useState<string>('');

  const loadProfile = React.useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Use getMyMentorProfile() for current logged-in mentor
      const profileData = await getMyMentorProfile();
      setProfile(profileData);
      setPreChatEnabledState(profileData.preChatEnabled ?? true);
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        bio: profileData.bio || '',
        specialization: profileData.specialization || '',
        experience: profileData.experience || 0,
        hourlyRate: profileData.hourlyRate || undefined,
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || '',
          github: profileData.socialLinks?.github || '',
          website: profileData.socialLinks?.website || ''
        },
        skills: profileData.skills || [],
        achievements: profileData.achievements || []
      });
      
      // Set avatar preview if exists
      if (profileData.avatar) {
        setFormData(prev => ({ ...prev, avatar: profileData.avatar }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id, loadProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('socialLinks.')) {
      const socialKey = name.split('.')[1] as keyof typeof formData.socialLinks;
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      const parsedValue = name === 'experience' ? Number(value) : name === 'hourlyRate' ? Number(value) : value;
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue as any
      }));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim() && !formData.achievements?.includes(newAchievement.trim())) {
      setFormData(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (achievementToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements?.filter(achievement => achievement !== achievementToRemove) || []
    }));
  };

  const handleTogglePreChat = async () => {
    try {
      const newState = !preChatEnabled;
      await setPreChatEnabled(newState);
      setPreChatEnabledState(newState);
      showSuccess('Success', `Booking system ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling pre-chat:', error);
      showError('Error', 'Failed to update booking status');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    setFileName(file.name);
    try {
      const result = await uploadMyMentorAvatar(file);
      setFormData(prev => ({
        ...prev,
        avatar: result.avatarUrl
      }));
      showSuccess('Success', 'Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showError('Error', 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    try {
      const updatedProfile = await updateMyMentorProfile(formData);
      setProfile(updatedProfile);
      showSuccess('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mentor-profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-profile-container">
      {/* Background Effects */}
      <div className="profile-bg-effects">
        <div className="profile-grid-overlay"></div>
        <div className="profile-glow-orb orb-1"></div>
        <div className="profile-glow-orb orb-2"></div>
      </div>

      <div className="mentor-profile-header">
        <div className="mentor-header-content">
          <h1 className="mentor-profile-title">
            <User className="profile-icon" />
            <span className="title-text">MENTOR <span className="highlight">PROFILE</span></span>
          </h1>
          <p className="mentor-profile-subtitle">Manage your digital identity and expertise matrix</p>
        </div>
        <div className="mentor-header-actions">
          <button 
            type="button" 
            className={`mentor-status-toggle ${preChatEnabled ? 'active' : 'inactive'}`}
            onClick={handleTogglePreChat}
          >
            <Power size={18} />
            <span>{preChatEnabled ? 'BOOKING ACTIVE' : 'BOOKING PAUSED'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mentor-profile-form">
        <div className="mentor-profile-sections">
          {/* Basic Information */}
          <div className="mentor-profile-section">
            <h2 className="mentor-section-title">
              <div className="mentor-section-icon-wrapper"><User size={20} /></div>
              Identity Module
            </h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="bio" className="form-label">Bio Data</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="form-textarea"
                rows={4}
                placeholder="Initialize bio sequence..."
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="specialization" className="form-label">Core Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Cybernetics, Quantum Computing"
                />
              </div>
              <div className="form-group">
                <label htmlFor="experience" className="form-label">Experience Cycles (Years)</label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                  max="50"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hourlyRate" className="form-label">Giá theo giờ (VND)</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate ?? ''}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                  step="0.01"
                  placeholder="Enter your rate per hour"
                />
              </div>
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="mentor-profile-section">
            <h2 className="mentor-section-title">
              <div className="mentor-section-icon-wrapper"><Upload size={20} /></div>
              Holographic Avatar
            </h2>
            <div className="mentor-avatar-upload">
              <div className="mentor-avatar-preview-wrapper">
                <div className="mentor-avatar-preview">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="mentor-avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <div className="mentor-avatar-ring"></div>
              </div>
              <div className="mentor-avatar-controls">
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="mentor-avatar-input"
                  disabled={uploading}
                />
                <label htmlFor="avatar" className="mentor-avatar-upload-btn-special">
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'UPLOAD AVATAR'}
                </label>
                {fileName && <p className="mentor-file-name-display">Selected: {fileName}</p>}
                <p className="mentor-upload-hint">Supported formats: PNG, JPG (Max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mentor-profile-section">
            <h2 className="mentor-section-title">
              <div className="mentor-section-icon-wrapper"><Globe size={20} /></div>
              Network Uplinks
            </h2>
            <div className="social-links">
              <div className="form-group">
                <label htmlFor="socialLinks.linkedin" className="form-label">
                  <Linkedin size={16} />
                  LinkedIn Frequency
                </label>
                <input
                  type="url"
                  id="socialLinks.linkedin"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks?.linkedin || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="form-group">
                <label htmlFor="socialLinks.github" className="form-label">
                  <Github size={16} />
                  GitHub Repository
                </label>
                <input
                  type="url"
                  id="socialLinks.github"
                  name="socialLinks.github"
                  value={formData.socialLinks?.github || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://github.com/yourusername"
                />
              </div>
              <div className="form-group">
                <label htmlFor="socialLinks.website" className="form-label">
                  <Globe size={16} />
                  Personal Domain
                </label>
                <input
                  type="url"
                  id="socialLinks.website"
                  name="socialLinks.website"
                  value={formData.socialLinks?.website || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mentor-profile-section">
            <h2 className="mentor-section-title">
              <div className="mentor-section-icon-wrapper"><Award size={20} /></div>
              Skill Matrix
            </h2>
            <div className="skills-container">
              <div className="skills-input">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="form-input"
                  placeholder="Initialize new skill protocol..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="add-btn"
                  disabled={!newSkill.trim()}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="skills-list">
                {formData.skills?.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="remove-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="mentor-profile-section">
            <h2 className="mentor-section-title">
              <div className="mentor-section-icon-wrapper"><Award size={20} /></div>
              Achievement Logs
            </h2>
            <div className="achievements-container">
              <div className="achievements-input">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  className="form-input"
                  placeholder="Log new achievement..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAchievement())}
                />
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="add-btn"
                  disabled={!newAchievement.trim()}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="achievements-list">
                {formData.achievements?.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <Award size={16} />
                    <span>{achievement}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(achievement)}
                      className="remove-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="save-btn"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving Data...' : 'Save Profile Data'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MentorProfilePage;
