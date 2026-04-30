import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, CheckCircle, FileText, X, Clock, Mail } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { uploadMentorCccd } from '../../services/identityService';
import './MissingCccdModal.css';

interface MissingCccdModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onLogout: () => void;
}

const MissingCccdModal: React.FC<MissingCccdModalProps> = ({ isOpen, onSuccess, onLogout }) => {
  const [cccdFront, setCccdFront] = useState<File | null>(null);
  const [cccdBack, setCccdBack] = useState<File | null>(null);
  const [cccdFrontPreview, setCccdFrontPreview] = useState<string | null>(null);
  const [cccdBackPreview, setCccdBackPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cccdFront) {
      const url = URL.createObjectURL(cccdFront);
      setCccdFrontPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCccdFrontPreview(null);
    }
  }, [cccdFront]);

  useEffect(() => {
    if (cccdBack) {
      const url = URL.createObjectURL(cccdBack);
      setCccdBackPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCccdBackPreview(null);
    }
  }, [cccdBack]);

  if (!isOpen) return null;

  const handleCccdFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.includes('image')) {
      setCccdFront(file);
      setError(null);
    }
  };

  const handleCccdBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.includes('image')) {
      setCccdBack(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!cccdFront || !cccdBack) {
      setError('Vui lòng tải lên đầy đủ ảnh 2 mặt CCCD.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await uploadMentorCccd(cccdFront, cccdBack);
      setIsLoading(false);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải lên CCCD. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="missing-cccd-modal-overlay">
        <motion.div
          className="missing-cccd-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {isSubmitted ? (
            /* ===== SUCCESS / WAITING FOR ADMIN SCREEN ===== */
            <>
              <div className="missing-cccd-modal-header" style={{ borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="missing-cccd-modal-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  <CheckCircle size={24} />
                </div>
                <h2 className="missing-cccd-modal-title">Hồ Sơ Đã Được Gửi</h2>
              </div>
              <div className="missing-cccd-modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: 72, height: 72,
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.1)',
                  border: '2px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <Clock size={36} style={{ color: '#10b981' }} />
                </div>
                <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.25rem' }}>
                  Đang Chờ Admin Kiểm Duyệt
                </h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  Hệ thống đã nhận thông tin CCCD của bạn và đang xử lý trích xuất.
                  AI sẽ phân tích thông tin và gửi kết quả cho Admin kiểm duyệt.
                </p>
                <div style={{
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  textAlign: 'left', marginBottom: '1.5rem'
                }}>
                  <Mail size={18} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: '#bfdbfe', display: 'block', marginBottom: 4 }}>
                      Bạn sẽ nhận được email thông báo
                    </strong>
                    <span style={{ color: '#93c5fd', fontSize: '0.875rem' }}>
                      Khi Admin phê duyệt, hệ thống sẽ gửi email xác nhận đến hộp thư của bạn
                      và tài khoản Mentor sẽ được kích hoạt đầy đủ. Vui lòng đăng nhập lại khi nhận được email.
                    </span>
                  </div>
                </div>
                <button
                  className="missing-cccd-btn missing-cccd-btn-cancel"
                  onClick={onLogout}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Đăng xuất tạm thời
                </button>
              </div>
            </>
          ) : (
            /* ===== UPLOAD FORM ===== */
            <>
          <div className="missing-cccd-modal-header">
            <div className="missing-cccd-modal-icon">
              <AlertTriangle size={24} />
            </div>
            <h2 className="missing-cccd-modal-title">Yêu Cầu Xác Thực Danh Tính</h2>
          </div>

          <div className="missing-cccd-modal-body">
            <p>
              Theo quy định mới, tất cả Mentor cần cung cấp thông tin Căn Cước Công Dân (CCCD) để tiếp tục sử dụng hệ thống. 
              Điều này giúp đảm bảo môi trường an toàn và minh bạch cho học viên.
            </p>

            {error && (
              <div className="missing-cccd-error">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="missing-cccd-upload-area">
              {/* Front CCCD */}
              <div className="missing-cccd-file-upload">
                <input
                  type="file"
                  id="modal-cccd-front"
                  accept="image/*"
                  onChange={handleCccdFrontUpload}
                  disabled={isLoading}
                  className="missing-cccd-file-input"
                />
                <label htmlFor="modal-cccd-front" className={`missing-cccd-file-label ${cccdFront ? 'has-file' : ''}`}>
                  {cccdFrontPreview ? (
                    <div className="missing-cccd-preview-container">
                      <img src={cccdFrontPreview} alt="Mặt trước" className="missing-cccd-preview-img" />
                      <div className="missing-cccd-preview-overlay">
                        <CheckCircle className="missing-cccd-file-icon" size={24} />
                        <span className="missing-cccd-file-name">{cccdFront?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="missing-cccd-file-icon" size={24} />
                      <span className="missing-cccd-file-text">Mặt Trước CCCD</span>
                      <span className="missing-cccd-file-hint">Nhấn để chọn ảnh</span>
                    </>
                  )}
                </label>
              </div>

              {/* Back CCCD */}
              <div className="missing-cccd-file-upload">
                <input
                  type="file"
                  id="modal-cccd-back"
                  accept="image/*"
                  onChange={handleCccdBackUpload}
                  disabled={isLoading}
                  className="missing-cccd-file-input"
                />
                <label htmlFor="modal-cccd-back" className={`missing-cccd-file-label ${cccdBack ? 'has-file' : ''}`}>
                  {cccdBackPreview ? (
                    <div className="missing-cccd-preview-container">
                      <img src={cccdBackPreview} alt="Mặt sau" className="missing-cccd-preview-img" />
                      <div className="missing-cccd-preview-overlay">
                        <CheckCircle className="missing-cccd-file-icon" size={24} />
                        <span className="missing-cccd-file-name">{cccdBack?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="missing-cccd-file-icon" size={24} />
                      <span className="missing-cccd-file-text">Mặt Sau CCCD</span>
                      <span className="missing-cccd-file-hint">Nhấn để chọn ảnh</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="missing-cccd-modal-footer">
            <button 
              className="missing-cccd-btn missing-cccd-btn-cancel"
              onClick={onLogout}
              disabled={isLoading}
            >
              Đăng xuất
            </button>
            <button 
              className="missing-cccd-btn missing-cccd-btn-submit"
              onClick={handleSubmit}
              disabled={isLoading || !cccdFront || !cccdBack}
            >
              {isLoading ? (
                <>
                  <MeowlKuruLoader size="tiny" text="" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi xác thực</span>
              )}
            </button>
          </div>
          </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MissingCccdModal;
