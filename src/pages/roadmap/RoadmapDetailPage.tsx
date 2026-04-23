import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import RoadmapDetailViewer from '../../components/roadmap/RoadmapDetailViewer';
import RoadmapNodeStudyPlanModal from '../../components/roadmap/RoadmapNodeStudyPlanModal';
import type { RoadmapNodeFocusPanelProps } from '../../components/roadmap/RoadmapNodeFocusPanel';
import aiRoadmapService from '../../services/aiRoadmapService';
import journeyService from '../../services/journeyService';
import { taskBoardService } from '../../services/taskBoardService';
import useRoadmapMappedCourses from '../../hooks/useRoadmapMappedCourses';
import useRoadmapCourseEnrollments from '../../hooks/useRoadmapCourseEnrollments';
import useRoadmapMappedModules from '../../hooks/useRoadmapMappedModules';
import { buildNodeLearningContext } from '../../components/roadmap/nodeLearningContext';
import { buildCourseDetailPath } from '../../utils/courseRoute';
import {
  extractNodeStudyPlanSummaries,
  NodeStudyPlanSummary,
} from '../../components/roadmap/nodeStudyPlanSummary';
import {
  RoadmapResponse,
  QuestProgress,
  ProgressStatus,
  RoadmapNode,
  RoadmapNodeStudyPlanRequest,
  RoadmapNodeAvailability,
} from '../../types/Roadmap';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import usePremiumAccess from '../../hooks/usePremiumAccess';
import LoginRequiredModal from '../../components/auth/LoginRequiredModal';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import Toast from '../../components/shared/Toast';
import NodeVerificationGate from '../../components/journey/NodeVerificationGate';
import './RoadmapDetailPage.css';
import '../../styles/RoadmapHUD.css';

/**
 * Dedicated page for viewing roadmap details
 * Separated from main roadmap page for better performance
 */
const RoadmapDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // V3 Phase 1: caller (e.g. GSJJourneyPage) passes journeyId via navigate state
  // so node evidence + gate can target the right journey context.
  const journeyId = (location.state as { journeyId?: number } | null)?.journeyId;
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { hasStudentTierAccess } = usePremiumAccess();
  const { toast, isVisible, showError, showSuccess, showToast, hideToast } = useToast();
  const studentPlanLockMessage = 'Tính năng này yêu cầu gói Bạc (Sinh viên) trở lên.';

  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, QuestProgress>>(new Map());
  const [creatingTaskNodeId, setCreatingTaskNodeId] = useState<string | null>(null);
  const [planModalNode, setPlanModalNode] = useState<RoadmapNode | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [studyTaskNodeIds, setStudyTaskNodeIds] = useState<Set<string>>(new Set());
  const [nodePlanSummaryMap, setNodePlanSummaryMap] = useState<Record<string, NodeStudyPlanSummary>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const enrollmentRefreshKey = 0;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [aiPrefilledParams, setAiPrefilledParams] = useState<{
    deadline: string;
    intensity: "light" | "balanced" | "intensive";
    studyWindow: "morning" | "afternoon" | "evening" | "flexible";
    selectedDays: string[];
  } | null>(null);

  const roadmapNodes = roadmap?.roadmap ?? [];
  const { courseMap } = useRoadmapMappedCourses(roadmapNodes, Boolean(roadmap), enrollmentRefreshKey);

  const mappedCourseIds = useMemo(() => (
    Array.from(new Set(roadmapNodes.flatMap((node) => node.suggestedCourseIds ?? [])))
  ), [roadmapNodes]);

  const { enrollmentByCourseId } = useRoadmapCourseEnrollments(
    user?.id,
    mappedCourseIds,
    Boolean(user?.id) && mappedCourseIds.length > 0,
    enrollmentRefreshKey,
  );

  const eligibleNodeId = useMemo(() => {
    if (!roadmap || !Array.isArray(roadmap.roadmap)) {
      return null;
    }

    for (const node of roadmap.roadmap) {
      if (!node?.id) {
        continue;
      }
      const progress = progressMap.get(node.id);
      if (progress?.status === ProgressStatus.COMPLETED) {
        continue;
      }
      if (
        node.nodeStatus === RoadmapNodeAvailability.AVAILABLE
        || node.nodeStatus === RoadmapNodeAvailability.IN_PROGRESS
      ) {
        return node.id;
      }
    }

    return null;
  }, [roadmap, progressMap]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !roadmap) {
      return null;
    }

    return roadmap.roadmap.find((node) => node.id === selectedNodeId) ?? null;
  }, [roadmap, selectedNodeId]);

  // Phase 2: Extract suggested modules from already-loaded courses (no extra API calls)
  const { mappedModules } = useRoadmapMappedModules(courseMap, selectedNode);

  const selectedNodeProgress = useMemo(() => {
    if (!selectedNode) {
      return undefined;
    }
    return progressMap.get(selectedNode.id);
  }, [progressMap, selectedNode]);

  const selectedNodePlanSummary = useMemo(() => {
    if (!selectedNode) {
      return null;
    }

    return nodePlanSummaryMap[selectedNode.id] ?? null;
  }, [nodePlanSummaryMap, selectedNode]);

  const selectedNodeLearningContext = useMemo(() => {
    if (!selectedNode) {
      return null;
    }

    const parentNode = selectedNode.parentId
      ? roadmapNodes.find((node) => node.id === selectedNode.parentId) ?? null
      : null;
    const childNodes = roadmapNodes.filter((node) => selectedNode.children?.includes(node.id));
    const mappedCourses = (selectedNode.suggestedCourseIds ?? [])
      .map((courseId) => courseMap[String(courseId)])
      .filter((course): course is NonNullable<typeof course> => Boolean(course));

    const availability =
      (selectedNode.nodeStatus as RoadmapNodeAvailability | undefined) ??
      RoadmapNodeAvailability.AVAILABLE;

    return buildNodeLearningContext({
      node: selectedNode,
      availability,
      parentNode,
      childNodes,
      mappedCourses,
      enrollmentByCourseId,
      mappedModules,
    });
  }, [selectedNode, roadmapNodes, courseMap, enrollmentByCourseId, mappedModules]);

  const canCreateStudyPlanForSelectedNode = useMemo(() => {
    if (!selectedNode) {
      return false;
    }
    if (!hasStudentTierAccess) {
      return false;
    }
    if (selectedNode.nodeStatus === RoadmapNodeAvailability.LOCKED) {
      return false;
    }
    if (studyTaskNodeIds.has(selectedNode.id)) {
      return false;
    }
    return selectedNode.id === eligibleNodeId;
  }, [eligibleNodeId, hasStudentTierAccess, selectedNode, studyTaskNodeIds]);

  const linkedTaskIdForSelectedNode = selectedNodePlanSummary?.linkedTaskIds?.[0] ?? null;

  const loadRoadmap = useCallback(async () => {
    if (!id) {
      setError('Roadmap ID không hợp lệ');
      setIsLoading(false);
      return;
    }

    // Wait for auth rehydration to finish before deciding if user is logged in.
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lộ trình.');
      setShowLoginModal(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const roadmapData = await aiRoadmapService.getRoadmapById(parseInt(id, 10));
      setRoadmap(roadmapData);

      // Build progress map first so we can find the first non-completed node
      const nextProgressMap = new Map<string, QuestProgress>();
      if (roadmapData.progress) {
        Object.entries(roadmapData.progress).forEach(([questId, progress]) => {
          nextProgressMap.set(questId, {
            questId: progress.questId,
            status: progress.status as ProgressStatus,
            progress: progress.progress,
            completedAt: progress.completedAt
          });
        });
      }

      // Find first node that is NOT completed — use this for panel auto-open
      const firstNonCompletedNode = roadmapData.roadmap.find((node) => {
        if (!node?.id) return false;
        const progress = nextProgressMap.get(node.id);
        return progress?.status !== ProgressStatus.COMPLETED;
      });

      setSelectedNodeId((previous) => {
        if (previous && roadmapData.roadmap.some((node) => node.id === previous)) {
          return previous;
        }
        return firstNonCompletedNode?.id ?? roadmapData.roadmap[0]?.id ?? null;
      });

      setProgressMap(nextProgressMap);

      try {
        const board = await taskBoardService.getBoard(roadmapData.sessionId);
        const nodeSummaries = extractNodeStudyPlanSummaries(board, roadmapData.sessionId);
        setNodePlanSummaryMap(nodeSummaries);
        setStudyTaskNodeIds(new Set(Object.keys(nodeSummaries)));
      } catch (boardError) {
        console.warn('Failed to load linked study tasks for roadmap nodes:', boardError);
        setNodePlanSummaryMap({});
        setStudyTaskNodeIds(new Set());
      }
    } catch (loadError) {
      console.error('Failed to load roadmap:', loadError);
      const errorData = (loadError as any);
      const statusCode = errorData?.response?.status;
      const errorMessage = errorData?.response?.data?.message || (loadError as Error).message;

      if (statusCode === 403 || errorMessage.includes('tạm dừng') || errorMessage.includes('FORBIDDEN')) {
        setError('Roadmap đang tạm dừng. Hãy kích hoạt lại roadmap để tiếp tục học.');
        showError('Roadmap tạm dừng', 'Roadmap này đang tạm dừng. Hãy kích hoạt lại roadmap để tiếp tục học.');
      } else if (errorMessage.includes('not found') || errorMessage.includes('Roadmap not found')) {
        setError('Không tìm thấy lộ trình hoặc bạn không có quyền truy cập');
      } else {
        setError(errorMessage);
        showError('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, id, isAuthenticated, showError]);

  useEffect(() => {
    if (!authLoading) {
      loadRoadmap();
    }
  }, [authLoading, loadRoadmap]);

  useEffect(() => {
    if (isAuthenticated && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [isAuthenticated, showLoginModal]);

  // Listen for study plan intent from Meowl chat
  useEffect(() => {
    const handleStudyPlanIntent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || !roadmap) return;

      const { nodeId, suggestedParams } = detail;

      // Find the node in roadmap
      const node = roadmap.roadmap.find((n) => n.id === nodeId || n.title === nodeId);
      if (!node) {
        showError('Không tìm thấy node', 'Node này không tồn tại trong roadmap.');
        return;
      }

      // If node already has a study plan task, navigate to planner
      if (studyTaskNodeIds.has(node.id)) {
        const taskId = nodePlanSummaryMap[node.id]?.linkedTaskIds?.[0];
        const params = new URLSearchParams({
          source: 'roadmap-node',
          roadmapSessionId: String(roadmap.sessionId),
          nodeId: node.id,
          view: 'calendar',
        });
        if (taskId) params.set('taskId', taskId);
        navigate(`/study-planner?${params.toString()}`);
        return;
      }

      if (!hasStudentTierAccess) {
        showError('Yêu cầu gói Bạc', studentPlanLockMessage);
        return;
      }

      // Check eligible node constraint
      if (eligibleNodeId && node.id !== eligibleNodeId) {
        showError('Chưa thể tạo plan', 'Bạn cần hoàn thành node hiện tại trước khi mở plan node tiếp theo.');
        return;
      }

      // Open modal with AI-prefilled params
      setPlanModalNode(node);
      setAiPrefilledParams(suggestedParams);
      setIsPlanModalOpen(true);
    };

    window.addEventListener('meowl-study-plan-intent', handleStudyPlanIntent);
    return () => window.removeEventListener('meowl-study-plan-intent', handleStudyPlanIntent);
  }, [
    roadmap,
    studyTaskNodeIds,
    nodePlanSummaryMap,
    hasStudentTierAccess,
    eligibleNodeId,
    navigate,
    showError,
    studentPlanLockMessage,
  ]);

  const handleQuestComplete = useCallback(async (questId: string, completed: boolean) => {
    if (!roadmap) return;

    try {
      const response = await aiRoadmapService.updateQuestProgress(roadmap.sessionId, questId, completed);

      const nextProgress = new Map(progressMap);
      if (completed) {
        nextProgress.set(questId, {
          questId,
          status: ProgressStatus.COMPLETED,
          progress: 100,
          completedAt: new Date().toISOString()
        });
      } else {
        nextProgress.delete(questId);
      }
      setProgressMap(nextProgress);

      const { completedQuests, totalQuests, completionPercentage } = response.stats;
      if (completed) {
        showSuccess(
          'Hoàn thành',
          `${completedQuests}/${totalQuests} mục tiêu đã hoàn thành (${completionPercentage.toFixed(1)}%)`
        );
      } else {
        showSuccess(
          'Đã bỏ chọn',
          `${completedQuests}/${totalQuests} mục tiêu đã hoàn thành (${completionPercentage.toFixed(1)}%)`
        );
      }
    } catch (updateError) {
      showError('Error', (updateError as Error).message);
    }
  }, [roadmap, progressMap, showSuccess, showError]);

  const handleCreateStudyTask = useCallback((nodeId: string) => {
    if (!roadmap || !nodeId || !nodeId.trim()) return;

    const normalizedNodeId = nodeId.trim();
    const node = roadmap.roadmap.find((item) => item?.id === normalizedNodeId) ?? null;
    if (!node) {
      showError('Không tìm thấy node', 'Node này không tồn tại trong roadmap hiện tại.');
      return;
    }

    if (studyTaskNodeIds.has(normalizedNodeId)) {
      const taskId = nodePlanSummaryMap[normalizedNodeId]?.linkedTaskIds?.[0];
      const params = new URLSearchParams({
        source: 'roadmap-node',
        roadmapSessionId: String(roadmap.sessionId),
        nodeId: normalizedNodeId,
        view: 'calendar',
      });
      if (taskId) {
        params.set('taskId', taskId);
      }
      navigate(`/study-planner?${params.toString()}`);
      return;
    }

    if (eligibleNodeId && normalizedNodeId !== eligibleNodeId) {
      showError('Chưa thể tạo plan', 'Bạn cần hoàn thành node hiện tại trước khi mở plan node tiếp theo.');
      return;
    }

    if (!hasStudentTierAccess) {
      showError('Yêu cầu gói Bạc', studentPlanLockMessage);
      return;
    }

    setPlanModalNode(node);
    setIsPlanModalOpen(true);
    setSelectedNodeId(null);
  }, [
    roadmap,
    eligibleNodeId,
    hasStudentTierAccess,
    showError,
    studyTaskNodeIds,
    nodePlanSummaryMap,
    navigate,
    studentPlanLockMessage,
  ]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    if (!nodeId || !nodeId.trim()) {
      return;
    }
    const trimmed = nodeId.trim();
    setSelectedNodeId(trimmed);

    // Dispatch event so MeowlChatV2 can auto-select this node
    window.dispatchEvent(new CustomEvent("meowl-node-select", {
      detail: {
        roadmapId: roadmap?.sessionId,
        nodeId: trimmed,
        roadmapTitle: roadmap?.metadata?.title || roadmap?.overview?.purpose,
      },
    }));
  }, [roadmap]);

  const handleCloseNodePanel = useCallback(() => {
    if (creatingTaskNodeId) {
      return;
    }
    setSelectedNodeId(null);
  }, [creatingTaskNodeId]);

  const handleNavigateToCourse = useCallback((courseId: number) => {
    const course = courseMap[String(courseId)];
    const path = course ? buildCourseDetailPath(course) : buildCourseDetailPath({ id: courseId });

    navigate(path, {
      state: {
        fromPath: location.pathname,
        fromSearch: location.search,
        fromHash: location.hash,
        fromLabel: 'roadmap chi tiet',
        selectedNodeId,
        roadmapTitle: roadmap?.metadata?.title || roadmap?.overview?.purpose,
      },
    });
  }, [courseMap, location.hash, location.pathname, location.search, navigate, selectedNodeId]);

  const handleOpenStudyPlannerForNode = useCallback((nodeId: string, taskId?: string | null) => {
    if (!roadmap) {
      return;
    }

    const params = new URLSearchParams({
      source: 'roadmap-node',
      roadmapSessionId: String(roadmap.sessionId),
      nodeId,
      view: 'calendar',
    });

    if (taskId) {
      params.set('taskId', taskId);
    }

    navigate(`/study-planner?${params.toString()}`);
  }, [navigate, roadmap]);

  const handleClosePlanModal = useCallback(() => {
    if (creatingTaskNodeId) return;
    setIsPlanModalOpen(false);
    setPlanModalNode(null);
    setAiPrefilledParams(null);
  }, [creatingTaskNodeId]);

  const handleMarkNodeDone = useCallback(async (nodeId: string) => {
    if (!roadmap) return;

    // Step 1: Call atomic endpoint — success or failure only.
    // Any ApiException (sequential lock, invalid node, etc.) throws here.
    let result: Awaited<ReturnType<typeof aiRoadmapService.completeNode>>;
    try {
      result = await aiRoadmapService.completeNode(roadmap.sessionId, nodeId);
    } catch (err) {
      showError('Lỗi', (err as Error).message);
      return;
    }

    // Step 2: Show success immediately — BE committed or rolled back, state is consistent.
    showSuccess('Hoàn thành', result.message);

    // Step 3: Refresh state (non-critical — failures here don't affect data consistency)
    try {
      const updatedRoadmap = await aiRoadmapService.getRoadmapById(roadmap.sessionId);

      const nextProgressMap = new Map<string, QuestProgress>();
      if (updatedRoadmap.progress) {
        Object.entries(updatedRoadmap.progress).forEach(([questId, progress]) => {
          nextProgressMap.set(questId, {
            questId: progress.questId,
            status: progress.status as ProgressStatus,
            progress: progress.progress,
            completedAt: progress.completedAt,
          });
        });
      }
      setProgressMap(nextProgressMap);
      setRoadmap(updatedRoadmap);

      const board = await taskBoardService.getBoard(roadmap.sessionId);
      const summaries = extractNodeStudyPlanSummaries(board, roadmap.sessionId);
      setNodePlanSummaryMap(summaries);
    } catch {
      // non-critical: BE state is already consistent; refresh failure is purely cosmetic
    }

    setSelectedNodeId(null);
  }, [roadmap, showSuccess, showError]);

  const handleSubmitNodePlan = useCallback(async (request: RoadmapNodeStudyPlanRequest) => {
    if (!roadmap || !planModalNode) return;

    if (!hasStudentTierAccess) {
      showError('Yêu cầu gói Bạc', studentPlanLockMessage);
      return;
    }

    try {
      setCreatingTaskNodeId(planModalNode.id);
      const response = await journeyService.createStudyPlanForRoadmapNode(
        roadmap.sessionId,
        planModalNode.id,
        request
      );

      const created = Boolean((response as { created?: boolean })?.created);
      const taskCount = Number((response as { taskCount?: number })?.taskCount ?? 0);
      const message =
        (response as { message?: string })?.message || 'Đã liên kết roadmap node với Study Planner.';
      const responseMeta = response as {
        studyPlanId?: number | string;
        taskId?: number | string;
        boardTaskId?: number | string;
        id?: number | string;
      };
      const linkedTaskId =
        responseMeta.studyPlanId ??
        responseMeta.taskId ??
        responseMeta.boardTaskId ??
        responseMeta.id;
      const normalizedTaskId =
        linkedTaskId !== undefined && linkedTaskId !== null ? String(linkedTaskId) : '';
      const hasTaskPayload =
        taskCount > 0 ||
        Boolean((response as { task?: unknown }).task) ||
        (Array.isArray((response as { tasks?: unknown[] }).tasks) &&
          (response as { tasks?: unknown[] }).tasks!.length > 0);

      if (created || hasTaskPayload) {
        setStudyTaskNodeIds((previous) => {
          const next = new Set(previous);
          next.add(planModalNode.id);
          return next;
        });
        setNodePlanSummaryMap((previous) => {
          const existing = previous[planModalNode.id];
          const responseTasks = Array.isArray((response as { tasks?: Array<{ id?: string | number }> }).tasks)
            ? (response as { tasks?: Array<{ id?: string | number }> }).tasks ?? []
            : [];
          const taskIdsFromResponse = responseTasks
            .map((task) => task?.id)
            .filter((value): value is string | number => value !== null && value !== undefined)
            .map((value) => String(value));
          const linkedTaskIds = Array.from(new Set([
            ...(existing?.linkedTaskIds ?? []),
            ...taskIdsFromResponse,
            ...(normalizedTaskId ? [normalizedTaskId] : []),
          ]));

          return {
            ...previous,
            [planModalNode.id]: {
              nodeId: planModalNode.id,
              hasLinkedPlan: true,
              totalLinkedTasks: Math.max(taskCount, linkedTaskIds.length, existing?.totalLinkedTasks ?? 0, 1),
              completedLinkedTasks: existing?.completedLinkedTasks ?? 0,
              linkedTaskIds,
              isCompleted: existing?.isCompleted ?? false,
            },
          };
        });
      }

      showToast({
        type: 'success',
        title: created ? 'Đã tạo kế hoạch AI' : 'Task đã tồn tại',
        message: taskCount > 0 ? `${message} (${taskCount} task)` : message,
        autoCloseDelay: 10,
        showCountdown: true,
        countdownText: 'Tự đóng sau {countdown}s',
        actionButton: {
          text: 'Xem ngay',
          onClick: () => {
            hideToast();
            const params = new URLSearchParams({
              source: 'roadmap-node',
              roadmapSessionId: String(roadmap.sessionId),
              nodeId: planModalNode.id,
              view: 'calendar',
            });
            if (normalizedTaskId) {
              params.set('taskId', normalizedTaskId);
            }
            navigate(`/study-planner?${params.toString()}`);
          }
        }
      });

      setIsPlanModalOpen(false);
      setPlanModalNode(null);
      setAiPrefilledParams(null);
    } catch (submitError) {
      showError('Không thể tạo task', (submitError as Error).message);
    } finally {
      setCreatingTaskNodeId(null);
    }
  }, [
    roadmap,
    planModalNode,
    hasStudentTierAccess,
    showToast,
    showError,
    hideToast,
    navigate,
    studentPlanLockMessage,
  ]);

  const handleBack = useCallback(() => {
    navigate('/roadmap');
  }, [navigate]);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!(footer instanceof HTMLElement)) {
      return;
    }

    const previousDisplay = footer.style.display;
    footer.style.display = 'none';

    return () => {
      footer.style.display = previousDisplay;
    };
  }, []);

  // Auto-switch panel to the next non-completed node removed as it was too aggressive
  // and prevented viewing completed nodes. handleMarkNodeDone already handles panel closing.
  /*
  useEffect(() => {
    if (!eligibleNodeId || eligibleNodeId === selectedNodeId) return;
    const currentProgress = progressMap.get(selectedNodeId ?? '');
    if (currentProgress?.status === ProgressStatus.COMPLETED) {
      setSelectedNodeId(eligibleNodeId);
    }
  }, [eligibleNodeId, selectedNodeId, progressMap]);
  */

  if (authLoading || isLoading) {
    return (
      <div className="roadmap-detail-page">
        <div className="roadmap-detail-page__loading">
          <MeowlKuruLoader text="Đang tải lộ trình..." />
        </div>
        <MeowlGuide
          currentPage="roadmap"
          autoOpenChat
          panelMode="MODE_ROADMAP_OVERVIEW"
          panelTheme="cyan"
          panelAllowedModes={["MODE_ROADMAP_OVERVIEW", "MODE_COURSE_LEARNING", "MODE_GENERAL_FAQ"]}
          roadmapContext={undefined}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="roadmap-detail-page">
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Đăng nhập để xem chi tiết roadmap"
          message="Bạn cần đăng nhập để truy cập dữ liệu roadmap cá nhân"
          feature="Roadmap Detail"
        />
        <div className="roadmap-detail-page__error">
          <h2>Yêu cầu đăng nhập</h2>
          <p>Vui lòng đăng nhập để mở chi tiết lộ trình này.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleBack} className="roadmap-detail-page__back-btn">
              Quay lại danh sách
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="roadmap-detail-page__back-btn"
              style={{ background: 'var(--hud-accent)', color: '#03121a', borderColor: 'var(--hud-accent)' }}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
        <MeowlGuide currentPage="roadmap" autoOpenChat />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="roadmap-detail-page">
        <div className="roadmap-detail-page__error">
          <h2>Không thể tải lộ trình</h2>
          <p>{error || 'Lộ trình không tồn tại hoặc đã bị xóa.'}</p>
          <button onClick={handleBack} className="roadmap-detail-page__back-btn">
            Quay lại danh sách
          </button>
        </div>
        <MeowlGuide
          currentPage="roadmap"
          autoOpenChat
          panelMode="MODE_ROADMAP_OVERVIEW"
          panelTheme="cyan"
          panelAllowedModes={["MODE_ROADMAP_OVERVIEW", "MODE_COURSE_LEARNING", "MODE_GENERAL_FAQ"]}
          roadmapContext={undefined}
        />
      </div>
    );
  }

  return (
    <div className="roadmap-hud-container">
      <div className="cosmic-dust">
        {[...Array(40)].map((_, index) => (
          <div
            key={index}
            className="dust-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${20 + Math.random() * 15}s`
            }}
          />
        ))}
      </div>

      <div className="roadmap-hud-starmap">
        {journeyId != null && (
          <div style={{ marginBottom: 16 }}>
            <NodeVerificationGate journeyId={journeyId} />
          </div>
        )}
        <RoadmapDetailViewer
          roadmap={roadmap}
          progressMap={progressMap}
          onBack={handleBack}
          onQuestComplete={handleQuestComplete}
          onCreateStudyTask={handleCreateStudyTask}
          creatingTaskNodeId={creatingTaskNodeId}
          eligibleNodeId={eligibleNodeId}
          studyTaskNodeIds={studyTaskNodeIds}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          nodeFocusPanel={{
            isOpen: Boolean(selectedNode),
            node: selectedNode,
            progress: selectedNodeProgress,
            learningContext: selectedNodeLearningContext,
            primaryCourseId: selectedNodeLearningContext?.primaryCourse?.id,
            isEnrolled:
              selectedNodeLearningContext?.primaryCourse != null
              && Boolean(enrollmentByCourseId[String(selectedNodeLearningContext.primaryCourse.id)]),
            hasStudyTask: Boolean(selectedNodePlanSummary?.hasLinkedPlan),
            linkedTaskId: linkedTaskIdForSelectedNode,
            canCreateStudyTask: canCreateStudyPlanForSelectedNode,
            studyPlanLockedReason: hasStudentTierAccess
              ? null
              : studentPlanLockMessage,
            isCreatingStudyTask: Boolean(
              creatingTaskNodeId
              && selectedNode
              && creatingTaskNodeId === selectedNode.id
            ),
            onClose: handleCloseNodePanel,
            onCreateStudyPlan: handleCreateStudyTask,
            onOpenStudyPlanner: handleOpenStudyPlannerForNode,
            onNavigateToCourse: handleNavigateToCourse,
            allNodes: roadmapNodes,
            onMarkNodeDone: handleMarkNodeDone,
            linkedTaskCount: selectedNodePlanSummary?.totalLinkedTasks ?? 0,
            journeyId,
          } as RoadmapNodeFocusPanelProps}
        />
        <MeowlGuide
          currentPage="roadmap"
          autoOpenChat
          panelMode="MODE_ROADMAP_OVERVIEW"
          panelTheme="cyan"
          panelAllowedModes={["MODE_ROADMAP_OVERVIEW", "MODE_COURSE_LEARNING", "MODE_GENERAL_FAQ"]}
          roadmapContext={selectedNode ? {
            roadmapId: roadmap.sessionId,
            roadmapTitle: roadmap?.metadata?.title || roadmap?.overview?.purpose || 'Lộ trình học tập',
            nodeTitle: selectedNode.title,
            nodeDescription: selectedNode.description || undefined,
            learningObjectives: selectedNode.learningObjectives?.filter(Boolean) || [],
            keyConcepts: selectedNode.keyConcepts?.filter(Boolean) || [],
          } : undefined}
        />
      </div>

      <RoadmapNodeStudyPlanModal
        isOpen={isPlanModalOpen}
        node={planModalNode}
        learningContext={selectedNode && planModalNode && selectedNode.id === planModalNode.id ? selectedNodeLearningContext : undefined}
        roadmapMode={roadmap?.metadata?.roadmapMode}
        isSubmitting={Boolean(creatingTaskNodeId)}
        onClose={handleClosePlanModal}
        onSubmit={handleSubmitNodePlan}
        aiPrefilledParams={aiPrefilledParams}
      />

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
          secondaryActionButton={toast.secondaryActionButton}
        />
      )}
    </div>
  );
};

export default RoadmapDetailPage;
