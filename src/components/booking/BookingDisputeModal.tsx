import React, { useState, useEffect, useRef } from 'react';
import {
  X, Upload, MessageSquare, FileText, Link as LinkIcon,
  Send, Loader2, AlertTriangle, Plus, User,
} from 'lucide-react';
import {
  openBookingDispute,
  getBookingDispute,
  getBookingDisputeEvidence,
  submitBookingDisputeEvidence,
  respondToBookingDisputeEvidence,
  getBookingDisputeByBooking,
  BookingDispute,
  BookingDisputeEvidence,
  EvidenceType,
} from '../../services/bookingDisputeService';
import { uploadMedia } from '../../services/mediaService';
import { getStoredUserRaw } from '../../utils/authStorage';
import { showAppSuccess, showAppError } from '../../context/ToastContext';
import './BookingDisputeModal.css';

interface BookingDisputeModalProps {
  bookingId: number;
  mentorName?: string;
  onClose: () => void;
  onDisputeOpened?: (disputeId: number) => void;
}

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  TEXT: 'Văn bản',
  FILE: 'Tệp đính kèm',
  LINK: 'Đường dẫn',
  SCREENSHOT: 'Ảnh chụp màn hình',
  CHAT_LOG: 'Nhật ký chat',
  IMAGE: 'Hình ảnh',
};

