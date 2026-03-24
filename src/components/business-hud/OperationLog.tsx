import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Trash2,
  RotateCcw,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import jobService from '../../services/jobService';
import { JobPostingResponse, JobStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import ApplicantsModal from '../business/ApplicantsModal';
import JobMarkdownSurface from '../shared/JobMarkdownSurface';
import './operation-log.css';

interface OperationLogProps {
  refreshTrigger?: number;
}

type ActiveSection = 'detail' | 'edit';
type StatusFilter = 'ALL' | JobStatus;
type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet';
type ValidationModalState = {
  visible: boolean;
  title: string;
  messages: string[];
};
type ServiceError = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

const STATUS_META: Record<JobStatus, { label: string; desc: string; tone: Tone }> = {
  [JobStatus.IN_PROGRESS]: {
    label: 'Nháp',
    desc: 'Tin đang ở chế độ nội bộ hoặc chưa sẵn sàng công bố.',
    tone: 'cyan',
  },
  [JobStatus.PENDING_APPROVAL]: {
    label: 'Chờ duyệt',
    desc: 'Tin đang chờ admin phê duyệt trước khi mở nhận hồ sơ.',
    tone: 'amber',
  },
  [JobStatus.OPEN]: {
    label: 'Đang mở',
    desc: 'Tin đang hoạt động và tiếp tục nhận hồ sơ ứng tuyển.',
    tone: 'emerald',
  },
  [JobStatus.REJECTED]: {
    label: 'Bị từ chối',
    desc: 'Tin cần chỉnh sửa thêm trước khi có thể công bố lại.',
    tone: 'rose',
  },
  [JobStatus.CLOSED]: {
    label: 'Đã đóng',
    desc: 'Tin đã dừng nhận hồ sơ và có thể được tái kích hoạt.',
    tone: 'slate',
  },
};

const FILTERS: Array<{ value: StatusFilter; label: string; tone: Tone }> = [
  { value: 'ALL', label: 'Tất cả', tone: 'cyan' },
  { value: JobStatus.OPEN, label: 'Đang mở', tone: 'emerald' },
  { value: JobStatus.PENDING_APPROVAL, label: 'Chờ duyệt', tone: 'amber' },
  { value: JobStatus.CLOSED, label: 'Đã đóng', tone: 'slate' },
  { value: JobStatus.REJECTED, label: 'Từ chối', tone: 'rose' },
  { value: JobStatus.IN_PROGRESS, label: 'Nháp', tone: 'violet' },
];

const parseDateOnly = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

const toInputDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value: string) =>
  parseDateOnly(value).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const compactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
};

const formatRelative = (value: string) => {
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / (1000 * 60)),
  );
  if (diffMinutes < 1) return 'vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(value);
};

const getDeadlineMeta = (deadline: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDateOnly(deadline);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: 'Đã quá hạn', tone: 'rose' as Tone };
  if (diff === 0) return { label: 'Đến hạn hôm nay', tone: 'amber' as Tone };
  if (diff <= 3) return { label: `Còn ${diff} ngày`, tone: 'amber' as Tone };
  return { label: `Còn ${diff} ngày`, tone: 'cyan' as Tone };
};

const parseSkills = (value: string) =>
  value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

const JOBS_PER_PAGE = 6;

const getMarkdownTheme = (tone: Tone) => {
  switch (tone) {
    case 'emerald':
      return 'emerald' as const;
    case 'amber':
      return 'amber' as const;
    case 'rose':
      return 'crimson' as const;
    default:
      return 'cyan' as const;
  }
};

const buildValidationMessages = (form: {
  title: string;
  description: string;
  skillsInput: string;
  minBudget: string;
  maxBudget: string;
  deadline: string;
  isRemote: boolean;
  location: string;
}) => {
  const messages: string[] = [];
  const title = form.title.trim();
  const description = form.description.trim();
  const skills = parseSkills(form.skillsInput);
  const minBudget = Number(form.minBudget);
  const maxBudget = Number(form.maxBudget);

  if (title.length < 8) {
    messages.push('Tiêu đề chiến dịch đang quá ngắn. Hãy ghi rõ vị trí hoặc mục tiêu tuyển dụng bằng ít nhất 8 ký tự.');
  }

  if (description.length < 40) {
    messages.push('Mô tả công việc còn quá ngắn. Bạn nên nêu rõ phạm vi công việc, đầu ra mong đợi và tiêu chí hoàn thành.');
  }

  if (skills.length === 0) {
    messages.push('Danh sách kỹ năng đang để trống. Hãy thêm ít nhất một kỹ năng để ứng viên hiểu đúng yêu cầu.');
  }

  if (!Number.isFinite(minBudget) || minBudget <= 0) {
    messages.push('Mức lương tối thiểu chưa hợp lệ. Hãy nhập một số lớn hơn 0.');
  }

  if (!Number.isFinite(maxBudget) || maxBudget <= 0) {
    messages.push('Mức lương tối đa chưa hợp lệ. Hãy nhập một số lớn hơn 0.');
  }

  if (
    Number.isFinite(minBudget) &&
    Number.isFinite(maxBudget) &&
    minBudget > 0 &&
    maxBudget > 0 &&
    maxBudget < minBudget
  ) {
    messages.push('Mức lương tối đa cần lớn hơn hoặc bằng mức lương tối thiểu.');
  }

  if (!form.deadline) {
    messages.push('Bạn chưa chọn hạn chót. Hãy đặt một mốc thời gian cụ thể cho chiến dịch.');
  }

  if (!form.isRemote && !form.location.trim()) {
    messages.push('Bạn đang chọn hình thức làm tại chỗ, vì vậy cần bổ sung địa điểm làm việc.');
  }

  return messages;
};

