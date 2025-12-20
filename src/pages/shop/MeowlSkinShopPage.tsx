import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Sparkles, Check, X, ShieldCheck } from 'lucide-react';
import { skinService, MeowlSkinResponse } from '../../services/skinService';
import { useMeowlSkin } from '../../context/MeowlSkinContext';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import SkinLeaderboard from './SkinLeaderboard';
import './meowl-shop.css';

// Custom Confetti Component
const ConfettiSystem: React.FC = () => {
  const particles = Array.from({ length: 50 }).map((_, i) => {
    const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomLeft = Math.random() * 100;
    const randomDuration = 2 + Math.random() * 3;
    const randomDelay = Math.random() * 2;
    const randomDrift = (Math.random() - 0.5) * 200; // -100px to 100px
    const randomSize = 6 + Math.random() * 8;

    return (
      <div
        key={i}
        className="particle"
        style={{
          left: `${randomLeft}%`,
          backgroundColor: randomColor,
          width: `${randomSize}px`,
          height: `${randomSize}px`,
          animationDuration: `${randomDuration}s`,
          animationDelay: `${randomDelay}s`,
          ['--drift' as any]: `${randomDrift}px`
        }}
      />
    );
  });

  return (
    <div className="particles-container">
      {particles}
    </div>
  );
};

const MeowlSkinShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSkins, skins: myOwnedSkins } = useMeowlSkin();
  const [skins, setSkins] = useState<MeowlSkinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  // Modals state
  const [selectedSkin, setSelectedSkin] = useState<MeowlSkinResponse | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchSkins();
  }, []);

  const fetchSkins = async () => {
    try {
      setLoading(true);
      const data = await skinService.getAllSkins();
      setSkins(data);
    } catch (error) {
      console.error('Failed to fetch skins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (skin: MeowlSkinResponse) => {
    setSelectedSkin(skin);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedSkin) return;
    
    try {
      setPurchasing(selectedSkin.skinCode);
      setShowConfirmModal(false);
      
      await skinService.purchaseSkin(selectedSkin.skinCode);
      
      // Refresh local list to show owned
      await fetchSkins();
      
      // Refresh context to update "my skins" in other components
      await refreshSkins();
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Mua thất bại. Vui lòng kiểm tra số dư ví.');
    } finally {
      setPurchasing(null);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSelectedSkin(null);
  };

  if (loading) {
    return (
      <div className="meowl-shop-container">
        <div className="meowl-shop-loader">
          <MeowlKuruLoader size="large" text="" />
          <p>Đang tải dữ liệu cửa hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meowl-shop-container">
      {showSuccessModal && <ConfettiSystem />}

      <button className="meowl-shop-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="meowl-shop-header">
        <h1 className="meowl-shop-title">
          <Sparkles size={32} style={{ display: 'inline-block', marginRight: '1rem', verticalAlign: 'middle' }} />
          Meowl Skin Shop
          <ShoppingBag size={32} style={{ display: 'inline-block', marginLeft: '1rem', verticalAlign: 'middle' }} />
        </h1>
        <p className="meowl-shop-subtitle">
          Nâng cấp ngoại hình cho trợ lý Meowl của bạn với bộ sưu tập Neon Tech độc quyền.
        </p>
      </div>

      <SkinLeaderboard />

      <div className="meowl-shop-grid">
        {skins.map((skin) => {
          const isOwned = skin.isOwned || myOwnedSkins.some(owned => owned.id === skin.skinCode);
          return (
            <div key={skin.skinCode} className={`meowl-shop-card ${isOwned ? 'owned' : ''}`}>
              <div className={`meowl-shop-badge ${skin.isPremium ? 'premium' : skin.price > 0 ? 'paid' : 'free'}`}>
                {skin.isPremium ? 'Premium' : skin.price > 0 ? 'Paid' : 'Free'}
              </div>
              
              <div className="meowl-shop-image-container">
                <img src={skin.imageUrl} alt={skin.nameVi} className="meowl-shop-image" />
              </div>

              <div className="meowl-shop-details">
                <h3 className="meowl-shop-name">{skin.nameVi}</h3>
                <div className="meowl-shop-price">
                  {skin.isPremium ? (
                    <span className="premium-price">
                      <ShieldCheck size={16} /> Premium Only
                    </span>
                  ) : skin.price > 0 ? (
                    `${skin.price.toLocaleString()} Xu`
                  ) : (
                    'Miễn phí'
                  )}
                </div>

                <button
                  className={`meowl-shop-action-btn ${isOwned ? 'owned' : 'buy'} ${purchasing === skin.skinCode ? 'loading' : ''}`}
                  onClick={() => !isOwned && handleBuyClick(skin)}
                  disabled={isOwned || !!purchasing}
                >
                  {isOwned ? (
                    <>
                      <Check size={18} style={{ display: 'inline-block', marginRight: '5px' }} />
                      Đã sở hữu
                    </>
                  ) : purchasing === skin.skinCode ? (
                    'Đang xử lý...'
                  ) : (
                    'Mua Ngay'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSkin && (
        <div className="meowl-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="meowl-modal" onClick={e => e.stopPropagation()}>
            <div className="meowl-modal-header">
              <div className="meowl-modal-icon">
                <ShoppingBag size={40} color="white" />
              </div>
              <h2 className="meowl-modal-title">Xác nhận mua Skin?</h2>
              <p className="meowl-modal-desc">
                Bạn có chắc chắn muốn mua skin <strong>{selectedSkin.nameVi}</strong>?
              </p>
            </div>
            
            <div className="meowl-modal-price">
              {selectedSkin.price > 0 ? `${selectedSkin.price.toLocaleString()} Xu` : 'Miễn phí'}
            </div>

            <div className="meowl-modal-actions">
              <button className="meowl-modal-btn cancel" onClick={() => setShowConfirmModal(false)}>
                Hủy bỏ
              </button>
              <button className="meowl-modal-btn confirm" onClick={handleConfirmPurchase}>
                Xác nhận mua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && selectedSkin && (
        <div className="meowl-modal-overlay">
          <div className="meowl-modal meowl-success-modal" onClick={e => e.stopPropagation()}>
            <div className="meowl-modal-header">
              <div className="meowl-modal-icon meowl-success-icon">
                <ShieldCheck size={40} color="white" />
              </div>
              <h2 className="meowl-modal-title" style={{ color: '#4ade80' }}>Mua thành công!</h2>
              <p className="meowl-modal-desc">
                Chúc mừng! Bạn đã sở hữu skin <strong>{selectedSkin.nameVi}</strong>.
              </p>
            </div>
            
            <div className="meowl-shop-image-container" style={{ height: '200px', background: 'transparent', marginBottom: '1rem' }}>
               <img src={selectedSkin.imageUrl} alt={selectedSkin.nameVi} className="meowl-shop-image" />
            </div>

            <div className="meowl-modal-actions">
              <button className="meowl-modal-btn confirm" onClick={closeSuccessModal} style={{ background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)' }}>
                Tuyệt vời!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeowlSkinShopPage;
