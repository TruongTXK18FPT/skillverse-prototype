import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  ListChecks,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Check,
  AlertTriangle,
  Brain,
  List,
  CheckCircle2,
} from "lucide-react";
import {
  createQuestionBank,
  getQuestionBanks,
  getQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  addQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  bulkAddQuestions,
  previewImport,
  confirmImport,
  generateAiDraft,
  syncJobPositionBanks,
} from "../../../services/questionBankService";
import {
  QuestionBankSummary,
  QuestionBankDetail,
  CreateQuestionBank,
  UpdateQuestionBank,
  QuestionResponse,
  CreateQuestion,
  UpdateQuestion,
  ImportPreview,
  AiGenerateDraftRequest,
  AiDraftQuestion,
} from "../../../data/questionBankDTOs";
import { useToast } from "../../../hooks/useToast";
import { careerTaxonomyService } from "../../../services/careerTaxonomyService";
import { skillService } from "../../../services/skillService";
import { Domain, JobPosition, JobPositionTrackSkill } from "../../../types/careerTaxonomy";
import { SkillDto } from "../../../data/skillDTOs";
import MeowlKuruLoader from "../../kuru-loader/MeowlKuruLoader";
import QuestionBankSubmissionReviewPanel from "./QuestionBankSubmissionReviewPanel";
import "../../../styles/GSJJourney.css";
import "./QuestionBankTab.css";

// ============================================================
// Constants
// ============================================================
const DIFFICULTIES = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
] as const;

const SOURCE_OPTIONS = ["MANUAL", "IMPORT", "AI_GENERATED"] as const;

const DEFAULT_DISTRIBUTION: Record<string, number> = {
  BEGINNER: 0.2,
  INTERMEDIATE: 0.35,
  ADVANCED: 0.3,
  EXPERT: 0.15,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Nâng cao",
  EXPERT: "Chuyên gia",
};

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Tạo thủ công",
  IMPORT: "Nhập từ file",
  AI_GENERATED: "AI tạo nháp",
};

const PAGE_SIZE = 20;

// ============================================================
// Helpers
// ============================================================
const difficultyClass = (d: string): string => {
  switch ((d || "").toUpperCase()) {
    case "BEGINNER":
      return "beginner";
    case "INTERMEDIATE":
      return "intermediate";
    case "ADVANCED":
      return "advanced";
    case "EXPERT":
      return "expert";
    default:
      return "";
  }
};

const difficultyBadgeClass = (d: string): string =>
  `qb-difficulty-badge ${difficultyClass(d)}`;

const getDifficultyLabel = (d: string): string =>
  DIFFICULTY_LABELS[(d || "").toUpperCase()] || d || "Chưa rõ";

const getSourceLabel = (s?: string): string =>
  SOURCE_LABELS[(s || "").toUpperCase()] ||
  s?.replace("_", " ") ||
  "Tạo thủ công";

const sourceBadgeClass = (s?: string): string => {
  switch ((s || "").toUpperCase()) {
    case "MANUAL":
      return "qb-source-badge manual";
    case "IMPORT":
      return "qb-source-badge import";
    case "AI_GENERATED":
      return "qb-source-badge ai_generated";
    default:
      return "qb-source-badge manual";
  }
};

const normalizeDistribution = (
  distribution?: Record<string, number> | null,
): Record<string, number> => ({
  ...DEFAULT_DISTRIBUTION,
  ...(distribution || {}),
});

