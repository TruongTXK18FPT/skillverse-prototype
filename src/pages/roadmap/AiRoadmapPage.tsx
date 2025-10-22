import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Search, Grid3x3, List, Filter } from 'lucide-react';
import { RoadmapGeneratorForm } from '../../components/ai-roadmap';
import { RoadmapList } from '../../components/roadmap';
import aiRoadmapService from '../../services/aiRoadmapService';
import { 
  RoadmapSessionSummary, 
  GenerateRoadmapRequest
} from '../../types/Roadmap';
import MeowlGuide from '../../components/MeowlGuide';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/RoadmapPage.css';
import '../../styles/AiRoadmap.css';

type ViewMode = 'list' | 'generate';
type DisplayMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'progress' | 'title';

const AiRoadmapPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [roadmaps, setRoadmaps] = useState<RoadmapSessionSummary[]>([]);
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
      // Navigate to the new roadmap detail page
      navigate(`/roadmap/${roadmap.sessionId}`);
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

  const handleSelectRoadmap = (sessionId: number) => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lộ trình.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // Navigate to dedicated roadmap detail page
    navigate(`/roadmap/${sessionId}`);
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
    if (viewMode === 'generate') {
      setViewMode('list');
    } else {
      window.history.back();
    }
  };
  return (
    <div className="roadmap-page__galaxy-bg">

      {/* Cosmic dust particles - Optimized for performance */}
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
            </h1>
            <p className="roadmap-page__subtitle">
              {viewMode === 'list' && 'Lộ trình học cá nhân hóa, được tạo bởi AI'}
              {viewMode === 'generate' && 'Hãy để AI tạo hành trình học tập phù hợp với bạn'}
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

              <RoadmapList
                roadmaps={filteredAndSortedRoadmaps()}
                displayMode={displayMode}
                onSelectRoadmap={handleSelectRoadmap}
                isLoading={isLoadingList}
                isAuthenticated={isAuthenticated}
                onLoginRedirect={() => navigate('/login')}
                onCreateRoadmap={handleCreateRoadmap}
              />
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

export default AiRoadmapPage;
