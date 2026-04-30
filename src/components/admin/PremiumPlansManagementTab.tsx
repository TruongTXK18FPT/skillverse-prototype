import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Crown,
  Plus,
  Edit,
  Trash2,
  Power,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Gift,
  TrendingUp,
} from "lucide-react";
import * as adminPremiumService from "../../services/adminPremiumService";
import { AdminPremiumPlan } from "../../services/adminPremiumService";
import CreatePremiumPlanModal from "./CreatePremiumPlanModal";
import Toast from "../shared/Toast";
import { useToast } from "../../hooks/useToast";
import "./PremiumPlansManagementTab.css";

const PremiumPlansManagementTab: React.FC = () => {
  const [plans, setPlans] = useState<AdminPremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPremiumPlan | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AdminPremiumPlan | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [togglingPlanId, setTogglingPlanId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminPremiumPlan | null>(
    null,
  );
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } =
    useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  // Scroll lock for modals
  useEffect(() => {
    if (showCreateModal || showDetailModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCreateModal, showDetailModal]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminPremiumService.getAllPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách premium plans");
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    const nonFreePlans = plans.filter((p) => !p.isFreeTier);
    if (nonFreePlans.length >= 10) {
      showWarning(
        "Giới hạn",
        "Đã đạt giới hạn tối đa 10 gói premium. Vui lòng xóa một gói hiện có trước.",
      );
      return;
    }
    setEditingPlan(null);
    setShowCreateModal(true);
  };

  const handleEditPlan = (plan: AdminPremiumPlan) => {
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  const handleDeletePlan = async (plan: AdminPremiumPlan) => {
    if (plan.isFreeTier) {
      showWarning(
        "Không thể xóa",
        "Gói FREE_TIER là gói hệ thống, không thể xóa.",
      );
      return;
    }
    if (plan.currentSubscribers > 0) {
      showWarning(
        "Không thể xóa",
        `Gói có ${plan.currentSubscribers} người đăng ký đang hoạt động. Vui lòng đợi các đăng ký hết hạn.`,
      );
      return;
    }
    setConfirmDelete(plan);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const plan = confirmDelete;
    setConfirmDelete(null);
    setDeletingPlanId(plan.id);
    try {
      await adminPremiumService.deletePlan(plan.id);
      showSuccess(
        "Xóa thành công",
        `Đã xóa gói "${plan.displayName}" thành công!`,
      );
      await loadPlans();
    } catch (err: any) {
      showError(
        "Xóa thất bại",
        err.response?.data?.message ||
          err.message ||
          "Không thể xóa gói premium",
      );
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleToggleActive = async (plan: AdminPremiumPlan) => {
    if (plan.isFreeTier && plan.isActive) {
      showWarning("Không thể tắt", "Gói FREE_TIER phải luôn hoạt động.");
      return;
    }
    setTogglingPlanId(plan.id);
    try {
      await adminPremiumService.togglePlanActive(plan.id);
      showSuccess(
        "Cập nhật thành công",
        `Đã ${plan.isActive ? "tắt" : "bật"} gói "${plan.displayName}"!`,
      );
      await loadPlans();
    } catch (err: any) {
      showError(
        "Cập nhật thất bại",
        err.response?.data?.message ||
          err.message ||
          "Không thể thay đổi trạng thái",
      );
    } finally {
      setTogglingPlanId(null);
    }
  };

  const handleModalClose = (shouldRefresh?: boolean) => {
    setShowCreateModal(false);
    setEditingPlan(null);
    if (shouldRefresh) {
      loadPlans();
    }
  };

  const handleViewDetail = (plan: AdminPremiumPlan) => {
    setSelectedPlan(plan);
    setShowDetailModal(true);
  };

  const totalPages = Math.ceil(plans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlans = plans.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [plans]);

  if (loading) {
    return (
      <div className="admin-premium-management-cosmic">
        <div className="admin-loading-state">
          <RefreshCw size={48} className="spinning" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-premium-management-cosmic">
        <div className="admin-empty-state">
          <AlertCircle size={64} />
          <h3>Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button onClick={loadPlans} className="admin-action-btn save">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const nonFreePlans = plans.filter((p) => !p.isFreeTier);
  const canCreateMore = nonFreePlans.length < 10;

  return (
    <div className="admin-premium-management-cosmic">
      {/* Header */}
      <div className="admin-premium-header">
        <div>
          <h2>Quản Lý Gói Premium</h2>
          <p>Quản lý các gói đăng ký premium của hệ thống</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-refresh-btn"
            onClick={loadPlans}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "spinning" : ""} />
            Làm mới
          </button>
          <button
            onClick={handleCreatePlan}
            className={`admin-create-btn ${!canCreateMore ? "disabled" : ""}`}
            disabled={!canCreateMore}
            title={
              !canCreateMore
                ? "Đã đạt giới hạn 4 gói premium"
                : "Tạo gói premium mới"
            }
          >
            <Plus size={18} />
            Tạo Gói Mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-premium-stats admin-premium-stats-overview">
        <div className="admin-premium-stat-column admin-premium-stat-column-stacked">
          <div className="admin-stat-card total">
            <Crown size={32} />
            <div>
              <div className="admin-stat-number">{plans.length}</div>
              <div className="admin-stat-label">Tổng Gói</div>
            </div>
          </div>
          <div className="admin-stat-card active">
            <Zap size={32} />
            <div>
              <div className="admin-stat-number">
                {plans.filter((p) => p.isActive).length}/{plans.length}
              </div>
              <div className="admin-stat-label">Đang Hoạt Động</div>
            </div>
          </div>
        </div>
        <div className="admin-premium-stat-column">
          <div className="admin-stat-card subscribers">
            <Users size={32} />
            <div>
              <div className="admin-stat-number">
                {plans.reduce((sum, p) => sum + p.currentSubscribers, 0)}
              </div>
              <div className="admin-stat-label">Tổng Người Dùng</div>
            </div>
          </div>
        </div>
        <div className="admin-premium-stat-column">
          <div className="admin-stat-card revenue">
            <TrendingUp size={32} />
            <div>
              <div className="admin-stat-number">
                {adminPremiumService.formatPrice(
                  plans.reduce((sum, p) => sum + p.totalRevenue, 0),
                )}
              </div>
              <div className="admin-stat-label">Doanh Thu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="admin-plans-table">
        <table>
          <thead>
            <tr>
              <th>Gói</th>
              <th>Loại</th>
              <th>Giá / Sinh Viên</th>
              <th>Thời Hạn</th>
              <th>Người Dùng</th>
              <th>Doanh Thu</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {currentPlans.map((plan) => (
              <tr key={plan.id} className={plan.isFreeTier ? "free-tier" : ""}>
                <td>
                  <div className="admin-plan-name">
                    {plan.isFreeTier && <Crown size={16} />}
                    <div>
                      <div className="name">{plan.displayName}</div>
                      <div className="code">{plan.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`admin-plan-type-badge ${plan.planType.toLowerCase()}`}
                  >
                    {adminPremiumService.getPlanTypeDisplayName(plan.planType)}
                  </span>
                </td>
                <td>
                  <div className="admin-price-info">
                    <span className="main">
                      {adminPremiumService.formatPrice(plan.price)}
                    </span>
                    {(plan.discountPercent ?? plan.studentDiscountPercent) > 0 && (
                      <span className="student">
                        {adminPremiumService.formatPrice(
                          plan.discountedPrice ?? plan.studentPrice,
                        )}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="admin-duration">
                    <Calendar size={14} />
                    {plan.durationMonths === 2147483647
                      ? "Vĩnh viễn"
                      : `${plan.durationMonths} tháng`}
                  </div>
                </td>
                <td>
                  <div className="admin-subscribers">
                    <Users size={14} />
                    {plan.currentSubscribers}
                  </div>
                </td>
                <td>
                  <span className="admin-revenue">
                    {adminPremiumService.formatPrice(plan.totalRevenue)}
                  </span>
                </td>
                <td>
                  <span
                    className={`admin-status-badge ${plan.isActive ? "active" : "inactive"}`}
                  >
                    {plan.isActive ? "Hoạt động" : "Tạm dừng"}
                  </span>
                </td>
                <td>
                  <div className="admin-action-buttons">
                    <button
                      className="admin-action-btn view"
                      onClick={() => handleViewDetail(plan)}
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="admin-action-btn edit"
                      onClick={() => handleEditPlan(plan)}
                      title={
                        plan.isFreeTier
                          ? "Chỉnh sửa giới hạn tính năng"
                          : "Chỉnh sửa"
                      }
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={`admin-action-btn toggle ${plan.isActive ? "active" : "inactive"}`}
                      onClick={() => handleToggleActive(plan)}
                      title={plan.isActive ? "Tắt" : "Bật"}
                      disabled={
                        (plan.isFreeTier && plan.isActive) ||
                        togglingPlanId === plan.id
                      }
                    >
                      {togglingPlanId === plan.id ? (
                        <RefreshCw size={16} className="spinning" />
                      ) : (
                        <Power size={16} />
                      )}
                    </button>
                    <button
                      className="admin-action-btn delete"
                      onClick={() => handleDeletePlan(plan)}
                      title="Xóa"
                      disabled={
                        plan.isFreeTier ||
                        plan.currentSubscribers > 0 ||
                        deletingPlanId === plan.id
                      }
                    >
                      {deletingPlanId === plan.id ? (
                        <RefreshCw size={16} className="spinning" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
            Trước
          </button>

          <div className="admin-pagination-info">
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <span className="admin-pagination-total">({plans.length} gói)</span>
          </div>

          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {plans.length === 0 && !loading && (
        <div className="admin-empty-state">
          <Gift size={64} />
          <h3>Chưa có gói premium</h3>
          <p>Tạo gói premium đầu tiên của bạn</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal &&
        selectedPlan &&
        ReactDOM.createPortal(
          <div
            className="admin-modal-overlay"
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className="admin-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h3>Chi Tiết Gói Premium</h3>
                <button
                  className="admin-close-btn"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="admin-modal-body">
                {/* Basic Info */}
                <div className="admin-detail-section">
                  <h4>Thông Tin Cơ Bản</h4>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-item">
                      <Crown size={18} />
                      <div>
                        <div className="label">Tên Gói</div>
                        <div className="value">{selectedPlan.displayName}</div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <Gift size={18} />
                      <div>
                        <div className="label">Loại</div>
                        <div className="value">
                          {adminPremiumService.getPlanTypeDisplayName(
                            selectedPlan.planType,
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <DollarSign size={18} />
                      <div>
                        <div className="label">Giá</div>
                        <div className="value">
                          {adminPremiumService.formatPrice(selectedPlan.price)}
                        </div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <Calendar size={18} />
                      <div>
                        <div className="label">Thời Hạn</div>
                        <div className="value">
                          {selectedPlan.durationMonths === 2147483647
                            ? "Vĩnh viễn"
                            : `${selectedPlan.durationMonths} tháng`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="admin-detail-section">
                  <h4>Thống Kê</h4>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-item">
                      <Users size={18} />
                      <div>
                        <div className="label">Người Dùng</div>
                        <div className="value">
                          {selectedPlan.currentSubscribers}
                        </div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <TrendingUp size={18} />
                      <div>
                        <div className="label">Doanh Thu</div>
                        <div className="value">
                          {adminPremiumService.formatPrice(
                            selectedPlan.totalRevenue,
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <Zap size={18} />
                      <div>
                        <div className="label">Trạng Thái</div>
                        <div className="value">
                          {selectedPlan.isActive ? "Hoạt động" : "Tạm dừng"}
                        </div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <Calendar size={18} />
                      <div>
                        <div className="label">Ngày Tạo</div>
                        <div className="value">
                          {new Date(selectedPlan.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedPlan.description && (
                  <div className="admin-detail-section">
                    <h4>Mô Tả</h4>
                    <p className="admin-detail-description">
                      {selectedPlan.description}
                    </p>
                  </div>
                )}

                {/* Features */}
                {selectedPlan.features && selectedPlan.features.length > 0 && (
                  <div className="admin-detail-section">
                    <h4>Tính Năng</h4>
                    <div className="admin-features-list">
                      {selectedPlan.features.map((feature, idx) => (
                        <div key={idx} className="admin-feature-item">
                          <Zap size={14} />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  className="admin-action-btn close"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreatePremiumPlanModal
          editingPlan={editingPlan}
          onClose={handleModalClose}
        />
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete &&
        ReactDOM.createPortal(
          <div
            className="admin-modal-overlay"
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="admin-detail-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "450px" }}
            >
              <div className="admin-modal-header">
                <h3>Xác Nhận Xóa</h3>
                <button
                  className="admin-close-btn"
                  onClick={() => setConfirmDelete(null)}
                >
                  <X size={24} />
                </button>
              </div>
              <div
                className="admin-modal-body"
                style={{ textAlign: "center", padding: "24px" }}
              >
                <Trash2
                  size={48}
                  style={{ color: "#ef4444", marginBottom: "16px" }}
                />
                <p
                  style={{
                    color: "#e2e8f0",
                    fontSize: "16px",
                    marginBottom: "8px",
                  }}
                >
                  Bạn có chắc muốn xóa gói
                </p>
                <p
                  style={{
                    color: "#f59e0b",
                    fontWeight: "bold",
                    fontSize: "18px",
                    marginBottom: "16px",
                  }}
                >
                  "{confirmDelete.displayName}"?
                </p>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div
                className="admin-modal-footer"
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                }}
              >
                <button
                  className="admin-action-btn close"
                  onClick={() => setConfirmDelete(null)}
                  style={{ padding: "10px 24px", borderRadius: "8px" }}
                >
                  Hủy
                </button>
                <button
                  className="admin-action-btn delete"
                  onClick={handleConfirmDelete}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    background: "#ef4444",
                    color: "#fff",
                  }}
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
        />
      )}
    </div>
  );
};

export default PremiumPlansManagementTab;



