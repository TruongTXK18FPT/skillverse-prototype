import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  Loader2,
  Map,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import roadmapPackageService from "../../services/roadmapPackageService";
import type {
  RoadmapOfferingResponse,
  RoadmapPurchaseResponse,
  RoadmapPurchaseStatus,
} from "../../types/roadmapPackage";
import { useAppToast } from "../../context/ToastContext";
import "./RoadmapPackagesPage.css";

const statusLabel: Record<RoadmapPurchaseStatus, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  ACTIVE: "Đang học",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const statusIcon: Record<RoadmapPurchaseStatus, typeof CheckCircle2> = {
  PENDING_PAYMENT: Wallet,
  ACTIVE: BookOpenCheck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  REFUNDED: RefreshCw,
};

const formatCurrency = (value?: number | string | null, currency = "VND") => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const getApiErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const RoadmapPackagesPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useAppToast();
  const [offerings, setOfferings] = useState<RoadmapOfferingResponse[]>([]);
  const [purchases, setPurchases] = useState<RoadmapPurchaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [offeringList, purchaseData] = await Promise.all([
        roadmapPackageService.getActiveOfferings(),
        roadmapPackageService.getMyPurchases().catch(() => []),
      ]);
      const offeringData = await Promise.all(
        offeringList.map((offering) =>
          roadmapPackageService.getOffering(offering.id).catch(() => offering),
        ),
      );
      setOfferings(offeringData);
      setPurchases(purchaseData);
    } catch (error) {
      showError(
        "Không thể tải gói roadmap",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeOfferingIds = useMemo(
    () =>
      new Set(
        purchases
          .filter((purchase) =>
            ["PENDING_PAYMENT", "ACTIVE", "COMPLETED"].includes(
              purchase.status,
            ),
          )
          .map((purchase) => purchase.offeringId),
      ),
    [purchases],
  );

  const totalNodes = useMemo(
    () =>
      offerings.reduce(
        (sum, offering) => sum + (offering.template?.nodes?.length ?? 0),
        0,
      ),
    [offerings],
  );

  const handlePurchase = async (offering: RoadmapOfferingResponse) => {
    const confirmed = window.confirm(
      `Mua gói "${offering.title}" với giá ${formatCurrency(
        offering.price,
        offering.currency,
      )}? Số tiền sẽ được giữ trong ví cho gói mentoring này.`,
    );
    if (!confirmed) return;

    setActionId(offering.id);
    try {
      const purchase = await roadmapPackageService.purchase({
        offeringId: offering.id,
      });
      showSuccess(
        "Đã kích hoạt gói roadmap",
        "Roadmap, Journey và booking mentoring đã được tạo từ template.",
      );
      await loadData();
      if (purchase.roadmapSessionId) {
        navigate(`/roadmap/${purchase.roadmapSessionId}/workspace`);
      }
    } catch (error) {
      showError(
        "Mua gói thất bại",
        getApiErrorMessage(error, "Kiểm tra số dư ví hoặc thử lại sau."),
      );
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (purchase: RoadmapPurchaseResponse) => {
    const confirmed = window.confirm(
      `Hủy gói roadmap #${purchase.id}? Booking liên quan sẽ bị hủy nếu chưa hoàn thành.`,
    );
    if (!confirmed) return;

    setCancelId(purchase.id);
    try {
      await roadmapPackageService.cancelPurchase(purchase.id);
      showSuccess("Đã hủy gói", "Trạng thái gói đã được cập nhật.");
      await loadData();
    } catch (error) {
      showError(
        "Không thể hủy gói",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setCancelId(null);
    }
  };

  const openPurchaseTarget = (purchase: RoadmapPurchaseResponse) => {
    if (purchase.roadmapSessionId) {
      navigate(`/roadmap/${purchase.roadmapSessionId}/workspace`);
      return;
    }
    if (purchase.journeyId) {
      navigate(`/journey?selected=${purchase.journeyId}`);
      return;
    }
    if (purchase.bookingId) {
      navigate(`/bookings/${purchase.bookingId}`);
      return;
    }
    showInfo("Chưa có workspace", "Gói này chưa có roadmap workspace.");
  };

  const activePurchases = purchases.filter((item) =>
    ["PENDING_PAYMENT", "ACTIVE"].includes(item.status),
  );

  return (
    <div className="roadmap-package-page">
      <section className="rp-hero">
        <div className="rp-hero__copy">
          <div className="rp-eyebrow">
            <ShieldCheck size={18} />
            Gói roadmap có mentor đồng hành
          </div>
          <h1>Chọn lộ trình có mentor đồng hành</h1>
          <p>
            Gói đã được mentor thiết kế, admin duyệt và backend sẽ tự tạo
            roadmap session, journey, booking mentoring sau khi mua.
          </p>
        </div>
        <div className="rp-hero__metrics" aria-label="Chỉ số gói roadmap">
          <div>
            <strong>{offerings.length}</strong>
            <span>gói đang mở</span>
          </div>
          <div>
            <strong>{totalNodes}</strong>
            <span>mốc học tập</span>
          </div>
          <div>
            <strong>{activePurchases.length}</strong>
            <span>gói đang học</span>
          </div>
        </div>
      </section>

      <div className="rp-toolbar">
        <div>
          <h2>Chợ gói roadmap</h2>
          <p>Chỉ hiển thị gói đang bán từ backend.</p>
        </div>
        <button
          type="button"
          className="rp-icon-btn"
          onClick={() => void loadData()}
          disabled={loading}
          title="Tải lại"
        >
          {loading ? <Loader2 className="rp-spin" size={18} /> : <RefreshCw size={18} />}
        </button>
      </div>

      {loading ? (
        <div className="rp-loading">
          <Loader2 className="rp-spin" size={32} />
          <span>Đang tải gói roadmap...</span>
        </div>
      ) : (
        <div className="rp-layout">
          <section className="rp-offering-grid">
            {offerings.length === 0 ? (
              <div className="rp-empty">
                <AlertCircle size={28} />
                <h3>Chưa có gói đang bán</h3>
                <p>Quay lại sau khi mentor đăng bán gói mới.</p>
              </div>
            ) : (
              offerings.map((offering) => {
                const template = offering.template;
                const nodes = template?.nodes ?? [];
                const hours = nodes.reduce(
                  (sum, node) => sum + Number(node.estimatedHours ?? 0),
                  0,
                );
                const alreadyOwned = activeOfferingIds.has(offering.id);

                return (
                  <article className="rp-offering-card" key={offering.id}>
                    <div className="rp-card-topline">
                      <span className="rp-status rp-status--active">ĐANG BÁN</span>
                      <span className="rp-template-code">#{offering.id}</span>
                    </div>

                    <h3>{offering.title}</h3>
                    <p className="rp-card-desc">
                      {offering.description ||
                        template?.description ||
                        "Lộ trình có mentor đồng hành đang sẵn sàng kích hoạt."}
                    </p>

                    <div className="rp-price-row">
                      <strong>
                        {formatCurrency(offering.price, offering.currency)}
                      </strong>
                      <span>
                        {offering.maxStudents
                          ? `Tối đa ${offering.maxStudents} học viên`
                          : "Không giới hạn slot"}
                      </span>
                    </div>

                    <div className="rp-meta-grid">
                      <span>
                        <UserCheck size={15} />
                        {offering.mentorName || "Mentor"}
                      </span>
                      <span>
                        <Layers3 size={15} />
                        {nodes.length} node
                      </span>
                      <span>
                        <Clock3 size={15} />
                        {hours > 0 ? `${Math.round(hours)}h` : "Mentor thiết lập"}
                      </span>
                      <span>
                        <Map size={15} />
                        {template?.targetLevelSnapshot ||
                          template?.targetLevel ||
                          "Cấp độ tùy chỉnh"}
                      </span>
                    </div>

                    {nodes.length > 0 && (
                      <ol className="rp-node-preview">
                        {nodes.slice(0, 4).map((node) => (
                          <li key={node.id}>
                            <span>{node.orderIndex}</span>
                            <div>
                              <strong>{node.title}</strong>
                              <small>
                                {node.skillNameSnapshot ||
                                  node.requirementType ||
                                  "Mốc học tập"}
                              </small>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}

                    <button
                      type="button"
                      className="rp-primary-btn"
                      onClick={() => void handlePurchase(offering)}
                      disabled={actionId === offering.id || alreadyOwned}
                    >
                      {actionId === offering.id ? (
                        <Loader2 className="rp-spin" size={17} />
                      ) : alreadyOwned ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Wallet size={17} />
                      )}
                      <span>{alreadyOwned ? "Đã mua" : "Mua gói"}</span>
                    </button>
                  </article>
                );
              })
            )}
          </section>

          <aside className="rp-purchase-panel">
            <div className="rp-panel-header">
              <div>
                <h2>Gói của tôi</h2>
                <p>Theo dõi gói roadmap đã mua.</p>
              </div>
              <CalendarDays size={22} />
            </div>

            <div className="rp-purchase-list">
              {purchases.length === 0 ? (
                <div className="rp-empty rp-empty--compact">
                  <BookOpenCheck size={24} />
                  <h3>Chưa có gói</h3>
                  <p>Mua gói đầu tiên để tạo roadmap có mentor đồng hành.</p>
                </div>
              ) : (
                purchases.map((purchase) => {
                  const Icon = statusIcon[purchase.status] || AlertCircle;
                  return (
                    <article className="rp-purchase-item" key={purchase.id}>
                      <div className="rp-purchase-item__top">
                        <span className={`rp-status rp-status--${purchase.status.toLowerCase()}`}>
                          <Icon size={14} />
                          {statusLabel[purchase.status] || purchase.status}
                        </span>
                        <small>#{purchase.id}</small>
                      </div>
                      <h3>{purchase.offering?.title || "Gói roadmap"}</h3>
                      <p>
                        Mentor #{purchase.mentorId} -{" "}
                        {formatCurrency(purchase.price, purchase.currency)}
                      </p>
                      <div className="rp-purchase-meta">
                        <span>Booking: {purchase.bookingId || "-"}</span>
                        <span>Journey: {purchase.journeyId || "-"}</span>
                        <span>Ngày tạo: {formatDate(purchase.createdAt)}</span>
                      </div>
                      <div className="rp-purchase-actions">
                        <button
                          type="button"
                          className="rp-secondary-btn"
                          onClick={() => openPurchaseTarget(purchase)}
                        >
                          Mở workspace
                          <ArrowRight size={15} />
                        </button>
                        {purchase.status !== "COMPLETED" &&
                          purchase.status !== "CANCELLED" &&
                          purchase.status !== "REFUNDED" && (
                            <button
                              type="button"
                              className="rp-danger-btn"
                              onClick={() => void handleCancel(purchase)}
                              disabled={cancelId === purchase.id}
                            >
                              {cancelId === purchase.id ? (
                                <Loader2 className="rp-spin" size={15} />
                              ) : (
                                <XCircle size={15} />
                              )}
                              Hủy
                            </button>
                          )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default RoadmapPackagesPage;
