import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';
import { CourseDetailDTO } from '../../data/courseDTOs';
import walletService from '../../services/walletService';
import { purchaseCourseWithWallet } from '../../services/courseService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PurchaseCourseModal.css';

interface PurchaseCourseModalProps {
  course: CourseDetailDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const PurchaseCourseModal: React.FC<PurchaseCourseModalProps> = ({ course, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const wallet = await walletService.getMyWallet();
      setBalance(wallet.cashBalance);
    } catch (err) {
      console.error('Failed to load wallet', err);
      setError('Failed to load wallet balance');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) return;
    setPurchasing(true);
    setError(null);

    try {
      await purchaseCourseWithWallet({
        courseId: course.id,
        // couponCode: '' // Add coupon support later if needed
      });
      showSuccess('Success', 'Course purchased successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Purchase failed', err);
      setError(err.response?.data?.message || 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const price = course.price || 0;
  const canAfford = balance >= price;

  return (
    <div className="purchase-modal-overlay" onClick={onClose}>
      <div className="purchase-modal-content" onClick={e => e.stopPropagation()}>
        <div className="purchase-modal-header">
          <h2>
            <Lock size={20} />
            Kích hoạt Module
          </h2>
          <button className="purchase-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="purchase-modal-body">
          <div className="purchase-course-info">
            <img 
              src={course.thumbnailUrl || '/images/default-course.jpg'} 
              alt={course.title} 
              className="purchase-course-thumb"
              onError={(e) => {
                e.currentTarget.src = '/images/default-course.jpg';
              }}
            />
            <div className="purchase-course-details">
              <h3>{course.title}</h3>
              <div className="purchase-course-price">
                {price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} VND`}
              </div>
            </div>
          </div>

          <div className="purchase-wallet-section">
            <div className="purchase-wallet-header">
              <span className="purchase-wallet-title">Số dư ví của bạn</span>
              <Wallet size={20} className="text-secondary" />
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cockpit-detail-text-secondary)' }}>
                <Loader2 size={16} className="animate-spin" /> Đang tải số dư...
              </div>
            ) : (
              <div className={`purchase-wallet-balance ${!canAfford ? 'insufficient' : ''}`}>
                {balance.toLocaleString('vi-VN')} VND
              </div>
            )}
            
            <div className="purchase-summary">
              <div className="purchase-row">
                <span>Giá khóa học</span>
                <span>{price.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="purchase-row total">
                <span>Số dư còn lại</span>
                <span>{(balance - price).toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="purchase-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="purchase-modal-footer">
          <button 
            className="purchase-btn purchase-btn-primary"
            disabled={loading || purchasing || !canAfford}
            onClick={handlePurchase}
          >
            {purchasing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                {canAfford ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {canAfford ? 'Xác nhận thanh toán' : 'Số dư không đủ'}
              </>
            )}
          </button>
          {!canAfford && !loading && (
             <div className="purchase-deposit-hint">
               Vui lòng nạp thêm tiền vào ví để tiếp tục.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseCourseModal;
