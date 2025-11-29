import React from 'react';
import { Search } from 'lucide-react';
import './uplink-styles.css';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface UplinkHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const UplinkHeader: React.FC<UplinkHeaderProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="uplink-header">
      <div className="uplink-header-content">
        <h1 className="uplink-title">Danh sách Mentor</h1>
        <p className="uplink-subtitle">
          Truy cập hồ sơ mentor và kết nối hướng dẫn
        </p>

        {/* Signal Scanner - Search Input */}
        <div className="uplink-scanner">
          <input
            type="text"
            className="uplink-search-input"
            placeholder="Tìm kiếm theo tên hoặc chuyên môn..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="uplink-search-icon" size={20} />
        </div>

        {/* Frequency Caps - Filter Chips */}
        <div className="uplink-frequency-caps">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`uplink-freq-chip ${
                selectedCategory === category.id ? 'uplink-active' : ''
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              <span>{category.name}</span>
              <span className="uplink-freq-count">({category.count})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UplinkHeader;
