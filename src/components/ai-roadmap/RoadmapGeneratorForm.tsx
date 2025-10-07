import { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { GenerateRoadmapRequest } from '../../types/Roadmap';

interface RoadmapGeneratorFormProps {
  onGenerate: (request: GenerateRoadmapRequest) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Form for generating AI roadmaps
 */
const RoadmapGeneratorForm = ({ onGenerate, isLoading = false }: RoadmapGeneratorFormProps) => {
  const [formData, setFormData] = useState<GenerateRoadmapRequest>({
    goal: '',
    duration: '3 months',
    experience: 'beginner',
    style: 'project-based'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GenerateRoadmapRequest, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof GenerateRoadmapRequest, string>> = {};

    if (!formData.goal || formData.goal.trim().length < 5) {
      newErrors.goal = 'Goal must be at least 5 characters';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    if (!formData.experience) {
      newErrors.experience = 'Experience level is required';
    }

    if (!formData.style) {
      newErrors.style = 'Learning style is required';
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
    <form onSubmit={handleSubmit} className="sv-roadmap-generator-form">
      <div className="sv-roadmap-generator-form__header">
        <Sparkles className="sv-roadmap-generator-form__icon" />
        <h2 className="sv-roadmap-generator-form__title">Generate AI Learning Roadmap</h2>
        <p className="sv-roadmap-generator-form__subtitle">
          Create a personalized learning path powered by AI
        </p>
      </div>

      <div className="sv-roadmap-generator-form__fields">
        {/* Goal */}
        <div className="sv-form-group">
          <label htmlFor="goal" className="sv-form-label">
            Learning Goal *
          </label>
          <input
            id="goal"
            type="text"
            className={`sv-form-input ${errors.goal ? 'sv-form-input--error' : ''}`}
            placeholder="e.g., Learn Spring Boot, Become a Data Scientist, Master React"
            value={formData.goal}
            onChange={(e) => handleChange('goal', e.target.value)}
            disabled={isLoading}
          />
          {errors.goal && <span className="sv-form-error">{errors.goal}</span>}
        </div>

        {/* Duration */}
        <div className="sv-form-group">
          <label htmlFor="duration" className="sv-form-label">
            Duration *
          </label>
          <select
            id="duration"
            className={`sv-form-select ${errors.duration ? 'sv-form-select--error' : ''}`}
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            disabled={isLoading}
          >
            <option value="2 weeks">2 weeks</option>
            <option value="1 month">1 month</option>
            <option value="2 months">2 months</option>
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="1 year">1 year</option>
          </select>
          {errors.duration && <span className="sv-form-error">{errors.duration}</span>}
        </div>

        {/* Experience */}
        <div className="sv-form-group">
          <label htmlFor="experience" className="sv-form-label">
            Experience Level *
          </label>
          <select
            id="experience"
            className={`sv-form-select ${errors.experience ? 'sv-form-select--error' : ''}`}
            value={formData.experience}
            onChange={(e) => handleChange('experience', e.target.value)}
            disabled={isLoading}
          >
            <option value="beginner">Beginner - Just starting out</option>
            <option value="intermediate">Intermediate - Some experience</option>
            <option value="advanced">Advanced - Expert level</option>
          </select>
          {errors.experience && <span className="sv-form-error">{errors.experience}</span>}
        </div>

        {/* Style */}
        <div className="sv-form-group">
          <label htmlFor="style" className="sv-form-label">
            Learning Style *
          </label>
          <select
            id="style"
            className={`sv-form-select ${errors.style ? 'sv-form-select--error' : ''}`}
            value={formData.style}
            onChange={(e) => handleChange('style', e.target.value)}
            disabled={isLoading}
          >
            <option value="project-based">Project-Based - Learn by building</option>
            <option value="theoretical">Theoretical - Deep concepts</option>
            <option value="video-based">Video-Based - Visual learning</option>
            <option value="hands-on">Hands-On - Interactive practice</option>
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
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Generate Roadmap
          </>
        )}
      </button>
    </form>
  );
};

export default RoadmapGeneratorForm;
