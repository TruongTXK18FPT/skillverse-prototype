import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet, DollarSign, Coins, TrendingDown, TrendingUp,
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, Activity,
  Gift, Zap, RefreshCw, CheckCircle, XCircle, Clock, Settings,
  Calendar, Crown, ChevronRight, Rocket, ShoppingBag, Search, Filter, Lock, Building2, AlertCircle, Shield,
  CreditCard, User, Sparkles, Minus, Target, History, FileText, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/walletService';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import DepositCashModal from '../../components/wallet/DepositCashModal';
import BuyCoinModal from '../../components/wallet/BuyCoinModal';
import WithdrawModal from '../../components/wallet/WithdrawModal';
import SetupBankAccountModal from '../../components/wallet/SetupBankAccountModal';
import StatisticsPanel from '../../components/wallet/StatisticsPanel';
import PaymentCallbackHelper from '../../components/wallet/PaymentCallbackHelper';
import CancelSubscriptionModal from '../../components/premium/CancelSubscriptionModal';
import CancelAutoRenewalModal from '../../components/premium/CancelAutoRenewalModal';
import EnableAutoRenewalModal from '../../components/premium/EnableAutoRenewalModal';
import { PremiumInvoice, useInvoice } from '../../components/invoice';
import Toast from '../../components/Toast';
import MeowlGuide from '../../components/MeowlGuide';
import './MyWalletCosmic.css';

interface WalletData {
  walletId: number;
  cashBalance: number;
  coinBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  hasBankAccount: boolean;
  hasTransactionPin: boolean;
  require2FA: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

interface Transaction {
  transactionId: number;
  transactionType?: string;
  amount?: number;
  cashAmount?: number;
  coinAmount?: number;
  description: string;
  createdAt: string;
  status: string;
  currencyType?: string;
  isCredit?: boolean;
  isDebit?: boolean;
}

interface WithdrawalRequestData {
  requestId: number;
  requestCode: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
}

interface StoreItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'courses' | 'certificates' | 'upgrades' | 'gifts';
  thumbnail: string;
  popularity: number;
  isNew?: boolean;
  isRecommended?: boolean;
}

