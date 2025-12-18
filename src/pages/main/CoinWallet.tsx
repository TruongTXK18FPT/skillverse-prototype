import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  TrendingUp, 
  Send, 
  ShoppingBag, 
  Clock, 
  Filter, 
  Search,
  Star,
  Trophy,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Target,
  Flame,
  Award,
  ChevronRight,
  X,
  Check,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Toast from '../../components/Toast';
import '../../styles/CoinWallet.css';
import MeowGuide from '../../components/MeowlGuide';

// TipModal component moved outside of parent component
interface TipModalProps {
  showTipModal: boolean;
  setShowTipModal: (show: boolean) => void;
}

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  originalPrice: number;
  discount: number;
  popular: boolean;
  bonus: number;
  title: string;
  description: string;
  color: string;
  glowColor: string;
  special: boolean;
  limitedTime: boolean;
}

const TipModal: React.FC<TipModalProps> = ({ showTipModal, setShowTipModal }) => (
  showTipModal ? (
    <div className="modal-overlay">
      <div className="tip-modal">
        <div className="modal-header">
          <h3>Gửi Xu Tặng</h3>
          <button onClick={() => setShowTipModal(false)} className="close-btn">
            <X />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="tip-section">
            <label htmlFor="recipient-input">Chọn Người Nhận</label>
            <input 
              id="recipient-input"
              type="text" 
              placeholder="Tìm kiếm người dùng..." 
              className="tip-input" 
            />
          </div>
          
          <div className="tip-section">
            <label htmlFor="tip-amount">Số Xu Tặng</label>
            <div className="amount-selector" id="tip-amount">
              {[10, 25, 50, 100].map(amount => (
                <button key={amount} className="amount-btn">
                  {amount}
                </button>
              ))}
            </div>
          </div>
          
          <div className="tip-section">
            <label htmlFor="tip-message">Lời Nhắn (Tùy chọn)</label>
            <textarea 
              id="tip-message"
              placeholder="Nói điều gì đó tích cực..."
              className="tip-message"
              rows={3}
            />
          </div>
          
          <button className="send-tip-btn">
            <Send />
            Gửi Xu Tặng
          </button>
        </div>
      </div>
    </div>
  ) : null
);

interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'sent' | 'received';
  amount: number;
  description: string;
  timestamp: Date;
  icon: string;
  category?: string;
  fromUser?: string;
  toUser?: string;
}

interface StoreItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'courses' | 'events' | 'upgrades' | 'gifts';
  thumbnail: string;
  popularity: number;
  isNew?: boolean;
  isRecommended?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: number;
}

