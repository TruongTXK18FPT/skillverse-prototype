/**
 * [Nghiệp vụ] Tab xác thực skill của mentor trong MentorDashboard.
 * 
 * Flow Mới (Gom lô / Batch Verification):
 * 1. Mentor có thể chọn nhiều skill cùng lúc (Multi-select) để tạo thành 1 Lô (Batch).
 * 2. Cung cấp 1 bộ minh chứng chung (Evidence) cho toàn bộ lô.
 * 3. Giao diện Neon Tech với Glow Tags cho các kỹ năng đã chọn.
 * 4. Xem lịch sử yêu cầu theo từng lô (Batch), mở rộng ra để xem chi tiết từng kỹ năng con.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Lightbulb,
  Search,
  Loader2,
  X,
  Package,
  Star,
} from 'lucide-react';
import {
  submitBatchVerification,
  getMyBatchVerifications,
  getMyVerifiedSkills,
  revokeVerifiedSkill,
  CreateBatchVerificationRequest,
  BatchVerificationResponse,
  EvidenceItem,
  uploadEvidence,
  uploadEvidenceFile,
} from '../../services/mentorVerificationService';
import { skillService } from '../../services/skillService';
import { skillSuggestionService } from '../../services/skillSuggestionService';
import { getVerifiedSkills as getPortfolioVerifiedSkills, updateVerifiedSkillFeaturedOrder } from '../../services/nodeMentoringService';
import type { UserVerifiedSkillDTO } from '../../types/NodeMentoring';
import { SkillDto } from '../../data/skillDTOs';
import './MentorVerificationTab.css';

interface LocalEvidenceItem extends EvidenceItem {
  workplace?: string;
  position?: string;
  detailDescription?: string;
}

/**
 * [Component] MultiSkillAutocomplete
 * Cho phép tìm kiếm và chọn nhiều skill (Neon Tech UI)
 */
