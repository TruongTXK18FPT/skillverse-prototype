import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Filter,
  Gauge,
  HelpCircle,
  LineChart,
  Map as MapIcon,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import './AnalyticsTab.css';
import adminService from '../../services/adminService';
import adminUserService from '../../services/adminUserService';
import { paymentService } from '../../services/paymentService';
import { listAllCoursesAdmin } from '../../services/courseService';
import supportService, { TicketResponse } from '../../services/supportService';
import aiRoadmapService from '../../services/aiRoadmapService';
import { AdminUserResponse } from '../../types/adminUser';
import { PaymentTransactionResponse } from '../../data/paymentDTOs';
import { JobPostingResponse } from '../../data/jobDTOs';
import { CourseSummaryDTO } from '../../data/courseDTOs';
import { RoadmapSessionSummary } from '../../types/Roadmap';

type DatePreset = '7days' | '30days' | '90days' | 'thisMonth' | 'custom';
type RevenueView = 'daily' | 'weekly' | 'monthly' | 'yearly';
type RevenueChartType = 'bar' | 'area';

interface AnalyticsDataset {
  users: AdminUserResponse[];
  transactions: PaymentTransactionResponse[];
  jobs: JobPostingResponse[];
  courses: CourseSummaryDTO[];
  tickets: TicketResponse[];
  roadmaps: RoadmapSessionSummary[];
}

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  dataset: AnalyticsDataset;
}

interface DistributionItem {
  label: string;
  value: number;
  tone: string;
}

interface RevenuePoint {
  label: string;
  fullLabel: string;
  revenue: number;
  transactions: number;
}

interface SystemTrendPoint {
  label: string;
  fullLabel: string;
  users: number;
  jobs: number;
  courses: number;
  tickets: number;
  roadmaps: number;
  transactions: number;
}

interface QuickActionItem {
  key: string;
  title: string;
  description: string;
  value: number;
  tone: string;
  actionLabel: string;
  onClick: () => void;
}

const EMPTY_DATASET: AnalyticsDataset = {
  users: [],
  transactions: [],
  jobs: [],
  courses: [],
  tickets: [],
  roadmaps: [],
};

const PRESET_LABELS: Record<DatePreset, string> = {
  '7days': '7 ngày gần đây',
  '30days': '30 ngày gần đây',
  '90days': '90 ngày gần đây',
  thisMonth: 'Tháng này',
  custom: 'Tùy chỉnh',
};

const numberFormatter = new Intl.NumberFormat('vi-VN');
const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatNumber = (value: number) => numberFormatter.format(value);
const formatCurrency = (value: number | string) => {
  const normalized = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(normalized)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(normalized);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const toInputDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
};

const startOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const getPresetDates = (preset: Exclude<DatePreset, 'custom'>) => {
  const now = new Date();
  const end = endOfDay(now);
  const start = startOfDay(now);

  if (preset === '7days') {
    start.setDate(start.getDate() - 6);
  }

  if (preset === '30days') {
    start.setDate(start.getDate() - 29);
  }

  if (preset === '90days') {
    start.setDate(start.getDate() - 89);
  }

  if (preset === 'thisMonth') {
    start.setDate(1);
  }

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
};

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const isWithinRange = (value: string | undefined, start: string, end: string) => {
  const date = parseDate(value);
  if (!date) {
    return false;
  }

  const min = startOfDay(new Date(start));
  const max = endOfDay(new Date(end));
  return date >= min && date <= max;
};

const buildDonutGradient = (items: DistributionItem[]) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return 'conic-gradient(rgba(148, 163, 184, 0.18) 0deg 360deg)';
  }

  let current = 0;
  const slices = items.map((item) => {
    const start = current;
    current += (item.value / total) * 360;
    return `${item.tone} ${start}deg ${current}deg`;
  });

  return `conic-gradient(${slices.join(', ')})`;
};

const getWeekStart = (date: Date) => {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
};

const getPeriodMeta = (date: Date, mode: RevenueView) => {
  if (mode === 'daily') {
    return {
      key: toInputDate(date),
      label: new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date),
      fullLabel: dateFormatter.format(date),
    };
  }

  if (mode === 'weekly') {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      key: toInputDate(weekStart),
      label: `Tuần ${new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(weekStart)}`,
      fullLabel: `${dateFormatter.format(weekStart)} - ${dateFormatter.format(weekEnd)}`,
    };
  }

  if (mode === 'monthly') {
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: `T${date.getMonth() + 1}/${date.getFullYear()}`,
      fullLabel: `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`,
    };
  }

  return {
    key: String(date.getFullYear()),
    label: `Năm ${date.getFullYear()}`,
    fullLabel: `Năm ${date.getFullYear()}`,
  };
};

