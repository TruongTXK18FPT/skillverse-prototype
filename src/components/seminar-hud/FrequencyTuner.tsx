import React from 'react';
import './briefing-styles.css';

interface FrequencyTunerProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const FrequencyTuner: React.FC<FrequencyTunerProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="briefing-frequency-tuner">
      <label className="briefing-tuner-label">📡 Bộ lọc chuyên mục</label>
      <div className="briefing-tuner-track">
        {categories.map((category) => (
          <button
            key={category}
            className={`briefing-tuner-option ${
              activeCategory === category ? 'active' : ''
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FrequencyTuner;
