// PILOT ID MODAL - Profile Creation/Edit with Mothership Theme
import React, { useCallback, useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { UserProfileDTO } from '../../data/portfolioDTOs';
import { validateImage } from '../../services/fileUploadService';
import getCroppedImg from '../../utils/cropImage';
import { useScrollLock } from './useScrollLock';
import SystemAlertModal from './SystemAlertModal';
import './dossier-portfolio-styles.css';

const RESERVED_PORTFOLIO_SLUGS = new Set(['create']);

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
    fullName: '',
    professionalTitle: '',
    careerGoals: '',
    yearsOfExperience: 0,
    tagline: '',
    location: '',
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
  });

  const [avatar, setAvatar] = useState<File | undefined>();
  const [video, setVideo] = useState<File | undefined>();
  const [coverImage, setCoverImage] = useState<File | undefined>();

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarCropTempUrl, setAvatarCropTempUrl] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] =
    useState<Area | null>(null);

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
      setFormData({
        ...initialData,
        preferredCurrency: 'VND'
      });
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
    e.target.value = '';
    if (!file) return;

    if (type === 'avatar') {
      const validation = validateImage(file);
      if (!validation.valid) {
        setAlertModal({
          show: true,
          message: validation.error || 'Ảnh đại diện không hợp lệ.',
          type: 'warning'
        });
        return;
      }

      if (avatarCropTempUrl) {
        URL.revokeObjectURL(avatarCropTempUrl);
      }

      setAvatarCropTempUrl(URL.createObjectURL(file));
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
      setAvatarCroppedAreaPixels(null);
      setAvatarCropOpen(true);
      return;
    }

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

  const handleAvatarCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setAvatarCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const closeAvatarCropModal = useCallback(() => {
    setAvatarCropOpen(false);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarCroppedAreaPixels(null);

    if (avatarCropTempUrl) {
      URL.revokeObjectURL(avatarCropTempUrl);
    }
    setAvatarCropTempUrl(null);
  }, [avatarCropTempUrl]);

  const handleAvatarCropConfirm = async () => {
    if (!avatarCropTempUrl || !avatarCroppedAreaPixels) {
      setAlertModal({
        show: true,
        message: 'Không thể xử lý ảnh đại diện. Vui lòng thử lại.',
        type: 'warning'
      });
      return;
    }

    try {
      const croppedAvatar = await getCroppedImg(
        avatarCropTempUrl,
        avatarCroppedAreaPixels,
      );

      if (!croppedAvatar) {
        throw new Error('Không thể cắt ảnh đại diện.');
      }

      setAvatar(croppedAvatar);
      setAvatarPreview(URL.createObjectURL(croppedAvatar));
      closeAvatarCropModal();
    } catch (error) {
      console.error('Failed to crop pilot avatar:', error);
      setAlertModal({
        show: true,
        message: 'Cắt ảnh đại diện thất bại. Vui lòng thử lại.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    return () => {
      if (avatarCropTempUrl) {
        URL.revokeObjectURL(avatarCropTempUrl);
      }
    };
  }, [avatarCropTempUrl]);

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
          message: `Ảnh đại diện quá lớn (${(avatar.size / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      if (video && video.size > maxVideoSize) {
        setAlertModal({
          show: true,
          message: `Video quá lớn (${(video.size / 1024 / 1024).toFixed(2)}MB). Tối đa 50MB.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      if (coverImage && coverImage.size > maxFileSize) {
        setAlertModal({
          show: true,
          message: `Ảnh bìa quá lớn (${(coverImage.size / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }
      const normalizedSlug = (formData.customUrlSlug || '').trim().toLowerCase();
      if (normalizedSlug && RESERVED_PORTFOLIO_SLUGS.has(normalizedSlug)) {
        setAlertModal({
          show: true,
          message: `"${normalizedSlug}" là slug dự trữ hệ thống. Vui lòng chọn slug khác.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      const profileData = {
        ...formData,
        preferredCurrency: 'VND',
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
          message: `Lỗi: ${error.message}`,
          type: 'error'
        });
      } else {
        setAlertModal({
          show: true,
          message: 'Đã xảy ra lỗi. Vui lòng thử lại.',
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
        {avatarCropOpen && avatarCropTempUrl && (
          <div className="dossier-avatar-crop-overlay" onClick={closeAvatarCropModal}>
            <div
              className="dossier-avatar-crop-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="dossier-avatar-crop-modal__header">
                <h3>Chỉnh ảnh đại diện Portfolio</h3>
                <button
                  type="button"
                  className="dossier-avatar-crop-modal__close"
                  onClick={closeAvatarCropModal}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>

              <p className="dossier-avatar-crop-modal__hint">
                Kéo ảnh để căn khung tròn, sau đó chỉnh vị trí trái/phải và zoom.
              </p>

              <div className="dossier-avatar-crop-stage">
                <Cropper
                  image={avatarCropTempUrl}
                  crop={avatarCrop}
                  zoom={avatarZoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  objectFit="horizontal-cover"
                  onCropChange={setAvatarCrop}
                  onCropComplete={handleAvatarCropComplete}
                  onZoomChange={setAvatarZoom}
                />
              </div>

              <div className="dossier-avatar-crop-control">
                <label htmlFor="pilot-avatar-horizontal-position">
                  Vị trí trái / phải
                </label>
                <input
                  id="pilot-avatar-horizontal-position"
                  type="range"
                  min={-200}
                  max={200}
                  step={1}
                  value={avatarCrop.x}
                  onChange={(event) =>
                    setAvatarCrop((prev) => ({
                      ...prev,
                      x: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="dossier-avatar-crop-control">
                <label htmlFor="pilot-avatar-zoom-level">Zoom</label>
                <input
                  id="pilot-avatar-zoom-level"
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={avatarZoom}
                  onChange={(event) => setAvatarZoom(Number(event.target.value))}
                />
              </div>

              <div className="dossier-avatar-crop-modal__actions">
                <button
                  type="button"
                  className="dossier-btn-secondary"
                  onClick={closeAvatarCropModal}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="dossier-btn-primary"
                  onClick={handleAvatarCropConfirm}
                >
                  Lưu ảnh đại diện
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="dossier-modal-header">
          <div>
            <h2 className="dossier-modal-title">
              {mode === 'create' ? 'Tạo hồ sơ cá nhân' : 'Cập nhật hồ sơ cá nhân'}
            </h2>
            <p className="dossier-modal-subtitle">Cấu hình thông tin hồ sơ nghề nghiệp</p>
          </div>
          <button className="dossier-modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dossier-modal-body">
          {/* Professional Info */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Thông tin cá nhân</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Họ và tên *</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ví dụ: Nguyễn Văn A"
                required
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Chức danh *</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.professionalTitle || ''}
                onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                placeholder="Ví dụ: Lập trình viên Full Stack"
                required
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Khẩu hiệu</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Ví dụ: Xây dựng trải nghiệm web tuyệt vời"
                maxLength={100}
              />
            </div>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Kinh nghiệm (năm)</label>
                <input
                  type="number"
                  className="dossier-input"
                  value={formData.yearsOfExperience || 0}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Địa điểm</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ví dụ: TP.HCM, Việt Nam"
                />
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Mục tiêu nghề nghiệp</label>
              <textarea
                className="dossier-textarea"
                value={formData.careerGoals || ''}
                onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
                placeholder="Mô tả mục tiêu nghề nghiệp..."
                rows={4}
              />
            </div>
          </div>

          {/* Media Uploads */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Tài nguyên phương tiện</h3>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Ảnh đại diện</label>
                <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '1rem', textAlign: 'center' }}>
                  {avatarPreview && (
                    <img src={avatarPreview} alt="Ảnh đại diện" style={{ width: '120px', height: '120px', objectFit: 'cover', marginBottom: '1rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }} />
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
                    Tải ảnh đại diện
                  </label>
                </div>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Ảnh bìa</label>
                <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '1rem', textAlign: 'center' }}>
                  {coverPreview && (
                    <img src={coverPreview} alt="Ảnh bìa" style={{ width: '100%', height: '100px', objectFit: 'cover', marginBottom: '1rem' }} />
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
                    Tải ảnh bìa
                  </label>
                </div>
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Video giới thiệu</label>
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
                  Tải video
                </label>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Liên kết ngoài</h3>

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
              <label className="dossier-form-label">Trang Portfolio</label>
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
            <h3 className="dossier-form-section-title">Kỹ năng & Ngôn ngữ</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Kỹ năng cốt lõi</label>
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
                    placeholder="Thêm kỹ năng và nhấn Enter"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddSkill} className="dossier-btn-primary">+</button>
                </div>
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Ngôn ngữ</label>
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
                    placeholder="Thêm ngôn ngữ và nhấn Enter"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddLanguage} className="dossier-btn-primary">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Rate & Availability */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Khả dụng & giá</h3>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Trạng thái</label>
                <select
                  className="dossier-select"
                  value={formData.availabilityStatus || 'AVAILABLE'}
                  onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                >
                  <option value="AVAILABLE">Sẵn sàng</option>
                  <option value="BUSY">Bận</option>
                  <option value="NOT_AVAILABLE">Không sẵn sàng</option>
                </select>
              </div>

              <div className="dossier-form-group">
              <label className="dossier-form-label">Giá theo giờ</label>
                <input
                  type="number"
                  className="dossier-input"
                  value={formData.hourlyRate || 0}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1000"
                />
              </div>

              <div className="dossier-form-group">
              <label className="dossier-form-label">Đơn vị tiền tệ</label>
                <div className="dossier-static-field">VND</div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Cài đặt quyền riêng tư</h3>

            <div className="dossier-toggle-list">
              <label className="dossier-toggle-card">
                <input
                  type="checkbox"
                  className="dossier-toggle-input"
                  checked={formData.isPublic || false}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <div className="dossier-toggle-content">
                  <span className="dossier-toggle-title">Công khai Portfolio</span>
                  <span className="dossier-toggle-desc">Cho phép người khác xem hồ sơ của bạn qua liên kết Portfolio.</span>
                </div>
              </label>

              <label className="dossier-toggle-card">
                <input
                  type="checkbox"
                  className="dossier-toggle-input"
                  checked={formData.showContactInfo || false}
                  onChange={(e) => setFormData({ ...formData, showContactInfo: e.target.checked })}
                />
                <div className="dossier-toggle-content">
                  <span className="dossier-toggle-title">Hiển thị thông tin liên hệ</span>
                  <span className="dossier-toggle-desc">Hiển thị số điện thoại và các liên kết mạng xã hội trên hồ sơ công khai.</span>
                </div>
              </label>

              <label className="dossier-toggle-card">
                <input
                  type="checkbox"
                  className="dossier-toggle-input"
                  checked={formData.allowJobOffers || false}
                  onChange={(e) => setFormData({ ...formData, allowJobOffers: e.target.checked })}
                />
                <div className="dossier-toggle-content">
                  <span className="dossier-toggle-title">Nhận đề nghị việc làm</span>
                  <span className="dossier-toggle-desc">Cho phép nhà tuyển dụng hoặc đối tác gửi lời mời hợp tác.</span>
                </div>
              </label>
            </div>

            <div className="dossier-form-group" style={{ marginTop: '1rem' }}>
              <label className="dossier-form-label">Đường dẫn tùy chỉnh (slug)</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.customUrlSlug || ''}
                onChange={(e) => setFormData({ ...formData, customUrlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="Ví dụ: john-doe-developer"
              />
              <small style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Liên kết: /portfolio/{formData.customUrlSlug || 'duong-dan-cua-ban'}
              </small>
            </div>
          </div>

          <div className="dossier-modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button type="button" onClick={onClose} className="dossier-btn-secondary" disabled={loading}>
              Hủy
              </button>
              <button type="submit" className="dossier-btn-primary" disabled={loading}>
                {loading ? (
                  <>
                  <MeowlKuruLoader size="tiny" text="" />
                  Đang lưu...
                  </>
                ) : (
                mode === 'create' ? 'Tạo ID' : 'Cập nhật ID'
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

