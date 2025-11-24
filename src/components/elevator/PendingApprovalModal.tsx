import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, Mail, X } from 'lucide-react';
import './PendingApprovalModal.css';

interface PendingApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'mentor' | 'business';
  email: string;
}

const PendingApprovalModal: React.FC<PendingApprovalModalProps> = ({
  isOpen,
  onClose,
  userType,
  email
}) => {
  const getMessage = () => {
    if (userType === 'mentor') {
      return {
        title: 'Đơn Đăng Ký Mentor Đang Chờ Duyệt',
        description: 'Đơn đăng ký mentor của bạn đã được gửi thành công và đang chờ admin xem xét.',
        icon: <Clock size={48} className="pending-icon" />
      };
    } else {
      return {
        title: 'Đơn Đăng Ký Doanh Nghiệp Đang Chờ Duyệt',
        description: 'Đơn đăng ký doanh nghiệp của bạn đã được gửi thành công và đang chờ admin xem xét.',
        icon: <Clock size={48} className="pending-icon" />
      };
    }
  };

  const message = getMessage();

  // Portal content to document.body
  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="pending-approval-modal-root">
          {/* Backdrop */}
          <motion.div
            className="pending-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container Wrapper for centering */}
          <div className="pending-modal-wrapper">
            {/* Modal */}
            <motion.div
              className="pending-modal-container"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Close Button */}
              <button className="pending-modal-close" onClick={onClose}>
                <X size={20} />
              </button>

              {/* Content */}
              <div className="pending-modal-content">
                {/* Icon */}
                <div className="pending-modal-icon">
                  {message.icon}
                  <div className="pending-icon-pulse" />
                </div>

                {/* Title */}
                <h2 className="pending-modal-title">{message.title}</h2>

                {/* Description */}
                <p className="pending-modal-description">{message.description}</p>

                {/* Info Box */}
                <div className="pending-modal-info">
                  <AlertCircle size={16} />
                  <div>
                    <p className="pending-info-title">Thời gian xử lý</p>
                    <p className="pending-info-text">
                      Quá trình xét duyệt thường mất từ 1-3 ngày làm việc. 
                      Chúng tôi sẽ gửi email thông báo kết quả đến địa chỉ:
                    </p>
                    <p className="pending-info-email">
                      <Mail size={14} />
                      {email}
                    </p>
                  </div>
                </div>

                {/* Steps */}
                <div className="pending-modal-steps">
                  <div className="pending-step pending-step-active">
                    <div className="pending-step-number">1</div>
                    <div className="pending-step-content">
                      <p className="pending-step-title">Đơn đã được gửi</p>
                      <p className="pending-step-text">Hoàn thành</p>
                    </div>
                  </div>
                  <div className="pending-step-line" />
                  <div className="pending-step pending-step-current">
                    <div className="pending-step-number">2</div>
                    <div className="pending-step-content">
                      <p className="pending-step-title">Chờ admin xét duyệt</p>
                      <p className="pending-step-text">Đang xử lý...</p>
                    </div>
                  </div>
                  <div className="pending-step-line" />
                  <div className="pending-step">
                    <div className="pending-step-number">3</div>
                    <div className="pending-step-content">
                      <p className="pending-step-title">Kích hoạt tài khoản</p>
                      <p className="pending-step-text">Chờ xét duyệt</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button className="pending-modal-button" onClick={onClose}>
                  Đã hiểu
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PendingApprovalModal;
