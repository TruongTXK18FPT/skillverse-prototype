import React from 'react';
import { Radio, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface CommsHeaderProps {
  title?: string;
  subtitle?: string;
  onBroadcast?: () => void;
}

const CommsHeader: React.FC<CommsHeaderProps> = ({
  title = 'Kênh Cộng Đồng',
  subtitle = 'Mã hóa: Tắt // Kênh: Mở // Trạng thái: Hoạt động',
  onBroadcast,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleBroadcast = () => {
    if (onBroadcast) {
      onBroadcast();
    } else {
      navigate('/community/create');
    }
  };

  return (
    <div className="transmission-header">
      <div className="transmission-header-content">
        <h1 className="transmission-title">
          <Radio size={32} />
          {title}
        </h1>
        <p className="transmission-subtitle">{subtitle}</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="broadcast-button" onClick={handleBroadcast}>
            <Plus size={20} />
            <span>Đăng bài viết</span>
          </button>
          {isAuthenticated && (
            <button className="broadcast-button" onClick={() => navigate('/community/manage')}>
              <Settings size={20} />
              <span>Quản lý</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommsHeader;
