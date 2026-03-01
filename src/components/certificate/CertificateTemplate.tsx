import React, { useEffect, useState } from 'react';
import './certificate-styles.css';
import logo from '../../assets/brand/LogoProject.svg'; // Fallback logo

interface CertificateProps {
  recipientName: string;
  courseName: string;
  instructorName: string;
  issuerName: string;
  date: string;
  certificateId: string;
  signatureUrl?: string | null;
  logoUrl?: string;
}

const CertificateTemplate: React.FC<CertificateProps> = ({
  recipientName,
  courseName,
  instructorName,
  issuerName,
  date,
  certificateId,
  signatureUrl,
  logoUrl
}) => {
  const [showSignatureImage, setShowSignatureImage] = useState(Boolean(signatureUrl));
  const normalizedRecipientName = recipientName.trim().replace(/\s+/g, ' ');
  const recipientWords = normalizedRecipientName.split(' ').filter(Boolean);

  const recipientLines = (() => {
    if (recipientWords.length <= 2) {
      return [normalizedRecipientName];
    }

    if (recipientWords.length === 3) {
      return [
        recipientWords.slice(0, 2).join(' '),
        recipientWords[2],
      ];
    }

    const splitIndex = Math.ceil(recipientWords.length / 2);
    return [
      recipientWords.slice(0, splitIndex).join(' '),
      recipientWords.slice(splitIndex).join(' '),
    ];
  })();

  const recipientScaleClass =
    normalizedRecipientName.length > 26
      ? 'sv-cert-template-recipient--tight'
      : normalizedRecipientName.length > 18
        ? 'sv-cert-template-recipient--compact'
        : '';

  useEffect(() => {
    setShowSignatureImage(Boolean(signatureUrl));
  }, [signatureUrl]);

  return (
    <div className="sv-cert-template-wrapper">
      <div className="sv-cert-template-paper">
        
        {/* ================= LEFT COLUMN: MAIN CONTENT (75%) ================= */}
        <div className="sv-cert-template-left-content">
          
          {/* Header chứa Logo (Logo sẽ "trôi" ở đây) */}
          <div className="sv-cert-template-header-container">
             <img
               src={logoUrl || logo}
               alt="Logo Skillverse"
               className="sv-cert-template-big-logo"
             />
          </div>

          {/* Body Text */}
          <div className="sv-cert-template-body">
            <span className="sv-cert-template-date">{date}</span>
            
            <h2 className={`sv-cert-template-recipient ${recipientScaleClass}`.trim()}>
              {recipientLines.map((line) => (
                <span key={line} className="sv-cert-template-recipient-line">
                  {line}
                </span>
              ))}
            </h2>
            
            <p className="sv-cert-template-statement">
              đã hoàn thành khóa học trực tuyến trên nền tảng Skillverse
            </p>
            
            <h3 className="sv-cert-template-course-name">{courseName}</h3>
            
            <p className="sv-cert-template-description">
              được cấp nội bộ bởi <strong>{issuerName}</strong> dựa trên dữ liệu hoàn thành khóa học đã được xác nhận trên nền tảng Skillverse.
            </p>
          </div>

            {/* Footer Signature & Verification */}
          <div className="sv-cert-template-footer">
            <div className="sv-cert-template-signature-block">
              {showSignatureImage && signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt={`Chữ ký của ${instructorName}`}
                  className="sv-cert-template-signature-image"
                  onError={() => setShowSignatureImage(false)}
                />
              ) : (
                <div className="sv-cert-template-signature-script">{issuerName}</div>
              )}
              <div className="sv-cert-template-signature-line"></div>
              <div className="sv-cert-template-instructor-info">
                <strong>{showSignatureImage && signatureUrl ? instructorName : issuerName}</strong><br/>
                {showSignatureImage && signatureUrl
                  ? "Chữ ký của người hướng dẫn được lưu theo thời điểm cấp"
                  : "Xác thực nền tảng do người hướng dẫn chưa thiết lập chữ ký riêng"}
              </div>
            </div>
            
            <div className="sv-cert-template-verify-block">
              <span className="sv-cert-template-verify-label">Đơn vị cấp: {issuerName}</span>
              <span className="sv-cert-template-verify-label">Mã xác thực: {certificateId}</span>
              <span className="sv-cert-template-verify-sub">Có thể xác thực công khai trên Skillverse bằng mã chứng chỉ ở trên.</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: GREY RIBBON (25%) ================= */}
        <div className="sv-cert-template-right-ribbon">
          <div className="sv-cert-template-ribbon-content">
            <h4 className="sv-cert-template-ribbon-title">
              CHỨNG CHỈ<br/>KHÓA HỌC
            </h4>
            
            {/* The Seal / Badge */}
            <div className="sv-cert-template-seal-container">
               <div className="sv-cert-template-seal-border">
                 <div className="sv-cert-template-seal-inner">
                     <img src={logoUrl || logo} alt="Dấu xác thực" className="sv-cert-template-seal-img" />
                  </div>
               </div>
               {/* Decorative text around seal */}
               <svg className="sv-cert-template-seal-text-path" viewBox="0 0 100 100" width="140" height="140">
                  <path id="curve" d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0" fill="transparent"/>
                  <text width="500">
                    <textPath xlinkHref="#curve" className="sv-cert-template-seal-svg-text">
                      HOC TAP CHO MOI NGUOI • SKILLVERSE •
                    </textPath>
                  </text>
               </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CertificateTemplate;
