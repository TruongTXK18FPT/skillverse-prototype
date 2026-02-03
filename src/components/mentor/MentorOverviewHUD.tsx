import React from 'react';
import { 
  Users, 
  Star, 
  DollarSign, 
  Video, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import './MentorOverviewHUD.css';

interface MentorOverviewHUDProps {
  loading?: boolean;
  stats?: {
    totalStudents: number;
    rating: number;
    monthEarnings: number;
    pendingGrading: number;
    pendingBookings: number;
  };
  nextClass?: {
    title: string;
    time: string;
    link: string;
  } | null;
  onNavigate: (tab: string) => void;
}

const MentorOverviewHUD: React.FC<MentorOverviewHUDProps> = ({ 
  loading = false,
  stats = {
    totalStudents: 0,
    rating: 0,
    monthEarnings: 0,
    pendingGrading: 0,
    pendingBookings: 0
  }, 
  nextClass,
  onNavigate 
}) => {
  if (loading) {
    return (
      <div className="mentor-overview mentor-overview--loading">
        <div className="mentor-overview__loading-spinner">
          <div className="spinner-ring"></div>
          <span>INITIALIZING COMMAND OVERVIEW...</span>
        </div>
      </div>
    );
  }

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
            {nextClass ? (
              <>
                <h2>{nextClass.title}</h2>
                <div className="class-time">
                  <Clock size={16} />
                  <span>Bắt đầu lúc {nextClass.time}</span>
                </div>
                <button className="join-class-btn">
                  VÀO LỚP NGAY
                  <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <div className="no-class">
                <p>Không có lớp học sắp diễn ra</p>
                <button className="view-schedule-btn" onClick={() => onNavigate('schedule')}>
                  Xem lịch trình
                </button>
              </div>
            )}
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
        <div className="overview-stats-container">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Học viên</span>
              <span className="stat-value">{stats.totalStudents}</span>
            </div>
            <div className="stat-trend positive">
              <TrendingUp size={12} />
              <span>+12%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Star size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Đánh giá</span>
              <span className="stat-value">{stats.rating.toFixed(1)}/5.0</span>
            </div>
          </div>

          <div className="stat-card stat-card--highlight">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Thu nhập tháng này</span>
              <span className="stat-value">{stats.monthEarnings.toLocaleString()} VND</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mentor-overview__bottom">
        <div className="system-logs">
          <h3>SYSTEM LOGS</h3>
          <div className="log-entries">
            <div className="log-entry">
              <span className="log-time">[10:00:24]</span>
              <span className="log-msg">Hệ thống đồng bộ dữ liệu hoàn tất.</span>
            </div>
            <div className="log-entry">
              <span className="log-time">[09:45:12]</span>
              <span className="log-msg">Nhận thanh toán mới từ học viên Trần Văn A.</span>
            </div>
            <div className="log-entry warning">
              <span className="log-time">[08:30:00]</span>
              <span className="log-msg">Bạn có 3 bài tập sắp hết hạn chấm bài.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorOverviewHUD;
