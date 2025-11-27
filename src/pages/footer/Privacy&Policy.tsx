import { motion } from 'framer-motion';
import { Shield, Mail, Phone, Info, Key, Database, Lock, UserCheck, Clock, AlertTriangle, FileText, MessageCircle, Sparkles } from 'lucide-react';
import '../../styles/Privacy&Policy.css';

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: <Info size={24} />,
      title: '1. Giới Thiệu Chung',
      content: 'Chúng tôi tại SkillVerse cam kết bảo vệ quyền riêng tư của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ thông tin cá nhân của bạn khi bạn truy cập và sử dụng nền tảng của chúng tôi.',
    },
    {
      icon: <Key size={24} />,
      title: '2. Thông Tin Chúng Tôi Thu Thập',
      subsections: [
        {
          subtitle: 'a. Thông tin do bạn cung cấp:',
          items: ['Họ tên, email, số điện thoại', 'Mật khẩu và thông tin đăng nhập', 'Hồ sơ người dùng: độ tuổi, nghề nghiệp, kỹ năng', 'Nội dung bạn tải lên: bình luận, câu hỏi, bài nộp']
        },
        {
          subtitle: 'b. Thông tin tự động:',
          items: ['Địa chỉ IP, trình duyệt, thiết bị sử dụng', 'Lịch sử truy cập, thời gian tương tác', 'Cookie và công nghệ theo dõi hành vi']
        }
      ]
    },
    {
      icon: <Database size={24} />,
      title: '3. Mục Đích Sử Dụng Thông Tin',
      items: ['Cung cấp, cải thiện dịch vụ học tập và trải nghiệm người dùng', 'Cá nhân hoá nội dung, gợi ý khoá học phù hợp', 'Phân tích dữ liệu hành vi để nâng cao chất lượng nền tảng', 'Gửi thông báo, tài liệu học tập hoặc khuyến mãi', 'Đảm bảo bảo mật và phòng tránh gian lận']
    },
    {
      icon: <Lock size={24} />,
      title: '4. Chia Sẻ Thông Tin Với Bên Thứ Ba',
      highlight: 'Chúng tôi KHÔNG bán dữ liệu người dùng.',
      content: 'Tuy nhiên, có thể chia sẻ thông tin với:',
      items: ['Đối tác công nghệ (như dịch vụ lưu trữ, AI phân tích)', 'Cơ quan pháp lý khi được yêu cầu bởi luật pháp', 'Các bên hỗ trợ kỹ thuật, bảo trì và phát triển sản phẩm']
    },
    {
      icon: <UserCheck size={24} />,
      title: '5. Quyền Lựa Chọn và Kiểm Soát',
      content: 'Bạn có quyền:',
      items: ['Truy cập, chỉnh sửa hoặc xoá thông tin cá nhân', 'Yêu cầu không nhận email quảng cáo', 'Hạn chế việc chúng tôi sử dụng dữ liệu của bạn cho phân tích'],
      isCheckmark: true
    },
    {
      icon: <Clock size={24} />,
      title: '6. Lưu Trữ và Bảo Mật Dữ Liệu',
      securityFeatures: [
        { icon: <Lock size={24} />, text: 'Mã hoá dữ liệu và tường lửa bảo mật' },
        { icon: <Database size={24} />, text: 'Lưu trữ tại trung tâm dữ liệu đạt chuẩn quốc tế' },
        { icon: <Clock size={24} />, text: 'Thời gian lưu trữ: 3 năm kể từ lần tương tác cuối' }
      ]
    },
    {
      icon: <AlertTriangle size={24} />,
      title: '7. Dữ Liệu Người Dưới 18 Tuổi',
      content: 'SkillVerse không hướng tới trẻ em dưới 13 tuổi. Nếu phát hiện có thông tin trẻ em được thu thập, chúng tôi sẽ nhanh chóng xoá bỏ dữ liệu đó.',
      isAlert: true
    },
    {
      icon: <FileText size={24} />,
      title: '8. Thay Đổi Chính Sách',
      content: 'SkillVerse có thể cập nhật Chính sách Quyền Riêng Tư theo thời gian. Người dùng sẽ được thông báo rõ ràng trước khi thay đổi có hiệu lực.'
    }
  ];

  return (
    <div className="privacy-page">
      {/* Background Effects */}
      <div className="privacy-bg-effects">
        <div className="privacy-grid-overlay"></div>
        <div className="privacy-glow-orb orb-1"></div>
        <div className="privacy-glow-orb orb-2"></div>
        <div className="privacy-glow-orb orb-3"></div>
      </div>

      {/* Hero Section */}
      <section className="privacy-hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-icon-container">
            <Shield size={64} className="hero-icon" />
            <div className="icon-glow-ring"></div>
          </div>
          <h1 className="hero-title">
            <span className="title-gradient">CHÍNH SÁCH QUYỀN RIÊNG TƯ</span>
          </h1>
          <p className="hero-tagline">PRIVACY POLICY</p>
          <p className="hero-description">
            Cam kết bảo vệ thông tin của bạn tại SkillVerse
          </p>
        </motion.div>
      </section>

      {/* Content Sections */}
      <div className="privacy-content">
        {sections.map((section, index) => (
          <motion.section
            key={index}
            className={`privacy-section ${section.isAlert ? 'alert-section' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="section-header">
              <div className="section-icon">{section.icon}</div>
              <h2>{section.title}</h2>
            </div>
            <div className="section-body">
              {section.highlight && (
                <p className="highlight-text">{section.highlight}</p>
              )}
              {section.content && <p>{section.content}</p>}
              {section.subsections && section.subsections.map((sub, subIdx) => (
                <div key={subIdx} className="subsection">
                  <h3>{sub.subtitle}</h3>
                  <ul className="policy-list">
                    {sub.items.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {section.items && (
                <ul className={`policy-list ${section.isCheckmark ? 'checkmark-list' : ''}`}>
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              )}
              {section.securityFeatures && (
                <div className="security-grid">
                  {section.securityFeatures.map((feature, featIdx) => (
                    <div key={featIdx} className="security-card">
                      <div className="security-icon">{feature.icon}</div>
                      <p>{feature.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        ))}

        {/* Contact Section */}
        <motion.section
          className="privacy-section contact-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-header">
            <div className="section-icon"><MessageCircle size={24} /></div>
            <h2>9. Liên Hệ</h2>
          </div>
          <div className="section-body">
            <div className="contact-grid">
              <div className="contact-card">
                <Mail size={28} />
                <div className="contact-info">
                  <span className="contact-label">Email</span>
                  <a href="mailto:support@skillverse.vn">support@skillverse.vn</a>
                </div>
              </div>
              <div className="contact-card">
                <Phone size={28} />
                <div className="contact-info">
                  <span className="contact-label">Điện thoại</span>
                  <a href="tel:0931430662">0931 430 662</a>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <div className="privacy-footer">
        <div className="footer-line"></div>
        <div className="footer-content">
          <Sparkles size={16} />
          <span>Cập nhật lần cuối: 27/11/2025</span>
          <Sparkles size={16} />
        </div>
        <div className="footer-line"></div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
