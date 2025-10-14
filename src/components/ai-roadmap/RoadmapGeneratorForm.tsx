import { useState } from 'react';
import { Sparkles, Loader, LogIn, Lock } from 'lucide-react';
import { GenerateRoadmapRequest } from '../../types/Roadmap';

interface RoadmapGeneratorFormProps {
  onGenerate: (request: GenerateRoadmapRequest) => Promise<void>;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  onLoginRedirect?: () => void;
}

/**
 * Form for generating AI roadmaps
 */
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

  const PROFANITY_WORDS = [
    'dm','ditme','dmm','fuck','fuckyou','cmm','cc','vl','cl','địt','đcm','fuck you'
  ];

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
    const letters = t.split('').filter(c => /[a-zA-Z\p{L}]/u.test(c)).length;
    if (letters < 5) return false;
    const keywords = [
      'học','hoc','trở thành','lap trinh','lập trình','tiếng anh','tieng anh','ielts','toeic','python','java','spring','frontend','backend','data','khoa học','machine','ai','react','node','docker','devops',
      'learn','study','become','improve','practice','english','roadmap'
    ];
    return keywords.some(k => t.includes(k));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof GenerateRoadmapRequest, string>> = {};

    if (!formData.goal || formData.goal.trim().length < 5) {
      newErrors.goal = 'Mục tiêu phải có tối thiểu 5 ký tự';
    } else if (isProfane(formData.goal)) {
      newErrors.goal = 'Mục tiêu chứa từ ngữ không phù hợp';
    } else if (containsInvalidIelts(formData.goal)) {
      newErrors.goal = 'Điểm IELTS tối đa là 9.0. Vui lòng nhập mục tiêu hợp lệ';
    } else if (!looksLikeLearningGoal(formData.goal)) {
      newErrors.goal = "Mục tiêu không giống mục tiêu học tập. Ví dụ: 'Học Spring Boot', 'Trở thành Frontend Developer', 'IELTS 7.0 trong 3 tháng'";
    }

    if (!formData.duration) {
      newErrors.duration = 'Vui lòng chọn thời lượng';
    }

    if (!formData.experience) {
      newErrors.experience = 'Vui lòng chọn cấp độ kinh nghiệm';
    }

    if (!formData.style) {
      newErrors.style = 'Vui lòng chọn phong cách học';
    }

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
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <form onSubmit={handleSubmit} className="sv-roadmap-generator-form" style={{ filter: !isAuthenticated ? 'blur(2px)' : 'none', pointerEvents: !isAuthenticated ? 'none' : 'auto' }}>
        <div className="sv-roadmap-generator-form__header">
          <Sparkles className="sv-roadmap-generator-form__icon" />
          <h2 className="sv-roadmap-generator-form__title">Tạo lộ trình học bằng AI</h2>
          <p className="sv-roadmap-generator-form__subtitle">
            Tạo lộ trình học cá nhân hóa, rõ ràng từng bước
          </p>
        </div>

      <div className="sv-roadmap-generator-form__fields">
        {/* Goal */}
        <div className="sv-form-group">
          <label htmlFor="goal" className="sv-form-label">
            Mục tiêu học tập *
          </label>
          <input
            id="goal"
            type="text"
            className={`sv-form-input ${errors.goal ? 'sv-form-input--error' : ''}`}
            placeholder="Ví dụ: Học Spring Boot, Trở thành Data Scientist, Thành thạo React"
            value={formData.goal}
            onChange={(e) => handleChange('goal', e.target.value)}
            disabled={isLoading}
          />
          {errors.goal && <span className="sv-form-error">{errors.goal}</span>}
        </div>

        {/* Duration */}
        <div className="sv-form-group">
          <label htmlFor="duration" className="sv-form-label">
            Thời lượng *
          </label>
          <select
            id="duration"
            className={`sv-form-select ${errors.duration ? 'sv-form-select--error' : ''}`}
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            disabled={isLoading}
          >
            <option value="2 weeks">2 tuần</option>
            <option value="1 month">1 tháng</option>
            <option value="2 months">2 tháng</option>
            <option value="3 months">3 tháng</option>
            <option value="6 months">6 tháng</option>
            <option value="1 year">1 năm</option>
          </select>
          {errors.duration && <span className="sv-form-error">{errors.duration}</span>}
        </div>

        {/* Experience */}
        <div className="sv-form-group">
          <label htmlFor="experience" className="sv-form-label">
            Cấp độ kinh nghiệm *
          </label>
          <select
            id="experience"
            className={`sv-form-select ${errors.experience ? 'sv-form-select--error' : ''}`}
            value={formData.experience}
            onChange={(e) => handleChange('experience', e.target.value)}
            disabled={isLoading}
          >
            <option value="beginner">Mới bắt đầu</option>
            <option value="intermediate">Trung cấp - Có một chút kinh nghiệm</option>
            <option value="advanced">Nâng cao - Thành thạo</option>
          </select>
          {errors.experience && <span className="sv-form-error">{errors.experience}</span>}
        </div>

        {/* Style */}
        <div className="sv-form-group">
          <label htmlFor="style" className="sv-form-label">
            Phong cách học *
          </label>
          <select
            id="style"
            className={`sv-form-select ${errors.style ? 'sv-form-select--error' : ''}`}
            value={formData.style}
            onChange={(e) => handleChange('style', e.target.value)}
            disabled={isLoading}
          >
            <option value="project-based">Theo dự án - Học bằng cách làm</option>
            <option value="theoretical">Lý thuyết - Nắm vững khái niệm</option>
            <option value="video-based">Video - Học qua hình ảnh</option>
            <option value="hands-on">Thực hành - Tương tác nhiều</option>
          </select>
          {errors.style && <span className="sv-form-error">{errors.style}</span>}
        </div>
      </div>

      <button
        type="submit"
        className="sv-roadmap-generator-form__submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader className="sv-roadmap-generator-form__spinner" />
            Đang tạo...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Tạo lộ trình
          </>
        )}
      </button>
    </form>

    {/* Login Overlay - Show when not authenticated */}
    {!isAuthenticated && (
      <div className="sv-roadmap-generator-form__login-overlay">
        <div className="sv-roadmap-generator-form__login-card">
          <Lock size={48} className="sv-roadmap-generator-form__lock-icon" />
          <h3>Đăng nhập để tạo lộ trình</h3>
          <p>Bạn cần đăng nhập để sử dụng tính năng tạo lộ trình học bằng AI</p>
          <button 
            onClick={onLoginRedirect}
            className="sv-roadmap-generator-form__login-btn"
          >
            <LogIn size={20} />
            Đăng nhập ngay
          </button>
        </div>
      </div>
    )}
  </div>
  );
};

export default RoadmapGeneratorForm;
