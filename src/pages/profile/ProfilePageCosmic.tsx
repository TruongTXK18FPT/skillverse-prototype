import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMeowlSkin, MeowlSkinType } from '../../context/MeowlSkinContext';
import userService from '../../services/userService';
import { UserProfileResponse } from '../../data/userDTOs';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import StudentReviews from '../../components/student/StudentReviews';
import PilotHeader from '../../components/profile-hud/user/PilotHeader';
import PilotIdentityForm from '../../components/profile-hud/user/PilotIdentityForm';
import CompanionPod from '../../components/profile-hud/user/CompanionPod';
import PilotSkinSelector from '../../components/profile-hud/user/PilotSkinSelector';
import MeowlGuide from '../../components/MeowlGuide';
import '../../components/profile-hud/user/pilot-styles.css';
import '../../styles/ProfileSecuritySection.css';

const ProfilePageCosmic = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { currentSkin, setSkin, skins, togglePet, isPetActive } = useMeowlSkin();
  
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Easter Egg State
  const [skinHistory, setSkinHistory] = useState<string[]>([]);
  const [isEasterEggUnlocked, setIsEasterEggUnlocked] = useState(() => {
    return localStorage.getItem('meowl_egg_unlocked') === 'true' || isPetActive;
  });

  useEffect(() => {
    if (isPetActive) setIsEasterEggUnlocked(true);
  }, [isPetActive]);

  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    address: '',
    bio: ''
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileData, subData] = await Promise.all([
        userService.getMyProfile(),
        premiumService.getCurrentSubscription()
      ]);
      setProfile(profileData);
      setSubscription(subData);
      
      setEditData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        bio: profileData.bio || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Đợi AuthContext tải xong để tránh redirect sớm sang /login
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.id) {
      loadProfile();
    }
  }, [authLoading, isAuthenticated, user, navigate, loadProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const updatedProfile = await userService.updateUserProfile(user!.id, editData);
      setProfile(updatedProfile);
      setEditing(false);
      setSuccess('Cập nhật hồ sơ thành công.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError((error as Error).message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) return;
    try {
      // Don't set full page loading to avoid UI flicker, maybe add a local loading state if needed
      // For now, we'll just rely on the success message or optimistic update if we wanted
      const response = await userService.uploadUserAvatar(file, user.id);
      
      if (profile) {
        setProfile({
          ...profile,
          avatarMediaUrl: response.avatarUrl
        });
      }
      setSuccess('Cập nhật ảnh đại diện thành công.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Tải ảnh đại diện thất bại.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkinSelect = (skinId: string) => {
    setSkin(skinId as MeowlSkinType);
    
    // Easter Egg Logic
    setSkinHistory(prev => {
      const newHistory = [...prev, skinId].slice(-5);
      
      // Check if we have 5 items and they are all unique
      if (newHistory.length === 5) {
        const uniqueSkins = new Set(newHistory);
        if (uniqueSkins.size === 5) {
          if (!isEasterEggUnlocked) {
            setIsEasterEggUnlocked(true);
            localStorage.setItem('meowl_egg_unlocked', 'true');
            setSuccess('Kích hoạt giao thức bí mật: Meowl đã bật');
            setTimeout(() => setSuccess(''), 3000);
          }
          return []; // Reset history after trigger
        }
      }
      return newHistory;
    });
  };

  if (loading) return <div className="pilot-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải hồ sơ...</div>;
  if (!profile) return <div className="pilot-container">Lỗi tải hồ sơ</div>;

  return (
    <div className="pilot-container">
      <PilotHeader 
        user={profile} 
        subscription={subscription}
        onEdit={() => setEditing(true)}
        onAvatarUpload={handleAvatarUpload}
      />

      {success && <div style={{ color: '#4ade80', padding: '1rem 2rem', border: '1px solid #4ade80', margin: '1rem 2rem', background: 'rgba(74, 222, 128, 0.1)' }}>{success}</div>}
      {error && <div style={{ color: '#ef4444', padding: '1rem 2rem', border: '1px solid #ef4444', margin: '1rem 2rem', background: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}

      {editing ? (
        <PilotIdentityForm 
          data={editData}
          onChange={handleInputChange}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          loading={saving}
        />
      ) : (
        <>
          <div className="pilot-section">
            <div className="pilot-main-grid">
              {/* Read-only View of Identity */}
              <div>
                <h2 className="pilot-section-title">Thông tin cá nhân</h2>
                <div className="pilot-identity-grid">
                  <div>
                    <div className="pilot-label">Họ và tên</div>
                    <div className="pilot-stat-value" style={{ fontSize: '1rem' }}>{profile.fullName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="pilot-label">Liên lạc</div>
                    <div className="pilot-stat-value" style={{ fontSize: '1rem' }}>{profile.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="pilot-label">Địa chỉ</div>
                    <div className="pilot-stat-value" style={{ fontSize: '1rem' }}>{profile.address || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="pilot-label">EMAIL</div>
                    <div className="pilot-stat-value" style={{ fontSize: '1rem' }}>{profile.email}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="pilot-label">Giới thiệu / Nhật ký</div>
                    <div style={{ color: 'var(--pilot-text-dim)', marginTop: '0.5rem' }}>{profile.bio || 'Chưa có nội dung.'}</div>
                  </div>
                </div>
              </div>

              {/* Companion Pod */}
              <CompanionPod 
                isPetActive={isPetActive}
                onTogglePet={isEasterEggUnlocked ? togglePet : undefined}
              />
            </div>
          </div>

          {/* Skin Selection */}
          <PilotSkinSelector 
            currentSkin={currentSkin}
            skins={skins}
            onSelectSkin={handleSkinSelect}
          />

          {/* Student Reviews */}
          <div className="pilot-section">
            <h2 className="pilot-section-title">Đánh giá học viên</h2>
            <StudentReviews />
          </div>

          {/* Security Section */}
          <div className="pilot-section">
            <h2 className="pilot-section-title" style={{ color: '#ef4444', borderColor: '#ef4444' }}>Bảo mật</h2>
            <div className="security-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {user?.authProvider === 'GOOGLE' && !user?.googleLinked && (
                <div style={{ border: '1px solid #ef4444', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <h3 style={{ color: '#ef4444', margin: '0 0 0.5rem 0' }}>Mật khẩu dự phòng</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--pilot-text-dim)' }}>Đặt mật khẩu để đăng nhập dự phòng.</p>
                  <button onClick={() => navigate('/set-password')} className="pilot-btn" style={{ marginTop: '1rem', background: '#ef4444', color: 'white' }}>
                    <Shield size={16} /> Đặt mật khẩu
                  </button>
                </div>
              )}

              {(user?.authProvider === 'LOCAL' || user?.googleLinked) && (
                <div style={{ border: '1px solid var(--pilot-border)', padding: '1rem' }}>
                  <h3 style={{ color: 'var(--pilot-text-white)', margin: '0 0 0.5rem 0' }}>Đổi mật khẩu</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--pilot-text-dim)' }}>Cập nhật mật khẩu định kỳ.</p>
                  <button onClick={() => navigate('/change-password')} className="pilot-btn pilot-btn-secondary" style={{ marginTop: '1rem' }}>
                    <Lock size={16} /> Cập nhật
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <MeowlGuide currentPage="profile" />
    </div>
  );
};

export default ProfilePageCosmic;
