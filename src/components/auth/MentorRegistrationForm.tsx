import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Eye, EyeOff, Upload, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './MentorRegistrationForm.css';

interface MentorFormData {
  fullName: string;
  email: string;
  linkedinProfile: string;
  mainExpertise: string;
  yearsOfExperience: string;
  personalBio: string;
  password: string;
  confirmPassword: string;
}

const MentorRegistrationForm: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MentorFormData>({
    fullName: '',
    email: '',
    linkedinProfile: '',
    mainExpertise: '',
    yearsOfExperience: '',
    personalBio: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certifications, setCertifications] = useState<File[]>([]);

  const expertiseAreas = [
    'Công nghệ thông tin',
    'Thiết kế đồ họa',
    'Marketing số',
    'Kinh doanh',
    'Tài chính',
    'Quản lý dự án',
    'Phát triển phần mềm',
    'Phân tích dữ liệu',
    'UI/UX Design',
    'Viết nội dung',
    'SEO/SEM',
    'E-commerce',
    'Blockchain',
    'AI/Machine Learning',
    'DevOps',
    'Cybersecurity',
    'Khác'
  ];

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

    if (formData.linkedinProfile && !/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/.test(formData.linkedinProfile)) {
      newErrors.linkedinProfile = 'Vui lòng nhập URL LinkedIn hợp lệ';
    }

    if (!formData.mainExpertise) {
      newErrors.mainExpertise = 'Vui lòng chọn lĩnh vực chuyên môn';
    }

    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = 'Vui lòng nhập số năm kinh nghiệm';
    } else if (parseInt(formData.yearsOfExperience) < 0 || parseInt(formData.yearsOfExperience) > 50) {
      newErrors.yearsOfExperience = 'Số năm kinh nghiệm không hợp lệ';
    }

    if (!formData.personalBio.trim()) {
      newErrors.personalBio = 'Vui lòng nhập tiểu sử cá nhân';
    } else if (formData.personalBio.length < 50) {
      newErrors.personalBio = 'Tiểu sử cá nhân phải có ít nhất 50 ký tự';
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

    if (!cvFile) {
      newErrors.cv = 'Vui lòng tải lên CV hoặc Portfolio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.type.includes('pdf') || file.type.includes('image') || 
                         file.type.includes('msword') || file.type.includes('wordprocessingml');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (isValidType && isValidSize) {
        setCvFile(file);
        if (errors.cv) {
          setErrors(prev => ({ ...prev, cv: '' }));
        }
      } else {
        alert('Vui lòng chọn file PDF, DOC, DOCX hoặc hình ảnh dưới 10MB');
      }
    }
  };

  const handleCertificationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.includes('pdf') || file.type.includes('image');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    setCertifications(prev => [...prev, ...validFiles]);
  };

  const removeCv = () => {
    setCvFile(null);
  };

  const removeCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Mentor registration data:', {
        ...formData,
        cv: cvFile,
        certifications: certifications
      });
      // Handle registration logic here
      alert('Đăng ký mentor thành công!');
      navigate('/login');
    }
  };

  return (
    <div className="mentor-registration-container" data-theme={theme}>
      <div className="mentor-registration-content">
        <div className="registration-header">
          <button onClick={() => navigate('/login')} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại đăng nhập</span>
          </button>
          <div className="header-content">
            <div className="header-icon">
              <GraduationCap size={32} />
            </div>
            <h1>Đăng Ký Mentor</h1>
            <p>Chia sẻ kiến thức và kinh nghiệm của bạn với cộng đồng học viên</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mentor-registration-form">
          <div className="form-section">
            <h3>Thông Tin Cá Nhân</h3>
            
            <div className="form-group">
              <label htmlFor="fullName">Họ và Tên *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Nhập họ và tên đầy đủ"
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="mentor@email.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="linkedinProfile">LinkedIn Profile (Tùy chọn)</label>
              <input
                type="url"
                id="linkedinProfile"
                name="linkedinProfile"
                value={formData.linkedinProfile}
                onChange={handleInputChange}
                placeholder="https://www.linkedin.com/in/your-profile"
                className={errors.linkedinProfile ? 'error' : ''}
              />
              {errors.linkedinProfile && <span className="error-message">{errors.linkedinProfile}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Chuyên Môn & Kinh Nghiệm</h3>
            
            <div className="form-group">
              <label htmlFor="mainExpertise">Lĩnh Vực Chuyên Môn Chính *</label>
              <select
                id="mainExpertise"
                name="mainExpertise"
                value={formData.mainExpertise}
                onChange={handleInputChange}
                className={errors.mainExpertise ? 'error' : ''}
              >
                <option value="">Chọn lĩnh vực chuyên môn</option>
                {expertiseAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {errors.mainExpertise && <span className="error-message">{errors.mainExpertise}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="yearsOfExperience">Số Năm Kinh Nghiệm *</label>
              <input
                type="number"
                id="yearsOfExperience"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                placeholder="5"
                min="0"
                max="50"
                className={errors.yearsOfExperience ? 'error' : ''}
              />
              {errors.yearsOfExperience && <span className="error-message">{errors.yearsOfExperience}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="personalBio">Tiểu Sử Cá Nhân / Thành Tích *</label>
              <textarea
                id="personalBio"
                name="personalBio"
                value={formData.personalBio}
                onChange={handleInputChange}
                placeholder="Mô tả về bản thân, kinh nghiệm làm việc, thành tích và những gì bạn có thể chia sẻ với học viên..."
                rows={6}
                className={errors.personalBio ? 'error' : ''}
              />
              <small className="char-count">{formData.personalBio.length}/1000 ký tự</small>
              {errors.personalBio && <span className="error-message">{errors.personalBio}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Tài Liệu</h3>
            
            <div className="form-group">
              <label htmlFor="cv">CV hoặc Portfolio *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="cv"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleCvUpload}
                  className="file-input"
                />
                <div className="file-upload-content">
                  <Upload size={24} />
                  <p>Chọn CV hoặc Portfolio</p>
                  <span>PDF, DOC, DOCX, JPG, PNG (tối đa 10MB)</span>
                </div>
              </div>
              {errors.cv && <span className="error-message">{errors.cv}</span>}
              
              {cvFile && (
                <div className="uploaded-files">
                  <div className="file-item">
                    <span className="file-name">{cvFile.name}</span>
                    <button
                      type="button"
                      onClick={removeCv}
                      className="remove-file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="certifications">Chứng Chỉ (Tùy chọn)</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="certifications"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificationUpload}
                  className="file-input"
                />
                <div className="file-upload-content">
                  <Upload size={24} />
                  <p>Chọn chứng chỉ</p>
                  <span>PDF, JPG, PNG (tối đa 10MB mỗi file)</span>
                </div>
              </div>
              
              {certifications.length > 0 && (
                <div className="uploaded-files">
                  {certifications.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="remove-file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Bảo Mật</h3>
            
            <div className="form-group">
              <label htmlFor="password">Mật Khẩu *</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
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
              <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu *</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
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
            Đăng Ký Mentor
          </button>
        </form>

        <div className="auth-footer">
          <p>Đã có tài khoản mentor?</p>
          <Link to="/login" className="auth-link">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MentorRegistrationForm;
