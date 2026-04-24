import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers3,
  RefreshCw,
  ShieldX,
  SquareArrowOutUpRight,
  Trash2,
  XCircle,
} from 'lucide-react';
import Toast from '../../components/shared/Toast';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import {
  deleteMentorAiKnowledgeDocument,
  getMentorAiKnowledgeDocumentDetail,
  listMentorAiKnowledgeDocuments,
  submitMentorGradingDocument,
  submitMentorRoadmapDocument,
} from '../../services/aiKnowledgeService';
import { listAssignmentsByModule } from '../../services/assignmentService';
import { listCoursesByAuthor } from '../../services/courseService';
import { listModulesWithContent } from '../../services/moduleService';
import { AssignmentSummaryDTO } from '../../data/assignmentDTOs';
import { CourseSummaryDTO } from '../../data/courseDTOs';
import { ModuleDetailDTO } from '../../data/moduleDTOs';
import {
  AI_KNOWLEDGE_INDUSTRY_OPTIONS,
  AI_KNOWLEDGE_LEVEL_OPTIONS,
  AiKnowledgeApprovalStatus,
  AiKnowledgeDocumentDetailResponse,
  AiKnowledgeDocumentListItemResponse,
  AiKnowledgeIngestionStatus,
} from '../../types/aiKnowledge';
import '../../styles/MentorAiKnowledgePage.css';

type SubmitTab = 'roadmap' | 'grading';

const PAGE_SIZE = 10;

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
    : 'Chưa có';

const getStatusTone = (
  approvalStatus: AiKnowledgeApprovalStatus,
  ingestionStatus: AiKnowledgeIngestionStatus,
) => {
  if (approvalStatus === AiKnowledgeApprovalStatus.REJECTED) return 'rejected';
  if (approvalStatus === AiKnowledgeApprovalStatus.APPROVED && ingestionStatus === AiKnowledgeIngestionStatus.INDEXED) return 'indexed';
  if (ingestionStatus === AiKnowledgeIngestionStatus.FAILED) return 'failed';
  if (approvalStatus === AiKnowledgeApprovalStatus.APPROVED) return 'approved';
  return 'pending';
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return apiMessage || fallback;
};

