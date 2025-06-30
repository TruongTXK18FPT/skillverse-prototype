import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import Toast from '../../components/Toast';
import { usePaymentToast } from '../../utils/useToast';
import '../../styles/PaymentPage.css';

interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  description: string;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use the payment toast hook
  const { toast, showSuccess, hideToast } = usePaymentToast();
  
  // Get payment details from navigation state
  const paymentData = location.state ?? {
    type: 'course',
    title: 'React.js Advanced Course',
    price: 690000,
    instructor: 'John Smith'
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'momo',
      name: 'MoMo',
      logo: 'https://pay2s.vn/blog/wp-content/uploads/2024/11/momo_icon_circle_pinkbg_RGB.png',
      description: 'Thanh toán qua ví điện tử MoMo'
    },
    {
      id: 'payos',
      name: 'PayOS',
      logo: 'https://payos.vn/docs/img/logo.svg',
      description: 'Thanh toán qua PayOS'
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      logo: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png',      description: 'Thanh toán qua VNPay'
    }
  ];
  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing (always successful for mock API)
    setTimeout(() => {
      setIsProcessing(false);
      
      const successMessage = paymentData.type === 'premium' 
        ? `Chúc mừng! Bạn đã nâng cấp thành công lên "${paymentData.title}". Tài khoản Premium của bạn đã được kích hoạt.`
        : `Cảm ơn bạn đã thanh toán cho "${paymentData.title}". Đơn hàng của bạn đã được xử lý thành công.`;
        
      const buttonText = paymentData.type === 'premium' 
        ? "Trải nghiệm Premium ngay"
        : "Về trang chủ ngay";
        
      const redirectPath = paymentData.type === 'premium' ? '/gamification' : '/';
      
      showSuccess(
        "Thanh toán thành công!",
        successMessage,
        {
          text: buttonText,
          onClick: () => navigate(redirectPath)
        }
      );
    }, 2000);
  };

  const handleCloseToast = () => {
    hideToast();
    navigate('/'); // Navigate to home when toast is closed
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="payment-container">
      <div className="payment-content">
        {/* Header */}
        <div className="payment-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1 className="payment-title">Thanh Toán</h1>
        </div>

        <div className="payment-layout">
          {/* Order Summary */}
          <div className="order-summary">
            <h2 className="section-title">Chi Tiết Đơn Hàng</h2>
            <div className="order-item">
              <div className="item-info">
                <h3 className="item-title">{paymentData.title}</h3>
                {paymentData.description && (
                  <p className="item-description">{paymentData.description}</p>
                )}
                {paymentData.instructor && (
                  <p className="item-instructor">Giảng viên: {paymentData.instructor}</p>
                )}
                {paymentData.conversion && (
                  <p className="item-conversion">{paymentData.conversion}</p>
                )}
                {paymentData.billingCycle && (
                  <p className="item-billing">Chu kỳ: {paymentData.billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}</p>
                )}
                <p className="item-type">
                  {(() => {
                    if (paymentData.type === 'premium') return paymentData.isStudent ? 'Gói Student Pack' : 'Gói Premium';
                    if (paymentData.type === 'course') return 'Khóa học';
                    if (paymentData.type === 'coins') return 'Gói SkillCoin';
                    return 'Buổi hướng dẫn';
                  })()}
                </p>
                {paymentData.coins && (
                  <div className="coin-details">
                    <p>Số xu: {paymentData.coins.toLocaleString()}</p>
                    {paymentData.bonus > 0 && (
                      <p className="bonus-info">Thưởng: +{paymentData.bonus} xu</p>
                    )}
                  </div>
                )}
                {paymentData.features && (
                  <div className="premium-features-summary">
                    <h4>Tính năng bao gồm:</h4>
                    <ul>
                      {paymentData.features.slice(0, 3).map((feature: string, index: number) => (
                        <li key={`feature-${index}-${feature.substring(0, 10)}`}>{feature}</li>
                      ))}
                      {paymentData.features.length > 3 && (
                        <li key="more-features">+ {paymentData.features.length - 3} tính năng khác...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="item-price">
                {paymentData.originalPrice && paymentData.discount > 0 && (
                  <div className="original-price-payment">
                    <span className="crossed-price">{formatPrice(paymentData.originalPrice)}</span>
                    <span className="discount-badge">-{paymentData.discount}%</span>
                  </div>
                )}
                {formatPrice(paymentData.price)}
                {paymentData.billingCycle && (
                  <span className="price-period">/{paymentData.billingCycle === 'monthly' ? 'tháng' : 'năm'}</span>
                )}
              </div>
            </div>
            
            <div className="order-total">
              <div className="total-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(paymentData.price)}</span>
              </div>
              <div className="total-row">
                <span>Thuế VAT (10%):</span>
                <span>{formatPrice(paymentData.price * 0.1)}</span>
              </div>
              <div className="total-row final-total">
                <span>Tổng cộng:</span>
                <span>{formatPrice(paymentData.price * 1.1)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="payment-methods">
            <h2 className="section-title">Phương Thức Thanh Toán</h2>
            
            <div className="methods-grid">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={`payment-method ${selectedMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="method-logo">
                    <img src={method.logo} alt={method.name} />
                  </div>
                  <div className="method-info">
                    <h3 className="method-name">{method.name}</h3>
                    <p className="method-description">{method.description}</p>
                  </div>
                  <div className="method-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Security Notice */}
            <div className="security-notice">
              <Shield className="security-icon" />
              <div className="security-text">
                <h4>Thanh toán an toàn</h4>
                <p>Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối</p>
              </div>
            </div>

            {/* Payment Button */}
            <button
              className={`payment-button ${!selectedMethod ? 'disabled' : ''}`}
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing}
            >
              {isProcessing ? (
                <div className="processing">
                  <div className="spinner"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <>
                  <CreditCard size={20} />
                  <span>Thanh Toán {formatPrice(paymentData.price * 1.1)}</span>
                </>              )}
            </button>
          </div>
        </div>
      </div>      {/* Success Toast */}
      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={handleCloseToast}
        autoCloseDelay={5}
        showCountdown={true}
        countdownText="Chuyển về trang chủ trong {countdown} giây..."
        actionButton={toast.actionButton}
      />
    </div>
  );
};

export default PaymentPage;