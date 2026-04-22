import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import {
  countPendingQuestionBankSubmissions,
  getAdminQuestionBankSubmission,
  getAdminQuestionBankSubmissions,
  reviewQuestionBankSubmission,
} from '../../../services/questionBankService';
import { QuestionBankSubmission } from '../../../data/questionBankDTOs';
import { getExpertDomainLabel } from '../../../utils/expertFieldPresentation';

const PAGE_SIZE = 12;

const formatSkillLabel = (value?: string): string => {
  if (!value) return 'Chưa có skill';
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleString('vi-VN');
};

// [Admin Question Bank] Panel này gom toàn bộ luồng duyệt đóng góp mentor để QuestionBankTab chỉ việc chuyển section.
const QuestionBankSubmissionReviewPanel: React.FC = () => {
  const { showError, showSuccess, showWarning } = useToast();

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [submissions, setSubmissions] = useState<QuestionBankSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<QuestionBankSubmission | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const loadPendingCount = useCallback(async () => {
    try {
      const totalPending = await countPendingQuestionBankSubmissions();
      setPendingCount(totalPending);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const loadSubmissions = useCallback(async (nextPage = 0) => {
    try {
      setLoading(true);
      const data = await getAdminQuestionBankSubmissions({
        statuses: statusFilter === 'ALL' ? undefined : [statusFilter],
        page: nextPage,
        size: PAGE_SIZE,
      });
      setSubmissions(data.content || []);
      setPage(data.number || nextPage);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalElements || 0);
    } catch {
      showError('Lỗi', 'Không thể tải danh sách đóng góp từ mentor.');
    } finally {
      setLoading(false);
    }
  }, [showError, statusFilter]);

  useEffect(() => {
    loadSubmissions(0);
    loadPendingCount();
  }, [loadSubmissions, loadPendingCount]);

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return submissions;
    return submissions.filter((submission) =>
      [
        submission.title,
        submission.mentorName,
        submission.mentorEmail,
        submission.skillName,
        submission.jobRole,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [searchTerm, submissions]);

  const pageQuestionCount = useMemo(
    () => filteredSubmissions.reduce((total, submission) => total + (submission.questionCount || 0), 0),
    [filteredSubmissions],
  );

  const pageDuplicateCount = useMemo(
    () => filteredSubmissions.reduce((total, submission) => total + (submission.duplicateQuestionCount || 0), 0),
    [filteredSubmissions],
  );

  const openDetail = async (submissionId: number) => {
    try {
      setDetailLoading(true);
      const detail = await getAdminQuestionBankSubmission(submissionId);
      setSelectedSubmission(detail);
      setReviewNote(detail.reviewNote || '');
    } catch {
      showError('Lỗi', 'Không thể tải chi tiết bộ gửi duyệt.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedSubmission) return;
    if (!approved && !reviewNote.trim()) {
      showWarning('Thiếu ghi chú', 'Hãy nhập lý do từ chối để mentor dễ điều chỉnh.');
      return;
    }

    try {
      setReviewLoading(true);
      const reviewed = await reviewQuestionBankSubmission(selectedSubmission.id, {
        approved,
        reviewNote: reviewNote.trim() || undefined,
      });
      setSelectedSubmission(reviewed);
      setReviewNote(reviewed.reviewNote || '');
      showSuccess('Đã xử lý', approved ? 'Đã duyệt bộ câu hỏi của mentor.' : 'Đã từ chối bộ gửi duyệt.');
      await Promise.all([loadSubmissions(page), loadPendingCount()]);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể xử lý bộ gửi duyệt.';
      showError('Thao tác thất bại', message);
    } finally {
      setReviewLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="qb-review-status approved">
            <CheckCircle2 size={14} /> Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="qb-review-status rejected">
            <XCircle size={14} /> Từ chối
          </span>
        );
      default:
        return (
          <span className="qb-review-status pending">
            <Clock3 size={14} /> Đang chờ
          </span>
        );
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="qb-pagination">
        <button type="button" onClick={() => loadSubmissions(page - 1)} disabled={page === 0}>
          ‹
        </button>
        <span className="page-info">Trang {page + 1} / {totalPages}</span>
        <button type="button" onClick={() => loadSubmissions(page + 1)} disabled={page >= totalPages - 1}>
          ›
        </button>
      </div>
    );
  };

  return (
    <div className="qb-review-section">
      <div className="qb-stats">
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><ShieldCheck size={22} /></div>
          <div>
            <div className="qb-stat-value">{pendingCount}</div>
            <div className="qb-stat-label">Đang chờ duyệt</div>
          </div>
        </div>
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><FileText size={22} /></div>
          <div>
            <div className="qb-stat-value">{totalItems}</div>
            <div className="qb-stat-label">Bộ gửi duyệt</div>
          </div>
        </div>
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><Sparkles size={22} /></div>
          <div>
            <div className="qb-stat-value">{pageQuestionCount}</div>
            <div className="qb-stat-label">Câu hỏi trong trang</div>
          </div>
        </div>
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><XCircle size={22} /></div>
          <div>
            <div className="qb-stat-value">{pageDuplicateCount}</div>
            <div className="qb-stat-label">Câu trùng dự kiến</div>
          </div>
        </div>
      </div>

      {!selectedSubmission ? (
        <>
          <div className="qb-filters">
            <div className="qb-search-box">
              <Search size={20} />
              <input
                placeholder="Tìm theo mentor, skill, tiêu đề, job role..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <select
              className="qb-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Đang chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
            <button type="button" className="qb-btn secondary" onClick={() => {
              loadSubmissions(page);
              loadPendingCount();
            }}>
              <RefreshCw size={16} /> Tải lại
            </button>
          </div>

          {loading ? (
            <div className="qb-loading-state">
              <RefreshCw size={20} className="qb-spin" />
              <p>Đang tải danh sách đóng góp từ mentor...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="qb-empty-state">
              <ShieldCheck size={54} />
              <h3>Chưa có bộ gửi duyệt phù hợp</h3>
              <p>Không có bộ câu hỏi nào khớp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            <>
              <div className="qb-review-grid">
                {filteredSubmissions.map((submission) => (
                  <article key={submission.id} className="qb-review-card">
                    <div className="qb-review-card__header">
                      <div>
                        <h3>{submission.title}</h3>
                        <p>{submission.mentorName} · {submission.mentorEmail}</p>
                      </div>
                      {renderStatusBadge(submission.status)}
                    </div>

                    <div className="qb-review-card__meta">
                      <span>{getExpertDomainLabel(submission.domain)}</span>
                      <span>{submission.industry}</span>
                      <span>{submission.jobRole}</span>
                      <span>{formatSkillLabel(submission.skillName)}</span>
                    </div>

                    <div className="qb-review-card__stats">
                      <div>
                        <strong>{submission.questionCount}</strong>
                        <span>Câu hỏi gửi lên</span>
                      </div>
                      <div>
                        <strong>{submission.savedQuestionCount}</strong>
                        <span>Có thể lưu</span>
                      </div>
                      <div>
                        <strong>{submission.duplicateQuestionCount}</strong>
                        <span>Câu trùng</span>
                      </div>
                    </div>

                    <div className="qb-review-card__footer">
                      <div className="qb-review-card__portfolio">
                        {submission.mentorPortfolioSlug ? (
                          <a
                            href={`/portfolio/${submission.mentorPortfolioSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={14} /> Mở trang portfolio
                          </a>
                        ) : (
                          <span>Chưa có portfolio công khai</span>
                        )}
                      </div>
                      <button type="button" className="qb-btn primary small" onClick={() => openDetail(submission.id)}>
                        Xem chi tiết
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {renderPagination()}
            </>
          )}
        </>
      ) : (
        <>
          <div className="qb-breadcrumb">
            <button type="button" onClick={() => setSelectedSubmission(null)}>
              <ArrowLeft size={16} /> Danh sách bộ gửi duyệt từ mentor
            </button>
            <span>/</span>
            <span className="current">{selectedSubmission.title}</span>
          </div>

          {detailLoading ? (
            <div className="qb-loading-state">
              <RefreshCw size={20} className="qb-spin" />
              <p>Đang tải chi tiết bộ gửi duyệt...</p>
            </div>
          ) : (
            <>
              <div className="qb-review-detailCard">
                <div className="qb-review-detailCard__hero">
                  <div>
                    <h2>{selectedSubmission.title}</h2>
                    <p>{selectedSubmission.description || 'Không có mô tả chi tiết.'}</p>
                    <div className="qb-review-card__meta">
                      <span>{getExpertDomainLabel(selectedSubmission.domain)}</span>
                      <span>{selectedSubmission.industry}</span>
                      <span>{selectedSubmission.jobRole}</span>
                      <span>{formatSkillLabel(selectedSubmission.skillName)}</span>
                    </div>
                  </div>
                  <div className="qb-review-detailCard__statusBlock">
                    {renderStatusBadge(selectedSubmission.status)}
                    <span>Tạo lúc {formatDateTime(selectedSubmission.createdAt)}</span>
                    <span>Người đóng góp: {selectedSubmission.mentorName}</span>
                    {selectedSubmission.mentorPortfolioSlug ? (
                      <a
                        href={`/portfolio/${selectedSubmission.mentorPortfolioSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} /> /portfolio/{selectedSubmission.mentorPortfolioSlug}
                      </a>
                    ) : (
                      <span>Mentor chưa có portfolio công khai</span>
                    )}
                  </div>
                </div>

                <div className="qb-review-detailCard__stats">
                  <div className="qb-review-metricCard">
                    <strong>{selectedSubmission.questionCount}</strong>
                    <span>Tổng câu hỏi</span>
                  </div>
                  <div className="qb-review-metricCard">
                    <strong>{selectedSubmission.savedQuestionCount}</strong>
                    <span>Sẽ lưu vào bank</span>
                  </div>
                  <div className="qb-review-metricCard">
                    <strong>{selectedSubmission.duplicateQuestionCount}</strong>
                    <span>Bị loại do trùng</span>
                  </div>
                  <div className="qb-review-metricCard">
                    <strong>{selectedSubmission.resolvedQuestionBankTitle || 'Tạo ngân hàng mới'}</strong>
                    <span>
                      {selectedSubmission.resolvedQuestionBankId
                        ? `Ngân hàng #${selectedSubmission.resolvedQuestionBankId}`
                        : 'Sẽ tạo ngân hàng câu hỏi mới theo phạm vi này'}
                    </span>
                  </div>
                </div>

                {selectedSubmission.status === 'PENDING' ? (
                  <div className="qb-review-decisionBox">
                    <label className="qb-form-group full-width">
                      <span>Ghi chú review cho mentor</span>
                      <textarea
                        className="qb-textarea"
                        rows={4}
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        placeholder="Nêu rõ phần cần chỉnh sửa hoặc ghi chú bổ sung..."
                      />
                    </label>
                    <div className="qb-review-decisionActions">
                      <button
                        type="button"
                        className="qb-btn danger"
                        onClick={() => handleReview(false)}
                        disabled={reviewLoading}
                      >
                        {reviewLoading ? 'Đang xử lý...' : 'Từ chối bộ gửi duyệt'}
                      </button>
                      <button
                        type="button"
                        className="qb-btn success"
                        onClick={() => handleReview(true)}
                        disabled={reviewLoading}
                      >
                        {reviewLoading ? 'Đang xử lý...' : 'Duyệt và lưu vào hệ thống'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="qb-review-readonlyBox">
                    <strong>Thông tin review</strong>
                    <p>{selectedSubmission.reviewNote || 'Không có ghi chú bổ sung.'}</p>
                    <span>
                      {selectedSubmission.reviewedByName
                        ? `Người xử lý: ${selectedSubmission.reviewedByName} · ${formatDateTime(selectedSubmission.reviewedAt)}`
                        : 'Chưa có thông tin reviewer'}
                    </span>
                  </div>
                )}
              </div>

              <div className="qb-review-questionList">
                {(selectedSubmission.questions || []).map((question, index) => (
                  <article key={question.id || `${selectedSubmission.id}-${index}`} className="qb-review-questionCard">
                    <div className="qb-review-questionCard__header">
                      <div>
                        <strong>Câu {question.displayOrder || index + 1}</strong>
                        <p>{question.questionText}</p>
                      </div>
                      <div className="qb-review-questionCard__tags">
                        <span>{question.difficulty}</span>
                        {question.skillArea && <span>{question.skillArea}</span>}
                        {question.category && <span>{question.category}</span>}
                      </div>
                    </div>

                    <div className="qb-review-optionList">
                      {question.options.map((option, optionIndex) => {
                        const letter = String.fromCharCode(65 + optionIndex);
                        return (
                          <div
                            key={`${question.id || index}-${letter}`}
                            className={`qb-review-optionItem ${question.correctAnswer === letter ? 'correct' : ''}`}
                          >
                            <strong>{letter}</strong>
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="qb-review-explanation">
                        <strong>Giải thích</strong>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionBankSubmissionReviewPanel;
