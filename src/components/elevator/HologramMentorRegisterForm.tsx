import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, GraduationCap, Lock, Mail, Phone, MapPin, FileText, Award, Briefcase, AlertTriangle, Linkedin, Target, Upload, X } from 'lucide-react';
import { useElevator } from './ElevatorAuthLayout';
import Logo from '../../assets/skillverse.png';
import './HologramMentorRegisterForm.css';

interface MentorRegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  bio: string;
  expertise: string;
  yearsOfExperience: string;
  education: string;
  address: string;
  region: string;
  linkedinProfile: string;
  mainExpertise: string;
}

interface HologramMentorRegisterFormProps {
  onSubmit: (data: MentorRegisterData) => Promise<{ success: boolean; userName?: string; error?: string }>;
  isLoading?: boolean;
}

const HologramMentorRegisterForm: React.FC<HologramMentorRegisterFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { triggerLoginSuccess } = useElevator();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<MentorRegisterData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    expertise: '',
    yearsOfExperience: '',
    education: '',
    address: '',
    region: '',
    linkedinProfile: '',
    mainExpertise: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certifications, setCertifications] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.type.includes('pdf') || file.type.includes('image') || 
                         file.type.includes('msword') || file.type.includes('wordprocessingml');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (isValidType && isValidSize) {
        setCvFile(file);
      }
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
    if (formData.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (!formData.phone.trim()) return 'Vui lòng nhập số điện thoại';
    if (!formData.expertise.trim()) return 'Vui lòng nhập lĩnh vực chuyên môn';
    if (!formData.yearsOfExperience) return 'Vui lòng nhập số năm kinh nghiệm';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await onSubmit(formData);

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
              <h1 className="reg-mentor-title">MENTOR</h1>
              <p className="reg-mentor-subtitle">REGISTRATION</p>
            </motion.div>

            <div className="reg-mentor-decoration">
              <span className="reg-mentor-deco-dot"></span>
              <span className="reg-mentor-deco-line"></span>
              <span className="reg-mentor-deco-dot"></span>
            </div>
          </div>

          {/* Login Link - In Left Column */}
          <div className="reg-mentor-login-section">
            <p className="reg-mentor-login-prompt">HAVE ACCOUNT?</p>
            <Link to="/login" className="reg-mentor-login-link-btn">
              LOGIN
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
          <form onSubmit={handleSubmit} className="reg-mentor-form">
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
              <span>FULL NAME</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Dr. Jane Smith"
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Mail size={14} />
              <span>EMAIL ADDRESS</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="jane.smith@example.com"
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
              <span>PASSWORD</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
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
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Lock size={14} />
              <span>CONFIRM</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
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

          {/* Row 3: Phone, LinkedIn Profile, Main Expertise */}
          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Phone size={14} />
              <span>PHONE</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+84 xxx xxx xxx"
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Linkedin size={14} />
              <span>LINKEDIN PROFILE</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="url"
                name="linkedinProfile"
                value={formData.linkedinProfile}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/..."
                disabled={isLoading}
                className="reg-mentor-input"
              />
            </div>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Target size={14} />
              <span>MAIN EXPERTISE</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="mainExpertise"
                value={formData.mainExpertise}
                onChange={handleInputChange}
                placeholder="e.g., AI/ML, Web Development"
                disabled={isLoading}
                className="reg-mentor-input"
              />
            </div>
          </div>

          {/* Row 4: Region */}
          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <MapPin size={14} />
              <span>REGION</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-mentor-input reg-mentor-select"
              >
                <option value="Vietnam">Vietnam</option>
                <option value="Asia">Asia</option>
                <option value="Europe">Europe</option>
                <option value="America">America</option>
              </select>
            </div>
          </div>

          {/* Row 4: Expertise & Years of Experience */}
          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Award size={14} />
              <span>EXPERTISE FIELD</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                onChange={handleInputChange}
                placeholder="e.g., Web Development, Data Science"
                disabled={isLoading}
                className="reg-mentor-input"
              />
            </div>
          </div>

          <div className="reg-mentor-field">
            <label className="reg-mentor-label">
              <Briefcase size={14} />
              <span>YEARS EXP.</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                placeholder="5"
                disabled={isLoading}
                className="reg-mentor-input"
                min="0"
              />
            </div>
          </div>

          {/* Row 5: Education (2 Columns) */}
          <div className="reg-mentor-field reg-mentor-field-2col">
            <label className="reg-mentor-label">
              <GraduationCap size={14} />
              <span>EDUCATION (OPTIONAL)</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="Ph.D. in Computer Science, MIT"
                disabled={isLoading}
                className="reg-mentor-input"
              />
            </div>
          </div>

          {/* Row 6: Address (2 Columns) */}
          <div className="reg-mentor-field reg-mentor-field-2col">
            <label className="reg-mentor-label">
              <MapPin size={14} />
              <span>ADDRESS (OPTIONAL)</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street, District, City"
                disabled={isLoading}
                className="reg-mentor-input"
                autoComplete="street-address"
              />
            </div>
          </div>

          {/* Row 7: Bio (Full Width) */}
          <div className="reg-mentor-field reg-mentor-field-full">
            <label className="reg-mentor-label">
              <FileText size={14} />
              <span>PROFESSIONAL BIO (OPTIONAL)</span>
            </label>
            <div className="reg-mentor-input-wrapper">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about your experience and what you can teach..."
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
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleCvUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="mentor-cv" className="reg-mentor-upload-area">
              <div className="reg-mentor-upload-icon">
                <Upload size={24} />
              </div>
              <div className="reg-mentor-upload-text">
                Tải lên CV hoặc Portfolio
              </div>
              <div className="reg-mentor-upload-hint">
                PDF, DOC, DOCX hoặc hình ảnh, tối đa 10MB
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
                <Loader2 className="reg-mentor-spinner" size={18} />
                <span>REGISTERING...</span>
              </>
            ) : (
              <>
                <GraduationCap size={18} />
                <span>REGISTER AS MENTOR</span>
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
