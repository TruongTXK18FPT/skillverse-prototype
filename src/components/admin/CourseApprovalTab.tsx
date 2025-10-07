import React, { useState, useEffect } from 'react';
import {
  listPendingCourses,
  approveCourse,
  rejectCourse,
  getCourse
} from '../../services/courseService';
import {
  CourseDetailDTO,
  CourseSummaryDTO
} from '../../data/courseDTOs';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './CourseApprovalTab.css';

/**
 * CourseApprovalTab - Admin component for approving/rejecting pending courses
 */
export const CourseApprovalTab: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  // State
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('submittedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load pending courses
  const loadPendingCourses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await listPendingCourses(
        page,
        size,
        sortBy,
        sortOrder
      );

      setCourses(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error loading pending courses:', error);
      showError('Error', 'Failed to fetch pending courses');
    } finally {
      setLoading(false);
    }
  };

  // Load course details
  const loadCourseDetails = async (courseId: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const course = await getCourse(courseId);
      setSelectedCourse(course);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading course details:', error);
      showError('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject action
  const handleAction = async () => {
    if (!user || !selectedCourse) return;

    if (actionType === 'reject' && !actionReason.trim()) {
      showWarning('Warning', 'Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await approveCourse(selectedCourse.id, user.id);
        showSuccess('Success', `"${selectedCourse.title}" has been approved`);
      } else {
        await rejectCourse(selectedCourse.id, user.id, actionReason);
        showSuccess('Success', `"${selectedCourse.title}" has been rejected`);
      }

      // Reload courses and close modals
      await loadPendingCourses();
      setActionReason('');
      setShowActionModal(false);
      setShowDetailsModal(false);
    } catch (error) {
      console.error(`Error ${actionType}ing course:`, error);
      showError('Error', `Failed to ${actionType} the course`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open action modal
  const openActionModal = (type: 'approve' | 'reject') => {
    setActionType(type);
    setActionReason('');
    setShowActionModal(true);
  };

  // Initial load
  useEffect(() => {
    loadPendingCourses();
  }, [page, size, sortBy, sortOrder]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBadgeClass = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'badge-green';
      case 'INTERMEDIATE': return 'badge-yellow';
      case 'ADVANCED': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="course-approval-container">
      {/* Header with filters */}
      <div className="approval-header">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
          >
            <option value="submittedDate">Submitted Date</option>
            <option value="title">Title</option>
            <option value="authorName">Author</option>
          </select>

          <select
            className="filter-select"
            value={sortOrder}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>

          <button className="btn-primary" onClick={loadPendingCourses} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Statistics */}
        <div className="stats-group">
          <span className="stat-badge">Total Pending: {totalElements}</span>
          <span className="stat-badge">Page: {page + 1} / {totalPages || 1}</span>
        </div>
      </div>

      {/* Courses table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">No pending courses to review</div>
        ) : (
          <table className="courses-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Author</th>
                <th>Level</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-title-cell">
                      <strong>{course.title}</strong>
                      <small>{course.shortDescription || course.description}</small>
                    </div>
                  </td>
                  <td>{course.authorName || `${course.author.firstName} ${course.author.lastName}`}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(course.level)}`}>
                      {course.level}
                    </span>
                  </td>
                  <td>{formatDate(course.submittedDate)}</td>
                  <td>
                    <span className="badge badge-orange">{course.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => loadCourseDetails(course.id)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-icon btn-approve"
                        onClick={() => {
                          setSelectedCourse(course as any);
                          openActionModal('approve');
                        }}
                        title="Approve"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-icon btn-reject"
                        onClick={() => {
                          setSelectedCourse(course as any);
                          openActionModal('reject');
                        }}
                        title="Reject"
                      >
                        ✗
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-secondary"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            className="btn-secondary"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
          <select
            className="filter-select"
            value={size}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      )}

      {/* Course Details Modal */}
      {showDetailsModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Course Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>{selectedCourse.title}</h3>
              <p>{selectedCourse.shortDescription || selectedCourse.description}</p>

              <div className="course-meta">
                <span className={`badge ${getBadgeClass(selectedCourse.level)}`}>
                  {selectedCourse.level}
                </span>
                <span className="badge badge-orange">{selectedCourse.status}</span>
                <span>By {selectedCourse.authorName || `${selectedCourse.author.firstName} ${selectedCourse.author.lastName}`}</span>
              </div>

              {selectedCourse.thumbnailUrl && (
                <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.title} className="course-thumbnail" />
              )}

              <div className="course-description">
                <h4>Description:</h4>
                <p>{selectedCourse.description}</p>
              </div>

              <div className="course-stats">
                <div className="stat-item">
                  <strong>Lessons:</strong> {selectedCourse.lessons?.length || 0}
                </div>
                <div className="stat-item">
                  <strong>Assignments:</strong> {selectedCourse.assignments?.length || 0}
                </div>
                <div className="stat-item">
                  <strong>Quizzes:</strong> {selectedCourse.quizzes?.length || 0}
                </div>
                <div className="stat-item">
                  <strong>Coding Exercises:</strong> {selectedCourse.codingExercises?.length || 0}
                </div>
              </div>

              <div className="course-dates">
                <strong>Submitted:</strong> {formatDate(selectedCourse.submittedDate)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-success" onClick={() => openActionModal('approve')}>
                ✓ Approve
              </button>
              <button className="btn-danger" onClick={() => openActionModal('reject')}>
                ✗ Reject
              </button>
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{actionType === 'approve' ? 'Approve' : 'Reject'} Course</h2>
              <button className="modal-close" onClick={() => setShowActionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to {actionType} this course?</p>
              <strong>"{selectedCourse.title}"</strong>

              <div className="form-group">
                <label>
                  {actionType === 'reject' ? 'Reason (required):' : 'Comment (optional):'}
                </label>
                <textarea
                  className="form-textarea"
                  value={actionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionReason(e.target.value)}
                  placeholder={
                    actionType === 'reject'
                      ? 'Please provide a reason for rejection'
                      : 'Optional comment for approval'
                  }
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={actionType === 'approve' ? 'btn-success' : 'btn-danger'}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
              <button className="btn-secondary" onClick={() => setShowActionModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
