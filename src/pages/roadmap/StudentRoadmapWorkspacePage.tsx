import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  Send,
  Award,
  Clock,
  Target,
  ChevronRight,
  Hash,
  Calendar,
  Plus,
  Video,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Hourglass,
  UserRound,
  Link as LinkIcon,
  Save,
  Upload,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { useAppToast } from "../../context/ToastContext";
import aiRoadmapService from "../../services/aiRoadmapService";
import journeyService from "../../services/journeyService";
import { getMyBookings } from "../../services/bookingService";
import {
  mentorRoadmapWorkspaceService,
  RoadmapFollowUpMeetingDTO,
} from "../../services/mentorRoadmapWorkspaceService";
import { useAuth } from "../../context/AuthContext";
import { RoadmapResponse } from "../../types/Roadmap";

import RoadmapNodeRequirementsCard from "../../components/roadmap/RoadmapNodeRequirementsCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getNodeAssignment,
  getNodeEvidence,
  submitNodeEvidence,
  selfConfirmNode,
  getLatestOutputAssessment,
  submitOutputAssessment,
  getCompletionGate,
  getLatestCompletionReport,
} from "../../services/nodeMentoringService";
import { uploadEvidence } from "../../services/mentorVerificationService";
import { taskBoardService } from "../../services/taskBoardService";
import {
  uploadDocument,
  uploadImage,
  validateDocument,
  formatFileSize,
  getForceDownloadUrl,
  getFileExtFromUrl,
} from "../../services/fileUploadService";
import { confirmAction } from "../../context/ConfirmDialogContext";
import {
  NodeAssignmentResponse,
  NodeEvidenceRecordResponse,
  JourneyOutputAssessmentResponse,
  JourneyCompletionGateResponse,
  JourneyCompletionReportResponse,
} from "../../types/NodeMentoring";
import "./StudentRoadmapWorkspacePage.css";

const canSubmitNodeEvidence = (
  record?: NodeEvidenceRecordResponse | null,
): boolean => {
  if (!record) return true;
  return (
    record.submissionStatus === "DRAFT" ||
    record.submissionStatus === "REWORK_REQUESTED" ||
    record.verificationStatus === "REJECTED" ||
    record.latestReview?.reviewResult === "REWORK_REQUESTED" ||
    record.latestReview?.reviewResult === "REJECTED" ||
    record.latestVerification?.nodeVerificationStatus === "REJECTED"
  );
};

const canSubmitFinalAssessment = (
  assessment?: JourneyOutputAssessmentResponse | null,
): boolean => !assessment || assessment.assessmentStatus === "REJECTED";

const formatNodeSubmissionStatus = (status?: string) => {
  switch (status) {
    case "SUBMITTED":
      return "Đã nộp";
    case "RESUBMITTED":
      return "Đã nộp lại";
    case "REWORK_REQUESTED":
      return "Cần làm lại";
    case "WITHDRAWN":
      return "Đã rút";
    case "DRAFT":
      return "Bản nháp";
    default:
      return status || "Chưa nộp";
  }
};

const formatNodeVerificationStatus = (status?: string) => {
  switch (status) {
    case "VERIFIED":
      return "Đã xác thực";
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Cần nộp lại";
    case "UNDER_REVIEW":
      return "Đang xem xét";
    case "PENDING":
      return "Chờ đánh giá";
    default:
      return status || "Chờ đánh giá";
  }
};

const formatNodeReviewResult = (status?: string) => {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "REWORK_REQUESTED":
      return "Cần làm lại";
    case "REJECTED":
      return "Từ chối";
    default:
      return status || "Chưa đánh giá";
  }
};

const formatFinalAssessmentStatus = (status?: string) => {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Cần nộp lại";
    case "PENDING":
      return "Chờ đánh giá";
    default:
      return status || "Chưa nộp";
  }
};

const StudentRoadmapWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // roadmapSessionId
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useAppToast();
  const routeState =
    (location.state as {
      journeyId?: number;
      selectedNodeId?: string | null;
    } | null) ?? null;
  const searchParams = new URLSearchParams(location.search);
  const preferredNodeId =
    routeState?.selectedNodeId?.trim() ||
    searchParams.get("nodeId")?.trim() ||
    null;
  const journeyIdFromQuery = Number(searchParams.get("journeyId") || 0);
  const preferredJourneyId =
    routeState?.journeyId ??
    (Number.isFinite(journeyIdFromQuery) && journeyIdFromQuery > 0
      ? journeyIdFromQuery
      : null);

  const { user } = useAuth();
  const currentUserId = user?.id;

  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);

  // Need journeyId. In RoadmapResponse, journeyId isn't explicitly at top level unless we map it.
  // Let's assume we can get it from the session info or we use roadmapSessionId directly.
  // Actually, the API for nodeMentoringService requires journeyId.
  // We need to fetch the journeyId from the roadmap session.
  const [journeyId, setJourneyId] = useState<number | null>(null);

  // Booking context for mentoring meetings (ROADMAP_MENTORING booking)
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [meetings, setMeetings] = useState<RoadmapFollowUpMeetingDTO[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [meetingDraft, setMeetingDraft] = useState<
    Partial<RoadmapFollowUpMeetingDTO>
  >({});
  const [meetingSaving, setMeetingSaving] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"ASSIGNMENT" | "SUBMIT" | "REPORT">(
    "ASSIGNMENT",
  );

  // Node State
  const [assignment, setAssignment] = useState<NodeAssignmentResponse | null>(
    null,
  );
  const [evidence, setEvidence] = useState<NodeEvidenceRecordResponse | null>(
    null,
  );

  // ── Separated submit form state for node vs final (fix cross-contamination) ──
  const [nodeSubmissionText, setNodeSubmissionText] = useState("");
  const [nodeEvidenceUrl, setNodeEvidenceUrl] = useState("");
  const [finalSubmissionText, setFinalSubmissionText] = useState("");
  const [finalEvidenceUrl, setFinalEvidenceUrl] = useState("");

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Final Output State
  const [finalAssessment, setFinalAssessment] =
    useState<JourneyOutputAssessmentResponse | null>(null);

  // Final Assessment requirement (saved by mentor on the FINAL node assignment)
  const [finalAssignment, setFinalAssignment] =
    useState<NodeAssignmentResponse | null>(null);

  // Gate + completion report — needed so student sees PASS/FAIL result after
  // mentor submits completion report (even without a graded output assessment).
  const [completionGate, setCompletionGate] =
    useState<JourneyCompletionGateResponse | null>(null);
  const [completionReport, setCompletionReport] =
    useState<JourneyCompletionReportResponse | null>(null);

  // ── Node verification status map (for sidebar icons) ──
  type NodeStatusEntry = {
    learnerMarkedComplete: boolean;
    progressCompleted: boolean;
    verified: "NONE" | "VERIFIED" | "REJECTED";
    submitted: boolean;
    hasMentorCoverage: boolean;
  };
  const [nodeStatusMap, setNodeStatusMap] = useState<
    Record<string, NodeStatusEntry>
  >({});

  const loadRoadmap = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await aiRoadmapService.getRoadmapById(parseInt(id, 10));
      setRoadmap(data);
      let resolvedJourneyId =
        preferredJourneyId ??
        (data as { journeyId?: number }).journeyId ??
        null;
      if (!resolvedJourneyId) {
        try {
          const journeyPage = await journeyService.getUserJourneys(0, 100);
          const matchedJourney = journeyPage.content.find(
            (journey) => journey.roadmapSessionId === data.sessionId,
          );
          resolvedJourneyId = matchedJourney?.id ?? null;
        } catch (journeyLookupError) {
          console.warn(
            "Failed to resolve journey context for roadmap workspace:",
            journeyLookupError,
          );
        }
      }
      setJourneyId(resolvedJourneyId ?? data.sessionId);

      const completedNodeIds = new Set(
        Object.entries(data.progress ?? {})
          .filter(([, progress]) => progress?.status === "COMPLETED")
          .map(([nodeId]) => nodeId),
      );
      const fallbackNodeId =
        data.roadmap.find((node) => !completedNodeIds.has(node.id))?.id ??
        data.roadmap[0]?.id ??
        null;

      setSelectedNodeId((previous) => {
        if (previous && data.roadmap.some((node) => node.id === previous)) {
          return previous;
        }

        if (
          preferredNodeId &&
          data.roadmap.some((node) => node.id === preferredNodeId)
        ) {
          return preferredNodeId;
        }

        return fallbackNodeId;
      });
    } catch (err: any) {
      showError("Lỗi", "Không thể tải roadmap workspace.");
    } finally {
      setLoading(false);
    }
  }, [id, preferredJourneyId, preferredNodeId, showError]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const loadNodeData = useCallback(async () => {
    if (!journeyId || !selectedNodeId) return;
    try {
      const [assignRes, evRes] = await Promise.allSettled([
        getNodeAssignment(journeyId, selectedNodeId),
        getNodeEvidence(journeyId, selectedNodeId),
      ]);

      if (assignRes.status === "fulfilled") {
        setAssignment(assignRes.value);
      } else {
        setAssignment(null);
      }

      if (evRes.status === "fulfilled" && evRes.value) {
        setEvidence(evRes.value);
        // Không prefill nội dung đã nộp vào form. Chỉ mở form trống khi mentor yêu cầu nộp lại.
        setNodeSubmissionText("");
        setNodeEvidenceUrl("");
        // Update status map for this node
        setNodeStatusMap((prev) => ({
          ...prev,
          [selectedNodeId]: {
            learnerMarkedComplete: evRes.value!.learnerMarkedComplete ?? false,
            progressCompleted:
              evRes.value!.roadmapProgressStatus === "COMPLETED",
            verified:
              evRes.value!.latestVerification?.nodeVerificationStatus ===
              "VERIFIED"
                ? "VERIFIED"
                : evRes.value!.latestVerification?.nodeVerificationStatus ===
                    "REJECTED"
                  ? "REJECTED"
                  : "NONE",
            submitted: ["SUBMITTED", "RESUBMITTED"].includes(
              evRes.value!.submissionStatus,
            ),
            hasMentorCoverage: evRes.value!.hasMentorCoverage ?? false,
          },
        }));
      } else {
        setEvidence(null);
        setNodeSubmissionText("");
        setNodeEvidenceUrl("");
      }
    } catch (e) {
      console.error(e);
    }
  }, [journeyId, selectedNodeId]);

  const loadFinalAssessment = useCallback(async () => {
    if (!journeyId) return;
    try {
      // Parallel fetch: latest assessment + gate state + latest completion report.
      // Gate + report drive the "Kết quả" banner when mentor submits PASS via
      // Report tab without grading the output assessment.
      const [asmRes, gateRes, reportRes] = await Promise.allSettled([
        getLatestOutputAssessment(journeyId),
        getCompletionGate(journeyId),
        getLatestCompletionReport(journeyId),
      ]);
      if (asmRes.status === "fulfilled") setFinalAssessment(asmRes.value);
      if (gateRes.status === "fulfilled") setCompletionGate(gateRes.value);
      if (reportRes.status === "fulfilled")
        setCompletionReport(reportRes.value);
      setFinalSubmissionText("");
      setFinalEvidenceUrl("");
    } catch (e) {
      // Ignore
    }
  }, [journeyId]);

  // Final Assessment node = node MAIN cuối roadmap (mentor lưu yêu cầu vào đây).
  const finalNodeId: string | null = useMemo(() => {
    const all = roadmap?.roadmap || [];
    if (!all.length) return null;
    const mainOnly = all.filter((n: any) => n.type !== "SIDE");
    const last = (mainOnly.length > 0 ? mainOnly : all).slice(-1)[0];
    return last?.id ?? null;
  }, [roadmap]);

  const loadFinalAssignment = useCallback(async () => {
    if (!journeyId || !finalNodeId) {
      setFinalAssignment(null);
      return;
    }
    try {
      const data = await getNodeAssignment(journeyId, finalNodeId);
      setFinalAssignment(data);
    } catch (e) {
      setFinalAssignment(null);
    }
  }, [journeyId, finalNodeId]);

  // ── Batch load node statuses for sidebar icons ──
  const loadAllNodeStatuses = useCallback(async () => {
    if (!journeyId || !roadmap?.roadmap?.length) return;
    const entries: Record<string, NodeStatusEntry> = {};
    const results = await Promise.allSettled(
      roadmap.roadmap.map((node: any) =>
        getNodeEvidence(journeyId, node.id).then((ev) => ({
          nodeId: node.id,
          ev,
        })),
      ),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.ev) {
        const { nodeId, ev } = r.value;
        entries[nodeId] = {
          learnerMarkedComplete: ev.learnerMarkedComplete ?? false,
          progressCompleted: ev.roadmapProgressStatus === "COMPLETED",
          verified:
            ev.latestVerification?.nodeVerificationStatus === "VERIFIED"
              ? "VERIFIED"
              : ev.latestVerification?.nodeVerificationStatus === "REJECTED"
                ? "REJECTED"
                : "NONE",
          submitted: ["SUBMITTED", "RESUBMITTED"].includes(ev.submissionStatus),
          hasMentorCoverage: ev.hasMentorCoverage ?? false,
        };
      }
    }
    setNodeStatusMap(entries);
  }, [journeyId, roadmap]);

  useEffect(() => {
    loadAllNodeStatuses();
  }, [loadAllNodeStatuses]);

  // ── Lookup booking + load meetings ───────────────────────────
  useEffect(() => {
    if (!journeyId) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await getMyBookings(false, 0, 50);
        if (cancelled) return;
        const matched = page.content.find(
          (b) =>
            b.bookingType === "ROADMAP_MENTORING" && b.journeyId === journeyId,
        );
        if (matched) {
          setBookingId(matched.id);
        } else {
          setBookingId(null);
        }
      } catch {
        if (!cancelled) setBookingId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [journeyId]);

  const loadMeetings = useCallback(async () => {
    if (!bookingId) {
      setMeetings([]);
      return;
    }
    try {
      setMeetingsLoading(true);
      const ws = await mentorRoadmapWorkspaceService.getWorkspace(bookingId);
      setMeetings(ws.followUpMeetings || []);
    } catch {
      // ignore — student may not have permission yet
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    if (
      !meetingDraft.title ||
      !meetingDraft.scheduledAt ||
      !meetingDraft.purpose ||
      !meetingDraft.purpose.trim()
    ) {
      showError(
        "Thiếu thông tin",
        "Vui lòng điền tiêu đề, mục đích và thời gian cụ thể.",
      );
      return;
    }
    try {
      setMeetingSaving(true);
      await mentorRoadmapWorkspaceService.createFollowUp(bookingId, {
        title: meetingDraft.title,
        purpose: meetingDraft.purpose,
        scheduledAt: meetingDraft.scheduledAt,
        durationMinutes: meetingDraft.durationMinutes || 45,
        agenda: meetingDraft.agenda,
        meetingLink: meetingDraft.meetingLink,
      } as RoadmapFollowUpMeetingDTO);
      showSuccess(
        "Đã gửi yêu cầu",
        "Đang chờ mentor chấp nhận. Khi được duyệt, link Jitsi sẽ được kích hoạt.",
      );
      setMeetingFormOpen(false);
      setMeetingDraft({});
      await loadMeetings();
    } catch (err: any) {
      showError(
        "Không thể tạo",
        err?.response?.data?.message || "Vui lòng thử lại.",
      );
    } finally {
      setMeetingSaving(false);
    }
  };

  const handleAcceptMeeting = async (meetingId: number) => {
    if (!bookingId) return;
    try {
      await mentorRoadmapWorkspaceService.acceptFollowUp(bookingId, meetingId);
      showSuccess(
        "Đã chấp nhận",
        "Meeting đã được kích hoạt, bạn có thể tham gia khi đến giờ.",
      );
      loadMeetings();
    } catch (err: any) {
      showError(
        "Không thể chấp nhận",
        err?.response?.data?.message || "Vui lòng thử lại.",
      );
    }
  };

  const handleRejectMeeting = async (meetingId: number) => {
    if (!bookingId) return;
    const reason = window.prompt("Lý do từ chối (tùy chọn):", "");
    if (reason === null) return;
    try {
      await mentorRoadmapWorkspaceService.rejectFollowUp(
        bookingId,
        meetingId,
        reason || undefined,
      );
      showSuccess("Đã từ chối", "Mentor sẽ nhận được thông báo.");
      loadMeetings();
    } catch (err: any) {
      showError(
        "Không thể từ chối",
        err?.response?.data?.message || "Vui lòng thử lại.",
      );
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (!bookingId) return;
    if (!window.confirm("Xóa meeting này?")) return;
    try {
      await mentorRoadmapWorkspaceService.deleteFollowUp(bookingId, meetingId);
      showSuccess("Đã xóa", "Meeting đã được gỡ khỏi danh sách.");
      loadMeetings();
    } catch (err: any) {
      showError(
        "Không thể xóa",
        err?.response?.data?.message || "Vui lòng thử lại.",
      );
    }
  };

  // Reset form + attachment when switching nodes to prevent data bleed
  useEffect(() => {
    setAttachmentFile(null);
    setUploadError(null);
    if (selectedNodeId) {
      setNodeSubmissionText("");
      setNodeEvidenceUrl("");
      loadNodeData();
    } else {
      setFinalSubmissionText("");
      setFinalEvidenceUrl("");
      loadFinalAssessment();
      loadFinalAssignment();
    }
  }, [selectedNodeId, loadNodeData, loadFinalAssessment, loadFinalAssignment]);

  // ── File helpers ──────────────────────────────────────────────
  const isDocFile = (file: File) =>
    file.type === "application/pdf" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const isImageFile = (file: File) => file.type.startsWith("image/");

  const getFileExt = (file: File) => {
    if (file.type === "application/pdf") return "pdf";
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return "docx";
    if (file.type === "image/jpeg") return "jpg";
    if (file.type === "image/png") return "png";
    if (file.type === "image/gif") return "gif";
    if (file.type === "image/webp") return "webp";
    return file.name.split(".").pop()?.toLowerCase() || "file";
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    const validation = validateDocument(file);
    if (!validation.valid) {
      setUploadError(validation.error || "File không hợp lệ");
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

  const handleSubmit = async () => {
    if (!journeyId) return;
    // Use scoped state depending on whether we're submitting node evidence or final assessment
    const currentText = selectedNodeId
      ? nodeSubmissionText
      : finalSubmissionText;
    const currentUrl = selectedNodeId ? nodeEvidenceUrl : finalEvidenceUrl;

    if (selectedNodeId && evidence && !canSubmitNodeEvidence(evidence)) {
      showInfo(
        "Đã nộp minh chứng",
        "Bạn chỉ có thể nộp lại khi mentor yêu cầu làm lại hoặc đánh fail node này.",
      );
      setRightTab("REPORT");
      return;
    }

    if (
      !selectedNodeId &&
      finalAssessment &&
      !canSubmitFinalAssessment(finalAssessment)
    ) {
      showInfo(
        "Đã nộp Final Assessment",
        "Bạn chỉ có thể nộp lại khi mentor từ chối bài Final Assessment.",
      );
      setRightTab("REPORT");
      return;
    }

    if (!currentText && !currentUrl && !attachmentFile) {
      showInfo(
        "Thiếu thông tin",
        "Vui lòng nhập nội dung hoặc đính kèm file/link.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);
      let attachmentUrl: string | undefined;

      if (attachmentFile) {
        if (isDocFile(attachmentFile) && currentUserId) {
          const result = await uploadDocument(
            attachmentFile,
            currentUserId,
            (p) => setUploadProgress(p.percentage),
          );
          attachmentUrl = result.url;
        } else if (isImageFile(attachmentFile) && currentUserId) {
          const result = await uploadImage(attachmentFile, currentUserId, (p) =>
            setUploadProgress(p.percentage),
          );
          attachmentUrl = result.url;
        } else {
          attachmentUrl = await uploadEvidence(attachmentFile);
        }
      }

      if (selectedNodeId) {
        await submitNodeEvidence(journeyId, selectedNodeId, {
          submissionText: currentText,
          evidenceUrl: currentUrl,
          attachmentUrl,
        });
        showSuccess("Thành công", "Đã nộp minh chứng cho node.");
        await loadNodeData();
        await loadAllNodeStatuses();
        setRightTab("SUBMIT");
      } else {
        await submitOutputAssessment(journeyId, {
          submissionText: currentText,
          evidenceUrl: currentUrl,
          attachmentUrl,
        });
        showSuccess("Thành công", "Đã nộp bài đánh giá cuối kỳ.");
        await loadFinalAssessment();
        setRightTab("REPORT");
      }
      setAttachmentFile(null);
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Lỗi khi nộp bài.");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleMarkNodeComplete = async () => {
    if (!journeyId || !selectedNodeId || !evidence) return;
    try {
      setMarkingComplete(true);

      // Check task status before marking complete
      const board = await taskBoardService.getBoard(roadmap?.sessionId);
      const allTasks = board.flatMap(column => column.tasks || []);
      const nodeTasks = allTasks.filter(task =>
        task.userNotes?.includes(`[ROADMAP_NODE_LINK]${selectedNodeId}`)
      );
      const pendingTasks = nodeTasks.filter(task => task.status !== 'done');

      let confirmed = false;
      if (pendingTasks.length > 0) {
        // Case A: Tasks chưa done hết
        confirmed = await confirmAction({
          title: "Xác nhận hoàn thành",
          message: `Có ${pendingTasks.length} tasks chưa done. Bạn muốn hoàn thành node và done các tasks này?`,
          confirmLabel: "Xác nhận",
          cancelLabel: "Hủy",
          variant: "default",
        });
      } else {
        // Case B: Tasks đã done hết
        confirmed = await confirmAction({
          title: "Xác nhận hoàn thành",
          message: "Bạn có chắc chắn muốn hoàn thành node này?",
          confirmLabel: "Xác nhận",
          cancelLabel: "Hủy",
          variant: "default",
        });
      }

      if (!confirmed) {
        setMarkingComplete(false);
        return;
      }

      const updated = await selfConfirmNode(journeyId, selectedNodeId);
      setEvidence(updated);
      setNodeStatusMap((prev) => ({
        ...prev,
        [selectedNodeId]: {
          learnerMarkedComplete: updated.learnerMarkedComplete ?? false,
          progressCompleted: updated.roadmapProgressStatus === "COMPLETED",
          verified:
            updated.latestVerification?.nodeVerificationStatus === "VERIFIED"
              ? "VERIFIED"
              : updated.latestVerification?.nodeVerificationStatus ===
                  "REJECTED"
                ? "REJECTED"
                : "NONE",
          submitted: ["SUBMITTED", "RESUBMITTED"].includes(
            updated.submissionStatus,
          ),
          hasMentorCoverage: updated.hasMentorCoverage ?? false,
        },
      }));
      await loadRoadmap();
      await loadAllNodeStatuses();
      if (updated.hasMentorCoverage) {
        showSuccess(
          "Đã đánh dấu hoàn thành",
          "Node đang chờ mentor review và verify trước khi mở node tiếp theo.",
        );
      } else {
        showSuccess("Đã hoàn thành node", "Node tiếp theo đã được mở khóa.");
      }
    } catch (err: any) {
      showError(
        "Không thể đánh dấu hoàn thành",
        err.response?.data?.message || "Vui lòng thử lại.",
      );
    } finally {
      setMarkingComplete(false);
    }
  };

  const nodes = roadmap?.roadmap || [];
  const selectedNode = nodes.find((n: any) => n.id === selectedNodeId);
  
  // Sort nodes to place children immediately after their parents
  const sortedNodes = useMemo(() => {
    const nodeMap = new Map<string, any>();
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    const sorted: any[] = [];
    const processed = new Set<string>();
    
    nodes.forEach(node => {
      if (processed.has(node.id)) return;
      
      // Add parent first
      sorted.push(node);
      processed.add(node.id);
      
      // Add children immediately after parent
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((childId: string) => {
          if (!processed.has(childId) && nodeMap.has(childId)) {
            sorted.push(nodeMap.get(childId));
            processed.add(childId);
          }
        });
      }
    });
    
    // Add any remaining nodes that weren't processed
    nodes.forEach(node => {
      if (!processed.has(node.id)) {
        sorted.push(node);
      }
    });
    
    return sorted;
  }, [nodes]);

  if (loading) {
    return (
      <div className="srwp-loading">
        <Clock size={24} className="srwp-spin" /> Đang tải workspace...
      </div>
    );
  }

  if (!roadmap) {
    return <div className="srwp-error">Không tìm thấy dữ liệu Roadmap.</div>;
  }

  const isNodeCompleteForUnlock = (status?: NodeStatusEntry): boolean => {
    if (!status?.submitted) return false;
    return status.hasMentorCoverage
      ? status.verified === "VERIFIED" && status.progressCompleted
      : status.progressCompleted;
  };

  // Sequential lock: a node opens when the previous node has evidence and is completed.
  const isNodeLocked = (idx: number): boolean => {
    if (idx === 0) return false;
    const prevNode = nodes[idx - 1];
    const prevStatus = nodeStatusMap[prevNode?.id];
    return !isNodeCompleteForUnlock(prevStatus);
  };
  const nodeSubmissionLocked = !!evidence && !canSubmitNodeEvidence(evidence);
  const nodeEvidenceSubmitted =
    !!evidence &&
    ["SUBMITTED", "RESUBMITTED"].includes(evidence.submissionStatus);
  const nodeProgressCompleted = evidence?.roadmapProgressStatus === "COMPLETED";
  const nodeAwaitingMentor =
    !!evidence?.hasMentorCoverage &&
    !!evidence?.learnerMarkedComplete &&
    !nodeProgressCompleted;
  const canMarkNodeComplete =
    nodeEvidenceSubmitted &&
    !evidence?.learnerMarkedComplete &&
    !nodeProgressCompleted;
  const finalSubmissionLocked =
    !!finalAssessment && !canSubmitFinalAssessment(finalAssessment);
  const nodeSubmitTabLabel = evidence
    ? nodeSubmissionLocked
      ? "Đã nộp"
      : "Nộp lại minh chứng"
    : "Nộp minh chứng";
  const finalSubmitTabLabel = finalAssessment
    ? finalSubmissionLocked
      ? "Đã nộp"
      : "Nộp lại"
    : "Nộp bài";

  const renderNodeSubmissionStatus = () => {
    if (!evidence) return null;
    return (
      <div className="srwp-submission-status-card srwp-submission-status-card--locked">
        <div className="srwp-submission-status-card__icon">
          <ShieldCheck size={22} />
        </div>
        <div className="srwp-submission-status-card__content">
          <h4>Đã nộp minh chứng</h4>
          <p>
            Minh chứng của node này đã được gửi cho mentor. Bạn chỉ có thể nộp
            lại khi mentor yêu cầu làm lại hoặc đánh fail node này.
          </p>
          <div className="srwp-submission-status-card__meta">
            <span>{formatNodeSubmissionStatus(evidence.submissionStatus)}</span>
            <span>
              {formatNodeVerificationStatus(evidence.verificationStatus)}
            </span>
            {nodeProgressCompleted ? (
              <span>Node da hoan thanh</span>
            ) : nodeAwaitingMentor ? (
              <span>Cho mentor verify</span>
            ) : null}
            {evidence.submittedAt && (
              <span>
                Nộp lúc {new Date(evidence.submittedAt).toLocaleString("vi-VN")}
              </span>
            )}
          </div>
          <div className="srwp-submission-link-list">
            {evidence.evidenceUrl && (
              <a href={evidence.evidenceUrl} target="_blank" rel="noreferrer">
                <LinkIcon size={14} /> Mở link minh chứng
              </a>
            )}
            {evidence.attachmentUrl && (
              <a
                href={getForceDownloadUrl(evidence.attachmentUrl)}
                download
                rel="noreferrer"
              >
                <FileText size={14} /> Tải file đã đính kèm (
                {getFileExtFromUrl(evidence.attachmentUrl)})
              </a>
            )}
          </div>
          <button
            type="button"
            className="srwp-status-action"
            onClick={() => setRightTab("REPORT")}
          >
            Xem kết quả đánh giá
          </button>
          {canMarkNodeComplete && (
            <button
              type="button"
              className="srwp-status-action srwp-status-action--primary"
              onClick={handleMarkNodeComplete}
              disabled={markingComplete}
            >
              <CheckCircle2 size={15} />
              {markingComplete ? "Đang đánh dấu..." : "Đánh dấu hoàn thành"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderNodeReworkNotice = () => {
    if (!evidence || !canSubmitNodeEvidence(evidence)) return null;
    const feedback =
      evidence.mentorFeedback ||
      evidence.latestReview?.feedback ||
      evidence.latestVerification?.verificationNote;
    return (
      <div className="srwp-submission-status-card srwp-submission-status-card--rework">
        <div className="srwp-submission-status-card__icon">
          <ShieldAlert size={22} />
        </div>
        <div className="srwp-submission-status-card__content">
          <h4>Mentor yêu cầu nộp lại</h4>
          <p>
            Hãy nộp minh chứng mới theo yêu cầu bên dưới. Nội dung cũ không được
            tự động điền lại để tránh gửi nhầm.
          </p>
          {feedback && (
            <div className="srwp-feedback-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {feedback}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFinalSubmissionStatus = () => {
    if (!finalAssessment) return null;
    return (
      <div className="srwp-submission-status-card srwp-submission-status-card--locked">
        <div className="srwp-submission-status-card__icon">
          <ShieldCheck size={22} />
        </div>
        <div className="srwp-submission-status-card__content">
          <h4>Đã nộp Final Assessment</h4>
          <p>
            Bài Final Assessment đang chờ hoặc đã được mentor đánh giá. Bạn chỉ
            có thể nộp lại khi mentor từ chối bài này.
          </p>
          <div className="srwp-submission-status-card__meta">
            <span>
              {formatFinalAssessmentStatus(finalAssessment.assessmentStatus)}
            </span>
            {finalAssessment.submittedAt && (
              <span>
                Nộp lúc{" "}
                {new Date(finalAssessment.submittedAt).toLocaleString("vi-VN")}
              </span>
            )}
          </div>
          <div className="srwp-submission-link-list">
            {finalAssessment.evidenceUrl && (
              <a
                href={finalAssessment.evidenceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <LinkIcon size={14} /> Mở link bài nộp
              </a>
            )}
            {finalAssessment.attachmentUrl && (
              <a
                href={getForceDownloadUrl(finalAssessment.attachmentUrl)}
                download
                rel="noreferrer"
              >
                <FileText size={14} /> Tải file đã đính kèm (
                {getFileExtFromUrl(finalAssessment.attachmentUrl)})
              </a>
            )}
          </div>
          <button
            type="button"
            className="srwp-status-action"
            onClick={() => setRightTab("REPORT")}
          >
            Xem kết quả Final Assessment
          </button>
        </div>
      </div>
    );
  };

  const renderFinalReworkNotice = () => {
    if (!finalAssessment || finalAssessment.assessmentStatus !== "REJECTED") {
      return null;
    }
    return (
      <div className="srwp-submission-status-card srwp-submission-status-card--rework">
        <div className="srwp-submission-status-card__icon">
          <ShieldAlert size={22} />
        </div>
        <div className="srwp-submission-status-card__content">
          <h4>Mentor yêu cầu nộp lại Final Assessment</h4>
          <p>
            Hãy gửi bài mới theo feedback của mentor. Nội dung cũ không được tự
            động điền lại để tránh gửi nhầm.
          </p>
          {finalAssessment.feedback && (
            <div className="srwp-feedback-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {finalAssessment.feedback}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="srwp-container">
      {/* Header */}
      <div className="srwp-header">
        <button
          className="srwp-back-btn"
          onClick={() =>
            navigate(`/roadmap/${id}`, {
              state: {
                journeyId,
                selectedNodeId,
              },
            })
          }
        >
          <ArrowLeft size={18} /> Quay lại Roadmap
        </button>
        <div className="srwp-title-wrapper">
          <h2>Roadmap Workspace</h2>
          <span className="srwp-subtitle">{roadmap.metadata?.title}</span>
        </div>
        <button
          className="srwp-refresh-btn"
          onClick={async () => {
            await loadRoadmap();
            await loadAllNodeStatuses();
            if (selectedNodeId) await loadNodeData();
            else {
              await loadFinalAssessment();
              await loadFinalAssignment();
            }
            showSuccess("Đã làm mới", "Dữ liệu workspace đã được cập nhật.");
          }}
          title="Làm mới dữ liệu từ mentor"
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="srwp-body">
        {/* Sidebar */}
        <div className="srwp-sidebar">
          <div className="srwp-sidebar-header">
            <h3>
              <Hash size={16} /> Danh sách Nodes
            </h3>
          </div>
          <div className="srwp-node-list">
            {sortedNodes.map((node: any, idx: number) => {
              const ns = nodeStatusMap[node.id];
              const locked = isNodeLocked(idx);
              const isChild = !!node.parentId;
              return (
                <div
                  key={node.id}
                  className={`srwp-node-item ${selectedNodeId === node.id ? "active" : ""} ${locked ? "srwp-node-item--locked" : ""} ${isChild ? "srwp-node-item--child" : ""}`}
                  style={{ paddingLeft: isChild ? "32px" : "12px" }}
                  onClick={() => {
                    if (locked) return;
                    setSelectedNodeId(node.id);
                    setRightTab("ASSIGNMENT");
                  }}
                  title={locked ? "Hoàn thành node trước để mở khóa" : undefined}
                >
                  <span className="srwp-node-index">{isChild ? "" : idx + 1}</span>
                  <div className="srwp-node-info">
                    <span className="srwp-node-title">{node.title}</span>
                    <span
                      className={`srwp-node-type srwp-node-type--${node.type || "MAIN"}`}
                    >
                      {node.type === "SIDE" ? "Phụ" : "Chính"}
                    </span>
                  </div>
                  {locked ? (
                    <Lock
                      size={13}
                      className="srwp-status-icon srwp-status-icon--locked"
                    />
                  ) : ns?.verified === "VERIFIED" ? (
                    <BadgeCheck
                      size={16}
                      className="srwp-status-icon srwp-status-icon--verified"
                    />
                  ) : ns?.verified === "REJECTED" ? (
                    <XCircle
                      size={16}
                      className="srwp-status-icon srwp-status-icon--rejected"
                    />
                  ) : isNodeCompleteForUnlock(ns) ? (
                    <CheckCircle2
                      size={16}
                      className="srwp-status-icon srwp-status-icon--completed"
                    />
                  ) : ns?.learnerMarkedComplete ? (
                    <CheckCircle2
                      size={16}
                      className="srwp-status-icon srwp-status-icon--pending"
                    />
                  ) : ns?.submitted ? (
                    <Clock
                      size={14}
                      className="srwp-status-icon srwp-status-icon--submitted"
                    />
                  ) : (
                    <ChevronRight size={14} className="srwp-node-chevron" />
                  )}
                </div>
              );
            })}

            <div
              className={`srwp-node-item srwp-node-item--final ${!selectedNodeId ? "active" : ""}`}
              onClick={() => {
                setSelectedNodeId(null);
                setRightTab("ASSIGNMENT");
              }}
            >
              <Target size={16} className="srwp-node-index-icon" />
              <div className="srwp-node-info">
                <span className="srwp-node-title">Final Assessment & Gate</span>
                <span className="srwp-node-type">Tổng kết</span>
              </div>
              <ChevronRight size={14} className="srwp-node-chevron" />
            </div>
          </div>

          {/* ── Meetings panel ── */}
          {bookingId && (
            <div className="srwp-meetings">
              <div className="srwp-meetings-header">
                <h3>
                  <Calendar size={15} /> Lịch hẹn với Mentor ({meetings.length})
                </h3>
                <button
                  type="button"
                  className="srwp-meeting-add"
                  onClick={() => {
                    setMeetingDraft({
                      title: "",
                      purpose: "",
                      scheduledAt: new Date(
                        Date.now() + 60 * 60 * 1000,
                      ).toISOString(),
                      durationMinutes: 45,
                    });
                    setMeetingFormOpen(true);
                  }}
                  title="Đề xuất meeting mới"
                >
                  <Plus size={13} />
                </button>
              </div>
              {meetingsLoading ? (
                <p className="srwp-meetings-empty">Đang tải lịch hẹn...</p>
              ) : meetings.length === 0 ? (
                <p className="srwp-meetings-empty">
                  Chưa có meeting nào. Mọi buổi họp phải có mục đích và thời
                  gian rõ ràng.
                </p>
              ) : (
                <div className="srwp-meeting-list">
                  {meetings.map((m) => {
                    const status = (m.status || "SCHEDULED").toUpperCase();
                    const canAccept =
                      status === "PENDING_LEARNER" ||
                      (status === "SCHEDULED" &&
                        m.createdByUserId != null &&
                        m.createdByUserId !== currentUserId);
                    const waitingMentor = status === "PENDING_MENTOR";
                    const isCreator =
                      m.createdByUserId != null &&
                      m.createdByUserId === currentUserId;
                    const canJoin =
                      m.canJoin === true ||
                      (status === "ACCEPTED" && !!m.meetingLink);
                    const statusLabel =
                      status === "PENDING_MENTOR"
                        ? "Chờ mentor chấp nhận"
                        : status === "PENDING_LEARNER"
                          ? "Mentor đề xuất — cần bạn chấp nhận"
                          : status === "ACCEPTED"
                            ? "Đã kích hoạt"
                            : status === "REJECTED"
                              ? "Đã từ chối"
                              : status === "CANCELLED"
                                ? "Đã huỷ"
                                : status === "COMPLETED"
                                  ? "Đã hoàn tất"
                                  : "Đã lên lịch";
                    return (
                      <div
                        key={m.id}
                        className={`srwp-meeting-card srwp-meeting-card--${status}`}
                      >
                        <div className="srwp-meeting-card-top">
                          <span className="srwp-meeting-card-title">
                            {m.title}
                          </span>
                          <span
                            className={`srwp-meeting-card-status srwp-meeting-card-status--${status}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        {m.purpose && (
                          <p className="srwp-meeting-card-purpose">
                            <Target size={11} /> {m.purpose}
                          </p>
                        )}
                        <p className="srwp-meeting-card-meta">
                          <Clock size={11} />{" "}
                          {new Date(m.scheduledAt).toLocaleString("vi-VN")}
                          {m.durationMinutes
                            ? ` • ${m.durationMinutes} phút`
                            : ""}
                        </p>
                        <p className="srwp-meeting-card-meta">
                          <UserRound size={11} />{" "}
                          {m.createdByRole === "LEARNER"
                            ? "Bạn đề xuất"
                            : "Mentor đề xuất"}
                        </p>
                        {status === "REJECTED" && m.rejectReason && (
                          <p className="srwp-meeting-card-reason">
                            Lý do: {m.rejectReason}
                          </p>
                        )}
                        <div className="srwp-meeting-card-actions">
                          {canAccept && (
                            <button
                              type="button"
                              className="srwp-meeting-btn srwp-meeting-btn--accept"
                              onClick={() => handleAcceptMeeting(m.id!)}
                            >
                              <CheckCircle2 size={12} /> Chấp nhận
                            </button>
                          )}
                          {(canAccept || waitingMentor) && (
                            <button
                              type="button"
                              className="srwp-meeting-btn srwp-meeting-btn--reject"
                              onClick={() => handleRejectMeeting(m.id!)}
                            >
                              <XCircle size={12} /> Từ chối
                            </button>
                          )}
                          {waitingMentor && (
                            <span className="srwp-meeting-hint">
                              <Hourglass size={11} /> Đang chờ mentor
                            </span>
                          )}
                          {canJoin && m.meetingLink && (
                            <a
                              className="srwp-meeting-btn srwp-meeting-btn--join"
                              href={m.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Video size={12} /> Tham gia
                            </a>
                          )}
                          {!canJoin &&
                            m.meetingLink &&
                            status !== "REJECTED" && (
                              <span className="srwp-meeting-hint">
                                <LinkIcon size={11} /> Link mở sau khi duyệt
                              </span>
                            )}
                          {isCreator && (
                            <button
                              type="button"
                              className="srwp-meeting-btn srwp-meeting-btn--delete"
                              onClick={() => handleDeleteMeeting(m.id!)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div className="srwp-main">
          {selectedNodeId && selectedNode ? (
            <>
              {/* Node View */}
              <div className="srwp-panel-header">
                <h3>{selectedNode.title}</h3>
                {selectedNode.description ? (
                  <div className="srwp-panel-header-desc srwp-markdown-view-inline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedNode.description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>Không có mô tả.</p>
                )}
              </div>

              <div className="srwp-tabs">
                <button
                  className={`srwp-tab ${rightTab === "ASSIGNMENT" ? "active" : ""}`}
                  onClick={() => setRightTab("ASSIGNMENT")}
                >
                  <ClipboardList size={16} /> Yêu cầu (Assignment)
                </button>
                <button
                  className={`srwp-tab ${rightTab === "SUBMIT" ? "active" : ""}`}
                  onClick={() => setRightTab("SUBMIT")}
                >
                  {nodeSubmissionLocked ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Send size={16} />
                  )}{" "}
                  {nodeSubmitTabLabel}
                </button>
                <button
                  className={`srwp-tab ${rightTab === "REPORT" ? "active" : ""}`}
                  onClick={() => setRightTab("REPORT")}
                >
                  <Award size={16} /> Đánh giá (Report)
                </button>
              </div>

              <div className="srwp-tab-content">
                {rightTab === "ASSIGNMENT" && (
                  <div className="srwp-content-card">
                    <RoadmapNodeRequirementsCard
                      node={selectedNode}
                      allNodes={nodes}
                      assignment={assignment}
                      heading="Nội dung node & Yêu cầu"
                      intro="Khối này gom mô tả node từ roadmap, mục tiêu học tập, khái niệm trọng tâm, bài tập gợi ý, tiêu chí hoàn thành và assignment hiện tại từ mentor."
                      emptyMessage="Node này chưa có mô tả yêu cầu rõ ràng từ roadmap hoặc mentor."
                      footerNote="Nếu mentor đã cập nhật assignment, hãy ưu tiên bám sát assignment đó khi chuẩn bị minh chứng."
                      showNodeDescription={true}
                      showMentorAssignment={false}
                    />
                    <div className="srwp-assignment-block">
                      <h4>
                        <ClipboardList size={16} /> Nhiệm vụ chi tiết từ Mentor
                        {assignment?.assignmentSource === "MENTOR_REFINED" && (
                          <span
                            className="srwp-source-badge srwp-source-badge--mentor"
                            title="Mentor đã cập nhật bài tập này"
                          >
                            <BadgeCheck size={12} /> Mentor đã cập nhật
                          </span>
                        )}
                        {assignment?.assignmentSource ===
                          "SYSTEM_GENERATED" && (
                          <span
                            className="srwp-source-badge srwp-source-badge--ai"
                            title="Nội dung do AI tạo tự động"
                          >
                            AI Generated
                          </span>
                        )}
                      </h4>
                      {assignment?.title && (
                        <div className="srwp-assignment-title">
                          <strong>{assignment.title}</strong>
                        </div>
                      )}
                      {assignment?.description ? (
                        <div className="srwp-markdown-view">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {assignment.description}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="srwp-empty-state">
                          <FileText size={32} />
                          <p>Mentor chưa giao bài tập cụ thể cho node này.</p>
                          <span>
                            Bạn vẫn có thể bắt đầu dựa vào mô tả node và
                            checklist phía trên, sau đó trao đổi với mentor khi
                            có lịch hẹn.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {rightTab === "SUBMIT" && (
                  <div className="srwp-content-card">
                    {!nodeSubmissionLocked && (
                      <div className="srwp-submit-context">
                        <RoadmapNodeRequirementsCard
                          node={selectedNode}
                          allNodes={nodes}
                          assignment={assignment}
                          heading="Checklist trước khi nộp"
                          emptyMessage="Hiện chưa có checklist chi tiết cho node này."
                          footerNote="Minh chứng nên thể hiện rõ bạn đã hoàn thành bài tập và đáp ứng tiêu chí của node."
                          showNodeDescription={true}
                        />
                      </div>
                    )}
                    <h4>
                      {nodeSubmissionLocked
                        ? "Trạng thái minh chứng"
                        : "Nộp minh chứng học tập"}
                    </h4>
                    {nodeSubmissionLocked ? (
                      renderNodeSubmissionStatus()
                    ) : (
                      <div className="srwp-form">
                        {renderNodeReworkNotice()}
                        <div className="srwp-form-group">
                          <label>Nội dung bài làm</label>
                          <textarea
                            className="srwp-input srwp-textarea--md"
                            value={nodeSubmissionText}
                            onChange={(e) =>
                              setNodeSubmissionText(e.target.value)
                            }
                            placeholder="Trình bày bài làm, kết quả hoặc ghi chú của bạn... (hỗ trợ Markdown)"
                            rows={10}
                          />
                          <p className="srwp-md-hint">
                            Hỗ trợ Markdown: **in đậm**, *in nghiêng*, `code`, -
                            danh sách, # tiêu đề, [link](url)
                          </p>
                        </div>

                        <div className="srwp-form-group">
                          <label>Link tài liệu / Source code (Tùy chọn)</label>
                          <input
                            type="url"
                            className="srwp-input"
                            value={nodeEvidenceUrl}
                            onChange={(e) => setNodeEvidenceUrl(e.target.value)}
                            placeholder="https://github.com/..."
                          />
                        </div>

                        <div className="srwp-form-group">
                          <label>
                            File đính kèm — PDF / DOCX / Ảnh (Tùy chọn)
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileSelect(f);
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                          />
                          <div
                            className={`srwp-upload-zone ${isDragging ? "srwp-upload-zone--dragging" : ""} ${attachmentFile ? "srwp-upload-zone--has-file" : ""}`}
                            onClick={() =>
                              !attachmentFile && fileInputRef.current?.click()
                            }
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                            }}
                            onDrop={handleDropFile}
                          >
                            {attachmentFile ? (
                              <div className="srwp-file-preview">
                                <div
                                  className={`srwp-file-preview__icon srwp-file-preview__icon--${getFileExt(attachmentFile)}`}
                                >
                                  {getFileExt(attachmentFile).toUpperCase()}
                                </div>
                                <div className="srwp-file-preview__info">
                                  <div className="srwp-file-preview__name">
                                    {attachmentFile.name}
                                  </div>
                                  <div className="srwp-file-preview__size">
                                    {formatFileSize(attachmentFile.size)}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="srwp-file-preview__remove"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachmentFile(null);
                                    setUploadError(null);
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="srwp-upload-zone__icon">
                                  <Upload size={22} />
                                </div>
                                <div className="srwp-upload-zone__text">
                                  <p>Kéo thả hoặc click để chọn file</p>
                                  <span>Tối đa 10MB</span>
                                </div>
                                <div className="srwp-upload-zone__accept">
                                  <span className="srwp-upload-zone__badge srwp-upload-zone__badge--pdf">
                                    PDF
                                  </span>
                                  <span className="srwp-upload-zone__badge srwp-upload-zone__badge--docx">
                                    DOCX
                                  </span>
                                  <span className="srwp-upload-zone__badge srwp-upload-zone__badge--img">
                                    IMG
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          {uploadError && (
                            <div className="srwp-upload-error">
                              <AlertCircle size={14} /> {uploadError}
                            </div>
                          )}
                          {submitting && uploadProgress > 0 && (
                            <div className="srwp-upload-progress">
                              <div className="srwp-upload-progress__bar">
                                <div
                                  className="srwp-upload-progress__fill"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <div className="srwp-upload-progress__text">
                                <span>Đang tải lên...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          className="srwp-submit-btn"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? "Đang nộp..." : "Gửi minh chứng"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {rightTab === "REPORT" && (
                  <div className="srwp-content-card">
                    <h4>Kết quả đánh giá từ Mentor</h4>
                    {!evidence ? (
                      <div className="srwp-empty-state">
                        <Clock size={32} />
                        <p>Bạn chưa nộp minh chứng hoặc chưa có đánh giá.</p>
                      </div>
                    ) : (
                      <div className="srwp-report-view">
                        <div className="srwp-status-row">
                          <span className="srwp-label">Trạng thái nộp:</span>
                          <span
                            className={`srwp-badge status-${evidence.submissionStatus}`}
                          >
                            {formatNodeSubmissionStatus(
                              evidence.submissionStatus,
                            )}
                          </span>
                        </div>

                        {evidence.latestReview && (
                          <div className="srwp-review-box">
                            <h5>Review mới nhất</h5>
                            <div className="srwp-status-row">
                              <span className="srwp-label">Đánh giá:</span>
                              <span
                                className={`srwp-badge result-${evidence.latestReview.reviewResult}`}
                              >
                                {formatNodeReviewResult(
                                  evidence.latestReview.reviewResult,
                                )}
                              </span>
                            </div>
                            {evidence.latestReview.score != null && (
                              <div className="srwp-status-row">
                                <span className="srwp-label">Điểm số:</span>
                                <strong>
                                  {evidence.latestReview.score}/100
                                </strong>
                              </div>
                            )}
                            {evidence.latestReview.feedback && (
                              <div className="srwp-feedback-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {evidence.latestReview.feedback}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        )}

                        {evidence.latestVerification && (
                          <div className="srwp-verification-box">
                            <h5>Xác nhận Gate (Mở khóa)</h5>
                            <div className="srwp-status-row">
                              <span className="srwp-label">Quyết định:</span>
                              <span
                                className={`srwp-badge verify-${evidence.latestVerification.nodeVerificationStatus}`}
                              >
                                {formatNodeVerificationStatus(
                                  evidence.latestVerification
                                    .nodeVerificationStatus,
                                )}
                              </span>
                            </div>
                            {evidence.latestVerification.verificationNote && (
                              <div className="srwp-feedback-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {evidence.latestVerification.verificationNote}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Final Assessment View */
            <>
              <div className="srwp-panel-header">
                <h3>Final Assessment & Tổng kết</h3>
                <p>
                  Nộp bài kiểm tra cuối kỳ và xem đánh giá tổng thể từ Mentor.
                </p>
              </div>

              {!bookingId && (
                <div className="srwp-mentor-cta-card">
                  <div className="srwp-mentor-cta-card__icon">
                    <AlertCircle size={24} />
                  </div>
                  <div className="srwp-mentor-cta-card__content">
                    <h4>Chưa có mentor đồng hành</h4>
                    <p>
                      Bạn đang học không có mentor. Final assessment sẽ được đánh dấu{" "}
                      <strong>"Chưa xác thực"</strong> cho đến khi mentor review.
                    </p>
                    <div className="srwp-mentor-cta-card__actions">
                      <button
                        type="button"
                        className="srwp-cta-button srwp-cta-button--primary"
                        onClick={() => navigate(`/mentorship?journeyId=${journeyId}`)}
                      >
                        <Plus size={16} /> Đặt lịch mentor verify
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="srwp-tabs">
                <button
                  className={`srwp-tab ${rightTab === "ASSIGNMENT" ? "active" : ""}`}
                  onClick={() => setRightTab("ASSIGNMENT")}
                >
                  <ClipboardList size={16} /> Yêu cầu
                </button>
                <button
                  className={`srwp-tab ${rightTab === "SUBMIT" ? "active" : ""}`}
                  onClick={() => setRightTab("SUBMIT")}
                >
                  {finalSubmissionLocked ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Send size={16} />
                  )}{" "}
                  {finalSubmitTabLabel}
                </button>
                <button
                  className={`srwp-tab ${rightTab === "REPORT" ? "active" : ""}`}
                  onClick={() => setRightTab("REPORT")}
                >
                  <Award size={16} /> Kết quả
                </button>
              </div>

              <div className="srwp-tab-content">
                {rightTab === "ASSIGNMENT" && (
                  <div className="srwp-content-card">
                    <h4>
                      {finalAssignment?.title || "Yêu cầu Final Assessment"}
                    </h4>
                    {!finalAssignment?.description ? (
                      <div className="srwp-empty-state">
                        <Target size={32} />
                        <p>
                          Mentor chưa cập nhật yêu cầu Final Assessment. Vui
                          lòng quay lại sau hoặc trao đổi trực tiếp.
                        </p>
                      </div>
                    ) : (
                      <div className="srwp-feedback-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {finalAssignment.description}
                        </ReactMarkdown>
                        {finalAssignment.updatedAt && (
                          <div
                            style={{
                              marginTop: 12,
                              fontSize: 12,
                              color: "#94a3b8",
                            }}
                          >
                            Cập nhật:{" "}
                            {new Date(finalAssignment.updatedAt).toLocaleString(
                              "vi-VN",
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {rightTab === "SUBMIT" && (
                  <div className="srwp-content-card">
                    <h4>
                      {finalSubmissionLocked
                        ? "Trạng thái Final Assessment"
                        : "Nộp Final Assessment"}
                    </h4>
                    {finalSubmissionLocked ? (
                      renderFinalSubmissionStatus()
                    ) : (
                      <div className="srwp-form">
                        {renderFinalReworkNotice()}
                        <div className="srwp-form-group">
                          <label>Nội dung báo cáo / Bài làm</label>
                          <textarea
                            className="srwp-input srwp-textarea--md"
                            value={finalSubmissionText}
                            onChange={(e) =>
                              setFinalSubmissionText(e.target.value)
                            }
                            placeholder="Tổng hợp kết quả học tập của bạn... (hỗ trợ Markdown)"
                            rows={10}
                          />
                          <p className="srwp-md-hint">
                            Hỗ trợ Markdown: **in đậm**, *in nghiêng*, `code`, -
                            danh sách, # tiêu đề, [link](url)
                          </p>
                        </div>

                        <div className="srwp-form-group">
                          <label>Link (Tùy chọn)</label>
                          <input
                            type="url"
                            className="srwp-input"
                            value={finalEvidenceUrl}
                            onChange={(e) =>
                              setFinalEvidenceUrl(e.target.value)
                            }
                            placeholder="https://github.com/..."
                          />
                        </div>

                        <div className="srwp-form-group">
                          <label>
                            File đính kèm — PDF / DOCX / Ảnh (Tùy chọn)
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileSelect(f);
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                          />
                          <div
                            className={`srwp-upload-zone ${isDragging ? "srwp-upload-zone--dragging" : ""} ${attachmentFile ? "srwp-upload-zone--has-file" : ""}`}
                            onClick={() =>
                              !attachmentFile && fileInputRef.current?.click()
                            }
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                            }}
                            onDrop={handleDropFile}
                          >
                            {attachmentFile ? (
                              <div className="srwp-file-preview">
                                <div
                                  className={`srwp-file-preview__icon srwp-file-preview__icon--${getFileExt(attachmentFile)}`}
                                >
                                  {getFileExt(attachmentFile).toUpperCase()}
                                </div>
                                <div className="srwp-file-preview__info">
                                  <div className="srwp-file-preview__name">
                                    {attachmentFile.name}
                                  </div>
                                  <div className="srwp-file-preview__size">
                                    {formatFileSize(attachmentFile.size)}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="srwp-file-preview__remove"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachmentFile(null);
                                    setUploadError(null);
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="srwp-upload-zone__icon">
                                  <Upload size={22} />
                                </div>
                                <div className="srwp-upload-zone__text">
                                  <p>Kéo thả hoặc click để chọn file</p>
                                  <span>Tối đa 10MB</span>
                                </div>
                                <div className="srwp-upload-zone__accept">
                                  <span className="srwp-upload-zone__badge srwp-upload-zone__badge--pdf">
                                    PDF
                                  </span>
                                  <span className="srwp-upload-zone__badge srwp-upload-zone__badge--docx">
                                    DOCX
                                  </span>
                                  <span className="srwp-upload-zone__badge srwp-upload-zone__badge--img">
                                    IMG
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          {uploadError && (
                            <div className="srwp-upload-error">
                              <AlertCircle size={14} /> {uploadError}
                            </div>
                          )}
                          {submitting && uploadProgress > 0 && (
                            <div className="srwp-upload-progress">
                              <div className="srwp-upload-progress__bar">
                                <div
                                  className="srwp-upload-progress__fill"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <div className="srwp-upload-progress__text">
                                <span>Đang tải lên...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          className="srwp-submit-btn"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? "Đang nộp..." : "Gửi Final Assessment"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {rightTab === "REPORT" && (
                  <div className="srwp-content-card">
                    <h4>Kết quả Final Assessment</h4>

                    {/* Gate banner — surfaces mentor's PASS/FAIL decision from the
                        completion report. This is the ONLY signal the student
                        gets when the mentor verifies via the Report tab without
                        also grading the output assessment. */}
                    {completionGate?.finalGateStatus === "PASSED" && (
                      <div
                        className="srwp-review-box"
                        style={{
                          borderColor: "rgba(34,197,94,0.5)",
                          background: "rgba(2,22,16,0.5)",
                          marginBottom: 12,
                        }}
                      >
                        <div className="srwp-status-row">
                          <span className="srwp-label">Xác nhận mentor:</span>
                          <span
                            className="srwp-badge result-APPROVED"
                            style={{ fontWeight: 700 }}
                          >
                            🎉 Lộ trình đã hoàn thành (PASS)
                          </span>
                        </div>
                        {completionReport?.completionNote && (
                          <>
                            <div
                              className="srwp-label"
                              style={{ marginTop: 8 }}
                            >
                              Nhận xét tổng kết của mentor:
                            </div>
                            <div className="srwp-feedback-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {completionReport.completionNote}
                              </ReactMarkdown>
                            </div>
                          </>
                        )}
                        {completionReport?.confirmedAt && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: "#94a3b8",
                            }}
                          >
                            Xác nhận lúc{" "}
                            {new Date(
                              completionReport.confirmedAt,
                            ).toLocaleString("vi-VN")}
                          </div>
                        )}
                      </div>
                    )}

                    {completionReport?.gateDecision === "FAIL" && (
                      <div
                        className="srwp-review-box"
                        style={{
                          borderColor: "rgba(239,68,68,0.5)",
                          background: "rgba(40,10,10,0.4)",
                          marginBottom: 12,
                        }}
                      >
                        <div className="srwp-status-row">
                          <span className="srwp-label">Xác nhận mentor:</span>
                          <span className="srwp-badge result-REJECTED">
                            ❌ Chưa đạt (FAIL)
                          </span>
                        </div>
                        {completionReport.completionNote && (
                          <div className="srwp-feedback-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {completionReport.completionNote}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {!finalAssessment && !completionReport && (
                      <div className="srwp-empty-state">
                        <Clock size={32} />
                        <p>Chưa có kết quả đánh giá cuối kỳ.</p>
                      </div>
                    )}

                    {finalAssessment && (
                      <div className="srwp-report-view srwp-review-box">
                        <div className="srwp-status-row">
                          <span className="srwp-label">
                            Chấm điểm Final Assessment:
                          </span>
                          <span
                            className={`srwp-badge result-${finalAssessment.assessmentStatus}`}
                          >
                            {formatFinalAssessmentStatus(
                              finalAssessment.assessmentStatus,
                            )}
                          </span>
                        </div>
                        {finalAssessment.score != null && (
                          <div className="srwp-status-row">
                            <span className="srwp-label">Điểm số:</span>
                            <strong>{finalAssessment.score}/100</strong>
                          </div>
                        )}
                        {finalAssessment.feedback && (
                          <div className="srwp-feedback-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {finalAssessment.feedback}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Meeting Request Modal ── */}
      {meetingFormOpen && (
        <div
          className="srwp-modal-overlay"
          onClick={() => setMeetingFormOpen(false)}
        >
          <div className="srwp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="srwp-modal-header">
              <h3>
                <Calendar size={16} /> Đề xuất meeting mới với mentor
              </h3>
              <button
                type="button"
                className="srwp-modal-close"
                onClick={() => setMeetingFormOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form className="srwp-modal-body" onSubmit={handleCreateMeeting}>
              <div className="srwp-form-group">
                <label>Tiêu đề</label>
                <input
                  type="text"
                  className="srwp-input"
                  value={meetingDraft.title || ""}
                  onChange={(e) =>
                    setMeetingDraft({
                      ...meetingDraft,
                      title: e.target.value,
                    })
                  }
                  placeholder="VD: Hỏi đáp checkpoint node 3"
                  required
                />
              </div>
              <div className="srwp-form-group">
                <label>
                  Mục đích buổi họp <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="srwp-input"
                  value={meetingDraft.purpose || ""}
                  onChange={(e) =>
                    setMeetingDraft({
                      ...meetingDraft,
                      purpose: e.target.value,
                    })
                  }
                  placeholder="VD: Review project demo, giải đáp thắc mắc..."
                  required
                />
                <p className="srwp-form-hint">
                  Mentor cần biết rõ bạn muốn làm gì trước khi chấp nhận.
                </p>
              </div>
              <div className="srwp-form-row">
                <div className="srwp-form-group">
                  <label>Thời gian</label>
                  <input
                    type="datetime-local"
                    className="srwp-input"
                    value={
                      meetingDraft.scheduledAt
                        ? new Date(meetingDraft.scheduledAt)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setMeetingDraft({
                        ...meetingDraft,
                        scheduledAt: new Date(e.target.value).toISOString(),
                      })
                    }
                    required
                  />
                </div>
                <div className="srwp-form-group">
                  <label>Thời lượng (phút)</label>
                  <input
                    type="number"
                    className="srwp-input"
                    value={meetingDraft.durationMinutes || 45}
                    onChange={(e) =>
                      setMeetingDraft({
                        ...meetingDraft,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    min={15}
                    max={240}
                  />
                </div>
              </div>
              <div className="srwp-form-group">
                <label>Link Jitsi (tuỳ chọn)</label>
                <input
                  type="url"
                  className="srwp-input"
                  value={meetingDraft.meetingLink || ""}
                  onChange={(e) =>
                    setMeetingDraft({
                      ...meetingDraft,
                      meetingLink: e.target.value,
                    })
                  }
                  placeholder="Để trống để hệ thống tự sinh link Jitsi"
                />
              </div>
              <div className="srwp-form-group">
                <label>Ghi chú thêm</label>
                <textarea
                  className="srwp-input"
                  rows={3}
                  value={meetingDraft.agenda || ""}
                  onChange={(e) =>
                    setMeetingDraft({
                      ...meetingDraft,
                      agenda: e.target.value,
                    })
                  }
                  placeholder="Các ý chính bạn muốn trao đổi..."
                />
              </div>
              <div className="srwp-modal-actions">
                <button
                  type="button"
                  className="srwp-btn-cancel"
                  onClick={() => setMeetingFormOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="srwp-btn-save"
                  disabled={meetingSaving}
                >
                  <Save size={13} />{" "}
                  {meetingSaving ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRoadmapWorkspacePage;
