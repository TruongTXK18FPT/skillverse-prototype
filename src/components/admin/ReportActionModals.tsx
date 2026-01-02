import React, { useState } from 'react';
import {
  X, Eye, CheckCircle, XCircle, Gavel, FileText, AlertTriangle,
  ExternalLink, Image, Video, FileAudio, Link as LinkIcon, MessageSquare
} from 'lucide-react';
import { ViolationReportResponse, RESOLUTION_ACTIONS } from '../../services/violationReportService';
import './ReportActionModals.css';

interface ReportActionModalsProps {
  report: ViolationReportResponse | null;
  actionType: 'investigate' | 'resolve' | 'escalate' | 'dismiss' | null;
  onClose: () => void;
  onSubmit: (action: string, data: any) => void;
}

const ReportActionModals: React.FC<ReportActionModalsProps> = ({
  report,
  actionType,
  onClose,
  onSubmit
}) => {
  const [notes, setNotes] = useState('');
  const [resolutionAction, setResolutionAction] = useState('WARNING_ISSUED');
  const [warningMessage, setWarningMessage] = useState('');
  const [viewingEvidence, setViewingEvidence] = useState<number | null>(null);

  if (!report || !actionType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    switch (actionType) {
      case 'investigate':
        onSubmit('investigate', {});
        break;
      case 'resolve':
        onSubmit('resolve', { 
          resolutionAction, 
          adminNotes: resolutionAction === 'WARNING_ISSUED' && warningMessage 
            ? `${notes}\n\nNỘI DUNG CẢNH BÁO:\n${warningMessage}`
            : notes
        });
        break;
      case 'escalate':
        onSubmit('escalate', { adminNotes: notes });
        break;
      case 'dismiss':
        onSubmit('dismiss', { adminNotes: notes });
        break;
    }
  };

  const getEvidenceIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      SCREENSHOT: Image,
      VIDEO: Video,
      AUDIO: FileAudio,
      LINK: LinkIcon,
      CHAT_LOG: MessageSquare,
      DOCUMENT: FileText
    };
    const Icon = iconMap[type] || FileText;
    return <Icon size={16} />;
  };

  const renderModalContent = () => {
    switch (actionType) {
      case 'investigate':
        return (
          <>
            <div className="adm-rpt-modal-header investigate">
              <div className="adm-rpt-modal-icon">
                <Eye size={24} />
              </div>
              <div>
                <h3>Điều Tra Báo Cáo</h3>
                <p>Xem xét chi tiết và chuyển sang trạng thái đang điều tra</p>
              </div>
            </div>

            <div className="adm-rpt-modal-body">
              {/* Report Summary */}
              <div className="adm-rpt-modal-section">
                <h4>Thông Tin Báo Cáo</h4>
                <div className="adm-rpt-modal-info-grid">
                  <div className="adm-rpt-modal-info-item">
                    <span className="label">Mã báo cáo:</span>
                    <span className="value">{report.reportCode}</span>
                  </div>
                  <div className="adm-rpt-modal-info-item">
                    <span className="label">Tiêu đề:</span>
                    <span className="value">{report.title}</span>
                  </div>
                  <div className="adm-rpt-modal-info-item">
                    <span className="label">Người báo cáo:</span>
                    <span className="value">{report.reporterName}</span>
                  </div>
                  <div className="adm-rpt-modal-info-item">
                    <span className="label">Đối tượng:</span>
                    <span className="value">{report.reportedUserName}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="adm-rpt-modal-section">
                <h4>Mô Tả Vi Phạm</h4>
                <div className="adm-rpt-modal-description">
                  {report.description}
                </div>
              </div>

              {/* Evidences */}
              {report.evidences && report.evidences.length > 0 && (
                <div className="adm-rpt-modal-section">
                  <h4>Bằng Chứng ({report.evidences.length})</h4>
                  <div className="adm-rpt-modal-evidences">
                    {report.evidences.map((evidence, idx) => (
                      <div key={idx} className="adm-rpt-modal-evidence-item">
                        <div className="adm-rpt-evidence-header">
                          {getEvidenceIcon(evidence.evidenceType)}
                          <span className="adm-rpt-evidence-type">{evidence.evidenceType}</span>
                          {evidence.fileName && (
                            <span className="adm-rpt-evidence-name">{evidence.fileName}</span>
                          )}
                        </div>
                        {evidence.description && (
                          <p className="adm-rpt-evidence-desc">{evidence.description}</p>
                        )}
                        {evidence.fileUrl && (
                          <div className="adm-rpt-evidence-actions">
                            <button
                              type="button"
                              className="adm-rpt-btn-view-evidence"
                              onClick={() => setViewingEvidence(idx)}
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                            <a
                              href={evidence.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="adm-rpt-btn-open-evidence"
                            >
                              <ExternalLink size={14} />
                              Mở trong tab mới
                            </a>
                          </div>
                        )}
                        {viewingEvidence === idx && evidence.fileUrl && (
                          <div className="adm-rpt-evidence-preview">
                            {evidence.evidenceType === 'SCREENSHOT' && (
                              <img src={evidence.fileUrl} alt={evidence.fileName} />
                            )}
                            {evidence.evidenceType === 'VIDEO' && (
                              <video controls src={evidence.fileUrl} />
                            )}
                            {evidence.evidenceType === 'LINK' && (
                              <iframe src={evidence.fileUrl} title={evidence.fileName} />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="adm-rpt-modal-alert info">
                <AlertTriangle size={18} />
                <span>Sau khi xác nhận, báo cáo sẽ chuyển sang trạng thái <strong>Đang Điều Tra</strong></span>
              </div>
            </div>

            <div className="adm-rpt-modal-footer">
              <button type="button" className="adm-rpt-btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="adm-rpt-btn-submit investigate">
                <Eye size={18} />
                Bắt Đầu Điều Tra
              </button>
            </div>
          </>
        );

      case 'resolve':
        return (
          <>
            <div className="adm-rpt-modal-header resolve">
              <div className="adm-rpt-modal-icon">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3>Giải Quyết Báo Cáo</h3>
                <p>Chọn hành động xử lý và ghi chú kết quả</p>
              </div>
            </div>

            <div className="adm-rpt-modal-body">
              <div className="adm-rpt-modal-section">
                <h4>Thông Tin Báo Cáo</h4>
                <div className="adm-rpt-modal-summary">
                  <span className="code">{report.reportCode}</span>
                  <span className="title">{report.title}</span>
                </div>
              </div>

              <div className="adm-rpt-modal-section">
                <label className="adm-rpt-modal-label required">
                  Hành Động Giải Quyết
                </label>
                <select
                  className="adm-rpt-modal-select"
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  required
                >
                  {Object.entries(RESOLUTION_ACTIONS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="adm-rpt-modal-section">
                <label className="adm-rpt-modal-label required">
                  Ghi Chú Của Admin
                </label>
                <textarea
                  className="adm-rpt-modal-textarea"
                  placeholder="Nhập chi tiết về cách xử lý, kết quả điều tra, và lý do ra quyết định..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  required
                />
                <span className="adm-rpt-modal-hint">
                  Ghi chú này sẽ được hiển thị cho người báo cáo
                </span>
              </div>

              {/* Warning Message - Only show if WARNING_ISSUED is selected */}
              {resolutionAction === 'WARNING_ISSUED' && (
                <div className="adm-rpt-modal-section">
                  <label className="adm-rpt-modal-label required">
                    Nội Dung Cảnh Báo Gửi Đến Người Vi Phạm
                  </label>
                  <textarea
                    className="adm-rpt-modal-textarea adm-rpt-warning-textarea"
                    placeholder="Nhập nội dung cảnh báo chi tiết sẽ được gửi qua email và thông báo đến người bị báo cáo...

Ví dụ:
- Hành vi cụ thể vi phạm
- Yêu cầu thay đổi hành vi
- Cảnh báo về hậu quả nếu tiếp tục vi phạm
- Hướng dẫn tuân thủ quy định"
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    rows={8}
                    required
                  />
                  <span className="adm-rpt-modal-hint">
                    ⚠️ Nội dung này sẽ được gửi trực tiếp đến email và tab thông báo của người bị báo cáo
                  </span>
                </div>
              )}

              <div className="adm-rpt-modal-alert success">
                <CheckCircle size={18} />
                <span>
                  Báo cáo sẽ chuyển sang trạng thái <strong>Đã Giải Quyết</strong>
                  {resolutionAction === 'WARNING_ISSUED' && (
                    <><br/>Người bị báo cáo sẽ nhận email và thông báo cảnh báo</>
                  )}
                </span>
              </div>
            </div>

            <div className="adm-rpt-modal-footer">
              <button type="button" className="adm-rpt-btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                className="adm-rpt-btn-submit resolve"
                disabled={!notes.trim() || (resolutionAction === 'WARNING_ISSUED' && !warningMessage.trim())}
              >
                <CheckCircle size={18} />
                Xác Nhận Giải Quyết
              </button>
            </div>
          </>
        );

      case 'escalate':
        return (
          <>
            <div className="adm-rpt-modal-header escalate">
              <div className="adm-rpt-modal-icon">
                <Gavel size={24} />
              </div>
              <div>
                <h3>Leo Thang Báo Cáo</h3>
                <p>Chuyển báo cáo lên cấp cao hơn để xử lý</p>
              </div>
            </div>

            <div className="adm-rpt-modal-body">
              <div className="adm-rpt-modal-section">
                <h4>Thông Tin Báo Cáo</h4>
                <div className="adm-rpt-modal-summary">
                  <span className="code">{report.reportCode}</span>
                  <span className="title">{report.title}</span>
                </div>
              </div>

              <div className="adm-rpt-modal-section">
                <label className="adm-rpt-modal-label required">
                  Lý Do Leo Thang
                </label>
                <textarea
                  className="adm-rpt-modal-textarea"
                  placeholder="Nhập lý do tại sao báo cáo này cần được leo thang (ví dụ: vi phạm nghiêm trọng, cần quyết định từ cấp cao hơn, vượt thẩm quyền xử lý...)
                  
Bao gồm:
- Mức độ nghiêm trọng của vi phạm
- Lý do không thể giải quyết ở cấp hiện tại
- Đề xuất hành động tiếp theo"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="adm-rpt-modal-alert warning">
                <Gavel size={18} />
                <span>Báo cáo sẽ được chuyển lên cấp quản lý cao hơn để xử lý</span>
              </div>
            </div>

            <div className="adm-rpt-modal-footer">
              <button type="button" className="adm-rpt-btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                className="adm-rpt-btn-submit escalate"
                disabled={!notes.trim()}
              >
                <Gavel size={18} />
                Xác Nhận Leo Thang
              </button>
            </div>
          </>
        );

      case 'dismiss':
        return (
          <>
            <div className="adm-rpt-modal-header dismiss">
              <div className="adm-rpt-modal-icon">
                <XCircle size={24} />
              </div>
              <div>
                <h3>Bỏ Qua Báo Cáo</h3>
                <p>Đánh dấu báo cáo là không hợp lệ hoặc không cần xử lý</p>
              </div>
            </div>

            <div className="adm-rpt-modal-body">
              <div className="adm-rpt-modal-section">
                <h4>Thông Tin Báo Cáo</h4>
                <div className="adm-rpt-modal-summary">
                  <span className="code">{report.reportCode}</span>
                  <span className="title">{report.title}</span>
                </div>
              </div>

              <div className="adm-rpt-modal-section">
                <label className="adm-rpt-modal-label required">
                  Lý Do Bỏ Qua
                </label>
                <textarea
                  className="adm-rpt-modal-textarea"
                  placeholder="Nhập lý do chi tiết tại sao báo cáo này bị bỏ qua (ví dụ: không đủ bằng chứng, báo cáo sai, vi phạm không nghiêm trọng, đã được xử lý...)

Bao gồm:
- Lý do cụ thể cho quyết định
- Đánh giá về bằng chứng được cung cấp
- Giải thích rõ ràng để người báo cáo hiểu"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="adm-rpt-modal-alert error">
                <XCircle size={18} />
                <span>Báo cáo sẽ chuyển sang trạng thái <strong>Đã Bỏ Qua</strong> và không được xử lý thêm</span>
              </div>
            </div>

            <div className="adm-rpt-modal-footer">
              <button type="button" className="adm-rpt-btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                className="adm-rpt-btn-submit dismiss"
                disabled={!notes.trim()}
              >
                <XCircle size={18} />
                Xác Nhận Bỏ Qua
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="adm-rpt-modal-overlay" onClick={onClose}>
      <div className="adm-rpt-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="adm-rpt-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <form onSubmit={handleSubmit}>
          {renderModalContent()}
        </form>
      </div>
    </div>
  );
};

export default ReportActionModals;
