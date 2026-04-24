/**
 * MentorRoadmapWorkspacePanel — Phase 3 Redesign
 *
 * Full-featured workspace for mentors to manage student roadmaps:
 * - View/edit roadmap nodes (tree sidebar)
 * - Review node submissions & verify completions
 * - Schedule follow-up meetings
 * - Create assessments & send completion reports
 *
 * Layout: 2-column (sidebar tree + main action panel)
 * Theme: Neon Tech Cyan Blue
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Target,
  Video,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  RefreshCw,
  ChevronRight,
  FileText,
  Calendar,
  Clock,
  Layers,
  MapPin,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Hourglass,
  UserRound,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  mentorRoadmapWorkspaceService,
  RoadmapMentorWorkspaceResponse,
  RoadmapFollowUpMeetingDTO,
  RoadmapMentorNodeUpsertRequest,
} from "../../services/mentorRoadmapWorkspaceService";
import { getNodeAssignment } from "../../services/nodeMentoringService";
import { useAppToast } from "../../context/ToastContext";
import type { NodeAssignmentResponse } from "../../types/NodeMentoring";
import RoadmapNodeRequirementsCard from "../roadmap/RoadmapNodeRequirementsCard";
import NodeMentoringWorkspace from "./NodeMentoringWorkspace";
import MentorAssessmentCreator from "./MentorAssessmentCreator";
import MentorCompletionReportForm from "./MentorCompletionReportForm";
import MentorNodeReportTab from "./MentorNodeReportTab";
import RichTextEditor from "../shared/RichTextEditor";
import {
  EditableRequirementField,
  listToMultilineText,
  multilineTextToList,
  normalizeRequirementItems,
  resolvePrerequisiteIds,
  resolvePrerequisiteLabels,
} from "../../utils/roadmapNodeRequirements";
import "./MentorRoadmapWorkspace.css";

interface Props {
  bookingId: number;
}

/** Helper: extract nodes array from the workspace roadmap response */
const getNodes = (workspace: RoadmapMentorWorkspaceResponse | null): any[] => {
  if (!workspace?.roadmap) return [];
  // Backend returns { roadmap: [...nodes], statistics: {...}, ... }
  const r = workspace.roadmap;
  if (Array.isArray(r.roadmap)) return r.roadmap;
  if (Array.isArray(r.nodes)) return r.nodes;
  if (Array.isArray(r)) return r;
  return [];
};

