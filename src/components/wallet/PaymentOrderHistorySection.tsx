import React, { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Crown,
  CreditCard,
  DollarSign,
  History,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { PaymentTransactionResponse } from "../../data/paymentDTOs";
import Pagination from "../shared/Pagination";

interface PaymentOrderHistorySectionProps {
  orders: PaymentTransactionResponse[];
  isLoading?: boolean;
  itemsPerPage?: number;
  sectionTitle?: string;
  formatDate: (value: string) => string;
  formatCurrency: (value: number) => string;
  getStatusBadge: (status: string) => JSX.Element;
  listClassName: string;
  itemClassName: string;
  txInfoClassName: string;
  txIconWrapperClassName: string;
  txDetailsClassName: string;
  txAmountClassName: string;
  sectionTitleClassName: string;
}

const getPaymentIcon = (type?: string) => {
  switch (type) {
    case "PREMIUM_SUBSCRIPTION":
      return <Crown className="tx-icon coin" />;
    case "COIN_PURCHASE":
      return <Coins className="tx-icon coin" />;
    case "COURSE_PURCHASE":
      return <ShoppingBag className="tx-icon spend" />;
    case "WALLET_TOPUP":
      return <DollarSign className="tx-icon deposit" />;
    case "REFUND":
      return <RefreshCw className="tx-icon refund" />;
    default:
      return <CreditCard className="tx-icon" />;
  }
};

const getPaymentTypeLabel = (type?: string) => {
  switch (type) {
    case "PREMIUM_SUBSCRIPTION":
      return "Mua gói Premium";
    case "COIN_PURCHASE":
      return "Mua SkillCoin";
    case "COURSE_PURCHASE":
      return "Mua khóa học";
    case "WALLET_TOPUP":
      return "Nạp tiền vào ví";
    case "REFUND":
      return "Hoàn tiền";
    default:
      return "Thanh toán";
  }
};

const PaymentOrderHistorySection: React.FC<PaymentOrderHistorySectionProps> = ({
  orders,
  isLoading = false,
  itemsPerPage = 6,
  sectionTitle = "Lịch sử đơn hàng thanh toán",
  formatDate,
  formatCurrency,
  getStatusBadge,
  listClassName,
  itemClassName,
  txInfoClassName,
  txIconWrapperClassName,
  txDetailsClassName,
  txAmountClassName,
  sectionTitleClassName,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, orders]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <div className="transactions-section" style={{ marginTop: "1.5rem" }}>
      <h2 className={sectionTitleClassName}>
        <History size={18} />
        {sectionTitle}
      </h2>
      <div className={listClassName}>
        {isLoading ? (
          <div className="empty-state">
            <Sparkles size={48} />
            <p>Đang tải lịch sử nạp tiền qua PayOS...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={48} />
            <p>Chưa có giao dịch nạp tiền qua PayOS nào</p>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const amount = Number(order.amount || 0);
            const isRefund = order.type === "REFUND";
            return (
              <div key={`payment-${order.id}`} className={itemClassName}>
                <div className={txInfoClassName}>
                  <div className={txIconWrapperClassName}>
                    {getPaymentIcon(order.type)}
                  </div>
                  <div className={txDetailsClassName}>
                    <h4>
                      {order.description || getPaymentTypeLabel(order.type)}
                    </h4>
                    <p>{formatDate(order.createdAt)}</p>
                    <p>Mã GD: {order.internalReference}</p>
                  </div>
                </div>
                <div className={txAmountClassName}>
                  <div
                    style={{
                      color: isRefund ? "#22c55e" : "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    {isRefund ? "+" : "-"}
                    {formatCurrency(Math.abs(amount))}
                  </div>
                  <div>{getPaymentTypeLabel(order.type)}</div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            );
          })
        )}
      </div>
      {!isLoading && orders.length > itemsPerPage && (
        <Pagination
          totalItems={orders.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default PaymentOrderHistorySection;
