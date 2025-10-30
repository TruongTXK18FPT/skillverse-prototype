import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, DollarSign, Briefcase, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import MeowlGuide from '../../components/MeowlGuide';
import JobDetailsModal from '../../components/job/JobDetailsModal';
import jobService from '../../services/jobService';
import { JobPostingResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import '../../styles/JobsPage.css';

const JobsPage = () => {
  const { theme } = useTheme();
  const { showError } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPostingResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch jobs on mount and when search changes
  useEffect(() => {
    fetchJobs();
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getPublicJobs({
        search: searchTerm || undefined,
        status: 'OPEN'
      });
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('Lỗi Tải Dữ Liệu', 'Không thể tải danh sách công việc. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobClick = (job: JobPostingResponse) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedJob(null);
  };

  const handleApplySuccess = () => {
    fetchJobs(); // Refresh job list to update applicant count
    handleCloseModal();
  };

  const formatBudget = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };
  
  return (
    <div className={`sv-jobs-container ${theme}`} data-theme={theme}>
      <div className="sv-jobs-content">
        {/* Header */}
        <div className="sv-jobs-header">
          <h1 className="sv-jobs-header__title">Việc Làm Tự Do</h1>
          <p className="sv-jobs-header__description">
            Tìm kiếm cơ hội việc làm phù hợp với kỹ năng của bạn
          </p>
        </div>

        {/* Search and Filter */}
        <div className="sv-jobs-search">
          <div className="sv-jobs-search__form">
            <div className="sv-jobs-search__input-wrapper">
              <Search className="sv-jobs-search__icon" />
              <input
                type="text"
                placeholder="Tìm kiếm việc làm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sv-jobs-search__input"
              />
            </div>
          </div>
        </div>

        <div className="sv-jobs-main">
          {/* Jobs List */}
          <div className="sv-jobs-list sv-jobs-list--full-width">
            {isLoading ? (
              <div className="sv-jobs-loading">
                <div className="sv-jobs-spinner"></div>
                <p>Đang tải công việc...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="sv-jobs-empty-state">
                <div className="sv-jobs-empty-state__icon">💼</div>
                <h3 className="sv-jobs-empty-state__title">Không Tìm Thấy Công Việc</h3>
                <p className="sv-jobs-empty-state__description">
                  {searchTerm
                    ? `Không tìm thấy công việc phù hợp với từ khóa "${searchTerm}". Hãy thử tìm kiếm với từ khóa khác.`
                    : 'Hiện tại chưa có công việc nào đang mở. Vui lòng quay lại sau hoặc thử tìm kiếm với từ khóa khác.'}
                </p>
                <div className="sv-jobs-empty-state__suggestions">
                  <div className="sv-jobs-empty-state__suggestion-item">
                    Thử tìm kiếm với từ khóa đơn giản hơn
                  </div>
                  <div className="sv-jobs-empty-state__suggestion-item">
                    Kiểm tra lại chính tả của từ khóa
                  </div>
                  <div className="sv-jobs-empty-state__suggestion-item">
                    Xóa bộ lọc để xem tất cả công việc
                  </div>
                </div>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="sv-job-card">
                  <div className="sv-job-card__header">
                    <div>
                      <h3 className="sv-job-card__title">{job.title}</h3>
                      <p className="sv-job-card__company">{job.recruiterCompanyName}</p>
                    </div>
                    <div className="sv-job-card__meta">
                      <div className="sv-job-card__meta-item">
                        <MapPin />
                        <span>{job.isRemote ? '🌐 Từ xa' : `📍 ${job.location}`}</span>
                      </div>
                      <div className="sv-job-card__meta-item">
                        <DollarSign />
                        <span>{formatBudget(job.minBudget, job.maxBudget)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="sv-job-card__description">
                    {job.description.length > 150
                      ? `${job.description.substring(0, 150)}...`
                      : job.description}
                  </p>

                  <div className="sv-job-card__tags">
                    {job.requiredSkills.slice(0, 5).map((skill, index) => (
                      <span key={index} className="sv-job-card__tag">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 5 && (
                      <span className="sv-job-card__tag sv-job-card__tag--more">
                        +{job.requiredSkills.length - 5} thêm
                      </span>
                    )}
                  </div>

                  <div className="sv-job-card__footer">
                    <div className="sv-job-card__stats">
                      <div className="sv-job-card__meta-item">
                        <Briefcase />
                        <span>{job.applicantCount} ứng viên</span>
                      </div>
                      <div className="sv-job-card__meta-item">
                        <Clock />
                        <span>{formatRelativeTime(job.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      className="sv-job-card__apply-btn"
                      onClick={() => handleJobClick(job)}
                    >
                      <span>Xem Chi Tiết</span>
                      <ArrowRight />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {isDetailsModalOpen && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={handleCloseModal}
          onApplySuccess={handleApplySuccess}
        />
      )}

      {/* Meowl Guide */}
      <MeowlGuide currentPage="jobs" />
    </div>
  );
};

export default JobsPage;