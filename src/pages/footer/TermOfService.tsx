import React from 'react';
import { 
  Book, Shield, UserCheck, Users, Brain, CreditCard, 
  AlertTriangle, Scale, Mail, Phone, MapPin
} from 'lucide-react';
import '../../styles/TermOfService.css';

const TermOfService = () => {
  return (
    <div className="terms-container">
      <div className="terms-header">
        <Shield className="terms-header-icon" size={48} />
        <h1>Điều Khoản Sử Dụng</h1>
        <p>Cập nhật lần cuối: 18/06/2025</p>
      </div>

      <div className="terms-content">
        <section className="terms-section" id="intro">
          <h2>1. Giới thiệu</h2>
          <p>Chào mừng bạn đến với Skillverse – nền tảng học tập kỹ năng cá nhân và nghề nghiệp thông qua AI, chuyên gia và các khoá học tùy chỉnh. Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản dưới đây.</p>
        </section>

        <section className="terms-section" id="services">
          <h2>2. Dịch vụ cung cấp</h2>
          <div className="services-grid">
            <div className="service-card">
              <Book className="service-icon" />
              <h3>2.1. Học tập kỹ năng</h3>
              <ul>
                <li>Các khóa học về kỹ năng mềm, kỹ năng chuyên môn</li>
                <li>Tư duy logic, sáng tạo, quản lý thời gian</li>
                <li>Tùy chỉnh lộ trình học dựa trên bài kiểm tra đầu vào</li>
              </ul>
            </div>

            <div className="service-card">
              <Brain className="service-icon" />
              <h3>2.2. AI phản hồi và đánh giá</h3>
              <p>Phân tích bài làm, bài viết, tương tác để đưa ra phản hồi tự động về tiến độ và đề xuất học tập.</p>
            </div>

            <div className="service-card">
              <Users className="service-icon" />
              <h3>2.3. Kết nối với chuyên gia</h3>
              <p>Người dùng có thể đặt lịch tư vấn 1-1 hoặc tham gia hội thảo do chuyên gia giảng dạy.</p>
            </div>

            <div className="service-card">
              < CreditCard className="service-icon" />
              <h3>2.4. Cộng đồng người học</h3>
              <p>Diễn đàn chia sẻ, thảo luận, hỏi – đáp giữa người học và giảng viên.</p>
            </div>
          </div>
        </section>

        <section className="terms-section" id="account">
          <h2>3. Tài khoản người dùng</h2>
          <div className="account-requirements">
            <div className="requirement-item">
              <h3>3.1. Điều kiện đăng ký</h3>
              <ul>
                <li>Người dùng cá nhân phải từ 13 tuổi trở lên</li>
                <li>Người dùng dưới 18 tuổi phải có sự đồng ý từ phụ huynh/người giám hộ</li>
              </ul>
            </div>
            <div className="requirement-item">
              <h3>3.2. Trách nhiệm của bạn</h3>
              <ul>
                <li>Bảo mật thông tin đăng nhập</li>
                <li>Không chia sẻ tài khoản cho người khác</li>
                <li>Cập nhật thông tin chính xác, trung thực</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="terms-section" id="behavior">
          <h2>4. Hành vi người dùng được chấp nhận</h2>
          <div className="behavior-grid">
            <div className="behavior-card accepted">
              <h3>Người dùng PHẢI:</h3>
              <ul>
                <li>Tôn trọng người khác khi tham gia cộng đồng</li>
                <li>Chỉ tải lên nội dung do chính bạn tạo ra hoặc được quyền sử dụng</li>
                <li>Sử dụng dịch vụ đúng mục đích học tập</li>
              </ul>
            </div>
            <div className="behavior-card prohibited">
              <h3>Người dùng KHÔNG ĐƯỢC:</h3>
              <ul>
                <li>Sử dụng AI để gian lận hoặc lách luật kiểm tra</li>
                <li>Tạo tài khoản giả hoặc sử dụng danh tính giả mạo</li>
                <li>Tải lên hoặc chia sẻ nội dung phản cảm, vi phạm pháp luật</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="terms-section" id="content">
          <h2>5. Nội dung và quyền sở hữu</h2>
          <div className="content-ownership">
            <div className="ownership-card">
              <h3>5.1. Nội dung của Skillverse</h3>
              <ul>
                <li>Bao gồm video học, bài giảng, AI engine, giao diện người dùng</li>
                <li>Thuộc bản quyền Skillverse hoặc đối tác cấp phép</li>
              </ul>
            </div>
            <div className="ownership-card">
              <h3>5.2. Nội dung bạn tạo ra</h3>
              <ul>
                <li>Bạn giữ quyền sở hữu đối với nội dung do bạn tạo</li>
                <li>Cấp quyền sử dụng cho Skillverse để cải thiện sản phẩm</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="terms-section" id="payment">
          <h2>6. Thanh toán và hoàn tiền</h2>
          <div className="payment-info">
            <div className="payment-card">
              <h3>6.1. Dịch vụ miễn phí</h3>
              <p>Truy cập cơ bản, bài học thử, bài kiểm tra trình độ</p>
            </div>
            <div className="payment-card">
              <h3>6.2. Dịch vụ trả phí (Pro/Plus)</h3>
              <ul>
                <li>Khoá học nâng cao, AI feedback chi tiết, lịch học 1-1</li>
                <li>Thanh toán qua thẻ tín dụng, Momo, ZaloPay, VNPay…</li>
              </ul>
            </div>
            <div className="payment-card">
              <h3>6.3. Chính sách hoàn tiền</h3>
              <ul>
                <li>Hoàn tiền 100% trong vòng 7 ngày nếu chưa học quá 30% nội dung</li>
                <li>Sau thời gian/giới hạn trên, không hoàn lại</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="terms-section" id="termination">
          <h2>7. Tạm ngưng hoặc chấm dứt dịch vụ</h2>
          <div className="termination-notice">
            <p>Skillverse có quyền cảnh báo, khoá hoặc xoá vĩnh viễn tài khoản nếu người dùng:</p>
            <ul>
              <li>Vi phạm các điều khoản nêu trên</li>
              <li>Có hành vi gian lận hoặc gây tổn hại đến hệ thống hoặc người khác</li>
              <li>Sử dụng dịch vụ sai mục đích</li>
            </ul>
          </div>
        </section>

        <section className="terms-section" id="liability">
          <h2>8. Trách nhiệm pháp lý</h2>
          <div className="liability-notice">
            <p>Skillverse KHÔNG chịu trách nhiệm nếu:</p>
            <ul>
              <li>Dữ liệu bị mất do sự cố ngoài ý muốn</li>
              <li>Nội dung do người dùng đăng tải gây tranh cãi</li>
              <li>Áp dụng sai kiến thức dẫn đến thiệt hại</li>
            </ul>
          </div>
        </section>

        <section className="terms-section" id="updates">
          <h2>9. Cập nhật điều khoản</h2>
          <p>Skillverse có quyền thay đổi điều khoản vào bất cứ thời điểm nào. Chúng tôi sẽ thông báo qua email hoặc popup trong tài khoản.</p>
        </section>

        <section className="terms-section" id="law">
          <h2>10. Luật áp dụng và giải quyết tranh chấp</h2>
          <p>Mọi tranh chấp liên quan sẽ được xử lý theo pháp luật Việt Nam. Trong trường hợp hai bên không tự thoả thuận được, vụ việc sẽ được chuyển đến Toà án Nhân dân có thẩm quyền tại TP. Hồ Chí Minh.</p>
        </section>

        <section className="terms-section" id="contact">
          <h2>11. Liên hệ</h2>
          <div className="contact-info">
            <div className="contact-item">
              <Mail className="contact-icon" />
              <p>Email: support@skillverse.com</p>
            </div>
            <div className="contact-item">
              <Phone className="contact-icon" />
              <p>Hotline: (+84) XXX XXX XXX</p>
            </div>
            <div className="contact-item">
              <MapPin className="contact-icon" />
              <p>Trụ sở: Quận 7, TP.HCM</p>
            </div>
          </div>
        </section>
      </div>

      <div className="terms-footer">
        <p>© 2025 Skillverse. All rights reserved.</p>
      </div>
    </div>
  );
};

export default TermOfService;
