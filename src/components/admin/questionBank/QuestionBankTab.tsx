import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ListChecks, Search, Plus, Edit3, Trash2, RefreshCw,
  Upload, X, ChevronLeft, ChevronRight, FileText, Sparkles,
  Check, AlertTriangle, Brain, List, CheckCircle2
} from 'lucide-react';
import {
  createQuestionBank, getQuestionBanks, getQuestionBank, updateQuestionBank, deleteQuestionBank,
  addQuestion, getQuestions, getQuestion, updateQuestion, deleteQuestion, bulkAddQuestions,
  previewImport, confirmImport, generateAiDraft,
} from '../../../services/questionBankService';
import {
  QuestionBankSummary, QuestionBankDetail, CreateQuestionBank, UpdateQuestionBank,
  QuestionResponse, CreateQuestion, UpdateQuestion, ImportPreview,
  AiGenerateDraftRequest, AiDraftQuestion,
} from '../../../data/questionBankDTOs';
import { useToast } from '../../../hooks/useToast';
import CareerForm from '../../journey/CareerForm';
import {
  getAllDomains,
} from '../../../services/expertPromptService';
import { getExpertDomainLabel } from '../../../utils/expertFieldPresentation';
import MeowlKuruLoader from '../../kuru-loader/MeowlKuruLoader';
import '../../../styles/GSJJourney.css';
import './QuestionBankTab.css';

// ============================================================
// Constants
// ============================================================
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

const SOURCE_OPTIONS = ['MANUAL', 'IMPORT', 'AI_GENERATED'] as const;

const DEFAULT_DISTRIBUTION: Record<string, number> = {
  BEGINNER: 0.20,
  INTERMEDIATE: 0.35,
  ADVANCED: 0.30,
  EXPERT: 0.15,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Nâng cao',
  EXPERT: 'Chuyên gia',
};

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Tạo thủ công',
  IMPORT: 'Nhập từ file',
  AI_GENERATED: 'AI tạo nháp',
};

const PAGE_SIZE = 20;

// ============================================================
// Helpers
// ============================================================
const difficultyClass = (d: string): string => {
  switch ((d || '').toUpperCase()) {
    case 'BEGINNER': return 'beginner';
    case 'INTERMEDIATE': return 'intermediate';
    case 'ADVANCED': return 'advanced';
    case 'EXPERT': return 'expert';
    default: return '';
  }
};

const difficultyBadgeClass = (d: string): string => `qb-difficulty-badge ${difficultyClass(d)}`;

const getDifficultyLabel = (d: string): string => DIFFICULTY_LABELS[(d || '').toUpperCase()] || d || 'Chưa rõ';

const getSourceLabel = (s?: string): string => SOURCE_LABELS[(s || '').toUpperCase()] || s?.replace('_', ' ') || 'Tạo thủ công';

const sourceBadgeClass = (s?: string): string => {
  switch ((s || '').toUpperCase()) {
    case 'MANUAL': return 'qb-source-badge manual';
    case 'IMPORT': return 'qb-source-badge import';
    case 'AI_GENERATED': return 'qb-source-badge ai_generated';
    default: return 'qb-source-badge manual';
  }
};

const normalizeDistribution = (distribution?: Record<string, number> | null): Record<string, number> => ({
  ...DEFAULT_DISTRIBUTION,
  ...(distribution || {}),
});

const localizeImportError = (error: string): string => {
  if (!error) return 'Dữ liệu chưa hợp lệ';

  const normalized = error.trim();

  if (normalized === 'Question text is required') return 'Thiếu nội dung câu hỏi';
  if (normalized === 'Question text exceeds 2000 characters') return 'Nội dung câu hỏi vượt quá 2000 ký tự';
  if (normalized === 'Exactly 4 options are required') return 'Cần đúng 4 đáp án';
  if (normalized === 'Correct answer is required') return 'Thiếu đáp án đúng';
  if (normalized === 'Correct answer must be A, B, C, or D') return 'Đáp án đúng chỉ được là A, B, C hoặc D';
  if (normalized === 'Explanation exceeds 1000 characters') return 'Phần giải thích vượt quá 1000 ký tự';

  const optionBlankMatch = normalized.match(/^Option ([A-D]) is blank$/);
  if (optionBlankMatch) {
    return `Đáp án ${optionBlankMatch[1]} đang để trống`;
  }

  const optionLengthMatch = normalized.match(/^Option ([A-D]) exceeds 500 characters$/);
  if (optionLengthMatch) {
    return `Đáp án ${optionLengthMatch[1]} vượt quá 500 ký tự`;
  }

  return normalized;
};

