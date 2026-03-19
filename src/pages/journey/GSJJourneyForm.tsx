import { useState } from 'react';
import { X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { StartJourneyRequest, JobLevel, CompanySize, WorkStyle, LearningFormat, StudyTime, EnglishLevel } from '../../types/Journey';

interface GSJJourneyFormProps {
  onSubmit: (request: StartJourneyRequest) => void;
  onClose: () => void;
  loading: boolean;
}

interface FormData {
  // Basic
  title: string;
  targetGoal: string;
  // Career
  targetCareer: string;
  targetIndustry: string;
  preferredCompanySize: string;
  workStyle: string;
  targetLocation: string;
  // Skills
  yearsOfExperience: string;
  currentJobLevel: string;
  existingSkills: string[];
  familiarTools: string[];
  certifications: string[];
  // Experience
  experienceLevel: string;
  selfAssessment: string;
  completedProjects: string[];
  // Background
  educationBackground: string;
  major: string;
  graduationYear: string;
  // Learning
  learningStyle: string;
  preferredFormat: string;
  hoursPerWeek: string;
  preferredStudyTime: string;
  learningMotivation: string;
  // Goals
  shortTermGoal: string;
  midTermGoal: string;
  longTermGoal: string;
  // Challenges
  currentChallenges: string[];
  biggestFrustration: string;
  // Language
  languages: string[];
  englishLevel: string;
}

const GSJJourneyForm: React.FC<GSJJourneyFormProps> = ({ onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    targetGoal: '',
    targetCareer: '',
    targetIndustry: '',
    preferredCompanySize: '',
    workStyle: '',
    targetLocation: '',
    yearsOfExperience: '',
    currentJobLevel: '',
    existingSkills: [],
    familiarTools: [],
    certifications: [],
    experienceLevel: 'BEGINNER',
    selfAssessment: '',
    completedProjects: [],
    educationBackground: '',
    major: '',
    graduationYear: '',
    learningStyle: 'VISUAL',
    preferredFormat: 'COURSE',
    hoursPerWeek: '',
    preferredStudyTime: 'EVENING',
    learningMotivation: '',
    shortTermGoal: '',
    midTermGoal: '',
    longTermGoal: '',
    currentChallenges: [],
    biggestFrustration: '',
    languages: [],
    englishLevel: 'CONVERSATIONAL'
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    career: false,
    skills: false,
    experience: false,
    background: false,
    learning: false,
    challenges: false,
    language: false
  });

  const [newSkill, setNewSkill] = useState('');
  const [newTool, setNewTool] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newProject, setNewProject] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: keyof FormData, value: string, setState: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
      setState('');
    }
  };

  const removeFromArray = (field: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const request: StartJourneyRequest = {
      title: formData.title,
      targetGoal: formData.targetGoal,
      targetCareer: formData.targetCareer || undefined,
      targetIndustry: formData.targetIndustry || undefined,
      preferredCompanySize: formData.preferredCompanySize as CompanySize || undefined,
      workStyle: formData.workStyle as WorkStyle || undefined,
      targetLocation: formData.targetLocation || undefined,
      yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
      currentJobLevel: formData.currentJobLevel as JobLevel || undefined,
      existingSkills: formData.existingSkills.length > 0 ? formData.existingSkills : undefined,
      familiarTools: formData.familiarTools.length > 0 ? formData.familiarTools : undefined,
      certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
      experienceLevel: formData.experienceLevel,
      selfAssessment: formData.selfAssessment || undefined,
      completedProjects: formData.completedProjects.length > 0 ? formData.completedProjects : undefined,
      educationBackground: formData.educationBackground || undefined,
      major: formData.major || undefined,
      graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
      learningStyle: formData.learningStyle || undefined,
      preferredFormat: formData.preferredFormat as LearningFormat || undefined,
      hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek) : undefined,
      preferredStudyTime: formData.preferredStudyTime as StudyTime || undefined,
      learningMotivation: formData.learningMotivation || undefined,
      shortTermGoal: formData.shortTermGoal || undefined,
      midTermGoal: formData.midTermGoal || undefined,
      longTermGoal: formData.longTermGoal || undefined,
      currentChallenges: formData.currentChallenges.length > 0 ? formData.currentChallenges : undefined,
      biggestFrustration: formData.biggestFrustration || undefined,
      languages: formData.languages.length > 0 ? formData.languages : undefined,
      englishLevel: formData.englishLevel as EnglishLevel || undefined
    };

    onSubmit(request);
  };

  const renderSectionHeader = (section: string, title: string, icon: React.ReactNode) => (
    <button
      type="button"
      className="gsj-form-section__header"
      onClick={() => toggleSection(section)}
    >
      <span className="gsj-form-section__title">
        {icon}
        {title}
      </span>
      {expandedSections[section] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  );

  const renderTagInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    onAdd: () => void,
    tags: string[],
    onRemove: (index: number) => void
  ) => (
    <div className="gsj-form-group">
      <label className="gsj-form-label">{label}</label>
      <div className="gsj-tag-input">
        <div className="gsj-tag-input__tags">
          {tags.map((tag, index) => (
            <span key={index} className="gsj-tag">
              {tag}
              <button type="button" onClick={() => onRemove(index)}>&times;</button>
            </span>
          ))}
        </div>
        <div className="gsj-tag-input__add">
          <input
            type="text"
            className="gsj-form-input"
            placeholder={`Add ${label.toLowerCase()}...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          />
          <button type="button" className="gsj-btn gsj-btn--secondary" onClick={onAdd}>Add</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="gsj-modal-overlay" onClick={onClose}>
      <div className="gsj-modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="gsj-modal__header">
          <h2 className="gsj-modal__title">
            <Zap size={20} style={{ marginRight: '8px', color: 'var(--gsj-primary)' }} />
            Start New Journey
          </h2>
          <button className="gsj-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="gsj-modal__body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

            {/* Basic Info */}
            <div className="gsj-form-section">
              {renderSectionHeader('basic', 'Basic Information', <Zap size={16} />)}
              {expandedSections.basic && (
                <div className="gsj-form-section__content">
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Journey Title *</label>
                    <input
                      type="text"
                      className="gsj-form-input"
                      placeholder="e.g., Become a Full-Stack Developer"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">What is your main goal? *</label>
                    <textarea
                      className="gsj-form-textarea"
                      placeholder="Describe what you want to achieve..."
                      value={formData.targetGoal}
                      onChange={(e) => handleChange('targetGoal', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Career Goals */}
            <div className="gsj-form-section">
              {renderSectionHeader('career', 'Career Goals', <Zap size={16} />)}
              {expandedSections.career && (
                <div className="gsj-form-section__content">
                  <div className="gsj-form-row">
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Target Career</label>
                      <input
                        type="text"
                        className="gsj-form-input"
                        placeholder="e.g., Backend Developer"
                        value={formData.targetCareer}
                        onChange={(e) => handleChange('targetCareer', e.target.value)}
                      />
                    </div>
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Industry</label>
                      <input
                        type="text"
                        className="gsj-form-input"
                        placeholder="e.g., Fintech, E-commerce"
                        value={formData.targetIndustry}
                        onChange={(e) => handleChange('targetIndustry', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="gsj-form-row">
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Company Size</label>
                      <select
                        className="gsj-form-select"
                        value={formData.preferredCompanySize}
                        onChange={(e) => handleChange('preferredCompanySize', e.target.value)}
                      >
                        <option value="">Select size...</option>
                        <option value="STARTUP">Startup</option>
                        <option value="SME">SME</option>
                        <option value="CORPORATE">Corporate</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Work Style</label>
                      <select
                        className="gsj-form-select"
                        value={formData.workStyle}
                        onChange={(e) => handleChange('workStyle', e.target.value)}
                      >
                        <option value="">Select style...</option>
                        <option value="REMOTE">Remote</option>
                        <option value="HYBRID">Hybrid</option>
                        <option value="ONSITE">On-site</option>
                      </select>
                    </div>
                  </div>
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Target Location</label>
                    <input
                      type="text"
                      className="gsj-form-input"
                      placeholder="e.g., Vietnam, Remote, Singapore"
                      value={formData.targetLocation}
                      onChange={(e) => handleChange('targetLocation', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Current Skills */}
            <div className="gsj-form-section">
              {renderSectionHeader('skills', 'Current Skills & Experience', <Zap size={16} />)}
              {expandedSections.skills && (
                <div className="gsj-form-section__content">
                  <div className="gsj-form-row">
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Years of Experience</label>
                      <input
                        type="number"
                        className="gsj-form-input"
                        placeholder="0"
                        min="0"
                        value={formData.yearsOfExperience}
                        onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
                      />
                    </div>
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Current Job Level</label>
                      <select
                        className="gsj-form-select"
                        value={formData.currentJobLevel}
                        onChange={(e) => handleChange('currentJobLevel', e.target.value)}
                      >
                        <option value="">Select level...</option>
                        <option value="STUDENT">Student</option>
                        <option value="FRESHER">Fresher</option>
                        <option value="JUNIOR">Junior</option>
                        <option value="MIDDLE">Middle</option>
                        <option value="SENIOR">Senior</option>
                        <option value="LEAD">Lead</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                    </div>
                  </div>
                  {renderTagInput(
                    'Existing Skills',
                    newSkill,
                    setNewSkill,
                    () => addToArray('existingSkills', newSkill, setNewSkill),
                    formData.existingSkills,
                    (i) => removeFromArray('existingSkills', i)
                  )}
                  {renderTagInput(
                    'Familiar Tools/Technologies',
                    newTool,
                    setNewTool,
                    () => addToArray('familiarTools', newTool, setNewTool),
                    formData.familiarTools,
                    (i) => removeFromArray('familiarTools', i)
                  )}
                </div>
              )}
            </div>

            {/* Experience Level */}
            <div className="gsj-form-section">
              {renderSectionHeader('experience', 'Self Assessment', <Zap size={16} />)}
              {expandedSections.experience && (
                <div className="gsj-form-section__content">
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Experience Level *</label>
                    <select
                      className="gsj-form-select"
                      value={formData.experienceLevel}
                      onChange={(e) => handleChange('experienceLevel', e.target.value)}
                      required
                    >
                      <option value="BEGINNER">Beginner - Just starting out</option>
                      <option value="ELEMENTARY">Elementary - Some basic knowledge</option>
                      <option value="INTERMEDIATE">Intermediate - Working on real projects</option>
                      <option value="ADVANCED">Advanced - Can handle complex tasks</option>
                      <option value="EXPERT">Expert - Industry professional</option>
                    </select>
                  </div>
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Self Assessment</label>
                    <textarea
                      className="gsj-form-textarea"
                      placeholder="Describe what you can and cannot do..."
                      value={formData.selfAssessment}
                      onChange={(e) => handleChange('selfAssessment', e.target.value)}
                    />
                  </div>
                  {renderTagInput(
                    'Completed Projects',
                    newProject,
                    setNewProject,
                    () => addToArray('completedProjects', newProject, setNewProject),
                    formData.completedProjects,
                    (i) => removeFromArray('completedProjects', i)
                  )}
                </div>
              )}
            </div>

            {/* Background */}
            <div className="gsj-form-section">
              {renderSectionHeader('background', 'Education Background', <Zap size={16} />)}
              {expandedSections.background && (
                <div className="gsj-form-section__content">
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Education</label>
                    <input
                      type="text"
                      className="gsj-form-input"
                      placeholder="e.g., Bachelor of Computer Science"
                      value={formData.educationBackground}
                      onChange={(e) => handleChange('educationBackground', e.target.value)}
                    />
                  </div>
                  <div className="gsj-form-row">
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Major</label>
                      <input
                        type="text"
                        className="gsj-form-input"
                        placeholder="e.g., Computer Science"
                        value={formData.major}
                        onChange={(e) => handleChange('major', e.target.value)}
                      />
                    </div>
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Graduation Year</label>
                      <input
                        type="number"
                        className="gsj-form-input"
                        placeholder="e.g., 2026"
                        min="1950"
                        max="2030"
                        value={formData.graduationYear}
                        onChange={(e) => handleChange('graduationYear', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Learning Preferences */}
            <div className="gsj-form-section">
              {renderSectionHeader('learning', 'Learning Preferences', <Zap size={16} />)}
              {expandedSections.learning && (
                <div className="gsj-form-section__content">
                  <div className="gsj-form-row">
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Learning Style</label>
                      <select
                        className="gsj-form-select"
                        value={formData.learningStyle}
                        onChange={(e) => handleChange('learningStyle', e.target.value)}
                      >
                        <option value="VISUAL">Visual - Learn through diagrams & videos</option>
                        <option value="AUDITORY">Auditory - Learn through listening</option>
                        <option value="READING">Reading - Learn through reading</option>
                        <option value="KINESTHETIC">Hands-on - Learn by doing</option>
                      </select>
                    </div>
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Preferred Format</label>
                      <select
                        className="gsj-form-select"
                        value={formData.preferredFormat}
                        onChange={(e) => handleChange('preferredFormat', e.target.value)}
                      >
                        <option value="COURSE">Online Courses</option>
                        <option value="VIDEO">Video Tutorials</option>
                        <option value="READING">Books & Articles</option>
                        <option value="HANDS_ON">Practice Projects</option>
                        <option value="MENTORSHIP">Mentorship</option>
                      </select>
                    </div>
                  </div>
                  <div className="gsj-form-row">
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Hours per Week</label>
                      <input
                        type="number"
                        className="gsj-form-input"
                        placeholder="e.g., 10"
                        min="1"
                        max="80"
                        value={formData.hoursPerWeek}
                        onChange={(e) => handleChange('hoursPerWeek', e.target.value)}
                      />
                    </div>
                    <div className="gsj-form-group">
                      <label className="gsj-form-label">Preferred Study Time</label>
                      <select
                        className="gsj-form-select"
                        value={formData.preferredStudyTime}
                        onChange={(e) => handleChange('preferredStudyTime', e.target.value)}
                      >
                        <option value="MORNING">Morning</option>
                        <option value="AFTERNOON">Afternoon</option>
                        <option value="EVENING">Evening</option>
                        <option value="WEEKEND">Weekend</option>
                      </select>
                    </div>
                  </div>
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Learning Motivation</label>
                    <textarea
                      className="gsj-form-textarea"
                      placeholder="Why do you want to learn this?"
                      value={formData.learningMotivation}
                      onChange={(e) => handleChange('learningMotivation', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Goals */}
            <div className="gsj-form-section">
              {renderSectionHeader('goals', 'Learning Goals', <Zap size={16} />)}
              {expandedSections.goals && (
                <div className="gsj-form-section__content">
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Short-term Goal (3 months)</label>
                    <textarea
                      className="gsj-form-textarea"
                      placeholder="What do you want to achieve in 3 months?"
                      value={formData.shortTermGoal}
                      onChange={(e) => handleChange('shortTermGoal', e.target.value)}
                    />
                  </div>
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Mid-term Goal (6 months)</label>
                    <textarea
                      className="gsj-form-textarea"
                      placeholder="What do you want to achieve in 6 months?"
                      value={formData.midTermGoal}
                      onChange={(e) => handleChange('midTermGoal', e.target.value)}
                    />
                  </div>
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Long-term Goal (1 year)</label>
                    <textarea
                      className="gsj-form-textarea"
                      placeholder="What do you want to achieve in 1 year?"
                      value={formData.longTermGoal}
                      onChange={(e) => handleChange('longTermGoal', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Challenges */}
            <div className="gsj-form-section">
              {renderSectionHeader('challenges', 'Challenges & Pain Points', <Zap size={16} />)}
              {expandedSections.challenges && (
                <div className="gsj-form-section__content">
                  {renderTagInput(
                    'Current Challenges',
                    newChallenge,
                    setNewChallenge,
                    () => addToArray('currentChallenges', newChallenge, setNewChallenge),
                    formData.currentChallenges,
                    (i) => removeFromArray('currentChallenges', i)
                  )}
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">Biggest Frustration</label>
                    <textarea
                      className="gsj-form-textarea"
                      placeholder="What frustrates you most in your learning journey?"
                      value={formData.biggestFrustration}
                      onChange={(e) => handleChange('biggestFrustration', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Language */}
            <div className="gsj-form-section">
              {renderSectionHeader('language', 'Language Skills', <Zap size={16} />)}
              {expandedSections.language && (
                <div className="gsj-form-section__content">
                  {renderTagInput(
                    'Languages',
                    newLanguage,
                    setNewLanguage,
                    () => addToArray('languages', newLanguage, setNewLanguage),
                    formData.languages,
                    (i) => removeFromArray('languages', i)
                  )}
                  <div className="gsj-form-group">
                    <label className="gsj-form-label">English Level</label>
                    <select
                      className="gsj-form-select"
                      value={formData.englishLevel}
                      onChange={(e) => handleChange('englishLevel', e.target.value)}
                    >
                      <option value="NONE">None</option>
                      <option value="BASIC">Basic</option>
                      <option value="CONVERSATIONAL">Conversational</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="NATIVE">Native</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="gsj-modal__footer">
            <button type="button" className="gsj-btn gsj-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="gsj-btn gsj-btn--primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="gsj-spinner" style={{ width: '16px', height: '16px' }}></span>
                  Creating...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Start Journey
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GSJJourneyForm;

