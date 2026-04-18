import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Gavel,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import ConfirmDialog from "../shared/ConfirmDialog";
import {
  DisputeResponse,
  DisputeResolution,
  ResolveDisputeRequest,
} from "../../data/adminDTOs";
import adminService from "../../services/adminService";
import { Dispute, JobStatusAuditLog } from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import {
  formatDate,
  formatDateTime,
  getDisputeStatusLabel,
  getDisputeStatusTone,
  getDisputeTypeLabel,
  getResolutionLabel,
  StatusTone,
} from "./jobManagementCommon";

interface JobDisputesViewProps {
  onDataChanged?: () => void;
}

type DisputeStatusFilter =
  | "ALL"
  | "OPEN"
  | "UNDER_INVESTIGATION"
  | "AWAITING_RESPONSE"
  | "RESOLVED"
  | "DISMISSED"
  | "ESCALATED";

type ResolutionOption = {
  value: DisputeResolution;
  label: string;
  hint: string;
};

const ITEMS_PER_PAGE = 8;

const DISPUTE_STATUS_FILTER_ITEMS: Array<{
  value: DisputeStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả" },
  { value: "OPEN", label: "Mở" },
  { value: "UNDER_INVESTIGATION", label: "Đang điều tra" },
  { value: "AWAITING_RESPONSE", label: "Chờ phản hồi" },
  { value: "RESOLVED", label: "Đã giải quyết" },
  { value: "DISMISSED", label: "Bị bác" },
  { value: "ESCALATED", label: "Leo thang" },
];

const toneClass = (tone: StatusTone) =>
  `jmt-status-chip jmt-status-chip--${tone}`;

const PARTIAL_RESOLUTION_VALUES: DisputeResolution[] = [
  "WORKER_PARTIAL",
  "PARTIAL_REFUND",
  "PARTIAL_RELEASE",
];

const isPartialResolution = (
  value: DisputeResolution | "",
): value is DisputeResolution =>
  PARTIAL_RESOLUTION_VALUES.includes(value as DisputeResolution);

const getPartialPercentHint = (value: DisputeResolution | "") => {
  if (value === "PARTIAL_REFUND") {
    return "Nhập tỷ lệ % hoàn cho recruiter (1-99%). Ứng viên sẽ nhận phần còn lại.";
  }

  return "Nhập tỷ lệ % chi trả cho ứng viên (1-99%). Recruiter sẽ nhận phần còn lại.";
};

const getResolutionTone = (value: DisputeResolution) => {
  switch (value) {
    case "WORKER_WINS":
    case "WORKER_PARTIAL":
    case "FULL_RELEASE":
    case "PARTIAL_RELEASE":
      return "success";
    case "RECRUITER_WINS":
    case "FULL_REFUND":
    case "CANCEL_JOB":
      return "danger";
    case "RESUBMIT_REQUIRED":
    case "RECRUITER_WARNING":
      return "warning";
    case "NO_ACTION":
      return "neutral";
    default:
      return "info";
  }
};

