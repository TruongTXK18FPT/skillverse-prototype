import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Clock3,
  FileSearch,
  Layers3,
  Loader2,
  RefreshCw,
  Route,
  UserCheck,
  X,
} from "lucide-react";
import { useAppToast } from "../../context/ToastContext";
import roadmapPackageService from "../../services/roadmapPackageService";
import type {
  RoadmapTemplateResponse,
  RoadmapTemplateStatus,
} from "../../types/roadmapPackage";
import "./AdminRoadmapPackageReviewTab.css";

const getApiErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const formatDate = (value?: string) => {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const templateStatusLabel: Record<RoadmapTemplateStatus, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  ARCHIVED: "Đã lưu trữ",
};

const requirementLabel: Record<string, string> = {
  REQUIRED: "Bắt buộc",
  IMPORTANT: "Quan trọng",
  NICE_TO_HAVE: "Bổ trợ",
  OPTIONAL: "Bổ trợ",
};

const importanceLabel: Record<string, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Rất quan trọng",
};

const AdminRoadmapPackageReviewTab = () => {
  const { showSuccess, showError } = useAppToast();
  const [templates, setTemplates] = useState<RoadmapTemplateResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0],
    [selectedId, templates],
  );

  const loadSubmitted = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roadmapPackageService.getSubmittedTemplates();
      setTemplates(data);
      setSelectedId((current) =>
        current && data.some((template) => template.id === current)
          ? current
          : data[0]?.id ?? null,
      );
    } catch (error) {
      showError(
        "Không thể tải hàng đợi duyệt",
        getApiErrorMessage(error, "Kiểm tra quyền admin và thử lại."),
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadSubmitted();
  }, [loadSubmitted]);

  const approve = async (template: RoadmapTemplateResponse) => {
    setActionId(template.id);
    try {
      await roadmapPackageService.approveTemplate(template.id);
      showSuccess(
        "Đã duyệt template",
        "Mentor có thể tạo gói bán từ template này.",
      );
      await loadSubmitted();
    } catch (error) {
      showError(
        "Duyệt thất bại",
        getApiErrorMessage(error, "Vui lòng thử lại."),
      );
    } finally {
      setActionId(null);
    }
  };

  const reject = async (template: RoadmapTemplateResponse) => {
    const confirmed = window.confirm(
      `Từ chối template roadmap "${template.title}"? Mentor sẽ cần sửa và gửi duyệt lại.`,
    );
    if (!confirmed) return;

    setActionId(template.id);
    try {
      await roadmapPackageService.rejectTemplate(template.id);
      showSuccess("Đã từ chối template", "Template đã được trả về mentor.");
      await loadSubmitted();
    } catch (error) {
      showError(
        "Từ chối thất bại",
        getApiErrorMessage(error, "Vui lòng thử lại."),
      );
    } finally {
      setActionId(null);
    }
  };

  const totalNodes = templates.reduce(
    (sum, template) => sum + (template.nodes?.length ?? 0),
    0,
  );

  return (
    <div className="admin-rp-review">
      <section className="admin-rp-review__hero">
        <div>
          <span className="admin-rp-review__eyebrow">
            <FileSearch size={18} />
            Duyệt gói roadmap
          </span>
          <h1>Duyệt template gói roadmap</h1>
          <p>
            Hàng đợi này đọc từ endpoint submitted của backend. Duyệt template
            để mentor có thể tạo gói bán và đăng bán trên chợ gói roadmap.
          </p>
        </div>
        <button
          type="button"
          className="admin-rp-review__refresh"
          onClick={() => void loadSubmitted()}
          disabled={loading}
          title="Tải lại"
        >
          {loading ? <Loader2 className="admin-rp-review__spin" size={18} /> : <RefreshCw size={18} />}
        </button>
      </section>

      <div className="admin-rp-review__metrics">
        <div>
          <strong>{templates.length}</strong>
          <span>template chờ duyệt</span>
        </div>
        <div>
          <strong>{totalNodes}</strong>
          <span>node cần review</span>
        </div>
        <div>
          <strong>
            {templates.filter((template) => template.courses?.length > 0).length}
          </strong>
          <span>template có khóa học</span>
        </div>
      </div>

      {loading ? (
        <div className="admin-rp-review__loading">
          <Loader2 className="admin-rp-review__spin" size={32} />
          <span>Đang tải template đã gửi duyệt...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="admin-rp-review__empty">
          <BadgeCheck size={34} />
          <h2>Hàng đợi đang trống</h2>
          <p>Không có template gói roadmap nào đang chờ duyệt.</p>
        </div>
      ) : (
        <div className="admin-rp-review__layout">
          <aside className="admin-rp-review__queue">
            <div className="admin-rp-review__section-head">
              <div>
                <h2>Hàng đợi gửi duyệt</h2>
                <p>Chọn template để xem chi tiết.</p>
              </div>
              <Clock3 size={20} />
            </div>

            <div className="admin-rp-review__queue-list">
              {templates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  className={`admin-rp-review__queue-item ${
                    selectedTemplate?.id === template.id ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedId(template.id)}
                >
                  <span>#{template.id}</span>
                  <strong>{template.title}</strong>
                  <small>
                    {template.mentorName || `Mentor ${template.mentorId}`} -{" "}
                    {template.nodes?.length ?? 0} node
                  </small>
                </button>
              ))}
            </div>
          </aside>

          {selectedTemplate && (
            <section className="admin-rp-review__detail">
              <div className="admin-rp-review__detail-top">
                <div>
                  <span className="admin-rp-review__status">
                    {templateStatusLabel[selectedTemplate.status]}
                  </span>
                  <h2>{selectedTemplate.title}</h2>
                  <p>
                    {selectedTemplate.description ||
                      "Template chưa có mô tả chi tiết."}
                  </p>
                </div>
                <div className="admin-rp-review__actions">
                  <button
                    type="button"
                    className="admin-rp-review__approve"
                    onClick={() => void approve(selectedTemplate)}
                    disabled={actionId === selectedTemplate.id}
                  >
                    {actionId === selectedTemplate.id ? (
                      <Loader2 className="admin-rp-review__spin" size={17} />
                    ) : (
                      <Check size={17} />
                    )}
                    Duyệt
                  </button>
                  <button
                    type="button"
                    className="admin-rp-review__reject"
                    onClick={() => void reject(selectedTemplate)}
                    disabled={actionId === selectedTemplate.id}
                  >
                    <X size={17} />
                    Từ chối
                  </button>
                </div>
              </div>

              <div className="admin-rp-review__info-grid">
                <div>
                  <UserCheck size={18} />
                  <span>Mentor</span>
                  <strong>
                    {selectedTemplate.mentorName ||
                      `#${selectedTemplate.mentorId}`}
                  </strong>
                </div>
                <div>
                  <Route size={18} />
                  <span>Mục tiêu</span>
                  <strong>
                    {selectedTemplate.targetRoleSnapshot ||
                      selectedTemplate.targetRole ||
                      "Tùy chỉnh"}
                  </strong>
                </div>
                <div>
                  <Layers3 size={18} />
                  <span>Cấp độ</span>
                  <strong>
                    {selectedTemplate.targetLevelSnapshot ||
                      selectedTemplate.targetLevel ||
                      "N/A"}
                  </strong>
                </div>
                <div>
                  <Clock3 size={18} />
                  <span>Đã gửi</span>
                  <strong>{formatDate(selectedTemplate.updatedAt)}</strong>
                </div>
              </div>

              <div className="admin-rp-review__node-section">
                <div className="admin-rp-review__section-head">
                  <div>
                    <h2>Milestone</h2>
                    <p>
                      Kiểm tra sản phẩm kỳ vọng và rubric trước khi duyệt.
                    </p>
                  </div>
                  <AlertTriangle size={20} />
                </div>
                <div className="admin-rp-review__nodes">
                  {selectedTemplate.nodes.map((node) => (
                    <article className="admin-rp-review__node" key={node.id}>
                      <span>{node.orderIndex}</span>
                      <div>
                        <h3>{node.title}</h3>
                        <p>
                          {node.description ||
                            node.expectedOutput ||
                            "Chưa có mô tả."}
                        </p>
                        <div>
                          <small>{node.skillNameSnapshot || "Skill tùy chỉnh"}</small>
                          <small>
                            {requirementLabel[node.requirementType || "REQUIRED"] ||
                              node.requirementType ||
                              "Bắt buộc"}
                          </small>
                          <small>
                            {importanceLabel[node.importanceLevel || "MEDIUM"] ||
                              node.importanceLevel ||
                              "Trung bình"}
                          </small>
                          <small>{node.estimatedHours || 0}h</small>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRoadmapPackageReviewTab;
