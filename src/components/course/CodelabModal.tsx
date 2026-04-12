/**
 * CODELAB_LEGACY: This component is deprecated.
 * The underlying /coding-exercises API endpoints do not exist in the backend (which uses /api/codelabs).
 * No code execution engine is integrated.
 * @deprecated since 2026-04-08 — will be removed in a future release
 */
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Code, Eye, EyeOff, GripVertical } from 'lucide-react';
import {
  CodingExerciseCreateDTO,
  CodingExerciseUpdateDTO,
  CodingTestCaseCreateDTO,
  ProgrammingLanguage,
} from '../../data/codelabDTOs';
import { createCodingExercise, updateCodingExercise } from '../../services/codelabService';
import { useAuth } from '../../context/AuthContext';
import { NeuralCard, NeuralButton } from '../learning-hud';
import '../../components/learning-hud/learning-hud.css';

interface CodelabModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  codelabToEdit?: {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    language: ProgrammingLanguage;
    starterCode?: string;
    solutionCode?: string;
  };
  onSuccess: () => void;
}

interface TestCaseForm {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
}

const CodelabModal: React.FC<CodelabModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  codelabToEdit,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    difficulty: string;
    language: ProgrammingLanguage;
    starterCode: string;
    solutionCode: string;
  }>({
    title: '',
    description: '',
    difficulty: 'EASY',
    language: ProgrammingLanguage.JAVASCRIPT,
    starterCode: '',
    solutionCode: '',
  });

  const [testCases, setTestCases] = useState<TestCaseForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (codelabToEdit) {
      setFormData({
        title: codelabToEdit.title,
        description: codelabToEdit.description,
        difficulty: codelabToEdit.difficulty,
        language: codelabToEdit.language,
        starterCode: codelabToEdit.starterCode || '',
        solutionCode: codelabToEdit.solutionCode || '',
      });
      setTestCases([]);
    } else {
      setFormData({
        title: '',
        description: '',
        difficulty: 'EASY',
        language: ProgrammingLanguage.JAVASCRIPT,
        starterCode: '',
        solutionCode: '',
      });
      setTestCases([]);
    }
    setError(null);
  }, [codelabToEdit, isOpen]);

  const difficulties = [
    { value: 'EASY', label: 'Dễ', color: '#10b981' },
    { value: 'MEDIUM', label: 'Trung bình', color: '#f59e0b' },
    { value: 'HARD', label: 'Khó', color: '#ef4444' },
  ];

  const languages = [
    { value: ProgrammingLanguage.JAVASCRIPT, label: 'JavaScript' },
    { value: ProgrammingLanguage.TYPESCRIPT, label: 'TypeScript' },
    { value: ProgrammingLanguage.PYTHON, label: 'Python' },
    { value: ProgrammingLanguage.JAVA, label: 'Java' },
    { value: ProgrammingLanguage.CPP, label: 'C++' },
    { value: ProgrammingLanguage.CSHARP, label: 'C#' },
    { value: ProgrammingLanguage.GO, label: 'Go' },
    { value: ProgrammingLanguage.RUST, label: 'Rust' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addTestCase = () => {
    const newTestCase: TestCaseForm = {
      input: '',
      expectedOutput: '',
      isHidden: false,
      orderIndex: testCases.length,
    };
    setTestCases([...testCases, newTestCase]);
  };

  const removeTestCase = (index: number) => {
    const updatedTestCases = testCases.filter((_, i) => i !== index);
    updatedTestCases.forEach((tc, i) => {
      tc.orderIndex = i;
    });
    setTestCases(updatedTestCases);
  };

  const updateTestCase = (index: number, field: keyof TestCaseForm, value: any) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value,
    };
    setTestCases(updatedTestCases);
  };

  const toggleTestCaseVisibility = (index: number) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index].isHidden = !updatedTestCases[index].isHidden;
    setTestCases(updatedTestCases);
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
    if (!codelabToEdit && testCases.length === 0) {
      setError('Bài tập phải có ít nhất 1 test case');
      return false;
    }

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (!tc.input.trim()) {
        setError(`Test case ${i + 1}: Input không được để trống`);
        return false;
      }
      if (!tc.expectedOutput.trim()) {
        setError(`Test case ${i + 1}: Expected output không được để trống`);
        return false;
      }
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
      if (codelabToEdit) {
        const updateData: CodingExerciseUpdateDTO = {
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          language: formData.language,
          starterCode: formData.starterCode || undefined,
          solutionCode: formData.solutionCode || undefined,
        };
        await updateCodingExercise(codelabToEdit.id, updateData, user.id);
      } else {
        const createData: CodingExerciseCreateDTO = {
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          language: formData.language,
          starterCode: formData.starterCode || undefined,
          solutionCode: formData.solutionCode || undefined,
          moduleId: lessonId,
          testCases: testCases.map((tc): CodingTestCaseCreateDTO => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            orderIndex: tc.orderIndex,
          })),
        };
        await createCodingExercise(lessonId, createData, user.id);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu bài tập coding');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
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
  } as const;

  const codeStyle = {
    ...inputStyle,
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    resize: 'vertical' as const
  };

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
          maxWidth: '800px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Code size={24} style={{ color: 'var(--lhud-cyan)' }} />
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--lhud-text-primary)',
              margin: 0
            }}>
              {codelabToEdit ? 'CHỈNH SỬA BÀI TẬP CODING' : 'TẠO BÀI TẬP CODING MỚI'}
            </h2>
          </div>
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
            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="title" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: "Inter, sans-serif",
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
                placeholder="VD: Tính tổng hai số"
                disabled={loading}
                maxLength={200}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="description" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: "Inter, sans-serif",
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
                rows={5}
                disabled={loading}
                maxLength={5000}
                style={{ ...inputStyle, resize: 'vertical' as const }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
              />
            </div>

            {/* Difficulty & Language Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label htmlFor="difficulty" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontFamily: "Inter, sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--lhud-cyan)',
                  marginBottom: '0.5rem'
                }}>
                  Độ khó <span style={{ color: 'var(--lhud-red)' }}>*</span>
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                >
                  {difficulties.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="language" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontFamily: "Inter, sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--lhud-cyan)',
                  marginBottom: '0.5rem'
                }}>
                  Ngôn ngữ <span style={{ color: 'var(--lhud-red)' }}>*</span>
                </label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Starter Code */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="starterCode" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: "Inter, sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--lhud-cyan)',
                marginBottom: '0.5rem'
              }}>
                Starter Code (Mã khởi tạo)
              </label>
              <textarea
                id="starterCode"
                name="starterCode"
                value={formData.starterCode}
                onChange={handleInputChange}
                placeholder="// Mã khởi tạo cho sinh viên..."
                rows={6}
                disabled={loading}
                spellCheck={false}
                style={codeStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--lhud-text-dim)',
                marginTop: '0.5rem',
                marginBottom: 0
              }}>
                Mã khởi đầu mà sinh viên sẽ thấy khi bắt đầu làm bài
              </p>
            </div>

            {/* Solution Code */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="solutionCode" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: "Inter, sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--lhud-cyan)',
                marginBottom: '0.5rem'
              }}>
                Solution Code (Lời giải mẫu)
              </label>
              <textarea
                id="solutionCode"
                name="solutionCode"
                value={formData.solutionCode}
                onChange={handleInputChange}
                placeholder="// Lời giải mẫu..."
                rows={8}
                disabled={loading}
                spellCheck={false}
                style={codeStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--lhud-text-dim)',
                marginTop: '0.5rem',
                marginBottom: 0
              }}>
                Lời giải mẫu chỉ thấy bởi giảng viên và mentor
              </p>
            </div>

            {/* Test Cases Section */}
            {!codelabToEdit && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--lhud-border)'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--lhud-text-primary)',
                    margin: 0
                  }}>
                    Test Cases
                  </h3>
                  <NeuralButton
                    type="button"
                    onClick={addTestCase}
                    variant="primary"
                    disabled={loading}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    <Plus size={18} />
                    Thêm Test Case
                  </NeuralButton>
                </div>

                {testCases.map((testCase, index) => (
                  <div key={index} style={{
                    background: 'rgba(6, 182, 212, 0.05)',
                    border: '1px solid var(--lhud-border)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <GripVertical size={20} style={{ color: 'var(--lhud-text-dim)' }} />
                        <span style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: '0.875rem',
                          color: 'var(--lhud-cyan)',
                          textTransform: 'uppercase'
                        }}>
                          Test Case {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleTestCaseVisibility(index)}
                          title={testCase.isHidden ? 'Hidden' : 'Visible'}
                          disabled={loading}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--lhud-border)',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            color: testCase.isHidden ? 'var(--lhud-text-dim)' : 'var(--lhud-cyan)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          {testCase.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        disabled={loading}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid var(--lhud-red)',
                          borderRadius: '4px',
                          padding: '0.5rem',
                          color: 'var(--lhud-red)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--lhud-red)';
                          e.currentTarget.style.color = 'var(--lhud-deep-space)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = 'var(--lhud-red)';
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontFamily: "Inter, sans-serif",
                          textTransform: 'uppercase',
                          color: 'var(--lhud-text-secondary)',
                          marginBottom: '0.5rem'
                        }}>
                          Input
                        </label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          placeholder="Input của test case..."
                          rows={3}
                          disabled={loading}
                          spellCheck={false}
                          style={codeStyle}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontFamily: "Inter, sans-serif",
                          textTransform: 'uppercase',
                          color: 'var(--lhud-text-secondary)',
                          marginBottom: '0.5rem'
                        }}>
                          Expected Output
                        </label>
                        <textarea
                          value={testCase.expectedOutput}
                          onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                          placeholder="Kết quả mong đợi..."
                          rows={3}
                          disabled={loading}
                          spellCheck={false}
                          style={codeStyle}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                        />
                      </div>
                    </div>

                    {testCase.isHidden && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--lhud-border)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: 'var(--lhud-text-dim)'
                      }}>
                        🔒 Hidden test case - Sinh viên không nhìn thấy
                      </div>
                    )}
                  </div>
                ))}

                {testCases.length === 0 && (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--lhud-surface)',
                    border: '1px dashed var(--lhud-border)',
                    borderRadius: '8px',
                    color: 'var(--lhud-text-dim)',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{ margin: 0 }}>
                      Chưa có test case nào. Nhấn "Thêm Test Case" để bắt đầu.
                    </p>
                  </div>
                )}
              </>
            )}

            {codelabToEdit && (
              <div style={{
                padding: '1rem',
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid var(--lhud-border)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--lhud-text-secondary)',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: 0 }}>
                  💡 Để thêm/sửa test cases, vui lòng vào trang chi tiết bài tập sau khi cập nhật.
                </p>
              </div>
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
                {loading ? 'Đang lưu...' : codelabToEdit ? 'Cập nhật' : 'Tạo bài tập'}
              </NeuralButton>
            </div>
          </form>
        </div>
      </NeuralCard>
    </div>
  );
};

export default CodelabModal;