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
  AlertCircle,
  Zap,
  ChevronRight,
} from 'lucide-react';
import CandidateCard from './CandidateCard';
import candidateSearchService from '../../services/candidateSearchService';
import recruiterSubscriptionService from '../../services/recruiterSubscriptionService';
import jobService from '../../services/jobService';
import shortTermJobService from '../../services/shortTermJobService';
import { CandidateSearchFilters, CandidateSearchResult, RecruitmentSessionResponse } from '../../data/portfolioDTOs';
import { JobPostingResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './CandidateSearchPage.css';

interface ShortTermJobItem {
  id: number;
  title: string;
  status: string;
  applicantCount?: number;
}

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
  { value: 'skillFit,desc', label: 'Kỹ năng phù hợp' },
  { value: 'evidenceFit,desc', label: 'Bằng chứng mạnh nhất' },
  { value: 'experienceFit,desc', label: 'Kinh nghiệm phù hợp' },
  { value: 'deliveryFit,desc', label: 'Delivery tốt nhất' },
  { value: 'confidenceFit,desc', label: 'Độ tin cậy cao nhất' },
  { value: 'riskPenalty,asc', label: 'Rủi ro thấp nhất' },
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
  selectedJobId: initialJobId,
  selectedJobTitle,
  onCandidateSelect
}) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  // Auth & Subscription state
  const [isPremium, setIsPremium] = useState(false);
  const [canUseAI, setCanUseAI] = useState(false);

  // Job list state (both long-term and short-term)
  const [longTermJobs, setLongTermJobs] = useState<JobPostingResponse[]>([]);
  const [shortTermJobs, setShortTermJobs] = useState<ShortTermJobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(initialJobId);
  const [selectedJobType, setSelectedJobType] = useState<'LONG' | 'SHORT'>('LONG');

  // Candidates state
  const [candidates, setCandidates] = useState<CandidateSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CandidateSearchFilters>({
    skills: [],
    experienceLevel: undefined,
    hasPortfolio: undefined,
    isVerified: undefined,
    isPremium: undefined,
    isAvailable: undefined,
    hasRelevantProjects: undefined,
    hasCompletedMissions: undefined,
    mustMatchPrimarySkill: undefined,
    minOverallScore: undefined,
    minSkillFit: undefined,
    location: undefined,
    jobId: initialJobId
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
  const [jobsLoading, setJobsLoading] = useState(true);

  // Load subscription info
  useEffect(() => {
    loadSubscriptionInfo();
    loadAllJobs();
  }, []);

  // Reload candidates when filters/pagination/section changes
  useEffect(() => {
    if (!jobsLoading) {
      searchCandidates();
    }
  }, [filters, sortBy, page, selectedJobId, selectedJobType]);

  // Sync external selectedJobId
  useEffect(() => {
    if (initialJobId !== undefined) {
      setSelectedJobId(initialJobId);
    }
  }, [initialJobId]);

  // Determine which job list to use based on selected type
  const currentJobList = selectedJobType === 'LONG' ? longTermJobs : shortTermJobs;
  const activeJob = currentJobList.find(j => j.id === selectedJobId);

  const loadSubscriptionInfo = async () => {
    try {
      const sub = await recruiterSubscriptionService.getSubscriptionInfo();
      setIsPremium(sub.hasSubscription);
      setCanUseAI(sub.canUseAICandidateSuggestion);
    } catch {
      // Non-recruiter or no subscription — silently handle
    }
  };

  const loadAllJobs = async () => {
    setJobsLoading(true);
    try {
      const [longTerm, shortTerm] = await Promise.all([
        jobService.getMyJobs().catch(() => []),
        shortTermJobService.getMyJobs().catch(() => []),
      ]);
      setLongTermJobs(longTerm || []);
      setShortTermJobs(shortTerm || []);

      // Auto-select first open job if nothing selected yet
      if (!selectedJobId) {
        const firstOpen = longTerm?.find((j: JobPostingResponse) => j.status === 'OPEN');
        if (firstOpen) {
          setSelectedJobId(firstOpen.id);
          setSelectedJobType('LONG');
        } else if (longTerm?.length) {
          setSelectedJobId(longTerm[0].id);
          setSelectedJobType('LONG');
        } else if (shortTerm?.length) {
          setSelectedJobId(shortTerm[0].id);
          setSelectedJobType('SHORT');
        }
      }
    } catch {
      // ignore
    } finally {
      setJobsLoading(false);
    }
  };

  const handleSelectJob = (jobId: number, type: 'LONG' | 'SHORT') => {
    setSelectedJobId(jobId);
    setSelectedJobType(type);
    setPage(0);
  };

  const searchCandidates = async () => {
    if (jobsLoading) return;
    setIsLoading(true);
    try {
      const [sortField, sortDir] = sortBy.split(',');
      const result = await candidateSearchService.searchCandidates(
        {
          ...filters,
          jobId: selectedJobType === 'LONG' ? selectedJobId : undefined,
          shortTermJobId: selectedJobType === 'SHORT' ? selectedJobId : undefined,
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

  const handleNumberFilterChange = (key: keyof CandidateSearchFilters, value: string) => {
    const parsed = Number(value);
    setFilters(prev => ({
      ...prev,
      [key]: value === '' || Number.isNaN(parsed) ? undefined : Math.max(0, Math.min(100, parsed))
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
      hasRelevantProjects: undefined,
      hasCompletedMissions: undefined,
      mustMatchPrimarySkill: undefined,
      minOverallScore: undefined,
      minSkillFit: undefined,
      location: undefined,
      jobId: selectedJobType === 'LONG' ? selectedJobId : undefined,
      shortTermJobId: selectedJobType === 'SHORT' ? selectedJobId : undefined,
    });
    setSearchTerm('');
    setPage(0);
  };

  const handleViewProfile = (candidateId: number) => {
    const candidate = candidates.find(c => c.userId === candidateId);
    if (candidate && onCandidateSelect) {
      onCandidateSelect(candidate);
    } else {
      window.open(`/portfolio/${candidateId}`, '_blank');
    }
  };

  const handleStartChat = async (candidateId: number) => {
    setProcessingIds(prev => new Set(prev).add(candidateId));
    try {
      const result = await candidateSearchService.startChatWithCandidate(candidateId, selectedJobId);
      showSuccess('Thành Công', 'Đã bắt đầu cuộc trò chuyện');
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
    filters.isAvailable !== undefined ||
    filters.hasRelevantProjects !== undefined ||
    filters.hasCompletedMissions !== undefined ||
    filters.mustMatchPrimarySkill !== undefined ||
    filters.minOverallScore !== undefined ||
    filters.minSkillFit !== undefined ||
    Boolean(filters.location);

  // Build unified job list for selector tabs
  const allJobs = [
    ...longTermJobs.map(j => ({ ...j, _type: 'LONG' as const })),
    ...shortTermJobs.map(j => ({ ...j, _type: 'SHORT' as const })),
  ];

  return (
    <div className="csp-container">
      {/* ══════════════════════════════════════════
          SECTION 1: Page Header
      ══════════════════════════════════════════ */}
      <div className="csp-section">
        <div className="csp-page-header">
          <div className="csp-page-header__left">
            <div className="csp-page-header__icon">
              <Users size={22} />
            </div>
            <div className="csp-page-header__text">
              <h2>Tìm Ứng Viên</h2>
              <p>Tìm kiếm và kết nối với ứng viên phù hợp cho tin tuyển dụng của bạn</p>
            </div>
          </div>
          <div className="csp-page-header__badges">
            {canUseAI && (
              <span className="csp-badge csp-badge--ai">
                <Sparkles size={13} />
                AI Matching
              </span>
            )}
            {!isPremium && (
              <span className="csp-badge csp-badge--upgrade">
                <Crown size={13} />
                Nâng cấp Premium
              </span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 2: Job Selector Bar
        ══════════════════════════════════════════ */}
        <div className="csp-job-selector">
          <span className="csp-job-selector__label">
            <Briefcase size={14} />
            Chọn tin tuyển dụng
          </span>
          <div className="csp-job-selector__tabs">
            {/* Long-term jobs */}
            {longTermJobs.slice(0, 8).map(job => (
              <button
                key={`long-${job.id}`}
                className={`csp-job-tab ${selectedJobId === job.id && selectedJobType === 'LONG' ? 'csp-job-tab--active' : ''}`}
                onClick={() => handleSelectJob(job.id, 'LONG')}
                title={job.title}
              >
                <span className="csp-job-tab__type">Job</span>
                <span>{job.title.length > 18 ? job.title.slice(0, 18) + '...' : job.title}</span>
                {job.applicantCount !== undefined && job.applicantCount > 0 && (
                  <span style={{ marginLeft: '0.25rem', fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700 }}>
                    {job.applicantCount}
                  </span>
                )}
              </button>
            ))}

            {/* Short-term jobs */}
            {shortTermJobs.slice(0, 8).map(job => (
              <button
                key={`short-${job.id}`}
                className={`csp-job-tab ${selectedJobId === job.id && selectedJobType === 'SHORT' ? 'csp-job-tab--active' : ''}`}
                onClick={() => handleSelectJob(job.id, 'SHORT')}
                title={job.title}
              >
                <span className="csp-job-tab__type" style={{ background: '#fef3c7', color: '#b45309' }}>Gig</span>
                <span>{job.title.length > 18 ? job.title.slice(0, 18) + '...' : job.title}</span>
              </button>
            ))}

            {/* No jobs state */}
            {allJobs.length === 0 && !jobsLoading && (
              <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontStyle: 'italic' }}>
                Chưa có tin tuyển dụng nào. Hãy tạo job trước.
              </span>
            )}
          </div>

          {jobsLoading && (
            <Loader2 size={16} style={{ animation: 'csp-spin 1s linear infinite', color: '#9ca3af' }} />
          )}
        </div>

        {/* ══════════════════════════════════════════
            SECTION 3: Search Bar
        ══════════════════════════════════════════ */}
        <form className="csp-search-row" onSubmit={handleSearch}>
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
            className={`csp-filter-btn ${showFilters ? 'csp-filter-btn--active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} />
            Bộ lọc
            {hasActiveFilters && <span className="csp-filter-btn__dot" />}
          </button>

          <button type="submit" className="csp-search__submit" disabled={isSearching}>
            {isSearching ? <Loader2 size={16} className="csp-spin" /> : <Search size={16} />}
            Tìm Kiếm
          </button>
        </form>

        {/* ══════════════════════════════════════════
            SECTION 4: Filters Panel
        ══════════════════════════════════════════ */}
        {showFilters && (
          <div className="csp-filters">
            {/* Skills filter */}
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
                        <button onClick={() => handleRemoveSkill(skill)}><X size={11} /></button>
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

            <div className="csp-filter-group">
              <label className="csp-filter-label">Địa điểm</label>
              <input
                type="text"
                className="csp-filter-input"
                placeholder="Remote, HCM, Ha Noi..."
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value.trim() || undefined)}
              />
            </div>

            <div className="csp-filter-group">
              <label className="csp-filter-label">Ngưỡng điểm</label>
              <div className="csp-score-filters">
                <label className="csp-score-filter">
                  <span>Fit tổng thể</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="csp-filter-input"
                    value={filters.minOverallScore ?? ''}
                    onChange={(e) => handleNumberFilterChange('minOverallScore', e.target.value)}
                    placeholder="0-100"
                  />
                </label>
                <label className="csp-score-filter">
                  <span>Skill fit</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="csp-filter-input"
                    value={filters.minSkillFit ?? ''}
                    onChange={(e) => handleNumberFilterChange('minSkillFit', e.target.value)}
                    placeholder="0-100"
                  />
                </label>
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="csp-filter-group">
              <label className="csp-filter-label">Tính năng</label>
              <div className="csp-filter-toggles">
                <label className="csp-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.hasPortfolio === true}
                    onChange={(e) => handleFilterChange('hasPortfolio', e.target.checked ? true : undefined)}
                  />
                  <span>Có Portfolio</span>
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
            </div>

            <div className="csp-filter-group">
              <label className="csp-filter-label">Bằng chứng fit</label>
              <div className="csp-filter-toggles">
                <label className="csp-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.hasRelevantProjects === true}
                    onChange={(e) => handleFilterChange('hasRelevantProjects', e.target.checked ? true : undefined)}
                  />
                  <span>Có dự án liên quan</span>
                </label>
                <label className="csp-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.hasCompletedMissions === true}
                    onChange={(e) => handleFilterChange('hasCompletedMissions', e.target.checked ? true : undefined)}
                  />
                  <span>Đã hoàn thành mission</span>
                </label>
                <label className="csp-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.mustMatchPrimarySkill === true}
                    onChange={(e) => handleFilterChange('mustMatchPrimarySkill', e.target.checked ? true : undefined)}
                  />
                  <span>Bắt buộc khớp skill chính</span>
                </label>
              </div>
            </div>

            {/* Footer: Clear filters */}
            {hasActiveFilters && (
              <div className="csp-filters__footer">
                <button className="csp-filters__clear" onClick={handleClearFilters}>
                  <RefreshCw size={13} />
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          SECTION 5: Results Header
      ══════════════════════════════════════════ */}
      <div className="csp-section">
        <div className="csp-results-header">
          <div className="csp-results-count">
            {isLoading ? (
              <>
                <Loader2 size={16} className="csp-spin" style={{ color: '#9ca3af' }} />
                <span>Đang tìm kiếm...</span>
              </>
            ) : (
              <>
                <strong>{totalElements.toLocaleString('vi-VN')}</strong>
                <span>ứng viên được tìm thấy</span>
                {activeJob && (
                  <span style={{ color: '#6b7280', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
                    cho <strong style={{ color: '#374151' }}>{activeJob.title}</strong>
                    <span style={{ marginLeft: '0.25rem', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: selectedJobType === 'LONG' ? '#eff6ff' : '#fef3c7', color: selectedJobType === 'LONG' ? '#2563eb' : '#b45309', fontWeight: 600 }}>
                      {selectedJobType === 'LONG' ? 'JOB' : 'GIG'}
                    </span>
                  </span>
                )}
              </>
            )}
          </div>

          <div className="csp-sort">
            <label>Sắp xếp:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="csp-sort-select"
            >
              {SORT_OPTIONS.map((option, index) => (
                <option key={`${option.value}-${index}`} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 6: Results Grid
        ══════════════════════════════════════════ */}
        <div className="csp-results">
          {isLoading ? (
            <div className="csp-loading">
              <Loader2 size={32} className="csp-spin" />
              <p>Đang tìm kiếm ứng viên phù hợp...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="csp-empty">
              <Users size={40} />
              <h3>Không tìm thấy ứng viên</h3>
              <p>
                {activeJob
                  ? `Chưa có ứng viên nào phù hợp với tin "${activeJob.title}". Thử điều chỉnh bộ lọc hoặc kỹ năng tìm kiếm.`
                  : 'Hãy chọn một tin tuyển dụng để bắt đầu tìm kiếm ứng viên phù hợp.'
                }
              </p>
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

        {/* ══════════════════════════════════════════
            SECTION 7: Pagination
        ══════════════════════════════════════════ */}
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
    </div>
  );
};

export default CandidateSearchPage;
