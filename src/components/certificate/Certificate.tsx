import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, Download, ExternalLink, Share2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CertificateTemplate from './CertificateTemplate';
import { CertificateDTO } from '../../data/certificateDTOs';
import { getMyCertificateById } from '../../services/certificateService';
import {
  buildCertificateShareText,
  buildCertificateVerificationPath,
  buildCertificateVerificationUrl,
  buildCriteriaSummary,
  formatCertificateDate,
  getCertificateDisplayName,
  getCertificateTypeLabel,
  INTERNAL_CERTIFICATE_DISCLAIMER,
  INTERNAL_CERTIFICATE_ISSUER,
} from './certificatePresentation';
import '../../styles/Certificate.css';

const Certificate = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [certificate, setCertificate] = useState<CertificateDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const criteriaSummary = useMemo(() => buildCriteriaSummary(certificate), [certificate]);

  useEffect(() => {
    const certificateId = Number(id);
    if (!Number.isFinite(certificateId) || certificateId <= 0) {
      setError('Mã chứng chỉ không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getMyCertificateById(certificateId)
      .then(setCertificate)
      .catch((requestError) => {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'Không thể tải dữ liệu chứng chỉ.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const verificationPath = certificate?.serial
    ? buildCertificateVerificationPath(certificate.serial)
    : null;
  const verificationUrl = certificate?.serial
    ? buildCertificateVerificationUrl(certificate.serial)
    : null;
  const recipientName = getCertificateDisplayName(certificate?.recipientName, 'Học viên Skillverse');
  const instructorName = getCertificateDisplayName(certificate?.instructorName, 'Giảng viên Skillverse');

  const handleDownloadCertificate = () => {
    if (!certificate || certificate.revokedAt) return;
    window.print();
  };

  const handleShareCertificate = async () => {
    if (!certificate) return;

    const shareText = buildCertificateShareText(certificate);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Chứng chỉ khóa học - ${certificate.courseTitle}`,
          text: shareText,
          url: buildCertificateVerificationUrl(certificate.serial),
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
    } catch {
      // Swallow aborted share/copy interactions to keep the page stable.
    }
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

  const handleOpenPublicVerification = () => {
    if (!verificationPath) return;
    window.open(verificationPath, '_blank', 'noopener,noreferrer');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <div className="certificate-container">
      <div className="certificate-header">
        <div className="certificate-header__left">
          <button
            className="certificate-btn certificate-btn--back"
            onClick={handleGoBack}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>

        <div className="certificate-header__center">
          <h1 className="certificate-header__title">Chứng chỉ hoàn thành khóa học</h1>
          <p className="certificate-header__subtitle">
            Xem chứng chỉ, tải xuống và chia sẻ liên kết xác thực công khai khi cần gửi cho người khác.
          </p>
        </div>
      </div>

      {loading && (
        <div className="certificate-loading-state">
          <p>Đang tải chứng chỉ...</p>
        </div>
      )}

      {!loading && error && (
        <div className="certificate-error-state">
          <TriangleAlert size={28} />
          <h2>Không thể tải chứng chỉ</h2>
          <p>{error}</p>
        </div>
      )}

      {!loading && certificate && (
        <div className="certificate-content">
          {certificate.revokedAt && (
            <div className="certificate-revoked-banner">
              <TriangleAlert size={18} />
              <span>
                Chứng chỉ này đã bị thu hồi vào {formatCertificateDate(certificate.revokedAt)}.
              </span>
            </div>
          )}

          <div className="certificate-primary-grid">
            <div className="certificate-template-shell">
              <CertificateTemplate
                recipientName={recipientName}
                courseName={certificate.courseTitle || 'Khóa học chưa đặt tên'}
                instructorName={instructorName}
                issuerName={certificate.issuerName || INTERNAL_CERTIFICATE_ISSUER}
                date={formatCertificateDate(certificate.issuedAt)}
                certificateId={certificate.serial}
                signatureUrl={certificate.instructorSignatureUrl}
              />
            </div>

            <aside className="certificate-action-panel">
              <span className="certificate-action-panel__eyebrow">Chia sẻ và xác thực</span>
              <h2 className="certificate-action-panel__title">
                Dùng liên kết công khai khi gửi chứng chỉ ra ngoài
              </h2>
              <p className="certificate-action-panel__body">
                Trang này chỉ dành cho chính bạn khi đã đăng nhập. Khi cần gửi cho nhà tuyển dụng
                hoặc người kiểm tra, hãy dùng nút sao chép hoặc mở trang xác thực công khai theo mã chứng chỉ.
              </p>

              <div className="certificate-actions">
                <button
                  className="certificate-btn certificate-btn--outline"
                  onClick={handleShareCertificate}
                  disabled={!certificate}
                >
                  <Share2 size={16} />
                  Chia sẻ chứng chỉ
                </button>
                <button
                  className="certificate-btn certificate-btn--primary"
                  onClick={handleCopyVerificationLink}
                  disabled={!verificationUrl}
                >
                  <Copy size={16} />
                  Sao chép link công khai
                </button>
                <button
                  className="certificate-btn certificate-btn--outline"
                  onClick={handleDownloadCertificate}
                  disabled={!certificate || Boolean(certificate?.revokedAt)}
                >
                  <Download size={16} />
                  Tải xuống
                </button>
                <button
                  className="certificate-btn certificate-btn--ghost"
                  onClick={handleOpenPublicVerification}
                  disabled={!verificationPath}
                >
                  <ExternalLink size={16} />
                  Mở trang công khai
                </button>
              </div>

              <div className="certificate-facts-list">
                <div className="certificate-fact-item">
                  <span>Mã chứng chỉ</span>
                  <strong>{certificate.serial}</strong>
                </div>
                <div className="certificate-fact-item">
                  <span>Ngày cấp</span>
                  <strong>{formatCertificateDate(certificate.issuedAt)}</strong>
                </div>
                <div className="certificate-fact-item">
                  <span>Loại</span>
                  <strong>{getCertificateTypeLabel(certificate.type)}</strong>
                </div>
              </div>
            </aside>
          </div>

          <section className="certificate-data-panel">
            <div className="certificate-panel-header">
              <ShieldCheck size={18} />
              <span>Thông tin chứng chỉ</span>
            </div>

            <div className="certificate-meta-grid">
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
                <span className="certificate-meta-label">Đơn vị phát hành</span>
                <strong>{certificate.issuerName || INTERNAL_CERTIFICATE_ISSUER}</strong>
              </article>
            </div>

            {criteriaSummary && (
              <div className="certificate-criteria-card">
                <h3>Tiêu chí tại thời điểm cấp</h3>
                <ul>
                  {criteriaSummary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="certificate-disclaimer-card">
              <h3>Lưu ý sử dụng</h3>
              <p>{INTERNAL_CERTIFICATE_DISCLAIMER}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Certificate;
