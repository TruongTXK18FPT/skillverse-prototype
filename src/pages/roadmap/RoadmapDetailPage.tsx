import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import RoadmapDetailViewer from '../../components/roadmap/RoadmapDetailViewer';
import aiRoadmapService from '../../services/aiRoadmapService';
import journeyService from '../../services/journeyService';
import { 
  RoadmapResponse, 
  QuestProgress, 
  ProgressStatus 
} from '../../types/Roadmap';
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
const RoadmapDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast, isVisible, showError, showSuccess, hideToast } = useToast();
  
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, QuestProgress>>(new Map());
  const [creatingTaskNodeId, setCreatingTaskNodeId] = useState<string | null>(null);
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

  // Load roadmap data - Simple approach, rely on backend security
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
      
      // Backend sẽ tự động kiểm tra quyền truy cập
      const roadmapData = await aiRoadmapService.getRoadmapById(parseInt(id));
      setRoadmap(roadmapData);
      
      // Load progress data from backend response
      if (roadmapData.progress) {
        const progressMap = new Map<string, QuestProgress>();
        Object.entries(roadmapData.progress).forEach(([questId, progress]) => {
          progressMap.set(questId, {
            questId: progress.questId,
            status: progress.status as ProgressStatus,
            progress: progress.progress,
            completedAt: progress.completedAt
          });
        });
        setProgressMap(progressMap);
      } else {
        setProgressMap(new Map());
      }
    } catch (error) {
      console.error('Failed to load roadmap:', error);
      const errorMessage = (error as Error).message;
      
      // Backend sẽ trả về lỗi phù hợp nếu không có quyền truy cập
      if (errorMessage.includes('not found') || errorMessage.includes('Roadmap not found')) {
        setError('Không tìm thấy lộ trình hoặc bạn không có quyền truy cập');
      } else {
        setError(errorMessage);
      }
      
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, showError]);

  // Load roadmap on mount
  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  // Handle quest completion
  const handleQuestComplete = useCallback(async (questId: string, completed: boolean) => {
    if (!roadmap) return;
    
    try {
      // Update backend first
      const response = await aiRoadmapService.updateQuestProgress(
        roadmap.sessionId, 
        questId, 
        completed
      );

      // Update local state with new progress
      const newProgress = new Map(progressMap);
      if (completed) {
        newProgress.set(questId, {
          questId,
          status: ProgressStatus.COMPLETED,
          progress: 100,
          completedAt: new Date().toISOString()
        });
      } else {
        newProgress.delete(questId);
      }
      setProgressMap(newProgress);

      // Show progress stats
      const { completedQuests, totalQuests, completionPercentage } = response.stats;
      if (completed) {
        showSuccess(
          'Hoàn thành! 🎉', 
          `${completedQuests}/${totalQuests} mục tiêu hoàn thành (${completionPercentage.toFixed(1)}%)`
        );
      } else {
        showSuccess(
          'Đã bỏ chọn', 
          `${completedQuests}/${totalQuests} mục tiêu hoàn thành (${completionPercentage.toFixed(1)}%)`
        );
      }
    } catch (error) {
      showError('Error', (error as Error).message);
    }
  }, [roadmap, progressMap, showSuccess, showError]);

  const handleCreateStudyTask = useCallback(async (nodeId: string) => {
    if (!roadmap || !nodeId || !nodeId.trim()) return;
    if (eligibleNodeId && nodeId !== eligibleNodeId) {
      showError('Chưa thể tạo plan', 'Bạn cần hoàn thành node hiện tại trước khi mở plan node tiếp theo.');
      return;
    }

    try {
      setCreatingTaskNodeId(nodeId);
      const response = await journeyService.createStudyPlanForRoadmapNode(roadmap.sessionId, nodeId);
      const created = Boolean((response as { created?: boolean })?.created);
      const message = (response as { message?: string })?.message || 'Đã liên kết node roadmap với Study Planner.';

      if (created) {
        showSuccess('Đã tạo task học tập', message);
      } else {
        showSuccess('Task đã tồn tại', message);
      }
    } catch (err) {
      showError('Không thể tạo task', (err as Error).message);
    } finally {
      setCreatingTaskNodeId(null);
    }
  }, [roadmap, eligibleNodeId, showSuccess, showError]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/roadmap');
  }, [navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lộ trình.');
      setTimeout(() => navigate('/login'), 1500);
    }
  }, [isAuthenticated, navigate, showError]);

  // Loading state
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

  // Error state
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

  // Main content
  return (
    <div className="roadmap-hud-container">
      {/* Cosmic dust particles - Same as main roadmap page */}
      <div className="cosmic-dust">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
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
        />
        
        <MeowlGuide currentPage="roadmap" />
      </div>
      
      {/* Toast Notification */}
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
