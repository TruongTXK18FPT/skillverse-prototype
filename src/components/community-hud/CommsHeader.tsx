import React from 'react';
import { Radio, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        <button className="broadcast-button" onClick={handleBroadcast}>
          <Plus size={20} />
          <span>Đăng bài viết</span>
        </button>
      </div>
    </div>
  );
};

export default CommsHeader;
