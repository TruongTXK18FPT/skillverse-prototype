import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import RoadmapDetailViewer from '../../components/roadmap/RoadmapDetailViewer';
import RoadmapNodeStudyPlanModal from '../../components/roadmap/RoadmapNodeStudyPlanModal';
import aiRoadmapService from '../../services/aiRoadmapService';
import journeyService from '../../services/journeyService';
import { taskBoardService } from '../../services/taskBoardService';
import {
  RoadmapResponse,
  QuestProgress,
  ProgressStatus,
  RoadmapNode,
  RoadmapNodeStudyPlanRequest
} from '../../types/Roadmap';
import { TaskColumnResponse } from '../../types/TaskBoard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import Toast from '../../components/shared/Toast';
import './RoadmapDetailPage.css';
import '../../styles/RoadmapHUD.css';

/**
 * Dedicated page for viewing roadmap details
 * Separated from main roadmap page for better performance
 */
const ROADMAP_NODE_LINK_PATTERN = /\[ROADMAP_NODE_LINK\]\s+journey=\d+\s+roadmap=(\d+)\s+node=([^\s]+)/gi;

const extractLinkedNodeIds = (
  board: TaskColumnResponse[],
  roadmapSessionId: number
): Set<string> => {
  const linkedNodeIds = new Set<string>();

  if (!Number.isFinite(roadmapSessionId)) {
    return linkedNodeIds;
  }

  board.forEach((column) => {
    column.tasks?.forEach((task) => {
      if (!task.userNotes) {
        return;
      }

      const linkRegex = new RegExp(ROADMAP_NODE_LINK_PATTERN);
      for (const match of task.userNotes.matchAll(linkRegex)) {
        const matchedRoadmapId = Number(match[1]);
        const matchedNodeId = match[2]?.trim();
        if (matchedRoadmapId === roadmapSessionId && matchedNodeId) {
          linkedNodeIds.add(matchedNodeId);
        }
      }
    });
  });

  return linkedNodeIds;
};

const RoadmapDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast, isVisible, showError, showSuccess, showToast, hideToast } = useToast();

  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, QuestProgress>>(new Map());
  const [creatingTaskNodeId, setCreatingTaskNodeId] = useState<string | null>(null);
  const [planModalNode, setPlanModalNode] = useState<RoadmapNode | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [studyTaskNodeIds, setStudyTaskNodeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadRoadmap = useCallback(async () => {
    if (!id) {
      setError('Roadmap ID không hợp lệ');
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lộ trình.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const roadmapData = await aiRoadmapService.getRoadmapById(parseInt(id, 10));
      setRoadmap(roadmapData);

      if (roadmapData.progress) {
        const nextProgressMap = new Map<string, QuestProgress>();
        Object.entries(roadmapData.progress).forEach(([questId, progress]) => {
          nextProgressMap.set(questId, {
            questId: progress.questId,
            status: progress.status as ProgressStatus,
            progress: progress.progress,
            completedAt: progress.completedAt
          });
        });
        setProgressMap(nextProgressMap);
      } else {
        setProgressMap(new Map());
      }

      try {
        const board = await taskBoardService.getBoard();
        setStudyTaskNodeIds(extractLinkedNodeIds(board, roadmapData.sessionId));
      } catch (boardError) {
        console.warn('Failed to load linked study tasks for roadmap nodes:', boardError);
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
  }, [id, isAuthenticated, navigate, showError]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

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
      showToast({
        type: 'info',
        title: 'Node đã có task Study Planner',
        message: `Node "${node.title}" đã được tạo kế hoạch học tập trước đó. Bạn có thể mở Study Planner để xem và cập nhật.`,
        autoCloseDelay: 10,
        showCountdown: true,
        countdownText: 'Tự đóng sau {countdown}s',
        actionButton: {
          text: 'Mở Study Planner',
          onClick: () => {
            hideToast();
            const params = new URLSearchParams({
              source: 'roadmap-node',
              roadmapSessionId: String(roadmap.sessionId),
              nodeId: normalizedNodeId
            });
            navigate(`/study-planner?${params.toString()}`);
          }
        }
      });
      return;
    }

    if (eligibleNodeId && normalizedNodeId !== eligibleNodeId) {
      showError('Chưa thể tạo plan', 'Bạn cần hoàn thành node hiện tại trước khi mở plan node tiếp theo.');
      return;
    }

    setPlanModalNode(node);
    setIsPlanModalOpen(true);
  }, [roadmap, eligibleNodeId, showError, studyTaskNodeIds, showToast, hideToast, navigate]);

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
              nodeId: planModalNode.id
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
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lộ trình.');
      setTimeout(() => navigate('/login'), 1500);
    }
  }, [isAuthenticated, navigate, showError]);

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

  if (isLoading) {
    return (
      <div className="roadmap-detail-page">
        <div className="roadmap-detail-page__loading">
          <MeowlKuruLoader text="Đang tải lộ trình..." />
        </div>
        <MeowlGuide currentPage="roadmap" />
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
        <MeowlGuide currentPage="roadmap" />
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
        />
        <MeowlGuide currentPage="roadmap" />
      </div>

      <RoadmapNodeStudyPlanModal
        isOpen={isPlanModalOpen}
        node={planModalNode}
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
        />
      )}
    </div>
  );
};

export default RoadmapDetailPage;
