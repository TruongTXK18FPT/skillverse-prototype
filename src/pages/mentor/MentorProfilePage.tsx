import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Cropper, { Area } from 'react-easy-crop';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getMyMentorProfile, updateMyMentorProfile, uploadMyMentorAvatar, setPreChatEnabled, MentorProfile, MentorProfileUpdateDTO } from '../../services/mentorProfileService';
import { getMyMentorReviewStats, ReviewStatsResponse } from '../../services/reviewService';
import { validateImage } from '../../services/fileUploadService';
import getCroppedImg from '../../utils/cropImage';
import CommanderHeader from '../../components/profile-hud/mentor/CommanderHeader';
import IdentityModule from '../../components/profile-hud/mentor/IdentityModule';
import SpecializationMatrix from '../../components/profile-hud/mentor/SpecializationMatrix';
import ExperienceTimeline from '../../components/profile-hud/mentor/ExperienceTimeline';
import '../../components/profile-hud/mentor/CommanderStyles.css';

const MentorProfilePage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preChatEnabled, setPreChatEnabledState] = useState(true);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarTempUrl, setAvatarTempUrl] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] =
    useState<Area | null>(null);

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

  // Removed unused state: newSkill, newAchievement, fileName

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const [profileData, statsData] = await Promise.all([
          getMyMentorProfile(),
          getMyMentorReviewStats().catch((statsError) => {
            console.warn('Failed to load mentor review stats:', statsError);
            return null;
          }),
        ]);

        setProfile(profileData);
        setReviewStats(statsData);
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
      } catch (error) {
        console.error('Failed to load profile:', error);
        showError('Lỗi', 'Không thể tải dữ liệu hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, isAuthenticated, user?.id, showError, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof MentorProfileUpdateDTO] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddSkill = (skill: string) => {
    if (!formData.skills?.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill]
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const handleAddAchievement = (achievement: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: [...(prev.achievements || []), achievement]
    }));
  };

  const handleRemoveAchievement = (achievementToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements?.filter(a => a !== achievementToRemove) || []
    }));
  };

  const handleAvatarUpload = (file: File) => {
    const validation = validateImage(file);
    if (!validation.valid) {
      showError('Lỗi', validation.error || 'Ảnh tải lên không hợp lệ');
      return;
    }

    if (avatarTempUrl) {
      URL.revokeObjectURL(avatarTempUrl);
    }

    setAvatarTempUrl(URL.createObjectURL(file));
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarCroppedAreaPixels(null);
    setAvatarEditorOpen(true);
  };

  const resetAvatarEditor = useCallback(() => {
    setAvatarEditorOpen(false);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarCroppedAreaPixels(null);

    if (avatarTempUrl) {
      URL.revokeObjectURL(avatarTempUrl);
    }
    setAvatarTempUrl(null);
  }, [avatarTempUrl]);

  const handleAvatarCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setAvatarCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleAvatarCropCancel = () => {
    if (uploading) {
      return;
    }

    resetAvatarEditor();
  };

  const handleAvatarCropConfirm = async () => {
    if (!avatarTempUrl || !avatarCroppedAreaPixels) {
      showError('Lỗi', 'Không thể xử lý ảnh đại diện. Vui lòng thử lại.');
      return;
    }

    setUploading(true);
    try {
      const croppedAvatar = await getCroppedImg(
        avatarTempUrl,
        avatarCroppedAreaPixels,
      );

      if (!croppedAvatar) {
        throw new Error('Không thể cắt ảnh đại diện.');
      }

      const result = await uploadMyMentorAvatar(croppedAvatar);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar: result.avatarUrl,
            }
          : prev,
      );
      updateUser({
        avatarMediaUrl: result.avatarUrl,
        avatarUrl: result.avatarUrl,
      });

      resetAvatarEditor();
      showSuccess('Thành công', 'Cập nhật ảnh đại diện thành công');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      showError('Lỗi', 'Tải ảnh đại diện thất bại');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarTempUrl) {
        URL.revokeObjectURL(avatarTempUrl);
      }
    };
  }, [avatarTempUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProfile = await updateMyMentorProfile(formData);
      setProfile(updatedProfile);
      showSuccess('Thành công', 'Cập nhật hồ sơ thành công');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showError('Lỗi', 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handlePreChatToggle = async () => {
    try {
      const newState = !preChatEnabled;
      setPreChatEnabledState(newState);
      await setPreChatEnabled(newState);
      showSuccess('Thành công', `Trạng thái ${newState ? 'trực tuyến' : 'ngoại tuyến'} đã được cập nhật`);
    } catch (error) {
      setPreChatEnabledState(!preChatEnabled); // Revert on error
      showError('Lỗi', 'Không thể cập nhật trạng thái liên lạc');
    }
  };

  if (loading) {
    return (
      <div className="cmdr-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="cmdr-panel">
          <div className="cmdr-panel-title">Đang tải hệ thống...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cmdr-container">
      <div className="cmdr-scanline"></div>

      {avatarEditorOpen &&
        avatarTempUrl &&
        ReactDOM.createPortal(
          <div className="cmdr-avatar-crop-overlay" onClick={handleAvatarCropCancel}>
            <div
              className="cmdr-avatar-crop-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cmdr-avatar-crop-modal__header">
                <h3>Chỉnh ảnh đại diện giảng viên</h3>
                <button
                  type="button"
                  className="cmdr-avatar-crop-modal__close"
                  onClick={handleAvatarCropCancel}
                  disabled={uploading}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>

              <p className="cmdr-avatar-crop-modal__hint">
                Kéo ảnh để căn khung tròn, sau đó chỉnh vị trí trái/phải và zoom.
              </p>

              <div className="cmdr-avatar-crop-stage">
                <Cropper
                  image={avatarTempUrl}
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

              <div className="cmdr-avatar-crop-control">
                <label htmlFor="cmdr-avatar-horizontal-position">
                  Vị trí trái / phải
                </label>
                <input
                  id="cmdr-avatar-horizontal-position"
                  type="range"
                  min={-200}
                  max={200}
                  step={1}
                  value={avatarCrop.x}
                  disabled={uploading}
                  onChange={(event) =>
                    setAvatarCrop((prev) => ({
                      ...prev,
                      x: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="cmdr-avatar-crop-control">
                <label htmlFor="cmdr-avatar-zoom-level">Zoom</label>
                <input
                  id="cmdr-avatar-zoom-level"
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={avatarZoom}
                  disabled={uploading}
                  onChange={(event) => setAvatarZoom(Number(event.target.value))}
                />
              </div>

              <div className="cmdr-avatar-crop-modal__actions">
                <button
                  type="button"
                  className="cmdr-btn cmdr-btn-danger"
                  onClick={handleAvatarCropCancel}
                  disabled={uploading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="cmdr-btn cmdr-btn-primary"
                  onClick={handleAvatarCropConfirm}
                  disabled={uploading}
                >
                  {uploading ? 'Đang cập nhật...' : 'Lưu ảnh đại diện'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="cmdr-layout">
        {/* Left Column: Identity & Status */}
        <div className="cmdr-col-left">
          <CommanderHeader
            profile={profile}
            reviewStats={reviewStats}
            onAvatarUpload={handleAvatarUpload}
            preChatEnabled={preChatEnabled}
            onTogglePreChat={handlePreChatToggle}
          />

          <IdentityModule
            formData={formData}
            onChange={handleInputChange}
          />

        </div>

        {/* Right Column: Specialization & Experience */}
        <div className="cmdr-col-right">
          <SpecializationMatrix
            formData={formData}
            onChange={handleInputChange}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
          />

          <ExperienceTimeline
            formData={formData}
            onChange={handleInputChange}
            onAddAchievement={handleAddAchievement}
            onRemoveAchievement={handleRemoveAchievement}
          />
        </div>
      </div>
      <div className="cmdr-panel">
        <div className="cmdr-panel-title">
          Truyền dữ liệu
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>TX-MOD-09</span>
        </div>

        <button
          type="button"
          className="cmdr-btn cmdr-btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Đang truyền...' : 'Cập nhật hồ sơ'}
        </button>
      </div>
    </div>
  );
};

export default MentorProfilePage;