const CoinWallet: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // State Management
  const [currentBalance] = useState(2540);
  const [totalEarned] = useState(5480);
  const [dailyStreak] = useState(7);
  const [userLevel] = useState(5);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'store' | 'history' | 'achievements' | 'buy-coins'>('dashboard');
  const [showTipModal, setShowTipModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedStoreCategory, setSelectedStoreCategory] = useState<string>('all');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [selectedCoinPackage, setSelectedCoinPackage] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 12
  });

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    actionButton: undefined as { text: string; onClick: () => void } | undefined
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        let { hours, minutes, seconds } = prevTime;
        
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

  // Mock Data
  const [recentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'earned',
      amount: 50,
      description: 'Hoàn thành Bài 3: React Nâng Cao',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      icon: '🎓',
      category: 'learning'
    },
    {
      id: '2',
      type: 'earned',
      amount: 25,
      description: 'Nhận phản hồi tích cực',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      icon: '💬',
      category: 'feedback'
    },
    {
      id: '3',
      type: 'sent',
      amount: 20,
      description: 'Tặng xu cho mentor Nguyễn Văn A',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      icon: '🤝',
      category: 'tip',
      toUser: 'Nguyễn Văn A'
    },
    {
      id: '4',
      type: 'spent',
      amount: 100,
      description: 'Mở khóa Khóa học Premium: AI Cơ bản',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      icon: '🔓',
      category: 'course'
    },
    {
      id: '5',
      type: 'received',
      amount: 15,
      description: 'Nhận xu từ Trần Thị B',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      icon: '💝',
      category: 'tip',
      fromUser: 'Trần Thị B'
    },
    {
      id: '6',
      type: 'earned',
      amount: 500,
      description: 'Mua gói 500 xu',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      icon: '💳',
      category: 'purchase'
    }
  ]);

  const [storeItems] = useState<StoreItem[]>([
    {
      id: '1',
      title: 'Gói Khóa học AI Premium',
      description: 'Làm chủ AI với 10 khóa học nâng cao',
      price: 299,
      category: 'courses',
      thumbnail: '/api/placeholder/200/120',
      popularity: 95,
      isRecommended: true
    },
    {
      id: '2',
      title: 'Vé Hội thảo Công nghệ Ảo',
      description: 'Tham gia 3 ngày chia sẻ công nghệ độc quyền',
      price: 150,
      category: 'events',
      thumbnail: '/api/placeholder/200/120',
      popularity: 88,
      isNew: true
    },
    {
      id: '3',
      title: 'Huy hiệu Hồ sơ: Chuyên gia',
      description: 'Thể hiện chuyên môn với huy hiệu premium',
      price: 50,
      category: 'upgrades',
      thumbnail: '/api/placeholder/200/120',
      popularity: 76
    },
    {
      id: '4',
      title: 'Gói Quà Tặng Mentor',
      description: 'Gửi lời cảm ơn đến mentor yêu thích',
      price: 75,
      category: 'gifts',
      thumbnail: '/api/placeholder/200/120',
      popularity: 82
    }
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: '1,000 Xu Đầu Tiên',
      description: 'Kiếm được 1,000 xu đầu tiên của bạn',
      icon: '🎯',
      progress: 1000,
      maxProgress: 1000,
      completed: true,
      reward: 50
    },
    {
      id: '2',
      title: 'Chuỗi Học Tập',
      description: 'Hoàn thành khóa học trong 7 ngày liên tiếp',
      icon: '🔥',
      progress: 7,
      maxProgress: 7,
      completed: true,
      reward: 100
    },
    {
      id: '3',
      title: 'Người Kiếm Xu Hàng Đầu',
      description: 'Lọt top 10% người kiếm xu nhiều nhất tuần này',
      icon: '👑',
      progress: 3800,
      maxProgress: 4000,
      completed: false,
      reward: 200
    },
    {
      id: '4',
      title: 'Mentor Hữu Ích',
      description: 'Nhận được 50 lượt tặng xu từ học viên',
      icon: '🌟',
      progress: 32,
      maxProgress: 50,
      completed: false,
      reward: 150
    }
  ]);

  const [earningFeed] = useState([
    { id: '1', message: 'Bạn đã kiếm được 50 xu khi hoàn thành Bài 3!', icon: '🎓', time: '30 phút trước' },
    { id: '2', message: 'Thưởng 25 xu cho điểm quiz hoàn hảo!', icon: '🏆', time: '1 giờ trước' },
    { id: '3', message: 'Nhận được 15 xu từ buổi hướng dẫn!', icon: '🤝', time: '2 giờ trước' },
    { id: '4', message: 'Thưởng đăng nhập hàng ngày: 10 xu!', icon: '📅', time: '1 ngày trước' }
  ]);

  // Coin packages for purchase (1 coin = 100 VND)
  const [coinPackages] = useState([
    {
      id: 'trial',
      coins: 25,
      price: 2500,
      originalPrice: 3000,
      discount: 17,
      popular: false,
      bonus: 0,
      title: 'Gói Dùng Thử',
      description: 'Khám phá SkillCoin miễn phí',
      color: '#6b7280',
      glowColor: 'rgba(107, 114, 128, 0.3)',
      special: false,
      limitedTime: false
    },
    {
      id: 'starter',
      coins: 50,
      price: 4500,
      originalPrice: 5000,
      discount: 10,
      popular: false,
      bonus: 5,
      title: 'Gói Khởi Đầu',
      description: 'Bắt đầu hành trình của bạn + 5 xu thưởng',
      color: '#22d3ee',
      glowColor: 'rgba(34, 211, 238, 0.3)',
      special: false,
      limitedTime: false
    },
    {
      id: 'basic',
      coins: 100,
      price: 8500,
      originalPrice: 10000,
      discount: 15,
      popular: false,
      bonus: 10,
      title: 'Gói Cơ Bản',
      description: 'Lựa chọn thông minh + 10 xu thưởng',
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      special: false,
      limitedTime: false
    },
    {
      id: 'student',
      coins: 250,
      price: 20000,
      originalPrice: 25000,
      discount: 20,
      popular: false,
      bonus: 30,
      title: 'Gói Học Sinh',
      description: 'Ưu đãi đặc biệt cho học sinh + 30 xu thưởng',
      color: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.4)',
      special: true,
      limitedTime: false
    },
    {
      id: 'popular',
      coins: 500,
      price: 40000,
      originalPrice: 50000,
      discount: 20,
      popular: true,
      bonus: 75,
      title: 'Gói Phổ Biến',
      description: 'Giá trị tốt nhất cho mọi người + 75 xu thưởng',
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      special: false,
      limitedTime: false
    },
    {
      id: 'weekend',
      coins: 750,
      price: 60000,
      originalPrice: 75000,
      discount: 20,
      popular: false,
      bonus: 150,
      title: 'Gói Cuối Tuần',
      description: 'Ưu đãi cuối tuần đặc biệt + 150 xu thưởng',
      color: '#8b5cf6',
      glowColor: 'rgba(139, 92, 246, 0.4)',
      special: true,
      limitedTime: true
    },
    {
      id: 'premium',
      coins: 1000,
      price: 80000,
      originalPrice: 100000,
      discount: 20,
      popular: false,
      bonus: 200,
      title: 'Gói Premium',
      description: 'Dành cho người dùng cao cấp + 200 xu thưởng',
      color: '#7c3aed',
      glowColor: 'rgba(124, 58, 237, 0.4)',
      special: false,
      limitedTime: false
    },
    {
      id: 'business',
      coins: 1500,
      price: 120000,
      originalPrice: 150000,
      discount: 20,
      popular: false,
      bonus: 300,
      title: 'Gói Doanh Nghiệp',
      description: 'Cho các chuyên gia và doanh nghiệp + 300 xu thưởng',
      color: '#14b8a6',
      glowColor: 'rgba(20, 184, 166, 0.4)',
      special: false,
      limitedTime: false
    },
    {
      id: 'mega',
      coins: 2500,
      price: 190000,
      originalPrice: 250000,
      discount: 24,
      popular: false,
      bonus: 600,
      title: 'Gói Mega',
      description: 'Sức mạnh vượt trội + 600 xu thưởng',
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      special: false,
      limitedTime: false
    },
    {
      id: 'flash',
      coins: 3000,
      price: 210000,
      originalPrice: 300000,
      discount: 30,
      popular: false,
      bonus: 1000,
      title: 'Gói Flash Sale',
      description: 'Siêu ưu đãi thời gian có hạn + 1000 xu thưởng',
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      special: true,
      limitedTime: true
    },
    {
      id: 'ultimate',
      coins: 5000,
      price: 350000,
      originalPrice: 500000,
      discount: 30,
      popular: false,
      bonus: 1500,
      title: 'Gói Ultimate',
      description: 'Đỉnh cao sức mạnh + 1500 xu thưởng',
      color: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.4)',
      special: false,
      limitedTime: false
    },
    {
      id: 'legendary',
      coins: 10000,
      price: 650000,
      originalPrice: 1000000,
      discount: 35,
      popular: false,
      bonus: 3500,
      title: 'Gói Huyền Thoại',
      description: 'Gói đặc biệt nhất + 3500 xu thưởng khủng',
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.6)',
      special: true,
      limitedTime: false
    }
  ]);

  // Filtered store items
  const filteredStoreItems = storeItems.filter(item => {
    const matchesCategory = selectedStoreCategory === 'all' || item.category === selectedStoreCategory;
    const matchesSearch = item.title.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(storeSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered transactions
  const filteredTransactions = recentTransactions.filter(transaction => {
    return transactionFilter === 'all' || transaction.type === transactionFilter;
  });

  const renderDashboard = () => (
    <div className="dashboard-content">
      {/* Balance Overview */}
      <div className="balance-section">
        <div className="balance-card main-balance">
          <div className="balance-header">
            <Coins className="balance-icon" />
            <h2>Số Dư Hiện Tại</h2>
          </div>
          <div className="balance-amount">{currentBalance.toLocaleString()}</div>
          <div className="balance-subtitle">SkillCoin</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <TrendingUp className="stat-icon earned" />
            <div className="stat-content">
              <div className="stat-value">{totalEarned.toLocaleString()}</div>
              <div className="wallet-stat-label">Tổng Đã Kiếm</div>
            </div>
          </div>

          <div className="stat-card">
            <Flame className="stat-icon streak" />
            <div className="stat-content">
              <div className="stat-value">{dailyStreak}</div>
              <div className="wallet-stat-label">Chuỗi Ngày</div>
            </div>
          </div>

          <div className="stat-card">
            <Trophy className="stat-icon level" />
            <div className="stat-content">
              <div className="stat-value">Cấp {userLevel}</div>
              <div className="wallet-stat-label">Bậc Thầy Xu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Thao Tác Nhanh</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn earn" onClick={() => window.location.href = '/courses'}>
            <Plus className="quick-action-icon" />
            <span>Kiếm Thêm</span>
          </button>
          <button className="quick-action-btn spend" onClick={() => setActiveTab('store')}>
            <ShoppingBag className="quick-action-icon" />
            <span>Tiêu Xu</span>
          </button>
          <button className="quick-action-btn tip" onClick={() => setShowTipModal(true)}>
            <Send className="quick-action-icon" />
            <span>Tặng Xu</span>
          </button>
          <button className="quick-action-btn buy" onClick={() => setActiveTab('buy-coins')}>
            <Coins className="quick-action-icon" />
            <span>Mua Xu</span>
          </button>
        </div>
      </div>

      {/* Earning Feed */}
      <div className="earning-feed">
        <div className="feed-header">
          <h3>Hoạt Động Gần Đây</h3>
          <button className="see-all-btn" onClick={() => setActiveTab('history')}>
            Xem Tất Cả <ChevronRight />
          </button>
        </div>
        <div className="feed-list">
          {earningFeed.map(item => (
            <div key={item.id} className="feed-item">
              <div className="feed-icon">{item.icon}</div>
              <div className="feed-content">
                <div className="feed-message">{item.message}</div>
                <div className="feed-time">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="transactions-preview">
        <div className="preview-header">
          <h3>Giao Dịch Gần Đây</h3>
          <button className="see-all-btn" onClick={() => setActiveTab('history')}>
            Xem Tất Cả <ChevronRight />
          </button>
        </div>
        <div className="transaction-list">
          {recentTransactions.slice(0, 3).map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-icon">{transaction.icon}</div>
              <div className="transaction-content">
                <div className="transaction-description">{transaction.description}</div>
                <div className="transaction-time">
                  {transaction.timestamp.toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className={`transaction-amount ${transaction.type}`}>
                {transaction.type === 'earned' || transaction.type === 'received' ? '+' : '-'}
                {transaction.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStore = () => (
    <div className="store-content">
      <div className="store-header">
        <h2>Cửa Hàng Xu</h2>
        <p>Tiêu xu của bạn cho khóa học, sự kiện, nâng cấp và quà tặng</p>
      </div>

      {/* Store Filters */}
      <div className="store-filters">
        <div className="coin-search-container">
          <Search className="coin-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={storeSearchTerm}
            onChange={(e) => setStoreSearchTerm(e.target.value)}
            className="coin-search-input"
          />
        </div>

        <div className="category-filters">
          {[
            { id: 'all', name: 'Tất Cả' },
            { id: 'courses', name: 'Khóa Học' },
            { id: 'events', name: 'Sự Kiện' },
            { id: 'upgrades', name: 'Nâng Cấp' },
            { id: 'gifts', name: 'Quà Tặng' }
          ].map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedStoreCategory(category.id)}
              className={`category-filter ${selectedStoreCategory === category.id ? 'active' : ''}`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="sort-filters">
          <button className="sort-btn">
            <Filter />
            Sắp xếp theo Độ phổ biến
          </button>
        </div>
      </div>

      {/* Store Grid */}
      <div className="store-grid">
        {filteredStoreItems.map(item => (
          <div key={item.id} className="store-item">
            {item.isNew && <div className="item-badge new">Mới</div>}
            {item.isRecommended && <div className="item-badge recommended">Đề xuất</div>}
            
            <div className="item-thumbnail">
              <img src={item.thumbnail} alt={item.title} />
            </div>
            
            <div className="item-content">
              <h4 className="item-title">{item.title}</h4>
              <p className="item-description">{item.description}</p>
              
              <div className="item-footer">
                <div className="item-price">
                  <Coins className="price-icon" />
                  {item.price}
                </div>
                <button className="unlock-btn">
                  Mở Khóa Ngay
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBuyCoins = () => (
    <div className="buy-coins-content">
      <div className="buy-coins-header">
        <h2>Mua SkillCoin</h2>
        <p>Nạp xu để mở khóa các tính năng premium và gia tăng trải nghiệm học tập</p>
        <div className="conversion-rate">
          <Coins className="conversion-rate-icon" />
          <span>1 SkillCoin = 100 VNĐ</span>
        </div>
      </div>

      {/* Flash Sale Banner */}
      <div className="flash-sale-banner">
        <div className="flash-sale-content">
          <div className="flash-sale-badge">
            <span className="flash-text">⚡ GIẢM GIÁ SỐC ⚡</span>
          </div>
          <h3>Giảm giá lên đến 20% cho tất cả gói xu!</h3>
          <h4 className="coin-achievement-title">Chỉ trong 24 giờ - Đừng bỏ lỡ cơ hội này!</h4>
          <div className="countdown-timer">
            <div className="countdown-item">
              <span className="countdown-number">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="countdown-label">Giờ</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="countdown-label">Phút</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="countdown-label">Giây</span>
            </div>
          </div>
        </div>
        <div className="flash-sale-decoration">
          <div className="sparkle sparkle-1">✨</div>
          <div className="sparkle sparkle-2">⭐</div>
          <div className="sparkle sparkle-3">💫</div>
        </div>
      </div>

      {/* Coin Packages */}
      <div className="coin-packages-grid">
        {coinPackages.map((pkg, index) => (
          <button 
            key={pkg.id} 
            type="button"
            className={`coin-package ${pkg.popular ? 'popular' : ''} ${pkg.special ? 'special' : ''} ${pkg.limitedTime ? 'limited-time' : ''} ${selectedCoinPackage === pkg.id ? 'selected' : ''}`}
            onClick={() => setSelectedCoinPackage(pkg.id)}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              '--glow-color': pkg.glowColor
            } as React.CSSProperties}
          >
            {pkg.popular && (
              <div className="popular-badge">
                <Star className="star-icon" />
                Phổ Biến Nhất
              </div>
            )}

            {pkg.special && !pkg.popular && (
              <div className="special-badge">
                <Sparkles className="sparkle-icon" />
                Đặc Biệt
              </div>
            )}

            {pkg.limitedTime && (
              <div className="limited-badge">
                <Clock className="clock-icon" />
                Có Hạn
              </div>
            )}
            
            {pkg.discount > 0 && (
              <div className="discount-badge">
                -{pkg.discount}%
              </div>
            )}

            <div className="package-header">
              <div 
                className="package-icon"
                style={{
                  background: `linear-gradient(135deg, ${pkg.color}, ${pkg.color}dd)`,
                  boxShadow: `0 4px 20px ${pkg.glowColor}`
                }}
              >
                <Coins className="coin-icon" />
              </div>
              <h3 className="package-title">{pkg.title}</h3>
              <p className="package-description">{pkg.description}</p>
            </div>

            <div className="package-coins">
              <div className="coins-amount">
                {pkg.coins.toLocaleString()} 
                {pkg.bonus > 0 && (
                  <span className="bonus-coins">+ {pkg.bonus}</span>
                )}
              </div>
              <div className="coins-label">SkillCoin</div>
            </div>

            <div className="package-pricing">
              {pkg.discount > 0 && (
                <div className="original-price">
                  {pkg.originalPrice.toLocaleString('vi-VN')}₫
                </div>
              )}
              <div className="current-price">
                {pkg.price.toLocaleString('vi-VN')}₫
              </div>
              <div className="price-per-coin">
                ~{Math.round(pkg.price / (pkg.coins + pkg.bonus))} VNĐ/xu
              </div>
            </div>

            <div className="package-features">
              <div className="feature">✓ Không phí giao dịch</div>
              <div className="feature">✓ Xu không hết hạn</div>
              {pkg.bonus > 0 && (
                <div className="feature bonus">✓ Thưởng {pkg.bonus} xu miễn phí</div>
              )}
              {pkg.special && (
                <div className="feature special">✨ Ưu đãi đặc biệt</div>
              )}
              {pkg.limitedTime && (
                <div className="feature limited">⏰ Thời gian có hạn</div>
              )}
            </div>

            <button 
              className={`buy-package-btn ${selectedCoinPackage === pkg.id ? 'selected' : ''}`}
              data-package-id={pkg.id}
              onClick={(e) => {
                e.stopPropagation();
                handleBuyCoins(pkg);
              }}
              style={{ 
                background: `linear-gradient(135deg, ${pkg.color}, ${pkg.color}dd)`,
                boxShadow: selectedCoinPackage === pkg.id ? `0 8px 25px ${pkg.glowColor}` : `0 4px 15px ${pkg.glowColor}`
              }}
            >
              {selectedCoinPackage === pkg.id ? 'Đã Chọn' : 'Chọn Gói'}
            </button>
          </button>
        ))}
      </div>
    </div>
  );

  // Toast helper functions
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, actionButton?: { text: string; onClick: () => void }) => {
    setToast({
      isVisible: true,
      type,
      title,
      message,
      actionButton
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleBuyCoins = (pkg: CoinPackage) => {
    setSelectedCoinPackage(pkg.id);
    
    // Add some visual feedback
    const button = document.querySelector(`[data-package-id="${pkg.id}"]`);
    if (button) {
      button.classList.add('purchase-success');
      setTimeout(() => {
        button.classList.remove('purchase-success');
      }, 1000);
    }
    
    // Show success toast for package selection
    const bonusText = pkg.bonus > 0 ? ` + ${pkg.bonus} xu thưởng` : '';
    showToast(
      'success',
      'Đã Chọn Gói!',
      `Bạn đã chọn ${pkg.title} - ${pkg.coins.toLocaleString()} xu${bonusText}`,
      {
        text: 'Thanh Toán Ngay',
        onClick: () => handleProceedPayment()
      }
    );
    
    
  };

  const handleProceedPayment = () => {
    if (!selectedCoinPackage) return;
    
    const selectedPkg = coinPackages.find(pkg => pkg.id === selectedCoinPackage);
    if (selectedPkg) {
      // Hide current toast
      hideToast();
      
      // Navigate to payment page with package details
      const titleBonusText = selectedPkg.bonus > 0 ? ` + ${selectedPkg.bonus} xu thưởng` : '';
      navigate('/payment', {
        state: {
          type: 'coins',
          title: `${selectedPkg.title} - ${selectedPkg.coins.toLocaleString()} SkillCoin${titleBonusText}`,
          price: selectedPkg.price,
          originalPrice: selectedPkg.originalPrice,
          discount: selectedPkg.discount,
          coins: selectedPkg.coins,
          bonus: selectedPkg.bonus,
          description: selectedPkg.description,
          conversion: '1 SkillCoin = 100 VNĐ'
        }
      });
    }
  };

  const renderHistory = () => (
    <div className="history-content">
      <div className="history-header">
        <h2>Lịch Sử Giao Dịch</h2>
        <div className="history-filters">
          {[
            { id: 'all', name: 'Tất Cả' },
            { id: 'earned', name: 'Đã Kiếm' },
            { id: 'spent', name: 'Đã Tiêu' },
            { id: 'sent', name: 'Đã Gửi' },
            { id: 'received', name: 'Đã Nhận' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setTransactionFilter(filter.id)}
              className={`category-filter ${transactionFilter === filter.id ? 'active' : ''}`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      <div className="transaction-list detailed">
        {filteredTransactions.map(transaction => (
          <div key={transaction.id} className="transaction-item detailed">
            <div className="transaction-left">
              <div className="transaction-icon large">{transaction.icon}</div>
              <div className="transaction-info">
                <div className="transaction-description">{transaction.description}</div>
                <div className="transaction-meta">
                  {transaction.fromUser && <span>Từ: {transaction.fromUser}</span>}
                  {transaction.toUser && <span>Đến: {transaction.toUser}</span>}
                  <span>{transaction.timestamp.toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>
            <div className={`transaction-amount large ${transaction.type}`}>
              {transaction.type === 'earned' || transaction.type === 'received' ? (
                <ArrowDownLeft className="amount-icon" />
              ) : (
                <ArrowUpRight className="amount-icon" />
              )}
              {transaction.type === 'earned' || transaction.type === 'received' ? '+' : '-'}
              {transaction.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="coin-achievements-content">
      <div className="wallet-achievements-header">
        <h2>Thành Tựu & Phần Thưởng</h2>
        <p>Hoàn thành thử thách để kiếm xu thưởng và mở khóa phần thưởng độc quyền</p>
      </div>

      <div className="coin-achievements-grid">
        {achievements.map(achievement => (
          <div key={achievement.id} className={`achievement-card ${achievement.completed ? 'completed' : ''}`}>
            <div className="coin-achievement-header">
              <div className="coin-achievement-icon">{achievement.icon}</div>
              {achievement.completed && (
                <div className="completion-badge">
                  <Check />
                </div>
              )}
            </div>
            
            <div className="coin-achievement-content">
              <h4 className="coin-achievement-title">{achievement.title}</h4>
              <p className="coin-achievement-description">{achievement.description}</p>
              
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  />
                </div>
                <div className="progress-text">
                  {achievement.progress} / {achievement.maxProgress}
                </div>
              </div>
              
              <div className="coin-achievement-reward">
                <Coins className="reward-icon" />
                <span>+{achievement.reward} xu</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`coin-wallet ${theme}`}>
      <div className="wallet-container">
        {/* Header */}
        <div className="wallet-header">
          <div className="header-left">
            <Coins className="wallet-logo" />
            <div className="coin-header-info">
              <h1>Ví SkillCoin</h1>
              <p className="coin-nav-tab">Quản lý phần thưởng học tập của bạn</p>
            </div>
          </div>
          
          <div className="coin-header-actions">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="coin-notification-btn"
            >
              <Bell className="coin-notification-icon" />
              <span className="notification-badge">3</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="coin-wallet-nav">
          {([
            { id: 'dashboard', label: 'Tổng Quan', icon: Target },
            { id: 'buy-coins', label: 'Mua Xu', icon: Coins },
            { id: 'store', label: 'Cửa Hàng', icon: ShoppingBag },
            { id: 'history', label: 'Lịch Sử', icon: Clock },
            { id: 'achievements', label: 'Thành Tựu', icon: Award }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`coin-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="tab-icon" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="wallet-main">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'store' && renderStore()}
          {activeTab === 'buy-coins' && renderBuyCoins()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'achievements' && renderAchievements()}
        </div>

        {/* Tip Modal */}
        <TipModal showTipModal={showTipModal} setShowTipModal={setShowTipModal} />

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-panel">
            <div className="panel-header">
              <h4>Thông Báo</h4>
              <button className="coin-close-btn" onClick={() => setShowNotifications(false)}>
                <X />
              </button>
            </div>
            <div className="notification-list">
              <div className="notification-item">
                <div className="notif-icon success">+</div>
                <div className="notif-content">
                  <div className="notif-title">Đã Kiếm Xu!</div>
                  <div className="notif-desc">+50 xu cho việc hoàn thành khóa học</div>
                </div>
              </div>
              <div className="notification-item">
                <div className="notif-icon info">🎉</div>
                <div className="notif-content">
                  <div className="notif-title">Mở Khóa Thành Tựu!</div>
                  <div className="notif-desc">Bạn đã đạt thành tựu "Chuỗi Học Tập"</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Component */}
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={hideToast}
          autoCloseDelay={5}
          showCountdown={true}
          countdownText="Tự động đóng sau {countdown} giây..."
          actionButton={toast.actionButton}
        />
      </div>
      <MeowGuide currentPage="wallet" />
    </div>
  );
};

export default CoinWallet;