function MultiSkillAutocomplete({ 
  selectedSkills,
  onAddSkill,
  onRemoveSkill,
  placeholder,
  disabled 
}: { 
  selectedSkills: SkillDto[];
  onAddSkill: (skill: SkillDto) => void;
  onRemoveSkill: (skillId: number) => void;
  placeholder: string,
  disabled?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SkillDto[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (val.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const data = await skillService.suggestByPrefix(val);
        // Filter out already selected skills
        const filtered = data.filter(s => !selectedSkills.some(sel => sel.id === s.id));
        setResults(filtered);
        setIsOpen(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms
  };

  const handleSelect = (s: SkillDto) => {
    onAddSkill(s);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="mvt-multi-autocomplete">
      <div className="mvt-selected-tags">
        {selectedSkills.map(s => (
          <div key={s.id} className="mvt-glow-tag">
            <span>{s.name}</span>
            <button type="button" onClick={() => onRemoveSkill(s.id)}><X size={14} /></button>
          </div>
        ))}
      </div>
      <div ref={wrapperRef} className="mvt-autocomplete" style={{ marginTop: selectedSkills.length > 0 ? '0.75rem' : '0' }}>
        <div className={`mvt-autocomplete__input-wrapper ${disabled ? 'disabled' : ''}`}>
          <Search className="mvt-autocomplete__icon" size={18} />
          <input
            type="text"
            className="mvt-autocomplete__input"
            placeholder={selectedSkills.length > 0 ? "Thêm kỹ năng khác..." : placeholder}
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            disabled={disabled}
          />
          {loading && <Loader2 className="mvt-autocomplete__spinner animate-spin" size={18} />}
        </div>

        {isOpen && (
          <div className="mvt-autocomplete__dropdown">
            {results.length === 0 ? (
              <div className="mvt-autocomplete__empty">Không tìm thấy kỹ năng phù hợp</div>
            ) : (
              results.map(s => (
                <div
                  key={s.id}
                  className="mvt-autocomplete__option"
                  onClick={() => handleSelect(s)}
                >
                  <div className="mvt-autocomplete__option-name">{s.name}</div>
                  <div className="mvt-autocomplete__option-meta">ID: {s.id}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const MentorVerificationTab: React.FC = () => {
  const [batchVerifications, setBatchVerifications] = useState<BatchVerificationResponse[]>([]);
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);
  const [featuredSkillNames, setFeaturedSkillNames] = useState<string[]>([]);
  const [systemSkills, setSystemSkills] = useState<SkillDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Verification Form State
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [revokingSkill, setRevokingSkill] = useState<string | null>(null);
  const [revokeCandidate, setRevokeCandidate] = useState<string | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<SkillDto[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [evidences, setEvidences] = useState<LocalEvidenceItem[]>([]);

  // Suggest Form State
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestReason, setSuggestReason] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqs, mentorSkills, portfolioSkills, activeSkills] = await Promise.all([
        getMyBatchVerifications(),
        getMyVerifiedSkills(),
        getPortfolioVerifiedSkills().catch(() => []),
        skillService.getActiveSkills(),
      ]);
      setBatchVerifications(reqs);
      const orderedSkills = portfolioSkills.length > 0
        ? portfolioSkills.map(skill => skill.skillName)
        : mentorSkills;
      setVerifiedSkills(orderedSkills);
      setFeaturedSkillNames(resolveFeaturedSkillNames(portfolioSkills));
      setSystemSkills(activeSkills);
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
    setSelectedSkills([]);
    setGithubUrl('');
    setCvUrl('');
    setPortfolioUrl('');
    setAdditionalNotes('');
    setEvidences([]);
    setError(null);
  };

  const resetSuggestForm = () => {
    setSuggestName('');
    setSuggestReason('');
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

  const isSkillUnavailable = (skill: SkillDto) => {
    return selectedSkills.some(selected => selected.id === skill.id)
      || verifiedSkills.some(verified => verified.toUpperCase() === skill.name.toUpperCase());
  };

  const addSystemSkill = (skill: SkillDto) => {
    if (isSkillUnavailable(skill)) return;
    setSelectedSkills([...selectedSkills, skill]);
  };

  const confirmRevokeVerifiedSkill = async () => {
    if (!revokeCandidate) return;
    const skill = revokeCandidate;
    try {
      setRevokingSkill(skill);
      setError(null);
      setSuccessMsg(null);
      await revokeVerifiedSkill(skill);
      setSuccessMsg(`Đã gỡ kỹ năng "${skill}" khỏi hồ sơ xác thực.`);
      setRevokeCandidate(null);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || message);
    } finally {
      setRevokingSkill(null);
    }
  };

  const resolveFeaturedSkillNames = (skills: UserVerifiedSkillDTO[]) => {
    return skills
      .filter(skill => typeof skill.featuredOrder === 'number')
      .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
      .map(skill => skill.skillName)
      .slice(0, 5);
  };

  const toggleFeaturedSkill = async (skill: string) => {
    const isFeatured = featuredSkillNames.includes(skill);
    if (!isFeatured && featuredSkillNames.length >= 5) {
      setError('Chỉ được chọn tối đa 5 kỹ năng nổi bật.');
      return;
    }

    const nextFeatured = isFeatured
      ? featuredSkillNames.filter(item => item !== skill)
      : [...featuredSkillNames, skill];

    setFeaturedSkillNames(nextFeatured);
    try {
      const updated = await updateVerifiedSkillFeaturedOrder(nextFeatured);
      setVerifiedSkills(updated.map(item => item.skillName));
      setFeaturedSkillNames(resolveFeaturedSkillNames(updated));
      setSuccessMsg('Đã cập nhật 5 kỹ năng nổi bật.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể cập nhật kỹ năng nổi bật.');
      loadData();
    }
  };

  const handleUploadImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadEvidence(file);
      updateEvidence(index, 'evidenceUrl', url);
    } catch (err: unknown) {
      console.error(err);
      setError('Upload ảnh thất bại. Vui lòng thử lại.');
    }
  };

  const handleUploadCvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadEvidenceFile(file);
      setCvUrl(url);
    } catch (err: unknown) {
      console.error(err);
      setError('Upload CV thất bại. Vui lòng thử lại hoặc dán link CV.');
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

    if (selectedSkills.length === 0) {
      setError('Vui lòng chọn ít nhất 1 kỹ năng để xác thực.');
      return;
    }

    if (evidences.length === 0 && !githubUrl.trim() && !cvUrl.trim() && !portfolioUrl.trim()) {
      setError('Vui lòng cung cấp ít nhất 1 bằng chứng (chứng chỉ, GitHub, kinh nghiệm) cho danh sách kỹ năng này.');
      return;
    }

    const allEvidences: LocalEvidenceItem[] = [...evidences];
    if (githubUrl.trim()) {
      allEvidences.push({
        evidenceType: 'GITHUB',
        evidenceUrl: githubUrl.trim(),
        description: 'GitHub profile/repo',
      });
    }
    if (cvUrl.trim()) {
      allEvidences.push({
        evidenceType: 'CV',
        evidenceUrl: cvUrl.trim(),
        description: 'CV / Resume',
      });
    }
    if (portfolioUrl.trim()) {
      allEvidences.push({
        evidenceType: 'PORTFOLIO_LINK',
        evidenceUrl: portfolioUrl.trim(),
        description: 'Portfolio link',
      });
    }

    const request: CreateBatchVerificationRequest = {
      skillNames: selectedSkills.map(s => s.name),
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
      await submitBatchVerification(request);
      setSuccessMsg(`Yêu cầu xác thực Danh Sách (${selectedSkills.length} kỹ năng) đã được gửi thành công!`);
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

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!suggestName.trim()) {
      setError('Vui lòng nhập tên Skill muốn gợi ý.');
      return;
    }

    try {
      setSuggesting(true);
      await skillSuggestionService.suggestSkill({
        suggestedName: suggestName.trim(),
        reason: suggestReason.trim() || undefined
      });
      setSuccessMsg(`Gợi ý skill "${suggestName}" đã được gửi tới Admin thành công!`);
      resetSuggestForm();
      setShowSuggestForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || message);
    } finally {
      setSuggesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return <span className="mvt-badge mvt-badge--approved"><CheckCircle size={14} /> Hoàn tất</span>;
      case 'PARTIAL_APPROVED':
        return <span className="mvt-badge mvt-badge--partial"><CheckCircle size={14} /> Duyệt một phần</span>;
      case 'PENDING':
        return <span className="mvt-badge mvt-badge--pending"><Clock size={14} /> Đang chờ</span>;
      case 'REJECTED':
        return <span className="mvt-badge mvt-badge--rejected"><XCircle size={14} /> Từ chối</span>;
      case 'REVOKED':
        return <span className="mvt-badge mvt-badge--rejected"><XCircle size={14} /> Đã gỡ</span>;
      default:
        return null;
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return <FileText size={16} />;
      case 'GITHUB': return <Github size={16} />;
      case 'CV': return <FileText size={16} />;
      case 'PORTFOLIO_LINK': return <ExternalLink size={16} />;
      case 'WORK_EXPERIENCE': return <Briefcase size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getEvidenceLabel = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return 'Chứng chỉ';
      case 'GITHUB': return 'GitHub';
      case 'CV': return 'CV';
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
      {revokeCandidate && (
        <div className="mvt-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="mvt-revoke-title">
          <div className="mvt-confirm-modal">
            <div className="mvt-confirm-modal__icon">
              <AlertCircle size={24} />
            </div>
            <div className="mvt-confirm-modal__body">
              <h3 id="mvt-revoke-title">Gỡ kỹ năng đã được công nhận?</h3>
              <p>
                Kỹ năng <strong>{revokeCandidate}</strong> sẽ không còn hiển thị trên hồ sơ mentor và không còn được tính là kỹ năng đã xác thực.
              </p>
              <p className="mvt-confirm-modal__hint">
                Lịch sử xét duyệt vẫn được giữ lại để đối soát. Nếu muốn công nhận lại, bạn cần gửi yêu cầu xác thực mới.
              </p>
            </div>
            <div className="mvt-confirm-modal__actions">
              <button
                type="button"
                className="mvt-btn mvt-btn--secondary"
                onClick={() => setRevokeCandidate(null)}
                disabled={Boolean(revokingSkill)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="mvt-btn mvt-btn--danger"
                onClick={confirmRevokeVerifiedSkill}
                disabled={Boolean(revokingSkill)}
              >
                <XCircle size={16} />
                {revokingSkill ? 'Đang gỡ...' : 'Xác nhận gỡ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mvt-header">
        <div className="mvt-header__info">
          <h2 className="mvt-header__title">
            <Shield size={24} /> Xác thực Kỹ Năng
          </h2>
          <p className="mvt-header__subtitle">
            Gửi yêu cầu xác thực theo Lô (Batch) để nhanh chóng hoàn thiện hồ sơ.
          </p>
        </div>
        <button
          className="mvt-btn mvt-btn--primary"
          onClick={() => { setShowForm(!showForm); setShowSuggestForm(false); setError(null); setSuccessMsg(null); }}
        >
          <Plus size={16} />
          {showForm ? 'Đóng form' : 'Xác thực kỹ năng mới'}
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
          <h3 className="mvt-section-title"><Award size={18} /> Kỹ năng đã được công nhận</h3>
          <p className="mvt-featured-hint">
            Bấm ngôi sao để chọn nhanh tối đa 5 kỹ năng nổi bật sẽ hiện trước trên trang mentorship.
            <span>{featuredSkillNames.length}/5 đã chọn</span>
          </p>
          <div className="mvt-verified-skills">
            {verifiedSkills.map(skill => (
              <span
                key={skill}
                className={`mvt-skill-badge mvt-skill-badge--verified ${featuredSkillNames.includes(skill) ? 'mvt-skill-badge--featured' : ''}`}
              >
                <CheckCircle size={14} /> {skill}
                <button
                  type="button"
                  className="mvt-skill-badge__featured"
                  onClick={() => toggleFeaturedSkill(skill)}
                  title={featuredSkillNames.includes(skill) ? 'Bỏ khỏi 5 kỹ năng nổi bật' : 'Chọn làm kỹ năng nổi bật'}
                >
                  <Star size={13} fill={featuredSkillNames.includes(skill) ? 'currentColor' : 'none'} />
                  {featuredSkillNames.includes(skill) && (
                    <span>{featuredSkillNames.indexOf(skill) + 1}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="mvt-skill-badge__remove"
                  onClick={() => setRevokeCandidate(skill)}
                  disabled={revokingSkill === skill}
                  title="Gỡ kỹ năng khỏi hồ sơ xác thực"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggest Form */}
      {showSuggestForm && (
        <form className="mvt-form mvt-neon-form" onSubmit={handleSuggestSubmit}>
          <h3 className="mvt-form__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-cyan)' }}>
            <Lightbulb size={20} /> Gợi ý Kỹ năng mới
          </h3>
          <p className="mvt-form__hint">Kỹ năng bạn muốn xác thực chưa có trong hệ thống? Hãy gửi gợi ý để Admin xem xét thêm vào.</p>

          {error && (
            <div className="mvt-alert mvt-alert--error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="mvt-form__group">
            <label className="mvt-form__label">Tên Kỹ năng đề xuất *</label>
            <input
              type="text"
              className="mvt-form__input"
              value={suggestName}
              onChange={e => setSuggestName(e.target.value)}
              placeholder="Ví dụ: React Native, Docker, GraphQL..."
              maxLength={100}
              required
            />
          </div>

          <div className="mvt-form__group">
            <label className="mvt-form__label">Lý do / Mô tả (Tùy chọn)</label>
            <textarea
              className="mvt-form__textarea"
              value={suggestReason}
              onChange={e => setSuggestReason(e.target.value)}
              placeholder="Giải thích ngắn gọn tại sao hệ thống nên có skill này..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="mvt-form__actions">
            <button type="button" className="mvt-btn mvt-btn--secondary" onClick={() => { setShowSuggestForm(false); resetSuggestForm(); }}>
              Hủy
            </button>
            <button type="submit" className="mvt-btn mvt-btn--primary" disabled={suggesting}>
              <Send size={16} />
              {suggesting ? 'Đang gửi...' : 'Gửi gợi ý'}
            </button>
          </div>
        </form>
      )}

      {/* Submit Batch Verification Form */}
      {showForm && !showSuggestForm && (
        <form className="mvt-form mvt-neon-form" onSubmit={handleSubmit}>
          <div className="mvt-form-header-neon">
            <h3 className="mvt-form__title" style={{ color: 'var(--neon-cyan)' }}>Gửi yêu cầu xác thực Lô</h3>
            <p className="mvt-form__hint">Gom nhiều kỹ năng lại và chỉ cần đính kèm 1 bộ hồ sơ duy nhất!</p>
          </div>

          {error && (
            <div className="mvt-alert mvt-alert--error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="mvt-form__group">
            <label className="mvt-form__label">Chọn Kỹ năng *</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
               <div style={{ flex: 1, minWidth: '300px' }}>
                  <MultiSkillAutocomplete
                    selectedSkills={selectedSkills}
                    onAddSkill={(s) => setSelectedSkills([...selectedSkills, s])}
                    onRemoveSkill={(id) => setSelectedSkills(selectedSkills.filter(s => s.id !== id))}
                    placeholder="Gõ tên kỹ năng để tìm (ví dụ: Java, React...)"
                  />
                  <div className="mvt-system-skills">
                    {systemSkills
                      .filter(skill => !isSkillUnavailable(skill))
                      .slice(0, 48)
                      .map(skill => (
                        <button
                          key={skill.id}
                          type="button"
                          className="mvt-system-skill-chip"
                          onClick={() => addSystemSkill(skill)}
                        >
                          <Plus size={12} /> {skill.name}
                        </button>
                      ))}
                    {systemSkills.filter(skill => !isSkillUnavailable(skill)).length === 0 && (
                      <span className="mvt-system-skills__empty">Không còn kỹ năng khả dụng để chọn.</span>
                    )}
                  </div>
               </div>
               <button 
                  type="button" 
                  className="mvt-btn"
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'white', height: '42px', marginTop: selectedSkills.length > 0 ? '0.75rem' : '0' }}
                  onClick={() => { setShowSuggestForm(true); setShowForm(false); setError(null); }}
               >
                 <Lightbulb size={16} style={{ marginRight: '0.25rem', color: '#facc15' }} /> Không tìm thấy?
               </button>
            </div>
          </div>

          <div className="mvt-form-section-divider">
            <span>Bộ Minh Chứng Chung</span>
          </div>

          <div className="mvt-form__row">
            <div className="mvt-form__group">
              <label className="mvt-form__label">GitHub URL</label>
              <input
                type="url"
                className="mvt-form__input"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="mvt-form__group">
              <label className="mvt-form__label">CV / Resume</label>
              <div className="mvt-file-upload-wrapper">
                <input
                  type="url"
                  className="mvt-form__input"
                  value={cvUrl}
                  onChange={e => setCvUrl(e.target.value)}
                  placeholder="https://drive.google.com/... hoặc upload PDF/DOCX"
                  style={{ flex: 1 }}
                />
                <label className="mvt-file-upload-btn">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="mvt-file-input"
                    onChange={handleUploadCvFile}
                  />
                  Upload CV
                </label>
              </div>
            </div>
          </div>

          <div className="mvt-form__row">
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
            <div className="mvt-form__group">
              <label className="mvt-form__label">Hồ sơ khác</label>
              <p className="mvt-form__hint" style={{ margin: 0 }}>
                Có thể thêm chứng chỉ, dự án, GitHub repo hoặc kinh nghiệm ở phần bên dưới.
              </p>
            </div>
          </div>

          <div className="mvt-form__group">
            <label className="mvt-form__label">Mô tả tổng quan</label>
            <textarea
              className="mvt-form__textarea"
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="Giải trình ngắn gọn kinh nghiệm của bạn bao quát các kỹ năng đã chọn..."
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Additional Evidence */}
          <div className="mvt-form__group">
            <label className="mvt-form__label">Chứng chỉ & Tài liệu khác</label>
            {evidences.map((ev, idx) => (
              <div key={idx} className="mvt-evidence-item neon-border">
                <div className="mvt-evidence-item__header">
                  <div className="mvt-evidence-type-selector">
                    {getEvidenceIcon(ev.evidenceType)}
                    <select
                      value={ev.evidenceType}
                      onChange={(e) =>
                        updateEvidence(
                          idx,
                          "evidenceType",
                          e.target.value as EvidenceItem["evidenceType"],
                        )
                      }
                      className="mvt-evidence-select"
                    >
                      <option value="CERTIFICATE">Chứng chỉ / Bằng cấp</option>
                      <option value="WORK_EXPERIENCE">Kinh nghiệm công tác</option>
                      <option value="PORTFOLIO_LINK">Dự án / Sản phẩm</option>
                      <option value="GITHUB">GitHub / Mã nguồn</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="mvt-btn--icon mvt-btn--delete"
                    onClick={() => removeEvidence(idx)}
                    title="Xóa minh chứng này"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
                {ev.evidenceType !== "WORK_EXPERIENCE" && (
                  <>
                    <div className="mvt-file-upload-wrapper">
                      <input
                        type="url"
                        className="mvt-form__input"
                        value={ev.evidenceUrl}
                        onChange={(e) =>
                          updateEvidence(idx, "evidenceUrl", e.target.value)
                        }
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
                        <img
                          src={ev.evidenceUrl}
                          alt="Preview"
                          className="mvt-image-preview"
                        />
                      </div>
                    )}
                    <textarea
                      className="mvt-form__textarea mvt-form__textarea--sm"
                      value={ev.description}
                      onChange={(e) =>
                        updateEvidence(idx, "description", e.target.value)
                      }
                      placeholder="Mô tả minh chứng..."
                      rows={2}
                    />
                  </>
                )}

                {ev.evidenceType === "WORK_EXPERIENCE" && (
                  <div className="mvt-work-experience-inputs">
                    <input
                      type="text"
                      className="mvt-form__input mvt-form__input--sm"
                      value={ev.workplace || ""}
                      onChange={(e) =>
                        updateEvidence(idx, "workplace", e.target.value)
                      }
                      placeholder="Nơi làm việc, tên trường học, công ty..."
                    />
                    <input
                      type="text"
                      className="mvt-form__input mvt-form__input--sm"
                      value={ev.position || ""}
                      onChange={(e) =>
                        updateEvidence(idx, "position", e.target.value)
                      }
                      placeholder="Chức vụ, vị trí, hoặc thể loại bằng cấp..."
                    />
                    <textarea
                      className="mvt-form__textarea mvt-form__textarea--sm"
                      value={ev.detailDescription || ""}
                      onChange={(e) =>
                        updateEvidence(
                          idx,
                          "detailDescription",
                          e.target.value,
                        )
                      }
                      placeholder="Mô tả chi tiết kỹ năng bạn áp dụng, dự án cụ thể ở đây..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="mvt-evidence-actions">
              <button
                type="button"
                className="mvt-btn mvt-btn--primary mvt-btn--sm"
                onClick={() => addEvidence("CERTIFICATE")}
              >
                <Plus size={14} /> Thêm bằng chứng
              </button>
            </div>
          </div>

          <div className="mvt-form__actions">
            <button type="button" className="mvt-btn mvt-btn--secondary" onClick={() => { setShowForm(false); resetForm(); }}>
              Hủy bỏ
            </button>
            <button type="submit" className="mvt-btn mvt-btn--glow" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Xác Thực'}
            </button>
          </div>
        </form>
      )}

      {/* Verification Requests List */}
      <div className="mvt-requests">
        <h3 className="mvt-section-title">Lịch sử Danh Sách Xác Thực</h3>
        {batchVerifications.length === 0 ? (
          <div className="mvt-empty">
            <Package size={48} />
            <p>Chưa có danh sách xác thực nào.</p>
            <p className="mvt-empty__hint">Gom nhiều kỹ năng và xác thực!</p>
          </div>
        ) : (
          <div className="mvt-request-list">
            {batchVerifications.map(batch => (
              <div key={batch.id} className={`mvt-request-card mvt-request-card--${batch.status.toLowerCase()}`}>
                <div className="mvt-request-card__header"
                  onClick={() => setExpandedId(expandedId === batch.id ? null : batch.id)}>
                  <div className="mvt-request-card__info">
                    <span className="mvt-request-card__skill">
                      Danh Sách Xác Thực #{batch.id} <span className="mvt-batch-count">({batch.skills?.length || 0} kỹ năng)</span>
                    </span>
                    {getStatusBadge(batch.status)}
                  </div>
                  <div className="mvt-request-card__meta">
                    <span className="mvt-request-card__date">
                      {new Date(batch.submittedAt).toLocaleDateString('vi-VN')}
                    </span>
                    {expandedId === batch.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedId === batch.id && (
                  <div className="mvt-request-card__details">
                    
                    {/* Skills Breakdown */}
                    <div className="mvt-batch-skills-list">
                      <strong>Danh sách kỹ năng trong lô:</strong>
                      <div className="mvt-skills-grid">
                        {batch.skills?.map(sk => (
                           <div key={sk.id} className={`mvt-skill-sub-item status-${sk.status.toLowerCase()}`}>
                              <span className="mvt-skill-name">{sk.skillName}</span>
                              {sk.status === 'APPROVED' && <CheckCircle size={14} className="text-green-500" />}
                              {sk.status === 'REJECTED' && <XCircle size={14} className="text-red-500" />}
                              {sk.status === 'PENDING' && <Clock size={14} className="text-yellow-500" />}
                           </div>
                        ))}
                      </div>
                    </div>

                    <div className="mvt-form-section-divider" style={{ margin: '1rem 0' }}></div>

                    {/* Shared Evidences */}
                    {batch.githubUrl && (
                      <div className="mvt-detail-row">
                        <Github size={14} />
                        <a href={batch.githubUrl} target="_blank" rel="noopener noreferrer">{batch.githubUrl}</a>
                      </div>
                    )}
                    {batch.portfolioUrl && (
                      <div className="mvt-detail-row">
                        <ExternalLink size={14} />
                        <a href={batch.portfolioUrl} target="_blank" rel="noopener noreferrer">{batch.portfolioUrl}</a>
                      </div>
                    )}
                    {batch.additionalNotes && (
                      <div className="mvt-detail-row">
                        <FileText size={14} />
                        <span>{batch.additionalNotes}</span>
                      </div>
                    )}
                    {batch.evidences && batch.evidences.length > 0 && (
                      <div className="mvt-evidences">
                        <strong>Bằng chứng đính kèm:</strong>
                        {batch.evidences.map(ev => (
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
                    {batch.generalReviewNote && (
                      <div className="mvt-review-note">
                        <strong>Ghi chú chung từ admin:</strong>
                        <p>{batch.generalReviewNote}</p>
                        {batch.reviewedByName && (
                          <span className="mvt-review-note__by">— {batch.reviewedByName}</span>
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
