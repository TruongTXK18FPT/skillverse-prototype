import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Eye, EyeOff, Upload, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './BusinessRegistrationForm.css';

interface BusinessFormData {
  companyName: string;
  businessEmail: string;
  companyWebsite: string;
  businessAddress: string;
  taxId: string;
  password: string;
  confirmPassword: string;
}

const BusinessRegistrationForm: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BusinessFormData>({
    companyName: '',
    businessEmail: '',
    companyWebsite: '',
    businessAddress: '',
    taxId: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyDocuments, setCompanyDocuments] = useState<File[]>([]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Check if it's not a common personal email domain
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return !personalDomains.includes(domain);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Vui lòng nhập tên công ty';
    }

    if (!formData.businessEmail.trim()) {
      newErrors.businessEmail = 'Vui lòng nhập email doanh nghiệp';
    } else if (!validateEmail(formData.businessEmail)) {
      newErrors.businessEmail = 'Vui lòng sử dụng email doanh nghiệp (không phải Gmail cá nhân)';
    }

    if (!formData.companyWebsite.trim()) {
      newErrors.companyWebsite = 'Vui lòng nhập website công ty';
    } else if (!/^https?:\/\/.+\..+/.test(formData.companyWebsite)) {
      newErrors.companyWebsite = 'Vui lòng nhập URL hợp lệ (bao gồm http:// hoặc https://)';
    }

    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = 'Vui lòng nhập địa chỉ doanh nghiệp';
    }

    if (!formData.taxId.trim()) {
      newErrors.taxId = 'Vui lòng nhập mã số thuế hoặc số đăng ký kinh doanh';
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

    if (companyDocuments.length === 0) {
      newErrors.documents = 'Vui lòng tải lên tài liệu công ty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.includes('pdf') || file.type.includes('image');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    setCompanyDocuments(prev => [...prev, ...validFiles]);
    if (errors.documents) {
      setErrors(prev => ({ ...prev, documents: '' }));
    }
  };

  const removeDocument = (index: number) => {
    setCompanyDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Business registration data:', {
        ...formData,
        documents: companyDocuments
      });
      // Handle registration logic here
      alert('Đăng ký doanh nghiệp thành công!');
      navigate('/login');
    }
  };

  return (
    <div className="business-registration-container" data-theme={theme}>
      <div className="business-registration-content">
        <div className="registration-header">
          <button onClick={() => navigate('/login')} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại đăng nhập</span>
          </button>
          <div className="header-content">
            <div className="header-icon">
              <Building2 size={32} />
            </div>
            <h1>Đăng Ký Doanh Nghiệp</h1>
            <p>Tạo tài khoản doanh nghiệp để đăng tuyển và tìm kiếm nhân tài</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="business-registration-form">
          <div className="form-section">
            <h3>Thông Tin Công Ty</h3>
            
            <div className="form-group">
              <label htmlFor="companyName">Tên Công Ty *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Nhập tên công ty"
                className={errors.companyName ? 'error' : ''}
              />
              {errors.companyName && <span className="error-message">{errors.companyName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="businessEmail">Email Doanh Nghiệp *</label>
              <input
                type="email"
                id="businessEmail"
                name="businessEmail"
                value={formData.businessEmail}
                onChange={handleInputChange}
                placeholder="contact@company.com"
                className={errors.businessEmail ? 'error' : ''}
              />
              {errors.businessEmail && <span className="error-message">{errors.businessEmail}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="companyWebsite">Website Công Ty *</label>
              <input
                type="url"
                id="companyWebsite"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleInputChange}
                placeholder="https://www.company.com"
                className={errors.companyWebsite ? 'error' : ''}
              />
              {errors.companyWebsite && <span className="error-message">{errors.companyWebsite}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="businessAddress">Địa Chỉ Doanh Nghiệp *</label>
              <input
                type="text"
                id="businessAddress"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ doanh nghiệp"
                className={errors.businessAddress ? 'error' : ''}
              />
              {errors.businessAddress && <span className="error-message">{errors.businessAddress}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="taxId">Mã Số Thuế / Số Đăng Ký Kinh Doanh *</label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                placeholder="Nhập mã số thuế"
                className={errors.taxId ? 'error' : ''}
              />
              {errors.taxId && <span className="error-message">{errors.taxId}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Tài Liệu Công Ty</h3>
            
            <div className="form-group">
              <label htmlFor="documents">Tải Lên Tài Liệu Công Ty *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="documents"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <div className="file-upload-content">
                  <Upload size={24} />
                  <p>Chọn tài liệu hoặc kéo thả vào đây</p>
                  <span>PDF, JPG, PNG (tối đa 10MB mỗi file)</span>
                </div>
              </div>
              {errors.documents && <span className="error-message">{errors.documents}</span>}
              
              {companyDocuments.length > 0 && (
                <div className="uploaded-files">
                  {companyDocuments.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
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
            Đăng Ký Doanh Nghiệp
          </button>
        </form>

        <div className="auth-footer">
          <p>Đã có tài khoản doanh nghiệp?</p>
          <Link to="/login" className="auth-link">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegistrationForm;
