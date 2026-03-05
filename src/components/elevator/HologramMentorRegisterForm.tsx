import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, Lock, Mail, Phone, MapPin, FileText, Award, Briefcase, AlertTriangle, Linkedin, Target, Upload, X } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { useElevator } from './ElevatorAuthLayout';
import Logo from '../../assets/brand/skillverse.png';
import './HologramMentorRegisterForm.css';

interface MentorRegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  linkedinProfile?: string;
  mainExpertise: string;
  yearsOfExperience: string;
  personalBio: string;
  cvFile?: File;
  certifications?: File[];
}

interface HologramMentorRegisterFormProps {
  onSubmit: (data: MentorRegisterData) => Promise<{ success: boolean; userName?: string; error?: string }>;
  onGoogleRegister?: () => void;
  isLoading?: boolean;
  isGoogleLoading?: boolean;
  googleRegisterSuccess?: { userName: string } | null;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const normalizeOptionalUrl = (value?: string): string | null => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(normalizedValue);

    if (!parsedUrl.hostname) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

const FIELD_NAVIGATION_ORDER = [
  'fullName',
  'email',
  'password',
  'confirmPassword',
  'linkedinProfile',
  'mainExpertise',
  'yearsOfExperience',
  'personalBio'
] as const;

const HologramMentorRegisterForm: React.FC<HologramMentorRegisterFormProps> = ({
  onSubmit,
  onGoogleRegister,
  isLoading = false,
  isGoogleLoading = false,
  googleRegisterSuccess,
}) => {
  const { triggerLoginSuccess } = useElevator();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [formData, setFormData] = useState<MentorRegisterData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    linkedinProfile: '',
    mainExpertise: '',
    yearsOfExperience: '',
    personalBio: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certifications, setCertifications] = useState<File[]>([]);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const value = name === 'yearsOfExperience'
      ? e.target.value.replace(/\D/g, '')
      : e.target.value;

    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const registerFieldRef = (fieldName: string) => (element: HTMLInputElement | HTMLTextAreaElement | null) => {
    fieldRefs.current[fieldName] = element;
  };

  const moveFocus = (fieldName: string, direction: -1 | 1) => {
    const currentIndex = FIELD_NAVIGATION_ORDER.indexOf(fieldName as typeof FIELD_NAVIGATION_ORDER[number]);

    if (currentIndex === -1) {
      return;
    }

    const nextFieldName = FIELD_NAVIGATION_ORDER[currentIndex + direction];
    if (!nextFieldName) {
      return;
    }

    fieldRefs.current[nextFieldName]?.focus();
  };

