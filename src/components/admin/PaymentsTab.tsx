import React, { useState } from 'react';
import './PaymentsTab.css';

const PaymentsTab: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const transactions = [
    {
      id: 'TXN-001',
      user: 'Nguyễn Văn A',
      type: 'Thanh toán buổi coaching',
      amount: 500000,
      status: 'completed',
      date: '2024-01-15',
      method: 'Visa ***1234'
    },
    {
      id: 'TXN-002',
      user: 'Trần Thị B',
      type: 'Rút tiền',
      amount: -300000,
      status: 'pending',
      date: '2024-01-15',
      method: 'Ngân hàng ACB'
    },
    {
      id: 'TXN-003',
      user: 'Lê Văn C',
      type: 'Thanh toán premium',
      amount: 999000,
      status: 'failed',
      date: '2024-01-14',
      method: 'MasterCard ***5678'
    },
    {
      id: 'TXN-004',
      user: 'Phạm Thị D',
      type: 'Hoàn tiền',
      amount: -150000,
      status: 'refunded',
      date: '2024-01-14',
      method: 'Visa ***9876'
    },
    {
      id: 'TXN-005',
      user: 'Hoàng Văn E',
      type: 'Nạp SkillPoint',
      amount: 200000,
      status: 'completed',
      date: '2024-01-13',
      method: 'Momo'
    }
  ];

  const filteredTransactions = activeFilter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.status === activeFilter);

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('vi-VN');
    return amount >= 0 ? `+${formatted} VNĐ` : `-${formatted} VNĐ`;
  };

  const getAmountClass = (amount: number) => {
    return amount >= 0 ? 'positive' : 'negative';
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      case 'refunded': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const handleAction = (transactionId: string, action: string) => {
    console.log(`${action} transaction ${transactionId}`);
  };

  return (
    <div className="administrator-payments">
      <div className="administrator-payments-header">
        <h2>Quản Lý Thanh Toán</h2>
        <p>Theo dõi và quản lý tất cả giao dịch tài chính trên nền tảng</p>
      </div>

      <div className="administrator-payments-overview">
        <div className="administrator-payments-card">
          <div className="administrator-payments-card-header">
            <div className="administrator-payments-card-icon">💰</div>
            <h3 className="administrator-payments-card-title">Tổng Doanh Thu</h3>
          </div>
          <div className="administrator-payments-card-amount">₫52.5M</div>
          <div className="administrator-payments-card-change positive">
            ↗ +12.5% so với tháng trước
          </div>
        </div>

        <div className="administrator-payments-card">
          <div className="administrator-payments-card-header">
            <div className="administrator-payments-card-icon">📊</div>
            <h3 className="administrator-payments-card-title">Giao Dịch Hôm Nay</h3>
          </div>
          <div className="administrator-payments-card-amount">127</div>
          <div className="administrator-payments-card-change positive">
            ↗ +8.3% so với hôm qua
          </div>
        </div>

        <div className="administrator-payments-card">
          <div className="administrator-payments-card-header">
            <div className="administrator-payments-card-icon">⏳</div>
            <h3 className="administrator-payments-card-title">Đang Chờ Xử Lý</h3>
          </div>
          <div className="administrator-payments-card-amount">23</div>
          <div className="administrator-payments-card-change negative">
            ↘ -5.2% so với hôm qua
          </div>
        </div>

        <div className="administrator-payments-card">
          <div className="administrator-payments-card-header">
            <div className="administrator-payments-card-icon">💳</div>
            <h3 className="administrator-payments-card-title">Hoa Hồng Platform</h3>
          </div>
          <div className="administrator-payments-card-amount">₫2.8M</div>
          <div className="administrator-payments-card-change positive">
            ↗ +15.7% so với tháng trước
          </div>
        </div>
      </div>

      <div className="administrator-payments-filters">
        <button 
          className={`administrator-payments-filter ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tất cả giao dịch
        </button>
        <button 
          className={`administrator-payments-filter ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          Hoàn thành
        </button>
        <button 
          className={`administrator-payments-filter ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          Đang xử lý
        </button>
        <button 
          className={`administrator-payments-filter ${activeFilter === 'failed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('failed')}
        >
          Thất bại
        </button>
        <button 
          className={`administrator-payments-filter ${activeFilter === 'refunded' ? 'active' : ''}`}
          onClick={() => setActiveFilter('refunded')}
        >
          Đã hoàn tiền
        </button>
      </div>

      <div className="administrator-payments-table-container">
        <table className="administrator-payments-table">
          <thead>
            <tr>
              <th>ID Giao Dịch</th>
              <th>Người Dùng</th>
              <th>Loại Giao Dịch</th>
              <th>Số Tiền</th>
              <th>Trạng Thái</th>
              <th>Phương Thức</th>
              <th>Ngày</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <span className="administrator-payments-transaction-id">
                    {transaction.id}
                  </span>
                </td>
                <td>
                  <div className="administrator-payments-user">
                    <div className="administrator-payments-user-avatar">
                      {transaction.user.charAt(0)}
                    </div>
                    <span>{transaction.user}</span>
                  </div>
                </td>
                <td>{transaction.type}</td>
                <td>
                  <span className={`administrator-payments-amount ${getAmountClass(transaction.amount)}`}>
                    {formatAmount(transaction.amount)}
                  </span>
                </td>
                <td>
                  <span className={`administrator-payments-status ${transaction.status}`}>
                    {getStatusText(transaction.status)}
                  </span>
                </td>
                <td>{transaction.method}</td>
                <td>{transaction.date}</td>
                <td>
                  <div className="administrator-payments-actions">
                    <button 
                      className="administrator-payments-action-btn view"
                      onClick={() => handleAction(transaction.id, 'view')}
                    >
                      Xem
                    </button>
                    {transaction.status === 'completed' && (
                      <button 
                        className="administrator-payments-action-btn refund"
                        onClick={() => handleAction(transaction.id, 'refund')}
                      >
                        Hoàn tiền
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="administrator-payments-pagination">
        <button 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          ← Trước
        </button>
        <button className="active">1</button>
        <button onClick={() => setCurrentPage(2)}>2</button>
        <button onClick={() => setCurrentPage(3)}>3</button>
        <button onClick={() => setCurrentPage(currentPage + 1)}>
          Sau →
        </button>
      </div>
    </div>
  );
};

export default PaymentsTab;
