// PILOT ID MODAL - Profile Creation/Edit with Mothership Theme
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { UserProfileDTO } from '../../data/portfolioDTOs';
import { useScrollLock } from './useScrollLock';
import './dossier-portfolio-styles.css';

interface PilotIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    profile: Partial<UserProfileDTO>,
    avatar?: File,
    video?: File,
    coverImage?: File
  ) => Promise<void>;
  initialData?: UserProfileDTO;
  mode: 'create' | 'edit';
}

export const PilotIDModal: React.FC<PilotIDModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  useScrollLock(isOpen);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileDTO>>({
    professionalTitle: '',
    careerGoals: '',
    yearsOfExperience: 0,
    tagline: '',
    location: '',
    availabilityStatus: 'AVAILABLE',
    hourlyRate: 0,
    preferredCurrency: 'USD',
    linkedinUrl: '',
    githubUrl: '',
    portfolioWebsiteUrl: '',
    behanceUrl: '',
    dribbbleUrl: '',
    topSkills: '[]',
    languagesSpoken: '[]',
    isPublic: true,
    showContactInfo: true,
    allowJobOffers: true,
    customUrlSlug: '',
    metaDescription: '',
  });

  const [avatar, setAvatar] = useState<File | undefined>();
  const [video, setVideo] = useState<File | undefined>();
  const [coverImage, setCoverImage] = useState<File | undefined>();

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');

  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [alertModal, setAlertModal] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'warning' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setAvatarPreview(initialData.portfolioAvatarUrl || '');
      setVideoPreview(initialData.videoIntroUrl || '');
      setCoverPreview(initialData.coverImageUrl || '');

      try {
        if (initialData.topSkills) setSkills(JSON.parse(initialData.topSkills));
        if (initialData.languagesSpoken) setLanguages(JSON.parse(initialData.languagesSpoken));
      } catch (e) {
        console.error('Error parsing skills/languages', e);
      }
    }
  }, [initialData]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'video' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === 'avatar') {
        setAvatar(file);
        setAvatarPreview(preview);
      } else if (type === 'video') {
        setVideo(file);
        setVideoPreview(preview);
      } else {
        setCoverImage(file);
        setCoverPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setLanguages([...languages, languageInput.trim()]);
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const maxFileSize = 10 * 1024 * 1024;
      const maxVideoSize = 50 * 1024 * 1024;

      if (avatar && avatar.size > maxFileSize) {
        setAlertModal({
          show: true,
          message: `Avatar too large (${(avatar.size / 1024 / 1024).toFixed(2)}MB). Max 10MB.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      if (video && video.size > maxVideoSize) {
        setAlertModal({
          show: true,
          message: `Video too large (${(video.size / 1024 / 1024).toFixed(2)}MB). Max 50MB.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      if (coverImage && coverImage.size > maxFileSize) {
        setAlertModal({
          show: true,
          message: `Cover image too large (${(coverImage.size / 1024 / 1024).toFixed(2)}MB). Max 10MB.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      const profileData = {
        ...formData,
        topSkills: JSON.stringify(skills),
        languagesSpoken: JSON.stringify(languages),
      };

      await onSubmit(profileData, avatar, video, coverImage);
      onClose();
    } catch (error) {
      console.error('Error submitting profile:', error);
      if (error instanceof Error) {
        setAlertModal({
          show: true,
          message: `Error: ${error.message}`,
          type: 'error'
        });
      } else {
        setAlertModal({
          show: true,
          message: 'An error occurred. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dossier-modal-overlay" onClick={onClose}>
      <div className="dossier-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="dossier-modal-header">
          <div>
            <h2 className="dossier-modal-title">
              {mode === 'create' ? 'CREATE PILOT ID' : 'UPDATE PILOT ID'}
            </h2>
            <p className="dossier-modal-subtitle">Configure tactical dossier parameters</p>
          </div>
          <button className="dossier-modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dossier-modal-body">
          {/* Professional Info */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">PILOT CREDENTIALS</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Professional Title *</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.professionalTitle || ''}
                onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                placeholder="e.g., Full Stack Developer"
                required
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Tagline</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g., Building amazing web experiences"
                maxLength={100}
              />
            </div>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Experience (Years)</label>
                <input
                  type="number"
                  className="dossier-input"
                  value={formData.yearsOfExperience || 0}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Location</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., HCMC, Vietnam"
                />
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Career Objectives</label>
              <textarea
                className="dossier-textarea"
                value={formData.careerGoals || ''}
                onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
                placeholder="Describe career goals..."
                rows={4}
              />
            </div>
          </div>

          {/* Media Uploads */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">MEDIA ASSETS</h3>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Avatar</label>
                <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '1rem', textAlign: 'center' }}>
                  {avatarPreview && (
                    <img src={avatarPreview} alt="Avatar" style={{ width: '120px', height: '120px', objectFit: 'cover', marginBottom: '1rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    id="avatar-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="avatar-upload" className="dossier-btn-primary" style={{ cursor: 'pointer' }}>
                    <Upload size={18} />
                    Upload Avatar
                  </label>
                </div>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Cover Image</label>
                <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '1rem', textAlign: 'center' }}>
                  {coverPreview && (
                    <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100px', objectFit: 'cover', marginBottom: '1rem' }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'cover')}
                    id="cover-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="cover-upload" className="dossier-btn-primary" style={{ cursor: 'pointer' }}>
                    <Upload size={18} />
                    Upload Cover
                  </label>
                </div>
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Video Intro</label>
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '1rem', textAlign: 'center' }}>
                {videoPreview && (
                  <video src={videoPreview} controls style={{ width: '100%', maxHeight: '200px', marginBottom: '1rem' }} />
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'video')}
                  id="video-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="video-upload" className="dossier-btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={18} />
                  Upload Video
                </label>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">EXTERNAL LINKS</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">LinkedIn</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.linkedinUrl || ''}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">GitHub</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.githubUrl || ''}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Portfolio Site</label>
                <input
                  type="url"
                  className="dossier-input"
                  value={formData.portfolioWebsiteUrl || ''}
                  onChange={(e) => setFormData({ ...formData, portfolioWebsiteUrl: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Behance</label>
                <input
                  type="url"
                  className="dossier-input"
                  value={formData.behanceUrl || ''}
                  onChange={(e) => setFormData({ ...formData, behanceUrl: e.target.value })}
                  placeholder="https://behance.net/you"
                />
              </div>
            </div>
          </div>

          {/* Skills & Languages */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">SKILLS & LANGUAGES</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Core Skills</label>
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '0.75rem' }}>
                <div className="dossier-module-tags" style={{ marginBottom: '0.75rem' }}>
                  {skills.map((skill, idx) => (
                    <span key={idx} className="dossier-module-tag">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--dossier-cyan)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="dossier-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill and press Enter"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddSkill} className="dossier-btn-primary">+</button>
                </div>
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Languages</label>
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '0.75rem' }}>
                <div className="dossier-module-tags" style={{ marginBottom: '0.75rem' }}>
                  {languages.map((lang, idx) => (
                    <span key={idx} className="dossier-module-tag">
                      {lang}
                      <button type="button" onClick={() => handleRemoveLanguage(lang)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--dossier-cyan)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="dossier-input"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                    placeholder="Add language and press Enter"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddLanguage} className="dossier-btn-primary">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Rate & Availability */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">AVAILABILITY & RATE</h3>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Status</label>
                <select
                  className="dossier-select"
                  value={formData.availabilityStatus || 'AVAILABLE'}
                  onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="BUSY">Busy</option>
                  <option value="NOT_AVAILABLE">Not Available</option>
                </select>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Hourly Rate</label>
                <input
                  type="number"
                  className="dossier-input"
                  value={formData.hourlyRate || 0}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Currency</label>
                <select
                  className="dossier-select"
                  value={formData.preferredCurrency || 'USD'}
                  onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">PRIVACY SETTINGS</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isPublic || false}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--dossier-silver)' }}>Public Portfolio</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.showContactInfo || false}
                  onChange={(e) => setFormData({ ...formData, showContactInfo: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--dossier-silver)' }}>Show Contact Info</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.allowJobOffers || false}
                  onChange={(e) => setFormData({ ...formData, allowJobOffers: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--dossier-silver)' }}>Accept Job Offers</span>
              </label>
            </div>

            <div className="dossier-form-group" style={{ marginTop: '1rem' }}>
              <label className="dossier-form-label">Custom URL Slug</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.customUrlSlug || ''}
                onChange={(e) => setFormData({ ...formData, customUrlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="e.g., john-doe-developer"
              />
              <small style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                URL: /portfolio/{formData.customUrlSlug || 'your-slug'}
              </small>
            </div>
          </div>

          <div className="dossier-modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
            <button type="button" onClick={onClose} className="dossier-btn-secondary" disabled={loading}>
              CANCEL
            </button>
            <button type="submit" className="dossier-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="dossier-spinner" size={18} />
                  SAVING...
                </>
              ) : (
                mode === 'create' ? 'CREATE ID' : 'UPDATE ID'
              )}
            </button>
          </div>
        </form>
      </div>

      <SystemAlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({...alertModal, show: false})}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default PilotIDModal;