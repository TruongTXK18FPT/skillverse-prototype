import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Sparkles, Check, X, ShieldCheck, Coins, Zap, Crown } from 'lucide-react';
import { skinService, MeowlSkinResponse } from '../../services/skinService';
import { useMeowlSkin } from '../../context/MeowlSkinContext';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import SkinLeaderboard from './SkinLeaderboard';
import './MeowlShopV2.css';

// Custom Confetti Component
const ConfettiSystem: React.FC = () => {
  const particles = Array.from({ length: 60 }).map((_, i) => {
    const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#fff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomLeft = Math.random() * 100;
    const randomDuration = 3 + Math.random() * 4;
    const randomDelay = Math.random() * 2;
    const randomDrift = (Math.random() - 0.5) * 300;
    const randomSize = 4 + Math.random() * 10;

    return (
      <div
        key={i}
        className="shop-v2-particle"
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
    <div className="shop-v2-particles">
      {particles}
    </div>
  );
};

const MeowlSkinShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSkins, skins: myOwnedSkins, isPremium } = useMeowlSkin();
  const [skins, setSkins] = useState<MeowlSkinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  // Modals state
  const [selectedSkin, setSelectedSkin] = useState<MeowlSkinResponse | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchSkins();
  }, []);

  // Scroll Lock Logic
  useEffect(() => {
    if (showConfirmModal || showSuccessModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal, showSuccessModal]);

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
    if (skin.isPremium && !isPremium) {
      setSelectedSkin(skin);
      setShowUpgradeModal(true);
      return;
    }
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

  const getRarity = (skin: MeowlSkinResponse) => {
    if (skin.isPremium) return { label: 'LEGENDARY', color: 'var(--shop-v2-rarity-legendary)', alpha: 'rgba(245, 158, 11, 0.2)' };
    if (skin.price >= 5000) return { label: 'EPIC', color: 'var(--shop-v2-rarity-epic)', alpha: 'rgba(168, 85, 247, 0.2)' };
    if (skin.price > 0) return { label: 'RARE', color: 'var(--shop-v2-rarity-rare)', alpha: 'rgba(59, 130, 246, 0.2)' };
    return { label: 'COMMON', color: 'var(--shop-v2-rarity-common)', alpha: 'rgba(148, 163, 184, 0.2)' };
  };

  if (loading) {
    return (
      <div className="shop-v2-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <MeowlKuruLoader size="large" text="" />
          <p style={{ marginTop: '2rem', color: '#94a3b8', letterSpacing: '2px' }}>INITIALIZING DIGITAL BOUTIQUE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-v2-container">
      {showSuccessModal && <ConfettiSystem />}

      <button className="shop-v2-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="shop-v2-header">
        <div className="shop-v2-header-status">
          <div className="shop-v2-status-dot"></div>
          <span className="shop-v2-status-text">DIGITAL BOUTIQUE ONLINE</span>
        </div>
        <h1 className="shop-v2-title">
          MEOWL SKIN SHOP
          <span className="shop-v2-title-neon">V2.0</span>
        </h1>
        <p className="shop-v2-subtitle">
          Nâng cấp trợ lý Meowl của bạn với những bộ trang phục công nghệ cao từ tương lai. 
          Hệ thống đã sẵn sàng cho các giao dịch mã hóa.
        </p>
      </div>

      <SkinLeaderboard />

      <div className="shop-v2-grid">
        {skins.map((skin) => {
          const isOwned = skin.isOwned || myOwnedSkins.some(owned => owned.id === skin.skinCode);
          const rarity = getRarity(skin);
          
          return (
            <div 
              key={skin.skinCode}
              className="shop-v2-card-wrapper"
              style={{ 
                ['--card-rarity-color' as any]: rarity.color,
                ['--card-rarity-color-alpha' as any]: rarity.alpha
              }}
            >
              <div className={`shop-v2-card ${isOwned ? 'owned' : ''}`}>
                <div className="shop-v2-card-rarity">
                  {rarity.label === 'LEGENDARY' && <Crown size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                  {rarity.label === 'EPIC' && <Zap size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                  {rarity.label === 'RARE' && <Sparkles size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                  <span style={{ verticalAlign: 'middle' }}>{rarity.label}</span>
                </div>
                
                <div className="shop-v2-card-img-container">
                  <img src={skin.imageUrl} alt={skin.nameVi} className="shop-v2-card-img" />
                  {isOwned && (
                    <div className="shop-v2-owned-overlay">
                      <div className="shop-v2-owned-badge">
                        <Check size={20} /> ĐÃ SỞ HỮU
                      </div>
                    </div>
                  )}
                </div>

                <div className="shop-v2-card-info">
                  <h3 className="shop-v2-card-name">{skin.nameVi}</h3>
                  
                  <div className="shop-v2-card-footer">
                    <div className="shop-v2-price">
                      {skin.isPremium ? (
                        <span style={{ color: 'var(--shop-v2-rarity-legendary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <ShieldCheck size={16} /> PREMIUM
                        </span>
                      ) : skin.price > 0 ? (
                        <>
                          <Coins size={16} />
                          {skin.price.toLocaleString()}
                        </>
                      ) : (
                        <span style={{ color: '#22c55e' }}>FREE</span>
                      )}
                    </div>

                    <button
                      className="shop-v2-buy-btn"
                      onClick={() => !isOwned && handleBuyClick(skin)}
                      disabled={isOwned || !!purchasing}
                    >
                      {purchasing === skin.skinCode ? '...' : isOwned ? 'EQUIPPED' : 'MUA NGAY'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSkin && (
        <div className="shop-v2-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="shop-v2-modal" onClick={e => e.stopPropagation()}>
            <div className="shop-v2-modal-content">
              <div className="shop-v2-modal-hero">
                <img src={selectedSkin.imageUrl} alt={selectedSkin.nameVi} className="shop-v2-modal-img" />
              </div>
              
              <div className="shop-v2-modal-details">
                <h2 className="shop-v2-modal-title">XÁC NHẬN GIAO DỊCH</h2>
                <p className="shop-v2-modal-desc">
                  Bạn có chắc chắn muốn sở hữu skin <strong>{selectedSkin.nameVi}</strong> vào bộ sưu tập của mình? 
                  Hệ thống sẽ khấu trừ số dư tương ứng từ ví của bạn.
                </p>
                
                <div className="shop-v2-modal-price-tag">
                  {selectedSkin.price > 0 ? (
                    <>
                      <Coins size={32} /> {selectedSkin.price.toLocaleString()} XU
                    </>
                  ) : 'MIỄN PHÍ'}
                </div>

                <div className="shop-v2-modal-actions">
                  <button className="shop-v2-btn shop-v2-btn-cancel" onClick={() => setShowConfirmModal(false)}>
                    HỦY BỎ
                  </button>
                  <button className="shop-v2-btn shop-v2-btn-confirm" onClick={handleConfirmPurchase}>
                    XÁC NHẬN MUA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedSkin && (
        <div className="shop-v2-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="shop-v2-modal" onClick={e => e.stopPropagation()}>
            <div className="shop-v2-modal-content">
              <div className="shop-v2-modal-hero">
                <img src={selectedSkin.imageUrl} alt={selectedSkin.nameVi} className="shop-v2-modal-img" />
              </div>
              
              <div className="shop-v2-modal-details">
                <h2 className="shop-v2-modal-title" style={{ color: 'var(--shop-v2-rarity-legendary)' }}>YÊU CẦU PREMIUM</h2>
                <p className="shop-v2-modal-desc">
                  Skin <strong>{selectedSkin.nameVi}</strong> là trang phục dành riêng cho thành viên Premium. 
                  Vui lòng nâng cấp tài khoản để mở khóa skin này cùng nhiều đặc quyền hấp dẫn khác.
                </p>
                
                <div className="shop-v2-modal-actions">
                  <button className="shop-v2-btn shop-v2-btn-cancel" onClick={() => setShowUpgradeModal(false)}>
                    ĐỂ SAU
                  </button>
                  <button 
                    className="shop-v2-btn shop-v2-btn-confirm" 
                    onClick={() => navigate('/premium')}
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                  >
                    NÂNG CẤP NGAY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && selectedSkin && (
        <div className="shop-v2-modal-overlay">
          <div className="shop-v2-modal shop-v2-success-modal" onClick={e => e.stopPropagation()}>
            <div className="shop-v2-modal-content">
              <div className="shop-v2-modal-hero">
                <img src={selectedSkin.imageUrl} alt={selectedSkin.nameVi} className="shop-v2-modal-img shop-v2-success-img" />
              </div>
              
              <div className="shop-v2-modal-details">
                <h2 className="shop-v2-modal-title" style={{ color: '#10b981' }}>GIAO DỊCH THÀNH CÔNG!</h2>
                <p className="shop-v2-modal-desc">
                  Hệ thống đã ghi nhận. Skin <strong>{selectedSkin.nameVi}</strong> hiện đã sẵn sàng để sử dụng. 
                  Bạn có thể thay đổi skin trong phần cài đặt <span onClick={() => navigate('/profile/user')} style={{cursor: 'pointer', textDecoration: 'underline'}}>Hồ sơ cá nhân</span>.
                </p>
                
                <div className="shop-v2-modal-actions">
                  <button className="shop-v2-btn shop-v2-btn-confirm" onClick={closeSuccessModal}>
                    TUYỆT VỜI!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeowlSkinShopPage;
