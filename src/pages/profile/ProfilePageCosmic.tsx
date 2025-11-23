import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit3, Save, X, Camera, Calendar, FileText, Move } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import { premiumService } from '../../services/premiumService';
import { UserProfileResponse } from '../../data/userDTOs';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import silverFrame from '../../assets/premium/silver_avatar.png';
import goldenFrame from '../../assets/premium/golden_avatar.png';
import diamondFrame from '../../assets/premium/diamond_avatar.png';
import '../../styles/ProfilePageCosmic.css';

const ProfilePageCosmic = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPosition, setAvatarPosition] = useState<string>('center');
  const [showPositionControls, setShowPositionControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    address: '',
    bio: ''
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await userService.getMyProfile();
      setProfile(profileData);
      
      // Load avatar position from backend
      if (profileData.avatarPosition) {
        setAvatarPosition(profileData.avatarPosition);
      }
      
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
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.id) {
      loadProfile();
      loadSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.id, navigate]);

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    
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

  const loadSubscription = async () => {
    try {
      const sub = await premiumService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const getPremiumColor = () => {
    if (!subscription || !subscription.isActive) return null;
    
    const planType = subscription.plan.planType;
    switch (planType) {
      case 'STUDENT_PACK':
        return '#c0c0c0'; // Silver
      case 'PREMIUM_BASIC':
        return '#ffd700'; // Gold
      case 'PREMIUM_PLUS':
        return '#b9f2ff'; // Diamond
      default:
        return null;
    }
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  const getAvatarFrame = () => {
    if (!subscription || !subscription.isActive) return null;
    
    const planType = subscription.plan.planType;
    switch (planType) {
      case 'STUDENT_PACK':
        return silverFrame;
      case 'PREMIUM_BASIC':
        return goldenFrame;
      case 'PREMIUM_PLUS':
        return diamondFrame;
      default:
        return null;
    }
  };

  const getObjectPosition = (position: string) => {
    const positions: { [key: string]: string } = {
      'center': 'center',
      'top': 'center top',
      'bottom': 'center bottom',
      'left': 'left center',
      'right': 'right center',
      'top-left': 'left top',
      'top-right': 'right top',
      'bottom-left': 'left bottom',
      'bottom-right': 'right bottom'
    };
    return positions[position] || 'center';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showPositionControls) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Determine position based on drag direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      if (deltaX > 20) setAvatarPosition('right');
      else if (deltaX < -20) setAvatarPosition('left');
    } else {
      // Vertical movement
      if (deltaY > 20) setAvatarPosition('bottom');
      else if (deltaY < -20) setAvatarPosition('top');
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      await userService.uploadUserAvatar(file);
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

  if (authLoading || loading) {
    return (
      <div className="cosmic-profile-page">
        <div className="cosmic-profile-loading">
          <div className="cosmic-loading-spinner"></div>
          <p>{authLoading ? 'Đang xác thực...' : 'Đang tải thông tin hồ sơ...'}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="cosmic-profile-page">
        <div className="cosmic-profile-error">
          <User className="cosmic-error-icon" />
          <h2>Không thể tải thông tin hồ sơ</h2>
          <p>{error || 'Có lỗi xảy ra khi tải dữ liệu'}</p>
          <button onClick={loadProfile} className="cosmic-retry-button">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-profile-page">
      {/* Animated Background */}
      <div className="cosmic-profile-bg">
        <div className="cosmic-stars"></div>
        <div className="cosmic-stars-2"></div>
        <div className="cosmic-stars-3"></div>
      </div>

      {/* Profile Container */}
      <div className="cosmic-profile-container">
        
        {/* Profile Header with Avatar */}
        <div className="cosmic-profile-hero" style={{
          background: getPremiumColor() ? `linear-gradient(135deg, rgba(${hexToRgb(getPremiumColor()!)}, 0.15), rgba(${hexToRgb(getPremiumColor()!)}, 0.05))` : undefined,
          border: getPremiumColor() ? `2px solid ${getPremiumColor()}` : undefined,
          boxShadow: getPremiumColor() ? `0 0 40px rgba(${hexToRgb(getPremiumColor()!)}, 0.3)` : undefined
        }}>
          <div className="cosmic-profile-avatar-section">
            <div 
              className="cosmic-profile-avatar-wrapper"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: showPositionControls ? 'move' : 'default' }}
            >
              {profile.avatarMediaUrl ? (
                <img 
                  src={profile.avatarMediaUrl} 
                  alt="Avatar" 
                  className="cosmic-profile-avatar-image"
                  style={{ 
                    objectPosition: getObjectPosition(avatarPosition),
                    userSelect: 'none'
                  }}
                  draggable={false}
                />
              ) : (
                <div className="cosmic-profile-avatar-placeholder">
                  <User size={64} />
                </div>
              )}
              
              {getAvatarFrame() && (
                <img 
                  src={getAvatarFrame()!} 
                  alt="Premium Frame" 
                  className="cosmic-profile-avatar-frame"
                />
              )}
              
              <input
                type="file"
                id="cosmic-avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <label 
                htmlFor="cosmic-avatar-upload" 
                className="cosmic-avatar-upload-btn" 
                title={uploading ? 'Đang tải...' : 'Thay đổi ảnh đại diện'}
              >
                <Camera size={20} />
              </label>

              {profile.avatarMediaUrl && !showPositionControls && (
                <button
                  className="cosmic-avatar-adjust-btn"
                  onClick={() => setShowPositionControls(true)}
                  title="Điều chỉnh vị trí"
                >
                  <Move size={20} />
                </button>
              )}

              {profile.avatarMediaUrl && showPositionControls && (
                <div className="cosmic-avatar-position-controls">
                  <button
                    className="cosmic-position-btn"
                    onClick={() => setAvatarPosition('top')}
                    title="Căn trên"
                  >
                    ↑
                  </button>
                  <button
                    className="cosmic-position-btn"
                    onClick={() => setAvatarPosition('left')}
                    title="Căn trái"
                  >
                    ←
                  </button>
                  <button
                    className="cosmic-position-btn cosmic-position-btn--active"
                    onClick={() => setAvatarPosition('center')}
                    title="Căn giữa"
                  >
                    <Move size={16} />
                  </button>
                  <button
                    className="cosmic-position-btn"
                    onClick={() => setAvatarPosition('right')}
                    title="Căn phải"
                  >
                    →
                  </button>
                  <button
                    className="cosmic-position-btn"
                    onClick={() => setAvatarPosition('bottom')}
                    title="Căn dưới"
                  >
                    ↓
                  </button>
                  <div className="cosmic-position-divider"></div>
                  <button
                    className="cosmic-position-btn cosmic-position-btn--save"
                    onClick={async () => {
                      try {
                        if (user?.id) {
                          await userService.updateUserProfile(user.id, {
                            avatarPosition: avatarPosition
                          });
                          setShowPositionControls(false);
                          setSuccess('Đã lưu vị trí avatar!');
                          setTimeout(() => setSuccess(''), 3000);
                        }
                      } catch (error) {
                        console.error('Failed to save avatar position:', error);
                        setError('Không thể lưu vị trí avatar');
                      }
                    }}
                    title="Lưu"
                  >
                    ✓
                  </button>
                  <button
                    className="cosmic-position-btn cosmic-position-btn--cancel"
                    onClick={() => {
                      setShowPositionControls(false);
                      setAvatarPosition('center');
                    }}
                    title="Hủy"
                  >
                    ✕
                  </button>
                </div>
              )}

              {uploading && (
                <div className="cosmic-avatar-uploading">
                  <div className="cosmic-upload-spinner"></div>
                  <div className="cosmic-upload-text">Đang tải ảnh...</div>
                </div>
              )}
            </div>

            <div className="cosmic-profile-info">
              <h1 className="cosmic-profile-name" style={{
                color: getPremiumColor() || undefined,
                textShadow: getPremiumColor() ? `0 0 20px ${getPremiumColor()}` : undefined
              }}>{profile.fullName}</h1>
              <p className="cosmic-profile-email">{profile.email}</p>
              <div className="cosmic-profile-roles">
                {user?.roles.map((role) => (
                  <span key={role} className={`cosmic-role-badge cosmic-role-badge--${role.toLowerCase()}`}>
                    {role}
                  </span>
                ))}
                {subscription && subscription.isActive && subscription.plan.planType !== 'FREE_TIER' && (
                  <span 
                    className="cosmic-role-badge cosmic-role-badge--premium"
                    style={{
                      background: getPremiumColor() ? `linear-gradient(135deg, ${getPremiumColor()}, ${getPremiumColor()}dd)` : undefined,
                      boxShadow: getPremiumColor() ? `0 0 15px ${getPremiumColor()}` : undefined
                    }}
                  >
                    {subscription.plan.displayName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="cosmic-profile-actions">
            {!editing ? (
              <button onClick={handleEdit} className="cosmic-edit-button">
                <Edit3 size={18} />
                <span>Chỉnh sửa</span>
              </button>
            ) : (
              <div className="cosmic-edit-actions">
                <button 
                  onClick={handleCancel} 
                  className="cosmic-cancel-button"
                  disabled={saving}
                >
                  <X size={18} />
                  <span>Hủy</span>
                </button>
                <button 
                  onClick={handleSave} 
                  className="cosmic-save-button"
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
          <div className="cosmic-message cosmic-message--error">
            {error}
          </div>
        )}

        {success && (
          <div className="cosmic-message cosmic-message--success">
            {success}
          </div>
        )}

        {/* Profile Content Grid */}
        <div className="cosmic-profile-content">
          
          {/* Personal Information Card */}
          <div className="cosmic-profile-card" style={{
            border: getPremiumColor() ? `2px solid ${getPremiumColor()}` : undefined,
            boxShadow: getPremiumColor() ? `0 0 30px rgba(${hexToRgb(getPremiumColor()!)}, 0.3)` : undefined
          }}>
            <div className="cosmic-card-header">
              <User size={24} />
              <h2>Thông tin cá nhân</h2>
            </div>
            
            <div className="cosmic-card-body">
              {/* Full Name */}
              <div className="cosmic-field-group">
                <label className="cosmic-field-label">
                  <User size={18} />
                  <span>Họ và tên</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={editData.fullName}
                    onChange={handleInputChange}
                    className="cosmic-field-input"
                    placeholder="Nhập họ và tên"
                  />
                ) : (
                  <div className="cosmic-field-value">{profile.fullName || 'Chưa cập nhật'}</div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="cosmic-field-group">
                <label className="cosmic-field-label">
                  <Mail size={18} />
                  <span>Email</span>
                </label>
                <div className="cosmic-field-value cosmic-field-value--readonly">{profile.email}</div>
              </div>

              {/* Phone */}
              <div className="cosmic-field-group">
                <label className="cosmic-field-label">
                  <Phone size={18} />
                  <span>Số điện thoại</span>
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="cosmic-field-input"
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <div className="cosmic-field-value">{profile.phone || 'Chưa cập nhật'}</div>
                )}
              </div>

              {/* Address */}
              <div className="cosmic-field-group">
                <label className="cosmic-field-label">
                  <MapPin size={18} />
                  <span>Địa chỉ</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="address"
                    value={editData.address}
                    onChange={handleInputChange}
                    className="cosmic-field-input"
                    placeholder="Nhập địa chỉ"
                  />
                ) : (
                  <div className="cosmic-field-value">{profile.address || 'Chưa cập nhật'}</div>
                )}
              </div>

              {/* Created Date */}
              <div className="cosmic-field-group">
                <label className="cosmic-field-label">
                  <Calendar size={18} />
                  <span>Ngày tham gia</span>
                </label>
                <div className="cosmic-field-value cosmic-field-value--readonly">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                </div>
              </div>
            </div>
          </div>

          {/* Bio Card */}
          <div className="cosmic-profile-card cosmic-profile-card--bio" style={{
            border: getPremiumColor() ? `2px solid ${getPremiumColor()}` : undefined,
            boxShadow: getPremiumColor() ? `0 0 30px rgba(${hexToRgb(getPremiumColor()!)}, 0.3)` : undefined
          }}>
            <div className="cosmic-card-header">
              <FileText size={24} />
              <h2>Giới thiệu bản thân</h2>
            </div>
            
            <div className="cosmic-card-body">
              {editing ? (
                <textarea
                  name="bio"
                  value={editData.bio}
                  onChange={handleInputChange}
                  className="cosmic-bio-textarea"
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                  rows={6}
                />
              ) : (
                <div className="cosmic-bio-content">
                  {profile.bio || 'Chưa có thông tin giới thiệu'}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePageCosmic;