// ============================================================
// Component
// ============================================================
const QuestionBankTab: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  type CreateBankMode = 'MANUAL' | 'IMPORT' | 'AI';

  // ============================================================
  // State
  // ============================================================
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedBank, setSelectedBank] = useState<QuestionBankDetail | null>(null);
  const [banks, setBanks] = useState<QuestionBankSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [expertDomains, setExpertDomains] = useState<string[]>([]);

  // Pagination
  const [bankPage, setBankPage] = useState(0);
  const [bankTotalPages, setBankTotalPages] = useState(0);
  const [bankTotal, setBankTotal] = useState(0);

  // Questions
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotalPages, setQuestionTotalPages] = useState(0);
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('');

  // Modal types
  type ModalType =
    | 'createBank' | 'editBank' | 'deleteBank'
    | 'addQuestion' | 'editQuestion' | 'deleteQuestion'
    | 'import' | 'aiGenerate'
    | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [createBankStep, setCreateBankStep] = useState<'career' | 'config'>('career');
  const [createBankMode, setCreateBankMode] = useState<CreateBankMode>('MANUAL');

  // ============================================================
  // Form State
  // ============================================================
  const [bankForm, setBankForm] = useState<{
    domain: string; industry: string; jobRole: string;
    title: string; description: string;
    distribution: Record<string, number>;
  }>({
    domain: '', industry: '', jobRole: '', title: '', description: '',
    distribution: { ...DEFAULT_DISTRIBUTION },
  });

  const [questionForm, setQuestionForm] = useState<{
    questionText: string; options: string[]; correctAnswer: string;
    explanation: string; difficulty: string; skillArea: string; category: string;
  }>({
    questionText: '', options: ['', '', '', ''], correctAnswer: '',
    explanation: '', difficulty: 'INTERMEDIATE', skillArea: '', category: '',
  });

  // Import state
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // AI Generate state
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiDistribution, setAiDistribution] = useState<Record<string, number>>({ ...DEFAULT_DISTRIBUTION });
  const [aiFocusSkills, setAiFocusSkills] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<AiDraftQuestion[]>([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<number>>(new Set());
  const [editedDraftIds, setEditedDraftIds] = useState<Set<number>>(new Set());

  // ============================================================
  // Load Data
  // ============================================================
  const loadBanks = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      const data = await getQuestionBanks({
        domain: domainFilter || undefined,
        page,
        size: PAGE_SIZE,
      });
      setBanks(data.content);
      setBankTotalPages(data.totalPages);
      setBankTotal(data.totalElements);
      setBankPage(page);
    } catch {
      showError('Lỗi', 'Không thể tải danh sách ngân hàng câu hỏi');
    } finally {
      setLoading(false);
    }
  }, [domainFilter, showError]);

  const loadQuestions = useCallback(async (bankId: number, page = 0) => {
    try {
      setQuestionsLoading(true);
      const data = await getQuestions(bankId, {
        difficulty: questionDifficultyFilter || undefined,
        page,
        size: PAGE_SIZE,
      });
      setQuestions(data.content);
      setQuestionTotalPages(data.totalPages);
      setQuestionPage(page);
    } catch {
      showError('Lỗi', 'Không thể tải danh sách câu hỏi');
    } finally {
      setQuestionsLoading(false);
    }
  }, [questionDifficultyFilter, showError]);

  useEffect(() => {
    loadBanks(0);
  }, [loadBanks]);

  useEffect(() => {
    const loadExpertDomains = async () => {
      try {
        const domains = await getAllDomains();
        setExpertDomains(domains || []);
      } catch {
        setExpertDomains([]);
      }
    };

    loadExpertDomains();
  }, []);

  // Load questions when entering detail view or changing filters
  useEffect(() => {
    if (view === 'detail' && selectedBank) {
      loadQuestions(selectedBank.id, 0);
    }
  }, [view, selectedBank, questionDifficultyFilter, loadQuestions]);

  // ============================================================
  // Computed
  // ============================================================
  const filteredBanks = useMemo(() => {
    if (!searchTerm) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter(b =>
      b.title?.toLowerCase().includes(term) ||
      b.domain?.toLowerCase().includes(term) ||
      b.industry?.toLowerCase().includes(term) ||
      b.jobRole?.toLowerCase().includes(term)
    );
  }, [banks, searchTerm]);

  const stats = useMemo(() => ({
    totalBanks: bankTotal,
    totalQuestions: banks.reduce((sum, b) => sum + b.activeQuestionCount, 0),
    domains: [...new Set(banks.map(b => b.domain))].length,
    activeBanks: banks.filter(b => b.isActive).length,
  }), [banks, bankTotal]);

  const availableDomains = useMemo(() => {
    if (expertDomains.length > 0) {
      return expertDomains;
    }

    return [...new Set(banks.map(bank => bank.domain).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [banks, expertDomains]);

  const selectedDistribution = useMemo(() => {
    if (!selectedBank) return null;
    try {
      return JSON.parse(selectedBank.difficultyDistribution || '{}');
    } catch {
      return null;
    }
  }, [selectedBank]);

  const aiSelectedCount = useMemo(() => selectedDraftIds.size, [selectedDraftIds]);

  const validImportQuestions = useMemo(() =>
    importPreview?.questions.filter(q => q.valid) ?? [],
  [importPreview]);

  const validImportCount = useMemo(() => validImportQuestions.length, [validImportQuestions]);

  const invalidImportCount = useMemo(() =>
    importPreview?.questions.filter(q => !q.valid).length ?? 0,
  [importPreview]);

  // ============================================================
  // Handlers
  // ============================================================
  const openDetail = async (bank: QuestionBankSummary) => {
    try {
      setLoading(true);
      const detail = await getQuestionBank(bank.id);
      setSelectedBank(detail);
      setView('detail');
    } catch {
      showError('Lỗi', 'Không thể tải chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const closeDetail = () => {
    setView('list');
    setSelectedBank(null);
    setQuestions([]);
    setQuestionPage(0);
    setQuestionDifficultyFilter('');
    closeModal();
  };

  const resetBankForm = (forEdit = false) => {
    if (forEdit && selectedBank) {
      let dist: Record<string, number> = { ...DEFAULT_DISTRIBUTION };
      try {
        dist = JSON.parse(selectedBank.difficultyDistribution || '{}');
      } catch { /* use default */ }
      setBankForm({
        domain: selectedBank.domain,
        industry: selectedBank.industry || '',
        jobRole: selectedBank.jobRole || '',
        title: selectedBank.title,
        description: selectedBank.description || '',
        distribution: dist,
      });
    } else {
      setBankForm({
        domain: '', industry: '', jobRole: '', title: '', description: '',
        distribution: { ...DEFAULT_DISTRIBUTION },
      });
    }
  };

  const fillQuestionForm = (question?: QuestionResponse | null) => {
    if (question) {
      const options = Array.from({ length: 4 }, (_, index) => question.options?.[index] || '');
      setQuestionForm({
        questionText: question.questionText,
        options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        difficulty: question.difficulty,
        skillArea: question.skillArea || '',
        category: question.category || '',
      });
    } else {
      setQuestionForm({
        questionText: '', options: ['', '', '', ''], correctAnswer: '',
        explanation: '', difficulty: 'INTERMEDIATE', skillArea: '', category: '',
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedQuestion(null);
    setImportStep(1);
    setImportFile(null);
    setImportPreview(null);
    setAiDrafts([]);
    setSelectedDraftIds(new Set());
    setEditedDraftIds(new Set());
    setCreateBankStep('career');
    setCreateBankMode('MANUAL');
    setAiQuestionCount(10);
    setAiDistribution({ ...DEFAULT_DISTRIBUTION });
    setAiFocusSkills('');
  };

  const openAddQuestionWorkspace = () => {
    setSelectedQuestion(null);
    fillQuestionForm(null);
    setActiveModal('addQuestion');
  };

  const openEditQuestionWorkspace = async (question: QuestionResponse) => {
    if (!selectedBank) return;

    try {
      setFormLoading(true);
      const detail = await getQuestion(selectedBank.id, question.id);
      setSelectedQuestion(detail);
      fillQuestionForm(detail);
      setActiveModal('editQuestion');
    } catch {
      showError('Lỗi', 'Không thể tải đầy đủ thông tin câu hỏi');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteQuestionWorkspace = (question: QuestionResponse) => {
    setSelectedQuestion(question);
    setActiveModal('deleteQuestion');
  };

  const openEditBankWorkspace = () => {
    resetBankForm(true);
    setActiveModal('editBank');
  };

  const openImportWorkspace = () => {
    setImportStep(1);
    setImportFile(null);
    setImportPreview(null);
    setActiveModal('import');
  };

  const openAiWorkspace = () => {
    setImportStep(1);
    setAiQuestionCount(10);
    setAiDistribution(normalizeDistribution(selectedDistribution));
    setAiFocusSkills('');
    setAiDrafts([]);
    setSelectedDraftIds(new Set());
    setEditedDraftIds(new Set());
    setActiveModal('aiGenerate');
  };

  const openCreateBankModal = (mode: CreateBankMode = 'MANUAL') => {
    resetBankForm();
    setCreateBankStep('career');
    setCreateBankMode(mode);
    setActiveModal('createBank');
  };

  const handleCareerSelectionComplete = (data: {
    domain: string;
    industry: string;
    jobRole: string;
    roleKeywords?: string;
  }) => {
    setBankForm(prev => ({
      ...prev,
      domain: data.domain,
      industry: data.industry,
      jobRole: data.jobRole,
      title: prev.title || `Bộ câu hỏi đầu vào ${data.jobRole}`,
      description: prev.description || `Bộ câu hỏi đánh giá đầu vào cho vị trí ${data.jobRole} thuộc ngành ${data.industry}.`,
    }));
    setCreateBankStep('config');
  };

  // Bank CRUD
  const handleCreateBank = async () => {
    if (!bankForm.domain || !bankForm.industry || !bankForm.jobRole || !bankForm.title) {
      showWarning('Cảnh báo', 'Vui lòng chọn đầy đủ lĩnh vực, ngành, vai trò và nhập tên ngân hàng câu hỏi');
      return;
    }
    try {
      setFormLoading(true);
      const total = Object.values(bankForm.distribution).reduce((a, b) => a + b, 0);
      if (Math.abs(total - 1.0) > 0.001) {
        showWarning('Cảnh báo', 'Tổng phân bổ độ khó phải bằng 100%');
        return;
      }
      const data: CreateQuestionBank = {
        domain: bankForm.domain,
        industry: bankForm.industry || undefined,
        jobRole: bankForm.jobRole || undefined,
        title: bankForm.title,
        description: bankForm.description || undefined,
        difficultyDistribution: JSON.stringify(bankForm.distribution),
      };
      const createdBank = await createQuestionBank(data);
      const nextMode = createBankMode;
      showSuccess('Thành công', 'Đã tạo ngân hàng câu hỏi');
      closeModal();

      if (nextMode === 'MANUAL') {
        loadBanks(0);
        return;
      }

      setSelectedBank(createdBank);
      setView('detail');
      setQuestions([]);
      setQuestionPage(0);
      setQuestionDifficultyFilter('');
      setSearchTerm('');
      setImportStep(1);
      setAiQuestionCount(10);
      setAiFocusSkills('');
      if (nextMode === 'AI') {
        try {
          setAiDistribution(normalizeDistribution(JSON.parse(createdBank.difficultyDistribution || '{}')));
        } catch {
          setAiDistribution({ ...DEFAULT_DISTRIBUTION });
        }
      }
      setActiveModal(nextMode === 'IMPORT' ? 'import' : 'aiGenerate');
      loadBanks(0);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể tạo ngân hàng câu hỏi');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateBank = async () => {
    if (!selectedBank || !bankForm.title) {
      showWarning('Cảnh báo', 'Vui lòng nhập tên ngân hàng câu hỏi');
      return;
    }
    try {
      setFormLoading(true);
      const total = Object.values(bankForm.distribution).reduce((a, b) => a + b, 0);
      if (Math.abs(total - 1.0) > 0.001) {
        showWarning('Cảnh báo', 'Tổng phân bổ độ khó phải bằng 100%');
        return;
      }
      const data: UpdateQuestionBank = {
        title: bankForm.title,
        description: bankForm.description || undefined,
        industry: bankForm.industry || undefined,
        jobRole: bankForm.jobRole || undefined,
        difficultyDistribution: JSON.stringify(bankForm.distribution),
      };
      const updated = await updateQuestionBank(selectedBank.id, data);
      setSelectedBank(updated);
      showSuccess('Thành công', 'Đã cập nhật');
      closeModal();
      loadBanks(bankPage);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!selectedBank) return;
    try {
      setFormLoading(true);
      await deleteQuestionBank(selectedBank.id);
      showSuccess('Thành công', 'Đã xóa ngân hàng câu hỏi');
      closeModal();
      closeDetail();
      loadBanks(0);
    } catch {
      showError('Lỗi', 'Không thể xóa');
    } finally {
      setFormLoading(false);
    }
  };

  // Question CRUD
  const handleAddQuestion = async () => {
    if (!selectedBank) return;
    if (!questionForm.questionText || !questionForm.correctAnswer ||
        questionForm.options.filter(o => o.trim()).length < 2) {
      showWarning('Cảnh báo', 'Vui lòng nhập đầy đủ thông tin câu hỏi');
      return;
    }
    try {
      setFormLoading(true);
      const data: CreateQuestion = {
        questionText: questionForm.questionText,
        options: questionForm.options.filter(o => o.trim()),
        correctAnswer: questionForm.correctAnswer,
        explanation: questionForm.explanation || undefined,
        difficulty: questionForm.difficulty,
        skillArea: questionForm.skillArea || undefined,
        category: questionForm.category || undefined,
      };
      await addQuestion(selectedBank.id, data);
      showSuccess('Thành công', 'Đã thêm câu hỏi');
      closeModal();
      fillQuestionForm(null);
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể thêm');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedBank || !selectedQuestion) return;
    if (!questionForm.questionText || !questionForm.correctAnswer) {
      showWarning('Cảnh báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      setFormLoading(true);
      const data: UpdateQuestion = {
        questionText: questionForm.questionText,
        options: questionForm.options.filter(o => o.trim()),
        correctAnswer: questionForm.correctAnswer,
        explanation: questionForm.explanation || undefined,
        difficulty: questionForm.difficulty,
        skillArea: questionForm.skillArea || undefined,
        category: questionForm.category || undefined,
      };
      await updateQuestion(selectedBank.id, selectedQuestion.id, data);
      showSuccess('Thành công', 'Đã cập nhật câu hỏi');
      closeModal();
      setSelectedQuestion(null);
      loadQuestions(selectedBank.id, questionPage);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedBank || !selectedQuestion) return;
    try {
      setFormLoading(true);
      await deleteQuestion(selectedBank.id, selectedQuestion.id);
      showSuccess('Thành công', 'Đã xóa câu hỏi');
      closeModal();
      setSelectedQuestion(null);
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch {
      showError('Lỗi', 'Không thể xóa');
    } finally {
      setFormLoading(false);
    }
  };

  // Import
  const handleImportFile = async (file: File) => {
    if (!selectedBank) return;
    setImportFile(file);
    try {
      setFormLoading(true);
      const preview = await previewImport(selectedBank.id, file);
      setImportPreview(preview);
      setImportStep(2);
    } catch {
      showError('Lỗi', 'Không thể đọc file');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedBank || !importPreview) return;
    const validQuestions = importPreview.questions
      .filter(q => q.valid)
      .map(q => ({
        questionText: q.questionText || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation,
        difficulty: q.difficulty || 'INTERMEDIATE',
        skillArea: q.skillArea,
        category: q.category,
      } as CreateQuestion));

    if (validQuestions.length === 0) {
      showWarning('Cảnh báo', 'Không có câu hỏi hợp lệ để import');
      return;
    }

    try {
      setFormLoading(true);
      const result = await confirmImport(selectedBank.id, validQuestions, 'IMPORT');
      showSuccess('Thành công', `Đã import ${result.savedCount} / ${result.totalRows} câu hỏi`);
      closeModal();
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Nhập file thất bại');
    } finally {
      setFormLoading(false);
    }
  };

  // AI Generate
  const handleGenerateAiDraft = async () => {
    if (!selectedBank) return;

    const total = Object.values(aiDistribution).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 1.0) > 0.001) {
      showWarning('Cảnh báo', 'Tổng phân bổ độ khó phải bằng 100%');
      return;
    }

    try {
      setAiGenerating(true);
      setImportStep(2);
      const request: AiGenerateDraftRequest = {
        questionCount: aiQuestionCount,
        difficultyDistribution: aiDistribution,
        focusSkillAreas: aiFocusSkills ? aiFocusSkills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      };
      const response = await generateAiDraft(selectedBank.id, request);
      setAiDrafts(response.drafts);
      setSelectedDraftIds(new Set(response.drafts.map(d => d.draftId)));
      setImportStep(3);
    } catch (err: any) {
      setImportStep(1);
      showError('Lỗi', err.response?.data?.message || 'Không thể tạo bản nháp');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApproveAiDrafts = async () => {
    if (!selectedBank) return;
    const selected = aiDrafts.filter(d => selectedDraftIds.has(d.draftId));
    if (selected.length === 0) {
      showWarning('Cảnh báo', 'Vui lòng chọn ít nhất 1 câu hỏi để thêm');
      return;
    }
    try {
      setFormLoading(true);
      const questions: CreateQuestion[] = selected.map(d => ({
        questionText: d.questionText || '',
        options: d.options || [],
        correctAnswer: d.correctAnswer || '',
        explanation: d.explanation,
        difficulty: d.difficulty || 'INTERMEDIATE',
        skillArea: d.skillArea,
        category: d.category,
      }));
      const result = await bulkAddQuestions(selectedBank.id, questions, 'AI_GENERATED');
      showSuccess('Thành công', `Đã thêm ${result.savedCount} câu hỏi từ AI`);
      closeModal();
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể lưu');
    } finally {
      setFormLoading(false);
    }
  };

  const updateDraft = (draftId: number, field: keyof AiDraftQuestion, value: any) => {
    setAiDrafts(prev => prev.map(d =>
      d.draftId === draftId ? { ...d, [field]: value, edited: true } : d
    ));
    setEditedDraftIds(prev => new Set(prev).add(draftId));
  };

  const toggleDraftSelection = (draftId: number) => {
    setSelectedDraftIds(prev => {
      const next = new Set(prev);
      if (next.has(draftId)) next.delete(draftId);
      else next.add(draftId);
      return next;
    });
  };

  // ============================================================
  // Render Helpers
  // ============================================================
  const renderDifficultyBar = (distribution: Record<string, number> | null, breakdown: Record<string, number> | null) => {
    if (!distribution && !breakdown) return null;
    const dist = distribution || breakdown || {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    return (
      <div className="qb-progress-bar" title="Phân bổ độ khó">
        {DIFFICULTIES.map(d => {
          const val = dist[d] || 0;
          const pct = (val / total) * 100;
          return pct > 0 ? (
            <span key={d} className={difficultyClass(d)} style={{ width: `${pct}%` }} title={`${getDifficultyLabel(d)}: ${Math.round(pct)}%`} />
          ) : null;
        })}
      </div>
    );
  };

  const renderPagination = (current: number, total: number, onChange: (p: number) => void) => {
    if (total <= 1) return null;
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    if (total <= maxVisible) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push('ellipsis');
      for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
      if (current < total - 3) pages.push('ellipsis');
      pages.push(total - 1);
    }
    return (
      <div className="qb-pagination">
        <button onClick={() => onChange(current - 1)} disabled={current === 0}>
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="page-info">...</span>
          ) : (
            <button key={p} className={p === current ? 'active' : ''} onClick={() => onChange(p)}>
              {p + 1}
            </button>
          )
        )}
        <button onClick={() => onChange(current + 1)} disabled={current >= total - 1}>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const renderDifficultyBadge = (d: string) => (
    <span className={difficultyBadgeClass(d)}>{getDifficultyLabel(d)}</span>
  );

  const renderSourceBadge = (s?: string) => (
    <span className={sourceBadgeClass(s)}>{getSourceLabel(s)}</span>
  );

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="qb-page">
      {/* Header */}
      <div className="qb-header">
        <h2><ListChecks size={28} /> Ngân hàng câu hỏi</h2>
        {view === 'detail' ? null : (
          <div className="qb-header-actions">
            <button className="qb-btn secondary" onClick={() => loadBanks(bankPage)}>
              <RefreshCw size={18} />
            </button>
            <button className="qb-btn secondary" onClick={() => openCreateBankModal('IMPORT')}>
              <Upload size={18} /> Tạo nhanh từ file
            </button>
            <button className="qb-btn primary" onClick={() => openCreateBankModal('AI')}>
              <Brain size={18} /> Tạo nhanh bằng AI
            </button>
            <button className="qb-btn success" onClick={() => openCreateBankModal('MANUAL')}>
              <Plus size={18} /> Tạo ngân hàng câu hỏi
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      {view === 'detail' && (
        <div className="qb-breadcrumb">
          <button onClick={closeDetail}><ListChecks size={16} /> Ngân hàng câu hỏi</button>
          <span>/</span>
          <span className="current">{selectedBank?.title}</span>
        </div>
      )}

      {/* Stats */}
      <div className="qb-stats">
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><List size={22} /></div>
          <div>
            <div className="qb-stat-value">{stats.totalBanks}</div>
            <div className="qb-stat-label">Ngân hàng câu hỏi</div>
          </div>
        </div>
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><FileText size={22} /></div>
          <div>
            <div className="qb-stat-value">{stats.totalQuestions}</div>
            <div className="qb-stat-label">Câu hỏi</div>
          </div>
        </div>
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><Sparkles size={22} /></div>
          <div>
            <div className="qb-stat-value">{stats.domains}</div>
            <div className="qb-stat-label">Lĩnh vực</div>
          </div>
        </div>
        <div className="qb-stat-card">
          <div className="qb-stat-icon"><Check size={22} /></div>
          <div>
            <div className="qb-stat-value">{stats.activeBanks}</div>
            <div className="qb-stat-label">Đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* ===== LIST VIEW ===== */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="qb-filters">
            <div className="qb-search-box">
              <Search size={20} />
              <input
                placeholder="Tìm theo tên, lĩnh vực, ngành hoặc vị trí..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="qb-filter-select"
              value={domainFilter}
              onChange={e => { setDomainFilter(e.target.value); }}
            >
              <option value="">Tất cả lĩnh vực</option>
              {availableDomains.map(d => (
                <option key={d} value={d}>{getExpertDomainLabel(d)}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          {activeModal !== 'createBank' && (
            loading ? (
              <div className="qb-loading-state">
                <MeowlKuruLoader size="small" text="" />
                <p>Đang tải...</p>
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="qb-empty-state">
                <ListChecks size={64} />
                <h3>Chưa có ngân hàng câu hỏi</h3>
                <p>Chọn đúng lĩnh vực, ngành và vị trí như Journey để tạo bài quiz đầu vào khớp vai trò nghề nghiệp.</p>
                <div className="qb-empty-actions">
                  <button className="qb-btn success" onClick={() => openCreateBankModal('MANUAL')}>
                    <Plus size={18} /> Tạo ngân hàng câu hỏi
                  </button>
                  <button className="qb-btn secondary" onClick={() => openCreateBankModal('IMPORT')}>
                    <Upload size={18} /> Tạo nhanh từ file
                  </button>
                  <button className="qb-btn primary" onClick={() => openCreateBankModal('AI')}>
                    <Brain size={18} /> Tạo nhanh bằng AI
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="qb-cards-grid">
                  {filteredBanks.map(bank => {
                    let dist: Record<string, number> = {};
                    if (bank instanceof Object && 'difficultyBreakdown' in bank) {
                      dist = (bank as any).difficultyBreakdown || {};
                    }
                    return (
                      <div key={bank.id} className="qb-card" onClick={() => openDetail(bank)}>
                        <div className="qb-card-header">
                          <div className="qb-card-icon">
                            <ListChecks size={24} />
                          </div>
                          <div className="qb-card-info">
                            <div className="qb-card-title">{bank.title}</div>
                            <div className="qb-card-meta">
                              <span>{getExpertDomainLabel(bank.domain)}</span>
                              {bank.industry && <span>{bank.industry}</span>}
                              {bank.jobRole && <span>{bank.jobRole}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="qb-card-body">
                          <div className="qb-card-stats">
                            <div className="qb-card-stat">
                              <FileText size={14} />
                              <strong>{bank.activeQuestionCount}</strong> câu hỏi
                            </div>
                            <div className="qb-card-stat">
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                background: bank.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                color: bank.isActive ? '#4ade80' : '#f87171',
                                border: `1px solid ${bank.isActive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                              }}>
                                {bank.isActive ? 'Đang dùng' : 'Tạm tắt'}
                              </span>
                            </div>
                          </div>
                          {renderDifficultyBar(null, dist)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {renderPagination(bankPage, bankTotalPages, p => loadBanks(p))}
              </>
            )
          )}
        </>
      )}

      {/* ===== DETAIL VIEW ===== */}
      {view === 'detail' && selectedBank && (
        <>
          {/* Detail Header */}
          <div className="qb-detail-header">
            <div className="qb-detail-info">
              <h2>{selectedBank.title}</h2>
              <p>{selectedBank.description || 'Không có mô tả'}</p>
              <div className="qb-detail-meta">
                <span>{getExpertDomainLabel(selectedBank.domain)}</span>
                {selectedBank.industry && <span>{selectedBank.industry}</span>}
                {selectedBank.jobRole && <span>{selectedBank.jobRole}</span>}
                <span style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: selectedBank.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  color: selectedBank.isActive ? '#4ade80' : '#f87171',
                  border: `1px solid ${selectedBank.isActive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                }}>
                  {selectedBank.isActive ? 'Đang dùng' : 'Tạm tắt'}
                </span>
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="qb-detail-breakdown">
            {DIFFICULTIES.map(d => (
              <div key={d} className={`qb-breakdown-item ${difficultyClass(d)}`}>
                <div className="qb-breakdown-label">{getDifficultyLabel(d)}</div>
                <div className="qb-breakdown-value">{selectedBank.difficultyBreakdown?.[d] || 0}</div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="qb-action-bar">
            <button className="qb-btn success" onClick={openAddQuestionWorkspace}>
              <Plus size={18} /> Thêm Câu hỏi
            </button>
            <button className="qb-btn primary" onClick={openImportWorkspace}>
              <Upload size={18} /> Nhập file
            </button>
            <button className="qb-btn primary" onClick={openAiWorkspace}>
              <Brain size={18} /> Tạo nháp bằng AI
            </button>
            <button className="qb-btn secondary" onClick={openEditBankWorkspace}>
              <Edit3 size={18} /> Sửa ngân hàng
            </button>
            <button className="qb-btn danger" onClick={() => setActiveModal('deleteBank')}>
              <Trash2 size={18} /> Xóa ngân hàng
            </button>
          </div>

          {!activeModal && (
            <>
              <div className="qb-filters" style={{ marginBottom: '1rem' }}>
                <div className="qb-search-box" style={{ flex: 2 }}>
                  <Search size={20} />
                  <input placeholder="Tìm kiếm câu hỏi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="qb-filter-select" value={questionDifficultyFilter}
                  onChange={e => setQuestionDifficultyFilter(e.target.value)}>
                  <option value="">Tất cả độ khó</option>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                </select>
              </div>

              {questionsLoading ? (
                <div className="qb-loading-state">
                  <MeowlKuruLoader size="small" text="" />
                  <p>Đang tải câu hỏi...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="qb-empty-state">
                  <FileText size={64} />
                  <h3>Chưa có câu hỏi</h3>
                  <p>Thêm câu hỏi hoặc nhập từ file</p>
                </div>
              ) : (
                <>
                  <div className="qb-table-wrapper">
                    <table className="qb-table">
                      <thead>
                        <tr>
                          <th className="col-num">#</th>
                          <th>Câu hỏi</th>
                          <th>Độ khó</th>
                          <th>Kỹ năng</th>
                          <th>Nguồn</th>
                          <th className="col-actions">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((q, idx) => {
                          const searchLower = searchTerm.toLowerCase();
                          const matchesSearch = !searchTerm ||
                            q.questionText.toLowerCase().includes(searchLower) ||
                            q.skillArea?.toLowerCase().includes(searchLower);
                          if (!matchesSearch) return null;
                          return (
                            <tr key={q.id}>
                              <td className="col-num">{questionPage * PAGE_SIZE + idx + 1}</td>
                              <td className="col-question">
                                <span className="col-question-text" title={q.questionText}>
                                  {q.questionText}
                                </span>
                              </td>
                              <td>{renderDifficultyBadge(q.difficulty)}</td>
                              <td>{q.skillArea || '-'}</td>
                              <td>{renderSourceBadge(q.source)}</td>
                              <td className="col-actions">
                                <div className="qb-table-actions">
                                  <button onClick={() => openEditQuestionWorkspace(q)}>
                                    <Edit3 size={14} />
                                  </button>
                                  <button onClick={() => openDeleteQuestionWorkspace(q)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(questionPage, questionTotalPages, p => loadQuestions(selectedBank.id, p))}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* INLINE WORKSPACES */}
      {/* ============================================================ */}

      {/* CREATE BANK WORKSPACE */}
      {activeModal === 'createBank' && (
        <div className="qb-inline-workspace">
          <div className="qb-modal extra-large qb-modal--career-flow qb-inline-workspace__card">
            <div className="qb-modal-header">
              <h2>
                <Plus size={22} />
                Tạo ngân hàng câu hỏi
              </h2>
              <button className="qb-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="qb-modal-body">
              {createBankStep === 'career' ? (
                <div className="qb-journey-selector-shell">
                  <CareerForm
                    onComplete={handleCareerSelectionComplete}
                    onBack={closeModal}
                  />
                </div>
              ) : (
                <div className="qb-create-bank-config">
                  <div className="qb-selected-role-card">
                    <div>
                      <h3>Thông tin chuyên môn của bộ quiz</h3>
                      <p>Journey sẽ ưu tiên lấy đúng ngân hàng câu hỏi khớp chính xác lĩnh vực, ngành và vị trí này.</p>
                      <div className="qb-role-tags">
                        <span>{getExpertDomainLabel(bankForm.domain)}</span>
                        <span>{bankForm.industry}</span>
                        <span>{bankForm.jobRole}</span>
                      </div>
                    </div>
                    <button className="qb-btn secondary small" onClick={() => setCreateBankStep('career')}>
                      Chọn lại
                    </button>
                  </div>

                  <div className="qb-form-grid">
                    <div className="qb-form-group">
                      <label>Tên ngân hàng câu hỏi <span className="required">*</span></label>
                      <input className="qb-input" placeholder="VD: Bộ câu hỏi đầu vào cho Backend Developer"
                        value={bankForm.title}
                        onChange={e => setBankForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="qb-form-group">
                      <label>Khởi tạo nhanh</label>
                      <div className="qb-create-mode-grid">
                        <button
                          type="button"
                          className={`qb-create-mode-card ${createBankMode === 'MANUAL' ? 'active' : ''}`}
                          onClick={() => setCreateBankMode('MANUAL')}
                        >
                          <ListChecks size={18} />
                          <strong>Tạo ngân hàng trống</strong>
                          <span>Thêm câu hỏi thủ công sau khi tạo.</span>
                        </button>
                        <button
                          type="button"
                          className={`qb-create-mode-card ${createBankMode === 'IMPORT' ? 'active' : ''}`}
                          onClick={() => setCreateBankMode('IMPORT')}
                        >
                          <Upload size={18} />
                          <strong>Tạo rồi nhập file</strong>
                          <span>Đi tiếp sang khu vực nhập file CSV hoặc JSON ngay sau khi tạo.</span>
                        </button>
                        <button
                          type="button"
                          className={`qb-create-mode-card ${createBankMode === 'AI' ? 'active' : ''}`}
                          onClick={() => setCreateBankMode('AI')}
                        >
                          <Brain size={18} />
                          <strong>Tạo rồi sinh nháp AI</strong>
                          <span>Đi tiếp sang khu vực sinh nháp AI để duyệt và thêm câu hỏi nhanh.</span>
                        </button>
                      </div>
                    </div>
                    <div className="qb-form-group full-width">
                      <label>Mô tả</label>
                      <textarea className="qb-textarea" placeholder="Mô tả ngắn về ngân hàng câu hỏi này..."
                        value={bankForm.description}
                        onChange={e => setBankForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="qb-form-group full-width">
                      <label>Phân bổ độ khó (tổng phải = 100%)</label>
                      <div className="qb-distribution-grid">
                        {DIFFICULTIES.map(d => (
                          <div key={d} className={`qb-distribution-item ${difficultyClass(d)}`}>
                            <label>{getDifficultyLabel(d)}</label>
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              value={bankForm.distribution[d] || 0}
                              onChange={e => setBankForm(p => ({
                                ...p,
                                distribution: { ...p.distribution, [d]: parseFloat(e.target.value) || 0 }
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        Tổng: {Math.round(Object.values(bankForm.distribution).reduce((a, b) => a + b, 0) * 100)}%
                        {Math.abs(Object.values(bankForm.distribution).reduce((a, b) => a + b, 0) - 1.0) > 0.001 && (
                          <span style={{ color: '#f87171', marginLeft: '0.5rem' }}>Phải bằng 100%</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {createBankStep === 'config' && (
              <div className="qb-modal-footer">
                <button className="qb-btn secondary" onClick={() => setCreateBankStep('career')}>Quay lại</button>
                <button className="qb-btn secondary" onClick={closeModal}>Hủy</button>
                <button className="qb-btn success" onClick={handleCreateBank} disabled={formLoading}>
                  {formLoading
                    ? 'Đang xử lý...'
                    : createBankMode === 'IMPORT'
                      ? 'Tạo ngân hàng và nhập file'
                      : createBankMode === 'AI'
                        ? 'Tạo ngân hàng và sinh nháp AI'
                        : 'Tạo ngân hàng câu hỏi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT BANK WORKSPACE */}
      {activeModal === 'editBank' && selectedBank && (
        <div className="qb-inline-workspace">
          <div className="qb-modal large qb-inline-workspace__card">
            <div className="qb-modal-header">
              <h2>
                <Edit3 size={22} />
                Chỉnh sửa ngân hàng câu hỏi
              </h2>
              <button className="qb-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="qb-modal-body">
              <div className="qb-selected-role-card compact">
                <div>
                  <h3>Cấu hình chuyên môn hiện tại</h3>
                  <p>Để tránh lệch flow Journey, lĩnh vực, ngành và vị trí đang được giữ theo ngân hàng hiện có.</p>
                  <div className="qb-role-tags">
                    <span>{getExpertDomainLabel(bankForm.domain)}</span>
                    <span>{bankForm.industry}</span>
                    <span>{bankForm.jobRole}</span>
                  </div>
                </div>
              </div>

              <div className="qb-form-grid">
                <div className="qb-form-group">
                  <label>Tên ngân hàng câu hỏi <span className="required">*</span></label>
                  <input className="qb-input" placeholder="VD: Bộ câu hỏi đầu vào cho Backend Developer"
                    value={bankForm.title}
                    onChange={e => setBankForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="qb-form-group full-width">
                  <label>Mô tả</label>
                  <textarea className="qb-textarea" placeholder="Mô tả ngắn về ngân hàng câu hỏi này..."
                    value={bankForm.description}
                    onChange={e => setBankForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="qb-form-group full-width">
                  <label>Phân bổ độ khó (tổng phải = 100%)</label>
                  <div className="qb-distribution-grid">
                    {DIFFICULTIES.map(d => (
                      <div key={d} className={`qb-distribution-item ${difficultyClass(d)}`}>
                        <label>{getDifficultyLabel(d)}</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={bankForm.distribution[d] || 0}
                          onChange={e => setBankForm(p => ({
                            ...p,
                            distribution: { ...p.distribution, [d]: parseFloat(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Tổng: {Math.round(Object.values(bankForm.distribution).reduce((a, b) => a + b, 0) * 100)}%
                    {Math.abs(Object.values(bankForm.distribution).reduce((a, b) => a + b, 0) - 1.0) > 0.001 && (
                      <span style={{ color: '#f87171', marginLeft: '0.5rem' }}>Phải bằng 100%</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="qb-modal-footer">
              <button className="qb-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="qb-btn success" onClick={handleUpdateBank} disabled={formLoading}>
                {formLoading ? 'Đang xử lý...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE BANK WORKSPACE */}
      {activeModal === 'deleteBank' && selectedBank && (
        <div className="qb-inline-workspace">
          <div className="qb-modal qb-inline-workspace__card">
            <div className="qb-modal-header">
              <h2><Trash2 size={22} /> Xác nhận xóa</h2>
              <button className="qb-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="qb-modal-body">
              <p style={{ color: '#e5e7eb', marginBottom: '1rem' }}>Bạn có chắc muốn xóa ngân hàng câu hỏi này?</p>
              <div className="qb-delete-warning">
                <strong>{selectedBank.title}</strong>
                <p>{getExpertDomainLabel(selectedBank.domain)} — {selectedBank.activeQuestionCount} câu hỏi</p>
              </div>
              <p style={{ color: '#f87171', fontSize: '0.9rem' }}>Thao tác này không thể hoàn tác.</p>
            </div>
            <div className="qb-modal-footer">
              <button className="qb-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="qb-btn danger" onClick={handleDeleteBank} disabled={formLoading}>
                {formLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT QUESTION WORKSPACE */}
      {(activeModal === 'addQuestion' || activeModal === 'editQuestion') && (
        <div className="qb-inline-workspace">
          <div className="qb-modal extra-large qb-inline-workspace__card">
            <div className="qb-modal-header">
              <h2>
                {activeModal === 'addQuestion' ? <Plus size={22} /> : <Edit3 size={22} />}
                {activeModal === 'addQuestion' ? 'Thêm câu hỏi' : 'Chỉnh sửa câu hỏi'}
              </h2>
              <button className="qb-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="qb-modal-body">
              <div className="qb-form-grid">
                <div className="qb-form-group full-width">
                  <label>Câu hỏi <span className="required">*</span></label>
                  <textarea className="qb-textarea" placeholder="Nhập nội dung câu hỏi..."
                    value={questionForm.questionText}
                    onChange={e => setQuestionForm(p => ({ ...p, questionText: e.target.value }))}
                    style={{ minHeight: '100px' }} />
                </div>

                <div className="qb-form-group full-width">
                  <label>4 đáp án <span className="required">*</span></label>
                  <div className="qb-options-grid">
                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                      <div key={letter} className="qb-option-item">
                        <div
                          className={`qb-option-letter ${questionForm.correctAnswer === letter ? 'selected' : ''}`}
                          onClick={() => setQuestionForm(p => ({ ...p, correctAnswer: letter }))}
                          title="Click để chọn làm đáp án đúng"
                        >
                          {letter}
                        </div>
                        <input
                          className="qb-input"
                          placeholder={`Đáp án ${letter}`}
                          value={questionForm.options[idx] || ''}
                          onChange={e => setQuestionForm(p => {
                            const opts = [...p.options];
                            opts[idx] = e.target.value;
                            return { ...p, options: opts };
                          })}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Click chữ cái (A/B/C/D) để chọn đáp án đúng. Đang chọn: <strong style={{ color: '#67e8f9' }}>{questionForm.correctAnswer || 'chưa chọn'}</strong>
                  </div>
                </div>

                <div className="qb-form-group">
                  <label>Độ khó <span className="required">*</span></label>
                  <select className="qb-select" value={questionForm.difficulty}
                    onChange={e => setQuestionForm(p => ({ ...p, difficulty: e.target.value }))}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                  </select>
                </div>

                <div className="qb-form-group">
                  <label>Nguồn</label>
                  <select className="qb-select" value={activeModal === 'addQuestion' ? 'MANUAL' : selectedQuestion?.source || 'MANUAL'}
                    disabled={activeModal === 'editQuestion'}>
                    {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{getSourceLabel(s)}</option>)}
                  </select>
                </div>

                <div className="qb-form-group">
                  <label>Kỹ năng</label>
                  <input className="qb-input" placeholder="VD: JavaScript, Cấu trúc dữ liệu..."
                    value={questionForm.skillArea}
                    onChange={e => setQuestionForm(p => ({ ...p, skillArea: e.target.value }))} />
                </div>

                <div className="qb-form-group">
                  <label>Nhóm câu hỏi</label>
                  <input className="qb-input" placeholder="VD: Frontend, Kiến thức nền tảng..."
                    value={questionForm.category}
                    onChange={e => setQuestionForm(p => ({ ...p, category: e.target.value }))} />
                </div>

                <div className="qb-form-group full-width">
                  <label>Giải thích</label>
                  <textarea className="qb-textarea" placeholder="Giải thích đáp án đúng..."
                    value={questionForm.explanation}
                    onChange={e => setQuestionForm(p => ({ ...p, explanation: e.target.value }))}
                    style={{ minHeight: '80px' }} />
                </div>
              </div>
            </div>
            <div className="qb-modal-footer">
              <button className="qb-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="qb-btn success" onClick={activeModal === 'addQuestion' ? handleAddQuestion : handleUpdateQuestion} disabled={formLoading}>
                {formLoading ? 'Đang xử lý...' : activeModal === 'addQuestion' ? 'Thêm' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE QUESTION WORKSPACE */}
      {activeModal === 'deleteQuestion' && selectedQuestion && (
        <div className="qb-inline-workspace">
          <div className="qb-modal qb-inline-workspace__card">
            <div className="qb-modal-header">
              <h2><Trash2 size={22} /> Xác nhận xóa câu hỏi</h2>
              <button className="qb-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="qb-modal-body">
              <p style={{ color: '#e5e7eb', marginBottom: '1rem' }}>Bạn có chắc muốn xóa câu hỏi này?</p>
              <div className="qb-delete-warning">
                <strong>{selectedQuestion.questionText.substring(0, 100)}{selectedQuestion.questionText.length > 100 ? '...' : ''}</strong>
                <p>{renderDifficultyBadge(selectedQuestion.difficulty)} — {getSourceLabel(selectedQuestion.source)}</p>
              </div>
              <p style={{ color: '#f87171', fontSize: '0.9rem' }}>Thao tác này không thể hoàn tác.</p>
            </div>
            <div className="qb-modal-footer">
              <button className="qb-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="qb-btn danger" onClick={handleDeleteQuestion} disabled={formLoading}>
                {formLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT WORKSPACE */}
      {activeModal === 'import' && selectedBank && (
        <div className="qb-inline-workspace">
          <div className="qb-modal extra-large qb-inline-workspace__card">
            <div className="qb-modal-header">
              <h2><Upload size={22} /> Nhập câu hỏi từ file</h2>
              <button className="qb-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="qb-modal-body">
              {/* Steps */}
              <div className="qb-import-steps">
                {[{ n: 1, label: 'Chọn file' }, { n: 2, label: 'Xem trước' }, { n: 3, label: 'Xác nhận' }].map(step => (
                  <div key={step.n} className={`qb-import-step ${importStep === step.n ? 'active' : ''} ${importStep > step.n ? 'completed' : ''}`}>
                    <div className="qb-import-step-number">
                      {importStep > step.n ? <Check size={16} /> : step.n}
                    </div>
                    <div className="qb-import-step-label">{step.label}</div>
                  </div>
                ))}
              </div>

              {/* Step 1: Upload */}
              {importStep === 1 && (
                <>
                  <div
                    className="qb-upload-zone"
                    onClick={() => importFileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                      const file = e.dataTransfer.files[0];
                      if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
                        handleImportFile(file);
                      } else {
                        showWarning('Cảnh báo', 'Chỉ chấp nhận file CSV hoặc JSON');
                      }
                    }}
                  >
                    <Upload size={48} />
                    <p>Kéo thả file hoặc click để chọn</p>
                    <p>Hỗ trợ: CSV, JSON</p>
                    <p className="hint">File cần có các cột: `questionText`, `options` (mảng), `correctAnswer`, `difficulty`, `explanation`, `skillArea`, `category`.</p>
                  </div>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".csv,.json"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImportFile(file);
                    }}
                  />
                </>
              )}

              {/* Step 2: Preview */}
              {importStep === 2 && importPreview && (
                <>
                  <div className="qb-import-summary">
                    <div className="qb-import-summary-item">
                      <span className="count total">{importPreview.questions.length}</span>
                      <span className="label">Tổng</span>
                    </div>
                    <div className="qb-import-summary-item">
                      <span className="count valid">{validImportCount}</span>
                      <span className="label">Hợp lệ</span>
                    </div>
                    <div className="qb-import-summary-item">
                      <span className="count invalid">{invalidImportCount}</span>
                      <span className="label">Không hợp lệ</span>
                    </div>
                  </div>
                  <div className="qb-preview-table-wrapper" style={{ marginTop: '1rem' }}>
                    <table className="qb-preview-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>Trạng thái</th>
                          <th>#</th>
                          <th>Câu hỏi</th>
                          <th>Đáp án</th>
                          <th>Độ khó</th>
                          <th>Lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.questions.map((q, idx) => (
                          <tr key={idx} className={!q.valid ? 'invalid' : ''}>
                            <td>
                              <div className="qb-preview-status">
                                {q.valid ? (
                                  <CheckCircle2 size={16} className="valid-icon" />
                                ) : (
                                  <AlertTriangle size={16} className="invalid-icon" />
                                )}
                              </div>
                            </td>
                            <td>{idx + 1}</td>
                            <td title={q.questionText}>{q.questionText?.substring(0, 60)}{q.questionText && q.questionText.length > 60 ? '...' : ''}</td>
                            <td>{q.correctAnswer}</td>
                            <td>{getDifficultyLabel(q.difficulty || '')}</td>
                            <td style={{ color: '#f87171', fontSize: '0.8rem' }}>{(q.errors || []).map(localizeImportError).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {importStep === 3 && importPreview && (
                <>
                  <div className="qb-selected-role-card compact">
                    <div>
                      <h3>Sẵn sàng nhập vào ngân hàng hiện tại</h3>
                      <p>
                        {importFile ? `File: ${importFile.name}. ` : ''}
                        Hệ thống sẽ lưu {validImportCount} câu hỏi hợp lệ vào <strong>{selectedBank.title}</strong>.
                      </p>
                      <div className="qb-role-tags">
                        <span>{getExpertDomainLabel(selectedBank.domain)}</span>
                        {selectedBank.industry && <span>{selectedBank.industry}</span>}
                        {selectedBank.jobRole && <span>{selectedBank.jobRole}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="qb-import-summary">
                    <div className="qb-import-summary-item">
                      <span className="count valid">{validImportCount}</span>
                      <span className="label">Sẽ import</span>
                    </div>
                    <div className="qb-import-summary-item">
                      <span className="count invalid">{invalidImportCount}</span>
                      <span className="label">Bị loại</span>
                    </div>
                  </div>

                  <div className="qb-preview-table-wrapper" style={{ marginTop: '1rem' }}>
                    <table className="qb-preview-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Câu hỏi</th>
                          <th>Đáp án đúng</th>
                          <th>Độ khó</th>
                          <th>Kỹ năng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validImportQuestions.map((q, idx) => (
                          <tr key={`${q.questionText}-${idx}`}>
                            <td>{idx + 1}</td>
                            <td title={q.questionText}>{q.questionText?.substring(0, 90)}{q.questionText && q.questionText.length > 90 ? '...' : ''}</td>
                            <td>{q.correctAnswer}</td>
                            <td>{getDifficultyLabel(q.difficulty || '')}</td>
                            <td>{q.skillArea || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="qb-modal-footer">
              <button className="qb-btn secondary" onClick={closeModal}>Hủy</button>
              {importStep > 1 && (
                <button className="qb-btn secondary" onClick={() => setImportStep(s => s - 1)}>
                  Quay lại
                </button>
              )}
              {importStep < 3 && importPreview && (
                <button className="qb-btn primary" onClick={() => setImportStep(3)} disabled={validImportCount === 0}>
                  Tiếp tục <ChevronRight size={16} />
                </button>
              )}
              {importStep === 3 && (
                <button className="qb-btn success" onClick={handleConfirmImport} disabled={formLoading || validImportCount === 0}>
                  {formLoading ? `Đang nhập ${validImportCount}...` : `Nhập ${validImportCount} câu hỏi`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATE WORKSPACE */}
      {activeModal === 'aiGenerate' && selectedBank && (
        <div className="qb-inline-workspace">
          <div className="qb-modal extra-large qb-inline-workspace__card">
            <div className="qb-modal-header">
              <h2><Brain size={22} /> Sinh nháp câu hỏi bằng AI</h2>
              <button className="qb-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="qb-modal-body">
              {/* Steps */}
              <div className="qb-import-steps">
                {[{ n: 1, label: 'Thiết lập' }, { n: 2, label: 'Sinh nháp' }, { n: 3, label: 'Duyệt và thêm' }].map(step => (
                  <div key={step.n} className={`qb-import-step ${importStep === step.n ? 'active' : ''} ${importStep > step.n ? 'completed' : ''}`}>
                    <div className="qb-import-step-number">
                      {importStep > step.n ? <Check size={16} /> : step.n}
                    </div>
                    <div className="qb-import-step-label">{step.label}</div>
                  </div>
                ))}
              </div>

              {/* Step 1: Configure */}
              {importStep === 1 && (
                <>
                  <div className="qb-selected-role-card compact">
                    <div>
                      <h3>AI sẽ dùng cấu hình chuyên gia hiện tại</h3>
                      <p>
                        Hệ thống sẽ tự dùng cấu hình trong tab AI Expert theo đúng lĩnh vực, ngành và vị trí của ngân hàng câu hỏi này.
                        Nếu cần chỉnh prompt hệ thống, hãy cập nhật ở tab AI Expert.
                      </p>
                    </div>
                  </div>

                  <div className="qb-ai-config">
                    <div className="qb-slider-group">
                      <label>Số câu hỏi: <span className="qb-slider-value">{aiQuestionCount}</span></label>
                      <input
                        type="range"
                        min={5}
                        max={50}
                        value={aiQuestionCount}
                        onChange={e => setAiQuestionCount(parseInt(e.target.value))}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                        <span>5</span><span>50</span>
                      </div>
                    </div>

                    <div className="qb-slider-group">
                      <label>Kỹ năng ưu tiên</label>
                      <input
                        className="qb-input"
                        placeholder="VD: React, TypeScript, Node.js. Phân tách bằng dấu phẩy"
                        value={aiFocusSkills}
                        onChange={e => setAiFocusSkills(e.target.value)}
                      />
                    </div>

                    <div className="qb-slider-group full-width">
                      <label>Phân bổ độ khó</label>
                      <div className="qb-distribution-grid">
                        {DIFFICULTIES.map(d => (
                          <div key={d} className={`qb-distribution-item ${difficultyClass(d)}`}>
                            <label>{getDifficultyLabel(d)}</label>
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step={0.05}
                              value={aiDistribution[d] || 0}
                              onChange={e => setAiDistribution(p => ({ ...p, [d]: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(6,182,212,0.08)', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.2)', marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#67e8f9', fontSize: '0.9rem' }}>Gợi ý cho AI</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                      AI sẽ tạo câu hỏi dựa trên <strong style={{ color: '#67e8f9' }}>{selectedBank.title}</strong> ({getExpertDomainLabel(selectedBank.domain)}).
                      {selectedBank.description && ` Mô tả: ${selectedBank.description}`}
                    </p>
                  </div>
                </>
              )}

              {/* Generating Loader */}
              {importStep === 2 && (
                <div className="qb-loading-state" style={{ minHeight: '300px' }}>
                  <MeowlKuruLoader size="large" text="Đang sinh bản nháp bằng AI..." />
                  <p style={{ color: '#67e8f9', marginTop: '1rem' }}>Vui lòng chờ trong giây lát</p>
                </div>
              )}

              {/* Step 3: Review */}
              {importStep === 3 && aiDrafts.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="qb-import-summary">
                      <div className="qb-import-summary-item">
                        <span className="count total">{aiDrafts.length}</span>
                        <span className="label">Tổng bản nháp</span>
                      </div>
                      <div className="qb-import-summary-item">
                        <span className="count valid">{aiSelectedCount}</span>
                        <span className="label">Đã chọn</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="qb-btn secondary small" onClick={() => setSelectedDraftIds(new Set(aiDrafts.map(d => d.draftId)))}>
                        Chọn tất cả
                      </button>
                      <button className="qb-btn secondary small" onClick={() => setSelectedDraftIds(new Set())}>
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  </div>
                  <div className="qb-draft-grid">
                    {aiDrafts.map(draft => (
                      <div key={draft.draftId} className={`qb-draft-card ${editedDraftIds.has(draft.draftId) ? 'edited' : ''}`}>
                        <div className="qb-draft-header">
                          <span className="qb-draft-num">Bản nháp #{draft.draftId}</span>
                          {editedDraftIds.has(draft.draftId) && (
                            <span style={{ fontSize: '0.7rem', color: '#c084fc' }}>Đã chỉnh sửa</span>
                          )}
                          <label className="qb-draft-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedDraftIds.has(draft.draftId)}
                              onChange={() => toggleDraftSelection(draft.draftId)}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chọn</span>
                          </label>
                        </div>
                        <div className="qb-draft-body">
                          <div className="qb-draft-field" style={{ gridColumn: 'span 2' }}>
                            <label>Câu hỏi <span style={{ color: '#f87171' }}>*</span></label>
                            <textarea
                              value={draft.questionText || ''}
                              onChange={e => updateDraft(draft.draftId, 'questionText', e.target.value)}
                              placeholder="Nội dung câu hỏi..."
                            />
                          </div>
                          <div className="qb-draft-field" style={{ gridColumn: 'span 2' }}>
                            <label>4 đáp án</label>
                            <div className="qb-draft-options">
                              {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                <div key={letter} className="qb-draft-option">
                                  <div className="qb-draft-option-letter">{letter}</div>
                                  <input
                                    value={draft.options?.[idx] || ''}
                                    onChange={e => {
                                      const opts = [...(draft.options || ['', '', '', ''])];
                                      opts[idx] = e.target.value;
                                      updateDraft(draft.draftId, 'options', opts);
                                    }}
                                    placeholder={`Đáp án ${letter}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="qb-draft-field">
                            <label>Đáp án đúng</label>
                            <select
                              value={draft.correctAnswer || ''}
                              onChange={e => updateDraft(draft.draftId, 'correctAnswer', e.target.value)}
                            >
                              <option value="">-- Chọn --</option>
                              {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                          <div className="qb-draft-field">
                            <label>Độ khó</label>
                            <select
                              value={draft.difficulty || 'INTERMEDIATE'}
                              onChange={e => updateDraft(draft.draftId, 'difficulty', e.target.value)}
                            >
                              {DIFFICULTIES.map(d => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                            </select>
                          </div>
                          <div className="qb-draft-field">
                            <label>Kỹ năng</label>
                            <input
                              value={draft.skillArea || ''}
                              onChange={e => updateDraft(draft.draftId, 'skillArea', e.target.value)}
                              placeholder="VD: JavaScript, Phân tích dữ liệu"
                            />
                          </div>
                          <div className="qb-draft-field">
                            <label>Nhóm câu hỏi</label>
                            <input
                              value={draft.category || ''}
                              onChange={e => updateDraft(draft.draftId, 'category', e.target.value)}
                              placeholder="VD: Frontend, Tình huống thực tế"
                            />
                          </div>
                          <div className="qb-draft-field" style={{ gridColumn: 'span 2' }}>
                            <label>Giải thích</label>
                            <textarea
                              value={draft.explanation || ''}
                              onChange={e => updateDraft(draft.draftId, 'explanation', e.target.value)}
                              placeholder="Giải thích đáp án đúng..."
                              style={{ minHeight: '50px' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {importStep === 3 && aiDrafts.length === 0 && (
                <div className="qb-empty-state">
                  <Brain size={64} />
                  <h3>Không có bản nháp nào</h3>
                  <p>AI không tạo được bản nháp nào. Thử lại với cài đặt khác.</p>
                </div>
              )}
            </div>
            <div className="qb-modal-footer">
              <button className="qb-btn secondary" onClick={closeModal}>Hủy</button>
              {importStep > 1 && (
                <button className="qb-btn secondary" onClick={() => { if (importStep === 3) { setImportStep(1); setAiDrafts([]); } else setImportStep(s => s - 1); }}>
                  Quay lại
                </button>
              )}
              {importStep === 1 && (
                <button className="qb-btn primary" onClick={handleGenerateAiDraft} disabled={aiGenerating}>
                  {aiGenerating ? 'Đang xử lý...' : <><Sparkles size={16} /> Tạo bản nháp</>}
                </button>
              )}
              {importStep === 3 && (
                <button className="qb-btn success" onClick={handleApproveAiDrafts} disabled={formLoading || aiSelectedCount === 0}>
                  {formLoading ? `Đang thêm ${aiSelectedCount}...` : `Thêm ${aiSelectedCount} câu hỏi`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankTab;