  const handleFieldNavigation = (
    fieldName: string,
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus(fieldName, 1);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(fieldName, -1);
    }
  };

  // Handle autofill detection for Chrome
  const handleAutofill = (e: React.AnimationEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    if (value) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const isPdfMime = file.type === 'application/pdf';
      const isPdfExt = fileName.endsWith('.pdf');
      const isValidType = isPdfMime || isPdfExt;
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) {
        setError('CV/Portfolio chỉ hỗ trợ file PDF để hệ thống có thể xem trước và duyệt ổn định.');
        setCvFile(null);
        return;
      }
      if (!isValidSize) {
        setError('CV/Portfolio vượt quá 10MB. Vui lòng chọn file nhỏ hơn.');
        setCvFile(null);
        return;
      }

      setCvFile(file);
      setError(null);
    }
  };

  const handleCertificationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.includes('pdf') || file.type.includes('image');
      const isValidSize = file.size <= 10 * 1024 * 1024;
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

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) return 'Vui lòng nhập họ tên';
    if (!formData.email.trim()) return 'Vui lòng nhập email';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email không hợp lệ';
    if (!formData.password) return 'Vui lòng nhập mật khẩu';

    if (!PASSWORD_REGEX.test(formData.password)) {
      return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
    }

    if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (formData.linkedinProfile?.trim() && !normalizeOptionalUrl(formData.linkedinProfile)) {
      return 'Liên kết LinkedIn không hợp lệ';
    }
    if (!formData.mainExpertise.trim()) return 'Vui lòng nhập lĩnh vực chuyên môn';
    if (!formData.yearsOfExperience) return 'Vui lòng nhập số năm kinh nghiệm';
    if (!cvFile) return 'Vui lòng tải lên CV';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Chuyển đổi từ local formData sang format mà Page component mong đợi
    const normalizedLinkedinProfile = normalizeOptionalUrl(formData.linkedinProfile);
    const submitData: MentorRegisterData = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      linkedinProfile: normalizedLinkedinProfile || undefined,
      mainExpertise: formData.mainExpertise,
      yearsOfExperience: formData.yearsOfExperience,
      personalBio: formData.personalBio,
      cvFile: cvFile || undefined,
      certifications: certifications.length > 0 ? certifications : undefined
    };

    const result = await onSubmit(submitData);

    if (result.success) {
      await triggerLoginSuccess(result.userName || formData.fullName.split(' ')[0]);
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <motion.div
      className="reg-mentor-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Hologram Border Effect */}
      <div className="reg-mentor-border">
        <div className="reg-mentor-corner top-left"></div>
        <div className="reg-mentor-corner top-right"></div>
        <div className="reg-mentor-corner bottom-left"></div>
        <div className="reg-mentor-corner bottom-right"></div>
        <div className="reg-mentor-line top"></div>
        <div className="reg-mentor-line bottom"></div>
        <div className="reg-mentor-line left"></div>
        <div className="reg-mentor-line right"></div>
      </div>

      {/* Form Content */}
      <div className="reg-mentor-content">
        {/* Left Column - Header + Login Link */}
        <div className="reg-mentor-left-column">
          {/* Header */}
          <div className="reg-mentor-header">
            <motion.div
              className="reg-mentor-logo-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link to="/" className="reg-mentor-logo-link">
                <img src={Logo} alt="Skillverse" className="reg-mentor-logo" />
                <div className="reg-mentor-logo-glow"></div>
              </Link>
            </motion.div>

            <motion.div
              className="reg-mentor-header-text"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="reg-mentor-title">Cố vấn</h1>
              <p className="reg-mentor-subtitle">Đăng ký</p>
            </motion.div>

            <div className="reg-mentor-decoration">
              <span className="reg-mentor-deco-dot"></span>
              <span className="reg-mentor-deco-line"></span>
              <span className="reg-mentor-deco-dot"></span>
            </div>
          </div>

          {/* Login Link - In Left Column */}
          <div className="reg-mentor-login-section">
            <p className="reg-mentor-login-prompt">Đã có tài khoản?</p>
            <Link to="/login" className="reg-mentor-login-link-btn">
              Đăng nhập
            </Link>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="reg-mentor-right-column">
          {/* Error Message */}
          {error && (
            <motion.div
              className="reg-mentor-error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertTriangle size={14} className="reg-mentor-error-icon" />
              <span className="reg-mentor-error-text">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="reg-mentor-form" noValidate>
          {/* Personal Information Section */}
          <div className="reg-mentor-section">
            <h3 className="reg-mentor-section-title">
              <GraduationCap size={14} />
              Thông Tin Cá Nhân
            </h3>
          </div>

          {/* Row 1: Full Name & Email */}
          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <GraduationCap size={14} />
              <span>Họ và tên</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('fullName', e)}
                onAnimationStart={handleAutofill}
                ref={registerFieldRef('fullName')}
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Mail size={14} />
              <span>Địa chỉ email</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('email', e)}
                onAnimationStart={handleAutofill}
                ref={registerFieldRef('email')}
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Lock size={14} />
              <span>Mật khẩu</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('password', e)}
                onAnimationStart={handleAutofill}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                ref={registerFieldRef('password')}
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-mentor-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password Hint */}
            <AnimatePresence>
              {(isPasswordFocused || (formData.password && formData.password.length > 0 && !PASSWORD_REGEX.test(formData.password))) && (
                <motion.div
                  className="reg-mentor-password-hint"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: 'hidden' }}
                >
                  <p>Mật khẩu cần:</p>
                  <ul>
                    <li style={{ color: formData.password.length >= 8 ? '#4ade80' : '#94a3b8' }}>
                      • Ít nhất 8 ký tự
                    </li>
                    <li style={{ color: /[A-Z]/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>
                      • 1 chữ viết hoa
                    </li>
                    <li style={{ color: /[a-z]/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>
                      • 1 chữ thường
                    </li>
                    <li style={{ color: /\d/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>
                      • 1 số
                    </li>
                    <li style={{ color: /[^A-Za-z0-9]/.test(formData.password) ? '#4ade80' : '#94a3b8' }}>
                      • 1 ký tự đặc biệt
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Lock size={14} />
              <span>Xác nhận mật khẩu</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('confirmPassword', e)}
                onAnimationStart={handleAutofill}
                ref={registerFieldRef('confirmPassword')}
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-mentor-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="reg-mentor-section">
            <h3 className="reg-mentor-section-title">
              <Award size={14} />
              Thông Tin Chuyên Môn
            </h3>
          </div>

          {/* Row 3: LinkedIn Profile - Phone field removed */}

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Linkedin size={14} />
              <span>Hồ sơ LinkedIn</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="linkedinProfile"
                value={formData.linkedinProfile}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('linkedinProfile', e)}
                onAnimationStart={handleAutofill}
                ref={registerFieldRef('linkedinProfile')}
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="url"
              />
            </div>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Target size={14} />
              <span>Chuyên môn chính</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="mainExpertise"
                value={formData.mainExpertise}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('mainExpertise', e)}
                ref={registerFieldRef('mainExpertise')}
                disabled={isLoading}
                className="reg-mentor-input"
              />
            </div>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Briefcase size={14} />
              <span>Số năm kinh nghiệm</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('yearsOfExperience', e)}
                ref={registerFieldRef('yearsOfExperience')}
                disabled={isLoading}
                className="reg-mentor-input"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Row 7: Bio (Full Width) */}
          <div className="reg-mentor-field reg-mentor-field-full">
            <label className="reg-mentor-label">
              <FileText size={14} />
              <span>Giới thiệu chuyên môn (không bắt buộc)</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <textarea
                name="personalBio"
                value={formData.personalBio}
                onChange={handleInputChange}
                onKeyDown={(e) => handleFieldNavigation('personalBio', e)}
                ref={registerFieldRef('personalBio')}
                disabled={isLoading}
                className="reg-mentor-input reg-mentor-textarea"
                rows={2}
              />
            </div>
          </div>

          {/* Documents Section */}
          <div className="reg-mentor-section">
            <h3 className="reg-mentor-section-title">
              <FileText size={14} />
              Hồ Sơ & Chứng Chỉ
            </h3>
          </div>

          {/* CV Upload */}
          <div className="reg-mentor-file-upload">
            <input
              type="file"
              id="mentor-cv"
              accept=".pdf,application/pdf"
              onChange={handleCvUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="mentor-cv" className="reg-mentor-upload-area">
              <div className="reg-mentor-upload-icon">
                <Upload size={24} />
              </div>
              <div className="reg-mentor-upload-text">
                Tải lên CV/Portfolio (PDF)
              </div>
              <div className="reg-mentor-upload-hint">
                Chỉ hỗ trợ PDF, tối đa 10MB
              </div>
            </label>
            {cvFile && (
              <div className="reg-mentor-file-list">
                <div className="reg-mentor-file-item">
                  <span className="reg-mentor-file-name">{cvFile.name}</span>
                  <button
                    type="button"
                    onClick={removeCv}
                    className="reg-mentor-file-remove"
                  >
                    <X size={16} />
                  </button>
                </div>
                {(cvFile.type === 'application/pdf' || cvFile.name.toLowerCase().endsWith('.pdf')) && (
                  <div className="reg-mentor-file-preview">
                    <embed src={URL.createObjectURL(cvFile)} type="application/pdf" width="100%" height="180" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Certifications Upload */}
          <div className="reg-mentor-file-upload">
            <input
              type="file"
              id="mentor-certifications"
              multiple
              accept=".pdf,image/*"
              onChange={handleCertificationUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="mentor-certifications" className="reg-mentor-upload-area">
              <div className="reg-mentor-upload-icon">
                <Upload size={24} />
              </div>
              <div className="reg-mentor-upload-text">
                Tải lên chứng chỉ (tùy chọn)
              </div>
              <div className="reg-mentor-upload-hint">
                PDF hoặc hình ảnh, tối đa 10MB mỗi file
              </div>
            </label>
            {certifications.length > 0 && (
              <div className="reg-mentor-file-list">
                {certifications.map((file, index) => (
                  <div key={index} className="reg-mentor-file-item">
                    <span className="reg-mentor-file-name">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="reg-mentor-file-remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {certifications.map((file, index) => (
                  <div key={`prev-${index}`} className="reg-mentor-file-preview">
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
            className="reg-mentor-submit-btn"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <MeowlKuruLoader size="tiny" text="" />
                <span>Đang đăng ký...</span>
              </>
            ) : (
              <>
                <GraduationCap size={18} />
                <span>Đăng ký làm Cố vấn</span>
              </>
            )}
            <div className="reg-mentor-btn-glow"></div>
          </motion.button>
        </form>
        </div>
      </div>

      {/* Hologram Flicker Effect */}
      <div className="reg-mentor-flicker"></div>
    </motion.div>
  );
};

export default HologramMentorRegisterForm;
