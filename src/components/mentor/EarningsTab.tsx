import React, { useMemo, useState, useEffect } from "react";
import { Download } from "lucide-react";
import walletService from "../../services/walletService";
import { WalletTransactionResponse } from "../../data/walletDTOs";
import { useToast } from "../../hooks/useToast";
import { useScrollToListTopOnPagination } from "../../hooks/useScrollToListTopOnPagination";
import "./EarningsTab.css";

const EarningsTab: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<WalletTransactionResponse[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "THIS_MONTH" | "LAST_7_DAYS">(
    "ALL",
  );
  const { withPaginationScroll } = useScrollToListTopOnPagination();

  const pageSize = 20;

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      let page = 0;
      let total = 1;
      const merged: WalletTransactionResponse[] = [];

      do {
        const transactionsData = await walletService.getTransactions(page, 100);
        merged.push(...(transactionsData.content || []));
        total = transactionsData.totalPages || 1;
        page += 1;
      } while (page < total);

      setAllTransactions(merged);
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
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const from7Days = new Date(now);
    from7Days.setDate(now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const normalizeText = (text?: string | null) => (text || "").toLowerCase();
    const normalizeType = (type?: string | null) => (type || "").toUpperCase();

    const matchesTypeFilter = (transactionType?: string | null) => {
      if (typeFilter === "ALL") return true;

      const normalizedType = normalizeType(transactionType);

      switch (typeFilter) {
        case "MENTOR_INCOME":
          return [
            "MENTOR_BOOKING",
            "EARN_FROM_SESSION",
            "SEMINAR_PAYOUT",
          ].some((type) => normalizedType.includes(type));
        case "COURSE_INCOME":
          return ["EARN_FROM_COURSE", "COURSE_PAYOUT"].some((type) =>
            normalizedType.includes(type),
          );
        case "DEPOSIT":
          return normalizedType.includes("DEPOSIT");
        case "WITHDRAWAL":
          return normalizedType.includes("WITHDRAW");
        case "ADMIN_ADJUSTMENT":
          return normalizedType.includes("ADMIN_ADJUSTMENT");
        default:
          // Backward-compatible fallback if a legacy exact type value is selected.
          return normalizedType === typeFilter.toUpperCase();
      }
    };

    return allTransactions.filter((transaction) => {
      const matchesSearch =
        normalizeText(transaction.description).includes(searchTerm.toLowerCase()) ||
        normalizeText(transaction.transactionTypeName).includes(searchTerm.toLowerCase()) ||
        normalizeText(transaction.notes).includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || transaction.status === statusFilter;

      const matchesType = matchesTypeFilter(transaction.transactionType);

      const createdAt = new Date(transaction.createdAt);
      let matchesPeriod = true;
      if (periodFilter === "THIS_MONTH") {
        matchesPeriod = createdAt >= monthStart;
      } else if (periodFilter === "LAST_7_DAYS") {
        matchesPeriod = createdAt >= from7Days;
      }

      return matchesSearch && matchesStatus && matchesType && matchesPeriod;
    });
  }, [allTransactions, searchTerm, statusFilter, typeFilter, periodFilter]);

  const overviewStats = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        const amount = Math.max(0, tx.cashAmount || 0);
        if (tx.isCredit) {
          acc.totalInflow += amount;
        } else {
          acc.totalOutflow += amount;
        }

        const normalizedStatus = (tx.status || "").toUpperCase();
        if (normalizedStatus === "COMPLETED") acc.completed += 1;
        if (normalizedStatus === "PENDING" || normalizedStatus === "PROCESSING") {
          acc.processing += 1;
        }
        if (normalizedStatus === "FAILED") acc.failed += 1;

        return acc;
      },
      {
        totalInflow: 0,
        totalOutflow: 0,
        completed: 0,
        processing: 0,
        failed: 0,
      },
    );
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const now = new Date();
    const labels = Array.from({ length: 7 }, (_, offset) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - offset));
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        label: d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        value: 0,
      };
    });

    const map = new Map(labels.map((item) => [item.key, item]));

    filteredTransactions.forEach((tx) => {
      if (!tx.isCredit) return;
      const date = new Date(tx.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      const target = map.get(key);
      if (target) {
        target.value += Math.max(0, tx.cashAmount || 0);
      }
    });

    const maxValue = Math.max(...labels.map((item) => item.value), 1);
    return {
      points: labels,
      maxValue,
    };
  }, [filteredTransactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = filteredTransactions.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter, typeFilter, periodFilter]);

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

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
        <h2>Lịch Sử Giao Dịch</h2>
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
          Làm Mới Dữ Liệu
        </button>
      </div>

      <div className="mentor-earnings-overview-cards">
        <div className="mentor-earnings-overview-card">
          <span className="mentor-earnings-overview-label">Tổng thu vào</span>
          <strong className="mentor-earnings-overview-value is-credit">
            {formatCurrency(overviewStats.totalInflow)}
          </strong>
        </div>
        <div className="mentor-earnings-overview-card">
          <span className="mentor-earnings-overview-label">Tổng chi ra</span>
          <strong className="mentor-earnings-overview-value is-debit">
            {formatCurrency(overviewStats.totalOutflow)}
          </strong>
        </div>
        <div className="mentor-earnings-overview-card">
          <span className="mentor-earnings-overview-label">Số dư biến động</span>
          <strong className="mentor-earnings-overview-value">
            {formatCurrency(overviewStats.totalInflow - overviewStats.totalOutflow)}
          </strong>
        </div>
        <div className="mentor-earnings-overview-card">
          <span className="mentor-earnings-overview-label">Trạng thái</span>
          <strong className="mentor-earnings-overview-value">
            {overviewStats.completed} HT · {overviewStats.processing} XL · {overviewStats.failed} TB
          </strong>
        </div>
      </div>

      <div className="mentor-earnings-mini-chart">
        <div className="mentor-earnings-mini-chart__header">
          <h4>Xu hướng thu nhập 7 ngày gần nhất</h4>
        </div>
        <div className="mentor-earnings-mini-chart__bars">
          {chartData.points.map((point) => (
            <div key={point.key} className="mentor-earnings-mini-chart__bar-item">
              <div
                className="mentor-earnings-mini-chart__bar"
                style={{
                  height: `${Math.max(8, (point.value / chartData.maxValue) * 100)}%`,
                }}
                title={`${point.label}: ${formatCurrency(point.value)}`}
              />
              <span className="mentor-earnings-mini-chart__label">{point.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mentor-earnings-filters">
        <input
          type="text"
          className="mentor-earnings-filter-input"
          placeholder="Tìm theo mô tả, loại giao dịch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="mentor-earnings-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">Tất cả loại</option>
          <option value="MENTOR_INCOME">Thu nhập từ buổi học</option>
          <option value="COURSE_INCOME">Thu nhập từ khóa học</option>
          <option value="DEPOSIT">Nạp tiền</option>
          <option value="WITHDRAWAL">Rút tiền</option>
          <option value="ADMIN_ADJUSTMENT">Điều chỉnh bởi Admin</option>
        </select>

        <select
          className="mentor-earnings-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="PENDING">Đang xử lý</option>
          <option value="PROCESSING">Đang xử lý hệ thống</option>
          <option value="FAILED">Thất bại</option>
        </select>

        <select
          className="mentor-earnings-filter-select"
          value={periodFilter}
          onChange={(e) =>
            setPeriodFilter(e.target.value as "ALL" | "THIS_MONTH" | "LAST_7_DAYS")
          }
        >
          <option value="ALL">Toàn bộ thời gian</option>
          <option value="THIS_MONTH">Tháng này</option>
          <option value="LAST_7_DAYS">7 ngày qua</option>
        </select>
      </div>

      {/* Transaction History Table */}
      <div className="mentor-earnings-transactions-section">
        {paginatedTransactions.length === 0 ? (
          <div className="mentor-earnings-empty-state">
            <h4>Không có giao dịch phù hợp</h4>
            <p>
              Hãy thử đổi từ khóa tìm kiếm hoặc bộ lọc để xem thêm kết quả.
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
                {paginatedTransactions.map((transaction) => {
                  const statusInfo = getStatusBadge(transaction.status);
                  return (
                    <tr key={transaction.transactionId}>
                      <td>
                        <div className="mentor-earnings-transaction-type">
                          <span className="transaction-type-name">
                            {transaction.transactionTypeName || transaction.transactionType}
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
        {filteredTransactions.length > pageSize && (
          <div className="mentor-earnings-pagination">
            <button
              onClick={withPaginationScroll(() =>
                setCurrentPage(Math.max(0, currentPage - 1))
              )}
              disabled={currentPage === 0}
              className="pagination-btn"
            >
              ← Trước
            </button>
            <span className="pagination-info">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={withPaginationScroll(() =>
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
              )}
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
