import React, { useState } from 'react';
import { Transaction } from '../../pages/main/MentorPage';
import './EarningsTab.css';

const EarningsTab: React.FC = () => {
  // Mock earnings data
  const [earnings] = useState({
    totalEarnings: 3200000,
    paidSessions: 24,
    pendingAmount: 450000,
    lastWithdrawal: '2025-06-28'
  });

  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      amount: 500000,
      date: '2025-07-02',
      status: 'Completed',
      description: 'Buổi học Thực Hành Tốt Nhất React',
      studentName: 'Nguyễn Văn An'
    },
    {
      id: '2',
      amount: 300000,
      date: '2025-07-01',
      status: 'In Progress',
      description: 'Cơ Bản TypeScript',
      studentName: 'Lê Văn Cường'
    },
    {
      id: '3',
      amount: 750000,
      date: '2025-06-30',
      status: 'Completed',
      description: 'Tư Vấn Phát Triển Full Stack',
      studentName: 'Trần Thị Dung'
    },
    {
      id: '4',
      amount: 400000,
      date: '2025-06-29',
      status: 'Completed',
      description: 'Buổi Hướng Dẫn Nghề Nghiệp',
      studentName: 'Phạm Văn Em'
    },
    {
      id: '5',
      amount: 600000,
      date: '2025-06-28',
      status: 'Failed',
      description: 'Mẫu React Nâng Cao',
      studentName: 'Hoàng Thị Phương'
    }
  ]);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const statusClasses = {
      'In Progress': 'mentor-earnings-status-progress',
      'Completed': 'mentor-earnings-status-completed',
      'Failed': 'mentor-earnings-status-failed'
    };
    return statusClasses[status] || 'mentor-earnings-status-progress';
  };

  const handleWithdrawFunds = () => {
    setShowWithdrawModal(true);
  };

  const handleViewPaymentHistory = () => {
    alert('Payment history details would be implemented here');
  };

  const completedTransactions = transactions.filter(t => t.status === 'Completed');
  const pendingTransactions = transactions.filter(t => t.status === 'In Progress');
  const failedTransactions = transactions.filter(t => t.status === 'Failed');

  return (
    <div className="mentor-earnings-tab">
      <div className="mentor-earnings-tab-header">
        <h2>💰 Thu Nhập</h2>
        <p>Theo dõi thu nhập và quản lý rút tiền</p>
      </div>

      <div className="mentor-earnings-overview">
        <div className="mentor-earnings-main-stats">
          <div className="mentor-earnings-total-earnings">
            <div className="mentor-earnings-icon">💰</div>
            <div className="mentor-earnings-info">
              <div className="mentor-earnings-label">Tổng Thu Nhập</div>
              <div className="mentor-earnings-amount">{formatCurrency(earnings.totalEarnings)}</div>
              <div className="mentor-earnings-subtitle">Từ {earnings.paidSessions} buổi học có phí</div>
            </div>
          </div>
          
          <div className="mentor-earnings-pending-earnings">
            <div className="mentor-earnings-pending-icon">⏳</div>
            <div className="mentor-earnings-pending-info">
              <div className="mentor-earnings-pending-label">Đang Chờ Thanh Toán</div>
              <div className="mentor-earnings-pending-amount">{formatCurrency(earnings.pendingAmount)}</div>
              <div className="mentor-earnings-pending-subtitle">
                {pendingTransactions.length} giao dịch đang xử lý
              </div>
            </div>
          </div>
        </div>

        <div className="mentor-earnings-stats-grid">
          <div className="mentor-earnings-stat-card completed">
            <div className="mentor-earnings-stat-value">{completedTransactions.length}</div>
            <div className="mentor-earnings-stat-label">Hoàn Thành</div>
          </div>
          <div className="mentor-earnings-stat-card pending">
            <div className="mentor-earnings-stat-value">{pendingTransactions.length}</div>
            <div className="mentor-earnings-stat-label">Đang Xử Lý</div>
          </div>
          <div className="mentor-earnings-stat-card failed">
            <div className="mentor-earnings-stat-value">{failedTransactions.length}</div>
            <div className="mentor-earnings-stat-label">Thất Bại</div>
          </div>
        </div>
      </div>

      <div className="mentor-earnings-action-section">
        <button className="mentor-earnings-action-btn mentor-earnings-withdraw-btn" onClick={handleWithdrawFunds}>
          Rút Tiền
        </button>
        <button className="mentor-earnings-action-btn mentor-earnings-history-btn" onClick={handleViewPaymentHistory}>
          Xem Lịch Sử Thanh Toán
        </button>
      </div>

      <div className="mentor-earnings-transactions-section">
        <div className="mentor-earnings-section-header">
          <h3>Giao Dịch Gần Đây</h3>
          <p>Hoạt động thanh toán và thu nhập từ buổi học gần đây</p>
        </div>

        {transactions.length === 0 ? (
          <div className="mentor-earnings-empty-state">
            <div className="mentor-earnings-empty-icon">💸</div>
            <h4>No transactions yet</h4>
            <p>Your transaction history will appear here once you start earning from sessions.</p>
          </div>
        ) : (
          <div className="mentor-earnings-transactions-table-container">
            <table className="mentor-earnings-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="mentor-earnings-date">{formatDate(transaction.date)}</div>
                    </td>
                    <td>
                      <div className="mentor-earnings-student-name">{transaction.studentName}</div>
                    </td>
                    <td>
                      <div className="mentor-earnings-description">{transaction.description}</div>
                    </td>
                    <td>
                      <div className="mentor-earnings-amount">{formatCurrency(transaction.amount)}</div>
                    </td>
                    <td>
                      <span className={`mentor-earnings-status-badge ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdraw Funds Modal */}
      {showWithdrawModal && (
        <div className="mentor-earnings-modal-overlay">
          <div className="mentor-earnings-modal-content">
            <div className="mentor-earnings-modal-header">
              <h3>Withdraw Funds</h3>
              <button className="mentor-earnings-close-modal" onClick={() => setShowWithdrawModal(false)}>
                ×
              </button>
            </div>
            <div className="mentor-earnings-modal-body">
              <div className="mentor-earnings-available-balance">
                <div className="mentor-earnings-balance-label">Available Balance</div>
                <div className="mentor-earnings-balance-amount">{formatCurrency(earnings.totalEarnings - earnings.pendingAmount)}</div>
              </div>
              
              <div className="mentor-earnings-form-group">
                <label htmlFor="withdraw-amount">Withdrawal Amount</label>
                <input 
                  type="number" 
                  id="withdraw-amount"
                  className="mentor-earnings-form-input" 
                  placeholder="Enter amount..."
                  max={earnings.totalEarnings - earnings.pendingAmount}
                />
              </div>
              
              <div className="mentor-earnings-form-group">
                <label htmlFor="bank-account">Bank Account</label>
                <select id="bank-account" className="mentor-earnings-form-select">
                  <option value="">Select bank account...</option>
                  <option value="vietcombank">Vietcombank - ****1234</option>
                  <option value="techcombank">Techcombank - ****5678</option>
                </select>
              </div>
              
              <div className="mentor-earnings-withdrawal-note">
                <p>• Withdrawals are processed within 1-3 business days</p>
                <p>• Minimum withdrawal amount: ₫100,000</p>
                <p>• Processing fee: ₫10,000</p>
              </div>
              
              <div className="mentor-earnings-form-actions">
                <button className="mentor-earnings-action-btn mentor-earnings-cancel-btn" onClick={() => setShowWithdrawModal(false)}>
                  Cancel
                </button>
                <button className="mentor-earnings-action-btn mentor-earnings-confirm-btn">
                  Confirm Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsTab;