const BookingDisputeModal: React.FC<BookingDisputeModalProps> = ({
  bookingId,
  mentorName,
  onClose,
  onDisputeOpened,
}) => {
  const userRaw = getStoredUserRaw();
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userId = user?.userId ? Number(user.userId) : 0;

  const [dispute, setDispute] = useState<BookingDispute | null>(null);
  const [evidence, setEvidence] = useState<BookingDisputeEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openStep, setOpenStep] = useState<'reason' | 'evidence' | 'view'>('reason');

  // Form state
  const [reason, setReason] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('TEXT');
  const [evidenceContent, setEvidenceContent] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [responseMap, setResponseMap] = useState<Record<number, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDispute();
  }, [bookingId]);

  const loadDispute = async () => {
    setLoading(true);
    try {
      const d = await getBookingDisputeByBooking(bookingId);
      setDispute(d);
      const ev = await getBookingDisputeEvidence(d.id);
      setEvidence(ev);
      setOpenStep('view');
    } catch {
      // No dispute exists yet
      setDispute(null);
      setEvidence([]);
      setOpenStep('reason');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!reason.trim()) {
      showAppError('Vui lòng nhập lý do dispute');
      return;
    }
    setSubmitting(true);
    try {
      const d = await openBookingDispute(bookingId, reason);
      setDispute(d);
      showAppSuccess('Đã mở dispute', 'Dispute đã được gửi. Admin sẽ xem xét.');
      setOpenStep('evidence');
      onDisputeOpened?.(d.id);
    } catch (err: any) {
      showAppError('Mở dispute thất bại', err?.response?.data?.message || 'Không thể mở dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (evidenceType === 'TEXT' && !evidenceContent.trim()) {
      showAppError('Vui lòng nhập nội dung bằng chứng');
      return;
    }
    if (evidenceType === 'FILE' && !evidenceFile) {
      showAppError('Vui lòng chọn tệp đính kèm');
      return;
    }
    if (evidenceType === 'LINK' && !evidenceContent.trim()) {
      showAppError('Vui lòng nhập đường dẫn');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (evidenceType === 'FILE' && evidenceFile) {
        const media = await uploadMedia(evidenceFile, userId);
        fileUrl = media.url;
        fileName = evidenceFile.name;
      }

      const ev = await submitBookingDisputeEvidence(
        dispute!.id,
        evidenceType,
        evidenceType === 'TEXT' || evidenceType === 'LINK' ? evidenceContent : undefined,
        fileUrl,
        fileName,
        evidenceDescription || undefined
      );
      setEvidence(prev => [...prev, ev]);
      setEvidenceContent('');
      setEvidenceFile(null);
      setEvidenceDescription('');
      showAppSuccess('Đã gửi bằng chứng', 'Bằng chứng của bạn đã được gửi.');
    } catch (err: any) {
      showAppError('Gửi bằng chứng thất bại', err?.response?.data?.message || 'Lỗi khi gửi bằng chứng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResponse = async (evidenceId: number) => {
    const content = responseMap[evidenceId];
    if (!content?.trim()) return;

    setSubmittingResponse(evidenceId);
    try {
      await respondToBookingDisputeEvidence(dispute!.id, evidenceId, content);
      setResponseMap(prev => {
        const next = { ...prev };
        delete next[evidenceId];
        return next;
      });
      showAppSuccess('Đã phản hồi', 'Phản hồi của bạn đã được gửi.');
      // Reload evidence to get new responses
      const ev = await getBookingDisputeEvidence(dispute!.id);
      setEvidence(ev);
    } catch (err: any) {
      showAppError('Phản hồi thất bại', err?.response?.data?.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setSubmittingResponse(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: '#f97316',
      UNDER_INVESTIGATION: '#eab308',
      AWAITING_RESPONSE: '#3b82f6',
      RESOLVED: '#22c55e',
      DISMISSED: '#94a3b8',
      ESCALATED: '#ef4444',
    };
    const labels: Record<string, string> = {
      OPEN: 'Mở',
      UNDER_INVESTIGATION: 'Đang điều tra',
      AWAITING_RESPONSE: 'Chờ phản hồi',
      RESOLVED: 'Đã giải quyết',
      DISMISSED: 'Bác bỏ',
      ESCALATED: 'Escalate',
    };
    return (
      <span style={{ color: colors[status] || '#94a3b8', fontWeight: 600 }}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bdm-overlay">
        <div className="bdm-modal">
          <div className="bdm-loading">
            <Loader2 className="bdm-spinner" size={32} />
            <span>Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bdm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bdm-modal">
        <div className="bdm-header">
          <div className="bdm-header-left">
            <AlertTriangle size={20} color="#f97316" />
            <h2>Khiếu nại Booking #{bookingId}</h2>
          </div>
          <button className="bdm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {dispute && (
          <div className="bdm-dispute-info">
            <div className="bdm-info-row">
              <span className="bdm-label">Trạng thái:</span>
              {getStatusBadge(dispute.status)}
            </div>
            {dispute.resolution && (
              <div className="bdm-info-row">
                <span className="bdm-label">Kết quả:</span>
                <span>{dispute.resolution.replace('_', ' ')}</span>
              </div>
            )}
            {dispute.resolutionNotes && (
              <div className="bdm-info-row">
                <span className="bdm-label">Ghi chú:</span>
                <span>{dispute.resolutionNotes}</span>
              </div>
            )}
          </div>
        )}

        <div className="bdm-body">
          {/* Step 1: Open dispute reason */}
          {openStep === 'reason' && (
            <div className="bdm-step">
              <h3>Mở khiếu nại</h3>
              <p className="bdm-desc">
                Nếu bạn không hài lòng với buổi học với mentor{mentorName ? ` ${mentorName}` : ''},
                bạn có thể mở khiếu nại. Admin sẽ xem xét và giải quyết.
              </p>
              <div className="bdm-form-group">
                <label>Lý do khiếu nại *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                  rows={4}
                />
              </div>
              <div className="bdm-form-actions">
                <button className="bdm-btn bdm-btn-secondary" onClick={onClose}>
                  Hủy
                </button>
                <button
                  className="bdm-btn bdm-btn-primary"
                  onClick={handleOpenDispute}
                  disabled={submitting || !reason.trim()}
                >
                  {submitting ? <Loader2 className="bdm-spinner" size={16} /> : <AlertTriangle size={16} />}
                  {submitting ? 'Đang gửi...' : 'Mở khiếu nại'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Evidence submission and viewing */}
          {openStep === 'evidence' && (
            <div className="bdm-step">
              <h3>Bằng chứng</h3>

              {/* Add evidence form */}
              <div className="bdm-evidence-form">
                <div className="bdm-form-group">
                  <label>Loại bằng chứng</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                  >
                    <option value="TEXT">Văn bản</option>
                    <option value="FILE">Tệp đính kèm</option>
                    <option value="LINK">Đường dẫn</option>
                    <option value="IMAGE">Hình ảnh</option>
                    <option value="SCREENSHOT">Ảnh chụp màn hình</option>
                    <option value="CHAT_LOG">Nhật ký chat</option>
                  </select>
                </div>

                {evidenceType === 'TEXT' && (
                  <div className="bdm-form-group">
                    <label>Nội dung bằng chứng *</label>
                    <textarea
                      value={evidenceContent}
                      onChange={(e) => setEvidenceContent(e.target.value)}
                      placeholder="Nhập nội dung bằng chứng..."
                      rows={3}
                    />
                  </div>
                )}

                {evidenceType === 'LINK' && (
                  <div className="bdm-form-group">
                    <label>Đường dẫn *</label>
                    <input
                      type="url"
                      value={evidenceContent}
                      onChange={(e) => setEvidenceContent(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {['FILE', 'IMAGE', 'SCREENSHOT'].includes(evidenceType) && (
                  <>
                    <div className="bdm-form-group">
                      <label>Tải lên tệp *</label>
                      <div
                        className="bdm-file-drop"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={24} />
                        <span>{evidenceFile ? evidenceFile.name : 'Nhấp hoặc kéo tệp vào đây'}</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className="bdm-form-group">
                      <label>Mô tả (tùy chọn)</label>
                      <input
                        type="text"
                        value={evidenceDescription}
                        onChange={(e) => setEvidenceDescription(e.target.value)}
                        placeholder="Mô tả ngắn về tệp này..."
                      />
                    </div>
                  </>
                )}

                {evidenceType === 'CHAT_LOG' && (
                  <div className="bdm-form-group">
                    <label>Nội dung nhật ký chat *</label>
                    <textarea
                      value={evidenceContent}
                      onChange={(e) => setEvidenceContent(e.target.value)}
                      placeholder="Dán nội dung chat vào đây..."
                      rows={4}
                    />
                  </div>
                )}

                <button
                  className="bdm-btn bdm-btn-primary"
                  onClick={handleSubmitEvidence}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="bdm-spinner" size={16} /> : <Plus size={16} />}
                  {submitting ? 'Đang gửi...' : 'Gửi bằng chứng'}
                </button>
              </div>

              {/* Evidence list */}
              {evidence.length > 0 && (
                <div className="bdm-evidence-list">
                  <h4>Bằng chứng đã gửi ({evidence.length})</h4>
                  {evidence.map((ev) => (
                    <div key={ev.id} className="bdm-evidence-item">
                      <div className="bdm-evidence-header">
                        <span className="bdm-evidence-type">
                          {EVIDENCE_TYPE_LABELS[ev.evidenceType]}
                        </span>
                        <span className="bdm-evidence-submitter">
                          <User size={12} /> #{ev.submittedBy}
                        </span>
                      </div>
                      {ev.content && (
                        <div className="bdm-evidence-content">{ev.content}</div>
                      )}
                      {ev.fileUrl && (
                        <div className="bdm-evidence-file">
                          {ev.fileName && <span>{ev.fileName}</span>}
                          <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer">
                            Xem tệp
                          </a>
                        </div>
                      )}
                      {ev.description && (
                        <div className="bdm-evidence-desc">{ev.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: View dispute + evidence */}
          {openStep === 'view' && dispute && (
            <div className="bdm-step">
              <h3>Bằng chứng đã gửi</h3>
              {evidence.length === 0 ? (
                <p className="bdm-empty">Chưa có bằng chứng nào.</p>
              ) : (
                <div className="bdm-evidence-list">
                  {evidence.map((ev) => (
                    <div key={ev.id} className="bdm-evidence-item">
                      <div className="bdm-evidence-header">
                        <span className="bdm-evidence-type">
                          {EVIDENCE_TYPE_LABELS[ev.evidenceType]}
                        </span>
                        <span className="bdm-evidence-submitter">
                          <User size={12} /> #{ev.submittedBy}
                        </span>
                      </div>
                      {ev.content && (
                        <div className="bdm-evidence-content">{ev.content}</div>
                      )}
                      {ev.fileUrl && (
                        <div className="bdm-evidence-file">
                          {ev.fileName && <span>{ev.fileName}</span>}
                          <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer">
                            Xem tệp
                          </a>
                        </div>
                      )}
                      {ev.description && (
                        <div className="bdm-evidence-desc">{ev.description}</div>
                      )}

                      {/* Response form */}
                      {ev.submittedBy !== userId && (
                        <div className="bdm-response-form">
                          <textarea
                            value={responseMap[ev.id] || ''}
                            onChange={(e) => setResponseMap(prev => ({ ...prev, [ev.id]: e.target.value }))}
                            placeholder="Viết phản hồi..."
                            rows={2}
                          />
                          <button
                            className="bdm-btn bdm-btn-small bdm-btn-primary"
                            onClick={() => handleSubmitResponse(ev.id)}
                            disabled={submittingResponse === ev.id || !responseMap[ev.id]?.trim()}
                          >
                            {submittingResponse === ev.id ? (
                              <Loader2 className="bdm-spinner" size={14} />
                            ) : (
                              <Send size={14} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add more evidence */}
              {dispute.status !== 'RESOLVED' && dispute.status !== 'DISMISSED' && (
                <button
                  className="bdm-btn bdm-btn-secondary"
                  onClick={() => setOpenStep('evidence')}
                >
                  <Plus size={16} /> Thêm bằng chứng
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDisputeModal;
