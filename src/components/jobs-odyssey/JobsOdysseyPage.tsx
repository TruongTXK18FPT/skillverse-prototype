import { useState, useEffect } from 'react';
import OdysseyLayout from './OdysseyLayout';
import FateCard from './FateCard';
import FilterConsole, { JobFilters } from './FilterConsole';
import JobDetailsModal from '../job/JobDetailsModal';
import MeowlGuide from '../MeowlGuide';
import jobService from '../../services/jobService';
import { JobPostingResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './odyssey-styles.css';

const JobsOdysseyPage = () => {
  const { showError } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<JobFilters>({
    deploymentZone: 'all',
    minBounty: 0,
    maxBounty: 50000000
  });
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
      showError('Lỗi tải dữ liệu', 'Không thể tải danh sách công việc. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jobs based on filter console settings
  const filteredJobs = jobs.filter((job) => {
    // Deployment zone filter
    if (filters.deploymentZone === 'remote' && !job.isRemote) return false;
    if (filters.deploymentZone === 'onsite' && job.isRemote) return false;

    // Bounty range filter
    const avgBounty = (job.minBudget + job.maxBudget) / 2;
    if (avgBounty < filters.minBounty || avgBounty > filters.maxBounty) return false;

    return true;
  });

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

  return (
    <OdysseyLayout>
      {/* Filter Console with integrated Search */}
      <FilterConsole
        onFilterChange={setFilters}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
      />

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="odyssey-loading">
          <div className="odyssey-loading__spinner"></div>
          <p className="odyssey-loading__text">Đang tải công việc...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="odyssey-empty">
          <div className="odyssey-empty__icon">🃏</div>
          <h3 className="odyssey-empty__title">Không có công việc</h3>
          <p className="odyssey-empty__text">
            {searchTerm
              ? `Không có công việc phù hợp với "${searchTerm}". Hãy thử từ khóa khác hoặc xóa tìm kiếm.`
              : jobs.length === 0
              ? 'Hiện chưa có công việc nào được đăng. Vui lòng quay lại sau để xem cơ hội mới.'
              : 'Không có công việc phù hợp với bộ lọc hiện tại. Hãy điều chỉnh và thử lại.'}
          </p>
        </div>
      ) : (
        <div className="odyssey-grid">
          {filteredJobs.map((job) => (
            <FateCard
              key={job.id}
              job={job}
              onClick={() => handleJobClick(job)}
            />
          ))}
        </div>
      )}

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
    </OdysseyLayout>
  );
};

export default JobsOdysseyPage;
