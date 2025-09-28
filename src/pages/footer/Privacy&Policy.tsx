import { Shield, Mail, Phone, MapPin, Info, Key, Database, Lock, UserCheck, Clock, AlertTriangle, FileText, MessageCircle } from 'lucide-react';
import '../../styles/Privacy&Policy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-container">
      <div className="policy-header">
        <Shield className="policy-header-icon" size={48} />
        <h1>Chính Sách Quyền Riêng Tư</h1>
        <p className="policy-subtitle">Cam kết bảo vệ thông tin của bạn tại SkillVerse</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <div className="section-header">
            <Info className="section-icon" />
            <h2>1. Giới Thiệu Chung</h2>
          </div>
          <div className="section-content">
            <p>Chúng tôi tại Skillverse cam kết bảo vệ quyền riêng tư của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ thông tin cá nhân của bạn khi bạn truy cập và sử dụng nền tảng của chúng tôi.</p>
          </div>
        </section>

        <section className="policy-section">
          <div className="section-header">
            <Key className="section-icon" />
            <h2>2. Thông Tin Chúng Tôi Thu Thập</h2>
          </div>
          <div className="section-content">
            <h3>a. Thông tin do bạn cung cấp:</h3>
            <ul className="policy-list">
              <li>Họ tên, email, số điện thoại</li>
              <li>Mật khẩu và thông tin đăng nhập</li>
              <li>Hồ sơ người dùng: độ tuổi, nghề nghiệp, kỹ năng, sở thích học tập</li>
              <li>Nội dung bạn tải lên: bình luận, câu hỏi, bài nộp</li>
            </ul>

            <h3>b. Thông tin tự động:</h3>
            <ul className="policy-list">
              <li>Địa chỉ IP, trình duyệt, thiết bị sử dụng</li>
              <li>Lịch sử truy cập, thời gian tương tác</li>
              <li>Cookie và công nghệ theo dõi hành vi người dùng</li>
            </ul>
          </div>
        </section>

        <section className="policy-section">
          <div className="section-header">
            <Database className="section-icon" />
            <h2>3. Mục Đích Sử Dụng Thông Tin</h2>
          </div>
          <div className="section-content">
            <ul className="policy-list">
              <li>Cung cấp, cải thiện dịch vụ học tập và trải nghiệm người dùng</li>
              <li>Cá nhân hoá nội dung, gợi ý khoá học phù hợp</li>
              <li>Phân tích dữ liệu hành vi để nâng cao chất lượng nền tảng</li>
              <li>Gửi thông báo, tài liệu học tập hoặc khuyến mãi (nếu có sự đồng ý)</li>
              <li>Đảm bảo bảo mật và phòng tránh gian lận</li>
            </ul>
          </div>
        </section>

        <section className="policy-section">
          <div className="section-header">
            <Lock className="section-icon" />
            <h2>4. Chia Sẻ Thông Tin Với Bên Thứ Ba</h2>
          </div>
          <div className="section-content alert-section">
            <p className="emphasis">Chúng tôi KHÔNG bán dữ liệu người dùng.</p>
            <p>Tuy nhiên, có thể chia sẻ thông tin với:</p>
            <ul className="policy-list">
              <li>Đối tác công nghệ (như dịch vụ lưu trữ, AI phân tích)</li>
              <li>Cơ quan pháp lý khi được yêu cầu bởi luật pháp</li>
              <li>Các bên hỗ trợ kỹ thuật, bảo trì và phát triển sản phẩm</li>
            </ul>
          </div>
        </section>

        <section className="policy-section">
          <div className="section-header">
            <UserCheck className="section-icon" />
            <h2>5. Quyền Lựa Chọn và Kiểm Soát</h2>
          </div>
          <div className="section-content">
            <p>Bạn có quyền:</p>
            <ul className="policy-list checkmark-list">
              <li>Truy cập, chỉnh sửa hoặc xoá thông tin cá nhân</li>
              <li>Yêu cầu không nhận email quảng cáo</li>
              <li>Hạn chế việc chúng tôi sử dụng dữ liệu của bạn cho phân tích</li>
            </ul>
          </div>
        </section>

        <section className="policy-section">
          <div className="section-header">
            <Clock className="section-icon" />
            <h2>6. Lưu Trữ và Bảo Mật Dữ Liệu</h2>
          </div>
          <div className="section-content security-section">
            <div className="security-feature">
              <Lock size={24} />
              <p>Mã hoá dữ liệu và tường lửa bảo mật</p>
            </div>
            <div className="security-feature">
              <Database size={24} />
              <p>Lưu trữ tại trung tâm dữ liệu đạt chuẩn quốc tế</p>
            </div>
            <div className="security-feature">
              <Clock size={24} />
              <p>Thời gian lưu trữ: 3 năm kể từ lần tương tác cuối</p>
            </div>
          </div>
        </section>

        <section className="policy-section">
          <div className="section-header">
            <AlertTriangle className="section-icon" />
            <h2>7. Dữ Liệu Người Dưới 18 Tuổi</h2>
          </div>
          <div className="section-content alert-section">
            <p>Skillverse không hướng tới trẻ em dưới 13 tuổi. Nếu phát hiện có thông tin trẻ em được thu thập, chúng tôi sẽ nhanh chóng xoá bỏ dữ liệu đó.</p>
          </div>
        </section>

        <section className="policy-section">
          <div className="section-header">
            <FileText className="section-icon" />
            <h2>8. Thay Đổi Chính Sách</h2>
          </div>
          <div className="section-content">
            <p>Skillverse có thể cập nhật Chính sách Quyền Riêng Tư theo thời gian. Người dùng sẽ được thông báo rõ ràng trước khi thay đổi có hiệu lực.</p>
          </div>
        </section>

        <section className="policy-section contact-section">
          <div className="section-header">
            <MessageCircle className="section-icon" />
            <h2>9. Liên Hệ</h2>
          </div>
          <div className="section-content">
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={20} />
                <p>Email: support@skillverse.com</p>
              </div>
              <div className="contact-item">
                <Phone size={20} />
                <p>Điện thoại: (+84) XXX XXX XXX</p>
              </div>
              <div className="contact-item">
                <MapPin size={20} />
                <p>Địa chỉ: Quận 7, TP.HCM</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="policy-footer">
        <p>Cập nhật lần cuối: 18/06/2025</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
