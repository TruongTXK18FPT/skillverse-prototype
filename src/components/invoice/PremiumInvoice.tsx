import React, { useRef } from 'react';
import { 
  Crown, Calendar, CreditCard, User, Mail, 
  CheckCircle, Sparkles, FileText, Building2, Phone, ArrowLeft
} from 'lucide-react';
import Logo from '../../assets/skillverse.png';
import { useScrollLock } from '../portfolio-hud/useScrollLock';
import './PremiumInvoice.css';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  
  // Customer Info
  customerName: string;
  customerEmail: string;
  customerId?: number;
  
  // Plan Details
  planName: string;
  planDisplayName: string;
  planType: string;
  planDescription?: string;
  
  // Pricing
  originalPrice: number;
  discount?: number;
  discountReason?: string;
  finalPrice: number;
  currency: string;
  
  // Subscription Period
  startDate: string;
  endDate: string;
  durationMonths: number;
  
  // Payment Info
  paymentMethod: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId?: string;
  
  // Optional
  isStudentDiscount?: boolean;
  features?: string[];
}

interface PremiumInvoiceProps {
  data: InvoiceData;
  onClose?: () => void;
}

const PremiumInvoice: React.FC<PremiumInvoiceProps> = ({ data, onClose }) => {
  useScrollLock(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: data.currency || 'VND' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getPlanIcon = () => {
    switch (data.planType) {
      case 'PREMIUM_BASIC': return <Crown className="plan-tier-icon silver" />;
      case 'PREMIUM_PLUS': return <Crown className="plan-tier-icon gold" />;
      case 'STUDENT_PACK': return <Crown className="plan-tier-icon diamond" />;
      default: return <Crown className="plan-tier-icon" />;
    }
  };

  const getPlanBadgeClass = () => {
    switch (data.planType) {
      case 'PREMIUM_BASIC': return 'badge-silver';
      case 'PREMIUM_PLUS': return 'badge-gold';
      case 'STUDENT_PACK': return 'badge-diamond';
      default: return '';
    }
  };

  return (
    <div className="invoice-overlay">
      <div className="invoice-container" ref={invoiceRef}>
        <button className="invoice-back-btn" onClick={onClose}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        {/* Background Effects */}
        <div className="invoice-bg-effects">
          <div className="invoice-grid-overlay"></div>
          <div className="invoice-glow invoice-glow-1"></div>
          <div className="invoice-glow invoice-glow-2"></div>
        </div>

        {/* Header */}
        <div className="invoice-header">
          <div className="invoice-brand">
            <img src={Logo} alt="SkillVerse" className="invoice-logo" />
            <div className="invoice-brand-info">
              <h1>SKILLVERSE</h1>
              <p>Nền tảng học tập thông minh</p>
            </div>
          </div>
          <div className="invoice-title-section">
            <div className="invoice-badge">
              <FileText size={16} />
              <span>HÓA ĐƠN ĐIỆN TỬ</span>
            </div>
            <h2 className="invoice-number">#{data.invoiceNumber}</h2>
            <p className="invoice-date">
              <Calendar size={14} />
              Ngày: {formatDate(data.invoiceDate)}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`invoice-status-banner ${data.paymentStatus.toLowerCase()}`}>
          <CheckCircle size={20} />
          <span>
            {data.paymentStatus === 'SUCCESS' && 'Thanh toán thành công'}
            {data.paymentStatus === 'PENDING' && 'Đang xử lý'}
            {data.paymentStatus === 'FAILED' && 'Thanh toán thất bại'}
          </span>
        </div>

        {/* Main Content */}
        <div className="invoice-content">
          {/* Customer & Company Info */}
          <div className="invoice-parties">
            <div className="invoice-party customer">
              <h3>
                <User size={18} />
                Thông tin khách hàng
              </h3>
              <div className="party-details">
                <p className="customer-name">{data.customerName}</p>
                <p className="customer-email">
                  <Mail size={14} />
                  {data.customerEmail}
                </p>
                {data.customerId && (
                  <p className="customer-id">ID: #{data.customerId}</p>
                )}
              </div>
            </div>
            <div className="invoice-party company">
              <h3>
                <Building2 size={18} />
                Đơn vị cung cấp
              </h3>
              <div className="party-details">
                <p className="company-name">SkillVerse Platform</p>
                <p><Mail size={14} /> contact@skillverse.vn</p>
                <p><Phone size={14} /> 0931 430 662</p>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="invoice-plan-section">
            <div className="plan-header">
              {getPlanIcon()}
              <div className="plan-info">
                <span className={`plan-badge ${getPlanBadgeClass()}`}>
                  {data.planDisplayName}
                </span>
                <h3>{data.planName}</h3>
                {data.planDescription && <p>{data.planDescription}</p>}
              </div>
            </div>

            {/* Features */}
            {data.features && data.features.length > 0 && (
              <div className="plan-features">
                <h4><Sparkles size={16} /> Quyền lợi gói</h4>
                <ul>
                  {data.features.map((feature, index) => (
                    <li key={index}>
                      <CheckCircle size={14} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subscription Period */}
            <div className="subscription-period">
              <div className="period-item">
                <span className="period-label">Ngày bắt đầu</span>
                <span className="period-value">{formatDate(data.startDate)}</span>
              </div>
              <div className="period-arrow">→</div>
              <div className="period-item">
                <span className="period-label">Ngày kết thúc</span>
                <span className="period-value">{formatDate(data.endDate)}</span>
              </div>
              <div className="period-duration">
                <span>{data.durationMonths} tháng</span>
              </div>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="invoice-pricing">
            <h3>Chi tiết thanh toán</h3>
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Mô tả</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="item-name">
                      <Crown size={16} />
                      {data.planDisplayName}
                    </div>
                    <div className="item-desc">{data.durationMonths} tháng sử dụng</div>
                  </td>
                  <td>1</td>
                  <td>{formatCurrency(data.originalPrice)}</td>
                  <td>{formatCurrency(data.originalPrice)}</td>
                </tr>
              </tbody>
            </table>

            {/* Summary */}
            <div className="pricing-summary">
              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{formatCurrency(data.originalPrice)}</span>
              </div>
              {data.discount && data.discount > 0 && (
                <div className="summary-row discount">
                  <span>
                    Giảm giá
                    {data.isStudentDiscount && ' (Sinh viên)'}
                    {data.discountReason && ` - ${data.discountReason}`}
                  </span>
                  <span>-{formatCurrency(data.discount)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Tổng thanh toán</span>
                <span className="total-amount">{formatCurrency(data.finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="invoice-payment-info">
            <div className="payment-method">
              <CreditCard size={18} />
              <div>
                <span className="label">Phương thức</span>
                <span className="value">{data.paymentMethod}</span>
              </div>
            </div>
            {data.transactionId && (
              <div className="transaction-id">
                <FileText size={18} />
                <div>
                  <span className="label">Mã giao dịch</span>
                  <span className="value">{data.transactionId}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <div className="footer-note">
            <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của SkillVerse!</p>
            <p className="support-note">
              Mọi thắc mắc vui lòng liên hệ: support@skillverse.vn
            </p>
          </div>
          <div className="footer-signature">
            <div className="signature-line"></div>
            <p>SkillVerse Platform</p>
          </div>
        </div>

      </div>

      {/* Close Button - Outside container for fixed positioning */}
      {onClose && (
        <button className="invoice-close-btn" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
};

export default PremiumInvoice;
