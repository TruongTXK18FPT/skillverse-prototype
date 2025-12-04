import React from 'react';
import './rank-styles.css';

interface ClearanceHeaderProps {
  title?: string;
  subtitle?: string;
}

const ClearanceHeader: React.FC<ClearanceHeaderProps> = ({
  title = 'CẤP ĐỘ TRUY CẬP',
  subtitle = 'NÂNG CẤP GIẤY PHÉP ĐỂ TRUY CẬP CÁC KHU VỰC HẠN CHẾ'
}) => {
  return (
    <div className="clearance-header">
      <div className="clearance-header-content">
        <div>
          <h1 className="clearance-title">
            {title}
          </h1>
          <p className="clearance-subtitle">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClearanceHeader;