const localizeImportError = (error: string): string => {
  if (!error) return "Dữ liệu chưa hợp lệ";

  const normalized = error.trim();

  if (normalized === "Question text is required")
    return "Thiếu nội dung câu hỏi";
  if (normalized === "Question text exceeds 2000 characters")
    return "Nội dung câu hỏi vượt quá 2000 ký tự";
  if (normalized === "Exactly 4 options are required")
    return "Cần đúng 4 đáp án";
  if (normalized === "Correct answer is required") return "Thiếu đáp án đúng";
  if (normalized === "Correct answer must be A, B, C, or D")
    return "Đáp án đúng chỉ được là A, B, C hoặc D";
  if (normalized === "Explanation exceeds 1000 characters")
    return "Phần giải thích vượt quá 1000 ký tự";

  const optionBlankMatch = normalized.match(/^Option ([A-D]) is blank$/);
  if (optionBlankMatch) {
    return `Đáp án ${optionBlankMatch[1]} đang để trống`;
  }

  const optionLengthMatch = normalized.match(
    /^Option ([A-D]) exceeds 500 characters$/,
  );
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
  type CreateBankMode = "MANUAL" | "IMPORT" | "AI";
  type AdminSection = "library" | "mentorReview";

  // ============================================================
  // State
  // ============================================================
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedBank, setSelectedBank] = useState<QuestionBankDetail | null>(
    null,
  );
  const [banks, setBanks] = useState<QuestionBankSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [domainFilter, setDomainFilter] = useState<number | "">("");
  const [jobPositionFilter, setJobPositionFilter] = useState<number | "">("");
  const [skillFilter, setSkillFilter] = useState<number | "">("");
  const [taxonomyDomains, setTaxonomyDomains] = useState<Domain[]>([]);
  const [taxonomyJobPositions, setTaxonomyJobPositions] = useState<JobPosition[]>([]);
  const [activeSkills, setActiveSkills] = useState<SkillDto[]>([]);

  // Pagination
  const [bankPage, setBankPage] = useState(0);
  const [bankTotalPages, setBankTotalPages] = useState(0);
  const [bankTotal, setBankTotal] = useState(0);

  // Questions
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotalPages, setQuestionTotalPages] = useState(0);
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState("");
  const [selectedSkillContext, setSelectedSkillContext] = useState<string>("");

  // Modal types
  type ModalType =
    | "createBank"
    | "editBank"
    | "deleteBank"
    | "addQuestion"
    | "editQuestion"
    | "deleteQuestion"
    | "import"
    | "aiGenerate"
    | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionResponse | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [createBankStep, setCreateBankStep] = useState<
    "skillResolve" | "config"
  >("skillResolve");
  const [createBankMode, setCreateBankMode] =
    useState<CreateBankMode>("MANUAL");
  const [adminSkillInput, setAdminSkillInput] = useState("");

  // ============================================================
  // Form State
  // ============================================================
  const [bankForm, setBankForm] = useState<{
    domainId: number | "";
    jobPositionId: number | "";
    skillId: number | "";
    domain: string;
    title: string;
    description: string;
    distribution: Record<string, number>;
  }>({
    domainId: "",
    jobPositionId: "",
    skillId: "",
    domain: "",
    title: "",
    description: "",
    distribution: { ...DEFAULT_DISTRIBUTION },
  });

  const [questionForm, setQuestionForm] = useState<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    skillArea: string;
    category: string;
  }>({
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    difficulty: "INTERMEDIATE",
    skillArea: "",
    category: "",
  });

  // Import state
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // AI Generate state
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiDistribution, setAiDistribution] = useState<Record<string, number>>({
    ...DEFAULT_DISTRIBUTION,
  });
  const [aiFocusSkills, setAiFocusSkills] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<AiDraftQuestion[]>([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<number>>(
    new Set(),
  );
  const [editedDraftIds, setEditedDraftIds] = useState<Set<number>>(new Set());
  const [adminSection, setAdminSection] = useState<AdminSection>("library");

  // ============================================================
  // Load Data
  // ============================================================
  const loadBanks = useCallback(
    async (page = 0) => {
      try {
        setLoading(true);
        const data = await getQuestionBanks({
          domainId: domainFilter || undefined,
          jobPositionId: jobPositionFilter || undefined,
          skillId: skillFilter || undefined,
          page,
          size: PAGE_SIZE,
        });
        setBanks(data.content);
        setBankTotalPages(data.totalPages);
        setBankTotal(data.totalElements);
        setBankPage(page);
      } catch {
        showError("Lỗi", "Không thể tải danh sách ngân hàng câu hỏi");
      } finally {
        setLoading(false);
      }
    },
    [domainFilter, jobPositionFilter, skillFilter, showError],
  );

  const loadQuestions = useCallback(
    async (bankId: number, page = 0) => {
      try {
        setQuestionsLoading(true);
        const data = await getQuestions(bankId, {
          difficulty: questionDifficultyFilter || undefined,
          skillArea: selectedSkillContext || undefined,
          page,
          size: PAGE_SIZE,
        });
        setQuestions(data.content);
        setQuestionTotalPages(data.totalPages);
        setQuestionPage(page);
      } catch {
        showError("Lỗi", "Không thể tải danh sách câu hỏi");
      } finally {
        setQuestionsLoading(false);
      }
    },
    [questionDifficultyFilter, selectedSkillContext, showError],
  );

  useEffect(() => {
    loadBanks(0);
  }, [loadBanks]);

  useEffect(() => {
    const loadTaxonomyOptions = async () => {
      try {
        const [domains, jobPositions, skills] = await Promise.all([
          careerTaxonomyService.getDomains(),
          careerTaxonomyService.getJobPositions(),
          skillService.getActiveSkills(),
        ]);
        setTaxonomyDomains(domains || []);
        setTaxonomyJobPositions(jobPositions || []);
        setActiveSkills(skills || []);
      } catch {
        setTaxonomyDomains([]);
        setTaxonomyJobPositions([]);
        setActiveSkills([]);
      }
    };

    loadTaxonomyOptions();
  }, []);

  // Load questions when entering detail view or changing filters
  useEffect(() => {
    if (view === "detail" && selectedBank) {
      loadQuestions(selectedBank.id, 0);
    }
  }, [view, selectedBank, questionDifficultyFilter, selectedSkillContext, loadQuestions]);

  // ============================================================
  // Computed
  // ============================================================
  const filteredBanks = useMemo(() => {
    if (!searchTerm) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter(
      (b) =>
        b.title?.toLowerCase().includes(term) ||
        b.domain?.toLowerCase().includes(term) ||
        b.domainName?.toLowerCase().includes(term) ||
        b.jobPositionName?.toLowerCase().includes(term) ||
        b.skillName?.toLowerCase().includes(term),
    );
  }, [banks, searchTerm]);

  const stats = useMemo(
    () => ({
      totalBanks: bankTotal,
      totalQuestions: banks.reduce((sum, b) => sum + b.activeQuestionCount, 0),
      domains: [...new Set(banks.map((b) => b.domainId || b.domain))].length,
      activeBanks: banks.filter((b) => b.isActive).length,
    }),
    [banks, bankTotal],
  );

  const filteredFilterJobPositions = useMemo(
    () =>
      taxonomyJobPositions.filter(
        (position) => !domainFilter || position.domainId === domainFilter,
      ),
    [taxonomyJobPositions, domainFilter],
  );

  const filteredFormJobPositions = useMemo(
    () =>
      taxonomyJobPositions.filter(
        (position) => !bankForm.domainId || position.domainId === bankForm.domainId,
      ),
    [taxonomyJobPositions, bankForm.domainId],
  );

  const getBankDomainLabel = (bank?: Pick<QuestionBankSummary, "domain" | "domainName"> | null): string =>
    bank?.domainName || (bank?.domain ? getExpertDomainLabel(bank.domain) : "Chưa chọn");

  const getBankJobPositionLabel = (
    bank?: Pick<QuestionBankSummary, "jobPositionName"> | null,
  ): string => bank?.jobPositionName || "Chưa chọn";

  const selectedFormDomain = useMemo(
    () => taxonomyDomains.find((domain) => domain.id === bankForm.domainId),
    [taxonomyDomains, bankForm.domainId],
  );

  const selectedFormJobPosition = useMemo(
    () => taxonomyJobPositions.find((position) => position.id === bankForm.jobPositionId),
    [taxonomyJobPositions, bankForm.jobPositionId],
  );

  const selectedFormSkill = useMemo(
    () => activeSkills.find((skill) => skill.id === bankForm.skillId),
    [activeSkills, bankForm.skillId],
  );

  const selectedDistribution = useMemo(() => {
    if (!selectedBank) return null;
    try {
      return JSON.parse(selectedBank.difficultyDistribution || "{}");
    } catch {
      return null;
    }
  }, [selectedBank]);

  const aiSelectedCount = useMemo(
    () => selectedDraftIds.size,
    [selectedDraftIds],
  );

  const validImportQuestions = useMemo(
    () => importPreview?.questions.filter((q) => q.valid) ?? [],
    [importPreview],
  );

  const validImportCount = useMemo(
    () => validImportQuestions.length,
    [validImportQuestions],
  );

  const invalidImportCount = useMemo(
    () => importPreview?.questions.filter((q) => !q.valid).length ?? 0,
    [importPreview],
  );

  const [jobPositionSkills, setJobPositionSkills] = useState<JobPositionTrackSkill[]>([]);

  // ============================================================
  // Handlers
  // ============================================================
  const openDetail = async (bank: QuestionBankSummary) => {
    try {
      setLoading(true);
      const detail = await getQuestionBank(bank.id);
      setSelectedBank(detail);
      setView("detail");
      setQuestionPage(0);
      
      // Load skills for this job position
      if (detail.jobPositionId) {
         const tracks = await careerTaxonomyService.getActiveTracks(detail.jobPositionId);
         const skillsPromises = tracks.map(t => careerTaxonomyService.getTrackSkills(t.id));
         const skillsArrays = await Promise.all(skillsPromises);
         const allSkills = skillsArrays.flat();
         // remove duplicates
         const uniqueSkills = Array.from(new Map(allSkills.map(s => [s.skillId, s])).values());
         setJobPositionSkills(uniqueSkills);
      } else {
         setJobPositionSkills([]);
      }
    } catch {
      showError("Lỗi", "Không thể tải chi tiết");
    } finally {
      setLoading(false);
    }
  };

  const closeDetail = () => {
    setView("list");
    setSelectedBank(null);
    setQuestions([]);
    setQuestionPage(0);
    setQuestionDifficultyFilter("");
    closeModal();
  };

  const resetBankForm = (forEdit = false) => {
    if (forEdit && selectedBank) {
      let dist: Record<string, number> = { ...DEFAULT_DISTRIBUTION };
      try {
        dist = JSON.parse(selectedBank.difficultyDistribution || "{}");
      } catch {
        /* use default */
      }
      setBankForm({
        domainId: selectedBank.domainId || "",
        jobPositionId: selectedBank.jobPositionId || "",
        skillId: selectedBank.skillId || "",
        domain: selectedBank.domain,
        title: selectedBank.title,
        description: selectedBank.description || "",
        distribution: dist,
      });
    } else {
      setBankForm({
        domainId: "",
        jobPositionId: "",
        skillId: "",
        domain: "",
        title: "",
        description: "",
        distribution: { ...DEFAULT_DISTRIBUTION },
      });
    }
  };

  const fillQuestionForm = (question?: QuestionResponse | null) => {
    if (question) {
      const options = Array.from(
        { length: 4 },
        (_, index) => question.options?.[index] || "",
      );
      setQuestionForm({
        questionText: question.questionText,
        options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || "",
        difficulty: question.difficulty,
        skillArea: question.skillArea || "",
        category: question.category || "",
      });
    } else {
      setQuestionForm({
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        difficulty: "INTERMEDIATE",
        skillArea: "",
        category: "",
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
    setCreateBankStep("config");
    setCreateBankMode("MANUAL");
    setAiQuestionCount(10);
    setAiDistribution({ ...DEFAULT_DISTRIBUTION });
    setAiFocusSkills("");
    setAdminSkillInput("");
  };

  const openAddQuestionWorkspace = (prefilledSkill?: string) => {
    setSelectedQuestion(null);
    fillQuestionForm(null);
    if (prefilledSkill) {
      setQuestionForm((p) => ({ ...p, skillArea: prefilledSkill }));
    } else if (selectedSkillContext) {
      setQuestionForm((p) => ({ ...p, skillArea: selectedSkillContext }));
    }
    setActiveModal("addQuestion");
  };

  const openEditQuestionWorkspace = async (question: QuestionResponse) => {
    if (!selectedBank) return;

    try {
      setFormLoading(true);
      const detail = await getQuestion(selectedBank.id, question.id);
      setSelectedQuestion(detail);
      fillQuestionForm(detail);
      setActiveModal("editQuestion");
    } catch {
      showError("Lỗi", "Không thể tải đầy đủ thông tin câu hỏi");
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteQuestionWorkspace = (question: QuestionResponse) => {
    setSelectedQuestion(question);
    setActiveModal("deleteQuestion");
  };

  const openEditBankWorkspace = () => {
    resetBankForm(true);
    setActiveModal("editBank");
  };

  const openImportWorkspace = () => {
    setImportStep(1);
    setImportFile(null);
    setImportPreview(null);
    setActiveModal("import");
  };

  const openAiWorkspace = () => {
    setImportStep(1);
    setAiQuestionCount(10);
    setAiDistribution(normalizeDistribution(selectedDistribution));
    setAiFocusSkills(selectedSkillContext || "");
    setAiDrafts([]);
    setSelectedDraftIds(new Set());
    setEditedDraftIds(new Set());
    setActiveModal("aiGenerate");
  };

  const openCreateBankModal = (mode: CreateBankMode = "MANUAL") => {
    resetBankForm();
    setCreateBankStep("skillResolve");
    setCreateBankMode(mode);
    setActiveModal("createBank");
  };

  // Bank CRUD
  const handleCreateBank = async () => {
    if (!bankForm.title) {
      showWarning("Cảnh báo", "Vui lòng nhập tên ngân hàng câu hỏi");
      return;
    }
    if (!bankForm.domainId || !bankForm.jobPositionId) {
      showWarning("Cảnh báo", "Vui lòng chọn domain và job position");
      return;
    }
    try {
      setFormLoading(true);
      const total = Object.values(bankForm.distribution).reduce(
        (a, b) => a + b,
        0,
      );
      if (Math.abs(total - 1.0) > 0.001) {
        showWarning("Cảnh báo", "Tổng phân bổ độ khó phải bằng 100%");
        return;
      }
      const data: CreateQuestionBank = {
        domainId: bankForm.domainId,
        jobPositionId: bankForm.jobPositionId,
        skillId: bankForm.skillId || null,
        domain: selectedFormDomain?.code || bankForm.domain || undefined,
        skillName: selectedFormSkill?.name || undefined,
        title: bankForm.title,
        description: bankForm.description || undefined,
        difficultyDistribution: JSON.stringify(bankForm.distribution),
      };
      const createdBank = await createQuestionBank(data);
      const nextMode = createBankMode;
      showSuccess("Thành công", "Đã tạo ngân hàng câu hỏi");
      closeModal();

      if (nextMode === "MANUAL") {
        loadBanks(0);
        return;
      }

      setSelectedBank(createdBank);
      setView("detail");
      setQuestions([]);
      setQuestionPage(0);
      setQuestionDifficultyFilter("");
      setSearchTerm("");
      setImportStep(1);
      setAiQuestionCount(10);
      setAiFocusSkills("");
      if (nextMode === "AI") {
        try {
          setAiDistribution(
            normalizeDistribution(
              JSON.parse(createdBank.difficultyDistribution || "{}"),
            ),
          );
        } catch {
          setAiDistribution({ ...DEFAULT_DISTRIBUTION });
        }
      }
      setActiveModal(nextMode === "IMPORT" ? "import" : "aiGenerate");
      loadBanks(0);
    } catch (err: any) {
      showError(
        "Lỗi",
        err.response?.data?.message || "Không thể tạo ngân hàng câu hỏi",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateBank = async () => {
    if (!selectedBank || !bankForm.title) {
      showWarning("Cảnh báo", "Vui lòng nhập tên ngân hàng câu hỏi");
      return;
    }
    try {
      setFormLoading(true);
      const total = Object.values(bankForm.distribution).reduce(
        (a, b) => a + b,
        0,
      );
      if (Math.abs(total - 1.0) > 0.001) {
        showWarning("Cảnh báo", "Tổng phân bổ độ khó phải bằng 100%");
        return;
      }
      const data: UpdateQuestionBank = {
        title: bankForm.title,
        description: bankForm.description || undefined,
        domainId: bankForm.domainId || undefined,
        jobPositionId: bankForm.jobPositionId || undefined,
        skillId: bankForm.skillId || null,
        skillName: selectedFormSkill?.name || undefined,
        difficultyDistribution: JSON.stringify(bankForm.distribution),
      };
      const updated = await updateQuestionBank(selectedBank.id, data);
      setSelectedBank(updated);
      showSuccess("Thành công", "Đã cập nhật");
      closeModal();
      loadBanks(bankPage);
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể cập nhật");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!selectedBank) return;
    try {
      setFormLoading(true);
      await deleteQuestionBank(selectedBank.id);
      showSuccess("Thành công", "Đã xóa ngân hàng câu hỏi");
      closeModal();
      closeDetail();
      loadBanks(0);
    } catch {
      showError("Lỗi", "Không thể xóa");
    } finally {
      setFormLoading(false);
    }
  };

  // Question CRUD
  const handleAddQuestion = async () => {
    if (!selectedBank) return;
    if (
      !questionForm.questionText ||
      !questionForm.correctAnswer ||
      questionForm.options.filter((o) => o.trim()).length < 2
    ) {
      showWarning("Cảnh báo", "Vui lòng nhập đầy đủ thông tin câu hỏi");
      return;
    }
    try {
      setFormLoading(true);
      const data: CreateQuestion = {
        questionText: questionForm.questionText,
        options: questionForm.options.filter((o) => o.trim()),
        correctAnswer: questionForm.correctAnswer,
        explanation: questionForm.explanation || undefined,
        difficulty: questionForm.difficulty,
        skillArea: questionForm.skillArea || undefined,
        category: questionForm.category || undefined,
      };
      await addQuestion(selectedBank.id, data);
      showSuccess("Thành công", "Đã thêm câu hỏi");
      closeModal();
      fillQuestionForm(null);
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể thêm");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedBank || !selectedQuestion) return;
    if (!questionForm.questionText || !questionForm.correctAnswer) {
      showWarning("Cảnh báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      setFormLoading(true);
      const data: UpdateQuestion = {
        questionText: questionForm.questionText,
        options: questionForm.options.filter((o) => o.trim()),
        correctAnswer: questionForm.correctAnswer,
        explanation: questionForm.explanation || undefined,
        difficulty: questionForm.difficulty,
        skillArea: questionForm.skillArea || undefined,
        category: questionForm.category || undefined,
      };
      await updateQuestion(selectedBank.id, selectedQuestion.id, data);
      showSuccess("Thành công", "Đã cập nhật câu hỏi");
      closeModal();
      setSelectedQuestion(null);
      loadQuestions(selectedBank.id, questionPage);
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể cập nhật");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedBank || !selectedQuestion) return;
    try {
      setFormLoading(true);
      await deleteQuestion(selectedBank.id, selectedQuestion.id);
      showSuccess("Thành công", "Đã xóa câu hỏi");
      closeModal();
      setSelectedQuestion(null);
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch {
      showError("Lỗi", "Không thể xóa");
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
      showError("Lỗi", "Không thể đọc file");
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedBank || !importPreview) return;
    const validQuestions = importPreview.questions
      .filter((q) => q.valid)
      .map(
        (q) =>
          ({
            questionText: q.questionText || "",
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
            explanation: q.explanation,
            difficulty: q.difficulty || "INTERMEDIATE",
            skillArea: selectedSkillContext || q.skillArea,
            category: q.category,
          }) as CreateQuestion,
      );

    if (validQuestions.length === 0) {
      showWarning("Cảnh báo", "Không có câu hỏi hợp lệ để import");
      return;
    }

    try {
      setFormLoading(true);
      const result = await confirmImport(
        selectedBank.id,
        validQuestions,
        "IMPORT",
      );
      showSuccess(
        "Thành công",
        `Đã import ${result.savedCount} / ${result.totalRows} câu hỏi`,
      );
      closeModal();
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Nhập file thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  // AI Generate
  const handleGenerateAiDraft = async () => {
    if (!selectedBank) return;

    const total = Object.values(aiDistribution).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (Math.abs(total - 1.0) > 0.001) {
      showWarning("Cảnh báo", "Tổng phân bổ độ khó phải bằng 100%");
      return;
    }

    try {
      setAiGenerating(true);
      setImportStep(2);
      const request: AiGenerateDraftRequest = {
        questionCount: aiQuestionCount,
        difficultyDistribution: aiDistribution,
        focusSkillAreas: aiFocusSkills
          ? aiFocusSkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
          : undefined,
      };
      const response = await generateAiDraft(selectedBank.id, request);
      setAiDrafts(response.drafts);
      setSelectedDraftIds(new Set(response.drafts.map((d) => d.draftId)));
      setImportStep(3);
    } catch (err: any) {
      setImportStep(1);
      showError("Lỗi", err.response?.data?.message || "Không thể tạo bản nháp");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApproveAiDrafts = async () => {
    if (!selectedBank) return;
    const selected = aiDrafts.filter((d) => selectedDraftIds.has(d.draftId));
    if (selected.length === 0) {
      showWarning("Cảnh báo", "Vui lòng chọn ít nhất 1 câu hỏi để thêm");
      return;
    }
    try {
      setFormLoading(true);
      const questions: CreateQuestion[] = selected.map((d) => ({
        questionText: d.questionText || "",
        options: d.options || [],
        correctAnswer: d.correctAnswer || "",
        explanation: d.explanation,
        difficulty: d.difficulty || "INTERMEDIATE",
        skillArea: d.skillArea,
        category: d.category,
      }));
      const result = await bulkAddQuestions(
        selectedBank.id,
        questions,
        "AI_GENERATED",
      );
      showSuccess("Thành công", `Đã thêm ${result.savedCount} câu hỏi từ AI`);
      closeModal();
      loadQuestions(selectedBank.id, questionPage);
      loadBanks(bankPage);
    } catch (err: any) {
      showError("Lỗi", err.response?.data?.message || "Không thể lưu");
    } finally {
      setFormLoading(false);
    }
  };

  const updateDraft = (
    draftId: number,
    field: keyof AiDraftQuestion,
    value: any,
  ) => {
    setAiDrafts((prev) =>
      prev.map((d) =>
        d.draftId === draftId ? { ...d, [field]: value, edited: true } : d,
      ),
    );
    setEditedDraftIds((prev) => new Set(prev).add(draftId));
  };

  const toggleDraftSelection = (draftId: number) => {
    setSelectedDraftIds((prev) => {
      const next = new Set(prev);
      if (next.has(draftId)) next.delete(draftId);
      else next.add(draftId);
      return next;
    });
  };

  // ============================================================
  // Render Helpers
  // ============================================================
  const renderDifficultyBar = (
    distribution: Record<string, number> | null,
    breakdown: Record<string, number> | null,
  ) => {
    if (!distribution && !breakdown) return null;
    const dist = distribution || breakdown || {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    return (
      <div className="qb-progress-bar" title="Phân bổ độ khó">
        {DIFFICULTIES.map((d) => {
          const val = dist[d] || 0;
          const pct = (val / total) * 100;
          return pct > 0 ? (
            <span
              key={d}
              className={difficultyClass(d)}
              style={{ width: `${pct}%` }}
              title={`${getDifficultyLabel(d)}: ${Math.round(pct)}%`}
            />
          ) : null;
        })}
      </div>
    );
  };

  const renderPagination = (
    current: number,
    total: number,
    onChange: (p: number) => void,
  ) => {
    if (total <= 1) return null;
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;
    if (total <= maxVisible) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push("ellipsis");
      for (
        let i = Math.max(1, current - 1);
        i <= Math.min(total - 2, current + 1);
        i++
      )
        pages.push(i);
      if (current < total - 3) pages.push("ellipsis");
      pages.push(total - 1);
    }
    return (
      <div className="qb-pagination">
        <button onClick={() => onChange(current - 1)} disabled={current === 0}>
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="page-info">
              ...
            </span>
          ) : (
            <button
              key={p}
              className={p === current ? "active" : ""}
              onClick={() => onChange(p)}
            >
              {p + 1}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current >= total - 1}
        >
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

  const handleSyncBanks = async () => {
    try {
      setLoading(true);
      await syncJobPositionBanks();
      showSuccess("Thành công", "Đã đồng bộ ngân hàng câu hỏi cho Job Position");
      loadBanks(0);
    } catch (err: any) {
      showError("Lỗi", "Không thể đồng bộ ngân hàng câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="qb-page">
      {/* Header */}
      <div className="qb-header">
        <h2>
          <ListChecks size={28} /> Ngân hàng câu hỏi
        </h2>
        {adminSection === "library" &&
          view === "detail" ? null : adminSection === "library" ? (
            <div className="qb-header-actions">
              <button
                className="qb-btn secondary"
                onClick={handleSyncBanks}
                disabled={loading}
                title="Đồng bộ ngân hàng cho các Job Position chưa có"
              >
                <RefreshCw size={18} /> Đồng bộ Job Position
              </button>
              <button
                className="qb-btn secondary"
                onClick={() => loadBanks(bankPage)}
              >
                <RefreshCw size={18} />
              </button>
              <button
                className="qb-btn secondary"
                onClick={() => openCreateBankModal("IMPORT")}
              >
                <Upload size={18} /> Tạo nhanh từ file
              </button>
              <button
                className="qb-btn primary"
                onClick={() => openCreateBankModal("AI")}
              >
                <Brain size={18} /> Tạo nhanh bằng AI
              </button>
              <button
                className="qb-btn success"
                onClick={() => openCreateBankModal("MANUAL")}
              >
                <Plus size={18} /> Tạo ngân hàng câu hỏi
              </button>
            </div>
          ) : null}
      </div>

      <div className="qb-topTabs">
        <button
          type="button"
          className={`qb-topTab ${adminSection === "library" ? "active" : ""}`}
          onClick={() => setAdminSection("library")}
        >
          Ngân hàng hiện có
        </button>
        <button
          type="button"
          className={`qb-topTab ${adminSection === "mentorReview" ? "active" : ""}`}
          onClick={() => setAdminSection("mentorReview")}
        >
          Đóng góp từ mentor
        </button>
      </div>

      {adminSection === "mentorReview" ? (
        <QuestionBankSubmissionReviewPanel />
      ) : (
        <>
          {/* Breadcrumb */}
          {view === "detail" && (
            <div className="qb-breadcrumb">
              <button onClick={closeDetail}>
                <ListChecks size={16} /> Ngân hàng câu hỏi
              </button>
              <span>/</span>
              <span className="current">{selectedBank?.title}</span>
            </div>
          )}

          {/* Stats */}
          <div className="qb-stats">
            <div className="qb-stat-card">
              <div className="qb-stat-icon">
                <List size={22} />
              </div>
              <div>
                <div className="qb-stat-value">{stats.totalBanks}</div>
                <div className="qb-stat-label">Ngân hàng câu hỏi</div>
              </div>
            </div>
            <div className="qb-stat-card">
              <div className="qb-stat-icon">
                <FileText size={22} />
              </div>
              <div>
                <div className="qb-stat-value">{stats.totalQuestions}</div>
                <div className="qb-stat-label">Câu hỏi</div>
              </div>
            </div>
            <div className="qb-stat-card">
              <div className="qb-stat-icon">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="qb-stat-value">{stats.domains}</div>
                <div className="qb-stat-label">Lĩnh vực</div>
              </div>
            </div>
            <div className="qb-stat-card">
              <div className="qb-stat-icon">
                <Check size={22} />
              </div>
              <div>
                <div className="qb-stat-value">{stats.activeBanks}</div>
                <div className="qb-stat-label">Đang hoạt động</div>
              </div>
            </div>
          </div>

          {/* ===== LIST VIEW ===== */}
          {view === "list" && (
            <>
              {/* Filters */}
              <div className="qb-filters">
                <div className="qb-search-box">
                  <Search size={20} />
                  <input
                    placeholder="Tìm theo tên, lĩnh vực, ngành hoặc vị trí..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="qb-filter-select"
                  value={domainFilter}
                  onChange={(e) => {
                    setDomainFilter(e.target.value ? Number(e.target.value) : "");
                    setJobPositionFilter("");
                  }}
                >
                  <option value="">Tất cả lĩnh vực</option>
                  {taxonomyDomains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name || getExpertDomainLabel(domain.code)}
                    </option>
                  ))}
                </select>
                <select
                  className="qb-filter-select"
                  value={jobPositionFilter}
                  onChange={(e) => setJobPositionFilter(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Tất cả job position</option>
                  {filteredFilterJobPositions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
                <select
                  className="qb-filter-select"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Tất cả skill</option>
                  {activeSkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              {activeModal !== "createBank" &&
                (loading ? (
                  <div className="qb-loading-state">
                    <MeowlKuruLoader size="small" text="" />
                    <p>Đang tải...</p>
                  </div>
                ) : filteredBanks.length === 0 ? (
                  <div className="qb-empty-state">
                    <ListChecks size={64} />
                    <h3>Chưa có ngân hàng câu hỏi</h3>
                    <p>
                      Nhập tên kỹ năng — AI sẽ tự động tạo ngân hàng câu hỏi với
                      đủ 4 mức độ khó cho kỹ năng đó.
                    </p>
                    <div className="qb-empty-actions">
                      <button
                        className="qb-btn success"
                        onClick={() => openCreateBankModal("MANUAL")}
                      >
                        <Plus size={18} /> Tạo ngân hàng câu hỏi
                      </button>
                      <button
                        className="qb-btn secondary"
                        onClick={() => openCreateBankModal("IMPORT")}
                      >
                        <Upload size={18} /> Tạo nhanh từ file
                      </button>
                      <button
                        className="qb-btn primary"
                        onClick={() => openCreateBankModal("AI")}
                      >
                        <Brain size={18} /> Tạo nhanh bằng AI
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="qb-cards-grid">
                      {filteredBanks.map((bank) => {
                        let dist: Record<string, number> = {};
                        if (
                          bank instanceof Object &&
                          "difficultyBreakdown" in bank
                        ) {
                          dist = (bank as any).difficultyBreakdown || {};
                        }
                        return (
                          <div
                            key={bank.id}
                            className="qb-card"
                            onClick={() => openDetail(bank)}
                          >
                            <div className="qb-card-header">
                              <div className="qb-card-icon">
                                <ListChecks size={24} />
                              </div>
                              <div className="qb-card-info">
                                <div className="qb-card-title">
                                  {bank.title}
                                </div>
                                <div className="qb-card-meta">
                                  <span>
                                    {getBankDomainLabel(bank)}
                                  </span>
                                  <span>{getBankJobPositionLabel(bank)}</span>
                                  {bank.skillName && (
                                    <span>{bank.skillName}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="qb-card-body">
                              <div className="qb-card-stats">
                                <div className="qb-card-stat">
                                  <FileText size={14} />
                                  <strong>
                                    {bank.activeQuestionCount}
                                  </strong>{" "}
                                  câu hỏi
                                </div>
                                <div className="qb-card-stat">
                                  <span
                                    style={{
                                      padding: "0.2rem 0.5rem",
                                      borderRadius: "4px",
                                      fontSize: "0.7rem",
                                      fontWeight: 600,
                                      background: bank.isActive
                                        ? "rgba(34,197,94,0.2)"
                                        : "rgba(239,68,68,0.2)",
                                      color: bank.isActive
                                        ? "#4ade80"
                                        : "#f87171",
                                      border: `1px solid ${bank.isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                                    }}
                                  >
                                    {bank.isActive ? "Đang dùng" : "Tạm tắt"}
                                  </span>
                                </div>
                              </div>
                              {renderDifficultyBar(null, dist)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {renderPagination(bankPage, bankTotalPages, (p) =>
                      loadBanks(p),
                    )}
                  </>
                ))}
            </>
          )}

          {/* ===== DETAIL VIEW ===== */}
          {view === "detail" && selectedBank && (
            <>
              {/* Detail Header */}
              <div className="qb-detail-header">
                <div className="qb-detail-info">
                  <h2>{selectedBank.title}</h2>
                  <p>{selectedBank.description || "Không có mô tả"}</p>
                  <div className="qb-detail-meta">
                    <span>{getBankDomainLabel(selectedBank)}</span>
                    <span>{getBankJobPositionLabel(selectedBank)}</span>
                    {selectedBank.skillName && (
                      <span>{selectedBank.skillName}</span>
                    )}
                    <span
                      style={{
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: selectedBank.isActive
                          ? "rgba(34,197,94,0.2)"
                          : "rgba(239,68,68,0.2)",
                        color: selectedBank.isActive ? "#4ade80" : "#f87171",
                        border: `1px solid ${selectedBank.isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                      }}
                    >
                      {selectedBank.isActive ? "Đang dùng" : "Tạm tắt"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="qb-detail-breakdown">
                {DIFFICULTIES.map((d) => (
                  <div
                    key={d}
                    className={`qb-breakdown-item ${difficultyClass(d)}`}
                  >
                    <div className="qb-breakdown-label">
                      {getDifficultyLabel(d)}
                    </div>
                    <div className="qb-breakdown-value">
                      {selectedBank.difficultyBreakdown?.[d] || 0}
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills Panel */}
              {jobPositionSkills.length > 0 && (
                <div className="qb-skills-panel">
                  <div className="qb-skills-panel-header">
                    <h4>
                      <Sparkles size={16} /> Kỹ năng thuộc Job Position
                    </h4>
                    <span className="qb-skills-panel-count">
                      {jobPositionSkills.length} kỹ năng
                    </span>
                  </div>
                  <p className="qb-skills-panel-desc">
                    Click vào một kỹ năng để xem câu hỏi theo skill đó và thêm câu hỏi đúng phân loại.
                    {selectedSkillContext && (
                      <button
                        className="qb-skills-panel-clear"
                        onClick={() => setSelectedSkillContext("")}
                      >
                        ✕ Bỏ lọc
                      </button>
                    )}
                  </p>
                  <div className="qb-skills-panel-chips">
                    {jobPositionSkills.map((s) => {
                      const count = selectedBank?.skillBreakdown?.[s.skillName || ""] || 0;
                      const isActive = selectedSkillContext.toLowerCase() === s.skillName?.toLowerCase();
                      return (
                        <button
                          key={s.skillId}
                          type="button"
                          className={`qb-skill-chip-item ${isActive ? "active" : ""}`}
                          onClick={() => setSelectedSkillContext(isActive ? "" : s.skillName || "")}
                        >
                          <span className="qb-skill-chip-name">{s.skillName}</span>
                          <span className="qb-skill-chip-count">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedSkillContext && (
                    <div className="qb-skills-panel-actions">
                      <button
                        className="qb-btn success small"
                        onClick={() => openAddQuestionWorkspace(selectedSkillContext)}
                      >
                        <Plus size={16} /> Nhập tay
                      </button>
                      <button
                        className="qb-btn primary small"
                        onClick={openImportWorkspace}
                      >
                        <Upload size={16} /> Nhập file
                      </button>
                      <button 
                        className="qb-btn primary small" 
                        onClick={openAiWorkspace}
                      >
                        <Brain size={16} /> Tạo bằng AI
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Global Action Bar (only visible when no skill is selected) */}
              {!selectedSkillContext && (
                <div className="qb-action-bar">
                  <button
                    className="qb-btn secondary"
                    onClick={openEditBankWorkspace}
                  >
                    <Edit3 size={18} /> Sửa ngân hàng
                  </button>
                  <button
                    className="qb-btn danger"
                    onClick={() => setActiveModal("deleteBank")}
                  >
                    <Trash2 size={18} /> Xóa ngân hàng
                  </button>
                </div>
              )}

              {!activeModal && (
                <>
                  <div className="qb-filters" style={{ marginBottom: "1rem" }}>
                    <div className="qb-search-box" style={{ flex: 2 }}>
                      <Search size={20} />
                      <input
                        placeholder="Tìm kiếm câu hỏi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="qb-filter-select"
                      value={questionDifficultyFilter}
                      onChange={(e) =>
                        setQuestionDifficultyFilter(e.target.value)
                      }
                    >
                      <option value="">Tất cả độ khó</option>
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {getDifficultyLabel(d)}
                        </option>
                      ))}
                    </select>
                    {jobPositionSkills.length > 0 && (
                      <select
                        className="qb-filter-select"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      >
                        <option value="">Tất cả kỹ năng</option>
                        {jobPositionSkills.map((s) => (
                          <option key={s.skillId} value={s.skillName}>
                            {s.skillName}
                          </option>
                        ))}
                      </select>
                    )}
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
                              const matchesSearch =
                                !searchTerm ||
                                q.questionText
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                q.skillArea
                                  ?.toLowerCase()
                                  .includes(searchLower);
                              
                              // We no longer need matchesSkillContext because backend filters it.
                              if (!matchesSearch) return null;
                              return (
                                <tr key={q.id}>
                                  <td className="col-num">
                                    {questionPage * PAGE_SIZE + idx + 1}
                                  </td>
                                  <td className="col-question">
                                    <span
                                      className="col-question-text"
                                      title={q.questionText}
                                    >
                                      {q.questionText}
                                    </span>
                                  </td>
                                  <td>{renderDifficultyBadge(q.difficulty)}</td>
                                  <td>{q.skillArea || "-"}</td>
                                  <td>{renderSourceBadge(q.source)}</td>
                                  <td className="col-actions">
                                    <div className="qb-table-actions">
                                      <button
                                        onClick={() =>
                                          openEditQuestionWorkspace(q)
                                        }
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          openDeleteQuestionWorkspace(q)
                                        }
                                      >
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
                      {renderPagination(questionPage, questionTotalPages, (p) =>
                        loadQuestions(selectedBank.id, p),
                      )}
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
          {activeModal === "createBank" && (
            <div className="qb-inline-workspace">
              <div className="qb-modal extra-large qb-modal--career-flow qb-inline-workspace__card">
                <div className="qb-modal-header">
                  <h2>
                    <Plus size={22} />
                    Tạo ngân hàng câu hỏi
                  </h2>
                  <button className="qb-close-btn" onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className="qb-modal-body">
                  {/* Step indicator */}
                  <div className="qb-wizard-steps">
                    <div className={`qb-wizard-step ${createBankStep === "skillResolve" ? "active" : "completed"}`}>
                      <div className="qb-wizard-step-num">
                        {createBankStep !== "skillResolve" ? <Check size={16} /> : "1"}
                      </div>
                      <span className="qb-wizard-step-label">Chọn lộ trình</span>
                    </div>
                    <div className="qb-wizard-step-line" />
                    <div className={`qb-wizard-step ${createBankStep === "config" ? "active" : ""}`}>
                      <div className="qb-wizard-step-num">2</div>
                      <span className="qb-wizard-step-label">Cấu hình Bank</span>
                    </div>
                  </div>

                  {createBankStep === "skillResolve" ? (
                    <div className="qb-taxonomy-wizard">
                      {/* Domain selection */}
                      <div className="qb-wizard-section">
                        <h4 className="qb-wizard-section-title">
                          <Sparkles size={18} /> Bước 1 — Chọn Domain
                        </h4>
                        <p className="qb-wizard-section-desc">
                          Chọn lĩnh vực chuyên môn cho ngân hàng câu hỏi.
                        </p>
                        <div className="qb-wizard-card-grid">
                          {taxonomyDomains.map((domain) => (
                            <button
                              key={domain.id}
                              type="button"
                              className={`qb-wizard-card ${bankForm.domainId === domain.id ? "active" : ""}`}
                              onClick={() => {
                                setBankForm((p) => ({
                                  ...p,
                                  domainId: domain.id,
                                  jobPositionId: "",
                                  skillId: "",
                                  domain: domain.code || "",
                                }));
                              }}
                            >
                              <div className="qb-wizard-card-icon">
                                <ListChecks size={20} />
                              </div>
                              <strong>{domain.name || domain.code}</strong>
                              {domain.description && (
                                <span>{domain.description.substring(0, 60)}{domain.description.length > 60 ? "..." : ""}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Job Position selection */}
                      {bankForm.domainId && (
                        <div className="qb-wizard-section" style={{ marginTop: "2rem" }}>
                          <h4 className="qb-wizard-section-title">
                            <Sparkles size={18} /> Bước 2 — Chọn Job Position
                          </h4>
                          <p className="qb-wizard-section-desc">
                            Chọn vị trí công việc cụ thể trong lĩnh vực{" "}
                            <strong>{selectedFormDomain?.name}</strong>.
                          </p>
                          {filteredFormJobPositions.length === 0 ? (
                            <div className="qb-wizard-empty">
                              <AlertTriangle size={20} />
                              <span>Chưa có Job Position nào trong domain này. Vui lòng tạo trong Career Taxonomy trước.</span>
                            </div>
                          ) : (
                            <div className="qb-wizard-card-grid">
                              {filteredFormJobPositions.map((position) => (
                                <button
                                  key={position.id}
                                  type="button"
                                  className={`qb-wizard-card ${bankForm.jobPositionId === position.id ? "active" : ""}`}
                                  onClick={() => {
                                    setBankForm((p) => ({
                                      ...p,
                                      jobPositionId: position.id,
                                      title: `Ngân hàng câu hỏi — ${position.name}`,
                                      description: `Bộ câu hỏi đánh giá cho vị trí ${position.name} thuộc ${selectedFormDomain?.name || ""}.`,
                                    }));
                                  }}
                                >
                                  <div className="qb-wizard-card-icon">
                                    <CheckCircle2 size={20} />
                                  </div>
                                  <strong>{position.name}</strong>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Proceed to config */}
                      {bankForm.domainId && bankForm.jobPositionId && (
                        <div className="qb-wizard-proceed" style={{ marginTop: "2rem" }}>
                          <div className="qb-wizard-summary">
                            <h4>Tóm tắt lộ trình đã chọn</h4>
                            <div className="qb-role-tags">
                              <span>{selectedFormDomain?.name || bankForm.domain}</span>
                              <span>{selectedFormJobPosition?.name || "Job Position"}</span>
                            </div>
                          </div>
                          <button
                            className="qb-btn primary"
                            onClick={() => setCreateBankStep("config")}
                          >
                            Tiếp tục cấu hình <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="qb-create-bank-config">
                      <div className="qb-selected-role-card">
                        <div>
                          <h3>Lộ trình đã chọn</h3>
                          <p>
                            Ngân hàng câu hỏi sẽ được gắn với lộ trình này. Câu
                            hỏi sẽ phân bổ theo 4 mức độ khó bên dưới.
                          </p>
                          <div className="qb-role-tags">
                            {selectedFormDomain && (
                              <span>{selectedFormDomain.name}</span>
                            )}
                            {selectedFormJobPosition && (
                              <span>{selectedFormJobPosition.name}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="qb-btn secondary small"
                          onClick={() => setCreateBankStep("skillResolve")}
                        >
                          Đổi lộ trình
                        </button>
                      </div>

                      <div className="qb-form-grid">
                        <div className="qb-form-group">
                          <label>
                            Skill (tuỳ chọn)
                          </label>
                          <select
                            className="qb-input"
                            value={bankForm.skillId}
                            onChange={(e) => setBankForm((p) => ({ ...p, skillId: e.target.value ? Number(e.target.value) : "" }))}
                          >
                            <option value="">Role-level bank (tất cả skills)</option>
                            {activeSkills.map((skill) => (
                              <option key={skill.id} value={skill.id}>
                                {skill.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="qb-form-group">
                          <label>
                            Tên ngân hàng câu hỏi{" "}
                            <span className="required">*</span>
                          </label>
                          <input
                            className="qb-input"
                            placeholder="VD: Bộ câu hỏi đầu vào cho Backend Developer"
                            value={bankForm.title}
                            onChange={(e) =>
                              setBankForm((p) => ({
                                ...p,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="qb-form-group">
                          <label>Khởi tạo nhanh</label>
                          <div className="qb-create-mode-grid">
                            <button
                              type="button"
                              className={`qb-create-mode-card ${createBankMode === "MANUAL" ? "active" : ""}`}
                              onClick={() => setCreateBankMode("MANUAL")}
                            >
                              <ListChecks size={18} />
                              <strong>Tạo ngân hàng trống</strong>
                              <span>Thêm câu hỏi thủ công sau khi tạo.</span>
                            </button>
                            <button
                              type="button"
                              className={`qb-create-mode-card ${createBankMode === "IMPORT" ? "active" : ""}`}
                              onClick={() => setCreateBankMode("IMPORT")}
                            >
                              <Upload size={18} />
                              <strong>Tạo rồi nhập file</strong>
                              <span>
                                Đi tiếp sang khu vực nhập file CSV hoặc JSON
                                ngay sau khi tạo.
                              </span>
                            </button>
                            <button
                              type="button"
                              className={`qb-create-mode-card ${createBankMode === "AI" ? "active" : ""}`}
                              onClick={() => setCreateBankMode("AI")}
                            >
                              <Brain size={18} />
                              <strong>Tạo rồi sinh nháp AI</strong>
                              <span>
                                Đi tiếp sang khu vực sinh nháp AI để duyệt và
                                thêm câu hỏi nhanh.
                              </span>
                            </button>
                          </div>
                        </div>
                        <div className="qb-form-group full-width">
                          <label>Mô tả</label>
                          <textarea
                            className="qb-textarea"
                            placeholder="Mô tả ngắn về ngân hàng câu hỏi này..."
                            value={bankForm.description}
                            onChange={(e) =>
                              setBankForm((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="qb-form-group full-width">
                          <label>Phân bổ độ khó (tổng phải = 100%)</label>
                          <div className="qb-distribution-grid">
                            {DIFFICULTIES.map((d) => (
                              <div
                                key={d}
                                className={`qb-distribution-item ${difficultyClass(d)}`}
                              >
                                <label>{getDifficultyLabel(d)}</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={bankForm.distribution[d] || 0}
                                  onChange={(e) =>
                                    setBankForm((p) => ({
                                      ...p,
                                      distribution: {
                                        ...p.distribution,
                                        [d]: parseFloat(e.target.value) || 0,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          <div
                            style={{
                              textAlign: "right",
                              marginTop: "0.5rem",
                              fontSize: "0.8rem",
                              color: "#64748b",
                            }}
                          >
                            Tổng:{" "}
                            {Math.round(
                              Object.values(bankForm.distribution).reduce(
                                (a, b) => a + b,
                                0,
                              ) * 100,
                            )}
                            %
                            {Math.abs(
                              Object.values(bankForm.distribution).reduce(
                                (a, b) => a + b,
                                0,
                              ) - 1.0,
                            ) > 0.001 && (
                                <span
                                  style={{
                                    color: "#f87171",
                                    marginLeft: "0.5rem",
                                  }}
                                >
                                  Phải bằng 100%
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {createBankStep === "config" && (
                  <div className="qb-modal-footer">
                    <button
                      className="qb-btn secondary"
                      onClick={() => setCreateBankStep("skillResolve")}
                    >
                      Quay lại
                    </button>
                    <button className="qb-btn secondary" onClick={closeModal}>
                      Hủy
                    </button>
                    <button
                      className="qb-btn success"
                      onClick={handleCreateBank}
                      disabled={formLoading}
                    >
                      {formLoading
                        ? "Đang xử lý..."
                        : createBankMode === "IMPORT"
                          ? "Tạo ngân hàng và nhập file"
                          : createBankMode === "AI"
                            ? "Tạo ngân hàng và sinh nháp AI"
                            : "Tạo ngân hàng câu hỏi"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EDIT BANK WORKSPACE */}
          {activeModal === "editBank" && selectedBank && (
            <div className="qb-inline-workspace">
              <div className="qb-modal large qb-inline-workspace__card">
                <div className="qb-modal-header">
                  <h2>
                    <Edit3 size={22} />
                    Chỉnh sửa ngân hàng câu hỏi
                  </h2>
                  <button className="qb-close-btn" onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className="qb-modal-body">
                  <div className="qb-selected-role-card compact">
                    <div>
                      <h3>Cấu hình chuyên môn hiện tại</h3>
                      <p>
                        Để tránh lệch flow Journey, lĩnh vực, ngành và vị trí
                        đang được giữ theo ngân hàng hiện có.
                      </p>
                      <div className="qb-role-tags">
                        <span>{selectedFormDomain?.name || getExpertDomainLabel(bankForm.domain)}</span>
                        <span>{selectedFormJobPosition?.name || "Chưa chọn"}</span>
                        <span>{selectedFormSkill?.name || "Role-level bank"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="qb-form-grid">
                    <div className="qb-form-group">
                      <label>
                        Tên ngân hàng câu hỏi{" "}
                        <span className="required">*</span>
                      </label>
                      <input
                        className="qb-input"
                        placeholder="VD: Bộ câu hỏi đầu vào cho Backend Developer"
                        value={bankForm.title}
                        onChange={(e) =>
                          setBankForm((p) => ({ ...p, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="qb-form-group full-width">
                      <label>Mô tả</label>
                      <textarea
                        className="qb-textarea"
                        placeholder="Mô tả ngắn về ngân hàng câu hỏi này..."
                        value={bankForm.description}
                        onChange={(e) =>
                          setBankForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="qb-form-group full-width">
                      <label>Phân bổ độ khó (tổng phải = 100%)</label>
                      <div className="qb-distribution-grid">
                        {DIFFICULTIES.map((d) => (
                          <div
                            key={d}
                            className={`qb-distribution-item ${difficultyClass(d)}`}
                          >
                            <label>{getDifficultyLabel(d)}</label>
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              value={bankForm.distribution[d] || 0}
                              onChange={(e) =>
                                setBankForm((p) => ({
                                  ...p,
                                  distribution: {
                                    ...p.distribution,
                                    [d]: parseFloat(e.target.value) || 0,
                                  },
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          marginTop: "0.5rem",
                          fontSize: "0.8rem",
                          color: "#64748b",
                        }}
                      >
                        Tổng:{" "}
                        {Math.round(
                          Object.values(bankForm.distribution).reduce(
                            (a, b) => a + b,
                            0,
                          ) * 100,
                        )}
                        %
                        {Math.abs(
                          Object.values(bankForm.distribution).reduce(
                            (a, b) => a + b,
                            0,
                          ) - 1.0,
                        ) > 0.001 && (
                            <span
                              style={{ color: "#f87171", marginLeft: "0.5rem" }}
                            >
                              Phải bằng 100%
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="qb-modal-footer">
                  <button className="qb-btn secondary" onClick={closeModal}>
                    Hủy
                  </button>
                  <button
                    className="qb-btn success"
                    onClick={handleUpdateBank}
                    disabled={formLoading}
                  >
                    {formLoading ? "Đang xử lý..." : "Lưu"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE BANK WORKSPACE */}
          {activeModal === "deleteBank" && selectedBank && (
            <div className="qb-inline-workspace">
              <div className="qb-modal qb-inline-workspace__card">
                <div className="qb-modal-header">
                  <h2>
                    <Trash2 size={22} /> Xác nhận xóa
                  </h2>
                  <button className="qb-close-btn" onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className="qb-modal-body">
                  <p style={{ color: "#e5e7eb", marginBottom: "1rem" }}>
                    Bạn có chắc muốn xóa ngân hàng câu hỏi này?
                  </p>
                  <div className="qb-delete-warning">
                    <strong>{selectedBank.title}</strong>
                    <p>
                      {getBankDomainLabel(selectedBank)} —{" "}
                      {selectedBank.activeQuestionCount} câu hỏi
                    </p>
                  </div>
                  <p style={{ color: "#f87171", fontSize: "0.9rem" }}>
                    Thao tác này không thể hoàn tác.
                  </p>
                </div>
                <div className="qb-modal-footer">
                  <button className="qb-btn secondary" onClick={closeModal}>
                    Hủy
                  </button>
                  <button
                    className="qb-btn danger"
                    onClick={handleDeleteBank}
                    disabled={formLoading}
                  >
                    {formLoading ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADD / EDIT QUESTION WORKSPACE */}
          {(activeModal === "addQuestion" ||
            activeModal === "editQuestion") && (
              <div className="qb-inline-workspace">
                <div className="qb-modal extra-large qb-inline-workspace__card">
                  <div className="qb-modal-header">
                    <h2>
                      {activeModal === "addQuestion" ? (
                        <Plus size={22} />
                      ) : (
                        <Edit3 size={22} />
                      )}
                      {activeModal === "addQuestion"
                        ? "Thêm câu hỏi"
                        : "Chỉnh sửa câu hỏi"}
                    </h2>
                    <button className="qb-close-btn" onClick={closeModal}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="qb-modal-body">
                    <div className="qb-form-grid">
                      <div className="qb-form-group full-width">
                        <label>
                          Câu hỏi <span className="required">*</span>
                        </label>
                        <textarea
                          className="qb-textarea"
                          placeholder="Nhập nội dung câu hỏi..."
                          value={questionForm.questionText}
                          onChange={(e) =>
                            setQuestionForm((p) => ({
                              ...p,
                              questionText: e.target.value,
                            }))
                          }
                          style={{ minHeight: "100px" }}
                        />
                      </div>

                      <div className="qb-form-group full-width">
                        <label>
                          4 đáp án <span className="required">*</span>
                        </label>
                        <div className="qb-options-grid">
                          {["A", "B", "C", "D"].map((letter, idx) => (
                            <div key={letter} className="qb-option-item">
                              <div
                                className={`qb-option-letter ${questionForm.correctAnswer === letter ? "selected" : ""}`}
                                onClick={() =>
                                  setQuestionForm((p) => ({
                                    ...p,
                                    correctAnswer: letter,
                                  }))
                                }
                                title="Click để chọn làm đáp án đúng"
                              >
                                {letter}
                              </div>
                              <input
                                className="qb-input"
                                placeholder={`Đáp án ${letter}`}
                                value={questionForm.options[idx] || ""}
                                onChange={(e) =>
                                  setQuestionForm((p) => {
                                    const opts = [...p.options];
                                    opts[idx] = e.target.value;
                                    return { ...p, options: opts };
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            marginTop: "0.5rem",
                            fontSize: "0.8rem",
                            color: "#64748b",
                          }}
                        >
                          Click chữ cái (A/B/C/D) để chọn đáp án đúng. Đang chọn:{" "}
                          <strong style={{ color: "#67e8f9" }}>
                            {questionForm.correctAnswer || "chưa chọn"}
                          </strong>
                        </div>
                      </div>

                      <div className="qb-form-group">
                        <label>
                          Độ khó <span className="required">*</span>
                        </label>
                        <select
                          className="qb-select"
                          value={questionForm.difficulty}
                          onChange={(e) =>
                            setQuestionForm((p) => ({
                              ...p,
                              difficulty: e.target.value,
                            }))
                          }
                        >
                          {DIFFICULTIES.map((d) => (
                            <option key={d} value={d}>
                              {getDifficultyLabel(d)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="qb-form-group">
                        <label>Nguồn</label>
                        <select
                          className="qb-select"
                          value={
                            activeModal === "addQuestion"
                              ? "MANUAL"
                              : selectedQuestion?.source || "MANUAL"
                          }
                          disabled={activeModal === "editQuestion"}
                        >
                          {SOURCE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {getSourceLabel(s)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="qb-form-group">
                        <label>Kỹ năng (Skill)</label>
                        {jobPositionSkills && jobPositionSkills.length > 0 ? (
                          <select
                            className="qb-input"
                            value={questionForm.skillArea}
                            onChange={(e) =>
                              setQuestionForm((p) => ({
                                ...p,
                                skillArea: e.target.value,
                              }))
                            }
                          >
                            <option value="">-- Chọn kỹ năng --</option>
                            {jobPositionSkills.map((s) => (
                              <option key={s.skillId} value={s.skillName}>
                                {s.skillName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="qb-input"
                            placeholder="VD: JavaScript, Cấu trúc dữ liệu..."
                            value={questionForm.skillArea}
                            onChange={(e) =>
                              setQuestionForm((p) => ({
                                ...p,
                                skillArea: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>

                      <div className="qb-form-group">
                        <label>Nhóm câu hỏi</label>
                        <input
                          className="qb-input"
                          placeholder="VD: Frontend, Kiến thức nền tảng..."
                          value={questionForm.category}
                          onChange={(e) =>
                            setQuestionForm((p) => ({
                              ...p,
                              category: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="qb-form-group full-width">
                        <label>Giải thích</label>
                        <textarea
                          className="qb-textarea"
                          placeholder="Giải thích đáp án đúng..."
                          value={questionForm.explanation}
                          onChange={(e) =>
                            setQuestionForm((p) => ({
                              ...p,
                              explanation: e.target.value,
                            }))
                          }
                          style={{ minHeight: "80px" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="qb-modal-footer">
                    <button className="qb-btn secondary" onClick={closeModal}>
                      Hủy
                    </button>
                    <button
                      className="qb-btn success"
                      onClick={
                        activeModal === "addQuestion"
                          ? handleAddQuestion
                          : handleUpdateQuestion
                      }
                      disabled={formLoading}
                    >
                      {formLoading
                        ? "Đang xử lý..."
                        : activeModal === "addQuestion"
                          ? "Thêm"
                          : "Lưu"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* DELETE QUESTION WORKSPACE */}
          {activeModal === "deleteQuestion" && selectedQuestion && (
            <div className="qb-inline-workspace">
              <div className="qb-modal qb-inline-workspace__card">
                <div className="qb-modal-header">
                  <h2>
                    <Trash2 size={22} /> Xác nhận xóa câu hỏi
                  </h2>
                  <button className="qb-close-btn" onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className="qb-modal-body">
                  <p style={{ color: "#e5e7eb", marginBottom: "1rem" }}>
                    Bạn có chắc muốn xóa câu hỏi này?
                  </p>
                  <div className="qb-delete-warning">
                    <strong>
                      {selectedQuestion.questionText.substring(0, 100)}
                      {selectedQuestion.questionText.length > 100 ? "..." : ""}
                    </strong>
                    <p>
                      {renderDifficultyBadge(selectedQuestion.difficulty)} —{" "}
                      {getSourceLabel(selectedQuestion.source)}
                    </p>
                  </div>
                  <p style={{ color: "#f87171", fontSize: "0.9rem" }}>
                    Thao tác này không thể hoàn tác.
                  </p>
                </div>
                <div className="qb-modal-footer">
                  <button className="qb-btn secondary" onClick={closeModal}>
                    Hủy
                  </button>
                  <button
                    className="qb-btn danger"
                    onClick={handleDeleteQuestion}
                    disabled={formLoading}
                  >
                    {formLoading ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BULK IMPORT WORKSPACE */}
          {activeModal === "import" && selectedBank && (
            <div className="qb-inline-workspace">
              <div className="qb-modal extra-large qb-inline-workspace__card">
                <div className="qb-modal-header">
                  <h2>
                    <Upload size={22} /> Nhập câu hỏi từ file
                  </h2>
                  <button className="qb-close-btn" onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className="qb-modal-body">
                  {/* Steps */}
                  <div className="qb-import-steps">
                    {[
                      { n: 1, label: "Chọn file" },
                      { n: 2, label: "Xem trước" },
                      { n: 3, label: "Xác nhận" },
                    ].map((step) => (
                      <div
                        key={step.n}
                        className={`qb-import-step ${importStep === step.n ? "active" : ""} ${importStep > step.n ? "completed" : ""}`}
                      >
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
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("drag-over");
                        }}
                        onDragLeave={(e) =>
                          e.currentTarget.classList.remove("drag-over")
                        }
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("drag-over");
                          const file = e.dataTransfer.files[0];
                          if (
                            file &&
                            (file.name.endsWith(".csv") ||
                              file.name.endsWith(".json"))
                          ) {
                            handleImportFile(file);
                          } else {
                            showWarning(
                              "Cảnh báo",
                              "Chỉ chấp nhận file CSV hoặc JSON",
                            );
                          }
                        }}
                      >
                        <Upload size={48} />
                        <p>Kéo thả file hoặc click để chọn</p>
                        <p>Hỗ trợ: CSV, JSON</p>
                        <p className="hint">
                          File cần có các cột: `questionText`, `options` (mảng),
                          `correctAnswer`, `difficulty`, `explanation`,
                          `skillArea`, `category`.
                        </p>
                      </div>
                      <input
                        ref={importFileInputRef}
                        type="file"
                        accept=".csv,.json"
                        style={{ display: "none" }}
                        onChange={(e) => {
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
                          <span className="count total">
                            {importPreview.questions.length}
                          </span>
                          <span className="label">Tổng</span>
                        </div>
                        <div className="qb-import-summary-item">
                          <span className="count valid">
                            {validImportCount}
                          </span>
                          <span className="label">Hợp lệ</span>
                        </div>
                        <div className="qb-import-summary-item">
                          <span className="count invalid">
                            {invalidImportCount}
                          </span>
                          <span className="label">Không hợp lệ</span>
                        </div>
                      </div>
                      <div
                        className="qb-preview-table-wrapper"
                        style={{ marginTop: "1rem" }}
                      >
                        <table className="qb-preview-table">
                          <thead>
                            <tr>
                              <th style={{ width: "40px" }}>Trạng thái</th>
                              <th>#</th>
                              <th>Câu hỏi</th>
                              <th>Đáp án</th>
                              <th>Độ khó</th>
                              <th>Lỗi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.questions.map((q, idx) => (
                              <tr
                                key={idx}
                                className={!q.valid ? "invalid" : ""}
                              >
                                <td>
                                  <div className="qb-preview-status">
                                    {q.valid ? (
                                      <CheckCircle2
                                        size={16}
                                        className="valid-icon"
                                      />
                                    ) : (
                                      <AlertTriangle
                                        size={16}
                                        className="invalid-icon"
                                      />
                                    )}
                                  </div>
                                </td>
                                <td>{idx + 1}</td>
                                <td title={q.questionText}>
                                  {q.questionText?.substring(0, 60)}
                                  {q.questionText && q.questionText.length > 60
                                    ? "..."
                                    : ""}
                                </td>
                                <td>{q.correctAnswer}</td>
                                <td>
                                  {getDifficultyLabel(q.difficulty || "")}
                                </td>
                                <td
                                  style={{
                                    color: "#f87171",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {(q.errors || [])
                                    .map(localizeImportError)
                                    .join(", ")}
                                </td>
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
                            {importFile ? `File: ${importFile.name}. ` : ""}
                            Hệ thống sẽ lưu {validImportCount} câu hỏi hợp lệ
                            vào <strong>{selectedBank.title}</strong>.
                          </p>
                          <div className="qb-role-tags">
                            <span>
                              {getBankDomainLabel(selectedBank)}
                            </span>
                            {selectedBank.industry && (
                              <span>{selectedBank.industry}</span>
                            )}
                            {selectedBank.jobRole && (
                              <span>{selectedBank.jobRole}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="qb-import-summary">
                        <div className="qb-import-summary-item">
                          <span className="count valid">
                            {validImportCount}
                          </span>
                          <span className="label">Sẽ import</span>
                        </div>
                        <div className="qb-import-summary-item">
                          <span className="count invalid">
                            {invalidImportCount}
                          </span>
                          <span className="label">Bị loại</span>
                        </div>
                      </div>

                      <div
                        className="qb-preview-table-wrapper"
                        style={{ marginTop: "1rem" }}
                      >
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
                                <td title={q.questionText}>
                                  {q.questionText?.substring(0, 90)}
                                  {q.questionText && q.questionText.length > 90
                                    ? "..."
                                    : ""}
                                </td>
                                <td>{q.correctAnswer}</td>
                                <td>
                                  {getDifficultyLabel(q.difficulty || "")}
                                </td>
                                <td>{q.skillArea || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
                <div className="qb-modal-footer">
                  <button className="qb-btn secondary" onClick={closeModal}>
                    Hủy
                  </button>
                  {importStep > 1 && (
                    <button
                      className="qb-btn secondary"
                      onClick={() => setImportStep((s) => s - 1)}
                    >
                      Quay lại
                    </button>
                  )}
                  {importStep < 3 && importPreview && (
                    <button
                      className="qb-btn primary"
                      onClick={() => setImportStep(3)}
                      disabled={validImportCount === 0}
                    >
                      Tiếp tục <ChevronRight size={16} />
                    </button>
                  )}
                  {importStep === 3 && (
                    <button
                      className="qb-btn success"
                      onClick={handleConfirmImport}
                      disabled={formLoading || validImportCount === 0}
                    >
                      {formLoading
                        ? `Đang nhập ${validImportCount}...`
                        : `Nhập ${validImportCount} câu hỏi`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI GENERATE WORKSPACE */}
          {activeModal === "aiGenerate" && selectedBank && (
            <div className="qb-inline-workspace">
              <div className="qb-modal extra-large qb-inline-workspace__card">
                <div className="qb-modal-header">
                  <h2>
                    <Brain size={22} /> Sinh nháp câu hỏi bằng AI
                  </h2>
                  <button className="qb-close-btn" onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className="qb-modal-body">
                  {/* Steps */}
                  <div className="qb-import-steps">
                    {[
                      { n: 1, label: "Thiết lập" },
                      { n: 2, label: "Sinh nháp" },
                      { n: 3, label: "Duyệt và thêm" },
                    ].map((step) => (
                      <div
                        key={step.n}
                        className={`qb-import-step ${importStep === step.n ? "active" : ""} ${importStep > step.n ? "completed" : ""}`}
                      >
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
                          <h3>AI sẽ sinh câu hỏi cho kỹ năng này</h3>
                          <div
                            className="qb-role-tags"
                            style={{ marginBottom: "0.4rem" }}
                          >
                            {selectedBank.skillName && (
                              <span className="skill-tag">
                                🎯 {selectedBank.skillName}
                              </span>
                            )}
                            {selectedBank.domain && (
                              <span>
                                {getBankDomainLabel(selectedBank)}
                              </span>
                            )}
                            {selectedBank.jobRole && (
                              <span>{selectedBank.jobRole}</span>
                            )}
                          </div>
                          <p style={{ margin: 0 }}>
                            AI sẽ tạo câu hỏi cho{" "}
                            <strong style={{ color: "#67e8f9" }}>
                              {selectedBank.skillName || selectedBank.title}
                            </strong>{" "}
                            với 4 mức độ khó theo phân bổ đã cấu hình.
                          </p>
                        </div>
                      </div>

                      <div className="qb-ai-config">
                        <div className="qb-slider-group">
                          <label>
                            Số câu hỏi:{" "}
                            <span className="qb-slider-value">
                              {aiQuestionCount}
                            </span>
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={50}
                            value={aiQuestionCount}
                            onChange={(e) =>
                              setAiQuestionCount(parseInt(e.target.value))
                            }
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.7rem",
                              color: "#64748b",
                            }}
                          >
                            <span>5</span>
                            <span>50</span>
                          </div>
                        </div>

                        <div className="qb-slider-group">
                          <label>
                            Chủ đề / kỹ năng bổ sung{" "}
                            <span
                              style={{
                                color: "#94a3b8",
                                fontWeight: 400,
                                fontSize: "0.8rem",
                              }}
                            >
                              (tùy chọn)
                            </span>
                          </label>
                          <input
                            className="qb-input"
                            placeholder={`Mặc định: ${selectedBank.skillName || selectedBank.title}. Thêm chủ đề phụ nếu muốn`}
                            value={aiFocusSkills}
                            onChange={(e) => setAiFocusSkills(e.target.value)}
                          />
                        </div>

                        <div className="qb-slider-group full-width">
                          <label>Phân bổ độ khó</label>
                          <div className="qb-distribution-grid">
                            {DIFFICULTIES.map((d) => (
                              <div
                                key={d}
                                className={`qb-distribution-item ${difficultyClass(d)}`}
                              >
                                <label>{getDifficultyLabel(d)}</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={aiDistribution[d] || 0}
                                  onChange={(e) =>
                                    setAiDistribution((p) => ({
                                      ...p,
                                      [d]: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "1rem",
                          background: "rgba(6,182,212,0.08)",
                          borderRadius: "12px",
                          border: "1px solid rgba(6,182,212,0.2)",
                          marginTop: "1rem",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 0.5rem",
                            color: "#67e8f9",
                            fontSize: "0.9rem",
                          }}
                        >
                          Thông tin gửi cho AI
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            color: "#94a3b8",
                            fontSize: "0.85rem",
                          }}
                        >
                          Sinh{" "}
                          <strong style={{ color: "#67e8f9" }}>
                            {aiQuestionCount} câu hỏi
                          </strong>{" "}
                          về kỹ năng{" "}
                          <strong style={{ color: "#67e8f9" }}>
                            {selectedBank.skillName || selectedBank.title}
                          </strong>
                          , phân bổ theo 4 mức độ khó.
                          {aiFocusSkills &&
                            ` Chủ đề bổ sung: ${aiFocusSkills}.`}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Generating Loader */}
                  {importStep === 2 && (
                    <div
                      className="qb-loading-state"
                      style={{ minHeight: "300px" }}
                    >
                      <MeowlKuruLoader
                        size="large"
                        text="Đang sinh bản nháp bằng AI..."
                      />
                      <p style={{ color: "#67e8f9", marginTop: "1rem" }}>
                        Vui lòng chờ trong giây lát
                      </p>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {importStep === 3 && aiDrafts.length > 0 && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <div className="qb-import-summary">
                          <div className="qb-import-summary-item">
                            <span className="count total">
                              {aiDrafts.length}
                            </span>
                            <span className="label">Tổng bản nháp</span>
                          </div>
                          <div className="qb-import-summary-item">
                            <span className="count valid">
                              {aiSelectedCount}
                            </span>
                            <span className="label">Đã chọn</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="qb-btn secondary small"
                            onClick={() =>
                              setSelectedDraftIds(
                                new Set(aiDrafts.map((d) => d.draftId)),
                              )
                            }
                          >
                            Chọn tất cả
                          </button>
                          <button
                            className="qb-btn secondary small"
                            onClick={() => setSelectedDraftIds(new Set())}
                          >
                            Bỏ chọn tất cả
                          </button>
                        </div>
                      </div>
                      <div className="qb-draft-grid">
                        {aiDrafts.map((draft) => (
                          <div
                            key={draft.draftId}
                            className={`qb-draft-card ${editedDraftIds.has(draft.draftId) ? "edited" : ""}`}
                          >
                            <div className="qb-draft-header">
                              <span className="qb-draft-num">
                                Bản nháp #{draft.draftId}
                              </span>
                              {editedDraftIds.has(draft.draftId) && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#c084fc",
                                  }}
                                >
                                  Đã chỉnh sửa
                                </span>
                              )}
                              <label className="qb-draft-checkbox">
                                <input
                                  type="checkbox"
                                  checked={selectedDraftIds.has(draft.draftId)}
                                  onChange={() =>
                                    toggleDraftSelection(draft.draftId)
                                  }
                                />
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#94a3b8",
                                  }}
                                >
                                  Chọn
                                </span>
                              </label>
                            </div>
                            <div className="qb-draft-body">
                              <div
                                className="qb-draft-field"
                                style={{ gridColumn: "span 2" }}
                              >
                                <label>
                                  Câu hỏi{" "}
                                  <span style={{ color: "#f87171" }}>*</span>
                                </label>
                                <textarea
                                  value={draft.questionText || ""}
                                  onChange={(e) =>
                                    updateDraft(
                                      draft.draftId,
                                      "questionText",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Nội dung câu hỏi..."
                                />
                              </div>
                              <div
                                className="qb-draft-field"
                                style={{ gridColumn: "span 2" }}
                              >
                                <label>4 đáp án</label>
                                <div className="qb-draft-options">
                                  {["A", "B", "C", "D"].map((letter, idx) => (
                                    <div
                                      key={letter}
                                      className="qb-draft-option"
                                    >
                                      <div className="qb-draft-option-letter">
                                        {letter}
                                      </div>
                                      <input
                                        value={draft.options?.[idx] || ""}
                                        onChange={(e) => {
                                          const opts = [
                                            ...(draft.options || [
                                              "",
                                              "",
                                              "",
                                              "",
                                            ]),
                                          ];
                                          opts[idx] = e.target.value;
                                          updateDraft(
                                            draft.draftId,
                                            "options",
                                            opts,
                                          );
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
                                  value={draft.correctAnswer || ""}
                                  onChange={(e) =>
                                    updateDraft(
                                      draft.draftId,
                                      "correctAnswer",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">-- Chọn --</option>
                                  {["A", "B", "C", "D"].map((l) => (
                                    <option key={l} value={l}>
                                      {l}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="qb-draft-field">
                                <label>Độ khó</label>
                                <select
                                  value={draft.difficulty || "INTERMEDIATE"}
                                  onChange={(e) =>
                                    updateDraft(
                                      draft.draftId,
                                      "difficulty",
                                      e.target.value,
                                    )
                                  }
                                >
                                  {DIFFICULTIES.map((d) => (
                                    <option key={d} value={d}>
                                      {getDifficultyLabel(d)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="qb-draft-field">
                                <label>Kỹ năng</label>
                                <input
                                  value={draft.skillArea || ""}
                                  onChange={(e) =>
                                    updateDraft(
                                      draft.draftId,
                                      "skillArea",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="VD: JavaScript, Phân tích dữ liệu"
                                />
                              </div>
                              <div className="qb-draft-field">
                                <label>Nhóm câu hỏi</label>
                                <input
                                  value={draft.category || ""}
                                  onChange={(e) =>
                                    updateDraft(
                                      draft.draftId,
                                      "category",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="VD: Frontend, Tình huống thực tế"
                                />
                              </div>
                              <div
                                className="qb-draft-field"
                                style={{ gridColumn: "span 2" }}
                              >
                                <label>Giải thích</label>
                                <textarea
                                  value={draft.explanation || ""}
                                  onChange={(e) =>
                                    updateDraft(
                                      draft.draftId,
                                      "explanation",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Giải thích đáp án đúng..."
                                  style={{ minHeight: "50px" }}
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
                      <p>
                        AI không tạo được bản nháp nào. Thử lại với cài đặt
                        khác.
                      </p>
                    </div>
                  )}
                </div>
                <div className="qb-modal-footer">
                  <button className="qb-btn secondary" onClick={closeModal}>
                    Hủy
                  </button>
                  {importStep > 1 && (
                    <button
                      className="qb-btn secondary"
                      onClick={() => {
                        if (importStep === 3) {
                          setImportStep(1);
                          setAiDrafts([]);
                        } else setImportStep((s) => s - 1);
                      }}
                    >
                      Quay lại
                    </button>
                  )}
                  {importStep === 1 && (
                    <button
                      className="qb-btn primary"
                      onClick={handleGenerateAiDraft}
                      disabled={aiGenerating}
                    >
                      {aiGenerating ? (
                        "Đang xử lý..."
                      ) : (
                        <>
                          <Sparkles size={16} /> Tạo bản nháp
                        </>
                      )}
                    </button>
                  )}
                  {importStep === 3 && (
                    <button
                      className="qb-btn success"
                      onClick={handleApproveAiDrafts}
                      disabled={formLoading || aiSelectedCount === 0}
                    >
                      {formLoading
                        ? `Đang thêm ${aiSelectedCount}...`
                        : `Thêm ${aiSelectedCount} câu hỏi`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionBankTab;
