import React, { useState, useEffect } from 'react';
import { DollarSign, Sparkles, Crown, Gift } from 'lucide-react';
import { PurchaseType, CoursePurchaseOption } from '../../data/purchaseDTOs';
import '../../styles/PurchaseOptionSelector.css';

interface PurchaseOptionSelectorProps {
  value?: CoursePurchaseOption;
  onChange: (option: CoursePurchaseOption) => void;
  disabled?: boolean;
}

export const PurchaseOptionSelector: React.FC<PurchaseOptionSelectorProps> = ({ 
  value, 
  onChange,
  disabled = false
}) => {
  const [type, setType] = useState<PurchaseType>(value?.type || PurchaseType.FREE);
  const [price, setPrice] = useState<number>(value?.price || 0);
  const [skillPoints, setSkillPoints] = useState<number>(value?.skillPoints || 0);
  const [currency] = useState<string>('VND');

  useEffect(() => {
    // Update parent whenever any value changes
    const purchaseOption: CoursePurchaseOption = {
      type,
      price: type === PurchaseType.PAID ? price : 0,
      skillPoints: type === PurchaseType.SKILL_POINTS ? skillPoints : 0,
      currency
    };
    onChange(purchaseOption);
  }, [type, price, skillPoints, currency, onChange]);

  // Update local state if value prop changes externally
  useEffect(() => {
    if (value) {
      setType(value.type);
      setPrice(value.price || 0);
      setSkillPoints(value.skillPoints || 0);
    }
  }, [value]);

  const purchaseTypes = [
    {
      value: PurchaseType.FREE,
      label: 'Miễn Phí',
      description: 'Ai cũng có thể truy cập khóa học này',
      icon: Gift,
      color: '#10b981'
    },
    {
      value: PurchaseType.SKILL_POINTS,
      label: 'Mua Bằng Xu',
      description: 'Học viên cần điểm kỹ năng để truy cập',
      icon: Sparkles,
      color: '#f59e0b'
    },
    {
      value: PurchaseType.PREMIUM_ONLY,
      label: 'Chỉ Premium',
      description: 'Chỉ dành cho thành viên Premium',
      icon: Crown,
      color: '#8b5cf6'
    },
    {
      value: PurchaseType.PAID,
      label: 'Trả Phí',
      description: 'Học viên cần thanh toán bằng tiền',
      icon: DollarSign,
      color: '#3b82f6'
    }
  ];

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <div className="purchase-option-selector">
      <label className="purchase-label">
        Phương Thức Mua Khóa Học
        <span className="purchase-label-required">*</span>
      </label>
      <p className="purchase-description">
        Chọn cách học viên có thể truy cập khóa học của bạn
      </p>

      <div className="purchase-types-grid">
        {purchaseTypes.map((purchaseType) => {
          const Icon = purchaseType.icon;
          const isSelected = type === purchaseType.value;
          
          return (
            <button
              key={purchaseType.value}
              type="button"
              className={`purchase-type-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setType(purchaseType.value)}
              disabled={disabled}
              style={{
                '--purchase-color': purchaseType.color
              } as React.CSSProperties & { '--purchase-color': string }}
            >
              <div className="purchase-type-icon">
                <Icon size={24} />
              </div>
              <div className="purchase-type-content">
                <h4 className="purchase-type-label">{purchaseType.label}</h4>
                <p className="purchase-type-description">{purchaseType.description}</p>
              </div>
              {isSelected && (
                <div className="purchase-type-selected-indicator">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="currentColor" />
                    <path
                      d="M6 10L9 13L14 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Price Input for PAID type */}
      {type === PurchaseType.PAID && (
        <div className="purchase-input-section">
          <label className="purchase-input-label">
            Giá Khóa Học (VND)
            <span className="purchase-label-required">*</span>
          </label>
          <div className="purchase-input-wrapper">
            <DollarSign className="purchase-input-icon" size={20} />
            <input
              type="number"
              min="0"
              step="1000"
              value={price}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Nhập giá khóa học..."
              className="purchase-input"
              disabled={disabled}
            />
            <span className="purchase-input-suffix">VND</span>
          </div>
          <p className="purchase-input-hint">
            Giá hiển thị: {formatPrice(price)} VND
          </p>
        </div>
      )}

      {/* Skill Points Input for SKILL_POINTS type */}
      {type === PurchaseType.SKILL_POINTS && (
        <div className="purchase-input-section">
          <label className="purchase-input-label">
            Số Điểm Kỹ Năng
            <span className="purchase-label-required">*</span>
          </label>
          <div className="purchase-input-wrapper">
            <Sparkles className="purchase-input-icon" size={20} />
            <input
              type="number"
              min="0"
              step="10"
              value={skillPoints}
              onChange={(e) => setSkillPoints(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Nhập số điểm cần thiết..."
              className="purchase-input"
              disabled={disabled}
            />
            <span className="purchase-input-suffix">điểm</span>
          </div>
          <p className="purchase-input-hint">
            Học viên cần {skillPoints} điểm kỹ năng để mua khóa học này
          </p>
        </div>
      )}

      {/* Info Messages */}
      <div className="purchase-info-messages">
        {type === PurchaseType.FREE && (
          <div className="purchase-info-message info">
            <Gift size={16} />
            <span>Khóa học miễn phí sẽ thu hút nhiều học viên hơn</span>
          </div>
        )}
        {type === PurchaseType.PREMIUM_ONLY && (
          <div className="purchase-info-message premium">
            <Crown size={16} />
            <span>Chỉ thành viên Premium mới có thể truy cập khóa học này</span>
          </div>
        )}
      </div>
    </div>
  );
};
