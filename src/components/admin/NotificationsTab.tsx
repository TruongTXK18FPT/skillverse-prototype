import React, { useState } from 'react';
import './NotificationsTab.css';

const NotificationsTab: React.FC = () => {
  const [notificationType, setNotificationType] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleSendNotification = () => {
    console.log('Sending notification:', { notificationType, title, message, isUrgent });
    // Reset form
    setTitle('');
    setMessage('');
    setIsUrgent(false);
  };

  return (
    <div className="administrator-notifications">
      <div className="administrator-notifications-header">
        <h2>Quản Lý Thông Báo</h2>
        <p>Tạo và gửi thông báo đến người dùng trên toàn nền tảng</p>
      </div>
      
      <div className="administrator-notifications-form">
        <h3>Tạo Thông Báo Mới</h3>
        
        <div className="administrator-notifications-form-group">
          <label>Tiêu đề thông báo:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề thông báo..."
          />
        </div>

        <div className="administrator-notifications-form-group">
          <label>Nội dung thông báo:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung chi tiết thông báo..."
          />
        </div>

        <div className="administrator-notifications-form-group">
          <label>Gửi đến:</label>
          <select value={notificationType} onChange={(e) => setNotificationType(e.target.value)}>
            <option value="all">Tất cả người dùng</option>
            <option value="mentor">Chỉ Mentors</option>
            <option value="business">Chỉ Doanh nghiệp</option>
            <option value="student">Chỉ Học viên</option>
          </select>
        </div>

        <div className="administrator-notifications-form-group">
          <label>Loại thông báo:</label>
          <div className="administrator-notifications-type-options">
            <div className="administrator-notifications-type-option">
              <input type="radio" name="urgency" value="normal" checked={!isUrgent} onChange={() => setIsUrgent(false)} />
              <span>Thông thường</span>
            </div>
            <div className="administrator-notifications-type-option">
              <input type="radio" name="urgency" value="urgent" checked={isUrgent} onChange={() => setIsUrgent(true)} />
              <span>Khẩn cấp</span>
            </div>
          </div>
        </div>

        <div className="administrator-notifications-actions">
          <button className="administrator-notifications-btn preview">
            Xem trước
          </button>
          <button className="administrator-notifications-btn send" onClick={handleSendNotification}>
            Gửi ngay
          </button>
          <button className="administrator-notifications-btn schedule">
            Lên lịch
          </button>
        </div>
      </div>

      <div className="administrator-notifications-history">
        <h3>Lịch Sử Thông Báo</h3>
        <div className="administrator-notifications-list">
          <div className="administrator-notifications-item">
            <div className="administrator-notifications-item-header">
              <h4>Cập nhật tính năng mới</h4>
              <span className="administrator-notifications-item-date">3 giờ trước</span>
            </div>
            <p>Chúng tôi đã thêm tính năng chat realtime để cải thiện trải nghiệm giao tiếp giữa mentor và học viên.</p>
            <span className="administrator-notifications-item-type">Tất cả</span>
          </div>
          
          <div className="administrator-notifications-item">
            <div className="administrator-notifications-item-header">
              <h4>Bảo trì hệ thống</h4>
              <span className="administrator-notifications-item-date">1 ngày trước</span>
            </div>
            <p>Hệ thống sẽ được bảo trì từ 2:00 - 4:00 sáng ngày mai. Trong thời gian này, một số tính năng có thể bị gián đoạn.</p>
            <span className="administrator-notifications-item-type">Khẩn cấp</span>
          </div>
          
          <div className="administrator-notifications-item">
            <div className="administrator-notifications-item-header">
              <h4>Khuyến mãi đặc biệt cho mentor</h4>
              <span className="administrator-notifications-item-date">2 ngày trước</span>
            </div>
            <p>Tăng 20% hoa hồng cho tất cả mentor hoàn thành ít nhất 5 buổi coaching trong tuần này.</p>
            <span className="administrator-notifications-item-type">Mentor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;

