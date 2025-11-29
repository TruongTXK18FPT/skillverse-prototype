import { 
  Book, Shield, Users, Brain, CreditCard, 
  Mail, Phone, MapPin
} from 'lucide-react';
import '../../styles/TermOfService.css';

const TermOfService = () => {
  return (
    <div className="tos-page">
      <div className="tos-bg-effects">
        <div className="tos-grid-overlay" />
        <div className="tos-glow-orb tos-orb-1" />
        <div className="tos-glow-orb tos-orb-2" />
        <div className="tos-glow-orb tos-orb-3" />
      </div>

      <section className="tos-hero">
        <div className="tos-hero-content">
          <div className="tos-hero-icon-container">
            <Shield className="tos-hero-icon" size={56} />
            <div className="tos-icon-glow-ring" />
          </div>
          <h1 className="tos-hero-title">
            <span className="tos-title-gradient">Điều Khoản Sử Dụng</span>
          </h1>
          <p className="tos-hero-tagline">Cập nhật lần cuối: 18/06/2025</p>
          <p className="tos-hero-description">
            Bằng việc sử dụng Skillverse, bạn đồng ý tuân thủ các điều khoản sau đây nhằm đảm bảo trải nghiệm học tập an toàn, minh bạch và hiệu quả.
          </p>
        </div>
      </section>

      <div className="tos-content">
        <section className="tos-section" id="intro">
          <h2>1. Giới thiệu</h2>
          <p>Chào mừng bạn đến với Skillverse – nền tảng học tập kỹ năng cá nhân và nghề nghiệp thông qua AI, chuyên gia và các khoá học tùy chỉnh. Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản dưới đây.</p>
        </section>

        <section className="tos-section" id="services">
          <h2>2. Dịch vụ cung cấp</h2>
          <div className="tos-services-grid">
            <div className="tos-service-card">
              <Book className="tos-service-icon" />
              <h3>2.1. Học tập kỹ năng</h3>
              <ul>
                <li>Các khóa học về kỹ năng mềm, kỹ năng chuyên môn</li>
                <li>Tư duy logic, sáng tạo, quản lý thời gian</li>
                <li>Tùy chỉnh lộ trình học dựa trên bài kiểm tra đầu vào</li>
              </ul>
            </div>

            <div className="tos-service-card">
              <Brain className="tos-service-icon" />
              <h3>2.2. AI phản hồi và đánh giá</h3>
              <p>Phân tích bài làm, bài viết, tương tác để đưa ra phản hồi tự động về tiến độ và đề xuất học tập.</p>
            </div>

            <div className="tos-service-card">
              <Users className="tos-service-icon" />
              <h3>2.3. Kết nối với chuyên gia</h3>
              <p>Người dùng có thể đặt lịch tư vấn 1-1 hoặc tham gia hội thảo do chuyên gia giảng dạy.</p>
            </div>

            <div className="tos-service-card">
              <CreditCard className="tos-service-icon" />
              <h3>2.4. Cộng đồng người học</h3>
              <p>Diễn đàn chia sẻ, thảo luận, hỏi – đáp giữa người học và giảng viên.</p>
            </div>
          </div>
        </section>

        <section className="tos-section" id="account">
          <h2>3. Tài khoản người dùng</h2>
          <div className="tos-account-requirements">
            <div className="tos-requirement-item">
              <h3>3.1. Điều kiện đăng ký</h3>
              <ul>
                <li>Người dùng cá nhân phải từ 13 tuổi trở lên</li>
                <li>Người dùng dưới 18 tuổi phải có sự đồng ý từ phụ huynh/người giám hộ</li>
              </ul>
            </div>
            <div className="tos-requirement-item">
              <h3>3.2. Trách nhiệm của bạn</h3>
              <ul>
                <li>Bảo mật thông tin đăng nhập</li>
                <li>Không chia sẻ tài khoản cho người khác</li>
                <li>Cập nhật thông tin chính xác, trung thực</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="tos-section" id="behavior">
          <h2>4. Hành vi người dùng được chấp nhận</h2>
          <div className="tos-behavior-grid">
            <div className="tos-behavior-card accepted">
              <h3>Người dùng PHẢI:</h3>
              <ul>
                <li>Tôn trọng người khác khi tham gia cộng đồng</li>
                <li>Chỉ tải lên nội dung do chính bạn tạo ra hoặc được quyền sử dụng</li>
                <li>Sử dụng dịch vụ đúng mục đích học tập</li>
              </ul>
            </div>
            <div className="tos-behavior-card prohibited">
              <h3>Người dùng KHÔNG ĐƯỢC:</h3>
              <ul>
                <li>Sử dụng AI để gian lận hoặc lách luật kiểm tra</li>
                <li>Tạo tài khoản giả hoặc sử dụng danh tính giả mạo</li>
                <li>Tải lên hoặc chia sẻ nội dung phản cảm, vi phạm pháp luật</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="tos-section" id="content">
          <h2>5. Nội dung và quyền sở hữu</h2>
          <div className="tos-content-ownership">
            <div className="tos-ownership-card">
              <h3>5.1. Nội dung của Skillverse</h3>
              <ul>
                <li>Bao gồm video học, bài giảng, AI engine, giao diện người dùng</li>
                <li>Thuộc bản quyền Skillverse hoặc đối tác cấp phép</li>
              </ul>
            </div>
            <div className="tos-ownership-card">
              <h3>5.2. Nội dung bạn tạo ra</h3>
              <ul>
                <li>Bạn giữ quyền sở hữu đối với nội dung do bạn tạo</li>
                <li>Cấp quyền sử dụng cho Skillverse để cải thiện sản phẩm</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="tos-section" id="payment">
          <h2>6. Thanh toán và hoàn tiền</h2>
          <div className="tos-payment-info">
            <div className="tos-payment-card">
              <h3>6.1. Dịch vụ miễn phí</h3>
              <p>Truy cập cơ bản, bài học thử, bài kiểm tra trình độ</p>
            </div>
            <div className="tos-payment-card">
              <h3>6.2. Dịch vụ trả phí (Pro/Plus)</h3>
              <ul>
                <li>Khoá học nâng cao, AI feedback chi tiết, lịch học 1-1</li>
                <li>Thanh toán qua thẻ tín dụng, Momo, ZaloPay, VNPay…</li>
              </ul>
            </div>
            <div className="tos-payment-card">
              <h3>6.3. Chính sách hoàn tiền</h3>
              <ul>
                <li>Hoàn tiền 100% trong vòng 7 ngày nếu chưa học quá 30% nội dung</li>
                <li>Sau thời gian/giới hạn trên, không hoàn lại</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="tos-section" id="termination">
          <h2>7. Tạm ngưng hoặc chấm dứt dịch vụ</h2>
          <div className="tos-termination-notice">
            <p>Skillverse có quyền cảnh báo, khoá hoặc xoá vĩnh viễn tài khoản nếu người dùng:</p>
            <ul>
              <li>Vi phạm các điều khoản nêu trên</li>
              <li>Có hành vi gian lận hoặc gây tổn hại đến hệ thống hoặc người khác</li>
              <li>Sử dụng dịch vụ sai mục đích</li>
            </ul>
          </div>
        </section>

        <section className="tos-section" id="liability">
          <h2>8. Trách nhiệm pháp lý</h2>
          <div className="tos-liability-notice">
            <p>Skillverse KHÔNG chịu trách nhiệm nếu:</p>
            <ul>
              <li>Dữ liệu bị mất do sự cố ngoài ý muốn</li>
              <li>Nội dung do người dùng đăng tải gây tranh cãi</li>
              <li>Áp dụng sai kiến thức dẫn đến thiệt hại</li>
            </ul>
          </div>
        </section>

        <section className="tos-section" id="updates">
          <h2>9. Cập nhật điều khoản</h2>
          <p>Skillverse có quyền thay đổi điều khoản vào bất cứ thời điểm nào. Chúng tôi sẽ thông báo qua email hoặc popup trong tài khoản.</p>
        </section>

        <section className="tos-section" id="law">
          <h2>10. Luật áp dụng và giải quyết tranh chấp</h2>
          <p>Mọi tranh chấp liên quan sẽ được xử lý theo pháp luật Việt Nam. Trong trường hợp hai bên không tự thoả thuận được, vụ việc sẽ được chuyển đến Toà án Nhân dân có thẩm quyền tại TP. Hồ Chí Minh.</p>
        </section>

        <section className="tos-section" id="contact">
          <h2>11. Liên hệ</h2>
          <div className="tos-contact-info">
            <div className="tos-contact-item">
              <Mail className="tos-contact-icon" />
              <p>Email: contact@skillverse.vn</p>
            </div>
            <div className="tos-contact-item">
              <Phone className="tos-contact-icon" />
              <p>Hotline: 0931430662</p>
            </div>
            <div className="tos-contact-item">
              <MapPin className="tos-contact-icon" />
              <p>Trụ sở: Đại học FPT</p>
            </div>
          </div>
        </section>
      </div>

      <div className="tos-footer">
        <p>© 2025 Skillverse. All rights reserved.</p>
      </div>
    </div>
  );
};

export default TermOfService;
