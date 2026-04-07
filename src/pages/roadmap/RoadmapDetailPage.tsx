import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import RoadmapDetailViewer from '../../components/roadmap/RoadmapDetailViewer';
import RoadmapNodeStudyPlanModal from '../../components/roadmap/RoadmapNodeStudyPlanModal';
import type { RoadmapNodeFocusPanelProps } from '../../components/roadmap/RoadmapNodeFocusPanel';
import aiRoadmapService from '../../services/aiRoadmapService';
import { enrollUser } from '../../services/enrollmentService';
import journeyService from '../../services/journeyService';
import { taskBoardService } from '../../services/taskBoardService';
import useRoadmapMappedCourses from '../../hooks/useRoadmapMappedCourses';
import useRoadmapCourseEnrollments from '../../hooks/useRoadmapCourseEnrollments';
import { buildNodeLearningContext } from '../../components/roadmap/nodeLearningContext';
import { buildCourseDetailPath, buildCourseLearningPath } from '../../utils/courseRoute';
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
import LoginRequiredModal from '../../components/auth/LoginRequiredModal';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import Toast from '../../components/shared/Toast';
import './RoadmapDetailPage.css';
import '../../styles/RoadmapHUD.css';

/**
 * Dedicated page for viewing roadmap details
 * Separated from main roadmap page for better performance
 */
const RoadmapDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { toast, isVisible, showError, showSuccess, showToast, hideToast } = useToast();

  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, QuestProgress>>(new Map());
  const [creatingTaskNodeId, setCreatingTaskNodeId] = useState<string | null>(null);
  const [planModalNode, setPlanModalNode] = useState<RoadmapNode | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [studyTaskNodeIds, setStudyTaskNodeIds] = useState<Set<string>>(new Set());
  const [nodePlanSummaryMap, setNodePlanSummaryMap] = useState<Record<string, NodeStudyPlanSummary>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [enrollmentRefreshKey, setEnrollmentRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const roadmapNodes = roadmap?.roadmap ?? [];
  const { courseMap } = useRoadmapMappedCourses(roadmapNodes, Boolean(roadmap));

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
      if (progress?.status !== ProgressStatus.COMPLETED) {
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
    });
  }, [selectedNode, roadmapNodes, courseMap, enrollmentByCourseId]);

  const canCreateStudyPlanForSelectedNode = useMemo(() => {
    if (!selectedNode) {
      return false;
    }
    if (studyTaskNodeIds.has(selectedNode.id)) {
      return false;
    }
    if (!eligibleNodeId) {
      return true;
    }
    return selectedNode.id === eligibleNodeId;
  }, [eligibleNodeId, selectedNode, studyTaskNodeIds]);

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
        const board = await taskBoardService.getBoard();
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
      const errorMessage = (loadError as Error).message;
      if (errorMessage.includes('not found') || errorMessage.includes('Roadmap not found')) {
        setError('Không tìm thấy lộ trình hoặc bạn không có quyền truy cập');
      } else {
        setError(errorMessage);
      }
      showError('Error', errorMessage);
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

    setPlanModalNode(node);
    setIsPlanModalOpen(true);
    setSelectedNodeId(null);
  }, [roadmap, eligibleNodeId, showError, studyTaskNodeIds, nodePlanSummaryMap, navigate]);

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

  const handleNavigateToCourse = useCallback(async (courseId: number) => {
    if (!user?.id) return;

    const existingEnrollment = enrollmentByCourseId[String(courseId)];
    if (existingEnrollment) {
      // Already enrolled — navigate to learning page
      const course = courseMap[String(courseId)];
      const path = course ? buildCourseLearningPath(course) : buildCourseDetailPath({ id: courseId });
      navigate(path);
      return;
    }

    // Not enrolled — enroll first, then navigate
    try {
      await enrollUser(courseId, user.id);
      // Bump refresh key so useRoadmapCourseEnrollments re-fetches enrollments
      setEnrollmentRefreshKey((k) => k + 1);
      showSuccess('Đã kích hoạt khóa học', 'Bạn đã được ghi danh vào khóa học. Hãy bắt đầu học ngay!');
      // After enroll, re-fetch enrollments so isEnrolled updates
      // Use a quick refetch by toggling the dependency (clear mappedCourseIds briefly then restore)
      const course = courseMap[String(courseId)];
      const path = course ? buildCourseLearningPath(course) : buildCourseDetailPath({ id: courseId });
      navigate(path);
    } catch (err) {
      showError('Không thể kích hoạt khóa học', (err as Error).message);
    }
  }, [user?.id, enrollmentByCourseId, courseMap, navigate, showSuccess, showError]);

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
  }, [creatingTaskNodeId]);

  const handleSubmitNodePlan = useCallback(async (request: RoadmapNodeStudyPlanRequest) => {
    if (!roadmap || !planModalNode) return;

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
    } catch (submitError) {
      showError('Không thể tạo task', (submitError as Error).message);
    } finally {
      setCreatingTaskNodeId(null);
    }
  }, [roadmap, planModalNode, showToast, showError, hideToast, navigate]);

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

  // Auto-switch panel to the next non-completed node when current node is completed
  useEffect(() => {
    if (!eligibleNodeId || eligibleNodeId === selectedNodeId) return;
    const currentProgress = progressMap.get(selectedNodeId ?? '');
    if (currentProgress?.status === ProgressStatus.COMPLETED) {
      setSelectedNodeId(eligibleNodeId);
    }
  }, [eligibleNodeId, selectedNodeId, progressMap]);

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
            isCreatingStudyTask: Boolean(
              creatingTaskNodeId
              && selectedNode
              && creatingTaskNodeId === selectedNode.id
            ),
            onClose: handleCloseNodePanel,
            onCreateStudyPlan: handleCreateStudyTask,
            onOpenStudyPlanner: handleOpenStudyPlannerForNode,
            onNavigateToCourse: handleNavigateToCourse,
          } as RoadmapNodeFocusPanelProps}
        />
        <MeowlGuide
          currentPage="roadmap"
          autoOpenChat
          panelMode="MODE_ROADMAP_OVERVIEW"
          panelTheme="cyan"
          panelAllowedModes={["MODE_ROADMAP_OVERVIEW", "MODE_COURSE_LEARNING", "MODE_GENERAL_FAQ"]}
          roadmapContext={selectedNode ? {
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
        childBranchTitles={planModalNode?.children
          ?.map((childId) => roadmap.roadmap.find((node) => node.id === childId)?.title)
          .filter((title): title is string => Boolean(title)) ?? []}
        isSubmitting={Boolean(creatingTaskNodeId)}
        onClose={handleClosePlanModal}
        onSubmit={handleSubmitNodePlan}
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
