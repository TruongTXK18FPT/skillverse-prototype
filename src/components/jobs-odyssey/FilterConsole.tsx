import { useState } from "react";
import {
  Briefcase,
  Building2,
  Globe,
  LayoutGrid,
  RotateCcw,
  Search,
  Zap,
} from "lucide-react";

export const JOB_BUDGET_CAP = 50_000_000;

interface JobsFilterPanelProps {
  onFilterChange: (filters: JobFilterState) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
  viewType: JobViewType;
  onViewTypeChange: (viewType: JobViewType) => void;
  resultsCount?: number;
  longTermCount?: number;
  shortTermCount?: number;
}

export type JobViewType = "all" | "long-term" | "short-term";

export interface JobFilterState {
  workMode: "all" | "remote" | "onsite";
  minBudget: number;
  maxBudget: number;
}

const QUICK_BUDGET_PRESETS = [
  { key: "under-10", label: "Dưới 10 triệu", min: 0, max: 10_000_000 },
  { key: "10-20", label: "10 - 20 triệu", min: 10_000_000, max: 20_000_000 },
  { key: "20-40", label: "20 - 40 triệu", min: 20_000_000, max: 40_000_000 },
  {
    key: "over-40",
    label: "Trên 40 triệu",
    min: 40_000_000,
    max: JOB_BUDGET_CAP,
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);

const clampBudget = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, JOB_BUDGET_CAP);
};

const JobsFilterPanel = ({
  onFilterChange,
  onSearchChange,
  searchTerm,
  viewType,
  onViewTypeChange,
  resultsCount = 0,
  longTermCount = 0,
  shortTermCount = 0,
}: JobsFilterPanelProps) => {
  const [workMode, setWorkMode] = useState<JobFilterState["workMode"]>("all");
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(JOB_BUDGET_CAP);

  const syncFilter = (
    nextWorkMode: JobFilterState["workMode"],
    nextMinBudget: number,
    nextMaxBudget: number,
  ) => {
    let min = clampBudget(nextMinBudget);
    let max = clampBudget(nextMaxBudget);

    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }

    setWorkMode(nextWorkMode);
    setMinBudget(min);
    setMaxBudget(max);

    onFilterChange({
      workMode: nextWorkMode,
      minBudget: min,
      maxBudget: max,
    });
  };

  const resetFilter = () => {
    onSearchChange("");
    syncFilter("all", 0, JOB_BUDGET_CAP);
  };

  const isPresetActive = (min: number, max: number) =>
    minBudget === min && maxBudget === max;

  const workModeOptions: {
    key: JobFilterState["workMode"];
    label: string;
    icon: JSX.Element;
  }[] = [
    { key: "all", label: "Tất cả", icon: <LayoutGrid size={14} /> },
    { key: "remote", label: "Từ xa", icon: <Globe size={14} /> },
    { key: "onsite", label: "Tại chỗ", icon: <Building2 size={14} /> },
  ];

  const jobTypeOptions: {
    key: JobViewType;
    label: string;
    icon: JSX.Element;
    count: number;
  }[] = [
    {
      key: "all",
      label: "Tất cả",
      icon: <LayoutGrid size={14} />,
      count: resultsCount,
    },
    {
      key: "long-term",
      label: "Dài hạn",
      icon: <Briefcase size={14} />,
      count: longTermCount,
    },
    {
      key: "short-term",
      label: "Ngắn hạn",
      icon: <Zap size={14} />,
      count: shortTermCount,
    },
  ];

  return (
    <section className="jobs-filter-panel">
      <div className="jobs-filter-panel__row jobs-filter-panel__row--primary">
        <div className="jobs-filter-panel__group jobs-filter-panel__group--search">
          <label className="jobs-filter-panel__label">Từ khóa tìm kiếm</label>
          <div className="jobs-filter-panel__search-box">
            <Search className="jobs-filter-panel__search-icon" size={18} />
            <input
              type="text"
              placeholder="Ví dụ: React, Java, UX Designer..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className="jobs-filter-panel__search-input"
            />
          </div>
        </div>

        <div className="jobs-filter-panel__summary">
          <span className="jobs-filter-panel__summary-chip">
            {resultsCount} kết quả
          </span>
          <span className="jobs-filter-panel__summary-chip jobs-filter-panel__summary-chip--long-term">
            {longTermCount} dài hạn
          </span>
          <span className="jobs-filter-panel__summary-chip jobs-filter-panel__summary-chip--short-term">
            {shortTermCount} ngắn hạn
          </span>
        </div>

        <button
          className="jobs-filter-panel__reset"
          onClick={resetFilter}
          type="button"
        >
          <RotateCcw size={16} />
          Đặt lại
        </button>
      </div>

      <div className="jobs-filter-panel__row jobs-filter-panel__row--secondary">
        <div className="jobs-filter-panel__group-stack">
          <div className="jobs-filter-panel__group">
            <label className="jobs-filter-panel__label">Khu vực làm việc</label>
            <div className="jobs-filter-panel__segmented">
              {workModeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`jobs-filter-panel__segmented-button${workMode === option.key ? " jobs-filter-panel__segmented-button--active" : ""}`}
                  onClick={() => syncFilter(option.key, minBudget, maxBudget)}
                >
                  <span className="jobs-filter-panel__segmented-icon">
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="jobs-filter-panel__group">
            <label className="jobs-filter-panel__label">Loại công việc</label>
            <div className="jobs-filter-panel__segmented jobs-filter-panel__segmented--job-type">
              {jobTypeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`jobs-filter-panel__segmented-button${viewType === option.key ? " jobs-filter-panel__segmented-button--active" : ""}${option.key === "short-term" ? " jobs-filter-panel__segmented-button--short-term" : ""}`}
                  onClick={() => onViewTypeChange(option.key)}
                >
                  <span className="jobs-filter-panel__segmented-icon">
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                  <span className="jobs-filter-panel__option-count">
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="jobs-filter-panel__group jobs-filter-panel__group--budget">
          <label className="jobs-filter-panel__label">Khoảng ngân sách (VND)</label>

          <div className="jobs-filter-panel__budget-inputs">
            <div className="jobs-filter-panel__budget-field">
              <span className="jobs-filter-panel__sub-label">Tối thiểu</span>
              <input
                type="number"
                value={minBudget}
                min={0}
                max={JOB_BUDGET_CAP}
                step={100_000}
                className="jobs-filter-panel__number-input"
                onChange={(event) =>
                  syncFilter(
                    workMode,
                    Number(event.target.value || 0),
                    maxBudget,
                  )
                }
              />
            </div>

            <span className="jobs-filter-panel__budget-arrow">→</span>

            <div className="jobs-filter-panel__budget-field">
              <span className="jobs-filter-panel__sub-label">Tối đa</span>
              <input
                type="number"
                value={maxBudget}
                min={0}
                max={JOB_BUDGET_CAP}
                step={100_000}
                className="jobs-filter-panel__number-input"
                onChange={(event) =>
                  syncFilter(
                    workMode,
                    minBudget,
                    Number(event.target.value || 0),
                  )
                }
              />
            </div>
          </div>

          <div className="jobs-filter-panel__budget-presets">
            {QUICK_BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={`jobs-filter-panel__preset-chip${isPresetActive(preset.min, preset.max) ? " jobs-filter-panel__preset-chip--active" : ""}`}
                onClick={() => syncFilter(workMode, preset.min, preset.max)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <p className="jobs-filter-panel__budget-note">
            Đang lọc từ {formatCurrency(minBudget)} đến {formatCurrency(maxBudget)} VND
          </p>
        </div>
      </div>
    </section>
  );
};

export default JobsFilterPanel;