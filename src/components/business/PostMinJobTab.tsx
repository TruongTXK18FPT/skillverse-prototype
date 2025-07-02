import React, { useState } from 'react';
import { MinJob } from '../../pages/main/BusinessPage';
import './PostMinJobTab.css';

interface PostMinJobTabProps {
  onCreateJob: (job: Omit<MinJob, 'id' | 'status' | 'applicants' | 'createdAt'>) => void;
}

const PostMinJobTab: React.FC<PostMinJobTabProps> = ({ onCreateJob }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    budget: '',
    deadline: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableSkills = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java',
    'CSS', 'HTML', 'Vue.js', 'Angular', 'React Native', 'Flutter',
    'Django', 'Laravel', 'PHP', 'MySQL', 'PostgreSQL', 'MongoDB',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'Firebase', 'GraphQL',
    'UI/UX Design', 'Photoshop', 'Figma', 'Unity', 'C#', 'Swift'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
      setSkillInput('');
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
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Ngân sách hợp lệ là bắt buộc';
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Hạn chót là bắt buộc';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.deadline <= today) {
        newErrors.deadline = 'Hạn chót phải ở tương lai';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onCreateJob({
        title: formData.title.trim(),
        description: formData.description.trim(),
        skills: formData.skills,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline
      });
      // Reset form
      setFormData({
        title: '',
        description: '',
        skills: [],
        budget: '',
        deadline: ''
      });
      setSkillInput('');
    }
  };

  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(skillInput.toLowerCase()) &&
    !formData.skills.includes(skill)
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
            <label htmlFor="budget">Ngân Sách (VND) *</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="10000000"
              min="1"
              step="1000"
              className={errors.budget ? 'error' : ''}
            />
            {errors.budget && <span className="pmjt-error-message">{errors.budget}</span>}
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
        </div>

        <div className="pmjt-form-actions">
          <button type="submit" className="pmjt-create-job-btn">
            🚀 Tạo Công Việc
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostMinJobTab;
