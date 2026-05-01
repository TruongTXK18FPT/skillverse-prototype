import React, { useState, useEffect, useMemo } from 'react';
import jobService from '../../services/jobService';
import shortTermJobService from '../../services/shortTermJobService';
import interviewService, { InterviewScheduleResponse } from '../../services/interviewService';
import { JobApplicationResponse } from '../../data/jobDTOs';
import { ShortTermApplicationResponse, ShortTermApplicationStatus } from '../../types/ShortTermJob';
import { useToast } from '../../hooks/useToast';
import { Clock, MapPin, DollarSign, Calendar, CheckCircle, XCircle, Eye, Zap, Briefcase, Video, ExternalLink, Loader2 } from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import OdysseyLayout from '../../components/jobs-odyssey/OdysseyLayout';
import Pagination from '../../components/shared/Pagination';
import '../../components/jobs-odyssey/odyssey-styles.css';

// Unified application type for display
interface UnifiedApplication {
  id: number;
  type: 'REGULAR' | 'SHORT_TERM';
  jobId: number;
  jobTitle: string;
  recruiterCompanyName: string;
  minBudget: number;
  maxBudget: number;
  budget?: number; // For short-term
  isRemote: boolean;
  location: string;
  appliedAt: string;
  status: string;
  coverLetter?: string;
  acceptanceMessage?: string;
  rejectionReason?: string;
  processedAt?: string;
  // Short-term specific
  proposedPrice?: number;
  proposedDuration?: string;
  jobDetails?: {
    title: string;
    budget: number;
    deadline: string;
    recruiterCompanyName?: string;
  };
}

const MyApplicationsPage: React.FC = () => {
  const { showError } = useToast();
  const [regularApplications, setRegularApplications] = useState<JobApplicationResponse[]>([]);
  const [shortTermApplications, setShortTermApplications] = useState<ShortTermApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'REGULAR' | 'SHORT_TERM'>('ALL');
  // Interview detail modal (candidate side)
  const [interviewDetail, setInterviewDetail] = useState<InterviewScheduleResponse | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      // Fetch both regular jobs and short-term jobs applications in parallel
      const [regularData, shortTermData] = await Promise.all([
        jobService.getMyApplications().catch(err => {
          console.error('Error fetching regular applications:', err);
          return [];
        }),
        shortTermJobService.getMyApplications().catch(err => {
          console.error('Error fetching short-term applications:', err);
          return [];
        })
      ]);

      setRegularApplications(regularData);
      setShortTermApplications(shortTermData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showError('Lỗi tải dữ liệu', 'Không thể tải danh sách ứng tuyển. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  // Convert to unified format
  const unifiedApplications: UnifiedApplication[] = useMemo(() => {
    const regularApps: UnifiedApplication[] = regularApplications.map(app => ({
      id: app.id,
      type: 'REGULAR' as const,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      recruiterCompanyName: app.recruiterCompanyName,
      minBudget: app.minBudget,
      maxBudget: app.maxBudget,
      isRemote: app.isRemote,
      location: app.location,
      appliedAt: app.appliedAt,
      status: app.status,
      coverLetter: app.coverLetter,
      acceptanceMessage: app.acceptanceMessage,
      rejectionReason: app.rejectionReason,
      processedAt: app.processedAt
    }));

    const shortTermApps: UnifiedApplication[] = shortTermApplications.map(app => ({
      id: app.id,
      type: 'SHORT_TERM' as const,
      jobId: app.jobId,
      jobTitle: app.jobTitle || app.jobDetails?.title || 'Short-term Job',
      recruiterCompanyName: app.jobDetails?.recruiterCompanyName || app.recruiterCompanyName || '',
      minBudget: app.jobBudget || app.proposedPrice || 0,
      maxBudget: app.jobBudget || app.proposedPrice || 0,
      budget: app.jobBudget || app.proposedPrice,
      isRemote: false,
      location: '',
      appliedAt: app.appliedAt,
      status: app.status,
      coverLetter: app.coverLetter,
      proposedPrice: app.proposedPrice,
      proposedDuration: app.proposedDuration,
      jobDetails: app.jobDetails
    }));

    return [...regularApps, ...shortTermApps].sort((a, b) =>
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
  }, [regularApplications, shortTermApplications]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const formatShortTermBudget = (budget?: number) => {
    if (!budget) return 'Thỏa thuận';
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    });
    return formatter.format(budget);
  };

  const getStatusInfo = (status: string) => {
    // Handle short-term application statuses
    const statusMap: Record<string, { text: string; color: string; bg: string; icon: React.ReactNode }> = {
      // Regular job statuses — full-time pipeline
      'PENDING': { text: 'Đang Chờ', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={16} /> },
      'REVIEWED': { text: 'Đã Xem', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <Eye size={16} /> },
      'ACCEPTED': { text: 'Được Chấp Nhận', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle size={16} /> },
      'REJECTED': { text: 'Bị Từ Chối', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <XCircle size={16} /> },
      'INTERVIEW_SCHEDULED': { text: 'Lịch Phỏng Vấn', color: '#00f5ff', bg: 'rgba(0, 245, 255, 0.08)', icon: <Eye size={16} /> },
      'INTERVIEWED': { text: 'Đã Phỏng Vấn', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.1)', icon: <CheckCircle size={16} /> },
      'OFFER_SENT': { text: 'Đã Gửi Đề Nghị', color: '#aa55ff', bg: 'rgba(170, 85, 255, 0.08)', icon: <CheckCircle size={16} /> },
      'OFFER_ACCEPTED': { text: 'Nhận Đề Nghị', color: '#34d399', bg: 'rgba(52, 211, 153, 0.08)', icon: <CheckCircle size={16} /> },
      'OFFER_REJECTED': { text: 'Từ Chối Đề Nghị', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.08)', icon: <XCircle size={16} /> },
      'CONTRACT_SIGNED': { text: 'Đã Ký HĐ', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: <CheckCircle size={16} /> },
      // Short-term job statuses
      'WORKING': { text: 'Đang Làm Việc', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: <Briefcase size={16} /> },
      'SUBMITTED': { text: 'Đã Nộp Bài', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: <CheckCircle size={16} /> },
      'REVISION_REQUIRED': { text: 'Cần Sửa Lại', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <XCircle size={16} /> },
      'APPROVED': { text: 'Đã Duyệt', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle size={16} /> },
      'COMPLETED': { text: 'Hoàn Thành', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', icon: <CheckCircle size={16} /> },
      'WITHDRAWN': { text: 'Đã Rút Đơn', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', icon: <XCircle size={16} /> },
    };

    return statusMap[status] || {
      text: status,
      color: '#6b7280',
      bg: 'rgba(107, 114, 128, 0.1)',
      icon: <Clock size={16} />
    };
  };

  const filteredApplications = unifiedApplications.filter(app => {
    // Type filter
    if (typeFilter !== 'ALL' && app.type !== typeFilter) return false;
    // Status filter
    if (filter === 'ALL') return true;
    return app.status === filter;
  });

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApplications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApplications, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter]);

  const stats = {
    total: unifiedApplications.length,
    regular: regularApplications.length,
    shortTerm: shortTermApplications.length,
    pending: unifiedApplications.filter(a => a.status === 'PENDING').length,
    accepted: unifiedApplications.filter(a => ['ACCEPTED', 'WORKING', 'APPROVED', 'COMPLETED'].includes(a.status)).length,
    rejected: unifiedApplications.filter(a => ['REJECTED', 'WITHDRAWN'].includes(a.status)).length,
  };

  if (loading) {
    return (
      <OdysseyLayout hideHeader>
        <div className="odyssey-loading">
          <MeowlKuruLoader size="small" text="" />
          <p className="odyssey-loading__text">Đang tải danh sách ứng tuyển...</p>
        </div>
      </OdysseyLayout>
    );
  }

  return (
    <OdysseyLayout hideHeader>
      <header className="odyssey-header">
        <h1 className="odyssey-header__title">Đơn Ứng Tuyển</h1>
        <p className="odyssey-header__subtitle">Theo dõi trạng thái công việc đã ứng tuyển</p>
      </header>

      {/* Type Filter */}
      <div className="odyssey-filter-console" style={{ marginBottom: '1rem' }}>
        <div className="odyssey-filter-console__content odyssey-filter-console__content--expanded">
          <div className="odyssey-filter-console__section">
            <label className="odyssey-filter-console__label">
              <span className="odyssey-filter-console__label-icon">◆</span>
              Loại công việc
            </label>
            <div className="odyssey-filter-console__toggle-group">
              {[
                { key: 'ALL', label: `Tất cả (${stats.total})` },
                { key: 'REGULAR', label: `Full-time (${stats.regular})`, icon: <Briefcase size={14} /> },
                { key: 'SHORT_TERM', label: `Ngắn hạn (${stats.shortTerm})`, icon: <Zap size={14} /> }
              ].map((s) => (
                <button
                  key={s.key}
                  className={`odyssey-filter-console__toggle ${typeFilter === s.key ? 'odyssey-filter-console__toggle--active' : ''}`}
                  onClick={() => setTypeFilter(s.key as any)}
                >
                  <span className="odyssey-filter-console__toggle-led"></span>
                  {s.icon && <span style={{ marginRight: '4px' }}>{s.icon}</span>}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Console */}
      <div className="odyssey-filter-console">
        <div className="odyssey-filter-console__content odyssey-filter-console__content--expanded">
          <div className="odyssey-filter-console__section">
            <label className="odyssey-filter-console__label">
              <span className="odyssey-filter-console__label-icon">◆</span>
              Trạng thái
            </label>
            <div className="odyssey-filter-console__toggle-group">
              {[
                { key: 'ALL', label: `Tất cả (${stats.total})` },
                { key: 'PENDING', label: `Chờ xét (${stats.pending})` },
                { key: 'ACCEPTED', label: `Được nhận (${stats.accepted})` },
                { key: 'REJECTED', label: `Từ chối (${stats.rejected})` }
              ].map((s) => (
                <button
                  key={s.key}
                  className={`odyssey-filter-console__toggle ${filter === s.key ? 'odyssey-filter-console__toggle--active' : ''}`}
                  onClick={() => setFilter(s.key)}
                >
                  <span className="odyssey-filter-console__toggle-led"></span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="odyssey-content">
        {filteredApplications.length === 0 ? (
          <div className="odyssey-empty">
            <div className="odyssey-empty__icon">📭</div>
            <h3 className="odyssey-empty__title">Chưa có đơn ứng tuyển</h3>
            <p className="odyssey-empty__text">
              {filter === 'ALL' && typeFilter === 'ALL'
                ? 'Bạn chưa ứng tuyển công việc nào. Khám phá công việc mới ngay!'
                : `Không có đơn ứng tuyển phù hợp với bộ lọc`
              }
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="odyssey-card__btn" onClick={() => window.location.href = '/jobs'}>
                <span>Tìm công việc</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="odyssey-grid">
            {paginatedApplications.map((app) => (
              <div key={`${app.type}-${app.id}`} className="odyssey-card-wrapper">
                <div className={`odyssey-card odyssey-card--${app.type === 'SHORT_TERM' ? 'gold' : (((app.minBudget + app.maxBudget) / 2) > 5000000 ? 'crimson' : ((app.minBudget + app.maxBudget) / 2) >= 1000000 ? 'gold' : 'blue')}`}>
                  <div className="odyssey-card__corner-indicator odyssey-card__corner-indicator--tl"></div>
                  <div className="odyssey-card__corner-indicator odyssey-card__corner-indicator--br"></div>

                  {/* Type badge */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className={`stj-badge ${app.type === 'SHORT_TERM' ? 'stj-badge--published' : ''}`} style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: app.type === 'SHORT_TERM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: app.type === 'SHORT_TERM' ? '#f59e0b' : '#3b82f6'
                    }}>
                      {app.type === 'SHORT_TERM' ? <><Zap size={10} /> Gig</> : <><Briefcase size={10} /> Full-time</>}
                    </span>
                  </div>

                  <div className="odyssey-card__content-wrapper">
                    <div className="odyssey-card__faction">
                      <div className="odyssey-card__faction-ring">
                        {app.recruiterCompanyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <div className="odyssey-card__company">{app.recruiterCompanyName}</div>
                    </div>

                    <div className="odyssey-card__content">
                      <h3 className="odyssey-card__title">{app.jobTitle}</h3>
                    </div>

                    <div className="odyssey-card__meta">
                      <div className="odyssey-card__meta-item">
                        <DollarSign className="odyssey-card__meta-icon" size={16} />
                        <span>
                          {app.type === 'SHORT_TERM'
                            ? formatShortTermBudget(app.budget)
                            : formatBudget(app.minBudget, app.maxBudget)
                          }
                        </span>
                      </div>
                      <div className="odyssey-card__meta-item">
                        <MapPin className="odyssey-card__meta-icon" size={16} />
                        <span>{app.isRemote ? '🌐 Từ xa' : `📍 ${app.location || 'Liên hệ'}`}</span>
                      </div>
                      <div className="odyssey-card__meta-item">
                        <Calendar className="odyssey-card__meta-icon" size={16} />
                        <span>Ứng tuyển: {formatDate(app.appliedAt)}</span>
                      </div>
                      {app.proposedPrice && app.type === 'SHORT_TERM' && (
                        <div className="odyssey-card__meta-item">
                          <Zap className="odyssey-card__meta-icon" size={16} />
                          <span>Đề xuất: {formatShortTermBudget(app.proposedPrice)}</span>
                        </div>
                      )}
                    </div>

                    {app.coverLetter && (
                      <p className="odyssey-card__description">📝 {app.coverLetter}</p>
                    )}

                    <div className="odyssey-card__badge" style={{ background: getStatusInfo(app.status).bg, color: getStatusInfo(app.status).color }}>
                      {getStatusInfo(app.status).icon}
                      <span style={{ marginLeft: '0.5rem' }}>{getStatusInfo(app.status).text}</span>
                    </div>

                    {app.type === 'REGULAR' && app.status === 'INTERVIEW_SCHEDULED' && (
                      <button
                        className="odyssey-card__action-btn"
                        style={{ marginTop: '0.75rem', width: '100%', background: 'rgba(0, 245, 255, 0.08)', color: '#00f5ff', border: '1px solid rgba(0, 245, 255, 0.25)' }}
                        onClick={async () => {
                          setInterviewLoading(true);
                          setShowInterviewModal(true);
                          try {
                            const data = await interviewService.getInterviewByApplication(app.id);
                            setInterviewDetail(data);
                          } catch {
                            showError('Lỗi', 'Không thể tải chi tiết lịch phỏng vấn');
                            setShowInterviewModal(false);
                          } finally {
                            setInterviewLoading(false);
                          }
                        }}
                      >
                        <Video size={15} />
                        <span>Xem lịch &amp; Tham gia phỏng vấn</span>
                      </button>
                    )}

                    {app.acceptanceMessage && (
                      <p className="odyssey-card__description" style={{ color: '#10b981' }}>✅ {app.acceptanceMessage}</p>
                    )}
                    {app.rejectionReason && (
                      <p className="odyssey-card__description" style={{ color: '#ef4444' }}>❌ {app.rejectionReason}</p>
                    )}

                    {app.processedAt && (
                      <div className="odyssey-card__meta" style={{ marginTop: '0.5rem' }}>
                        <div className="odyssey-card__meta-item">
                          <Clock className="odyssey-card__meta-icon" size={14} />
                          <span>Xử lý: {formatDate(app.processedAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredApplications.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <Pagination
              totalItems={filteredApplications.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Interview Detail Modal */}
      {showInterviewModal && interviewDetail && (
        <div className="interview-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowInterviewModal(false); }}>
          <div className="interview-detail-shell">
            {/* Header */}
            <div className="interview-detail-header">
              <div className="interview-detail-header__title">
                <div className="interview-detail-header__icon">
                  <Video size={18} />
                </div>
                <div>
                  <h3>Lịch Phỏng Vấn</h3>
                  <p>{interviewDetail.jobTitle}</p>
                </div>
              </div>
              <button className="interview-detail-close" onClick={() => setShowInterviewModal(false)}>✕</button>
            </div>

            {/* Body */}
            <div className="interview-detail-body">
              {/* Candidate Info */}
              <div className="interview-detail-card">
                <div className="interview-detail-card__row">
                  <span className="interview-detail-card__label">Ứng viên</span>
                  <span className="interview-detail-card__value">{interviewDetail.candidateName}</span>
                </div>
                <div className="interview-detail-card__row">
                  <span className="interview-detail-card__label">Email</span>
                  <span className="interview-detail-card__value">{interviewDetail.candidateEmail}</span>
                </div>
                {interviewDetail.interviewerName && (
                  <div className="interview-detail-card__row">
                    <span className="interview-detail-card__label">Người phỏng vấn</span>
                    <span className="interview-detail-card__value">{interviewDetail.interviewerName}</span>
                  </div>
                )}
              </div>

              {/* Schedule Info */}
              <div className="interview-detail-card">
                <div className="interview-detail-card__row">
                  <span className="interview-detail-card__label">Ngày &amp; Giờ</span>
                  <span className="interview-detail-card__value">
                    {new Date(interviewDetail.scheduledAt).toLocaleString('vi-VN', {
                      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="interview-detail-card__row">
                  <span className="interview-detail-card__label">Thời lượng</span>
                  <span className="interview-detail-card__value">{interviewDetail.durationMinutes} phút</span>
                </div>
                <div className="interview-detail-card__row">
                  <span className="interview-detail-card__label">Hình thức</span>
                  <span className="interview-detail-card__value">{interviewDetail.meetingType.replace(/_/g, ' ')}</span>
                </div>
                {interviewDetail.location && (
                  <div className="interview-detail-card__row">
                    <span className="interview-detail-card__label">Địa điểm</span>
                    <span className="interview-detail-card__value">{interviewDetail.location}</span>
                  </div>
                )}
              </div>

              {/* Meeting Link */}
              {interviewDetail.meetingLink && (
                <div className="interview-detail-join">
                  <button
                    className="interview-detail-join__btn"
                    onClick={() => window.open(interviewDetail.meetingLink!, '_blank')}
                  >
                    <ExternalLink size={16} />
                    <span>Tham gia phỏng vấn</span>
                    <span className="interview-detail-join__url">{interviewDetail.meetingLink}</span>
                  </button>
                </div>
              )}

              {/* SkillVerse Room */}
              {interviewDetail.skillverseRoomId && (
                <div className="interview-detail-join">
                  <button
                    className="interview-detail-join__btn interview-detail-join__btn--svroom"
                    onClick={() => window.open(interviewDetail.meetingLink!, '_blank')}
                  >
                    <Video size={16} />
                    <span>Tham gia SkillVerse Room</span>
                    <span className="interview-detail-join__url">{interviewDetail.skillverseRoomId}</span>
                  </button>
                </div>
              )}

              {/* Notes */}
              {interviewDetail.interviewNotes && (
                <div className="interview-detail-card">
                  <div className="interview-detail-card__label" style={{ marginBottom: '0.5rem' }}>Ghi chú từ nhà tuyển dụng</div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.84rem', lineHeight: 1.7, margin: 0 }}>{interviewDetail.interviewNotes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="interview-detail-footer">
              <button className="interview-detail-footer__cancel" onClick={() => setShowInterviewModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showInterviewModal && interviewLoading && (
        <div className="interview-detail-overlay">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#94a3b8' }}>
            <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} />
            <p>Đang tải chi tiết lịch phỏng vấn...</p>
          </div>
        </div>
      )}
    </OdysseyLayout>
  );
};

export default MyApplicationsPage;