const MentorRoadmapWorkspacePanel: React.FC<Props> = ({ bookingId }) => {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] =
    useState<RoadmapMentorWorkspaceResponse | null>(null);
  const { showSuccess, showError } = useAppToast();
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Sidebar selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Right panel tab
  const [rightTab, setRightTab] = useState<
    "MENTORING" | "EDIT_NODE" | "ASSESSMENT" | "REPORT"
  >("MENTORING");

  // Overview panel tab (when no node selected)
  const [overviewTab, setOverviewTab] = useState<
    "GATE" | "ASSESSMENT" | "REPORT"
  >("GATE");

  // Follow-up Meeting modal
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] =
    useState<Partial<RoadmapFollowUpMeetingDTO> | null>(null);
  const [meetingSaving, setMeetingSaving] = useState(false);

  // Node editor modal (for creating new nodes)
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<
    Partial<RoadmapMentorNodeUpsertRequest> & { isNew?: boolean }
  >({});
  const [nodeSaving, setNodeSaving] = useState(false);

  // Inline edit state for the EDIT_NODE tab
  const [inlineEdit, setInlineEdit] = useState<
    Partial<RoadmapMentorNodeUpsertRequest>
  >({});
  const [selectedNodeAssignment, setSelectedNodeAssignment] =
    useState<NodeAssignmentResponse | null>(null);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const data = await mentorRoadmapWorkspaceService.getWorkspace(bookingId);
      setWorkspace(data);
    } catch (err: any) {
      console.error(err);
      showError(
        "Lỗi",
        err.response?.data?.message || "Không thể tải workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId, showError]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const nodes = getNodes(workspace);
  const selectedNode = nodes.find((n: any) => n.id === selectedNodeId);
  const stats = workspace?.roadmap?.statistics;
  const hasRoadmap = workspace?.roadmapSessionId != null;

  // Node MAIN cuối cùng trong roadmap được coi là Final Assessment node.
  const finalNodeId: string | null = useMemo(() => {
    if (!nodes.length) return null;
    const mainOnly = nodes.filter((n: any) => n.type !== "SIDE");
    const last = (mainOnly.length > 0 ? mainOnly : nodes).slice(-1)[0];
    return last?.id ?? null;
  }, [nodes]);

  const isFinalSelected = !!selectedNodeId && selectedNodeId === finalNodeId;

  // Build workspace summary for the completion report
  const workspaceSummary = useMemo(() => {
    if (!workspace) return undefined;
    const meetings = workspace.followUpMeetings || [];
    return {
      totalNodes: stats?.totalNodes ?? nodes.length,
      mainNodes:
        stats?.mainNodes ?? nodes.filter((n: any) => n.type !== "SIDE").length,
      sideNodes:
        stats?.sideNodes ?? nodes.filter((n: any) => n.type === "SIDE").length,
      totalMeetings: meetings.length,
      completedMeetings: meetings.filter((m) => m.status === "COMPLETED")
        .length,
      assessmentStatus: undefined, // Will be populated by MentorAssessmentCreator
      learnerName: workspace.booking?.learnerName,
      bookingStatus: workspace.booking?.status,
    };
  }, [workspace, stats, nodes]);

  // Reset inline edit when node selection changes
  useEffect(() => {
    if (selectedNode) {
      setInlineEdit({
        nodeId: selectedNode.id,
        title: selectedNode.title || "",
        description: selectedNode.description || "",
        estimatedTimeMinutes: selectedNode.estimatedTimeMinutes ?? 120,
        type: selectedNode.type || "MAIN",
        difficulty: selectedNode.difficulty || "medium",
        learningObjectives: normalizeRequirementItems(
          selectedNode.learningObjectives,
        ),
        keyConcepts: normalizeRequirementItems(selectedNode.keyConcepts),
        practicalExercises: normalizeRequirementItems(
          selectedNode.practicalExercises,
        ),
        successCriteria: normalizeRequirementItems(
          selectedNode.successCriteria,
        ),
        prerequisites: resolvePrerequisiteLabels(
          selectedNode.prerequisites,
          nodes,
        ),
      });
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedNodeId || !workspace?.journeyId) {
      setSelectedNodeAssignment(null);
      return () => {
        cancelled = true;
      };
    }

    setSelectedNodeAssignment(null);

    getNodeAssignment(workspace.journeyId, selectedNodeId)
      .then((assignment) => {
        if (!cancelled) {
          setSelectedNodeAssignment(assignment);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedNodeAssignment(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNodeId, workspace?.journeyId]);

  const handleInlineListChange = useCallback(
    (field: EditableRequirementField, value: string) => {
      setInlineEdit((previous) => ({
        ...previous,
        [field]: multilineTextToList(value),
      }));
    },
    [],
  );

  const getInlineListValue = (field: EditableRequirementField): string =>
    listToMultilineText((inlineEdit[field] as string[] | undefined) ?? []);

  // ─── Handlers ───────────────────────────────────────────────

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting?.title || !editingMeeting.scheduledAt) {
      showError("Lỗi", "Vui lòng điền tiêu đề và thời gian.");
      return;
    }
    if (!editingMeeting.purpose || !editingMeeting.purpose.trim()) {
      showError(
        "Thiếu mục đích",
        "Mỗi buổi họp phải có mục đích rõ ràng để học viên nắm nội dung trước khi chấp nhận.",
      );
      return;
    }
    try {
      setMeetingSaving(true);
      if (editingMeeting.id) {
        await mentorRoadmapWorkspaceService.updateFollowUp(
          bookingId,
          editingMeeting.id,
          editingMeeting,
        );
        showSuccess("Thành công", "Đã cập nhật meeting.");
      } else {
        await mentorRoadmapWorkspaceService.createFollowUp(bookingId, {
          title: editingMeeting.title,
          scheduledAt: editingMeeting.scheduledAt,
          durationMinutes: editingMeeting.durationMinutes || 60,
          meetingLink: editingMeeting.meetingLink,
          agenda: editingMeeting.agenda,
          purpose: editingMeeting.purpose,
        } as RoadmapFollowUpMeetingDTO);
        showSuccess(
          "Đã gửi yêu cầu",
          "Meeting được tạo, chờ học viên chấp nhận để kích hoạt link tham gia.",
        );
      }
      setMeetingModalOpen(false);
      loadWorkspace();
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể lưu meeting.");
    } finally {
      setMeetingSaving(false);
    }
  };

  const handleAcceptMeeting = async (meetingId: number) => {
    try {
      await mentorRoadmapWorkspaceService.acceptFollowUp(bookingId, meetingId);
      showSuccess(
        "Đã chấp nhận",
        "Meeting đã được kích hoạt. Link tham gia sẵn sàng.",
      );
      loadWorkspace();
    } catch (err: any) {
      showError(
        "Không thể chấp nhận",
        err?.response?.data?.message || "Vui lòng thử lại.",
      );
    }
  };

  const handleRejectMeeting = async (meetingId: number) => {
    const reason = window.prompt(
      "Nhập lý do từ chối (tùy chọn) — học viên/mentor sẽ nhận được:",
      "",
    );
    if (reason === null) return; // user cancelled
    try {
      await mentorRoadmapWorkspaceService.rejectFollowUp(
        bookingId,
        meetingId,
        reason || undefined,
      );
      showSuccess("Đã từ chối", "Meeting đã được đánh dấu từ chối.");
      loadWorkspace();
    } catch (err: any) {
      showError(
        "Không thể từ chối",
        err?.response?.data?.message || "Vui lòng thử lại.",
      );
    }
  };

  const handleDeleteFollowUp = async (meetingId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa meeting này?")) return;
    try {
      await mentorRoadmapWorkspaceService.deleteFollowUp(bookingId, meetingId);
      showSuccess("Thành công", "Đã xóa meeting.");
      loadWorkspace();
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể xóa meeting.");
    }
  };

  const handleSaveNodeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode.title) {
      showError("Lỗi", "Vui lòng nhập tên Node.");
      return;
    }
    try {
      setNodeSaving(true);
      if (editingNode.isNew) {
        await mentorRoadmapWorkspaceService.createNode(
          bookingId,
          editingNode as RoadmapMentorNodeUpsertRequest,
        );
        showSuccess("Thành công", "Đã thêm Node mới.");
      } else if (editingNode.nodeId) {
        await mentorRoadmapWorkspaceService.updateNode(
          bookingId,
          editingNode.nodeId,
          editingNode as RoadmapMentorNodeUpsertRequest,
        );
        showSuccess("Thành công", "Đã cập nhật Node.");
      }
      setNodeModalOpen(false);
      loadWorkspace();
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể lưu Node.");
    } finally {
      setNodeSaving(false);
    }
  };

  const handleInlineSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineEdit.title || !selectedNode) return;
    try {
      setNodeSaving(true);
      await mentorRoadmapWorkspaceService.updateNode(
        bookingId,
        selectedNode.id,
        {
          ...inlineEdit,
          nodeId: selectedNode.id,
          prerequisites: resolvePrerequisiteIds(
            (inlineEdit.prerequisites as string[] | undefined) ?? [],
            nodes,
          ),
        } as RoadmapMentorNodeUpsertRequest,
      );
      showSuccess("Thành công", "Đã cập nhật Node.");
      setSelectedNodeId(selectedNode.id);
      loadWorkspace();
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể lưu Node.");
    } finally {
      setNodeSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mrw-loading">
        <div className="spinner" />
        <p>Đang tải Workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mrw-empty">
        <AlertTriangle size={48} />
        <h4>Không có dữ liệu workspace</h4>
        <p>Không thể kết nối đến hệ thống. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const booking = workspace.booking;

  return (
    <div className="mrw-shell">
      {/* ── Top Bar ── */}
      <div className="mrw-topbar">
        <div className="mrw-topbar-left">
          <h2 className="mrw-topbar-title">
            <Layers size={20} /> Workspace Đồng Hành
          </h2>
          <p className="mrw-topbar-sub">
            <span>Booking #{booking.id}</span>
            <span>•</span>
            <span>
              Học viên: <strong>{booking.learnerName || "N/A"}</strong>
            </span>
            <span className="mrw-chip mrw-chip--status">{booking.status}</span>
          </p>
        </div>
        <div className="mrw-topbar-actions">
          <button
            className="mrw-btn-icon"
            onClick={loadWorkspace}
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {stats && (
        <div className="mrw-stats-bar">
          <span className="mrw-stat">
            <Layers size={12} /> Tổng:{" "}
            <strong>{stats.totalNodes ?? nodes.length}</strong>
          </span>
          <span className="mrw-stat">
            <MapPin size={12} /> Chính:{" "}
            <strong>{stats.mainNodes ?? "—"}</strong>
          </span>
          <span className="mrw-stat">
            <Target size={12} /> Phụ: <strong>{stats.sideNodes ?? "—"}</strong>
          </span>
          {stats.totalEstimatedHours != null && (
            <span className="mrw-stat">
              <Clock size={12} /> ~<strong>{stats.totalEstimatedHours}h</strong>
            </span>
          )}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="mrw-grid">
        {/* ─ Left Sidebar ─ */}
        <div className="mrw-sidebar">
          {/* Roadmap Tree */}
          <div
            className="mrw-sidebar-section"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div className="mrw-section-header">
              <h4 className="mrw-section-title">
                <Layers size={15} /> Roadmap
              </h4>
              {hasRoadmap && (
                <button
                  className="mrw-btn-sm"
                  onClick={() => {
                    setEditingNode({
                      isNew: true,
                      title: "",
                      type: "MAIN",
                      estimatedTimeMinutes: 120,
                      parentId: undefined,
                    });
                    setNodeModalOpen(true);
                  }}
                >
                  <Plus size={12} /> Thêm
                </button>
              )}
            </div>

            <div className="mrw-tree">
              {!hasRoadmap ? (
                <div className="mrw-waiting">
                  <div className="mrw-waiting-icon">
                    <Clock size={24} />
                  </div>
                  <h4>Chờ tạo Roadmap</h4>
                  <p>
                    Học viên cần hoàn thành bài đánh giá năng lực để hệ thống
                    tạo roadmap. Workspace sẽ tự động cập nhật.
                  </p>
                </div>
              ) : nodes.length === 0 ? (
                <div className="mrw-empty" style={{ padding: "1.5rem 0" }}>
                  <FileText size={32} />
                  <p style={{ fontSize: "0.82rem" }}>
                    Chưa có node nào. Thêm node đầu tiên để bắt đầu.
                  </p>
                </div>
              ) : (
                nodes.map((node: any, i: number) => {
                  const isFinal = node.id === finalNodeId;
                  return (
                    <div
                      key={node.id}
                      className={`mrw-node ${selectedNodeId === node.id ? "mrw-node--active" : ""} ${isFinal ? "mrw-node--final" : ""}`}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setRightTab("MENTORING");
                      }}
                    >
                      <span className="mrw-node-index">{i + 1}</span>
                      <div className="mrw-node-info">
                        <p className="mrw-node-name">
                          {node.title}
                          {isFinal && (
                            <span
                              className="mrw-node-final-badge"
                              title="Node cuối — Final Assessment"
                            >
                              <Star size={10} /> Final
                            </span>
                          )}
                        </p>
                        <div className="mrw-node-meta">
                          <span
                            className={`mrw-node-type mrw-node-type--${node.type || "MAIN"}`}
                          >
                            {node.type === "SIDE" ? "Phụ" : "Chính"}
                          </span>
                          <span>{node.estimatedTimeMinutes || "—"} phút</span>
                          {node.difficulty && <span>• {node.difficulty}</span>}
                        </div>
                      </div>
                      <ChevronRight size={14} className="mrw-node-chevron" />
                    </div>
                  );
                })
              )}

              {/* Overview / Gate button */}
              <button
                className={`mrw-overview-btn ${!selectedNodeId ? "mrw-overview-btn--active" : ""}`}
                onClick={() => setSelectedNodeId(null)}
              >
                <Target size={15} /> Thông tin chung & Gate
              </button>
            </div>
          </div>

          {/* Follow-up Meetings */}
          <div className="mrw-sidebar-section">
            <div className="mrw-section-header">
              <h4 className="mrw-section-title">
                <Calendar size={15} /> Lịch hẹn (
                {workspace.followUpMeetings.length})
              </h4>
              <button
                className="mrw-btn-sm"
                onClick={() => {
                  setEditingMeeting({
                    title: "",
                    scheduledAt: new Date().toISOString().slice(0, 16),
                    durationMinutes: 60,
                  });
                  setMeetingModalOpen(true);
                }}
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="mrw-meetings-list">
              {workspace.followUpMeetings.length > 0 ? (
                workspace.followUpMeetings.map((m) => {
                  const status = (m.status || "SCHEDULED").toUpperCase();
                  const canAccept =
                    status === "PENDING_MENTOR" ||
                    (status === "SCHEDULED" &&
                      m.createdByUserId != null &&
                      m.createdByUserId !== currentUserId);
                  const waitingLearner = status === "PENDING_LEARNER";
                  const isCreator =
                    m.createdByUserId != null &&
                    m.createdByUserId === currentUserId;
                  const statusLabel =
                    status === "PENDING_MENTOR"
                      ? "Chờ mentor chấp nhận"
                      : status === "PENDING_LEARNER"
                        ? "Chờ học viên chấp nhận"
                        : status === "ACCEPTED"
                          ? "Đã kích hoạt"
                          : status === "REJECTED"
                            ? "Đã từ chối"
                            : status === "CANCELLED"
                              ? "Đã huỷ"
                              : status === "COMPLETED"
                                ? "Đã hoàn tất"
                                : status === "SCHEDULED"
                                  ? "Đã lên lịch"
                                  : status;
                  const creatorLabel =
                    m.createdByRole === "LEARNER"
                      ? "Học viên đề xuất"
                      : "Mentor đề xuất";
                  const canJoin =
                    m.canJoin === true ||
                    (status === "ACCEPTED" && !!m.meetingLink);
                  return (
                    <div
                      key={m.id}
                      className={`mrw-meeting-card mrw-meeting-card--${status}`}
                    >
                      <div className="mrw-meeting-top">
                        <span className="mrw-meeting-title">{m.title}</span>
                        <span
                          className={`mrw-meeting-status mrw-meeting-status--${status}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      {m.purpose && (
                        <p className="mrw-meeting-purpose">
                          <Target size={11} /> {m.purpose}
                        </p>
                      )}
                      <div className="mrw-meeting-time">
                        <Clock size={11} />{" "}
                        {new Date(m.scheduledAt).toLocaleString("vi-VN")}
                        {m.durationMinutes
                          ? ` • ${m.durationMinutes} phút`
                          : ""}
                      </div>
                      <div className="mrw-meeting-creator">
                        <UserRound size={11} /> {creatorLabel}
                      </div>
                      {status === "REJECTED" && m.rejectReason && (
                        <p className="mrw-meeting-reject-reason">
                          Lý do: {m.rejectReason}
                        </p>
                      )}
                      <div className="mrw-meeting-actions">
                        {canAccept && (
                          <button
                            className="mrw-accept-btn"
                            onClick={() => handleAcceptMeeting(m.id!)}
                            title="Chấp nhận meeting"
                          >
                            <CheckCircle2 size={13} /> Chấp nhận
                          </button>
                        )}
                        {(canAccept || waitingLearner) && (
                          <button
                            className="mrw-reject-btn"
                            onClick={() => handleRejectMeeting(m.id!)}
                            title="Từ chối meeting"
                          >
                            <XCircle size={13} /> Từ chối
                          </button>
                        )}
                        {waitingLearner && (
                          <span className="mrw-meeting-hint">
                            <Hourglass size={11} /> Đang chờ học viên
                          </span>
                        )}
                        {isCreator &&
                          status !== "ACCEPTED" &&
                          status !== "COMPLETED" && (
                            <button
                              onClick={() => {
                                setEditingMeeting(m);
                                setMeetingModalOpen(true);
                              }}
                              title="Sửa"
                            >
                              <Edit size={13} />
                            </button>
                          )}
                        {isCreator && (
                          <button
                            className="mrw-delete-btn"
                            onClick={() => handleDeleteFollowUp(m.id!)}
                            title="Xóa"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        {canJoin && m.meetingLink && (
                          <a
                            className="mrw-join-btn"
                            href={m.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Tham gia meeting"
                          >
                            <Video size={13} /> Tham gia
                          </a>
                        )}
                        {!canJoin && m.meetingLink && status !== "REJECTED" && (
                          <span
                            className="mrw-meeting-link-preview"
                            title={m.meetingLink}
                          >
                            <LinkIcon size={11} /> Link sẽ mở sau khi chấp nhận
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p
                  style={{
                    color: "var(--mr-text-dim)",
                    fontSize: "0.8rem",
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  Chưa có lịch hẹn nào. Mọi buổi họp cần có mục đích và thời
                  gian rõ ràng.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─ Right Main Panel ─ */}
        <div className="mrw-main">
          {selectedNodeId ? (
            <>
              {/* Tab Bar — 4 tabs for selected node */}
              <div className="mrw-panel-tabs">
                <button
                  className={`mrw-panel-tab ${rightTab === "MENTORING" ? "mrw-panel-tab--active" : ""}`}
                  onClick={() => setRightTab("MENTORING")}
                >
                  <FileText size={15} /> Review
                </button>
                <button
                  className={`mrw-panel-tab ${rightTab === "EDIT_NODE" ? "mrw-panel-tab--active" : ""}`}
                  onClick={() => setRightTab("EDIT_NODE")}
                >
                  <Edit size={15} /> Chỉnh sửa
                </button>
                <button
                  className={`mrw-panel-tab ${rightTab === "ASSESSMENT" ? "mrw-panel-tab--active" : ""}`}
                  onClick={() => setRightTab("ASSESSMENT")}
                >
                  <ClipboardList size={15} /> Yêu cầu node
                </button>
                <button
                  className={`mrw-panel-tab ${rightTab === "REPORT" ? "mrw-panel-tab--active" : ""}`}
                  onClick={() => setRightTab("REPORT")}
                >
                  <ShieldCheck size={15} /> Report
                </button>
              </div>

              {/* Tab Content */}
              <div className="mrw-panel-content">
                {selectedNode && (
                  <div
                    className={`mrw-selected-node-summary ${isFinalSelected ? "mrw-selected-node-summary--final" : ""}`}
                  >
                    {isFinalSelected && (
                      <div className="mrw-final-banner">
                        <Star size={14} />
                        <div>
                          <strong>Node cuối — Final Assessment</strong>
                          <span>
                            Đây là node kết thúc roadmap. Assignment giao ở đây
                            được xem như bài bảo vệ cuối kỳ; report sẽ ảnh hưởng
                            trực tiếp tới gate hoàn thành.
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="mrw-selected-node-summary__header">
                      <div>
                        <p className="mrw-selected-node-summary__eyebrow">
                          Student Preview
                        </p>
                        <h3 className="mrw-selected-node-summary__title">
                          Yêu cầu hiện tại của node
                        </h3>
                        <p className="mrw-selected-node-summary__desc">
                          <strong>Chỉnh sửa</strong> — cập nhật tiêu đề, mô tả,
                          mục tiêu, khái niệm, bài tập, tiêu chí hoàn thành của
                          node. <strong>Yêu cầu node</strong> — soạn assignment
                          (markdown), rubric chấm điểm để học viên làm theo.
                        </p>
                      </div>
                      <div className="mrw-selected-node-summary__actions">
                        <button
                          type="button"
                          className="mrw-btn-sm"
                          onClick={() => setRightTab("EDIT_NODE")}
                        >
                          <Edit size={12} /> Sửa roadmap
                        </button>
                        <button
                          type="button"
                          className="mrw-btn-sm"
                          onClick={() => setRightTab("ASSESSMENT")}
                        >
                          <ClipboardList size={12} /> Sửa assignment
                        </button>
                      </div>
                    </div>
                    <RoadmapNodeRequirementsCard
                      node={selectedNode}
                      allNodes={nodes}
                      assignment={selectedNodeAssignment}
                      heading="Checklist học viên đang thấy"
                      intro="Khối này gom mô tả node, bài tập, tiêu chí hoàn thành và assignment hiện tại để mentor đối chiếu nhanh trước khi review."
                      emptyMessage="Node này chưa có mô tả hoặc yêu cầu rõ ràng. Hãy bổ sung ở tab Chỉnh sửa hoặc Yêu cầu node."
                    />
                  </div>
                )}

                {rightTab === "MENTORING" && (
                  <NodeMentoringWorkspace
                    booking={{
                      ...workspace.booking,
                      journeyId: workspace.journeyId,
                      nodeId: selectedNodeId,
                    }}
                    onActionComplete={loadWorkspace}
                  />
                )}

                {rightTab === "EDIT_NODE" && selectedNode && (
                  <div className="mrw-edit-form">
                    <div className="mrw-node-detail-header">
                      <Edit size={18} />
                      <h3>Chỉnh sửa: {selectedNode.title}</h3>
                    </div>
                    <form onSubmit={handleInlineSaveNode}>
                      <div className="mrw-form-group">
                        <label className="mrw-form-label">Tên Node</label>
                        <input
                          type="text"
                          className="mrw-form-input"
                          value={inlineEdit.title || ""}
                          onChange={(e) =>
                            setInlineEdit({
                              ...inlineEdit,
                              title: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="mrw-form-group">
                        <label className="mrw-form-label">Mô tả ngắn</label>
                        <RichTextEditor
                          initialContent={inlineEdit.description || ""}
                          onChange={(val) =>
                            setInlineEdit({ ...inlineEdit, description: val })
                          }
                          placeholder="Mô tả nội dung node..."
                          userId={user?.id}
                        />
                      </div>
                      <div className="mrw-form-row">
                        <div className="mrw-form-group">
                          <label className="mrw-form-label">
                            Thời gian (phút)
                          </label>
                          <input
                            type="number"
                            className="mrw-form-input"
                            value={inlineEdit.estimatedTimeMinutes || 120}
                            onChange={(e) =>
                              setInlineEdit({
                                ...inlineEdit,
                                estimatedTimeMinutes: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="mrw-form-group">
                          <label className="mrw-form-label">Loại Node</label>
                          <select
                            className="mrw-form-select"
                            value={inlineEdit.type || "MAIN"}
                            onChange={(e) =>
                              setInlineEdit({
                                ...inlineEdit,
                                type: e.target.value as any,
                              })
                            }
                          >
                            <option value="MAIN">Node Chính (Main)</option>
                            <option value="SIDE">Node Phụ (Side)</option>
                          </select>
                        </div>
                      </div>
                      <div className="mrw-form-group">
                        <label className="mrw-form-label">Độ khó</label>
                        <select
                          className="mrw-form-select"
                          value={inlineEdit.difficulty || "medium"}
                          onChange={(e) =>
                            setInlineEdit({
                              ...inlineEdit,
                              difficulty: e.target.value,
                            })
                          }
                        >
                          <option value="easy">Dễ (Easy)</option>
                          <option value="medium">Trung bình (Medium)</option>
                          <option value="hard">Khó (Hard)</option>
                        </select>
                      </div>
                      <div className="mrw-edit-section">
                        <h4 className="mrw-edit-section__title">
                          Yêu cầu hiển thị cho học viên
                        </h4>
                        <p className="mrw-form-hint">
                          Mỗi dòng là một ý riêng. Các mục này sẽ xuất hiện trực
                          tiếp trong roadmap workspace của học viên.
                        </p>
                      </div>
                      <div className="mrw-form-grid">
                        <div className="mrw-form-group">
                          <label className="mrw-form-label">
                            Mục tiêu học tập
                          </label>
                          <textarea
                            className="mrw-form-textarea"
                            value={getInlineListValue("learningObjectives")}
                            onChange={(e) =>
                              handleInlineListChange(
                                "learningObjectives",
                                e.target.value,
                              )
                            }
                            placeholder="Mỗi dòng là một mục tiêu học tập"
                          />
                        </div>
                        <div className="mrw-form-group">
                          <label className="mrw-form-label">
                            Khái niệm trọng tâm
                          </label>
                          <textarea
                            className="mrw-form-textarea"
                            value={getInlineListValue("keyConcepts")}
                            onChange={(e) =>
                              handleInlineListChange(
                                "keyConcepts",
                                e.target.value,
                              )
                            }
                            placeholder="Mỗi dòng là một khái niệm hoặc kiến thức chính"
                          />
                        </div>
                        <div className="mrw-form-group">
                          <label className="mrw-form-label">
                            Bài tập / đầu việc
                          </label>
                          <textarea
                            className="mrw-form-textarea"
                            value={getInlineListValue("practicalExercises")}
                            onChange={(e) =>
                              handleInlineListChange(
                                "practicalExercises",
                                e.target.value,
                              )
                            }
                            placeholder="Mỗi dòng là một bài tập hoặc sản phẩm cần làm"
                          />
                        </div>
                        <div className="mrw-form-group">
                          <label className="mrw-form-label">
                            Tiêu chí hoàn thành
                          </label>
                          <textarea
                            className="mrw-form-textarea"
                            value={getInlineListValue("successCriteria")}
                            onChange={(e) =>
                              handleInlineListChange(
                                "successCriteria",
                                e.target.value,
                              )
                            }
                            placeholder="Mỗi dòng là một tiêu chí để học viên biết khi nào node đã đạt"
                          />
                        </div>
                      </div>
                      <div className="mrw-form-group">
                        <label className="mrw-form-label">
                          Điều kiện tiên quyết
                        </label>
                        <textarea
                          className="mrw-form-textarea"
                          value={getInlineListValue("prerequisites")}
                          onChange={(e) =>
                            handleInlineListChange(
                              "prerequisites",
                              e.target.value,
                            )
                          }
                          placeholder="Mỗi dòng là một prerequisite hoặc node cần nắm trước"
                        />
                      </div>
                      <button
                        type="submit"
                        className="mrw-form-submit"
                        disabled={nodeSaving}
                      >
                        <Save size={16} />{" "}
                        {nodeSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </form>
                  </div>
                )}

                {rightTab === "ASSESSMENT" && (
                  <MentorAssessmentCreator
                    journeyId={workspace.journeyId}
                    nodeId={selectedNodeId}
                    bookingId={bookingId}
                    learnerName={workspace.booking?.learnerName}
                    nodes={nodes}
                    onAssessed={loadWorkspace}
                  />
                )}

                {rightTab === "REPORT" && (
                  <MentorNodeReportTab
                    journeyId={workspace.journeyId}
                    nodeId={selectedNodeId}
                    nodeTitle={selectedNode?.title}
                    learnerName={workspace.booking?.learnerName}
                    bookingId={bookingId}
                    onReportSubmitted={loadWorkspace}
                  />
                )}
              </div>
            </>
          ) : (
            /* Overview Panel — 3 tabs: Gate, Assessment, Report */
            <>
              <div className="mrw-panel-tabs">
                <button
                  className={`mrw-panel-tab ${overviewTab === "GATE" ? "mrw-panel-tab--active" : ""}`}
                  onClick={() => setOverviewTab("GATE")}
                >
                  <Target size={15} /> Gate & Xác nhận
                </button>
                <button
                  className={`mrw-panel-tab ${overviewTab === "ASSESSMENT" ? "mrw-panel-tab--active" : ""}`}
                  onClick={() => setOverviewTab("ASSESSMENT")}
                >
                  <ClipboardList size={15} /> Assessment
                </button>
                <button
                  className={`mrw-panel-tab ${overviewTab === "REPORT" ? "mrw-panel-tab--active" : ""}`}
                  onClick={() => setOverviewTab("REPORT")}
                >
                  <ShieldCheck size={15} /> Report
                </button>
              </div>
              <div className="mrw-panel-content">
                {overviewTab === "GATE" && (
                  <>
                    <div className="mrw-node-detail-header">
                      <Target size={20} />
                      <h3>Thông tin chung & Hành trình</h3>
                    </div>
                    <div className="mrw-overview-info">
                      <p>
                        Xem tổng quan, review bằng chứng học tập, và quyết định
                        xác nhận hoàn thành Roadmap cho học viên tại đây.
                      </p>
                    </div>
                    <NodeMentoringWorkspace
                      booking={{
                        ...workspace.booking,
                        journeyId: workspace.journeyId,
                      }}
                      onActionComplete={loadWorkspace}
                    />
                  </>
                )}

                {overviewTab === "ASSESSMENT" && (
                  <MentorAssessmentCreator
                    journeyId={workspace.journeyId}
                    bookingId={bookingId}
                    learnerName={workspace.booking?.learnerName}
                    nodes={nodes}
                    onAssessed={loadWorkspace}
                  />
                )}

                {overviewTab === "REPORT" && (
                  <MentorCompletionReportForm
                    journeyId={workspace.journeyId}
                    learnerName={workspace.booking?.learnerName}
                    bookingId={bookingId}
                    workspaceSummary={workspaceSummary}
                    onSubmitted={loadWorkspace}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Follow-Up Meeting Modal ── */}
      {meetingModalOpen && editingMeeting && (
        <div
          className="mrw-modal-overlay"
          onClick={() => setMeetingModalOpen(false)}
        >
          <div className="mrw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mrw-modal-header">
              <h3>
                <Calendar size={16} />{" "}
                {editingMeeting.id ? "Sửa Lịch Hẹn" : "Tạo Lịch Hẹn Mới"}
              </h3>
              <button
                className="mrw-modal-close"
                onClick={() => setMeetingModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="mrw-modal-body" onSubmit={handleSaveFollowUp}>
              <div className="mrw-form-group">
                <label className="mrw-form-label">Tiêu đề</label>
                <input
                  type="text"
                  className="mrw-form-input"
                  value={editingMeeting.title || ""}
                  onChange={(e) =>
                    setEditingMeeting({
                      ...editingMeeting,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="mrw-form-row">
                <div className="mrw-form-group">
                  <label className="mrw-form-label">Thời gian</label>
                  <input
                    type="datetime-local"
                    className="mrw-form-input"
                    value={
                      editingMeeting.scheduledAt
                        ? new Date(editingMeeting.scheduledAt)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setEditingMeeting({
                        ...editingMeeting,
                        scheduledAt: new Date(e.target.value).toISOString(),
                      })
                    }
                    required
                  />
                </div>
                <div className="mrw-form-group">
                  <label className="mrw-form-label">Thời lượng (phút)</label>
                  <input
                    type="number"
                    className="mrw-form-input"
                    value={editingMeeting.durationMinutes || 60}
                    onChange={(e) =>
                      setEditingMeeting({
                        ...editingMeeting,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="mrw-form-group">
                <label className="mrw-form-label">
                  Mục đích buổi họp <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="mrw-form-input"
                  value={editingMeeting.purpose || ""}
                  onChange={(e) =>
                    setEditingMeeting({
                      ...editingMeeting,
                      purpose: e.target.value,
                    })
                  }
                  placeholder="VD: Review checkpoint node 3, demo sản phẩm..."
                  required
                />
                <p className="mrw-form-hint">
                  Học viên phải thấy rõ mục đích trước khi chấp nhận tham gia.
                </p>
              </div>
              <div className="mrw-form-group">
                <label className="mrw-form-label">
                  Link Meeting (tuỳ chọn)
                </label>
                <input
                  type="url"
                  className="mrw-form-input"
                  value={editingMeeting.meetingLink || ""}
                  onChange={(e) =>
                    setEditingMeeting({
                      ...editingMeeting,
                      meetingLink: e.target.value,
                    })
                  }
                  placeholder="Để trống để hệ thống tự tạo link Jitsi"
                />
                <p className="mrw-form-hint">
                  Nếu bạn không điền, hệ thống sẽ tự sinh phòng Jitsi riêng cho
                  booking này.
                </p>
              </div>
              <div className="mrw-form-group">
                <label className="mrw-form-label">Agenda / Nội dung</label>
                <textarea
                  className="mrw-form-textarea"
                  value={editingMeeting.agenda || ""}
                  onChange={(e) =>
                    setEditingMeeting({
                      ...editingMeeting,
                      agenda: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mrw-modal-actions">
                <button
                  type="button"
                  className="mrw-btn-cancel"
                  onClick={() => setMeetingModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="mrw-btn-save"
                  disabled={meetingSaving}
                >
                  <Save size={14} /> {meetingSaving ? "Đang lưu..." : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Node Creator Modal ── */}
      {nodeModalOpen && editingNode && (
        <div
          className="mrw-modal-overlay"
          onClick={() => setNodeModalOpen(false)}
        >
          <div className="mrw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mrw-modal-header">
              <h3>
                <Plus size={16} /> Thêm Node Mới
              </h3>
              <button
                className="mrw-modal-close"
                onClick={() => setNodeModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="mrw-modal-body" onSubmit={handleSaveNodeModal}>
              <div className="mrw-form-group">
                <label className="mrw-form-label">Tên Node</label>
                <input
                  type="text"
                  className="mrw-form-input"
                  value={editingNode.title || ""}
                  onChange={(e) =>
                    setEditingNode({ ...editingNode, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mrw-form-group">
                <label className="mrw-form-label">Mô tả ngắn</label>
                <textarea
                  className="mrw-form-textarea"
                  value={editingNode.description || ""}
                  onChange={(e) =>
                    setEditingNode({
                      ...editingNode,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mrw-form-row">
                <div className="mrw-form-group">
                  <label className="mrw-form-label">Thời gian (phút)</label>
                  <input
                    type="number"
                    className="mrw-form-input"
                    value={editingNode.estimatedTimeMinutes || 120}
                    onChange={(e) =>
                      setEditingNode({
                        ...editingNode,
                        estimatedTimeMinutes: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="mrw-form-group">
                  <label className="mrw-form-label">Loại Node</label>
                  <select
                    className="mrw-form-select"
                    value={editingNode.type || "MAIN"}
                    onChange={(e) =>
                      setEditingNode({
                        ...editingNode,
                        type: e.target.value as any,
                      })
                    }
                  >
                    <option value="MAIN">Node Chính (Main)</option>
                    <option value="SIDE">Node Phụ (Side)</option>
                  </select>
                </div>
              </div>
              <div className="mrw-form-group" style={{ marginTop: "1rem" }}>
                <label className="mrw-form-label">Nhánh cha (Tùy chọn)</label>
                <select
                  className="mrw-form-select"
                  value={editingNode.parentId || ""}
                  onChange={(e) =>
                    setEditingNode({
                      ...editingNode,
                      parentId: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">
                    -- Tạo trực tiếp (Không có nhánh cha) --
                  </option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mrw-modal-actions">
                <button
                  type="button"
                  className="mrw-btn-cancel"
                  onClick={() => setNodeModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="mrw-btn-save"
                  disabled={nodeSaving}
                >
                  <Save size={14} /> {nodeSaving ? "Đang lưu..." : "Tạo Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorRoadmapWorkspacePanel;
