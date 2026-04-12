import React from 'react';
import './pilot-styles.css';

interface PilotIdentityFormProps {
  data: {
    fullName: string;
    phone: string;
    address: string;
    bio: string;
  };
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const PilotIdentityForm: React.FC<PilotIdentityFormProps> = ({ 
  data, 
  onChange, 
  onSave, 
  onCancel, 
  loading 
}) => {
  return (
    <div className="pilot-section">
      <h2 className="pilot-section-title">CHỈNH SỬA HỒ SƠ CÁ NHÂN</h2>
      
      <div className="pilot-form-grid">
        <div className="pilot-input-group">
          <label className="pilot-label">HỌ VÀ TÊN</label>
          <input 
            type="text" 
            className="pilot-input" 
            value={data.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="NHẬP HỌ VÀ TÊN"
          />
        </div>

        <div className="pilot-input-group">
          <label className="pilot-label">SỐ ĐIỆN THOẠI</label>
          <input 
            type="text" 
            className="pilot-input" 
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="NHẬP SỐ ĐIỆN THOẠI"
          />
        </div>

        <div className="pilot-input-group" style={{ gridColumn: '1 / -1' }}>
          <label className="pilot-label">ĐỊA CHỈ</label>
          <input 
            type="text" 
            className="pilot-input" 
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="NHẬP ĐỊA CHỈ"
          />
        </div>

        <div className="pilot-input-group" style={{ gridColumn: '1 / -1' }}>
          <label className="pilot-label">BIO</label>
          <textarea 
            className="pilot-textarea" 
            value={data.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            placeholder="NHẬP BIO..."
          />
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button className="pilot-btn pilot-btn-secondary" onClick={onCancel} disabled={loading}>
          HỦY CHỈNH SỬA
        </button>
        <button className="pilot-btn" onClick={onSave} disabled={loading}>
          {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
        </button>
      </div>
    </div>
  );
};

export default PilotIdentityForm;
