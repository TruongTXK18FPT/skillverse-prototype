import React, { useState, useEffect } from 'react';
import { useAppToast } from '../../context/ToastContext';
import roadmapEvidenceReviewService from '../../services/roadmapEvidenceReviewService';
import type {
  AdminRoadmapEvidenceReviewResponse,
  AiReviewStatus
} from '../../types/roadmapEvidenceReview';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Filter
} from 'lucide-react';
import './AdminRoadmapEvidenceReviewTab.css';

const statusConfig: Record<AiReviewStatus, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: 'Đang chờ hệ thống chấm', icon: Clock, color: '#f59e0b' },
  PASSED: { label: 'Hệ thống đã đánh giá đạt', icon: CheckCircle, color: '#10b981' },
  FAILED: { label: 'Hệ thống yêu cầu nộp lại', icon: XCircle, color: '#ef4444' },
  NEEDS_ADMIN_REVIEW: { label: 'Cần quản trị viên duyệt', icon: AlertCircle, color: '#8b5cf6' }
};

const isAiDisabledReview = (review: AdminRoadmapEvidenceReviewResponse) => {
  return review.reviewReasonType === 'AI_DISABLED';
};

const AdminRoadmapEvidenceReviewTab: React.FC = () => {
  const { showSuccess, showError } = useAppToast();
  const [reviews, setReviews] = useState<AdminRoadmapEvidenceReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AiReviewStatus | ''>('NEEDS_ADMIN_REVIEW');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState<AdminRoadmapEvidenceReviewResponse | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async (p = 0) => {
    setLoading(true);
    try {
      const data = await roadmapEvidenceReviewService.getReviews(
        p,
        20,
        statusFilter || undefined
      );
      setReviews(data.content);
      setTotalPages(data.totalPages);
      setPage(data.number);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tải danh sách AI Review.';
      showError('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(0);
  }, [statusFilter]);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedReview) return;
    
    const isOverride = selectedReview.status === 'PASSED' || selectedReview.status === 'FAILED';
    const trimmedReason = adminReason.trim();

    // Frontend validations and toast messages as per specifications
    if (isOverride && !trimmedReason) {
      showError('Lỗi', 'Vui lòng nhập lý do khi ghi đè kết quả hệ thống.');
      return;
    }
    if (decision === 'REJECT' && !trimmedReason) {
      showError('Lỗi', 'Vui lòng nhập lý do để học viên biết cần sửa gì.');
      return;
    }

    setSubmitting(true);
    try {
      await roadmapEvidenceReviewService.decideReview(selectedReview.id, {
        decision,
        reason: trimmedReason
      });
      showSuccess('Thành công', `Đã ${decision === 'APPROVE' ? 'duyệt đạt' : 'yêu cầu nộp lại'} bài làm.`);
      setSelectedReview(null);
      setAdminReason('');
      fetchReviews(page);
    } catch (err) {
      // Use backend error message in toast if API fails
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể cập nhật quyết định.';
      showError('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  const renderRubricBreakdown = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      let items: any[] = [];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Fallback for object format { "Criteria 1": { score: 8, maxPoints: 10, feedback: "..." } }
        items = Object.entries(parsed).map(([key, val]: [string, any]) => {
          if (typeof val === 'object' && val !== null) {
            return {
              name: key,
              score: val.score ?? val.points,
              maxPoints: val.maxPoints ?? val.max,
              feedback: val.feedback ?? val.comment
            };
          }
          return {
            name: key,
            feedback: String(val)
          };
        });
      }

      if (items.length === 0) return null;

      return (
        <div className="arer-rubric-breakdown-list">
          {items.map((item, idx) => {
            const name = item.name ?? item.criteria ?? `Tiêu chí ${idx + 1}`;
            const score = item.score ?? item.points;
            const maxPoints = item.maxPoints ?? item.max;
            const feedback = item.feedback ?? item.comment ?? item.feedback;
            
            return (
              <div key={idx} className="arer-rubric-breakdown-card">
                <div className="arer-rubric-card-header">
                  <span className="arer-rubric-card-title">{name}</span>
                  {score !== undefined && (
                    <span className="arer-rubric-card-score">
                      {score} {maxPoints !== undefined ? `/ ${maxPoints}` : 'điểm'}
                    </span>
                  )}
                </div>
                {score !== undefined && maxPoints !== undefined && (
                  <div className="arer-rubric-progress-bar">
                    <div 
                      className="arer-rubric-progress-fill" 
                      style={{ width: `${Math.min(100, Math.max(0, (score / maxPoints) * 100))}%` }}
                    />
                  </div>
                )}
                {feedback && <p className="arer-rubric-card-feedback">{feedback}</p>}
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="arer-tab">
      <header className="arer-header">
        <div>
          <h2>Quản Lý AI Evidence Review</h2>
          <p>Xem xét và đưa ra quyết định cho các bài nộp được AI đánh dấu cần kiểm duyệt.</p>
        </div>
        <div className="arer-actions">
          <button className="arer-refresh-btn" onClick={() => fetchReviews(page)}>
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </header>

      <div className="arer-toolbar">
        <div className="arer-filter">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AiReviewStatus | '')}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NEEDS_ADMIN_REVIEW">Cần quản trị viên duyệt</option>
            <option value="PENDING">Đang chờ xử lý (AI chưa chạy)</option>
            <option value="PASSED">Đã đạt</option>
            <option value="FAILED">Không đạt</option>
          </select>
        </div>
      </div>

      <div className="arer-content">
        <div className="arer-list-section">
          {loading ? (
            <div className="arer-empty">Đang tải dữ liệu...</div>
          ) : reviews.length === 0 ? (
            <div className="arer-empty">Không có bài kiểm duyệt nào khớp với bộ lọc.</div>
          ) : (
            <div className="arer-table-container">
              <table className="arer-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Loại bài nộp</th>
                    <th>Trạng Thái</th>
                    <th>Điểm / Độ tự tin</th>
                    <th>Ngày Tạo</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rv) => {
                    const StatusIcon = statusConfig[rv.status].icon;
                    return (
                      <tr key={rv.id} className={selectedReview?.id === rv.id ? 'active' : ''}>
                        <td>#{rv.id}</td>
                        <td>{rv.journeyOutputAssessmentId ? 'Bài nộp cuối lộ trình' : 'Minh chứng node'}</td>
                        <td>
                          <span className={`arer-status-badge ${rv.status.toLowerCase()}`}>
                            <StatusIcon size={14} />
                            {statusConfig[rv.status].label}
                          </span>
                        </td>
                        <td>
                          {rv.aiScorePercent != null ? `${rv.aiScorePercent}%` : '-'} / {rv.aiConfidence != null ? (rv.aiConfidence * 100).toFixed(0) + '%' : '-'}
                        </td>
                        <td>{new Date(rv.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="arer-view-btn"
                            onClick={() => {
                              setSelectedReview(rv);
                              setAdminReason(rv.adminReviewReason || '');
                            }}
                          >
                            <Eye size={16} /> Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="arer-pagination">
              <button disabled={page === 0} onClick={() => fetchReviews(page - 1)}>Trước</button>
              <span>Trang {page + 1} / {totalPages}</span>
              <button disabled={page === totalPages - 1} onClick={() => fetchReviews(page + 1)}>Sau</button>
            </div>
          )}
        </div>

        {selectedReview && (
          <div className="arer-detail-section">
            <h3>Chi tiết AI Review #{selectedReview.id}</h3>
            <div className="arer-detail-card">
              <div className="arer-detail-row">
                <span>Loại bài nộp:</span>
                <strong>{selectedReview.journeyOutputAssessmentId ? 'Bài nộp cuối lộ trình' : 'Minh chứng node'}</strong>
              </div>
              <div className="arer-detail-row">
                <span>Trạng thái hiện tại:</span>
                <strong className={`arer-status-text ${selectedReview.status.toLowerCase()}`}>
                  {statusConfig[selectedReview.status].label}
                </strong>
              </div>
              <div className="arer-detail-row">
                <span>Mã lộ trình (Journey ID):</span>
                <strong>#{selectedReview.journeyId}</strong>
              </div>
              <div className="arer-detail-row">
                <span>Mã học viên (Learner ID):</span>
                <strong>#{selectedReview.learnerId}</strong>
              </div>
              {!selectedReview.journeyOutputAssessmentId && selectedReview.nodeId && (
                <div className="arer-detail-row">
                  <span>Mã Node học (Node ID):</span>
                  <strong>{selectedReview.nodeId}</strong>
                </div>
              )}
              <div className="arer-detail-row">
                <span>Lần nộp (Attempt Number):</span>
                <strong>Lần {selectedReview.attemptNumber}</strong>
              </div>
              {(selectedReview.aiProvider || selectedReview.aiModelName) && (
                <div className="arer-detail-row">
                  <span>AI Engine:</span>
                  <strong>{selectedReview.aiProvider || 'unknown'} ({selectedReview.aiModelName || 'unknown'})</strong>
                </div>
              )}
              <div className="arer-detail-row">
                <span>Điểm AI chấm:</span>
                <strong>{selectedReview.aiScorePercent != null ? `${selectedReview.aiScorePercent}%` : 'Chưa có'}</strong>
              </div>
              <div className="arer-detail-row">
                <span>Độ tự tin (Confidence):</span>
                <strong>{selectedReview.aiConfidence != null ? `${(selectedReview.aiConfidence * 100).toFixed(0)}%` : 'Chưa có'}</strong>
              </div>

              {selectedReview.errorMessage && (
                isAiDisabledReview(selectedReview) ? (
                  <div className="arer-info-box">
                    <strong>Thông tin đánh giá:</strong>
                    <p className="arer-box-desc">Lộ trình hiện đang tắt chức năng chấm tự động bằng AI. Quản trị viên cần đánh giá thủ công bài nộp này.</p>
                  </div>
                ) : (
                  <div className="arer-error-box">
                    <strong>Lỗi thực thi AI:</strong>
                    <p className="arer-box-desc">{selectedReview.errorMessage}</p>
                  </div>
                )
              )}

              <div className="arer-detail-group">
                <span>Phản hồi từ AI:</span>
                <div className="arer-ai-feedback">{selectedReview.aiFeedback || 'Không có phản hồi.'}</div>
              </div>

              {selectedReview.aiRubricBreakdownJson && (
                <div className="arer-rubric-group">
                  <span>Chi tiết điểm theo tiêu chí (Rubric Breakdown):</span>
                  {renderRubricBreakdown(selectedReview.aiRubricBreakdownJson)}
                  
                  <details className="arer-rubric-details" style={{ marginTop: '8px' }}>
                    <summary className="arer-rubric-summary">Xem chi tiết barem điểm AI (JSON gốc)</summary>
                    <pre className="arer-json-block">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedReview.aiRubricBreakdownJson), null, 2);
                        } catch (e) {
                          return selectedReview.aiRubricBreakdownJson;
                        }
                      })()}
                    </pre>
                  </details>
                </div>
              )}

              {(selectedReview.status === 'NEEDS_ADMIN_REVIEW' || selectedReview.status === 'PENDING' || selectedReview.status === 'PASSED' || selectedReview.status === 'FAILED') && (
                <div className="arer-action-box">
                  {(() => {
                    const isOverride = selectedReview.status === 'PASSED' || selectedReview.status === 'FAILED';
                    return (
                      <>
                        <h4 className="arer-action-title">
                          {isOverride ? 'Đánh giá lại thủ công' : 'Quyết định của Admin'}
                        </h4>
                        
                        {isOverride && (
                          <div className="arer-override-warning">
                            <AlertCircle size={16} className="arer-override-warning-icon" />
                            <div>
                              <strong>Bạn đang ghi đè kết quả đã được hệ thống chấm.</strong> Quyết định này sẽ cập nhật trạng thái bài nộp và tiến trình học tập.
                            </div>
                          </div>
                        )}

                        <textarea
                          placeholder={isOverride ? "Lý do đánh giá thủ công (bắt buộc)..." : "Nhập lý do duyệt hoặc từ chối..."}
                          value={adminReason}
                          onChange={(e) => setAdminReason(e.target.value)}
                          rows={4}
                        />

                        <div className="arer-action-buttons">
                          <button
                            className="arer-reject-btn"
                            disabled={submitting}
                            onClick={() => handleDecision('REJECT')}
                          >
                            Yêu cầu nộp lại
                          </button>
                          <button
                            className="arer-approve-btn"
                            disabled={submitting}
                            onClick={() => handleDecision('APPROVE')}
                          >
                            Duyệt đạt
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {selectedReview.adminDecision && (
                <div className="arer-detail-group arer-admin-decision-note-group">
                  <span>Quyết định Admin trước đó:</span>
                  <div className="arer-ai-feedback arer-admin-decision-note">
                    <strong>{selectedReview.adminDecision === 'APPROVE' ? 'Đã duyệt đạt' : 'Yêu cầu nộp lại'}:</strong> {selectedReview.adminReviewReason || 'Không có lý do.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoadmapEvidenceReviewTab;
