import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Coins,
  ArrowUpRight, ArrowDownLeft, Activity, Zap
} from 'lucide-react';
import './StatisticsPanel.css';

interface WalletData {
  cashBalance: number;
  coinBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
}

interface Transaction {
  transactionId: number;
  transactionType?: string;
  amount?: number;
  coinAmount?: number;
  description: string;
  createdAt: string;
  status: string;
  currencyType?: string;
  isCredit?: boolean;
  isDebit?: boolean;
}

interface StatisticsPanelProps {
  walletData: WalletData | null;
  transactions: Transaction[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ walletData, transactions }) => {
  const formatCurrency = (amount: number) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeAmount);
  };

  // Calculate statistics
  const totalIncome = walletData?.totalDeposited || 0;
  const totalExpense = (walletData?.totalWithdrawn || 0) + (walletData?.totalCoinsSpent || 0);
  const netFlow = totalIncome - totalExpense;

  // Balance distribution data for Pie Chart
  // Tỷ giá: 1 xu = 76 VND
  const COIN_TO_VND_RATE = 76;
  const balanceData = [
    { name: 'Tiền Mặt', value: walletData?.cashBalance || 0, color: '#22c55e' },
    { name: 'Xu (VND)', value: (walletData?.coinBalance || 0) * COIN_TO_VND_RATE, color: '#fbbf24' }
  ];

  // Transaction flow data for Bar Chart (last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        deposit: 0,
        withdraw: 0,
        coins: 0
      });
    }
    return days;
  };

  const transactionFlowData = getLast7Days();
  
  // Debug: Log first transaction to see structure
  if (transactions.length > 0) {
    console.log('📊 Sample transaction:', transactions[0]);
  }
  
  transactions.forEach(tx => {
    const txDate = new Date(tx.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const dayData = transactionFlowData.find(d => d.date === txDate);
    
    if (dayData) {
      const txType = tx.transactionType?.toUpperCase() || '';
      const currencyType = tx.currencyType?.toUpperCase() || '';
      
      // Only process CASH transactions for deposit/withdraw charts
      if (currencyType === 'CASH') {
        const amount = typeof tx.amount === 'number' && !isNaN(tx.amount) ? Math.abs(tx.amount) : 0;
        
        // Check if it's a deposit (incoming money)
        if (txType.includes('DEPOSIT') || tx.isCredit) {
          dayData.deposit += amount;
        } 
        // Check if it's a withdrawal (outgoing money)
        else if (txType.includes('WITHDRAWAL') || txType.includes('WITHDRAW') || tx.isDebit) {
          dayData.withdraw += amount;
        }
      }
      
      // Track coins separately
      const coinAmount = typeof tx.coinAmount === 'number' && !isNaN(tx.coinAmount) ? Math.abs(tx.coinAmount) : 0;
      if (coinAmount > 0 && currencyType === 'COIN') {
        dayData.coins += coinAmount;
      }
    }
  });
  
  // Debug: Log processed data
  console.log('📊 7-day flow data:', transactionFlowData);

  // Monthly trend data for Area Chart - Calculate from real transactions
  const getMonthlyTrendData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `T${date.getMonth() + 1}`;
      
      // Calculate income and expense for this month
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
      });
      
      const income = monthTransactions
        .filter(tx => {
          const txType = tx.transactionType?.toUpperCase() || '';
          const currencyType = tx.currencyType?.toUpperCase() || '';
          return currencyType === 'CASH' && (txType.includes('DEPOSIT') || tx.isCredit);
        })
        .reduce((sum, tx) => {
          const amount = typeof tx.amount === 'number' && !isNaN(tx.amount) ? Math.abs(tx.amount) : 0;
          return sum + amount;
        }, 0);
      
      const expense = monthTransactions
        .filter(tx => {
          const txType = tx.transactionType?.toUpperCase() || '';
          const currencyType = tx.currencyType?.toUpperCase() || '';
          return currencyType === 'CASH' && (txType.includes('WITHDRAWAL') || txType.includes('WITHDRAW') || tx.isDebit);
        })
        .reduce((sum, tx) => {
          const amount = typeof tx.amount === 'number' && !isNaN(tx.amount) ? Math.abs(tx.amount) : 0;
          return sum + amount;
        }, 0);
      
      months.push({ month: monthKey, income, expense });
    }
    
    return months;
  };
  
  const monthlyTrendData = getMonthlyTrendData();
  
  // Debug: Log monthly data
  console.log('📊 Monthly trend data:', monthlyTrendData);

  // Transaction type distribution
  const transactionTypeData = [
    { 
      name: 'Nạp tiền', 
      value: transactions.filter(t => {
        const txType = t.transactionType?.toUpperCase() || '';
        const currencyType = t.currencyType?.toUpperCase() || '';
        return currencyType === 'CASH' && (txType.includes('DEPOSIT') || t.isCredit);
      }).length, 
      color: '#22c55e' 
    },
    { 
      name: 'Rút tiền', 
      value: transactions.filter(t => {
        const txType = t.transactionType?.toUpperCase() || '';
        const currencyType = t.currencyType?.toUpperCase() || '';
        return currencyType === 'CASH' && (txType.includes('WITHDRAWAL') || txType.includes('WITHDRAW') || t.isDebit);
      }).length, 
      color: '#ef4444' 
    },
    { 
      name: 'Mua xu', 
      value: transactions.filter(t => {
        const txType = t.transactionType?.toUpperCase() || '';
        return txType.includes('PURCHASE_COIN') || (txType.includes('PURCHASE') && txType.includes('COIN'));
      }).length, 
      color: '#fbbf24' 
    },
    { 
      name: 'Mua Premium', 
      value: transactions.filter(t => {
        const txType = t.transactionType?.toUpperCase() || '';
        const desc = t.description?.toUpperCase() || '';
        return txType.includes('PREMIUM') || txType.includes('SUBSCRIPTION') || desc.includes('PREMIUM') || desc.includes('GÓI');
      }).length, 
      color: '#a855f7' 
    },
    { 
      name: 'Mua khóa học', 
      value: transactions.filter(t => {
        const txType = t.transactionType?.toUpperCase() || '';
        const desc = t.description?.toUpperCase() || '';
        return txType.includes('COURSE') || desc.includes('KHÓA HỌC') || desc.includes('COURSE');
      }).length, 
      color: '#3b82f6' 
    },
    { 
      name: 'Chi tiêu khác', 
      value: transactions.filter(t => {
        const txType = t.transactionType?.toUpperCase() || '';
        const currencyType = t.currencyType?.toUpperCase() || '';
        const desc = t.description?.toUpperCase() || '';
        // Exclude premium and course purchases
        const isPremium = txType.includes('PREMIUM') || txType.includes('SUBSCRIPTION') || desc.includes('PREMIUM') || desc.includes('GÓI');
        const isCourse = txType.includes('COURSE') || desc.includes('KHÓA HỌC') || desc.includes('COURSE');
        const isCoinPurchase = txType.includes('PURCHASE_COIN') || (txType.includes('PURCHASE') && txType.includes('COIN'));
        return currencyType === 'COIN' && t.isDebit && !isPremium && !isCourse && !isCoinPurchase;
      }).length, 
      color: '#8b5cf6' 
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('xu') ? entry.value : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="statistics-panel">
      {/* Summary Cards */}
      <div className="stats-summary-grid">
        <div className="sp-stat-card income">
          <div className="sp-stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="sp-stat-content">
            <span className="sp-stat-label">Tổng Thu Nhập</span>
            <span className="sp-stat-value">{formatCurrency(totalIncome)}</span>
          </div>
        </div>

        <div className="sp-stat-card expense">
          <div className="sp-stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="sp-stat-content">
            <span className="sp-stat-label">Tổng Chi Tiêu</span>
            <span className="sp-stat-value">{formatCurrency(totalExpense)}</span>
          </div>
        </div>

        <div className="sp-stat-card net">
          <div className="sp-stat-icon">
            <Activity size={24} />
          </div>
          <div className="sp-stat-content">
            <span className="sp-stat-label">Dòng Tiền Ròng</span>
            <span className={`sp-stat-value ${netFlow >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(netFlow)}
            </span>
          </div>
        </div>

        <div className="sp-stat-card coins">
          <div className="sp-stat-icon">
            <Coins size={24} />
          </div>
          <div className="sp-stat-content">
            <span className="sp-stat-label">Tổng Xu Kiếm Được</span>
            <span className="sp-stat-value">{(walletData?.totalCoinsEarned || 0).toLocaleString()} xu</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Coin Earnings - Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Coins size={20} />
              Xu Nhận Được Qua Hệ Thống
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={transactionFlowData}>
                <defs>
                  <linearGradient id="colorCoins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                <XAxis dataKey="date" stroke="#a5b4fc" />
                <YAxis stroke="#a5b4fc" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="coins" 
                  stroke="#fbbf24" 
                  fillOpacity={1} 
                  fill="url(#colorCoins)" 
                  name="Xu nhận"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balance Distribution - Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <DollarSign size={20} />
              Phân Bổ Tài Sản
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={balanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => {
                    const percentValue = typeof percent === 'number' && !isNaN(percent) ? percent : 0;
                    return `${name} ${(percentValue * 100).toFixed(0)}%`;
                  }}
                >
                  {balanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {balanceData.map((item, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Flow - Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Activity size={20} />
              Dòng Tiền 7 Ngày
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={transactionFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                <XAxis dataKey="date" stroke="#a5b4fc" />
                <YAxis stroke="#a5b4fc" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="deposit" fill="#22c55e" name="Nạp tiền" radius={[8, 8, 0, 0]} />
                <Bar dataKey="withdraw" fill="#ef4444" name="Rút tiền" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend - Area Chart */}
        <div className="chart-card wide">
          <div className="chart-header">
            <h3>
              <TrendingUp size={20} />
              Xu Hướng Thu Chi Theo Tháng
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                <XAxis dataKey="month" stroke="#a5b4fc" />
                <YAxis stroke="#a5b4fc" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  name="Thu nhập"
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                  name="Chi tiêu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Type Distribution - Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Zap size={20} />
              Phân Loại Giao Dịch
            </h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={transactionTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {transactionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {transactionTypeData.map((item, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value} giao dịch</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-grid">
        <div className="quick-stat">
          <ArrowUpRight className="quick-stat-icon up" />
          <div className="quick-stat-content">
            <span className="quick-stat-label">Giao dịch nạp</span>
            <span className="quick-stat-value">
              {transactions.filter(t => t.transactionType?.includes('DEPOSIT')).length}
            </span>
          </div>
        </div>

        <div className="quick-stat">
          <ArrowDownLeft className="quick-stat-icon down" />
          <div className="quick-stat-content">
            <span className="quick-stat-label">Giao dịch rút</span>
            <span className="quick-stat-value">
              {transactions.filter(t => t.transactionType?.includes('WITHDRAWAL')).length}
            </span>
          </div>
        </div>

        <div className="quick-stat">
          <Coins className="quick-stat-icon coin" />
          <div className="quick-stat-content">
            <span className="quick-stat-label">Xu đã chi</span>
            <span className="quick-stat-value">
              {(walletData?.totalCoinsSpent || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="quick-stat">
          <Activity className="quick-stat-icon activity" />
          <div className="quick-stat-content">
            <span className="quick-stat-label">Tổng giao dịch</span>
            <span className="quick-stat-value">{transactions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
