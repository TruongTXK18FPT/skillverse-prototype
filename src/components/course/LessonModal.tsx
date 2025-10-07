import React, { useState, useEffect } from 'react';
import { X, FileText, Video, FileCode, CheckCircle } from 'lucide-react';
import { LessonCreateDTO, LessonUpdateDTO, LessonType } from '../../data/lessonDTOs';
import { createLesson, updateLesson } from '../../services/lessonService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/LessonModal.css';

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
        contentText: lessonToEdit.contentUrl, // Map old prop name
        videoUrl: lessonToEdit.videoUrl || '',
        durationSec: (lessonToEdit.duration || 0) * 60, // Convert minutes to seconds
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
        // Update existing lesson
        const updateData: LessonUpdateDTO = {
          title: formData.title,
          contentText: formData.contentText,
          videoUrl: formData.videoUrl || undefined,
          durationSec: formData.durationSec,
          orderIndex: formData.orderIndex,
        };
        await updateLesson(lessonToEdit.id, updateData, user.id);
      } else {
        // Create new lesson
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
    <div className="lesson-modal-overlay" onClick={onClose}>
      <div className="lesson-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="lesson-modal-header">
          <h2 className="lesson-modal-title">
            {lessonToEdit ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="lesson-modal-close-btn"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lesson-modal-form">
          {/* Lesson Type Selection */}
          <div className="lesson-form-section">
            <label className="lesson-form-label">
              Loại bài học <span className="required">*</span>
            </label>
            <div className="lesson-types-grid">
              {lessonTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`lesson-type-card ${
                    formData.type === type.value ? 'selected' : ''
                  }`}
                  style={
                    {
                      '--lesson-type-color': type.color,
                    } as React.CSSProperties
                  }
                  onClick={() => handleTypeSelect(type.value)}
                  disabled={loading || !!lessonToEdit}
                >
                  <div className="lesson-type-icon">{type.icon}</div>
                  <div className="lesson-type-content">
                    <h3 className="lesson-type-label">{type.label}</h3>
                    <p className="lesson-type-description">{type.description}</p>
                  </div>
                  {formData.type === type.value && (
                    <CheckCircle className="lesson-type-selected" size={20} />
                  )}
                </button>
              ))}
            </div>
            {lessonToEdit && (
              <p className="lesson-type-hint">
                Không thể thay đổi loại bài học khi chỉnh sửa
              </p>
            )}
          </div>

          {/* Title */}
          <div className="lesson-form-section">
            <label htmlFor="title" className="lesson-form-label">
              Tiêu đề bài học <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="lesson-form-input"
              placeholder="VD: Giới thiệu về React Hooks"
              disabled={loading}
              maxLength={200}
            />
          </div>

          {/* Content Text */}
          <div className="lesson-form-section">
            <label htmlFor="contentText" className="lesson-form-label">
              Nội dung <span className="required">*</span>
            </label>
            <textarea
              id="contentText"
              name="contentText"
              value={formData.contentText}
              onChange={handleInputChange}
              className="lesson-form-textarea"
              placeholder="Nội dung chi tiết của bài học..."
              rows={4}
              disabled={loading}
              maxLength={5000}
            />
            <p className="lesson-form-hint">
              Nội dung văn bản hoặc mô tả chi tiết của bài học
            </p>
          </div>

          {/* Video URL (for VIDEO type) */}
          {formData.type === 'VIDEO' && (
            <div className="lesson-form-section">
              <label htmlFor="videoUrl" className="lesson-form-label">
                URL Video <span className="required">*</span>
              </label>
              <input
                type="url"
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                className="lesson-form-input"
                placeholder="https://youtube.com/watch?v=..."
                disabled={loading}
              />
              <p className="lesson-form-hint">
                Hỗ trợ YouTube, Vimeo và các nền tảng video khác
              </p>
            </div>
          )}

          {/* Duration (for VIDEO type) */}
          {formData.type === LessonType.VIDEO && (
            <div className="lesson-form-section">
              <label htmlFor="durationSec" className="lesson-form-label">
                Thời lượng (giây)
              </label>
              <input
                type="number"
                id="durationSec"
                name="durationSec"
                value={formData.durationSec}
                onChange={handleInputChange}
                className="lesson-form-input"
                placeholder="0"
                min="0"
                disabled={loading}
              />
              <p className="lesson-form-hint">
                Thời lượng video tính bằng giây
              </p>
            </div>
          )}

          {/* Order Index */}
          <div className="lesson-form-section">
            <label htmlFor="orderIndex" className="lesson-form-label">
              Thứ tự
            </label>
            <input
              type="number"
              id="orderIndex"
              name="orderIndex"
              value={formData.orderIndex}
              onChange={handleInputChange}
              className="lesson-form-input"
              placeholder="0"
              min="0"
              disabled={loading}
            />
            <p className="lesson-form-hint">
              Thứ tự hiển thị của bài học trong khóa học
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="lesson-form-error">
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="lesson-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="lesson-modal-cancel-btn"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="lesson-modal-submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : lessonToEdit ? 'Cập nhật' : 'Tạo bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;
