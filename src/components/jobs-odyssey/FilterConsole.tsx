import { useState } from 'react';
import { RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterConsoleProps {
  onFilterChange: (filters: JobFilters) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
}

export interface JobFilters {
  deploymentZone: 'all' | 'remote' | 'onsite';
  minBounty: number;
  maxBounty: number;
}

const FilterConsole = ({ onFilterChange, onSearchChange, searchTerm }: FilterConsoleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deploymentZone, setDeploymentZone] = useState<'all' | 'remote' | 'onsite'>('all');
  const [minBounty, setMinBounty] = useState<number>(0);
  const [maxBounty, setMaxBounty] = useState<number>(50000000); // 50 million VND

  const handleDeploymentChange = (zone: 'all' | 'remote' | 'onsite') => {
    setDeploymentZone(zone);
    onFilterChange({ deploymentZone: zone, minBounty, maxBounty });
  };

  const handleBountyChange = (min: number, max: number) => {
    setMinBounty(min);
    setMaxBounty(max);
    onFilterChange({ deploymentZone, minBounty: min, maxBounty: max });
  };

  const handleReset = () => {
    setDeploymentZone('all');
    setMinBounty(0);
    setMaxBounty(50000000);
    onSearchChange('');
    onFilterChange({ deploymentZone: 'all', minBounty: 0, maxBounty: 50000000 });
  };

  return (
    <div className="odyssey-filter-console">
      {/* Console Header - Always visible */}
      <div className="odyssey-filter-console__header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="odyssey-filter-console__indicator"></div>
        <h3 className="odyssey-filter-console__title">Bộ lọc</h3>
        <button className="odyssey-filter-console__toggle">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Collapsible Content */}
      <div className={`odyssey-filter-console__content ${isExpanded ? 'odyssey-filter-console__content--expanded' : ''}`}>
        {/* Search Bar */}
        <div className="odyssey-filter-console__section">
        <label className="odyssey-filter-console__label">
          <span className="odyssey-filter-console__label-icon">◆</span>
          Từ khóa tìm kiếm
        </label>
        <div className="odyssey-filter-console__search-wrapper">
          <Search className="odyssey-filter-console__search-icon" size={18} />
          <input
            type="text"
            placeholder="Tìm công việc..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="odyssey-filter-console__search-input"
          />
        </div>
      </div>

      {/* Deployment Zone Switches */}
      <div className="odyssey-filter-console__section">
        <label className="odyssey-filter-console__label">
          <span className="odyssey-filter-console__label-icon">◆</span>
          Khu vực làm việc
        </label>
        <div className="odyssey-filter-console__toggle-group">
          <button
            className={`odyssey-filter-console__toggle ${deploymentZone === 'all' ? 'odyssey-filter-console__toggle--active' : ''}`}
            onClick={() => handleDeploymentChange('all')}
          >
            <span className="odyssey-filter-console__toggle-led"></span>
            Tất cả
          </button>
          <button
            className={`odyssey-filter-console__toggle ${deploymentZone === 'remote' ? 'odyssey-filter-console__toggle--active' : ''}`}
            onClick={() => handleDeploymentChange('remote')}
          >
            <span className="odyssey-filter-console__toggle-led"></span>
            Làm việc từ xa
          </button>
          <button
            className={`odyssey-filter-console__toggle ${deploymentZone === 'onsite' ? 'odyssey-filter-console__toggle--active' : ''}`}
            onClick={() => handleDeploymentChange('onsite')}
          >
            <span className="odyssey-filter-console__toggle-led"></span>
            Làm việc tại chỗ
          </button>
        </div>
      </div>

      {/* Bounty Range */}
      <div className="odyssey-filter-console__section">
        <label className="odyssey-filter-console__label">
          <span className="odyssey-filter-console__label-icon">◆</span>
          Khoảng ngân sách (VND)
        </label>
        <div className="odyssey-filter-console__range-group">
          <div className="odyssey-filter-console__range-input">
            <label className="odyssey-filter-console__range-label">Tối thiểu</label>
            <input
              type="number"
              className="odyssey-filter-console__input"
              value={minBounty}
              onChange={(e) => handleBountyChange(Number(e.target.value), maxBounty)}
              min={0}
              step={100000}
              placeholder="0"
            />
          </div>
          <div className="odyssey-filter-console__range-separator">—</div>
          <div className="odyssey-filter-console__range-input">
            <label className="odyssey-filter-console__range-label">Tối đa</label>
            <input
              type="number"
              className="odyssey-filter-console__input"
              value={maxBounty}
              onChange={(e) => handleBountyChange(minBounty, Number(e.target.value))}
              min={0}
              step={100000}
              placeholder="50000000"
            />
          </div>
        </div>
      </div>

        {/* Reset Button */}
        <button className="odyssey-filter-console__reset" onClick={handleReset}>
          <RotateCcw className="odyssey-filter-console__reset-icon" />
          Đặt lại bộ lọc
        </button>
      </div>
    </div>
  );
};

export default FilterConsole;