const mapBackendValidationMessages = (message?: string) => {
  const normalized = (message || '').toLowerCase();
  const messages: string[] = [];

  if (normalized.includes('maximum budget cannot be less than minimum budget')) {
    messages.push('Mức lương tối đa cần lớn hơn hoặc bằng mức lương tối thiểu.');
  }

  if (normalized.includes('location is required for non-remote jobs')) {
    messages.push('Bạn đang chọn hình thức làm tại chỗ, vì vậy cần bổ sung địa điểm làm việc cụ thể.');
  }

  if (normalized.includes('deadline cannot be more than 90 days')) {
    messages.push('Hạn chót hiện đang vượt quá 90 ngày. Hãy chọn mốc gần hơn để hệ thống có thể lưu.');
  }

  if (normalized.includes('deadline must be in the future')) {
    messages.push('Hạn chót cần nằm trong tương lai. Hãy chọn một ngày mới phù hợp hơn.');
  }

  if (normalized.includes('cannot edit job while it is open')) {
    messages.push('Chiến dịch đang mở nên chưa thể chỉnh sửa trực tiếp. Hãy đóng chiến dịch trước khi cập nhật nội dung.');
  }

  if (
    (normalized.includes('title') || normalized.includes('job title')) &&
    (normalized.includes('required') || normalized.includes('blank') || normalized.includes('empty'))
  ) {
    messages.push('Tiêu đề chiến dịch đang bị thiếu. Hãy đặt một tiêu đề rõ ràng để hệ thống có thể lưu.');
  }

  if (
    normalized.includes('description') &&
    (normalized.includes('required') || normalized.includes('blank') || normalized.includes('empty'))
  ) {
    messages.push('Mô tả công việc đang bị thiếu. Hãy bổ sung nội dung chi tiết hơn về phạm vi và kỳ vọng công việc.');
  }

  if (
    (normalized.includes('skill') || normalized.includes('required skill')) &&
    (normalized.includes('required') || normalized.includes('empty') || normalized.includes('blank'))
  ) {
    messages.push('Danh sách kỹ năng chưa hợp lệ. Hãy thêm các kỹ năng chính để ứng viên dễ đối chiếu yêu cầu.');
  }

  if (
    normalized.includes('budget') &&
    (normalized.includes('positive') || normalized.includes('greater than 0') || normalized.includes('invalid'))
  ) {
    messages.push('Khoảng lương chưa hợp lệ. Hãy kiểm tra lại mức lương tối thiểu và tối đa trước khi lưu.');
  }

  return messages;
};

const extractErrorMessage = (error: unknown) => {
  const serviceError = error as ServiceError;
  return serviceError?.response?.data?.message || serviceError?.message || '';
};

const OperationLog: React.FC<OperationLogProps> = ({ refreshTrigger }) => {
  const { showError, showSuccess } = useToast();
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const [selectedJob, setSelectedJob] = useState<JobPostingResponse | null>(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('detail');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    skillsInput: '',
    minBudget: '',
    maxBudget: '',
    deadline: '',
    isRemote: true,
    location: '',
  });
  const [reopenModal, setReopenModal] = useState({
    visible: false,
    jobId: null as number | null,
    deadline: '',
    clearApplications: true,
    isFree: false,
  });
  const [closeModal, setCloseModal] = useState({
    visible: false,
    jobId: null as number | null,
  });
  const [validationModal, setValidationModal] = useState<ValidationModalState>({
    visible: false,
    title: '',
    messages: [],
  });

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      setJobs(await jobService.getMyJobs());
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('Lỗi hệ thống', 'Không thể tải nhật ký hoạt động.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger, localRefreshTrigger, fetchJobs]);

  useEffect(() => {
    if (!selectedJob) return;
    const updated = jobs.find((job) => job.id === selectedJob.id);
    if (!updated) {
      setSelectedJob(null);
      setActiveSection('detail');
      return;
    }
    if (JSON.stringify(updated) !== JSON.stringify(selectedJob)) {
      setSelectedJob(updated);
    }
  }, [jobs, selectedJob]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter]);

  const filteredJobs = jobs
    .filter((job) => {
      const q = searchQuery.trim().toLowerCase();
      const searchHit =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q);
      const statusHit = statusFilter === 'ALL' || job.status === statusFilter;
      return searchHit && statusHit;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = filteredJobs.slice(
    currentPage * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE + JOBS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  const openCount = jobs.filter((job) => job.status === JobStatus.OPEN).length;
  const pendingCount = jobs.filter(
    (job) => job.status === JobStatus.PENDING_APPROVAL,
  ).length;
  const closedCount = jobs.filter((job) => job.status === JobStatus.CLOSED).length;
  const rejectedCount = jobs.filter((job) => job.status === JobStatus.REJECTED).length;
  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0);
  const latestActivityAt = jobs.length
    ? jobs.reduce((latest, job) =>
        new Date(job.updatedAt).getTime() > new Date(latest.updatedAt).getTime()
          ? job
          : latest,
      ).updatedAt
    : null;

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minReopenDate = toInputDate(tomorrow);

  const openDetails = (job: JobPostingResponse) => {
    setSelectedJob(job);
    setActiveSection('detail');
  };

  const openEdit = (job: JobPostingResponse) => {
    setSelectedJob(job);
    setValidationModal({ visible: false, title: '', messages: [] });
    setEditForm({
      title: job.title,
      description: job.description,
      skillsInput: job.requiredSkills.join(', '),
      minBudget: job.minBudget.toString(),
      maxBudget: job.maxBudget.toString(),
      deadline: job.deadline,
      isRemote: job.isRemote,
      location: job.location || '',
    });
    setActiveSection('edit');
  };

  const handleDelete = async (jobId: number) => {
    if (
      !(await confirmAction(
        'CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn tin tuyển dụng và đơn ứng tuyển. Tiếp tục?',
      ))
    ) {
      return;
    }
    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      if (selectedJob?.id === jobId) setSelectedJob(null);
      showSuccess('Thành công', 'Tin tuyển dụng đã được hủy.');
    } catch (error) {
      console.error('Failed to delete job:', error);
      showError('Lỗi', 'Không thể hủy tin tuyển dụng.');
    }
  };

  const confirmClose = async () => {
    if (!closeModal.jobId) return;
    try {
      await jobService.changeJobStatus(closeModal.jobId, JobStatus.CLOSED);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === closeModal.jobId ? { ...job, status: JobStatus.CLOSED } : job,
        ),
      );
      setSelectedJob((prev) =>
        prev?.id === closeModal.jobId ? { ...prev, status: JobStatus.CLOSED } : prev,
      );
      setCloseModal({ visible: false, jobId: null });
      showSuccess('Thành công', 'Chiến dịch đã được đóng.');
    } catch (error) {
      console.error('Failed to close job:', error);
      showError('Lỗi', 'Không thể đóng chiến dịch.');
    }
  };

  const confirmReopen = async () => {
    if (!reopenModal.jobId) return;
    const deadlineDate = parseDateOnly(reopenModal.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    if (deadlineDate < tomorrow) {
      showError('Lỗi ngày tháng', 'Hạn chót phải từ ngày mai trở đi.');
      return;
    }
    try {
      await jobService.reopenJob(reopenModal.jobId, {
        deadline: reopenModal.deadline,
        clearApplications: reopenModal.clearApplications,
      });
      await fetchJobs();
      setReopenModal({
        visible: false,
        jobId: null,
        deadline: '',
        clearApplications: true,
        isFree: false,
      });
      showSuccess('Thành công', 'Chiến dịch đã được tái kích hoạt.');
      window.dispatchEvent(new Event('wallet:updated'));
    } catch (error) {
      console.error('Failed to reopen job:', error);
      showError('Lỗi', 'Không thể mở lại chiến dịch.');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedJob) return;
    const validationMessages = buildValidationMessages(editForm);

    if (validationMessages.length > 0) {
      setValidationModal({
        visible: true,
        title: 'Một vài thông tin cần được chỉnh lại trước khi lưu',
        messages: validationMessages,
      });
      return;
    }

    try {
      await jobService.updateJob(selectedJob.id, {
        title: editForm.title,
        description: editForm.description,
        requiredSkills: parseSkills(editForm.skillsInput),
        minBudget: parseFloat(editForm.minBudget) || 0,
        maxBudget: parseFloat(editForm.maxBudget) || 0,
        deadline: editForm.deadline,
        isRemote: editForm.isRemote,
        location: editForm.isRemote ? null : editForm.location.trim(),
      });
      await fetchJobs();
      setValidationModal({ visible: false, title: '', messages: [] });
      setActiveSection('detail');
      showSuccess('Thành công', 'Thông tin chiến dịch đã được cập nhật.');
    } catch (error) {
      console.error('Error updating job:', error);
      const backendMessage = extractErrorMessage(error);
      const backendValidationMessages = mapBackendValidationMessages(backendMessage);

      if (backendValidationMessages.length > 0) {
        setValidationModal({
          visible: true,
          title: 'Hệ thống cần bạn rà soát lại nội dung chiến dịch',
          messages: backendValidationMessages,
        });
        return;
      }

      showError(
        'Lỗi cập nhật',
        backendMessage || 'Không thể cập nhật thông tin chiến dịch.',
      );
    }
  };

  const selectedMeta = selectedJob ? STATUS_META[selectedJob.status] : null;
  const selectedDeadline = selectedJob ? getDeadlineMeta(selectedJob.deadline) : null;

  return (
    <section className="oplog">
      <header className="oplog__hero">
        <div>
          <span className="oplog__eyebrow">
            <Activity size={14} />
            Nhật ký vận hành
          </span>
          <h2>Nhật ký tuyển dụng dài hạn</h2>
          <p>
            Trung tâm điều phối giúp theo dõi tiến độ chiến dịch, xử lý trạng
            thái tuyển dụng và nắm nhanh biến động ứng viên trên một màn hình.
          </p>
          <div className="oplog__hero-tags">
            <span className="oplog__tag oplog__tag--cyan">
              <Sparkles size={13} />
              Theo dõi tức thời
            </span>
            <span className="oplog__tag oplog__tag--violet">
              <FileText size={13} />
              Tổ chức rõ ràng
            </span>
            <span className="oplog__tag oplog__tag--amber">
              <Clock3 size={13} />
              Xử lý nhanh gọn
            </span>
          </div>
        </div>

        <div className="oplog__pulse-card">
          <div className="oplog__pulse-row">
            <span>Đồng bộ gần nhất</span>
            <strong>{latestActivityAt ? formatRelative(latestActivityAt) : 'Chưa có'}</strong>
          </div>
          <div className="oplog__pulse-row">
            <span>Chiến dịch đang hoạt động</span>
            <strong>{openCount + pendingCount}</strong>
          </div>
          <div className="oplog__pulse-row">
            <span>Cần chú ý</span>
            <strong>{pendingCount + rejectedCount}</strong>
          </div>
        </div>
      </header>

      <div className="oplog__stats">
        {[
          { label: 'Tổng chiến dịch', value: jobs.length, tone: 'cyan', icon: BriefcaseBusiness },
          { label: 'Đang mở', value: openCount, tone: 'emerald', icon: Activity },
          { label: 'Chờ duyệt', value: pendingCount, tone: 'amber', icon: Sparkles },
          { label: 'Đã đóng', value: closedCount, tone: 'slate', icon: CheckCircle2 },
          { label: 'Ứng viên', value: totalApplicants, tone: 'violet', icon: Users },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="oplog__stat"
              data-tone={stat.tone}
              style={{ ['--index' as const]: index } as React.CSSProperties}
            >
              <div className="oplog__stat-icon">
                <Icon size={18} />
              </div>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          );
        })}
      </div>

      <section className="oplog__toolbar">
        <label className="oplog__search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề hoặc mô tả..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="oplog__filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`oplog__filter ${statusFilter === filter.value ? 'is-active' : ''}`}
              data-tone={filter.tone}
              onClick={() => setStatusFilter(filter.value)}
            >
              <span>{filter.label}</span>
              <strong>
                {filter.value === 'ALL'
                  ? jobs.length
                  : jobs.filter((job) => job.status === filter.value).length}
              </strong>
            </button>
          ))}
        </div>

        <div className="oplog__summary">
          <span>
            <FileText size={13} />
            {filteredJobs.length}/{jobs.length} chiến dịch
          </span>
          <span>
            <Clock3 size={13} />
            {latestActivityAt ? formatDateTime(latestActivityAt) : 'Chưa có dữ liệu'}
          </span>
        </div>
      </section>

      <div className="oplog__workspace">
        <aside className="oplog__list-panel">
          <div className="oplog__panel-head">
            <div>
              <span>Trung tâm chiến dịch</span>
              <h3>Danh sách chiến dịch</h3>
            </div>
            <strong>{filteredJobs.length}</strong>
          </div>

          <div className="oplog__list-shell">
            {isLoading ? (
              <div className="oplog__state">
                <Loader2 size={24} className="oplog__spin" />
                <h4>Đang tải dữ liệu</h4>
                <p>Hệ thống đang đồng bộ log chiến dịch và hồ sơ liên quan.</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="oplog__state">
                <Search size={26} />
                <h4>Không tìm thấy chiến dịch</h4>
                <p>Thử thay đổi từ khóa hoặc bộ lọc để làm mới luồng hiển thị.</p>
              </div>
            ) : (
              <div className="oplog__list">
                {paginatedJobs.map((job, index) => {
                  const meta = STATUS_META[job.status];
                  const deadline = getDeadlineMeta(job.deadline);
                  return (
                    <button
                      key={job.id}
                      type="button"
                      className={`oplog__item oplog__item--${meta.tone} ${
                        selectedJob?.id === job.id ? 'is-active' : ''
                      }`}
                      onClick={() => openDetails(job)}
                      style={{ ['--index' as const]: index } as React.CSSProperties}
                    >
                      <div className="oplog__item-top">
                        <div>
                          <span className="oplog__item-id">Mã tin #{job.id}</span>
                          <h4>{job.title}</h4>
                        </div>
                        <span className={`oplog__badge oplog__badge--${meta.tone}`}>{meta.label}</span>
                      </div>
                      <JobMarkdownSurface
                        content={job.description}
                        density="card"
                        theme={getMarkdownTheme(meta.tone)}
                        maxHeight={108}
                        className="oplog__item-markdown"
                        placeholder="Chưa có mô tả chi tiết."
                      />
                      <div className="oplog__item-meta">
                        <span>
                          <CalendarDays size={12} />
                          {formatDate(job.deadline)}
                        </span>
                        <span>
                          <Wallet size={12} />
                          {job.isNegotiable ? 'Thỏa thuận' : `${compactCurrency(job.maxBudget)} VNĐ`}
                        </span>
                        <span>
                          <Users size={12} />
                          {job.applicantCount || 0} hồ sơ
                        </span>
                      </div>
                      <div className="oplog__item-bottom">
                        <span className={`oplog__deadline oplog__deadline--${deadline.tone}`}>{deadline.label}</span>
                        <span>
                          <MapPin size={12} />
                          {job.isRemote ? 'Từ xa' : job.location || 'Làm tại chỗ'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredJobs.length > 0 && totalPages > 1 && (
              <div className="oplog__pagination">
                <button
                  type="button"
                  className="oplog__pagination-btn"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft size={14} />
                  Trước
                </button>
                <div className="oplog__pagination-pages">
                  {Array.from({ length: totalPages }, (_, page) => (
                    <button
                      key={page}
                      type="button"
                      className={`oplog__pagination-page ${currentPage === page ? 'is-active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page + 1}
                    </button>
                  ))}
                </div>
                <div className="oplog__pagination-meta">
                  <span>Trang {currentPage + 1}/{totalPages}</span>
                  <strong>{filteredJobs.length} chiến dịch</strong>
                </div>
                <button
                  type="button"
                  className="oplog__pagination-btn"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  Sau
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className={`oplog__detail-panel ${selectedJob ? '' : 'is-empty'}`}>
          {selectedJob ? (
            <>
              <div className="oplog__detail-head">
                <div>
                  <span className={`oplog__badge oplog__badge--${selectedMeta?.tone}`}>
                    {selectedMeta?.label}
                  </span>
                  <h3>{selectedJob.title}</h3>
                  <div className="oplog__detail-meta">
                    <span>
                      <Building2 size={12} />
                      {selectedJob.recruiterCompanyName}
                    </span>
                    <span>
                      <Clock3 size={12} />
                      {formatRelative(selectedJob.updatedAt)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="oplog__icon-btn"
                  onClick={() => {
                    setSelectedJob(null);
                    setActiveSection('detail');
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="oplog__tabs">
                <button
                  type="button"
                  className={activeSection === 'detail' ? 'is-active' : ''}
                  onClick={() => setActiveSection('detail')}
                >
                  <FileText size={13} />
                  Tổng quan
                </button>
                {selectedJob.status === JobStatus.CLOSED && (
                  <button
                    type="button"
                    className={activeSection === 'edit' ? 'is-active' : ''}
                    onClick={() => openEdit(selectedJob)}
                  >
                    <Edit3 size={13} />
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {activeSection === 'detail' ? (
                <div className="oplog__detail-body">
                  <div className="oplog__metrics">
                    <article className="oplog__metric" data-tone="cyan">
                      <Wallet size={15} />
                      <span>Ngân sách</span>
                      <strong>
                        {selectedJob.isNegotiable
                          ? 'Thỏa thuận'
                          : `${formatCurrency(selectedJob.minBudget)} - ${formatCurrency(selectedJob.maxBudget)}`}
                      </strong>
                    </article>
                    <article className="oplog__metric" data-tone={selectedDeadline?.tone}>
                      <CalendarDays size={15} />
                      <span>Hạn chót</span>
                      <strong>{formatDate(selectedJob.deadline)}</strong>
                      <small>{selectedDeadline?.label}</small>
                    </article>
                    <article className="oplog__metric" data-tone="violet">
                      <Users size={15} />
                      <span>Ứng viên</span>
                      <strong>{selectedJob.applicantCount || 0}</strong>
                    </article>
                    <article className="oplog__metric" data-tone="emerald">
                      <MapPin size={15} />
                      <span>Hình thức</span>
                      <strong>{selectedJob.isRemote ? 'Từ xa / linh hoạt' : selectedJob.location || 'Làm tại chỗ'}</strong>
                    </article>
                  </div>

                  <div className="oplog__cards">
                    <article className="oplog__card oplog__card--cyan oplog__card--wide">
                      <div className="oplog__card-head">
                        <FileText size={15} />
                        <div>
                          <h4>Tóm tắt chiến dịch</h4>
                          <p>{selectedMeta?.desc}</p>
                        </div>
                      </div>
                      <div className="oplog__section-split">
                        <div className="oplog__markdown-panel">
                          <JobMarkdownSurface
                            content={selectedJob.description}
                            density="detail"
                            theme={getMarkdownTheme(selectedMeta?.tone || 'cyan')}
                            className="oplog__markdown"
                            placeholder="Chiến dịch này chưa có mô tả chi tiết."
                          />
                        </div>
                        <div className="oplog__timeline">
                          <div>
                            <span>Ngày tạo</span>
                            <strong>{formatDateTime(selectedJob.createdAt)}</strong>
                          </div>
                          <div>
                            <span>Cập nhật cuối</span>
                            <strong>{formatDateTime(selectedJob.updatedAt)}</strong>
                          </div>
                        </div>
                      </div>
                    </article>

                    <article className="oplog__card oplog__card--violet">
                      <div className="oplog__card-head">
                        <BriefcaseBusiness size={15} />
                        <div>
                          <h4>Thông tin vận hành</h4>
                          <p>Thông số cốt lõi của chiến dịch hiện tại</p>
                        </div>
                      </div>
                      <div className="oplog__info oplog__info--horizontal">
                        <div><span>Kinh nghiệm</span><strong>{selectedJob.experienceLevel || 'Chưa cập nhật'}</strong></div>
                        <div><span>Loại hình</span><strong>{selectedJob.jobType || 'Chưa cập nhật'}</strong></div>
                        <div><span>Số lượng</span><strong>{selectedJob.hiringQuantity ? `${selectedJob.hiringQuantity} người` : 'Chưa cập nhật'}</strong></div>
                        <div><span>Giới tính</span><strong>{selectedJob.genderRequirement || 'Không yêu cầu'}</strong></div>
                      </div>
                    </article>

                    <article className="oplog__card oplog__card--emerald">
                      <div className="oplog__card-head">
                        <Sparkles size={15} />
                        <div>
                          <h4>Kỹ năng và phúc lợi</h4>
                          <p>Kỹ năng và quyền lợi</p>
                        </div>
                      </div>
                      <div className="oplog__skills">
                        {selectedJob.requiredSkills.length > 0 ? (
                          selectedJob.requiredSkills.map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))
                        ) : (
                          <em>Chưa có kỹ năng yêu cầu</em>
                        )}
                      </div>
                      {selectedJob.benefits && (
                        <p className="oplog__copy oplog__copy--small">{selectedJob.benefits}</p>
                      )}
                    </article>

                    <article className="oplog__card oplog__card--rose oplog__card--wide">
                      <div className="oplog__card-head">
                        <Activity size={15} />
                        <div>
                          <h4>Thao tác điều hành</h4>
                          <p>Thao tác điều hành chiến dịch theo trạng thái hiện tại</p>
                        </div>
                      </div>
                      <div className="oplog__actions">
                        <button type="button" className="oplog-btn oplog-btn--primary" onClick={() => setShowApplicantsModal(true)}>
                          <Users size={14} />
                          Xem ứng viên
                        </button>
                        {selectedJob.status === JobStatus.OPEN && (
                          <button type="button" className="oplog-btn oplog-btn--warning" onClick={() => setCloseModal({ visible: true, jobId: selectedJob.id })}>
                            <XCircle size={14} />
                            Đóng chiến dịch
                          </button>
                        )}
                        {selectedJob.status === JobStatus.CLOSED && (
                          <>
                            <button
                              type="button"
                              className="oplog-btn oplog-btn--success"
                              onClick={() => {
                                const nextDeadline = new Date();
                                nextDeadline.setDate(nextDeadline.getDate() + 30);
                                setReopenModal({
                                  visible: true,
                                  jobId: selectedJob.id,
                                  deadline: toInputDate(nextDeadline),
                                  clearApplications: true,
                                  isFree:
                                    (Date.now() - new Date(selectedJob.updatedAt).getTime()) /
                                      60000 <=
                                    5,
                                });
                              }}
                            >
                              <RotateCcw size={14} />
                              Mở lại
                            </button>
                            <button type="button" className="oplog-btn oplog-btn--secondary" onClick={() => openEdit(selectedJob)}>
                              <Edit3 size={14} />
                              Chỉnh sửa
                            </button>
                          </>
                        )}
                        <button type="button" className="oplog-btn oplog-btn--danger" onClick={() => handleDelete(selectedJob.id)}>
                          <Trash2 size={14} />
                          Hủy chiến dịch
                        </button>
                      </div>
                    </article>
                  </div>
                </div>
              ) : (
                <div className="oplog__detail-body">
                  <div className="oplog__edit-intro">
                    <span className="oplog__eyebrow oplog__eyebrow--small">
                      <Edit3 size={12} />
                      Bảng chỉnh sửa
                    </span>
                    <h4>Tinh chỉnh chiến dịch</h4>
                    <p>Cập nhật nội dung, ngân sách và kỹ năng trước khi tái sử dụng.</p>
                  </div>

                  <div className="oplog__form">
                    <label className="oplog__field oplog__field--wide">
                      <span>Tiêu đề</span>
                      <input type="text" value={editForm.title} onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))} />
                    </label>
                    <label className="oplog__field oplog__field--wide">
                      <span>Mô tả</span>
                      <textarea rows={6} value={editForm.description} onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))} />
                    </label>
                    <label className="oplog__field">
                      <span>Lương tối thiểu</span>
                      <input type="number" value={editForm.minBudget} onChange={(event) => setEditForm((prev) => ({ ...prev, minBudget: event.target.value }))} />
                    </label>
                    <label className="oplog__field">
                      <span>Lương tối đa</span>
                      <input type="number" value={editForm.maxBudget} onChange={(event) => setEditForm((prev) => ({ ...prev, maxBudget: event.target.value }))} />
                    </label>
                    <label className="oplog__field">
                      <span>Hạn chót</span>
                      <input type="date" value={editForm.deadline} onChange={(event) => setEditForm((prev) => ({ ...prev, deadline: event.target.value }))} />
                    </label>
                    <label className="oplog__field">
                      <span>Kỹ năng</span>
                      <input type="text" value={editForm.skillsInput} onChange={(event) => setEditForm((prev) => ({ ...prev, skillsInput: event.target.value }))} />
                    </label>
                    <div className="oplog__field oplog__field--wide">
                      <span>Hình thức làm việc</span>
                      <div className="oplog__toggle">
                        <button type="button" className={editForm.isRemote ? 'is-active' : ''} onClick={() => setEditForm((prev) => ({ ...prev, isRemote: true, location: '' }))}>
                          Từ xa / linh hoạt
                        </button>
                        <button type="button" className={!editForm.isRemote ? 'is-active' : ''} onClick={() => setEditForm((prev) => ({ ...prev, isRemote: false }))}>
                          Làm tại chỗ
                        </button>
                      </div>
                    </div>
                    {!editForm.isRemote && (
                      <label className="oplog__field oplog__field--wide">
                        <span>Địa điểm</span>
                        <input type="text" value={editForm.location} onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))} />
                      </label>
                    )}
                  </div>

                  <div className="oplog__actions">
                    <button type="button" className="oplog-btn oplog-btn--ghost" onClick={() => setActiveSection('detail')}>
                      <X size={14} />
                      Hủy
                    </button>
                    <button type="button" className="oplog-btn oplog-btn--success" onClick={handleSaveEdit}>
                      <Check size={14} />
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="oplog__empty">
              <div className="oplog__empty-orb">
                <Sparkles size={28} />
              </div>
              <span className="oplog__eyebrow oplog__eyebrow--small">
                <FileText size={12} />
                Bảng chi tiết
              </span>
              <h3>Chọn một chiến dịch để xem bảng điều khiển chi tiết</h3>
              <p>
                Mỗi chiến dịch sẽ mở ra đầy đủ trạng thái, hạn chót, yêu cầu và
                các thao tác xử lý tập trung trong một luồng theo dõi rõ ràng.
              </p>
            </div>
          )}
        </section>
      </div>

      {showApplicantsModal && selectedJob && (
        <ApplicantsModal
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          onClose={() => setShowApplicantsModal(false)}
          onChanged={() => setLocalRefreshTrigger((prev) => prev + 1)}
          refreshTrigger={localRefreshTrigger}
        />
      )}

      {closeModal.visible && (
        <div className="oplog-modal-overlay" onClick={() => setCloseModal({ visible: false, jobId: null })}>
          <div className="oplog-modal" onClick={(event) => event.stopPropagation()}>
            <div className="oplog-modal__head">
              <div className="oplog-modal__icon oplog-modal__icon--rose">
                <XCircle size={18} />
              </div>
              <div>
                <span>Đóng chiến dịch</span>
                <h3>Xác nhận đóng chiến dịch</h3>
                <p>Ứng viên sẽ không thể nộp thêm hồ sơ mới sau thao tác này.</p>
              </div>
              <button type="button" className="oplog__icon-btn" onClick={() => setCloseModal({ visible: false, jobId: null })}>
                <X size={14} />
              </button>
            </div>
            <div className="oplog-modal__body">
              <ul>
                <li>Luồng nộp hồ sơ mới sẽ bị khóa.</li>
                <li>Trạng thái chiến dịch chuyển sang Đã đóng.</li>
                <li>Bạn vẫn có thể mở lại chiến dịch nếu cần.</li>
              </ul>
            </div>
            <div className="oplog-modal__actions">
              <button type="button" className="oplog-btn oplog-btn--ghost" onClick={() => setCloseModal({ visible: false, jobId: null })}>Hủy</button>
              <button type="button" className="oplog-btn oplog-btn--danger" onClick={confirmClose}>
                <XCircle size={14} />
                Xác nhận đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {reopenModal.visible && (
        <div
          className="oplog-modal-overlay"
          onClick={() =>
            setReopenModal({
              visible: false,
              jobId: null,
              deadline: '',
              clearApplications: true,
              isFree: false,
            })
          }
        >
          <div className="oplog-modal" onClick={(event) => event.stopPropagation()}>
            <div className="oplog-modal__head">
              <div className="oplog-modal__icon oplog-modal__icon--emerald">
                <RotateCcw size={18} />
              </div>
              <div>
                <span>Mở lại chiến dịch</span>
                <h3>Mở lại chiến dịch</h3>
                <p>Thiết lập deadline mới để chiến dịch tiếp tục nhận hồ sơ.</p>
              </div>
              <button
                type="button"
                className="oplog__icon-btn"
                onClick={() =>
                  setReopenModal({
                    visible: false,
                    jobId: null,
                    deadline: '',
                    clearApplications: true,
                    isFree: false,
                  })
                }
              >
                <X size={14} />
              </button>
            </div>
            <div className={`oplog-modal__notice ${reopenModal.isFree ? 'is-free' : 'is-paid'}`}>
              <strong>{reopenModal.isFree ? 'Miễn phí trong thời gian ân hạn' : 'Phí mở lại: 20.000 VNĐ'}</strong>
              <p>
                {reopenModal.isFree
                  ? 'Mở lại trong vòng 5 phút nên không bị tính phí.'
                  : 'Phí sẽ được trừ trực tiếp từ ví khi xác nhận mở lại.'}
              </p>
            </div>
            <div className="oplog-modal__body">
              <label className="oplog__field oplog__field--wide">
                <span>Hạn chót mới</span>
                <input
                  type="date"
                  value={reopenModal.deadline}
                  min={minReopenDate}
                  onChange={(event) =>
                    setReopenModal((prev) => ({ ...prev, deadline: event.target.value }))
                  }
                />
              </label>
              <label className="oplog__check">
                <input
                  type="checkbox"
                  checked={reopenModal.clearApplications}
                  onChange={(event) =>
                    setReopenModal((prev) => ({
                      ...prev,
                      clearApplications: event.target.checked,
                    }))
                  }
                />
                <span>Xóa danh sách ứng viên cũ trước khi mở lại</span>
              </label>
            </div>
            <div className="oplog-modal__actions">
              <button
                type="button"
                className="oplog-btn oplog-btn--ghost"
                onClick={() =>
                  setReopenModal({
                    visible: false,
                    jobId: null,
                    deadline: '',
                    clearApplications: true,
                    isFree: false,
                  })
                }
              >
                Hủy
              </button>
              <button type="button" className="oplog-btn oplog-btn--success" onClick={confirmReopen}>
                <Check size={14} />
                Xác nhận mở lại
              </button>
            </div>
          </div>
        </div>
      )}

      {validationModal.visible && (
        <div
          className="oplog-modal-overlay"
          onClick={() => setValidationModal({ visible: false, title: '', messages: [] })}
        >
          <div
            className="oplog-modal oplog-modal--validation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="oplog-modal__head">
              <div className="oplog-modal__icon oplog-modal__icon--amber">
                <AlertTriangle size={18} />
              </div>
              <div>
                <span>Cần điều chỉnh trước khi lưu</span>
                <h3>{validationModal.title}</h3>
                <p>
                  Hệ thống chưa thể lưu chiến dịch vì một vài thông tin còn chưa phù hợp.
                  Hãy chỉnh lại các mục dưới đây rồi thử lưu lại.
                </p>
              </div>
              <button
                type="button"
                className="oplog__icon-btn"
                onClick={() => setValidationModal({ visible: false, title: '', messages: [] })}
              >
                <X size={14} />
              </button>
            </div>
            <div className="oplog-modal__body">
              <div className="oplog-validation">
                {validationModal.messages.map((message, index) => (
                  <div key={`${index}-${message}`} className="oplog-validation__item">
                    <span>{index + 1}</span>
                    <p>{message}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="oplog-modal__actions">
              <button
                type="button"
                className="oplog-btn oplog-btn--warning"
                onClick={() => setValidationModal({ visible: false, title: '', messages: [] })}
              >
                Tôi sẽ chỉnh lại
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OperationLog;
