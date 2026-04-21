/**
 * [Nghiệp vụ] Tab xác thực skill của mentor trong MentorDashboard.
 * 
 * Mentor có thể:
 * 1. Xem danh sách skill đã verified (badge xanh)
 * 2. Xem trạng thái các request (PENDING/APPROVED/REJECTED)
 * 3. Tạo request mới: chọn skill → attach chứng chỉ/github/experience → submit
 * 
 * Request sẽ được gửi đến admin để duyệt.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  FileText,
  Github,
  Briefcase,
  Send,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  submitVerification,
  getMyVerifications,
  getMyVerifiedSkills,
  CreateVerificationRequest,
  MentorVerificationResponse,
  EvidenceItem,
  uploadEvidence,
} from '../../services/mentorVerificationService';
import './MentorVerificationTab.css';

interface LocalEvidenceItem extends EvidenceItem {
  workplace?: string;
  position?: string;
  detailDescription?: string;
}

const MentorVerificationTab: React.FC = () => {
  const [verifications, setVerifications] = useState<MentorVerificationResponse[]>([]);
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [skillName, setSkillName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [evidences, setEvidences] = useState<LocalEvidenceItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqs, skills] = await Promise.all([
        getMyVerifications(),
        getMyVerifiedSkills(),
      ]);
      setVerifications(reqs);
      setVerifiedSkills(skills);
    } catch (err) {
      console.error('Failed to load verification data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setSkillName('');
    setGithubUrl('');
    setPortfolioUrl('');
    setAdditionalNotes('');
    setEvidences([]);
    setError(null);
  };

  const addEvidence = (type: EvidenceItem['evidenceType']) => {
    setEvidences([...evidences, { evidenceType: type, evidenceUrl: '', description: '' }]);
  };

  const updateEvidence = (index: number, field: keyof LocalEvidenceItem, value: string) => {
    const updated = [...evidences];
    updated[index] = { ...updated[index], [field]: value };
    setEvidences(updated);
  };

  const removeEvidence = (index: number) => {
    setEvidences(evidences.filter((_, i) => i !== index));
  };

  const handleUploadImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Show uploading state by updating description or somehow notifying (optional, keeping it simple)
      const url = await uploadEvidence(file);
      updateEvidence(index, 'evidenceUrl', url);
    } catch (err: unknown) {
      console.error(err);
      setError('Upload ảnh thất bại. Vui lòng thử lại.');
    }
  };

  const formatUrl = (url: string) => {
    let formatted = url.trim();
    if (formatted && !/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
    }
    return formatted;
  };

  const isImageUrl = (url: string | undefined) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || url.includes("cloudinary.com");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!skillName.trim()) {
      setError('Vui lòng nhập tên skill.');
      return;
    }

    if (evidences.length === 0 && !githubUrl.trim() && !portfolioUrl.trim()) {
      setError('Vui lòng cung cấp ít nhất 1 bằng chứng (chứng chỉ, GitHub, kinh nghiệm).');
      return;
    }

    // Auto-add github and portfolio as evidence if provided
    const allEvidences: LocalEvidenceItem[] = [...evidences];
    if (githubUrl.trim()) {
      allEvidences.push({
        evidenceType: 'GITHUB',
        evidenceUrl: githubUrl.trim(),
        description: 'GitHub profile/repo',
      });
    }
    if (portfolioUrl.trim()) {
      allEvidences.push({
        evidenceType: 'PORTFOLIO_LINK',
        evidenceUrl: portfolioUrl.trim(),
        description: 'Portfolio link',
      });
    }

    const request: CreateVerificationRequest = {
      skillName: skillName.trim(),
      githubUrl: formatUrl(githubUrl) || undefined,
      portfolioUrl: formatUrl(portfolioUrl) || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      certificateIds: [],
      evidences: allEvidences.map(e => {
        let finalDescription = e.description;
        if (e.evidenceType === 'WORK_EXPERIENCE') {
          finalDescription = `Nơi công tác/Học tập: ${e.workplace || 'Không rõ'}\nChức vụ/Bằng cấp: ${e.position || 'Không rõ'}\nChi tiết: ${e.detailDescription || ''}`.trim();
        }
        return {
          evidenceType: e.evidenceType,
          description: finalDescription,
          evidenceUrl: e.evidenceUrl ? formatUrl(e.evidenceUrl) : undefined,
        };
      }).filter(e => e.evidenceUrl || e.description),
    };

    try {
      setSubmitting(true);
      await submitVerification(request);
      setSuccessMsg(`Yêu cầu xác thực skill "${skillName}" đã được gửi thành công!`);
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="mvt-badge mvt-badge--approved"><CheckCircle size={14} /> Đã duyệt</span>;
      case 'PENDING':
        return <span className="mvt-badge mvt-badge--pending"><Clock size={14} /> Đang chờ</span>;
      case 'REJECTED':
        return <span className="mvt-badge mvt-badge--rejected"><XCircle size={14} /> Từ chối</span>;
      default:
        return null;
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return <FileText size={16} />;
      case 'GITHUB': return <Github size={16} />;
      case 'PORTFOLIO_LINK': return <ExternalLink size={16} />;
      case 'WORK_EXPERIENCE': return <Briefcase size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getEvidenceLabel = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return 'Chứng chỉ';
      case 'GITHUB': return 'GitHub';
      case 'PORTFOLIO_LINK': return 'Portfolio';
      case 'WORK_EXPERIENCE': return 'Kinh nghiệm';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="mvt-container">
        <div className="mvt-loading">
          <div className="mvt-loading__spinner" />
          <p>Đang tải thông tin xác thực...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mvt-container">
      {/* Header */}
      <div className="mvt-header">
        <div className="mvt-header__info">
          <h2 className="mvt-header__title">
            <Shield size={24} /> Xác thực Skill
          </h2>
          <p className="mvt-header__subtitle">
            Gửi yêu cầu xác thực kỹ năng kèm chứng chỉ, bằng cấp hoặc kinh nghiệm để được công nhận.
          </p>
        </div>
        <button
          className="mvt-btn mvt-btn--primary"
          onClick={() => { setShowForm(!showForm); setError(null); setSuccessMsg(null); }}
        >
          <Plus size={16} />
          {showForm ? 'Đóng form' : 'Xác thực skill mới'}
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mvt-alert mvt-alert--success">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Verified Skills Badges */}
      {verifiedSkills.length > 0 && (
        <div className="mvt-verified-section">
          <h3 className="mvt-section-title"><Award size={18} /> Skill đã được xác thực</h3>
          <div className="mvt-verified-skills">
            {verifiedSkills.map(skill => (
              <span key={skill} className="mvt-skill-badge mvt-skill-badge--verified">
                <CheckCircle size={14} /> {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Submit Form */}
      {showForm && (
        <form className="mvt-form" onSubmit={handleSubmit}>
          <h3 className="mvt-form__title">Gửi yêu cầu xác thực skill mới</h3>

          {error && (
            <div className="mvt-alert mvt-alert--error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="mvt-form__group">
            <label className="mvt-form__label">Tên Skill *</label>
            <input
              type="text"
              className="mvt-form__input"
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
              placeholder="Ví dụ: React, Java Spring Boot, UI Design..."
              maxLength={100}
              required
            />
          </div>

          <div className="mvt-form__row">
            <div className="mvt-form__group">
              <label className="mvt-form__label">GitHub URL</label>
              <input
                type="url"
                className="mvt-form__input"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
              />
            </div>
            <div className="mvt-form__group">
              <label className="mvt-form__label">Portfolio URL</label>
              <input
                type="url"
                className="mvt-form__input"
                value={portfolioUrl}
                onChange={e => setPortfolioUrl(e.target.value)}
                placeholder="https://portfolio.example.com"
              />
            </div>
          </div>

          <div className="mvt-form__group">
            <label className="mvt-form__label">Mô tả kinh nghiệm liên quan</label>
            <textarea
              className="mvt-form__textarea"
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="Mô tả kinh nghiệm, dự án đã làm liên quan đến skill này..."
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Additional Evidence */}
          <div className="mvt-form__group">
            <label className="mvt-form__label">Bằng chứng bổ sung</label>
            <div className="mvt-evidence-buttons">
              <button type="button" className="mvt-btn mvt-btn--outline mvt-btn--sm"
                onClick={() => addEvidence('WORK_EXPERIENCE')}>
                <Briefcase size={14} /> Kinh nghiệm
              </button>
              <button type="button" className="mvt-btn mvt-btn--outline mvt-btn--sm"
                onClick={() => addEvidence('CERTIFICATE')}>
                <FileText size={14} /> Chứng chỉ (URL)
              </button>
              <button type="button" className="mvt-btn mvt-btn--outline mvt-btn--sm"
                onClick={() => addEvidence('PORTFOLIO_LINK')}>
                <ExternalLink size={14} /> Link dự án
              </button>
            </div>

            {evidences.map((ev, idx) => (
              <div key={idx} className="mvt-evidence-item">
                <div className="mvt-evidence-item__header">
                  {getEvidenceIcon(ev.evidenceType)}
                  <span>{getEvidenceLabel(ev.evidenceType)}</span>
                  <button type="button" className="mvt-btn--icon" onClick={() => removeEvidence(idx)}>
                    <XCircle size={14} />
                  </button>
                </div>
                {ev.evidenceType !== 'WORK_EXPERIENCE' && (
                  <>
                    <div className="mvt-file-upload-wrapper">
                      <input
                        type="url"
                        className="mvt-form__input"
                        value={ev.evidenceUrl}
                        onChange={e => updateEvidence(idx, 'evidenceUrl', e.target.value)}
                        placeholder="Hoặc nhập URL..."
                        style={{ flex: 1 }}
                      />
                      <label className="mvt-file-upload-btn">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="mvt-file-input" 
                          onChange={(e) => handleUploadImage(idx, e)} 
                        />
                        Upload Ảnh
                      </label>
                    </div>
                    {isImageUrl(ev.evidenceUrl) && (
                      <div className="mvt-image-preview-wrapper">
                        <img src={ev.evidenceUrl} alt="Preview" className="mvt-image-preview" />
                      </div>
                    )}
                    <textarea
                      className="mvt-form__textarea mvt-form__textarea--sm"
                      value={ev.description}
                      onChange={e => updateEvidence(idx, 'description', e.target.value)}
                      placeholder="Mô tả minh chứng..."
                      rows={2}
                    />
                  </>
                )}

                {ev.evidenceType === 'WORK_EXPERIENCE' && (
                  <div className="mvt-work-experience-inputs">
                    <input
                      type="text"
                      className="mvt-form__input mvt-form__input--sm"
                      value={ev.workplace || ''}
                      onChange={e => updateEvidence(idx, 'workplace', e.target.value)}
                      placeholder="Nơi làm việc, tên trường học, công ty..."
                    />
                    <input
                      type="text"
                      className="mvt-form__input mvt-form__input--sm"
                      value={ev.position || ''}
                      onChange={e => updateEvidence(idx, 'position', e.target.value)}
                      placeholder="Chức vụ, vị trí, hoặc thể loại bằng cấp..."
                    />
                    <textarea
                      className="mvt-form__textarea mvt-form__textarea--sm"
                      value={ev.detailDescription || ''}
                      onChange={e => updateEvidence(idx, 'detailDescription', e.target.value)}
                      placeholder="Mô tả chi tiết kỹ năng bạn áp dụng, dự án cụ thể ở đây..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mvt-form__actions">
            <button type="button" className="mvt-btn mvt-btn--secondary" onClick={() => { setShowForm(false); resetForm(); }}>
              Hủy
            </button>
            <button type="submit" className="mvt-btn mvt-btn--primary" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      )}

      {/* Verification Requests List */}
      <div className="mvt-requests">
        <h3 className="mvt-section-title">Lịch sử yêu cầu xác thực</h3>
        {verifications.length === 0 ? (
          <div className="mvt-empty">
            <Shield size={48} />
            <p>Chưa có yêu cầu xác thực nào.</p>
            <p className="mvt-empty__hint">Hãy gửi yêu cầu đầu tiên để bắt đầu!</p>
          </div>
        ) : (
          <div className="mvt-request-list">
            {verifications.map(req => (
              <div key={req.id} className={`mvt-request-card mvt-request-card--${req.status.toLowerCase()}`}>
                <div className="mvt-request-card__header"
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
                  <div className="mvt-request-card__info">
                    <span className="mvt-request-card__skill">{req.skillName}</span>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="mvt-request-card__meta">
                    <span className="mvt-request-card__date">
                      {new Date(req.requestedAt).toLocaleDateString('vi-VN')}
                    </span>
                    {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedId === req.id && (
                  <div className="mvt-request-card__details">
                    {req.githubUrl && (
                      <div className="mvt-detail-row">
                        <Github size={14} />
                        <a href={req.githubUrl} target="_blank" rel="noopener noreferrer">{req.githubUrl}</a>
                      </div>
                    )}
                    {req.portfolioUrl && (
                      <div className="mvt-detail-row">
                        <ExternalLink size={14} />
                        <a href={req.portfolioUrl} target="_blank" rel="noopener noreferrer">{req.portfolioUrl}</a>
                      </div>
                    )}
                    {req.additionalNotes && (
                      <div className="mvt-detail-row">
                        <FileText size={14} />
                        <span>{req.additionalNotes}</span>
                      </div>
                    )}
                    {req.evidences.length > 0 && (
                      <div className="mvt-evidences">
                        <strong>Bằng chứng:</strong>
                        {req.evidences.map(ev => (
                          <div key={ev.id} className="mvt-evidence-display">
                            {getEvidenceIcon(ev.evidenceType)}
                            <span className="mvt-evidence-display__type">{getEvidenceLabel(ev.evidenceType)}</span>
                            {ev.evidenceUrl && (
                              <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink size={12} />
                              </a>
                            )}
                            {ev.description && <span className="mvt-evidence-display__desc">{ev.description}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {req.reviewNote && (
                      <div className="mvt-review-note">
                        <strong>Ghi chú từ admin:</strong>
                        <p>{req.reviewNote}</p>
                        {req.reviewedByName && (
                          <span className="mvt-review-note__by">— {req.reviewedByName}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorVerificationTab;
