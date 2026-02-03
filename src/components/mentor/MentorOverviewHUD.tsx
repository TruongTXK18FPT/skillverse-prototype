import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Star, 
  DollarSign, 
  Video, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  BarChart
} from 'lucide-react';
import walletService from '../../services/walletService';
import { useToast } from '../../hooks/useToast';
import './MentorOverviewHUD.css';

interface MentorOverviewHUDProps {
  onNavigate: (tab: string) => void;
}

interface MentorStats {
  totalStudents: number;
  rating: number;
  monthEarnings: number;
  pendingGrading: number;
  pendingBookings: number;
}

interface SystemLog {
  time: string;
  message: string;
  type?: 'info' | 'warning' | 'error';
}

const MentorOverviewHUD: React.FC<MentorOverviewHUDProps> = ({ onNavigate }) => {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MentorStats>({
    totalStudents: 0,
    rating: 0,
    monthEarnings: 0,
    pendingGrading: 0,
    pendingBookings: 0
  });
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    loadMentorOverview();
  }, []);

  const loadMentorOverview = async () => {
    setLoading(true);
    try {
      // Fetch wallet statistics for earnings
      const walletStats = await walletService.getWalletStatistics();
      const walletData = await walletService.getMyWallet();
      
      // Get recent transactions for system logs
      const recentTransactions = await walletService.getTransactions(0, 5);
      
      // Generate system logs from transactions
      const logs: SystemLog[] = recentTransactions.content.map((tx) => {
        const time = new Date(tx.createdAt).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        let message = '';
        let type: 'info' | 'warning' | 'error' = 'info';
        
        if (tx.transactionType === 'EARN_FROM_SESSION') {
          message = `Nhận thanh toán ${formatCurrency(tx.cashAmount || 0)} từ buổi học`;
        } else if (tx.transactionType === 'EARN_FROM_COURSE') {
          message = `Nhận thu nhập ${formatCurrency(tx.cashAmount || 0)} từ khóa học`;
        } else if (tx.transactionType === 'DEPOSIT') {
          message = `Nạp tiền ${formatCurrency(tx.cashAmount || 0)} thành công`;
        } else if (tx.transactionType === 'WITHDRAWAL') {
          message = `Rút tiền ${formatCurrency(tx.cashAmount || 0)}`;
          type = 'warning';
        } else {
          message = tx.description || 'Giao dịch mới';
        }
        
        return { time, message, type };
      });

      // Add default logs if no transactions
      if (logs.length < 3) {
        logs.push(
          {
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            message: 'Hệ thống đồng bộ dữ liệu hoàn tất.',
            type: 'info'
          }
        );
      }

      // Calculate month earnings from wallet statistics
      // Use total deposited as month earnings approximation
      const monthEarnings = walletStats.totalDeposited || walletData.cashBalance;

      setStats({
        totalStudents: 0, // TODO: Implement student count API
        rating: 4.8, // TODO: Implement rating API  
        monthEarnings: monthEarnings,
        pendingGrading: 0, // TODO: Implement pending grading count
        pendingBookings: 0  // TODO: Implement pending bookings count
      });

      setSystemLogs(logs);
    } catch (error) {
      console.error('Error loading mentor overview:', error);
      showError('Lỗi', 'Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };
  return (
    <div className="mentor-overview">
      <div className="mentor-overview__grid">
        {/* Next Class Card */}
        <div className="overview-card next-class-card">
          <div className="card-header">
            <Video size={18} className="icon--cyan" />
            <span>LỚP HỌC TIẾP THEO</span>
            <div className="header-status-dot pulse"></div>
          </div>
          <div className="card-body">
            <div className="no-class">
              <p>Không có lớp học sắp diễn ra</p>
              <button className="view-schedule-btn" onClick={() => onNavigate('schedule')}>
                Xem lịch trình
              </button>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="overview-card pending-tasks-card">
          <div className="card-header">
            <AlertCircle size={18} className="icon--red" />
            <span>TÁC VỤ CẦN XỬ LÝ GẤP</span>
          </div>
          <div className="card-body">
            <div className="task-item" onClick={() => onNavigate('grading')}>
              <div className="task-info">
                <span className="task-count">{stats.pendingGrading}</span>
                <span className="task-label">Bài tập cần chấm</span>
              </div>
              <ChevronRight size={16} />
            </div>
            <div className="task-item" onClick={() => onNavigate('bookings')}>
              <div className="task-info">
                <span className="task-count">{stats.pendingBookings}</span>
                <span className="task-label">Yêu cầu đặt lịch mới</span>
              </div>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="overview-card stats-summary-card">
          <div className="card-header">
            <BarChart size={18} className="icon--yellow" />
            <span>THỐNG KÊ THÁNG NÀY</span>
          </div>
          <div className="card-body">
            <div className="stat-card stat-card--highlight">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Thu nhập tháng này</span>
                <span className="stat-value">{formatCurrency(stats.monthEarnings)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mentor-overview__bottom">
        <div className="system-logs">
          <h3>SYSTEM LOGS</h3>
          <div className="log-entries">
            {systemLogs.map((log, idx) => (
              <div key={idx} className={`log-entry ${log.type !== 'info' ? log.type : ''}`}>
                <span className="log-time">[{log.time}]</span>
                <span className="log-msg">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorOverviewHUD;
