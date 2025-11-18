import { useState, useEffect } from 'react';
import { 
  Crown, Check, Star, Bot, GraduationCap, Users, 
  Calendar, Briefcase, Coins, Zap, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PremiumPage.css';
import MeowGuide from '../../components/MeowlGuide';
import { premiumService } from '../../services/premiumService';
import { paymentService } from '../../services/paymentService';
import { PremiumPlan, CreateSubscriptionRequest, UserSubscriptionResponse } from '../../data/premiumDTOs';
import { CreatePaymentRequest } from '../../data/paymentDTOs';

const PremiumPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentSub, setCurrentSub] = useState<UserSubscriptionResponse | null>(null);
  const [hasActive, setHasActive] = useState<boolean>(false);

  // Get user email from auth context
  const userEmail = user?.email || '';
  const isStudentEligible = Boolean(userEmail && (userEmail.includes('.edu') || userEmail.includes('@university') || userEmail.includes('@student')));

  useEffect(() => {
    loadPremiumPlans();
    
    // Only check premium status if authenticated
    if (isAuthenticated) {
      premiumService.checkPremiumStatus()
        .then((active) => {
          setHasActive(active);
          if (active) {
            return premiumService.getCurrentSubscription()
              .then(setCurrentSub)
              .catch(() => setCurrentSub(null));
          }
          return Promise.resolve();
        })
        .catch(() => {
          setHasActive(false);
          setCurrentSub(null);
        });
    }
  }, [isAuthenticated]);

  const loadPremiumPlans = async () => {
    try {
      const plans = await premiumService.getPremiumPlans();
      setPremiumPlans(plans);
    } catch (error) {
      console.error('Failed to load premium plans:', error);
    }
  };

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

  // Convert backend plans to display format
  const getDisplayPlans = () => {
    return premiumPlans.map(plan => ({
      id: plan.name,
      name: plan.displayName,
      description: plan.description,
      price: parseFloat(plan.price),
      features: plan.features ? JSON.parse(plan.features) as string[] : [],
      popular: plan.planType === 'PREMIUM_PLUS',
      color: plan.planType.toLowerCase().replace('_', '-'),
      planType: plan.planType,
      studentOnly: plan.planType === 'STUDENT_PACK'
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleUpgrade = async (planId: string) => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (processing) return;
    // Allow upgrade if current is FREE_TIER; block only if current is paid
    if (hasActive && currentSub && currentSub.status === 'ACTIVE') {
      const isFree = premiumPlans.find(p => p.name === currentSub.planName || p.id === currentSub.planId)?.planType === 'FREE_TIER';
      if (!isFree) return;
    }
    
    try {
      setProcessing(true);
      
      // Find the selected plan
      const selectedPlan = premiumPlans.find(plan => plan.name === planId);
      if (!selectedPlan) {
        console.error('Plan not found:', planId);
        return;
      }

      // Create subscription first
      const successUrl = `${window.location.origin}/payment/transactional`;
      const cancelUrl = `${window.location.origin}/payment/transactional?cancel=1`;
      
      const subscriptionRequest: CreateSubscriptionRequest = {
        planId: selectedPlan.id,
        paymentMethod: 'PAYOS',
        applyStudentDiscount: isStudentEligible,
        autoRenew: false,
        successUrl,
        cancelUrl
      };

      const subscription = await premiumService.createSubscription(subscriptionRequest);

      // Create payment
      const metadata = JSON.stringify({
        subscriptionId: subscription.id,
        planId: selectedPlan.id
      });

      const paymentRequest: CreatePaymentRequest = {
        amount: selectedPlan.price,
        currency: 'VND',
        type: 'PREMIUM_SUBSCRIPTION',
        paymentMethod: 'PAYOS',
        description: selectedPlan.displayName,
        planId: selectedPlan.id,
        metadata,
        successUrl,
        cancelUrl
      };

      const payment = await paymentService.createPayment(paymentRequest);

      // Redirect to PayOS checkout
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        console.error('No checkout URL received from payment service');
      }

    } catch (error) {
      console.error('Failed to create payment:', error);
      // Handle error - show toast or error message
    } finally {
      setProcessing(false);
    }
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
            <div className="premium-stat-item">
              <div className="premium-stat-number">10K+</div>
              <div className="premium-stat-label">Thành viên</div>
            </div>
            <div className="premium-stat-item">
              <div className="premium-stat-number">95%</div>
              <div className="premium-stat-label">Hài lòng</div>
            </div>
            <div className="premium-stat-item">
              <div className="premium-stat-number">3x</div>
              <div className="premium-stat-label">Tốc độ học</div>
            </div>
          </div>
        </div>
        <div className="premium-hero__visual">
          <div className="premium-floating-card">
            <Crown className="premium-floating-icon" />
            <div className="premium-floating-text">Premium Active</div>
          </div>
          <div className="premium-floating-card floating-card--2">
            <Star className="premium-floating-icon" />
            <div className="premium-floating-text">4.9★ Rating</div>
          </div>
          <div className="premium-floating-card floating-card--3">
            <Zap className="premium-floating-icon" />
            <div className="premium-floating-text">AI Powered</div>
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

          {/* Student Eligibility Notice */}
          {isStudentEligible && (
            <div className="student-notice">
              <div className="student-notice-content">
                <span className="student-notice-icon">🎓</span>
                <div className="student-notice-text">
                  <h4>Bạn có quyền sử dụng Student Pack!</h4>
                  <p>Với email sinh viên ({userEmail}), bạn được giảm giá đặc biệt chỉ 20,000đ/tháng</p>
                </div>
              </div>
            </div>
          )}

          <div className="pricing-grid">
            {getDisplayPlans().map((plan) => (
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
                  <div className="price-display">
                    <span className="price-amount">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="price-period">
                      /tháng
                    </span>
                    {plan.studentOnly && (
                      <div className="student-badge">
                        🎓 Dành cho sinh viên
                      </div>
                    )}
                  </div>
                </div>

                <ul className="pricing-card__features">
                  {plan.features.map((feature: string, featureIndex: number) => (
                    <li key={`${plan.id}-feature-${featureIndex}`} className="feature-item">
                      <Check size={16} className="feature-check" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.planType !== 'FREE_TIER' && (
                  hasActive ? (
                    <button
                      className={`pricing-card__button button--disabled`}
                      disabled
                      title="Bạn đã có gói đang hoạt động"
                    >
                      Đang hoạt động đến{' '}
                      {currentSub ? new Date(currentSub.endDate).toLocaleDateString('vi-VN') : ''}
                    </button>
                  ) : (
                    <button 
                      className={`pricing-card__button ${plan.popular ? 'button--primary' : 'button--outline'}`}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {!isAuthenticated ? 'Đăng nhập để nâng cấp' : (plan.id === 'student' ? 'Đăng ký Student Pack' : 'Nâng cấp')}
                      <ArrowRight size={16} />
                    </button>
                  )
                )}

                {hasActive && currentSub && currentSub.status === 'ACTIVE' && (
                  <div className="active-note">
                    Bạn đã có gói đang hoạt động đến{' '}
                    <strong>{new Date(currentSub.endDate).toLocaleDateString('vi-VN')}</strong>
                  </div>
                )}
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
              <h3>Student Pack có những điều kiện gì?</h3>
              <p>Student Pack chỉ dành cho sinh viên có email .edu hoặc email trường đại học. Bạn cần xác thực email sinh viên để được áp dụng giá ưu đãi.</p>
            </div>
          </div>
        </div>
      </section>
      <MeowGuide currentPage="upgrade" />
    </div>
  );
};

export default PremiumPage;
