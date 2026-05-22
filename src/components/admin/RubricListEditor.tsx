import React, { useState, useEffect } from "react";
import { RoadmapRubric } from "../../types/roadmapTemplate";
import "./RubricListEditor.css";

interface RubricListEditorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export const RubricListEditor: React.FC<RubricListEditorProps> = ({
  value,
  onChange,
  label = "Tiêu chí đánh giá (Rubrics)"
}) => {
  const [rubrics, setRubrics] = useState<RoadmapRubric[]>([]);

  // Parse initial value
  useEffect(() => {
    if (!value || value.trim() === "") {
      setRubrics([]);
      return;
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setRubrics(parsed);
      } else {
        // Fallback for legacy text rubric
        setRubrics([
          {
            name: "Tiêu chí đánh giá",
            description: value,
            maxPoints: 10
          }
        ]);
      }
    } catch (e) {
      // Fallback for legacy text rubric
      setRubrics([
        {
          name: "Tiêu chí đánh giá",
          description: value,
          maxPoints: 10
        }
      ]);
    }
  }, [value]);

  const updateRubrics = (newRubrics: RoadmapRubric[]) => {
    setRubrics(newRubrics);
    onChange(JSON.stringify(newRubrics));
  };

  const handleAdd = () => {
    const newRubrics = [
      ...rubrics,
      { name: "", description: "", maxPoints: 10 }
    ];
    updateRubrics(newRubrics);
  };

  const handleRemove = (index: number) => {
    const newRubrics = rubrics.filter((_, i) => i !== index);
    updateRubrics(newRubrics);
  };

  const handleChange = (index: number, field: keyof RoadmapRubric, val: any) => {
    const newRubrics = rubrics.map((r, i) => {
      if (i === index) {
        return { ...r, [field]: val };
      }
      return r;
    });
    updateRubrics(newRubrics);
  };

  return (
    <div className="rubric-editor-container">
      <label className="rubric-editor-label">{label}</label>
      
      {rubrics.length === 0 ? (
        <div className="rubric-empty-state">
          Chưa có tiêu chí nào. Nhấp vào nút bên dưới để thêm tiêu chí đánh giá.
        </div>
      ) : (
        <div className="rubric-items-list">
          {rubrics.map((rubric, index) => (
            <div key={index} className="rubric-item-card">
              <div className="rubric-item-header">
                <span className="rubric-item-index">Tiêu chí #{index + 1}</span>
                <button
                  type="button"
                  className="rubric-item-delete-btn"
                  onClick={() => handleRemove(index)}
                  title="Xóa tiêu chí"
                >
                  &times;
                </button>
              </div>

              <div className="rubric-item-body">
                <div className="rubric-input-group">
                  <input
                    type="text"
                    placeholder="Tên tiêu chí (ví dụ: Chất lượng code, UI Responsive...)"
                    value={rubric.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    className="rubric-text-input"
                  />
                  <input
                    type="number"
                    placeholder="Điểm"
                    value={rubric.maxPoints ?? ""}
                    onChange={(e) =>
                      handleChange(index, "maxPoints", e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    className="rubric-score-input"
                    min="1"
                  />
                </div>

                <textarea
                  placeholder="Mô tả chi tiết yêu cầu để đạt tiêu chí này..."
                  value={rubric.description}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                  className="rubric-textarea-input"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="rubric-add-btn"
        onClick={handleAdd}
      >
        + Thêm tiêu chí đánh giá
      </button>
    </div>
  );
};
