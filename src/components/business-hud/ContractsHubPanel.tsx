import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSignature,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  FileText,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { ContractListResponse, ContractStatus, CONTRACT_STATUS_DISPLAY } from "../../types/contract";
import contractService from "../../services/contractService";
import { useToast } from "../../hooks/useToast";
import Pagination from "../shared/Pagination";
import "./ContractsHubPanel.css";

interface ContractsHubPanelProps {
  contracts: ContractListResponse[];
  onRefresh: () => void;
}

type StatusFilter = "ALL" | ContractStatus;
type TypeFilter = "ALL" | "FULL_TIME" | "PROBATION" | "PART_TIME";

const ITEMS_PER_PAGE = 8;

// ==================== HELPERS ====================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateStr?: string) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    FULL_TIME: "Toàn thời gian",
    PROBATION: "Thử việc",
    PART_TIME: "Thời vụ",
  };
  return map[type] || type;
};

// ==================== COMPONENT ====================

const ContractsHubPanel: React.FC<ContractsHubPanelProps> = ({
  contracts,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  // Filter & search state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // ==================== COMPUTED STATS ====================
  const stats = useMemo(() => {
    const ctTotal = contracts.length;
    const ctDraft = contracts.filter((c) => c.status === ContractStatus.DRAFT).length;
    const ctPending = contracts.filter((c) =>
      [ContractStatus.PENDING_SIGNER, ContractStatus.PENDING_EMPLOYER].includes(c.status as ContractStatus),
    ).length;
    const ctSigned = contracts.filter((c) => c.status === ContractStatus.SIGNED).length;
    const ctRejected = contracts.filter((c) => c.status === ContractStatus.REJECTED).length;
    const ctCancelled = contracts.filter((c) => c.status === ContractStatus.CANCELLED).length;
    const ctTotalValue = contracts.reduce((sum, c) => sum + (c.salary || 0), 0);
    const ctAvgSalary = ctTotal > 0 ? Math.round(ctTotalValue / ctTotal) : 0;
    return { ctTotal, ctDraft, ctPending, ctSigned, ctRejected, ctCancelled, ctTotalValue, ctAvgSalary };
  }, [contracts]);

  // ==================== DONUT DATA ====================
  const donutSegments = useMemo(() => {
    const segments = [];
    if (stats.ctDraft > 0) segments.push({ value: stats.ctDraft, color: "#94a3b8", label: "Nháp" });
    if (stats.ctPending > 0) segments.push({ value: stats.ctPending, color: "#fbbf24", label: "Chờ ký" });
    if (stats.ctSigned > 0) segments.push({ value: stats.ctSigned, color: "#34d399", label: "Đã ký" });
    if (stats.ctRejected > 0) segments.push({ value: stats.ctRejected, color: "#fb7185", label: "Từ chối" });
    if (stats.ctCancelled > 0) segments.push({ value: stats.ctCancelled, color: "#64748b", label: "Hủy" });
    return segments;
  }, [stats]);

  // ==================== FILTERED LIST ====================
  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && c.contractType !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          c.contractNumber?.toLowerCase().includes(q) ||
          c.candidateName?.toLowerCase().includes(q) ||
          c.jobTitle?.toLowerCase().includes(q) ||
          c.employerName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contracts, statusFilter, typeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pagedContracts = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage],
  );

  // Reset page on filter change
  const handleStatusFilter = (val: StatusFilter) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };
  const handleTypeFilter = (val: TypeFilter) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };
  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      showSuccess("Đã làm mới", "Dữ liệu hợp đồng đã được cập nhật.");
    } catch {
      showError("Lỗi làm mới", "Không thể làm mới dữ liệu.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewContract = (contract: ContractListResponse) => {
    navigate(`/business/contracts/${contract.id}`);
  };

  // ==================== DONUT CHART ====================
  const DonutChart: React.FC<{
    segments: { value: number; color: string; label: string }[];
    centerValue: number;
    centerLabel: string;
  }> = ({ segments, centerValue, centerLabel }) => {
    const size = 130;
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;
    const total = segments.reduce((s, seg) => s + seg.value, 0);

    return (
      <div className="chp-donut-wrap">
        <svg viewBox="0 0 110 110" className="chp-donut-svg">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="13" />
          {total > 0 && segments.map((seg, i) => {
            const pct = seg.value / total;
            const dashLen = pct * circumference;
            const dashGap = circumference - dashLen;
            const offset = currentOffset;
            currentOffset += dashLen;
            return (
              <circle
                key={i} cx="55" cy="55" r={radius} fill="none"
                stroke={seg.color} strokeWidth="13"
                strokeDasharray={`${dashLen} ${dashGap}`}
                strokeDashoffset={-offset} strokeLinecap="round"
                className="chp-donut-seg"
              />
            );
          })}
        </svg>
        <div className="chp-donut-center">
          <span className="chp-donut-value">{centerValue}</span>
          <span className="chp-donut-label">{centerLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="chp-panel">
      {/* ==================== HEADER ==================== */}
      <div className="chp-header">
        <div>
          <h2 className="chp-header__title">
            <FileSignature size={22} />
            Quản Lý Hợp Đồng
          </h2>
          <p className="chp-header__desc">
            {stats.ctSigned} đã ký · {stats.ctPending} đang chờ · tổng {stats.ctTotal} hợp đồng
          </p>
        </div>
        <button
          className="chp-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={15} className={refreshing ? "chp-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* ==================== STAT CARDS ==================== */}
      <div className="chp-stat-cards">
        <div className="chp-stat-card chp-stat-card--total">
          <FileText size={20} />
          <div>
            <strong>{stats.ctTotal}</strong>
            <span>Tổng hợp đồng</span>
          </div>
        </div>
        <div className="chp-stat-card chp-stat-card--draft">
          <FileText size={20} />
          <div>
            <strong>{stats.ctDraft}</strong>
            <span>Bản nháp</span>
          </div>
        </div>
        <div className="chp-stat-card chp-stat-card--pending">
          <TrendingUp size={20} />
          <div>
            <strong>{stats.ctPending}</strong>
            <span>Đang chờ ký</span>
          </div>
        </div>
        <div className="chp-stat-card chp-stat-card--signed">
          <FileSignature size={20} />
          <div>
            <strong>{stats.ctSigned}</strong>
            <span>Đã ký</span>
          </div>
        </div>
        <div className="chp-stat-card chp-stat-card--rejected">
          <XCircle size={20} />
          <div>
            <strong>{stats.ctRejected}</strong>
            <span>Từ chối / Hủy</span>
          </div>
        </div>
        <div className="chp-stat-card chp-stat-card--value">
          <TrendingUp size={20} />
          <div>
            <strong>{formatCurrency(stats.ctTotalValue)}</strong>
            <span>Tổng giá trị</span>
          </div>
        </div>
      </div>

      {/* ==================== CHART + LEGEND ROW ==================== */}
      <div className="chp-overview-row">
        {/* Donut chart */}
        <div className="chp-chart-card">
          <h3 className="chp-chart-card__title">
            <TrendingUp size={16} /> Phân Bổ Trạng Thái
          </h3>
          <div className="chp-chart-card__body">
            <DonutChart
              segments={donutSegments}
              centerValue={stats.ctTotal}
              centerLabel="Tổng"
            />
            <div className="chp-chart-legend">
              {donutSegments.map((seg, i) => (
                <div key={i} className="chp-legend-item">
                  <span className="chp-legend-dot" style={{ background: seg.color }} />
                  <span className="chp-legend-label">{seg.label}</span>
                  <span className="chp-legend-value">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avg salary card */}
        <div className="chp-chart-card chp-chart-card--narrow">
          <h3 className="chp-chart-card__title">
            <TrendingUp size={16} /> Lương Trung Bình
          </h3>
          <div className="chp-avg-salary">
            <span className="chp-avg-salary__value">{formatCurrency(stats.ctAvgSalary)}</span>
            <span className="chp-avg-salary__label">/ tháng</span>
          </div>
        </div>
      </div>

      {/* ==================== FILTER BAR ==================== */}
      <div className="chp-filter-bar">
        <div className="chp-search">
          <Search size={15} className="chp-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã số, tên ứng viên, công việc..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="chp-search-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value as StatusFilter)}
          className="chp-select"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value={ContractStatus.DRAFT}>Bản nháp</option>
          <option value={ContractStatus.PENDING_SIGNER}>Chờ ứng viên ký</option>
          <option value={ContractStatus.PENDING_EMPLOYER}>Chờ NTD ký</option>
          <option value={ContractStatus.SIGNED}>Đã ký</option>
          <option value={ContractStatus.REJECTED}>Bị từ chối</option>
          <option value={ContractStatus.CANCELLED}>Đã hủy</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => handleTypeFilter(e.target.value as TypeFilter)}
          className="chp-select"
        >
          <option value="ALL">Tất cả loại</option>
          <option value="FULL_TIME">Toàn thời gian</option>
          <option value="PROBATION">Thử việc</option>
          <option value="PART_TIME">Thời vụ</option>
        </select>
      </div>

      {/* ==================== RESULT INFO BAR ==================== */}
      <div className="chp-result-bar">
        <span>
          Hiển thị{" "}
          <strong>
            {pagedContracts.length > 0
              ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}`
              : "0"}
          </strong>{" "}
          trong <strong>{filtered.length}</strong> hợp đồng
        </span>
        {(searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL") && (
          <button
            className="chp-clear-btn"
            onClick={() => {
              handleSearch("");
              handleStatusFilter("ALL");
              handleTypeFilter("ALL");
            }}
          >
            <XCircle size={13} /> Xóa lọc
          </button>
        )}
      </div>

      {/* ==================== CONTRACT LIST ==================== */}
      {filtered.length === 0 ? (
        <div className="chp-empty">
          <FileText size={42} />
          <h4>Không tìm thấy hợp đồng</h4>
          <p>
            {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "Không có hợp đồng phù hợp với bộ lọc. Thử thay đổi điều kiện tìm kiếm."
              : "Chưa có hợp đồng nào được tạo. Hợp đồng sẽ xuất hiện ở đây khi bạn ký với ứng viên."}
          </p>
        </div>
      ) : (
        <div className="chp-contract-list">
          {pagedContracts.map((contract) => {
            const statusInfo =
              CONTRACT_STATUS_DISPLAY[contract.status as ContractStatus] || {
                text: contract.status,
                color: "gray",
              };
            const statusColorMap: Record<string, string> = {
              green: "#34d399",
              blue: "#38bdf8",
              orange: "#fbbf24",
              red: "#fb7185",
              gray: "#94a3b8",
            };
            const dotColor = statusColorMap[statusInfo.color.replace("text-", "")] || "#94a3b8";

            return (
              <div key={contract.id} className="chp-contract-card">
                {/* Top row */}
                <div className="chp-contract-card__top">
                  <div className="chp-contract-card__meta">
                    <span className="chp-contract-card__number">
                      {contract.contractNumber || `#${contract.id}`}
                    </span>
                    <span className="chp-contract-card__type">
                      {getTypeLabel(contract.contractType)}
                    </span>
                  </div>
                  <div
                    className="chp-contract-card__status"
                    style={{
                      backgroundColor: `${dotColor}18`,
                      color: dotColor,
                      borderColor: `${dotColor}44`,
                    }}
                  >
                    <span
                      className="chp-contract-card__status-dot"
                      style={{ backgroundColor: dotColor }}
                    />
                    {statusInfo.text}
                  </div>
                </div>

                {/* Candidate name */}
                <div className="chp-contract-card__candidate">
                  <strong>{contract.candidateName || "—"}</strong>
                  {contract.candidateEmail && (
                    <span>{contract.candidateEmail}</span>
                  )}
                </div>

                {/* Job title */}
                <div className="chp-contract-card__job">
                  <FileText size={13} />
                  <span>{contract.jobTitle || "—"}</span>
                </div>

                {/* Bottom row */}
                <div className="chp-contract-card__footer">
                  <div className="chp-contract-card__info">
                    <span className="chp-contract-card__salary">
                      {formatCurrency(contract.salary)}<small>/tháng</small>
                    </span>
                    <span className="chp-contract-card__date">
                      Tạo: {formatDate(contract.createdAt)}
                    </span>
                  </div>
                  <button
                    className="chp-contract-card__action"
                    onClick={() => handleViewContract(contract)}
                    title="Xem chi tiết"
                  >
                    <Eye size={14} />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== PAGINATION ==================== */}
      {totalPages > 1 && (
        <div className="chp-pagination-wrap">
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default ContractsHubPanel;