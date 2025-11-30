import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit3, Save, X, Camera, Calendar, FileText, Move, Sparkles, Lock, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import { premiumService } from '../../services/premiumService';
import { useMeowlSkin } from '../../context/MeowlSkinContext';
import { UserProfileResponse } from '../../data/userDTOs';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import silverFrame from '../../assets/premium/silver_avatar.png';
import goldenFrame from '../../assets/premium/golden_avatar.png';
import diamondFrame from '../../assets/premium/diamond_avatar.png';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/ProfilePageCosmic.css';
import '../../styles/ProfileSecurityCosmic.css';
import '../../styles/CosmicToggle.css';

const ProfilePageCosmic = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { currentSkin, setSkin, skins, togglePet, isPetActive } = useMeowlSkin();
  
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
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

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
              {(profile.avatarMediaUrl || user?.avatarUrl) ? (
                <img 
                  src={profile.avatarMediaUrl || user?.avatarUrl} 
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

        {/* Security Section - Compact (Near Header) */}
        <div className="cosmic-security-compact">
          {/* Set Password - For Google users WITHOUT password */}
          {user?.authProvider === 'GOOGLE' && !user?.googleLinked && (
            <div 
              className="cosmic-security-card cosmic-security-card--highlight"
              style={{
                border: getPremiumColor() ? `2px solid ${getPremiumColor()}` : undefined,
                boxShadow: getPremiumColor() ? `0 0 20px rgba(${hexToRgb(getPremiumColor()!)}, 0.2)` : undefined
              }}
            >
              <div className="cosmic-security-card-header">
                <div className="cosmic-security-card-icon">
                  <Shield size={20} />
                </div>
                <div className="cosmic-security-card-content">
                  <h3 className="cosmic-security-card-title">
                    Đặt Mật Khẩu Dự Phòng
                    <span className="cosmic-security-badge cosmic-security-badge--optional">Tùy chọn</span>
                  </h3>
                  <p className="cosmic-security-card-description">
                    Tạo mật khẩu để đăng nhập khi Google lỗi
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/set-password')}
                className="cosmic-security-button cosmic-security-button--primary"
              >
                <Shield size={16} />
                <span>Thiết lập ngay</span>
              </button>
            </div>
          )}

          {/* Change Password - For LOCAL users OR Google users WITH password */}
          {(user?.authProvider === 'LOCAL' || (user?.authProvider === 'GOOGLE' && user?.googleLinked)) && (
            <div 
              className="cosmic-security-card"
              style={{
                border: getPremiumColor() ? `2px solid ${getPremiumColor()}` : undefined,
                boxShadow: getPremiumColor() ? `0 0 20px rgba(${hexToRgb(getPremiumColor()!)}, 0.2)` : undefined,
                position: 'relative'
              }}
            >
              {/* Security Info Button inside the card */}
              {user?.authProvider === 'GOOGLE' && user?.googleLinked && (
                <button 
                  className="cosmic-security-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSecurityInfo(true);
                  }}
                  title="Thông tin bảo mật"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px'
                  }}
                >
                  !
                </button>
              )}

              <div className="cosmic-security-card-header">
                <div className="cosmic-security-card-icon">
                  <Lock size={20} />
                </div>
                <div className="cosmic-security-card-content">
                  <h3 className="cosmic-security-card-title">Đổi Mật Khẩu</h3>
                  <p className="cosmic-security-card-description">
                    Cập nhật mật khẩu để bảo mật tài khoản
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/change-password')}
                className="cosmic-security-button cosmic-security-button--secondary"
              >
                <Lock size={16} />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Info Modal */}
        {showSecurityInfo && (
          <div className="cosmic-modal-overlay" onClick={() => setShowSecurityInfo(false)}>
            <div className="cosmic-modal" onClick={e => e.stopPropagation()}>
              <div className="cosmic-modal-header">
                <h3>Trạng thái bảo mật</h3>
                <button className="cosmic-modal-close" onClick={() => setShowSecurityInfo(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="cosmic-modal-content">
                <div className="cosmic-security-status-icon">
                  <Shield size={48} color="#10b981" />
                </div>
                <h4 className="cosmic-security-status-title">Xác thực kép đã kích hoạt</h4>
                <p className="cosmic-security-status-desc">
                  Tài khoản của bạn hiện được bảo vệ bởi hai lớp xác thực. Bạn có thể đăng nhập bằng cả:
                </p>
                <ul className="cosmic-security-methods">
                  <li>
                    <span className="method-icon">G</span>
                    <span>Google OAuth (Gmail)</span>
                  </li>
                  <li>
                    <span className="method-icon">✉️</span>
                    <span>Email & Mật khẩu</span>
                  </li>
                </ul>
                <div className="cosmic-security-note">
                  Điều này giúp bạn không bao giờ bị mất quyền truy cập vào tài khoản của mình.
                </div>
              </div>
              <div className="cosmic-modal-footer">
                <button className="cosmic-modal-btn" onClick={() => setShowSecurityInfo(false)}>
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}

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

          {/* Meowl Skin Card */}
          <div className="cosmic-profile-card cosmic-profile-card--meowl" style={{
            border: getPremiumColor() ? `2px solid ${getPremiumColor()}` : undefined,
            boxShadow: getPremiumColor() ? `0 0 30px rgba(${hexToRgb(getPremiumColor()!)}, 0.3)` : undefined
          }}>
            <div className="cosmic-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={24} />
                <h2>Trang phục Meowl</h2>
              </div>

              {isEasterEggUnlocked && (
                <div className="cosmic-toggle-wrapper">
                  <span className="cosmic-toggle-label">Cái gì đây mọi người ??? ඞ</span>
                  <label className="cosmic-toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={isPetActive} 
                      onChange={togglePet}
                    />
                    <span className="cosmic-toggle-slider"></span>
                  </label>
                </div>
              )}
            </div>

            <div className="cosmic-card-body">
              <p className="cosmic-meowl-description">
                Chọn trang phục cho Meowl - người bạn đồng hành của bạn!
              </p>
              <div className="cosmic-meowl-skins-grid">
                {skins.map((skin) => (
                  <div
                    key={skin.id}
                    className={`cosmic-meowl-skin-item ${currentSkin === skin.id ? 'cosmic-meowl-skin-item--active' : ''}`}
                    onClick={() => {
                      setSkin(skin.id);
                      
                      // Easter Egg Logic
                      setSkinHistory(prev => {
                        const newHistory = [...prev, skin.id].slice(-5);
                        
                        // Check if we have 5 items and they are all unique
                        if (newHistory.length === 5) {
                          const uniqueSkins = new Set(newHistory);
                          if (uniqueSkins.size === 5) {
                            if (!isEasterEggUnlocked) {
                              setIsEasterEggUnlocked(true);
                              localStorage.setItem('meowl_egg_unlocked', 'true');
                              setSuccess('Bạn đã tìm thấy thiết bị lạ!');
                              setTimeout(() => setSuccess(''), 3000);
                            }
                            return []; // Reset history after trigger
                          }
                        }
                        return newHistory;
                      });
                    }}
                  >
                    <div className="cosmic-meowl-skin-image-wrapper">
                      <img
                        src={skin.image}
                        alt={skin.nameVi}
                        className="cosmic-meowl-skin-image"
                      />
                    </div>
                    <span className="cosmic-meowl-skin-name">{skin.nameVi}</span>
                    {currentSkin === skin.id && (
                      <div className="cosmic-meowl-skin-selected">
                        <span>✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="profile" />
    </div>
  );
};

export default ProfilePageCosmic;
