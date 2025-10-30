import React, { useState } from 'react';
import jobService from '../../services/jobService';
import { CreateJobRequest } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './PostMinJobTab.css';

// Popular skills across multiple industries
const POPULAR_SKILLS = [
  // IT & Programming
  'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Angular', 'Vue.js',
  'Spring Boot', 'Django', 'Laravel', 'PHP', 'C#', '.NET', 'Go', 'Rust', 'Swift', 'Kotlin',
  'React Native', 'Flutter', 'iOS', 'Android', 'HTML', 'CSS', 'Sass', 'Tailwind CSS',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'Firebase',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'DevOps',
  'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'Testing', 'Security',
  
  // Design & Creative
  'UI/UX Design', 'Graphic Design', 'Photoshop', 'Illustrator', 'Figma', 'Sketch',
  'Adobe XD', 'InDesign', 'After Effects', 'Premiere Pro', 'Video Editing', '3D Modeling',
  'Animation', 'Blender', 'Maya', 'Unity', 'Unreal Engine', 'Game Design',
  
  // Marketing & Business
  'Digital Marketing', 'SEO', 'SEM', 'Content Marketing', 'Social Media Marketing',
  'Email Marketing', 'Google Ads', 'Facebook Ads', 'Analytics', 'Copywriting',
  'Brand Strategy', 'Market Research', 'Product Management', 'Business Analysis',
  'Sales', 'Customer Service', 'CRM', 'Project Management', 'Leadership',
  
  // Finance & HR
  'Accounting', 'Finance', 'Excel', 'Financial Analysis', 'Bookkeeping', 'Tax',
  'HR Management', 'Recruitment', 'Training', 'Payroll', 'Legal', 'Compliance',
  
  // Other
  'Data Analysis', 'Data Science', 'Machine Learning', 'AI', 'Statistics',
  'Translation', 'Writing', 'Teaching', 'Consulting', 'Architecture', 'Engineering'
];

interface PostMinJobTabProps {
  onJobCreated?: () => void; // Callback after successful creation
}

