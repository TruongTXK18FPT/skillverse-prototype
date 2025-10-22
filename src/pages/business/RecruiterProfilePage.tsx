import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Globe, MapPin, FileText, Edit3, Save, X, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import userService from '../../services/userService';
import { UserProfileResponse } from '../../data/userDTOs';
import '../../styles/ProfilePage.css';

interface RecruiterProfileData extends UserProfileResponse {
  companyName?: string;
  companyWebsite?: string;
  companyAddress?: string;
  taxCodeOrBusinessRegistrationNumber?: string;
  companyDocumentsUrl?: string;
  applicationStatus?: string;
  applicationDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

const RecruiterProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<RecruiterProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editData, setEditData] = useState({
    companyName: '',
    companyWebsite: '',
    companyAddress: '',
    taxCodeOrBusinessRegistrationNumber: '',
    companyDocumentsUrl: ''
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await userService.getMyProfile() as RecruiterProfileData;
      setProfile(profileData);
      
      setEditData({
        companyName: profileData.companyName || '',
        companyWebsite: profileData.companyWebsite || '',
        companyAddress: profileData.companyAddress || '',
        taxCodeOrBusinessRegistrationNumber: profileData.taxCodeOrBusinessRegistrationNumber || '',
        companyDocumentsUrl: profileData.companyDocumentsUrl || ''
      });
    } catch (error) {
      console.error('Error loading recruiter profile:', error);
      setError('Không thể tải thông tin doanh nghiệp');
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
    
    if (profile) {
      setEditData({
        companyName: profile.companyName || '',
        companyWebsite: profile.companyWebsite || '',
        companyAddress: profile.companyAddress || '',
        taxCodeOrBusinessRegistrationNumber: profile.taxCodeOrBusinessRegistrationNumber || '',
        companyDocumentsUrl: profile.companyDocumentsUrl || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!user?.id) {
        setError('Không tìm thấy thông tin người dùng');
        return;
      }

      await userService.updateUserProfile(user.id, editData);
      
      setSuccess('Cập nhật thông tin doanh nghiệp thành công!');
      setEditing(false);
      
      await loadProfile();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = () => {
    if (!profile?.applicationStatus) return null;
    
    const statusConfig = {
      APPROVED: { label: '✅ Đã duyệt', className: 'status-approved' },
      PENDING: { label: '⏳ Đang chờ duyệt', className: 'status-pending' },
      REJECTED: { label: '❌ Từ chối', className: 'status-rejected' }
    };
    
    const config = statusConfig[profile.applicationStatus as keyof typeof statusConfig];
    return config ? (
      <span className={`application-status ${config.className}`}>
        {config.label}
      </span>
    ) : null;
  };

  if (loading) {
    return (
      <div className="profile-page" data-theme={theme}>
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Đang tải thông tin doanh nghiệp...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page" data-theme={theme}>
        <div className="profile-error">
          <p>Không tìm thấy thông tin doanh nghiệp</p>
          <button onClick={() => navigate('/dashboard')}>Quay lại Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page" data-theme={theme}>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar company-avatar">
            <Building2 size={64} />
          </div>
          <div className="profile-info">
            <h1>{profile.companyName || 'Doanh nghiệp'}</h1>
            <p className="profile-email">
              <Mail size={16} />
              {user?.email}
            </p>
            {getStatusBadge()}
          </div>
          <div className="profile-actions">
            {!editing ? (
              <button className="btn-edit" onClick={handleEdit}>
                <Edit3 size={16} />
                Chỉnh sửa
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button className="btn-cancel" onClick={handleCancel} disabled={saving}>
                  <X size={16} />
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {profile.applicationStatus === 'REJECTED' && profile.rejectionReason && (
          <div className="alert alert-warning">
            <strong>Lý do từ chối:</strong> {profile.rejectionReason}
          </div>
        )}

        <div className="profile-body">
          <div className="profile-section">
            <h2>Thông tin doanh nghiệp</h2>
            <div className="profile-fields">
              <div className="field-group">
                <label>
                  <Building2 size={18} />
                  Tên công ty
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Nhập tên công ty"
                    required
                  />
                ) : (
                  <p>{profile.companyName || 'Chưa cập nhật'}</p>
                )}
              </div>

              <div className="field-group">
                <label>
                  <Globe size={18} />
                  Website công ty
                </label>
                {editing ? (
                  <input
                    type="url"
                    value={editData.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    placeholder="https://company.com"
                    required
                  />
                ) : (
                  profile.companyWebsite ? (
                    <a href={profile.companyWebsite} target="_blank" rel="noopener noreferrer" className="link-external">
                      {profile.companyWebsite}
                    </a>
                  ) : (
                    <p>Chưa cập nhật</p>
                  )
                )}
              </div>

              <div className="field-group full-width">
                <label>
                  <MapPin size={18} />
                  Địa chỉ công ty
                </label>
                {editing ? (
                  <textarea
                    value={editData.companyAddress}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    placeholder="Nhập địa chỉ công ty đầy đủ"
                    rows={3}
                    required
                  />
                ) : (
                  <p className="text-content">{profile.companyAddress || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Thông tin pháp lý</h2>
            <div className="profile-fields">
              <div className="field-group">
                <label>
                  <FileText size={18} />
                  Mã số thuế / Số đăng ký kinh doanh
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.taxCodeOrBusinessRegistrationNumber}
                    onChange={(e) => handleInputChange('taxCodeOrBusinessRegistrationNumber', e.target.value)}
                    placeholder="Nhập mã số thuế hoặc số ĐKKD"
                    required
                  />
                ) : (
                  <p>{profile.taxCodeOrBusinessRegistrationNumber || 'Chưa cập nhật'}</p>
                )}
              </div>

              <div className="field-group">
                <label>
                  <LinkIcon size={18} />
                  Tài liệu công ty (URL)
                </label>
                {editing ? (
                  <input
                    type="url"
                    value={editData.companyDocumentsUrl}
                    onChange={(e) => handleInputChange('companyDocumentsUrl', e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                ) : (
                  profile.companyDocumentsUrl ? (
                    <a href={profile.companyDocumentsUrl} target="_blank" rel="noopener noreferrer" className="link-external">
                      Xem tài liệu
                    </a>
                  ) : (
                    <p>Chưa cập nhật</p>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Thông tin đăng ký</h2>
            <div className="profile-fields">
              <div className="field-group">
                <label>Ngày nộp đơn</label>
                <p>{profile.applicationDate ? new Date(profile.applicationDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
              </div>

              {profile.approvalDate && (
                <div className="field-group">
                  <label>Ngày duyệt</label>
                  <p>{new Date(profile.approvalDate).toLocaleDateString('vi-VN')}</p>
                </div>
              )}

              <div className="field-group">
                <label>Cập nhật lần cuối</label>
                <p>{profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterProfilePage;
