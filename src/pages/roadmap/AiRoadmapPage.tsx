import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Sparkles, Loader, BookOpen, Search, Grid3x3, List, Filter } from 'lucide-react';
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
import { useToast } from '../../hooks/useToast';
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
  const { showError, showSuccess } = useToast();

  // Phase 4: List view enhancements
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterExperience, setFilterExperience] = useState<string>('all');

  const loadUserRoadmaps = useCallback(async () => {
    try {
      setIsLoadingList(true);
      const data = await aiRoadmapService.getUserRoadmaps();
      setRoadmaps(data);
    } catch (error) {
      showError('Error', (error as Error).message);
    } finally {
      setIsLoadingList(false);
    }
  }, [showError]);

  // Load user's roadmaps on mount
  useEffect(() => {
    loadUserRoadmaps();
  }, [loadUserRoadmaps]);

  const handleGenerate = async (request: GenerateRoadmapRequest) => {
    try {
      setIsLoading(true);
      const roadmap = await aiRoadmapService.generateRoadmap(request);
      showSuccess('Success', 'Roadmap generated successfully!');
      setSelectedRoadmap(roadmap);
      setViewMode('view');
      // Reload list to include new roadmap
      await loadUserRoadmaps();
    } catch (error) {
      showError('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoadmap = async (sessionId: number) => {
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

  // Filter and sort roadmaps
  const filteredAndSortedRoadmaps = useCallback(() => {
    let filtered = [...roadmaps];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.goal.toLowerCase().includes(query)
      );
    }

    // Experience filter
    if (filterExperience !== 'all') {
      filtered = filtered.filter(r => r.experience.toLowerCase() === filterExperience.toLowerCase());
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
    <div className="roadmap-page">
      <div className="roadmap-page__container">
        {/* Header */}
        <div className="roadmap-page__header">
          <button onClick={handleGoBack} className="roadmap-page__back-btn">
            <ArrowLeft className="h-5 w-5" />
            {viewMode === 'list' ? 'Back to Dashboard' : 'Back to Roadmaps'}
          </button>
          
          <div className="roadmap-page__header-content">
            <h1 className="roadmap-page__title">
              {viewMode === 'list' && <><Sparkles className="inline mr-2" /> AI Learning Roadmaps</>}
              {viewMode === 'generate' && 'Create New Roadmap'}
              {viewMode === 'view' && selectedRoadmap?.title}
            </h1>
            <p className="roadmap-page__subtitle">
              {viewMode === 'list' && 'Personalized learning paths powered by AI'}
              {viewMode === 'generate' && 'Let AI create your personalized learning journey'}
              {viewMode === 'view' && `${selectedRoadmap?.duration} • ${selectedRoadmap?.experience} level`}
            </p>
          </div>

          {/* Create Button - Only show in list view */}
          {viewMode === 'list' && (
            <button
              onClick={() => setViewMode('generate')}
              className="roadmap-page__create-btn"
            >
              <Plus size={20} />
              Generate New Roadmap
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
                      placeholder="Search roadmaps..."
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
                        <option value="all">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="sv-roadmap-controls__group">
                      <span className="sv-roadmap-controls__label">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="sv-roadmap-controls__select"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="progress">Progress</option>
                        <option value="title">Title (A-Z)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
                      className="sv-roadmap-controls__view-toggle"
                      title={displayMode === 'grid' ? 'List View' : 'Grid View'}
                    >
                      {displayMode === 'grid' ? <List size={20} /> : <Grid3x3 size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {isLoadingList ? (
                <div className="roadmap-page__loading">
                  <Loader className="animate-spin" size={48} />
                  <p>Loading your roadmaps...</p>
                </div>
              ) : roadmaps.length === 0 ? (
                <div className="roadmap-page__empty">
                  <div className="roadmap-empty__icon">
                    <BookOpen className="h-12 w-12" />
                  </div>
                  <h3>No roadmaps yet</h3>
                  <p>Create your first AI-powered learning roadmap to get started!</p>
                  <button 
                    onClick={() => setViewMode('generate')}
                    className="roadmap-empty__create-btn"
                  >
                    <Sparkles size={20} />
                    Generate Your First Roadmap
                  </button>
                </div>
              ) : (
                <div className={`roadmap-page__grid ${displayMode === 'list' ? 'roadmap-page__grid--list' : ''}`}>
                  {filteredAndSortedRoadmaps().map((roadmap) => (
                    <div
                      key={roadmap.sessionId}
                      className="sv-roadmap-card"
                      onClick={() => handleSelectRoadmap(roadmap.sessionId)}
                    >
                      <div className="sv-roadmap-card__header">
                        <h3 className="sv-roadmap-card__title">{roadmap.title}</h3>
                        <span className="sv-roadmap-card__badge">{roadmap.experience}</span>
                      </div>
                      
                      <p className="sv-roadmap-card__goal">{roadmap.goal}</p>
                      
                      <div className="sv-roadmap-card__stats">
                        <div className="sv-roadmap-card__stat">
                          <BookOpen size={16} />
                          <span>{roadmap.totalQuests} Quests</span>
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
                          {roadmap.completedQuests} / {roadmap.totalQuests} completed ({roadmap.progressPercentage}%)
                        </span>
                      </div>

                      <div className="sv-roadmap-card__date">
                        Created {new Date(roadmap.createdAt).toLocaleDateString()}
                      </div>
                    </div>
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
            />
          )}

          {/* VIEW ROADMAP - Show React Flow */}
          {viewMode === 'view' && selectedRoadmap && (
            <div className="roadmap-page__viewer">
              <div className="roadmap-page__viewer-info">
                <p>
                  <strong>Goal:</strong> {selectedRoadmap.goal}
                </p>
                <p>
                  <strong>Learning Style:</strong> {selectedRoadmap.style}
                </p>
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
    </div>
  );
};

export default RoadmapPage;
