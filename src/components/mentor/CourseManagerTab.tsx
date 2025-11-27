import React from 'react';
import {
  BookOpen,
  Users,
  Eye,
  Edit3,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Layers,
  Plus
} from 'lucide-react';
import { NeuralCard, NeuralButton } from '../learning-hud';
import '../../components/learning-hud/learning-hud.css';

export interface CourseCardAuthor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CourseCardThumb {
  id: number;
  url: string;
  fileName: string;
}

export interface CourseCard {
  id: number;
  title: string;
  description: string;
  level: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLIC' | 'REJECTED' | 'ARCHIVED';
  author: CourseCardAuthor;
  thumbnail?: CourseCardThumb;
  lessons: unknown[];
  modules?: unknown[];
  moduleCount?: number;
  enrollmentCount: number;
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
    case 'PUBLIC':
      return <CheckCircle className="w-4 h-4" style={{ color: 'var(--lhud-green)' }} />;
    case 'PENDING':
      return <Clock className="w-4 h-4" style={{ color: '#eab308' }} />;
    case 'DRAFT':
      return <Edit3 className="w-4 h-4" style={{ color: 'var(--lhud-cyan)' }} />;
    case 'ARCHIVED':
      return <XCircle className="w-4 h-4" style={{ color: 'var(--lhud-text-dim)' }} />;
    default:
      return <AlertCircle className="w-4 h-4" style={{ color: 'var(--lhud-text-dim)' }} />;
  }
};

const statusStyle = (status: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: '"Space Habitat", monospace',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    border: '1px solid',
  };

  switch (status) {
    case 'PUBLIC':
      return {
        ...baseStyle,
        background: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'var(--lhud-green)',
        color: 'var(--lhud-green)',
      };
    case 'PENDING':
      return {
        ...baseStyle,
        background: 'rgba(234, 179, 8, 0.1)',
        borderColor: '#eab308',
        color: '#eab308',
      };
    case 'DRAFT':
      return {
        ...baseStyle,
        background: 'rgba(6, 182, 212, 0.1)',
        borderColor: 'var(--lhud-cyan)',
        color: 'var(--lhud-cyan)',
      };
    case 'ARCHIVED':
      return {
        ...baseStyle,
        background: 'rgba(100, 116, 139, 0.1)',
        borderColor: 'var(--lhud-text-dim)',
        color: 'var(--lhud-text-dim)',
      };
    default:
      return baseStyle;
  }
};

const CourseManagerTab: React.FC<Props> = ({
  courses,
  loading,
  error,
  onCreateClick,
  onRetry,
  onView,
  onEdit,
  onSubmit,
  onDelete
}) => {
  return (
    <div style={{
      padding: '2rem',
      background: 'var(--lhud-deep-space)',
      minHeight: '100vh',
      color: 'var(--lhud-text-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--lhud-cyan)'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: 0,
            marginBottom: '0.5rem',
            color: 'var(--lhud-text-primary)'
          }}>
            COURSE DATABASE
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--lhud-text-secondary)',
            fontFamily: '"Space Habitat", monospace',
            letterSpacing: '0.5px',
            margin: 0
          }}>
            MANAGE AND CREATE COURSES
          </p>
        </div>
        <NeuralButton onClick={onCreateClick} variant="primary">
          <Plus size={18} />
          Create New Course
        </NeuralButton>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="learning-hud-loading" style={{ minHeight: '400px' }}>
          LOADING COURSE DATA
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <NeuralCard style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#ef4444'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
          <p style={{
            fontSize: '1.1rem',
            color: '#ef4444',
            marginBottom: '1.5rem'
          }}>
            {error}
          </p>
          <NeuralButton onClick={onRetry} variant="danger">
            Retry Connection
          </NeuralButton>
        </NeuralCard>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <NeuralCard style={{ textAlign: 'center', padding: '3rem' }}>
          <BookOpen size={64} style={{ color: 'var(--lhud-text-dim)', margin: '0 auto 1rem' }} />
          <h3 style={{
            fontSize: '1.5rem',
            color: 'var(--lhud-text-primary)',
            marginBottom: '0.5rem'
          }}>
            NO COURSES FOUND
          </h3>
          <p style={{
            color: 'var(--lhud-text-secondary)',
            marginBottom: '1.5rem',
            fontFamily: '"Space Habitat", monospace',
            letterSpacing: '0.5px'
          }}>
            INITIALIZE YOUR FIRST COURSE
          </p>
          <NeuralButton onClick={onCreateClick} variant="primary">
            <Plus size={18} />
            Create New Course
          </NeuralButton>
        </NeuralCard>
      )}

      {/* Courses Grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="learning-hud-grid">
          {courses.map((course) => (
            <NeuralCard key={course.id} glowOnHover>
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                height: '180px',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '1rem',
                position: 'relative',
                background: 'var(--lhud-space-alt)',
                border: '1px solid var(--lhud-border)'
              }}>
                {(() => {
                  const src =
                    course.thumbnail?.url ||
                    (course as unknown as Record<string, unknown>).thumbnailUrl as string ||
                    '/images/default-course.jpg';
                  return src ? (
                    <img
                      src={src}
                      alt={course.title}
                      style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <BookOpen size={48} style={{ color: 'var(--lhud-text-dim)' }} />
                    </div>
                  );
                })()}

                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  ...statusStyle(course.status)
                }}>
                  {statusIcon(course.status)}
                  <span>{course.status}</span>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: 'var(--lhud-text-primary)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.3
                }}>
                  {course.title}
                </h3>

                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--lhud-text-secondary)',
                  marginBottom: '1rem',
                  lineHeight: 1.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {course.description}
                </p>

                {/* Meta Info */}
                <div style={{
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--lhud-border)'
                }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: 'var(--lhud-cyan-dim)',
                    border: '1px solid var(--lhud-cyan)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--lhud-cyan)',
                    fontFamily: '"Space Habitat", monospace',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem'
                  }}>
                    {course.level}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--lhud-text-secondary)',
                      fontSize: '0.85rem'
                    }}>
                      <Users size={16} />
                      <span>{course.enrollmentCount} students</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--lhud-text-secondary)',
                      fontSize: '0.85rem'
                    }}>
                      <Layers size={16} />
                      <span>{course.moduleCount || course.lessons.length} modules</span>
                    </div>

                    {course.price !== undefined && course.price !== null && (
                      <div style={{
                        color: 'var(--lhud-green)',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}>
                        {course.price.toLocaleString('vi-VN')} {course.currency || 'VND'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <NeuralButton
                    onClick={() => onView(course)}
                    variant="secondary"
                    className="flex-1"
                    style={{ minWidth: '0' }}
                  >
                    <Eye size={16} />
                    View
                  </NeuralButton>

                  <NeuralButton
                    onClick={() => onEdit(course)}
                    variant="primary"
                    className="flex-1"
                    style={{ minWidth: '0' }}
                  >
                    <Edit3 size={16} />
                    Edit
                  </NeuralButton>

                  {course.status === 'DRAFT' && (
                    <NeuralButton
                      onClick={() => onSubmit(course.id)}
                      variant="success"
                      style={{ width: '100%' }}
                    >
                      <Upload size={16} />
                      Submit for Approval
                    </NeuralButton>
                  )}

                  <NeuralButton
                    onClick={() => onDelete(course.id)}
                    variant="danger"
                    style={{ width: '100%' }}
                  >
                    <Trash2 size={16} />
                    Delete Course
                  </NeuralButton>
                </div>
              </div>
            </NeuralCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseManagerTab;


