import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Lock, ArrowLeft, Phone, MapPin, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/AuthPages.css';
import { Province, District } from '../../types/Location';

const RegisterPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    gender: '',
    phone: '',
    provinceCode: '',
    districtCode: '',
    address: ''
  });
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch provinces when component mounts
    fetch('https://provinces.open-api.vn/api/p/')
      .then(response => response.json())
      .then(data => setProvinces(data))
      .catch(error => console.error('Error fetching provinces:', error));
  }, []);

  useEffect(() => {
    // Fetch districts when province changes
    if (formData.provinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${formData.provinceCode}?depth=2`)
        .then(response => response.json())
        .then(data => setDistricts(data.districts))
        .catch(error => console.error('Error fetching districts:', error));
    }
  }, [formData.provinceCode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Vui lòng nhập email hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!formData.birthday) {
      newErrors.birthday = 'Vui lòng chọn ngày sinh';
    }

    if (!formData.gender) {
      newErrors.gender = 'Vui lòng chọn giới tính';
    }

    if (!formData.phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.provinceCode) {
      newErrors.provinceCode = 'Vui lòng chọn tỉnh/thành phố';
    }

    if (!formData.districtCode) {
      newErrors.districtCode = 'Vui lòng chọn quận/huyện';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ chi tiết';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle registration logic here
      console.log('Form submitted:', formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  return (
    <div className="auth-container" data-theme={theme}>
      <div className="auth-content">
        <div className="auth-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1>Tạo Tài Khoản</h1>
          <p>Tham gia cộng đồng học viên và bắt đầu hành trình của bạn ngay hôm nay</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-grid">            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Họ và Tên</label>
              <div className="input-group">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                  className={errors.fullName ? 'error' : ''}
                />
              </div>
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            {/* Gender */}
            <div className="form-group">
              <label htmlFor="gender">Giới Tính</label>
              <div className="input-group">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={errors.gender ? 'error' : ''}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>
            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">Số Điện Thoại</label>
              <div className="input-group">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className={errors.phone ? 'error' : ''}
                />
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Địa Chỉ Email</label>
              <div className="input-group">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn"
                  className={errors.email ? 'error' : ''}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Location Fields */}
            <div className="form-group form-full-width location-fields">
              <div className="location-group">
                {/* Province/City */}
                <div className="form-group">
                  <label htmlFor="provinceCode">Tỉnh/Thành Phố</label>
                  <div className="input-group">
                    <select
                      id="provinceCode"
                      name="provinceCode"
                      value={formData.provinceCode}
                      onChange={handleChange}
                      className={errors.provinceCode ? 'error' : ''}
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      {provinces.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.provinceCode && <span className="error-message">{errors.provinceCode}</span>}
                </div>

                {/* District */}
                <div className="form-group">
                  <label htmlFor="districtCode">Quận/Huyện</label>
                  <div className="input-group">
                    <select
                      id="districtCode"
                      name="districtCode"
                      value={formData.districtCode}
                      onChange={handleChange}
                      className={errors.districtCode ? 'error' : ''}
                      disabled={!formData.provinceCode}
                    >
                      <option value="">Chọn quận/huyện</option>
                      {districts.map((district) => (
                        <option key={district.code} value={district.code}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.districtCode && <span className="error-message">{errors.districtCode}</span>}
                </div>
              </div>

              {/* Detailed Address */}
              <div className="form-group">
                <label htmlFor="address">Địa Chỉ Chi Tiết</label>
                <div className="input-group">
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ chi tiết"
                    className={errors.address ? 'error' : ''}
                  />
                </div>
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>
            </div>

            {/* Password Fields */}
            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tạo mật khẩu"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" className="submit-button">
            Tạo Tài Khoản
          </button>
        </form>

        <div className="auth-footer">
          <p>Đã có tài khoản?</p>
          <Link to="/login" className="auth-link">
            Đăng nhập
          </Link>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-features">
          <h2>Tại Sao Chọn SkillVerse?</h2>
          <ul>
            <li>
              <div className="feature-icon">🎯</div>
              <div className="feature-text">
                <h3>Lộ Trình Học Tập Cá Nhân Hóa</h3>
                <p>Tùy chỉnh hành trình học tập dựa trên mục tiêu và sở thích của bạn</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">👥</div>
              <div className="feature-text">
                <h3>Cộng Đồng Chuyên Gia</h3>
                <p>Kết nối với các chuyên gia trong ngành và đồng học viên</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">🏆</div>
              <div className="feature-text">
                <h3>Chứng Chỉ Kỹ Năng</h3>
                <p>Nhận chứng chỉ để thể hiện thành tích của bạn</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">💡</div>
              <div className="feature-text">
                <h3>Học Tập Tương Tác</h3>
                <p>Học thông qua các dự án thực hành và ứng dụng thực tế</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
