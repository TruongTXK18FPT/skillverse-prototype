/**
 * MentorAssessmentCreator — Phase 4
 *
 * Component for mentors to create output assessment requirements for students.
 * The mentor defines what the student must produce as evidence of learning,
 * including rubric criteria, deadline expectations, and evidence types.
 *
 * This component lives inside the MentorRoadmapWorkspacePanel and provides
 * the "push" side of assessment (mentor → student), complementing the
 * existing MentorOutputAssessmentReview (student → mentor).
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import {
  getLatestOutputAssessment,
  assessOutputAssessment,
  getNodeAssignment,
  upsertNodeAssignment,
} from "../../services/nodeMentoringService";
import type {
  JourneyOutputAssessmentResponse,
  NodeAssignmentResponse,
  OutputAssessmentStatus,
  AssessJourneyOutputRequest,
} from "../../types/NodeMentoring";
import {
  uploadDocument,
  validateDocument,
  formatFileSize,
} from "../../services/fileUploadService";
import RichTextEditor from "../shared/RichTextEditor";
import "./MentorAssessmentCreator.css";

interface Props {
  journeyId: number;
  nodeId?: string;
  bookingId?: number;
  learnerName?: string;
  /** Roadmap nodes for context */
  nodes?: any[];
  onAssessed?: () => void;
}

interface RubricItem {
  id: string;
  criterion: string;
  weight: number;
}

const RUBRIC_HEADING = "### Tiêu chí đánh giá (Rubric)";

/**
 * Split a saved assignment description into prose body + rubric list.
 * Rubric items are stored as `- **{weight}%**: {criterion}` lines right after
 * the `RUBRIC_HEADING`. Anything after the heading is treated as rubric.
 */
const splitRubricBlock = (
  raw: string,
): { body: string; rubric: RubricItem[] } => {
  if (!raw) return { body: "", rubric: [] };
  const idx = raw.indexOf(RUBRIC_HEADING);
  if (idx === -1) return { body: raw, rubric: [] };
  const body = raw.slice(0, idx).replace(/\s+$/, "");
  const tail = raw.slice(idx + RUBRIC_HEADING.length);
  const rubric: RubricItem[] = [];
  const lineRe = /^-\s+\*\*\s*(\d+)\s*%\s*\*\*\s*:\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(tail)) !== null) {
    rubric.push({
      id: `parsed-${rubric.length}-${m[1]}`,
      weight: Number(m[1]) || 0,
      criterion: m[2].trim(),
    });
  }
  return { body, rubric };
};

/** Serialize rubric back into markdown, appended after the prose body. */
const serializeRubric = (body: string, rubric: RubricItem[]): string => {
  const cleanBody = body.replace(/\s+$/, "");
  const valid = rubric.filter((r) => r.criterion.trim().length > 0);
  if (valid.length === 0) return cleanBody;
  const lines = valid.map((r) => `- **${r.weight}%**: ${r.criterion.trim()}`);
  return `${cleanBody}\n\n${RUBRIC_HEADING}\n${lines.join("\n")}`;
};

const MentorAssessmentCreator: React.FC<Props> = ({
  journeyId,
  bookingId,
  learnerName,
  nodes = [],
  nodeId,
  onAssessed,
}) => {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  // Existing assessment state
  const [assessment, setAssessment] =
    useState<JourneyOutputAssessmentResponse | null>(null);
  const [currentAssignment, setCurrentAssignment] =
    useState<NodeAssignmentResponse | null>(null);
  const [editingRequirements, setEditingRequirements] = useState(false);
  const [loading, setLoading] = useState(false);

  // Requirements form
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [requirementTitle, setRequirementTitle] = useState("");
  const [requirementDesc, setRequirementDesc] = useState("");
  const [evidenceType, setEvidenceType] = useState<
    "text" | "link" | "file" | "mixed"
  >("mixed");
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([
    { id: "1", criterion: "Hoàn thành đầy đủ yêu cầu", weight: 30 },
    { id: "2", criterion: "Chất lượng code / output", weight: 40 },
    { id: "3", criterion: "Khả năng giải thích", weight: 30 },
  ]);

  // Assess form
  const [assessStatus, setAssessStatus] =
    useState<OutputAssessmentStatus>("PENDING");
  const [assessFeedback, setAssessFeedback] = useState("");
  const [assessScore, setAssessScore] = useState<number | undefined>(undefined);
  const [assessing, setAssessing] = useState(false);

  const [savingRequirements, setSavingRequirements] = useState(false);

  // File attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileExt = (file: File) => {
    if (file.type === "application/pdf") return "pdf";
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return "docx";
    return file.name.split(".").pop()?.toLowerCase() || "file";
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    const v = validateDocument(file);
    if (!v.valid) {
      setUploadError(v.error || "File không hợp lệ");
      return;
    }
    setAttachmentFile(file);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);

      // Load Node Assignment if nodeId is present
      if (nodeId) {
        const assignment = await getNodeAssignment(journeyId, nodeId);
        setCurrentAssignment(assignment);
        if (assignment) {
          setRequirementTitle(assignment.title || "");
          const rawDesc = assignment.description || "";
          // Split existing rubric block so the markdown editor only shows the
          // prose and the rubric editor stays in sync with the stored criteria.
          const { body, rubric } = splitRubricBlock(rawDesc);
          setRequirementDesc(body);
          if (rubric.length > 0) setRubricItems(rubric);
          setEditingRequirements(assignment.assignmentSource !== "MENTOR_REFINED");
        } else {
          setRequirementTitle("");
          setRequirementDesc("");
          setEditingRequirements(true);
        }
      } else {
        setCurrentAssignment(null);
        setEditingRequirements(true);
      }

      // Load Journey Output Assessment (always load it if no nodeId, or optionally even if nodeId to see final status, but we only show it if !nodeId)
      if (!nodeId) {
        const data = await getLatestOutputAssessment(journeyId);
        setAssessment(data);
        if (data) {
          setAssessStatus(data.assessmentStatus);
          setAssessFeedback(data.feedback || "");
          setAssessScore(data.score ?? undefined);
        }
      }
    } catch {
      // Ignore 404s
    } finally {
      setLoading(false);
    }
  }, [journeyId, nodeId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  const addRubricItem = () => {
    setRubricItems([
      ...rubricItems,
      { id: Date.now().toString(), criterion: "", weight: 10 },
    ]);
  };

  const removeRubricItem = (id: string) => {
    setRubricItems(rubricItems.filter((r) => r.id !== id));
  };

  const updateRubricItem = (
    id: string,
    field: keyof RubricItem,
    value: any,
  ) => {
    setRubricItems(
      rubricItems.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleSaveRequirements = async () => {
    if (!nodeId) {
      showError(
        "Lỗi",
        "Tính năng lưu assignment hiện tại chỉ hỗ trợ khi chọn một Node cụ thể.",
      );
      return;
    }

    try {
      setSavingRequirements(true);

      // Upload attachment if present
      let attachmentNote = "";
      if (attachmentFile && user?.id) {
        const result = await uploadDocument(attachmentFile, user.id);
        attachmentNote = `\n\n---\n📎 **File đính kèm:** [${attachmentFile.name}](${result.url})`;
      }

      const { body } = splitRubricBlock(requirementDesc);
      const finalDescription = serializeRubric(body + attachmentNote, rubricItems);

      const savedAssignment = await upsertNodeAssignment(journeyId, nodeId, {
        title: requirementTitle,
        description: finalDescription,
        assignmentSource: "MENTOR_REFINED",
      });
      setCurrentAssignment(savedAssignment);
      setEditingRequirements(false);
      showSuccess("Thành công", "Đã lưu yêu cầu Assessment cho node");
      setAttachmentFile(null);
      onAssessed?.();
      await loadAssessment();
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể lưu yêu cầu");
    } finally {
      setSavingRequirements(false);
    }
  };

  const handleAssess = async () => {
    if (!assessment) return;
    try {
      setAssessing(true);
      const request: AssessJourneyOutputRequest = {
        assessmentStatus: assessStatus,
        feedback: assessFeedback.trim() || undefined,
        score: assessScore,
      };
      await assessOutputAssessment(journeyId, request);
      showSuccess(
        "Thành công",
        `Đã ${assessStatus === "APPROVED" ? "duyệt" : "từ chối"} output assessment`,
      );
      onAssessed?.();
      await loadAssessment();
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể đánh giá");
    } finally {
      setAssessing(false);
    }
  };

  const alreadyAssessed =
    assessment?.assessmentStatus !== "PENDING" &&
    assessment?.assessmentStatus != null;
  const totalWeight = rubricItems.reduce((sum, r) => sum + (r.weight || 0), 0);
  const hasUploadedNodeAssignment =
    !!nodeId &&
    currentAssignment?.assignmentSource === "MENTOR_REFINED" &&
    !editingRequirements;

  return (
    <div className="mac-container">
      {/* Header */}
      <div className="mac-header">
        <div className="mac-header-icon">
          <ClipboardList size={20} />
        </div>
        <div>
          <h3 className="mac-title">Assessment & Đánh giá</h3>
          <p className="mac-subtitle">
            {learnerName
              ? `Đánh giá kết quả học tập của ${learnerName}`
              : "Quản lý yêu cầu đầu ra"}
          </p>
        </div>
      </div>

      {/* Requirements Section (Mentor defines rubric) */}
      <div className="mac-section">
        <button
          className="mac-section-toggle"
          onClick={() => setRequirementsExpanded(!requirementsExpanded)}
        >
          <span className="mac-section-label">
            <Award size={16} /> Tiêu chí đánh giá (Rubric)
          </span>
          {requirementsExpanded ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>

        {requirementsExpanded && (
          <div className="mac-section-body">
            {hasUploadedNodeAssignment && currentAssignment && (
              <div className="mac-uploaded-assignment">
                <div className="mac-uploaded-assignment__icon">
                  <CheckCircle size={18} />
                </div>
                <div className="mac-uploaded-assignment__content">
                  <h4>Đã tải lên yêu cầu node</h4>
                  <p>
                    Học viên sẽ thấy yêu cầu đã giao. Khi cần thay đổi nội dung,
                    hãy mở lại form để cập nhật.
                  </p>
                  <div className="mac-uploaded-assignment__meta">
                    {currentAssignment.title && (
                      <span>{currentAssignment.title}</span>
                    )}
                    <span>
                      {currentAssignment.updatedAt
                        ? `Cập nhật ${new Date(currentAssignment.updatedAt).toLocaleString("vi-VN")}`
                        : `Tạo lúc ${new Date(currentAssignment.createdAt).toLocaleString("vi-VN")}`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mac-edit-assignment-btn"
                  onClick={() => setEditingRequirements(true)}
                >
                  Sửa nội dung
                </button>
              </div>
            )}
            <div style={{ display: hasUploadedNodeAssignment ? "none" : undefined }}>
            <div className="mac-form-group">
              <label className="mac-label">Tiêu đề Assessment</label>
              <input
                type="text"
                className="mac-input"
                value={requirementTitle}
                onChange={(e) => setRequirementTitle(e.target.value)}
                placeholder="VD: Final Project — Xây dựng REST API"
              />
            </div>

            <div className="mac-form-group">
              <label className="mac-label">Mô tả yêu cầu chi tiết</label>
              <RichTextEditor
                key={`node-requirement-${nodeId ?? "final"}-${currentAssignment?.id ?? "new"}-${editingRequirements ? "edit" : "view"}`}
                initialContent={requirementDesc}
                onChange={setRequirementDesc}
                placeholder="Mô tả chi tiết những gì học viên cần nộp..."
                userId={user?.id}
              />
            </div>

            <div className="mac-form-group">
              <label className="mac-label">File đề bài / Tài liệu đính kèm (Tùy chọn)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <div
                className={`mac-upload-zone ${isDragging ? "mac-upload-zone--dragging" : ""} ${attachmentFile ? "mac-upload-zone--has-file" : ""}`}
                onClick={() => !attachmentFile && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDropFile}
              >
                {attachmentFile ? (
                  <div className="mac-file-preview">
                    <div className={`mac-file-preview__icon mac-file-preview__icon--${getFileExt(attachmentFile)}`}>
                      {getFileExt(attachmentFile).toUpperCase()}
                    </div>
                    <div className="mac-file-preview__info">
                      <div className="mac-file-preview__name">{attachmentFile.name}</div>
                      <div className="mac-file-preview__size">{formatFileSize(attachmentFile.size)}</div>
                    </div>
                    <button
                      type="button"
                      className="mac-file-preview__remove"
                      onClick={(e) => { e.stopPropagation(); setAttachmentFile(null); setUploadError(null); }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mac-upload-zone__icon">
                      <Upload size={18} />
                    </div>
                    <div className="mac-upload-zone__text">
                      <p>Kéo thả hoặc click để chọn file</p>
                      <span>Tối đa 10MB</span>
                    </div>
                    <div className="mac-upload-zone__accept">
                      <span className="mac-upload-zone__badge mac-upload-zone__badge--pdf">PDF</span>
                      <span className="mac-upload-zone__badge mac-upload-zone__badge--docx">DOCX</span>
                    </div>
                  </>
                )}
              </div>
              {uploadError && (
                <div className="mac-upload-error">
                  <AlertCircle size={13} /> {uploadError}
                </div>
              )}
            </div>

            <div className="mac-form-group">
              <label className="mac-label">Loại evidence yêu cầu</label>
              <div className="mac-evidence-types">
                {(["text", "link", "file", "mixed"] as const).map((t) => (
                  <button
                    key={t}
                    className={`mac-type-btn ${evidenceType === t ? "active" : ""}`}
                    onClick={() => setEvidenceType(t)}
                  >
                    {t === "text" && "📝 Văn bản"}
                    {t === "link" && "🔗 Link"}
                    {t === "file" && "📎 File"}
                    {t === "mixed" && "📦 Tất cả"}
                  </button>
                ))}
              </div>
            </div>

            {/* Rubric Items */}
            <div className="mac-rubric">
              <div className="mac-rubric-header">
                <span className="mac-label">
                  Rubric ({rubricItems.length} tiêu chí)
                </span>
                <span
                  className="mac-weight-total"
                  style={{
                    color:
                      totalWeight === 100 ? "var(--mr-success)" : "#f59e0b",
                  }}
                >
                  Tổng: {totalWeight}%
                </span>
              </div>

              {rubricItems.map((item, idx) => (
                <div key={item.id} className="mac-rubric-item">
                  <span className="mac-rubric-num">{idx + 1}</span>
                  <input
                    type="text"
                    className="mac-input mac-rubric-criterion"
                    value={item.criterion}
                    onChange={(e) =>
                      updateRubricItem(item.id, "criterion", e.target.value)
                    }
                    placeholder="Tiêu chí đánh giá..."
                  />
                  <div className="mac-rubric-weight">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="mac-input mac-rubric-weight-input"
                      value={item.weight}
                      onChange={(e) =>
                        updateRubricItem(
                          item.id,
                          "weight",
                          Number(e.target.value),
                        )
                      }
                    />
                    <span>%</span>
                  </div>
                  <button
                    className="mac-rubric-remove"
                    onClick={() => removeRubricItem(item.id)}
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button className="mac-add-rubric" onClick={addRubricItem}>
                <Plus size={14} /> Thêm tiêu chí
              </button>
            </div>

            <button
              className="mac-submit-btn"
              onClick={handleSaveRequirements}
              disabled={savingRequirements || !nodeId}
              style={{ marginTop: "1rem" }}
            >
              <Save size={16} />{" "}
              {savingRequirements ? "Đang lưu..." : "Lưu yêu cầu Assessment"}
            </button>

            {nodes.length > 0 && !nodeId && (
              <div className="mac-context-hint">
                <AlertCircle size={14} />
                <span>
                  Roadmap có {nodes.length} node. Vui lòng chọn một node để lưu
                  assignment.
                </span>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Existing Assessment Review (Only show at Journey level) */}
      {!nodeId && (
        <div className="mac-section">
          <div
            className="mac-section-label"
            style={{
              padding: "0.75rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FileText size={16} /> Submission Output Assessment (Final)
          </div>

          {loading ? (
            <div className="mac-loading">
              <Clock size={16} /> Đang tải...
            </div>
          ) : !assessment ? (
            <div className="mac-empty-assessment">
              <Clock size={28} />
              <p>Học viên chưa nộp output assessment.</p>
              <span>
                Sau khi hoàn thành các node, học viên sẽ nộp bài tại đây.
              </span>
            </div>
          ) : (
            <div className="mac-assessment-card">
              {/* Status badge */}
              <div className="mac-assessment-status">
                <span
                  className={`mac-status-badge mac-status-badge--${assessment.assessmentStatus}`}
                >
                  {assessment.assessmentStatus === "APPROVED" && (
                    <>
                      <CheckCircle size={13} /> Đã duyệt
                    </>
                  )}
                  {assessment.assessmentStatus === "REJECTED" && (
                    <>
                      <AlertCircle size={13} /> Từ chối
                    </>
                  )}
                  {assessment.assessmentStatus === "PENDING" && (
                    <>
                      <Clock size={13} /> Chờ đánh giá
                    </>
                  )}
                </span>
                <span className="mac-assessment-date">
                  Nộp:{" "}
                  {new Date(assessment.submittedAt).toLocaleString("vi-VN")}
                </span>
              </div>

              {/* Submission content */}
              <div className="mac-assessment-body">
                <div className="mac-field">
                  <label>Nội dung:</label>
                  <div className="mac-field-text">
                    {assessment.submissionText || "(Không có nội dung)"}
                  </div>
                </div>
                {assessment.evidenceUrl && (
                  <div className="mac-field">
                    <label>Evidence:</label>
                    <a
                      href={assessment.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mac-link"
                    >
                      Xem evidence ↗
                    </a>
                  </div>
                )}
                {assessment.attachmentUrl && (
                  <div className="mac-field">
                    <label>Attachment:</label>
                    <a
                      href={assessment.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mac-link"
                    >
                      Tải file ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Assessment form */}
              {!alreadyAssessed && (
                <div className="mac-assess-form">
                  <div className="mac-form-group">
                    <label className="mac-label">Quyết định:</label>
                    <div className="mac-decision-btns">
                      <button
                        className={`mac-decision-btn mac-decision-btn--approve ${assessStatus === "APPROVED" ? "active" : ""}`}
                        onClick={() => setAssessStatus("APPROVED")}
                      >
                        <CheckCircle size={16} /> APPROVE
                      </button>
                      <button
                        className={`mac-decision-btn mac-decision-btn--reject ${assessStatus === "REJECTED" ? "active" : ""}`}
                        onClick={() => setAssessStatus("REJECTED")}
                      >
                        <AlertCircle size={16} /> REJECT
                      </button>
                    </div>
                  </div>

                  <div className="mac-form-group">
                    <label className="mac-label">Điểm (0-100, tùy chọn):</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="mac-input"
                      value={assessScore || ""}
                      onChange={(e) =>
                        setAssessScore(
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="0-100"
                      style={{ maxWidth: "120px" }}
                    />
                  </div>

                  <div className="mac-form-group">
                    <label className="mac-label">Feedback:</label>
                    <textarea
                      className="mac-textarea"
                      value={assessFeedback}
                      onChange={(e) => setAssessFeedback(e.target.value)}
                      placeholder="Nhập feedback chi tiết cho học viên..."
                      rows={3}
                    />
                  </div>

                  <button
                    className="mac-submit-btn"
                    onClick={handleAssess}
                    disabled={assessing || assessStatus === "PENDING"}
                  >
                    <Save size={16} />{" "}
                    {assessing ? "Đang xử lý..." : "Gửi đánh giá"}
                  </button>
                </div>
              )}

              {alreadyAssessed && assessment.assessedAt && (
                <div className="mac-assessed-notice">
                  <CheckCircle size={14} />
                  Đã đánh giá lúc{" "}
                  {new Date(assessment.assessedAt).toLocaleString("vi-VN")}
                  {assessment.score != null && (
                    <span>
                      {" "}
                      — Điểm: <strong>{assessment.score}/100</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorAssessmentCreator;
