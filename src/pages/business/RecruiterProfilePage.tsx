import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Globe,
  ImagePlus,
  Lock,
  MapPin,
  PencilLine,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import Cropper, { type Area } from 'react-easy-crop';
import { useAuth } from '../../context/AuthContext';
import businessService from '../../services/businessService';
import { validateImage } from '../../services/fileUploadService';
import getCroppedImg from '../../utils/cropImage';
import { BusinessProfileResponse } from '../../data/userDTOs';
import '../../components/profile-hud/business/corp-styles.css';

interface RecruiterProfileEditData {
  companyName: string;
  companyWebsite: string;
  companyAddress: string;
  taxCodeOrBusinessRegistrationNumber: string;
  companyDocumentsUrl: string;
}

type StatusTone = 'approved' | 'pending' | 'review' | 'rejected';

interface StatusMeta {
  label: string;
  description: string;
  tone: StatusTone;
  icon: LucideIcon;
}

const STATUS_META_MAP: Record<string, StatusMeta> = {
  APPROVED: {
    label: 'Đã duyệt',
    description: 'Hồ sơ doanh nghiệp đã xác minh thành công.',
    tone: 'approved',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Đang chờ duyệt',
    description: 'Hồ sơ đã gửi và đang chờ bộ phận kiểm duyệt.',
    tone: 'pending',
    icon: Clock3,
  },
  UNDER_REVIEW: {
    label: 'Đang thẩm định',
    description: 'Thông tin đang được đội vận hành rà soát.',
    tone: 'review',
    icon: ShieldCheck,
  },
  REJECTED: {
    label: 'Bị từ chối',
    description: 'Cần cập nhật lại hồ sơ theo yêu cầu kiểm duyệt.',
    tone: 'rejected',
    icon: AlertTriangle,
  },
};

const normalizeWebsiteUrl = (rawUrl?: string) => {
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `https://${rawUrl}`;
};

const formatDateVN = (value?: string) => {
  if (!value) return 'Chưa có dữ liệu';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return 'Chưa có dữ liệu';

  return parsedDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const buildEditData = (
  profileData: BusinessProfileResponse,
): RecruiterProfileEditData => ({
  companyName: profileData.companyName || '',
  companyWebsite: profileData.companyWebsite || '',
  companyAddress: profileData.companyAddress || '',
  taxCodeOrBusinessRegistrationNumber:
    profileData.taxCodeOrBusinessRegistrationNumber || '',
  companyDocumentsUrl: profileData.companyDocumentsUrl || '',
});

const RecruiterProfilePage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BusinessProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const [logoTempUrl, setLogoTempUrl] = useState<string | null>(null);
  const [logoCrop, setLogoCrop] = useState({ x: 0, y: 0 });
  const [logoZoom, setLogoZoom] = useState(1);
  const [logoCroppedAreaPixels, setLogoCroppedAreaPixels] =
    useState<Area | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [editData, setEditData] = useState<RecruiterProfileEditData>({
    companyName: '',
    companyWebsite: '',
    companyAddress: '',
    taxCodeOrBusinessRegistrationNumber: '',
    companyDocumentsUrl: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await businessService.getMyBusinessProfile();
      setProfile(profileData);
      setEditData(buildEditData(profileData));
      setError('');
    } catch (error) {
      console.error('Error loading recruiter profile:', error);
      setError('Không thể truy cập hồ sơ doanh nghiệp.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
      await businessService.updateMyBusinessProfile(editData);
      setSuccess('Cập nhật hồ sơ doanh nghiệp thành công.');
      setEditing(false);
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Cập nhật hồ sơ doanh nghiệp thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) {
      setEditing(false);
      return;
    }

    setEditData(buildEditData(profile));
    setEditing(false);
  };

  const handleInputChange = (
    field:
      | 'companyName'
      | 'companyWebsite'
      | 'companyAddress'
      | 'taxCodeOrBusinessRegistrationNumber'
      | 'companyDocumentsUrl',
    value: string,
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const currentStatusMeta = useMemo(() => {
    const rawStatus = profile?.applicationStatus || 'PENDING';
    return STATUS_META_MAP[rawStatus] || STATUS_META_MAP.PENDING;
  }, [profile?.applicationStatus]);

  const documentLinks = useMemo(() => {
    if (!profile) return [];

    const sources = [profile.companyDocumentsUrl]
      .map((item) => (item || '').trim())
      .filter((item) => !!item);

    return Array.from(new Set(sources));
  }, [profile]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const checkpoints = [
      profile.companyName,
      profile.companyWebsite,
      profile.companyAddress,
      profile.taxCodeOrBusinessRegistrationNumber,
      documentLinks.length > 0 ? 'has-document' : '',
      profile.applicationStatus,
    ];

    const completed = checkpoints.filter(Boolean).length;
    return Math.round((completed / checkpoints.length) * 100);
  }, [profile, documentLinks.length]);

  const logoUrl =
    profile?.companyLogoUrl || user?.avatarMediaUrl || user?.avatarUrl || '';

  const resetLogoEditor = useCallback(() => {
    setLogoEditorOpen(false);
    setLogoCrop({ x: 0, y: 0 });
    setLogoZoom(1);
    setLogoCroppedAreaPixels(null);

    if (logoTempUrl) {
      URL.revokeObjectURL(logoTempUrl);
    }
    setLogoTempUrl(null);
  }, [logoTempUrl]);

  const handleLogoCropComplete = useCallback(
    (_cropArea: Area, croppedAreaPixels: Area) => {
      setLogoCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleLogoPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) return;

    const validationResult = validateImage(selectedFile);
    if (!validationResult.valid) {
      setError(validationResult.error || 'Logo doanh nghiệp không hợp lệ.');
      return;
    }

    if (logoTempUrl) {
      URL.revokeObjectURL(logoTempUrl);
    }

    setError('');
    setSuccess('');
    setLogoTempUrl(URL.createObjectURL(selectedFile));
    setLogoCrop({ x: 0, y: 0 });
    setLogoZoom(1);
    setLogoCroppedAreaPixels(null);
    setLogoEditorOpen(true);
  };

  const handleLogoCropCancel = () => {
    if (logoUploading) {
      return;
    }
    resetLogoEditor();
  };

  const handleLogoCropConfirm = async () => {
    if (!logoTempUrl || !logoCroppedAreaPixels) {
      setError('Không thể xử lý logo doanh nghiệp. Vui lòng thử lại.');
      return;
    }

    setLogoUploading(true);
    try {
      const croppedLogo = await getCroppedImg(logoTempUrl, logoCroppedAreaPixels);

      if (!croppedLogo) {
        throw new Error('Không thể cắt logo doanh nghiệp.');
      }

      //TODO: Future business logo api, chờ backend làm api, fe làm sườn trước
      const uploadResult = await businessService.uploadCompanyLogo(croppedLogo);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              companyLogoUrl: uploadResult.companyLogoUrl,
            }
          : prev,
      );

      resetLogoEditor();
      setSuccess('Đã cập nhật logo doanh nghiệp thành công.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to upload business logo:', error);
      setError('Cập nhật logo doanh nghiệp thất bại. Vui lòng thử lại.');
    } finally {
      setLogoUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (logoTempUrl) {
        URL.revokeObjectURL(logoTempUrl);
      }
    };
  }, [logoTempUrl]);

  if (loading) {
    return (
      <div className="corp-container">
        <div className="corp-loading-state">Đang khởi tạo hồ sơ doanh nghiệp...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="corp-container">
        <div className="corp-empty-state">Không thể truy cập hồ sơ doanh nghiệp.</div>
      </div>
    );
  }

  const StatusIcon = currentStatusMeta.icon;
  const primaryDocumentUrl = editData.companyDocumentsUrl || '';

  const profileAddress = profile.companyAddress;

  const identityRows = [
    {
      label: 'Tên doanh nghiệp',
      value: profile.companyName || 'Chưa cập nhật',
    },
    {
      label: 'Mã số thuế / ĐKKD',
      value: profile.taxCodeOrBusinessRegistrationNumber || 'Chưa cập nhật',
    },
    {
      label: 'Website',
      value: profile.companyWebsite || 'Chưa cập nhật',
      asLink: !!profile.companyWebsite,
    },
  ];

  const heroCompanyName =
    profile.companyName || 'Doanh nghiệp chưa cập nhật tên';

  const companyIdDisplay = `BIZ-${String(profile.userId || '').padStart(6, '0')}`;

  const canOpenWebsite = normalizeWebsiteUrl(profile.companyWebsite);

  const applicationSubmittedDate = profile.applicationDate || profile.createdAt;
  const reviewedDate = profile.approvalDate;

  const hasRejectionReason =
    profile.applicationStatus === 'REJECTED' && !!profile.rejectionReason;

  const canSetBackupPassword =
    user?.authProvider === 'GOOGLE' && !user?.googleLinked;
  const canChangePassword =
    user?.authProvider === 'LOCAL' || user?.googleLinked;

  return (
    <div className="corp-container">
      <div className="corp-shell">
        <section className="corp-hero-card">
          <div className="corp-logo-block">
            <div className="corp-logo-frame">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo doanh nghiệp"
                  className="corp-logo-image"
                />
              ) : (
                <Building2 size={54} className="corp-logo-placeholder" />
              )}
            </div>
            <p className="corp-logo-caption">Logo hồ sơ doanh nghiệp</p>
          </div>

          <div className="corp-hero-main">
            <h1 className="corp-hero-title">{heroCompanyName}</h1>
            <p className="corp-hero-subtitle">
              Đồng bộ phong cách quản lý doanh nghiệp, tối ưu để cập nhật nhanh thông tin pháp lý.
            </p>

            <div className="corp-chip-row">
              <span className="corp-meta-chip">ID: {companyIdDisplay}</span>
              <span className="corp-meta-chip">
                Thiết lập từ: {formatDateVN(profile.createdAt)}
              </span>
              <span className={`corp-status-chip corp-status-chip--${currentStatusMeta.tone}`}>
                <StatusIcon size={15} />
                {currentStatusMeta.label}
              </span>
            </div>
          </div>

          <div className="corp-hero-actions">
            <label className="corp-btn corp-btn--ghost corp-btn--file">
              <ImagePlus size={16} />
              Đổi logo
              <input type="file" accept="image/*" onChange={handleLogoPick} />
            </label>

            <button
              type="button"
              className="corp-btn corp-btn--primary"
              onClick={() => setEditing((prev) => !prev)}
              disabled={saving}
            >
              {editing ? (
                <>
                  <X size={16} />
                  Đóng chỉnh sửa
                </>
              ) : (
                <>
                  <PencilLine size={16} />
                  Chỉnh sửa hồ sơ
                </>
              )}
            </button>

            <button
              type="button"
              className="corp-btn corp-btn--secondary"
              onClick={loadProfile}
              disabled={saving || logoUploading}
            >
              <RefreshCw size={16} />
              Làm mới dữ liệu
            </button>
          </div>
        </section>

        {success && (
          <div className="corp-alert corp-alert--success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="corp-alert corp-alert--error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="corp-layout">
          <div className="corp-main-column">
            {editing ? (
              <section className="corp-card corp-card--form">
                <header className="corp-card-header">
                  <div>
                    <h2>Chỉnh sửa thông tin doanh nghiệp</h2>
                    <p>Cập nhật hồ sơ để bộ phận kiểm duyệt xử lý nhanh hơn.</p>
                  </div>
                </header>

                <div className="corp-form-grid">
                  <div className="corp-form-group">
                    <label className="corp-form-label" htmlFor="corp-company-name">
                      Tên doanh nghiệp
                    </label>
                    <input
                      id="corp-company-name"
                      type="text"
                      className="corp-form-input"
                      value={editData.companyName || ''}
                      onChange={(event) =>
                        handleInputChange('companyName', event.target.value)
                      }
                      placeholder="Nhập tên pháp lý của doanh nghiệp"
                    />
                  </div>

                  <div className="corp-form-group">
                    <label className="corp-form-label" htmlFor="corp-tax-id">
                      Mã số thuế / Số đăng ký kinh doanh
                    </label>
                    <input
                      id="corp-tax-id"
                      type="text"
                      className="corp-form-input"
                      value={editData.taxCodeOrBusinessRegistrationNumber || ''}
                      onChange={(event) =>
                        handleInputChange('taxCodeOrBusinessRegistrationNumber', event.target.value)
                      }
                      placeholder="Ví dụ: 0312345678"
                    />
                  </div>

                  <div className="corp-form-group">
                    <label className="corp-form-label" htmlFor="corp-website">
                      Website doanh nghiệp
                    </label>
                    <input
                      id="corp-website"
                      type="text"
                      className="corp-form-input"
                      value={editData.companyWebsite || ''}
                      onChange={(event) =>
                        handleInputChange('companyWebsite', event.target.value)
                      }
                      placeholder="https://ten-cong-ty.vn"
                    />
                  </div>

                  <div className="corp-form-group">
                    <label className="corp-form-label" htmlFor="corp-doc-link">
                      Liên kết tài liệu pháp lý
                    </label>
                    <input
                      id="corp-doc-link"
                      type="text"
                      className="corp-form-input"
                      value={primaryDocumentUrl}
                      onChange={(event) =>
                        handleInputChange('companyDocumentsUrl', event.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="corp-form-group corp-form-group--full">
                    <label className="corp-form-label" htmlFor="corp-address">
                      Địa chỉ văn phòng hoạt động
                    </label>
                    <textarea
                      id="corp-address"
                      className="corp-form-input corp-form-textarea"
                      value={editData.companyAddress || ''}
                      onChange={(event) =>
                        handleInputChange('companyAddress', event.target.value)
                      }
                      placeholder="Nhập địa chỉ đang sử dụng để vận hành doanh nghiệp"
                    />
                  </div>
                </div>

                <div className="corp-form-actions">
                  <button
                    type="button"
                    className="corp-btn corp-btn--secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X size={16} />
                    Hủy chỉnh sửa
                  </button>

                  <button
                    type="button"
                    className="corp-btn corp-btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </div>
              </section>
            ) : (
              <>
                <section className="corp-card">
                  <header className="corp-card-header">
                    <div>
                      <h2>Thông tin doanh nghiệp</h2>
                      <p>Dữ liệu hiển thị cho hệ thống tuyển dụng và kiểm duyệt.</p>
                    </div>
                  </header>

                  <div className="corp-kv-grid">
                    {identityRows.map((row) => (
                      <article className="corp-kv-item" key={row.label}>
                        <span className="corp-kv-label">{row.label}</span>
                        {row.asLink && canOpenWebsite ? (
                          <a
                            className="corp-link"
                            href={canOpenWebsite}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Globe size={14} />
                            {row.value}
                          </a>
                        ) : (
                          <span className="corp-kv-value">{row.value}</span>
                        )}
                      </article>
                    ))}
                  </div>
                </section>

                <section className="corp-card">
                  <header className="corp-card-header">
                    <div>
                      <h2>Văn phòng hoạt động</h2>
                      <p>Địa chỉ doanh nghiệp đang dùng để xử lý vận hành chính.</p>
                    </div>
                  </header>

                  <div className="corp-location-box">
                    <MapPin size={18} />
                    <span>{profileAddress || 'Chưa cập nhật địa chỉ văn phòng.'}</span>
                  </div>
                </section>

                <section className="corp-card">
                  <header className="corp-card-header">
                    <div>
                      <h2>Tài liệu pháp lý</h2>
                      <p>Liên kết giấy phép/đăng ký dùng cho xác minh doanh nghiệp.</p>
                    </div>
                  </header>

                  {documentLinks.length > 0 ? (
                    <div className="corp-doc-list">
                      {documentLinks.map((link, index) => (
                        <a
                          key={`${link}-${index}`}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="corp-doc-item"
                        >
                          <FileText size={18} />
                          <span>Tài liệu pháp lý #{index + 1}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="corp-muted-note">
                      Chưa có tài liệu pháp lý nào được liên kết.
                    </p>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="corp-side-column">
            <section className="corp-card corp-card--highlight">
              <header className="corp-card-header">
                <div>
                  <h2>Trạng thái kiểm duyệt</h2>
                  <p>{currentStatusMeta.description}</p>
                </div>
              </header>

              <div className={`corp-status-chip corp-status-chip--${currentStatusMeta.tone}`}>
                <StatusIcon size={16} />
                {currentStatusMeta.label}
              </div>

              {hasRejectionReason && (
                <div className="corp-reason-box">
                  <AlertTriangle size={16} />
                  <span>{profile.rejectionReason}</span>
                </div>
              )}
            </section>

            <section className="corp-card">
              <header className="corp-card-header">
                <div>
                  <h2>Tiến độ hồ sơ</h2>
                  <p>Tổng hợp mức độ hoàn chỉnh các mục cần thiết.</p>
                </div>
              </header>

              <div className="corp-progress-row">
                <span>Hoàn chỉnh hồ sơ</span>
                <strong>{profileCompletion}%</strong>
              </div>
              <div className="corp-progress-track">
                <div className="corp-progress-fill" style={{ width: `${profileCompletion}%` }} />
              </div>
            </section>

            <section className="corp-card">
              <header className="corp-card-header">
                <div>
                  <h2>Mốc thời gian</h2>
                  <p>Theo dõi quá trình gửi và duyệt hồ sơ doanh nghiệp.</p>
                </div>
              </header>

              <div className="corp-timeline">
                <div className="corp-timeline-item">
                  <CalendarClock size={15} />
                  <div>
                    <span className="corp-timeline-label">Ngày gửi hồ sơ</span>
                    <strong>{formatDateVN(applicationSubmittedDate)}</strong>
                  </div>
                </div>

                <div className="corp-timeline-item">
                  <CalendarClock size={15} />
                  <div>
                    <span className="corp-timeline-label">Lần duyệt gần nhất</span>
                    <strong>{formatDateVN(reviewedDate)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="corp-card">
              <header className="corp-card-header">
                <div>
                  <h2>Bảo mật tài khoản</h2>
                  <p>Cập nhật mật khẩu đăng nhập cho tài khoản doanh nghiệp.</p>
                </div>
              </header>

              <div className="corp-security-grid">
                {canSetBackupPassword && (
                  <article className="corp-security-item corp-security-item--warning">
                    <h3>Mật khẩu dự phòng</h3>
                    <p>Thiết lập mật khẩu để đăng nhập khi Google OAuth không khả dụng.</p>
                    <button
                      type="button"
                      className="corp-btn corp-btn--secondary"
                      onClick={() => navigate('/set-password')}
                    >
                      <Shield size={16} />
                      Thiết lập mật khẩu
                    </button>
                  </article>
                )}

                {canChangePassword && (
                  <article className="corp-security-item">
                    <h3>Đổi mật khẩu</h3>
                    <p>Khuyến nghị thay đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
                    <button
                      type="button"
                      className="corp-btn corp-btn--primary"
                      onClick={() => navigate('/change-password')}
                    >
                      <Lock size={16} />
                      Đổi mật khẩu
                    </button>
                  </article>
                )}
              </div>

              {user?.googleLinked && (
                <p className="corp-security-note">
                  Bạn đã bật xác thực kép: có thể đăng nhập bằng cả Google và email + mật khẩu.
                </p>
              )}

              {!canSetBackupPassword && !canChangePassword && (
                <p className="corp-muted-note">
                  Chưa có tác vụ bảo mật khả dụng cho tài khoản hiện tại.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>

      {logoEditorOpen &&
        logoTempUrl &&
        ReactDOM.createPortal(
          <div className="corp-logo-crop-overlay" onClick={handleLogoCropCancel}>
            <div
              className="corp-logo-crop-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="corp-logo-crop-header">
                <h3>Căn chỉnh logo doanh nghiệp</h3>
                <button
                  type="button"
                  className="corp-logo-crop-close"
                  onClick={handleLogoCropCancel}
                  disabled={logoUploading}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>

              <p className="corp-logo-crop-hint">
                Kéo ảnh để căn vị trí logo, sau đó điều chỉnh trái/phải và mức zoom.
              </p>

              <div className="corp-logo-crop-stage">
                <Cropper
                  image={logoTempUrl}
                  crop={logoCrop}
                  zoom={logoZoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  objectFit="horizontal-cover"
                  onCropChange={setLogoCrop}
                  onCropComplete={handleLogoCropComplete}
                  onZoomChange={setLogoZoom}
                />
              </div>

              <div className="corp-logo-crop-control">
                <label htmlFor="corp-logo-horizontal">Vị trí trái / phải</label>
                <input
                  id="corp-logo-horizontal"
                  type="range"
                  min={-200}
                  max={200}
                  step={1}
                  value={logoCrop.x}
                  disabled={logoUploading}
                  onChange={(event) =>
                    setLogoCrop((prev) => ({
                      ...prev,
                      x: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="corp-logo-crop-control">
                <label htmlFor="corp-logo-zoom">Zoom</label>
                <input
                  id="corp-logo-zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={logoZoom}
                  disabled={logoUploading}
                  onChange={(event) => setLogoZoom(Number(event.target.value))}
                />
              </div>

              <div className="corp-logo-crop-actions">
                <button
                  type="button"
                  className="corp-btn corp-btn--secondary"
                  onClick={handleLogoCropCancel}
                  disabled={logoUploading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="corp-btn corp-btn--primary"
                  onClick={handleLogoCropConfirm}
                  disabled={logoUploading}
                >
                  {logoUploading ? 'Đang cập nhật...' : 'Lưu logo'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default RecruiterProfilePage;
