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
      'In Progress': 'et-status-progress',
      'Completed': 'et-status-completed',
      'Failed': 'et-status-failed'
    };
    return statusClasses[status] || 'et-status-progress';
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
    <div className="et-earnings-tab">
      <div className="et-tab-header">
        <h2>💰 Thu Nhập</h2>
        <p>Theo dõi thu nhập và quản lý rút tiền</p>
      </div>

      <div className="et-earnings-overview">
        <div className="et-main-stats">
          <div className="et-total-earnings">
            <div className="et-earnings-icon">💰</div>
            <div className="et-earnings-info">
              <div className="et-earnings-label">Tổng Thu Nhập</div>
              <div className="et-earnings-amount">{formatCurrency(earnings.totalEarnings)}</div>
              <div className="et-earnings-subtitle">Từ {earnings.paidSessions} buổi học có phí</div>
            </div>
          </div>
          
          <div className="et-pending-earnings">
            <div className="et-pending-icon">⏳</div>
            <div className="et-pending-info">
              <div className="et-pending-label">Đang Chờ Thanh Toán</div>
              <div className="et-pending-amount">{formatCurrency(earnings.pendingAmount)}</div>
              <div className="et-pending-subtitle">
                {pendingTransactions.length} giao dịch đang xử lý
              </div>
            </div>
          </div>
        </div>

        <div className="et-stats-grid">
          <div className="et-stat-card completed">
            <div className="et-stat-value">{completedTransactions.length}</div>
            <div className="et-stat-label">Hoàn Thành</div>
          </div>
          <div className="et-stat-card pending">
            <div className="et-stat-value">{pendingTransactions.length}</div>
            <div className="et-stat-label">Đang Xử Lý</div>
          </div>
          <div className="et-stat-card failed">
            <div className="et-stat-value">{failedTransactions.length}</div>
            <div className="et-stat-label">Thất Bại</div>
          </div>
        </div>
      </div>

      <div className="et-action-section">
        <button className="et-action-btn et-withdraw-btn" onClick={handleWithdrawFunds}>
          Rút Tiền
        </button>
        <button className="et-action-btn et-history-btn" onClick={handleViewPaymentHistory}>
          Xem Lịch Sử Thanh Toán
        </button>
      </div>

      <div className="et-transactions-section">
        <div className="et-section-header">
          <h3>Giao Dịch Gần Đây</h3>
          <p>Hoạt động thanh toán và thu nhập từ buổi học gần đây</p>
        </div>

        {transactions.length === 0 ? (
          <div className="et-empty-state">
            <div className="et-empty-icon">💸</div>
            <h4>No transactions yet</h4>
            <p>Your transaction history will appear here once you start earning from sessions.</p>
          </div>
        ) : (
          <div className="et-transactions-table-container">
            <table className="et-transactions-table">
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
                      <div className="et-date">{formatDate(transaction.date)}</div>
                    </td>
                    <td>
                      <div className="et-student-name">{transaction.studentName}</div>
                    </td>
                    <td>
                      <div className="et-description">{transaction.description}</div>
                    </td>
                    <td>
                      <div className="et-amount">{formatCurrency(transaction.amount)}</div>
                    </td>
                    <td>
                      <span className={`et-status-badge ${getStatusBadge(transaction.status)}`}>
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
        <div className="et-modal-overlay">
          <div className="et-modal-content">
            <div className="et-modal-header">
              <h3>Withdraw Funds</h3>
              <button className="et-close-modal" onClick={() => setShowWithdrawModal(false)}>
                ×
              </button>
            </div>
            <div className="et-modal-body">
              <div className="et-available-balance">
                <div className="et-balance-label">Available Balance</div>
                <div className="et-balance-amount">{formatCurrency(earnings.totalEarnings - earnings.pendingAmount)}</div>
              </div>
              
              <div className="et-form-group">
                <label htmlFor="withdraw-amount">Withdrawal Amount</label>
                <input 
                  type="number" 
                  id="withdraw-amount"
                  className="et-form-input" 
                  placeholder="Enter amount..."
                  max={earnings.totalEarnings - earnings.pendingAmount}
                />
              </div>
              
              <div className="et-form-group">
                <label htmlFor="bank-account">Bank Account</label>
                <select id="bank-account" className="et-form-select">
                  <option value="">Select bank account...</option>
                  <option value="vietcombank">Vietcombank - ****1234</option>
                  <option value="techcombank">Techcombank - ****5678</option>
                </select>
              </div>
              
              <div className="et-withdrawal-note">
                <p>• Withdrawals are processed within 1-3 business days</p>
                <p>• Minimum withdrawal amount: ₫100,000</p>
                <p>• Processing fee: ₫10,000</p>
              </div>
              
              <div className="et-form-actions">
                <button className="et-action-btn et-cancel-btn" onClick={() => setShowWithdrawModal(false)}>
                  Cancel
                </button>
                <button className="et-action-btn et-confirm-btn">
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
