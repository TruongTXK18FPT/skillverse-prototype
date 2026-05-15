import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DollarSign, TrendingUp, Search, Eye, Download, RefreshCw, X, Calendar, User, ArrowUpRight, ArrowDownLeft, Coins, CreditCard, Wallet, BarChart3, List, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import walletService from '../../services/walletService';
import { paymentService } from '../../services/paymentService';
import adminService from '../../services/adminService';
import userService from '../../services/userService';
import { getMentorProfile } from '../../services/mentorProfileService';
import { API_BASE_URL } from '../../services/axiosInstance';
import { showAppError, showAppInfo } from '../../context/ToastContext';
import { useScrollToListTopOnPagination } from '../../hooks/useScrollToListTopOnPagination';
import './TransactionManagementTabCosmic.css';

type TransactionType = 'ALL' | 'WALLET' | 'PAYMENT' | 'WITHDRAWAL' | 'COIN_PURCHASE';
type TabKey = 'overview' | 'deposits' | 'adminRevenue' | 'mentorRevenue' | 'withdrawals' | 'refunds' | 'all';

interface CombinedTransaction {
  id: string; type: TransactionType; userId?: number; userName?: string; userEmail?: string;
  userAvatarUrl?: string; amount: number; originalAmount?: number; status: string;
  description: string; createdAt: string; method?: string; reference?: string; originalData: any;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(n));
const truncName = (s?: string, m = 18) => { const t = s?.trim(); if (!t) return 'Unknown'; return t.length <= m ? t : t.slice(0, m) + '...'; };

