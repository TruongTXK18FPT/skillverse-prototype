import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Lock, X, ShieldAlert, Key } from 'lucide-react';
import './AdminSecurityGateModal.css';

interface AdminSecurityGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  requiredKey?: string;
}

const AdminSecurityGateModal: React.FC<AdminSecurityGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Xác thực bảo mật",
  description = "Vui lòng nhập mã bảo mật Admin để tiếp tục hành động này.",
  requiredKey
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a slight delay for security feel (and prevent brute force speed)
    setTimeout(() => {
      const adminKey = import.meta.env.VITE_ADMIN_SECURITY_KEY;
      const targetKey = requiredKey || adminKey;
      
      if (password === targetKey) {
        setLoading(false);
        setPassword('');
        onSuccess();
      } else {
        setLoading(false);
        setError('Mã bảo mật không chính xác!');
      }
    }, 800);
  };

  return ReactDOM.createPortal(
    <div className="admin-security-modal-overlay" onClick={onClose}>
      <div className="admin-security-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-security-header">
          <h3>
            <ShieldAlert size={24} />
            {title}
          </h3>
          <button className="admin-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="admin-security-body">
          <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {description}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="admin-security-form-group">
              <label>Mã bảo mật (Security Key)</label>
              <div className="admin-security-input-wrapper">
                <Lock className="admin-security-icon" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              {error && (
                <div className="admin-security-error">
                  <ShieldAlert size={14} />
                  {error}
                </div>
              )}
            </div>

            <div className="admin-security-footer">
              <button 
                type="button" 
                className="admin-security-btn cancel" 
                onClick={onClose}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="admin-security-btn verify"
                disabled={loading || !password}
              >
                <Key size={18} />
                {loading ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  , document.body);
};

export default AdminSecurityGateModal;