const getResolutionOptions = (): ResolutionOption[] => [
  {
    value: "WORKER_WINS",
    label: "Ứng viên thắng",
    hint: "Giải ngân 100% cho ứng viên. Không hoàn tiền cho recruiter.",
  },
  {
    value: "RECRUITER_WINS",
    label: "Nhà tuyển dụng thắng",
    hint: "Hoàn 100% cho recruiter. Không trả cho ứng viên.",
  },
  {
    value: "WORKER_PARTIAL",
    label: "Ứng viên thắng một phần",
    hint: "Cần nhập tỷ lệ phần trăm chia tiền cho ứng viên (1-99%).",
  },
  {
    value: "PARTIAL_REFUND",
    label: "Hoàn một phần cho recruiter",
    hint: "Recruiter nhận %, ứng viên nhận phần còn lại. Cần nhập tỷ lệ.",
  },
  {
    value: "PARTIAL_RELEASE",
    label: "Giải ngân một phần cho ứng viên",
    hint: "Ứng viên nhận %, recruiter nhận phần còn lại. Cần nhập tỷ lệ.",
  },
  {
    value: "CANCEL_JOB",
    label: "Hủy job",
    hint: "Hủy công việc, hoàn tiền cho recruiter (trừ phí nền tảng).",
  },
  {
    value: "FULL_REFUND",
    label: "Hoàn tiền toàn phần",
    hint: "Hoàn 100% cho recruiter (trừ phí nền tảng).",
  },
  {
    value: "FULL_RELEASE",
    label: "Giải ngân toàn phần",
    hint: "Trả 100% cho ứng viên (trừ phí nền tảng).",
  },
  {
    value: "RESUBMIT_REQUIRED",
    label: "Yêu cầu nộp lại",
    hint: "Không quyết định tài chính. Mở lại luồng revision cho ứng viên.",
  },
  {
    value: "NO_ACTION",
    label: "Không xử lý / Bác bỏ",
    hint: "Bác bỏ khiếu nại. Không có thay đổi tài chính.",
  },
  {
    value: "RECRUITER_WARNING",
    label: "Cảnh báo recruiter",
    hint: "Ghi nhận vi phạm nhưng không xử lý tài chính. Gia hạn review 48h.",
  },
];

const getAuditActorLabel = (log: JobStatusAuditLog) => {
  if (typeof log.changedBy === "number") {
    return `User #${log.changedBy}`;
  }

  if (log.changedBy && typeof log.changedBy === "object") {
    return log.changedBy.fullName || log.changedBy.email || log.changedByRole;
  }

  return log.changedByRole;
};

