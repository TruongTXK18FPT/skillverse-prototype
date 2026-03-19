import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Users,
  X,
  RefreshCw,
  Briefcase,
  Sparkles,
  Crown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import CandidateCard from './CandidateCard';
import candidateSearchService from '../../services/candidateSearchService';
import recruiterSubscriptionService from '../../services/recruiterSubscriptionService';
import { CandidateSearchFilters, CandidateSearchResult, RecruitmentSessionResponse } from '../../data/portfolioDTOs';
import { useToast } from '../../hooks/useToast';
import './CandidateSearchPage.css';

interface CandidateSearchPageProps {
  selectedJobId?: number;
  selectedJobTitle?: string;
  onCandidateSelect?: (candidate: CandidateSearchResult) => void;
}

type SortOption = {
  value: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { value: 'matchScore,desc', label: 'Độ phù hợp cao nhất' },
  { value: 'skillMatchPercent,desc', label: 'Kỹ năng phù hợp' },
  { value: 'lastActive,desc', label: 'Hoạt động gần đây' },
  { value: 'totalProjects,desc', label: 'Nhiều dự án nhất' },
];

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Mới vào nghề' },
  { value: 'JUNIOR', label: 'Junior (1-2 năm)' },
  { value: 'MIDDLE', label: 'Middle (3-5 năm)' },
  { value: 'SENIOR', label: 'Senior (5+ năm)' },
  { value: 'EXPERT', label: 'Chuyên gia' },
];

