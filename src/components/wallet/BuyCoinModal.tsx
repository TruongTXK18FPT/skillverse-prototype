import React, { useState } from 'react';
import { Coins, Gift, X } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import walletService from '../../services/walletService';
import './BuyCoinModal.css';

interface BuyCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentBalance: number;
}

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
  discount: number;
  title: string;
  description: string;
  popular: boolean;
  special: boolean;
  color: string;
  glowColor: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'starter',
    coins: 50,
    price: 4500,
    bonus: 5,
    discount: 10,
    title: 'Gói Khởi Đầu',
    description: 'Bắt đầu hành trình + 5 xu thưởng',
    popular: false,
    special: false,
    color: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.3)'
  },
  {
    id: 'popular',
    coins: 500,
    price: 40000,
    bonus: 75,
    discount: 20,
    title: 'Gói Phổ Biến',
    description: 'Giá trị tốt nhất + 75 xu thưởng',
    popular: true,
    special: false,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'premium',
    coins: 1000,
    price: 80000,
    bonus: 200,
    discount: 20,
    title: 'Gói Premium',
    description: 'Dành cho người dùng cao cấp + 200 xu thưởng',
    popular: false,
    special: false,
    color: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.4)'
  },
  {
    id: 'mega',
    coins: 2500,
    price: 190000,
    bonus: 600,
    discount: 24,
    title: 'Gói Mega',
    description: 'Sức mạnh vượt trội + 600 xu thưởng',
    popular: false,
    special: false,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  {
    id: 'ultimate',
    coins: 5000,
    price: 350000,
    bonus: 1500,
    discount: 30,
    title: 'Gói Ultimate',
    description: 'Đỉnh cao sức mạnh + 1500 xu thưởng',
    popular: false,
    special: true,
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)'
  },
  {
    id: 'legendary',
    coins: 10000,
    price: 650000,
    bonus: 3500,
    discount: 35,
    title: 'Gói Huyền Thoại',
    description: 'Gói đặc biệt nhất + 3500 xu thưởng khủng',
    popular: false,
    special: true,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  }
];

const BuyCoinModal: React.FC<BuyCoinModalProps> = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleBuyPackage = async () => {
    if (!selectedPackage) {
      setError('Vui lòng chọn gói xu');
      return;
    }

    if (currentBalance < selectedPackage.price) {
      setError('Số dư không đủ để mua gói xu này. Vui lòng nạp thêm tiền!');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await walletService.purchaseCoinsWithCash({
        coinAmount: selectedPackage.coins,
        packageId: selectedPackage.id,
        paymentMethod: 'WALLET_CASH'
      });

      // Trigger wallet update event for Header
      window.dispatchEvent(new Event('wallet:updated'));

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Buy coin error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi mua xu');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="buy-coin-modal-overlay" onClick={onClose}>
      <div className="buy-coin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="buy-coin-modal-header">
          <div className="modal-title">
            <Coins size={28} />
            <h2>Mua SkillCoin</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="buy-coin-modal-body">
          <div className="balance-info">
            <span>Số dư hiện tại:</span>
            <strong>{formatCurrency(currentBalance)}</strong>
          </div>

          <p className="modal-subtitle">
            Chọn gói coin phù hợp. Thanh toán bằng số dư tiền mặt trong ví.
          </p>

          <div className="coin-packages-list">
            {COIN_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`coin-package-card ${selectedPackage?.id === pkg.id ? 'selected' : ''} ${
                  pkg.popular ? 'popular' : ''
                } ${pkg.special ? 'special' : ''}`}
                onClick={() => {
                  setSelectedPackage(pkg);
                  setError(null);
                }}
                style={{ '--pkg-color': pkg.color, '--pkg-glow': pkg.glowColor } as React.CSSProperties}
              >
                {pkg.popular && <div className="package-badge popular-badge">🔥 PHỔ BIẾN</div>}
                {pkg.special && <div className="package-badge special-badge">✨ ĐẶC BIỆT</div>}

                <div className="package-info">
                  <h3 className="package-title">{pkg.title}</h3>
                  <p className="package-desc">{pkg.description}</p>
                </div>

                <div className="package-coins-display">
                  <div className="coins-main-display">
                    <Coins size={24} />
                    <span className="coins-number">{pkg.coins}</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className="coins-bonus-display">
                      <Gift size={14} />
                      <span>+{pkg.bonus} xu</span>
                    </div>
                  )}
                </div>

                <div className="package-price-display">
                  <span className="price-value">{formatCurrency(pkg.price)}</span>
                </div>

                {currentBalance < pkg.price && (
                  <div className="insufficient-badge">Không đủ tiền</div>
                )}
              </div>
            ))}
          </div>

          {error && <div className="buy-coin-error">{error}</div>}

          {selectedPackage && (
            <div className="purchase-summary">
              <h3>Thông tin mua hàng:</h3>
              <div className="summary-item">
                <span>Gói đã chọn:</span>
                <strong>{selectedPackage.title}</strong>
              </div>
              <div className="summary-item">
                <span>Số xu nhận được:</span>
                <strong className="highlight">{selectedPackage.coins + selectedPackage.bonus} xu</strong>
              </div>
              <div className="summary-item">
                <span>Giá:</span>
                <strong>{formatCurrency(selectedPackage.price)}</strong>
              </div>
              <div className="summary-item total">
                <span>Số dư sau khi mua:</span>
                <strong>{formatCurrency(currentBalance - selectedPackage.price)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="buy-coin-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="btn-buy"
            onClick={handleBuyPackage}
            disabled={loading || !selectedPackage || (selectedPackage && currentBalance < selectedPackage.price)}
          >
            {loading ? (
              <>
                <MeowlKuruLoader size="small" text="" /> Đang xử lý...
              </>
            ) : (
              <>🪙 Mua Ngay</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyCoinModal;