export const JobDisputesView: React.FC<JobDisputesViewProps> = ({
  onDataChanged,
}) => {
  const { toast, isVisible, hideToast, showError, showSuccess, showWarning } =
    useToast();

  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<DisputeStatusFilter>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [selectedDispute, setSelectedDispute] =
    useState<DisputeResponse | null>(null);
  const [detail, setDetail] = useState<Dispute | null>(null);
  const [auditLogs, setAuditLogs] = useState<JobStatusAuditLog[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [resolution, setResolution] = useState<DisputeResolution | "">("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [partialPercent, setPartialPercent] = useState("");
  const [resolving, setResolving] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);

  const resolutionOptions = useMemo(() => getResolutionOptions(), []);

  const selectedResolutionOption = useMemo(
    () => resolutionOptions.find((item) => item.value === resolution),
    [resolutionOptions, resolution],
  );

  const requiresPartialPercent = isPartialResolution(resolution);

  const loadDisputes = useCallback(
    async (
      targetPage: number,
      status?: Exclude<DisputeStatusFilter, "ALL">,
    ) => {
      setLoading(true);
      try {
        const response = await adminService.getDisputes({
          page: targetPage,
          size: ITEMS_PER_PAGE,
          status,
        });

        setDisputes(response.content ?? []);
        setPage(response.number ?? 0);
        setTotalPages(response.totalPages ?? 0);
      } catch (error) {
        console.error("Failed to load disputes", error);
        showError("Lỗi", "Không thể tải danh sách tranh chấp");
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadDisputes(0, statusFilter === "ALL" ? undefined : statusFilter);
  }, [loadDisputes, statusFilter]);

  const filteredDisputes = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return disputes;

    return disputes.filter((dispute) => {
      return (
        String(dispute.id).includes(keyword) ||
        String(dispute.jobId).includes(keyword) ||
        String(dispute.initiatorName ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(dispute.respondentName ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(dispute.reason).toLowerCase().includes(keyword)
      );
    });
  }, [disputes, searchKeyword]);

  const openDisputeModal = async (dispute: DisputeResponse) => {
    setSelectedDispute(dispute);
    setResolution("");
    setResolutionNotes("");
    setPartialPercent("");
    setDetail(null);
    setAuditLogs([]);
    setDetailLoading(true);

    try {
      const [fetchedDetail, fetchedLogs] = await Promise.all([
        adminService.getDisputeDetail(dispute.id),
        adminService.getDisputeAuditLogs(dispute.id),
      ]);

      setDetail(fetchedDetail);
      setAuditLogs(Array.isArray(fetchedLogs) ? fetchedLogs : []);
    } catch (error) {
      console.error("Failed to load dispute detail", error);
      showError("Lỗi", "Không thể tải chi tiết tranh chấp");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDisputeModal = () => {
    setSelectedDispute(null);
    setResolution("");
    setResolutionNotes("");
    setPartialPercent("");
    setShowResolveConfirm(false);
    setDetail(null);
    setAuditLogs([]);
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    if (!resolution) {
      showWarning("Thiếu thông tin", "Vui lòng chọn phương án xử lý");
      return;
    }

    if (requiresPartialPercent) {
      const parsed = Number(partialPercent);
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 100) {
        showWarning(
          "Giá trị không hợp lệ",
          "Phần trăm chia phải nằm trong khoảng 1 - 99",
        );
        return;
      }
    }

    setResolving(true);
    try {
      const payload: ResolveDisputeRequest = {
        resolution,
        resolutionNotes: resolutionNotes || undefined,
        partialRefundPct: requiresPartialPercent
          ? Number(partialPercent)
          : undefined,
      };

      await adminService.resolveDispute(selectedDispute.id, payload);
      showSuccess("Thành công", `Đã xử lý tranh chấp #${selectedDispute.id}`);
      closeDisputeModal();
      await loadDisputes(
        page,
        statusFilter === "ALL" ? undefined : statusFilter,
      );
      onDataChanged?.();
    } catch (error) {
      console.error("Failed to resolve dispute", error);
      showError("Lỗi", "Không thể xử lý tranh chấp này");
    } finally {
      setResolving(false);
    }
  };

  const openCount = disputes.filter((item) => item.status === "OPEN").length;
  const escalatedCount = disputes.filter(
    (item) => item.status === "ESCALATED",
  ).length;

  return (
    <div className="jmt-stack">
      <div className="jmt-row jmt-row--between">
        <div>
          <h3 className="jmt-title">Quản lý tranh chấp (Short-term)</h3>
          <p className="jmt-subtitle">
            Kênh xử lý tranh chấp chuyên biệt cho short-term mission, có lịch sử
            audit rõ ràng.
          </p>
        </div>
        <button
          className="jmt-btn jmt-btn--ghost"
          onClick={() =>
            loadDisputes(
              page,
              statusFilter === "ALL" ? undefined : statusFilter,
            )
          }
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      <div
        className="jmt-filter-items"
        role="tablist"
        aria-label="Lọc trạng thái tranh chấp"
      >
        {DISPUTE_STATUS_FILTER_ITEMS.map((item) => (
          <button
            key={item.value}
            className={`jmt-filter-item ${statusFilter === item.value ? "active" : ""}`}
            onClick={() => {
              setStatusFilter(item.value);
              setPage(0);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="jmt-toolbar">
        <label className="jmt-input-wrap jmt-input-wrap--icon jmt-input-wrap--grow">
          <Search size={14} />
          <input
            className="jmt-input"
            placeholder="Tìm theo dispute ID, job ID, người liên quan"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
      </div>

      <div className="jmt-kpi-grid jmt-kpi-grid--compact">
        <article className="jmt-kpi-card jmt-kpi-card--red">
          <div className="jmt-kpi-icon">
            <ShieldAlert size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{openCount}</div>
            <div className="jmt-kpi-label">Case đang mở</div>
          </div>
        </article>
        <article className="jmt-kpi-card jmt-kpi-card--purple">
          <div className="jmt-kpi-icon">
            <AlertTriangle size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{escalatedCount}</div>
            <div className="jmt-kpi-label">Case leo thang</div>
          </div>
        </article>
        <article className="jmt-kpi-card jmt-kpi-card--cyan">
          <div className="jmt-kpi-icon">
            <Scale size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{disputes.length}</div>
            <div className="jmt-kpi-label">Tổng case trang hiện tại</div>
          </div>
        </article>
      </div>

      {loading ? (
        <div className="jmt-state-card">
          <Loader2 size={28} className="jmt-spin" />
          <p>Đang tải tranh chấp...</p>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="jmt-state-card">
          <p>Không có tranh chấp phù hợp bộ lọc.</p>
        </div>
      ) : (
        <div className="jmt-list-grid">
          {filteredDisputes.map((dispute) => {
            const tone = getDisputeStatusTone(dispute.status);

            return (
              <article
                key={dispute.id}
                className="jmt-job-card jmt-job-card--dispute"
              >
                <header className="jmt-job-card__header">
                  <div>
                    <h4>
                      #Dispute-{dispute.id} | Job #{dispute.jobId}
                    </h4>
                    <p>{getDisputeTypeLabel(dispute.disputeType)}</p>
                  </div>
                  <span className={toneClass(tone)}>
                    {getDisputeStatusLabel(dispute.status)}
                  </span>
                </header>

                <p className="jmt-dispute-reason">{dispute.reason}</p>

                <div className="jmt-job-card__meta">
                  <span>Khởi tạo: {formatDate(dispute.createdAt)}</span>
                  <span>
                    Bên khởi tạo:{" "}
                    {dispute.initiatorName || `User #${dispute.initiatorId}`}
                  </span>
                  <span>
                    Bên đối ứng:{" "}
                    {dispute.respondentName || `User #${dispute.respondentId}`}
                  </span>
                </div>

                {dispute.resolution ? (
                  <div className="jmt-resolution-pill">
                    Đã xử lý: {getResolutionLabel(dispute.resolution)}
                  </div>
                ) : null}

                <footer className="jmt-job-card__footer">
                  <button
                    className="jmt-btn jmt-btn--ghost"
                    onClick={() => openDisputeModal(dispute)}
                  >
                    <Gavel size={14} /> Xem và xử lý
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="jmt-pagination">
          <button
            className="jmt-btn jmt-btn--ghost"
            disabled={page <= 0}
            onClick={() =>
              loadDisputes(
                page - 1,
                statusFilter === "ALL" ? undefined : statusFilter,
              )
            }
          >
            Trước
          </button>
          <span>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            className="jmt-btn jmt-btn--ghost"
            disabled={page >= totalPages - 1}
            onClick={() =>
              loadDisputes(
                page + 1,
                statusFilter === "ALL" ? undefined : statusFilter,
              )
            }
          >
            Sau
          </button>
        </div>
      )}

      {selectedDispute && (
        <div className="jmt-modal-overlay" role="dialog" aria-modal="true">
          <div className="jmt-modal-card jmt-modal-card--wide">
            <div className="jmt-modal-head">
              <h4>Xử lý tranh chấp #{selectedDispute.id}</h4>
              <button className="jmt-icon-btn" onClick={closeDisputeModal}>
                <X size={16} />
              </button>
            </div>

            {detailLoading ? (
              <div className="jmt-state-card jmt-state-card--inline">
                <Loader2 size={20} className="jmt-spin" />
                <p>Đang tải chi tiết tranh chấp...</p>
              </div>
            ) : (
              <>
                <div className="jmt-modal-grid">
                  <div className="jmt-modal-panel">
                    <h5>Thông tin vụ việc</h5>
                    <p>
                      <strong>Loại:</strong>{" "}
                      {getDisputeTypeLabel(detail?.disputeType)}
                    </p>
                    <p>
                      <strong>Lý do:</strong> {detail?.reason}
                    </p>
                    <p>
                      <strong>Tạo lúc:</strong>{" "}
                      {formatDateTime(detail?.createdAt)}
                    </p>
                    <p>
                      <strong>Trạng thái:</strong>{" "}
                      {getDisputeStatusLabel(detail?.status)}
                    </p>
                    {detail?.resolution ? (
                      <p>
                        <strong>Kết luận hiện tại:</strong>{" "}
                        {getResolutionLabel(detail.resolution)}
                      </p>
                    ) : null}
                    {detail?.resolvedBy ? (
                      <p>
                        <strong>Người xử lý:</strong>{" "}
                        {detail.resolvedByName || `Admin #${detail.resolvedBy}`}
                      </p>
                    ) : null}
                    {detail?.resolvedAt ? (
                      <p>
                        <strong>Xử lý lúc:</strong>{" "}
                        {formatDateTime(detail.resolvedAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="jmt-modal-panel">
                    <h5>Lịch sử thay đổi trạng thái</h5>
                    {auditLogs.length === 0 ? (
                      <p>Chưa có audit log.</p>
                    ) : (
                      <ul className="jmt-audit-list">
                        {auditLogs.map((log) => (
                          <li key={log.id}>
                            <div>
                              {log.previousStatus} →{" "}
                              <strong>{log.newStatus}</strong>
                            </div>
                            <small>
                              {getAuditActorLabel(log)} •{" "}
                              {formatDateTime(log.createdAt)}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {selectedDispute.status !== "RESOLVED" &&
                selectedDispute.status !== "DISMISSED" ? (
                  <div className="jmt-modal-panel">
                    <h5>Phương án xử lý</h5>
                    <div
                      className="jmt-resolution-grid"
                      role="radiogroup"
                      aria-label="Danh sách phương án xử lý tranh chấp"
                    >
                      {resolutionOptions.map((option) => {
                        const isActive = resolution === option.value;
                        const tone = getResolutionTone(option.value);

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`jmt-resolution-option jmt-resolution-option--${tone} ${isActive ? "is-active" : ""}`}
                            onClick={() => setResolution(option.value)}
                            aria-pressed={isActive}
                          >
                            <span className="jmt-resolution-option__label">
                              {option.label}
                            </span>
                            <span className="jmt-resolution-option__hint">
                              {option.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedResolutionOption ? (
                      <p className="jmt-subtitle">
                        Đang chọn:{" "}
                        <strong>{selectedResolutionOption.label}</strong>
                      </p>
                    ) : null}

                    {requiresPartialPercent ? (
                      <>
                        <p className="jmt-subtitle">
                          {getPartialPercentHint(resolution)}
                        </p>
                        <label className="jmt-input-wrap">
                          <input
                            className="jmt-input"
                            type="number"
                            min={1}
                            max={99}
                            value={partialPercent}
                            onChange={(event) =>
                              setPartialPercent(event.target.value)
                            }
                            placeholder="Nhập tỷ lệ phần trăm (1-99)"
                          />
                        </label>
                      </>
                    ) : null}

                    <textarea
                      className="jmt-textarea"
                      rows={3}
                      value={resolutionNotes}
                      onChange={(event) =>
                        setResolutionNotes(event.target.value)
                      }
                      placeholder="Ghi chú xử lý (không bắt buộc)"
                    />

                    <div className="jmt-row jmt-row--end">
                      <button
                        className="jmt-btn jmt-btn--success"
                        onClick={() => setShowResolveConfirm(true)}
                        disabled={resolving}
                      >
                        {resolving ? (
                          <Loader2 size={14} className="jmt-spin" />
                        ) : null}
                        Xác nhận xử lý
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="jmt-modal-panel">
                    <p>Vụ việc này đã đóng, không thể xử lý thêm.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showResolveConfirm}
        title="Xác nhận xử lý tranh chấp"
        message={`Bạn sắp xử lý tranh chấp #${selectedDispute?.id} với phương án "${selectedResolutionOption?.label ?? "Chưa chọn"}".\n\nHành động này sẽ được ghi nhận trong audit log và số tiền escrow sẽ được xử lý. Bạn không thể hoàn tác.`}
        confirmLabel="Xác nhận xử lý"
        cancelLabel="Hủy"
        variant="primary"
        onConfirm={handleResolve}
        onCancel={() => setShowResolveConfirm(false)}
      />

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          useOverlay={toast.useOverlay}
          actionButton={toast.actionButton}
          secondaryActionButton={toast.secondaryActionButton}
        />
      )}
    </div>
  );
};

export default JobDisputesView;
