import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CertificateTemplate from "./CertificateTemplate";
import {
  buildCertificateVerificationUrl,
  formatCertificateDate,
  getCertificateCompletionStatement,
  getCertificateDisplayName,
  getCertificateDisclaimerText,
  getCertificateTypeLabel,
  getVerificationStatusLabel,
  INTERNAL_CERTIFICATE_DISCLAIMER,
  INTERNAL_CERTIFICATE_ISSUER,
} from "./certificatePresentation";
import { CertificateVerificationDTO } from "../../data/certificateDTOs";
import { getPublicCertificateBySerial } from "../../services/certificateService";
import "../../styles/Certificate.css";

const CertificateVerifyPage = () => {
  const navigate = useNavigate();
  const { serial } = useParams<{ serial: string }>();
  const [certificate, setCertificate] = useState<CertificateVerificationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serial) {
      setError("Mã serial chứng chỉ không hợp lệ.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getPublicCertificateBySerial(serial)
      .then(setCertificate)
      .catch((requestError) => {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Không thể xác thực chứng chỉ.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [serial]);

  const isRevoked = Boolean(certificate?.revokedAt) || certificate?.verificationStatus === "REVOKED";
  const verificationUrl = useMemo(
    () => (certificate?.serial ? buildCertificateVerificationUrl(certificate.serial) : null),
    [certificate?.serial],
  );
  const recipientName = getCertificateDisplayName(certificate?.recipientName, "Học viên Skillverse");
  const instructorName = getCertificateDisplayName(certificate?.instructorName, "Giảng viên Skillverse");

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const handleCopySerial = async () => {
    if (!certificate?.serial) return;

    try {
      await navigator.clipboard.writeText(certificate.serial);
    } catch {
      // Clipboard access can fail outside secure/browser-supported contexts.
    }
  };

  const handleCopyVerificationLink = async () => {
    if (!verificationUrl) return;

    try {
      await navigator.clipboard.writeText(verificationUrl);
    } catch {
      // Clipboard access can fail outside secure/browser-supported contexts.
    }
  };

  return (
    <div className="certificate-container">
      <div className="certificate-header">
        <div className="certificate-header__left">
          <button className="certificate-btn certificate-btn--back" onClick={handleGoBack}>
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>

        <div className="certificate-header__center">
          <h1 className="certificate-header__title">Xác thực chứng chỉ công khai</h1>
          <p className="certificate-header__subtitle">
            Trang này dành cho người khác kiểm tra tính hợp lệ của chứng chỉ bằng mã xác thực công khai.
          </p>
        </div>

        <div className="certificate-header__right">
          <div className="certificate-actions">
            <button
              className="certificate-btn certificate-btn--outline"
              onClick={handleCopyVerificationLink}
              disabled={!verificationUrl}
            >
              <ExternalLink size={16} />
              Sao chép link
            </button>
            <button
              className="certificate-btn certificate-btn--outline"
              onClick={handleCopySerial}
              disabled={!certificate?.serial}
            >
              <Copy size={16} />
              Sao chép mã
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="certificate-loading-state">
          <p>Đang xác thực chứng chỉ...</p>
        </div>
      )}

      {!loading && error && (
        <div className="certificate-error-state">
          <TriangleAlert size={28} />
          <h2>Không thể xác thực chứng chỉ</h2>
          <p>{error}</p>
        </div>
      )}

      {!loading && certificate && (
        <div className="certificate-content">
          <div
            className={`certificate-status-banner ${
              isRevoked
                ? "certificate-status-banner--revoked"
                : "certificate-status-banner--valid"
            }`}
          >
            {isRevoked ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
            <span>
              Trạng thái xác thực: <strong>{getVerificationStatusLabel(certificate)}</strong>
            </span>
          </div>

          <div className="certificate-template-shell">
            <CertificateTemplate
              recipientName={recipientName}
              courseName={certificate.courseTitle || "Khóa học chưa đặt tên"}
              instructorName={instructorName}
              issuerName={certificate.issuerName || INTERNAL_CERTIFICATE_ISSUER}
              date={formatCertificateDate(certificate.issuedAt)}
              certificateId={certificate.serial}
              signatureUrl={certificate.instructorSignatureUrl}
            />
          </div>

          <section className="certificate-data-panel">
            <div className="certificate-panel-header">
              <ShieldCheck size={18} />
              <span>Thông tin xác thực công khai</span>
            </div>

            <div className="certificate-overview-grid">
              <article className="certificate-overview-card certificate-overview-card--status">
                <span className="certificate-overview-label">Kết quả xác thực</span>
                <strong>{getVerificationStatusLabel(certificate)}</strong>
                <p>
                  {isRevoked
                    ? "Chứng chỉ đã bị thu hồi. Hãy dùng trạng thái trên trang này làm căn cứ xác minh."
                    : "Chứng chỉ hiện hợp lệ tại thời điểm kiểm tra và có thể dùng để đối chiếu thông tin hoàn thành khóa học."}
                </p>
              </article>
            </div>

            <div className="certificate-meta-grid">
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Trạng thái</span>
                <strong>{getVerificationStatusLabel(certificate)}</strong>
              </article>
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Đơn vị phát hành</span>
                <strong>{certificate.issuerName || INTERNAL_CERTIFICATE_ISSUER}</strong>
              </article>
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Người nhận</span>
                <strong>{recipientName}</strong>
              </article>
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Khóa học</span>
                <strong>{certificate.courseTitle}</strong>
              </article>
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Người tạo / hướng dẫn khóa học</span>
                <strong>{instructorName}</strong>
              </article>
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Mã chứng chỉ</span>
                <div className="certificate-meta-card__value-row">
                  <strong>{certificate.serial}</strong>
                  <button
                    type="button"
                    className="certificate-inline-link"
                    onClick={handleCopySerial}
                  >
                    Sao chép mã
                  </button>
                </div>
              </article>
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Ngày cấp</span>
                <strong>{formatCertificateDate(certificate.issuedAt)}</strong>
              </article>
              <article className="certificate-meta-card">
                <span className="certificate-meta-label">Loại</span>
                <strong>{getCertificateTypeLabel(certificate.type)}</strong>
              </article>
              {certificate.revokedAt && (
                <article className="certificate-meta-card">
                  <span className="certificate-meta-label">Ngày thu hồi</span>
                  <strong>{formatCertificateDate(certificate.revokedAt)}</strong>
                </article>
              )}
            </div>

            <div className="certificate-disclaimer-card">
              <h3>Kết luận xác thực</h3>
              <p>{getCertificateCompletionStatement(certificate.completionStatement)}</p>
              {verificationUrl && (
                <div className="certificate-inline-actions">
                  <button
                    type="button"
                    className="certificate-btn certificate-btn--outline certificate-btn--compact"
                    onClick={handleCopyVerificationLink}
                  >
                    <Copy size={15} />
                    Sao chép liên kết xác thực
                  </button>
                  <a
                    className="certificate-verify-link"
                    href={verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} />
                    Mở ở tab mới
                  </a>
                </div>
              )}
            </div>

            <div className="certificate-disclaimer-card">
              <h3>Lưu ý</h3>
              <p>{getCertificateDisclaimerText(certificate.disclaimer || INTERNAL_CERTIFICATE_DISCLAIMER)}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CertificateVerifyPage;
