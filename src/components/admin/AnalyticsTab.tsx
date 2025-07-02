import React, { useState } from 'react';
import './AnalyticsTab.css';

interface AnalyticsData {
  totalUsers: {
    mentor: number;
    business: number;
    student: number;
  };
  monthlyActiveUsers: {
    month: string;
    users: number;
  }[];
  minJobsCreated: {
    week: string;
    jobs: number;
  }[];
  earnings: {
    totalEarnings: number;
    totalSkillPoints: number;
    weeklyEarnings: { week: string; amount: number }[];
  };
}

const AnalyticsTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('7days');

  // Mock analytics data
  const [analyticsData] = useState<AnalyticsData>({
    totalUsers: {
      mentor: 1247,
      business: 589,
      student: 11011
    },
    monthlyActiveUsers: [
      { month: 'T1', users: 8500 },
      { month: 'T2', users: 9200 },
      { month: 'T3', users: 10100 },
      { month: 'T4', users: 11500 },
      { month: 'T5', users: 12300 },
      { month: 'T6', users: 12847 },
    ],
    minJobsCreated: [
      { week: 'T1', jobs: 45 },
      { week: 'T2', jobs: 62 },
      { week: 'T3', jobs: 58 },
      { week: 'T4', jobs: 73 },
      { week: 'T5', jobs: 89 },
      { week: 'T6', jobs: 94 },
    ],
    earnings: {
      totalEarnings: 2500000000, // 2.5 billion VND
      totalSkillPoints: 450000,
      weeklyEarnings: [
        { week: 'T1', amount: 380000000 },
        { week: 'T2', amount: 420000000 },
        { week: 'T3', amount: 395000000 },
        { week: 'T4', amount: 465000000 },
        { week: 'T5', amount: 512000000 },
        { week: 'T6', amount: 528000000 },
      ]
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getMaxValue = (data: any[], key: string) => {
    return Math.max(...data.map(item => item[key]));
  };

  const calculatePercentage = (value: number, max: number) => {
    return (value / max) * 100;
  };

  return (
    <div className="administrator-analytics">
      <div className="administrator-analytics-header">
        <h2>Thống Kê & Phân Tích</h2>
        <p>Báo cáo chi tiết về hoạt động nền tảng</p>
        
        <div className="administrator-analytics-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="administrator-analytics-time-select"
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="3months">3 tháng qua</option>
            <option value="6months">6 tháng qua</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="administrator-analytics-metrics">
        <div className="administrator-analytics-metric-card">
          <div className="administrator-analytics-metric-icon">👥</div>
          <div className="administrator-analytics-metric-info">
            <h3>Tổng Người Dùng</h3>
            <div className="administrator-analytics-metric-number">
              {formatNumber(analyticsData.totalUsers.mentor + analyticsData.totalUsers.business + analyticsData.totalUsers.student)}
            </div>
            <div className="administrator-analytics-metric-growth">+12.5% so với tháng trước</div>
          </div>
        </div>

        <div className="administrator-analytics-metric-card">
          <div className="administrator-analytics-metric-icon">💰</div>
          <div className="administrator-analytics-metric-info">
            <h3>Tổng Doanh Thu</h3>
            <div className="administrator-analytics-metric-number">
              {formatCurrency(analyticsData.earnings.totalEarnings)}
            </div>
            <div className="administrator-analytics-metric-growth">+18.3% so với tháng trước</div>
          </div>
        </div>

        <div className="administrator-analytics-metric-card">
          <div className="administrator-analytics-metric-icon">⚡</div>
          <div className="administrator-analytics-metric-info">
            <h3>SkillPoints Phân Phối</h3>
            <div className="administrator-analytics-metric-number">
              {formatNumber(analyticsData.earnings.totalSkillPoints)}
            </div>
            <div className="administrator-analytics-metric-growth">+25.1% so với tháng trước</div>
          </div>
        </div>

        <div className="administrator-analytics-metric-card">
          <div className="administrator-analytics-metric-icon">💼</div>
          <div className="administrator-analytics-metric-info">
            <h3>MinJobs Hoạt Động</h3>
            <div className="administrator-analytics-metric-number">
              {analyticsData.minJobsCreated.reduce((sum, item) => sum + item.jobs, 0)}
            </div>
            <div className="administrator-analytics-metric-growth">+15.7% so với tháng trước</div>
          </div>
        </div>
      </div>

      {/* User Distribution Chart */}
      <div className="administrator-analytics-section">
        <h3>Phân Bố Người Dùng Theo Vai Trò</h3>
        <div className="administrator-analytics-user-distribution">
          <div className="administrator-analytics-pie-chart">
            <div className="administrator-analytics-pie-segment administrator-analytics-pie-student" 
                 style={{ '--percentage': '78.5' } as React.CSSProperties}>
              <span className="administrator-analytics-pie-label">
                Học viên: {formatNumber(analyticsData.totalUsers.student)}
              </span>
            </div>
            <div className="administrator-analytics-pie-segment administrator-analytics-pie-mentor"
                 style={{ '--percentage': '11.2' } as React.CSSProperties}>
              <span className="administrator-analytics-pie-label">
                Mentor: {formatNumber(analyticsData.totalUsers.mentor)}
              </span>
            </div>
            <div className="administrator-analytics-pie-segment administrator-analytics-pie-business"
                 style={{ '--percentage': '10.3' } as React.CSSProperties}>
              <span className="administrator-analytics-pie-label">
                Doanh nghiệp: {formatNumber(analyticsData.totalUsers.business)}
              </span>
            </div>
          </div>
          <div className="administrator-analytics-pie-legend">
            <div className="administrator-analytics-legend-item">
              <span className="administrator-analytics-legend-color administrator-analytics-legend-student"></span>
              <span>Học viên (78.5%)</span>
            </div>
            <div className="administrator-analytics-legend-item">
              <span className="administrator-analytics-legend-color administrator-analytics-legend-mentor"></span>
              <span>Mentor (11.2%)</span>
            </div>
            <div className="administrator-analytics-legend-item">
              <span className="administrator-analytics-legend-color administrator-analytics-legend-business"></span>
              <span>Doanh nghiệp (10.3%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Active Users Chart */}
      <div className="administrator-analytics-section">
        <h3>Người Dùng Hoạt Động Hàng Tháng</h3>
        <div className="administrator-analytics-bar-chart">
          {analyticsData.monthlyActiveUsers.map((item) => (
            <div key={item.month} className="administrator-analytics-bar-item">
              <div 
                className="administrator-analytics-bar"
                style={{ 
                  height: `${calculatePercentage(item.users, getMaxValue(analyticsData.monthlyActiveUsers, 'users'))}%` 
                }}
              >
                <span className="administrator-analytics-bar-value">{formatNumber(item.users)}</span>
              </div>
              <span className="administrator-analytics-bar-label">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MinJobs Created Chart */}
      <div className="administrator-analytics-section">
        <h3>MinJobs Được Tạo Hàng Tuần</h3>
        <div className="administrator-analytics-line-chart">
          {analyticsData.minJobsCreated.map((item) => (
            <div key={item.week} className="administrator-analytics-line-item">
              <div 
                className="administrator-analytics-line-point"
                style={{ 
                  bottom: `${calculatePercentage(item.jobs, getMaxValue(analyticsData.minJobsCreated, 'jobs'))}%` 
                }}
              >
                <span className="administrator-analytics-line-value">{item.jobs}</span>
              </div>
              <span className="administrator-analytics-line-label">{item.week}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Earnings Chart */}
      <div className="administrator-analytics-section">
        <h3>Doanh Thu Hàng Tuần</h3>
        <div className="administrator-analytics-area-chart">
          {analyticsData.earnings.weeklyEarnings.map((item) => (
            <div key={`earnings-${item.week}`} className="administrator-analytics-area-item">
              <div 
                className="administrator-analytics-area"
                style={{ 
                  height: `${calculatePercentage(item.amount, getMaxValue(analyticsData.earnings.weeklyEarnings, 'amount'))}%` 
                }}
              >
                <span className="administrator-analytics-area-value">{formatCurrency(item.amount)}</span>
              </div>
              <span className="administrator-analytics-area-label">{item.week}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="administrator-analytics-summary">
        <h3>Tóm Tắt Hiệu Suất</h3>
        <div className="administrator-analytics-summary-grid">
          <div className="administrator-analytics-summary-item">
            <span className="administrator-analytics-summary-label">Tăng trưởng người dùng</span>
            <span className="administrator-analytics-summary-value positive">+12.5%</span>
          </div>
          <div className="administrator-analytics-summary-item">
            <span className="administrator-analytics-summary-label">Tỷ lệ người dùng hoạt động</span>
            <span className="administrator-analytics-summary-value">73.2%</span>
          </div>
          <div className="administrator-analytics-summary-item">
            <span className="administrator-analytics-summary-label">Doanh thu trung bình/tuần</span>
            <span className="administrator-analytics-summary-value">{formatCurrency(450000000)}</span>
          </div>
          <div className="administrator-analytics-summary-item">
            <span className="administrator-analytics-summary-label">MinJobs hoàn thành</span>
            <span className="administrator-analytics-summary-value positive">89.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
