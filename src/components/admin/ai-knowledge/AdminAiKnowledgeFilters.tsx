import React, { useEffect, useState, useMemo } from 'react';
import {
  AiKnowledgeApprovalStatus,
  AiKnowledgeIngestionStatus,
  ListAdminAiKnowledgeDocumentsParams,
} from '../../../types/aiKnowledge';
import { LocalSearchSelect } from '../roadmap/JobPositionTrackSkillTab';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { Skill } from '../../../types/skillRegistry';

interface AdminAiKnowledgeFiltersProps {
  filters: ListAdminAiKnowledgeDocumentsParams;
  onChange: (nextFilters: ListAdminAiKnowledgeDocumentsParams) => void;
  onReset: () => void;
}

// FE equivalent of AiKnowledgeSlugUtils.toRoadmapSkillSlug
function toRoadmapSkillSlug(name: string): string {
  if (!name) return '';
  let normalized = name.trim().toLowerCase();
  
  // Special programming languages maps
  normalized = normalized.replace(/c#/g, 'csharp');
  normalized = normalized.replace(/c\+\+/g, 'cpp');
  normalized = normalized.replace(/c\//g, 'c');
  normalized = normalized.replace(/\.net/g, 'dotnet');
  normalized = normalized.replace(/node\.js/g, 'nodejs');
  normalized = normalized.replace(/nodejs/g, 'nodejs');
  normalized = normalized.replace(/f#/g, 'fsharp');
  normalized = normalized.replace(/r#/g, 'rsharp');
  
  // Normalize diacritics (remove accents)
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Replace remaining non-alphanumeric with hyphens
  normalized = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
    
  return normalized;
}

const AdminAiKnowledgeFilters: React.FC<AdminAiKnowledgeFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const loadSkills = () => {
    setSkillsLoading(true);
    setSkillsError(null);
    adminSkillRegistryService.getActiveSkills()
      .then((data) => {
        setSkills(data);
        setSkillsError(null);
      })
      .catch((err) => {
        console.error("Failed to load skills for filter panel:", err);
        setSkillsError("Không thể tải danh sách kỹ năng");
      })
      .finally(() => {
        setSkillsLoading(false);
      });
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const skillOptions = useMemo(() => {
    return skills.map((s) => ({ id: s.name, label: s.name }));
  }, [skills]);

  const selectedSkillValue = useMemo(() => {
    if (!filters.skillSlug) return '';
    const found = skills.find((s) => toRoadmapSkillSlug(s.name) === filters.skillSlug);
    return found ? found.name : '';
  }, [skills, filters.skillSlug]);

  return (
    <section className="adminaiknowledge-card adminaiknowledge-filters-panel">
      <div className="adminaiknowledge-section-header adminaiknowledge-section-header--compact">
        <div>
          <span className="adminaiknowledge-section-eyebrow">Bộ lọc</span>
          <h2>Danh sách tài liệu</h2>
        </div>
        <button 
          type="button" 
          className="adminaiknowledge-secondary-btn" 
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', height: 'auto', minHeight: '34px' }} 
          onClick={onReset}
        >
          Xóa bộ lọc
        </button>
      </div>

      <div className="adminaiknowledge-filter-grid adminaiknowledge-filter-grid--compact">

        <label className="adminaiknowledge-field">
          <span>Approval status</span>
          <select
            value={filters.approvalStatus ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 0,
                approvalStatus: event.target.value
                  ? (event.target.value as AiKnowledgeApprovalStatus)
                  : undefined,
              })
            }
          >
            <option value="">Tất cả</option>
            <option value={AiKnowledgeApprovalStatus.PENDING}>PENDING</option>
            <option value={AiKnowledgeApprovalStatus.APPROVED}>APPROVED</option>
            <option value={AiKnowledgeApprovalStatus.REJECTED}>REJECTED</option>
          </select>
        </label>

        <label className="adminaiknowledge-field">
          <span>Ingestion status</span>
          <select
            value={filters.ingestionStatus ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 0,
                ingestionStatus: event.target.value
                  ? (event.target.value as AiKnowledgeIngestionStatus)
                  : undefined,
              })
            }
          >
            <option value="">Tất cả</option>
            <option value={AiKnowledgeIngestionStatus.NOT_INGESTED}>NOT_INGESTED</option>
            <option value={AiKnowledgeIngestionStatus.INDEXED}>INDEXED</option>
            <option value={AiKnowledgeIngestionStatus.FAILED}>FAILED</option>
          </select>
        </label>

        <label className="adminaiknowledge-field">
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Lọc theo kỹ năng
            {skillsError && (
              <button 
                type="button" 
                onClick={loadSkills}
                style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Thử lại
              </button>
            )}
          </span>
          <LocalSearchSelect
            options={skillOptions}
            value={selectedSkillValue}
            placeholder={skillsLoading ? "Đang tải kỹ năng..." : skillsError ? "Lỗi tải kỹ năng" : "Tất cả kỹ năng..."}
            onChange={(val) => {
              const slug = val ? toRoadmapSkillSlug(val as string) : undefined;
              onChange({
                ...filters,
                page: 0,
                skillSlug: slug,
              });
            }}
            disabled={skillsLoading || !!skillsError}
          />
        </label>


      </div>
    </section>
  );
};

export default AdminAiKnowledgeFilters;
