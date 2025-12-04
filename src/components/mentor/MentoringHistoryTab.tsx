import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MentoringSession } from '../../pages/main/MentorPage';
import { getMyBookings, BookingResponse } from '../../services/bookingService';
import { getMentorCoursePurchases, CoursePurchaseDTO } from '../../services/courseService';
import './MentoringHistoryTab.css';

interface HistoryItem {
  id: string;
  studentName: string; // or User Name
  date: string;
  topic: string; // Course Title or Booking Topic
  status: string;
  type: 'Booking' | 'Course Sale';
  earnings: number;
  skillPoints: number; // Mocked for now
  hasReview: boolean; // Mocked for now
}

const MentoringHistoryTab: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const sessionsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch Bookings
      const bookingsPage = await getMyBookings(true, 0, 100); // Fetching 100 for now to merge client-side
      const bookings = bookingsPage.content.map((b: BookingResponse) => ({
        id: `booking-${b.id}`,
        studentName: b.learnerName || 'Unknown Learner',
        date: b.startTime,
        topic: 'Mentoring Session', // Could be enriched if topic is available
        status: b.status,
        type: 'Booking' as const,
        earnings: b.priceVnd * 0.8, // 80% share
        skillPoints: 50, // Mock
        hasReview: false // Need to check review status if possible
      }));

      // Fetch Course Purchases
      const purchasesPage = await getMentorCoursePurchases(0, 100);
      const purchases = purchasesPage.content.map((p: CoursePurchaseDTO) => ({
        id: `purchase-${p.id}`,
        studentName: p.buyerName || `User #${p.userId}`,
        date: p.purchasedAt,
        topic: p.courseTitle || `Course #${p.courseId}`,
        status: p.status,
        type: 'Course Sale' as const,
        earnings: p.price * 0.8,
        skillPoints: 10,
        hasReview: false
      }));

      // Merge and Sort
      const allItems = [...bookings, ...purchases].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setHistoryItems(allItems);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

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
    let statusClass = 'info';
    let statusLabel = status;

    if (status === 'COMPLETED' || status === 'PAID') {
      statusClass = 'success';
      statusLabel = 'Hoàn Thành';
    } else if (status === 'PENDING') {
      statusClass = 'warning';
      statusLabel = 'Chờ Xử Lý';
    } else if (status === 'CANCELLED' || status === 'REJECTED') {
      statusClass = 'danger'; // You might need to add this class to CSS
      statusLabel = 'Đã Hủy';
    }

    return (
      <span className={`mentor-history-status-badge mentor-history-status-${statusClass}`}>
        {statusLabel}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeClass = type === 'Booking' ? 'paid' : 'free'; // Reusing existing classes for simplicity
    return (
      <span className={`mentor-history-type-badge mentor-history-type-${typeClass}`}>
        {type === 'Booking' ? 'Booking' : 'Khóa Học'}
      </span>
    );
  };

  const getFilteredSessions = () => {
    return historyItems.filter(item => {
      const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || 
                          (selectedType === 'Booking' && item.type === 'Booking') ||
                          (selectedType === 'Course' && item.type === 'Course Sale');
      
      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const filteredSessions = getFilteredSessions();
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + sessionsPerPage);

  // Statistics
  const totalSessions = historyItems.length;
  const totalEarnings = historyItems.reduce((sum, item) => sum + (item.earnings ?? 0), 0);
  const totalSkillPoints = historyItems.reduce((sum, item) => sum + (item.skillPoints ?? 0), 0);
  const averageRating = 0; // Placeholder

  const handleExportData = async () => {
    const rowsHtml = filteredSessions.map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb"><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:50%;background:#e5e7eb;color:#111827;display:flex;align-items:center;justify-content:center;font-weight:600">${item.studentName.charAt(0).toUpperCase()}</div><span>${item.studentName}</span></div></td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatDate(item.date)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${item.topic}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${item.type === 'Booking' ? 'Booking' : 'Khóa Học'}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${item.status}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${item.earnings ? formatCurrency(item.earnings) : '-'}</td>
      </tr>
    `).join('');

    const exportHtml = `
      <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#0ea5e9)"></div>
          <div>
            <div style="font-size:20px;font-weight:700">Lịch sử hoạt động mentor</div>
            <div style="font-size:12px;color:#64748b">Tổng giao dịch: ${totalSessions} • Tổng thu nhập: ${formatCurrency(totalEarnings)} • Điểm kỹ năng: ${totalSkillPoints}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Người Dùng</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Ngày & Giờ</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Nội Dung</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Loại</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Trạng Thái</th>
              <th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb">Thu Nhập (80%)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = '1024px';
    container.innerHTML = exportHtml;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Mentor-History.pdf');
    } catch (e) {
      alert('Xuất PDF thất bại');
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <div className="mentor-history-tab">
      <div className="mentor-history-tab-header">
        <h2>📚 Lịch Sử Hoạt Động</h2>
        <p>Theo dõi các buổi hướng dẫn, bán khóa học và thu nhập</p>
      </div>
      {/* Statistics Overview */}
      <div className="mentor-history-stats-overview">
        <div className="mentor-history-stat-card">
          <span className="mentor-history-stat-icon">📚</span>
          <div className="mentor-history-stat-content">
            <h3>{totalSessions}</h3>
            <p>Tổng Giao Dịch</p>
          </div>
        </div>
        
        <div className="mentor-history-stat-card">
          <span className="mentor-history-stat-icon">💰</span>
          <div className="mentor-history-stat-content">
            <h3>{formatCurrency(totalEarnings)}</h3>
            <p>Tổng Thu Nhập</p>
          </div>
        </div>
        
        <div className="mentor-history-stat-card">
          <span className="mentor-history-stat-icon">🪙</span>
          <div className="mentor-history-stat-content">
            <h3>{totalSkillPoints}</h3>
            <p>Điểm Kỹ Năng</p>
          </div>
        </div>
        
        <div className="mentor-history-stat-card">
          <span className="mentor-history-stat-icon">⭐</span>
          <div className="mentor-history-stat-content">
            <h3>{averageRating}</h3>
            <p>Đánh Giá</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mentor-history-controls">
        <div className="mentor-history-search">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc chủ đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mentor-history-search-input"
          />
        </div>

        <div className="mentor-history-filters">
          <div className="mentor-history-filter-group">
            <label htmlFor="status-filter">Trạng Thái:</label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mentor-history-filter-select"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="COMPLETED">Hoàn Thành</option>
              <option value="PAID">Đã Thanh Toán</option>
              <option value="PENDING">Chờ Xử Lý</option>
            </select>
          </div>

          <div className="mentor-history-filter-group">
            <label htmlFor="type-filter">Loại:</label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mentor-history-filter-select"
            >
              <option value="all">Tất Cả Loại</option>
              <option value="Booking">Booking</option>
              <option value="Course">Khóa Học</option>
            </select>
          </div>

          <button onClick={handleExportData} className="mentor-history-export-btn">
            📤 Xuất Dữ Liệu
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="mentor-history-table-container">
        {loading ? (
          <div className="mentor-loading-state"><div className="spinner"></div><p>Đang tải dữ liệu...</p></div>
        ) : paginatedSessions.length === 0 ? (
          <div className="mentor-history-no-sessions">
            <p>Không tìm thấy hoạt động nào phù hợp với tiêu chí của bạn.</p>
          </div>
        ) : (
          <table className="mentor-history-sessions-table">
            <thead>
              <tr>
                <th>Người Dùng</th>
                <th>Ngày & Giờ</th>
                <th>Nội Dung</th>
                <th>Loại</th>
                <th>Trạng Thái</th>
                <th>Thu Nhập (80%)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSessions.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="mentor-history-student-info">
                      <div className="mentor-history-student-avatar">
                        {item.studentName.charAt(0).toUpperCase()}
                      </div>
                      <span>{item.studentName}</span>
                    </div>
                  </td>
                  <td>{formatDate(item.date)}</td>
                  <td>
                    <span className="mentor-history-topic">{item.topic}</span>
                  </td>
                  <td>{getTypeBadge(item.type)}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <span className="mentor-history-earnings">
                      {item.earnings ? formatCurrency(item.earnings) : '-'}
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
        <div className="mentor-history-pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="mentor-history-page-btn"
          >
            ← Trước
          </button>
          
          <div className="mentor-history-page-info">
            <span>
              Trang {currentPage} / {totalPages} 
              ({filteredSessions.length} tổng số)
            </span>
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="mentor-history-page-btn"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
};

export default MentoringHistoryTab;