const groupRevenue = (transactions: PaymentTransactionResponse[], mode: RevenueView): RevenuePoint[] => {
  const grouped = new Map<string, RevenuePoint>();

  transactions
    .filter((transaction) => transaction.status === 'COMPLETED')
    .forEach((transaction) => {
      const date = parseDate(transaction.createdAt);
      if (!date) {
        return;
      }

      const { key, label, fullLabel } = getPeriodMeta(date, mode);

      const current = grouped.get(key) ?? {
        label,
        fullLabel,
        revenue: 0,
        transactions: 0,
      };

      current.revenue += Number.parseFloat(transaction.amount) || 0;
      current.transactions += 1;
      grouped.set(key, current);
    });

  return Array.from(grouped.entries())
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([, value]) => value);
};

const groupSystemTrend = (
  dataset: Pick<AnalyticsDataset, 'users' | 'jobs' | 'courses' | 'tickets' | 'roadmaps' | 'transactions'>,
  mode: RevenueView,
): SystemTrendPoint[] => {
  const grouped = new Map<string, SystemTrendPoint>();

  const register = (
    dateValue: string | undefined,
    field: keyof Omit<SystemTrendPoint, 'label' | 'fullLabel'>,
  ) => {
    const date = parseDate(dateValue);
    if (!date) {
      return;
    }

    const { key, label, fullLabel } = getPeriodMeta(date, mode);
    const current = grouped.get(key) ?? {
      label,
      fullLabel,
      users: 0,
      jobs: 0,
      courses: 0,
      tickets: 0,
      roadmaps: 0,
      transactions: 0,
    };

    current[field] += 1;
    grouped.set(key, current);
  };

  dataset.users.forEach((user) => register(user.createdAt, 'users'));
  dataset.jobs.forEach((job) => register(job.createdAt, 'jobs'));
  dataset.courses.forEach((course) => register(course.createdAt, 'courses'));
  dataset.tickets.forEach((ticket) => register(ticket.createdAt, 'tickets'));
  dataset.roadmaps.forEach((roadmap) => register(roadmap.createdAt, 'roadmaps'));
  dataset.transactions.forEach((transaction) => register(transaction.createdAt, 'transactions'));

  return Array.from(grouped.entries())
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([, value]) => value);
};

const fetchAllTransactions = async () => {
  const pageSize = 200;
  const firstPage = await paymentService.adminGetAllTransactions(0, pageSize);
  let items = firstPage.content;

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await paymentService.adminGetAllTransactions(page, pageSize);
    items = items.concat(nextPage.content);
  }

  return items;
};

const fetchAllAdminJobs = async () => {
  const pageSize = 200;
  const firstPage = await adminService.getAllJobs({ page: 0, size: pageSize });
  let items = firstPage.content as JobPostingResponse[];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await adminService.getAllJobs({ page, size: pageSize });
    items = items.concat(nextPage.content as JobPostingResponse[]);
  }

  return items;
};

const fetchAllTickets = async () => {
  const pageSize = 200;
  const firstPage = await supportService.getAllTickets({ page: 0, size: pageSize });
  let items = firstPage.content;

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await supportService.getAllTickets({ page, size: pageSize });
    items = items.concat(nextPage.content);
  }

  return items;
};

const fetchAllAdminCourses = async () => {
  const pageSize = 200;
  const firstPage = await listAllCoursesAdmin(0, pageSize);
  let items = firstPage.content;

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await listAllCoursesAdmin(page, pageSize);
    items = items.concat(nextPage.content);
  }

  return items;
};

