/**
 * RoadmapMentoringPanel — V3 Phase 2 ROADMAP_MENTORING UI
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * "Aurora Violet" design — distinct from Neon Tech Cyan Blue.
 *
 * Features:
 * 1. Jitsi final meeting link creation
 * 2. Mentor verdict form (PASS / FAIL + evidence report)
 * 3. Verification history timeline
 * 4. Verified skills portfolio grid
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Video,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  History,
  Award,
  ExternalLink,
  Timer,
  User,
  Zap,
  Check,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type {
  VerificationEvidenceReportResponse,
  UserVerifiedSkillDTO,
  SubmitEvidenceReportRequest,
  GateDecision,
} from '../../types/NodeMentoring';
import {
  createFinalMeetingLink,
  submitEvidenceReportAndVerdict,
  getVerificationHistory,
  getVerifiedSkills,
} from '../../services/nodeMentoringService';
import type { BookingResponse } from '../../services/bookingService';
import './RoadmapMentoringPanel.css';

// ─── Types ────────────────────────────────────────────────
interface RoadmapMentoringPanelProps {
  journeyId: number;
  booking: BookingResponse;
  isMentor: boolean;
  nodeIds?: string[]; // all node IDs of this roadmap for weak-node selection
  onRefresh?: () => void;
}

type TabId = 'meeting' | 'history' | 'skills';

// ─── Component ────────────────────────────────────────────
const RoadmapMentoringPanel: React.FC<RoadmapMentoringPanelProps> = ({
  journeyId,
  booking,
  isMentor,
  nodeIds = [],
  onRefresh,
}) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('meeting');
  const [loading, setLoading] = useState(false);

  // Meeting tab
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink || '');
  const [creatingLink, setCreatingLink] = useState(false);

  // Verdict form
  const [gateDecision, setGateDecision] = useState<GateDecision | ''>('');
  const [summaryReport, setSummaryReport] = useState('');
  const [failReason, setFailReason] = useState('');
  const [weakNodeIds, setWeakNodeIds] = useState<string[]>([]);
  const [meetingDuration, setMeetingDuration] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  // History tab
  const [history, setHistory] = useState<VerificationEvidenceReportResponse[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Skills tab
  const [skills, setSkills] = useState<UserVerifiedSkillDTO[]>([]);
  const [skillsLoaded, setSkillsLoaded] = useState(false);

  // Derived state
  const attempts = booking.verificationAttempts ?? 0;
  const maxAttempts = 3;
  const isInCooldown = booking.nextVerifyAllowedAt
    ? new Date(booking.nextVerifyAllowedAt) > new Date()
    : false;
  const cooldownDate = booking.nextVerifyAllowedAt
    ? new Date(booking.nextVerifyAllowedAt)
    : null;
  const isActive = booking.status === 'MENTORING_ACTIVE';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED';

  // ─── Data loaders ───────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;
    try {
      setLoading(true);
      const data = await getVerificationHistory(journeyId);
      setHistory(data);
      setHistoryLoaded(true);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể tải lịch sử');
    } finally {
      setLoading(false);
    }
  }, [journeyId, historyLoaded, showError]);

  const loadSkills = useCallback(async () => {
    if (skillsLoaded) return;
    try {
      setLoading(true);
      const data = await getVerifiedSkills();
      setSkills(data);
      setSkillsLoaded(true);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể tải skills');
    } finally {
      setLoading(false);
    }
  }, [skillsLoaded, showError]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'skills') loadSkills();
  }, [activeTab, loadHistory, loadSkills]);

  // ─── Handlers ───────────────────────────────────────────
  const handleCreateMeeting = async () => {
    try {
      setCreatingLink(true);
      const link = await createFinalMeetingLink(journeyId);
      setMeetingLink(link);
      showSuccess('Đã tạo phòng họp', 'Link Jitsi đã sẵn sàng');
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể tạo link');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleSubmitVerdict = async () => {
    if (!gateDecision) {
      showError('Thiếu thông tin', 'Vui lòng chọn PASS hoặc FAIL');
      return;
    }
    if (!summaryReport.trim()) {
      showError('Thiếu thông tin', 'Vui lòng nhập báo cáo tổng kết');
      return;
    }
    if (gateDecision === 'FAIL' && weakNodeIds.length === 0) {
      showError('Thiếu thông tin', 'Vui lòng chọn ít nhất 1 node yếu khi FAIL');
      return;
    }
    if (gateDecision === 'FAIL' && !failReason.trim()) {
      showError('Thiếu thông tin', 'Vui lòng nhập lý do FAIL');
      return;
    }

    try {
      setSubmitting(true);
      const request: SubmitEvidenceReportRequest = {
        summaryReport: summaryReport.trim(),
        gateDecision: gateDecision as GateDecision,
        meetingDurationMinutes: meetingDuration,
        weakNodeIds: gateDecision === 'FAIL' ? weakNodeIds : undefined,
        failReason: gateDecision === 'FAIL' ? failReason.trim() : undefined,
      };
      await submitEvidenceReportAndVerdict(journeyId, request);
      showSuccess(
        gateDecision === 'PASS' ? '🎉 Xác thực thành công!' : '❌ Đã ghi nhận FAIL',
        gateDecision === 'PASS'
          ? 'Skill đã được thêm vào portfolio học viên'
          : `Lần ${attempts + 1}/${maxAttempts}. Học viên cần học lại.`,
      );
      // Reset form
      setGateDecision('');
      setSummaryReport('');
      setFailReason('');
      setWeakNodeIds([]);
      setHistoryLoaded(false);
      onRefresh?.();
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể gửi verdict');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWeakNode = (nodeId: string) => {
    setWeakNodeIds((prev) =>
      prev.includes(nodeId) ? prev.filter((n) => n !== nodeId) : [...prev, nodeId],
    );
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="rmp-container">
      {/* Header */}
      <div className="rmp-header">
        <div className="rmp-header-left">
          <div className="rmp-header-icon">
            <Shield size={24} />
          </div>
          <div className="rmp-header-text">
            <h2>Đồng hành Journey Mentoring</h2>
            <p>Journey #{journeyId} — Verify & Certify</p>
          </div>
        </div>
        <div className="rmp-header-badges">
          {isActive && (
            <span className="rmp-badge rmp-badge-active">
              <Zap size={12} /> Đang hoạt động
            </span>
          )}
          {isCompleted && (
            <span className="rmp-badge rmp-badge-completed">
              <CheckCircle size={12} /> Hoàn thành
            </span>
          )}
          {isCancelled && (
            <span className="rmp-badge rmp-badge-cancelled">
              <XCircle size={12} /> Đã hủy
            </span>
          )}
          {attempts > 0 && (
            <span className="rmp-badge rmp-badge-attempt">
              Lần {attempts}/{maxAttempts}
            </span>
          )}
        </div>
      </div>

      {/* Cooldown Banner */}
      {isInCooldown && cooldownDate && (
        <div className="rmp-cooldown-banner">
          <Timer size={20} />
          <div>
            <strong>Đang trong thời gian chờ.</strong> Bạn có thể verify lại sau{' '}
            <strong>{formatDate(cooldownDate.toISOString())}</strong>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="rmp-tabs">
        <button
          className={`rmp-tab ${activeTab === 'meeting' ? 'active' : ''}`}
          onClick={() => setActiveTab('meeting')}
        >
          <Video size={16} /> Meeting & Verdict
        </button>
        <button
          className={`rmp-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> Lịch sử
          {history.length > 0 && <span className="rmp-tab-count">{history.length}</span>}
        </button>
        <button
          className={`rmp-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Award size={16} /> Verified Skills
          {skills.length > 0 && <span className="rmp-tab-count">{skills.length}</span>}
        </button>
      </div>

      {/* ═══ Tab: Meeting & Verdict ═══ */}
      {activeTab === 'meeting' && (
        <>
          {/* Jitsi Meeting Card */}
          <div className="rmp-card">
            <div className="rmp-card-header">
              <h3><Video size={18} /> Phòng họp xác thực (Jitsi)</h3>
            </div>
            <div className="rmp-meeting-section">
              {meetingLink ? (
                <>
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rmp-meeting-link"
                  >
                    <Video size={20} /> Tham gia phòng họp
                    <ExternalLink size={14} />
                  </a>
                  <div className="rmp-meeting-url">{meetingLink}</div>
                </>
              ) : (
                <button
                  className="rmp-meeting-link"
                  onClick={handleCreateMeeting}
                  disabled={creatingLink || isInCooldown || !isActive}
                >
                  {creatingLink ? (
                    <>
                      <div className="rmp-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Video size={20} /> Tạo phòng họp xác thực
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mentor Verdict Form */}
          {isMentor && isActive && !isInCooldown && (
            <div className="rmp-card">
              <div className="rmp-card-header">
                <h3><Shield size={18} /> Gửi kết quả xác thực</h3>
              </div>
              <div className="rmp-verdict-form">
                {/* Decision */}
                <div className="rmp-form-group">
                  <label>Quyết định <span className="required">*</span></label>
                  <div className="rmp-decision-chips">
                    <button
                      type="button"
                      className={`rmp-decision-chip pass ${gateDecision === 'PASS' ? 'selected' : ''}`}
                      onClick={() => setGateDecision('PASS')}
                    >
                      <CheckCircle size={20} /> PASS — Đạt
                    </button>
                    <button
                      type="button"
                      className={`rmp-decision-chip fail ${gateDecision === 'FAIL' ? 'selected' : ''}`}
                      onClick={() => setGateDecision('FAIL')}
                    >
                      <XCircle size={20} /> FAIL — Chưa đạt
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="rmp-form-group">
                  <label>Báo cáo tổng kết <span className="required">*</span></label>
                  <textarea
                    className="rmp-textarea"
                    placeholder="Nhập tổng kết buổi verify (điểm mạnh, điểm yếu, nhận xét chung)..."
                    value={summaryReport}
                    onChange={(e) => setSummaryReport(e.target.value)}
                  />
                </div>

                {/* Meeting Duration */}
                <div className="rmp-form-group">
                  <label>Thời lượng buổi meeting (phút)</label>
                  <input
                    type="number"
                    className="rmp-input"
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(parseInt(e.target.value) || 0)}
                    min={1}
                    max={300}
                  />
                </div>

                {/* FAIL-specific: Weak Nodes */}
                {gateDecision === 'FAIL' && nodeIds.length > 0 && (
                  <div className="rmp-form-group">
                    <label>
                      Chọn node cần học lại <span className="required">*</span>
                      <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 8, fontSize: 11 }}>
                        ({weakNodeIds.length} đã chọn)
                      </span>
                    </label>
                    <div className="rmp-node-selector">
                      {nodeIds.map((nodeId) => (
                        <button
                          key={nodeId}
                          type="button"
                          className={`rmp-node-chip ${weakNodeIds.includes(nodeId) ? 'selected' : ''}`}
                          onClick={() => toggleWeakNode(nodeId)}
                        >
                          <span className="rmp-node-checkbox">
                            {weakNodeIds.includes(nodeId) && <Check size={10} />}
                          </span>
                          {nodeId}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAIL reason */}
                {gateDecision === 'FAIL' && (
                  <div className="rmp-form-group">
                    <label>Lý do FAIL <span className="required">*</span></label>
                    <textarea
                      className="rmp-textarea"
                      placeholder="Giải thích lý do chưa đạt..."
                      value={failReason}
                      onChange={(e) => setFailReason(e.target.value)}
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  className={`rmp-submit-btn ${gateDecision === 'PASS' ? 'pass-btn' : gateDecision === 'FAIL' ? 'fail-btn' : 'pass-btn'}`}
                  disabled={submitting || !gateDecision || !summaryReport.trim()}
                  onClick={handleSubmitVerdict}
                >
                  {submitting ? (
                    <>
                      <div className="rmp-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {gateDecision === 'PASS' ? 'Xác nhận PASS & Cấp chứng chỉ' : gateDecision === 'FAIL' ? 'Xác nhận FAIL' : 'Gửi kết quả'}
                    </>
                  )}
                </button>

                {/* Attempt warning */}
                {attempts >= 2 && gateDecision === 'FAIL' && (
                  <div className="rmp-cooldown-banner" style={{ margin: 0 }}>
                    <AlertTriangle size={20} />
                    <div>
                      <strong>Cảnh báo:</strong> Đây là lần FAIL thứ {attempts + 1}/{maxAttempts}.
                      Nếu FAIL, booking sẽ <strong>tự động hủy</strong> và hoàn tiền cho học viên.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completed/Cancelled info */}
          {(isCompleted || isCancelled) && (
            <div className="rmp-card">
              <div className="rmp-card-body">
                <div className="rmp-empty">
                  {isCompleted ? (
                    <>
                      <CheckCircle size={40} />
                      <p>🎉 Journey đã được xác thực thành công! Skill đã được thêm vào portfolio.</p>
                    </>
                  ) : (
                    <>
                      <XCircle size={40} />
                      <p>Booking đã bị hủy sau {maxAttempts} lần fail. Tiền đã được hoàn lại.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ Tab: History ═══ */}
      {activeTab === 'history' && (
        <div className="rmp-card">
          <div className="rmp-card-header">
            <h3><History size={18} /> Lịch sử xác thực</h3>
          </div>
          {loading ? (
            <div className="rmp-loading">
              <div className="rmp-spinner" />
              Đang tải...
            </div>
          ) : history.length === 0 ? (
            <div className="rmp-empty">
              <Clock size={40} />
              <p>Chưa có lần xác thực nào.</p>
            </div>
          ) : (
            <div className="rmp-timeline">
              {history.map((item) => (
                <div key={item.id} className="rmp-timeline-item">
                  <div className={`rmp-timeline-dot ${item.gateDecision.toLowerCase()}`}>
                    {item.gateDecision === 'PASS' ? <Check size={14} /> : <XCircle size={14} />}
                  </div>
                  <div className="rmp-timeline-content">
                    <div className="rmp-timeline-header">
                      <span className="rmp-timeline-title">
                        Lần {item.attemptNumber} — {item.gateDecision === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                      </span>
                      <span className="rmp-timeline-date">{formatDate(item.submittedAt)}</span>
                    </div>
                    <p className="rmp-timeline-summary">{item.summaryReport}</p>

                    {item.failReason && (
                      <p className="rmp-timeline-summary" style={{ color: '#fca5a5', marginTop: 6 }}>
                        Lý do: {item.failReason}
                      </p>
                    )}

                    <div className="rmp-timeline-meta">
                      {item.meetingDurationMinutes && (
                        <span className="rmp-timeline-tag">
                          <Timer size={10} /> {item.meetingDurationMinutes} phút
                        </span>
                      )}
                      {item.meetingJitsiLink && (
                        <a
                          href={item.meetingJitsiLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rmp-timeline-tag"
                          style={{ textDecoration: 'none' }}
                        >
                          <ExternalLink size={10} /> Jitsi
                        </a>
                      )}
                      {item.weakNodeIds?.map((nid) => (
                        <span key={nid} className="rmp-timeline-tag weak-node">
                          {nid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Verified Skills ═══ */}
      {activeTab === 'skills' && (
        <div className="rmp-card">
          <div className="rmp-card-header">
            <h3><Award size={18} /> Verified Skills Portfolio</h3>
          </div>
          {loading ? (
            <div className="rmp-loading">
              <div className="rmp-spinner" />
              Đang tải...
            </div>
          ) : skills.length === 0 ? (
            <div className="rmp-empty">
              <Award size={40} />
              <p>Chưa có skill nào được xác thực. Hãy hoàn thành roadmap và vượt qua verify!</p>
            </div>
          ) : (
            <div className="rmp-verified-skills">
              {skills.map((skill) => (
                <div key={skill.id} className="rmp-skill-card">
                  <div className="rmp-skill-name">
                    <span className="rmp-skill-verified-icon">
                      <CheckCircle size={12} />
                    </span>
                    {skill.skillName.replace(/_/g, ' ')}
                  </div>
                  {skill.skillLevel && (
                    <span className="rmp-skill-level">{skill.skillLevel}</span>
                  )}
                  <div className="rmp-skill-mentor">
                    <User size={12} />
                    Verified by: {skill.verifiedByMentorName || `Mentor #${skill.verifiedByMentorId}`}
                  </div>
                  <div className="rmp-skill-date">{formatDate(skill.verifiedAt)}</div>
                  {skill.verificationNote && (
                    <div className="rmp-skill-note">"{skill.verificationNote}"</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoadmapMentoringPanel;
