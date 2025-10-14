import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Sparkles, Loader, BookOpen, Search, Grid3x3, List, Filter, LogIn } from 'lucide-react';
import { RoadmapGeneratorForm, RoadmapFlow } from '../../components/ai-roadmap';
import aiRoadmapService from '../../services/aiRoadmapService';
import { 
  RoadmapSessionSummary, 
  RoadmapResponse, 
  GenerateRoadmapRequest,
  QuestProgress,
  ProgressStatus
} from '../../types/Roadmap';
import MeowlGuide from '../../components/MeowlGuide';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/RoadmapPage.css';
import '../../styles/AiRoadmap.css';

type ViewMode = 'list' | 'generate' | 'view';
type DisplayMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'progress' | 'title';

const RoadmapPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [roadmaps, setRoadmaps] = useState<RoadmapSessionSummary[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapResponse | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, QuestProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const { toast, isVisible, showError, showSuccess, hideToast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Phase 4: List view enhancements
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterExperience, setFilterExperience] = useState<string>('all');

  const loadUserRoadmaps = useCallback(async () => {
    // Only load if authenticated to prevent 401 errors
    if (!isAuthenticated) {
      setIsLoadingList(false);
      return;
    }

    try {
      setIsLoadingList(true);
      const data = await aiRoadmapService.getUserRoadmaps();
      setRoadmaps(data);
    } catch (error) {
      showError('Error', (error as Error).message);
    } finally {
      setIsLoadingList(false);
    }
  }, [isAuthenticated, showError]);

  // Load user's roadmaps on mount (only if authenticated)
  useEffect(() => {
    loadUserRoadmaps();
  }, [loadUserRoadmaps]);

  const handleCreateRoadmap = () => {
    // Always allow viewing the form, but show login prompt if not authenticated
    setViewMode('generate');
  };

  const handleGenerate = async (request: GenerateRoadmapRequest) => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để tạo lộ trình học tập.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      setIsLoading(true);
      const roadmap = await aiRoadmapService.generateRoadmap(request);
      showSuccess('Success', 'Roadmap generated successfully!');
      setSelectedRoadmap(roadmap);
      setViewMode('view');
      // Reload list to include new roadmap
      await loadUserRoadmaps();
    } catch (error: any) {
      // Extract error message from Axios error response
      const errorMessage = error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi không xác định.';
      
      // Debug logging
      console.log('🐛 Error caught:', error);
      console.log('🐛 Error response:', error?.response);
      console.log('🐛 Error message extracted:', errorMessage);
      
      // Check for specific error types and show user-friendly messages
      if (errorMessage.includes('Mục tiêu không hợp lệ') || 
          errorMessage.includes('không liên quan đến học tập') ||
          errorMessage.includes('không hợp lý')) {
        // Show detailed validation error with examples
        console.log('🚨 Showing invalid goal error toast');
        showError(
          '❌ Mục tiêu không hợp lệ', 
          'Mục tiêu của bạn không liên quan đến học tập hoặc phát triển kỹ năng. Vui lòng nhập một mục tiêu học tập cụ thể như "Học Python", "Trở thành Data Scientist", "Học tiếng Anh IELTS 7.0", v.v.',
          12 // 12 seconds for longer message
        );
      } else if (errorMessage.includes('quá dài') || errorMessage.includes('quá ngắn')) {
        console.log('🚨 Showing length error toast');
        showError('⚠️ Độ dài không hợp lệ', errorMessage, 8);
      } else if (errorMessage.includes('chứa từ ngữ không phù hợp')) {
        console.log('🚨 Showing inappropriate content error toast');
        showError('🚫 Nội dung không phù hợp', 'Mục tiêu chứa từ ngữ không phù hợp. Vui lòng nhập lại với nội dung tích cực.', 8);
      } else {
        // Generic error - show backend message directly
        console.log('🚨 Showing generic error toast');
        showError('❌ Lỗi tạo lộ trình', errorMessage, 8);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoadmap = async (sessionId: number) => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lộ trình.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      setIsLoading(true);
      const roadmap = await aiRoadmapService.getRoadmapById(sessionId);
      setSelectedRoadmap(roadmap);
      setViewMode('view');
    } catch (error) {
      showError('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestComplete = async (questId: string, completed: boolean) => {
    if (!selectedRoadmap) return;
    
    try {
      // Update backend first
      const response = await aiRoadmapService.updateQuestProgress(
        selectedRoadmap.sessionId, 
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
          'Quest Completed! 🎉', 
          `${completedQuests}/${totalQuests} quests done (${completionPercentage.toFixed(1)}%)`
        );
      } else {
        showSuccess(
          'Quest Unchecked', 
          `${completedQuests}/${totalQuests} quests done (${completionPercentage.toFixed(1)}%)`
        );
      }

      // Reload roadmap list to update progress display
      await loadUserRoadmaps();
    } catch (error) {
      showError('Error', (error as Error).message);
    }
  };

  // Filter and sort roadmaps (V2 API field names)
  const filteredAndSortedRoadmaps = useCallback(() => {
    let filtered = [...roadmaps];

    // Search filter (use V2 field names: originalGoal)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.originalGoal.toLowerCase().includes(query)
      );
    }

    // Experience filter (use V2 field name: experienceLevel)
    if (filterExperience !== 'all') {
      filtered = filtered.filter(r => r.experienceLevel.toLowerCase() === filterExperience.toLowerCase());
    }

    // Sort
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
  }, [roadmaps, searchQuery, filterExperience, sortBy]);

  const handleGoBack = () => {
    if (viewMode === 'view' || viewMode === 'generate') {
      setViewMode('list');
      setSelectedRoadmap(null);
    } else {
      window.history.back();
    }
  };
  return (
    <div className="roadmap-page__galaxy-bg">

      {/* Cosmic dust particles */}
      <div className="cosmic-dust">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="dust-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
      <div className="roadmap-page__container">
        {/* Header */}
        <div className="roadmap-page__header">
          <button onClick={handleGoBack} className="roadmap-page__back-btn">
            <ArrowLeft className="h-5 w-5" />
            {viewMode === 'list' ? 'Quay lại' : 'Quay lại Lộ trình'}
          </button>
          
          <div className="roadmap-page__header-content">
            <h1 className="roadmap-page__title">
              {viewMode === 'list' && 'Lộ trình học bằng AI'}
              {viewMode === 'generate' && 'Tạo lộ trình mới'}
              {viewMode === 'view' && selectedRoadmap?.metadata?.title}
            </h1>
            <p className="roadmap-page__subtitle">
              {viewMode === 'list' && 'Lộ trình học cá nhân hóa, được tạo bởi AI'}
              {viewMode === 'generate' && 'Hãy để AI tạo hành trình học tập phù hợp với bạn'}
              {viewMode === 'view' && selectedRoadmap?.metadata && `${selectedRoadmap.metadata.duration} • Cấp độ ${selectedRoadmap.metadata.experienceLevel}`}
            </p>
          </div>

          {/* Create Button - Only show in list view */}
          {viewMode === 'list' && (
            <button
              onClick={handleCreateRoadmap}
              className="roadmap-page__create-btn"
            >
              <Plus size={20} />
              Tạo lộ trình mới
            </button>
          )}
        </div>

        {/* Content */}
        <div className="roadmap-page__content">
          {/* LIST VIEW - Show all roadmaps */}
          {viewMode === 'list' && (
            <div className="roadmap-page__list">
              {/* Search and Filter Controls */}
              {roadmaps.length > 0 && (
                <div className="sv-roadmap-controls">
                  <div className="sv-roadmap-controls__search">
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm lộ trình..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="sv-roadmap-controls__input"
                    />
                  </div>

                  <div className="sv-roadmap-controls__filters">
                    <div className="sv-roadmap-controls__group">
                      <Filter size={18} />
                      <select
                        value={filterExperience}
                        onChange={(e) => setFilterExperience(e.target.value)}
                        className="sv-roadmap-controls__select"
                      >
                        <option value="all">Tất cả cấp độ</option>
                        <option value="beginner">Mới bắt đầu</option>
                        <option value="intermediate">Trung cấp</option>
                        <option value="advanced">Nâng cao</option>
                      </select>
                    </div>

                    <div className="sv-roadmap-controls__group">
                      <span className="sv-roadmap-controls__label">Sắp xếp:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="sv-roadmap-controls__select"
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
                    >
                      {displayMode === 'grid' ? <List size={20} /> : <Grid3x3 size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {isLoadingList ? (
                <div className="roadmap-page__loading">
                  <Loader className="animate-spin" size={48} />
                  <p>Đang tải lộ trình của bạn...</p>
                </div>
              ) : roadmaps.length === 0 ? (
                <div className="roadmap-page__empty">
                  <div className="roadmap-empty__icon">
                    <BookOpen className="h-12 w-12" />
                  </div>
                  {!isAuthenticated ? (
                    <>
                      <h3>Vui lòng đăng nhập</h3>
                      <p>Đăng nhập để tạo và quản lý lộ trình học của bạn!</p>
                      <button 
                        onClick={() => navigate('/login')}
                        className="roadmap-empty__create-btn"
                        style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <LogIn size={20} />
                        Đăng nhập ngay
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>Chưa có lộ trình nào</h3>
                      <p>Tạo lộ trình học đầu tiên bằng AI để bắt đầu nhé!</p>
                      <button 
                        onClick={handleCreateRoadmap}
                        className="roadmap-empty__create-btn"
                      >
                        <Sparkles size={20} />
                        Tạo lộ trình đầu tiên
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className={`roadmap-page__grid ${displayMode === 'list' ? 'roadmap-page__grid--list' : ''}`}>
                  {filteredAndSortedRoadmaps().map((roadmap) => (
                    <button
                      key={roadmap.sessionId}
                      className="sv-roadmap-card"
                      type="button"
                      onClick={() => handleSelectRoadmap(roadmap.sessionId)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectRoadmap(roadmap.sessionId); } }}
                    >
                      <div className="sv-roadmap-card__header">
                        <h3 className="sv-roadmap-card__title">{roadmap.title}</h3>
                        <span className="sv-roadmap-card__badge">{roadmap.experienceLevel}</span>
                      </div>
                      
                      <p className="sv-roadmap-card__goal">{roadmap.originalGoal}</p>
                      
                      <div className="sv-roadmap-card__stats">
                        <div className="sv-roadmap-card__stat">
                          <BookOpen size={16} />
                          <span>{roadmap.totalQuests} Nhiệm vụ</span>
                        </div>
                        <div className="sv-roadmap-card__stat">
                          <span>{roadmap.duration}</span>
                        </div>
                      </div>

                      <div className="sv-roadmap-card__progress">
                        <div className="sv-roadmap-card__progress-bar">
                          <div
                            className="sv-roadmap-card__progress-fill"
                            style={{ width: `${roadmap.progressPercentage}%` }}
                          />
                        </div>
                        <span className="sv-roadmap-card__progress-text">
                          {roadmap.completedQuests} / {roadmap.totalQuests} đã xong ({roadmap.progressPercentage}%)
                        </span>
                      </div>

                      <div className="sv-roadmap-card__date">
                        Tạo ngày {new Date(roadmap.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GENERATE VIEW - Show form */}
          {viewMode === 'generate' && (
            <RoadmapGeneratorForm
              onGenerate={handleGenerate}
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
              onLoginRedirect={() => navigate('/login')}
            />
          )}

          {/* VIEW ROADMAP - Show React Flow (V2 API) */}
          {viewMode === 'view' && selectedRoadmap && (
            <div className="roadmap-page__viewer">
              <div className="roadmap-page__viewer-info">
                <div className="roadmap-viewer__header">
                  <h2 className="roadmap-viewer__title">{selectedRoadmap.metadata.title}</h2>
                  {selectedRoadmap.metadata.difficultyLevel && (
                    <span className={`roadmap-viewer__badge roadmap-viewer__badge--${selectedRoadmap.metadata.difficultyLevel}`}>
                      {selectedRoadmap.metadata.difficultyLevel}
                    </span>
                  )}
                </div>
                
                <div className="roadmap-viewer__meta">
                  <div className="roadmap-viewer__meta-grid">
                    <div className="roadmap-viewer__meta-item">
                      <span className="roadmap-viewer__meta-label">🎯 Mục tiêu học tập:</span>
                      <span className="roadmap-viewer__meta-value">{selectedRoadmap.metadata.originalGoal}</span>
                    </div>
                    
                    {selectedRoadmap.metadata.validatedGoal && (
                      <div className="roadmap-viewer__meta-item">
                        <span className="roadmap-viewer__meta-label">✅ Mục tiêu đã xác nhận:</span>
                        <span className="roadmap-viewer__meta-value">{selectedRoadmap.metadata.validatedGoal}</span>
                      </div>
                    )}
                    
                    <div className="roadmap-viewer__meta-item">
                      <span className="roadmap-viewer__meta-label">⏱️ Thời lượng:</span>
                      <span className="roadmap-viewer__meta-value">{selectedRoadmap.metadata.duration}</span>
                    </div>
                    
                    <div className="roadmap-viewer__meta-item">
                      <span className="roadmap-viewer__meta-label">📊 Cấp độ kinh nghiệm:</span>
                      <span className="roadmap-viewer__meta-value">{selectedRoadmap.metadata.experienceLevel}</span>
                    </div>
                    
                    <div className="roadmap-viewer__meta-item">
                      <span className="roadmap-viewer__meta-label">📚 Phong cách học:</span>
                      <span className="roadmap-viewer__meta-value">{selectedRoadmap.metadata.learningStyle}</span>
                    </div>
                  </div>
                </div>

                {selectedRoadmap.metadata.validationNotes && 
                 selectedRoadmap.metadata.validationNotes !== 'null' && 
                 selectedRoadmap.metadata.validationNotes !== 'undefined' && (
                  <div className="roadmap-viewer__warnings">
                    <h4>📋 Ghi chú xác thực:</h4>
                    <ul>
                      {Array.isArray(selectedRoadmap.metadata.validationNotes) 
                        ? selectedRoadmap.metadata.validationNotes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))
                        : <li>{selectedRoadmap.metadata.validationNotes}</li>
                      }
                    </ul>
                  </div>
                )}

                {selectedRoadmap.statistics && (
                  <div className="roadmap-viewer__stats">
                    <div className="stat-item">
                      <span className="stat-label">Tổng số bước:</span>
                      <span className="stat-value">{selectedRoadmap.statistics.totalNodes}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Thời gian ước tính:</span>
                      <span className="stat-value">{selectedRoadmap.statistics.totalEstimatedHours.toFixed(1)}h</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Nhiệm vụ chính:</span>
                      <span className="stat-value">{selectedRoadmap.statistics.mainNodes}</span>
                    </div>
                    {selectedRoadmap.statistics.sideNodes > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">Nhiệm vụ phụ:</span>
                        <span className="stat-value">{selectedRoadmap.statistics.sideNodes}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedRoadmap.learningTips && (
                  <div className="roadmap-viewer__tips">
                    <h4>💡 Gợi ý học tập:</h4>
                    <ul>
                      {Array.isArray(selectedRoadmap.learningTips) 
                        ? selectedRoadmap.learningTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))
                        : <li>{selectedRoadmap.learningTips}</li>
                      }
                    </ul>
                  </div>
                )}
              </div>

              <RoadmapFlow
                roadmap={selectedRoadmap.roadmap}
                progressMap={progressMap}
                onQuestComplete={handleQuestComplete}
              />
            </div>
          )}
        </div>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="roadmap" />

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

export default RoadmapPage;
