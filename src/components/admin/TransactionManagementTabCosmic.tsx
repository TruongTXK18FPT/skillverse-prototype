import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard,
  Search, Filter, Eye, Download, RefreshCw, X, Calendar,
  User, ArrowUpRight, ArrowDownLeft, Coins
} from 'lucide-react';
import walletService from '../../services/walletService';
import { paymentService } from '../../services/paymentService';
// import { premiumService } from '../../services/premiumService';
import adminService from '../../services/adminService';
import './TransactionManagementTabCosmic.css';

type TransactionType = 'ALL' | 'WALLET' | 'PAYMENT' | 'WITHDRAWAL' | 'COIN_PURCHASE';

interface CombinedTransaction {
  id: string;
  type: TransactionType;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  method?: string;
  reference?: string;
  originalData: any;
}

const TransactionManagementTabCosmic: React.FC = () => {
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<CombinedTransaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalWithdrawals: 0,
    totalTransactions: 0,
    pendingCount: 0,
    todayRevenue: 0,
    coinPurchases: 0
  });

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  // Apply filters when search/filter changes
  useEffect(() => {
    if (transactions.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        applyFilters();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, typeFilter, statusFilter, transactions]);

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching all transactions...');
      
      // Fetch all transaction types (we'll combine them)
      // Using size=1000 to get all transactions
      const [walletTxs, paymentTxs, withdrawals] = await Promise.all([
        fetchWalletTransactions(),
        fetchPaymentTransactions(),
        fetchWithdrawals()
      ]);

      console.log('✅ Fetched:', {
        wallet: walletTxs.length,
        payment: paymentTxs.length,
        withdrawal: withdrawals.length
      });

      const combined = [...walletTxs, ...paymentTxs, ...withdrawals];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('📊 Total transactions:', combined.length);
      setTransactions(combined);
      calculateStats(combined);
      
      // Apply filters immediately after setting transactions
      setFilteredTransactions(combined);
      setTotalPages(Math.ceil(combined.length / itemsPerPage));
    } catch (error: any) {
      console.error('❌ Error fetching transactions:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletTransactions = async (): Promise<CombinedTransaction[]> => {
    try {
      console.log('📡 Fetching wallet transactions...');
      const response = await walletService.adminGetAllWalletTransactions(0, 1000);
      console.log('✅ Wallet transactions response:', response);
      return response.content.map(tx => {
        const t = (tx.transactionType || '').toUpperCase();
        const mappedType: TransactionType =
          (t.includes('PURCHASE_COINS') || t === 'COIN_PURCHASE') ? 'COIN_PURCHASE' :
          (t.includes('PURCHASE_PREMIUM') || t.includes('PREMIUM_SUBSCRIPTION')) ? 'PAYMENT' :
          'WALLET';
        return {
          id: `WAL-${tx.transactionId}`,
          type: mappedType as TransactionType,
          userId: tx.userId,
          userName: tx.userName || `User ${tx.userId}`,
          userEmail: tx.userEmail || '-',
          userAvatarUrl: tx.userAvatarUrl,
          amount: tx.cashAmount || tx.coinAmount || 0,
          status: tx.status,
          description: tx.description || tx.transactionTypeName || 'Wallet transaction',
          createdAt: tx.createdAt,
          method: tx.currencyType === 'COIN' ? 'Coin' : 'Cash',
          reference: tx.referenceId,
          originalData: tx
        };
      });
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  };

  const fetchPaymentTransactions = async (): Promise<CombinedTransaction[]> => {
    try {
      console.log('📡 Fetching payment transactions...');
      const response = await paymentService.adminGetAllTransactions(0, 1000);
      console.log('✅ Payment transactions response:', response);
      return response.content.map(payment => ({
        id: `PAY-${payment.id}`,
        type: 'PAYMENT' as TransactionType,
        userId: payment.userId,
        userName: payment.userName || `User ${payment.userId}`,
        userEmail: payment.userEmail || '-',
        userAvatarUrl: payment.userAvatarUrl,
        amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
        status: payment.status,
        description: payment.description || 'Payment transaction',
        createdAt: payment.createdAt,
        method: 'PayOS',
        reference: payment.internalReference,
        originalData: payment
      }));
    } catch (error: any) {
      console.error('❌ Error fetching payment transactions:', error);
      console.error('Payment error details:', error.response?.data || error.message);
      return [];
    }
  };

  const fetchWithdrawals = async (): Promise<CombinedTransaction[]> => {
    try {
      console.log('📡 Fetching withdrawals...');
      const response = await walletService.adminGetWithdrawalRequests(0, 1000);
      console.log('✅ Withdrawals response:', response);
      return response.content.map(withdrawal => ({
        id: `WD-${withdrawal.requestCode}`,
        type: 'WITHDRAWAL' as TransactionType,
        userId: withdrawal.userId,
        userName: withdrawal.userFullName || `User ${withdrawal.userId}`,
        userEmail: withdrawal.userEmail || '-',
        userAvatarUrl: withdrawal.userAvatarUrl,
        amount: -withdrawal.amount, // Negative for withdrawals
        status: withdrawal.status,
        description: `Rút tiền về ${withdrawal.bankName}`,
        createdAt: withdrawal.createdAt,
        method: withdrawal.bankName,
        reference: withdrawal.requestCode,
        originalData: withdrawal
      }));
    } catch (error: any) {
      console.error('❌ Error fetching withdrawals:', error);
      console.error('Withdrawal error details:', error.response?.data || error.message);
      return [];
    }
  };

  // Premium subscriptions are excluded from this Transactions tab to avoid duplication

  const calculateStats = (txs: CombinedTransaction[]) => {
    // Only count revenue from PURCHASES (not deposits/topups)
    const isPurchaseTransaction = (tx: CombinedTransaction) => {
      const desc = tx.description?.toLowerCase() || '';
      const type = tx.type;
      // Exclude wallet deposits/topups
      if (desc.includes('nạp tiền') || desc.includes('deposit') || desc.includes('topup')) {
        return false;
      }
      // Include: Premium, Coin purchases, Course purchases
      return (
        type === 'PAYMENT' || 
        type === 'COIN_PURCHASE' ||
        desc.includes('premium') || 
        desc.includes('xu') || 
        desc.includes('coin') ||
        desc.includes('khóa học') ||
        desc.includes('course')
      );
    };

    const revenue = txs
      .filter(tx => 
        tx.amount > 0 && 
        (tx.status === 'COMPLETED' || tx.status === 'PAID') &&
        isPurchaseTransaction(tx)
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const withdrawals = txs
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const pending = txs.filter(tx => 
      tx.status === 'PENDING' || tx.status === 'APPROVED'
    ).length;

    // Today's revenue - only from purchases
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayRevenue = txs
      .filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= todayStart && 
          tx.amount > 0 &&
          (tx.status === 'COMPLETED' || tx.status === 'PAID') &&
          isPurchaseTransaction(tx);
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const coinPurchases = txs.filter(tx => 
      tx.type === 'COIN_PURCHASE' || tx.description?.includes('xu') || tx.description?.includes('PURCHASE_COINS')
    ).length;

    setStats({
      totalRevenue: revenue,
      totalWithdrawals: withdrawals,
      totalTransactions: txs.length,
      pendingCount: pending,
      todayRevenue,
      coinPurchases
    });
  };

  const applyFilters = () => {
    console.log('🔍 Applying filters...', { 
      totalTransactions: transactions.length, 
      typeFilter, 
      statusFilter, 
      searchTerm 
    });
    
    let filtered = transactions;

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.userName?.toLowerCase().includes(search) ||
        tx.userEmail?.toLowerCase().includes(search) ||
        tx.reference?.toLowerCase().includes(search) ||
        tx.description.toLowerCase().includes(search)
      );
    }

    console.log('✅ Filtered result:', filtered.length, 'transactions');
    setFilteredTransactions(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Get current page transactions
  const getCurrentPageTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetail = (transaction: CombinedTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleDownloadInvoice = async (transaction: CombinedTransaction) => {
    try {
      let blob: Blob;
      let filename: string;
      
      if (transaction.id.startsWith('WAL-')) {
        // Wallet transaction
        const txId = parseInt(transaction.id.replace('WAL-', ''));
        blob = await paymentService.adminDownloadWalletInvoice(txId);
        filename = `wallet-invoice-${txId}.pdf`;
      } else if (transaction.id.startsWith('PAY-')) {
        // Payment transaction
        const paymentId = parseInt(transaction.id.replace('PAY-', ''));
        blob = await paymentService.adminDownloadPaymentInvoice(paymentId);
        filename = `invoice-${paymentId}.pdf`;
      } else if (transaction.id.startsWith('PREMIUM-')) {
        const paymentId = transaction.originalData?.paymentTransactionId;
        if (typeof paymentId === 'number') {
          blob = await paymentService.adminDownloadPaymentInvoice(paymentId);
          filename = `invoice-${paymentId}.pdf`;
        } else {
          console.error('Premium subscription missing paymentTransactionId');
          return;
        }
      } else {
        console.error('Unknown transaction type for invoice download');
        return;
      }

      if (!blob || (blob.type && blob.type !== 'application/pdf')) {
        try {
          const text = await blob.text();
          console.error('Invoice response is not PDF:', text);
        } catch (_e) {
          void 0;
        }
        throw new Error('Invalid invoice response');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Invoice downloaded:', filename);
    } catch (error) {
      console.error('❌ Error downloading invoice:', error);
      alert('Không thể tải hóa đơn. Vui lòng thử lại sau.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'WALLET': return <Wallet size={18} />;
      case 'PAYMENT': return <CreditCard size={18} />;
      case 'WITHDRAWAL': return <ArrowDownLeft size={18} />;
      case 'COIN_PURCHASE': return <Coins size={18} />;
      default: return <DollarSign size={18} />;
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'WALLET': return 'Ví';
      case 'PAYMENT': return 'Thanh toán';
      case 'WITHDRAWAL': return 'Rút tiền';
      case 'COIN_PURCHASE': return 'Mua xu';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'COMPLETED': { label: 'Hoàn thành', className: 'completed' },
      'PAID': { label: 'Đã thanh toán', className: 'completed' },
      'PENDING': { label: 'Chờ xử lý', className: 'pending' },
      'APPROVED': { label: 'Đã duyệt', className: 'approved' },
      'REJECTED': { label: 'Từ chối', className: 'rejected' },
      'CANCELLED': { label: 'Đã hủy', className: 'cancelled' },
      'FAILED': { label: 'Thất bại', className: 'failed' },
      'EXPIRED': { label: 'Hết hạn', className: 'expired' }
    };

    const statusInfo = statusMap[status] || { label: status, className: 'default' };

    return (
      <span className={`admin-status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-transaction-management-cosmic">
        <div className="admin-loading-state">
          <RefreshCw size={48} className="spinning" />
          <p>Đang tải dữ liệu giao dịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-transaction-management-cosmic">
      {/* Header */}
      <div className="admin-transaction-header">
        <div>
          <h2>Quản Lý Giao Dịch</h2>
          <p>Theo dõi tất cả giao dịch: Thanh toán, Rút tiền, Mua xu, Premium</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-refresh-btn" onClick={fetchAllTransactions} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
          <button
            className="admin-download-btn"
            onClick={() => {
              const params: any = {};
              if (statusFilter !== 'ALL') params.status = statusFilter;
              // No user filter UI here; export all currently filtered by status/type
              if (typeFilter === 'COIN_PURCHASE') params.walletType = 'PURCHASE_COINS';
              if (startDate) params.startDate = `${startDate}T00:00:00`;
              if (endDate) params.endDate = `${endDate}T23:59:59`;
              adminService.downloadTransactionsReport(params);
            }}
            disabled={loading}
            title="Tải báo cáo giao dịch (CSV)"
          >
            <Download size={18} />
            Xuất báo cáo
          </button>
          <button
            className="admin-download-btn"
            onClick={() => {
              const params: any = {};
              if (statusFilter !== 'ALL') params.status = statusFilter;
              if (typeFilter === 'COIN_PURCHASE') params.walletType = 'PURCHASE_COINS';
              if (startDate) params.startDate = `${startDate}T00:00:00`;
              if (endDate) params.endDate = `${endDate}T23:59:59`;
              adminService.downloadTransactionsReportPdf(params);
            }}
            disabled={loading}
            title="Tải báo cáo giao dịch (PDF)"
          >
            <Download size={18} />
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-transaction-stats">
        <div className="admin-stat-card revenue">
          <TrendingUp size={32} />
          <div>
            <div className="admin-stat-number">{formatCurrency(stats.totalRevenue)}</div>
            <div className="admin-stat-label">Tổng Doanh Thu</div>
          </div>
        </div>
        <div className="admin-stat-card withdrawals">
          <TrendingDown size={32} />
          <div>
            <div className="admin-stat-number">{formatCurrency(stats.totalWithdrawals)}</div>
            <div className="admin-stat-label">Tổng Rút Tiền</div>
          </div>
        </div>
        <div className="admin-stat-card transactions">
          <DollarSign size={32} />
          <div>
            <div className="admin-stat-number">{stats.totalTransactions}</div>
            <div className="admin-stat-label">Tổng Giao Dịch</div>
          </div>
        </div>
        <div className="admin-stat-card pending">
          <Calendar size={32} />
          <div>
            <div className="admin-stat-number">{stats.pendingCount}</div>
            <div className="admin-stat-label">Chờ Xử Lý</div>
          </div>
        </div>
        <div className="admin-stat-card today">
          <ArrowUpRight size={32} />
          <div>
            <div className="admin-stat-number">{formatCurrency(stats.todayRevenue)}</div>
            <div className="admin-stat-label">Doanh Thu Hôm Nay</div>
          </div>
        </div>
        <div className="admin-stat-card coins">
          <Coins size={32} />
          <div>
            <div className="admin-stat-number">{stats.coinPurchases}</div>
            <div className="admin-stat-label">Giao Dịch Xu</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-transaction-filters">
        <div className="admin-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, mã giao dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-date-range">
          <label>
            Từ ngày
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <div className="admin-status-filters">
          <Filter size={20} />
          <button
            className={`admin-filter-btn ${typeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            Tất cả loại
          </button>
          <button
            className={`admin-filter-btn ${typeFilter === 'PAYMENT' ? 'active' : ''}`}
            onClick={() => setTypeFilter('PAYMENT')}
          >
            <CreditCard size={16} /> Thanh toán
          </button>
          <button
            className={`admin-filter-btn ${typeFilter === 'WITHDRAWAL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('WITHDRAWAL')}
          >
            <ArrowDownLeft size={16} /> Rút tiền
          </button>
          <button
            className={`admin-filter-btn ${typeFilter === 'COIN_PURCHASE' ? 'active' : ''}`}
            onClick={() => setTypeFilter('COIN_PURCHASE')}
          >
            <Coins size={16} /> Mua xu
          </button>
        </div>

        <div className="admin-status-filters">
          <button
            className={`admin-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả trạng thái
          </button>
          <button
            className={`admin-filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            Hoàn thành
          </button>
          <button
            className={`admin-filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Chờ xử lý
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-transactions-table">
        <table>
          <thead>
            <tr>
              <th>Mã GD</th>
              <th>Người dùng</th>
              <th>Loại</th>
              <th>Mô tả</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Phương thức</th>
              <th>Thời gian</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageTransactions().map((tx) => (
              <tr key={tx.id}>
                <td>
                  <span className="admin-transaction-code">{tx.reference || tx.id}</span>
                </td>
                <td>
                  <div className="admin-user-info">
                    <div className="admin-user-avatar">
                      {tx.userAvatarUrl ? (
                        <img src={tx.userAvatarUrl} alt={tx.userName || 'User'} />
                      ) : (
                        tx.userName?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <div className="admin-user-name">{tx.userName || 'Unknown'}</div>
                      <div className="admin-user-email">{tx.userEmail || '-'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`admin-type-badge ${tx.type.toLowerCase()}`}>
                    {getTypeIcon(tx.type)}
                    {getTypeLabel(tx.type)}
                  </span>
                </td>
                <td className="admin-description">{tx.description}</td>
                <td>
                  <span className={`admin-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                </td>
                <td>{getStatusBadge(tx.status)}</td>
                <td>{tx.method || '-'}</td>
                <td className="admin-date-cell">{formatDate(tx.createdAt)}</td>
                <td>
                  <button
                    className="admin-action-btn view"
                    onClick={() => handleViewDetail(tx)}
                    title="Xem chi tiết"
                  >
                    <Eye size={16} />
                  </button>
                  {(() => {
                    const isWalletCash = tx.id.startsWith('WAL-') && tx.originalData?.currencyType === 'CASH';
                    const isPayment = tx.type === 'PAYMENT' && tx.id.startsWith('PAY-');
                    return (isPayment || isWalletCash) && tx.status === 'COMPLETED';
                  })() && (
                    <button
                      className="admin-action-btn download"
                      onClick={() => handleDownloadInvoice(tx)}
                      title="Tải hóa đơn PDF"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && !loading && (
        <div className="admin-empty-state">
          <DollarSign size={64} />
          <h3>Không có giao dịch</h3>
          <p>Chưa có giao dịch nào phù hợp với bộ lọc</p>
        </div>
      )}

      {/* Pagination */}
      {filteredTransactions.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Trước
          </button>
          
          <div className="admin-pagination-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`admin-pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            className="admin-pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau →
          </button>

          <div className="admin-pagination-info">
            Trang {currentPage} / {totalPages} ({filteredTransactions.length} giao dịch)
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chi Tiết Giao Dịch</h3>
              <button className="admin-close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-detail-section">
                <h4>Thông Tin Giao Dịch</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <DollarSign size={18} />
                    <div>
                      <div className="label">Mã giao dịch</div>
                      <div className="value code">{selectedTransaction.reference || selectedTransaction.id}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    {getTypeIcon(selectedTransaction.type)}
                    <div>
                      <div className="label">Loại giao dịch</div>
                      <div className="value">{getTypeLabel(selectedTransaction.type)}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <TrendingUp size={18} />
                    <div>
                      <div className="label">Số tiền</div>
                      <div className={`value amount ${selectedTransaction.amount >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(selectedTransaction.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <Calendar size={18} />
                    <div>
                      <div className="label">Thời gian</div>
                      <div className="value">{formatDate(selectedTransaction.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4>Thông Tin Người Dùng</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <User size={18} />
                    <div>
                      <div className="label">Tên người dùng</div>
                      <div className="value">{selectedTransaction.userName || 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <User size={18} />
                    <div>
                      <div className="label">Email</div>
                      <div className="value">{selectedTransaction.userEmail || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4>Chi Tiết</h4>
                <div className="admin-detail-item full">
                  <div className="label">Mô tả</div>
                  <div className="value">{selectedTransaction.description}</div>
                </div>
                {selectedTransaction.method && (
                  <div className="admin-detail-item full">
                    <div className="label">Phương thức</div>
                    <div className="value">{selectedTransaction.method}</div>
                  </div>
                )}
                <div className="admin-detail-item full">
                  <div className="label">Trạng thái</div>
                  <div className="value">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-action-btn close" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
              <button className="admin-action-btn download">
                <Download size={16} />
                Xuất PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagementTabCosmic;