const CandidateSearchPage: React.FC<CandidateSearchPageProps> = ({
  selectedJobId,
  selectedJobTitle,
  onCandidateSelect
}) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  // State
  const [isPremium, setIsPremium] = useState(false);
  const [canUseAI, setCanUseAI] = useState(false);

  const [candidates, setCandidates] = useState<CandidateSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CandidateSearchFilters>({
    skills: [],
    experienceLevel: undefined,
    hasPortfolio: undefined,
    isVerified: undefined,
    isPremium: undefined,
    isAvailable: undefined,
    jobId: selectedJobId
  });

  const [sortBy, setSortBy] = useState('matchScore,desc');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Load subscription info
  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  // Load candidates when filters or pagination changes
  useEffect(() => {
    searchCandidates();
  }, [filters, sortBy, page, selectedJobId]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      jobId: selectedJobId,
    }));
    setPage(0);
  }, [selectedJobId]);

  const loadSubscriptionInfo = async () => {
    try {
      const sub = await recruiterSubscriptionService.getSubscriptionInfo();
      setIsPremium(sub.hasSubscription);
      setCanUseAI(sub.canUseAICandidateSuggestion);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const searchCandidates = async () => {
    setIsLoading(true);
    try {
      const [sortField, sortDir] = sortBy.split(',');
      const result = await candidateSearchService.searchCandidates(
        {
          ...filters,
          jobId: selectedJobId,
          query: searchTerm.trim() || undefined,
        },
        page,
        pageSize,
        sortField,
        sortDir
      );
      setCandidates(result.candidates);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error: any) {
      showError('Lỗi Tìm Kiếm', error.message || 'Không thể tìm kiếm ứng viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    searchCandidates();
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !filters.skills?.includes(skillInput.trim())) {
      setFilters(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()]
      }));
      setSkillInput('');
      setPage(0);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills?.filter(s => s !== skill)
    }));
    setPage(0);
  };

  const handleFilterChange = (key: keyof CandidateSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      skills: [],
      experienceLevel: undefined,
      hasPortfolio: undefined,
      isVerified: undefined,
      isPremium: undefined,
      isAvailable: undefined,
      jobId: selectedJobId
    });
    setSearchTerm('');
    setPage(0);
  };

  const handleViewProfile = (candidateId: number) => {
    const candidate = candidates.find(c => c.userId === candidateId);
    if (candidate && onCandidateSelect) {
      onCandidateSelect(candidate);
    } else {
      // Open in new tab
      window.open(`/portfolio/${candidateId}`, '_blank');
    }
  };

  const handleStartChat = async (candidateId: number) => {
    setProcessingIds(prev => new Set(prev).add(candidateId));
    try {
      const result = await candidateSearchService.startChatWithCandidate(candidateId, selectedJobId);
      showSuccess('Thành Công', 'Đã bắt đầu cuộc trò chuyện');
      // Navigate to MessengerPage with the recruitment session
      navigate('/messages', {
        state: {
          openChatWith: result.id.toString(),
          type: 'RECRUITMENT'
        }
      });
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể bắt đầu chat');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  };

  const handleShortlist = async (candidateId: number) => {
    setProcessingIds(prev => new Set(prev).add(candidateId));
    try {
      await candidateSearchService.shortlistCandidate(candidateId, selectedJobId);
      showSuccess('Đã Lưu', 'Ứng viên đã được lưu vào danh sách');
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể lưu ứng viên');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  };

  const handleConnectToJob = async (candidateId: number) => {
    if (!selectedJobId) {
      showError('Chọn Job', 'Vui lòng chọn job để mời ứng tuyển');
      return;
    }
    setProcessingIds(prev => new Set(prev).add(candidateId));
    try {
      const result = await candidateSearchService.connectCandidateToJob(candidateId, selectedJobId);
      showSuccess('Đã Mời', 'Đã gửi lời mời ứng tuyển đến ứng viên');
      // Navigate to MessengerPage with the recruitment session
      navigate('/messages', {
        state: {
          openChatWith: result.id.toString(),
          type: 'RECRUITMENT'
        }
      });
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể gửi lời mời');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  };

  const hasActiveFilters =
    searchTerm ||
    (filters.skills && filters.skills.length > 0) ||
    filters.experienceLevel ||
    filters.hasPortfolio !== undefined ||
    filters.isVerified !== undefined ||
    filters.isPremium !== undefined ||
    filters.isAvailable !== undefined;

  return (
    <div className="csp-container">
      {/* Header */}
      <div className="csp-header">
        <div className="csp-header__title">
          <Users size={24} />
          <h2>Tìm Ứng Viên</h2>
          {selectedJobTitle && (
            <span className="csp-header__job-badge">
              <Briefcase size={14} />
              {selectedJobTitle}
            </span>
          )}
        </div>

        {canUseAI && (
          <div className="csp-header__ai-badge">
            <Sparkles size={14} />
            AI Matching
          </div>
        )}

        {!isPremium && (
          <div className="csp-header__upgrade">
            <Crown size={16} />
            <span>Nâng cấp Premium để tìm kiếm nâng cao</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <form className="csp-search" onSubmit={handleSearch}>
        <div className="csp-search__input-wrapper">
          <Search size={18} className="csp-search__icon" />
          <input
            type="text"
            className="csp-search__input"
            placeholder="Tìm theo tên, kỹ năng, hoặc từ khóa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="csp-search__clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`csp-search__filter-btn ${showFilters ? 'csp-search__filter-btn--active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
          Lọc
          {hasActiveFilters && <span className="csp-search__filter-count">•</span>}
        </button>

        <button type="submit" className="csp-search__submit" disabled={isSearching}>
          {isSearching ? <Loader2 size={18} className="csp-spin" /> : 'Tìm Kiếm'}
        </button>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="csp-filters">
          {/* Skills */}
          <div className="csp-filter-group">
            <label className="csp-filter-label">Kỹ năng</label>
            <div className="csp-filter-skills">
              <div className="csp-filter-skills__input">
                <input
                  type="text"
                  placeholder="Thêm kỹ năng..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <button type="button" onClick={handleAddSkill}>+</button>
              </div>
              {filters.skills && filters.skills.length > 0 && (
                <div className="csp-filter-skills__tags">
                  {filters.skills.map(skill => (
                    <span key={skill} className="csp-filter-skills__tag">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Experience Level */}
          <div className="csp-filter-group">
            <label className="csp-filter-label">Cấp bậc</label>
            <select
              className="csp-filter-select"
              value={filters.experienceLevel || 'all'}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
            >
              <option value="all">Tất cả</option>
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          {/* Toggle Filters */}
          <div className="csp-filter-toggles">
            <label className="csp-filter-toggle">
              <input
                type="checkbox"
                checked={filters.hasPortfolio === true}
                onChange={(e) => handleFilterChange('hasPortfolio', e.target.checked ? true : undefined)}
              />
              <span>có Portfolio</span>
            </label>
            <label className="csp-filter-toggle">
              <input
                type="checkbox"
                checked={filters.isVerified === true}
                onChange={(e) => handleFilterChange('isVerified', e.target.checked ? true : undefined)}
              />
              <span>Verified</span>
            </label>
            <label className="csp-filter-toggle">
              <input
                type="checkbox"
                checked={filters.isPremium === true}
                onChange={(e) => handleFilterChange('isPremium', e.target.checked ? true : undefined)}
              />
              <span>Premium</span>
            </label>
            <label className="csp-filter-toggle">
              <input
                type="checkbox"
                checked={filters.isAvailable === true}
                onChange={(e) => handleFilterChange('isAvailable', e.target.checked ? true : undefined)}
              />
              <span>Đang rảnh</span>
            </label>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button className="csp-filters__clear" onClick={handleClearFilters}>
              <RefreshCw size={14} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Results Header */}
      <div className="csp-results-header">
        <div className="csp-results-count">
          {totalElements.toLocaleString('vi-VN')} ứng viên
        </div>

        <div className="csp-sort">
          <label>Sắp xếp:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="csp-sort-select"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="csp-results">
        {isLoading ? (
          <div className="csp-loading">
            <Loader2 size={32} className="csp-spin" />
            <p>Đang tìm kiếm ứng viên...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="csp-empty">
            <Users size={48} />
            <h3>Không tìm thấy ứng viên</h3>
            <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            {hasActiveFilters && (
              <button className="csp-empty__btn" onClick={handleClearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="csp-results__grid">
            {candidates.map(candidate => (
              <CandidateCard
                key={candidate.userId}
                candidate={candidate}
                onViewProfile={handleViewProfile}
                onStartChat={handleStartChat}
                onShortlist={handleShortlist}
                onConnectToJob={handleConnectToJob}
                selectedJobId={selectedJobId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="csp-pagination">
          <button
            className="csp-pagination__btn"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ← Trước
          </button>

          <div className="csp-pagination__pages">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 3) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`csp-pagination__page ${page === pageNum ? 'csp-pagination__page--active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            className="csp-pagination__btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default CandidateSearchPage;