const AnalyticsTab: React.FC = () => {
  const navigate = useNavigate();
  const initialPreset = getPresetDates('30days');
  const [datePreset, setDatePreset] = useState<DatePreset>('30days');
  const [startDate, setStartDate] = useState(initialPreset.startDate);
  const [endDate, setEndDate] = useState(initialPreset.endDate);
  const [revenueView, setRevenueView] = useState<RevenueView>('daily');
  const [revenueChartType, setRevenueChartType] = useState<RevenueChartType>('area');
  const [state, setState] = useState<AnalyticsState>({
    loading: true,
    error: null,
    dataset: EMPTY_DATASET,
  });

  const fetchAnalytics = useCallback(async () => {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const [usersResult, transactionsResult, jobsResult, coursesResult, ticketsResult, roadmapsResult] =
        await Promise.allSettled([
          adminUserService.getAllUsers(),
          fetchAllTransactions(),
          fetchAllAdminJobs(),
          fetchAllAdminCourses(),
          fetchAllTickets(),
          aiRoadmapService.getAllRoadmaps(),
        ]);

      setState({
        loading: false,
        error: null,
        dataset: {
          users: usersResult.status === 'fulfilled' ? usersResult.value.users : [],
          transactions: transactionsResult.status === 'fulfilled' ? transactionsResult.value : [],
          jobs: jobsResult.status === 'fulfilled' ? jobsResult.value : [],
          courses: coursesResult.status === 'fulfilled' ? coursesResult.value : [],
          tickets: ticketsResult.status === 'fulfilled' ? ticketsResult.value : [],
          roadmaps: roadmapsResult.status === 'fulfilled' ? roadmapsResult.value : [],
        },
      });
    } catch (error) {
      console.error('Không thể tải dữ liệu analytics:', error);
      setState({
        loading: false,
        error: 'Không thể tải dữ liệu thống kê. Vui lòng thử lại.',
        dataset: EMPTY_DATASET,
      });
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);

    if (preset === 'custom') {
      return;
    }

    const nextRange = getPresetDates(preset);
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
  };

  const handleStartDateChange = (value: string) => {
    setDatePreset('custom');
    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setDatePreset('custom');
    setEndDate(value);
  };

  const safeStartDate = startDate <= endDate ? startDate : endDate;
  const safeEndDate = endDate >= startDate ? endDate : startDate;

  const filteredUsers = state.dataset.users.filter((user) => isWithinRange(user.createdAt, safeStartDate, safeEndDate));
  const filteredTransactions = state.dataset.transactions.filter((transaction) =>
    isWithinRange(transaction.createdAt, safeStartDate, safeEndDate),
  );
  const filteredJobs = state.dataset.jobs.filter((job) => isWithinRange(job.createdAt, safeStartDate, safeEndDate));
  const filteredCourses = state.dataset.courses.filter((course) => isWithinRange(course.createdAt, safeStartDate, safeEndDate));
  const filteredTickets = state.dataset.tickets.filter((ticket) => isWithinRange(ticket.createdAt, safeStartDate, safeEndDate));
  const filteredRoadmaps = state.dataset.roadmaps.filter((roadmap) => isWithinRange(roadmap.createdAt, safeStartDate, safeEndDate));

  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter((user) => user.status === 'ACTIVE').length;
  const totalMentors = filteredUsers.filter((user) => user.primaryRole === 'MENTOR').length;
  const totalRecruiters = filteredUsers.filter((user) => user.primaryRole === 'RECRUITER').length;
  const totalLearners = filteredUsers.filter((user) => user.primaryRole === 'USER').length;

  const completedTransactions = filteredTransactions.filter((transaction) => transaction.status === 'COMPLETED');
  const completedCount = completedTransactions.length;
  const processingCount = filteredTransactions.filter(
    (transaction) => transaction.status === 'PENDING' || transaction.status === 'PROCESSING',
  ).length;
  const failedCount = filteredTransactions.filter(
    (transaction) =>
      transaction.status === 'FAILED' || transaction.status === 'CANCELLED' || transaction.status === 'REFUNDED',
  ).length;
  const totalRevenue = completedTransactions.reduce(
    (sum, transaction) => sum + (Number.parseFloat(transaction.amount) || 0),
    0,
  );

  const openTickets = filteredTickets.filter((ticket) => ticket.status === 'PENDING').length;
  const respondedTickets = filteredTickets.filter((ticket) => ticket.status === 'RESPONDED').length;
  const inProgressTickets = filteredTickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
  const resolvedTickets = filteredTickets.filter((ticket) => ticket.status === 'COMPLETED').length;
  const closedTickets = filteredTickets.filter((ticket) => ticket.status === 'CLOSED').length;

  const completedRoadmaps = filteredRoadmaps.filter((roadmap) => (roadmap.progressPercentage || 0) >= 100).length;

  const successRate = filteredTransactions.length > 0 ? (completedCount / filteredTransactions.length) * 100 : 0;
  const activationRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const resolutionRate = filteredTickets.length > 0 ? ((resolvedTickets + closedTickets) / filteredTickets.length) * 100 : 0;
  const roadmapCompletionRate = filteredRoadmaps.length > 0 ? (completedRoadmaps / filteredRoadmaps.length) * 100 : 0;
  const averageTransactionValue = completedCount > 0 ? totalRevenue / completedCount : 0;
  const pendingJobsTotal = state.dataset.jobs.filter((job) => job.status === 'PENDING_APPROVAL').length;
  const pendingCoursesTotal = state.dataset.courses.filter((course) => course.status === 'PENDING').length;
  const pendingTicketsTotal = state.dataset.tickets.filter((ticket) => ticket.status === 'PENDING').length;
  const filteredSystemTrendData = groupSystemTrend(
    {
      users: filteredUsers,
      jobs: filteredJobs,
      courses: filteredCourses,
      tickets: filteredTickets,
      roadmaps: filteredRoadmaps,
      transactions: filteredTransactions,
    },
    revenueView,
  );
  const annualRevenueData = groupRevenue(state.dataset.transactions, 'yearly');
  const annualSystemTrendData = groupSystemTrend(state.dataset, 'yearly');

  const userDistribution: DistributionItem[] = [
    { label: 'Học viên', value: totalLearners, tone: '#22d3ee' },
    { label: 'Mentor', value: totalMentors, tone: '#8b5cf6' },
    { label: 'Nhà tuyển dụng', value: totalRecruiters, tone: '#f97316' },
  ];

  const transactionDistribution: DistributionItem[] = [
    { label: 'Thành công', value: completedCount, tone: '#2dd4bf' },
    { label: 'Đang xử lý', value: processingCount, tone: '#fbbf24' },
    { label: 'Lỗi hoặc hủy', value: failedCount, tone: '#fb7185' },
  ];

  const ticketDistribution: DistributionItem[] = [
    { label: 'Mở mới', value: openTickets, tone: '#f59e0b' },
    { label: 'Đã phản hồi', value: respondedTickets, tone: '#38bdf8' },
    { label: 'Đang xử lý', value: inProgressTickets, tone: '#8b5cf6' },
    { label: 'Đã giải quyết', value: resolvedTickets, tone: '#22c55e' },
    { label: 'Đã đóng', value: closedTickets, tone: '#94a3b8' },
  ];

  const contentDistribution: DistributionItem[] = [
    { label: 'Khóa học', value: filteredCourses.length, tone: '#60a5fa' },
    { label: 'Việc làm', value: filteredJobs.length, tone: '#f472b6' },
    { label: 'Roadmap', value: filteredRoadmaps.length, tone: '#34d399' },
    { label: 'Ticket', value: filteredTickets.length, tone: '#f59e0b' },
  ];

  const revenueData = groupRevenue(filteredTransactions, revenueView);
  const dashboardHealth = ((successRate + activationRate + resolutionRate + roadmapCompletionRate) / 4) || 0;
  const quickActions: QuickActionItem[] = [
    {
      key: 'jobs-approve',
      title: 'Tin tuyển dụng cần duyệt',
      description: 'Mở thẳng tab Tuyển dụng ở phân khu chờ duyệt để xử lý ngay.',
      value: pendingJobsTotal,
      tone: '#f59e0b',
      actionLabel: 'Mở khu duyệt jobs',
      onClick: () => navigate('/admin?tab=jobs&subTab=approve'),
    },
    {
      key: 'courses-approve',
      title: 'Khóa học cần duyệt',
      description: 'Đi tới danh sách khóa học chờ duyệt để xét duyệt hoặc phản hồi.',
      value: pendingCoursesTotal,
      tone: '#60a5fa',
      actionLabel: 'Mở tab khóa học',
      onClick: () => navigate('/admin?tab=courses&status=PENDING'),
    },
    {
      key: 'support-open',
      title: 'Support ticket mới',
      description: 'Lọc ngay các ticket đang chờ để admin route và phản hồi nhanh.',
      value: pendingTicketsTotal,
      tone: '#fb7185',
      actionLabel: 'Mở tab hỗ trợ',
      onClick: () => navigate('/admin?tab=support&status=PENDING'),
    },
  ];

  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string,
    detail: string,
    tone: string,
  ) => (
    <article className="sv-admin-analytics__metric-card" style={{ ['--metric-tone' as string]: tone }}>
      <div className="sv-admin-analytics__metric-icon">{icon}</div>
      <div className="sv-admin-analytics__metric-content">
        <span className="sv-admin-analytics__metric-label">{title}</span>
        <strong className="sv-admin-analytics__metric-value">{value}</strong>
        <span className="sv-admin-analytics__metric-detail">{detail}</span>
      </div>
      <div className="sv-admin-analytics__metric-glow" />
    </article>
  );

  const renderLegend = (items: DistributionItem[], total: number) => (
    <div className="sv-admin-analytics__legend">
      {items.map((item) => (
        <div className="sv-admin-analytics__legend-item" key={item.label}>
          <span className="sv-admin-analytics__legend-dot" style={{ background: item.tone }} />
          <span className="sv-admin-analytics__legend-label">{item.label}</span>
          <span className="sv-admin-analytics__legend-value">
            {formatNumber(item.value)}
            {total > 0 ? ` • ${formatPercent((item.value / total) * 100)}` : ''}
          </span>
        </div>
      ))}
    </div>
  );

  if (state.loading) {
    return (
      <div className="sv-admin-analytics sv-admin-analytics--loading">
        <div className="sv-admin-analytics__loading-shell">
          <MeowlKuruLoader size="large" text="" />
          <p>Đang đồng bộ dữ liệu analytics theo thời gian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sv-admin-analytics">
      <section className="sv-admin-analytics__hero">
        <div className="sv-admin-analytics__hero-copy">
          <div className="sv-admin-analytics__badge">
            <Sparkles size={14} />
            Analytics admin neon tech
          </div>
          <h1>Phân tích tổng quan theo khoảng ngày</h1>
          <p>
            Bảng điều khiển này tổng hợp dữ liệu người dùng, giao dịch, khóa học, tin tuyển dụng, support ticket và
            roadmap để admin theo dõi tăng trưởng, hàng đợi cần duyệt và nhịp vận hành của toàn hệ thống.
          </p>
        </div>

        <div className="sv-admin-analytics__filters">
          <div className="sv-admin-analytics__filter-header">
            <Filter size={18} />
            <span>Bộ lọc thời gian</span>
          </div>

          <div className="sv-admin-analytics__preset-list">
            {(['7days', '30days', '90days', 'thisMonth', 'custom'] as DatePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                className={`sv-admin-analytics__preset-chip ${datePreset === preset ? 'is-active' : ''}`}
                onClick={() => handlePresetChange(preset)}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>

          <div className="sv-admin-analytics__date-grid">
            <label className="sv-admin-analytics__date-field">
              <span>Từ ngày</span>
              <input type="date" value={safeStartDate} onChange={(event) => handleStartDateChange(event.target.value)} />
            </label>
            <label className="sv-admin-analytics__date-field">
              <span>Đến ngày</span>
              <input type="date" value={safeEndDate} onChange={(event) => handleEndDateChange(event.target.value)} />
            </label>
          </div>

          <div className="sv-admin-analytics__filter-footer">
            <div className="sv-admin-analytics__range-note">
              <CalendarRange size={16} />
              <span>
                {dateFormatter.format(new Date(safeStartDate))} - {dateFormatter.format(new Date(safeEndDate))}
              </span>
            </div>
            <button type="button" className="sv-admin-analytics__refresh-button" onClick={fetchAnalytics}>
              <RefreshCw size={16} />
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </section>

      {state.error ? <div className="sv-admin-analytics__error">{state.error}</div> : null}

      <section className="sv-admin-analytics__metrics">
        {renderMetricCard(
          <Users size={24} />,
          'Người dùng mới',
          formatNumber(totalUsers),
          `${formatNumber(activeUsers)} tài khoản đang hoạt động`,
          '#22d3ee',
        )}
        {renderMetricCard(
          <CreditCard size={24} />,
          'Doanh thu thành công',
          formatCurrency(totalRevenue),
          `${formatNumber(completedCount)} giao dịch hoàn tất`,
          '#2dd4bf',
        )}
        {renderMetricCard(
          <BookOpen size={24} />,
          'Khóa học phát sinh',
          formatNumber(filteredCourses.length),
          'Tính theo ngày tạo khóa học',
          '#60a5fa',
        )}
        {renderMetricCard(
          <Briefcase size={24} />,
          'Tin tuyển dụng',
          formatNumber(filteredJobs.length),
          'Tính theo ngày đăng tuyển',
          '#f472b6',
        )}
        {renderMetricCard(
          <Ticket size={24} />,
          'Support ticket',
          formatNumber(filteredTickets.length),
          `${formatNumber(openTickets)} ticket đang mở`,
          '#f59e0b',
        )}
        {renderMetricCard(
          <MapIcon size={24} />,
          'Roadmap mới',
          formatNumber(filteredRoadmaps.length),
          `${formatPercent(roadmapCompletionRate)} tỷ lệ hoàn thành`,
          '#34d399',
        )}
        {renderMetricCard(
          <ShieldCheck size={24} />,
          'Tỷ lệ xử lý ticket',
          formatPercent(resolutionRate),
          `${formatNumber(resolvedTickets + closedTickets)} ticket đã xử lý`,
          '#a78bfa',
        )}
        {renderMetricCard(
          <TrendingUp size={24} />,
          'Giá trị giao dịch TB',
          formatCurrency(averageTransactionValue),
          `${formatPercent(successRate)} tỷ lệ giao dịch thành công`,
          '#fb7185',
        )}
      </section>

      <section className="sv-admin-analytics__action-grid">
        {quickActions.map((item) => (
          <article className="sv-admin-analytics__action-card" key={item.key} style={{ ['--action-tone' as string]: item.tone }}>
            <div className="sv-admin-analytics__action-top">
              <div>
                <span className="sv-admin-analytics__action-label">{item.title}</span>
                <strong className="sv-admin-analytics__action-value">{formatNumber(item.value)}</strong>
              </div>
              <span className="sv-admin-analytics__action-badge">Queue</span>
            </div>
            <p>{item.description}</p>
            <button type="button" className="sv-admin-analytics__action-button" onClick={item.onClick}>
              {item.actionLabel}
              <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </section>

      <section className="sv-admin-analytics__board">
        <article className="sv-admin-analytics__panel sv-admin-analytics__panel--revenue">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Doanh thu chi tiết</span>
              <h2>Dòng tiền theo thời gian</h2>
            </div>
            <div className="sv-admin-analytics__toggle-group">
              <button
                type="button"
                className={revenueView === 'daily' ? 'is-active' : ''}
                onClick={() => setRevenueView('daily')}
              >
                Ngày
              </button>
              <button
                type="button"
                className={revenueView === 'weekly' ? 'is-active' : ''}
                onClick={() => setRevenueView('weekly')}
              >
                Tuần
              </button>
              <button
                type="button"
                className={revenueView === 'monthly' ? 'is-active' : ''}
                onClick={() => setRevenueView('monthly')}
              >
                Tháng
              </button>
              <button
                type="button"
                className={revenueView === 'yearly' ? 'is-active' : ''}
                onClick={() => setRevenueView('yearly')}
              >
                Năm
              </button>
            </div>
          </div>

          <div className="sv-admin-analytics__panel-actions">
            <button
              type="button"
              className={revenueChartType === 'area' ? 'is-active' : ''}
              onClick={() => setRevenueChartType('area')}
            >
              <LineChart size={15} />
              Area
            </button>
            <button
              type="button"
              className={revenueChartType === 'bar' ? 'is-active' : ''}
              onClick={() => setRevenueChartType('bar')}
            >
              <BarChart3 size={15} />
              Bar
            </button>
          </div>

          <div className="sv-admin-analytics__chart-shell">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                {revenueChartType === 'area' ? (
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sv-admin-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.75} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${Math.round(value / 1000000)}M`}
                    />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="sv-admin-analytics__tooltip">
                            <strong>{payload[0].payload.fullLabel}</strong>
                            <span>{formatCurrency(payload[0].payload.revenue)}</span>
                            <small>{formatNumber(payload[0].payload.transactions)} giao dịch</small>
                          </div>
                        ) : null
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      fill="url(#sv-admin-revenue-gradient)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sv-admin-revenue-bar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${Math.round(value / 1000000)}M`}
                    />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="sv-admin-analytics__tooltip">
                            <strong>{payload[0].payload.fullLabel}</strong>
                            <span>{formatCurrency(payload[0].payload.revenue)}</span>
                            <small>{formatNumber(payload[0].payload.transactions)} giao dịch</small>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="url(#sv-admin-revenue-bar)" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="sv-admin-analytics__empty">Không có giao dịch hoàn tất trong khoảng ngày đã chọn.</div>
            )}
          </div>

          <div className="sv-admin-analytics__revenue-foot">
            <div>
              <span>Tổng doanh thu</span>
              <strong>{formatCurrency(totalRevenue)}</strong>
            </div>
            <div>
              <span>Tổng giao dịch hoàn tất</span>
              <strong>{formatNumber(completedCount)}</strong>
            </div>
            <div>
              <span>Giá trị trung bình</span>
              <strong>{formatCurrency(averageTransactionValue)}</strong>
            </div>
          </div>
        </article>

        <article className="sv-admin-analytics__panel">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Cơ cấu người dùng</span>
              <h2>Phân bổ theo vai trò</h2>
            </div>
            <PieChart size={18} />
          </div>

          <div className="sv-admin-analytics__donut-layout">
            <div className="sv-admin-analytics__donut" style={{ background: buildDonutGradient(userDistribution) }}>
              <div className="sv-admin-analytics__donut-center">
                <strong>{formatNumber(totalUsers)}</strong>
                <span>Tài khoản</span>
              </div>
            </div>
            {renderLegend(userDistribution, totalUsers)}
          </div>
        </article>

        <article className="sv-admin-analytics__panel">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Vận hành thanh toán</span>
              <h2>Trạng thái giao dịch</h2>
            </div>
            <CreditCard size={18} />
          </div>

          <div className="sv-admin-analytics__stack-list">
            {transactionDistribution.map((item) => {
              const total = Math.max(filteredTransactions.length, 1);
              const width = `${(item.value / total) * 100}%`;

              return (
                <div className="sv-admin-analytics__stack-row" key={item.label}>
                  <div className="sv-admin-analytics__stack-meta">
                    <span>{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                  <div className="sv-admin-analytics__stack-track">
                    <div className="sv-admin-analytics__stack-fill" style={{ width, background: item.tone }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="sv-admin-analytics__panel">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Chăm sóc người dùng</span>
              <h2>Trạng thái ticket hỗ trợ</h2>
            </div>
            <HelpCircle size={18} />
          </div>

          <div className="sv-admin-analytics__stack-list">
            {ticketDistribution.map((item) => {
              const total = Math.max(filteredTickets.length, 1);
              const width = `${(item.value / total) * 100}%`;

              return (
                <div className="sv-admin-analytics__stack-row" key={item.label}>
                  <div className="sv-admin-analytics__stack-meta">
                    <span>{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                  <div className="sv-admin-analytics__stack-track">
                    <div className="sv-admin-analytics__stack-fill" style={{ width, background: item.tone }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="sv-admin-analytics__panel">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Nội dung phát sinh</span>
              <h2>Khối lượng tài nguyên mới</h2>
            </div>
            <Activity size={18} />
          </div>

          <div className="sv-admin-analytics__mini-grid">
            {contentDistribution.map((item) => (
              <div className="sv-admin-analytics__mini-card" key={item.label} style={{ ['--mini-tone' as string]: item.tone }}>
                <span>{item.label}</span>
                <strong>{formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="sv-admin-analytics__insights">
        <article className="sv-admin-analytics__panel sv-admin-analytics__panel--wide">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Xu hướng hệ thống</span>
              <h2>Sản lượng vận hành theo {revenueView === 'daily' ? 'ngày' : revenueView === 'weekly' ? 'tuần' : revenueView === 'monthly' ? 'tháng' : 'năm'}</h2>
            </div>
            <Activity size={18} />
          </div>

          <div className="sv-admin-analytics__chart-shell">
            {filteredSystemTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={filteredSystemTrendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="sv-admin-analytics__tooltip">
                          <strong>{payload[0].payload.fullLabel}</strong>
                          <small>Người dùng: {formatNumber(payload[0].payload.users)}</small>
                          <small>Jobs: {formatNumber(payload[0].payload.jobs)}</small>
                          <small>Khóa học: {formatNumber(payload[0].payload.courses)}</small>
                          <small>Tickets: {formatNumber(payload[0].payload.tickets)}</small>
                          <small>Roadmaps: {formatNumber(payload[0].payload.roadmaps)}</small>
                        </div>
                      ) : null
                    }
                  />
                  <Line type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="jobs" stroke="#f472b6" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="courses" stroke="#60a5fa" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="tickets" stroke="#f59e0b" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="roadmaps" stroke="#34d399" strokeWidth={2.2} dot={false} />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="sv-admin-analytics__empty">Chưa có đủ dữ liệu để dựng xu hướng hệ thống trong khoảng thời gian đã chọn.</div>
            )}
          </div>
        </article>

        <article className="sv-admin-analytics__panel">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Phân tích theo năm</span>
              <h2>Doanh thu toàn kỳ</h2>
            </div>
            <BarChart3 size={18} />
          </div>

          <div className="sv-admin-analytics__chart-shell">
            {annualRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={annualRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sv-admin-annual-revenue-bar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.58} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(value / 1000000)}M`}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="sv-admin-analytics__tooltip">
                          <strong>{payload[0].payload.fullLabel}</strong>
                          <span>{formatCurrency(payload[0].payload.revenue)}</span>
                          <small>{formatNumber(payload[0].payload.transactions)} giao dịch hoàn tất</small>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="revenue" fill="url(#sv-admin-annual-revenue-bar)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="sv-admin-analytics__empty">Chưa có dữ liệu doanh thu theo năm.</div>
            )}
          </div>
        </article>

        <article className="sv-admin-analytics__panel">
          <div className="sv-admin-analytics__panel-header">
            <div>
              <span className="sv-admin-analytics__eyebrow">Phân tích theo năm</span>
              <h2>Tăng trưởng tài nguyên</h2>
            </div>
            <LineChart size={18} />
          </div>

          <div className="sv-admin-analytics__chart-shell">
            {annualSystemTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RechartsLineChart data={annualSystemTrendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="sv-admin-analytics__tooltip">
                          <strong>{payload[0].payload.fullLabel}</strong>
                          <small>Users: {formatNumber(payload[0].payload.users)}</small>
                          <small>Jobs: {formatNumber(payload[0].payload.jobs)}</small>
                          <small>Courses: {formatNumber(payload[0].payload.courses)}</small>
                          <small>Roadmaps: {formatNumber(payload[0].payload.roadmaps)}</small>
                        </div>
                      ) : null
                    }
                  />
                  <Line type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={2.3} dot={false} />
                  <Line type="monotone" dataKey="jobs" stroke="#f472b6" strokeWidth={2.1} dot={false} />
                  <Line type="monotone" dataKey="courses" stroke="#60a5fa" strokeWidth={2.1} dot={false} />
                  <Line type="monotone" dataKey="roadmaps" stroke="#34d399" strokeWidth={2.1} dot={false} />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="sv-admin-analytics__empty">Chưa có đủ dữ liệu tăng trưởng theo năm.</div>
            )}
          </div>
        </article>
      </section>

      <section className="sv-admin-analytics__summary-grid">
        <article className="sv-admin-analytics__summary-card">
          <div className="sv-admin-analytics__summary-head">
            <Gauge size={18} />
            <span>Sức khỏe dashboard</span>
          </div>
          <strong>{formatPercent(dashboardHealth)}</strong>
          <p>Trung bình từ giao dịch thành công, kích hoạt người dùng, xử lý ticket và hoàn thành roadmap.</p>
        </article>

        <article className="sv-admin-analytics__summary-card">
          <div className="sv-admin-analytics__summary-head">
            <Users size={18} />
            <span>Tỷ lệ hoạt động</span>
          </div>
          <strong>{formatPercent(activationRate)}</strong>
          <p>{formatNumber(activeUsers)} trên {formatNumber(totalUsers)} người dùng tạo mới trong giai đoạn này đang ở trạng thái hoạt động.</p>
        </article>

        <article className="sv-admin-analytics__summary-card">
          <div className="sv-admin-analytics__summary-head">
            <CheckCircle2 size={18} />
            <span>Hoàn thành roadmap</span>
          </div>
          <strong>{formatPercent(roadmapCompletionRate)}</strong>
          <p>{formatNumber(completedRoadmaps)} roadmap đã hoàn thành trên tổng số roadmap được tạo trong giai đoạn đã lọc.</p>
        </article>

        <article className="sv-admin-analytics__summary-card">
          <div className="sv-admin-analytics__summary-head">
            <Ticket size={18} />
            <span>Xử lý ticket</span>
          </div>
          <strong>{formatPercent(resolutionRate)}</strong>
          <p>{formatNumber(resolvedTickets + closedTickets)} ticket đã được xử lý hoặc đóng trong tập ticket phát sinh theo ngày lọc.</p>
        </article>
      </section>
    </div>
  );
};

export default AnalyticsTab;
