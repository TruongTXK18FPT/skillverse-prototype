import React, { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet, DollarSign, Coins, TrendingDown, TrendingUp,
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, Activity,
  Gift, Zap, RefreshCw, CheckCircle, XCircle, Clock, Settings,
  Calendar, Crown, ChevronRight, Rocket, ShoppingBag, Search, Filter, Lock, Building2, AlertCircle, Shield,
  CreditCard, User, Sparkles, Minus, Target, History, FileText, Download
} from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/walletService';
import { premiumService } from '../../services/premiumService';
import { paymentService } from '../../services/paymentService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import { PaymentTransactionResponse } from '../../data/paymentDTOs';
import DepositCashModal from '../../components/wallet/DepositCashModal';
import BuyCoinModal from '../../components/wallet/BuyCoinModal';
import WithdrawModal from '../../components/wallet/WithdrawModal';
import SetupBankAccountModal from '../../components/wallet/SetupBankAccountModal';
import StatisticsPanel from '../../components/wallet/StatisticsPanel';
import PaymentOrderHistorySection from '../../components/wallet/PaymentOrderHistorySection';
import CancelSubscriptionModal from '../../components/premium/CancelSubscriptionModal';
import CancellationLimitModal from '../../components/premium/CancellationLimitModal';
import CancelAutoRenewalModal from '../../components/premium/CancelAutoRenewalModal';
import EnableAutoRenewalModal from '../../components/premium/EnableAutoRenewalModal';
import { PremiumInvoice, useInvoice } from '../../components/invoice';
import Toast from '../../components/shared/Toast';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import styles from './MyWalletAlien.module.css';
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
  referenceType?: string;
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
  const [paymentOrders, setPaymentOrders] = useState<PaymentTransactionResponse[]>([]);
  const [paymentOrdersLoaded, setPaymentOrdersLoaded] = useState(false);
  const [paymentOrdersLoading, setPaymentOrdersLoading] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestData[]>([]);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBuyCoinModal, setShowBuyCoinModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancellationLimitModal, setShowCancellationLimitModal] = useState(false);
  const [cancellationLimitMessage, setCancellationLimitMessage] = useState('');
  const [showCancelAutoRenewalModal, setShowCancelAutoRenewalModal] = useState(false);
  const [showEnableAutoRenewalModal, setShowEnableAutoRenewalModal] = useState(false);
  const [showBankSetupModal, setShowBankSetupModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
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

  const fetchPaymentOrders = useCallback(async (options: { force?: boolean } = {}) => {
    const shouldForce = options.force === true;

    if (!shouldForce && (paymentOrdersLoaded || paymentOrdersLoading)) {
      return;
    }

    try {
      setPaymentOrdersLoading(true);
      const orders = await paymentService.getPaymentHistory();
      setPaymentOrders(
        orders.filter((order) => {
          const paymentMethod = (order.paymentMethod || '').toUpperCase();
          const paymentType = (order.type || '').toUpperCase();
          return paymentMethod === 'PAYOS' && paymentType === 'WALLET_TOPUP';
        })
      );
      setPaymentOrdersLoaded(true);
    } catch (error) {
      console.error('Error fetching payment order history:', error);
    } finally {
      setPaymentOrdersLoading(false);
    }
  }, [paymentOrdersLoaded, paymentOrdersLoading]);
  //sivi fetch fix
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
      showToast(
        'success',
        '✅ Nạp tiền thành công',
        paymentMessage || 'Giao dịch đã hoàn tất. Hệ thống sẽ tự đồng bộ số dư trong giây lát.'
      );
      fetchWalletData();
      fetchTransactions();
      if (paymentOrdersLoaded) {
        fetchPaymentOrders({ force: true });
      }
      // Clean URL
      window.history.replaceState({}, '', '/my-wallet');
    } else if (paymentStatus === 'cancel') {
      showToast('warning', '⚠️ Đã hủy nạp tiền', 'Bạn đã hủy giao dịch nạp tiền qua PayOS');
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

  useEffect(() => {
    if (activeTab === 'transactions' && user) {
      fetchPaymentOrders();
    }
  }, [activeTab, user, fetchPaymentOrders]);

  useEffect(() => {
    setPaymentOrders([]);
    setPaymentOrdersLoaded(false);
    setPaymentOrdersLoading(false);
  }, [user?.id]);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setToast({ isVisible: true, type, title, message });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000);
  };

  const handleBuyCoinSuccess = () => {
    showToast('success', '🪙 Thành công', 'Mua xu thành công!');
    fetchWalletData();
    fetchTransactions();
    if (paymentOrdersLoaded) {
      fetchPaymentOrders({ force: true });
    }
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

  const assetAllocation = calculateAssetAllocation();

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
    const creditTypes = [
      'DEPOSIT_CASH',
      'DEPOSIT',
      'REFUND_CASH',
      'REFUND',
      'EARN_COINS',
      'RECEIVE_TIP',
      'BONUS_COINS',
      'REWARD_ACHIEVEMENT',
      'DAILY_LOGIN_BONUS',
      'MENTOR_BOOKING',
      'COURSE_PAYOUT',
      'ADMIN_ADJUSTMENT'
    ];
    return type ? creditTypes.some(t => type.toUpperCase().includes(t)) : false;
  };

  const isTransactionDebit = (type?: string, referenceType?: string, description?: string) => {
    // Debit transactions (money OUT): -
    const debitTypes = ['WITHDRAWAL', 'PURCHASE', 'SPEND', 'TIP_MENTOR'];
    
    // Check reference type for SKIN_PURCHASE
    if (referenceType && referenceType.toUpperCase() === 'SKIN_PURCHASE') return true;

    // Check description for skin purchase
    if (description && (description.toLowerCase().includes('purchase skin') || description.toLowerCase().includes('mua skin'))) return true;

    return type ? debitTypes.some(t => type.toUpperCase().includes(t)) : false;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    const badges: { [key: string]: JSX.Element } = {
      'COMPLETED': <span className={`${styles['alien-status-badge']} ${styles['success']}`}><CheckCircle size={14} /> Hoàn thành</span>,
      'PENDING': <span className={`${styles['alien-status-badge']} ${styles['pending']}`}><Clock size={14} /> Đang xử lý</span>,
      'FAILED': <span className={`${styles['alien-status-badge']} ${styles['failed']}`}><XCircle size={14} /> Thất bại</span>,
      'CANCELLED': <span className={`${styles['alien-status-badge']} ${styles['canceled']}`}><XCircle size={14} /> Đã hủy</span>,
      'CANCELED': <span className={`${styles['alien-status-badge']} ${styles['canceled']}`}><XCircle size={14} /> Đã hủy</span>
    };
    return badges[s] || <span className={styles['alien-status-badge']}>{status}</span>;
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
          <MeowlKuruLoader size="medium" text="" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['alien-wallet-container']}>
      {/* Header */}
      <div className={styles['alien-header']}>
        <div className={styles['alien-header-shell']}>
          <div className={styles['alien-header-status']}>
            <div className={styles['alien-status-left']}>
              <span className={styles['alien-status-dot']}></span>
              <span className={styles['alien-status-text']}>WALLET CORE ONLINE</span>
            </div>
            <div className={styles['alien-id-chip']}>
              ID {walletData?.walletId || '--'}
            </div>
          </div>

          <div className={styles['alien-header-main']}>
            <div className={styles['alien-header-title-container']}>
              <div className={styles['alien-header-title-wrap']}>
                <Wallet className={styles['alien-header-icon']} />
                <h1 className={styles['alien-header-title']}>Ví SkillVerse</h1>
                <Sparkles className={styles['alien-sparkle-icon']} />
              </div>
            </div>

            <div className={styles['alien-header-chart-mini']}>
              <svg viewBox="0 0 200 60" className={styles['alien-mini-chart-svg']} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                  <mask id="chart-mask">
                    <rect x="0" y="0" width="200" height="60" fill="white" />
                  </mask>
                </defs>
                
                {/* Background Grid Lines */}
                <line x1="0" y1="15" x2="200" y2="15" stroke="rgba(34, 211, 238, 0.05)" strokeWidth="0.5" />
                <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(34, 211, 238, 0.05)" strokeWidth="0.5" />
                <line x1="0" y1="45" x2="200" y2="45" stroke="rgba(34, 211, 238, 0.05)" strokeWidth="0.5" />

                <path 
                  d="M0,45 Q20,40 40,50 T80,30 T120,40 T160,10 T200,25 L200,60 L0,60 Z" 
                  className={styles['alien-mini-chart-fill']}
                />
                
                <path 
                  d="M0,45 Q20,40 40,50 T80,30 T120,40 T160,10 T200,25" 
                  className={styles['alien-mini-chart-path']}
                />

                {/* Data Points */}
                <circle cx="40" cy="50" r="2.5" className={styles['alien-chart-dot']} />
                <circle cx="80" cy="30" r="2.5" className={styles['alien-chart-dot']} style={{ animationDelay: '0.5s' }} />
                <circle cx="120" cy="40" r="2.5" className={styles['alien-chart-dot']} style={{ animationDelay: '1s' }} />
                <circle cx="160" cy="10" r="2.5" className={styles['alien-chart-dot']} style={{ animationDelay: '1.5s' }} />
                <circle cx="200" cy="25" r="3" className={styles['alien-chart-dot']} style={{ fill: '#22d3ee' }} />

                {/* Scanline */}
                <line x1="0" y1="0" x2="0" y2="60" className={styles['alien-chart-scanline']} />

                {/* HUD markings */}
                <line x1="0" y1="10" x2="5" y2="10" stroke="rgba(34, 211, 238, 0.8)" strokeWidth="2" />
                <line x1="0" y1="30" x2="3" y2="30" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="1" />
                <line x1="0" y1="50" x2="5" y2="50" stroke="rgba(34, 211, 238, 0.8)" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className={styles['alien-balance-grid']}>
        {/* Combined Balance Card */}
        <div className={styles['alien-balance-card']}>
          <div className={styles['alien-card-glow']}></div>
          <div className={styles['alien-card-header']}>
            <div className={styles['alien-card-title']}>
              <Wallet size={18} />
              <span>Số Dư Tài Khoản</span>
            </div>
            <button 
              className={styles['alien-toggle-balance-btn']}
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div className={styles['alien-balance-kpi-row']}>
            <div className={styles['alien-balance-kpi-chip']}>
              <span>TIỀN MẶT</span>
              <strong>{showBalance ? `${assetAllocation.cashPercent.toFixed(1)}%` : '•••'}</strong>
            </div>
            <div className={styles['alien-balance-kpi-chip']}>
              <span>XU</span>
              <strong>{showBalance ? `${assetAllocation.coinPercent.toFixed(1)}%` : '•••'}</strong>
            </div>
            <div className={styles['alien-balance-kpi-chip']}>
              <span>TỔNG TÀI SẢN</span>
              <strong>{showBalance ? formatCurrency(calculateTotalAssets()) : '••••••'}</strong>
            </div>
          </div>
          
          <div className={styles['alien-balance-split']}>
            <div className={`${styles['alien-balance-item']} ${styles['cash']}`}>
              <div className={styles['alien-balance-label']}>
                <DollarSign size={16} />
                <span>Tiền Mặt</span>
              </div>
              <div className={styles['alien-balance-value']}>
                {showBalance ? formatCurrency(walletData?.cashBalance || 0) : '••••••'}
              </div>
              {showBalance && (
                <div className={styles['alien-balance-percent']}>
                  {assetAllocation.cashPercent.toFixed(1)}% tổng tài sản
                </div>
              )}
            </div>
            
            <div className={styles['alien-balance-divider']}></div>
            
            <div className={`${styles['alien-balance-item']} ${styles['coin']}`}>
              <div className={styles['alien-balance-label']}>
                <Coins size={16} />
                <span>SkillCoin</span>
              </div>
              <div className={styles['alien-balance-value']}>
                {showBalance ? (walletData?.coinBalance || 0).toLocaleString() : '••••••'}
                <span className={styles['alien-coin-label']}> xu</span>
              </div>
              {showBalance && (
                <div className={styles['alien-balance-percent']}>
                  {assetAllocation.coinPercent.toFixed(1)}% tổng tài sản
                  <span className={styles['alien-coin-vnd-value']}>
                    ≈ {formatCurrency(assetAllocation.coinValue || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {showBalance && (
            <div className={styles['alien-total-assets']}>
              <TrendingUp size={18} />
              <span>Tổng tài sản:</span>
              <strong>{formatCurrency(calculateTotalAssets())}</strong>
            </div>
          )}
          
          <div className={styles['alien-card-actions']}>
            <button className={styles['alien-action-btn']} onClick={() => setShowDepositModal(true)}>
              <Plus size={16} />
              Nạp tiền
            </button>
            <button className={styles['alien-action-btn']} onClick={() => setShowBuyCoinModal(true)}>
              <Rocket size={16} />
              Mua xu
            </button>
            <button className={`${styles['alien-action-btn']} ${styles['secondary']}`} onClick={() => setShowWithdrawModal(true)}>
              <Minus size={16} />
              Rút tiền
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <StatisticsPanel walletData={walletData} transactions={transactions} />

      {/* Tabs */}
      <div className={styles['alien-tabs']}>
        <button 
          className={`${styles['alien-tab-btn']} ${activeTab === 'overview' ? styles['active'] : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Target size={18} />
          Tổng quan
        </button>
        <button 
          className={`${styles['alien-tab-btn']} ${activeTab === 'store' ? styles['active'] : ''}`}
          onClick={() => setActiveTab('store')}
        >
          <ShoppingBag size={18} />
          Cửa Hàng
        </button>
        <button 
          className={`${styles['alien-tab-btn']} ${activeTab === 'transactions' ? styles['active'] : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <History size={18} />
          Lịch sử
        </button>
        <button 
          className={`${styles['alien-tab-btn']} ${activeTab === 'withdrawals' ? styles['active'] : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <ArrowUpRight size={18} />
          Yêu cầu rút tiền
        </button>
        <button 
          className={`${styles['alien-tab-btn']} ${activeTab === 'settings' ? styles['active'] : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          Cài đặt
        </button>
      </div>

      {/* Content */}
      <div className={styles['alien-content']}>
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2 className={styles['alien-section-title']}>
              <Zap size={18} />
              Giao dịch gần đây
            </h2>
            <div className={styles['alien-transactions-list']}>
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <Sparkles size={48} />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                transactions.slice(0, 5).map((tx) => (
                  <div key={tx.transactionId} className={styles['alien-transaction-item']}>
                    <div className={styles['alien-tx-info']}>
                      <div className={styles['alien-tx-icon-wrapper']}>
                        {getTransactionIcon(tx.transactionType)}
                      </div>
                      <div className={styles['alien-tx-details']}>
                        <h4>{tx.description}</h4>
                        <p>{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className={styles['alien-tx-amount']}>
                      {tx.amount !== undefined && tx.amount !== null ? (
                        <div className={`${styles['alien-amount-value']} ${(tx.isCredit ?? isTransactionCredit(tx.transactionType)) ? styles['credit'] : styles['debit']}`}>
                          {(tx.isCredit ?? isTransactionCredit(tx.transactionType)) ? '+' : '-'}{formatCurrency(Math.abs(tx.amount || 0))}
                        </div>
                      ) : null}
                      {tx.coinAmount && (
                        <div className={styles['alien-amount-value']}>{tx.coinAmount > 0 ? '+' : '-'}{Math.abs(tx.coinAmount)} xu</div>
                      )}
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
            {transactions.length > 5 && (
              <button className={styles['alien-view-all-btn']} onClick={() => setActiveTab('transactions')}>
                Xem tất cả <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <>
            <div className="transactions-section">
              <h2 className={styles['alien-section-title']}>
                <History size={18} />
                Tất cả giao dịch
              </h2>
              <div className={styles['alien-transactions-list']}>
                {transactions.map((tx) => (
                  <div key={tx.transactionId} className={styles['alien-transaction-item']}>
                    <div className={styles['alien-tx-info']}>
                      <div className={styles['alien-tx-icon-wrapper']}>
                        {getTransactionIcon(tx.transactionType)}
                      </div>
                      <div className={styles['alien-tx-details']}>
                        <h4>{tx.description}</h4>
                        <p>{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className={styles['alien-tx-amount']}>
                      {tx.amount !== undefined && tx.amount !== null ? (
                        <div className={`${styles['alien-amount-value']} ${(tx.isCredit ?? isTransactionCredit(tx.transactionType)) ? styles['credit'] : styles['debit']}`}>
                          {(tx.isCredit ?? isTransactionCredit(tx.transactionType)) ? '+' : '-'}{formatCurrency(Math.abs(tx.amount || 0))}
                        </div>
                      ) : null}
                      {tx.coinAmount && (
                        <div className={styles['alien-amount-value']}>
                          {(tx.isDebit || isTransactionDebit(tx.transactionType, tx.referenceType, tx.description)) ? '-' : '+'}{Math.abs(tx.coinAmount)} xu
                        </div>
                      )}
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
                  </div>
                ))}
              </div>
            </div>
            
            <PaymentOrderHistorySection
              orders={paymentOrders}
              isLoading={paymentOrdersLoading}
              itemsPerPage={6}
              sectionTitle="Lịch sử nạp tiền qua PayOS"
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              getStatusBadge={getStatusBadge}
              listClassName={styles['alien-transactions-list']}
              itemClassName={styles['alien-transaction-item']}
              txInfoClassName={styles['alien-tx-info']}
              txIconWrapperClassName={styles['alien-tx-icon-wrapper']}
              txDetailsClassName={styles['alien-tx-details']}
              txAmountClassName={styles['alien-tx-amount']}
              sectionTitleClassName={styles['alien-section-title']}
            />
          </>
        )}


        {activeTab === 'store' && (
          <div className="store-section">
            <div className="store-header">
              <div>
                <h2 className={styles['alien-section-title']}>
                  <ShoppingBag size={18} />
                  Cửa Hàng SkillCoin
                </h2>
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
              </div>
            </div>

            <div className={styles['alien-store-grid']}>
              {filteredStoreItems.length === 0 ? (
                <div className="empty-state">
                  <Sparkles size={48} />
                  <p>Không tìm thấy sản phẩm nào</p>
                </div>
              ) : (
                filteredStoreItems.map((item) => (
                  <div key={item.id} className={styles['alien-store-card']}>
                    {item.isNew && <div className="item-badge new-badge">✨ MỚI</div>}
                    {item.isRecommended && <div className="item-badge recommend-badge">⭐ ĐỀ XUẤT</div>}
                    <div className={styles['alien-store-thumbnail']}>{item.thumbnail}</div>
                    <div className={styles['alien-store-info']}>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    
                    <div className={styles['alien-store-footer']}>
                      <div className={styles['alien-store-price']}>
                        <Coins size={16} />
                        <span>{item.price}</span>
                      </div>
                      <button 
                        className={styles['alien-buy-btn']}
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
            <h2 className={styles['alien-section-title']}>
              <Settings size={18} />
              Cài Đặt Tài Khoản
            </h2>
            
            <div className="settings-grid">
              {/* Bank Account Settings */}
              <div className={styles['alien-store-card']}>
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
                        {getStatusBadge('COMPLETED')}
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
                    className={styles['alien-action-btn']}
                    onClick={() => setShowBankSetupModal(true)}
                  >
                    <Building2 size={16} />
                    {walletData?.hasBankAccount ? 'Cập nhật' : 'Thiết lập ngay'}
                  </button>
                </div>
              </div>

              {/* Transaction PIN Settings */}
              <div className={styles['alien-store-card']}>
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
                        {getStatusBadge('COMPLETED')}
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
                    className={styles['alien-action-btn']}
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
              <h3 className={styles['alien-section-title']}>
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
            <h2 className={styles['alien-section-title']}>
              <ArrowUpRight size={18} />
              Yêu Cầu Rút Tiền
            </h2>

            {withdrawalRequests.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={64} />
                <h3>Chưa có yêu cầu rút tiền</h3>
                <p>Các yêu cầu rút tiền của bạn sẽ hiển thị ở đây</p>
                <button className={styles['alien-action-btn']} onClick={() => setShowWithdrawModal(true)}>
                  <Plus size={18} />
                  Tạo yêu cầu rút tiền
                </button>
              </div>
            ) : (
              <div className={styles['alien-transactions-list']}>
                {withdrawalRequests.map((request) => (
                  <div key={request.requestId} className={styles['alien-transaction-item']}>
                    <div className={styles['alien-tx-info']}>
                      <div className={styles['alien-tx-icon-wrapper']}>
                        <ArrowUpRight size={18} />
                      </div>
                      <div className={styles['alien-tx-details']}>
                        <h4>Mã yêu cầu: {request.requestCode}</h4>
                        <p>{formatDate(request.createdAt)}</p>
                      </div>
                    </div>
                    <div className={styles['alien-tx-amount']}>
                      <div className={`${styles['alien-amount-value']} ${styles['debit']}`}>
                        -{formatCurrency(request.amount)}
                      </div>
                      {getStatusBadge(request.status)}
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
          if (paymentOrdersLoaded) {
            fetchPaymentOrders({ force: true });
          }
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
        onBlockedByLimit={(message) => {
          setShowCancelModal(false);
          setCancellationLimitMessage(message);
          setShowCancellationLimitModal(true);
        }}
        onSuccess={async () => {
          await fetchSubscription();
          await fetchWalletData();
          await fetchTransactions();
          showToast('success', '✅ Thành công', 'Đã hủy gói đăng ký');
        }}
      />

      <CancellationLimitModal
        isOpen={showCancellationLimitModal}
        onClose={() => setShowCancellationLimitModal(false)}
        message={cancellationLimitMessage}
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
