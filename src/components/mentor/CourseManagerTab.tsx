import React from 'react';
import { BookOpen, Users, Eye, Edit3, Upload, Trash2, AlertCircle, CheckCircle, Clock, XCircle, Layers } from 'lucide-react';
import '../../styles/CourseManagerTab.css';

export interface CourseCardAuthor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CourseCardThumb { id: number; url: string; fileName: string; }

export interface CourseCard {
  id: number;
  title: string;
  description: string;
  level: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLIC' | 'REJECTED' | 'ARCHIVED';
  author: CourseCardAuthor;
  thumbnail?: CourseCardThumb;
  lessons: unknown[];
  modules?: unknown[]; // Add modules array to display module count
  moduleCount?: number; // Add moduleCount field
  enrollmentCount: number;
  // commercial fields
  price?: number;
  currency?: string;
}

interface Props {
  courses: CourseCard[];
  loading: boolean;
  error: string | null;
  onCreateClick: () => void;
  onRetry: () => void;
  onView: (course: CourseCard) => void;
  onEdit: (course: CourseCard) => void;
  onSubmit: (courseId: number) => void;
  onDelete: (courseId: number) => void;
}

const statusIcon = (status: string) => {
  switch (status) {
    case 'PUBLIC': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'DRAFT': return <Edit3 className="w-4 h-4 text-blue-500" />;
    case 'ARCHIVED': return <XCircle className="w-4 h-4 text-gray-500" />;
    default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

const statusClass = (status: string) => {
  switch (status) {
    case 'PUBLIC': return 'cm-status cm-status-public';
    case 'PENDING': return 'cm-status cm-status-pending';
    case 'DRAFT': return 'cm-status cm-status-draft';
    case 'ARCHIVED': return 'cm-status cm-status-archived';
    default: return 'cm-status cm-status-archived';
  }
};

const CourseManagerTab: React.FC<Props> = ({ courses, loading, error, onCreateClick, onRetry, onView, onEdit, onSubmit, onDelete }) => {
  return (
    <div className="cm-wrapper">
      <div className="cm-header">
        <div className="cm-title">
          <h2>Khóa Học Của Tôi</h2>
          <p>Quản lý và tạo mới các khóa học</p>
        </div>
        <button className="cm-create-btn" onClick={onCreateClick}>
          <PlusIcon />
          Tạo Khóa Học Mới
        </button>
      </div>

      {loading && (
        <div className="cm-loading">
          <div className="spinner"></div>
          <p>Đang tải khóa học...</p>
        </div>
      )}

      {error && !loading && (
        <div className="cm-error">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="error-message">{error}</p>
          <button className="cm-retry" onClick={onRetry}>Thử lại</button>
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="cm-empty">
          <BookOpen className="w-16 h-16 text-gray-400" />
          <h3>Chưa có khóa học nào</h3>
          <p>Bắt đầu tạo khóa học đầu tiên của bạn!</p>
          <button className="cm-create-btn" onClick={onCreateClick}>
            <PlusIcon />
            Tạo Khóa Học Mới
          </button>
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="cm-grid">
          {courses.map(course => (
            <div key={course.id} className="cm-card">
              <div className="cm-thumb">
                {(() => {
                  const src = course.thumbnail?.url || (course as unknown as Record<string, unknown>).thumbnailUrl as string || '/images/default-course.jpg';
                  return src ? (
                    <img src={src} alt={course.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  ) : (
                    <div className="cm-thumb-placeholder">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  );
                })()}
                <div className={statusClass(course.status)}>
                  {statusIcon(course.status)}
                  <span>{course.status}</span>
                </div>
              </div>

              <div className="cm-content">
                <h3 className="cm-title-text">{course.title}</h3>
                <p className="cm-desc">{course.description}</p>

                <div className="cm-meta">
                  <div className="cm-level">
                    <span className="cm-level-badge">{course.level}</span>
                  </div>
                  <div className="cm-stats">
                    <div className="cm-stat">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollmentCount} học viên</span>
                    </div>
                    <div className="cm-stat">
                      <Layers className="w-4 h-4" />
                      <span>{course.moduleCount || course.lessons.length} chương</span>
                    </div>
                    {(course.price !== undefined && course.price !== null) && (
                      <div className="cm-stat">
                        <span className="cm-price">
                          {course.price.toLocaleString('vi-VN')} {course.currency || 'VND'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cm-actions">
                  <button className="cm-btn cm-view" onClick={() => onView(course)}>
                    <Eye className="w-4 h-4" />
                    Xem
                  </button>
                  <button className="cm-btn cm-edit" onClick={() => onEdit(course)}>
                    <Edit3 className="w-4 h-4" />
                    Sửa
                  </button>
                  {course.status === 'DRAFT' && (
                    <button className="cm-btn cm-submit" onClick={() => onSubmit(course.id)}>
                      <Upload className="w-4 h-4" />
                      Gửi Duyệt
                    </button>
                  )}
                  <button className="cm-btn cm-delete" onClick={() => onDelete(course.id)}>
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PlusIcon: React.FC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;

export default CourseManagerTab;


