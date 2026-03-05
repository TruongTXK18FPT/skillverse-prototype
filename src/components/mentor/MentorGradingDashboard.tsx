import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  CheckSquare,
  Eye,
  Search,
  User
} from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { useAuth } from '../../context/AuthContext';
import { MentorSubmissionItemDTO, SubmissionStatus } from '../../data/assignmentDTOs';
import { getMentorSubmissionStats, getMentorSubmissionsPage } from '../../services/assignmentService';
import Pagination from '../shared/Pagination';
import '../../styles/MentorGradingDashboard.css';

interface MentorGradingDashboardProps {
  onPendingCountChange?: (count: number) => void;
}

const resolveLearnerName = (userName?: string | null, userId?: number) => {
  const trimmed = userName?.trim();
  if (trimmed && !/^null(?:\s+null)?$/i.test(trimmed)) {
    return trimmed;
  }
  return userId ? `Học viên #${userId}` : 'Học viên chưa cập nhật tên';
};

type DashboardFilter = 'ALL' | 'PENDING' | 'GRADED' | 'LATE';

const getWorkflowLabel = (status: SubmissionStatus) => {
  switch (status) {
    case SubmissionStatus.GRADED:
      return 'Đã chấm';
    case SubmissionStatus.LATE_PENDING:
    case SubmissionStatus.PENDING:
    default:
      return 'Chờ chấm';
  }
};

