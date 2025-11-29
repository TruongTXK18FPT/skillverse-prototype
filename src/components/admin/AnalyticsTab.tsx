import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, CreditCard, Briefcase, BookOpen, TrendingUp,
  Crown, RefreshCw, Calendar, DollarSign, Activity, PieChart,
  BarChart3, LineChart, Zap, Award, Target, Loader2, MessageSquare,
  HelpCircle, GraduationCap, ShieldCheck, Clock, Ticket, Wallet
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import './AnalyticsTab.css';
import adminUserService from '../../services/adminUserService';
import adminPremiumService from '../../services/adminPremiumService';
import { paymentService } from '../../services/paymentService';
import jobService from '../../services/jobService';
import { listCourses } from '../../services/courseService';
import supportService, { TicketStatsResponse } from '../../services/supportService';
import careerChatService from '../../services/careerChatService';
import { AdminUserListResponse } from '../../types/adminUser';
import { AdminPremiumPlan } from '../../services/adminPremiumService';
import { PaymentTransactionResponse } from '../../data/paymentDTOs';

// ==================== INTERFACES ====================
interface AnalyticsState {
  loading: boolean;
  error: string | null;
  users: AdminUserListResponse | null;
  premiumPlans: AdminPremiumPlan[];
  paymentStats: {
    totalTransactions: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
    totalRevenue: string;
    totalWalletDeposits?: string;
  } | null;
  transactions: PaymentTransactionResponse[];
  totalJobs: number;
  totalCourses: number;
  // New stats
  ticketStats: TicketStatsResponse | null;
  totalChatSessions: number;
  // Wallet stats
  walletStats: {
    totalCashBalance: string;
    totalCoinBalance: number;
    activeWalletCount: number;
  } | null;
  // Revenue breakdown - separate for each period
  dailyRevenue: RevenueData | null;
  weeklyRevenue: RevenueData | null;
  monthlyRevenue: RevenueData | null;
  yearlyRevenue: RevenueData | null;
}

interface RevenueData {
  period: string;
  data: Array<{
    date?: string;
    week?: string;
    month?: string;
    year?: number;
    revenue: number;
    transactions: number;
  }>;
  totalRevenue: number;
  totalTransactions: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// ==================== COMPONENT ====================
const AnalyticsTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [state, setState] = useState<AnalyticsState>({
    loading: true,
    error: null,
    users: null,
    premiumPlans: [],
    paymentStats: null,
    transactions: [],
    totalJobs: 0,
    totalCourses: 0,
    ticketStats: null,
    totalChatSessions: 0,
    walletStats: null,
    dailyRevenue: null,
    weeklyRevenue: null,
    monthlyRevenue: null,
    yearlyRevenue: null,
  });
  
  // Chart type state for each chart
  const [chartTypes, setChartTypes] = useState<{
    daily: 'bar' | 'line';
    weekly: 'bar' | 'line';
    monthly: 'bar' | 'line';
    yearly: 'bar' | 'line';
  }>({
    daily: 'bar',
    weekly: 'bar',
    monthly: 'line',
    yearly: 'line',
  });

  // ==================== DATA FETCHING ====================
  const fetchAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Fetch all data in parallel including all 4 revenue periods
      const [
        usersData, plansData, paymentStatsData, transactionsData, 
        jobsData, coursesData, ticketStatsData, chatStatsData,
        walletStatsData,
        dailyData, weeklyData, monthlyData, yearlyData
      ] = await Promise.allSettled([
        adminUserService.getAllUsers(),
        adminPremiumService.getAllPlans(),
        paymentService.adminGetPaymentStatistics(),
        paymentService.adminGetAllTransactions(0, 100),
        jobService.getPublicJobs(),
        listCourses(0, 1000),
        supportService.getTicketStats(),
        careerChatService.getAdminStats(),
        paymentService.adminGetWalletStatistics(),
        paymentService.adminGetRevenueBreakdown('daily', 30),
        paymentService.adminGetRevenueBreakdown('weekly', 12),
        paymentService.adminGetRevenueBreakdown('monthly', 12),
        paymentService.adminGetRevenueBreakdown('yearly', 10),
      ]);

