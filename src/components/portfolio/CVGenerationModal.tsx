// CV Generation Modal
import React, { useState } from "react";
import { X, Loader, Sparkles, FileText } from "lucide-react";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { CVGenerationRequest } from "../../data/portfolioDTOs";
import { showAppError } from "../../context/ToastContext";
import "../../styles/PortfolioModals.css";

interface CVGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CVGenerationRequest) => Promise<void>;
  onExport?: (request: CVGenerationRequest) => Promise<void>; // Export without AI
}

export const CVGenerationModal: React.FC<CVGenerationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onExport,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("PROFESSIONAL");
  const [formData, setFormData] = useState<CVGenerationRequest>({
    templateName: "PROFESSIONAL",
    targetRole: "",
    targetIndustry: "",
    additionalInstructions: "",
    includeProjects: true,
    includeCertificates: true,
    includeReviews: true,
  });

  const templates = [
    {
      name: "PROFESSIONAL",
      title: "Professional",
      description: "Thiết kế chuyên nghiệp, phù hợp với doanh nghiệp",
      icon: "💼",
    },
    {
      name: "CREATIVE",
      title: "Creative",
      description: "Thiết kế sáng tạo, phù hợp với ngành thiết kế, nghệ thuật",
      icon: "🎨",
    },
    {
      name: "MINIMAL",
      title: "Minimal",
      description: "Thiết kế tối giản, tập trung vào nội dung",
      icon: "📄",
    },
    {
      name: "MODERN",
      title: "Modern",
      description: "Thiết kế hiện đại, trẻ trung",
      icon: "✨",
    },
  ];

  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    setFormData({ ...formData, templateName });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error generating CV:", error);
      showAppError(
        "Không thể tạo CV",
        "Có lỗi xảy ra khi tạo CV. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pf-modal-overlay" onClick={onClose}>
      <div
        className="pf-modal-container pf-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pf-modal-header">
          <div>
            <h2>
              <Sparkles size={24} className="pf-icon-inline" />
              Tạo CV với AI
            </h2>
            <p className="pf-modal-subtitle">
              AI sẽ tạo CV chuyên nghiệp dựa trên hồ sơ của bạn
            </p>
          </div>
          <button className="pf-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pf-modal-body">
          {/* Template Selection */}
          <div className="pf-form-section">
            <h3>Chọn Mẫu CV</h3>

            <div className="pf-template-grid">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className={`pf-template-card ${selectedTemplate === template.name ? "pf-template-selected" : ""}`}
                  onClick={() => handleTemplateSelect(template.name)}
                >
                  <div className="pf-template-icon">{template.icon}</div>
                  <h4>{template.title}</h4>
                  <p>{template.description}</p>
                  {selectedTemplate === template.name && (
                    <div className="pf-template-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Target Role & Industry */}
          <div className="pf-form-section">
            <h3>Tùy Chỉnh (Tùy Chọn)</h3>

            <div className="pf-form-row">
              <div className="pf-form-group">
                <label>Vị Trí Mục Tiêu</label>
                <input
                  type="text"
                  value={formData.targetRole || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, targetRole: e.target.value })
                  }
                  placeholder="VD: Senior Full Stack Developer"
                />
                <small>AI sẽ tối ưu CV cho vị trí này</small>
              </div>

              <div className="pf-form-group">
                <label>Ngành Nghề</label>
                <input
                  type="text"
                  value={formData.targetIndustry || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, targetIndustry: e.target.value })
                  }
                  placeholder="VD: Fintech, E-commerce"
                />
              </div>
            </div>

            <div className="pf-form-group">
              <label>Yêu Cầu Đặc Biệt</label>
              <textarea
                value={formData.additionalInstructions || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalInstructions: e.target.value,
                  })
                }
                placeholder="VD: Nhấn mạnh kinh nghiệm về React và Node.js..."
                rows={3}
              />
            </div>
          </div>

          {/* Content Selection */}
          <div className="pf-form-section">
            <h3>Nội Dung CV</h3>

            <div className="pf-form-checkbox-group">
              <div className="pf-form-checkbox">
                <input
                  type="checkbox"
                  id="includeProjects"
                  checked={formData.includeProjects || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeProjects: e.target.checked,
                    })
                  }
                />
                <label htmlFor="includeProjects">
                  <FileText size={18} />
                  <div>
                    <strong>Bao gồm Dự Án</strong>
                    <small>Thêm các dự án portfolio vào CV</small>
                  </div>
                </label>
              </div>

              <div className="pf-form-checkbox">
                <input
                  type="checkbox"
                  id="includeCertificates"
                  checked={formData.includeCertificates || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeCertificates: e.target.checked,
                    })
                  }
                />
                <label htmlFor="includeCertificates">
                  <FileText size={18} />
                  <div>
                    <strong>Bao gồm Chứng Chỉ</strong>
                    <small>Thêm các chứng chỉ đã đạt được</small>
                  </div>
                </label>
              </div>

              <div className="pf-form-checkbox">
                <input
                  type="checkbox"
                  id="includeReviews"
                  checked={formData.includeReviews || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeReviews: e.target.checked,
                    })
                  }
                />
                <label htmlFor="includeReviews">
                  <FileText size={18} />
                  <div>
                    <strong>Bao gồm Đánh Giá</strong>
                    <small>Thêm đánh giá từ mentor</small>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* AI Info Banner */}
          <div className="pf-ai-info-banner">
            <Sparkles size={20} />
            <div>
              <strong>AI sẽ tự động:</strong>
              <ul>
                <li>Viết tóm tắt chuyên nghiệp về bạn</li>
                <li>Tổ chức thông tin theo cấu trúc tối ưu</li>
                <li>Highlight những điểm mạnh phù hợp với ngành nghề</li>
                <li>Tối ưu từ khóa cho ATS (Applicant Tracking System)</li>
              </ul>
            </div>
          </div>

          <div className="pf-modal-footer pf-modal-footer-split">
            <div className="pf-footer-left">
              {onExport && (
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await onExport(formData);
                      onClose();
                    } catch (error) {
                      console.error("Error exporting CV:", error);
                      showAppError(
                        "Không thể xuất CV",
                        "Có lỗi xảy ra khi xuất CV. Vui lòng thử lại.",
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="pf-btn pf-btn-secondary pf-btn-export"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="pf-spinner" />
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Xuất từ Portfolio
                      <small>(Không dùng AI)</small>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="pf-footer-right">
              <button
                type="button"
                onClick={onClose}
                className="pf-btn pf-btn-secondary"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="pf-btn pf-btn-primary pf-btn-ai"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <MeowlKuruLoader size="small" text="" />
                    AI đang tạo CV...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Tạo CV với AI
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CVGenerationModal;
