import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FaRobot, FaTimes, FaMagic, FaCalendarAlt, FaClock, FaExclamationTriangle, 
  FaCheckCircle, FaLightbulb, FaBrain, FaMoon, FaPlus, FaTrash, FaLock, FaGem 
} from 'react-icons/fa';
import { 
  GenerateScheduleRequest, 
  StudySession, 
  ScheduleHealthReport, 
  TimeWindow,
  RefineScheduleRequest
} from '../../../types/StudyPlan';
import { studyPlanService } from '../../../services/studyPlanService';
import { premiumService } from '../../../services/premiumService';
import { UserSubscriptionResponse } from '../../../data/premiumDTOs';
import { useNavigate } from 'react-router-dom';
import '../../study-planner/styles/StudyPlanner.css';

interface AIAgentPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: () => void;
}

const AIAgentPlanner: React.FC<AIAgentPlannerProps> = ({ isOpen, onClose, onPlanGenerated }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Premium State
  const [checkingPremium, setCheckingPremium] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [aiModelName, setAiModelName] = useState<string>('Mistral Small');

  // Form State
  const [formData, setFormData] = useState<GenerateScheduleRequest>({
    subjectName: '',
    topics: [],
    desiredOutcome: '',
    studyMethod: 'POMODORO',
    resourcesPreference: 'VIDEO',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    durationMinutes: 600, // 10 hours total default
    breakMinutesBetweenSessions: 15,
    maxSessionsPerDay: 4,
    maxDailyStudyMinutes: 240,
    preferredDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    preferredTimeWindows: [{ startTime: '09:00', endTime: '17:00' }],
    studyPreference: 'BALANCED',
    chronotype: 'BEAR',
    idealFocusWindows: ['MORNING'],
    earliestStartLocalTime: '08:00',
    latestEndLocalTime: '22:00',
    avoidLateNight: true,
    allowLateNight: false
  });

  // UI State for inputs
  const [topicInput, setTopicInput] = useState('');
  
  // Preview & Health State
  const [generatedSessions, setGeneratedSessions] = useState<StudySession[]>([]);
  const [healthReport, setHealthReport] = useState<ScheduleHealthReport | null>(null);
  const [showLateNightConfirm, setShowLateNightConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      
      const checkPremium = async () => {
        try {
          const sub = await premiumService.getCurrentSubscription();
          setSubscription(sub);
          
          if (sub && sub.isActive && sub.plan.planType !== 'FREE_TIER') {
            setIsPremium(true);
            
            // Determine AI Model Name based on plan
            const planName = sub.plan.name.toLowerCase();
            const planType = sub.plan.planType;
            
            if ((planName.includes('mentor') && planName.includes('pro')) || 
                planType === 'PREMIUM_PLUS') {
              setAiModelName('Mistral Large (Premium)');
            } else {
              setAiModelName('Mistral Small (Standard)');
            }
          } else {
            setIsPremium(false);
          }
        } catch (err) {
          console.error('Failed to check premium status', err);
          setIsPremium(false);
        } finally {
          setCheckingPremium(false);
        }
      };

      checkPremium();
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTopicAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && topicInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        topics: [...(prev.topics || []), topicInput.trim()]
      }));
      setTopicInput('');
    }
  };

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topics: (prev.topics || []).filter((_, i) => i !== index)
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const currentDays = prev.preferredDays || [];
      const days = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      return { ...prev, preferredDays: days };
    });
  };

  const handleTimeWindowChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newWindows = [...(formData.preferredTimeWindows || [])];
    if (newWindows[index]) {
      newWindows[index] = { ...newWindows[index], [field]: value };
      setFormData(prev => ({ ...prev, preferredTimeWindows: newWindows }));
    }
  };

  const addTimeWindow = () => {
    setFormData(prev => ({
      ...prev,
      preferredTimeWindows: [...(prev.preferredTimeWindows || []), { startTime: '09:00', endTime: '17:00' }]
    }));
  };

  const removeTimeWindow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preferredTimeWindows: (prev.preferredTimeWindows || []).filter((_, i) => i !== index)
    }));
  };

  const handleGenerateProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const sessions = await studyPlanService.generateProposal(formData);
      setGeneratedSessions(sessions);
      setStep('preview');
      
      // Auto-check health
      checkHealth(sessions);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể tạo đề xuất kế hoạch. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (sessions: StudySession[]) => {
    try {
      const report = await studyPlanService.checkScheduleHealth({
        sessions,
        userPreferences: formData
      });
      setHealthReport(report);
    } catch (err) {
      console.error('Health check failed', err);
    }
  };

  const handleSuggestFix = async () => {
    if (!healthReport) return;
    setLoading(true);
    try {
      const report = await studyPlanService.suggestHealthyAdjustments({
        sessions: generatedSessions,
        userPreferences: formData
      });
      
      if (report.adjustedSessions) {
        setGeneratedSessions(report.adjustedSessions);
        // Re-check health
        await checkHealth(report.adjustedSessions);
      }
    } catch (err) {
      setError('Không thể đề xuất chỉnh sửa.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    // Check for late night sessions
    const hasLateNight = generatedSessions.some(s => {
      const hour = new Date(s.startTime).getHours();
      return hour >= 23 || hour < 5;
    });

    if (hasLateNight && !formData.allowLateNight && !showLateNightConfirm) {
      setShowLateNightConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const createRequests = generatedSessions.map(s => ({
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        description: s.description
      }));
      
      await studyPlanService.createSessionsBatch(createRequests);
      onPlanGenerated();
      onClose();
    } catch (err) {
      setError('Không thể lưu lịch trình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="study-plan-modal-overlay" onClick={onClose}>
      <div className="study-plan-modal theme-gold" onClick={e => e.stopPropagation()}>
        <div className="study-plan-modal-header">
          <div className="study-plan-modal-title">
            <FaRobot className="study-plan-ai-icon" />
            <span>AI Study Planner</span>
            {isPremium && (
              <span className="study-plan-ai-model-badge">
                <FaBrain size={12} style={{ marginRight: 4 }} />
                {aiModelName}
              </span>
            )}
          </div>
          <button className="study-plan-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="study-plan-modal-content" style={{ position: 'relative' }}>
          {checkingPremium ? (
            <div className="study-plan-loading-overlay">
              <div className="spinner"></div>
              <p>Đang kiểm tra quyền truy cập...</p>
            </div>
          ) : !isPremium ? (
            <div className="study-plan-premium-lock">
              <div className="study-plan-lock-icon">
                <FaLock size={48} />
              </div>
              <h3>Tính Năng Premium</h3>
              <p>
                AI Study Planner chỉ dành cho thành viên gói <strong>Skill-Plus</strong>, 
                <strong>Student Pack</strong> hoặc <strong>Mentor-Pro</strong>.
              </p>
              <div className="study-plan-premium-benefits">
                <div className="benefit-item">
                  <FaCheckCircle /> Tạo lịch học tự động với AI
                </div>
                <div className="benefit-item">
                  <FaCheckCircle /> Tối ưu hóa theo Chronotype & Deep Work
                </div>
                <div className="benefit-item">
                  <FaCheckCircle /> Sử dụng mô hình Mistral AI tiên tiến
                </div>
              </div>
              <button 
                className="study-plan-upgrade-btn"
                onClick={() => navigate('/premium')}
              >
                <FaGem /> Nâng Cấp Ngay
              </button>
            </div>
          ) : step === 'form' ? (
            <div className="study-plan-ai-form">
              {/* Basic Info */}
              <div className="study-plan-ai-form-section">
                <div className="study-plan-ai-section-title">
                  <FaBrain /> Thông Tin Cơ Bản
                </div>
                <div className="study-plan-ai-form-group">
                  <label>Môn Học / Chủ Đề Chính</label>
                  <input
                    type="text"
                    name="subjectName"
                    value={formData.subjectName}
                    onChange={handleInputChange}
                    placeholder="VD: Lập trình Java, IELTS Reading..."
                    className="study-plan-input"
                  />
                </div>
                <div className="study-plan-ai-form-group">
                  <label>Các Chủ Đề Con (Nhấn Enter để thêm)</label>
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={handleTopicAdd}
                    placeholder="VD: OOP, Collections, Streams..."
                    className="study-plan-input"
                  />
                  <div className="study-plan-ai-chips-container">
                    {(formData.topics || []).map((topic, idx) => (
                      <div key={idx} className="study-plan-ai-chip">
                        {topic}
                        <span className="study-plan-ai-chip-remove" onClick={() => removeTopic(idx)}>×</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="study-plan-ai-form-group">
                  <label>Mục Tiêu Đầu Ra</label>
                  <textarea
                    name="desiredOutcome"
                    value={formData.desiredOutcome}
                    onChange={handleInputChange}
                    placeholder="VD: Nắm vững kiến thức cơ bản và làm được bài tập..."
                    className="study-plan-input"
                  />
                </div>
              </div>

              {/* Time & Schedule */}
              <div className="study-plan-ai-form-section">
                <div className="study-plan-ai-section-title">
                  <FaCalendarAlt /> Thời Gian & Lịch Trình
                </div>
                <div className="study-plan-ai-form-row">
                  <div className="study-plan-ai-form-group">
                    <label>Ngày Bắt Đầu</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="study-plan-input"
                    />
                  </div>
                  <div className="study-plan-ai-form-group">
                    <label>Hạn Chót (Deadline)</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="study-plan-input"
                    />
                  </div>
                </div>
                <div className="study-plan-ai-form-row">
                  <div className="study-plan-ai-form-group">
                    <label>Tổng Thời Gian (Phút)</label>
                    <input
                      type="number"
                      name="durationMinutes"
                      value={formData.durationMinutes}
                      onChange={handleInputChange}
                      className="study-plan-input"
                    />
                  </div>
                  <div className="study-plan-ai-form-group">
                    <label>Nghỉ Giữa Các Phiên (Phút)</label>
                    <input
                      type="number"
                      name="breakMinutesBetweenSessions"
                      value={formData.breakMinutesBetweenSessions}
                      onChange={handleInputChange}
                      className="study-plan-input"
                    />
                  </div>
                </div>
                
                <div className="study-plan-ai-form-group">
                  <label>Ngày Học Ưu Tiên</label>
                  <div className="study-plan-ai-multi-select">
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                      <div
                        key={day}
                        className={`study-plan-ai-select-option ${(formData.preferredDays || []).includes(day) ? 'selected' : ''}`}
                        onClick={() => toggleDay(day)}
                      >
                        {day.substring(0, 3)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="study-plan-ai-form-group">
                  <label>Khung Giờ Rảnh</label>
                  {(formData.preferredTimeWindows || []).map((window, idx) => (
                    <div key={idx} className="study-plan-time-window-row">
                      <input
                        type="time"
                        value={window.startTime}
                        onChange={(e) => handleTimeWindowChange(idx, 'startTime', e.target.value)}
                      />
                      <span className="study-plan-time-separator">-</span>
                      <input
                        type="time"
                        value={window.endTime}
                        onChange={(e) => handleTimeWindowChange(idx, 'endTime', e.target.value)}
                      />
                      {(formData.preferredTimeWindows || []).length > 1 && (
                        <button className="study-plan-ai-icon-btn" onClick={() => removeTimeWindow(idx)}>
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="study-plan-ai-add-time-btn" onClick={addTimeWindow}>
                    <FaPlus /> Thêm khung giờ
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="study-plan-ai-form-section">
                <div className="study-plan-ai-section-title">
                  <FaClock /> Thói Quen & Sở Thích
                </div>
                <div className="study-plan-ai-form-row">
                  <div className="study-plan-ai-form-group">
                    <label>Phương Pháp Học</label>
                    <select 
                      name="studyMethod" 
                      value={formData.studyMethod} 
                      onChange={handleInputChange}
                      className="study-plan-select"
                    >
                      <option value="POMODORO">Pomodoro (25/5)</option>
                      <option value="DEEP_WORK">Deep Work (90/20)</option>
                      <option value="52_17">52/17 Rule</option>
                      <option value="FLOW_TIME">Flowtime</option>
                    </select>
                  </div>
                  <div className="study-plan-ai-form-group">
                    <label>Chronotype (Nhịp sinh học)</label>
                    <select 
                      name="chronotype" 
                      value={formData.chronotype} 
                      onChange={handleInputChange}
                      className="study-plan-select"
                    >
                      <option value="BEAR">Gấu (Ngày)</option>
                      <option value="WOLF">Sói (Đêm)</option>
                      <option value="LION">Sư Tử (Sáng sớm)</option>
                      <option value="DOLPHIN">Cá Heo (Khó ngủ)</option>
                    </select>
                  </div>
                </div>
                
                <div className="study-plan-ai-form-group">
                  <div className="study-plan-ai-toggle-group">
                    <label className="study-plan-ai-toggle-label">
                      <input
                        type="checkbox"
                        name="avoidLateNight"
                        checked={formData.avoidLateNight}
                        onChange={handleInputChange}
                      />
                      Tránh học khuya (sau 23h)
                    </label>
                    <label className="study-plan-ai-toggle-label">
                      <input
                        type="checkbox"
                        name="allowLateNight"
                        checked={formData.allowLateNight}
                        onChange={handleInputChange}
                      />
                      Cho phép học khuya nếu cần
                    </label>
                  </div>
                </div>
              </div>

              {error && <div className="study-plan-ai-error">{error}</div>}

              <div className="study-plan-ai-actions">
                <button className="study-plan-ai-cancel-btn" onClick={onClose}>Hủy</button>
                <button 
                  className="study-plan-ai-generate-btn" 
                  onClick={handleGenerateProposal}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Tạo Đề Xuất Lịch Trình'} <FaMagic />
                </button>
              </div>
            </div>
          ) : (
            <div className="study-plan-ai-preview">
              <div className="study-plan-ai-preview-header">
                <h3>Xem Trước & Tối Ưu Lịch Trình</h3>
                <button className="study-plan-ai-text-btn" onClick={() => setStep('form')}>
                  &larr; Quay lại chỉnh sửa
                </button>
              </div>

              {/* Health Report */}
              {healthReport && (
                <div className="study-plan-ai-health-report">
                  <div className={`study-plan-ai-health-score ${
                    healthReport.overallScore >= 80 ? 'good' : 
                    healthReport.overallScore >= 50 ? 'warning' : 'bad'
                  }`}>
                    Điểm Sức Khỏe: {healthReport.overallScore}/100
                  </div>
                  
                  <div className="study-plan-ai-health-issues">
                    {healthReport.issues.map((issue, idx) => (
                      <div key={idx} className={`study-plan-ai-issue-item ${issue.severity.toLowerCase()}`}>
                        <FaExclamationTriangle />
                        <span>{issue.message}</span>
                        {issue.suggestion && (
                          <div className="study-plan-ai-issue-suggestion">
                            <FaLightbulb /> {issue.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                    {healthReport.issues.length === 0 && (
                      <div className="study-plan-ai-issue-item good">
                        <FaCheckCircle /> Lịch trình hợp lý và cân bằng!
                      </div>
                    )}
                  </div>

                  {healthReport.overallScore < 80 && (
                    <button 
                      className="study-plan-ai-suggest-btn"
                      onClick={handleSuggestFix}
                      disabled={loading}
                    >
                      <FaMagic /> Đề Xuất Chỉnh Sửa Healthy
                    </button>
                  )}
                </div>
              )}

              {/* Session List Preview */}
              <div className="study-plan-ai-preview-list">
                {generatedSessions.map((session, idx) => (
                  <div key={idx} className="study-plan-ai-session-card">
                    <div className="study-plan-ai-session-time">
                      {new Date(session.startTime).toLocaleDateString('vi-VN')}
                      <br/>
                      {new Date(session.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} 
                      - 
                      {new Date(session.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="study-plan-ai-session-info">
                      <div className="study-plan-ai-session-title">{session.title}</div>
                      <div className="study-plan-ai-session-desc study-plan-markdown-preview">
                        <ReactMarkdown>{session.description}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showLateNightConfirm && (
                <div className="study-plan-ai-confirm-modal">
                  <div className="study-plan-ai-confirm-content">
                    <h4><FaMoon /> Xác Nhận Học Khuya</h4>
                    <p>Lịch trình này có các phiên học trong khung giờ nghỉ ngơi (23:00 - 06:00). Bạn có chắc chắn muốn áp dụng?</p>
                    <div className="study-plan-ai-confirm-actions">
                      <button onClick={() => setShowLateNightConfirm(false)}>Xem lại</button>
                      <button className="study-plan-ai-confirm-btn" onClick={() => {
                        setFormData(prev => ({ ...prev, allowLateNight: true }));
                        setShowLateNightConfirm(false);
                        handleConfirmSave();
                      }}>Vẫn Áp Dụng</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="study-plan-ai-actions">
                <button className="study-plan-ai-cancel-btn" onClick={onClose}>Hủy</button>
                <button 
                  className="study-plan-ai-generate-btn" 
                  onClick={handleConfirmSave}
                  disabled={loading}
                >
                  Xác Nhận & Tạo Lịch <FaCheckCircle />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAgentPlanner;
