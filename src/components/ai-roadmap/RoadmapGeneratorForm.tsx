import { useState } from 'react';
import { Sparkles, Loader, LogIn, Lock, Target, Clock, Zap, Brain, ChevronDown } from 'lucide-react';
import { GenerateRoadmapRequest } from '../../types/Roadmap';
import '../../styles/RoadmapHUD.css'; // Đảm bảo import file CSS gốc hoặc file mới chứa CSS bên dưới

interface RoadmapGeneratorFormProps {
  onGenerate: (request: GenerateRoadmapRequest) => Promise<void>;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  onLoginRedirect?: () => void;
}

const RoadmapGeneratorForm = ({
  onGenerate,
  isLoading = false,
  isAuthenticated = true,
  onLoginRedirect
}: RoadmapGeneratorFormProps) => {
  const [formData, setFormData] = useState<GenerateRoadmapRequest>({
    goal: '',
    duration: '3 months',
    experience: 'beginner',
    style: 'project-based'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GenerateRoadmapRequest, string>>>({});

  // --- VALIDATION LOGIC (GIỮ NGUYÊN) ---
  const PROFANITY_WORDS = ['dm', 'ditme', 'dmm', 'fuck', 'fuckyou', 'cmm', 'cc', 'vl', 'cl', 'địt', 'đcm', 'fuck you'];
  const isProfane = (text: string) => {
    const lower = text.toLowerCase();
    return PROFANITY_WORDS.some(w => lower.includes(w));
  };
  const containsInvalidIelts = (text: string) => {
    const m = /ielts\s*(?:score|band)?\s*([0-9]+(?:\.[0-9])?)/i.exec(text);
    if (!m) return false;
    const score = parseFloat(m[1]);
    return !Number.isNaN(score) && score > 9.0;
  };
  const looksLikeLearningGoal = (text: string) => {
    const t = text.toLowerCase().trim();
    if (t.length < 5) return false;
    const keywords = ['học', 'hoc', 'trở thành', 'lap trinh', 'lập trình', 'tiếng anh', 'tieng anh', 'ielts', 'toeic', 'python', 'java', 'spring', 'frontend', 'backend', 'data', 'khoa học', 'machine', 'ai', 'react', 'node', 'docker', 'devops', 'learn', 'study', 'become', 'improve', 'practice', 'english', 'roadmap'];
    return keywords.some(k => t.includes(k));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof GenerateRoadmapRequest, string>> = {};
    if (!formData.goal || formData.goal.trim().length < 5) {
      newErrors.goal = 'Mục tiêu phải có tối thiểu 5 ký tự';
    } else if (isProfane(formData.goal)) {
      newErrors.goal = 'Phát hiện từ ngữ không phù hợp trong hệ thống.';
    } else if (containsInvalidIelts(formData.goal)) {
      newErrors.goal = 'Tham số IELTS không hợp lệ (Max 9.0).';
    } else if (!looksLikeLearningGoal(formData.goal)) {
      newErrors.goal = "Cú pháp mục tiêu chưa rõ ràng. Ví dụ: 'Học ReactJS', 'Trở thành BA'...";
    }
    if (!formData.duration) newErrors.duration = 'Vui lòng xác định thời gian.';
    if (!formData.experience) newErrors.experience = 'Vui lòng xác định cấp độ khởi đầu.';
    if (!formData.style) newErrors.style = 'Vui lòng chọn giao thức học tập.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onGenerate(formData);
  };

  const handleChange = (field: keyof GenerateRoadmapRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="rm-generator-wrapper">
      <form onSubmit={handleSubmit} className={`rm-generator-console ${!isAuthenticated ? 'blur-mode' : ''}`}>

        {/* HEADER */}
        <div className="rm-gen-header">
          <div className="rm-gen-icon-box">
            <Sparkles size={24} className="rm-gen-sparkle" />
          </div>
          <div className="rm-gen-titles">
            <h2 className="rm-gen-title">INITIALIZE TRAJECTORY</h2>
            <p className="rm-gen-subtitle">Thiết lập thông số cho hành trình mới</p>
          </div>
        </div>

        <div className="rm-gen-body">
          {/* GOAL INPUT */}
          <div className="rm-input-group full-width">
            <label htmlFor="goal" className="rm-label">
              <Target size={14} /> MỤC TIÊU HỌC TẬP (TARGET)
            </label>
            <div className={`rm-input-container ${errors.goal ? 'error' : ''}`}>
              <input
                id="goal"
                type="text"
                className="rm-text-input"
                placeholder="Nhập lệnh: 'Học ReactJS', 'Master Python'..."
                value={formData.goal}
                onChange={(e) => handleChange('goal', e.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
              <div className="rm-input-underline"></div>
            </div>
            {errors.goal && <span className="rm-error-msg">:: ERROR: {errors.goal}</span>}
          </div>

          {/* GRID OPTIONS */}
          <div className="rm-gen-grid">
            {/* 1. DURATION */}
            <div className="rm-input-group">
              <label htmlFor="duration" className="rm-label">
                <Clock size={14} /> THỜI LƯỢNG (DURATION)
              </label>
              <div className="rm-select-wrapper">
                <select
                  id="duration"
                  className="rm-select-input"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="2 weeks">2 Tuần (Sprint)</option>
                  <option value="1 month">1 Tháng</option>
                  <option value="2 months">2 Tháng</option>
                  <option value="3 months">3 Tháng (Tiêu chuẩn)</option>
                  <option value="6 months">6 Tháng</option>
                  <option value="1 year">1 Năm (Dài hạn)</option>
                </select>
                <ChevronDown size={16} className="rm-select-arrow" />
              </div>
              {errors.duration && <span className="rm-error-msg">{errors.duration}</span>}
            </div>

            {/* 2. EXPERIENCE */}
            <div className="rm-input-group">
              <label htmlFor="experience" className="rm-label">
                <Brain size={14} /> KINH NGHIỆM (LEVEL)
              </label>
              <div className="rm-select-wrapper">
                <select
                  id="experience"
                  className="rm-select-input"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="beginner">Mới bắt đầu (Recruit)</option>
                  <option value="intermediate">Trung cấp (Officer)</option>
                  <option value="advanced">Chuyên gia (Commander)</option>
                </select>
                <ChevronDown size={16} className="rm-select-arrow" />
              </div>
              {errors.experience && <span className="rm-error-msg">{errors.experience}</span>}
            </div>

            {/* 3. STYLE */}
            <div className="rm-input-group">
              <label htmlFor="style" className="rm-label">
                <Zap size={14} /> PHONG CÁCH (PROTOCOL)
              </label>
              <div className="rm-select-wrapper">
                <select
                  id="style"
                  className="rm-select-input"
                  value={formData.style}
                  onChange={(e) => handleChange('style', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="project-based">Thực chiến dự án (Project Based)</option>
                  <option value="theoretical">Nghiên cứu lý thuyết (Academic)</option>
                  <option value="video-based">Video trực quan (Visual)</option>
                  <option value="hands-on">Tương tác thực hành (Interactive)</option>
                </select>
                <ChevronDown size={16} className="rm-select-arrow" />
              </div>
              {errors.style && <span className="rm-error-msg">{errors.style}</span>}
            </div>

            {/* 4. ACTION BUTTON (Nằm trong Grid) */}
            <div className="rm-input-group">
              {/* Label ảo (invisible) để đẩy nút xuống ngang hàng với các input khác */}
              <label className="rm-label" style={{ visibility: 'hidden' }}>ACTION</label>

              <button
                type="submit"
                className={`rm-launch-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
                // Reset margin và set height cứng để khớp với input select (thường ~45-48px)
                style={{ marginTop: 0, height: '46px' }}
              >
                {isLoading ? (
                  <span className="rm-btn-content">
                    <Loader className="animate-spin" size={20} />
                    <span>CALCULATING...</span>
                  </span>
                ) : (
                  <span className="rm-btn-content">
                    <Sparkles size={20} />
                    <span>KHỞI TẠO NGAY</span>
                  </span>
                )}
                <div className="rm-btn-glare"></div>
              </button>
            </div>

          </div>
        </div>
      </form>

      {/* LOGIN LOCK OVERLAY */}
      {!isAuthenticated && (
        <div className="rm-lock-overlay">
          <div className="rm-lock-card">
            <div className="rm-lock-icon-box">
              <Lock size={32} />
            </div>
            <h3>ACCESS DENIED</h3>
            <p>Vui lòng xác thực danh tính để truy cập hệ thống AI.</p>
            <button onClick={onLoginRedirect} className="rm-login-btn">
              <LogIn size={18} />
              <span>ĐĂNG NHẬP NGAY</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapGeneratorForm;