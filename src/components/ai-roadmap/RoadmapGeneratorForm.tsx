import { useState, useEffect } from 'react';
import { Sparkles, Loader, LogIn, Lock, ChevronDown, Briefcase, BookOpen, ArrowLeft, Bot } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import TicTacToeGame from '../game/tic-tac-toe/TicTacToeGame';
import { GenerateRoadmapRequest } from '../../types/Roadmap';
import { premiumService } from '../../services/premiumService';
import careerChatService from '../../services/careerChatService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import { ExpertFieldResponse } from '../../types/CareerChat';
import { useToast } from '../../hooks/useToast';
import './RoadmapGeneratorForm.css';

interface RoadmapGeneratorFormProps {
  onGenerate: (request: GenerateRoadmapRequest) => Promise<void>;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  onLoginRedirect?: () => void;
}

type GeneratorStep = 'select-type' | 'input-form' | 'confirmation';
const ROADMAP_GENERATION_GAME_DELAY_MS = 8000;

const RoadmapGeneratorForm = ({
  onGenerate,
  isLoading = false,
  isAuthenticated = true,
  onLoginRedirect
}: RoadmapGeneratorFormProps) => {
  const { showError } = useToast();
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [expertFields, setExpertFields] = useState<ExpertFieldResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sub, fields] = await Promise.all([
          premiumService.getCurrentSubscription(),
          careerChatService.getExpertFields()
        ]);
        setSubscription(sub);
        setExpertFields(fields);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const [step, setStep] = useState<GeneratorStep>('select-type');
  const [formData, setFormData] = useState<GenerateRoadmapRequest>({
    // Common / Legacy
    goal: '',
    duration: '1 tháng',
    experience: 'beginner',
    style: 'project-based',
    roadmapType: 'skill',
    target: '',
    aiAgentMode: 'NORMAL',
    desiredDuration: '1 tháng',
    dailyTime: '1_HOUR',
    
    // Skill Mode Defaults
    roadmapMode: 'SKILL_BASED',
    skillName: '',
    skillCategory: 'Technical',
    desiredDepth: 'SOLID',
    learnerType: 'Student',
    currentSkillLevel: 'ZERO',
    learningGoal: 'APPLY',
    dailyLearningTime: '1_HOUR',
    learningStyle: 'PRACTICE',
    difficultyTolerance: 'MEDIUM',
    
    // Career Mode Defaults
    targetRole: '',
    careerTrack: 'IT',
    targetSeniority: 'INTERN',
    workMode: 'FULL_TIME',
    targetMarket: 'VIETNAM',
    companyType: 'STARTUP',
    timelineToWork: '6M',
    incomeExpectation: false,
    background: 'STUDENT',
    workExperience: 'NONE',
    transferableSkills: false,
    confidenceLevel: 'MEDIUM'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GenerateRoadmapRequest, string>>>({});
  const [showLoadingGame, setShowLoadingGame] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoadingGame(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowLoadingGame(true);
    }, ROADMAP_GENERATION_GAME_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  // --- VALIDATION LOGIC ---
  const PROFANITY_WORDS = ['dm', 'ditme', 'dmm', 'fuck', 'fuckyou', 'cmm', 'cc', 'vl', 'cl', 'địt', 'đcm', 'fuck you'];
  const isProfane = (text: string) => {
    const lower = text.toLowerCase();
    return PROFANITY_WORDS.some(w => lower.includes(w));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof GenerateRoadmapRequest, string>> = {};
    const isSkill = formData.roadmapType === 'skill';

    if (isSkill) {
      if (!formData.skillName || formData.skillName.trim().length < 2) {
        newErrors.skillName = 'Vui lòng nhập tên kỹ năng';
      } else if (isProfane(formData.skillName)) {
        newErrors.skillName = 'Phát hiện từ ngữ không phù hợp.';
      }
    } else {
      if (!formData.targetRole || formData.targetRole.trim().length < 2) {
        newErrors.targetRole = 'Vui lòng nhập tên vị trí công việc';
      } else if (isProfane(formData.targetRole)) {
        newErrors.targetRole = 'Phát hiện từ ngữ không phù hợp.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStep('confirmation');
  };

  const mapCareerTimelineToDurationText = (timeline: string | undefined): string => {
    if (!timeline) return '6 tháng';
    switch (timeline) {
      case '3M':
        return '3 tháng';
      case '6M':
        return '6 tháng';
      case '12M':
        return '12 tháng';
      default:
        return timeline;
    }
  };

  const handleConfirm = async () => {
    const isSkill = formData.roadmapType === 'skill';
    
    // Construct legacy fields for backward compatibility
    const target = isSkill ? formData.skillName : formData.targetRole;
    const constructedGoal = isSkill 
      ? `Học kỹ năng ${formData.skillName}` 
      : `Trở thành ${formData.targetRole}`;

    const resolvedDesiredDuration = isSkill
      ? (formData.desiredDuration || '1 tháng')
      : mapCareerTimelineToDurationText(formData.timelineToWork);

    const resolvedDailyTime = isSkill
      ? (formData.dailyLearningTime || '1_HOUR')
      : (formData.dailyTime || '1_HOUR');
    
    const finalRequest: GenerateRoadmapRequest = {
      ...formData,
      goal: constructedGoal,
      target: target,
      roadmapMode: isSkill ? 'SKILL_BASED' : 'CAREER_BASED',

      // Map specific fields to generic ones if needed by older backend logic
      duration: resolvedDesiredDuration,
      experience: isSkill ? (formData.currentSkillLevel || 'beginner') : (formData.workExperience || 'none'),
      style: isSkill ? (formData.learningStyle || 'project-based') : 'project-based',

      // Keep timeline consistent between legacy and V2 fields.
      desiredDuration: resolvedDesiredDuration,
      dailyTime: resolvedDailyTime,
    };

    await onGenerate(finalRequest);
  };

  const handleChange = (field: keyof GenerateRoadmapRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleTypeSelect = (type: 'skill' | 'career') => {
    setFormData((prev) => {
      if (type === 'skill') {
        const desiredDuration = prev.desiredDuration && ['1 tháng', '2 tháng', '3 tháng'].includes(prev.desiredDuration)
          ? prev.desiredDuration
          : '1 tháng';
        return {
          ...prev,
          roadmapType: 'skill',
          roadmapMode: 'SKILL_BASED',
          desiredDuration,
          duration: desiredDuration,
        };
      }

      const normalizedCareerDuration = mapCareerTimelineToDurationText(prev.timelineToWork || '6M');
      return {
        ...prev,
        roadmapType: 'career',
        roadmapMode: 'CAREER_BASED',
        timelineToWork: prev.timelineToWork || '6M',
        desiredDuration: normalizedCareerDuration,
        duration: normalizedCareerDuration,
      };
    });
    setStep('input-form');
  };

  const getReadableValue = (key: string, value: any) => {
    const mappings: Record<string, string> = {
      // Skill Levels
      'ZERO': 'Zero (Chưa biết gì)',
      'BASIC': 'Basic (Đã biết sơ sơ)',
      'ADVANCED_BEGINNER': 'Advanced Beginner (Biết cơ bản)',
      'COMPETENT': 'Competent (Làm được việc)',
      'INTERMEDIATE': 'Intermediate (Khá)',
      'PROFICIENT': 'Proficient (Thành thạo)',
      // 'EXPERT' is handled in Seniority section to avoid duplicate key
      
      // Backgrounds
      'STUDENT': 'Sinh viên',
      'SWITCHER': 'Người chuyển ngành',
      'WORKING': 'Đang đi làm',

      // Time
      '15_MIN': '15 Phút/ngày',
      '30_MIN': '30 Phút/ngày',
      '45_MIN': '45 Phút/ngày',
      '1_HOUR': '1 Giờ/ngày',
      '2_HOURS': '2 Giờ/ngày',
      '3_HOURS': '3 Giờ/ngày',
      '4_HOURS_PLUS': '4 Giờ+/ngày',
      '3M': '3 Tháng',
      '6M': '6 Tháng',
      '12M': '1 Năm',
      '1 tháng': '1 Tháng',
      '2 tháng': '2 Tháng',
      '3 tháng': '3 Tháng',
      '6 tháng': '6 Tháng',
      '12 tháng': '12 Tháng',

      // Styles
      'PRACTICE': 'Thực hành (Practice)',
      'VIDEO': 'Video Interactive',
      'READING': 'Đọc tài liệu (Reading)',
      'VISUAL': 'Hình ảnh (Visual)',
      'AUDITORY': 'Nghe (Auditory)',
      'KINESTHETIC': 'Vận động (Kinesthetic)',
      'SOCIAL': 'Học nhóm (Social)',
      'SOLITARY': 'Tự học (Solitary)',

      // Company Types
      'STARTUP': 'Startup',
      'SME': 'SME (Vừa & Nhỏ)',
      'CORPORATE': 'Corporate (Tập đoàn)',

      // Seniority
      'INTERN': 'Intern/Fresher',
      'JUNIOR': 'Junior (1-2 năm)',
      'MIDDLE': 'Middle (2-4 năm)',
      'SENIOR': 'Senior (5+ năm)',
      'LEAD': 'Team Lead / Manager',
      'FREELANCER': 'Freelancer',
      'EXPERT': 'Expert / Specialist'
    };
    return mappings[value] || value;
  };

  const renderGeneratingOverlay = () => {
    if (!isLoading) {
      return null;
    }

    return (
      <div className={`rm-loading-overlay ${showLoadingGame ? 'rm-loading-overlay--split' : ''}`}>
        <div className="rm-loading-overlay__shell">
          <div className="rm-loading-overlay__loader">
            <MeowlKuruLoader
              size="medium"
              text="Meowl đang phân tích và dựng roadmap cho bạn..."
              layout="vertical"
            />

            {showLoadingGame && (
              <p className="rm-loading-overlay__hint">
                Hệ thống đang xử lý sâu hơn bình thường. Chơi một ván caro với Meowl trong lúc chờ nhé.
              </p>
            )}
          </div>

          <aside className="rm-loading-overlay__game" aria-hidden={!showLoadingGame}>
            {showLoadingGame && (
              <>
                <header className="rm-loading-overlay__game-header">
                  <span className="rm-loading-overlay__game-eyebrow">MINI GAME KHI CHỜ</span>
                  <h3>MEOWL TIC-TAC-TOE</h3>
                </header>
                <div className="rm-loading-overlay__game-body">
                  <TicTacToeGame mode="embedded" />
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    );
  };

  // --- RENDER: SELECTION STEP ---
  if (step === 'select-type') {
    return (
      <div className="rm-generator-wrapper">
        <div className={`rm-generator-console selection-mode ${!isAuthenticated ? 'blur-mode' : ''}`}>
          <div className="rm-gen-header">
            <div className="rm-gen-icon-box">
              <Sparkles size={24} className="rm-gen-sparkle" />
            </div>
            <div className="rm-gen-titles">
              <h2 className="rm-gen-title">CHỌN LOẠI LỘ TRÌNH</h2>
              <p className="rm-gen-subtitle">Bạn muốn phát triển theo hướng nào?</p>
            </div>
          </div>

          <div className="rm-type-selection-grid">
            {/* Skill-based Card */}
            <div className="rm-type-card" onClick={() => handleTypeSelect('skill')}>
              <div className="rm-type-icon">
                <BookOpen size={32} />
              </div>
              <div className="rm-type-content">
                <h3>Skill-based Roadmap</h3>
                <p>Tập trung làm chủ một kỹ năng cụ thể (VD: ReactJS, IELTS, Photoshop).</p>
                <ul className="rm-type-features">
                  <li>Dành cho người muốn upskill</li>
                  <li>Đi sâu vào mastery</li>
                  <li>Project & thực hành</li>
                </ul>
              </div>
              <div className="rm-type-arrow">→</div>
            </div>

            {/* Career-based Card */}
            <div className="rm-type-card" onClick={() => handleTypeSelect('career')}>
              <div className="rm-type-icon">
                <Briefcase size={32} />
              </div>
              <div className="rm-type-content">
                <h3>Career-based Roadmap</h3>
                <p>Định hướng nghề nghiệp toàn diện (VD: Frontend Dev, BA, Marketer).</p>
                <ul className="rm-type-features">
                  <li>Dành cho người chuyển ngành / sinh viên</li>
                  <li>Kết hợp nhiều kỹ năng</li>
                  <li>Hướng tới Job-ready</li>
                </ul>
              </div>
              <div className="rm-type-arrow">→</div>
            </div>
          </div>
        </div>
        
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

        {renderGeneratingOverlay()}
      </div>
    );
  }

  // --- RENDER: CONFIRMATION STEP ---
  if (step === 'confirmation') {
    const isSkill = formData.roadmapType === 'skill';
    return (
      <div className="rm-generator-wrapper">
        <div className={`rm-generator-console confirmation-mode ${!isAuthenticated ? 'blur-mode' : ''}`}>
          <div className="rm-gen-header">
            <button type="button" className="rm-back-btn" onClick={() => setStep('input-form')}>
              <ArrowLeft size={20} />
            </button>
            <div className="rm-gen-titles">
              <h2 className="rm-gen-title">XÁC NHẬN THÔNG TIN</h2>
              <p className="rm-gen-subtitle">Meowl Agent đang kiểm tra yêu cầu của bạn...</p>
            </div>
          </div>

          <div className="rm-confirmation-body" style={{ padding: '20px' }}>
            <div className="rm-agent-message" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div className="rm-agent-avatar" style={{ 
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
                padding: '10px', 
                borderRadius: '50%', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <Bot size={24} />
              </div>
              <div className="rm-agent-bubble" style={{ 
                background: 'rgba(30, 41, 59, 0.8)', 
                border: '1px solid rgba(148, 163, 184, 0.2)', 
                borderRadius: '0 16px 16px 16px', 
                padding: '20px',
                flex: 1
              }}>
                <p style={{ marginTop: 0, color: '#e2e8f0', lineHeight: 1.6 }}>
                  Chào bạn! Mình đã nhận được yêu cầu tạo lộ trình <strong>{isSkill ? 'Kỹ năng' : 'Sự nghiệp'}</strong> của bạn. Dưới đây là tóm tắt các thông tin quan trọng:
                </p>
                
                <div className="rm-summary-card" style={{ 
                  background: 'rgba(15, 23, 42, 0.6)', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  margin: '15px 0',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <div className="rm-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed rgba(148, 163, 184, 0.2)', paddingBottom: '8px' }}>
                    <span className="rm-summary-label" style={{ color: '#94a3b8' }}>Mục tiêu:</span>
                    <span className="rm-summary-value highlight" style={{ color: '#38bdf8', fontWeight: 600 }}>{isSkill ? formData.skillName : formData.targetRole}</span>
                  </div>
                  <div className="rm-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed rgba(148, 163, 184, 0.2)', paddingBottom: '8px' }}>
                    <span className="rm-summary-label" style={{ color: '#94a3b8' }}>{isSkill ? 'Trình độ hiện tại:' : 'Background:'}</span>
                    <span className="rm-summary-value" style={{ color: '#e2e8f0' }}>
                      {getReadableValue('level', isSkill ? formData.currentSkillLevel : formData.background)}
                    </span>
                  </div>
                  <div className="rm-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed rgba(148, 163, 184, 0.2)', paddingBottom: '8px' }}>
                    <span className="rm-summary-label" style={{ color: '#94a3b8' }}>{isSkill ? 'Mốc thời gian:' : 'Thời gian để đi làm:'}</span>
                    <span className="rm-summary-value" style={{ color: '#e2e8f0' }}>
                      {getReadableValue('time', isSkill ? formData.desiredDuration : formData.timelineToWork)}
                    </span>
                  </div>
                  <div className="rm-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed rgba(148, 163, 184, 0.2)', paddingBottom: '8px' }}>
                    <span className="rm-summary-label" style={{ color: '#94a3b8' }}>{isSkill ? 'Phong cách học:' : 'Loại công ty:'}</span>
                    <span className="rm-summary-value" style={{ color: '#e2e8f0' }}>
                      {getReadableValue('style', isSkill ? formData.learningStyle : formData.companyType)}
                    </span>
                  </div>
                  <div className="rm-summary-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="rm-summary-label" style={{ color: '#94a3b8' }}>Chế độ AI:</span>
                    <span className="rm-summary-value" style={{ color: formData.aiAgentMode === 'DEEP_RESEARCH' ? '#f472b6' : '#e2e8f0', fontWeight: formData.aiAgentMode === 'DEEP_RESEARCH' ? 600 : 400 }}>
                      {formData.aiAgentMode === 'DEEP_RESEARCH' ? '✨ Deep Research (Premium)' : '🤖 Normal Agent'}
                    </span>
                  </div>
                </div>

                <p style={{ marginBottom: 0, color: '#e2e8f0', lineHeight: 1.6 }}>
                  Nếu thông tin đã chính xác, hãy nhấn <strong>"Xác nhận & Tạo lộ trình"</strong> để mình bắt đầu phân tích ngay nhé! 🚀
                </p>
              </div>
            </div>
          </div>

          <div className="rm-input-group full-width" style={{marginTop: '20px', padding: '0 20px 20px'}}>
            <button
              type="button"
              className={`rm-launch-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? (
                <span className="rm-btn-content">
                  <MeowlKuruLoader size="tiny" text="" className="mr-2" />
                  <span>ĐANG PHÂN TÍCH & TẠO LỘ TRÌNH...</span>
                </span>
              ) : (
                <span className="rm-btn-content">
                  <Sparkles size={20} />
                  <span>XÁC NHẬN & TẠO LỘ TRÌNH</span>
                </span>
              )}
              <div className="rm-btn-glare"></div>
            </button>
          </div>
        </div>

        {renderGeneratingOverlay()}
      </div>
    );
  }

  const isSkill = formData.roadmapType === 'skill';

  // --- RENDER: FORM STEP ---
  return (
    <div className="rm-generator-wrapper">
      <form onSubmit={handleSubmit} className={`rm-generator-console ${!isAuthenticated ? 'blur-mode' : ''}`}>

        {/* HEADER */}
        <div className="rm-gen-header">
          <button type="button" className="rm-back-btn" onClick={() => setStep('select-type')}>
            <ArrowLeft size={20} />
          </button>
          <div className="rm-gen-titles">
            <h2 className="rm-gen-title">
              {isSkill ? 'SKILL ROADMAP (HỌC TẬP)' : 'CAREER ROADMAP (NGHỀ NGHIỆP)'}
            </h2>
            <p className="rm-gen-subtitle">Thiết lập thông số chi tiết</p>
          </div>
        </div>

        <div className="rm-gen-body">
          
          {/* --- SKILL MODE INPUTS --- */}
          {isSkill && (
            <>
              <div className="rm-section-label">1. SKILL DEFINITION</div>
              <div className="rm-input-group full-width">
                <label htmlFor="skillName" className="rm-label">TÊN KỸ NĂNG (SKILL NAME) *</label>
                <div className={`rm-input-container ${errors.skillName ? 'error' : ''}`}>
                  <input
                    id="skillName"
                    type="text"
                    className="rm-text-input"
                    placeholder="Ví dụ: ReactJS, Python, IELTS, Photoshop..."
                    value={formData.skillName || ''}
                    onChange={(e) => handleChange('skillName', e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="rm-input-underline"></div>
                </div>
                {errors.skillName && <span className="rm-error-msg">{errors.skillName}</span>}
              </div>

              <div className="rm-gen-grid">
                <div className="rm-input-group">
                  <label className="rm-label">PHÂN LOẠI (CATEGORY)</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.skillCategory || 'Technical'}
                      onChange={(e) => handleChange('skillCategory', e.target.value)}
                    >
                      <option value="Technical">Technical (Kỹ thuật)</option>
                      <option value="Creative">Creative (Sáng tạo)</option>
                      <option value="Business">Business (Kinh doanh)</option>
                      <option value="Language">Language (Ngôn ngữ)</option>
                      <option value="Academic">Academic (Học thuật)</option>
                      <option value="Soft Skills">Soft Skills (Kỹ năng mềm)</option>
                      <option value="Lifestyle">Lifestyle (Đời sống)</option>
                      <option value="Art">Art (Nghệ thuật)</option>
                      <option value="Music">Music (Âm nhạc)</option>
                      <option value="Sports">Sports (Thể thao)</option>
                      <option value="Cooking">Cooking (Nấu ăn)</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
                <div className="rm-input-group">
                  <label className="rm-label">ĐỘ SÂU MONG MUỐN</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.desiredDepth || 'SOLID'}
                      onChange={(e) => handleChange('desiredDepth', e.target.value)}
                    >
                      <option value="BASIC">Basic (Cơ bản)</option>
                      <option value="SOLID">Solid (Vững chắc)</option>
                      <option value="ADVANCED">Advanced (Nâng cao)</option>
                      <option value="EXPERT">Expert (Chuyên sâu)</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="rm-section-label" style={{marginTop: '1.5rem'}}>2. LEARNING CONTEXT</div>
              <div className="rm-gen-grid">
                <div className="rm-input-group">
                  <label className="rm-label">TRÌNH ĐỘ HIỆN TẠI</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.currentSkillLevel || 'ZERO'}
                      onChange={(e) => handleChange('currentSkillLevel', e.target.value)}
                    >
                      <option value="ZERO">Zero (Chưa biết gì)</option>
                      <option value="BASIC">Basic (Đã biết sơ sơ)</option>
                      <option value="ADVANCED_BEGINNER">Advanced Beginner (Biết cơ bản)</option>
                      <option value="COMPETENT">Competent (Làm được việc)</option>
                      <option value="INTERMEDIATE">Intermediate (Khá)</option>
                      <option value="PROFICIENT">Proficient (Thành thạo)</option>
                      <option value="EXPERT">Expert (Chuyên gia)</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
                <div className="rm-input-group">
                  <label className="rm-label">MỤC TIÊU HỌC</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.learningGoal || 'APPLY'}
                      onChange={(e) => handleChange('learningGoal', e.target.value)}
                    >
                      <option value="UNDERSTAND">Understand (Hiểu biết)</option>
                      <option value="APPLY">Apply (Ứng dụng được)</option>
                      <option value="MASTER">Master (Thành thạo)</option>
                      <option value="CERTIFICATION">Certification (Chứng chỉ)</option>
                      <option value="HOBBY">Hobby (Sở thích)</option>
                      <option value="TEACHING">Teaching (Giảng dạy)</option>
                      <option value="RESEARCH">Research (Nghiên cứu)</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="rm-gen-grid" style={{marginTop: '1rem'}}>
                <div className="rm-input-group">
                  <label className="rm-label">MỐC THỜI GIAN (1-3 THÁNG)</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.desiredDuration || '1 tháng'}
                      onChange={(e) => {
                        handleChange('desiredDuration', e.target.value);
                        handleChange('duration', e.target.value);
                      }}
                    >
                      <option value="1 tháng">1 Tháng</option>
                      <option value="2 tháng">2 Tháng</option>
                      <option value="3 tháng">3 Tháng</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
                <div className="rm-input-group">
                  <label className="rm-label">THỜI GIAN/NGÀY</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.dailyLearningTime || '1_HOUR'}
                      onChange={(e) => handleChange('dailyLearningTime', e.target.value)}
                    >
                      <option value="15_MIN">15 Phút</option>
                      <option value="30_MIN">30 Phút</option>
                      <option value="45_MIN">45 Phút</option>
                      <option value="1_HOUR">1 Giờ</option>
                      <option value="2_HOURS">2 Giờ</option>
                      <option value="3_HOURS">3 Giờ</option>
                      <option value="4_HOURS_PLUS">4 Giờ+</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
              </div>
              <div className="rm-input-group" style={{marginTop: '1rem'}}>
                <label className="rm-label">PHONG CÁCH HỌC</label>
                <div className="rm-select-wrapper">
                  <select
                    className="rm-select-input"
                    value={formData.learningStyle || 'PRACTICE'}
                    onChange={(e) => handleChange('learningStyle', e.target.value)}
                  >
                    <option value="PRACTICE">Practice (Thực hành)</option>
                    <option value="VIDEO">Video Interactive</option>
                    <option value="READING">Reading/Docs</option>
                    <option value="VISUAL">Visual (Hình ảnh)</option>
                    <option value="AUDITORY">Auditory (Nghe)</option>
                    <option value="KINESTHETIC">Kinesthetic (Vận động)</option>
                    <option value="SOCIAL">Social (Học nhóm)</option>
                    <option value="SOLITARY">Solitary (Tự học)</option>
                  </select>
                  <ChevronDown size={16} className="rm-select-arrow" />
                </div>
              </div>
            </>
          )}

          {/* --- CAREER MODE INPUTS --- */}
          {!isSkill && (
            <>
              <div className="rm-section-label">1. ROLE DEFINITION</div>
              <div className="rm-input-group full-width">
                <label htmlFor="targetRole" className="rm-label">VỊ TRÍ MONG MUỐN (TARGET ROLE) *</label>
                <div className={`rm-input-container ${errors.targetRole ? 'error' : ''}`}>
                  <input
                    id="targetRole"
                    type="text"
                    className="rm-text-input"
                    placeholder="Ví dụ: Frontend Developer, Business Analyst, Digital Marketer..."
                    value={formData.targetRole || ''}
                    onChange={(e) => handleChange('targetRole', e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="rm-input-underline"></div>
                </div>
                {errors.targetRole && <span className="rm-error-msg">{errors.targetRole}</span>}
              </div>

              <div className="rm-gen-grid">
                <div className="rm-input-group">
                  <label className="rm-label">LĨNH VỰC (TRACK)</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.careerTrack || ''}
                      onChange={(e) => handleChange('careerTrack', e.target.value)}
                    >
                      <option value="" disabled>Chọn lĩnh vực...</option>
                      {expertFields.length > 0 ? (
                        expertFields.map((field) => (
                          <option key={field.domain} value={field.domain}>
                            {field.domain}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="IT">Information Technology</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Design">Design</option>
                          <option value="Business">Business/Finance</option>
                        </>
                      )}
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
                <div className="rm-input-group">
                  <label className="rm-label">LEVEL MONG MUỐN</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.targetSeniority || 'INTERN'}
                      onChange={(e) => handleChange('targetSeniority', e.target.value)}
                    >
                      <option value="INTERN">Intern/Fresher</option>
                      <option value="JUNIOR">Junior (1-2 năm)</option>
                      <option value="MIDDLE">Middle (2-4 năm)</option>
                      <option value="SENIOR">Senior (5+ năm)</option>
                      <option value="LEAD">Team Lead / Manager</option>
                      <option value="FREELANCER">Freelancer</option>
                      <option value="EXPERT">Expert / Specialist</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="rm-section-label" style={{marginTop: '1.5rem'}}>2. MARKET CONTEXT</div>
              <div className="rm-gen-grid">
                <div className="rm-input-group">
                  <label className="rm-label">THỊ TRƯỜNG</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.targetMarket || 'VIETNAM'}
                      onChange={(e) => handleChange('targetMarket', e.target.value)}
                    >
                      <option value="VIETNAM">Vietnam</option>
                      <option value="GLOBAL">Global/Remote</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
                <div className="rm-input-group">
                  <label className="rm-label">LOẠI CÔNG TY</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.companyType || 'STARTUP'}
                      onChange={(e) => handleChange('companyType', e.target.value)}
                    >
                      <option value="STARTUP">Startup</option>
                      <option value="SME">SME (Vừa & Nhỏ)</option>
                      <option value="CORPORATE">Corporate (Tập đoàn)</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="rm-gen-grid" style={{marginTop: '1rem'}}>
                <div className="rm-input-group">
                  <label className="rm-label">THỜI GIAN ĐỂ ĐI LÀM</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.timelineToWork || '6M'}
                      onChange={(e) => {
                        const timeline = e.target.value;
                        const normalized = mapCareerTimelineToDurationText(timeline);
                        handleChange('timelineToWork', timeline);
                        handleChange('desiredDuration', normalized);
                        handleChange('duration', normalized);
                      }}
                    >
                      <option value="3M">3 Tháng</option>
                      <option value="6M">6 Tháng</option>
                      <option value="12M">1 Năm</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
                <div className="rm-input-group">
                  <label className="rm-label">BACKGROUND HIỆN TẠI</label>
                  <div className="rm-select-wrapper">
                    <select
                      className="rm-select-input"
                      value={formData.background || 'STUDENT'}
                      onChange={(e) => handleChange('background', e.target.value)}
                    >
                      <option value="STUDENT">Sinh viên</option>
                      <option value="SWITCHER">Người chuyển ngành</option>
                      <option value="WORKING">Đang đi làm</option>
                    </select>
                    <ChevronDown size={16} className="rm-select-arrow" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- AI AGENT MODE SELECTION --- */}
          <div className="rm-section-label" style={{marginTop: '1.5rem'}}>3. AI AGENT MODE</div>
          <div className="rm-agent-mode-selector">
            <div 
              className={`rm-agent-option ${formData.aiAgentMode === 'NORMAL' ? 'selected' : ''}`}
              onClick={() => handleChange('aiAgentMode', 'NORMAL')}
            >
              <div className="rm-agent-header">
                <span className="rm-agent-name">Normal Agent</span>
              </div>
              <p className="rm-agent-desc">Tốc độ tiêu chuẩn, phù hợp với hầu hết nhu cầu.</p>
            </div>

            <div 
              className={`rm-agent-option ${formData.aiAgentMode === 'DEEP_RESEARCH' ? 'selected' : ''} premium`}
              style={{ 
                opacity: subscription?.plan?.planType === 'PREMIUM_PLUS' ? 1 : 0.7,
                cursor: subscription?.plan?.planType === 'PREMIUM_PLUS' ? 'pointer' : 'not-allowed'
              }}
              onClick={() => {
                if (subscription?.plan?.planType === 'PREMIUM_PLUS') {
                  handleChange('aiAgentMode', 'DEEP_RESEARCH');
                } else {
                  showError('Truy cập bị từ chối', 'Tính năng Deep Research chỉ dành cho gói Mentor Pro (Premium Plus)!');
                }
              }}
            >
              <div className="rm-agent-header">
                <span className="rm-agent-name">Deep Research</span>
                <span className="rm-premium-badge">PLUS</span>
              </div>
              <p className="rm-agent-desc">Phân tích sâu, dữ liệu chi tiết & cá nhân hóa cao hơn.</p>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="rm-input-group full-width" style={{marginTop: '20px'}}>
            <button
              type="submit"
              className={`rm-launch-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="rm-btn-content">
                  <MeowlKuruLoader size="tiny" text="" className="mr-2" />
                  <span>ĐANG PHÂN TÍCH & TẠO LỘ TRÌNH...</span>
                </span>
              ) : (
                <span className="rm-btn-content">
                  <Sparkles size={20} />
                  <span>KHỞI TẠO LỘ TRÌNH</span>
                </span>
              )}
              <div className="rm-btn-glare"></div>
            </button>
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

      {renderGeneratingOverlay()}
    </div>
  );
};

export default RoadmapGeneratorForm;
