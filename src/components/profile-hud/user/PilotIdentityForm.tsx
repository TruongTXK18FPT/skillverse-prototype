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
      <h2 className="pilot-section-title">IDENTITY MODULE</h2>
      
      <div className="pilot-form-grid">
        <div className="pilot-input-group">
          <label className="pilot-label">FULL NAME</label>
          <input 
            type="text" 
            className="pilot-input" 
            value={data.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="ENTER NAME"
          />
        </div>

        <div className="pilot-input-group">
          <label className="pilot-label">COMM LINK (PHONE)</label>
          <input 
            type="text" 
            className="pilot-input" 
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="ENTER FREQUENCY"
          />
        </div>

        <div className="pilot-input-group" style={{ gridColumn: '1 / -1' }}>
          <label className="pilot-label">BASE LOCATION</label>
          <input 
            type="text" 
            className="pilot-input" 
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="ENTER COORDINATES"
          />
        </div>

        <div className="pilot-input-group" style={{ gridColumn: '1 / -1' }}>
          <label className="pilot-label">BIO / LOGS</label>
          <textarea 
            className="pilot-textarea" 
            value={data.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            placeholder="ENTER PERSONAL LOG..."
          />
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button className="pilot-btn pilot-btn-secondary" onClick={onCancel} disabled={loading}>
          CANCEL
        </button>
        <button className="pilot-btn" onClick={onSave} disabled={loading}>
          {loading ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </div>
    </div>
  );
};

export default PilotIdentityForm;
