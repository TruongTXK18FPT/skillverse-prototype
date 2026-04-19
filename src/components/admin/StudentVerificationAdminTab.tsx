import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
} from "lucide-react";
import adminService from "../../services/adminService";
import {
  StudentVerificationDetailDto,
  StudentVerificationListItemDto,
  StudentVerificationStatus,
  StudentVerificationStatusFilter,
} from "../../data/adminDTOs";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import { getStoredUserRaw } from "../../utils/authStorage";
import "./StudentVerificationAdminTab.css";

const STATUS_OPTIONS: Array<{
  value: StudentVerificationStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "EMAIL_OTP_PENDING", label: "Chờ OTP" },
  { value: "PENDING_REVIEW", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "EXPIRED", label: "Đã hết hạn" },
];

const getStatusLabel = (status: StudentVerificationStatus) => {
  switch (status) {
    case "EMAIL_OTP_PENDING":
      return "Chờ OTP";
    case "PENDING_REVIEW":
      return "Chờ duyệt";
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Từ chối";
    case "EXPIRED":
      return "Đã hết hạn";
    default:
      return status;
  }
};

const getStatusClass = (status: StudentVerificationStatus) => {
  switch (status) {
    case "EMAIL_OTP_PENDING":
      return "otp";
    case "PENDING_REVIEW":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "EXPIRED":
      return "expired";
    default:
      return "pending";
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
};

const formatFileSize = (size?: number | null) => {
  if (!size || size <= 0) {
    return "-";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const StudentVerificationAdminTab: React.FC = () => {
  const [requests, setRequests] = useState<StudentVerificationListItemDto[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<StudentVerificationStatusFilter>("PENDING_REVIEW");
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showExpireModal, setShowExpireModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] =
    useState<StudentVerificationDetailDto | null>(null);

  const [reviewNote, setReviewNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [expireReason, setExpireReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { toast, isVisible, hideToast, showError, showSuccess, showWarning } =
    useToast();

  const currentUserRaw = getStoredUserRaw();
  const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
  const canManage =
    currentUser?.roles?.includes("ADMIN") ||
    currentUser?.roles?.includes("USER_ADMIN");

  // [Nghiệp vụ] Tải danh sách hồ sơ xác thực sinh viên theo bộ lọc để admin xử lý theo queue.
  const fetchStudentRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statusParam =
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as StudentVerificationStatus);

      const response = await adminService.getStudentVerificationRequests({
        status: statusParam,
        page,
        size,
      });

      setRequests(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh sách xác thực sinh viên.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter]);

  useEffect(() => {
    void fetchStudentRequests();
  }, [fetchStudentRequests]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  useEffect(() => {
    if (showDetailModal || showRejectModal || showExpireModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDetailModal, showRejectModal, showExpireModal]);

  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) {
      return requests;
    }

    const term = searchTerm.trim().toLowerCase();
    return requests.filter((item) => {
      return (
        item.userFullName.toLowerCase().includes(term) ||
        item.userEmail.toLowerCase().includes(term) ||
        item.schoolEmail.toLowerCase().includes(term)
      );
    });
  }, [requests, searchTerm]);

  // [Nghiệp vụ] Admin mở chi tiết để đối chiếu ảnh thẻ và dữ liệu hồ sơ trước khi duyệt.
  const openDetailModal = async (requestId: number) => {
    try {
      setDetailLoading(true);
      setSelectedDetail(null);
      setReviewNote("");
      setRejectReason("");
      setExpireReason("");
      setShowDetailModal(true);

      const detail =
        await adminService.getStudentVerificationRequestDetail(requestId);
      setSelectedDetail(detail);
      setReviewNote(detail.reviewNote || "");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải chi tiết hồ sơ.";
      showError("Tải chi tiết thất bại", msg);
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // [Nghiệp vụ] Duyệt hồ sơ sẽ mở quyền mua Student Pack cho sinh viên.
  const handleApprove = async () => {
    if (!selectedDetail) {
      return;
    }

    if (selectedDetail.status !== "PENDING_REVIEW") {
      showWarning(
        "Không thể duyệt",
        "Hồ sơ này không còn ở trạng thái chờ duyệt.",
      );
      return;
    }

    try {
      setActionLoading(true);
      const updated = await adminService.approveStudentVerificationRequest(
        selectedDetail.id,
        reviewNote.trim() ? { reviewNote: reviewNote.trim() } : undefined,
      );

      setSelectedDetail(updated);
      showSuccess("Duyệt thành công", "Đã duyệt hồ sơ xác thực sinh viên.", 4);
      await fetchStudentRequests();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể duyệt hồ sơ sinh viên.";
      showError("Duyệt thất bại", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // [Nghiệp vụ] Từ chối bắt buộc ghi lý do để sinh viên biết cần cập nhật hồ sơ nào.
  const handleRejectConfirm = async () => {
    if (!selectedDetail) {
      return;
    }

    if (!rejectReason.trim()) {
      showWarning("Thiếu thông tin", "Vui lòng nhập lý do từ chối.");
      return;
    }

    try {
      setActionLoading(true);
      const updated = await adminService.rejectStudentVerificationRequest(
        selectedDetail.id,
        { reason: rejectReason.trim() },
      );

      setSelectedDetail(updated);
      setShowRejectModal(false);
      setRejectReason("");
      showSuccess(
        "Từ chối thành công",
        "Đã từ chối hồ sơ xác thực sinh viên.",
        4,
      );
      await fetchStudentRequests();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể từ chối hồ sơ sinh viên.";
      showError("Từ chối thất bại", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // [Nghiệp vụ] Admin đánh dấu hết hạn hồ sơ đã duyệt để giải phóng ràng buộc email trường cho tài khoản khác.
  const handleExpireConfirm = async () => {
    if (!selectedDetail) {
      return;
    }

    if (!expireReason.trim()) {
      showWarning("Thiếu thông tin", "Vui lòng nhập lý do hết hạn.");
      return;
    }

    try {
      setActionLoading(true);
      const updated = await adminService.expireStudentVerificationRequest(
        selectedDetail.id,
        { reason: expireReason.trim() },
      );

      setSelectedDetail(updated);
      setShowExpireModal(false);
      setExpireReason("");
      showSuccess(
        "Cập nhật thành công",
        "Đã đánh dấu hồ sơ hết hạn và giải phóng email trường.",
        4,
      );
      await fetchStudentRequests();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật trạng thái hết hạn.";
      showError("Cập nhật thất bại", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const canReviewCurrentDetail =
    Boolean(selectedDetail) && selectedDetail?.status === "PENDING_REVIEW";
  const canExpireCurrentDetail =
    Boolean(selectedDetail) && selectedDetail?.status === "APPROVED";

  return (
    <div className="svr-admin">
      <div className="svr-admin__header">
        <div>
          <h3 className="svr-admin__title">Duyệt Xác Thực Sinh Viên</h3>
          <p className="svr-admin__sub">
            Xem chi tiết toàn bộ thông tin hồ sơ và ảnh thẻ trước khi duyệt.
          </p>
        </div>

        <button
          type="button"
          className="svr-admin__refresh"
          onClick={() => void fetchStudentRequests()}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spinning" : ""} />
          Làm mới
        </button>
      </div>

      <div className="svr-admin__filters">
        <div className="svr-admin__search">
          <Search size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên, email cá nhân, email trường..."
          />
        </div>

        <select
          className="svr-admin__status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as StudentVerificationStatusFilter,
            )
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="svr-admin__state">
          <RefreshCw size={30} className="spinning" />
          <p>Đang tải danh sách hồ sơ student verification...</p>
        </div>
      )}

      {!loading && error && (
        <div className="svr-admin__state svr-admin__state--error">
          <XCircle size={32} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="svr-admin__table-wrap">
            <table className="svr-admin__table">
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Email trường</th>
                  <th>Trạng thái</th>
                  <th>Ngày nộp</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="svr-admin__student-cell">
                        <div className="svr-admin__avatar">
                          {item.userFullName?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <div className="svr-admin__name">
                            {item.userFullName}
                          </div>
                          <div className="svr-admin__email">
                            <Mail size={13} /> {item.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{item.schoolEmail}</td>
                    <td>
                      <span
                        className={`svr-admin__status-badge ${getStatusClass(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="svr-admin__date">
                        <Calendar size={13} />
                        {formatDateTime(item.createdAt)}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="svr-admin__action-btn"
                        onClick={() => void openDetailModal(item.id)}
                        title="Xem chi tiết"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRequests.length === 0 && (
              <div className="svr-admin__empty">
                Không có hồ sơ phù hợp bộ lọc hiện tại.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="svr-admin__pagination">
              <button
                type="button"
                className="svr-admin__page-btn"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
              >
                Trước
              </button>

              <span>
                Trang {page + 1} / {Math.max(1, totalPages)} - Tổng{" "}
                {totalElements} hồ sơ
              </span>

              <button
                type="button"
                className="svr-admin__page-btn"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={page >= totalPages - 1}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {showDetailModal &&
        ReactDOM.createPortal(
          <div
            className="svr-modal-overlay"
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className="svr-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="svr-modal__header">
                <h4>Chi Tiết Hồ Sơ Xác Thực Sinh Viên</h4>
                <button
                  type="button"
                  className="svr-modal__close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="svr-modal__body">
                {detailLoading && (
                  <div className="svr-admin__state">
                    <RefreshCw size={28} className="spinning" />
                    <p>Đang tải chi tiết hồ sơ...</p>
                  </div>
                )}

                {!detailLoading && selectedDetail && (
                  <>
                    <section className="svr-section">
                      <h5>
                        <User size={16} /> Thông tin sinh viên
                      </h5>
                      <div className="svr-grid">
                        <div>
                          <label>Họ tên</label>
                          <p>{selectedDetail.userFullName}</p>
                        </div>
                        <div>
                          <label>Email cá nhân</label>
                          <p>{selectedDetail.userEmail}</p>
                        </div>
                        <div>
                          <label>Email trường</label>
                          <p>{selectedDetail.schoolEmail}</p>
                        </div>
                        <div>
                          <label>Domain trường</label>
                          <p>{selectedDetail.schoolDomain || "-"}</p>
                        </div>
                        <div>
                          <label>Domain hợp lệ</label>
                          <p>
                            {selectedDetail.emailDomainValid ? "Có" : "Không"}
                          </p>
                        </div>
                        <div>
                          <label>Trạng thái</label>
                          <p>
                            <span
                              className={`svr-admin__status-badge ${getStatusClass(
                                selectedDetail.status,
                              )}`}
                            >
                              {getStatusLabel(selectedDetail.status)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="svr-section">
                      <h5>
                        <FileText size={16} /> Metadata hồ sơ
                      </h5>
                      <div className="svr-grid">
                        <div>
                          <label>Tệp tải lên</label>
                          <p>{selectedDetail.uploadedFileName || "-"}</p>
                        </div>
                        <div>
                          <label>Loại tệp</label>
                          <p>{selectedDetail.uploadedContentType || "-"}</p>
                        </div>
                        <div>
                          <label>Kích thước</label>
                          <p>
                            {formatFileSize(selectedDetail.uploadedFileSize)}
                          </p>
                        </div>
                        <div>
                          <label>Ngày tạo hồ sơ</label>
                          <p>{formatDateTime(selectedDetail.createdAt)}</p>
                        </div>
                        <div>
                          <label>Xác minh OTP lúc</label>
                          <p>{formatDateTime(selectedDetail.otpVerifiedAt)}</p>
                        </div>
                        <div>
                          <label>Cập nhật gần nhất</label>
                          <p>{formatDateTime(selectedDetail.updatedAt)}</p>
                        </div>
                      </div>
                    </section>

                    {selectedDetail.imageUrl && (
                      <section className="svr-section">
                        <h5>Ảnh thẻ sinh viên</h5>
                        <div className="svr-image-wrap">
                          <img
                            src={selectedDetail.imageUrl}
                            alt="Ảnh thẻ sinh viên"
                            className="svr-image"
                          />
                          <a
                            href={selectedDetail.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="svr-link"
                          >
                            <ExternalLink size={14} /> Mở ảnh gốc
                          </a>
                        </div>
                      </section>
                    )}

                    <section className="svr-section">
                      <h5>Kết quả duyệt</h5>
                      <div className="svr-grid">
                        <div>
                          <label>Duyệt lúc</label>
                          <p>{formatDateTime(selectedDetail.reviewedAt)}</p>
                        </div>
                        <div>
                          <label>Admin duyệt</label>
                          <p>{selectedDetail.reviewedById || "-"}</p>
                        </div>
                        <div>
                          <label>Review note</label>
                          <p>{selectedDetail.reviewNote || "-"}</p>
                        </div>
                        <div>
                          <label>Lý do từ chối/hết hạn</label>
                          <p>{selectedDetail.rejectionReason || "-"}</p>
                        </div>
                      </div>
                    </section>

                    {canReviewCurrentDetail && canManage && (
                      <section className="svr-section">
                        <h5>Ghi chú duyệt</h5>
                        <textarea
                          value={reviewNote}
                          onChange={(event) =>
                            setReviewNote(event.target.value)
                          }
                          className="svr-textarea"
                          placeholder="Ghi chú nội bộ khi duyệt (không bắt buộc)..."
                          rows={3}
                          disabled={actionLoading}
                        />
                      </section>
                    )}
                  </>
                )}
              </div>

              <div className="svr-modal__footer">
                {selectedDetail && canReviewCurrentDetail && canManage && (
                  <>
                    <button
                      type="button"
                      className="svr-btn svr-btn--approve"
                      onClick={() => void handleApprove()}
                      disabled={actionLoading}
                    >
                      <CheckCircle size={16} />
                      {actionLoading ? "Đang xử lý..." : "Duyệt hồ sơ"}
                    </button>
                    <button
                      type="button"
                      className="svr-btn svr-btn--reject"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                    >
                      <XCircle size={16} /> Từ chối
                    </button>
                  </>
                )}

                {selectedDetail && canExpireCurrentDetail && canManage && (
                  <button
                    type="button"
                    className="svr-btn svr-btn--expire"
                    onClick={() => setShowExpireModal(true)}
                    disabled={actionLoading}
                  >
                    <AlertTriangle size={16} /> Đánh dấu hết hạn
                  </button>
                )}

                <button
                  type="button"
                  className="svr-btn svr-btn--close"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showExpireModal &&
        ReactDOM.createPortal(
          <div
            className="svr-modal-overlay"
            onClick={() => setShowExpireModal(false)}
          >
            <div
              className="svr-modal svr-modal--sm"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="svr-modal__header">
                <h4>Đánh Dấu Hết Hạn Email Trường</h4>
                <button
                  type="button"
                  className="svr-modal__close"
                  onClick={() => setShowExpireModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="svr-modal__body">
                <p className="svr-expire-note">
                  Hành động này sẽ chuyển hồ sơ sang trạng thái hết hạn và cho
                  phép email trường được dùng để xác thực cho tài khoản khác.
                </p>
                <textarea
                  value={expireReason}
                  onChange={(event) => setExpireReason(event.target.value)}
                  className="svr-textarea"
                  placeholder="Nhập lý do hết hạn..."
                  rows={4}
                  disabled={actionLoading}
                />
              </div>

              <div className="svr-modal__footer">
                <button
                  type="button"
                  className="svr-btn svr-btn--close"
                  onClick={() => setShowExpireModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="svr-btn svr-btn--expire"
                  onClick={() => void handleExpireConfirm()}
                  disabled={actionLoading || !expireReason.trim()}
                >
                  {actionLoading ? "Đang xử lý..." : "Xác nhận hết hạn"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showRejectModal &&
        ReactDOM.createPortal(
          <div
            className="svr-modal-overlay"
            onClick={() => setShowRejectModal(false)}
          >
            <div
              className="svr-modal svr-modal--sm"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="svr-modal__header">
                <h4>Từ Chối Hồ Sơ Student Verification</h4>
                <button
                  type="button"
                  className="svr-modal__close"
                  onClick={() => setShowRejectModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="svr-modal__body">
                <p className="svr-reject-note">
                  Lý do từ chối sẽ gửi về student để họ cập nhật và nộp lại hồ
                  sơ.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  className="svr-textarea"
                  placeholder="Nhập lý do từ chối..."
                  rows={4}
                  disabled={actionLoading}
                />
              </div>

              <div className="svr-modal__footer">
                <button
                  type="button"
                  className="svr-btn svr-btn--close"
                  onClick={() => setShowRejectModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="svr-btn svr-btn--reject"
                  onClick={() => void handleRejectConfirm()}
                  disabled={actionLoading || !rejectReason.trim()}
                >
                  {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={false}
          countdownText={toast.countdownText}
          position="center"
          useOverlay={false}
          actionButton={toast.actionButton}
        />
      )}
    </div>
  );
};

export default StudentVerificationAdminTab;
