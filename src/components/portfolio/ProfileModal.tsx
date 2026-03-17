// Create/Edit Extended Profile Modal
import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { UserProfileDTO } from '../../data/portfolioDTOs';
import '../../styles/PortfolioModals.css';

// Toast notification hook (simplified)
const useToast = () => {
  const [toasts, setToasts] = useState<Array<{id: number; message: string; type: 'success' | 'error'}>>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
};

// Constants
const FILE_VALIDATION = {
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
};

const DEFAULT_FORM_DATA: Partial<UserProfileDTO> = {
  professionalTitle: '',
  careerGoals: '',
  yearsOfExperience: 0,
  tagline: '',
  location: '',
  phone: '',
  availabilityStatus: 'AVAILABLE',
  hourlyRate: 0,
  preferredCurrency: 'VND',
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
};

interface ProfileModalProps {
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

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileDTO>>(DEFAULT_FORM_DATA);

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

  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const { toasts, showToast } = useToast();

  // Reset form when modal opens/closes or mode changes
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setAvatar(undefined);
    setVideo(undefined);
    setCoverImage(undefined);
    setAvatarPreview('');
    setVideoPreview('');
    setCoverPreview('');
    setSkills([]);
    setLanguages([]);
    setSkillInput('');
    setLanguageInput('');
    setFileErrors({});
  }, []);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setFormData(initialData);
        setAvatarPreview(initialData.portfolioAvatarUrl || '');
        setVideoPreview(initialData.videoIntroUrl || '');
        setCoverPreview(initialData.coverImageUrl || '');

        // Parse skills and languages
        try {
          if (initialData.topSkills) {
            setSkills(JSON.parse(initialData.topSkills));
          }
          if (initialData.languagesSpoken) {
            setLanguages(JSON.parse(initialData.languagesSpoken));
          }
        } catch (e) {
          console.error('Error parsing skills/languages', e);
        }
      } else {
        resetForm();
      }
    } else {
      // Reset when closing
      resetForm();
    }
  }, [isOpen, initialData, mode, resetForm]);

  // Validate file type and size
  const validateFile = (file: File, type: 'avatar' | 'video' | 'cover'): string | null => {
    if (type === 'video') {
      if (!FILE_VALIDATION.allowedVideoTypes.includes(file.type)) {
        return 'Định dạng video không được hỗ trợ. Vui lòng tải MP4, WebM hoặc OGG.';
      }
      if (file.size > FILE_VALIDATION.maxVideoSize) {
        return `Video quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). Tối đa 50MB.`;
      }
    } else {
      if (!FILE_VALIDATION.allowedImageTypes.includes(file.type)) {
        return 'Định dạng ảnh không được hỗ trợ. Vui lòng tải JPEG, PNG, GIF hoặc WebP.';
      }
      if (file.size > FILE_VALIDATION.maxImageSize) {
        return `Ảnh quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB.`;
      }
    }
    return null;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'video' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const error = validateFile(file, type);
    if (error) {
      setFileErrors(prev => ({ ...prev, [type]: error }));
      showToast(error, 'error');
      return;
    }

    // Clear previous error
    setFileErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });

    // Create preview
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

    // Validate required fields
    if (!formData.professionalTitle?.trim()) {
      showToast('Vui lòng nhập chức danh chuyên nghiệp', 'error');
      return;
    }

    setLoading(true);

    try {
      // Convert skills and languages to JSON strings
      const profileData = {
        ...formData,
        topSkills: JSON.stringify(skills),
        languagesSpoken: JSON.stringify(languages),
      };

      await onSubmit(profileData, avatar, video, coverImage);

      showToast(
        mode === 'create' ? 'Tạo portfolio thành công!' : 'Cập nhật portfolio thành công!',
        'success'
      );
      onClose();
    } catch (error) {
      console.error('Error submitting profile:', error);

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          showToast('Yêu cầu mất quá lâu. Vui lòng kiểm tra kích thước file và thử lại.', 'error');
        } else if (error.message.includes('Network Error')) {
          showToast('Lỗi kết nối mạng. Vui lòng kiểm tra internet.', 'error');
        } else {
          showToast(`Lỗi: ${error.message}`, 'error');
        }
      } else {
        showToast('Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Container */}
      <div className="toast-container" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        ))}
      </div>

      <div className="pf-modal-overlay" onClick={onClose}>
        <div className="pf-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="pf-modal-header">
            <h2>{mode === 'create' ? 'Tạo Portfolio Mở Rộng' : 'Chỉnh Sửa Portfolio'}</h2>
            <button className="pf-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="pf-modal-body">
            {/* Professional Info */}
            <div className="pf-form-section">
              <h3>Thông Tin Nghề Nghiệp</h3>

              <div className="pf-form-group">
                <label>Chức Danh Chuyên Nghiệp *</label>
                <input
                  type="text"
                  value={formData.professionalTitle || ''}
                  onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                  placeholder="VD: Full Stack Developer"
                  required
                />
              </div>

              <div className="pf-form-group">
                <label>Tagline</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="VD: Building amazing web experiences"
                  maxLength={100}
                />
              </div>

              <div className="pf-form-row">
                <div className="pf-form-group">
                  <label>Số Năm Kinh Nghiệm</label>
                  <input
                    type="number"
                    value={formData.yearsOfExperience || 0}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                <div className="pf-form-group">
                  <label>Vị Trí</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="VD: TP.HCM, Việt Nam"
                  />
                </div>
              </div>

              <div className="pf-form-group">
                <label>Số Điện Thoại</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0912345678"
                />
              </div>

              <div className="pf-form-group">
                <label>Mục Tiêu Nghề Nghiệp</label>
                <textarea
                  value={formData.careerGoals || ''}
                  onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
                  placeholder="Mô tả mục tiêu nghề nghiệp của bạn..."
                  rows={4}
                />
              </div>
            </div>

            {/* Media Uploads */}
            <div className="pf-form-section">
              <h3>Media</h3>

              <div className="pf-form-row">
                <div className="pf-form-group">
                  <label>Avatar Portfolio</label>
                  <div className="pf-file-upload">
                    {avatarPreview && (
                      <img src={avatarPreview} alt="Avatar preview" className="pf-preview-image" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => handleFileChange(e, 'avatar')}
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" className="pf-upload-btn">
                      <Upload size={18} />
                      Tải Avatar
                    </label>
                    {fileErrors.avatar && (
                      <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        {fileErrors.avatar}
                      </small>
                    )}
                  </div>
                </div>

                <div className="pf-form-group">
                  <label>Ảnh Bìa</label>
                  <div className="pf-file-upload">
                    {coverPreview && (
                      <img src={coverPreview} alt="Cover preview" className="pf-preview-image-wide" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => handleFileChange(e, 'cover')}
                      id="cover-upload"
                    />
                    <label htmlFor="cover-upload" className="pf-upload-btn">
                      <Upload size={18} />
                      Tải Ảnh Bìa
                    </label>
                    {fileErrors.cover && (
                      <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        {fileErrors.cover}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <div className="pf-form-group">
                <label>Video Giới Thiệu</label>
                <div className="pf-file-upload">
                  {videoPreview && (
                    <video src={videoPreview} controls className="pf-preview-video" />
                  )}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={(e) => handleFileChange(e, 'video')}
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="pf-upload-btn">
                    <Upload size={18} />
                    Tải Video
                  </label>
                  {fileErrors.video && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                      {fileErrors.video}
                    </small>
                  )}
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="pf-form-section">
              <h3>Liên Kết Chuyên Nghiệp</h3>

              <div className="pf-form-group">
                <label>LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedinUrl || ''}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div className="pf-form-group">
                <label>GitHub</label>
                <input
                  type="url"
                  value={formData.githubUrl || ''}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="pf-form-row">
                <div className="pf-form-group">
                  <label>Portfolio Website</label>
                  <input
                    type="url"
                    value={formData.portfolioWebsiteUrl || ''}
                    onChange={(e) => setFormData({ ...formData, portfolioWebsiteUrl: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="pf-form-group">
                  <label>Behance</label>
                  <input
                    type="url"
                    value={formData.behanceUrl || ''}
                    onChange={(e) => setFormData({ ...formData, behanceUrl: e.target.value })}
                    placeholder="https://behance.net/yourprofile"
                  />
                </div>
              </div>

              <div className="pf-form-group">
                <label>Dribbble</label>
                <input
                  type="url"
                  value={formData.dribbbleUrl || ''}
                  onChange={(e) => setFormData({ ...formData, dribbbleUrl: e.target.value })}
                  placeholder="https://dribbble.com/yourprofile"
                />
              </div>
            </div>

            {/* Skills & Languages */}
            <div className="pf-form-section">
              <h3>Kỹ Năng & Ngôn Ngữ</h3>

              <div className="pf-form-group">
                <label>Kỹ Năng Chính</label>
                <div className="pf-tags-input">
                  <div className="pf-tags-list">
                    {skills.map((skill, idx) => (
                      <span key={idx} className="pf-tag">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="pf-tag-input-row">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Nhập kỹ năng và Enter"
                    />
                    <button type="button" onClick={handleAddSkill} className="pf-btn-add">+</button>
                  </div>
                </div>
              </div>

              <div className="pf-form-group">
                <label>Ngôn Ngữ</label>
                <div className="pf-tags-input">
                  <div className="pf-tags-list">
                    {languages.map((lang, idx) => (
                      <span key={idx} className="pf-tag">
                        {lang}
                        <button type="button" onClick={() => handleRemoveLanguage(lang)}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="pf-tag-input-row">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                      placeholder="Nhập ngôn ngữ và Enter"
                    />
                    <button type="button" onClick={handleAddLanguage} className="pf-btn-add">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate & Availability */}
            <div className="pf-form-section">
              <h3>Mức Giá & Sẵn Sàng</h3>

              <div className="pf-form-row">
                <div className="pf-form-group">
                  <label>Trạng Thái</label>
                  <select
                    value={formData.availabilityStatus || 'AVAILABLE'}
                    onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                  >
                    <option value="AVAILABLE">Sẵn Sàng</option>
                    <option value="BUSY">Bận</option>
                    <option value="NOT_AVAILABLE">Không Sẵn Sàng</option>
                  </select>
                </div>

                <div className="pf-form-group">
                  <label>Mức Giá/Giờ</label>
                  <input
                    type="number"
                    value={formData.hourlyRate || 0}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="pf-form-group">
                  <label>Tiền Tệ</label>
                  <select
                    value={formData.preferredCurrency || 'VND'}
                    onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                  >
                    <option value="VND">VND (Việt Nam)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="pf-form-section">
              <h3>Cài Đặt Riêng Tư</h3>

              <div className="pf-form-checkbox">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic || false}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <label htmlFor="isPublic">Công Khai Portfolio</label>
              </div>

              <div className="pf-form-checkbox">
                <input
                  type="checkbox"
                  id="showContactInfo"
                  checked={formData.showContactInfo || false}
                  onChange={(e) => setFormData({ ...formData, showContactInfo: e.target.checked })}
                />
                <label htmlFor="showContactInfo">Hiển Thị Thông Tin Liên Hệ</label>
              </div>

              <div className="pf-form-checkbox">
                <input
                  type="checkbox"
                  id="allowJobOffers"
                  checked={formData.allowJobOffers || false}
                  onChange={(e) => setFormData({ ...formData, allowJobOffers: e.target.checked })}
                />
                <label htmlFor="allowJobOffers">Nhận Đề Nghị Công Việc</label>
              </div>

              <div className="pf-form-group">
                <label>Custom URL Slug</label>
                <input
                  type="text"
                  value={formData.customUrlSlug || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    customUrlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  })}
                  placeholder="VD: john-doe-developer"
                />
                <small style={{ color: 'var(--text-secondary)' }}>
                  URL của bạn: <code style={{
                    background: 'var(--bg-secondary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.85em'
                  }}>
                    {typeof window !== 'undefined' ? window.location.origin : ''}/portfolio/{formData.customUrlSlug || 'your-slug'}
                  </code>
                </small>
              </div>
            </div>

            {/* SEO */}
            <div className="pf-form-section">
              <h3>SEO (Tùy Chọn)</h3>

              <div className="pf-form-group">
                <label>Meta Description</label>
                <textarea
                  value={formData.metaDescription || ''}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Mô tả ngắn cho SEO..."
                  rows={2}
                  maxLength={160}
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  {(formData.metaDescription || '').length}/160 ký tự
                </small>
              </div>
            </div>

            <div className="pf-modal-footer">
              <button type="button" onClick={onClose} className="pf-btn pf-btn-secondary" disabled={loading}>
                Hủy
              </button>
              <button type="submit" className="pf-btn pf-btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <MeowlKuruLoader size="tiny" text="" />
                    Đang lưu...
                  </>
                ) : (
                  mode === 'create' ? 'Tạo Portfolio' : 'Lưu Thay Đổi'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
