import React, { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, Type, CheckCircle, Calendar } from 'lucide-react';
import { AssignmentCreateDTO, AssignmentUpdateDTO, SubmissionType } from '../../data/assignmentDTOs';
import { createAssignment, updateAssignment } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';
import { NeuralCard, NeuralButton } from '../learning-hud';
import '../../components/learning-hud/learning-hud.css';

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
        const updateData: AssignmentUpdateDTO = {
          title: formData.title,
          description: formData.description,
          submissionType: formData.submissionType,
          maxScore: formData.maxScore,
          dueAt: formData.dueAt || undefined,
        };
        await updateAssignment(assignmentToEdit.id, updateData, user.id);
      } else {
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
        onClick={(e) => e.stopPropagation()}
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
            {assignmentToEdit ? 'CHỈNH SỬA BÀI TẬP' : 'TẠO BÀI TẬP MỚI'}
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
            {/* Submission Type Selection */}
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
                Loại nộp bài <span style={{ color: 'var(--lhud-red)' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem'
              }}>
                {submissionTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    disabled={loading}
                    style={{
                      background: formData.submissionType === type.value
                        ? `${type.color}15`
                        : 'var(--lhud-surface)',
                      border: formData.submissionType === type.value
                        ? `1px solid ${type.color}`
                        : '1px solid var(--lhud-border)',
                      padding: '1rem',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.5 : 1,
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = type.color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        if (formData.submissionType !== type.value) {
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
                    {formData.submissionType === type.value && (
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
                Tiêu đề bài tập <span style={{ color: 'var(--lhud-red)' }}>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="VD: Bài tập về React Components"
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

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="description" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: 'Space Habitat, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--lhud-cyan)',
                marginBottom: '0.5rem'
              }}>
                Mô tả và yêu cầu <span style={{ color: 'var(--lhud-red)' }}>*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả chi tiết yêu cầu của bài tập..."
                rows={6}
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
                Mô tả chi tiết về yêu cầu, tiêu chí chấm điểm và hướng dẫn nộp bài
              </p>
            </div>

            {/* Max Score and Due Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Max Score */}
              <div>
                <label htmlFor="maxScore" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontFamily: 'Space Habitat, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--lhud-cyan)',
                  marginBottom: '0.5rem'
                }}>
                  Điểm tối đa <span style={{ color: 'var(--lhud-red)' }}>*</span>
                </label>
                <input
                  type="number"
                  id="maxScore"
                  name="maxScore"
                  value={formData.maxScore}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                  max="1000"
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
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueAt" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'Space Habitat, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--lhud-cyan)',
                  marginBottom: '0.5rem'
                }}>
                  <Calendar size={16} />
                  Hạn nộp bài
                </label>
                <input
                  type="datetime-local"
                  id="dueAt"
                  name="dueAt"
                  value={formData.dueAt}
                  onChange={handleInputChange}
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
                  Không bắt buộc - để trống nếu không có hạn
                </p>
              </div>
            </div>

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
                {loading ? 'Đang lưu...' : assignmentToEdit ? 'Cập nhật' : 'Tạo bài tập'}
              </NeuralButton>
            </div>
          </form>
        </div>
      </NeuralCard>
    </div>
  );
};

export default AssignmentModal;