import React, { useState, useEffect } from 'react';
import { X, FileText, Video, FileCode, CheckCircle } from 'lucide-react';
import { LessonCreateDTO, LessonUpdateDTO, LessonType } from '../../data/lessonDTOs';
import { createLesson, updateLesson } from '../../services/lessonService';
import { useAuth } from '../../context/AuthContext';
import AttachmentManager from './AttachmentManager';
import { NeuralCard, NeuralButton } from '../learning-hud';
import '../../components/learning-hud/learning-hud.css';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  lessonToEdit?: {
    id: number;
    title: string;
    description: string;
    type: LessonType;
    contentUrl: string;
    videoUrl?: string;
    duration?: number;
    orderIndex: number;
  };
  onSuccess: () => void;
}

const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  lessonToEdit,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    title: string;
    type: LessonType;
    contentText: string;
    videoUrl: string;
    durationSec: number;
    orderIndex: number;
  }>({
    title: '',
    type: LessonType.VIDEO,
    contentText: '',
    videoUrl: '',
    durationSec: 0,
    orderIndex: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lessonToEdit) {
      setFormData({
        title: lessonToEdit.title,
        type: lessonToEdit.type,
        contentText: lessonToEdit.contentUrl,
        videoUrl: lessonToEdit.videoUrl || '',
        durationSec: (lessonToEdit.duration || 0) * 60,
        orderIndex: lessonToEdit.orderIndex,
      });
    } else {
      setFormData({
        title: '',
        type: LessonType.VIDEO,
        contentText: '',
        videoUrl: '',
        durationSec: 0,
        orderIndex: 0,
      });
    }
    setError(null);
  }, [lessonToEdit, isOpen]);

  const lessonTypes = [
    {
      value: 'VIDEO' as LessonType,
      label: 'Video Lesson',
      description: 'Video tutorial or lecture',
      icon: <Video size={24} />,
      color: '#ef4444',
    },
    {
      value: 'DOCUMENT' as LessonType,
      label: 'Document',
      description: 'Reading material or PDF',
      icon: <FileText size={24} />,
      color: '#3b82f6',
    },
    {
      value: 'CODE' as LessonType,
      label: 'Code Example',
      description: 'Code snippets and examples',
      icon: <FileCode size={24} />,
      color: '#10b981',
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'durationSec' || name === 'orderIndex' ? Number(value) : value,
    }));
  };

  const handleTypeSelect = (type: LessonType) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Tiêu đề bài học là bắt buộc');
      return false;
    }
    if (!formData.contentText.trim()) {
      setError('Nội dung bài học là bắt buộc');
      return false;
    }
    if (formData.type === LessonType.VIDEO && !formData.videoUrl.trim()) {
      setError('URL video là bắt buộc cho bài học video');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (lessonToEdit) {
        const updateData: LessonUpdateDTO = {
          title: formData.title,
          contentText: formData.contentText,
          videoUrl: formData.videoUrl || undefined,
          durationSec: formData.durationSec,
          orderIndex: formData.orderIndex,
        };
        await updateLesson(lessonToEdit.id, updateData, user.id);
      } else {
        const createData: LessonCreateDTO = {
          title: formData.title,
          type: formData.type,
          contentText: formData.contentText,
          videoUrl: formData.videoUrl || undefined,
          durationSec: formData.durationSec,
          orderIndex: formData.orderIndex,
        };
        await createLesson(moduleId, createData, user.id);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu bài học');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <NeuralCard
        style={{
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'learning-hud-fade-in 0.3s ease-out'
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--lhud-border)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--lhud-text-primary)',
            margin: 0
          }}>
            {lessonToEdit ? 'CHỈNH SỬA BÀI HỌC' : 'TẠO BÀI HỌC MỚI'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--lhud-text-dim)',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--lhud-cyan)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--lhud-text-dim)'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            {/* Lesson Type Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: 'Space Habitat, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--lhud-cyan)',
                marginBottom: '0.75rem'
              }}>
                Loại bài học <span style={{ color: 'var(--lhud-red)' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                {lessonTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    disabled={loading || !!lessonToEdit}
                    style={{
                      background: formData.type === type.value
                        ? `${type.color}15`
                        : 'var(--lhud-surface)',
                      border: formData.type === type.value
                        ? `1px solid ${type.color}`
                        : '1px solid var(--lhud-border)',
                      padding: '1rem',
                      borderRadius: '8px',
                      cursor: loading || !!lessonToEdit ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      opacity: loading || !!lessonToEdit ? 0.5 : 1,
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && !lessonToEdit) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = type.color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && !lessonToEdit) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        if (formData.type !== type.value) {
                          e.currentTarget.style.borderColor = 'var(--lhud-border)';
                        }
                      }
                    }}
                  >
                    <div style={{ color: type.color }}>
                      {type.icon}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--lhud-text-primary)',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {type.label}
                      </h3>
                      <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--lhud-text-dim)',
                        margin: 0
                      }}>
                        {type.description}
                      </p>
                    </div>
                    {formData.type === type.value && (
                      <CheckCircle
                        size={20}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          color: type.color
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              {lessonToEdit && (
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--lhud-text-dim)',
                  marginTop: '0.5rem',
                  marginBottom: 0
                }}>
                  Không thể thay đổi loại bài học khi chỉnh sửa
                </p>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="title" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: 'Space Habitat, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--lhud-cyan)',
                marginBottom: '0.5rem'
              }}>
                Tiêu đề bài học <span style={{ color: 'var(--lhud-red)' }}>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="VD: Giới thiệu về React Hooks"
                disabled={loading}
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--lhud-surface)',
                  border: '1px solid var(--lhud-border)',
                  borderRadius: '6px',
                  color: 'var(--lhud-text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
              />
            </div>

            {/* Content Text */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="contentText" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: 'Space Habitat, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--lhud-cyan)',
                marginBottom: '0.5rem'
              }}>
                Nội dung <span style={{ color: 'var(--lhud-red)' }}>*</span>
              </label>
              <textarea
                id="contentText"
                name="contentText"
                value={formData.contentText}
                onChange={handleInputChange}
                placeholder="Nội dung chi tiết của bài học..."
                rows={4}
                disabled={loading}
                maxLength={5000}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--lhud-surface)',
                  border: '1px solid var(--lhud-border)',
                  borderRadius: '6px',
                  color: 'var(--lhud-text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--lhud-text-dim)',
                marginTop: '0.5rem',
                marginBottom: 0
              }}>
                Nội dung văn bản hoặc mô tả chi tiết của bài học
              </p>
            </div>

            {/* Video URL (for VIDEO type) */}
            {formData.type === 'VIDEO' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="videoUrl" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontFamily: 'Space Habitat, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--lhud-cyan)',
                  marginBottom: '0.5rem'
                }}>
                  URL Video <span style={{ color: 'var(--lhud-red)' }}>*</span>
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--lhud-surface)',
                    border: '1px solid var(--lhud-border)',
                    borderRadius: '6px',
                    color: 'var(--lhud-text-primary)',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--lhud-text-dim)',
                  marginTop: '0.5rem',
                  marginBottom: 0
                }}>
                  Hỗ trợ YouTube, Vimeo và các nền tảng video khác
                </p>
              </div>
            )}

            {/* Duration (for VIDEO type) */}
            {formData.type === LessonType.VIDEO && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="durationSec" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontFamily: 'Space Habitat, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--lhud-cyan)',
                  marginBottom: '0.5rem'
                }}>
                  Thời lượng (giây)
                </label>
                <input
                  type="number"
                  id="durationSec"
                  name="durationSec"
                  value={formData.durationSec}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--lhud-surface)',
                    border: '1px solid var(--lhud-border)',
                    borderRadius: '6px',
                    color: 'var(--lhud-text-primary)',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--lhud-text-dim)',
                  marginTop: '0.5rem',
                  marginBottom: 0
                }}>
                  Thời lượng video tính bằng giây
                </p>
              </div>
            )}

            {/* Order Index */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="orderIndex" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: 'Space Habitat, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--lhud-cyan)',
                marginBottom: '0.5rem'
              }}>
                Thứ tự
              </label>
              <input
                type="number"
                id="orderIndex"
                name="orderIndex"
                value={formData.orderIndex}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--lhud-surface)',
                  border: '1px solid var(--lhud-border)',
                  borderRadius: '6px',
                  color: 'var(--lhud-text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--lhud-text-dim)',
                marginTop: '0.5rem',
                marginBottom: 0
              }}>
                Thứ tự hiển thị của bài học trong khóa học
              </p>
            </div>

            {/* Attachments for READING lessons */}
            {lessonToEdit && formData.type === LessonType.READING && (
              <AttachmentManager
                lessonId={lessonToEdit.id}
                editable={true}
              />
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--lhud-red)',
                borderRadius: '6px',
                color: 'var(--lhud-red)',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                <span>{error}</span>
              </div>
            )}

            {/* Form Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              paddingTop: '1rem',
              borderTop: '1px solid var(--lhud-border)'
            }}>
              <NeuralButton
                type="button"
                onClick={onClose}
                variant="secondary"
                disabled={loading}
              >
                Hủy
              </NeuralButton>
              <NeuralButton
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : lessonToEdit ? 'Cập nhật' : 'Tạo bài học'}
              </NeuralButton>
            </div>
          </form>
        </div>
      </NeuralCard>
    </div>
  );
};

export default LessonModal;