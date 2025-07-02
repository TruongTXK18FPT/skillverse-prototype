import React, { useState } from 'react';
import { MentoringSession } from '../../pages/main/MentorPage';
import './MentoringHistoryTab.css';

const MentoringHistoryTab: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const sessionsPerPage = 10;

  // Mock data for mentoring history
  const [sessions] = useState<MentoringSession[]>([
    {
      id: '1',
      studentName: 'Nguyễn Văn An',
      date: '2025-01-15T14:00:00',
      topic: 'Thực Hành Tốt Nhất React',
      status: 'Completed',
      type: 'Paid',
      earnings: 500000,
      skillPoints: 50,
      hasReview: true
    },
    {
      id: '2',
      studentName: 'Trần Thị Bình',
      date: '2025-01-14T16:00:00',
      topic: 'Hướng Dẫn Nghề Nghiệp',
      status: 'Rated',
      type: 'Free',
      earnings: 0,
      skillPoints: 25,
      hasReview: true
    },
    {
      id: '3',
      studentName: 'Lê Văn Cường',
      date: '2025-01-13T10:00:00',
      topic: 'Cơ Bản TypeScript',
      status: 'Completed',
      type: 'Paid',
      earnings: 300000,
      skillPoints: 50,
      hasReview: false
    },
    {
      id: '4',
      studentName: 'Phạm Thị Dung',
      date: '2025-01-12T09:30:00',
      topic: 'Chủ Đề Nâng Cao JavaScript',
      status: 'Rated',
      type: 'Paid',
      earnings: 400000,
      skillPoints: 75,
      hasReview: true
    },
    {
      id: '5',
      studentName: 'Hoàng Văn Em',
      date: '2025-01-11T15:45:00',
      topic: 'Tổng Quan Phát Triển Web',
      status: 'No Feedback',
      type: 'Free',
      earnings: 0,
      skillPoints: 25,
      hasReview: false
    },
    {
      id: '6',
      studentName: 'Võ Thị Phương',
      date: '2025-01-10T11:20:00',
      topic: 'Debug Dự Án',
      status: 'Completed',
      type: 'Paid',
      earnings: 350000,
      skillPoints: 50,
      hasReview: false
    },
    {
      id: '7',
      studentName: 'Đào Văn Giang',
      date: '2025-01-09T13:00:00',
      topic: 'Thiết Kế Thuật Toán',
      status: 'Rated',
      type: 'Paid',
      earnings: 450000,
      skillPoints: 75,
      hasReview: true
    },
    {
      id: '8',
      studentName: 'Bùi Thị Hường',
      date: '2025-01-08T16:30:00',
      topic: 'Thiết Kế Cơ Sở Dữ Liệu',
      status: 'Completed',
      type: 'Free',
      earnings: 0,
      skillPoints: 25,
      hasReview: false
    },
    {
      id: '9',
      studentName: 'Nguyễn Văn Ích',
      date: '2025-01-07T10:15:00',
      topic: 'Kiến Trúc Hệ Thống',
      status: 'Rated',
      type: 'Paid',
      earnings: 600000,
      skillPoints: 100,
      hasReview: true
    },
    {
      id: '10',
      studentName: 'Trần Thị Kim',
      date: '2025-01-06T14:45:00',
      topic: 'Thực Hành Tốt Nhất UI/UX',
      status: 'No Feedback',
      type: 'Free',
      earnings: 0,
      skillPoints: 25,
      hasReview: false
    },
    {
      id: '11',
      studentName: 'Lê Văn Khải',
      date: '2025-01-05T09:00:00',
      topic: 'Phát Triển Di Động',
      status: 'Completed',
      type: 'Paid',
      earnings: 550000,
      skillPoints: 75,
      hasReview: false
    },
    {
      id: '12',
      studentName: 'Phạm Thị Lan',
      date: '2025-01-04T11:30:00',
      topic: 'Chiến Lược Kiểm Thử',
      status: 'Rated',
      type: 'Paid',
      earnings: 400000,
      skillPoints: 75,
      hasReview: true
    }
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Completed': 'success',
      'Rated': 'info',
      'No Feedback': 'warning'
    };
    
    const statusLabels = {
      'Completed': 'Hoàn Thành',
      'Rated': 'Đã Đánh Giá',
      'No Feedback': 'Chưa Phản Hồi'
    };
    
    return (
      <span className={`mht-status-badge mht-status-${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      'Paid': 'Trả Phí',
      'Free': 'Miễn Phí'
    };
    
    return (
      <span className={`mht-type-badge mht-type-${type.toLowerCase()}`}>
        {typeLabels[type as keyof typeof typeLabels]}
      </span>
    );
  };

  const getFilteredSessions = () => {
    return sessions.filter(session => {
      const matchesSearch = session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
      const matchesType = selectedType === 'all' || session.type === selectedType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const filteredSessions = getFilteredSessions();
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + sessionsPerPage);

  // Statistics
  const totalSessions = sessions.length;
  const totalEarnings = sessions.reduce((sum, session) => sum + (session.earnings ?? 0), 0);
  const totalSkillPoints = sessions.reduce((sum, session) => sum + (session.skillPoints ?? 0), 0);
  const averageRating = sessions.filter(s => s.hasReview).length; // Simplified for demo

  const handleExportData = () => {
    console.log('Đang xuất dữ liệu lịch sử hướng dẫn...');
    // In a real app, this would generate and download a CSV/Excel file
    alert('Chức năng xuất dữ liệu sẽ được triển khai ở đây');
  };

  return (
    <div className="mht-history-tab">
      <div className="mht-tab-header">
        <h2>📚 Lịch Sử Hướng Dẫn</h2>
        <p>Theo dõi các buổi hướng dẫn, thu nhập và đánh giá của bạn</p>
      </div>
      {/* Statistics Overview */}
      <div className="mht-stats-overview">
        <div className="mht-stat-card">
          <span className="mht-stat-icon">📚</span>
          <div className="mht-stat-content">
            <h3>{totalSessions}</h3>
            <p>Tổng Buổi Học</p>
          </div>
        </div>
        
        <div className="mht-stat-card">
          <span className="mht-stat-icon">💰</span>
          <div className="mht-stat-content">
            <h3>{formatCurrency(totalEarnings)}</h3>
            <p>Tổng Thu Nhập</p>
          </div>
        </div>
        
        <div className="mht-stat-card">
          <span className="mht-stat-icon">🪙</span>
          <div className="mht-stat-content">
            <h3>{totalSkillPoints}</h3>
            <p>Điểm Kỹ Năng Kiếm Được</p>
          </div>
        </div>
        
        <div className="mht-stat-card">
          <span className="mht-stat-icon">⭐</span>
          <div className="mht-stat-content">
            <h3>{averageRating}</h3>
            <p>Đánh Giá Nhận Được</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mht-controls">
        <div className="mht-search">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên học viên hoặc chủ đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mht-search-input"
          />
        </div>

        <div className="mht-filters">
          <div className="mht-filter-group">
            <label htmlFor="status-filter">Trạng Thái:</label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mht-filter-select"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="Completed">Hoàn Thành</option>
              <option value="Rated">Đã Đánh Giá</option>
              <option value="No Feedback">Chưa Phản Hồi</option>
            </select>
          </div>

          <div className="mht-filter-group">
            <label htmlFor="type-filter">Loại:</label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mht-filter-select"
            >
              <option value="all">Tất Cả Loại</option>
              <option value="Paid">Trả Phí</option>
              <option value="Free">Miễn Phí</option>
            </select>
          </div>

          <button onClick={handleExportData} className="mht-export-btn">
            📤 Xuất Dữ Liệu
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="mht-table-container">
        {paginatedSessions.length === 0 ? (
          <div className="mht-no-sessions">
            <p>Không tìm thấy buổi học nào phù hợp với tiêu chí của bạn.</p>
          </div>
        ) : (
          <table className="mht-sessions-table">
            <thead>
              <tr>
                <th>Học Viên</th>
                <th>Ngày & Giờ</th>
                <th>Chủ Đề</th>
                <th>Loại</th>
                <th>Trạng Thái</th>
                <th>Thu Nhập</th>
                <th>Điểm</th>
                <th>Đánh Giá</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <div className="mht-student-info">
                      <div className="mht-student-avatar">
                        {session.studentName.charAt(0).toUpperCase()}
                      </div>
                      <span>{session.studentName}</span>
                    </div>
                  </td>
                  <td>{formatDate(session.date)}</td>
                  <td>
                    <span className="mht-topic">{session.topic}</span>
                  </td>
                  <td>{getTypeBadge(session.type)}</td>
                  <td>{getStatusBadge(session.status)}</td>
                  <td>
                    <span className="mht-earnings">
                      {session.earnings ? formatCurrency(session.earnings) : '-'}
                    </span>
                  </td>
                  <td>
                    <span className="mht-points">+{session.skillPoints}</span>
                  </td>
                  <td>
                    <span className={`mht-review-status ${session.hasReview ? 'has-review' : 'no-review'}`}>
                      {session.hasReview ? '✓' : '○'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mht-pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="mht-page-btn"
          >
            ← Trước
          </button>
          
          <div className="mht-page-info">
            <span>
              Trang {currentPage} / {totalPages} 
              ({filteredSessions.length} tổng số buổi học)
            </span>
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="mht-page-btn"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
};

export default MentoringHistoryTab;
