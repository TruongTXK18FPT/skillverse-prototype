import React from 'react';
import CertificateTemplate from '../components/certificate/CertificateTemplate';
import logoSkillverse from '../assets/LogoProject.svg'; 

const CertificateDemoPage: React.FC = () => {
  const mockData = {
    recipientName: "Tran Pham Bach Cat",
    courseName: "Advanced React & Holographic UI Design",
    instructorName: "Sarah Connor",
    date: "December 05, 2025",
    certificateId: "SKV-8888-ALPHA",
    logoUrl: logoSkillverse 
  };

  return (
    <CertificateTemplate
      recipientName={mockData.recipientName}
      courseName={mockData.courseName}
      instructorName={mockData.instructorName}
      date={mockData.date}
      certificateId={mockData.certificateId}
      logoUrl={mockData.logoUrl}
    />
  );
};

export default CertificateDemoPage;