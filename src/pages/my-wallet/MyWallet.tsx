import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import DepositCashModal from '../../components/wallet/DepositCashModal';
import walletService from '../../services/walletService';
import './MyWalletStyles.css';

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
}

interface Transaction {
  id: number;
  type: 'DEPOSIT' | 'COIN_PURCHASE' | 'COIN_EARN' | 'COIN_SPEND' | 'WITHDRAWAL' | 'REFUND';
  amount: number;
  coinAmount?: number;
  description: string;
  createdAt: string;
  status: string;
}

interface WithdrawalRequest {
  requestId: number;
  requestCode: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  bankName: string;
  bankAccountNumber: string;
  createdAt: string;
  rejectionReason?: string;
}

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
  discount: number;
  title: string;
  description: string;
  popular: boolean;
  special: boolean;
  limitedTime: boolean;
  color: string;
  glowColor: string;
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

const MyWallet: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State Management
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdraw' | 'buy-coins' | 'store' | 'settings'>('overview');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  // Store state
  const [selectedStoreCategory, setSelectedStoreCategory] = useState<string>('all');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  
  // Countdown timer for flash sale
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 12
  });

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [transactionPin, setTransactionPin] = useState('');

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  // Coin packages (matching backend CoinService)
  const coinPackages: CoinPackage[] = [
    {
      id: 'trial',
      coins: 25,
      price: 2500,
      bonus: 0,
      discount: 17,
      title: 'Gói Dùng Thử',
      description: 'Khám phá SkillCoin miễn phí',
      popular: false,
      special: false,
      limitedTime: false,
      color: '#6b7280',
      glowColor: 'rgba(107, 114, 128, 0.3)'
    },
    {
      id: 'starter',
      coins: 50,
      price: 4500,
      bonus: 5,
      discount: 10,
      title: 'Gói Khởi Đầu',
      description: 'Bắt đầu hành trình của bạn + 5 xu thưởng',
      popular: false,
      special: false,
      limitedTime: false,
      color: '#22d3ee',
      glowColor: 'rgba(34, 211, 238, 0.3)'
    },
    {
      id: 'basic',
      coins: 100,
      price: 8500,
      bonus: 10,
      discount: 15,
      title: 'Gói Cơ Bản',
      description: 'Lựa chọn thông minh + 10 xu thưởng',
      popular: false,
      special: false,
      limitedTime: false,
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.3)'
    },
    {
      id: 'student',
      coins: 250,
      price: 20000,
      bonus: 30,
      discount: 20,
      title: 'Gói Học Sinh',
      description: 'Ưu đãi đặc biệt cho học sinh + 30 xu thưởng',
      popular: false,
      special: true,
      limitedTime: false,
      color: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.4)'
    },
    {
      id: 'popular',
      coins: 500,
      price: 40000,
      bonus: 75,
      discount: 20,
      title: 'Gói Phổ Biến',
      description: 'Giá trị tốt nhất cho mọi người + 75 xu thưởng',
      popular: true,
      special: false,
      limitedTime: false,
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.4)'
    },
    {
      id: 'weekend',
      coins: 750,
      price: 60000,
      bonus: 150,
      discount: 20,
      title: 'Gói Cuối Tuần',
      description: 'Ưu đãi cuối tuần đặc biệt + 150 xu thưởng',
      popular: false,
      special: true,
      limitedTime: true,
      color: '#8b5cf6',
      glowColor: 'rgba(139, 92, 246, 0.4)'
    },
    {
      id: 'premium',
      coins: 1000,
      price: 80000,
      bonus: 200,
      discount: 20,
      title: 'Gói Premium',
      description: 'Dành cho người dùng cao cấp + 200 xu thưởng',
      popular: false,
      special: false,
      limitedTime: false,
      color: '#7c3aed',
      glowColor: 'rgba(124, 58, 237, 0.4)'
    },
    {
      id: 'business',
      coins: 1500,
      price: 120000,
      bonus: 300,
      discount: 20,
      title: 'Gói Doanh Nghiệp',
      description: 'Cho các chuyên gia và doanh nghiệp + 300 xu thưởng',
      popular: false,
      special: false,
      limitedTime: false,
      color: '#14b8a6',
      glowColor: 'rgba(20, 184, 166, 0.4)'
    },
    {
      id: 'mega',
      coins: 2500,
      price: 190000,
      bonus: 600,
      discount: 24,
      title: 'Gói Mega',
      description: 'Sức mạnh vượt trội + 600 xu thưởng',
      popular: false,
      special: false,
      limitedTime: false,
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)'
    },
    {
      id: 'flash',
      coins: 3000,
      price: 210000,
      bonus: 1000,
      discount: 30,
      title: 'Gói Flash Sale',
      description: 'Siêu ưu đãi thời gian có hạn + 1000 xu thưởng',
      popular: false,
      special: true,
      limitedTime: true,
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.5)'
    },
    {
      id: 'ultimate',
      coins: 5000,
      price: 350000,
      bonus: 1500,
      discount: 30,
      title: 'Gói Ultimate',
      description: 'Đỉnh cao sức mạnh + 1500 xu thưởng',
      popular: false,
      special: false,
      limitedTime: false,
      color: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.4)'
    },
    {
      id: 'legendary',
      coins: 10000,
      price: 650000,
      bonus: 3500,
      discount: 35,
      title: 'Gói Huyền Thoại',
      description: 'Gói đặc biệt nhất + 3500 xu thưởng khủng',
      popular: false,
      special: true,
      limitedTime: false,
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.6)'
    }
  ];

  // Store items - Đồ mua bằng SkillCoin
  const storeItems: StoreItem[] = [
    {
      id: 'ai-premium',
      title: 'Gói Khóa học AI Premium',
      description: 'Làm chủ AI với 10 khóa học nâng cao. Bao gồm: Machine Learning, Deep Learning, NLP, Computer Vision',
      price: 299,
      category: 'courses',
      thumbnail: '🤖',
      popularity: 95,
      isRecommended: true
    },
    {
      id: 'fullstack-bundle',
      title: 'Bundle Full-Stack Developer',
      description: 'Trở thành Full-Stack Developer chuyên nghiệp. React, Node.js, MongoDB, AWS deployment',
      price: 399,
      category: 'courses',
      thumbnail: '💻',
      popularity: 92,
      isNew: true
    },
    {
      id: 'certificate-expert',
      title: 'Chứng chỉ Chuyên gia',
      description: 'Chứng chỉ premium được công nhận bởi doanh nghiệp. Thể hiện năng lực chuyên môn của bạn',
      price: 150,
      category: 'certificates',
      thumbnail: '🏆',
      popularity: 88,
      isRecommended: true
    },
    {
      id: 'certificate-master',
      title: 'Chứng chỉ Bậc Thầy',
      description: 'Chứng chỉ cao cấp nhất. Dành cho những người đạt điểm số cao nhất trong hệ thống',
      price: 500,
      category: 'certificates',
      thumbnail: '👑',
      popularity: 76
    },
    {
      id: 'profile-premium',
      title: 'Huy hiệu Hồ sơ Premium',
      description: 'Nổi bật với huy hiệu premium trên profile. Badge sáng + tên màu vàng đồng + ưu tiên hiển thị',
      price: 50,
      category: 'upgrades',
      thumbnail: '⭐',
      popularity: 85
    },
    {
      id: 'profile-vip',
      title: 'Gói VIP Member',
      description: 'Trở thành VIP với nhiều đặc quyền: Ưu tiên hỗ trợ, không quảng cáo, unlock tất cả tính năng',
      price: 199,
      category: 'upgrades',
      thumbnail: '💎',
      popularity: 90,
      isNew: true
    },
    {
      id: 'mentor-gift',
      title: 'Gói Quà Tặng Mentor',
      description: 'Gửi lời cảm ơn đến mentor yêu thích. Bao gồm: Badge đặc biệt + Notification highlight + 100 coins',
      price: 75,
      category: 'gifts',
      thumbnail: '🎁',
      popularity: 82
    },
    {
      id: 'super-gift',
      title: 'Quà Tặng Siêu Đặc Biệt',
      description: 'Món quà cao cấp nhất! Animation đặc biệt + Profile banner + 500 coins cho người nhận',
      price: 300,
      category: 'gifts',
      thumbnail: '🎉',
      popularity: 79,
      isRecommended: true
    },
    {
      id: 'coding-bootcamp',
      title: 'Coding Bootcamp 6 tháng',
      description: 'Lộ trình học lập trình intensive 6 tháng. Bao gồm: 50+ khóa học, 1-1 mentoring, job guarantee',
      price: 999,
      category: 'courses',
      thumbnail: '🚀',
      popularity: 98,
      isNew: true,
      isRecommended: true
    },
    {
      id: 'custom-badge',
      title: 'Badge Tùy Chỉnh',
      description: 'Thiết kế badge riêng cho bạn. Chọn màu sắc, icon và text theo ý thích. Độc nhất vô nhị!',
      price: 120,
      category: 'upgrades',
      thumbnail: '🎨',
      popularity: 71
    },
    {
      id: 'priority-support',
      title: 'Hỗ Trợ Ưu Tiên 1 tháng',
      description: 'Được ưu tiên trả lời câu hỏi trong 24h. Direct message với admin team. Giải đáp mọi thắc mắc',
      price: 80,
      category: 'upgrades',
      thumbnail: '🆘',
      popularity: 73
    },
    {
      id: 'exclusive-workshop',
      title: 'Workshop Độc Quyền',
      description: 'Tham gia workshop với các chuyên gia hàng đầu. 3 ngày intensive learning + Q&A + Networking',
      price: 250,
      category: 'courses',
      thumbnail: '🎯',
      popularity: 86,
      isNew: true
    }
  ];

  const filteredStoreItems = storeItems.filter(item => {
    const matchesCategory = selectedStoreCategory === 'all' || item.category === selectedStoreCategory;
    const matchesSearch = item.title.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(storeSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
      fetchWithdrawals();
    }
  }, [user]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset to 24 hours when countdown reaches 0
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchWalletData = async () => {
    try {
      const data = await walletService.getMyWallet();
      setWalletData(data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
      showToast('error', 'Lỗi', err instanceof Error ? err.message : 'Không thể tải thông tin ví');
      setError('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await walletService.getTransactions(0, 20);
      setTransactions(response.content.map(t => ({
        id: t.transactionId,
        type: t.type as any,
        amount: t.amount,
        coinAmount: t.coinAmount,
        description: t.description,
        createdAt: t.createdAt,
        status: t.status
      })));
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await walletService.getMyWithdrawalRequests(0, 10);
      setWithdrawals(response.content.map(w => ({
        requestId: w.requestId,
        requestCode: w.requestCode,
        amount: w.amount,
        fee: w.fee,
        netAmount: w.netAmount,
        status: w.status as any,
        bankName: w.bankName,
        bankAccountNumber: w.bankAccountNumber,
        createdAt: w.createdAt,
        rejectionReason: w.rejectionReason
      })));
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await walletService.createWithdrawalRequest({
        amount: parseFloat(withdrawAmount),
        bankName,
        bankAccountNumber,
        bankAccountName,
        bankBranch,
        transactionPin
      });

      showToast('success', 'Thành công', `Yêu cầu rút tiền ${result.requestCode} đã được tạo`);
      setWithdrawAmount('');
      setTransactionPin('');
      fetchWalletData();
      fetchWithdrawals();
      setActiveTab('overview');
    } catch (err) {
      showToast('error', 'Lỗi', err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo yêu cầu rút tiền');
    }
  };

  const handleBuyCoinPackage = async (pkg: CoinPackage) => {
    try {
      await walletService.purchaseCoinsWithCash({
        coinAmount: pkg.coins,
        packageId: pkg.id,
        paymentMethod: 'WALLET_CASH'
      });

      showToast('success', '🪙 Thành công', `Đã mua ${pkg.coins + pkg.bonus} SkillCoin!`);
      fetchWalletData();
      fetchTransactions();
    } catch (err) {
      showToast('error', 'Lỗi', err instanceof Error ? err.message : 'Có lỗi xảy ra khi mua xu');
    }
  };

  const handleBuyStoreItem = (item: StoreItem) => {
    if (!walletData || walletData.coinBalance < item.price) {
      showToast('warning', '⚠️ Không đủ xu', `Bạn cần ${item.price} SkillCoin để mua ${item.title}`);
      return;
    }
    
    showToast('info', '🚧 Đang phát triển', 'Tính năng này sẽ sớm được ra mắt!');
  };

  const handleDepositCash = async () => {
    setShowDepositModal(true);
  };

  const handleDepositSuccess = async (amount: number) => {
    showToast('success', '✅ Nạp tiền thành công', `Đã nạp ${formatCurrency(amount)} vào ví!`);
    setShowDepositModal(false);
    // Reload wallet data
    fetchWalletData();
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setToast({ isVisible: true, type, title, message });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 4000);
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'mw-badge-success',
      'PENDING': 'mw-badge-warning',
      'APPROVED': 'mw-badge-info',
      'COMPLETED': 'mw-badge-success',
      'REJECTED': 'mw-badge-danger',
      'CANCELLED': 'mw-badge-secondary'
    };
    return statusMap[status] || 'mw-badge-secondary';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      'PENDING': '⏳ Chờ duyệt',
      'APPROVED': '✅ Đã duyệt',
      'COMPLETED': '🎉 Hoàn tất',
      'REJECTED': '❌ Từ chối',
      'CANCELLED': '🚫 Đã hủy'
    };
    return textMap[status] || status;
  };

  const getTransactionIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'DEPOSIT': '💰',
      'COIN_PURCHASE': '🪙',
      'COIN_EARN': '✨',
      'COIN_SPEND': '🛒',
      'WITHDRAWAL': '💸',
      'REFUND': '↩️'
    };
    return iconMap[type] || '📋';
  };

  if (loading) {
    return (
      <div className="mw-loading-container">
        <div className="mw-spinner"></div>
        <p>Đang tải ví...</p>
      </div>
    );
  }

  if (error || !walletData) {
    return (
      <div className="mw-error-container">
        <p className="mw-error-message">{error || 'Không thể tải thông tin ví'}</p>
        <button onClick={() => window.location.reload()} className="mw-btn-primary">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={`mw-container ${theme === 'dark' ? 'mw-dark' : ''}`}>
      {/* Header */}
      <div className="mw-header">
        <h1 className="mw-title">💼 Ví Của Tôi</h1>
        <div className="mw-status-badge">
          <span className={`mw-badge ${getStatusBadgeClass(walletData.status)}`}>
            {walletData.status}
          </span>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="mw-balance-grid">
        <div className="mw-balance-card mw-card-cash">
          <div className="mw-card-icon">💵</div>
          <div className="mw-card-content">
            <p className="mw-card-label">Số Dư Tiền Mặt</p>
            <p className="mw-card-value">{formatCurrency(walletData.cashBalance)}</p>
            <p className="mw-card-subtitle">Có thể rút về ngân hàng</p>
          </div>
        </div>

        <div className="mw-balance-card mw-card-coin">
          <div className="mw-card-icon">🪙</div>
          <div className="mw-card-content">
            <p className="mw-card-label">Số Dư SkillCoin</p>
            <p className="mw-card-value">{walletData.coinBalance.toLocaleString()} Coins</p>
            <p className="mw-card-subtitle">Dùng trong hệ thống</p>
          </div>
        </div>

        <div className="mw-balance-card mw-card-stats">
          <div className="mw-card-icon">📊</div>
          <div className="mw-card-content">
            <p className="mw-card-label">Thống Kê</p>
            <div className="mw-stats-row">
              <span>Đã nạp: <strong>{formatCurrency(walletData.totalDeposited)}</strong></span>
              <span>Đã rút: <strong>{formatCurrency(walletData.totalWithdrawn)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mw-tabs">
        <button
          className={`mw-tab ${activeTab === 'overview' ? 'mw-tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Tổng Quan
        </button>
        <button
          className={`mw-tab ${activeTab === 'buy-coins' ? 'mw-tab-active' : ''}`}
          onClick={() => setActiveTab('buy-coins')}
        >
          🪙 Mua Xu
        </button>
        <button
          className={`mw-tab ${activeTab === 'store' ? 'mw-tab-active' : ''}`}
          onClick={() => setActiveTab('store')}
        >
          � Cửa Hàng
        </button>
        <button
          className={`mw-tab ${activeTab === 'transactions' ? 'mw-tab-active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📜 Giao Dịch
        </button>
        <button
          className={`mw-tab ${activeTab === 'withdraw' ? 'mw-tab-active' : ''}`}
          onClick={() => setActiveTab('withdraw')}
        >
          💸 Rút Tiền
        </button>
        <button
          className={`mw-tab ${activeTab === 'settings' ? 'mw-tab-active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Cài Đặt
        </button>
      </div>

      {/* Tab Content */}
      <div className="mw-content">
        {activeTab === 'overview' && (
          <div className="mw-overview">
            <div className="mw-quick-actions">
              <h3>⚡ Hành Động Nhanh</h3>
              <div className="mw-action-grid">
                <button className="mw-action-btn" onClick={handleDepositCash}>
                  <span className="mw-action-icon">💰</span>
                  <span>Nạp Tiền Vào Ví</span>
                </button>
                <button className="mw-action-btn" onClick={() => setActiveTab('buy-coins')}>
                  <span className="mw-action-icon">🪙</span>
                  <span>Mua SkillCoin</span>
                </button>
                <button className="mw-action-btn" onClick={() => setActiveTab('store')}>
                  <span className="mw-action-icon">🛒</span>
                  <span>Cửa Hàng</span>
                </button>
                <button className="mw-action-btn" onClick={() => setActiveTab('withdraw')}>
                  <span className="mw-action-icon">💸</span>
                  <span>Rút Tiền</span>
                </button>
                <button className="mw-action-btn" onClick={() => setActiveTab('transactions')}>
                  <span className="mw-action-icon">📜</span>
                  <span>Lịch Sử</span>
                </button>
              </div>
            </div>

            <div className="mw-recent-activity">
              <h3>🕒 Hoạt Động Gần Đây</h3>
              <div className="mw-activity-list">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="mw-activity-item">
                    <span className="mw-activity-icon">{getTransactionIcon(tx.type)}</span>
                    <div className="mw-activity-details">
                      <p className="mw-activity-desc">{tx.description}</p>
                      <p className="mw-activity-date">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={`mw-activity-amount ${tx.type === 'DEPOSIT' || tx.type === 'COIN_EARN' ? 'mw-positive' : 'mw-negative'}`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'COIN_EARN' ? '+' : '-'}
                      {tx.coinAmount ? `${tx.coinAmount} Coins` : formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="mw-transactions">
            <h3>📜 Lịch Sử Giao Dịch</h3>
            <div className="mw-transaction-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="mw-transaction-card">
                  <div className="mw-transaction-header">
                    <span className="mw-transaction-icon">{getTransactionIcon(tx.type)}</span>
                    <div className="mw-transaction-info">
                      <p className="mw-transaction-desc">{tx.description}</p>
                      <p className="mw-transaction-date">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="mw-transaction-amount-wrapper">
                      <span className={`mw-transaction-amount ${tx.type === 'DEPOSIT' || tx.type === 'COIN_EARN' ? 'mw-positive' : 'mw-negative'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'COIN_EARN' ? '+' : '-'}
                        {tx.coinAmount ? `${tx.coinAmount} Coins` : formatCurrency(tx.amount)}
                      </span>
                      <span className={`mw-badge ${getStatusBadgeClass(tx.status)}`}>{tx.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="mw-withdraw">
            <div className="mw-withdraw-form-container">
              <h3>💸 Tạo Yêu Cầu Rút Tiền</h3>
              <form onSubmit={handleWithdrawal} className="mw-form">
                <div className="mw-form-group">
                  <label>Số Tiền Rút (VNĐ)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="100,000 - 100,000,000"
                    min="100000"
                    max="100000000"
                    required
                    className="mw-input"
                  />
                  <small className="mw-input-hint">Phí: 1% (Tối thiểu 5,000đ - Tối đa 50,000đ)</small>
                </div>

                <div className="mw-form-group">
                  <label>Ngân Hàng</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Vietcombank, Techcombank, MB Bank..."
                    required
                    className="mw-input"
                  />
                </div>

                <div className="mw-form-row">
                  <div className="mw-form-group">
                    <label>Số Tài Khoản</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      required
                      className="mw-input"
                    />
                  </div>

                  <div className="mw-form-group">
                    <label>Chủ Tài Khoản</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="NGUYEN VAN A"
                      required
                      className="mw-input"
                    />
                  </div>
                </div>

                <div className="mw-form-group">
                  <label>Chi Nhánh (Tùy Chọn)</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="Hà Nội, Hồ Chí Minh..."
                    className="mw-input"
                  />
                </div>

                <div className="mw-form-group">
                  <label>Mã PIN Giao Dịch</label>
                  <input
                    type="password"
                    value={transactionPin}
                    onChange={(e) => setTransactionPin(e.target.value)}
                    placeholder="******"
                    maxLength={6}
                    required
                    className="mw-input"
                  />
                </div>

                <button type="submit" className="mw-btn-submit">
                  Tạo Yêu Cầu Rút Tiền
                </button>
              </form>
            </div>

            <div className="mw-withdrawal-history">
              <h3>📋 Lịch Sử Rút Tiền</h3>
              <div className="mw-withdrawal-list">
                {withdrawals.map((req) => (
                  <div key={req.requestId} className="mw-withdrawal-card">
                    <div className="mw-withdrawal-header">
                      <span className="mw-withdrawal-code">{req.requestCode}</span>
                      <span className={`mw-badge ${getStatusBadgeClass(req.status)}`}>
                        {getStatusText(req.status)}
                      </span>
                    </div>
                    <div className="mw-withdrawal-details">
                      <p><strong>Số tiền:</strong> {formatCurrency(req.amount)}</p>
                      <p><strong>Phí:</strong> {formatCurrency(req.fee)}</p>
                      <p><strong>Nhận:</strong> <span className="mw-highlight">{formatCurrency(req.netAmount)}</span></p>
                      <p><strong>Ngân hàng:</strong> {req.bankName} - ****{req.bankAccountNumber.slice(-4)}</p>
                      <p><strong>Thời gian:</strong> {formatDate(req.createdAt)}</p>
                      {req.rejectionReason && (
                        <p className="mw-rejection-reason">
                          <strong>Lý do từ chối:</strong> {req.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buy-coins' && (
          <div className="mw-buy-coins">
            <h3>🪙 Mua SkillCoin</h3>
            <p className="mw-subtitle">Chọn gói coin phù hợp với bạn. Thanh toán bằng số dư tiền mặt trong ví.</p>
            <div className="mw-coin-packages">
              {coinPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`mw-coin-package ${pkg.popular ? 'mw-package-popular' : ''} ${pkg.special ? 'mw-package-special' : ''}`}
                  style={{
                    borderColor: pkg.color,
                    boxShadow: `0 4px 20px ${pkg.glowColor}`
                  }}
                >
                  {pkg.popular && <div className="mw-package-badge">⭐ PHỔ BIẾN</div>}
                  {pkg.limitedTime && <div className="mw-package-badge mw-badge-limited">⏰ CÓ HẠN</div>}
                  
                  <div className="mw-package-header" style={{ background: pkg.color }}>
                    <h4>{pkg.title}</h4>
                    <p className="mw-package-desc">{pkg.description}</p>
                  </div>

                  <div className="mw-package-body">
                    <div className="mw-package-coins">
                      <span className="mw-coins-main">{pkg.coins} Coins</span>
                      {pkg.bonus > 0 && (
                        <span className="mw-coins-bonus">+ {pkg.bonus} Bonus</span>
                      )}
                    </div>

                    <div className="mw-package-price">
                      <span className="mw-price-main">{formatCurrency(pkg.price)}</span>
                      {pkg.discount > 0 && (
                        <span className="mw-discount-badge">-{pkg.discount}%</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleBuyCoinPackage(pkg)}
                      className="mw-btn-buy-package"
                      style={{ background: pkg.color }}
                      disabled={walletData.cashBalance < pkg.price}
                    >
                      {walletData.cashBalance < pkg.price ? '💰 Không đủ tiền' : '🛒 Mua Ngay'}
                    </button>

                    <p className="mw-package-total">
                      Tổng nhận: <strong>{pkg.coins + pkg.bonus} Coins</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="mw-store">
            <div className="mw-store-header">
              <div>
                <h3>🛒 Cửa Hàng SkillCoin</h3>
                <p className="mw-subtitle">Sử dụng SkillCoin để mua các mặt hàng độc quyền</p>
              </div>
              <div className="mw-coin-balance-display">
                <span className="mw-coin-icon">🪙</span>
                <span className="mw-coin-amount">{walletData.coinBalance.toLocaleString()} Coins</span>
              </div>
            </div>

            {/* Flash Sale Countdown */}
            <div className="mw-flash-sale-banner">
              <div className="mw-flash-content">
                <h4>⚡ FLASH SALE - Giảm Giá Đặc Biệt!</h4>
                <p>Nhanh tay! Ưu đãi kết thúc sau:</p>
                <div className="mw-countdown">
                  <div className="mw-time-box">
                    <span className="mw-time-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="mw-time-label">Giờ</span>
                  </div>
                  <span className="mw-time-separator">:</span>
                  <div className="mw-time-box">
                    <span className="mw-time-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="mw-time-label">Phút</span>
                  </div>
                  <span className="mw-time-separator">:</span>
                  <div className="mw-time-box">
                    <span className="mw-time-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="mw-time-label">Giây</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Filters */}
            <div className="mw-store-filters">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm sản phẩm..."
                value={storeSearchTerm}
                onChange={(e) => setStoreSearchTerm(e.target.value)}
                className="mw-store-search"
              />
              <div className="mw-filter-buttons">
                <button 
                  className={`mw-filter-btn ${selectedStoreCategory === 'all' ? 'mw-filter-active' : ''}`}
                  onClick={() => setSelectedStoreCategory('all')}
                >
                  Tất Cả
                </button>
                <button 
                  className={`mw-filter-btn ${selectedStoreCategory === 'courses' ? 'mw-filter-active' : ''}`}
                  onClick={() => setSelectedStoreCategory('courses')}
                >
                  📚 Khóa Học
                </button>
                <button 
                  className={`mw-filter-btn ${selectedStoreCategory === 'certificates' ? 'mw-filter-active' : ''}`}
                  onClick={() => setSelectedStoreCategory('certificates')}
                >
                  🏆 Chứng Chỉ
                </button>
                <button 
                  className={`mw-filter-btn ${selectedStoreCategory === 'upgrades' ? 'mw-filter-active' : ''}`}
                  onClick={() => setSelectedStoreCategory('upgrades')}
                >
                  ⭐ Nâng Cấp
                </button>
                <button 
                  className={`mw-filter-btn ${selectedStoreCategory === 'gifts' ? 'mw-filter-active' : ''}`}
                  onClick={() => setSelectedStoreCategory('gifts')}
                >
                  🎁 Quà Tặng
                </button>
              </div>
            </div>

            {/* Store Items Grid */}
            <div className="mw-store-grid">
              {filteredStoreItems.map((item) => (
                <div key={item.id} className="mw-store-item">
                  {item.isNew && <div className="mw-item-badge mw-badge-new">✨ MỚI</div>}
                  {item.isRecommended && <div className="mw-item-badge mw-badge-recommend">⭐ ĐỀ XUẤT</div>}
                  
                  <div className="mw-item-thumbnail">
                    <span className="mw-item-icon">{item.thumbnail}</span>
                  </div>

                  <div className="mw-item-content">
                    <h4 className="mw-item-title">{item.title}</h4>
                    <p className="mw-item-description">{item.description}</p>
                    
                    <div className="mw-item-footer">
                      <div className="mw-item-price">
                        <span className="mw-coin-icon">🪙</span>
                        <span className="mw-price-value">{item.price.toLocaleString()} Coins</span>
                      </div>
                      
                      <button
                        onClick={() => handleBuyStoreItem(item)}
                        className="mw-btn-buy-item"
                        disabled={walletData.coinBalance < item.price}
                      >
                        {walletData.coinBalance < item.price ? '❌ Không đủ' : '🛒 Mua'}
                      </button>
                    </div>

                    <div className="mw-item-popularity">
                      <div className="mw-popularity-bar">
                        <div 
                          className="mw-popularity-fill" 
                          style={{ width: `${item.popularity}%` }}
                        ></div>
                      </div>
                      <span className="mw-popularity-text">{item.popularity}% người dùng quan tâm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredStoreItems.length === 0 && (
              <div className="mw-empty-state">
                <span className="mw-empty-icon">🔍</span>
                <p>Không tìm thấy sản phẩm phù hợp</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="mw-settings">
            <h3>⚙️ Cài Đặt Ví</h3>
            
            <div className="mw-settings-section">
              <h4>🔐 Bảo Mật</h4>
              <div className="mw-settings-item">
                <div>
                  <p><strong>Mã PIN Giao Dịch</strong></p>
                  <p className="mw-settings-desc">Bảo vệ các giao dịch của bạn</p>
                </div>
                <span className={`mw-badge ${walletData.hasTransactionPin ? 'mw-badge-success' : 'mw-badge-warning'}`}>
                  {walletData.hasTransactionPin ? '✅ Đã thiết lập' : '⚠️ Chưa thiết lập'}
                </span>
              </div>

              <div className="mw-settings-item">
                <div>
                  <p><strong>Xác Thực 2 Bước (2FA)</strong></p>
                  <p className="mw-settings-desc">Bảo mật nâng cao cho rút tiền</p>
                </div>
                <span className={`mw-badge ${walletData.require2FA ? 'mw-badge-success' : 'mw-badge-secondary'}`}>
                  {walletData.require2FA ? '✅ Đã bật' : '❌ Đã tắt'}
                </span>
              </div>
            </div>

            <div className="mw-settings-section">
              <h4>🏦 Ngân Hàng</h4>
              <div className="mw-settings-item">
                <div>
                  <p><strong>Tài Khoản Ngân Hàng</strong></p>
                  <p className="mw-settings-desc">Thông tin rút tiền mặc định</p>
                </div>
                <span className={`mw-badge ${walletData.hasBankAccount ? 'mw-badge-success' : 'mw-badge-warning'}`}>
                  {walletData.hasBankAccount ? '✅ Đã lưu' : '⚠️ Chưa lưu'}
                </span>
              </div>
            </div>

            <div className="mw-settings-actions">
              <button className="mw-btn-secondary">Cập Nhật Mã PIN</button>
              <button className="mw-btn-secondary">Cập Nhật Ngân Hàng</button>
              <button className="mw-btn-secondary">Cài Đặt 2FA</button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      )}

      {/* Deposit Cash Modal */}
      <DepositCashModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleDepositSuccess}
      />
    </div>
  );
};

export default MyWallet;
