import React from 'react';
import {
  AiKnowledgeApprovalStatus,
  AiKnowledgeIngestionStatus,
  AiKnowledgeUseCase,
  ListAdminAiKnowledgeDocumentsParams,
} from '../../../types/aiKnowledge';

interface AdminAiKnowledgeFiltersProps {
  filters: ListAdminAiKnowledgeDocumentsParams;
  onChange: (nextFilters: ListAdminAiKnowledgeDocumentsParams) => void;
  onReset: () => void;
}

const AdminAiKnowledgeFilters: React.FC<AdminAiKnowledgeFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <section className="adminaiknowledge-card adminaiknowledge-filters-panel">
      <div className="adminaiknowledge-section-header adminaiknowledge-section-header--compact">
        <div>
          <span className="adminaiknowledge-section-eyebrow">Bộ lọc</span>
          <h2>Danh sách tài liệu</h2>
        </div>
      </div>

      <div className="adminaiknowledge-filter-grid adminaiknowledge-filter-grid--compact">
        <label className="adminaiknowledge-field">
          <span>Use case</span>
          <select
            value={filters.useCase ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 0,
                useCase: event.target.value ? (event.target.value as AiKnowledgeUseCase) : undefined,
              })
            }
          >
            <option value="">Tất cả</option>
            <option value={AiKnowledgeUseCase.CHATBOT_GLOBAL}>CHATBOT_GLOBAL</option>
            <option value={AiKnowledgeUseCase.ROADMAP_SKILL}>ROADMAP_SKILL</option>
            {/* Legacy filters for historical grading docs only. Mentor grading-doc uploads were removed 2026-04-24. */}
            {/* <option value={AiKnowledgeUseCase.GRADING_ASSIGNMENT}>GRADING_ASSIGNMENT</option>
            <option value={AiKnowledgeUseCase.GRADING_MODULE}>GRADING_MODULE</option>
            <option value={AiKnowledgeUseCase.GRADING_COURSE}>GRADING_COURSE</option> */}
          </select>
        </label>

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
          <span>Skill slug</span>
          <input
            type="text"
            placeholder="Search slug..."
            value={filters.skillSlug ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 0,
                skillSlug: event.target.value || undefined,
              })
            }
          />
        </label>
{/* 
        <label className="adminaiknowledge-field">
          <span>Course ID</span>
          <input
            type="number"
            min="1"
            placeholder="ID..."
            value={filters.courseId ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 0,
                courseId: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </label>

        <label className="adminaiknowledge-field">
          <span>Module ID</span>
          <input
            type="number"
            min="1"
            placeholder="ID..."
            value={filters.moduleId ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 0,
                moduleId: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </label>

        <label className="adminaiknowledge-field">
          <span>Assignment ID</span>
          <input
            type="number"
            min="1"
            placeholder="ID..."
            value={filters.assignmentId ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 0,
                assignmentId: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </label> */}

        <div className="adminaiknowledge-field adminaiknowledge-filter-actions-inline">
          <span>&nbsp;</span>
          <button type="button" className="adminaiknowledge-secondary-btn" onClick={onReset}>
            Xóa bộ lọc
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdminAiKnowledgeFilters;
