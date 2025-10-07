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
import '../../styles/CodelabModal.css';

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

  // Test Case Management
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
    // Reorder remaining test cases
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

    // Validate test cases
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
        // Update existing coding exercise
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
        // Create new coding exercise with test cases
        const createData: CodingExerciseCreateDTO = {
          lessonId,
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          language: formData.language,
          starterCode: formData.starterCode || undefined,
          solutionCode: formData.solutionCode || undefined,
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

  return (
    <div className="codelab-modal-overlay" onClick={onClose}>
      <div className="codelab-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="codelab-modal-header">
          <div className="codelab-modal-title-wrapper">
            <Code size={24} />
            <h2 className="codelab-modal-title">
              {codelabToEdit ? 'Chỉnh sửa bài tập Coding' : 'Tạo bài tập Coding mới'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="codelab-modal-close-btn"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="codelab-modal-form">
          {/* Basic Info */}
          <div className="codelab-form-section">
            <label htmlFor="title" className="codelab-form-label">
              Tiêu đề bài tập <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="codelab-form-input"
              placeholder="VD: Tính tổng hai số"
              disabled={loading}
              maxLength={200}
            />
          </div>

          <div className="codelab-form-section">
            <label htmlFor="description" className="codelab-form-label">
              Mô tả và yêu cầu <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="codelab-form-textarea"
              placeholder="Mô tả chi tiết yêu cầu của bài tập..."
              rows={5}
              disabled={loading}
              maxLength={5000}
            />
          </div>

          {/* Difficulty & Language Row */}
          <div className="codelab-form-row">
            <div className="codelab-form-section">
              <label htmlFor="difficulty" className="codelab-form-label">
                Độ khó <span className="required">*</span>
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="codelab-form-select"
                disabled={loading}
              >
                {difficulties.map((diff) => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="codelab-form-section">
              <label htmlFor="language" className="codelab-form-label">
                Ngôn ngữ <span className="required">*</span>
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="codelab-form-select"
                disabled={loading}
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
          <div className="codelab-form-section">
            <label htmlFor="starterCode" className="codelab-form-label">
              Starter Code (Mã khởi tạo)
            </label>
            <textarea
              id="starterCode"
              name="starterCode"
              value={formData.starterCode}
              onChange={handleInputChange}
              className="codelab-form-code"
              placeholder="// Mã khởi tạo cho sinh viên..."
              rows={6}
              disabled={loading}
              spellCheck={false}
            />
            <p className="codelab-form-hint">
              Mã khởi đầu mà sinh viên sẽ thấy khi bắt đầu làm bài
            </p>
          </div>

          {/* Solution Code */}
          <div className="codelab-form-section">
            <label htmlFor="solutionCode" className="codelab-form-label">
              Solution Code (Lời giải mẫu)
            </label>
            <textarea
              id="solutionCode"
              name="solutionCode"
              value={formData.solutionCode}
              onChange={handleInputChange}
              className="codelab-form-code"
              placeholder="// Lời giải mẫu..."
              rows={8}
              disabled={loading}
              spellCheck={false}
            />
            <p className="codelab-form-hint">
              Lời giải mẫu chỉ thấy bởi giảng viên và mentor
            </p>
          </div>

          {/* Test Cases Section */}
          {!codelabToEdit && (
            <>
              <div className="codelab-testcases-header">
                <h3>Test Cases</h3>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="codelab-add-testcase-btn"
                  disabled={loading}
                >
                  <Plus size={20} />
                  Thêm Test Case
                </button>
              </div>

              {testCases.map((testCase, index) => (
                <div key={index} className="codelab-testcase-card">
                  <div className="codelab-testcase-header">
                    <div className="codelab-testcase-drag">
                      <GripVertical size={20} />
                      <span className="codelab-testcase-number">Test Case {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => toggleTestCaseVisibility(index)}
                        className="codelab-visibility-btn"
                        title={testCase.isHidden ? 'Hidden' : 'Visible'}
                        disabled={loading}
                      >
                        {testCase.isHidden ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="codelab-remove-testcase-btn"
                      disabled={loading}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="codelab-testcase-content">
                    <div className="codelab-form-section">
                      <label className="codelab-form-label-small">Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        className="codelab-testcase-input"
                        placeholder="Input của test case..."
                        rows={3}
                        disabled={loading}
                        spellCheck={false}
                      />
                    </div>

                    <div className="codelab-form-section">
                      <label className="codelab-form-label-small">Expected Output</label>
                      <textarea
                        value={testCase.expectedOutput}
                        onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                        className="codelab-testcase-input"
                        placeholder="Kết quả mong đợi..."
                        rows={3}
                        disabled={loading}
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  {testCase.isHidden && (
                    <div className="codelab-testcase-hidden-badge">
                      🔒 Hidden test case - Sinh viên không nhìn thấy
                    </div>
                  )}
                </div>
              ))}

              {testCases.length === 0 && (
                <div className="codelab-no-testcases">
                  <p>Chưa có test case nào. Nhấn "Thêm Test Case" để bắt đầu.</p>
                </div>
              )}
            </>
          )}

          {codelabToEdit && (
            <div className="codelab-edit-note">
              <p>
                💡 Để thêm/sửa test cases, vui lòng vào trang chi tiết bài tập sau khi cập nhật.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="codelab-form-error">
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="codelab-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="codelab-modal-cancel-btn"
              disabled={loading}
            >
              Hủy
            </button>
            <button type="submit" className="codelab-modal-submit-btn" disabled={loading}>
              {loading ? 'Đang lưu...' : codelabToEdit ? 'Cập nhật' : 'Tạo bài tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CodelabModal;
