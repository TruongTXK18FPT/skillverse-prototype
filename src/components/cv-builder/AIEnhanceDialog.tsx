// AI Enhance Dialog - Allows user to enhance specific CV sections with AI
import React, { useState } from "react";
import { X, Sparkles, Loader } from "lucide-react";
import "../../styles/cv-builder.css";

interface AIEnhanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnhance: (section: string, instruction: string) => Promise<void>;
  section: string;
  currentContent: string;
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Tóm tắt (Summary)",
  experience: "Kinh nghiệm làm việc",
  project: "Dự án",
  education: "Học vấn",
  skill: "Kỹ năng",
};

const PRESET_INSTRUCTIONS = [
  { value: "Viết chuyên nghiệp hơn", label: "Chuyên nghiệp hơn", icon: "✨" },
  { value: "Viết ngắn gọn, súc tích", label: "Ngắn gọn", icon: "📝" },
  {
    value: "Thêm từ khóa công nghệ phổ biến",
    label: "Thêm từ khóa tech",
    icon: "🔧",
  },
  {
    value: "Làm nổi bật thành tích định lượng",
    label: "Định lượng thành tích",
    icon: "📊",
  },
  { value: "Phù hợp với vị trí Senior", label: "Senior-level", icon: "👑" },
];

const AIEnhanceDialog: React.FC<AIEnhanceDialogProps> = ({
  isOpen,
  onClose,
  onEnhance,
  section,
  currentContent,
}) => {
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  if (!isOpen) return null;

  const handlePresetClick = async (presetValue: string) => {
    setInstruction(presetValue);
    await handleEnhance(presetValue);
  };

  const handleCustomEnhance = async () => {
    if (!instruction.trim()) return;
    await handleEnhance(instruction);
  };

  const handleEnhance = async (instr: string) => {
    setIsLoading(true);
    try {
      await onEnhance(section, instr);
    } finally {
      setIsLoading(false);
    }
  };

  const sectionLabel = SECTION_LABELS[section] || section;

  return (
    <div className="cv-enhance-overlay" onClick={onClose}>
      <div className="cv-enhance-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cv-enhance-header">
          <div className="cv-enhance-title">
            <Sparkles size={20} className="cv-enhance-icon" />
            <h3>Cải thiện với AI</h3>
          </div>
          <button className="cv-enhance-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="cv-enhance-content">
          <p className="cv-enhance-section">
            Phần: <strong>{sectionLabel}</strong>
          </p>

          {/* Current Content Preview */}
          <div className="cv-enhance-preview">
            <label>Nội dung hiện tại:</label>
            <div className="cv-enhance-preview-box">
              {currentContent || (
                <em className="cv-empty-text">(Chưa có nội dung)</em>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="cv-enhance-loading">
              <Loader size={32} className="cv-spinner" />
              <p>AI đang viết lại nội dung...</p>
              <span className="cv-enhance-hint">
                Đang áp dụng: <strong>{instruction}</strong>
              </span>
            </div>
          )}

          {/* Preset Instructions */}
          {!isLoading && !customMode && (
            <div className="cv-enhance-presets">
              <label>Chọn phong cách:</label>
              <div className="cv-enhance-preset-grid">
                {PRESET_INSTRUCTIONS.map((preset) => (
                  <button
                    key={preset.value}
                    className="cv-enhance-preset-btn"
                    onClick={() => handlePresetClick(preset.value)}
                    disabled={isLoading}
                  >
                    <span className="cv-preset-icon">{preset.icon}</span>
                    <span className="cv-preset-label">{preset.label}</span>
                  </button>
                ))}
              </div>
              <button
                className="cv-enhance-custom-link"
                onClick={() => setCustomMode(true)}
              >
                Hoặc viết yêu cầu tùy chỉnh...
              </button>
            </div>
          )}

          {/* Custom Instruction */}
          {!isLoading && customMode && (
            <div className="cv-enhance-custom">
              <label>Yêu cầu của bạn:</label>
              <textarea
                className="cv-enhance-input"
                rows={3}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Ví dụ: Viết thêm về khả năng leadership, thêm từ khóa Agile/Scrum..."
                disabled={isLoading}
              />
              <div className="cv-enhance-actions">
                <button
                  className="cv-btn-secondary"
                  onClick={() => setCustomMode(false)}
                  disabled={isLoading}
                >
                  Quay lại
                </button>
                <button
                  className="cv-btn-primary"
                  onClick={handleCustomEnhance}
                  disabled={!instruction.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="cv-spinner" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Cải thiện
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cv-enhance-footer">
          <p className="cv-enhance-note">
            AI sẽ giữ nguyên thông tin thực tế và chỉ cải thiện cách diễn đạt.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIEnhanceDialog;
