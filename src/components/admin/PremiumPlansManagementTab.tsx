import React, { useState, useEffect } from 'react';
import { Crown, Plus, Edit, Trash2, Power, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import * as adminPremiumService from '../../services/adminPremiumService';
import { AdminPremiumPlan } from '../../services/adminPremiumService';
import CreatePremiumPlanModal from './CreatePremiumPlanModal';
import './PremiumPlansManagementTab.css';

const PremiumPlansManagementTab: React.FC = () => {
  const [plans, setPlans] = useState<AdminPremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPremiumPlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminPremiumService.getAllPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách premium plans');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    // Check if already have 4 non-free plans
    const nonFreePlans = plans.filter(p => !p.isFreeTier);
    if (nonFreePlans.length >= 4) {
      alert('⚠️ Đã đạt giới hạn tối đa 4 gói premium (không tính FREE_TIER). Vui lòng xóa một gói hiện có trước.');
      return;
    }
    setEditingPlan(null);
    setShowCreateModal(true);
  };

  const handleEditPlan = (plan: AdminPremiumPlan) => {
    // Allow editing FREE_TIER but only for feature limits
    // The modal will handle the restriction on core properties
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  const handleDeletePlan = async (plan: AdminPremiumPlan) => {
    if (plan.isFreeTier) {
      alert('⚠️ Không thể xóa gói FREE_TIER. Đây là gói hệ thống.');
      return;
    }

    if (plan.currentSubscribers > 0) {
      alert(`⚠️ Không thể xóa gói có ${plan.currentSubscribers} người đăng ký đang hoạt động. Vui lòng đợi các đăng ký hết hạn.`);
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa gói "${plan.displayName}"?`)) {
      return;
    }

    try {
      await adminPremiumService.deletePlan(plan.id);
      alert('✅ Đã xóa gói premium thành công!');
      loadPlans();
    } catch (err: any) {
      alert(`❌ Lỗi: ${err.message || 'Không thể xóa gói premium'}`);
    }
  };

  const handleToggleActive = async (plan: AdminPremiumPlan) => {
    if (plan.isFreeTier && plan.isActive) {
      alert('⚠️ Không thể tắt gói FREE_TIER. Gói này phải luôn hoạt động.');
      return;
    }

    try {
      await adminPremiumService.togglePlanActive(plan.id);
      alert(`✅ Đã ${plan.isActive ? 'tắt' : 'bật'} gói "${plan.displayName}"!`);
      loadPlans();
    } catch (err: any) {
      alert(`❌ Lỗi: ${err.message || 'Không thể thay đổi trạng thái'}`);
    }
  };

  const handleModalClose = (shouldRefresh?: boolean) => {
    setShowCreateModal(false);
    setEditingPlan(null);
    if (shouldRefresh) {
      loadPlans();
    }
  };

  if (loading) {
    return (
      <div className="premium-plans-tab">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách premium plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-plans-tab">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button onClick={loadPlans} className="btn-retry">Thử lại</button>
        </div>
      </div>
    );
  }

  const nonFreePlans = plans.filter(p => !p.isFreeTier);
  const canCreateMore = nonFreePlans.length < 4;

  return (
    <div className="premium-plans-tab">
      {/* Header */}
      <div className="tab-header">
        <div className="header-left">
          <Crown size={32} className="header-icon" />
          <div>
            <h2>Quản Lý Gói Premium</h2>
            <p>Quản lý các gói đăng ký premium của hệ thống ({nonFreePlans.length}/4 gói)</p>
          </div>
        </div>
        <button
          onClick={handleCreatePlan}
          className={`btn-create ${!canCreateMore ? 'disabled' : ''}`}
          disabled={!canCreateMore}
          title={!canCreateMore ? 'Đã đạt giới hạn 4 gói premium' : 'Tạo gói premium mới'}
        >
          <Plus size={20} />
          Tạo Gói Mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="premium-plans-stats-grid">
        <div className="premium-plans-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Crown size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{plans.length}</div>
            <div className="stat-label">Tổng Gói</div>
          </div>
        </div>
        <div className="premium-plans-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {plans.reduce((sum, p) => sum + p.currentSubscribers, 0)}
            </div>
            <div className="stat-label">Tổng Người Dùng</div>
          </div>
        </div>
        <div className="premium-plans-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {adminPremiumService.formatPrice(
                plans.reduce((sum, p) => sum + p.totalRevenue, 0)
              )}
            </div>
            <div className="stat-label">Tổng Doanh Thu</div>
          </div>
        </div>
        <div className="premium-plans-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Power size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {plans.filter(p => p.isActive).length}/{plans.length}
            </div>
            <div className="stat-label">Gói Đang Hoạt Động</div>
          </div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="plans-table-container">
        <table className="plans-table">
          <thead>
            <tr>
              <th>Gói</th>
              <th>Loại</th>
              <th>Giá</th>
              <th>Thời Hạn</th>
              <th>Người Dùng</th>
              <th>Doanh Thu</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className={plan.isFreeTier ? 'free-tier-row' : ''}>
                <td>
                  <div className="plan-name-cell">
                    {plan.isFreeTier && <Crown size={16} className="free-tier-icon" />}
                    <div>
                      <div className="plan-display-name">{plan.displayName}</div>
                      <div className="plan-name-code">{plan.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`plan-type-badge ${plan.planType.toLowerCase()}`}>
                    {adminPremiumService.getPlanTypeDisplayName(plan.planType)}
                  </span>
                </td>
                <td>
                  <div className="price-cell">
                    <div className="price-main">{adminPremiumService.formatPrice(plan.price)}</div>
                    {plan.studentDiscountPercent > 0 && (
                      <div className="price-student">
                        SV: {adminPremiumService.formatPrice(plan.studentPrice)}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="duration-cell">
                    <Calendar size={14} />
                    {plan.durationMonths === 2147483647 ? 'Vĩnh viễn' : `${plan.durationMonths} tháng`}
                  </div>
                </td>
                <td>
                  <div className="subscribers-cell">
                    <Users size={14} />
                    {plan.currentSubscribers}
                    {plan.maxSubscribers && ` / ${plan.maxSubscribers}`}
                  </div>
                </td>
                <td>
                  <div className="revenue-cell">
                    {adminPremiumService.formatPrice(plan.totalRevenue)}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${plan.isActive ? 'active' : 'inactive'}`}>
                    {plan.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="btn-action btn-edit"
                      title={plan.isFreeTier ? "Chỉnh sửa giới hạn tính năng" : "Chỉnh sửa"}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`btn-action btn-toggle ${plan.isActive ? 'active' : 'inactive'}`}
                      title={plan.isActive ? 'Tắt' : 'Bật'}
                      disabled={plan.isFreeTier && plan.isActive}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="btn-action btn-delete"
                      title="Xóa"
                      disabled={plan.isFreeTier || plan.currentSubscribers > 0}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <AlertCircle size={20} />
        <div>
          <strong>Lưu ý:</strong>
          <ul>
            <li>Tối đa 4 gói premium (không tính FREE_TIER)</li>
            <li>Gói FREE_TIER: Chỉ có thể chỉnh sửa giới hạn tính năng, không thể xóa hoặc tắt</li>
            <li>Không thể xóa gói đang có người dùng đăng ký</li>
            <li>Giá và thời hạn có thể thay đổi cho các đăng ký mới</li>
          </ul>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreatePremiumPlanModal
          editingPlan={editingPlan}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default PremiumPlansManagementTab;
