import React from 'react';
import './certificate-styles.css';
import logo from '../../assets/LogoProject.svg'; // Fallback logo

interface CertificateProps {
  recipientName: string;
  courseName: string;
  instructorName: string;
  date: string;
  certificateId: string;
  logoUrl?: string;
}

const CertificateTemplate: React.FC<CertificateProps> = ({
  recipientName,
  courseName,
  instructorName,
  date,
  certificateId,
  logoUrl
}) => {
  return (
    <div className="cert-wrapper">
      <div className="cert-paper">
        
        {/* ================= LEFT COLUMN: MAIN CONTENT (75%) ================= */}
        <div className="cert-left-content">
          
          {/* Header chứa Logo (Logo sẽ "trôi" ở đây) */}
          <div className="cert-header-container">
             <img src={logoUrl || logo} alt="Organization Logo" className="cert-big-logo" />
          </div>

          {/* Body Text */}
          <div className="cert-body">
            <span className="cert-date">{date}</span>
            
            <h2 className="cert-recipient">{recipientName}</h2>
            
            <p className="cert-statement">
              has successfully completed the online, non-credit course
            </p>
            
            <h3 className="cert-course-name">{courseName}</h3>
            
            <p className="cert-description">
              authorized by <strong>Skillverse Academy</strong> and offered through the Skillverse Platform.
            </p>
          </div>

          {/* Footer Signature & Verification */}
          <div className="cert-footer">
            <div className="cert-signature-block">
              <div className="cert-signature-script">Cmdr. {instructorName}</div>
              <div className="cert-signature-line"></div>
              <div className="cert-instructor-info">
                <strong>{instructorName}</strong><br/>
                Senior Commander, Skillverse Academy
              </div>
            </div>
            
            <div className="cert-verify-block">
              <span className="cert-verify-label">Verify at skillverse.io/verify/{certificateId}</span>
              <span className="cert-verify-sub">Skillverse has confirmed the identity of this individual and their participation in the course.</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: GREY RIBBON (25%) ================= */}
        <div className="cert-right-ribbon">
          <div className="cert-ribbon-content">
            <h4 className="cert-ribbon-title">
              COURSE<br/>CERTIFICATE
            </h4>
            
            {/* The Seal / Badge */}
            <div className="cert-seal-container">
               <div className="cert-seal-border">
                 <div className="cert-seal-inner">
                    <img src={logoUrl || logo} alt="Seal" className="cert-seal-img" />
                 </div>
               </div>
               {/* Decorative text around seal */}
               <svg className="cert-seal-text-path" viewBox="0 0 100 100" width="140" height="140">
                  <path id="curve" d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0" fill="transparent"/>
                  <text width="500">
                    <textPath xlinkHref="#curve" className="cert-seal-svg-text">
                      EDUCATION FOR EVERYONE • SKILLVERSE •
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