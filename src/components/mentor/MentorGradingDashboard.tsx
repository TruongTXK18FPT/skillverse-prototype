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
import { getAllMentorSubmissions } from '../../services/assignmentService';
import '../../styles/MentorGradingDashboard.css';

interface Course {
  id: number;
  title: string;
  [key: string]: any;
}

interface MentorGradingDashboardProps {
  courses: Course[];
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

const MentorGradingDashboard: React.FC<MentorGradingDashboardProps> = ({ courses, onPendingCountChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState<MentorSubmissionItemDTO[]>([]);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMentorSubmissions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const items = await getAllMentorSubmissions();
      setSubmissions(items);
      onPendingCountChange?.(
        items.filter(({ submission }) => submission.status !== SubmissionStatus.GRADED).length
      );
    } catch (e) {
      console.error('Failed to load mentor submissions', e);
      setError('Không thể tải danh sách bài chấm');
      onPendingCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courses.length > 0) {
      loadMentorSubmissions();
    }
  }, [courses, user]);

  const pendingCount = submissions.filter(({ submission }) => submission.status !== SubmissionStatus.GRADED).length;
  const gradedCount = submissions.length - pendingCount;
  const lateCount = submissions.filter(({ submission }) => submission.isLate).length;
  const visibleSubmissions = submissions.filter(({ submission }) => {
    if (activeFilter === 'PENDING') {
      return submission.status !== SubmissionStatus.GRADED;
    }
    if (activeFilter === 'GRADED') {
      return submission.status === SubmissionStatus.GRADED;
    }
    if (activeFilter === 'LATE') {
      return submission.isLate;
    }
    return true;
  }).filter(({ submission, courseName, moduleName, assignmentName }) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      resolveLearnerName(submission.userName, submission.userId),
      courseName,
      moduleName,
      assignmentName
    ].some((value) => value?.toLowerCase().includes(query));
  });

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

  if (submissions.length === 0) {
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
            <span className="mentor-grading-stat-card__value">{submissions.length}</span>
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
            {visibleSubmissions.length} mục đang hiển thị
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
    </div>
  );
};

export default MentorGradingDashboard;
