import { useState } from 'react';
import { Check, Search, X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import {
  DOMAIN_OPTIONS,
  SUB_CATEGORIES,
  JOBS_BY_DOMAIN,
  DomainType
} from '../../types/Journey';

interface CareerFormProps {
  onComplete: (data: { domain: string; subCategory: string; jobRole: string }) => void;
  onBack: () => void;
}

const CareerForm: React.FC<CareerFormProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState<DomainType | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentSubCategories = selectedDomain ? SUB_CATEGORIES[selectedDomain] || [] : [];
  const currentJobs = selectedSubCategory ? JOBS_BY_DOMAIN[selectedDomain!] || [] : [];

  const filteredJobs = currentJobs.filter(job =>
    job.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDomainSelect = (domain: DomainType) => {
    setSelectedDomain(domain);
    setSelectedSubCategory(null);
    setSelectedJob(null);
    setSearchQuery('');
  };

  const handleSubCategorySelect = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setSelectedJob(null);
    setSearchQuery('');
  };

  const handleJobSelect = (job: string) => {
    setSelectedJob(job);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = () => {
    if (selectedDomain && selectedSubCategory && selectedJob) {
      onComplete({
        domain: selectedDomain,
        subCategory: selectedSubCategory,
        jobRole: selectedJob
      });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedDomain;
      case 2:
        return !!selectedSubCategory;
      case 3:
        return !!selectedJob;
      default:
        return false;
    }
  };

  // Step 1: Select Domain
  const renderStep1 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">Chọn lĩnh vực</h2>
        <p className="gsj-wizard-step__subtitle">Bạn quan tâm đến lĩnh vực nào?</p>
      </div>

      <div className="gsj-domain-grid">
        {DOMAIN_OPTIONS.map((domain) => (
          <button
            key={domain.value}
            type="button"
            className={`gsj-domain-card ${selectedDomain === domain.value ? 'gsj-domain-card--selected' : ''}`}
            onClick={() => handleDomainSelect(domain.value as DomainType)}
          >
            <span className="gsj-domain-card__icon">{domain.icon}</span>
            <div className="gsj-domain-card__content">
              <span className="gsj-domain-card__label">{domain.label}</span>
              <span className="gsj-domain-card__desc">{domain.description}</span>
            </div>
            {selectedDomain === domain.value && (
              <span className="gsj-domain-card__check">
                <Check size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: Select Sub-category
  const renderStep2 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">
          Chọn ngành chi tiết
        </h2>
        <p className="gsj-wizard-step__subtitle">
          {DOMAIN_OPTIONS.find(d => d.value === selectedDomain)?.label} - Bạn muốn học về ngành nào?
        </p>
      </div>

      <div className="gsj-subcategory-grid">
        {currentSubCategories.map((sub) => (
          <button
            key={sub.value}
            type="button"
            className={`gsj-subcategory-card ${selectedSubCategory === sub.value ? 'gsj-subcategory-card--selected' : ''}`}
            onClick={() => handleSubCategorySelect(sub.value)}
          >
            <span className="gsj-subcategory-card__label">{sub.label}</span>
            {selectedSubCategory === sub.value && (
              <span className="gsj-subcategory-card__check">
                <Check size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 3: Select Job Role
  const renderStep3 = () => (
    <div className="gsj-wizard-step">
      <div className="gsj-wizard-step__header">
        <h2 className="gsj-wizard-step__title">
          Chọn vị trí công việc
        </h2>
        <p className="gsj-wizard-step__subtitle">
          Bạn hướng đến vị trí nào trong ngành {currentSubCategories.find(s => s.value === selectedSubCategory)?.label}?
        </p>
      </div>

      <div className="gsj-search-input">
        <Search size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm vị trí..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="gsj-job-grid">
        {filteredJobs.map((job) => (
          <button
            key={job.value}
            type="button"
            className={`gsj-job-card ${selectedJob === job.value ? 'gsj-job-card--selected' : ''}`}
            onClick={() => handleJobSelect(job.value)}
          >
            <div className="gsj-job-card__icon-wrap">
              <span className="gsj-job-card__icon">{job.icon}</span>
            </div>
            <div className="gsj-job-card__content">
              <span className="gsj-job-card__label">{job.label}</span>
              <span className="gsj-job-card__desc">{job.desc}</span>
            </div>
            {selectedJob === job.value && (
              <span className="gsj-job-card__check">
                <Check size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Get step title for progress indicator
  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Lĩnh vực';
      case 2: return 'Ngành';
      case 3: return 'Nghề';
      default: return '';
    }
  };

  return (
    <div className="gsj-career-form">
      {/* Progress */}
      <div className="gsj-career-progress">
        <div className="gsj-career-progress__steps">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`gsj-career-progress__step ${step >= s ? 'gsj-career-progress__step--active' : ''} ${step > s ? 'gsj-career-progress__step--completed' : ''}`}
            >
              <div className="gsj-career-progress__step-dot">
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className="gsj-career-progress__step-label">
                {s === 1 ? 'Lĩnh vực' : s === 2 ? 'Ngành' : 'Nghề'}
              </span>
            </div>
          ))}
        </div>
        <div className="gsj-career-progress__bar">
          <div
            className="gsj-career-progress__bar-fill"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Navigation */}
      <div className="gsj-wizard-nav">
        <button
          type="button"
          className="gsj-btn gsj-btn--secondary"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
          {step === 1 ? 'Quay lại' : 'Trước đó'}
        </button>

        {step < 3 ? (
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Tiếp theo
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="gsj-btn gsj-btn--primary"
            onClick={handleSubmit}
            disabled={!canProceed()}
          >
            <Sparkles size={16} />
            Hoàn thành
          </button>
        )}
      </div>
    </div>
  );
};

export default CareerForm;
