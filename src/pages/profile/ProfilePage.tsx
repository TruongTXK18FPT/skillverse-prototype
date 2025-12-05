import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Camera, Lock, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import userService from '../../services/userService';
import { UserProfileResponse } from '../../data/userDTOs';
import StudentReviews from '../../components/student/StudentReviews';
import '../../styles/ProfilePage.css';
import '../../styles/ProfileSecuritySection.css';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    address: '',
    bio: ''
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Use getMyProfile() for current logged-in user
      const profileData = await userService.getMyProfile();
      setProfile(profileData);
      
      // Initialize edit data
      setEditData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        bio: profileData.bio || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.id) {
      loadProfile();
    }
  }, [isAuthenticated, user, navigate, loadProfile]);

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    
    // Reset edit data to original values
    if (profile) {
      setEditData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const updatedProfile = await userService.updateUserProfile(user!.id, editData);
      setProfile(updatedProfile);
      setEditing(false);
      setSuccess('Cập nhật thông tin thành công!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError((error as Error).message || 'Cập nhật thông tin thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      if (!user?.id) {
        setError('User ID not found');
        setUploading(false);
        return;
      }
      const result = await userService.uploadUserAvatar(file, user.id);
      
      // Reload profile to get updated avatar
      await loadProfile();
      
      setSuccess('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError((error as Error).message || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container" data-theme={theme}>
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container" data-theme={theme}>
        <div className="profile-error">
          <User className="error-icon" />
          <h2>Không thể tải thông tin hồ sơ</h2>
          <p>{error || 'Có lỗi xảy ra khi tải dữ liệu'}</p>
          <button onClick={loadProfile} className="retry-button">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container" data-theme={theme}>
      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile.avatarMediaUrl ? (
                <img 
                  src={profile.avatarMediaUrl} 
                  alt="Avatar" 
                  className="profile-avatar-image"
                />
              ) : (
                <User className="avatar-icon" />
              )}
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <label 
                htmlFor="avatar-upload" 
                className="avatar-upload-btn" 
                title={uploading ? 'Đang tải...' : 'Thay đổi ảnh đại diện'}
              >
                <Camera size={16} />
              </label>
              {/* Role badge nằm trong avatar */}
              <div className="profile-role-badge-container">
                {user?.roles.map((role) => (
                  <span key={role} className={`profile-role-badge profile-role-badge--${role.toLowerCase()}`}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div className="profile-basic-info">
              <h1 className="profile-name">{profile.fullName}</h1>
              <p className="profile-email">{profile.email}</p>
            </div>
          </div>

          <div className="profile-actions">
            {!editing ? (
              <button onClick={handleEdit} className="edit-button">
                <Edit3 size={18} />
                <span>Chỉnh sửa</span>
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  onClick={handleCancel} 
                  className="cancel-button"
                  disabled={saving}
                >
                  <X size={18} />
                  <span>Hủy</span>
                </button>
                <button 
                  onClick={handleSave} 
                  className="save-button"
                  disabled={saving}
                >
                  <Save size={18} />
                  <span>{saving ? 'Đang lưu...' : 'Lưu'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="message error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            {success}
          </div>
        )}

        {/* Profile Details */}
        <div className="profile-details">
          <div className="profile-section">
            <h2 className="profile-section-title">Thông tin cá nhân</h2>
            
            <div className="profile-fields">
              {/* Full Name */}
              <div className="profile-field">
                <label className="field-label">
                  <User size={18} />
                  <span>Họ và tên</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={editData.fullName}
                    onChange={handleInputChange}
                    className="field-input"
                    placeholder="Nhập họ và tên"
                  />
                ) : (
                  <div className="field-value">{profile.fullName || 'Chưa cập nhật'}</div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="profile-field">
                <label className="field-label">
                  <Mail size={18} />
                  <span>Email</span>
                </label>
                <div className="field-value readonly">{profile.email}</div>
              </div>

              {/* Phone */}
              <div className="profile-field">
                <label className="field-label">
                  <Phone size={18} />
                  <span>Số điện thoại</span>
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="field-input"
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <div className="field-value">{profile.phone || 'Chưa cập nhật'}</div>
                )}
              </div>

              {/* Address */}
              <div className="profile-field">
                <label className="field-label">
                  <MapPin size={18} />
                  <span>Địa chỉ</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="address"
                    value={editData.address}
                    onChange={handleInputChange}
                    className="field-input"
                    placeholder="Nhập địa chỉ"
                  />
                ) : (
                  <div className="field-value">{profile.address || 'Chưa cập nhật'}</div>
                )}
              </div>

              {/* Created Date */}
              <div className="profile-field">
                <label className="field-label">
                  <Calendar size={18} />
                  <span>Ngày tham gia</span>
                </label>
                <div className="field-value readonly">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                </div>
              </div>

              {/* Bio */}
              <div className="profile-field bio-field">
                <label className="field-label">
                  <Edit3 size={18} />
                  <span>Giới thiệu bản thân</span>
                </label>
                {editing ? (
                  <textarea
                    name="bio"
                    value={editData.bio}
                    onChange={handleInputChange}
                    className="field-textarea"
                    placeholder="Viết vài dòng giới thiệu về bản thân..."
                    rows={4}
                  />
                ) : (
                  <div className="field-value bio-value">
                    {profile.bio || 'Chưa có thông tin giới thiệu'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Reviews Section */}
          <StudentReviews />

          {/* Security Section - ALWAYS SHOW */}
          <div className="profile-section" style={{ border: '2px solid red', padding: '20px' }}>
            <h2 className="profile-section-title">🔒 BẢO MẬT (TEST)</h2>
            
            {/* Debug info */}
            <div style={{ background: 'yellow', padding: '10px', marginBottom: '10px' }}>
              <strong>Debug:</strong><br/>
              authProvider: {user?.authProvider}<br/>
              googleLinked: {user?.googleLinked ? 'true' : 'false'}<br/>
              Show Set Password: {(user?.authProvider === 'GOOGLE' && !user?.googleLinked) ? 'YES' : 'NO'}<br/>
              Show Change Password: {(user?.authProvider === 'LOCAL' || user?.googleLinked) ? 'YES' : 'NO'}
            </div>
            
            <div className="security-actions">
              {/* Set Password - Chỉ cho Google users chưa có password */}
              {user?.authProvider === 'GOOGLE' && !user?.googleLinked && (
                <div className="security-card security-card--highlight">
                  <div className="security-card-icon">
                    <Shield size={24} />
                  </div>
                  <div className="security-card-content">
                    <h3 className="security-card-title">
                      Đặt Mật Khẩu Dự Phòng
                      <span className="security-badge security-badge--optional">Không bắt buộc</span>
                    </h3>
                    <p className="security-card-description">
                      Tạo mật khẩu để đăng nhập khi Google OAuth không khả dụng. 
                      Bạn sẽ có thể sử dụng cả Google và email+password.
                    </p>
                    <button 
                      onClick={() => navigate('/set-password')}
                      className="security-button security-button--primary"
                    >
                      <Shield size={18} />
                      <span>Thiết lập ngay</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Change Password - Cho users đã có password */}
              {(user?.authProvider === 'LOCAL' || user?.googleLinked) && (
                <div className="security-card">
                  <div className="security-card-icon">
                    <Lock size={24} />
                  </div>
                  <div className="security-card-content">
                    <h3 className="security-card-title">Đổi Mật Khẩu</h3>
                    <p className="security-card-description">
                      Cập nhật mật khẩu của bạn để bảo mật tài khoản. 
                      Khuyến nghị đổi mật khẩu định kỳ 3-6 tháng.
                    </p>
                    <button 
                      onClick={() => navigate('/change-password')}
                      className="security-button security-button--secondary"
                    >
                      <Lock size={18} />
                      <span>Đổi mật khẩu</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Info for users with both auth methods */}
              {user?.googleLinked && (
                <div className="security-info">
                  <div className="security-info-icon">
                    ✅
                  </div>
                  <div className="security-info-text">
                    <strong>Xác thực kép đã kích hoạt:</strong> Bạn có thể đăng nhập bằng cả Google và email+password.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;