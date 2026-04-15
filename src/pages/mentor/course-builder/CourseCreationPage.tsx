import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiPlus,
  FiLink,
  FiList,
} from "react-icons/fi";
import { useCourseManagement } from "../../../context/mentor/CourseManagementContext";
import { useAuth } from "../../../context/AuthContext";
import {
  CourseLevel,
  CourseStatus,
} from "../../../data/courseDTOs";
import { SubmissionType } from "../../../data/assignmentDTOs";
import { QuestionType } from "../../../data/quizDTOs";
import { uploadMedia } from "../../../services/mediaService";
import {
  submitCourseForApproval,
  createCourseRevision,
  getCourseRevision,
  listCourseRevisions,
  submitCourseRevision,
  updateCourseRevision,
  CourseRevisionDTO,
} from "../../../services/courseService";
import { useToast } from "../../../hooks/useToast";
import Toast from "../../../components/shared/Toast";
import {
  LessonAttachmentDraft,
  LessonDraft,
  LessonKind,
  ModuleDraft,
  QuizQuestionDraft,
} from "./courseBuilderTypes";
import {
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
  validateAssignmentsBeforeSave,
  validateQuizzesBeforeSave,
  validateAssignmentScore,
} from "./courseBuilderValidation";
import { mapRevisionSnapshotIdentityErrorToVietnameseMessage } from "../../../utils/courseRevisionMessages";
import "../../../styles/course-builder.css";

// Constants
import {
  ViewState,
  ConfirmDialogState,
  ReadingLinkDialogState,
  CATEGORIES,
  LEVELS,
  createId,
  COURSE_BUILDER_FLOW_PARAM,
  parseBuilderFlowState,
  buildCourseEditUrl,
  logCourseDraftOrderDebug,
} from "./courseBuilderConstants";

// Utils
import {
  parseModulesFromRevisionSnapshot,
  mapCourseModulesToDraftModules,
  mergeSnapshotModulesWithFallback,
  normalizeLessonAttachments,
  getCourseInfoChangedFields,
  getModuleChangeInfo,
  getLessonChangeInfo,
  findMatchingModule,
  normalizeRevisionSnapshotPayload,
  buildRevisionContentSnapshot,
  validateRevisionSnapshotPayload,
  ensureReadOnlyStyles,
} from "./courseBuilderUtils";

// Components
import CourseBuilderSidebar from "./components/CourseBuilderSidebar";
import CourseInfoForm from "./components/CourseInfoForm";
import ModuleEditorForm from "./components/ModuleEditorForm";
import LessonEditorForm from "./components/LessonEditorForm";
import RevisionHistoryModal from "./components/RevisionHistoryModal";

// ============================================================================
// COMPONENT
// ============================================================================

const CourseCreationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const isEditMode = Boolean(courseId);
  const { user } = useAuth();

  /** Prevent scroll-wheel from accidentally changing number inputs */
  const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) =>
    e.currentTarget.blur();

  const {
    state,
    updateCourseForm,
    loadCourseForEdit,
    createCourse,
    updateCourse,
    resetState,
  } = useCourseManagement();

  const { courseForm, isLoading } = state;
  const {
    toast,
    isVisible,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const revisionIdParam = searchParams.get("revisionId");
  const revisionId = revisionIdParam ? Number(revisionIdParam) : null;
  const isRevisionMode = Boolean(revisionId && !Number.isNaN(revisionId));

  const [activeRevision, setActiveRevision] =
    useState<CourseRevisionDTO | null>(null);
  const [baselineRevision, setBaselineRevision] =
    useState<CourseRevisionDTO | null>(null);
  const [baselineSnapshotModules, setBaselineSnapshotModules] = useState<
    ModuleDraft[]
  >([]);
  const [revisionHistory, setRevisionHistory] = useState<CourseRevisionDTO[]>(
    [],
  );
  const [isRevisionLoading, setIsRevisionLoading] = useState(false);
  const [isRevisionHistoryModalOpen, setIsRevisionHistoryModalOpen] =
    useState(false);
  const revisionIsEditable =
    activeRevision?.status === "DRAFT" || activeRevision?.status === "REJECTED";

  /**
   * View vs Edit policy:
   * - New course creation (no courseId): always editable
   * - Revision mode (?revisionId=...): editable only if revision is DRAFT/REJECTED
   * - Existing course (?courseId=...): directly editable only if status is
   *   DRAFT/REJECTED/SUSPENDED; PENDING/PUBLIC are read-only (must use revision)
   */
  const canDirectEdit =
    !isEditMode
      ? true
      : (state.currentCourse?.status === CourseStatus.DRAFT ||
          state.currentCourse?.status === CourseStatus.REJECTED ||
          state.currentCourse?.status === CourseStatus.SUSPENDED);
  const isEditable = isRevisionMode ? revisionIsEditable : canDirectEdit;

  // Local State
  const [activeView, setActiveView] = useState<ViewState>({
    type: "course_info",
  });
  const [modules, setModules] = useState<ModuleDraft[]>([]);
  const [collapsedModules, setCollapsedModules] = useState<
    Record<string, boolean>
  >({});
  const [learningObjectives, setLearningObjectives] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [assignmentErrors, setAssignmentErrors] = useState<
    Record<string, AssignmentFieldErrors>
  >({});

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );
  const [readingLinkDialog, setReadingLinkDialog] =
    useState<ReadingLinkDialogState | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Quiz Editor State (for tab switching)
  const [lessonEditor, setLessonEditor] = useState<{
    activeTab: "settings" | "questions";
  }>({ activeTab: "settings" });
  const showToast = useCallback(
    (type: "success" | "error" | "info" | "warning", message: string) => {
      switch (type) {
        case "success":
          showSuccess("Đã cập nhật", message);
          break;
        case "error":
          showError("Không thể tiếp tục", message);
          break;
        case "warning":
          showWarning("Cần kiểm tra lại", message);
          break;
        case "info":
        default:
          showInfo("Thông tin", message);
          break;
      }
    },
    [showError, showInfo, showSuccess, showWarning],
  );
  const getApiErrorMessage = useCallback((err: unknown): string => {
    const responseData = (err as { response?: { data?: unknown } })?.response
      ?.data;
    if (responseData) {
      if (typeof responseData === "string") return responseData;
      if (typeof responseData === "object") {
        const responseObj = responseData as {
          message?: string;
          error?: string;
        };
        return (
          responseObj.message ||
          responseObj.error ||
          JSON.stringify(responseData)
        );
      }
      return String(responseData);
    }
    if (err instanceof Error) return err.message;
    return String(err);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  const latestRevision = revisionHistory[0] ?? activeRevision;
  const openRevision = revisionHistory.find(
    (revision) => revision.status === "DRAFT" || revision.status === "PENDING",
  );
  const hasPendingOpenRevision =
    !isRevisionMode && openRevision?.status === "PENDING";
  const hasDraftOpenRevision =
    !isRevisionMode && openRevision?.status === "DRAFT";
  const changedCourseInfoFields = getCourseInfoChangedFields(
    {
      title: courseForm.title,
      summary: courseForm.summary,
      description: courseForm.description,
      category: courseForm.category,
      level: courseForm.level,
      price: courseForm.price,
      estimatedDuration: courseForm.estimatedDuration,
    },
    learningObjectives,
    requirements,
    baselineRevision,
  );

  const clearAssignmentError = (
    lessonId: string,
    field: keyof AssignmentFieldErrors,
    criteriaIndex?: number,
    criteriaField?: keyof AssignmentCriteriaItemErrors,
  ) => {
    setAssignmentErrors((prev) => {
      const current = prev[lessonId];
      if (!current) return prev;
      const next: AssignmentFieldErrors = { ...current };

      if (
        field === "criteriaItems" &&
        criteriaIndex !== undefined &&
        criteriaField
      ) {
        const items = { ...(next.criteriaItems || {}) };
        const item = { ...(items[criteriaIndex] || {}) };
        delete item[criteriaField];
        if (Object.keys(item).length > 0) {
          items[criteriaIndex] = item;
        } else {
          delete items[criteriaIndex];
        }
        if (Object.keys(items).length > 0) {
          next.criteriaItems = items;
        } else {
          delete next.criteriaItems;
        }
        delete next.criteriaTotal;
      } else if (field === "criteriaItems") {
        delete next.criteriaItems;
        delete next.criteriaTotal;
      } else {
        delete next[field];
        if (field === "maxScore") {
          delete next.criteriaTotal;
        }
      }

      if (Object.keys(next).length === 0) {
        const copy = { ...prev };
        delete copy[lessonId];
        return copy;
      }
      return { ...prev, [lessonId]: next };
    });
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isEditMode && courseId) {
      loadCourseForEdit(courseId);
    } else {
      resetState();
    }
  }, [isEditMode, courseId, loadCourseForEdit, resetState]);

  // Show error notification when context error changes
  useEffect(() => {
    if (state.error) {
      showToast("error", state.error);
    }
  }, [showToast, state.error]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const flowState = parseBuilderFlowState(params);

    if (!flowState) {
      return;
    }

    if (flowState === "submitted") {
      showToast("success", "Đã gửi khóa học tới quản trị viên để xét duyệt.");
    } else if (flowState === "revisionCreated") {
      showToast(
        "success",
        "Đã tạo phiên bản mới. Bạn có thể chỉnh sửa rồi gửi duyệt phiên bản.",
      );
    } else if (flowState === "revisionSubmitted") {
      showToast("success", "Đã gửi phiên bản tới quản trị viên để xét duyệt.");
    }

    params.delete(COURSE_BUILDER_FLOW_PARAM);
    params.delete("submitted");
    params.delete("revisionCreated");
    params.delete("revisionSubmitted");

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, showToast]);

  useEffect(() => {
    if (!isEditMode || !courseId) {
      setRevisionHistory([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await listCourseRevisions(Number(courseId), 0, 10);
        setRevisionHistory(response.content ?? []);
      } catch {
        setRevisionHistory([]);
      }
    };

    void loadHistory();
  }, [courseId, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !courseId || isRevisionMode) {
      return;
    }
    if (state.currentCourse?.status !== CourseStatus.PUBLIC) {
      return;
    }
    if (revisionHistory.length === 0) {
      return;
    }

    const preferredRevision =
      revisionHistory.find((revision) => revision.status === "APPROVED") ??
      revisionHistory[0];

    if (!preferredRevision?.id) {
      return;
    }

    navigate(
      `/mentor/courses/${courseId}/edit?revisionId=${preferredRevision.id}`,
      { replace: true },
    );
  }, [
    courseId,
    isEditMode,
    isRevisionMode,
    navigate,
    revisionHistory,
    state.currentCourse?.status,
  ]);

  useEffect(() => {
    if (!isRevisionMode || !revisionId) {
      setActiveRevision(null);
      setBaselineRevision(null);
      setBaselineSnapshotModules([]);
      return;
    }

    const loadRevision = async () => {
      try {
        setIsRevisionLoading(true);
        const revision = await getCourseRevision(revisionId);
        setActiveRevision(revision);

        const sourceRevisionId =
          typeof revision.sourceRevisionId === "number"
            ? revision.sourceRevisionId
            : null;
        if (
          sourceRevisionId &&
          sourceRevisionId > 0 &&
          sourceRevisionId !== revision.id
        ) {
          try {
            const sourceRevision = await getCourseRevision(sourceRevisionId);
            setBaselineRevision(sourceRevision);
            setBaselineSnapshotModules(
              parseModulesFromRevisionSnapshot(
                sourceRevision.contentSnapshotJson,
              ),
            );
          } catch {
            setBaselineRevision(null);
            setBaselineSnapshotModules([]);
          }
        } else {
          setBaselineRevision(null);
          setBaselineSnapshotModules([]);
        }

        const revisionFormData: Partial<typeof state.courseForm> = {};
        if (revision.title !== undefined)
          revisionFormData.title = revision.title;
        if (revision.description !== undefined)
          revisionFormData.description = revision.description;
        if (revision.shortDescription !== undefined)
          revisionFormData.summary = revision.shortDescription;
        if (revision.category !== undefined)
          revisionFormData.category = revision.category;
        if (revision.level !== undefined)
          revisionFormData.level = revision.level as CourseLevel;
        if (revision.price !== undefined)
          revisionFormData.price = revision.price;
        if (revision.currency !== undefined)
          revisionFormData.currency = revision.currency;
        if (revision.estimatedDurationHours !== undefined) {
          revisionFormData.estimatedDuration = revision.estimatedDurationHours;
        }
        if (revision.language !== undefined)
          revisionFormData.language = revision.language;
        if (Object.keys(revisionFormData).length > 0) {
          updateCourseForm(revisionFormData);
        }
        if (revision.learningObjectivesJson) {
          const parsedObjectives = JSON.parse(
            revision.learningObjectivesJson,
          ) as string[];
          if (Array.isArray(parsedObjectives) && parsedObjectives.length > 0) {
            setLearningObjectives(parsedObjectives);
          }
        }
        if (revision.requirementsJson) {
          const parsedRequirements = JSON.parse(
            revision.requirementsJson,
          ) as string[];
          if (
            Array.isArray(parsedRequirements) &&
            parsedRequirements.length > 0
          ) {
            setRequirements(parsedRequirements);
          }
        }
        const snapshotModules = parseModulesFromRevisionSnapshot(
          revision.contentSnapshotJson,
        );
        const fallbackModules = mapCourseModulesToDraftModules(
          state.modules as unknown as Array<Record<string, unknown>>,
        );
        const mergedModules = mergeSnapshotModulesWithFallback(
          snapshotModules,
          fallbackModules,
        );

        if (mergedModules.length > 0) {
          setModules(mergedModules);
          setAssignmentErrors({});
        }
      } catch (error) {
        showToast(
          "error",
          `Không thể tải thông tin phiên bản: ${getApiErrorMessage(error)}`,
        );
      } finally {
        setIsRevisionLoading(false);
      }
    };

    void loadRevision();
  }, [
    getApiErrorMessage,
    isRevisionMode,
    revisionId,
    showToast,
    updateCourseForm,
  ]);

  useEffect(() => {
    if (!isRevisionHistoryModalOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRevisionHistoryModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevisionHistoryModalOpen]);

  // Sync from context to local state
  useEffect(() => {
    if (!isEditMode || isLoading || !state.currentCourse) return;

    if (state.courseForm.learningObjectives?.length) {
      setLearningObjectives(state.courseForm.learningObjectives);
    }
    if (state.courseForm.requirements?.length) {
      setRequirements(state.courseForm.requirements);
    }

    // Map context modules to local draft modules if needed
    if (state.modules.length > 0 && modules.length === 0) {
      const mappedModules = mapCourseModulesToDraftModules(
        state.modules as unknown as Array<Record<string, unknown>>,
      );
      setModules(mappedModules);
    }
  }, [
    isEditMode,
    isLoading,
    modules.length,
    state.courseForm.learningObjectives,
    state.courseForm.requirements,
    state.currentCourse,
    state.modules,
  ]);

  // In revision mode, reconcile context modules with revision snapshot.
  useEffect(() => {
    if (!isRevisionMode || !activeRevision || isRevisionLoading) {
      return;
    }
    if (!Array.isArray(state.modules) || state.modules.length === 0) {
      return;
    }

    const snapshotModules = parseModulesFromRevisionSnapshot(
      activeRevision.contentSnapshotJson,
    );
    if (snapshotModules.length === 0) {
      return;
    }

    const fallbackModules = mapCourseModulesToDraftModules(
      state.modules as unknown as Array<Record<string, unknown>>,
    );
    const reconciledModules = mergeSnapshotModulesWithFallback(
      snapshotModules,
      fallbackModules,
    );
    if (reconciledModules.length === 0) {
      return;
    }

    const countLessonLikeItems = (moduleList: ModuleDraft[]): number =>
      moduleList.reduce(
        (total, module) =>
          total + (Array.isArray(module.lessons) ? module.lessons.length : 0),
        0,
      );

    const currentCount = countLessonLikeItems(modules);
    const reconciledCount = countLessonLikeItems(reconciledModules);

    if (reconciledCount > currentCount) {
      setModules(reconciledModules);
      setAssignmentErrors({});
    }
  }, [
    activeRevision,
    isRevisionLoading,
    isRevisionMode,
    modules,
    state.modules,
  ]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGoBack = () => {
    const fromState = location.state as {
      activeTab?: string;
      coursesPage?: number;
    } | null;
    const targetPage = fromState?.coursesPage;
    navigate("/mentor", {
      state: {
        activeTab: fromState?.activeTab || "courses",
        ...(typeof targetPage === "number" &&
        Number.isFinite(targetPage) &&
        targetPage > 0
          ? { coursesPage: targetPage }
          : {}),
      },
    });
  };

  const handleCreateRevisionFromPublic = useCallback(async () => {
    if (!state.currentCourse?.id) {
      showToast("error", "Không tìm thấy khóa học để tạo phiên bản mới.");
      return;
    }

    try {
      setIsRevisionLoading(true);
      const createdRevision = await createCourseRevision(
        state.currentCourse.id,
      );
      const refreshed = await listCourseRevisions(
        state.currentCourse.id,
        0,
        10,
      );
      setRevisionHistory(refreshed.content ?? []);
      navigate(
        buildCourseEditUrl(state.currentCourse.id, {
          revisionId: createdRevision.id,
          flow: "revisionCreated",
        }),
        { replace: true },
      );
    } catch (error) {
      const apiErrorMessage = getApiErrorMessage(error);

      if (apiErrorMessage.includes("COURSE_HAS_OPEN_REVISION")) {
        try {
          const refreshed = await listCourseRevisions(
            state.currentCourse.id,
            0,
            20,
          );
          const history = refreshed.content ?? [];
          setRevisionHistory(history);

          const openRevision = history.find(
            (revision) =>
              revision.status === "DRAFT" || revision.status === "PENDING",
          );

          if (openRevision) {
            const isPending = openRevision.status === "PENDING";
            showToast(
              isPending ? "warning" : "info",
              isPending
                ? `Khóa học đã có phiên bản #${openRevision.revisionNumber} đang chờ duyệt. Chưa thể tạo phiên bản mới cho tới khi admin xử lý phiên bản này.`
                : `Khóa học đã có phiên bản nháp #${openRevision.revisionNumber}. Mở phiên bản hiện có để bạn tiếp tục chỉnh sửa.`,
            );
            navigate(
              `/mentor/courses/${state.currentCourse.id}/edit?revisionId=${openRevision.id}`,
              { replace: true },
            );
            return;
          }
        } catch {
          // Fall through and show original backend message.
        }
      }

      showToast("error", `Không thể tạo phiên bản mới: ${apiErrorMessage}`);
    } finally {
      setIsRevisionLoading(false);
    }
  }, [getApiErrorMessage, navigate, showToast, state.currentCourse]);

  const handleOpenRevisionInEditor = useCallback(
    (targetRevision: CourseRevisionDTO) => {
      if (!state.currentCourse?.id) return;
      setIsRevisionHistoryModalOpen(false);
      navigate(
        `/mentor/courses/${state.currentCourse.id}/edit?revisionId=${targetRevision.id}`,
      );
    },
    [navigate, state.currentCourse?.id],
  );

  const handleThumbnailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isEditable) {
        if (e.target) e.target.value = "";
        showToast(
          "warning",
          "Khóa học đang ở chế độ xem, bạn không thể thay đổi ảnh bìa.",
        );
        return;
      }

      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
          showToast("error", "File quá lớn (Tối đa 5MB)");
          return;
        }
        setThumbnailFile(file);
        // Preview immediately
        updateCourseForm({ thumbnailUrl: URL.createObjectURL(file) });
      }
    },
    [isEditable, showToast, updateCourseForm],
  );

  const updateLessonField = (
    moduleId: string,
    lessonId: string,
    data: Partial<LessonDraft>,
  ) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;

            // Data integrity check: If type changes significantly (e.g. Reading -> Quiz),
            // we must clear the serverId to force creation of a new entity, preventing backend type mismatch errors.
            let newServerId = l.serverId;
            if (data.type && data.type !== l.type) {
              const isOldLesson = l.type === "reading" || l.type === "video";
              const isNewLesson =
                data.type === "reading" || data.type === "video";

              // If switching between incompatible types (Lesson <-> Quiz <-> Assignment)
              if (
                isOldLesson !== isNewLesson ||
                l.type === "quiz" ||
                data.type === "quiz" ||
                l.type === "assignment" ||
                data.type === "assignment"
              ) {
                if (l.type !== data.type) {
                  newServerId = undefined; // Treat as new entity
                }
              }
            }

            return { ...l, ...data, serverId: newServerId };
          }),
        };
      }),
    );
  };

  const openReadingLinkDialog = (
    moduleId: string,
    lessonId: string,
    currentValue?: string,
  ) => {
    if (!isEditable) {
      showToast(
        "warning",
        "Khóa học đang ở chế độ xem, bạn không thể cập nhật link tài liệu.",
      );
      return;
    }

    setReadingLinkDialog({
      moduleId,
      lessonId,
      value: currentValue || "",
    });
  };

  const closeReadingLinkDialog = () => {
    setReadingLinkDialog(null);
  };

  const handleReadingLinkDialogSave = () => {
    if (!readingLinkDialog) return;

    if (!isEditable) {
      showToast(
        "warning",
        "Khóa học đang ở chế độ xem, bạn không thể cập nhật link tài liệu.",
      );
      setReadingLinkDialog(null);
      return;
    }

    const normalizedUrl = readingLinkDialog.value.trim();
    updateLessonField(readingLinkDialog.moduleId, readingLinkDialog.lessonId, {
      resourceUrl: normalizedUrl.length > 0 ? normalizedUrl : undefined,
    });

    setReadingLinkDialog(null);
  };

  const hasConfiguredTypeSpecificData = (lesson: LessonDraft): boolean => {
    if (lesson.type === "quiz") {
      return Boolean(
        (lesson.questions && lesson.questions.length > 0) ||
        (lesson.quizDescription && lesson.quizDescription.trim().length > 0) ||
        lesson.passScore !== undefined ||
        lesson.quizMaxAttempts !== undefined ||
        lesson.quizTimeLimitMinutes !== undefined,
      );
    }

    if (lesson.type === "video") {
      return Boolean(
        (lesson.youtubeUrl && lesson.youtubeUrl.trim().length > 0) ||
        (typeof lesson.videoMediaId === "number" && lesson.videoMediaId > 0),
      );
    }

    if (lesson.type === "assignment") {
      return Boolean(
        (lesson.assignmentDescription &&
          lesson.assignmentDescription.trim().length > 0) ||
        (lesson.assignmentCriteria && lesson.assignmentCriteria.length > 0) ||
        lesson.assignmentMaxScore !== undefined ||
        lesson.assignmentPassingScore !== undefined,
      );
    }

    return Boolean(
      (lesson.contentText && lesson.contentText.trim().length > 0) ||
      (lesson.resourceUrl && lesson.resourceUrl.trim().length > 0) ||
      (lesson.attachments && lesson.attachments.length > 0),
    );
  };

  const buildTypeSwitchPayload = (
    lesson: LessonDraft,
    nextType: LessonKind,
  ): Partial<LessonDraft> => {
    const base: Partial<LessonDraft> = {
      type: nextType,
      contentText: undefined,
      resourceUrl: undefined,
      attachments: [],
      youtubeUrl: undefined,
      videoMediaId: undefined,
      passScore: undefined,
      quizTimeLimitMinutes: undefined,
      quizMaxAttempts: undefined,
      quizDescription: undefined,
      roundingIncrement: undefined,
      gradingMethod: undefined,
      cooldownHours: undefined,
      questions: [],
      assignmentSubmissionType: undefined,
      assignmentDescription: undefined,
      assignmentMaxScore: undefined,
      assignmentPassingScore: undefined,
      assignmentIsRequired: undefined,
      assignmentCriteria: [],
    };

    if (nextType === "reading") {
      return {
        ...base,
        contentText: lesson.type === "reading" ? lesson.contentText || "" : "",
      };
    }

    if (nextType === "video") {
      return {
        ...base,
        youtubeUrl: lesson.type === "video" ? lesson.youtubeUrl : undefined,
        videoMediaId: lesson.type === "video" ? lesson.videoMediaId : undefined,
      };
    }

    if (nextType === "quiz") {
      return {
        ...base,
        quizDescription:
          lesson.type === "quiz" ? lesson.quizDescription : undefined,
        passScore: lesson.type === "quiz" ? lesson.passScore : 80,
        quizMaxAttempts:
          lesson.type === "quiz" ? lesson.quizMaxAttempts : undefined,
        quizTimeLimitMinutes:
          lesson.type === "quiz" ? lesson.quizTimeLimitMinutes : undefined,
        roundingIncrement:
          lesson.type === "quiz" ? lesson.roundingIncrement : undefined,
        gradingMethod:
          lesson.type === "quiz" ? 'HIGHEST' : undefined,
        cooldownHours:
          lesson.type === "quiz" ? lesson.cooldownHours : undefined,
        questions: lesson.type === "quiz" ? lesson.questions || [] : [],
      };
    }

    return {
      ...base,
      assignmentSubmissionType:
        lesson.type === "assignment"
          ? lesson.assignmentSubmissionType || SubmissionType.TEXT
          : SubmissionType.TEXT,
      assignmentDescription:
        lesson.type === "assignment" ? lesson.assignmentDescription : undefined,
      assignmentMaxScore:
        lesson.type === "assignment" ? (lesson.assignmentMaxScore ?? 100) : 100,
      assignmentPassingScore:
        lesson.type === "assignment"
          ? (lesson.assignmentPassingScore ?? 50)
          : 50,
      assignmentIsRequired:
        lesson.type === "assignment" ? lesson.assignmentIsRequired : undefined,
      assignmentCriteria:
        lesson.type === "assignment" ? lesson.assignmentCriteria || [] : [],
    };
  };

  const handleLessonTypeSwitch = (
    moduleId: string,
    lesson: LessonDraft,
    nextType: LessonKind,
  ) => {
    if (lesson.type === nextType) {
      return;
    }

    const applySwitch = () => {
      const payload = buildTypeSwitchPayload(lesson, nextType);
      updateLessonField(moduleId, lesson.id, payload);
    };

    if (hasConfiguredTypeSpecificData(lesson)) {
      setConfirmDialog({
        title: "Đổi loại bài học",
        message:
          "Đổi loại sẽ xóa cấu hình chi tiết của loại hiện tại. Bạn có chắc chắn?",
        confirmLabel: "Đổi loại",
        onConfirm: applySwitch,
      });
      return;
    }

    applySwitch();
  };

  const handleRemoveLesson = (moduleId: string, lessonId: string) => {
    setConfirmDialog({
      title: "Xóa bài học",
      message: "Bạn có chắc chắn muốn xóa bài học này?",
      confirmLabel: "Xóa",
      onConfirm: () => {
        setModules((prev) =>
          prev.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.filter((l) => l.id !== lessonId),
            };
          }),
        );
        setActiveView({ type: "module", moduleId });
      },
    });
  };

  const handleMoveModule = (moduleId: string, direction: "up" | "down") => {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.id === moduleId);
      if (idx < 0) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  };

  const handleMoveLesson = (
    moduleId: string,
    lessonId: string,
    direction: "up" | "down",
  ) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const idx = m.lessons.findIndex((l) => l.id === lessonId);
        if (idx < 0) return m;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= m.lessons.length) return m;
        const lessons = [...m.lessons];
        [lessons[idx], lessons[targetIdx]] = [lessons[targetIdx], lessons[idx]];
        return { ...m, lessons };
      }),
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) {
      if (e.target) e.target.value = "";
      showToast(
        "warning",
        "Khóa học đang ở chế độ xem, bạn không thể thêm tệp đính kèm.",
      );
      return;
    }
    if (activeView.type !== "lesson" || !e.target.files || !e.target.files[0])
      return;

    // Single-file guard for reading lessons
    const currentLesson = modules
      .find((m) => m.id === activeView.moduleId)
      ?.lessons.find((l) => l.id === activeView.lessonId);
    if (currentLesson?.attachments && currentLesson.attachments.length > 0) {
      if (e.target) e.target.value = "";
      showToast(
        "warning",
        "Chỉ được đính kèm 1 tài liệu cho mỗi bài đọc. Vui lòng xóa file hiện tại trước.",
      );
      return;
    }

    const file = e.target.files[0];
    const { moduleId, lessonId } = activeView;

    try {
      // Upload file via mediaService
      const uploadedMedia = await uploadMedia(file, user?.id || 0);

      // Update lesson attachments
      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            lessons: m.lessons.map((l) => {
              if (l.id !== lessonId) return l;
              const newAttachment: LessonAttachmentDraft = {
                name: uploadedMedia.fileName || file.name,
                mediaId: uploadedMedia.id,
                url: uploadedMedia.url,
              };
              const newAttachments: LessonAttachmentDraft[] = [
                ...(l.attachments || []),
                newAttachment,
              ];
              return { ...l, attachments: newAttachments };
            }),
          };
        }),
      );

      showToast("success", "Upload file thành công!");
    } catch (err) {
      console.error(err);
      showToast("error", "Lỗi khi upload file: " + err);
    } finally {
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) {
      if (e.target) e.target.value = "";
      showToast(
        "warning",
        "Khóa học đang ở chế độ xem, bạn không thể tải video lên.",
      );
      return;
    }
    if (activeView.type !== "lesson" || !e.target.files || !e.target.files[0])
      return;

    const file = e.target.files[0];
    // Check file type
    if (!file.type.startsWith("video/")) {
      showToast("error", "Vui lòng chọn file video hợp lệ (mp4, webm, etc.)");
      return;
    }

    const { moduleId, lessonId } = activeView;

    try {
      showToast("success", "Đang upload video, vui lòng chờ...");
      // Upload file via mediaService
      const uploadedMedia = await uploadMedia(file, user?.id || 0);

      // Update lesson videoMediaId
      updateLessonField(moduleId, lessonId, { videoMediaId: uploadedMedia.id });

      showToast("success", "Upload video thành công!");
    } catch (err) {
      console.error(err);
      showToast("error", "Lỗi khi upload video: " + err);
    } finally {
      // Reset input
      if (e.target) e.target.value = "";
    }
  };

  const createDefaultQuestion = (
    type: QuestionType = QuestionType.MULTIPLE_CHOICE,
  ): QuizQuestionDraft => {
    const base: QuizQuestionDraft = {
      id: createId(),
      text: "",
      score: 1,
      type,
      options: [],
    };

    if (type === QuestionType.TRUE_FALSE) {
      base.options = [
        { id: createId(), text: "True", correct: true },
        { id: createId(), text: "False", correct: false },
      ];
    } else if (type === QuestionType.MULTIPLE_CHOICE) {
      base.options = [
        { id: createId(), text: "", correct: false },
        { id: createId(), text: "", correct: false },
        { id: createId(), text: "", correct: false },
        { id: createId(), text: "", correct: false },
      ];
    } else if (type === QuestionType.SHORT_ANSWER) {
      base.options = [{ id: createId(), text: "", correct: true }];
    }

    return base;
  };

  const persistCourseDraft = useCallback(
    async (options?: { silentSuccess?: boolean; redirectToEdit?: boolean }) => {
      if (saveInFlightRef.current) {
        return null;
      }

      const assignmentValidation = validateAssignmentsBeforeSave(modules);
      setAssignmentErrors(assignmentValidation.errorsByLesson);
      if (Object.keys(assignmentValidation.errorsByLesson).length > 0) {
        showToast(
          "error",
          assignmentValidation.firstMessage ||
            "Vui lòng kiểm tra lại thông tin bài tập.",
        );
        return null;
      }

      const quizValidation = validateQuizzesBeforeSave(modules);
      if (Object.keys(quizValidation.errorsByLesson).length > 0) {
        showToast(
          "error",
          quizValidation.firstMessage ||
            "Vui lòng kiểm tra lại thông tin quiz.",
        );
        return null;
      }

      saveInFlightRef.current = true;
      setIsSaving(true);

      try {
        logCourseDraftOrderDebug("before-save current modules", modules);

        if (isRevisionMode && activeRevision) {
          const normalizedSnapshotPayload = normalizeRevisionSnapshotPayload(
            buildRevisionContentSnapshot(modules),
          );
          logCourseDraftOrderDebug(
            "revision snapshot modules before updateRevision",
            normalizedSnapshotPayload.modules as unknown as ModuleDraft[],
          );
          const snapshotValidationError = validateRevisionSnapshotPayload(
            normalizedSnapshotPayload,
          );
          if (snapshotValidationError) {
            showToast("error", snapshotValidationError);
            return null;
          }

          const contentSnapshotJson = JSON.stringify(normalizedSnapshotPayload);
          const updatedRevision = await updateCourseRevision(
            activeRevision.id,
            {
              title: state.courseForm.title,
              description: state.courseForm.description,
              shortDescription: state.courseForm.summary,
              category: state.courseForm.category,
              level: state.courseForm.level,
              estimatedDurationHours: state.courseForm.estimatedDuration,
              language: state.courseForm.language,
              price: state.courseForm.price,
              currency: state.courseForm.currency,
              learningObjectives,
              requirements,
              contentSnapshotJson,
            },
          );
          setActiveRevision(updatedRevision);
          if (!options?.silentSuccess) {
            showToast(
              "success",
              `Đã lưu bản nháp phiên bản #${updatedRevision.revisionNumber}.`,
            );
          }
          return state.currentCourse;
        }

        let savedCourse;
        const fileToUpload = thumbnailFile || undefined;

        if (isEditMode && courseId) {
          savedCourse = await updateCourse(courseId, modules, {}, fileToUpload);
        } else {
          savedCourse = await createCourse(modules, {}, fileToUpload);
        }

        if (!savedCourse) {
          showToast("error", "Lỗi khi lưu: Không nhận được dữ liệu từ server.");
          return null;
        }

        logCourseDraftOrderDebug(
          "after-save API response modules",
          (savedCourse.modules || []) as unknown as ModuleDraft[],
        );

        const mappedModules: ModuleDraft[] = savedCourse.modules.map(
          (rawModule) => {
            const module = rawModule as {
              id: number;
              title: string;
              description?: string;
              lessons?: Array<
                Partial<LessonDraft> & {
                  id: number;
                  type?: string;
                  durationSec?: number;
                  videoUrl?: string;
                }
              >;
            };

            return {
              id: module.id.toString(),
              serverId: module.id,
              title: module.title,
              description: module.description,
              lessons: (module.lessons || []).map((rawLesson) => {
                const lessonId = (rawLesson as { id: number }).id;
                const lesson = rawLesson as Partial<LessonDraft> & {
                  id: number;
                  type?: string;
                  durationSec?: number;
                  videoUrl?: string;
                  aiGradingEnabled?: boolean;
                  trustAiEnabled?: boolean;
                  gradingStyle?: string;
                  aiGradingPrompt?: string;
                };

                return {
                  id: lessonId.toString(),
                  serverId: lessonId,
                  title: lesson.title || "",
                  type: (lesson.type?.toString().toLowerCase() ||
                    "reading") as LessonKind,
                  durationMin: lesson.durationSec
                    ? Math.round(lesson.durationSec / 60)
                    : undefined,
                  contentText: lesson.contentText,
                  resourceUrl: lesson.resourceUrl,
                  youtubeUrl: lesson.youtubeUrl || lesson.videoUrl,
                  videoMediaId: lesson.videoMediaId,
                  passScore: lesson.passScore,
                  quizTimeLimitMinutes: lesson.quizTimeLimitMinutes,
                  quizMaxAttempts: lesson.quizMaxAttempts,
                  roundingIncrement: lesson.roundingIncrement,
                  quizDescription: lesson.quizDescription,
                  gradingMethod: lesson.type === "quiz" ? 'HIGHEST' : lesson.gradingMethod,
                  cooldownHours: lesson.cooldownHours,
                  questions: (lesson.questions || []).map(
                    (question: QuizQuestionDraft) => ({
                      ...question,
                      score:
                        Number.isFinite(Number(question.score)) &&
                        Number(question.score) > 0
                          ? Number(question.score)
                          : 1,
                    }),
                  ),
                  assignmentSubmissionType: (lesson.assignmentSubmissionType ||
                    (lesson as { submissionType?: SubmissionType })
                      .submissionType ||
                    SubmissionType.TEXT) as SubmissionType,
                  assignmentDescription: lesson.assignmentDescription,
                  assignmentMaxScore: lesson.assignmentMaxScore,
                  assignmentPassingScore: lesson.assignmentPassingScore,
                  assignmentIsRequired: lesson.assignmentIsRequired,
                  assignmentCriteria: lesson.assignmentCriteria,
                  attachments: normalizeLessonAttachments(lesson.attachments),
                  // AI Grading fields — was missing, causing checkbox to reset after save
                  aiGradingEnabled: Boolean(lesson.aiGradingEnabled),
                  gradingStyle:
                    lesson.gradingStyle === "STANDARD" ||
                    lesson.gradingStyle === "STRICT" ||
                    lesson.gradingStyle === "LENIENT"
                      ? lesson.gradingStyle
                      : "STANDARD",
                  aiGradingPrompt: lesson.aiGradingPrompt || "",
                };
              }),
            };
          },
        );

        logCourseDraftOrderDebug(
          "after-save mapped modules in builder",
          mappedModules,
        );

        const idMap = new Map<
          string,
          { newModuleId: string; lessonMap: Map<string, string> }
        >();
        modules.forEach((oldModule, moduleIndex) => {
          const newModule = mappedModules[moduleIndex];
          if (!newModule) return;

          const lessonMap = new Map<string, string>();
          oldModule.lessons.forEach((oldLesson, lessonIndex) => {
            const newLesson = newModule.lessons[lessonIndex];
            if (newLesson) {
              lessonMap.set(oldLesson.id, newLesson.id);
            }
          });

          idMap.set(oldModule.id, { newModuleId: newModule.id, lessonMap });
        });

        setModules(mappedModules);
        setAssignmentErrors({});

        setActiveView((prev) => {
          if (prev.type === "module") {
            const entry = idMap.get(prev.moduleId);
            return entry
              ? { type: "module", moduleId: entry.newModuleId }
              : prev;
          }

          if (prev.type === "lesson") {
            const entry = idMap.get(prev.moduleId);
            if (!entry) return prev;

            const newLessonId = entry.lessonMap.get(prev.lessonId);
            return newLessonId
              ? {
                  type: "lesson",
                  moduleId: entry.newModuleId,
                  lessonId: newLessonId,
                }
              : prev;
          }

          return prev;
        });

        const shouldRedirectToEdit = options?.redirectToEdit ?? !isEditMode;
        if (!isEditMode && shouldRedirectToEdit) {
          navigate(`/mentor/courses/${savedCourse.id}/edit`, { replace: true });
        }

        if (!options?.silentSuccess) {
          showToast("success", "Đã lưu thành công. Dữ liệu đã được đồng bộ.");
        }

        return savedCourse;
      } catch (err) {
        const message = getApiErrorMessage(err);
        const identityMessage =
          mapRevisionSnapshotIdentityErrorToVietnameseMessage(message);
        if (identityMessage) {
          showToast("error", identityMessage);
        } else if (
          message.includes("COURSE_REVISION_CONTENT_SNAPSHOT_TOO_LARGE")
        ) {
          showToast(
            "error",
            "Nội dung phiên bản quá lớn. Vui lòng chia nhỏ hoặc tinh gọn nội dung trước khi lưu.",
          );
        } else {
          showToast("error", `Lỗi khi lưu: ${message}`);
        }
        return null;
      } finally {
        saveInFlightRef.current = false;
        setIsSaving(false);
      }
    },
    [
      activeRevision,
      courseId,
      createCourse,
      getApiErrorMessage,
      isEditMode,
      isRevisionMode,
      learningObjectives,
      modules,
      navigate,
      requirements,
      showToast,
      state.courseForm,
      state.currentCourse,
      thumbnailFile,
      updateCourse,
    ],
  );

  const handleSaveDraft = useCallback(async () => {
    await persistCourseDraft();
  }, [persistCourseDraft]);

  const handlePublishCourse = useCallback(async () => {
    if (!user?.id) {
      showToast(
        "error",
        "Không xác định được tài khoản người hướng dẫn hiện tại.",
      );
      return;
    }

    const hasLearningContent = modules.some(
      (module) => module.lessons.length > 0,
    );
    if (!hasLearningContent) {
      showToast(
        "warning",
        "Khóa học phải có ít nhất 1 module chứa nội dung trước khi gửi duyệt.",
      );
      return;
    }

    const savedCourse = await persistCourseDraft({
      silentSuccess: true,
      redirectToEdit: false,
    });
    if (!savedCourse) {
      return;
    }

    try {
      setIsSaving(true);
      if (isRevisionMode && activeRevision) {
        showToast("info", "Đang gửi phiên bản tới quản trị viên để xét duyệt.");
        const submittedRevision = await submitCourseRevision(activeRevision.id);
        setActiveRevision(submittedRevision);
        if (courseId) {
          const refreshed = await listCourseRevisions(Number(courseId), 0, 10);
          setRevisionHistory(refreshed.content ?? []);
        }
        navigate(
          buildCourseEditUrl(savedCourse.id, {
            revisionId: submittedRevision.id,
            flow: "revisionSubmitted",
          }),
          { replace: true },
        );
        return;
      }

      showToast("info", "Đang gửi khóa học tới quản trị viên để xét duyệt.");
      const submittedCourse = await submitCourseForApproval(
        savedCourse.id,
        user.id,
      );
      if (isEditMode) {
        await loadCourseForEdit(submittedCourse.id.toString());
      }
      navigate(buildCourseEditUrl(submittedCourse.id, { flow: "submitted" }), {
        replace: true,
      });
    } catch (error) {
      const apiErrorMessage = getApiErrorMessage(error);
      const identityMessage =
        mapRevisionSnapshotIdentityErrorToVietnameseMessage(apiErrorMessage);
      if (identityMessage) {
        showToast("error", identityMessage);
      } else if (
        apiErrorMessage.includes("COURSE_REVISION_NO_CHANGES_TO_SUBMIT")
      ) {
        showToast(
          "warning",
          "Phiên bản chưa có thay đổi thực tế so với bản gốc, nên chưa thể gửi duyệt.",
        );
      } else if (
        apiErrorMessage.includes("COURSE_REVISION_NO_CHANGES_SINCE_REJECTION")
      ) {
        showToast(
          "warning",
          "Phiên bản bị từ chối trước đó nhưng chưa có cập nhật mới, nên chưa thể gửi duyệt lại.",
        );
      } else if (
        apiErrorMessage.includes("COURSE_REVISION_BASELINE_NOT_FOUND")
      ) {
        showToast(
          "error",
          "Không xác định được bản gốc để so sánh thay đổi. Vui lòng liên hệ quản trị viên để xử lý dữ liệu phiên bản.",
        );
      } else {
        showToast("error", `Không thể gửi duyệt: ${apiErrorMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    activeRevision,
    courseId,
    getApiErrorMessage,
    isEditMode,
    isRevisionMode,
    loadCourseForEdit,
    modules,
    navigate,
    persistCourseDraft,
    showToast,
    user?.id,
  ]);

  // Inject read-only CSS once on mount
  useEffect(() => {
    ensureReadOnlyStyles();
  }, []);

  // ============================================================================
  // WRAPPER HANDLERS FOR SUB-COMPONENTS
  // ============================================================================

  const handleAddLesson = (moduleId: string, newLessonId: string) => {
    const newLesson: LessonDraft = {
      id: newLessonId,
      title: "Bài học mới",
      type: "reading",
      contentText: "",
      questions: [],
      assignmentSubmissionType: SubmissionType.TEXT,
    };
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m));
    setActiveView({ type: "lesson", moduleId, lessonId: newLessonId });
  };

  const handleAddModule = () => {
    const newModuleId = createId();
    const newModule: ModuleDraft = { id: newModuleId, title: "Module mới", lessons: [] };
    setModules(prev => [...prev, newModule]);
    setActiveView({ type: "module", moduleId: newModuleId });
  };

  // File upload wrapper: convert File to synthetic ChangeEvent
  const handleFileUploadFromFile = (file: File) => {
    const mockEvent = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    void handleFileUpload(mockEvent);
  };

  // Video upload wrapper: convert File to synthetic ChangeEvent
  const handleVideoUploadFromFile = (file: File) => {
    const mockEvent = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    void handleVideoUpload(mockEvent);
  };

  // Thumbnail change wrapper: convert File to synthetic ChangeEvent
  const handleThumbnailChangeFromFile = (file: File) => {
    const mockEvent = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    void handleThumbnailChange(mockEvent);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`cb-page${!isEditable ? " cb-readonly" : ""}`}>
      {/* Banner warning */}
      {!isEditable && (
        <div className="cb-banner-warning">
          <FiAlertTriangle size={20} />
          <div>
            <strong>Chế độ xem:</strong> Khóa học này đang ở trạng thái{" "}
            <strong>{state.currentCourse?.status}</strong> và không thể chỉnh
            sửa trực tiếp.
            {isRevisionMode
              ? ` Phiên bản hiện tại đang ở trạng thái ${activeRevision?.status ?? "N/A"}, bạn chỉ có thể xem.`
              : hasPendingOpenRevision
                ? ` Khóa học đã có phiên bản #${openRevision?.revisionNumber ?? ""} đang chờ duyệt. Vui lòng chờ admin xử lý phiên bản này trước khi tạo phiên bản mới.`
                : hasDraftOpenRevision
                  ? ` Khóa học đã có phiên bản nháp #${openRevision?.revisionNumber ?? ""}. Vui lòng mở phiên bản này để tiếp tục chỉnh sửa.`
                  : " Vui lòng tạo phiên bản mới để cập nhật khóa học đã xuất bản."}
          </div>
          {!isRevisionMode &&
            state.currentCourse?.status === CourseStatus.PUBLIC && (
              <button
                className="cb-button cb-banner-warning__action"
                onClick={() => {
                  if (openRevision) {
                    handleOpenRevisionInEditor(openRevision);
                    return;
                  }
                  void handleCreateRevisionFromPublic();
                }}
                disabled={isRevisionLoading}
              >
                <FiPlus />{" "}
                {openRevision
                  ? `Mở phiên bản #${openRevision.revisionNumber}`
                  : "Tạo phiên bản mới"}
              </button>
            )}
        </div>
      )}

      {/* Header */}
      <div className="cb-container cb-container--workspace">
        <header className="cb-header cb-header--workspace">
          <div className="cb-header__left">
            <button className="cb-back-button" onClick={handleGoBack}>
              <FiArrowLeft /> Quay lại
            </button>
            <h1 className="cb-title">
              {isEditMode ? "Chỉnh sửa khóa học" : "Tạo khóa học"}
              {isRevisionMode && activeRevision
                ? ` • Phiên bản #${activeRevision.revisionNumber}`
                : ""}
            </h1>
          </div>
          <div className="cb-header__right">
            {isEditMode &&
              state.currentCourse?.id &&
              revisionHistory.length > 0 && (
                <button
                  className="cb-revision-history-trigger"
                  onClick={() => setIsRevisionHistoryModalOpen(true)}
                >
                  <FiList />
                  <span>Xem lịch sử</span>
                  {latestRevision && (
                    <span className="cb-revision-history-trigger__latest">
                      #{latestRevision.revisionNumber}
                    </span>
                  )}
                </button>
              )}
            <button
              className="cb-button cb-button--secondary"
              disabled={isSaving || !isEditable}
              onClick={() => void handleSaveDraft()}
            >
              <FiSave /> Lưu nháp
            </button>
            <button
              className="cb-button cb-button--success"
              disabled={isSaving || !isEditable}
              onClick={() => void handlePublishCourse()}
            >
              <FiCheck /> Gửi duyệt
            </button>
          </div>
        </header>
      </div>

      {/* Workspace */}
      <div className="cb-workspace">
        {/* SIDEBAR */}
        <CourseBuilderSidebar
          modules={modules}
          activeView={activeView}
          isEditable={isEditable}
          isRevisionMode={isRevisionMode}
          baselineSnapshotModules={baselineSnapshotModules}
          collapsedModules={collapsedModules}
          onViewChange={setActiveView}
          onToggleCollapse={(moduleId) =>
            setCollapsedModules((prev) => ({
              ...prev,
              [moduleId]: !prev[moduleId],
            }))
          }
          onMoveModule={handleMoveModule}
          onMoveLesson={handleMoveLesson}
          onAddLesson={handleAddLesson}
          onAddModule={handleAddModule}
        />

        {/* MAIN CONTENT */}
        <div className="cb-main-content">
          {/* COURSE INFO */}
          {activeView.type === "course_info" && (
            <CourseInfoForm
              courseForm={courseForm}
              isRevisionMode={isRevisionMode}
              isEditable={isEditable}
              changedCourseInfoFields={changedCourseInfoFields}
              learningObjectives={learningObjectives}
              requirements={requirements}
              CATEGORIES={CATEGORIES}
              LEVELS={LEVELS}
              onUpdateCourseForm={updateCourseForm}
              onSetLearningObjectives={setLearningObjectives}
              onSetRequirements={setRequirements}
              onThumbnailChange={handleThumbnailChangeFromFile}
              onShowToast={showToast}
              onBlurOnWheel={blurOnWheel}
              thumbnailFile={thumbnailFile}
              onOpenThumbnailUpload={() => document.getElementById("thumbnail-upload")?.click()}
            />
          )}

          {/* MODULE EDITOR */}
          {activeView.type === "module" && (() => {
            const module = modules.find((m) => m.id === activeView.moduleId);
            if (!module) return <div className="cb-empty-state">Module không tồn tại</div>;
            const moduleIndex = modules.findIndex((m) => m.id === module.id);
            const moduleDiff =
              moduleIndex >= 0
                ? getModuleChangeInfo(module, moduleIndex, baselineSnapshotModules)
                : null;
            return (
              <ModuleEditorForm
                module={module}
                isRevisionMode={isRevisionMode}
                isNewModule={Boolean(moduleDiff?.info.isNew)}
                changedFields={moduleDiff?.info.changedFields || []}
                onModuleUpdate={(moduleId, update) =>
                  setModules((prev) =>
                    prev.map((m) =>
                      m.id === moduleId ? { ...m, ...update } : m,
                    ),
                  )
                }
                onModuleDelete={(moduleId) => {
                  setModules((prev) => prev.filter((m) => m.id !== moduleId));
                  setActiveView({ type: "course_info" });
                }}
                onBackToCourseInfo={() => setActiveView({ type: "course_info" })}
              />
            );
          })()}

          {/* LESSON EDITOR */}
          {activeView.type === "lesson" && (() => {
            const module = modules.find((m) => m.id === activeView.moduleId);
            const lesson = module?.lessons.find((l) => l.id === activeView.lessonId);
            if (!module || !lesson)
              return <div className="cb-empty-state">Bài học không tồn tại</div>;
            const lessonErrors = assignmentErrors[lesson.id];
            const moduleIndex = modules.findIndex((m) => m.id === module.id);
            const baselineModule =
              moduleIndex >= 0
                ? findMatchingModule(baselineSnapshotModules, module, moduleIndex)
                : undefined;
            const lessonIndex = module.lessons.findIndex((l) => l.id === lesson.id);
            const lessonDiff =
              lessonIndex >= 0
                ? getLessonChangeInfo(
                    lesson,
                    lessonIndex,
                    baselineModule?.lessons || [],
                  )
                : { isNew: false, changedFields: [] };
            return (
              <LessonEditorForm
                lesson={lesson}
                moduleId={module.id}
                isRevisionMode={isRevisionMode}
                isEditable={isEditable}
                lessonEditorTab={lessonEditor.activeTab}
                lessonErrors={lessonErrors}
                baselineModule={baselineModule}
                lessonDiff={lessonDiff}
                onUpdateLessonField={updateLessonField}
                onClearAssignmentError={clearAssignmentError}
                onLessonTypeSwitch={handleLessonTypeSwitch}
                onRemoveLesson={handleRemoveLesson}
                onSetLessonEditorTab={(tab) =>
                  setLessonEditor((prev) => ({ ...prev, activeTab: tab }))
                }
                onCreateDefaultQuestion={createDefaultQuestion}
                onValidateAssignmentScore={validateAssignmentScore}
                blurOnWheel={blurOnWheel}
                videoInputRef={videoInputRef}
                onVideoUpload={handleVideoUploadFromFile}
                fileInputRef={fileInputRef}
                onFileUpload={handleFileUploadFromFile}
                onOpenReadingLinkDialog={openReadingLinkDialog}
              />
            );
          })()}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="cb-confirm-overlay">
          <div className="cb-confirm-modal" role="dialog" aria-modal="true">
            <h3 className="cb-confirm-modal__title">{confirmDialog.title}</h3>
            <p className="cb-confirm-modal__message">{confirmDialog.message}</p>
            <div className="cb-confirm-modal__actions">
              <button
                className="cb-button cb-button--secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Hủy
              </button>
              <button
                className="cb-button cb-button--danger"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                {confirmDialog.confirmLabel || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      <RevisionHistoryModal
        isOpen={isRevisionHistoryModalOpen}
        revisionHistory={revisionHistory}
        activeRevision={activeRevision}
        courseTitle={
          state.courseForm.title ||
          state.currentCourse?.title ||
          "Khóa học"
        }
        onClose={() => setIsRevisionHistoryModalOpen(false)}
        onOpenRevision={handleOpenRevisionInEditor}
        onFormatDate={(date) =>
          date ? new Date(date).toLocaleString("vi-VN") : "—"
        }
        onGetStatusTone={(status) => {
          switch (status) {
            case "DRAFT": return "draft";
            case "PENDING": return "pending";
            case "APPROVED": return "approved";
            case "REJECTED": return "rejected";
            default: return "neutral";
          }
        }}
        onGetStatusLabel={(status) => {
          switch (status) {
            case "DRAFT": return "Bản nháp";
            case "PENDING": return "Chờ duyệt";
            case "APPROVED": return "Đã duyệt";
            case "REJECTED": return "Bị từ chối";
            default: return status || "N/A";
          }
        }}
      />

      {/* Reading Link Dialog */}
      {readingLinkDialog && (
        <div
          className="cb-modal-overlay"
          role="presentation"
          onClick={closeReadingLinkDialog}
        >
          <div
            className="cb-modal cb-reading-link-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Nhập link tài liệu bài đọc"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cb-reading-link-modal__badge">
              <FiLink />
              <span>Reading Resource Link</span>
            </div>

            <div className="cb-modal__header">
              <div>
                <h3>Nhập link tài liệu</h3>
                <p className="cb-reading-link-modal__subtitle">
                  Dùng link cho PDF, DOCX, hoặc trang tham khảo.
                </p>
              </div>
              <button
                className="cb-button cb-button--secondary cb-button--sm"
                onClick={closeReadingLinkDialog}
              >
                <FiX /> Đóng
              </button>
            </div>

            <div className="cb-form-group">
              <label className="cb-label">URL tài liệu</label>
              <input
                className="input cb-input cb-reading-link-modal__input"
                value={readingLinkDialog.value}
                onChange={(event) =>
                  setReadingLinkDialog((prev) =>
                    prev ? { ...prev, value: event.target.value } : prev,
                  )
                }
                placeholder="https://..."
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleReadingLinkDialogSave();
                  }
                }}
              />
              <small className="cb-help-text">
                Để trống rồi lưu nếu bạn muốn xóa link hiện tại.
              </small>
            </div>

            <div className="cb-modal__actions">
              <button
                className="cb-button cb-button--secondary"
                onClick={closeReadingLinkDialog}
              >
                Hủy
              </button>
              <button
                className="cb-button cb-button--primary"
                onClick={handleReadingLinkDialogSave}
              >
                Lưu link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
      />
      <input
        type="file"
        ref={videoInputRef}
        style={{ display: "none" }}
        onChange={handleVideoUpload}
        accept="video/mp4,video/webm,video/ogg"
      />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
        />
      )}
    </div>
  );
};

export default CourseCreationPage;