const TransactionManagementTabCosmic: React.FC = () => {
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [filteredTx, setFilteredTx] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<CombinedTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [chartFilter, setChartFilter] = useState<'7d' | '30d' | '1y'>('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const { withPaginationScroll } = useScrollToListTopOnPagination();

  const [stats, setStats] = useState({
    totalDeposits: 0, totalWithdrawals: 0, totalBookingPayments: 0,
    totalMentorEarnings: 0, totalStudentEarnings: 0, totalPlatformFees: 0,
    totalPurchaseRevenue: 0, todayPlatformFees: 0, todayPurchaseRevenue: 0,
    totalRefunds: 0, totalEscrowFunds: 0, totalFrozenCash: 0,
  });

  const resolveAvatar = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    const t = raw.trim();
    if (/^https?:\/\//i.test(t)) return t;
    const r = API_BASE_URL.replace(/\/api$/i, '');
    return t.startsWith('/') ? `${r}${t}` : `${r}/${t}`;
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (showModal) document.body.style.overflow = 'hidden'; else document.body.style.overflow = 'unset'; return () => { document.body.style.overflow = 'unset'; }; }, [showModal]);
  useEffect(() => { const t = setTimeout(() => applyFilters(), 200); return () => clearTimeout(t); }, [searchTerm, statusFilter, transactions, activeTab]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [wTx, pTx, wdTx, gStats, dStats] = await Promise.all([
        fetchWalletTx(), fetchPaymentTx(), fetchWithdrawals(),
        walletService.adminGetGlobalStatistics(), walletService.adminGetDailyStatistics()
      ]);
      const combined = [...wTx, ...pTx, ...wdTx].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(combined);
      setStats({
        totalDeposits: gStats.totalDeposits || 0, totalWithdrawals: gStats.totalWithdrawals || 0,
        totalBookingPayments: gStats.totalBookingPayments || 0,
        totalMentorEarnings: gStats.totalMentorEarnings || 0, totalStudentEarnings: gStats.totalStudentEarnings || 0,
        totalPlatformFees: gStats.totalPlatformFees || 0, totalPurchaseRevenue: gStats.totalPurchaseRevenue || 0,
        todayPlatformFees: dStats.totalPlatformFees || 0, todayPurchaseRevenue: dStats.totalPurchaseRevenue || 0,
        totalRefunds: gStats.totalRefunds || 0, totalEscrowFunds: gStats.totalEscrowFunds || 0,
        totalFrozenCash: gStats.totalFrozenCash || 0,
      });
      setFilteredTx(combined);
    } catch (e: any) { console.error('Fetch error:', e); } finally { setLoading(false); }
  };

  const fetchWalletTx = async (): Promise<CombinedTransaction[]> => {
    try {
      const r = await walletService.adminGetAllWalletTransactions(0, 1000);
      return await Promise.all(r.content.map(async (tx: any) => {
        const t = (tx.transactionType || '').toUpperCase();
        const mappedType: TransactionType =
          (t.includes('PURCHASE_COINS') || t === 'COIN_PURCHASE') ? 'COIN_PURCHASE' :
          (t.includes('PURCHASE_PREMIUM') || t.includes('PREMIUM_SUBSCRIPTION')) ? 'PAYMENT' : 'WALLET';
        const raw = typeof tx.cashAmount === 'number' ? tx.cashAmount : (typeof tx.coinAmount === 'number' ? tx.coinAmount : 0);
        let uName = tx.userName || tx.userEmail || `User ${tx.userId}`;
        let uAvatar = resolveAvatar(tx.userAvatarUrl);
        try {
          if (typeof tx.userId === 'number') {
            const prof = await userService.getUserProfile(tx.userId);
            uName = prof.fullName || uName;
            uAvatar = resolveAvatar(prof.avatarMediaUrl) || uAvatar;
          }
        } catch (_) { /* ignore */ }
        return {
          id: `WAL-${tx.transactionId}`, type: mappedType, userId: tx.userId,
          userName: uName, userEmail: tx.userEmail || '-', userAvatarUrl: uAvatar,
          amount: raw, originalAmount: Math.abs(raw), status: tx.status,
          description: tx.description || tx.transactionTypeName || 'Wallet transaction',
          createdAt: tx.createdAt, method: tx.currencyType === 'COIN' ? 'Coin' : 'Cash',
          reference: tx.referenceId, originalData: tx
        };
      }));
    } catch (e) { console.error(e); return []; }
  };

  const fetchPaymentTx = async (): Promise<CombinedTransaction[]> => {
    try {
      const r = await paymentService.adminGetAllTransactions(0, 1000);
      return await Promise.all(r.content.map(async (p: any) => {
        const raw = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
        let uName = p.userName || p.userEmail || `User ${p.userId}`;
        let uAvatar = resolveAvatar(p.userAvatarUrl);
        try {
          if (typeof p.userId === 'number') {
            const prof = await userService.getUserProfile(p.userId);
            uName = prof.fullName || uName; uAvatar = resolveAvatar(prof.avatarMediaUrl) || uAvatar;
          }
        } catch (_) { /* ignore */ }
        return {
          id: `PAY-${p.id}`, type: 'PAYMENT' as TransactionType, userId: p.userId,
          userName: uName, userEmail: p.userEmail || '-', userAvatarUrl: uAvatar,
          amount: raw, originalAmount: Math.abs(raw), status: p.status,
          description: p.description || 'Payment', createdAt: p.createdAt,
          method: p.paymentMethod || '-', reference: p.internalReference, originalData: p
        };
      }));
    } catch (e) { console.error(e); return []; }
  };

  const fetchWithdrawals = async (): Promise<CombinedTransaction[]> => {
    try {
      const r = await walletService.adminGetWithdrawalRequests(0, 1000);
      return r.content.map((w: any) => ({
        id: `WD-${w.requestCode}`, type: 'WITHDRAWAL' as TransactionType, userId: w.userId,
        userName: w.userFullName || w.bankAccountName || w.userEmail || `User ${w.userId}`,
        userEmail: w.userEmail || '-', userAvatarUrl: w.userAvatarUrl,
        amount: -w.amount, status: w.status, description: `Rút tiền về ${w.bankName}`,
        createdAt: w.createdAt, method: w.bankName, reference: w.requestCode, originalData: w
      }));
    } catch (e) { console.error(e); return []; }
  };

  // Helper: get raw backend transactionType from originalData
  const getRawType = (tx: CombinedTransaction): string => {
    return (tx.originalData?.transactionType || '').toUpperCase();
  };

  // Coin reward types to EXCLUDE from revenue
  const EXCLUDED_COIN_TYPES = [
    'DAILY_LOGIN_BONUS', 'BONUS_COINS', 'EARN_COINS', 'REWARD_ACHIEVEMENT',
    'RECEIVE_TIP', 'TIP_MENTOR', 'SPEND_COINS',
  ];

  // Refund types
  const REFUND_TYPES = ['REFUND_CASH', 'ESCROW_REFUND', 'REFUND_COINS'];

  // Escrow / frozen types
  const ESCROW_TYPES = ['ESCROW_FUND'];

  // Deposit types
  const DEPOSIT_TYPES = ['DEPOSIT_CASH'];

  // Admin Revenue types (Platform fees, Premium/Course purchases)
  const ADMIN_REVENUE_TYPES = ['PLATFORM_FEE', 'PURCHASE_PREMIUM', 'PURCHASE_COURSE', 'PURCHASE_COINS'];

  // Mentor Revenue types
  const MENTOR_REVENUE_TYPES = ['MENTOR_BOOKING', 'COURSE_SALE'];

  const getTabTx = (): CombinedTransaction[] => {
    switch (activeTab) {
      case 'deposits':
        return transactions.filter(tx => {
          const raw = getRawType(tx);
          return DEPOSIT_TYPES.includes(raw) || (tx.id.startsWith('PAY-') && tx.amount > 0);
        });
      case 'adminRevenue':
        return transactions.filter(tx => {
          const raw = getRawType(tx);
          return ADMIN_REVENUE_TYPES.includes(raw) || (tx.type === 'PAYMENT' && tx.amount > 0) || (tx.type === 'COIN_PURCHASE');
        });
      case 'mentorRevenue':
        return transactions.filter(tx => MENTOR_REVENUE_TYPES.includes(getRawType(tx)));
      case 'withdrawals':
        return transactions.filter(tx => tx.type === 'WITHDRAWAL');
      case 'refunds':
        return transactions.filter(tx => REFUND_TYPES.includes(getRawType(tx)));
      default:
        return transactions;
    }
  };

  const applyFilters = () => {
    let list = activeTab === 'overview' ? transactions : getTabTx();
    if (statusFilter !== 'ALL') list = list.filter(tx => tx.status === statusFilter);
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(tx => tx.userName?.toLowerCase().includes(s) || tx.userEmail?.toLowerCase().includes(s) || tx.reference?.toLowerCase().includes(s) || tx.description.toLowerCase().includes(s));
    }
    setFilteredTx(list); setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
  const pageTx = filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fmtDate = (d: string) => {
    if (!d) return '';
    let s = String(d); if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T');
    if (!s.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(s)) s += 'Z';
    return new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const statusBadge = (st: string) => {
    const m: Record<string, [string, string]> = {
      COMPLETED: ['Hoàn thành', 'completed'], PAID: ['Đã thanh toán', 'completed'],
      PENDING: ['Chờ xử lý', 'pending'], APPROVED: ['Đã duyệt', 'approved'],
      REJECTED: ['Từ chối', 'rejected'], CANCELLED: ['Đã hủy', 'cancelled'],
      FAILED: ['Thất bại', 'failed'], EXPIRED: ['Hết hạn', 'expired'],
    };
    const [l, c] = m[st] || [st, 'default'];
    return <span className={`admin-status-badge ${c}`}>{l}</span>;
  };

  const typeIcon = (t: TransactionType) => {
    const m: Record<string, React.ReactNode> = {
      WALLET: <Wallet size={16} />,
      PAYMENT: <CreditCard size={16} />,
      WITHDRAWAL: <ArrowDownLeft size={16} />,
      COIN_PURCHASE: <Coins size={16} />,
    };
    return m[t] || <DollarSign size={16} />;
  };

  const typeLabel = (t: TransactionType) => {
    const m: Record<string, string> = {
      WALLET: 'Ví',
      PAYMENT: 'Thanh toán',
      WITHDRAWAL: 'Rút tiền',
      COIN_PURCHASE: 'Mua xu',
    };
    return m[t] || t;
  };

  const handleDownload = async (tx: CombinedTransaction) => {
    try {
      let blob: Blob; let fn: string;
      if (tx.id.startsWith('WAL-')) { const id = parseInt(tx.id.replace('WAL-', '')); blob = await paymentService.adminDownloadWalletInvoice(id); fn = `wallet-${id}.pdf`; }
      else if (tx.id.startsWith('PAY-')) { const id = parseInt(tx.id.replace('PAY-', '')); blob = await paymentService.adminDownloadPaymentInvoice(id); fn = `invoice-${id}.pdf`; }
      else return;
      const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch (e) { showAppError('Không thể tải hóa đơn', 'Vui lòng thử lại sau.'); }
  };

  const pendingCount = transactions.filter(tx => tx.status === 'PENDING').length;
  const adminRevenue = stats.totalPlatformFees + stats.totalPurchaseRevenue;
  const todayRevenue = stats.todayPlatformFees + stats.todayPurchaseRevenue;

  // Chart Data Preparation
  const processChartData = () => {
    // 1. Revenue Trend (Area Chart)
    let revenueTrend: any[] = [];
    if (chartFilter === '7d' || chartFilter === '30d') {
      const days = chartFilter === '7d' ? 7 : 30;
      const dateList = [...Array(days)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
        return d.toISOString().split('T')[0];
      });
      revenueTrend = dateList.map(date => {
        const dayTx = transactions.filter(tx => tx.createdAt.startsWith(date) && tx.status === 'COMPLETED');
        let adminRev = 0; let mentorRev = 0;
        dayTx.forEach(tx => {
          const raw = getRawType(tx);
          if (ADMIN_REVENUE_TYPES.includes(raw)) adminRev += Math.abs(tx.amount);
          if (MENTOR_REVENUE_TYPES.includes(raw)) mentorRev += Math.abs(tx.amount);
        });
        return { date: date.slice(5).replace('-', '/'), admin: adminRev, mentor: mentorRev };
      });
    } else if (chartFilter === '1y') {
      const months = [...Array(12)].map((_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
        return d.toISOString().slice(0, 7); // YYYY-MM
      });
      revenueTrend = months.map(month => {
        const monthTx = transactions.filter(tx => tx.createdAt.startsWith(month) && tx.status === 'COMPLETED');
        let adminRev = 0; let mentorRev = 0;
        monthTx.forEach(tx => {
          const raw = getRawType(tx);
          if (ADMIN_REVENUE_TYPES.includes(raw)) adminRev += Math.abs(tx.amount);
          if (MENTOR_REVENUE_TYPES.includes(raw)) mentorRev += Math.abs(tx.amount);
        });
        return { date: month.slice(5).replace('-', '/'), admin: adminRev, mentor: mentorRev };
      });
    }

    // 2. Monthly Admin Revenue (Bar Chart) - Fixed 6 months
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    });
    const monthlyAdminRev = last6Months.map(month => {
      const monthTx = transactions.filter(tx => tx.createdAt.startsWith(month) && tx.status === 'COMPLETED');
      let rev = 0;
      monthTx.forEach(tx => {
        if (ADMIN_REVENUE_TYPES.includes(getRawType(tx))) rev += Math.abs(tx.amount);
      });
      return { month: month.slice(5).replace('-', '/'), revenue: rev };
    });

    // 3. Revenue Distribution (Pie)
    const distributionData = [
      { name: 'Doanh Thu Admin', value: adminRevenue, color: '#00e5ff' },
      { name: 'Thu Nhập Mentor', value: stats.totalMentorEarnings, color: '#34d399' },
      { name: 'Thu Nhập Student (Job)', value: stats.totalStudentEarnings, color: '#facc15' },
    ].filter(d => d.value > 0);

    return { revenueTrend, monthlyAdminRev, distributionData };
  };

  const { revenueTrend, monthlyAdminRev, distributionData } = processChartData();

  if (loading) return (
    <div className="admin-tx-cosmic"><div className="admin-loading-state"><RefreshCw size={40} className="spinning" /><p>Đang tải dữ liệu...</p></div></div>
  );

  const renderTable = (rows: CombinedTransaction[]) => (
    <div className="admin-tx-table">
      <table>
        <thead><tr>
          <th>Mã GD</th><th>Người dùng</th><th>Loại</th><th>Mô tả</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th><th>Hành động</th>
        </tr></thead>
        <tbody>
          {rows.map(tx => (
            <tr key={tx.id}>
              <td><span className="admin-tx-code">{tx.reference || tx.id}</span></td>
              <td><div className="admin-user-info">
                <div className="admin-user-avatar">{tx.userAvatarUrl ? <img src={tx.userAvatarUrl} alt="" /> : (tx.userName?.charAt(0).toUpperCase() || 'U')}</div>
                <div className="admin-user-name" title={tx.userName}>{truncName(tx.userName)}</div>
              </div></td>
              <td><span className={`admin-type-badge ${tx.type.toLowerCase()}`}>{typeIcon(tx.type)} {typeLabel(tx.type)}</span></td>
              <td className="admin-desc-cell">{tx.description}</td>
              <td>
                <span className={`admin-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                  {tx.amount >= 0 ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </td>
              <td>{statusBadge(tx.status)}</td>
              <td className="admin-date-cell">{fmtDate(tx.createdAt)}</td>
              <td className="admin-actions-cell">
                <button className="admin-action-btn view" onClick={() => { setSelectedTx(tx); setShowModal(true); }}><Eye size={14} /></button>
                {tx.status === 'COMPLETED' && (tx.id.startsWith('PAY-') || (tx.id.startsWith('WAL-') && tx.originalData?.currencyType === 'CASH')) && (
                  <button className="admin-action-btn download" onClick={() => handleDownload(tx)}><Download size={14} /></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPagination = () => totalPages > 1 && (
    <div className="admin-pagination">
      <button className="admin-pagination-btn" onClick={withPaginationScroll(() => setCurrentPage(p => p - 1))} disabled={currentPage === 1}>← Trước</button>
      <div className="admin-pagination-numbers">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p; if (totalPages <= 5) p = i + 1; else if (currentPage <= 3) p = i + 1; else if (currentPage >= totalPages - 2) p = totalPages - 4 + i; else p = currentPage - 2 + i;
          return <button key={p} className={`admin-pagination-number ${currentPage === p ? 'active' : ''}`} onClick={withPaginationScroll(() => setCurrentPage(p))}>{p}</button>;
        })}
      </div>
      <button className="admin-pagination-btn" onClick={withPaginationScroll(() => setCurrentPage(p => p + 1))} disabled={currentPage === totalPages}>Sau →</button>
      <div className="admin-pagination-info">Trang {currentPage}/{totalPages} ({filteredTx.length} giao dịch)</div>
    </div>
  );

  // Pre-compute tab counts
  const depositsTx = transactions.filter(tx => DEPOSIT_TYPES.includes(getRawType(tx)) || (tx.id.startsWith('PAY-') && tx.amount > 0));
  const adminRevenueTx = transactions.filter(tx => ADMIN_REVENUE_TYPES.includes(getRawType(tx)) || (tx.type === 'PAYMENT' && tx.amount > 0) || (tx.type === 'COIN_PURCHASE'));
  const mentorRevenueTx = transactions.filter(tx => MENTOR_REVENUE_TYPES.includes(getRawType(tx)));
  const withdrawalsTx = transactions.filter(tx => tx.type === 'WITHDRAWAL');
  const refundsTx = transactions.filter(tx => REFUND_TYPES.includes(getRawType(tx)));

  const tabs: { key: TabKey; icon: React.ReactNode; label: string; count?: number }[] = [
    { key: 'overview', icon: <BarChart3 size={18} />, label: 'Tổng Quan' },
    { key: 'deposits', icon: <ArrowUpRight size={18} />, label: 'Nạp Tiền', count: depositsTx.length },
    { key: 'adminRevenue', icon: <TrendingUp size={18} />, label: 'Doanh Thu', count: adminRevenueTx.length },
    { key: 'mentorRevenue', icon: <User size={18} />, label: 'Thu Nhập Mentor', count: mentorRevenueTx.length },
    { key: 'withdrawals', icon: <ArrowDownLeft size={18} />, label: 'Rút Tiền', count: withdrawalsTx.length },
    { key: 'refunds', icon: <RefreshCw size={18} />, label: 'Hoàn Tiền', count: refundsTx.length },
    { key: 'all', icon: <List size={18} />, label: 'Tất Cả GD', count: transactions.length },
  ];

  const overviewGroups: Array<{
    title: string;
    description: string;
    className: string;
    items: Array<{
      icon: React.ReactNode;
      value: string | number;
      label: string;
      variant: string;
      emphasis?: boolean;
    }>;
  }> = [
    {
      title: 'Dòng tiền chính',
      description: 'Các con số cần nhìn đầu tiên khi kiểm tra sức khỏe tài chính.',
      className: 'primary',
      items: [
        { icon: <ArrowUpRight size={24} />, value: fmt(stats.totalDeposits), label: 'Tiền nạp vào hệ thống', variant: 'deposits', emphasis: true },
        { icon: <ArrowDownLeft size={24} />, value: fmt(stats.totalWithdrawals), label: 'Rút tiền ngân hàng', variant: 'withdrawals', emphasis: true },
        { icon: <TrendingUp size={24} />, value: fmt(adminRevenue), label: 'Doanh thu admin', variant: 'revenue', emphasis: true },
        { icon: <Calendar size={24} />, value: fmt(todayRevenue), label: 'Doanh thu hôm nay', variant: 'info', emphasis: true },
      ],
    },
    {
      title: 'Phân bổ doanh thu',
      description: 'Tách phần nền tảng, mentor, student và booking.',
      className: 'revenue-split',
      items: [
        { icon: <DollarSign size={20} />, value: fmt(stats.totalPlatformFees), label: 'Hoa hồng admin 20%', variant: 'platform' },
        { icon: <User size={20} />, value: fmt(stats.totalMentorEarnings), label: 'Mentor nhận 80%', variant: 'mentor' },
        { icon: <Coins size={20} />, value: fmt(stats.totalStudentEarnings), label: 'Student nhận từ job', variant: 'student' },
        { icon: <CreditCard size={20} />, value: fmt(stats.totalBookingPayments), label: 'Thanh toán booking', variant: 'booking' },
      ],
    },
    {
      title: 'Đối soát & đóng băng',
      description: 'Các khoản cần theo dõi để hạn chế sai lệch dòng tiền.',
      className: 'risk',
      items: [
        { icon: <RefreshCw size={20} />, value: fmt(stats.totalRefunds), label: 'Hoàn tiền / hoàn ký quỹ', variant: 'warn' },
        { icon: <Filter size={20} />, value: fmt(stats.totalEscrowFunds), label: 'Ký quỹ đang đóng băng', variant: 'info' },
        { icon: <Wallet size={20} />, value: fmt(stats.totalFrozenCash), label: 'Ví đang đóng băng', variant: 'info' },
        { icon: <DollarSign size={20} />, value: fmt(stats.totalPurchaseRevenue), label: 'Premium / khóa học', variant: 'info' },
      ],
    },
    {
      title: 'Vận hành giao dịch',
      description: 'Khối lượng xử lý và các hàng đợi thao tác.',
      className: 'ops',
      items: [
        { icon: <BarChart3 size={20} />, value: transactions.length, label: 'Tổng giao dịch', variant: 'info' },
        { icon: <RefreshCw size={20} />, value: pendingCount, label: 'Đang chờ xử lý', variant: 'warn' },
        { icon: <ArrowDownLeft size={20} />, value: withdrawalsTx.length, label: 'Lệnh rút tiền', variant: 'info' },
        { icon: <RefreshCw size={20} />, value: refundsTx.length, label: 'Lệnh hoàn tiền', variant: 'info' },
      ],
    },
  ];

  const renderOverviewCard = (item: typeof overviewGroups[number]['items'][number]) => (
    <div className={`admin-stat-card ${item.variant} ${item.emphasis ? 'admin-stat-card--emphasis' : ''}`} key={item.label}>
      {item.icon}
      <div className="admin-stat-copy">
        <div className={`admin-stat-number ${item.emphasis ? '' : 'sm'}`}>{item.value}</div>
        <div className={`admin-stat-label ${item.emphasis ? '' : 'sm'}`}>{item.label}</div>
      </div>
    </div>
  );

  return (
    <div className="admin-tx-cosmic">
      {/* ===== Header ===== */}
      <div className="admin-tx-header">
        <div>
          <h2>Quản Lý Doanh Thu & Giao Dịch</h2>
          <p>Phân tích tài chính nền tảng SkillVerse — Dữ liệu realtime từ hệ thống</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn-refresh" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
          <button
            className="admin-btn-export"
            onClick={() => {
              const p: any = {};
              if (statusFilter !== 'ALL') p.status = statusFilter;
              adminService.downloadTransactionsReport(p);
            }}
          >
            <Download size={16} /> Xuất CSV
          </button>
          <button
            className="admin-btn-export"
            onClick={() => {
              const p: any = {};
              if (statusFilter !== 'ALL') p.status = statusFilter;
              adminService.downloadTransactionsReportPdf(p);
            }}
          >
            <Download size={16} /> Xuất PDF
          </button>
        </div>
      </div>

      {/* ===== Tab Bar ===== */}
      <div className="admin-tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`admin-tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <>
          <div className="admin-overview-groups">
            {overviewGroups.map(group => (
              <section key={group.title} className={`admin-overview-group admin-overview-group--${group.className}`}>
                <div className="admin-overview-group__header">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
                <div className="admin-stats-grid admin-stats-grid--grouped">
                  {group.items.map(renderOverviewCard)}
                </div>
              </section>
            ))}
          </div>

          <div className="admin-charts-section top-charts">
            <div className="admin-chart-card full-width">
              <div className="admin-chart-header">
                <h4><TrendingUp size={18} /> Xu Hướng Doanh Thu</h4>
                <div className="admin-chart-filters">
                  <button className={chartFilter === '7d' ? 'active' : ''} onClick={() => setChartFilter('7d')}>7 Ngày</button>
                  <button className={chartFilter === '30d' ? 'active' : ''} onClick={() => setChartFilter('30d')}>30 Ngày</button>
                  <button className={chartFilter === '1y' ? 'active' : ''} onClick={() => setChartFilter('1y')}>1 Năm</button>
                </div>
              </div>
              <div className="admin-chart-body admin-chart-body--large">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMentor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toString() + 'k'} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(0,229,255,0.2)', borderRadius: '8px', color: '#fff' }} formatter={(v: any) => fmt(Number(v))} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                    <Area type="monotone" dataKey="admin" name="Doanh Thu Admin" stroke="#00e5ff" strokeWidth={2} fillOpacity={1} fill="url(#colorAdmin)" />
                    <Area type="monotone" dataKey="mentor" name="Thu Nhập Mentor" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorMentor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-charts-section bottom-charts">
            <div className="admin-chart-card">
              <h4><BarChart3 size={18} /> Doanh Thu Admin (6 Tháng)</h4>
              <div className="admin-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAdminRev}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toString() + 'k'} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(0,229,255,0.2)', borderRadius: '8px', color: '#fff' }} formatter={(v: any) => fmt(Number(v))} cursor={{ fill: 'rgba(0, 229, 255, 0.05)' }} />
                    <Bar dataKey="revenue" name="Doanh Thu" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-chart-card">
              <h4><BarChart3 size={18} /> Cơ Cấu Dòng Tiền Toàn Hệ Thống</h4>
              <div className="admin-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                      {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(0,229,255,0.2)', borderRadius: '8px', color: '#fff' }} formatter={(v: any) => fmt(Number(v))} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== REVENUE / WITHDRAWALS / ALL TABS ===== */}
      {activeTab !== 'overview' && (
        <>
          {/* Filters */}
          <div className="admin-tx-filters">
            <div className="admin-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, mã giao dịch..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="admin-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Transaction Table */}
          {pageTx.length > 0 ? renderTable(pageTx) : (
            <div className="admin-empty-state">
              <DollarSign size={48} />
              <h3>Không có giao dịch</h3>
              <p>Không có giao dịch nào phù hợp với bộ lọc hiện tại</p>
            </div>
          )}

          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showModal && selectedTx && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-detail-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="admin-modal-header">
              <h3>Chi Tiết Giao Dịch</h3>
              <button className="admin-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-modal-body">
              {/* Transaction Info */}
              <div className="admin-detail-section">
                <h4>Thông Tin Giao Dịch</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <DollarSign size={16} />
                    <div>
                      <div className="label">Mã giao dịch</div>
                      <div className="value code">{selectedTx.reference || selectedTx.id}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    {typeIcon(selectedTx.type)}
                    <div>
                      <div className="label">Loại giao dịch</div>
                      <div className="value">{typeLabel(selectedTx.type)}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <TrendingUp size={16} />
                    <div>
                      <div className="label">Số tiền</div>
                      <div className={`value amount ${selectedTx.amount >= 0 ? 'positive' : 'negative'}`}>
                        {selectedTx.amount >= 0 ? '+' : '-'}{fmt(selectedTx.amount)}
                      </div>
                    </div>
                  </div>
                  {typeof selectedTx.originalAmount === 'number' && selectedTx.originalAmount !== Math.abs(selectedTx.amount) && (
                    <div className="admin-detail-item">
                      <TrendingUp size={16} />
                      <div>
                        <div className="label">Giá gốc</div>
                        <div className="value">{fmt(selectedTx.originalAmount)}</div>
                      </div>
                    </div>
                  )}
                  <div className="admin-detail-item">
                    <Calendar size={16} />
                    <div>
                      <div className="label">Thời gian</div>
                      <div className="value">{fmtDate(selectedTx.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="admin-detail-section">
                <h4>Thông Tin Người Dùng</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <User size={16} />
                    <div>
                      <div className="label">Tên người dùng</div>
                      <div className="value">{selectedTx.userName || 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <User size={16} />
                    <div>
                      <div className="label">Email</div>
                      <div className="value">{selectedTx.userEmail || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="admin-detail-section">
                <h4>Chi Tiết Bổ Sung</h4>
                <div className="admin-detail-item full">
                  <div>
                    <div className="label">Mô tả</div>
                    <div className="value">{selectedTx.description}</div>
                  </div>
                </div>
                {selectedTx.method && (
                  <div className="admin-detail-item full">
                    <div>
                      <div className="label">Phương thức thanh toán</div>
                      <div className="value">{selectedTx.method}</div>
                    </div>
                  </div>
                )}
                <div className="admin-detail-item full">
                  <div>
                    <div className="label">Trạng thái</div>
                    <div className="value">{statusBadge(selectedTx.status)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="admin-modal-footer">
              {selectedTx.status === 'COMPLETED' && (
                selectedTx.id.startsWith('PAY-') ||
                (selectedTx.id.startsWith('WAL-') && selectedTx.originalData?.currencyType === 'CASH')
              ) && (
                <button
                  className="admin-action-btn download admin-action-btn--invoice"
                  onClick={() => handleDownload(selectedTx)}
                >
                  <Download size={16} /> Tải hóa đơn
                </button>
              )}
              <button className="admin-action-btn close" onClick={() => setShowModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TransactionManagementTabCosmic;
