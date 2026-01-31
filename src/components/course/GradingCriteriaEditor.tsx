import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { AssignmentCriteriaDTO } from '../../data/assignmentDTOs';
import './GradingCriteriaEditor.css';

interface GradingCriteriaEditorProps {
  criteria: AssignmentCriteriaDTO[];
  onChange: (criteria: AssignmentCriteriaDTO[]) => void;
  maxScore: number;
}

const GradingCriteriaEditor: React.FC<GradingCriteriaEditorProps> = ({
  criteria,
  onChange,
  maxScore
}) => {
  const addCriteria = () => {
    const newCriteria: AssignmentCriteriaDTO = {
      name: '',
      description: '',
      maxPoints: 0,
      orderIndex: criteria.length,
      isRequired: false
    };
    onChange([...criteria, newCriteria]);
  };

  const updateCriteria = (index: number, field: keyof AssignmentCriteriaDTO, value: any) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeCriteria = (index: number) => {
    const updated = criteria.filter((_, i) => i !== index);
    // Reorder remaining criteria
    updated.forEach((c, i) => c.orderIndex = i);
    onChange(updated);
  };

  const totalPoints = criteria.reduce((sum, c) => sum + (c.maxPoints || 0), 0);
  const isValid = totalPoints === maxScore;

  return (
    <div className="grading-criteria-editor">
      <div className="criteria-header">
        <h3>Tiêu Chí Chấm Điểm</h3>
        <button
          type="button"
          className="add-criteria-btn"
          onClick={addCriteria}
        >
          <Plus size={16} />
          Thêm Tiêu Chí
        </button>
      </div>

      {criteria.length === 0 ? (
        <div className="no-criteria-message">
          <AlertCircle size={20} />
          <p>Chưa có tiêu chí chấm điểm. Click "Thêm Tiêu Chí" để bắt đầu.</p>
          <p className="hint">
            Tạo các tiêu chí giúp học viên hiểu rõ cách bài tập được chấm điểm (giống Coursera).
          </p>
        </div>
      ) : (
        <>
          <div className="criteria-list">
            {criteria.map((criterion, index) => (
              <div key={index} className="criteria-item">
                <div className="criteria-drag-handle">
                  <GripVertical size={18} />
                </div>

                <div className="criteria-fields">
                  <div className="criteria-row">
                    <div className="field-group flex-2">
                      <label>Tên Tiêu Chí *</label>
                      <input
                        type="text"
                        value={criterion.name}
                        onChange={(e) => updateCriteria(index, 'name', e.target.value)}
                        placeholder="VD: Code Quality, Functionality, Documentation..."
                        required
                      />
                    </div>

                    <div className="field-group flex-1">
                      <label>Điểm Tối Đa *</label>
                      <input
                        type="number"
                        value={criterion.maxPoints || ''}
                        onChange={(e) => updateCriteria(index, 'maxPoints', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.5"
                        required
                      />
                    </div>

                    <div className="field-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={criterion.isRequired}
                          onChange={(e) => updateCriteria(index, 'isRequired', e.target.checked)}
                        />
                        Bắt buộc
                      </label>
                    </div>
                  </div>

                  <div className="criteria-row">
                    <div className="field-group full-width">
                      <label>Mô Tả Yêu Cầu *</label>
                      <textarea
                        value={criterion.description}
                        onChange={(e) => updateCriteria(index, 'description', e.target.value)}
                        placeholder="Mô tả chi tiết yêu cầu để đạt điểm tối đa cho tiêu chí này..."
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="remove-criteria-btn"
                  onClick={() => removeCriteria(index)}
                  title="Xóa tiêu chí"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className={`criteria-summary ${!isValid ? 'error' : 'success'}`}>
            <div className="summary-row">
              <span>Tổng Điểm Tiêu Chí:</span>
              <strong>{totalPoints.toFixed(2)} pts</strong>
            </div>
            <div className="summary-row">
              <span>Điểm Tối Đa Assignment:</span>
              <strong>{maxScore.toFixed(2)} pts</strong>
            </div>
            {!isValid && (
              <div className="validation-error">
                <AlertCircle size={16} />
                <span>
                  {totalPoints > maxScore
                    ? `Tổng điểm tiêu chí (${totalPoints}) vượt quá max score (${maxScore})`
                    : `Tổng điểm tiêu chí (${totalPoints}) chưa đủ ${maxScore} pts`}
                </span>
              </div>
            )}
            {isValid && (
              <div className="validation-success">
                ✓ Tổng điểm khớp với max score
              </div>
            )}
          </div>
        </>
      )}

      <div className="criteria-help">
        <strong>💡 Tips:</strong>
        <ul>
          <li>Tạo 3-5 tiêu chí rõ ràng giúp học viên hiểu cách chấm điểm</li>
          <li>Đánh dấu "Bắt buộc" cho các tiêu chí quan trọng nhất</li>
          <li>Tổng điểm các tiêu chí phải bằng max score của assignment</li>
          <li>VD: Code Quality (30 pts), Functionality (40 pts), Documentation (20 pts), Best Practices (10 pts)</li>
        </ul>
      </div>
    </div>
  );
};

export default GradingCriteriaEditor;