const MyWalletCosmic: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // State
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestData[]>([]);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBuyCoinModal, setShowBuyCoinModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelAutoRenewalModal, setShowCancelAutoRenewalModal] = useState(false);
  const [showEnableAutoRenewalModal, setShowEnableAutoRenewalModal] = useState(false);
  const [showBankSetupModal, setShowBankSetupModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showCallbackHelper, setShowCallbackHelper] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'store' | 'settings' | 'withdrawals'>('overview');
  const [selectedStoreCategory, setSelectedStoreCategory] = useState<string>('all');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  
  // Toast
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });
  
  // Invoice hook
  const { showInvoice, invoiceData, openInvoice, closeInvoice } = useInvoice();


  // Store items data
  const storeItems: StoreItem[] = [
    {
      id: 'ai-premium',
      title: 'Gói Khóa học AI Premium',
      description: 'Làm chủ AI với 10 khóa học nâng cao',
      price: 299,
      category: 'courses',
      thumbnail: '🤖',
      popularity: 95,
      isRecommended: true
    },
    {
      id: 'fullstack-bundle',
      title: 'Bundle Full-Stack Developer',
      description: 'Trở thành Full-Stack Developer chuyên nghiệp',
      price: 399,
      category: 'courses',
      thumbnail: '💻',
      popularity: 92,
      isNew: true
    },
    {
      id: 'certificate-expert',
      title: 'Chứng chỉ Chuyên gia',
      description: 'Chứng chỉ premium được công nhận',
      price: 150,
      category: 'certificates',
      thumbnail: '🏆',
      popularity: 88,
      isRecommended: true
    },
    {
      id: 'profile-vip',
      title: 'Gói VIP Member',
      description: 'Trở thành VIP với nhiều đặc quyền',
      price: 199,
      category: 'upgrades',
      thumbnail: '💎',
      popularity: 90,
      isNew: true
    },
    {
      id: 'mentor-gift',
      title: 'Gói Quà Tặng Mentor',
      description: 'Gửi lời cảm ơn đến mentor yêu thích',
      price: 75,
      category: 'gifts',
      thumbnail: '🎁',
      popularity: 82
    },
    {
      id: 'super-gift',
      title: 'Quà Tặng Siêu Đặc Biệt',
      description: 'Món quà cao cấp nhất!',
      price: 300,
      category: 'gifts',
      thumbnail: '🎉',
      popularity: 79,
      isRecommended: true
    }
  ];

  const filteredStoreItems = storeItems.filter(item => {
    const matchesCategory = selectedStoreCategory === 'all' || item.category === selectedStoreCategory;
    const matchesSearch = item.title.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(storeSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const data = await walletService.getMyWallet();
      setWalletData(data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      showToast('error', 'Lỗi', 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await walletService.getTransactions();
      // Map cashAmount to amount for display
      const mappedData = response.content.map((tx: any) => ({
        ...tx,
        amount: tx.cashAmount !== undefined && tx.cashAmount !== null ? tx.cashAmount : tx.amount
      }));
      setTransactions(mappedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = async () => {
    try {
      const response = await walletService.getMyWithdrawalRequests(0, 20);
      setWithdrawalRequests(response.content);
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
    }
  };

  // Fetch premium subscription
  const fetchSubscription = async () => {
    try {
      const sub = await premiumService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  // Check for payment success callback
  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    const paymentMessage = searchParams.get('message');
    
    if (paymentStatus === 'success') {
      // Show callback helper for localhost development
      setShowCallbackHelper(true);
      // Clean URL
      window.history.replaceState({}, '', '/my-wallet');
    } else if (paymentStatus === 'cancel') {
      showToast('warning', '⚠️ Đã hủy thanh toán', 'Bạn đã hủy giao dịch nạp tiền');
      window.history.replaceState({}, '', '/my-wallet');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
      fetchWithdrawalRequests();
      fetchSubscription();
    }
  }, [user]);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setToast({ isVisible: true, type, title, message });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000);
  };

  const handleBuyCoinSuccess = () => {
    showToast('success', '🪙 Thành công', 'Mua xu thành công!');
    fetchWalletData();
    fetchTransactions();
  };

  const handleWithdrawSuccess = () => {
    showToast('success', '💸 Thành công', 'Yêu cầu rút tiền đã được tạo. Vui lòng chờ duyệt!');
    fetchWalletData();
    fetchTransactions();
    fetchWithdrawalRequests();
  };

  const handleBuyStoreItem = (item: StoreItem) => {
    if (!walletData || walletData.coinBalance < item.price) {
      showToast('error', 'Lỗi', 'Số xu không đủ để mua sản phẩm này');
      return;
    }
    showToast('info', '🛒 Thông báo', `Tính năng mua "${item.title}" đang được phát triển`);
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Tỷ giá: 1 xu = 76 VND
  const COIN_TO_VND_RATE = 76;

  const calculateTotalAssets = () => {
    const cashBalance = walletData?.cashBalance || 0;
    const coinBalance = walletData?.coinBalance || 0;
    const coinValueInVND = coinBalance * COIN_TO_VND_RATE;
    return cashBalance + coinValueInVND;
  };

  const calculateAssetAllocation = () => {
    const totalAssets = calculateTotalAssets();
    if (totalAssets === 0) return { cashPercent: 0, coinPercent: 0 };

    const cashBalance = walletData?.cashBalance || 0;
    const coinBalance = walletData?.coinBalance || 0;
    const coinValueInVND = coinBalance * COIN_TO_VND_RATE;

    return {
      cashPercent: (cashBalance / totalAssets) * 100,
      coinPercent: (coinValueInVND / totalAssets) * 100,
      cashValue: cashBalance,
      coinValue: coinValueInVND,
      totalValue: totalAssets
    };
  };

  const getTransactionIcon = (type?: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDownLeft className="tx-icon deposit" />;
      case 'WITHDRAWAL': return <ArrowUpRight className="tx-icon withdrawal" />;
      case 'COIN_PURCHASE': return <Coins className="tx-icon coin" />;
      case 'COIN_EARN': return <Gift className="tx-icon earn" />;
      case 'COIN_SPEND': return <Zap className="tx-icon spend" />;
      case 'REFUND': return <RefreshCw className="tx-icon refund" />;
      default: return <Activity className="tx-icon" />;
    }
  };

  const isTransactionCredit = (type?: string) => {
    // Credit transactions (money IN): +
    const creditTypes = ['DEPOSIT_CASH', 'DEPOSIT', 'REFUND_CASH', 'REFUND', 'EARN_COINS', 'RECEIVE_TIP', 'BONUS_COINS', 'REWARD_ACHIEVEMENT', 'DAILY_LOGIN_BONUS'];
    return type ? creditTypes.some(t => type.toUpperCase().includes(t)) : false;
  };

  const isTransactionDebit = (type?: string) => {
    // Debit transactions (money OUT): -
    const debitTypes = ['WITHDRAWAL', 'PURCHASE', 'SPEND', 'TIP_MENTOR'];
    return type ? debitTypes.some(t => type.toUpperCase().includes(t)) : false;
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: JSX.Element } = {
      'COMPLETED': <span className="status-badge success"><CheckCircle size={14} /> Hoàn thành</span>,
      'PENDING': <span className="status-badge pending"><Clock size={14} /> Đang xử lý</span>,
      'FAILED': <span className="status-badge failed"><XCircle size={14} /> Thất bại</span>,
      'CANCELLED': <span className="status-badge cancelled"><XCircle size={14} /> Đã hủy</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  // Check if transaction type supports invoice download
  const canDownloadInvoice = (tx: Transaction) => {
    const purchaseTypes = ['PURCHASE_PREMIUM', 'PURCHASE_COINS', 'PURCHASE_COURSE'];
    return tx.status === 'COMPLETED' && 
           tx.transactionType && 
           purchaseTypes.some(t => tx.transactionType!.toUpperCase().includes(t));
  };

  // Handle invoice download
  const handleDownloadInvoice = async (transactionId: number) => {
    try {
      const blob = await walletService.downloadTransactionInvoice(transactionId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('success', '📄 Thành công', 'Đã tải hóa đơn thành công!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast('error', 'Lỗi', 'Không thể tải hóa đơn. Vui lòng thử lại sau.');
    }
  };

  if (loading) {
    return (
      <div className="cosmic-wallet-container">
        <div className="cosmic-loading">
          <div className="cosmic-spinner"></div>
          <p>Đang tải dữ liệu vũ trụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-wallet-container">
      {/* Cosmic Background */}
      <div className="cosmic-bg">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Header */}
      <div className="cosmic-header">
        <div className="header-content">
          <div className="header-title">
            <Wallet className="header-icon" />
            <h1>Ví Vũ Trụ</h1>
            <Sparkles className="sparkle-icon" />
          </div>
          <p className="header-subtitle">Quản lý tài sản của bạn trong vũ trụ SkillVerse</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="balance-grid">
        {/* Combined Balance Card */}
        <div className="balance-card combined-card">
          <div className="card-glow"></div>
          <div className="card-header">
            <div className="card-title">
              <Wallet className="card-icon" />
              <span>Số Dư Tài Khoản</span>
            </div>
            <button 
              className="toggle-balance-btn"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          
          <div className="balance-split">
            <div className="balance-item cash">
              <div className="balance-label">
                <DollarSign size={20} />
                <span>Tiền Mặt</span>
              </div>
              <div className="balance-value">
                {showBalance ? formatCurrency(walletData?.cashBalance || 0) : '••••••'}
              </div>
              {showBalance && (
                <div className="balance-percent">
                  {calculateAssetAllocation().cashPercent.toFixed(1)}% tổng tài sản
                </div>
              )}
            </div>
            
            <div className="balance-divider"></div>
            
            <div className="balance-item coin">
              <div className="balance-label">
                <Coins size={20} />
                <span>SkillCoin</span>
              </div>
              <div className="balance-value">
                {showBalance ? (walletData?.coinBalance || 0).toLocaleString() : '••••••'}
                <span className="coin-label">xu</span>
              </div>
              {showBalance && (
                <div className="balance-percent">
                  {calculateAssetAllocation().coinPercent.toFixed(1)}% tổng tài sản
                  <span className="coin-vnd-value">
                    ≈ {formatCurrency(calculateAssetAllocation().coinValue || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {showBalance && (
            <div className="total-assets">
              <TrendingUp size={18} />
              <span>Tổng tài sản:</span>
              <strong>{formatCurrency(calculateTotalAssets())}</strong>
            </div>
          )}
          
          <div className="card-actions">
            <button className="w-action-btn primary" onClick={() => setShowDepositModal(true)}>
              <Plus size={16} />
              Nạp tiền
            </button>
            <button className="w-action-btn primary" onClick={() => setShowBuyCoinModal(true)}>
              <Rocket size={16} />
              Mua xu
            </button>
            <button className="w-action-btn secondary" onClick={() => setShowWithdrawModal(true)}>
              <Minus size={16} />
              Rút tiền
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <StatisticsPanel walletData={walletData} transactions={transactions} />

      {/* Tabs */}
      <div className="cosmic-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Target size={18} />
          Tổng quan
        </button>
        <button 
          className={`tab-btn ${activeTab === 'store' ? 'active' : ''}`}
          onClick={() => setActiveTab('store')}
        >
          <ShoppingBag size={18} />
          Cửa Hàng
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <History size={18} />
          Lịch sử
        </button>
        <button 
          className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <ArrowUpRight size={18} />
          Yêu cầu rút tiền
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          Cài đặt
        </button>
      </div>

      {/* Content */}
      <div className="cosmic-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Premium Subscription Section */}
            {subscription && (
              <div className="premium-subscription-card">
                <div className="premium-header">
                  <Crown className="premium-icon" />
                  <h3>Gói Premium</h3>
                </div>
                <div className="premium-content">
                  <div className="premium-info">
                    <div className="premium-plan">
                      <span className="plan-label">Gói hiện tại:</span>
                      <span className="plan-name">{subscription.plan.displayName}</span>
                    </div>
                    <div className="premium-dates">
                      <div className="date-item">
                        <Calendar size={16} />
                        <span>Bắt đầu: {new Date(subscription.startDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="date-item">
                        <Calendar size={16} />
                        <span>Hết hạn: {new Date(subscription.endDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="premium-status">
                      <span className={`status-badge status-${subscription.status.toLowerCase()}`}>
                        {subscription.status === 'ACTIVE' ? '✓ Đang hoạt động' : subscription.status}
                      </span>
                    </div>
                  </div>
                  <div className="premium-actions">
                    {subscription.plan.planType !== 'FREE_TIER' && (
                      <>
                        <button 
                          className="view-invoice-btn"
                          onClick={() => openInvoice(
                            subscription,
                            user?.fullName || 'Khách hàng',
                            user?.email || '',
                            user?.id
                          )}
                        >
                          <FileText size={16} />
                          Xem hóa đơn
                        </button>
                        {subscription.autoRenew ? (
                          <button 
                            className="cancel-auto-renewal-btn"
                            onClick={() => setShowCancelAutoRenewalModal(true)}
                          >
                            <RefreshCw size={16} />
                            Hủy thanh toán tự động
                          </button>
                        ) : (
                          <button 
                            className="enable-auto-renewal-btn"
                            onClick={() => setShowEnableAutoRenewalModal(true)}
                          >
                            <RefreshCw size={16} />
                            Bật thanh toán tự động
                          </button>
                        )}
                        <button 
                          className="cancel-subscription-btn"
                          onClick={() => setShowCancelModal(true)}
                        >
                          <XCircle size={16} />
                          Hủy gói & hoàn tiền
                        </button>
                      </>
                    )}
                    <button 
                      className="upgrade-btn"
                      onClick={() => window.location.href = '/premium'}
                    >
                      <Zap size={16} />
                      Nâng cấp
                    </button>
                  </div>
                </div>
              </div>
            )}

            <h2 className="section-title">
              <Zap className="title-icon" />
              Giao dịch gần đây
            </h2>
            <div className="transactions-list">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <Sparkles size={48} />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                transactions.slice(0, 5).map((tx) => (
                  <div key={tx.transactionId} className="transaction-item">
                    {getTransactionIcon(tx.transactionType)}
                    <div className="tx-info">
                      <p className="tx-desc">{tx.description}</p>
                      <p className="tx-date">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="tx-amount">
                      {tx.amount !== undefined && tx.amount !== null ? (
                        <p className={isTransactionCredit(tx.transactionType) ? 'positive' : 'negative'}>
                          {isTransactionCredit(tx.transactionType) ? '+' : '-'}{formatCurrency(Math.abs(tx.amount || 0))}
                        </p>
                      ) : null}
                      {tx.coinAmount && (
                        <p className="tx-coins">{tx.coinAmount > 0 ? '+' : '-'}{Math.abs(tx.coinAmount)} xu</p>
                      )}
                    </div>
                    {getStatusBadge(tx.status)}
                  </div>
                ))
              )}
            </div>
            {transactions.length > 5 && (
              <button className="view-all-btn" onClick={() => setActiveTab('transactions')}>
                Xem tất cả <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-section">
            <h2 className="section-title">
              <History className="title-icon" />
              Tất cả giao dịch
            </h2>
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx.transactionId} className="transaction-item">
                  {getTransactionIcon(tx.transactionType)}
                  <div className="tx-info">
                    <p className="tx-desc">{tx.description}</p>
                    <p className="tx-date">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="tx-amount">
                    {tx.amount !== undefined && tx.amount !== null ? (
                      <p className={isTransactionCredit(tx.transactionType) ? 'positive' : 'negative'}>
                        {isTransactionCredit(tx.transactionType) ? '+' : '-'}{formatCurrency(Math.abs(tx.amount || 0))}
                      </p>
                    ) : null}
                    {tx.coinAmount && (
                      <p className="tx-coins">{tx.coinAmount > 0 ? '+' : '-'}{Math.abs(tx.coinAmount)} xu</p>
                    )}
                  </div>
                  <div className="tx-actions">
                    {getStatusBadge(tx.status)}
                    {canDownloadInvoice(tx) && (
                      <button 
                        className="tx-download-btn"
                        onClick={() => handleDownloadInvoice(tx.transactionId)}
                        title="Tải hóa đơn PDF"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {activeTab === 'store' && (
          <div className="store-section">
            <div className="store-header">
              <div>
                <h2 className="section-title">
                  <ShoppingBag className="title-icon" />
                  Cửa Hàng SkillCoin
                </h2>
                <p className="section-subtitle">Sử dụng SkillCoin để mua các mặt hàng độc quyền</p>
              </div>
              <div className="store-balance">
                <Coins size={20} />
                <span>Số dư: {walletData?.coinBalance || 0} xu</span>
              </div>
            </div>

            <div className="store-filters">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={storeSearchTerm}
                  onChange={(e) => setStoreSearchTerm(e.target.value)}
                />
              </div>
              <div className="category-filters">
                <button 
                  className={`filter-btn ${selectedStoreCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedStoreCategory('all')}
                >
                  <Filter size={16} />
                  Tất cả
                </button>
                <button 
                  className={`filter-btn ${selectedStoreCategory === 'courses' ? 'active' : ''}`}
                  onClick={() => setSelectedStoreCategory('courses')}
                >
                  Khóa học
                </button>
                <button 
                  className={`filter-btn ${selectedStoreCategory === 'certificates' ? 'active' : ''}`}
                  onClick={() => setSelectedStoreCategory('certificates')}
                >
                  Chứng chỉ
                </button>
                <button 
                  className={`filter-btn ${selectedStoreCategory === 'upgrades' ? 'active' : ''}`}
                  onClick={() => setSelectedStoreCategory('upgrades')}
                >
                  Nâng cấp
                </button>
                <button 
                  className={`filter-btn ${selectedStoreCategory === 'gifts' ? 'active' : ''}`}
                  onClick={() => setSelectedStoreCategory('gifts')}
                >
                  Quà tặng
                </button>
              </div>
            </div>

            <div className="store-grid">
              {filteredStoreItems.length === 0 ? (
                <div className="empty-state">
                  <Sparkles size={48} />
                  <p>Không tìm thấy sản phẩm nào</p>
                </div>
              ) : (
                filteredStoreItems.map((item) => (
                  <div key={item.id} className="store-item">
                    {item.isNew && <div className="item-badge new-badge">✨ MỚI</div>}
                    {item.isRecommended && <div className="item-badge recommend-badge">⭐ ĐỀ XUẤT</div>}
                    
                    <div className="item-thumbnail">{item.thumbnail}</div>
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-description">{item.description}</p>
                    
                    <div className="item-footer">
                      <div className="item-price">
                        <Coins size={16} />
                        <span>{item.price} xu</span>
                      </div>
                      <button 
                        className="item-buy-btn"
                        onClick={() => handleBuyStoreItem(item)}
                        disabled={!walletData || walletData.coinBalance < item.price}
                      >
                        {!walletData || walletData.coinBalance < item.price ? 'Không đủ xu' : 'Mua'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2 className="section-title">
              <Settings className="title-icon" />
              Cài Đặt Tài Khoản
            </h2>
            
            <div className="settings-grid">
              {/* Bank Account Settings */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-icon bank">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3>Tài Khoản Ngân Hàng</h3>
                    <p>Thiết lập tài khoản để rút tiền</p>
                  </div>
                </div>
                
                <div className="settings-card-body">
                  {walletData?.hasBankAccount ? (
                    <div className="settings-info">
                      <div className="info-row">
                        <span className="info-label">Trạng thái:</span>
                        <span className="status-badge success">
                          <CheckCircle size={14} /> Đã thiết lập
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Ngân hàng:</span>
                        <span className="info-value">{walletData?.bankName || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Số tài khoản:</span>
                        <span className="info-value">***{walletData?.bankAccountNumber?.slice(-4) || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="settings-empty">
                      <AlertCircle size={32} />
                      <p>Chưa thiết lập tài khoản ngân hàng</p>
                    </div>
                  )}
                </div>
                
                <div className="settings-card-footer">
                  <button 
                    className="settings-btn primary"
                    onClick={() => setShowBankSetupModal(true)}
                  >
                    <Building2 size={16} />
                    {walletData?.hasBankAccount ? 'Cập nhật' : 'Thiết lập ngay'}
                  </button>
                </div>
              </div>

              {/* Transaction PIN Settings */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-icon pin">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h3>Mã PIN Giao Dịch</h3>
                    <p>Bảo mật cho các giao dịch rút tiền</p>
                  </div>
                </div>
                
                <div className="settings-card-body">
                  {walletData?.hasTransactionPin ? (
                    <div className="settings-info">
                      <div className="info-row">
                        <span className="info-label">Trạng thái:</span>
                        <span className="status-badge success">
                          <CheckCircle size={14} /> Đã thiết lập
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Mã PIN:</span>
                        <span className="info-value">••••••</span>
                      </div>
                      <div className="info-note">
                        <Lock size={14} />
                        <span>Mã PIN được mã hóa an toàn</span>
                      </div>
                    </div>
                  ) : (
                    <div className="settings-empty">
                      <AlertCircle size={32} />
                      <p>Chưa thiết lập mã PIN giao dịch</p>
                    </div>
                  )}
                </div>
                
                <div className="settings-card-footer">
                  <button 
                    className="settings-btn primary"
                    onClick={() => setShowPinSetupModal(true)}
                  >
                    <Lock size={16} />
                    {walletData?.hasTransactionPin ? 'Đổi PIN' : 'Thiết lập ngay'}
                  </button>
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="security-tips">
              <h3>
                <Shield size={20} />
                Lưu Ý Bảo Mật
              </h3>
              <ul>
                <li>
                  <CheckCircle size={16} />
                  <span>Không chia sẻ mã PIN với bất kỳ ai</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Sử dụng mã PIN khác với mật khẩu đăng nhập</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Thay đổi mã PIN định kỳ để tăng cường bảo mật</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Kiểm tra kỹ thông tin ngân hàng trước khi lưu</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="withdrawals-section">
            <h2 className="section-title">
              <ArrowUpRight className="title-icon" />
              Yêu Cầu Rút Tiền
            </h2>

            {withdrawalRequests.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={64} />
                <h3>Chưa có yêu cầu rút tiền</h3>
                <p>Các yêu cầu rút tiền của bạn sẽ hiển thị ở đây</p>
                <button className="btn-primary" onClick={() => setShowWithdrawModal(true)}>
                  <Plus size={18} />
                  Tạo yêu cầu rút tiền
                </button>
              </div>
            ) : (
              <div className="withdrawal-requests-list">
                {withdrawalRequests.map((request) => (
                  <div key={request.requestId} className="withdrawal-request-card">
                    <div className="request-header">
                      <div className="request-code">
                        <span className="code-label">Mã yêu cầu:</span>
                        <span className="code-value">{request.requestCode}</span>
                      </div>
                      <div className={`status-badge ${request.status.toLowerCase()}`}>
                        {request.status === 'PENDING' && <Clock size={14} />}
                        {request.status === 'APPROVED' && <CheckCircle size={14} />}
                        {request.status === 'COMPLETED' && <CheckCircle size={14} />}
                        {request.status === 'REJECTED' && <XCircle size={14} />}
                        {request.status === 'CANCELLED' && <XCircle size={14} />}
                        {request.status === 'PENDING' && 'Chờ duyệt'}
                        {request.status === 'APPROVED' && 'Đã duyệt'}
                        {request.status === 'COMPLETED' && 'Hoàn thành'}
                        {request.status === 'REJECTED' && 'Từ chối'}
                        {request.status === 'CANCELLED' && 'Đã hủy'}
                      </div>
                    </div>

                    <div className="request-body">
                      <div className="request-amount">
                        <DollarSign size={24} />
                        <div>
                          <span className="amount-label">Số tiền rút</span>
                          <span className="amount-value">{formatCurrency(request.amount)}</span>
                        </div>
                      </div>

                      <div className="request-details">
                        <div className="detail-row">
                          <Building2 size={16} />
                          <span className="detail-label">Ngân hàng:</span>
                          <span className="detail-value">{request.bankName}</span>
                        </div>
                        <div className="detail-row">
                          <CreditCard size={16} />
                          <span className="detail-label">Số TK:</span>
                          <span className="detail-value">{request.bankAccountNumber}</span>
                        </div>
                        <div className="detail-row">
                          <User size={16} />
                          <span className="detail-label">Chủ TK:</span>
                          <span className="detail-value">{request.bankAccountName}</span>
                        </div>
                        <div className="detail-row">
                          <Clock size={16} />
                          <span className="detail-label">Ngày tạo:</span>
                          <span className="detail-value">{formatDate(request.createdAt)}</span>
                        </div>
                        {request.processedAt && (
                          <div className="detail-row">
                            <CheckCircle size={16} />
                            <span className="detail-label">Ngày xử lý:</span>
                            <span className="detail-value">{formatDate(request.processedAt)}</span>
                          </div>
                        )}
                      </div>

                      {request.adminNotes && (
                        <div className="admin-notes">
                          <AlertCircle size={16} />
                          <div>
                            <strong>Ghi chú từ Admin:</strong>
                            <p>{request.adminNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Deposit Modal */}
      <DepositCashModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={(amount) => {
          showToast('success', '✅ Thành công', `Đã nạp ${formatCurrency(amount)} vào ví!`);
          fetchWalletData();
          fetchTransactions();
        }}
      />

      {/* Buy Coin Modal */}
      <BuyCoinModal
        isOpen={showBuyCoinModal}
        onClose={() => setShowBuyCoinModal(false)}
        onSuccess={handleBuyCoinSuccess}
        currentBalance={walletData?.cashBalance || 0}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={handleWithdrawSuccess}
        currentBalance={walletData?.cashBalance || 0}
        hasBankAccount={walletData?.hasBankAccount || false}
        hasTransactionPin={walletData?.hasTransactionPin || false}
        bankName={walletData?.bankName}
        bankAccountNumber={walletData?.bankAccountNumber}
        bankAccountName={walletData?.bankAccountName}
      />

      {/* Setup Bank Account Modal */}
      <SetupBankAccountModal
        isOpen={showBankSetupModal}
        onClose={() => setShowBankSetupModal(false)}
        onSuccess={() => {
          setShowBankSetupModal(false);
          showToast('success', '✅ Thành công', 'Đã thiết lập tài khoản ngân hàng!');
          fetchWalletData();
        }}
        needsBank={!walletData?.hasBankAccount}
        needsPin={false}
      />

      {/* Setup PIN Modal */}
      <SetupBankAccountModal
        isOpen={showPinSetupModal}
        onClose={() => setShowPinSetupModal(false)}
        onSuccess={() => {
          setShowPinSetupModal(false);
          showToast('success', '🔒 Thành công', 'Đã thiết lập mã PIN giao dịch!');
          fetchWalletData();
        }}
        needsBank={false}
        needsPin={!walletData?.hasTransactionPin}
      />

      {/* Payment Callback Helper */}
      <PaymentCallbackHelper
        isVisible={showCallbackHelper}
        onClose={() => setShowCallbackHelper(false)}
        onSuccess={() => {
          fetchWalletData();
          fetchTransactions();
          showToast('success', '✅ Nạp tiền thành công!', 'Số dư đã được cập nhật');
        }}
      />

      {/* Enable Auto-Renewal Modal */}
      <EnableAutoRenewalModal
        isOpen={showEnableAutoRenewalModal}
        onClose={() => setShowEnableAutoRenewalModal(false)}
        subscription={subscription}
        onSuccess={async () => {
          await fetchSubscription();
          showToast('success', '✅ Thành công', 'Đã bật thanh toán tự động');
        }}
      />

      {/* Cancel Auto-Renewal Modal */}
      <CancelAutoRenewalModal
        isOpen={showCancelAutoRenewalModal}
        onClose={() => setShowCancelAutoRenewalModal(false)}
        subscription={subscription}
        onSuccess={async () => {
          await fetchSubscription();
          showToast('success', '✅ Thành công', 'Đã hủy thanh toán tự động');
        }}
      />

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        subscription={subscription}
        onSuccess={async () => {
          await fetchSubscription();
          await fetchWalletData();
          await fetchTransactions();
          showToast('success', '✅ Thành công', 'Đã hủy gói đăng ký');
        }}
      />

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <PremiumInvoice data={invoiceData} onClose={closeInvoice} />
      )}

      {/* Toast */}
      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Meowl Guide */}
      <MeowlGuide currentPage="wallet" />
    </div>
  );
};

export default MyWalletCosmic;
