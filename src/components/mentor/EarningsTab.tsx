import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import walletService from "../../services/walletService";
import { WalletTransactionResponse } from "../../data/walletDTOs";
import { useToast } from "../../hooks/useToast";
import "./EarningsTab.css";

const EarningsTab: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadEarningsData();
  }, [currentPage]);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      const transactionsData = await walletService.getTransactions(
        currentPage,
        20,
      );
      setTransactions(transactionsData.content);
      setTotalPages(transactionsData.totalPages);
    } catch (error) {
      console.error("Error loading earnings data:", error);
      showError("Lỗi", "Không thể tải dữ liệu giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      COMPLETED: {
        label: "Hoàn thành",
        className: "mentor-earnings-status-completed",
      },
      PENDING: {
        label: "Đang xử lý",
        className: "mentor-earnings-status-progress",
      },
      FAILED: { label: "Thất bại", className: "mentor-earnings-status-failed" },
      PROCESSING: {
        label: "Xử lý",
        className: "mentor-earnings-status-progress",
      },
    };
    return (
      statusMap[status] || {
        label: status,
        className: "mentor-earnings-status-progress",
      }
    );
  };

  const getTransactionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      DEPOSIT: "💰",
      WITHDRAWAL: "💸",
      EARN_FROM_SESSION: "📚",
      EARN_FROM_COURSE: "🎓",
      PURCHASE: "🛒",
      REFUND: "🔄",
      ADMIN_ADJUSTMENT: "⚙️",
    };
    return icons[type] || "💵";
  };

  const handleDownloadInvoice = async (transactionId: number) => {
    try {
      const blob =
        await walletService.downloadTransactionInvoice(transactionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess("Thành công", "Đã tải xuống hóa đơn");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      showError("Lỗi", "Không thể tải xuống hóa đơn");
    }
  };

  if (loading) {
    return (
      <div className="mentor-earnings-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải lịch sử giao dịch...</p>
      </div>
    );
  }

  return (
    <div className="mentor-earnings-tab">
      <div className="mentor-earnings-tab-header">
        <h2>💰 Lịch Sử Giao Dịch</h2>
        <p>
          Theo dõi tất cả các giao dịch nạp, rút và thu nhập từ hoạt động mentor
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mentor-earnings-action-section">
        <button
          className="mentor-earnings-action-btn mentor-earnings-history-btn"
          onClick={loadEarningsData}
        >
          🔄 Làm Mới Dữ Liệu
        </button>
      </div>

      {/* Transaction History Table */}
      <div className="mentor-earnings-transactions-section">
        {transactions.length === 0 ? (
          <div className="mentor-earnings-empty-state">
            <div className="mentor-earnings-empty-icon">💸</div>
            <h4>Chưa có giao dịch</h4>
            <p>
              Lịch sử giao dịch của bạn sẽ hiển thị ở đây khi bạn bắt đầu kiếm
              tiền từ các buổi học.
            </p>
          </div>
        ) : (
          <div className="mentor-earnings-transactions-table-container">
            <table className="mentor-earnings-transactions-table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Ngày</th>
                  <th>Mô tả</th>
                  <th>Số tiền</th>
                  <th>Số dư sau</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const statusInfo = getStatusBadge(transaction.status);
                  return (
                    <tr key={transaction.transactionId}>
                      <td>
                        <div className="mentor-earnings-transaction-type">
                          <span className="transaction-icon">
                            {getTransactionIcon(transaction.transactionType)}
                          </span>
                          <span className="transaction-type-name">
                            {transaction.transactionTypeName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="mentor-earnings-date">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="mentor-earnings-description">
                          {transaction.description}
                          {transaction.notes && (
                            <div className="transaction-notes">
                              {transaction.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className={`mentor-earnings-amount ${
                            transaction.isCredit ? "credit" : "debit"
                          }`}
                        >
                          {transaction.isCredit ? "+" : "-"}
                          {formatCurrency(transaction.cashAmount)}
                        </div>
                      </td>
                      <td>
                        <div className="mentor-earnings-balance">
                          {formatCurrency(transaction.cashBalanceAfter)}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`mentor-earnings-status-badge ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <button
                          className="mentor-earnings-download-btn"
                          onClick={() =>
                            handleDownloadInvoice(transaction.transactionId)
                          }
                          title="Tải xuống hóa đơn"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mentor-earnings-pagination">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="pagination-btn"
            >
              ← Trước
            </button>
            <span className="pagination-info">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
              }
              disabled={currentPage === totalPages - 1}
              className="pagination-btn"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsTab;
