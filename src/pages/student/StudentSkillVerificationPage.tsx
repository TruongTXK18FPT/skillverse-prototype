/**
 * [Nghiệp vụ] Trang xác thực skill cho student.
 * 2 phương pháp: Tự nộp bằng chứng (admin duyệt) + Book mentor (roadmap).
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Plus, CheckCircle, Clock, XCircle, ExternalLink,
  FileText, Github, Briefcase, Send, ChevronDown, ChevronUp,
  Award, AlertCircle, Upload, Map, Users, Image,
} from 'lucide-react';
import {
  submitStudentVerification,
  getMyStudentVerifications,
  CreateStudentVerificationRequest,
  StudentVerificationResponse,
} from '../../services/studentSkillVerificationService';
import type { EvidenceItem } from '../../services/mentorVerificationService';
import { uploadEvidence } from '../../services/mentorVerificationService';
import { getVerifiedSkills } from '../../services/nodeMentoringService';
import type { UserVerifiedSkillDTO } from '../../types/NodeMentoring';
import { useAuth } from '../../context/AuthContext';
import './StudentSkillVerificationPage.css';

interface LocalEvidenceItem extends EvidenceItem {
  workplace?: string;
  position?: string;
  detailDescription?: string;
}

const StudentSkillVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<StudentVerificationResponse[]>([]);
  const [roadmapSkills, setRoadmapSkills] = useState<UserVerifiedSkillDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
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
      const [reqs, rmSkills] = await Promise.all([
        getMyStudentVerifications(),
        getVerifiedSkills().catch(() => [] as UserVerifiedSkillDTO[]),
      ]);
      setVerifications(reqs);
      setRoadmapSkills(rmSkills);
    } catch (err) {
      console.error('Failed to load verification data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setSkillName(''); setGithubUrl(''); setPortfolioUrl('');
    setAdditionalNotes(''); setEvidences([]); setError(null);
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
      const url = await uploadEvidence(file);
      updateEvidence(index, 'evidenceUrl', url);
    } catch {
      setError('Upload ảnh thất bại. Vui lòng thử lại.');
    }
  };

  const formatUrl = (url: string) => {
    let f = url.trim();
    if (f && !/^https?:\/\//i.test(f)) f = 'https://' + f;
    return f;
  };

  const isImageUrl = (url: string | undefined) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || url.includes("cloudinary.com");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccessMsg(null);
    if (!skillName.trim()) { setError('Vui lòng nhập tên skill.'); return; }
    if (evidences.length === 0 && !githubUrl.trim() && !portfolioUrl.trim()) {
      setError('Vui lòng cung cấp ít nhất 1 bằng chứng.'); return;
    }

    const allEvidences: LocalEvidenceItem[] = [...evidences];
    if (githubUrl.trim()) allEvidences.push({ evidenceType: 'GITHUB', evidenceUrl: githubUrl.trim(), description: 'GitHub profile/repo' });
    if (portfolioUrl.trim()) allEvidences.push({ evidenceType: 'PORTFOLIO_LINK', evidenceUrl: portfolioUrl.trim(), description: 'Portfolio link' });

    const request: CreateStudentVerificationRequest = {
      skillName: skillName.trim(),
      githubUrl: formatUrl(githubUrl) || undefined,
      portfolioUrl: formatUrl(portfolioUrl) || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      certificateIds: [],
      evidences: allEvidences.map(ev => {
        let finalDescription = ev.description;
        if (ev.evidenceType === 'WORK_EXPERIENCE') {
          finalDescription = `Nơi công tác: ${ev.workplace || 'N/A'}\nChức vụ: ${ev.position || 'N/A'}\nChi tiết: ${ev.detailDescription || ''}`.trim();
        }
        return { evidenceType: ev.evidenceType, description: finalDescription, evidenceUrl: ev.evidenceUrl ? formatUrl(ev.evidenceUrl) : undefined };
      }).filter(ev => ev.evidenceUrl || ev.description),
    };

    try {
      setSubmitting(true);
      await submitStudentVerification(request);
      setSuccessMsg(`Yêu cầu xác thực "${skillName}" đã được gửi thành công!`);
      resetForm(); setShowForm(false); await loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Có lỗi xảy ra'));
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRequests = verifications.filter(v => v.status === 'PENDING' || v.status === 'REJECTED');
  const approvedRequests = verifications.filter(v => v.status === 'APPROVED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="sskv-status-badge sskv-status-badge--pending"><Clock size={13} /> Chờ duyệt</span>;
      case 'APPROVED': return <span className="sskv-status-badge sskv-status-badge--approved"><CheckCircle size={13} /> Đã duyệt</span>;
      case 'REJECTED': return <span className="sskv-status-badge sskv-status-badge--rejected"><XCircle size={13} /> Từ chối</span>;
      default: return null;
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return <FileText size={14} />;
      case 'GITHUB': return <Github size={14} />;
      case 'PORTFOLIO_LINK': return <ExternalLink size={14} />;
      case 'WORK_EXPERIENCE': return <Briefcase size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getEvidenceLabel = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return 'Chứng chỉ';
      case 'GITHUB': return 'GitHub';
      case 'PORTFOLIO_LINK': return 'Portfolio/Link';
      case 'WORK_EXPERIENCE': return 'Kinh nghiệm';
      default: return type;
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return <div className="sskv-page"><div className="sskv-loading"><div className="sskv-spinner" /></div></div>;
  }

  return (
    <div className="sskv-page">
      <div className="sskv-hero">
        <div className="sskv-hero-content">
          <h1><Shield size={28} /> Xác Thực Kỹ Năng</h1>
          <p>Xác thực kỹ năng của bạn để nổi bật trên portfolio chuyên nghiệp</p>
        </div>
      </div>

      <div className="sskv-container">
        {/* Tabs */}
        <div className="sskv-tabs">
          <button className={`sskv-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <Clock size={16} /> Yêu Cầu Xác Thực
            {pendingRequests.length > 0 && <span className="sskv-tab-badge">{pendingRequests.length}</span>}
          </button>
          <button className={`sskv-tab ${activeTab === 'verified' ? 'active' : ''}`} onClick={() => setActiveTab('verified')}>
            <CheckCircle size={16} /> Skill Đã Xác Thực
            {(approvedRequests.length + roadmapSkills.length) > 0 && <span className="sskv-tab-badge">{approvedRequests.length + roadmapSkills.length}</span>}
          </button>
        </div>

        {successMsg && <div className="sskv-alert sskv-alert--success"><CheckCircle size={16} /> {successMsg}</div>}

        {/* ===== TAB: PENDING ===== */}
        {activeTab === 'pending' && (
          <>
            <button className="sskv-new-btn" onClick={() => { setShowForm(!showForm); setError(null); setSuccessMsg(null); }}>
              <Plus size={18} /> {showForm ? 'Đóng Form' : 'Xác Thực Skill Mới'}
            </button>

            {showForm && (
              <form className="sskv-form" onSubmit={handleSubmit}>
                <h3><Award size={20} /> Gửi Yêu Cầu Xác Thực Skill</h3>
                {error && <div className="sskv-alert sskv-alert--error"><AlertCircle size={16} /> {error}</div>}

                <div className="sskv-form-group">
                  <label>Tên Skill *</label>
                  <input className="sskv-input" placeholder="VD: React, Java, Python..." value={skillName} onChange={e => setSkillName(e.target.value)} />
                </div>

                <div className="sskv-form-group">
                  <label>GitHub URL</label>
                  <input className="sskv-input" placeholder="https://github.com/username" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
                </div>

                <div className="sskv-form-group">
                  <label>Portfolio / Website URL</label>
                  <input className="sskv-input" placeholder="https://portfolio.example.com" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
                </div>

                <div className="sskv-form-group">
                  <label>Ghi chú bổ sung</label>
                  <textarea className="sskv-textarea" placeholder="Mô tả kinh nghiệm, lý do xin xác thực skill..." value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} />
                </div>

                {/* Evidence */}
                <div className="sskv-evidence-section">
                  <h4>Bằng chứng đính kèm</h4>
                  <div className="sskv-evidence-btns">
                    <button type="button" className="sskv-add-evidence-btn" onClick={() => addEvidence('CERTIFICATE')}><Image size={14} /> Chứng chỉ (ảnh)</button>
                    <button type="button" className="sskv-add-evidence-btn" onClick={() => addEvidence('GITHUB')}><Github size={14} /> GitHub Repo</button>
                    <button type="button" className="sskv-add-evidence-btn" onClick={() => addEvidence('PORTFOLIO_LINK')}><ExternalLink size={14} /> Project Link</button>
                    <button type="button" className="sskv-add-evidence-btn" onClick={() => addEvidence('WORK_EXPERIENCE')}><Briefcase size={14} /> Kinh nghiệm / Học vấn</button>
                  </div>

                  {evidences.map((ev, i) => (
                    <div key={i} className="sskv-evidence-card">
                      <div className="sskv-evidence-header">
                        <span className="sskv-evidence-type">{getEvidenceIcon(ev.evidenceType)} {getEvidenceLabel(ev.evidenceType)}</span>
                        <button type="button" className="sskv-remove-btn" onClick={() => removeEvidence(i)}>✕</button>
                      </div>
                      <div className="sskv-evidence-fields">
                        {ev.evidenceType === 'CERTIFICATE' ? (
                          <>
                            <label className="sskv-file-label">
                              <Upload size={14} /> Upload ảnh chứng chỉ (Cloudinary)
                              <input type="file" accept="image/*" onChange={e => handleUploadImage(i, e)} />
                            </label>
                            {ev.evidenceUrl && isImageUrl(ev.evidenceUrl) && <img src={ev.evidenceUrl} alt="Preview" className="sskv-evidence-img-preview" />}
                            {ev.evidenceUrl && !isImageUrl(ev.evidenceUrl) && <span style={{ color: '#4ade80', fontSize: '0.85rem' }}>✓ Đã upload</span>}
                            <input className="sskv-input" placeholder="Hoặc dán URL ảnh chứng chỉ" value={ev.evidenceUrl || ''} onChange={e => updateEvidence(i, 'evidenceUrl', e.target.value)} />
                            <input className="sskv-input" placeholder="Tên chứng chỉ, tổ chức cấp" value={ev.description || ''} onChange={e => updateEvidence(i, 'description', e.target.value)} />
                          </>
                        ) : ev.evidenceType === 'WORK_EXPERIENCE' ? (
                          <>
                            <input className="sskv-input" placeholder="Nơi công tác / Trường học" value={ev.workplace || ''} onChange={e => updateEvidence(i, 'workplace', e.target.value)} />
                            <input className="sskv-input" placeholder="Chức vụ / Bằng cấp" value={ev.position || ''} onChange={e => updateEvidence(i, 'position', e.target.value)} />
                            <textarea className="sskv-textarea" placeholder="Mô tả chi tiết kinh nghiệm..." value={ev.detailDescription || ''} onChange={e => updateEvidence(i, 'detailDescription', e.target.value)} />
                            <label className="sskv-file-label">
                              <Upload size={14} /> Upload ảnh minh chứng
                              <input type="file" accept="image/*" onChange={e => handleUploadImage(i, e)} />
                            </label>
                            {ev.evidenceUrl && isImageUrl(ev.evidenceUrl) && <img src={ev.evidenceUrl} alt="Preview" className="sskv-evidence-img-preview" />}
                          </>
                        ) : (
                          <>
                            <input className="sskv-input" placeholder="URL (https://...)" value={ev.evidenceUrl || ''} onChange={e => updateEvidence(i, 'evidenceUrl', e.target.value)} />
                            <input className="sskv-input" placeholder="Mô tả" value={ev.description || ''} onChange={e => updateEvidence(i, 'description', e.target.value)} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sskv-form-actions">
                  <button type="button" className="sskv-cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>Hủy</button>
                  <button type="submit" className="sskv-submit-btn" disabled={submitting}><Send size={16} /> {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}</button>
                </div>
              </form>
            )}

            {/* Pending list */}
            {pendingRequests.length === 0 ? (
              <div className="sskv-empty">
                <div className="sskv-empty-icon"><Clock size={28} /></div>
                <p>Chưa có yêu cầu xác thực nào. Nhấn "Xác Thực Skill Mới" để bắt đầu.</p>
              </div>
            ) : (
              <div className="sskv-request-list">
                {pendingRequests.map(req => (
                  <div key={req.id} className="sskv-request-card" onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
                    <div className="sskv-request-top">
                      <span className="sskv-request-skill">{req.skillName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getStatusBadge(req.status)}
                        {expandedId === req.id ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                      </div>
                    </div>
                    <div className="sskv-request-date">Ngày gửi: {formatDate(req.requestedAt)}</div>

                    {expandedId === req.id && (
                      <div className="sskv-request-detail">
                        {req.githubUrl && <div className="sskv-detail-row"><span className="sskv-detail-label">GitHub:</span><span className="sskv-detail-value"><a href={req.githubUrl} target="_blank" rel="noreferrer">{req.githubUrl}</a></span></div>}
                        {req.portfolioUrl && <div className="sskv-detail-row"><span className="sskv-detail-label">Portfolio:</span><span className="sskv-detail-value"><a href={req.portfolioUrl} target="_blank" rel="noreferrer">{req.portfolioUrl}</a></span></div>}
                        {req.additionalNotes && <div className="sskv-detail-row"><span className="sskv-detail-label">Ghi chú:</span><span className="sskv-detail-value">{req.additionalNotes}</span></div>}

                        {req.evidences && req.evidences.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>Bằng chứng ({req.evidences.length}):</strong>
                            {req.evidences.map(ev => (
                              <div key={ev.id} className="sskv-evidence-card" style={{ marginTop: '0.5rem' }}>
                                <span className="sskv-evidence-type">{getEvidenceIcon(ev.evidenceType)} {getEvidenceLabel(ev.evidenceType)}</span>
                                {ev.evidenceUrl && isImageUrl(ev.evidenceUrl) && <img src={ev.evidenceUrl} alt="evidence" className="sskv-evidence-img-preview" style={{ marginTop: '0.5rem' }} />}
                                {ev.evidenceUrl && !isImageUrl(ev.evidenceUrl) && <div style={{ marginTop: '0.35rem' }}><a href={ev.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: '#22d3ee', fontSize: '0.85rem' }}>{ev.evidenceUrl}</a></div>}
                                {ev.description && <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>{ev.description}</p>}
                              </div>
                            ))}
                          </div>
                        )}

                        {req.status === 'REJECTED' && req.reviewNote && (
                          <div className="sskv-review-note"><strong>Lý do từ chối:</strong> {req.reviewNote}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== TAB: VERIFIED ===== */}
        {activeTab === 'verified' && (
          <>
            {/* Admin-verified skills */}
            {approvedRequests.length > 0 && (
              <>
                <h3 style={{ color: '#4ade80', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={18} /> Xác thực bởi Admin ({approvedRequests.length})
                </h3>
                <div className="sskv-verified-grid">
                  {approvedRequests.map(req => (
                    <div key={req.id} className="sskv-verified-card" onClick={() => navigate(`/students/${user?.id}/verified-skills/${encodeURIComponent(req.skillName)}`)}>
                      <div className="sskv-verified-icon"><CheckCircle size={22} /></div>
                      <div className="sskv-verified-name">{req.skillName}</div>
                      <div className="sskv-verified-method"><Shield size={12} /> Admin Verified</div>
                      <div className="sskv-verified-date">Duyệt: {req.reviewedAt ? formatDate(req.reviewedAt) : 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Roadmap-verified skills */}
            {roadmapSkills.length > 0 && (
              <div className="sskv-roadmap-section">
                <h4><Map size={18} /> Xác thực qua Mentor Roadmap ({roadmapSkills.length})</h4>
                <div className="sskv-verified-grid">
                  {roadmapSkills.map(skill => (
                    <div key={skill.id} className="sskv-verified-card" onClick={() => navigate(`/students/${user?.id}/verified-skills/${encodeURIComponent(skill.skillName)}`)}>
                      <div className="sskv-verified-icon" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1))', color: '#a78bfa' }}><Users size={22} /></div>
                      <div className="sskv-verified-name">{skill.skillName}</div>
                      <div className="sskv-verified-method"><Users size={12} /> {skill.verifiedByMentorName || 'Mentor'}</div>
                      <div className="sskv-verified-date">Xác thực: {formatDate(skill.verifiedAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {approvedRequests.length === 0 && roadmapSkills.length === 0 && (
              <div className="sskv-empty">
                <div className="sskv-empty-icon"><Shield size={28} /></div>
                <p>Chưa có skill nào được xác thực.</p>
              </div>
            )}

            {/* Mentor Guide */}
            <div className="sskv-mentor-guide">
              <h3><Users size={20} /> Xác thực qua Mentor (Phương pháp 2)</h3>
              <p>Bạn có thể book một mentor để đồng hành học roadmap. Khi hoàn thành roadmap và được mentor đánh giá PASS, skill sẽ tự động được xác thực và hiển thị trên portfolio.</p>
              <a href="/mentorship" className="sskv-mentor-link" onClick={e => { e.preventDefault(); navigate('/mentorship'); }}><Users size={16} /> Tìm Mentor Ngay</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentSkillVerificationPage;
