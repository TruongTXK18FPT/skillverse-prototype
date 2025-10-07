import React, { useState, useEffect } from 'react';
import { User, Save, Upload, Github, Linkedin, Globe, Award, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getMentorProfile, updateMentorProfile, uploadMentorAvatar, MentorProfile, MentorProfileUpdateDTO } from '../../services/mentorProfileService';
import '../../styles/MentorProfilePage.css';

const MentorProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [_profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<MentorProfileUpdateDTO>({
    firstName: '',
    lastName: '',
    bio: '',
    specialization: '',
    experience: 0,
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

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const profileData = await getMentorProfile(user.id);
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        bio: profileData.bio || '',
        specialization: profileData.specialization || '',
        experience: profileData.experience || 0,
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || '',
          github: profileData.socialLinks?.github || '',
          website: profileData.socialLinks?.website || ''
        },
        skills: profileData.skills || [],
        achievements: profileData.achievements || []
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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
      setFormData(prev => ({
        ...prev,
        [name]: value
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const result = await uploadMentorAvatar(user.id, file);
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
      const updatedProfile = await updateMentorProfile(user.id, formData);
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
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-profile-container">
      <div className="profile-header">
        <h1 className="profile-title">
          <User className="profile-icon" />
          Mentor Profile
        </h1>
        <p className="profile-subtitle">Manage your mentor profile and showcase your expertise</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-sections">
          {/* Basic Information */}
          <div className="profile-section">
            <h2 className="section-title">Basic Information</h2>
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
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="form-textarea"
                rows={4}
                placeholder="Tell us about yourself and your teaching philosophy..."
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="specialization" className="form-label">Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Web Development, Data Science"
                />
              </div>
              <div className="form-group">
                <label htmlFor="experience" className="form-label">Years of Experience</label>
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
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="profile-section">
            <h2 className="section-title">Profile Picture</h2>
            <div className="avatar-upload">
              <div className="avatar-preview">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="avatar-upload-controls">
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="avatar-input"
                  disabled={uploading}
                />
                <label htmlFor="avatar" className="avatar-upload-btn">
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload Avatar'}
                </label>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="profile-section">
            <h2 className="section-title">Social Links</h2>
            <div className="social-links">
              <div className="form-group">
                <label htmlFor="socialLinks.linkedin" className="form-label">
                  <Linkedin size={16} />
                  LinkedIn
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
                  GitHub
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
                  Website
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
          <div className="profile-section">
            <h2 className="section-title">Skills</h2>
            <div className="skills-container">
              <div className="skills-input">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="form-input"
                  placeholder="Add a skill..."
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
          <div className="profile-section">
            <h2 className="section-title">Achievements</h2>
            <div className="achievements-container">
              <div className="achievements-input">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  className="form-input"
                  placeholder="Add an achievement..."
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
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MentorProfilePage;