      setState(prev => ({
        ...prev,
        loading: false,
        users: usersData.status === 'fulfilled' ? usersData.value : null,
        premiumPlans: plansData.status === 'fulfilled' ? plansData.value : [],
        paymentStats: paymentStatsData.status === 'fulfilled' ? paymentStatsData.value : null,
        transactions: transactionsData.status === 'fulfilled' ? transactionsData.value.content : [],
        totalJobs: jobsData.status === 'fulfilled' ? jobsData.value.length : 0,
        totalCourses: coursesData.status === 'fulfilled' ? coursesData.value.totalElements : 0,
        ticketStats: ticketStatsData.status === 'fulfilled' ? ticketStatsData.value : null,
        totalChatSessions: chatStatsData.status === 'fulfilled' ? chatStatsData.value.totalSessions : 0,
        walletStats: walletStatsData.status === 'fulfilled' ? walletStatsData.value : null,
        dailyRevenue: dailyData.status === 'fulfilled' ? dailyData.value : null,
        weeklyRevenue: weeklyData.status === 'fulfilled' ? weeklyData.value : null,
        monthlyRevenue: monthlyData.status === 'fulfilled' ? monthlyData.value : null,
        yearlyRevenue: yearlyData.status === 'fulfilled' ? yearlyData.value : null,
      }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Không thể tải dữ liệu phân tích' }));
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle chart type change
  const handleChartTypeChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly', type: 'bar' | 'line') => {
    setChartTypes(prev => ({ ...prev, [period]: type }));
  };

  // ==================== FORMATTERS ====================
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // ==================== COMPUTED VALUES ====================
  const totalUsers = state.users?.totalUsers || 0;
  const totalMentors = state.users?.totalMentors || 0;
  const totalRecruiters = state.users?.totalRecruiters || 0;
  const totalRegularUsers = state.users?.totalRegularUsers || 0;
  const activeUsers = state.users?.totalActiveUsers || 0;

  const totalRevenue = state.paymentStats ? parseFloat(state.paymentStats.totalRevenue) : 0;
  const totalTransactions = state.paymentStats?.totalTransactions || 0;
  const completedTransactions = state.paymentStats?.completedCount || 0;
  const pendingTransactions = state.paymentStats?.pendingCount || 0;

  const premiumSubscribers = state.premiumPlans.reduce((sum, plan) => sum + plan.currentSubscribers, 0);
  const premiumRevenue = state.premiumPlans.reduce((sum, plan) => sum + plan.totalRevenue, 0);

  // User distribution data
  const userDistribution: ChartDataPoint[] = [
    { label: 'Học viên', value: totalRegularUsers, color: '#3b82f6' },
    { label: 'Mentor', value: totalMentors, color: '#10b981' },
    { label: 'Nhà tuyển dụng', value: totalRecruiters, color: '#f59e0b' },
  ];

  // Premium plan distribution
  const premiumDistribution: ChartDataPoint[] = state.premiumPlans
    .filter(plan => plan.planType !== 'FREE_TIER')
    .map(plan => ({
      label: plan.displayName,
      value: plan.currentSubscribers,
      color: plan.planType === 'PREMIUM_PLUS' ? '#93c5fd' : 
             plan.planType === 'PREMIUM_BASIC' ? '#fbbf24' : '#c0c0c0'
    }));

  // Transaction status distribution
  const transactionDistribution: ChartDataPoint[] = [
    { label: 'Thành công', value: completedTransactions, color: '#10b981' },
    { label: 'Đang xử lý', value: pendingTransactions, color: '#f59e0b' },
    { label: 'Thất bại', value: state.paymentStats?.failedCount || 0, color: '#ef4444' },
  ];

  // Ticket status distribution
  const ticketDistribution: ChartDataPoint[] = state.ticketStats ? [
    { label: 'Đang mở', value: state.ticketStats.openTickets, color: '#f59e0b' },
    { label: 'Đã phản hồi', value: state.ticketStats.respondedTickets, color: '#3b82f6' },
    { label: 'Đang xử lý', value: state.ticketStats.inProgressTickets, color: '#8b5cf6' },
    { label: 'Đã giải quyết', value: state.ticketStats.resolvedTickets, color: '#10b981' },
    { label: 'Đã đóng', value: state.ticketStats.closedTickets, color: '#64748b' },
  ] : [];

  // Performance metrics
  const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions * 100) : 0;
  const activeRate = totalUsers > 0 ? (activeUsers / totalUsers * 100) : 0;
  const avgRevenuePerUser = premiumSubscribers > 0 ? premiumRevenue / premiumSubscribers : 0;
  const ticketResolutionRate = state.ticketStats && state.ticketStats.totalTickets > 0 
    ? ((state.ticketStats.resolvedTickets + state.ticketStats.closedTickets) / state.ticketStats.totalTickets * 100) 
    : 0;

  // ==================== RENDER HELPERS ====================
  const renderDonutChart = (data: ChartDataPoint[], size: number = 200) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <div className="holo-chart-empty">Không có dữ liệu</div>;

    let cumulativePercent = 0;
    const segments = data.map((d, i) => {
      const percent = (d.value / total) * 100;
      const startAngle = cumulativePercent * 3.6;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 3.6;
      
      return (
        <div 
          key={i}
          className="holo-donut-segment"
          style={{
            '--start': `${startAngle}deg`,
            '--end': `${endAngle}deg`,
            '--color': d.color,
          } as React.CSSProperties}
        />
      );
    });

    return (
      <div className="holo-donut-chart" style={{ width: size, height: size }}>
        <div className="holo-donut-segments">{segments}</div>
        <div className="holo-donut-center">
          <span className="holo-donut-total">{formatCompact(total)}</span>
          <span className="holo-donut-label">Tổng</span>
        </div>
      </div>
    );
  };

  const renderBarChart = (data: ChartDataPoint[], maxHeight: number = 150) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
      <div className="holo-bar-chart">
        {data.map((d, i) => (
          <div key={i} className="holo-bar-item">
            <div 
              className="holo-bar"
              style={{ 
                height: `${(d.value / maxValue) * maxHeight}px`,
                background: d.color || 'linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%)'
              }}
            >
              <span className="holo-bar-value">{formatCompact(d.value)}</span>
            </div>
            <span className="holo-bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderProgressRing = (value: number, max: number, color: string, label: string) => {
    const percent = max > 0 ? (value / max) * 100 : 0;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="holo-progress-ring">
        <svg viewBox="0 0 100 100">
          <circle className="holo-ring-bg" cx="50" cy="50" r="45" />
          <circle 
            className="holo-ring-progress" 
            cx="50" cy="50" r="45"
            style={{ 
              strokeDasharray: circumference,
              strokeDashoffset,
              stroke: color
            }}
          />
        </svg>
        <div className="holo-ring-content">
          <span className="holo-ring-value">{percent.toFixed(1)}%</span>
          <span className="holo-ring-label">{label}</span>
        </div>
      </div>
    );
  };

  // Custom tooltip for recharts
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="holo-recharts-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload?.transactions !== undefined && (
            <p className="tooltip-transactions">
              {payload[0].payload.transactions} giao dịch
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render individual revenue chart with type selector using recharts
  const renderRevenueChart = (
    data: RevenueData | null, 
    title: string, 
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    chartType: 'bar' | 'line',
    color: string
  ) => {
    if (!data || data.data.length === 0) {
      return (
        <div className="holo-revenue-card">
          <div className="holo-revenue-card-header">
            <h3>{title}</h3>
          </div>
          <div className="holo-chart-empty">Chưa có dữ liệu</div>
        </div>
      );
    }

    // Transform data for recharts
    const chartData = data.data.map(item => ({
      name: period === 'yearly' 
        ? item.year?.toString() || ''
        : (item.date || item.week || item.month || '').slice(-5),
      revenue: item.revenue,
      transactions: item.transactions,
      fullLabel: item.date || item.week || item.month || item.year?.toString() || ''
    }));

    const gradientId = `gradient-${period}`;

    return (
      <div className="holo-revenue-card" style={{ '--chart-color': color } as React.CSSProperties}>
        <div className="holo-revenue-card-header">
          <h3>{title}</h3>
          <div className="holo-chart-type-selector">
            <button 
              className={`holo-type-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange(period, 'bar')}
              title="Biểu đồ cột"
            >
              <BarChart3 size={16} />
            </button>
            <button 
              className={`holo-type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange(period, 'line')}
              title="Biểu đồ đường"
            >
              <LineChart size={16} />
            </button>
          </div>
        </div>
        
        <div className="holo-revenue-card-chart">
          <ResponsiveContainer width="100%" height={180}>
            {chartType === 'line' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(0)}M` : value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
                />
                <Tooltip content={<CustomRevenueTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(0)}M` : value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
                />
                <Tooltip content={<CustomRevenueTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill={`url(#${gradientId})`}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="holo-revenue-card-footer">
          <div className="holo-rev-stat">
            <span className="holo-rev-stat-value">{formatCurrency(data.totalRevenue)}</span>
            <span className="holo-rev-stat-label">Tổng doanh thu</span>
          </div>
          <div className="holo-rev-stat">
            <span className="holo-rev-stat-value">{formatNumber(data.totalTransactions)}</span>
            <span className="holo-rev-stat-label">Giao dịch</span>
          </div>
        </div>
      </div>
    );
  };

  // ==================== LOADING & ERROR STATES ====================
  if (state.loading) {
    return (
      <div className="holo-analytics holo-analytics--loading">
        <div className="holo-loading-container">
          <Loader2 className="holo-loading-spinner" size={48} />
          <p>Đang tải dữ liệu phân tích...</p>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="holo-analytics">
      {/* Header */}
      <div className="holo-analytics-header">
        <div className="holo-header-content">
          <div className="holo-header-icon">
            <Activity size={32} />
          </div>
          <div>
            <h1>Phân Tích & Thống Kê</h1>
            <p>Tổng quan hoạt động nền tảng SkillVerse</p>
          </div>
        </div>
        <div className="holo-header-actions">
          <select 
            className="holo-time-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="90days">90 ngày qua</option>
            <option value="year">Năm nay</option>
          </select>
          <button className="holo-refresh-btn" onClick={fetchAnalytics}>
            <RefreshCw size={18} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="holo-metrics-grid">
        <div className="holo-metric-card holo-metric--users">
          <div className="holo-metric-icon">
            <Users size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Tổng Người Dùng</span>
            <span className="holo-metric-value">{formatNumber(totalUsers)}</span>
            <div className="holo-metric-detail">
              <span><TrendingUp size={14} /> {formatNumber(activeUsers)} hoạt động</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        <div className="holo-metric-card holo-metric--revenue">
          <div className="holo-metric-icon">
            <DollarSign size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Tổng Doanh Thu</span>
            <span className="holo-metric-value">{formatCurrency(totalRevenue)}</span>
            <div className="holo-metric-detail">
              <span><CreditCard size={14} /> {formatNumber(totalTransactions)} giao dịch</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        <div className="holo-metric-card holo-metric--wallet">
          <div className="holo-metric-icon">
            <Wallet size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Số Dư Trong Ví</span>
            <span className="holo-metric-value">
              {state.walletStats ? formatCurrency(state.walletStats.totalCashBalance) : '0 ₫'}
            </span>
            <div className="holo-metric-detail">
              <span><Users size={14} /> {state.walletStats?.activeWalletCount || 0} ví hoạt động</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        <div className="holo-metric-card holo-metric--premium">
          <div className="holo-metric-icon">
            <Crown size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Premium Subscribers</span>
            <span className="holo-metric-value">{formatNumber(premiumSubscribers)}</span>
            <div className="holo-metric-detail">
              <span><Zap size={14} /> {formatCurrency(premiumRevenue)} doanh thu</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        <div className="holo-metric-card holo-metric--courses">
          <div className="holo-metric-icon">
            <BookOpen size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Tổng Khóa Học</span>
            <span className="holo-metric-value">{formatNumber(state.totalCourses)}</span>
            <div className="holo-metric-detail">
              <span><Award size={14} /> Đang hoạt động</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        <div className="holo-metric-card holo-metric--jobs">
          <div className="holo-metric-icon">
            <Briefcase size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Tổng Việc Làm</span>
            <span className="holo-metric-value">{formatNumber(state.totalJobs)}</span>
            <div className="holo-metric-detail">
              <span><Target size={14} /> Đang tuyển</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        <div className="holo-metric-card holo-metric--transactions">
          <div className="holo-metric-icon">
            <CreditCard size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Giao Dịch Thành Công</span>
            <span className="holo-metric-value">{formatNumber(completedTransactions)}</span>
            <div className="holo-metric-detail">
              <span className="holo-metric-success">
                <TrendingUp size={14} /> {successRate.toFixed(1)}% tỷ lệ thành công
              </span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        {/* AI Chat Sessions */}
        <div className="holo-metric-card holo-metric--chat">
          <div className="holo-metric-icon">
            <MessageSquare size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">AI Chat Sessions</span>
            <span className="holo-metric-value">{formatNumber(state.totalChatSessions)}</span>
            <div className="holo-metric-detail">
              <span><Activity size={14} /> Cuộc hội thoại AI</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        {/* Support Tickets */}
        <div className="holo-metric-card holo-metric--support">
          <div className="holo-metric-icon">
            <HelpCircle size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Support Tickets</span>
            <span className="holo-metric-value">{formatNumber(state.ticketStats?.totalTickets || 0)}</span>
            <div className="holo-metric-detail">
              <span><Clock size={14} /> {formatNumber(state.ticketStats?.openTickets || 0)} đang mở</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>

        {/* Enrollments/Learning Stats */}
        <div className="holo-metric-card holo-metric--learning">
          <div className="holo-metric-icon">
            <GraduationCap size={28} />
          </div>
          <div className="holo-metric-content">
            <span className="holo-metric-label">Tỷ Lệ Ticket Giải Quyết</span>
            <span className="holo-metric-value">{ticketResolutionRate.toFixed(1)}%</span>
            <div className="holo-metric-detail">
              <span><ShieldCheck size={14} /> Tickets đã xử lý</span>
            </div>
          </div>
          <div className="holo-metric-glow" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="holo-charts-grid">
        {/* User Distribution */}
        <div className="holo-chart-card">
          <div className="holo-chart-header">
            <PieChart size={20} />
            <h3>Phân Bố Người Dùng</h3>
          </div>
          <div className="holo-chart-content">
            <div className="holo-chart-visual">
              {renderDonutChart(userDistribution, 180)}
            </div>
            <div className="holo-chart-legend">
              {userDistribution.map((d, i) => (
                <div key={i} className="holo-legend-item">
                  <span className="holo-legend-color" style={{ background: d.color }} />
                  <span className="holo-legend-label">{d.label}</span>
                  <span className="holo-legend-value">{formatNumber(d.value)}</span>
                  <span className="holo-legend-percent">
                    ({totalUsers > 0 ? ((d.value / totalUsers) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Plans Distribution */}
        <div className="holo-chart-card holo-chart--premium">
          <div className="holo-chart-header">
            <Crown size={20} />
            <h3>Gói Premium</h3>
          </div>
          <div className="holo-chart-content">
            {premiumDistribution.length > 0 ? (
              <>
                <div className="holo-chart-visual">
                  {renderBarChart(premiumDistribution, 120)}
                </div>
                <div className="holo-chart-legend">
                  {state.premiumPlans
                    .filter(plan => plan.planType !== 'FREE_TIER')
                    .map((plan, i) => (
                      <div key={i} className="holo-legend-item">
                        <span 
                          className="holo-legend-color" 
                          style={{ 
                            background: plan.planType === 'PREMIUM_PLUS' ? '#93c5fd' : 
                                       plan.planType === 'PREMIUM_BASIC' ? '#fbbf24' : '#c0c0c0'
                          }} 
                        />
                        <span className="holo-legend-label">{plan.displayName}</span>
                        <span className="holo-legend-value">{formatNumber(plan.currentSubscribers)}</span>
                        <span className="holo-legend-revenue">{formatCurrency(plan.totalRevenue)}</span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="holo-chart-empty">Chưa có gói Premium</div>
            )}
          </div>
        </div>

        {/* Transaction Status */}
        <div className="holo-chart-card">
          <div className="holo-chart-header">
            <BarChart3 size={20} />
            <h3>Trạng Thái Giao Dịch</h3>
          </div>
          <div className="holo-chart-content">
            <div className="holo-chart-visual">
              {renderDonutChart(transactionDistribution, 180)}
            </div>
            <div className="holo-chart-legend">
              {transactionDistribution.map((d, i) => (
                <div key={i} className="holo-legend-item">
                  <span className="holo-legend-color" style={{ background: d.color }} />
                  <span className="holo-legend-label">{d.label}</span>
                  <span className="holo-legend-value">{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Ticket Status */}
        <div className="holo-chart-card holo-chart--support">
          <div className="holo-chart-header">
            <Ticket size={20} />
            <h3>Trạng Thái Support Tickets</h3>
          </div>
          <div className="holo-chart-content">
            {ticketDistribution.length > 0 ? (
              <>
                <div className="holo-chart-visual">
                  {renderBarChart(ticketDistribution, 120)}
                </div>
                <div className="holo-chart-legend">
                  {ticketDistribution.map((d, i) => (
                    <div key={i} className="holo-legend-item">
                      <span className="holo-legend-color" style={{ background: d.color }} />
                      <span className="holo-legend-label">{d.label}</span>
                      <span className="holo-legend-value">{formatNumber(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="holo-chart-empty">Chưa có dữ liệu ticket</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Charts Grid - 4 separate charts */}
      <div className="holo-revenue-grid-section">
        <div className="holo-section-header">
          <DollarSign size={24} />
          <h2>Doanh Thu Chi Tiết</h2>
        </div>
        
        <div className="holo-revenue-charts-grid">
          {/* Daily Revenue Chart */}
          {renderRevenueChart(
            state.dailyRevenue, 
            'Doanh Thu Theo Ngày', 
            'daily', 
            chartTypes.daily,
            '#3b82f6'
          )}
          
          {/* Weekly Revenue Chart */}
          {renderRevenueChart(
            state.weeklyRevenue, 
            'Doanh Thu Theo Tuần', 
            'weekly', 
            chartTypes.weekly,
            '#10b981'
          )}
          
          {/* Monthly Revenue Chart */}
          {renderRevenueChart(
            state.monthlyRevenue, 
            'Doanh Thu Theo Tháng', 
            'monthly', 
            chartTypes.monthly,
            '#f59e0b'
          )}
          
          {/* Yearly Revenue Chart */}
          {renderRevenueChart(
            state.yearlyRevenue, 
            'Doanh Thu Theo Năm', 
            'yearly', 
            chartTypes.yearly,
            '#8b5cf6'
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="holo-performance-section">
        <div className="holo-section-header">
          <LineChart size={24} />
          <h2>Hiệu Suất Nền Tảng</h2>
        </div>
        <div className="holo-performance-grid">
          <div className="holo-performance-card">
            {renderProgressRing(successRate, 100, '#10b981', 'Tỷ lệ giao dịch thành công')}
          </div>
          <div className="holo-performance-card">
            {renderProgressRing(activeRate, 100, '#3b82f6', 'Tỷ lệ người dùng hoạt động')}
          </div>
          <div className="holo-performance-card">
            <div className="holo-stat-box">
              <span className="holo-stat-value">{formatCurrency(avgRevenuePerUser)}</span>
              <span className="holo-stat-label">Doanh thu TB/Subscriber</span>
            </div>
          </div>
          <div className="holo-performance-card">
            <div className="holo-stat-box">
              <span className="holo-stat-value">{state.premiumPlans.length}</span>
              <span className="holo-stat-label">Gói Premium đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="holo-summary-section">
        <div className="holo-section-header">
          <Calendar size={24} />
          <h2>Tóm Tắt Thống Kê</h2>
        </div>
        <div className="holo-summary-grid">
          <div className="holo-summary-item">
            <span className="holo-summary-label">Tổng người dùng</span>
            <span className="holo-summary-value">{formatNumber(totalUsers)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">Mentor</span>
            <span className="holo-summary-value">{formatNumber(totalMentors)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">Nhà tuyển dụng</span>
            <span className="holo-summary-value">{formatNumber(totalRecruiters)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">Học viên</span>
            <span className="holo-summary-value">{formatNumber(totalRegularUsers)}</span>
          </div>
          <div className="holo-summary-item holo-summary--highlight">
            <span className="holo-summary-label">Tổng doanh thu</span>
            <span className="holo-summary-value">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="holo-summary-item holo-summary--highlight">
            <span className="holo-summary-label">Doanh thu Premium</span>
            <span className="holo-summary-value">{formatCurrency(premiumRevenue)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">Tổng khóa học</span>
            <span className="holo-summary-value">{formatNumber(state.totalCourses)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">Tổng việc làm</span>
            <span className="holo-summary-value">{formatNumber(state.totalJobs)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">AI Chat Sessions</span>
            <span className="holo-summary-value">{formatNumber(state.totalChatSessions)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">Support Tickets</span>
            <span className="holo-summary-value">{formatNumber(state.ticketStats?.totalTickets || 0)}</span>
          </div>
          <div className="holo-summary-item">
            <span className="holo-summary-label">Tickets đang mở</span>
            <span className="holo-summary-value">{formatNumber(state.ticketStats?.openTickets || 0)}</span>
          </div>
          <div className="holo-summary-item holo-summary--highlight">
            <span className="holo-summary-label">Tỷ lệ giải quyết ticket</span>
            <span className="holo-summary-value">{ticketResolutionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
