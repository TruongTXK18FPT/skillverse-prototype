import React, { useState } from 'react';
import { 
  Crown, Check, Star, Bot, GraduationCap, Users, 
  Calendar, Briefcase, Coins, Zap, ArrowRight,
  X, CreditCard, Shield
} from 'lucide-react';
import '../../styles/PremiumPage.css';

const PremiumPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('plus');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const premiumFeatures = [
    {
      icon: Bot,
      title: '🤖 AI Career Coach Pro',
      description: 'Phân tích chuyên sâu & gợi ý học tập cá nhân hóa theo thời gian thực',
      highlight: true
    },
    {
      icon: GraduationCap,  
      title: '📚 Khóa học cao cấp',
      description: 'Truy cập không giới hạn các khóa học chuyên sâu với bài tập thực tế'
    },
    {
      icon: Users,
      title: '👨‍🏫 Mentor 1:1',
      description: 'Đặt lịch với mentor chất lượng cao, nhận phản hồi cá nhân hóa'
    },
    {
      icon: Calendar,
      title: '📅 Seminar/Webinar',
      description: 'Tham gia tất cả sự kiện, ưu tiên chỗ ngồi'
    },
    {
      icon: Briefcase,
      title: '💼 Ưu tiên việc làm',
      description: 'Portfolio được highlight trong "Top Talent"'
    },
    {
      icon: Coins,
      title: '🕹️ Tích điểm nhanh x3',
      description: 'Nhận nhiều coin hơn, đổi coin unlock nội dung premium'
    }
  ];

  const pricingPlans = [
    {
      id: 'basic',
      name: 'Premium Basic',
      description: 'Bắt đầu với AI & khóa học',
      monthlyPrice: 199000,
      yearlyPrice: 1990000,
      features: [
        'AI Career Coach cơ bản',
        'Truy cập 50+ khóa học Premium',
        'Hỗ trợ chat 24/7',
        'Coin Wallet cơ bản',
        'Huy hiệu Premium Basic'
      ],
      popular: false,
      color: 'basic'
    },
    {
      id: 'plus',
      name: 'Premium Plus',
      description: 'Trải nghiệm đầy đủ SkillVerse',
      monthlyPrice: 399000,
      yearlyPrice: 3990000,
      features: [
        'Tất cả tính năng Basic',
        'AI Career Coach Pro không giới hạn',
        'Mentor 1:1 không giới hạn',
        'Tất cả seminar/webinar miễn phí',
        'Ưu tiên việc làm & showcase',
        'Coin Wallet Pro (x3 điểm)',
        'Huy hiệu Premium Plus',
        'Portfolio nổi bật'
      ],
      popular: true,
      color: 'plus'
    },
    {
      id: 'lifetime',
      name: 'Lifetime Premium',
      description: 'Một lần thanh toán, trọn đời sử dụng',
      monthlyPrice: 0,
      yearlyPrice: 0,
      lifetimePrice: 9990000,
      features: [
        'Tất cả tính năng Premium Plus',
        'Truy cập trọn đời',
        'Ưu tiên hỗ trợ cao nhất',
        'Tài khoản VIP',
        'Tặng kèm 1000 coins',
        'Huy hiệu Lifetime Member'
      ],
      popular: false,
      color: 'lifetime'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const getDiscountPercent = (monthly: number, yearly: number) => {
    return Math.round((1 - yearly / (monthly * 12)) * 100);
  };

  return (
    <div className="premium-page">
      {/* Hero Section */}
      <section className="premium-hero">
        <div className="premium-hero__content">
          <div className="premium-hero__badge">
            <Crown className="crown-icon" />
            <span>SkillVerse Premium</span>
          </div>
          <h1 className="premium-hero__title">
            💎 SkillVerse Premium{' '}
            <span className="gradient-text">nâng cao</span>
          </h1>
          <p className="premium-hero__description">
            Tối đa hóa hiệu quả học tập và phát triển nghề nghiệp với các tính năng độc quyền.
          </p>
          <div className="premium-hero__stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Thành viên</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Hài lòng</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3x</div>
              <div className="stat-label">Tốc độ học</div>
            </div>
          </div>
        </div>
        <div className="premium-hero__visual">
          <div className="floating-card">
            <Crown className="floating-icon" />
            <div className="floating-text">Premium Active</div>
          </div>
          <div className="floating-card floating-card--2">
            <Star className="floating-icon" />
            <div className="floating-text">4.9★ Rating</div>
          </div>
          <div className="floating-card floating-card--3">
            <Zap className="floating-icon" />
            <div className="floating-text">AI Powered</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="premium-features">
        <div className="container">
          <div className="section-header">
            <h2>🔑 Quyền lợi Premium</h2>
            <p>Mở khóa toàn bộ tiềm năng với các tính năng độc quyền</p>
          </div>
          <div className="features-grid">
            {premiumFeatures.map((feature, featureIndex) => (
              <div 
                key={`feature-${featureIndex}`}
                className={`feature-card ${feature.highlight ? 'feature-card--highlight' : ''}`}
              >
                <div className="feature-card__icon">
                  <feature.icon />
                </div>
                <div className="feature-card__content">
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__description">{feature.description}</p>
                </div>
                {feature.highlight && (
                  <div className="feature-card__badge">
                    <Star size={16} />
                    <span>Nổi bật</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="premium-pricing">
        <div className="container">
          <div className="section-header">
            <h2>💰 Chọn gói Premium</h2>
            <p>Linh hoạt thanh toán, nâng cấp bất cứ lúc nào</p>
          </div>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <button 
              className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Theo tháng
            </button>
            <button 
              className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Theo năm{' '}
              <span className="billing-badge">Tiết kiệm 17%</span>
            </button>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`pricing-card pricing-card--${plan.color} ${plan.popular ? 'pricing-card--popular' : ''}`}
              >
                {plan.popular && (
                  <div className="pricing-badge">
                    <Star size={16} />
                    <span>Phổ biến nhất</span>
                  </div>
                )}
                
                <div className="pricing-card__header">
                  <h3 className="pricing-card__name">{plan.name}</h3>
                  <p className="pricing-card__description">{plan.description}</p>
                </div>

                <div className="pricing-card__price">
                  {plan.id === 'lifetime' ? (
                    <div className="price-display">
                      <span className="price-amount">{formatPrice(plan.lifetimePrice!)}</span>
                      <span className="price-period">Một lần</span>
                    </div>
                  ) : (
                    <div className="price-display">
                      <span className="price-amount">
                        {formatPrice(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                      </span>
                      <span className="price-period">
                        /{billingCycle === 'monthly' ? 'tháng' : 'năm'}
                      </span>
                      {billingCycle === 'yearly' && (
                        <div className="price-discount">
                          Tiết kiệm {getDiscountPercent(plan.monthlyPrice, plan.yearlyPrice)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <ul className="pricing-card__features">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={`${plan.id}-feature-${featureIndex}`} className="feature-item">
                      <Check size={16} className="feature-check" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`pricing-card__button ${plan.popular ? 'button--primary' : 'button--outline'}`}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.id === 'lifetime' ? 'Mua ngay' : 'Nâng cấp'}
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="premium-testimonials">
        <div className="container">
          <div className="section-header">
            <h2>💬 Người dùng đánh giá</h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {Array.from({ length: 5 }, (_, starIndex) => (
                  <Star key={`testimonial1-star-${starIndex}`} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="testimonial-text">
                "AI Coach giúp tôi xác định đúng điểm yếu và tập trung vào những kỹ năng quan trọng nhất. 
                Sau 3 tháng, tôi đã có được công việc mơ ước!"
              </p>
              <div className="testimonial-author">
                <div className="author-info">
                  <div className="author-name">Nguyễn Minh Anh</div>
                  <div className="author-title">Frontend Developer</div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {Array.from({ length: 5 }, (_, starIndex) => (
                  <Star key={`testimonial2-star-${starIndex}`} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="testimonial-text">
                "Mentor 1:1 thực sự tuyệt vời! Được hướng dẫn cá nhân hóa và feedback chi tiết 
                giúp tôi tiến bộ nhanh chóng trong career path."
              </p>
              <div className="testimonial-author">
                <div className="author-info">
                  <div className="author-name">Trần Đức Thành</div>
                  <div className="author-title">Product Manager</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">
                {Array.from({ length: 5 }, (_, starIndex) => (
                  <Star key={`testimonial3-star-${starIndex}`} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="testimonial-text">
                "Premium Plus đáng từng đồng! Showcase giúp tôi được nhiều nhà tuyển dụng chú ý, 
                và các seminar độc quyền mở mang tầm nhìn rất nhiều."
              </p>
              <div className="testimonial-author">
                <div className="author-info">
                  <div className="author-name">Lê Thị Hương</div>
                  <div className="author-title">UX Designer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="premium-faq">
        <div className="container">
          <div className="section-header">
            <h2>❓ FAQ</h2>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Tôi có thể hủy Premium bất cứ lúc nào không?</h3>
              <p>Có, bạn có thể hủy Premium bất cứ lúc nào. Bạn sẽ vẫn sử dụng được các tính năng Premium đến hết chu kỳ thanh toán hiện tại.</p>
            </div>
            <div className="faq-item">
              <h3>Premium có hỗ trợ thanh toán qua những phương thức nào?</h3>
              <p>Chúng tôi hỗ trợ thanh toán qua thẻ tín dụng/ghi nợ, MoMo, ZaloPay, VNPay và chuyển khoản ngân hàng.</p>
            </div>
            <div className="faq-item">
              <h3>Tôi có thể nâng cấp từ Basic lên Plus không?</h3>
              <p>Hoàn toàn có thể! Bạn chỉ cần thanh toán phần chênh lệch và sẽ được nâng cấp ngay lập tức.</p>
            </div>
            <div className="faq-item">
              <h3>Gói Lifetime có cập nhật tự động không?</h3>
              <p>Có, gói Lifetime sẽ tự động cập nhật tất cả tính năng mới mà chúng tôi phát triển trong tương lai.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal__header">
              <h3>Xác nhận nâng cấp Premium</h3>
              <button 
                className="payment-modal__close"
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="payment-modal__content">
              <div className="selected-plan">
                <div className="plan-info">
                  <h4>{pricingPlans.find(p => p.id === selectedPlan)?.name}</h4>
                  <p className="plan-price">
                    {(() => {
                      const plan = pricingPlans.find(p => p.id === selectedPlan);
                      if (selectedPlan === 'lifetime') {
                        return formatPrice(plan?.lifetimePrice!);
                      }
                      const price = billingCycle === 'monthly' ? plan?.monthlyPrice! : plan?.yearlyPrice!;
                      return formatPrice(price);
                    })()}
                    {selectedPlan !== 'lifetime' && (
                      <span className="plan-period">/{billingCycle === 'monthly' ? 'tháng' : 'năm'}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="payment-methods">
                <h4>Phương thức thanh toán</h4>
                <div className="payment-options">
                  <button className="payment-option">
                    <CreditCard size={20} />
                    <span>Thẻ tín dụng/ghi nợ</span>
                  </button>
                  <button className="payment-option">
                    <div className="payment-icon">💳</div>
                    <span>MoMo</span>
                  </button>
                  <button className="payment-option">
                    <div className="payment-icon">🏦</div>
                    <span>Chuyển khoản</span>
                  </button>
                </div>
              </div>

              <div className="payment-security">
                <Shield size={16} />
                <span>Thanh toán được bảo mật với mã hóa SSL 256-bit</span>
              </div>

              <button className="confirm-payment-btn">
                Xác nhận thanh toán
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumPage;
