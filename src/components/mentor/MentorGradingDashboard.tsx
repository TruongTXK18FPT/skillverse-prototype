import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Eye,
  Search,
  User,
  ChevronDown,
  ChevronRight,
  BookOpen
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

const isAiReadonlySubmission = (submission: MentorSubmissionItemDTO['submission']) => submission.isAiGraded === true;

const isFinalGradedSubmission = (submission: MentorSubmissionItemDTO['submission']) =>
  isAiReadonlySubmission(submission)
  || submission.status === SubmissionStatus.GRADED
  || submission.status === SubmissionStatus.AI_COMPLETED;

const getWorkflowLabel = (submission: MentorSubmissionItemDTO['submission']) => {
  if (isAiReadonlySubmission(submission)) {
    return 'AI đã chấm';
  }

  switch (submission.status) {
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupsReady, setGroupsReady] = useState(false);

  const STORAGE_KEY = user ? `mentor-grading-collapsed-${user.id}` : null;

  // Load persisted accordion state from localStorage on mount
  useEffect(() => {
    if (!groupsReady && submissions.length > 0) {
      let initialCollapsed: Set<string>;
      if (STORAGE_KEY) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            initialCollapsed = new Set(JSON.parse(stored) as string[]);
            // Ensure only existing group keys are kept
            initialCollapsed = new Set(
              [...initialCollapsed].filter(k => k in groupedSubmissions)
            );
          } else {
            initialCollapsed = new Set(Object.keys(groupedSubmissions));
          }
        } catch {
          initialCollapsed = new Set(Object.keys(groupedSubmissions));
        }
      } else {
        initialCollapsed = new Set(Object.keys(groupedSubmissions));
      }
      setCollapsedGroups(initialCollapsed);
      setGroupsReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsReady, submissions.length]);

  // Persist accordion state to localStorage whenever it changes
  useEffect(() => {
    if (groupsReady && STORAGE_KEY) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsedGroups]));
      } catch {
        // localStorage not available or quota exceeded — ignore
      }
    }
  }, [collapsedGroups, groupsReady, STORAGE_KEY]);

  // Auto-collapse groups that have no matching items when filter changes
  useEffect(() => {
    if (!groupsReady || submissions.length === 0) return;
    const groupKeys = Object.keys(groupedSubmissions);
    if (groupKeys.length === 0) return;

    // Determine which groups have no items matching the current filter
    const emptyGroups = groupKeys.filter(moduleKey => {
      const group = groupedSubmissions[moduleKey];
      return Object.values(group.assignments).every(asg =>
        asg.items.length === 0
      );
    });

    setCollapsedGroups(prev => {
      const next = new Set(prev);
      emptyGroups.forEach(k => next.add(k));
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, debouncedSearch, submissions.length]);

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

  // Group submissions by module -> assignment for collapsible display
  const groupedSubmissions = useMemo(() => {
    const groups: Record<string, {
      moduleName: string;
      moduleId: number;
      courseName: string;
      courseId: number;
      assignments: Record<number, {
        assignmentName: string;
        assignmentDueAt?: string;
        items: typeof submissions;
      }>;
    }> = {};

    for (const item of visibleSubmissions) {
      const moduleKey = `${item.courseId}-${item.moduleId}`;
      if (!groups[moduleKey]) {
        groups[moduleKey] = {
          moduleName: item.moduleName,
          moduleId: item.moduleId,
          courseName: item.courseName,
          courseId: item.courseId,
          assignments: {},
        };
      }
      const asgKey = `${item.submission.assignmentId}`;
      if (!groups[moduleKey].assignments[asgKey]) {
        groups[moduleKey].assignments[asgKey] = {
          assignmentName: item.assignmentName,
          assignmentDueAt: item.assignmentDueAt,
          items: [],
        };
      }
      groups[moduleKey].assignments[asgKey].items.push(item);
    }
    return groups;
  }, [visibleSubmissions]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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
          <div className="mentor-grading-table">
            <div className="mentor-grading-filter-empty">
              <CheckCircle className="w-10 h-10" />
              <h3>{emptyStateByFilter.title}</h3>
              <p>{emptyStateByFilter.description}</p>
            </div>
          </div>
        ) : (
          <div className="grading-group-list">
            {Object.entries(groupedSubmissions).map(([moduleKey, group]) => {
              const modulePending = Object.values(group.assignments).reduce(
                (sum, a) => sum + a.items.filter(i => !isFinalGradedSubmission(i.submission)).length, 0
              );
              const moduleGraded = Object.values(group.assignments).reduce(
                (sum, a) => sum + a.items.filter(i => isFinalGradedSubmission(i.submission)).length, 0
              );
              const totalAssignments = Object.keys(group.assignments).length;
              const isCollapsed = collapsedGroups.has(moduleKey);
              const allAssignments = Object.entries(group.assignments);

              return (
                <div key={moduleKey} className="grading-group">
                  {/* Module header — collapsible */}
                  <div
                    className={`grading-group__header ${isCollapsed ? 'grading-group__header--collapsed' : ''}`}
                    onClick={() => toggleGroup(moduleKey)}
                  >
                    <div className="grading-group__header-left">
                      {isCollapsed
                        ? <ChevronRight size={18} />
                        : <ChevronDown size={18} />}
                      <BookOpen size={16} className="grading-group__icon" />
                      <span className="grading-group__module-name">{group.moduleName}</span>
                      <span className="grading-group__course-name">{group.courseName}</span>
                    </div>
                    <div className="grading-group__header-right">
                      {modulePending > 0 && (
                        <span className="grading-group-badge grading-group-badge--pending">
                          {modulePending} chờ chấm
                        </span>
                      )}
                      {moduleGraded > 0 && (
                        <span className="grading-group-badge grading-group-badge--graded">
                          {moduleGraded} đã chấm
                        </span>
                      )}
                      <span className="grading-group-meta">
                        {totalAssignments} bài tập · {Object.values(group.assignments).reduce((s, a) => s + a.items.length, 0)} bài nộp
                      </span>
                    </div>
                  </div>

                  {/* Assignment rows — hidden when collapsed */}
                  {!isCollapsed && allAssignments.map(([asgKey, asgData]) => {
                    const asgPending = asgData.items.filter(i => !isFinalGradedSubmission(i.submission)).length;
                    const asgGraded = asgData.items.filter(i => isFinalGradedSubmission(i.submission)).length;
                    return (
                      <div key={asgKey} className="grading-assignment-row">
                        <div className="grading-assignment-row__header">
                          <FileText size={14} className="grading-assignment-row__icon" />
                          <span className="grading-assignment-row__name">{asgData.assignmentName}</span>
                          {asgPending > 0 && (
                            <span className="grading-group-badge grading-group-badge--pending">{asgPending} chờ</span>
                          )}
                          {asgGraded > 0 && (
                            <span className="grading-group-badge grading-group-badge--graded">{asgGraded} đã</span>
                          )}
                          <span className="grading-assignment-row__count">{asgData.items.length} bài nộp</span>
                        </div>
                        <table className="mentor-submissions-table grading-assignment-table">
                          <thead>
                            <tr>
                              <th>Học viên</th>
                              <th>Ngày nộp</th>
                              <th>Trạng thái</th>
                              <th>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asgData.items.map((item) => (
                              <tr key={item.submission.id}>
                                <td>
                                  <div className="student-info">
                                    <span className="student-name">{resolveLearnerName(item.submission.userName, item.submission.userId)}</span>
                                  </div>
                                </td>
                                <td>
                                  {item.submission.submittedAt
                                    ? new Date(item.submission.submittedAt).toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })
                                    : '-'}
                                </td>
                                <td>
                                  <div className="submission-status-stack">
                                    <span className={`submission-status ${isFinalGradedSubmission(item.submission) ? 'graded' : 'pending'}`}>
                                      {isFinalGradedSubmission(item.submission) ? (
                                        <>
                                          <CheckSquare className="w-4 h-4" />
                                          {getWorkflowLabel(item.submission)}
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle className="w-4 h-4" />
                                          {getWorkflowLabel(item.submission)}
                                        </>
                                      )}
                                    </span>
                                    {item.assignmentDueAt && (
                                      <span className={`submission-timing ${item.submission.isLate ? 'late' : 'on-time'}`}>
                                        <Clock className="w-4 h-4" />
                                        {item.submission.isLate ? 'Nộp muộn' : 'Trong hạn'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  {item.submission.isAiGraded === true ? (
                                    <button
                                      className="mentor-grade-btn mentor-grade-btn--readonly"
                                      onClick={() => navigate(`/mentor/assignments/${item.submission.assignmentId}/grade`, {
                                        state: {
                                          courseName: item.courseName,
                                          courseId: item.courseId,
                                          moduleName: item.moduleName,
                                          moduleId: item.moduleId,
                                          assignmentName: item.assignmentName,
                                          fromGradingDashboard: true
                                        }
                                      })}
                                      title="Xem kết quả AI"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Xem kết quả
                                    </button>
                                  ) : item.submission.status === SubmissionStatus.GRADED || item.submission.status === SubmissionStatus.AI_COMPLETED ? (
                                    <button
                                      className="mentor-grade-btn"
                                      onClick={() => navigate(`/mentor/assignments/${item.submission.assignmentId}/grade`, {
                                        state: {
                                          courseName: item.courseName,
                                          courseId: item.courseId,
                                          moduleName: item.moduleName,
                                          moduleId: item.moduleId,
                                          assignmentName: item.assignmentName,
                                          fromGradingDashboard: true
                                        }
                                      })}
                                      title="Xem hoặc chấm lại bài đã chấm"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Xem / chấm lại
                                    </button>
                                  ) : (
                                    <button
                                      className="mentor-grade-btn mentor-grade-btn--primary"
                                      onClick={() => navigate(`/mentor/assignments/${item.submission.assignmentId}/grade`, {
                                        state: {
                                          courseName: item.courseName,
                                          courseId: item.courseId,
                                          moduleName: item.moduleName,
                                          moduleId: item.moduleId,
                                          assignmentName: item.assignmentName,
                                          fromGradingDashboard: true
                                        }
                                      })}
                                      title="Mở khung chấm"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Mở khung chấm
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
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
