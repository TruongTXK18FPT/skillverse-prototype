import React, { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, Type, CheckCircle, Calendar } from 'lucide-react';
import { AssignmentCreateDTO, AssignmentUpdateDTO, SubmissionType } from '../../data/assignmentDTOs';
import { createAssignment, updateAssignment } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ModalsEnhanced.css';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  assignmentToEdit?: {
    id: number;
    title: string;
    description: string;
    submissionType: SubmissionType;
    maxScore: number;
    dueAt?: string;
  };
  onSuccess: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  assignmentToEdit,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    submissionType: SubmissionType;
    maxScore: number;
    dueAt: string;
  }>({
    title: '',
    description: '',
    submissionType: SubmissionType.TEXT,
    maxScore: 100,
    dueAt: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentToEdit) {
      setFormData({
        title: assignmentToEdit.title,
        description: assignmentToEdit.description,
        submissionType: assignmentToEdit.submissionType,
        maxScore: assignmentToEdit.maxScore,
        dueAt: assignmentToEdit.dueAt
          ? new Date(assignmentToEdit.dueAt).toISOString().slice(0, 16)
          : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        submissionType: SubmissionType.TEXT,
        maxScore: 100,
        dueAt: '',
      });
    }
    setError(null);
  }, [assignmentToEdit, isOpen]);

  const submissionTypes = [
    {
      value: SubmissionType.TEXT,
      label: 'Văn bản',
      description: 'Sinh viên nộp bài bằng văn bản',
      icon: <Type size={24} />,
      color: '#3b82f6',
    },
    {
      value: SubmissionType.FILE,
      label: 'Tệp tin',
      description: 'Sinh viên upload file',
      icon: <FileText size={24} />,
      color: '#10b981',
    },
    {
      value: SubmissionType.LINK,
      label: 'Liên kết',
      description: 'Sinh viên gửi link URL',
      icon: <LinkIcon size={24} />,
      color: '#f59e0b',
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxScore' ? Number(value) : value,
    }));
  };

  const handleTypeSelect = (type: SubmissionType) => {
    setFormData((prev) => ({ ...prev, submissionType: type }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Tiêu đề bài tập là bắt buộc');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Mô tả bài tập là bắt buộc');
      return false;
    }
    if (formData.maxScore <= 0) {
      setError('Điểm tối đa phải lớn hơn 0');
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
      if (assignmentToEdit) {
        // Update existing assignment
        const updateData: AssignmentUpdateDTO = {
          title: formData.title,
          description: formData.description,
          submissionType: formData.submissionType,
          maxScore: formData.maxScore,
          dueAt: formData.dueAt || undefined,
        };
        await updateAssignment(assignmentToEdit.id, updateData, user.id);
      } else {
        // Create new assignment
        const createData: AssignmentCreateDTO = {
          title: formData.title,
          description: formData.description,
          submissionType: formData.submissionType,
          maxScore: formData.maxScore,
          dueAt: formData.dueAt || undefined,
        };
        await createAssignment(moduleId, createData, user.id);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu bài tập');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="module-modal-overlay" onClick={onClose}>
      <div className="module-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="module-modal-header">
          <h2 className="module-modal-title">
            {assignmentToEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="module-modal-close-btn"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="module-modal-form">
          {/* Submission Type Selection */}
          <div className="module-form-section">
            <label className="module-form-label">
              Loại nộp bài <span className="required">*</span>
            </label>
            <div className="lesson-type-selector">
              {submissionTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${
                    formData.submissionType === type.value ? 'selected' : ''
                  }`}
                  style={
                    {
                      '--lesson-type-color': type.color,
                    } as React.CSSProperties
                  }
                  onClick={() => handleTypeSelect(type.value)}
                  disabled={loading}
                >
                  <div className="type-option-icon">{type.icon}</div>
                  <div className="type-option-content">
                    <h3 className="type-option-label">{type.label}</h3>
                    <p className="type-option-description">{type.description}</p>
                  </div>
                  {formData.submissionType === type.value && (
                    <CheckCircle className="lesson-type-selected" size={20} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="module-form-section">
            <label htmlFor="title" className="module-form-label">
              Tiêu đề bài tập <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="module-form-input"
              placeholder="VD: Bài tập về React Components"
              disabled={loading}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="module-form-section">
            <label htmlFor="description" className="module-form-label">
              Mô tả và yêu cầu <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="module-form-textarea"
              placeholder="Mô tả chi tiết yêu cầu của bài tập..."
              rows={6}
              disabled={loading}
              maxLength={5000}
            />
            <p className="form-hint">
              Mô tả chi tiết về yêu cầu, tiêu chí chấm điểm và hướng dẫn nộp bài
            </p>
          </div>

          {/* Max Score and Due Date Row */}
          <div className="assignment-form-row">
            {/* Max Score */}
            <div className="module-form-section">
              <label htmlFor="maxScore" className="module-form-label">
                Điểm tối đa <span className="required">*</span>
              </label>
              <input
                type="number"
                id="maxScore"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleInputChange}
                className="module-form-input"
                placeholder="100"
                min="1"
                max="1000"
                disabled={loading}
              />
            </div>

            {/* Due Date */}
            <div className="module-form-section">
              <label htmlFor="dueAt" className="module-form-label">
                <Calendar size={16} />
                Hạn nộp bài
              </label>
              <input
                type="datetime-local"
                id="dueAt"
                name="dueAt"
                value={formData.dueAt}
                onChange={handleInputChange}
                className="module-form-input"
                disabled={loading}
              />
              <p className="form-hint">
                Không bắt buộc - để trống nếu không có hạn
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="module-error-message">
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="module-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="lesson-form-btn lesson-form-btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="lesson-form-btn lesson-form-btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : assignmentToEdit ? 'Cập nhật' : 'Tạo bài tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
