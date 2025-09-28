import React, { useState } from 'react';
import BookingManagerTab from '../../components/mentor/BookingManagerTab';
import MyScheduleTab from '../../components/mentor/MyScheduleTab';
import EarningsTab from '../../components/mentor/EarningsTab';
import SkillPointsTab from '../../components/mentor/SkillPointsTab';
import ReviewsTab from '../../components/mentor/ReviewsTab';
import MentoringHistoryTab from '../../components/mentor/MentoringHistoryTab';
import '../../styles/MentorPage.css';

// Types for mentor dashboard data
export interface Booking {
  id: string;
  studentName: string;
  bookingTime: string;
  topic?: string;
  status: 'Pending' | 'Confirmed' | 'Completed';
  price: number;
  studentAvatar?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'available' | 'booked' | 'blocked';
  studentName?: string;
  topic?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  status: 'In Progress' | 'Completed' | 'Failed';
  description: string;
  studentName: string;
}

export interface Review {
  id: string;
  studentName: string;
  rating: number;
  feedback: string;
  date: string;
  sessionTopic: string;
  studentAvatar?: string;
}

export interface MentoringSession {
  id: string;
  studentName: string;
  date: string;
  topic: string;
  status: 'Completed' | 'Rated' | 'No Feedback';
  type: 'Free' | 'Paid';
  earnings?: number;
  skillPoints?: number;
  hasReview: boolean;
}

export interface SkillPointActivity {
  id: string;
  activity: string;
  points: number;
  date: string;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
}

const MentorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('bookings');

  // Mock data for demonstrations
  const [bookings] = useState<Booking[]>([
    {
      id: '1',
      studentName: 'Nguyễn Văn An',
      bookingTime: '2025-07-03T14:00:00',
      topic: 'Thực Hành Tốt Nhất React',
      status: 'Pending',
      price: 500000,
    },
    {
      id: '2',
      studentName: 'Trần Thị Bình',
      bookingTime: '2025-07-04T10:00:00',
      topic: 'Hướng Dẫn Nghề Nghiệp',
      status: 'Confirmed',
      price: 0,
    },
    {
      id: '3',
      studentName: 'Lê Văn Cường',
      bookingTime: '2025-07-02T16:00:00',
      topic: 'Cơ Bản TypeScript',
      status: 'Completed',
      price: 300000,
    },
  ]);

  const handleApproveBooking = (bookingId: string) => {
    console.log('Approving booking:', bookingId);
    // In real app, update booking status to Confirmed
  };

  const handleRejectBooking = (bookingId: string) => {
    console.log('Rejecting booking:', bookingId);
    // In real app, update booking status or remove
  };

  const handleMarkAsDone = (bookingId: string) => {
    console.log('Marking booking as done:', bookingId);
    // In real app, update booking status to Completed
  };

  const tabs = [
    { 
      id: 'bookings', 
      label: 'Quản Lý Đặt Lịch', 
      icon: '📋',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Quản lý lịch đặt của học viên'
    },
    { 
      id: 'schedule', 
      label: 'Lịch Trình', 
      icon: '📅',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: 'Xem lịch trình của bạn'
    },
    { 
      id: 'earnings', 
      label: 'Thu Nhập', 
      icon: '💰',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: 'Theo dõi thu nhập'
    },
    { 
      id: 'skillpoints', 
      label: 'Điểm Kỹ Năng', 
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: 'Thành tích của bạn'
    },
    { 
      id: 'reviews', 
      label: 'Đánh Giá', 
      icon: '⭐',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: 'Phản hồi học viên'
    },
    { 
      id: 'history', 
      label: 'Lịch Sử', 
      icon: '📚',
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      description: 'Hồ sơ buổi học'
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <BookingManagerTab
            bookings={bookings}
            onApprove={handleApproveBooking}
            onReject={handleRejectBooking}
            onMarkAsDone={handleMarkAsDone}
          />
        );
      case 'schedule':
        return <MyScheduleTab />;
      case 'earnings':
        return <EarningsTab />;
      case 'skillpoints':
        return <SkillPointsTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'history':
        return <MentoringHistoryTab />;
      default:
        return (
          <div className="mp-default-tab">
            <h2>Chào mừng đến với Bảng Điều Khiển Mentor</h2>
            <p>Chọn một tab để xem các hoạt động hướng dẫn của bạn.</p>
          </div>
        );
    }
  };

  return (
    <div className="mp-mentor-page">
      <div className="mp-header">
        <h1>Bảng Điều Khiển Mentor</h1>
        <p>Quản lý hoạt động hướng dẫn và theo dõi tác động của bạn</p>
      </div>

      <div className="mp-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`mp-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              '--tab-gradient': tab.gradient
            } as React.CSSProperties & { '--tab-gradient': string }}
          >
            <div className="mp-tab-icon-wrapper">
              <span className="mp-tab-icon">{tab.icon}</span>
            </div>
            <div className="mp-tab-content">
              <span className="mp-tab-label">{tab.label}</span>
              <span className="mp-tab-description">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mp-content">
        {renderActiveTab()}
      </div>

      {/* Meowl Guide */}
    </div>
  );
};

export default MentorPage;
