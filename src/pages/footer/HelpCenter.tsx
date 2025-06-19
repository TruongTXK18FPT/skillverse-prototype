import React, { useState } from 'react';
import { Search, ChevronDown, MessageCircle, BookOpen, Shield, CreditCard, Users, Mail, Phone, MapPin } from 'react-feather';
import '../../styles/HelpCenter.css';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ElementType;
  faqs: FAQItem[];
}

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const faqCategories: FAQCategory[] = [
    {
      title: 'Tài Khoản & Bảo Mật',
      icon: Shield,
      faqs: [
        {
          question: 'Làm thế nào để thay đổi mật khẩu?',
          answer: 'Để thay đổi mật khẩu, vào Cài đặt > Bảo mật > Đổi mật khẩu. Điền mật khẩu cũ và mật khẩu mới của bạn.'
        },
        {
          question: 'Tôi quên mật khẩu phải làm sao?',
          answer: 'Bạn có thể sử dụng tính năng "Quên mật khẩu" trên trang đăng nhập. Chúng tôi sẽ gửi email hướng dẫn đặt lại mật khẩu.'
        }
      ]
    },
    {
      title: 'Khóa Học & Học Tập',
      icon: BookOpen,
      faqs: [
        {
          question: 'Làm sao để tìm khóa học phù hợp?',
          answer: 'Bạn có thể sử dụng công cụ tìm kiếm hoặc bộ lọc theo chủ đề, cấp độ và kỹ năng. AI của chúng tôi cũng sẽ đề xuất các khóa học phù hợp dựa trên sở thích và mục tiêu của bạn.'
        },
        {
          question: 'Tôi có thể học thử không?',
          answer: 'Có, mỗi khóa học đều có bài học thử miễn phí để bạn trải nghiệm trước khi quyết định đăng ký.'
        }
      ]
    },
    {
      title: 'Thanh Toán & Gói Dịch Vụ',
      icon: CreditCard,
      faqs: [
        {
          question: 'Các phương thức thanh toán được chấp nhận?',
          answer: 'Chúng tôi chấp nhận thanh toán qua thẻ tín dụng/ghi nợ, ví điện tử (Momo, ZaloPay), và chuyển khoản ngân hàng.'
        },
        {
          question: 'Chính sách hoàn tiền như thế nào?',
          answer: 'Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ ngày mua nếu chưa học quá 30% nội dung khóa học.'
        }
      ]
    },
    {
      title: 'Cộng Đồng & Hỗ Trợ',
      icon: Users,
      faqs: [
        {
          question: 'Làm sao để kết nối với học viên khác?',
          answer: 'Bạn có thể tham gia các nhóm học tập, diễn đàn thảo luận và các sự kiện trực tuyến của cộng đồng.'
        },
        {
          question: 'Có hỗ trợ kỹ thuật 24/7 không?',
          answer: 'Đội ngũ hỗ trợ của chúng tôi làm việc từ 8h-22h hàng ngày. Ngoài giờ làm việc, bạn có thể gửi ticket hỗ trợ.'
        }
      ]
    }
  ];

  const filteredFAQs = searchQuery
    ? faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
    : faqCategories;

// ...existing code...

return (
  <div className="sv-help-center">
    <div className="sv-help-center__header">
      <h1 className="sv-help-center__title">Trung Tâm Hỗ Trợ</h1>
      <p className="sv-help-center__subtitle">Chúng tôi luôn sẵn sàng giúp đỡ bạn</p>
      
      <div className="sv-help-center__search">
        <Search className="sv-help-center__search-icon" />
        <input
          type="text"
          className="sv-help-center__search-input"
          placeholder="Tìm kiếm câu hỏi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>

    <div className="sv-help-center__faq">
      {filteredFAQs.map((category, categoryIndex) => (
        <div key={categoryIndex} className="sv-help-center__category">
          <div
            className="sv-help-center__category-header"
            onClick={() => setSelectedCategory(selectedCategory === categoryIndex ? null : categoryIndex)}
          >
            <category.icon className="sv-help-center__category-icon" />
            <h2 className="sv-help-center__category-title">{category.title}</h2>
            <ChevronDown className={`sv-help-center__arrow ${selectedCategory === categoryIndex ? 'sv-help-center__arrow--rotated' : ''}`} />
          </div>
          
          <div className={`sv-help-center__faq-list ${selectedCategory === categoryIndex ? 'sv-help-center__faq-list--expanded' : ''}`}>
            {category.faqs.map((faq, faqIndex) => (
              <div key={faqIndex} className="sv-help-center__faq-item">
                <h3 className="sv-help-center__question">{faq.question}</h3>
                <p className="sv-help-center__answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="sv-help-center__contact">
      <h2 className="sv-help-center__contact-title">Vẫn cần hỗ trợ?</h2>
      <p>Liên hệ với chúng tôi qua các kênh sau:</p>
      
      <div className="sv-help-center__contact-grid">
        <div className="sv-help-center__contact-card">
          <Mail className="sv-help-center__contact-icon" />
          <h3 className="sv-help-center__contact-method">Email</h3>
          <p className="sv-help-center__contact-detail">support@skillverse.com</p>
        </div>
        
        <div className="sv-help-center__contact-card">
          <Phone className="sv-help-center__contact-icon" />
          <h3 className="sv-help-center__contact-method">Hotline</h3>
          <p className="sv-help-center__contact-detail">1800 1234</p>
        </div>
        
        <div className="sv-help-center__contact-card">
          <MessageCircle className="sv-help-center__contact-icon" />
          <h3 className="sv-help-center__contact-method">Live Chat</h3>
          <p className="sv-help-center__contact-detail">8:00 - 22:00</p>
        </div>
        
        <div className="sv-help-center__contact-card">
          <MapPin className="sv-help-center__contact-icon" />
          <h3 className="sv-help-center__contact-method">Văn Phòng</h3>
          <p className="sv-help-center__contact-detail">Quận 1, TP.HCM</p>
        </div>
      </div>
    </div>
  </div>
);

// ...existing code...
};

export default HelpCenter;