const PostMinJobTab: React.FC<PostMinJobTabProps> = ({ onJobCreated }) => {
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    minBudget: '',
    maxBudget: '',
    deadline: '',
    isRemote: true,
    location: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSkillAdd = (skill: string) => {
    const normalizedSkill = skill.trim().toLowerCase();
    if (normalizedSkill && !formData.skills.map(s => s.toLowerCase()).includes(normalizedSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()] // Keep original casing for display
      }));
      setSkillInput('');
      // Clear skills error
      if (errors.skills) {
        setErrors(prev => ({ ...prev, skills: '' }));
      }
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSkillAdd(skillInput);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề công việc là bắt buộc';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả công việc là bắt buộc';
    }
    if (formData.skills.length === 0) {
      newErrors.skills = 'Cần ít nhất một kỹ năng';
    }
    
    const minBudget = parseFloat(formData.minBudget);
    const maxBudget = parseFloat(formData.maxBudget);
    
    if (!formData.minBudget || minBudget <= 0) {
      newErrors.minBudget = 'Ngân sách tối thiểu hợp lệ là bắt buộc';
    }
    if (!formData.maxBudget || maxBudget <= 0) {
      newErrors.maxBudget = 'Ngân sách tối đa hợp lệ là bắt buộc';
    }
    if (formData.minBudget && formData.maxBudget && maxBudget < minBudget) {
      newErrors.maxBudget = 'Ngân sách tối đa phải lớn hơn hoặc bằng ngân sách tối thiểu';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Hạn chót là bắt buộc';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= today) {
        newErrors.deadline = 'Hạn chót phải ở tương lai';
      }
    }
    
    if (!formData.isRemote && !formData.location.trim()) {
      newErrors.location = 'Địa điểm làm việc là bắt buộc khi không làm từ xa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Lỗi Xác Thực', 'Vui lòng điền đầy đủ thông tin hợp lệ');
      return;
    }

    setIsSubmitting(true);

    try {
      const jobData: CreateJobRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredSkills: formData.skills, // Will be normalized in backend
        minBudget: parseFloat(formData.minBudget),
        maxBudget: parseFloat(formData.maxBudget),
        deadline: formData.deadline,
        isRemote: formData.isRemote,
        location: formData.isRemote ? null : formData.location.trim()
      };

      await jobService.createJob(jobData);
      
      showSuccess('Thành Công', '🎉 Công việc đã được tạo thành công!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        skills: [],
        minBudget: '',
        maxBudget: '',
        deadline: '',
        isRemote: true,
        location: ''
      });
      setSkillInput('');
      
      // Call callback if provided
      if (onJobCreated) {
        onJobCreated();
      }
    } catch (error) {
      console.error('Error creating job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo công việc. Vui lòng thử lại.';
      showError('Lỗi Tạo Công Việc', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSkills = POPULAR_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillInput.toLowerCase()) &&
    !formData.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
  );

  return (
    <div className="pmjt-post-minjob-tab">
      <div className="pmjt-tab-header">
        <h2>📝 Đăng Công Việc Mới</h2>
        <p>Tạo bài đăng công việc để tìm freelancer hoàn hảo cho dự án của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="pmjt-minjob-form">
        <div className="pmjt-form-group">
          <label htmlFor="title">Tiêu Đề Công Việc *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="ví dụ: Xây Dựng Dashboard React"
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="pmjt-error-message">{errors.title}</span>}
        </div>

        <div className="pmjt-form-group">
          <label htmlFor="description">Mô Tả Công Việc *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Mô tả yêu cầu dự án, mục tiêu và kỳ vọng của bạn..."
            rows={5}
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="pmjt-error-message">{errors.description}</span>}
        </div>

        <div className="pmjt-form-group">
          <label htmlFor="skills">Kỹ Năng Yêu Cầu *</label>
          <div className="pmjt-skills-input-container">
            <input
              type="text"
              id="skills"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillInputKeyDown}
              placeholder="Nhập kỹ năng và nhấn Enter"
              className={errors.skills ? 'error' : ''}
            />
            {skillInput && filteredSkills.length > 0 && (
              <div className="pmjt-skills-dropdown">
                {filteredSkills.slice(0, 5).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    className="pmjt-skill-option"
                    onClick={() => handleSkillAdd(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="pmjt-selected-skills">
            {formData.skills.map(skill => (
              <span key={skill} className="pmjt-skill-tag">
                {skill}
                <button
                  type="button"
                  onClick={() => handleSkillRemove(skill)}
                  className="pmjt-remove-skill"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {errors.skills && <span className="pmjt-error-message">{errors.skills}</span>}
        </div>

        <div className="pmjt-form-row">
          <div className="pmjt-form-group">
            <label htmlFor="minBudget">Ngân Sách Tối Thiểu (VND) *</label>
            <input
              type="number"
              id="minBudget"
              name="minBudget"
              value={formData.minBudget}
              onChange={handleInputChange}
              placeholder="5000000"
              min="1"
              className={errors.minBudget ? 'error' : ''}
            />
            {errors.minBudget && <span className="pmjt-error-message">{errors.minBudget}</span>}
          </div>

          <div className="pmjt-form-group">
            <label htmlFor="maxBudget">Ngân Sách Tối Đa (VND) *</label>
            <input
              type="number"
              id="maxBudget"
              name="maxBudget"
              value={formData.maxBudget}
              onChange={handleInputChange}
              placeholder="15000000"
              min="1"
              className={errors.maxBudget ? 'error' : ''}
            />
            {errors.maxBudget && <span className="pmjt-error-message">{errors.maxBudget}</span>}
          </div>
        </div>

        <div className="pmjt-form-group">
          <label htmlFor="deadline">Hạn Chót *</label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            className={errors.deadline ? 'error' : ''}
          />
          {errors.deadline && <span className="pmjt-error-message">{errors.deadline}</span>}
        </div>

        <div className="pmjt-form-group">
          <label className="pmjt-checkbox-label">
            <input
              type="checkbox"
              name="isRemote"
              checked={formData.isRemote}
              onChange={handleInputChange}
            />
            <span>🌐 Làm Việc Từ Xa</span>
          </label>
        </div>

        {!formData.isRemote && (
          <div className="pmjt-form-group">
            <label htmlFor="location">Địa Điểm Làm Việc *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="ví dụ: Hà Nội, Việt Nam"
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <span className="pmjt-error-message">{errors.location}</span>}
          </div>
        )}

        <div className="pmjt-form-actions">
          <button type="submit" className="pmjt-create-job-btn" disabled={isSubmitting}>
            {isSubmitting ? '⏳ Đang Tạo...' : '🚀 Tạo Công Việc'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostMinJobTab;