const MentorGradingDashboard: React.FC<MentorGradingDashboardProps> = ({ onPendingCountChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState<MentorSubmissionItemDTO[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    gradedCount: 0,
    lateCount: 0
  });
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const loadMentorSubmissions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const page = await getMentorSubmissionsPage(
        currentPage - 1,
        itemsPerPage,
        activeFilter,
        debouncedSearch
      );

      if (currentPage > 1 && page.content.length === 0 && page.totalElements > 0) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        return;
      }

      setSubmissions(page.content || []);
      setTotalItems(page.totalElements || 0);
    } catch (e) {
      console.error('Failed to load mentor submissions', e);
      setError('Không thể tải danh sách bài chấm');
      setSubmissions([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const loadMentorSubmissionStats = async () => {
    if (!user) return;

    try {
      const statsData = await getMentorSubmissionStats();
      setStats(statsData);
      onPendingCountChange?.(statsData.pendingCount ?? 0);
    } catch (e) {
      console.error('Failed to load mentor submission stats', e);
      setStats({
        totalCount: 0,
        pendingCount: 0,
        gradedCount: 0,
        lateCount: 0
      });
      onPendingCountChange?.(0);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedSearch]);

  useEffect(() => {
    if (user) {
      loadMentorSubmissions();
    }
  }, [user, currentPage, activeFilter, debouncedSearch]);

  useEffect(() => {
    if (user) {
      loadMentorSubmissionStats();
    }
  }, [user]);

  const pendingCount = stats.pendingCount;
  const gradedCount = stats.gradedCount;
  const lateCount = stats.lateCount;
  const visibleSubmissions = submissions;

  if (loading) {
    return (
      <div className="mentor-grading-loading">
        <MeowlKuruLoader size="small" text="" />
        <p>Đang tải danh sách bài chấm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mentor-grading-error">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p>{error}</p>
        <button onClick={loadMentorSubmissions} className="retry-btn">
          Thử lại
        </button>
      </div>
    );
  }

  if (stats.totalCount === 0) {
    return (
      <div className="mentor-grading-empty">
        <CheckCircle className="w-16 h-16" />
        <h3>Chưa có bài nộp nào</h3>
        <p>Danh sách này sẽ hiển thị cả bài chờ chấm và bài đã chấm gần nhất của học viên.</p>
      </div>
    );
  }

  const emptyStateByFilter =
    activeFilter === 'PENDING'
      ? {
          title: 'Không còn bài chờ chấm',
          description: 'Tất cả bài nộp mới nhất đã được chấm điểm.'
        }
      : activeFilter === 'GRADED'
        ? {
            title: 'Chưa có bài đã chấm',
            description: 'Các bài đã chấm sẽ xuất hiện ở đây để mentor xem lại hoặc chỉnh sửa.'
          }
        : activeFilter === 'LATE'
          ? {
              title: 'Không có bài nộp muộn',
              description: 'Danh sách hiện tại chưa có submission nào bị nộp quá hạn.'
            }
          : {
              title: 'Không tìm thấy bài nộp phù hợp',
              description: searchQuery
                ? 'Thử đổi từ khóa tìm kiếm hoặc chuyển bộ lọc khác.'
                : 'Danh sách submission sẽ xuất hiện ở đây khi học viên bắt đầu nộp bài.'
            };

  return (
    <div className="mentor-grading-dashboard">
      <div className="mentor-grading-hero">
        <div className="mentor-grading-hero__copy">
          <h2>Danh Sách Chấm Bài</h2>
          <p className="mentor-grading-subtitle">
            Theo dõi cùng lúc bài chờ chấm, bài đã chấm và submission nộp muộn trong một không gian thống nhất với trang chấm chi tiết.
          </p>
        </div>
        <div className="mentor-grading-hero__summary">
          <span className="mentor-grading-summary-chip mentor-grading-summary-chip--pending">
            <AlertCircle className="w-5 h-5" />
            {pendingCount} bài chờ chấm
          </span>
          <span className="mentor-grading-summary-chip mentor-grading-summary-chip--graded">
            <CheckSquare className="w-5 h-5" />
            {gradedCount} bài đã chấm
          </span>
        </div>
      </div>

      <div className="mentor-grading-stats">
        <button
          type="button"
          className={`mentor-grading-stat-card ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ALL')}
        >
          <FileText className="w-6 h-6" />
          <div className="mentor-grading-stat-card__content">
            <span className="mentor-grading-stat-card__value">{stats.totalCount}</span>
            <span className="mentor-grading-stat-card__label">Tất cả</span>
          </div>
        </button>
        <button
          type="button"
          className={`mentor-grading-stat-card ${activeFilter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveFilter('PENDING')}
        >
          <Clock className="w-6 h-6" />
          <div className="mentor-grading-stat-card__content">
            <span className="mentor-grading-stat-card__value">{pendingCount}</span>
            <span className="mentor-grading-stat-card__label">Chờ chấm</span>
          </div>
        </button>
        <button
          type="button"
          className={`mentor-grading-stat-card ${activeFilter === 'GRADED' ? 'active' : ''}`}
          onClick={() => setActiveFilter('GRADED')}
        >
          <CheckCircle className="w-6 h-6" />
          <div className="mentor-grading-stat-card__content">
            <span className="mentor-grading-stat-card__value">{gradedCount}</span>
            <span className="mentor-grading-stat-card__label">Đã chấm</span>
          </div>
        </button>
        <button
          type="button"
          className={`mentor-grading-stat-card ${activeFilter === 'LATE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('LATE')}
        >
          <AlertCircle className="w-6 h-6" />
          <div className="mentor-grading-stat-card__content">
            <span className="mentor-grading-stat-card__value">{lateCount}</span>
            <span className="mentor-grading-stat-card__label">Nộp muộn</span>
          </div>
        </button>
      </div>

      <div className="mentor-grading-toolbar">
        <div className="mentor-grading-search-box">
          <Search className="w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo học viên, khóa học, module hoặc bài tập..."
          />
        </div>
        <div className="mentor-grading-toolbar__meta">
          <span className="mentor-grading-toolbar__item">
            <User className="w-4 h-4" />
            {totalItems} mục phù hợp
          </span>
          {activeFilter !== 'ALL' && (
            <span className="mentor-grading-toolbar__item mentor-grading-toolbar__item--active">
              Bộ lọc: {activeFilter === 'PENDING' ? 'Chờ chấm' : activeFilter === 'GRADED' ? 'Đã chấm' : 'Nộp muộn'}
            </span>
          )}
        </div>
      </div>

      <div className="mentor-grading-table">
        {visibleSubmissions.length === 0 ? (
          <div className="mentor-grading-filter-empty">
            <CheckCircle className="w-10 h-10" />
            <h3>{emptyStateByFilter.title}</h3>
            <p>{emptyStateByFilter.description}</p>
          </div>
        ) : (
        <table className="mentor-submissions-table">
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Khóa học</th>
              <th>Module</th>
              <th>Bài tập</th>
              <th>Ngày nộp</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleSubmissions.map(({ submission, courseName, courseId, moduleId, moduleName, assignmentName, assignmentDueAt }) => (
              <tr key={submission.id}>
                <td>
                  <div className="student-info">
                    <span className="student-name">{resolveLearnerName(submission.userName, submission.userId)}</span>
                  </div>
                </td>
                <td>
                  <span className="course-name">{courseName}</span>
                </td>
                <td>
                  <span className="module-name">{moduleName}</span>
                </td>
                <td>
                  <span className="assignment-name">{assignmentName}</span>
                </td>
                <td>
                  <span className="submission-date">
                    {new Date(submission.submittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </td>
                <td>
                  <div className="submission-status-stack">
                    <span className={`submission-status ${submission.status === SubmissionStatus.GRADED ? 'graded' : 'pending'}`}>
                      {submission.status === SubmissionStatus.GRADED ? (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          {getWorkflowLabel(submission.status)}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          {getWorkflowLabel(submission.status)}
                        </>
                      )}
                    </span>
                    {assignmentDueAt && (
                      <span className={`submission-timing ${submission.isLate ? 'late' : 'on-time'}`}>
                        <Clock className="w-4 h-4" />
                        {submission.isLate ? 'Nộp muộn' : 'Trong hạn'}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    className={`mentor-grade-btn ${submission.status !== SubmissionStatus.GRADED ? 'mentor-grade-btn--primary' : ''}`}
                    onClick={() => navigate(`/mentor/assignments/${submission.assignmentId}/grade`, {
                      state: {
                        courseName,
                        courseId,
                        moduleName,
                        moduleId,
                        assignmentName,
                        fromGradingDashboard: true
                      }
                    })}
                  >
                    {submission.status === SubmissionStatus.GRADED ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Xem / chấm lại
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Mở khung chấm
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      {totalItems > 0 && (
        <Pagination
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default MentorGradingDashboard;
