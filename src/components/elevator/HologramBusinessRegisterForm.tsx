import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Building2, Lock, Mail, Phone, MapPin, FileText, Globe, AlertTriangle, User, Users, Briefcase, Upload, X } from 'lucide-react';
import { useElevator } from './ElevatorAuthLayout';
import Logo from '../../assets/skillverse.png';
import './HologramBusinessRegisterForm.css';

interface BusinessRegisterData {
  companyName: string;
  businessEmail: string;
  companyWebsite: string;
  businessAddress: string;
  taxId: string;
  password: string;
  confirmPassword: string;
  contactPersonName: string;
  contactPersonPhone: string; // Changed from optional to required for controlled input
  contactPersonPosition: string;
  companySize: string;
  industry: string;
  companyDocuments?: File[];
}

interface HologramBusinessRegisterFormProps {
  onSubmit: (data: BusinessRegisterData) => Promise<{ success: boolean; companyName?: string; error?: string }>;
  onGoogleRegister?: () => void;
  isLoading?: boolean;
  isGoogleLoading?: boolean;
  googleRegisterSuccess?: { userName: string } | null;
}

const HologramBusinessRegisterForm: React.FC<HologramBusinessRegisterFormProps> = ({
  onSubmit,
  onGoogleRegister,
  isLoading = false,
  isGoogleLoading = false,
  googleRegisterSuccess,
}) => {
  const { triggerLoginSuccess } = useElevator();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<BusinessRegisterData>({
    companyName: '',
    businessEmail: '',
    companyWebsite: '',
    businessAddress: '',
    taxId: '',
    password: '',
    confirmPassword: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonPosition: '',
    companySize: '',
    industry: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [companyDocuments, setCompanyDocuments] = useState<File[]>([]);
  const [domainHint, setDomainHint] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle autofill detection for Chrome
  const handleAutofill = (e: React.AnimationEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    if (value) {
      setFormData(prev => ({ ...prev, [name]: value }));
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
  };

  const removeDocument = (index: number) => {
    setCompanyDocuments(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const email = formData.businessEmail.trim().toLowerCase();
    const website = formData.companyWebsite.trim().toLowerCase();
    const emailDomain = email.includes('@') ? email.split('@').pop() || '' : '';
    let host = '';
    try {
      if (website) {
        const u = new URL(website.startsWith('http') ? website : `https://${website}`);
        host = u.hostname.replace(/^www\./, '');
      }
    } catch { host = ''; }
    const freeDomains = new Set(['gmail.com','yahoo.com','outlook.com','hotmail.com']);
    if (host && emailDomain && emailDomain !== host && freeDomains.has(emailDomain)) {
      setDomainHint('Khuyến nghị sử dụng email theo tên miền website công ty.');
    } else {
      setDomainHint(null);
    }
  }, [formData.businessEmail, formData.companyWebsite]);

  const validateForm = (): string | null => {
    if (!formData.companyName.trim()) return 'Vui lòng nhập tên công ty';
    if (!formData.businessEmail.trim()) return 'Vui lòng nhập email';
    if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) return 'Email không hợp lệ';
    if (!formData.password) return 'Vui lòng nhập mật khẩu';
    if (formData.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (!formData.contactPersonName.trim()) return 'Vui lòng nhập tên người liên hệ';
    if (!formData.contactPersonPosition.trim()) return 'Vui lòng nhập chức vụ';
    if (!formData.companySize) return 'Vui lòng chọn quy mô công ty';
    if (!formData.industry.trim()) return 'Vui lòng nhập ngành nghề';
    if (!formData.taxId.trim()) return 'Vui lòng nhập mã số thuế';
    if (!/^\d{10}(?:\d{3})?$/.test(formData.taxId)) return 'Mã số thuế phải gồm 10 hoặc 13 chữ số';
    if (!formData.companyWebsite.trim()) return 'Vui lòng nhập website công ty';
    if (!formData.businessAddress.trim()) return 'Vui lòng nhập địa chỉ doanh nghiệp';
    if (companyDocuments.length === 0) return 'Vui lòng tải lên tài liệu doanh nghiệp (PDF)';
    if (!companyDocuments.some(f => f.type === 'application/pdf')) return 'Cần ít nhất một tệp PDF giấy phép kinh doanh';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[BusinessForm] Submit started');

    const validationError = validateForm();
    if (validationError) {
      console.log('[BusinessForm] Validation error:', validationError);
      setError(validationError);
      return;
    }

    // Chuyển đổi từ local formData sang format mà Page component mong đợi
    const submitData: BusinessRegisterData = {
      companyName: formData.companyName,
      businessEmail: formData.businessEmail,
      companyWebsite: formData.companyWebsite,
      businessAddress: formData.businessAddress,
      taxId: formData.taxId,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      contactPersonName: formData.contactPersonName,
      contactPersonPhone: formData.contactPersonPhone || '',
      contactPersonPosition: formData.contactPersonPosition,
      companySize: formData.companySize,
      industry: formData.industry,
      companyDocuments: companyDocuments.length > 0 ? companyDocuments : undefined
    };

    console.log('[BusinessForm] Calling onSubmit with data:', submitData);
    const result = await onSubmit(submitData);
    console.log('[BusinessForm] onSubmit result:', result);

    if (result.success) {
      console.log('[BusinessForm] Success! Triggering login animation');
      await triggerLoginSuccess(result.companyName || formData.companyName);
      console.log('[BusinessForm] Animation complete');
    } else if (result.error) {
      console.log('[BusinessForm] Error:', result.error);
      setError(result.error);
    }
  };

  return (
    <motion.div
      className="reg-business-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Hologram Border Effect */}
      <div className="reg-business-border">
        <div className="reg-business-corner top-left"></div>
        <div className="reg-business-corner top-right"></div>
        <div className="reg-business-corner bottom-left"></div>
        <div className="reg-business-corner bottom-right"></div>
        <div className="reg-business-line top"></div>
        <div className="reg-business-line bottom"></div>
        <div className="reg-business-line left"></div>
        <div className="reg-business-line right"></div>
      </div>

      {/* Form Content */}
      <div className="reg-business-content">
        {/* Left Column - Header + Login Link */}
        <div className="reg-business-left-column">
          {/* Header */}
          <div className="reg-business-header">
            <motion.div
              className="reg-business-logo-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link to="/" className="reg-business-logo-link">
                <img src={Logo} alt="Skillverse" className="reg-business-logo" />
                <div className="reg-business-logo-glow"></div>
              </Link>
            </motion.div>

            <motion.div
              className="reg-business-header-text"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="reg-business-title">ENTERPRISE</h1>
              <p className="reg-business-subtitle">REGISTRATION</p>
            </motion.div>

            <div className="reg-business-decoration">
              <span className="reg-business-deco-dot"></span>
              <span className="reg-business-deco-line"></span>
              <span className="reg-business-deco-dot"></span>
            </div>
          </div>

          {/* Login Link - In Left Column */}
          <div className="reg-business-login-section">
            <p className="reg-business-login-prompt">HAVE ACCOUNT?</p>
            <Link to="/login" className="reg-business-login-link-btn">
              LOGIN
            </Link>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="reg-business-right-column">
          {/* Error Message */}
          {error && (
            <motion.div
              className="reg-business-error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertTriangle size={14} className="reg-business-error-icon" />
              <span className="reg-business-error-text">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="reg-business-form">
          {/* Company Information Section */}
          <div className="reg-business-section">
            <h3 className="reg-business-section-title">
              <Building2 size={14} />
              Thông Tin Công Ty
            </h3>
          </div>

          {/* Row 1: Company Name & Email */}
          <div className="reg-business-field">
            <label className="reg-business-label">
              <Building2 size={14} />
              <span>COMPANY NAME</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                onAnimationStart={handleAutofill}
                disabled={isLoading}
                className="reg-business-input"
              />
            </div>
          </div>

          <div className="reg-business-field">
            <label className="reg-business-label">
              <Mail size={14} />
              <span>CORPORATE EMAIL</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="email"
                name="businessEmail"
                value={formData.businessEmail}
                onChange={handleInputChange}
                onAnimationStart={handleAutofill}
                disabled={isLoading}
                className="reg-business-input"
                autoComplete="email"
              />
            </div>
            {domainHint && (
              <div className="reg-business-upload-hint">{domainHint}</div>
            )}
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div className="reg-business-field">
            <label className="reg-business-label">
              <Lock size={14} />
              <span>PASSWORD</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onAnimationStart={handleAutofill}
                disabled={isLoading}
                className="reg-business-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-business-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="reg-business-field">
            <label className="reg-business-label">
              <Lock size={14} />
              <span>CONFIRM</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onAnimationStart={handleAutofill}
                disabled={isLoading}
                className="reg-business-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-business-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Row 3: Phone & Tax Code */}
          <div className="reg-business-field">
            <label className="reg-business-label">
              <Phone size={14} />
              <span>PHONE</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="tel"
                name="contactPersonPhone"
                value={formData.contactPersonPhone}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="reg-business-field">
            <label className="reg-business-label">
              <FileText size={14} />
              <span>TAX CODE</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input"
              />
            </div>
          </div>

          {/* Row 4: Website & Region */}
          <div className="reg-business-field">
            <label className="reg-business-label">
              <Globe size={14} />
              <span>WEBSITE</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="url"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input"
              />
            </div>
          </div>

          {/* Region field removed - not in interface */}

          {/* Contact Person Section */}
          <div className="reg-business-section">
            <h3 className="reg-business-section-title">
              <User size={14} />
              Thông Tin Người Liên Hệ
            </h3>
          </div>

          {/* Row 5: Contact Person Name, Phone, Position */}
          <div className="reg-business-field">
            <label className="reg-business-label">
              <User size={14} />
              <span>CONTACT PERSON</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input"
              />
            </div>
          </div>

          <div className="reg-business-field">
            <label className="reg-business-label">
              <Phone size={14} />
              <span>CONTACT PHONE</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="tel"
                name="contactPersonPhone"
                value={formData.contactPersonPhone}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input"
              />
            </div>
          </div>

          <div className="reg-business-field">
            <label className="reg-business-label">
              <Briefcase size={14} />
              <span>POSITION</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="text"
                name="contactPersonPosition"
                value={formData.contactPersonPosition}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input"
              />
            </div>
          </div>

          {/* Extended Information Section */}
          <div className="reg-business-section">
            <h3 className="reg-business-section-title">
              <Briefcase size={14} />
              Thông Tin Mở Rộng
            </h3>
          </div>

          {/* Row 6: Company Size & Industry */}
          <div className="reg-business-field">
            <label className="reg-business-label">
              <Users size={14} />
              <span>COMPANY SIZE</span>
            </label>
            <div className="reg-business-input-wrapper">
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input reg-business-select"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>

          <div className="reg-business-field">
            <label className="reg-business-label">
              <Building2 size={14} />
              <span>INDUSTRY</span>
            </label>
            <div className="reg-business-input-wrapper">
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input reg-business-select"
              >
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 7: Address (2 columns span) */}
          <div className="reg-business-field reg-business-field-2col">
            <label className="reg-business-label">
              <MapPin size={14} />
              <span>COMPANY ADDRESS</span>
            </label>
            <div className="reg-business-input-wrapper">
              <input
                type="text"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-business-input"
                autoComplete="street-address"
              />
            </div>
          </div>

          {/* Description field removed - not in interface */}

          {/* Company Documents Section */}
          <div className="reg-business-section">
            <h3 className="reg-business-section-title">
              <FileText size={14} />
              Tài Liệu Công Ty
            </h3>
          </div>

          <div className="reg-business-file-upload">
            <input
              type="file"
              id="business-documents"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="business-documents" className="reg-business-upload-area">
              <div className="reg-business-upload-icon">
                <Upload size={24} />
              </div>
              <div className="reg-business-upload-text">
                Tải lên giấy phép kinh doanh, chứng nhận đăng ký doanh nghiệp
              </div>
              <div className="reg-business-upload-hint">
                PDF hoặc hình ảnh, tối đa 10MB mỗi file
              </div>
            </label>
            {companyDocuments.length > 0 && (
              <div className="reg-business-file-list">
                {companyDocuments.map((file, index) => (
                  <div key={index} className="reg-business-file-item">
                    <span className="reg-business-file-name">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="reg-business-file-remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {companyDocuments.map((file, index) => (
                  <div key={`prev-${index}`} className="reg-business-file-preview">
                    {file.type.startsWith('image/') && (
                      <img src={URL.createObjectURL(file)} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120 }} />
                    )}
                    {file.type === 'application/pdf' && (
                      <embed src={URL.createObjectURL(file)} type="application/pdf" width="100%" height="120" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="reg-business-submit-btn"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="reg-business-spinner" size={18} />
                <span>REGISTERING...</span>
              </>
            ) : (
              <>
                <Building2 size={18} />
                <span>REGISTER ENTERPRISE</span>
              </>
            )}
            <div className="reg-business-btn-glow"></div>
          </motion.button>
        </form>
        </div>
      </div>

      {/* Hologram Flicker Effect */}
      <div className="reg-business-flicker"></div>
    </motion.div>
  );
};

export default HologramBusinessRegisterForm;