const MentorAiKnowledgePage: React.FC = () => {
  const { user } = useAuth();
  const { toast, isVisible, hideToast, showError, showInfo, showSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<SubmitTab>('roadmap');
  const [documents, setDocuments] = useState<AiKnowledgeDocumentListItemResponse[]>([]);
  const [detail, setDetail] = useState<AiKnowledgeDocumentDetailResponse | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState<SubmitTab | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [modules, setModules] = useState<ModuleDetailDTO[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentSummaryDTO[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [roadmapForm, setRoadmapForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    skillName: '',
    industry: '',
    level: '',
  });

  const [gradingForm, setGradingForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    courseId: '',
    moduleId: '',
    assignmentId: '',
  });

  const selectedCourseId = gradingForm.courseId ? Number(gradingForm.courseId) : null;
  const selectedModuleId = gradingForm.moduleId ? Number(gradingForm.moduleId) : null;

  const roadmapFileRef = useRef<HTMLInputElement>(null);
  const gradingFileRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setListLoading(true);
    }

    try {
      const response = await listMentorAiKnowledgeDocuments({ page, size: PAGE_SIZE });
      if (page > 0 && response.content.length === 0 && response.totalElements > 0) {
        setPage((previous) => Math.max(previous - 1, 0));
        return;
      }
      setDocuments(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);

      if (response.content.length === 0) {
        setSelectedId(null);
        setDetail(null);
        return;
      }

      setSelectedId((previous) => {
        if (previous && response.content.some((item) => item.id === previous)) {
          return previous;
        }
        return null;
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Không thể tải danh sách tài liệu AI của mentor.'));
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  };

  const loadDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await getMentorAiKnowledgeDocumentDetail(id);
      setDetail(response);
      setError(null);
    } catch (loadError) {
      setDetail(null);
      setError(getApiErrorMessage(loadError, 'Không thể tải chi tiết tài liệu AI.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const loadCourses = async () => {
    if (!user?.id) return;

    setCoursesLoading(true);
    try {
      const response = await listCoursesByAuthor(user.id, 0, 100);
      setCourses(response.content || []);
    } catch (loadError) {
      showError('Không thể tải khóa học', getApiErrorMessage(loadError, 'Không thể tải danh sách khóa học mentor phụ trách.'));
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadModules = async (courseId: number) => {
    setModulesLoading(true);
    try {
      const response = await listModulesWithContent(courseId);
      setModules(response);
    } catch (loadError) {
      setModules([]);
      showError('Không thể tải module', getApiErrorMessage(loadError, 'Không thể tải danh sách module.'));
    } finally {
      setModulesLoading(false);
    }
  };

  const loadAssignments = async (moduleId: number) => {
    setAssignmentsLoading(true);
    try {
      const response = await listAssignmentsByModule(moduleId);
      setAssignments(response || []);
    } catch (loadError) {
      setAssignments([]);
      showError('Không thể tải assignment', getApiErrorMessage(loadError, 'Không thể tải danh sách assignment.'));
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [page]);

  useEffect(() => {
    if (selectedId != null) {
      void loadDetail(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadCourses();
  }, [user?.id]);

  useEffect(() => {
    if (selectedCourseId != null) {
      void loadModules(selectedCourseId);
    } else {
      setModules([]);
    }
    setAssignments([]);
    setGradingForm((previous) => ({
      ...previous,
      moduleId: '',
      assignmentId: '',
    }));
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedModuleId != null) {
      void loadAssignments(selectedModuleId);
    } else {
      setAssignments([]);
    }
    setGradingForm((previous) => ({
      ...previous,
      assignmentId: '',
    }));
  }, [selectedModuleId]);

  const handleRefresh = async () => {
    await loadDocuments(true);
  };

  const handleRefreshDetail = async () => {
    if (selectedId == null) {
      await loadDocuments(true);
      return;
    }
    await loadDetail(selectedId);
  };

  const handleRoadmapSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roadmapForm.file) {
      showInfo('Thiếu tệp', 'Bạn cần chọn tệp PDF, DOCX, MD, hoặc TXT trước khi gửi tài liệu roadmap.');
      return;
    }

    setSubmitting('roadmap');
    try {
      const created = await submitMentorRoadmapDocument({
        file: roadmapForm.file,
        title: roadmapForm.title,
        description: roadmapForm.description || undefined,
        skillName: roadmapForm.skillName,
        industry: roadmapForm.industry || undefined,
        level: roadmapForm.level || undefined,
      });

      showSuccess('Đã gửi tài liệu', 'Tài liệu roadmap đã được gửi để admin review.');
      setRoadmapForm({
        file: null,
        title: '',
        description: '',
        skillName: '',
        industry: '',
        level: '',
      });
      if (roadmapFileRef.current) {
        roadmapFileRef.current.value = '';
      }
      await loadDocuments(true);
      setSelectedId(created.id);
    } catch (submitError) {
      showError('Gửi thất bại', getApiErrorMessage(submitError, 'Không thể gửi tài liệu roadmap.'));
    } finally {
      setSubmitting(null);
    }
  };

  const handleGradingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gradingForm.file) {
      showInfo('Thiếu tệp', 'Bạn cần chọn tệp PDF, DOCX, MD, hoặc TXT trước khi gửi tài liệu grading.');
      return;
    }
    if (!gradingForm.courseId) {
      showInfo('Thiếu khóa học', 'Bạn cần chọn khóa học để gắn phạm vi tài liệu grading.');
      return;
    }

    setSubmitting('grading');
    try {
      const created = await submitMentorGradingDocument({
        file: gradingForm.file,
        title: gradingForm.title,
        description: gradingForm.description || undefined,
        courseId: Number(gradingForm.courseId),
        moduleId: gradingForm.moduleId ? Number(gradingForm.moduleId) : undefined,
        assignmentId: gradingForm.assignmentId ? Number(gradingForm.assignmentId) : undefined,
      });

      showSuccess('Đã gửi tài liệu', 'Tài liệu grading đã được gửi để admin review.');
      setGradingForm({
        file: null,
        title: '',
        description: '',
        courseId: '',
        moduleId: '',
        assignmentId: '',
      });
      setModules([]);
      setAssignments([]);
      if (gradingFileRef.current) {
        gradingFileRef.current.value = '';
      }
      await loadDocuments(true);
      setSelectedId(created.id);
    } catch (submitError) {
      showError('Gửi thất bại', getApiErrorMessage(submitError, 'Không thể gửi tài liệu grading.'));
    } finally {
      setSubmitting(null);
    }
  };

  const handleDeletePending = async () => {
    if (!detail || detail.approvalStatus !== AiKnowledgeApprovalStatus.PENDING) {
      return;
    }

    setDeleting(true);
    try {
      await deleteMentorAiKnowledgeDocument(detail.id);
      showSuccess('Đã xóa submission', 'Submission pending đã được xóa khỏi danh sách của bạn.');
      setConfirmDeleteOpen(false);
      await loadDocuments(true);
    } catch (deleteError) {
      showError('Xóa thất bại', getApiErrorMessage(deleteError, 'Không thể xóa submission pending.'));
    } finally {
      setDeleting(false);
    }
  };

  const canDeletePending = detail?.approvalStatus === AiKnowledgeApprovalStatus.PENDING;

  return (
    <div className="mentor-ai-knowledge-page">
      <header className="mentor-ai-knowledge-header">
        <div className="mentor-ai-knowledge-header__status">
          <div className="mentor-ai-knowledge-header__status-dot" />
          <span className="mentor-ai-knowledge-header__status-text">AI KNOWLEDGE ACTIVE</span>
        </div>
        <h1 className="mentor-ai-knowledge-header__title">
          MENTOR <span className="mentor-ai-knowledge-header__title-accent">AI KNOWLEDGE</span>
        </h1>
        <p className="mentor-ai-knowledge-header__subtitle">
          Gửi tài liệu roadmap hoặc grading, theo dõi trạng thái review và quản lý submission của riêng bạn.
        </p>
      </header>

      {error && (
        <div className="mentor-ai-knowledge-alert mentor-ai-knowledge-alert--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="mentor-ai-knowledge-panel">
        <div className="mentor-ai-knowledge-panel__header">
          <div>
            <span className="mentor-ai-knowledge-panel__eyebrow">Gửi tài liệu</span>
            <h2>Submission workspace</h2>
          </div>
          <div className="mentor-ai-knowledge-tab-switcher">
            <button
              type="button"
              className={`mentor-ai-knowledge-tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('roadmap')}
            >
              <Layers3 size={16} />
              Roadmap doc
            </button>
            <button
              type="button"
              className={`mentor-ai-knowledge-tab-btn ${activeTab === 'grading' ? 'active' : ''}`}
              onClick={() => setActiveTab('grading')}
            >
              <BookOpen size={16} />
              Grading doc
            </button>
          </div>
        </div>

        {activeTab === 'roadmap' && (
          <form className="mentor-ai-knowledge-form" onSubmit={(event) => void handleRoadmapSubmit(event)}>
            <div className="mentor-ai-knowledge-form__grid">
              <label className="mentor-ai-knowledge-field mentor-ai-knowledge-field--full">
                <span>Tệp tài liệu</span>
                <input
                  ref={roadmapFileRef}
                  type="file"
                  accept=".pdf,.docx,.md,.txt"
                  required
                  onChange={(event) =>
                    setRoadmapForm((previous) => ({
                      ...previous,
                      file: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Tiêu đề</span>
                <input
                  type="text"
                  required
                  value={roadmapForm.title}
                  onChange={(event) =>
                    setRoadmapForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Skill name</span>
                <input
                  type="text"
                  required
                  value={roadmapForm.skillName}
                  onChange={(event) =>
                    setRoadmapForm((previous) => ({
                      ...previous,
                      skillName: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Industry</span>
                <select
                  value={roadmapForm.industry}
                  onChange={(event) =>
                    setRoadmapForm((previous) => ({
                      ...previous,
                      industry: event.target.value,
                    }))
                  }
                >
                  {AI_KNOWLEDGE_INDUSTRY_OPTIONS.map((option) => (
                    <option key={option.value || 'general'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Level</span>
                <select
                  value={roadmapForm.level}
                  onChange={(event) =>
                    setRoadmapForm((previous) => ({
                      ...previous,
                      level: event.target.value,
                    }))
                  }
                >
                  {AI_KNOWLEDGE_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value || 'general'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mentor-ai-knowledge-field mentor-ai-knowledge-field--full">
                <span>Mô tả</span>
                <textarea
                  rows={4}
                  value={roadmapForm.description}
                  onChange={(event) =>
                    setRoadmapForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="mentor-ai-knowledge-form__actions">
              <button type="submit" className="mentor-ai-knowledge-primary-btn" disabled={submitting === 'roadmap'}>
                <FileText size={16} />
                {submitting === 'roadmap' ? 'Đang gửi...' : 'Gửi roadmap doc'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'grading' && (
          <form className="mentor-ai-knowledge-form" onSubmit={(event) => void handleGradingSubmit(event)}>
            <div className="mentor-ai-knowledge-form__grid">
              <label className="mentor-ai-knowledge-field mentor-ai-knowledge-field--full">
                <span>Tệp tài liệu</span>
                <input
                  ref={gradingFileRef}
                  type="file"
                  accept=".pdf,.docx,.md,.txt"
                  required
                  onChange={(event) =>
                    setGradingForm((previous) => ({
                      ...previous,
                      file: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Tiêu đề</span>
                <input
                  type="text"
                  required
                  value={gradingForm.title}
                  onChange={(event) =>
                    setGradingForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Khóa học</span>
                <select
                  value={gradingForm.courseId}
                  required
                  onChange={(event) =>
                    setGradingForm((previous) => ({
                      ...previous,
                      courseId: event.target.value,
                    }))
                  }
                >
                  <option value="">{coursesLoading ? 'Đang tải khóa học...' : 'Chọn khóa học'}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Module</span>
                <select
                  value={gradingForm.moduleId}
                  onChange={(event) =>
                    setGradingForm((previous) => ({
                      ...previous,
                      moduleId: event.target.value,
                    }))
                  }
                  disabled={!gradingForm.courseId || modulesLoading}
                >
                  <option value="">{modulesLoading ? 'Đang tải module...' : 'Toàn khóa học'}</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mentor-ai-knowledge-field">
                <span>Assignment</span>
                <select
                  value={gradingForm.assignmentId}
                  onChange={(event) =>
                    setGradingForm((previous) => ({
                      ...previous,
                      assignmentId: event.target.value,
                    }))
                  }
                  disabled={!gradingForm.moduleId || assignmentsLoading}
                >
                  <option value="">{assignmentsLoading ? 'Đang tải assignment...' : 'Không chọn assignment cụ thể'}</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mentor-ai-knowledge-field mentor-ai-knowledge-field--full">
                <span>Mô tả</span>
                <textarea
                  rows={4}
                  value={gradingForm.description}
                  onChange={(event) =>
                    setGradingForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="mentor-ai-knowledge-form__actions">
              <button type="submit" className="mentor-ai-knowledge-primary-btn" disabled={submitting === 'grading'}>
                <BookOpen size={16} />
                {submitting === 'grading' ? 'Đang gửi...' : 'Gửi grading doc'}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="mentor-ai-knowledge-grid">
        <section className="mentor-ai-knowledge-panel mentor-ai-knowledge-panel--list">
          <div className="mentor-ai-knowledge-panel__header">
            <div>
              <span className="mentor-ai-knowledge-panel__eyebrow">Submission của tôi</span>
              <h2>Danh sách tài liệu đã gửi</h2>
              <p>{totalElements.toLocaleString('vi-VN')} submission trong hệ thống hiện tại.</p>
            </div>
            <button type="button" className="mentor-ai-knowledge-secondary-btn" onClick={() => void handleRefresh()} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'mentor-ai-knowledge-spinning' : ''} />
              Làm mới
            </button>
          </div>

          <div className="mentor-ai-knowledge-table-wrap">
            <table className="mentor-ai-knowledge-table">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Trạng thái</th>
                  <th>Use Case</th>
                  <th>Cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {listLoading && (
                  <tr>
                    <td colSpan={5} className="mentor-ai-knowledge-empty">Đang tải danh sách submission...</td>
                  </tr>
                )}

                {!listLoading && documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="mentor-ai-knowledge-empty">Bạn chưa có submission AI knowledge nào.</td>
                  </tr>
                )}

                {!listLoading && documents.map((document) => {
                  const isSelected = selectedId === document.id;
                  const statusTone = getStatusTone(document.approvalStatus, document.ingestionStatus);
                  
                  return (
                    <React.Fragment key={document.id}>
                      <tr 
                        className={`mentor-ai-knowledge-row-clickable ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedId(prev => prev === document.id ? null : document.id)}
                      >
                        <td>
                          <strong>{document.title}</strong>
                        </td>
                        <td>
                          <div className="mentor-ai-knowledge-status-row">
                            <span className={`mentor-ai-knowledge-chip mentor-ai-knowledge-chip--${statusTone}`}>
                              {document.approvalStatus}
                            </span>
                            <span className="mentor-ai-knowledge-chip mentor-ai-knowledge-chip--neutral">{document.ingestionStatus}</span>
                          </div>
                        </td>
                        <td>
                          <span className="mentor-ai-knowledge-list-item__sub">{document.useCase}</span>
                        </td>
                        <td>
                          <span className="mentor-ai-knowledge-list-item__sub">{formatDateTime(document.updatedAt)}</span>
                        </td>
                        <td>
                          <button type="button" className="mentor-ai-knowledge-secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            {isSelected ? 'Đóng' : 'Xem chi tiết'}
                          </button>
                        </td>
                      </tr>

                      {isSelected && (
                        <tr className="mentor-ai-knowledge-detail-row">
                          <td colSpan={5}>
                            <div className="mentor-ai-knowledge-accordion-content">
                              {detailLoading && (
                                <div className="mentor-ai-knowledge-detail-loading">
                                  <RefreshCw size={24} className="mentor-ai-knowledge-spinning" />
                                  <span>Đang tải chi tiết...</span>
                                </div>
                              )}

                              {!detailLoading && detail && detail.id === document.id && (
                                <div className="mentor-ai-knowledge-detail">
                                  <div className="mentor-ai-knowledge-detail-grid">
                                    <div className="mentor-ai-knowledge-detail-main">
                                      <div className="mentor-ai-knowledge-detail__headline">
                                        <div>
                                          <h3>{detail.title}</h3>
                                          <p>{detail.description || 'Chưa có mô tả.'}</p>
                                        </div>
                                        <div className="mentor-ai-knowledge-status-stack">
                                          <span className={`mentor-ai-knowledge-chip mentor-ai-knowledge-chip--${getStatusTone(detail.approvalStatus, detail.ingestionStatus)}`}>
                                            {detail.approvalStatus}
                                          </span>
                                          <span
                                            className={`mentor-ai-knowledge-chip ${
                                              detail.ingestionStatus === 'INDEXED'
                                                ? 'mentor-ai-knowledge-chip--indexed-strong'
                                                : detail.ingestionStatus === 'NOT_INGESTED'
                                                  ? 'mentor-ai-knowledge-chip--not-ingested-strong'
                                                  : 'mentor-ai-knowledge-chip--neutral'
                                            }`}
                                          >
                                            {detail.ingestionStatus}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="mentor-ai-knowledge-legend">
                                        <span className="mentor-ai-knowledge-legend-item"><AlertCircle size={15} />PENDING</span>
                                        <span className="mentor-ai-knowledge-legend-item"><CheckCircle2 size={15} />APPROVED</span>
                                        <span className="mentor-ai-knowledge-legend-item"><XCircle size={15} />REJECTED</span>
                                        <span className="mentor-ai-knowledge-legend-item"><FileText size={15} />NOT_INGESTED</span>
                                        <span className="mentor-ai-knowledge-legend-item"><CheckCircle2 size={15} />INDEXED</span>
                                        <span className="mentor-ai-knowledge-legend-item"><ShieldX size={15} />FAILED</span>
                                      </div>

                                      <div className="mentor-ai-knowledge-meta-grid">
                                        <div><strong>Use case</strong><span>{detail.useCase}</span></div>
                                        <div><strong>Doc type</strong><span>{detail.docType || 'Không rõ'}</span></div>
                                        <div><strong>Skill</strong><span>{detail.skillName || detail.skillSlug || '—'}</span></div>
                                        <div><strong>Industry / Level</strong><span>{detail.industry || '—'} / {detail.level || '—'}</span></div>
                                        <div><strong>Course / Module / Assignment</strong><span>{detail.courseId ?? '—'} / {detail.moduleId ?? '—'} / {detail.assignmentId ?? '—'}</span></div>
                                        <div><strong>Tệp</strong><span>{detail.originalFileName || 'Không rõ'}</span></div>
                                        <div><strong>Approved at</strong><span>{formatDateTime(detail.approvedAt)}</span></div>
                                        <div><strong>Indexed at</strong><span>{formatDateTime(detail.indexedAt)}</span></div>
                                        <div><strong>Created at</strong><span>{formatDateTime(detail.createdAt)}</span></div>
                                        <div><strong>Updated at</strong><span>{formatDateTime(detail.updatedAt)}</span></div>
                                      </div>

                                      <div className="mentor-ai-knowledge-detail-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          className="mentor-ai-knowledge-secondary-btn"
                                          onClick={() => void handleRefreshDetail()}
                                          disabled={detailLoading || refreshing}
                                        >
                                          <RefreshCw size={16} className={detailLoading ? 'mentor-ai-knowledge-spinning' : ''} />
                                          Làm mới chi tiết
                                        </button>
                                        
                                        {canDeletePending && (
                                          <button
                                            type="button"
                                            className="mentor-ai-knowledge-danger-btn"
                                            onClick={() => setConfirmDeleteOpen(true)}
                                            disabled={deleting}
                                          >
                                            <Trash2 size={16} />
                                            {deleting ? 'Đang xóa...' : 'Xóa pending submission'}
                                          </button>
                                        )}

                                        {detail.storageUrl && (
                                          <a href={detail.storageUrl} target="_blank" rel="noreferrer" className="mentor-ai-knowledge-secondary-btn">
                                            <SquareArrowOutUpRight size={16} />
                                            Mở file gốc
                                          </a>
                                        )}
                                      </div>

                                      {detail.reviewNote && (
                                        <section className="mentor-ai-knowledge-detail__section">
                                          <h4>Review note</h4>
                                          <p>{detail.reviewNote}</p>
                                        </section>
                                      )}
                                    </div>

                                    <div className="mentor-ai-knowledge-detail-sidebar">
                                      <section className="mentor-ai-knowledge-detail__section">
                                        <h4>Extracted text</h4>
                                        {detail.extractError ? (
                                          <div className="mentor-ai-knowledge-alert mentor-ai-knowledge-alert--warning">
                                            <AlertCircle size={18} />
                                            <span>{detail.extractError}</span>
                                          </div>
                                        ) : (
                                          <pre className="mentor-ai-knowledge-extracted-text">{detail.extractedText || 'Chưa có extracted text.'}</pre>
                                        )}
                                      </section>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mentor-ai-knowledge-pagination">
            <button type="button" onClick={() => setPage((previous) => Math.max(previous - 1, 0))} disabled={page === 0}>
              Trước
            </button>
            <span>
              Trang {totalPages === 0 ? 0 : page + 1}/{Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              onClick={() => setPage((previous) => Math.min(previous + 1, Math.max(totalPages - 1, 0)))}
              disabled={page + 1 >= totalPages}
            >
              Sau
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Xóa pending submission"
        message="Bạn chắc chắn muốn xóa submission này? Chỉ submission ở trạng thái PENDING mới được phép xóa."
        confirmLabel="Xóa submission"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={() => void handleDeletePending()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
          secondaryActionButton={toast.secondaryActionButton}
        />
      )}
    </div>
  );
};

export default MentorAiKnowledgePage;
