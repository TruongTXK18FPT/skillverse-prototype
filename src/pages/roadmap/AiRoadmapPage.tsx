import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Plus, Search, Grid3x3, List, Filter } from 'lucide-react';
import { RoadmapGeneratorForm } from '../../components/ai-roadmap';
import { RoadmapList } from '../../components/roadmap';
import aiRoadmapService from '../../services/aiRoadmapService';
import {
  RoadmapSessionSummary,
  RoadmapStatusCounts,
  GenerateRoadmapRequest
} from '../../types/Roadmap';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import Toast from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import LoginRequiredModal from '../../components/auth/LoginRequiredModal';
import { useNavigate } from 'react-router-dom';
import '../../styles/RoadmapPage.css';
import '../../styles/AiRoadmap.css';
import '../../styles/RoadmapHUD.css';

type ViewMode = 'list' | 'generate';
type DisplayMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'progress' | 'title';
type RoadmapLifecycleStatus = 'ACTIVE' | 'PAUSED' | 'DELETED';
type RoadmapListScope = 'learning' | 'deleted';

const normalizeRoadmapStatus = (status?: string): RoadmapLifecycleStatus => {
  const normalized = (status || 'ACTIVE').trim().toUpperCase();
  if (normalized === 'PAUSED' || normalized === 'DELETED') {
    return normalized;
  }
  return 'ACTIVE';
};

const INITIAL_STATUS_COUNTS: RoadmapStatusCounts = {
  active: 0,
  paused: 0,
  deleted: 0,
  total: 0,
};

const AiRoadmapPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [learningRoadmapSource, setLearningRoadmapSource] = useState<RoadmapSessionSummary[]>([]);
  const [deletedRoadmapSource, setDeletedRoadmapSource] = useState<RoadmapSessionSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState<RoadmapStatusCounts>(INITIAL_STATUS_COUNTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDeletedList, setIsLoadingDeletedList] = useState(false);
  const [activeListScope, setActiveListScope] = useState<RoadmapListScope>('learning');
  const [hasLoadedDeletedRoadmaps, setHasLoadedDeletedRoadmaps] = useState(false);
  const { toast, isVisible, showError, showSuccess, showToast, hideToast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Phase 4: List view enhancements
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterExperience, setFilterExperience] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const learningRoadmapSourceRef = useRef<RoadmapSessionSummary[]>([]);
  const deletedRoadmapSourceRef = useRef<RoadmapSessionSummary[]>([]);

  useEffect(() => {
    learningRoadmapSourceRef.current = learningRoadmapSource;
  }, [learningRoadmapSource]);

  useEffect(() => {
    deletedRoadmapSourceRef.current = deletedRoadmapSource;
  }, [deletedRoadmapSource]);

  const buildFallbackStatusCounts = useCallback((
    learningList: RoadmapSessionSummary[],
    deletedCountHint = 0,
  ): RoadmapStatusCounts => {
    const active = learningList.filter((item) => normalizeRoadmapStatus(item.status) === 'ACTIVE').length;
    const paused = learningList.filter((item) => normalizeRoadmapStatus(item.status) === 'PAUSED').length;
    const deleted = Math.max(0, deletedCountHint);
    return {
      active,
      paused,
      deleted,
      total: active + paused + deleted,
    };
  }, []);

  const refreshStatusCounts = useCallback(async (
    learningListFallback?: RoadmapSessionSummary[],
    deletedCountHint?: number,
  ) => {
    try {
      const counts = await aiRoadmapService.getUserRoadmapStatusCounts();
      setStatusCounts(counts);
      return counts;
    } catch {
      if (learningListFallback) {
        const fallbackCounts = buildFallbackStatusCounts(learningListFallback, deletedCountHint ?? 0);
        setStatusCounts(fallbackCounts);
        return fallbackCounts;
      }

      setStatusCounts((previous) => {
        const fallbackCounts = buildFallbackStatusCounts(
          learningRoadmapSourceRef.current,
          deletedCountHint ?? previous.deleted,
        );
        return fallbackCounts;
      });
      return null;
    }
  }, [buildFallbackStatusCounts]);

  const loadLearningRoadmaps = useCallback(async () => {
    if (!isAuthenticated) {
      setLearningRoadmapSource([]);
      setDeletedRoadmapSource([]);
      setStatusCounts(INITIAL_STATUS_COUNTS);
      setIsLoadingList(false);
      setIsLoadingDeletedList(false);
      setHasLoadedDeletedRoadmaps(false);
      return;
    }

    try {
      setIsLoadingList(true);
      const data = await aiRoadmapService.getUserRoadmaps(false);
      const normalizedLearningRoadmaps = data.filter(
        (roadmap) => normalizeRoadmapStatus(roadmap.status) !== 'DELETED',
      );
      setLearningRoadmapSource(normalizedLearningRoadmaps);

      const deletedHint = hasLoadedDeletedRoadmaps ? deletedRoadmapSource.length : 0;
      await refreshStatusCounts(normalizedLearningRoadmaps, deletedHint);
    } catch (error) {
      showError('Lỗi', (error as Error).message);
    } finally {
      setIsLoadingList(false);
    }
  }, [
    deletedRoadmapSource.length,
    hasLoadedDeletedRoadmaps,
    isAuthenticated,
    refreshStatusCounts,
    showError,
  ]);

  const loadDeletedRoadmaps = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      return;
    }

    if (!force && hasLoadedDeletedRoadmaps) {
      return;
    }

    try {
      setIsLoadingDeletedList(true);
      const data = await aiRoadmapService.getUserDeletedRoadmaps();
      const normalizedDeletedRoadmaps = data.filter(
        (roadmap) => normalizeRoadmapStatus(roadmap.status) === 'DELETED',
      );
      setDeletedRoadmapSource(normalizedDeletedRoadmaps);
      setHasLoadedDeletedRoadmaps(true);
      await refreshStatusCounts(learningRoadmapSourceRef.current, normalizedDeletedRoadmaps.length);
    } catch (error) {
      showError('Lỗi', (error as Error).message);
    } finally {
      setIsLoadingDeletedList(false);
    }
  }, [
    hasLoadedDeletedRoadmaps,
    isAuthenticated,
    refreshStatusCounts,
    showError,
  ]);

  useEffect(() => {
    void loadLearningRoadmaps();
  }, [loadLearningRoadmaps]);

  const handleCreateRoadmap = () => {
    setViewMode('generate');
  };

  const handleGenerate = async (request: GenerateRoadmapRequest) => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để tạo lộ trình học tập.');
      setShowLoginModal(true);
      return;
    }

    try {
      setIsLoading(true);

      const apiRequest: GenerateRoadmapRequest = {
        ...request,
        aiAgentMode: request.aiAgentMode === 'DEEP_RESEARCH'
          ? 'deep-research-pro-preview-12-2025'
          : request.aiAgentMode
      };

      const roadmap = await aiRoadmapService.generateRoadmap(apiRequest);
      showSuccess('Thành công', 'Lộ trình đã được tạo!');
      navigate(`/roadmap/${roadmap.sessionId}`);
      await loadLearningRoadmaps();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi không xác định.';
      const status = error?.response?.status;

      if (status === 403 && request.aiAgentMode === 'DEEP_RESEARCH') {
        showError(
          'Yêu cầu Premium Plus',
          'Chế độ Nghiên cứu sâu chỉ dành cho gói Mentor Pro. Hệ thống sẽ tự động chuyển về chế độ Tiêu chuẩn.',
          6
        );

        try {
          const retryRequest = { ...request, aiAgentMode: 'NORMAL' as const };
          const roadmap = await aiRoadmapService.generateRoadmap(retryRequest);
          showSuccess('Thành công', 'Lộ trình đã được tạo (Chế độ Thường)!');
          navigate(`/roadmap/${roadmap.sessionId}`);
          await loadLearningRoadmaps();
          return;
        } catch (retryError: any) {
          console.error('Retry failed:', retryError);
        }
      }

      if (errorMessage.includes('Mục tiêu không hợp lệ') ||
          errorMessage.includes('không liên quan đến học tập') ||
          errorMessage.includes('không hợp lý')) {
        showError(
          '❌ Mục tiêu không hợp lệ',
          'Mục tiêu của bạn không liên quan đến học tập hoặc phát triển kỹ năng. Vui lòng nhập một mục tiêu học tập cụ thể như "Học Python", "Trở thành Data Scientist", "Học tiếng Anh IELTS 7.0", v.v.',
          12
        );
      } else if (errorMessage.includes('quá dài') || errorMessage.includes('quá ngắn')) {
        showError('⚠️ Độ dài không hợp lệ', errorMessage, 8);
      } else if (errorMessage.includes('chứa từ ngữ không phù hợp')) {
        showError('🚫 Nội dung không phù hợp', 'Mục tiêu chứa từ ngữ không phù hợp. Vui lòng nhập lại với nội dung tích cực.', 8);
      } else {
        showError('❌ Lỗi tạo lộ trình', errorMessage, 8);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoadmap = (sessionId: number) => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lộ trình.');
      setShowLoginModal(true);
      return;
    }
    navigate(`/roadmap/${sessionId}`);
  };

  const handleNavigateRoadmap = (sessionId: number, status: RoadmapLifecycleStatus): boolean => {
    if (status === 'PAUSED') {
      showError('Roadmap đang tạm dừng', 'Hãy kích hoạt lại roadmap để tiếp tục học.');
      return false;
    }
    return true;
  };

  /**
   * Generic roadmap action runner with optimistic update support.
   * @param sessionId - Roadmap session ID
   * @param action - Async function to call (API call)
   * @param successTitle - Toast title on success
   * @param successMessage - Toast message on success
   * @param optimisticUpdate - Optional function to apply optimistic state change before API call
   * @param rollbackUpdate - Optional function to rollback optimistic change on failure
   */
  const runRoadmapAction = useCallback(async (
    sessionId: number,
    action: () => Promise<void>,
    successTitle: string,
    successMessage: string,
    optimisticUpdate?: () => void,
    rollbackUpdate?: () => void,
  ) => {
    if (actionLoadingId !== null) {
      return;
    }

    try {
      setActionLoadingId(sessionId);
      if (optimisticUpdate) {
        optimisticUpdate();
      }
      await action();
      showSuccess(successTitle, successMessage, 4);
      await loadLearningRoadmaps();
      if (hasLoadedDeletedRoadmaps) {
        await loadDeletedRoadmaps(true);
      }
    } catch (error) {
      if (rollbackUpdate) {
        rollbackUpdate();
      }
      showError('Không thể cập nhật trạng thái roadmap', (error as Error).message);
    } finally {
      setActionLoadingId(null);
    }
  }, [actionLoadingId, hasLoadedDeletedRoadmaps, loadDeletedRoadmaps, loadLearningRoadmaps, showError, showSuccess]);

  const handleActivateRoadmap = useCallback(async (sessionId: number) => {
    const roadmap = learningRoadmapSourceRef.current.find((r) => r.sessionId === sessionId);
    if (!roadmap) return;

    await runRoadmapAction(
      sessionId,
      () => aiRoadmapService.activateRoadmap(sessionId),
      'Đã kích hoạt roadmap',
      'Roadmap này đã chuyển sang ACTIVE. Các roadmap ACTIVE khác sẽ tự động chuyển PAUSED.',
      // Optimistic: mark this as ACTIVE, others as PAUSED
      () => {
        setLearningRoadmapSource((current) =>
          current.map((r) =>
            r.sessionId === sessionId
              ? { ...r, status: 'ACTIVE' }
              : { ...r, status: 'PAUSED' }
          )
        );
        setStatusCounts((prev) => ({
          ...prev,
          active: prev.active + 1,
          paused: Math.max(0, prev.paused - 1),
        }));
      },
      // Rollback
      () => {
        setLearningRoadmapSource((current) =>
          current.map((r) =>
            r.sessionId === sessionId ? { ...r, status: roadmap.status } : r
          )
        );
        const oldStatus = normalizeRoadmapStatus(roadmap.status);
        setStatusCounts((prev) => ({
          ...prev,
          active: oldStatus === 'ACTIVE' ? prev.active + 1 : prev.active,
          paused: oldStatus === 'PAUSED' ? prev.paused + 1 : prev.paused,
        }));
      },
    );
  }, [runRoadmapAction]);

  const handlePauseRoadmap = useCallback(async (sessionId: number) => {
    const roadmap = learningRoadmapSourceRef.current.find((r) => r.sessionId === sessionId);
    if (!roadmap) return;

    await runRoadmapAction(
      sessionId,
      () => aiRoadmapService.pauseRoadmap(sessionId),
      'Đã tạm dừng roadmap',
      'Bạn có thể kích hoạt lại roadmap này bất kỳ lúc nào.',
      // Optimistic: mark as PAUSED
      () => {
        setLearningRoadmapSource((current) =>
          current.map((r) =>
            r.sessionId === sessionId ? { ...r, status: 'PAUSED' } : r
          )
        );
        setStatusCounts((prev) => ({
          ...prev,
          active: Math.max(0, prev.active - 1),
          paused: prev.paused + 1,
        }));
      },
      // Rollback
      () => {
        setLearningRoadmapSource((current) =>
          current.map((r) =>
            r.sessionId === sessionId ? { ...r, status: roadmap.status } : r
          )
        );
        const oldStatus = normalizeRoadmapStatus(roadmap.status);
        setStatusCounts((prev) => ({
          ...prev,
          active: oldStatus === 'ACTIVE' ? prev.active + 1 : prev.active,
          paused: oldStatus === 'PAUSED' ? prev.paused + 1 : prev.paused,
        }));
      },
    );
  }, [runRoadmapAction]);

  const handleDeleteRoadmap = useCallback((sessionId: number) => {
    if (actionLoadingId !== null) {
      return;
    }

    const roadmap = learningRoadmapSourceRef.current.find((r) => r.sessionId === sessionId);
    if (!roadmap) return;

    showToast({
      type: 'warning',
      title: 'Xóa roadmap?',
      message: 'Roadmap sẽ chuyển sang danh sách đã xóa. Bạn vẫn có thể xóa vĩnh viễn ở danh sách đã xóa.',
      autoCloseDelay: 10,
      showCountdown: false,
      actionButton: {
        text: 'Xóa',
        onClick: async () => {
          hideToast();

          // Optimistic update: remove from list AFTER user confirms
          const oldStatus = normalizeRoadmapStatus(roadmap.status);
          setLearningRoadmapSource((current) => current.filter((r) => r.sessionId !== sessionId));
          setStatusCounts((prev) => ({
            ...prev,
            active: oldStatus === 'ACTIVE' ? Math.max(0, prev.active - 1) : prev.active,
            paused: oldStatus === 'PAUSED' ? Math.max(0, prev.paused - 1) : prev.paused,
            deleted: prev.deleted + 1,
            total: prev.total,
          }));

          try {
            setActionLoadingId(sessionId);
            await aiRoadmapService.deleteRoadmap(sessionId);
            showSuccess('Đã xóa roadmap', 'Roadmap đã được chuyển sang danh sách đã xóa.', 4);
            await loadLearningRoadmaps();
            if (hasLoadedDeletedRoadmaps) {
              await loadDeletedRoadmaps(true);
            }
          } catch (error) {
            // Rollback on failure
            setLearningRoadmapSource((current) => {
              if (current.some((r) => r.sessionId === sessionId)) return current;
              return [...current, roadmap];
            });
            setStatusCounts((prev) => ({
              ...prev,
              active: oldStatus === 'ACTIVE' ? prev.active + 1 : prev.active,
              paused: oldStatus === 'PAUSED' ? prev.paused + 1 : prev.paused,
              deleted: Math.max(0, prev.deleted - 1),
              total: prev.total,
            }));
            showError('Không thể xóa roadmap', (error as Error).message);
          } finally {
            setActionLoadingId(null);
          }
        },
      },
      secondaryActionButton: {
        text: 'Hủy',
        onClick: hideToast,
      },
    });
  }, [actionLoadingId, hasLoadedDeletedRoadmaps, hideToast, loadDeletedRoadmaps, loadLearningRoadmaps, showError, showSuccess, showToast]);

  const handlePermanentDeleteRoadmap = useCallback((sessionId: number) => {
    if (actionLoadingId !== null) {
      return;
    }

    const roadmap = deletedRoadmapSourceRef.current.find((r) => r.sessionId === sessionId);
    if (!roadmap) return;

    showToast({
      type: 'error',
      title: 'Xóa vĩnh viễn roadmap?',
      message: 'Hành động này không thể hoàn tác. Toàn bộ dữ liệu gắn trực tiếp với roadmap sẽ bị xóa.',
      autoCloseDelay: 12,
      showCountdown: false,
      actionButton: {
        text: 'Xóa vĩnh viễn',
        onClick: async () => {
          hideToast();

          // Optimistic update: remove from deleted list AFTER user confirms
          setDeletedRoadmapSource((current) => current.filter((r) => r.sessionId !== sessionId));
          setStatusCounts((prev) => ({
            ...prev,
            deleted: Math.max(0, prev.deleted - 1),
            total: prev.total,
          }));

          try {
            setActionLoadingId(sessionId);
            await aiRoadmapService.permanentDeleteRoadmap(sessionId);
            showSuccess('Đã xóa vĩnh viễn roadmap', 'Roadmap và dữ liệu liên quan đã được xóa khỏi hệ thống.', 4);
            if (hasLoadedDeletedRoadmaps) {
              await loadDeletedRoadmaps(true);
            }
            await loadLearningRoadmaps();
          } catch (error) {
            // Rollback on failure
            setDeletedRoadmapSource((current) => {
              if (current.some((r) => r.sessionId === sessionId)) return current;
              return [...current, roadmap];
            });
            setStatusCounts((prev) => ({
              ...prev,
              deleted: prev.deleted + 1,
              total: prev.total,
            }));
            showError('Không thể xóa vĩnh viễn roadmap', (error as Error).message);
          } finally {
            setActionLoadingId(null);
          }
        },
      },
      secondaryActionButton: {
        text: 'Hủy',
        onClick: hideToast,
      },
    });
  }, [actionLoadingId, hasLoadedDeletedRoadmaps, hideToast, loadDeletedRoadmaps, loadLearningRoadmaps, showError, showSuccess, showToast]);

  const handleRestoreRoadmap = useCallback(async (sessionId: number) => {
    if (actionLoadingId !== null) return;

    try {
      setActionLoadingId(sessionId);
      await aiRoadmapService.restoreRoadmap(sessionId);
      showSuccess('Đã khôi phục roadmap', 'Roadmap đã được khôi phục về danh sách còn sử dụng. Bạn có thể kích hoạt lại bất kỳ lúc nào.', 4);
      await loadLearningRoadmaps();
      if (hasLoadedDeletedRoadmaps) {
        await loadDeletedRoadmaps(true);
      }
    } catch (error) {
      showError('Không thể khôi phục roadmap', (error as Error).message);
    } finally {
      setActionLoadingId(null);
    }
  }, [actionLoadingId, hasLoadedDeletedRoadmaps, loadDeletedRoadmaps, loadLearningRoadmaps, showError, showSuccess]);

  const applyFiltersAndSort = useCallback((items: RoadmapSessionSummary[]) => {
    let filtered = [...items];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((roadmap) =>
        roadmap.title.toLowerCase().includes(query)
        || roadmap.originalGoal.toLowerCase().includes(query),
      );
    }

    if (filterExperience !== 'all') {
      filtered = filtered.filter(
        (roadmap) => roadmap.experienceLevel.toLowerCase() === filterExperience.toLowerCase(),
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'progress':
          return b.progressPercentage - a.progressPercentage;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [filterExperience, searchQuery, sortBy]);

  const learningRoadmaps = useMemo(() => (
    applyFiltersAndSort(learningRoadmapSource)
  ), [applyFiltersAndSort, learningRoadmapSource]);

  const deletedRoadmaps = useMemo(() => (
    applyFiltersAndSort(deletedRoadmapSource)
  ), [applyFiltersAndSort, deletedRoadmapSource]);

  const learningRoadmapCount = statusCounts.active + statusCounts.paused;
  const deletedRoadmapCount = statusCounts.deleted;

  const handleSwitchListScope = useCallback((scope: RoadmapListScope) => {
    setActiveListScope(scope);
    if (scope === 'deleted' && !hasLoadedDeletedRoadmaps) {
      void loadDeletedRoadmaps();
    }
  }, [hasLoadedDeletedRoadmaps, loadDeletedRoadmaps]);

  const handleGoBack = () => {
    if (viewMode === 'generate') {
      setViewMode('list');
    } else {
      window.history.back();
    }
  };

  return (
    <div className="roadmap-hud-container">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để dùng Roadmap AI"
        message="Bạn cần đăng nhập để tạo và lưu lộ trình học tập cá nhân hóa"
        feature="Roadmap AI"
      />

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

      <div className="roadmap-page__container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div className="roadmap-page__header" style={{ marginBottom: '30px' }}>
          {/* <button onClick={handleGoBack} className="roadmap-page__back-btn" style={{ color: 'var(--hud-accent)', borderColor: 'var(--hud-border)' }}>
            <ArrowLeft className="h-5 w-5" />
            {viewMode === 'list' ? 'Quay lại' : 'Quay lại Lộ trình'}
          </button> */}
          
          <div className="roadmap-page__header-content">
            <h1 className="roadmap-page__title" style={{ fontFamily: 'var(--hud-font-mono)', color: 'var(--hud-accent)', textShadow: '0 0 10px var(--hud-accent-glow)' }}>
              {viewMode === 'list' && 'QUẢN LÝ LỘ TRÌNH'}
              {viewMode === 'generate' && ''}
            </h1>
            <p className="roadmap-page__subtitle" style={{ color: 'var(--hud-text-dim)' }}>
              {viewMode === 'list' && 'Hệ thống lộ trình học tập AI'}
              {viewMode === 'generate' && ''}
            </p>
          </div>

          {viewMode === 'list' && (
            <button
              onClick={handleCreateRoadmap}
              className="roadmap-hud-btn"
              style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Plus size={20} />
              Tạo lộ trình mới
            </button>
          )}
        </div>

        {/* Content */}
        <div className="roadmap-page__content">
          {viewMode === 'list' && (
            <div className="roadmap-page__list">
              {/* Search and Filter Controls */}
              {isAuthenticated && (
                <div className="sv-roadmap-controls" style={{ background: 'var(--hud-panel-bg)', borderColor: 'var(--hud-border)' }}>
                  <div className="sv-roadmap-controls__search">
                    <Search size={20} style={{ color: 'var(--hud-accent)' }} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm lộ trình..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="sv-roadmap-controls__input"
                      style={{ color: 'var(--hud-text)', background: 'transparent' }}
                    />
                  </div>

                  <div className="sv-roadmap-controls__filters">
                    <div className="sv-roadmap-controls__group">
                      <Filter size={18} style={{ color: 'var(--hud-accent)' }} />
                      <select
                        value={filterExperience}
                        onChange={(e) => setFilterExperience(e.target.value)}
                        className="sv-roadmap-controls__select"
                        style={{ color: 'var(--hud-text)', background: 'var(--hud-bg)' }}
                      >
                        <option value="all">Tất cả cấp độ</option>
                        <option value="beginner">Mới bắt đầu</option>
                        <option value="intermediate">Trung cấp</option>
                        <option value="advanced">Nâng cao</option>
                      </select>
                    </div>

                    <div className="sv-roadmap-controls__group">
                      <span className="sv-roadmap-controls__label" style={{ color: 'var(--hud-text-dim)' }}>Sắp xếp:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="sv-roadmap-controls__select"
                        style={{ color: 'var(--hud-text)', background: 'var(--hud-bg)' }}
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="progress">Tiến độ</option>
                        <option value="title">Tiêu đề (A-Z)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
                      className="sv-roadmap-controls__view-toggle"
                      title={displayMode === 'grid' ? 'Chế độ danh sách' : 'Chế độ lưới'}
                      style={{ color: 'var(--hud-accent)' }}
                    >
                      {displayMode === 'grid' ? <List size={20} /> : <Grid3x3 size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {!isAuthenticated || isLoadingList ? (
                <RoadmapList
                  roadmaps={[]}
                  displayMode={displayMode}
                  onSelectRoadmap={handleSelectRoadmap}
                  isLoading={isLoadingList}
                  isAuthenticated={isAuthenticated}
                  onLoginRedirect={() => setShowLoginModal(true)}
                  onCreateRoadmap={handleCreateRoadmap}
                  onActivateRoadmap={handleActivateRoadmap}
                  onPauseRoadmap={handlePauseRoadmap}
                  onDeleteRoadmap={handleDeleteRoadmap}
                  onPermanentDeleteRoadmap={handlePermanentDeleteRoadmap}
                  actionLoadingId={actionLoadingId}
                />
              ) : (
                <div className="sv-roadmap-split-sections">
                  <div className="sv-roadmap-switch-tabs" role="tablist" aria-label="Chuyển danh sách roadmap">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeListScope === 'learning'}
                      className={`sv-roadmap-switch-tab ${activeListScope === 'learning' ? 'sv-roadmap-switch-tab--active' : ''}`}
                      onClick={() => handleSwitchListScope('learning')}
                    >
                      <span>Roadmap còn sử dụng</span>
                      <span className="sv-roadmap-switch-tab__count">{learningRoadmapCount}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeListScope === 'deleted'}
                      className={`sv-roadmap-switch-tab sv-roadmap-switch-tab--archive ${activeListScope === 'deleted' ? 'sv-roadmap-switch-tab--active' : ''}`}
                      onClick={() => handleSwitchListScope('deleted')}
                    >
                      <span>Roadmap đã xóa</span>
                      <span className="sv-roadmap-switch-tab__count">{deletedRoadmapCount}</span>
                    </button>
                  </div>

                  {activeListScope === 'learning' ? (
                    <section className="sv-roadmap-split-section">
                      <div className="sv-roadmap-split-section__header">
                        <div>
                          <h2 className="sv-roadmap-split-section__title">Roadmap còn sử dụng</h2>
                          <p className="sv-roadmap-split-section__subtitle">Danh sách roadmap ACTIVE và PAUSED để bạn tiếp tục học.</p>
                        </div>
                        <span className="sv-roadmap-split-section__count">{learningRoadmapCount}</span>
                      </div>
                      <RoadmapList
                        roadmaps={learningRoadmaps}
                        displayMode={displayMode}
                        onSelectRoadmap={handleSelectRoadmap}
                        isLoading={false}
                        isAuthenticated={isAuthenticated}
                        onLoginRedirect={() => setShowLoginModal(true)}
                        onCreateRoadmap={handleCreateRoadmap}
                        onActivateRoadmap={handleActivateRoadmap}
                        onPauseRoadmap={handlePauseRoadmap}
                        onDeleteRoadmap={handleDeleteRoadmap}
                        actionLoadingId={actionLoadingId}
                        totalRoadmapCount={learningRoadmapCount}
                        onNavigateRoadmap={handleNavigateRoadmap}
                        emptyTitle="Chưa có roadmap còn sử dụng"
                        emptyDescription="Tạo roadmap mới để bắt đầu hành trình học tập cá nhân hóa."
                      />
                    </section>
                  ) : (
                    <section className="sv-roadmap-split-section sv-roadmap-split-section--archive">
                      <div className="sv-roadmap-split-section__header">
                        <div>
                          <h2 className="sv-roadmap-split-section__title">Roadmap đã xóa</h2>
                          <p className="sv-roadmap-split-section__subtitle">Danh sách roadmap đã xóa, bạn có thể xóa vĩnh viễn tại đây.</p>
                        </div>
                        <span className="sv-roadmap-split-section__count sv-roadmap-split-section__count--archive">{deletedRoadmapCount}</span>
                      </div>
                      <RoadmapList
                        roadmaps={deletedRoadmaps}
                        displayMode={displayMode}
                        onSelectRoadmap={handleSelectRoadmap}
                        isLoading={isLoadingDeletedList}
                        isAuthenticated={isAuthenticated}
                        onLoginRedirect={() => setShowLoginModal(true)}
                        onPermanentDeleteRoadmap={handlePermanentDeleteRoadmap}
                        onRestoreRoadmap={handleRestoreRoadmap}
                        actionLoadingId={actionLoadingId}
                        disableCardSelection
                        hideEmptyCreateButton
                        emptyTitle="Danh sách roadmap đã xóa đang trống"
                        emptyDescription="Khi bạn xóa roadmap, mục đó sẽ xuất hiện tại đây để xử lý xóa vĩnh viễn."
                      />
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

          {viewMode === 'generate' && (
            <div className="roadmap-hud-console">
                <RoadmapGeneratorForm
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                  isAuthenticated={isAuthenticated}
                  onLoginRedirect={() => setShowLoginModal(true)}
                />
            </div>
          )}
        </div>
      </div>

      <MeowlGuide currentPage="roadmap" autoOpenChat />

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

export default AiRoadmapPage;
