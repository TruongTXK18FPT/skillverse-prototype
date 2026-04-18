import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MailCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import studentVerifyService from "../../services/studentVerifyService";
import {
  StudentVerificationDetailResponse,
  StudentVerificationEligibilityResponse,
  StudentVerificationStatus,
} from "../../types/studentVerification";
import styles from "./StudentVerificationPage.module.css";

interface NoticeState {
  tone: "info" | "success" | "error";
  message: string;
}

// [Nghiep vu] Day la man hinh trung tam cho user hoan tat xac thuc sinh vien truoc khi mua Student Pack.
const StudentVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const returnPath =
    ((location.state as { from?: string } | null)?.from ?? "/premium") ||
    "/premium";

  const [latestRequest, setLatestRequest] =
    useState<StudentVerificationDetailResponse | null>(null);
  const [eligibility, setEligibility] =
    useState<StudentVerificationEligibilityResponse | null>(null);

  const [schoolEmail, setSchoolEmail] = useState("");
  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [otp, setOtp] = useState("");

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmittingStart, setIsSubmittingStart] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [notice, setNotice] = useState<NoticeState | null>(null);

  // [Nghiep vu] Tai trang thai xac thuc hien tai de UI hien dung step va hanh dong tiep theo.
  const loadVerificationSnapshot = async (silent: boolean = false) => {
    if (!silent) {
      setIsBootstrapping(true);
    }

    try {
      const [eligibilityData, latestData] = await Promise.all([
        studentVerifyService.getEligibility(),
        studentVerifyService.getLatestRequest(),
      ]);

      setEligibility(eligibilityData);
      setLatestRequest(latestData);

      if (latestData?.schoolEmail) {
        setSchoolEmail(latestData.schoolEmail);
      }
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin xác thực sinh viên.",
      });
    } finally {
      if (!silent) {
        setIsBootstrapping(false);
      }
    }
  };

  useEffect(() => {
    void loadVerificationSnapshot();
  }, []);

  const imagePreview = useMemo(() => {
    if (!studentCardFile) {
      return null;
    }
    return URL.createObjectURL(studentCardFile);
  }, [studentCardFile]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const currentStatus: StudentVerificationStatus | "NONE" =
    latestRequest?.status ?? "NONE";

  const isOtpPending = currentStatus === "EMAIL_OTP_PENDING";
  const isPendingReview = currentStatus === "PENDING_REVIEW";
  const isApproved = currentStatus === "APPROVED";
  const isRejected = currentStatus === "REJECTED";
  const isExpired = currentStatus === "EXPIRED";

  const isStartDisabled =
    !schoolEmail.trim() || !studentCardFile || isSubmittingStart;

  // [Nghiep vu] Khoi tao request moi de he thong gui OTP vao email truong.
  const handleStartVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!studentCardFile) {
      setNotice({
        tone: "error",
        message: "Vui lòng chọn ảnh thẻ sinh viên.",
      });
      return;
    }

    setIsSubmittingStart(true);
    setNotice(null);

    try {
      const started = await studentVerifyService.startVerification(
        schoolEmail,
        studentCardFile,
      );

      const requestDetail = await studentVerifyService.getMyRequestDetail(
        started.requestId,
      );

      setLatestRequest(requestDetail);
      setOtp("");
      setNotice({
        tone: "success",
        message:
          started.message ||
          "Đã gửi OTP đến email trường. Vui lòng nhập OTP để tiếp tục.",
      });
      await loadVerificationSnapshot(true);
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể bắt đầu xác thực sinh viên.",
      });
    } finally {
      setIsSubmittingStart(false);
    }
  };

  // [Nghiep vu] Xac minh OTP de chuyen request sang trang thai cho admin review.
  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!latestRequest?.id) {
      setNotice({
        tone: "error",
        message: "Không tìm thấy yêu cầu xác thực để nhập OTP.",
      });
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setNotice({
        tone: "error",
        message: "OTP phải gồm đúng 6 chữ số.",
      });
      return;
    }

    setIsSubmittingOtp(true);
    setNotice(null);

    try {
      const updated = await studentVerifyService.verifyOtpAndSubmit(
        latestRequest.id,
        otp.trim(),
      );

      setLatestRequest(updated);
      setNotice({
        tone: "success",
        message:
          "Xác minh OTP thành công. Hồ sơ đã được gửi tới admin để review.",
      });

      await loadVerificationSnapshot(true);
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể xác minh OTP lúc này.",
      });
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  // [Nghiep vu] Gui lai OTP khi user chua nhan duoc ma va request van dang cho xac minh.
  const handleResendOtp = async () => {
    if (!latestRequest?.id) {
      return;
    }

    setIsResendingOtp(true);
    setNotice(null);

    try {
      const resent = await studentVerifyService.resendOtp(latestRequest.id);
      setNotice({
        tone: "success",
        message: resent.message || "Đã gửi lại OTP tới email trường.",
      });
      await loadVerificationSnapshot(true);
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể gửi lại OTP lúc này.",
      });
    } finally {
      setIsResendingOtp(false);
    }
  };

  // [Nghiep vu] Lam moi trang thai de user theo doi ket qua duyet nhanh ngay tai trang.
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await loadVerificationSnapshot(true);
    setIsRefreshing(false);
  };

  // [Nghiep vu] Cap nhat file anh the va reset thong bao loi neu user chon lai anh.
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setStudentCardFile(file);
    setNotice(null);
  };

  const statusBadgeClass = (() => {
    if (currentStatus === "APPROVED") {
      return `${styles.svVerifyBadge} ${styles.svVerifyBadgeApproved}`;
    }

    if (currentStatus === "EMAIL_OTP_PENDING") {
      return `${styles.svVerifyBadge} ${styles.svVerifyBadgePendingOtp}`;
    }

    if (currentStatus === "PENDING_REVIEW") {
      return `${styles.svVerifyBadge} ${styles.svVerifyBadgeReview}`;
    }

    if (currentStatus === "REJECTED") {
      return `${styles.svVerifyBadge} ${styles.svVerifyBadgeRejected}`;
    }

    if (currentStatus === "EXPIRED") {
      return `${styles.svVerifyBadge} ${styles.svVerifyBadgeRejected}`;
    }

    return `${styles.svVerifyBadge} ${styles.svVerifyBadgePendingOtp}`;
  })();

  const statusLabel = (() => {
    switch (currentStatus) {
      case "EMAIL_OTP_PENDING":
        return "Chờ xác minh OTP";
      case "PENDING_REVIEW":
        return "Chờ admin duyệt";
      case "APPROVED":
        return "Đã được duyệt";
      case "REJECTED":
        return "Bị từ chối";
      case "EXPIRED":
        return "Đã hết hạn";
      default:
        return "Chưa tạo yêu cầu";
    }
  })();

  const noticeClass = notice
    ? notice.tone === "success"
      ? `${styles.svVerifyNotice} ${styles.svVerifyNoticeSuccess}`
      : notice.tone === "error"
        ? `${styles.svVerifyNotice} ${styles.svVerifyNoticeError}`
        : `${styles.svVerifyNotice} ${styles.svVerifyNoticeInfo}`
    : "";

  if (isBootstrapping) {
    return (
      <div className={styles.svVerifyPage}>
        <div className={styles.svVerifyShell}>
          <div
            className={styles.svVerifyNotice + " " + styles.svVerifyNoticeInfo}
          >
            Đang tải trạng thái xác thực sinh viên...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.svVerifyPage}>
      <div className={styles.svVerifyShell}>
        <section className={styles.svVerifyHead}>
          <div className={styles.svVerifyTitleGroup}>
            <span className={styles.svVerifyEyebrow}>
              Điều Kiện Student Premium
            </span>
            <h1 className={styles.svVerifyTitle}>Xác Thực Sinh Viên</h1>
            <p className={styles.svVerifySub}>
              Hoàn tất xác thực để mở khóa mua gói Student Pack. Admin sẽ duyệt
              thủ công dựa trên hồ sơ và ảnh thẻ sinh viên bạn đã gửi.
            </p>
          </div>

          <div className={styles.svVerifyHeadActions}>
            <button
              type="button"
              className={styles.svVerifyGhostBtn}
              onClick={() => navigate(returnPath)}
            >
              <ArrowLeft size={16} />
              Quay Lại Premium
            </button>
          </div>
        </section>

        <section className={styles.svVerifyBoard}>
          <aside className={styles.svVerifyPanel}>
            <h2 className={styles.svVerifyPanelTitle}>Tiến trình xác thực</h2>
            <p className={styles.svVerifyPanelSub}>
              Tài khoản: {user?.email || "Đang cập nhật"}
            </p>

            <div className={styles.svVerifySteps}>
              <article className={styles.svVerifyStep}>
                <div className={styles.svVerifyStepIcon}>
                  <UploadCloud size={16} />
                </div>
                <div>
                  <p className={styles.svVerifyStepTitle}>
                    Bước 1 - Gửi thông tin
                  </p>
                  <p className={styles.svVerifyStepText}>
                    Nhập email trường và tải lên ảnh thẻ sinh viên JPG/PNG.
                  </p>
                </div>
              </article>

              <article className={styles.svVerifyStep}>
                <div className={styles.svVerifyStepIcon}>
                  <MailCheck size={16} />
                </div>
                <div>
                  <p className={styles.svVerifyStepTitle}>
                    Bước 2 - OTP email trường
                  </p>
                  <p className={styles.svVerifyStepText}>
                    OTP hợp lệ mới được chuyển hồ sơ vào hàng đợi review.
                  </p>
                </div>
              </article>

              <article className={styles.svVerifyStep}>
                <div className={styles.svVerifyStepIcon}>
                  <FileCheck2 size={16} />
                </div>
                <div>
                  <p className={styles.svVerifyStepTitle}>
                    Bước 3 - Admin duyệt
                  </p>
                  <p className={styles.svVerifyStepText}>
                    Admin đối chiếu hồ sơ và ảnh thẻ trước khi ra quyết định.
                  </p>
                </div>
              </article>
            </div>

            <div className={styles.svVerifyStatusCard}>
              <div className={styles.svVerifyStatusTop}>
                <span className={styles.svVerifyStatusLabel}>
                  Trạng thái hiện tại
                </span>
                <span className={statusBadgeClass}>{statusLabel}</span>
              </div>

              <div className={styles.svVerifyInfoGrid}>
                <div className={styles.svVerifyInfoItem}>
                  <span className={styles.svVerifyInfoCaption}>
                    Điều kiện mua gói
                  </span>
                  <span className={styles.svVerifyInfoValue}>
                    {eligibility?.canBuyStudentPremium
                      ? "Đã mở khóa"
                      : "Chưa mở khóa"}
                  </span>
                </div>

                <div className={styles.svVerifyInfoItem}>
                  <span className={styles.svVerifyInfoCaption}>
                    Email trường
                  </span>
                  <span className={styles.svVerifyInfoValue}>
                    {latestRequest?.schoolEmail || "Chưa khai báo"}
                  </span>
                </div>

                <div className={styles.svVerifyInfoItem}>
                  <span className={styles.svVerifyInfoCaption}>
                    Cập nhật gần nhất
                  </span>
                  <span className={styles.svVerifyInfoValue}>
                    {latestRequest?.updatedAt
                      ? new Date(latestRequest.updatedAt).toLocaleString(
                          "vi-VN",
                        )
                      : "-"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={styles.svVerifySecondaryBtn}
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <span className={styles.svVerifySpinner} />
                ) : (
                  <RefreshCw size={14} />
                )}
                Làm mới trạng thái
              </button>
            </div>
          </aside>

          <section className={styles.svVerifyPanel}>
            <h2 className={styles.svVerifyPanelTitle}>Gửi xác thực</h2>
            <p className={styles.svVerifyPanelSub}>
              Domain email được chấp nhận: .edu.vn hoặc danh sách trường được hệ
              thống cấu hình.
            </p>

            {notice && <div className={noticeClass}>{notice.message}</div>}

            {isApproved && (
              <div className={styles.svVerifyForm}>
                <div
                  className={`${styles.svVerifyNotice} ${styles.svVerifyNoticeSuccess}`}
                >
                  <strong>Đã xác thực thành công.</strong> Bạn có thể quay lại
                  trang Premium để mua gói Student Pack ngay.
                </div>
                <button
                  type="button"
                  className={`${styles.svVerifyPrimaryBtn} ${styles.svVerifyFullWidth}`}
                  onClick={() => navigate(returnPath)}
                >
                  <ShieldCheck size={16} />
                  Đi Tới Trang Premium
                </button>
              </div>
            )}

            {!isApproved && (
              <>
                <form
                  className={styles.svVerifyForm}
                  onSubmit={handleStartVerification}
                >
                  <div className={styles.svVerifyField}>
                    <label
                      className={styles.svVerifyLabel}
                      htmlFor="sv-school-email"
                    >
                      Email trường
                    </label>
                    <input
                      id="sv-school-email"
                      className={`${styles.svVerifyInput} ${
                        isOtpPending || isPendingReview
                          ? styles.svVerifyReadOnly
                          : ""
                      }`}
                      type="email"
                      value={schoolEmail}
                      onChange={(event) => setSchoolEmail(event.target.value)}
                      placeholder="tenban@truong.edu.vn"
                      disabled={
                        isOtpPending || isPendingReview || isSubmittingStart
                      }
                      required
                    />
                  </div>

                  <div className={styles.svVerifyUpload}>
                    <p className={styles.svVerifyUploadTitle}>
                      Ảnh thẻ sinh viên (JPG/PNG, tối đa 10MB)
                    </p>
                    <p className={styles.svVerifyUploadHint}>
                      Ảnh rõ thông tin giúp admin review nhanh hơn.
                    </p>

                    <label
                      className={styles.svVerifyUploadBtn}
                      htmlFor="sv-card-upload"
                    >
                      <UploadCloud size={14} /> Chọn ảnh
                    </label>
                    <input
                      id="sv-card-upload"
                      className={styles.svVerifyUploadInput}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      disabled={
                        isOtpPending || isPendingReview || isSubmittingStart
                      }
                    />

                    {studentCardFile && (
                      <span className={styles.svVerifyUploadHint}>
                        {studentCardFile.name}
                      </span>
                    )}

                    {imagePreview && (
                      <div className={styles.svVerifyImagePreviewWrap}>
                        <img
                          src={imagePreview}
                          alt="Xem trước thẻ sinh viên"
                          className={styles.svVerifyImagePreview}
                        />
                      </div>
                    )}
                  </div>

                  <div className={styles.svVerifyBtnRow}>
                    <button
                      type="submit"
                      className={`${styles.svVerifyPrimaryBtn} ${styles.svVerifyFullWidth}`}
                      disabled={
                        isStartDisabled || isOtpPending || isPendingReview
                      }
                    >
                      {isSubmittingStart ? (
                        <span className={styles.svVerifySpinner} />
                      ) : (
                        <Send size={14} />
                      )}
                      Gửi OTP Xác Thực
                    </button>
                  </div>
                </form>

                {isOtpPending && latestRequest && (
                  <form
                    className={styles.svVerifyForm}
                    onSubmit={handleVerifyOtp}
                  >
                    <div className={styles.svVerifyField}>
                      <label className={styles.svVerifyLabel} htmlFor="sv-otp">
                        OTP email trường
                      </label>
                      <input
                        id="sv-otp"
                        className={styles.svVerifyInput}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            event.target.value
                              .replace(/[^0-9]/g, "")
                              .slice(0, 6),
                          )
                        }
                        maxLength={6}
                        autoComplete="one-time-code"
                        title="OTP phải gồm đúng 6 chữ số"
                        placeholder="Nhập OTP 6 chữ số"
                        disabled={isSubmittingOtp}
                        required
                      />
                    </div>

                    <div className={styles.svVerifyBtnRow}>
                      <button
                        type="submit"
                        className={styles.svVerifyPrimaryBtn}
                        disabled={isSubmittingOtp || otp.trim().length !== 6}
                      >
                        {isSubmittingOtp ? (
                          <span className={styles.svVerifySpinner} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Xác Minh OTP
                      </button>

                      <button
                        type="button"
                        className={styles.svVerifySecondaryBtn}
                        onClick={handleResendOtp}
                        disabled={isResendingOtp || isSubmittingOtp}
                      >
                        {isResendingOtp ? (
                          <span className={styles.svVerifySpinner} />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Gửi Lại OTP
                      </button>
                    </div>
                  </form>
                )}

                {isPendingReview && (
                  <div className={styles.svVerifyForm}>
                    <div
                      className={`${styles.svVerifyNotice} ${styles.svVerifyNoticeInfo}`}
                    >
                      <Clock3 size={14} /> Hồ sơ đang chờ admin review. Bạn sẽ
                      mua được Student Pack ngay khi status chuyển APPROVED.
                    </div>

                    <ul className={styles.svVerifyHintList}>
                      <li>
                        Không cần gửi lại OTP khi đã vào trạng thái
                        PENDING_REVIEW.
                      </li>
                      <li>
                        Bạn có thể bấm "Làm mới trạng thái" để cập nhật kết quả
                        mới nhất.
                      </li>
                    </ul>
                  </div>
                )}

                {(isRejected || isExpired) && (
                  <div className={styles.svVerifyForm}>
                    <div
                      className={`${styles.svVerifyNotice} ${styles.svVerifyNoticeError}`}
                    >
                      <XCircle size={14} />
                      {isExpired
                        ? " Email trường đã hết hạn xác thực. Vui lòng gửi hồ sơ mới để xác minh lại."
                        : " Hồ sơ bị từ chối. Vui lòng cập nhật thông tin và gửi lại."}
                    </div>

                    {latestRequest?.rejectionReason && (
                      <div className={styles.svVerifyField}>
                        <label className={styles.svVerifyLabel}>
                          {isExpired ? "Lý do hết hạn" : "Lý do từ chối"}
                        </label>
                        <textarea
                          className={`${styles.svVerifyTextArea} ${styles.svVerifyReadOnly}`}
                          value={latestRequest.rejectionReason}
                          readOnly
                        />
                      </div>
                    )}

                    <ul className={styles.svVerifyHintList}>
                      <li>
                        Có thể gửi yêu cầu mới bằng email trường và ảnh thẻ rõ
                        nét hơn.
                      </li>
                      <li>
                        Đảm bảo tên, mã sinh viên và trường hiện rõ trên ảnh.
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </div>
    </div>
  );
};

export default StudentVerificationPage;
