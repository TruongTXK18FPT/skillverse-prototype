import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getMyMentorProfile, updateMyMentorProfile, uploadMyMentorAvatar, setPreChatEnabled, MentorProfile, MentorProfileUpdateDTO } from '../../services/mentorProfileService';
import CommanderHeader from '../../components/profile-hud/mentor/CommanderHeader';
import IdentityModule from '../../components/profile-hud/mentor/IdentityModule';
import SpecializationMatrix from '../../components/profile-hud/mentor/SpecializationMatrix';
import ExperienceTimeline from '../../components/profile-hud/mentor/ExperienceTimeline';
import '../../components/profile-hud/mentor/CommanderStyles.css';

const MentorProfilePage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [profile, setProfile] = useState<MentorProfile | null>(null);
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

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadMyMentorAvatar(file);
      if (profile) {
        setProfile({ ...profile, avatar: result.avatarUrl });
      }
      showSuccess('Thành công', 'Cập nhật ảnh đại diện thành công');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      showError('Lỗi', 'Tải ảnh đại diện thất bại');
    } finally {
      setUploading(false);
    }
  };

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
      showSuccess('Thành công', `Kênh liên lạc ${newState ? 'đã mở' : 'đã đóng'}`);
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

      <div className="cmdr-layout">
        {/* Left Column: Identity & Status */}
        <div className="cmdr-col-left">
          <CommanderHeader
            profile={profile}
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
