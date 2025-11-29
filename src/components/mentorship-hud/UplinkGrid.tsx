import React from 'react';
import { User } from 'lucide-react';
import './uplink-styles.css';

interface UplinkGridProps {
  loading: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}

const UplinkGrid: React.FC<UplinkGridProps> = ({ loading, isEmpty, children }) => {
  if (loading) {
    return (
      <div className="uplink-loading">
        <div className="uplink-spinner"></div>
        <p className="uplink-loading-text">Đang tải danh sách mentor...</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="uplink-empty">
        <User className="uplink-empty-icon" size={64} />
        <h3 className="uplink-empty-title">Không tìm thấy mentor</h3>
        <p className="uplink-empty-text">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
      </div>
    );
  }

  return <div className="uplink-grid">{children}</div>;
};

export default UplinkGrid;
