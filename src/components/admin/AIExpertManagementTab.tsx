import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import ReactDOM from "react-dom";
import {
  Brain,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  RefreshCw,
  Layers,
  Briefcase,
  Code,
  Users,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Globe,
  Building2,
  UserCog,
  FileText,
  Image,
  Zap,
  Upload,
  X,
} from "lucide-react";
import {
  getAllExpertPrompts,
  createExpertPrompt,
  updateExpertPrompt,
  deleteExpertPrompt,
  uploadExpertMedia,
  generateExpertPrompts,
  ExpertPromptConfig,
  ExpertPromptRequest,
  PromptGenerationResponse,
} from "../../services/expertPromptService";
import { useToast } from "../../hooks/useToast";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import "./AIExpertManagementTab.css";

// ==================== HELPER ====================
const checkIsActive = (config: ExpertPromptConfig): boolean => {
  return config.isActive === true || config.active === true;
};

const normalizeDraftValue = (value: string): string => value.trim();

const includesIgnoreCase = (items: string[], value: string): boolean =>
  items.some((item) => item.toLowerCase() === value.toLowerCase());

// ==================== COMPONENT ====================
const AIExpertManagementTab: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();

  // Data
  const [configs, setConfigs] = useState<ExpertPromptConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Expand state
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set(),
  );
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(
    new Set(),
  );

  // Modal states
  type ModalType =
    | "domain"
    | "industry"
    | "jobRole"
    | "edit"
    | "view"
    | "delete"
    | "aiGenerate"
    | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedConfig, setSelectedConfig] =
    useState<ExpertPromptConfig | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Domain configs (domain -> domainRules)
  const [domainRulesMap, setDomainRulesMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [draftIndustriesByDomain, setDraftIndustriesByDomain] = useState<
    Record<string, string[]>
  >({});

  // Form states
  const [domainForm, setDomainForm] = useState({ name: "", rules: "" });
  const [industryForm, setIndustryForm] = useState({ domain: "", name: "" });
  const [jobRoleForm, setJobRoleForm] = useState({
    domain: "",
    industry: "",
    jobRole: "",
    keywords: "",
    rolePrompt: "",
    systemPrompt: "",
    mediaUrl: "",
    isActive: true,
  });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generate state
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({
    domain: "",
    industry: "",
    jobRole: "",
    keywords: "",
    generationHint: "",
    useExistingDomainRules: true,
  });
  const [generatedDraft, setGeneratedDraft] =
    useState<PromptGenerationResponse | null>(null);
  const [draftDomainRules, setDraftDomainRules] = useState("");
  const [draftRolePrompt, setDraftRolePrompt] = useState("");
  const [draftEdited, setDraftEdited] = useState({
    domainRules: false,
    rolePrompt: false,
  });

  // ==================== LOAD DATA ====================
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllExpertPrompts();
      const nextConfigs = Array.isArray(data) ? data : [];
      setConfigs(nextConfigs);

      // Extract domain rules from configs
      const rulesMap = new Map<string, string>();
      nextConfigs.forEach((c: ExpertPromptConfig) => {
        if (c.domain && c.domainRules && !rulesMap.has(c.domain)) {
          rulesMap.set(c.domain, c.domainRules);
        }
      });
      setDomainRulesMap(rulesMap);

      // Auto expand domains
      if (nextConfigs.length > 0) {
        const domains = new Set(
          nextConfigs.map((c: ExpertPromptConfig) => c.domain).filter(Boolean),
        );
        setExpandedDomains(domains as Set<string>);
      }
    } catch {
      showError("Lỗi", "Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // Scroll lock for modals
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  // ==================== COMPUTED ====================
  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      const matchSearch =
        !searchTerm ||
        config.jobRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.industry?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && checkIsActive(config)) ||
        (statusFilter === "inactive" && !checkIsActive(config));
      return matchSearch && matchStatus;
    });
  }, [configs, searchTerm, statusFilter]);

  // Group by Domain -> Industry
  const groupedData = useMemo(() => {
    const result: Record<string, Record<string, ExpertPromptConfig[]>> = {};
    filteredConfigs.forEach((config) => {
      const domain = config.domain || "Uncategorized";
      const industry = config.industry || "General";
      if (!result[domain]) result[domain] = {};
      if (!result[domain][industry]) result[domain][industry] = [];
      result[domain][industry].push(config);
    });
    return result;
  }, [filteredConfigs]);

  const sortedDomains = useMemo(
    () => Object.keys(groupedData).sort(),
    [groupedData],
  );

  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>();

    configs
      .map((config) => config.domain)
      .filter(Boolean)
      .forEach((domain) => domains.add(domain));

    Array.from(domainRulesMap.keys())
      .filter(Boolean)
      .forEach((domain) => domains.add(domain));

    Object.keys(draftIndustriesByDomain)
      .filter(Boolean)
      .forEach((domain) => domains.add(domain));

    return Array.from(domains).sort((a, b) => a.localeCompare(b));
  }, [configs, domainRulesMap, draftIndustriesByDomain]);

  const getIndustriesForDomain = useCallback(
    (domain: string) => {
      const industries = new Set<string>();

      configs
        .filter((config) => config.domain === domain)
        .map((config) => config.industry)
        .filter(Boolean)
        .forEach((industry) => industries.add(industry));

      (draftIndustriesByDomain[domain] || [])
        .filter(Boolean)
        .forEach((industry) => industries.add(industry));

      return Array.from(industries).sort((a, b) => a.localeCompare(b));
    },
    [configs, draftIndustriesByDomain],
  );

  const stats = useMemo(
    () => ({
      total: configs.length,
      active: configs.filter((c) => checkIsActive(c)).length,
      domains: uniqueDomains.length,
      industries: (() => {
        const industries = new Set<string>();

        configs
          .map((config) => config.industry)
          .filter(Boolean)
          .forEach((industry) => industries.add(industry));

        Object.values(draftIndustriesByDomain)
          .flat()
          .filter(Boolean)
          .forEach((industry) => industries.add(industry));

        return industries.size;
      })(),
    }),
    [configs, uniqueDomains, draftIndustriesByDomain],
  );

  // ==================== HANDLERS ====================
  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  const toggleIndustry = (key: string) => {
    setExpandedIndustries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedConfig(null);
    setDomainForm({ name: "", rules: "" });
    setIndustryForm({ domain: "", name: "" });
    setJobRoleForm({
      domain: "",
      industry: "",
      jobRole: "",
      keywords: "",
      rolePrompt: "",
      systemPrompt: "",
      mediaUrl: "",
      isActive: true,
    });
    // Reset AI state
    setAiStep(1);
    setAiForm({
      domain: "",
      industry: "",
      jobRole: "",
      keywords: "",
      generationHint: "",
      useExistingDomainRules: true,
    });
    setGeneratedDraft(null);
    setDraftDomainRules("");
    setDraftRolePrompt("");
    setDraftEdited({ domainRules: false, rolePrompt: false });
  };

  // Create Domain (saves as a config with placeholder jobRole)
  const handleCreateDomainLegacy = async () => {
    if (!domainForm.name) {
      showWarning("Cảnh báo", "Vui lòng nhập tên Domain");
      return;
    }
    // Store domain rules in local map
    setDomainRulesMap((prev) =>
      new Map(prev).set(domainForm.name, domainForm.rules),
    );
    showSuccess("Thành công", `Domain "${domainForm.name}" đã được tạo`);
    closeModal();
  };

  // Create Industry (just saves to UI, real save happens with JobRole)
  const handleCreateIndustryLegacy = async () => {
    if (!industryForm.domain || !industryForm.name) {
      showWarning("Cảnh báo", "Vui lòng chọn Domain và nhập tên Industry");
      return;
    }
    showSuccess(
      "Thành công",
      `Industry "${industryForm.name}" đã được thêm vào ${industryForm.domain}`,
    );
    closeModal();
  };

  void handleCreateDomainLegacy;
  void handleCreateIndustryLegacy;

  const handleCreateDomain = async () => {
    const domainName = normalizeDraftValue(domainForm.name);
    const domainRules = domainForm.rules.trim();

    if (!domainName) {
      showWarning("Cáº£nh bĂ¡o", "Vui lĂ²ng nháº­p tĂªn Domain");
      return;
    }

    setDomainRulesMap((prev) => {
      const next = new Map(prev);
      next.set(domainName, domainRules);
      return next;
    });
    setIndustryForm((prev) => ({ ...prev, domain: domainName }));
    setJobRoleForm((prev) => ({ ...prev, domain: domainName }));
    showSuccess(
      "ThĂ nh cĂ´ng",
      `ÄĂ£ thĂªm Domain "${domainName}". Domain sáº½ Ä‘Æ°á»£c lÆ°u khi báº¡n táº¡o Job Role.`,
    );
    closeModal();
  };

  const handleCreateIndustry = async () => {
    const domainName = normalizeDraftValue(industryForm.domain);
    const industryName = normalizeDraftValue(industryForm.name);

    if (!domainName || !industryName) {
      showWarning(
        "Cáº£nh bĂ¡o",
        "Vui lĂ²ng chá»n Domain vĂ  nháº­p tĂªn Industry",
      );
      return;
    }

    setDomainRulesMap((prev) => {
      if (prev.has(domainName)) {
        return prev;
      }

      const next = new Map(prev);
      next.set(domainName, "");
      return next;
    });
    setDraftIndustriesByDomain((prev) => {
      const currentIndustries = prev[domainName] || [];

      if (includesIgnoreCase(currentIndustries, industryName)) {
        return prev;
      }

      return {
        ...prev,
        [domainName]: [...currentIndustries, industryName].sort((a, b) =>
          a.localeCompare(b),
        ),
      };
    });
    setJobRoleForm((prev) => ({
      ...prev,
      domain: domainName,
      industry: industryName,
    }));
    showSuccess(
      "Thành công",
      `Đã thêm Industry "${industryName}" vào ${domainName}. Industry sẽ được lưu khi bạn tạo Job Role.`,
    );
    closeModal();
  };

  // Create Job Role (real save to backend)
  const handleCreateJobRole = async () => {
    if (!jobRoleForm.domain || !jobRoleForm.industry || !jobRoleForm.jobRole) {
      showWarning("Cảnh báo", "Vui lòng điền Domain, Industry và Job Role");
      return;
    }
    if (!jobRoleForm.rolePrompt && !jobRoleForm.systemPrompt) {
      showWarning("Cảnh báo", "Vui lòng nhập Role Prompt hoặc System Prompt");
      return;
    }

    try {
      setFormLoading(true);
      const domainRules = domainRulesMap.get(jobRoleForm.domain) || "";

      const request: ExpertPromptRequest = {
        domain: jobRoleForm.domain,
        industry: jobRoleForm.industry,
        jobRole: jobRoleForm.jobRole,
        keywords: jobRoleForm.keywords || undefined,
        domainRules: domainRules || undefined,
        rolePrompt: jobRoleForm.rolePrompt || undefined,
        systemPrompt: jobRoleForm.systemPrompt || undefined,
        mediaUrl: jobRoleForm.mediaUrl || undefined,
        isActive: jobRoleForm.isActive,
      };
      await createExpertPrompt(request);
      showSuccess("Thành công", "Đã tạo Expert Config");
      closeModal();
      loadConfigs();
    } catch (error: any) {
      showError("Lỗi", error.response?.data?.message || "Không thể tạo");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit existing config
  const handleUpdate = async () => {
    if (!selectedConfig) return;

    try {
      setFormLoading(true);
      const request: ExpertPromptRequest = {
        domain: jobRoleForm.domain,
        industry: jobRoleForm.industry,
        jobRole: jobRoleForm.jobRole,
        keywords: jobRoleForm.keywords || undefined,
        domainRules: domainRulesMap.get(jobRoleForm.domain) || undefined,
        rolePrompt: jobRoleForm.rolePrompt || undefined,
        systemPrompt: jobRoleForm.systemPrompt || undefined,
        mediaUrl: jobRoleForm.mediaUrl || undefined,
        isActive: jobRoleForm.isActive,
      };
      await updateExpertPrompt(selectedConfig.id, request);
      showSuccess("Thành công", "Đã cập nhật");
      closeModal();
      loadConfigs();
    } catch (error: any) {
      showError("Lỗi", error.response?.data?.message || "Không thể cập nhật");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedConfig) return;
    try {
      setFormLoading(true);
      await deleteExpertPrompt(selectedConfig.id);
      showSuccess("Thành công", "Đã xóa");
      closeModal();
      loadConfigs();
    } catch {
      showError("Lỗi", "Không thể xóa");
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedConfig) return;
    try {
      setFormLoading(true);
      const result = await uploadExpertMedia(selectedConfig.id, file);
      setJobRoleForm((p) => ({ ...p, mediaUrl: result.mediaUrl }));
      showSuccess("Thành công", "Đã upload hình");
      loadConfigs();
    } catch {
      showError("Lỗi", "Không thể upload");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (config: ExpertPromptConfig) => {
    setSelectedConfig(config);
    setJobRoleForm({
      domain: config.domain || "",
      industry: config.industry || "",
      jobRole: config.jobRole || "",
      keywords: config.keywords || "",
      rolePrompt: config.rolePrompt || "",
      systemPrompt: config.systemPrompt || "",
      mediaUrl: config.mediaUrl || "",
      isActive: checkIsActive(config),
    });
    setActiveModal("edit");
  };

  // ==================== AI GENERATE HANDLERS ====================
  const handleAiGenerate = async () => {
    if (!aiForm.domain || !aiForm.industry || !aiForm.jobRole) {
      showWarning(
        "Cảnh báo",
        "Vui lòng nhập đầy đủ Domain, Industry và Job Role",
      );
      return;
    }
    try {
      setAiGenerating(true);
      setAiStep(2);
      const existingDomainRules =
        aiForm.useExistingDomainRules && domainRulesMap.get(aiForm.domain)
          ? domainRulesMap.get(aiForm.domain)
          : undefined;
      const result = await generateExpertPrompts({
        domain: aiForm.domain,
        industry: aiForm.industry,
        jobRole: aiForm.jobRole,
        keywords: aiForm.keywords || undefined,
        existingDomainRules,
        generationHint: aiForm.generationHint || undefined,
      });
      setGeneratedDraft(result);
      setDraftDomainRules(result.domainRules);
      setDraftRolePrompt(result.rolePrompt);
      setDraftEdited({ domainRules: false, rolePrompt: false });
      setAiStep(3);
    } catch (error: any) {
      showError(
        "Lỗi",
        error.response?.data?.message ||
          "Không thể sinh prompt. Vui lòng thử lại.",
      );
      setAiStep(1);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAiApprove = async () => {
    if (!draftDomainRules.trim() && !draftRolePrompt.trim()) {
      showWarning(
        "Cảnh báo",
        "Vui lòng đảm bảo có nội dung Domain Rules hoặc Role Prompt",
      );
      return;
    }
    try {
      setFormLoading(true);
      // Merge domainRules into domainRulesMap for handleCreateJobRole to pick up
      if (draftDomainRules.trim()) {
        setDomainRulesMap((prev) =>
          new Map(prev).set(aiForm.domain, draftDomainRules),
        );
      }
      // Populate jobRoleForm and call create
      setJobRoleForm({
        domain: aiForm.domain,
        industry: aiForm.industry,
        jobRole: aiForm.jobRole,
        keywords: generatedDraft?.suggestedKeywords || aiForm.keywords || "",
        rolePrompt: draftRolePrompt,
        systemPrompt: "",
        mediaUrl: "",
        isActive: true,
      });
      const domainRules = draftDomainRules.trim()
        ? draftDomainRules
        : domainRulesMap.get(aiForm.domain) || "";
      await createExpertPrompt({
        domain: aiForm.domain,
        industry: aiForm.industry,
        jobRole: aiForm.jobRole,
        keywords:
          generatedDraft?.suggestedKeywords || aiForm.keywords || undefined,
        domainRules: domainRules || undefined,
        rolePrompt: draftRolePrompt || undefined,
        isActive: true,
      });
      showSuccess("Thành công", "Đã tạo Expert Config bằng AI");
      closeModal();
      loadConfigs();
    } catch (error: any) {
      showError(
        "Lỗi",
        error.response?.data?.message || "Không thể lưu Expert Config",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const buildSystemPromptPreview = () => {
    const domainRules =
      draftDomainRules || domainRulesMap.get(aiForm.domain) || "";
    const rolePrompt = draftRolePrompt || "";
    return (
      "# MEOWL AI - CHUYÊN GIA " +
      aiForm.jobRole.toUpperCase() +
      "\n\n" +
      (domainRules ? "## QUY TẮC LĨNH VỰC\n" + domainRules + "\n\n" : "") +
      (rolePrompt ? "## CHUYÊN MÔN VAI TRÒ\n" + rolePrompt : "")
    );
  };

  const getDomainIcon = (domain: string) => {
    const d = (domain || "").toLowerCase();
    if (d.includes("it") || d.includes("technology")) return <Code size={18} />;
    if (d.includes("business") || d.includes("marketing"))
      return <Briefcase size={18} />;
    if (d.includes("design")) return <Sparkles size={18} />;
    if (d.includes("healthcare")) return <Users size={18} />;
    return <Globe size={18} />;
  };

  // ==================== RENDER ====================
  return (
    <div className="expert-config-page">
      {/* Header */}
      <div className="expert-config-header">
        <h2>
          <Brain size={28} /> AI Expert Configuration
        </h2>
        <div className="expert-config-actions">
          <button className="expert-btn secondary" onClick={loadConfigs}>
            <RefreshCw size={18} />
          </button>
          <button
            className="expert-btn primary"
            style={{
              background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
              boxShadow: "0 4px 20px rgba(34, 211, 238, 0.34)",
            }}
            onClick={() => {
              closeModal();
              setActiveModal("aiGenerate");
            }}
          >
            <Sparkles size={18} /> Tạo bằng AI
          </button>
          <button
            className="expert-btn primary"
            onClick={() => setActiveModal("domain")}
          >
            <Plus size={18} /> Domain
          </button>
          <button
            className="expert-btn primary"
            onClick={() => setActiveModal("industry")}
          >
            <Plus size={18} /> Industry
          </button>
          <button
            className="expert-btn success"
            onClick={() => setActiveModal("jobRole")}
          >
            <Plus size={18} /> Job Role
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="expert-config-stats">
        <div className="expert-stat-card">
          <div className="expert-stat-icon">
            <Brain size={22} />
          </div>
          <div>
            <div className="expert-stat-value">{stats.total}</div>
            <div className="expert-stat-label">Experts</div>
          </div>
        </div>
        <div className="expert-stat-card">
          <div className="expert-stat-icon">
            <Zap size={22} />
          </div>
          <div>
            <div className="expert-stat-value">{stats.active}</div>
            <div className="expert-stat-label">Active</div>
          </div>
        </div>
        <div className="expert-stat-card">
          <div className="expert-stat-icon">
            <Layers size={22} />
          </div>
          <div>
            <div className="expert-stat-value">{stats.domains}</div>
            <div className="expert-stat-label">Domains</div>
          </div>
        </div>
        <div className="expert-stat-card">
          <div className="expert-stat-icon">
            <Building2 size={22} />
          </div>
          <div>
            <div className="expert-stat-value">{stats.industries}</div>
            <div className="expert-stat-label">Industries</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="expert-config-filters">
        <div className="expert-search-box">
          <Search size={20} />
          <input
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="expert-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">Tất cả</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="expert-loading-state">
          <MeowlKuruLoader size="small" text="" />
          <p>Đang tải...</p>
        </div>
      ) : sortedDomains.length === 0 ? (
        <div className="expert-empty-state">
          <Brain size={64} />
          <h3>Chưa có Expert Config</h3>
          <p>Tạo Domain → Industry → Job Role để bắt đầu</p>
        </div>
      ) : (
        <div className="expert-grouped-list">
          {sortedDomains.map((domain) => {
            const isDomainExpanded = expandedDomains.has(domain);
            const industries = Object.keys(groupedData[domain]).sort();
            const totalInDomain = industries.reduce(
              (sum, ind) => sum + groupedData[domain][ind].length,
              0,
            );

            return (
              <div key={domain} className="expert-domain-group">
                <div
                  className="expert-domain-header"
                  onClick={() => toggleDomain(domain)}
                >
                  <div className="expert-domain-title">
                    {isDomainExpanded ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                    {getDomainIcon(domain)}
                    <span>{domain}</span>
                    <span className="expert-count-badge">{totalInDomain}</span>
                  </div>
                </div>

                {isDomainExpanded && (
                  <div className="expert-industries-container">
                    {industries.map((industry) => {
                      const key = `${domain}-${industry}`;
                      const isExpanded = expandedIndustries.has(key);
                      const experts = groupedData[domain][industry];

                      return (
                        <div key={key} className="expert-industry-group">
                          <div
                            className="expert-industry-header"
                            onClick={() => toggleIndustry(key)}
                          >
                            <div className="expert-industry-title">
                              {isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                              <Building2 size={16} />
                              <span>{industry}</span>
                              <span className="expert-count-badge small">
                                {experts.length}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="expert-roles-list">
                              {experts.map((config) => (
                                <div
                                  key={config.id}
                                  className={`expert-role-item ${!checkIsActive(config) ? "inactive" : ""}`}
                                >
                                  <div className="expert-role-avatar">
                                    {config.mediaUrl ? (
                                      <img src={config.mediaUrl} alt="" />
                                    ) : (
                                      <UserCog size={18} />
                                    )}
                                  </div>
                                  <div className="expert-role-info">
                                    <div className="expert-role-name">
                                      {config.jobRole}
                                    </div>
                                    {config.keywords && (
                                      <div className="expert-role-keywords">
                                        {config.keywords
                                          .split(",")
                                          .slice(0, 3)
                                          .map((kw, i) => (
                                            <span
                                              key={i}
                                              className="expert-keyword-tag"
                                            >
                                              {kw.trim()}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    className={`expert-status-badge ${checkIsActive(config) ? "active" : "inactive"}`}
                                  >
                                    {checkIsActive(config) ? "ON" : "OFF"}
                                  </span>
                                  <div className="expert-role-actions">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedConfig(config);
                                        setActiveModal("view");
                                      }}
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(config);
                                      }}
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedConfig(config);
                                        setActiveModal("delete");
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DOMAIN MODAL */}
      {activeModal === "domain" &&
        ReactDOM.createPortal(
          <div className="expert-modal-overlay" onClick={closeModal}>
            <div className="expert-modal" onClick={(e) => e.stopPropagation()}>
              <div className="expert-modal-header">
                <h2>
                  <Globe size={22} /> Tạo Domain Mới
                </h2>
                <button className="expert-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="expert-modal-body">
                <div className="expert-form-group">
                  <label>
                    <Globe size={16} /> Tên Domain{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    className="expert-input"
                    placeholder="VD: Information Technology, Healthcare, Finance..."
                    value={domainForm.name}
                    onChange={(e) =>
                      setDomainForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="expert-form-group">
                  <label>
                    <FileText size={16} /> Domain Rules (Prompt chung cho
                    domain)
                  </label>
                  <textarea
                    className="expert-textarea"
                    placeholder="Quy tắc và hướng dẫn chung cho tất cả experts trong domain này...&#10;&#10;VD: Trong lĩnh vực IT, luôn cập nhật công nghệ mới nhất, đề xuất các certifications phù hợp..."
                    value={domainForm.rules}
                    onChange={(e) =>
                      setDomainForm((p) => ({ ...p, rules: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="expert-modal-footer">
                <button className="expert-btn secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button
                  className="expert-btn success"
                  onClick={handleCreateDomain}
                >
                  Tạo Domain
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* INDUSTRY MODAL */}
      {activeModal === "industry" &&
        ReactDOM.createPortal(
          <div className="expert-modal-overlay" onClick={closeModal}>
            <div className="expert-modal" onClick={(e) => e.stopPropagation()}>
              <div className="expert-modal-header">
                <h2>
                  <Building2 size={22} /> Tạo Industry Mới
                </h2>
                <button className="expert-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="expert-modal-body">
                <div className="expert-form-group">
                  <label>
                    <Globe size={16} /> Chọn Domain{" "}
                    <span className="required">*</span>
                  </label>
                  <select
                    className="expert-select"
                    value={industryForm.domain}
                    onChange={(e) =>
                      setIndustryForm((p) => ({ ...p, domain: e.target.value }))
                    }
                  >
                    <option value="">-- Chọn Domain --</option>
                    {uniqueDomains.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    {domainForm.name &&
                      !uniqueDomains.includes(domainForm.name) && (
                        <option value={domainForm.name}>
                          {domainForm.name} (mới)
                        </option>
                      )}
                  </select>
                  <input
                    className="expert-input"
                    style={{ marginTop: "0.5rem" }}
                    placeholder="Hoặc nhập Domain mới..."
                    onChange={(e) =>
                      setIndustryForm((p) => ({ ...p, domain: e.target.value }))
                    }
                  />
                </div>
                <div className="expert-form-group">
                  <label>
                    <Building2 size={16} /> Tên Industry{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    className="expert-input"
                    placeholder="VD: Software Development, Marketing, Nursing..."
                    value={industryForm.name}
                    onChange={(e) =>
                      setIndustryForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="expert-modal-footer">
                <button className="expert-btn secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button
                  className="expert-btn success"
                  onClick={handleCreateIndustry}
                >
                  Tạo Industry
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* JOB ROLE MODAL */}
      {activeModal === "jobRole" &&
        ReactDOM.createPortal(
          <div className="expert-modal-overlay" onClick={closeModal}>
            <div
              className="expert-modal large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="expert-modal-header">
                <h2>
                  <UserCog size={22} /> Tạo Job Role Expert
                </h2>
                <button className="expert-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="expert-modal-body">
                <div className="expert-form-grid">
                  <div className="expert-form-group">
                    <label>
                      <Globe size={16} /> Domain{" "}
                      <span className="required">*</span>
                    </label>
                    <select
                      className="expert-select"
                      value={jobRoleForm.domain}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          domain: e.target.value,
                          industry: "",
                        }))
                      }
                    >
                      <option value="">-- Chọn Domain --</option>
                      {uniqueDomains.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      {[...domainRulesMap.keys()]
                        .filter((d) => !uniqueDomains.includes(d))
                        .map((d) => (
                          <option key={d} value={d}>
                            {d} (mới)
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="expert-form-group">
                    <label>
                      <Building2 size={16} /> Industry{" "}
                      <span className="required">*</span>
                    </label>
                    <select
                      className="expert-select"
                      value={jobRoleForm.industry}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          industry: e.target.value,
                        }))
                      }
                    >
                      <option value="">-- Chọn Industry --</option>
                      {jobRoleForm.domain &&
                        getIndustriesForDomain(jobRoleForm.domain).map((i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                    </select>
                    <input
                      className="expert-input"
                      style={{ marginTop: "0.5rem" }}
                      placeholder="Hoặc nhập Industry mới..."
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          industry: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group">
                    <label>
                      <UserCog size={16} /> Job Role{" "}
                      <span className="required">*</span>
                    </label>
                    <input
                      className="expert-input"
                      placeholder="VD: Backend Developer, Product Manager..."
                      value={jobRoleForm.jobRole}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          jobRole: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group">
                    <label>
                      <Image size={16} /> Media URL
                    </label>
                    <input
                      className="expert-input"
                      placeholder="URL hình ảnh"
                      value={jobRoleForm.mediaUrl}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          mediaUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group full-width">
                    <label>
                      <FileText size={16} /> Keywords
                    </label>
                    <input
                      className="expert-input"
                      placeholder="backend, java, spring boot, api..."
                      value={jobRoleForm.keywords}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          keywords: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group full-width">
                    <label>
                      <Brain size={16} /> Role Prompt (Prompt riêng cho vai trò
                      này)
                    </label>
                    <textarea
                      className="expert-textarea"
                      placeholder="Hướng dẫn chi tiết cho expert này...&#10;&#10;VD: Backend Developer cần tư vấn về API design, database optimization, microservices..."
                      value={jobRoleForm.rolePrompt}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          rolePrompt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group full-width">
                    <label>
                      <Brain size={16} /> System Prompt (Hoặc nhập đầy đủ)
                    </label>
                    <textarea
                      className="expert-textarea prompt"
                      placeholder="System prompt đầy đủ (nếu không dùng Domain Rules + Role Prompt)"
                      value={jobRoleForm.systemPrompt}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          systemPrompt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group">
                    <label>Trạng thái</label>
                    <div className="expert-toggle-wrapper">
                      <div
                        className={`expert-toggle ${jobRoleForm.isActive ? "active" : ""}`}
                        onClick={() =>
                          setJobRoleForm((p) => ({
                            ...p,
                            isActive: !p.isActive,
                          }))
                        }
                      />
                      <span className="expert-toggle-label">
                        {jobRoleForm.isActive ? "Hoạt động" : "Tắt"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="expert-modal-footer">
                <button className="expert-btn secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button
                  className="expert-btn success"
                  onClick={handleCreateJobRole}
                  disabled={formLoading}
                >
                  {formLoading ? "Đang tạo..." : "Tạo Expert"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* EDIT MODAL */}
      {activeModal === "edit" &&
        selectedConfig &&
        ReactDOM.createPortal(
          <div className="expert-modal-overlay" onClick={closeModal}>
            <div
              className="expert-modal large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="expert-modal-header">
                <h2>
                  <Edit3 size={22} /> Chỉnh sửa Expert
                </h2>
                <button className="expert-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="expert-modal-body">
                <div className="expert-form-grid">
                  <div className="expert-form-group">
                    <label>
                      <Globe size={16} /> Domain
                    </label>
                    <input
                      className="expert-input"
                      value={jobRoleForm.domain}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          domain: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group">
                    <label>
                      <Building2 size={16} /> Industry
                    </label>
                    <input
                      className="expert-input"
                      value={jobRoleForm.industry}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          industry: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group">
                    <label>
                      <UserCog size={16} /> Job Role
                    </label>
                    <input
                      className="expert-input"
                      value={jobRoleForm.jobRole}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          jobRole: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group">
                    <label>
                      <Image size={16} /> Media
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        className="expert-input"
                        style={{ flex: 1 }}
                        value={jobRoleForm.mediaUrl}
                        onChange={(e) =>
                          setJobRoleForm((p) => ({
                            ...p,
                            mediaUrl: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageUpload(f);
                        }}
                      />
                      <button
                        className="expert-btn secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="expert-form-group full-width">
                    <label>
                      <FileText size={16} /> Keywords
                    </label>
                    <input
                      className="expert-input"
                      value={jobRoleForm.keywords}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          keywords: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group full-width">
                    <label>
                      <Brain size={16} /> Role Prompt
                    </label>
                    <textarea
                      className="expert-textarea"
                      value={jobRoleForm.rolePrompt}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          rolePrompt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group full-width">
                    <label>
                      <Brain size={16} /> System Prompt
                    </label>
                    <textarea
                      className="expert-textarea prompt"
                      value={jobRoleForm.systemPrompt}
                      onChange={(e) =>
                        setJobRoleForm((p) => ({
                          ...p,
                          systemPrompt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="expert-form-group">
                    <label>Trạng thái</label>
                    <div className="expert-toggle-wrapper">
                      <div
                        className={`expert-toggle ${jobRoleForm.isActive ? "active" : ""}`}
                        onClick={() =>
                          setJobRoleForm((p) => ({
                            ...p,
                            isActive: !p.isActive,
                          }))
                        }
                      />
                      <span className="expert-toggle-label">
                        {jobRoleForm.isActive ? "Hoạt động" : "Tắt"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="expert-modal-footer">
                <button className="expert-btn secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button
                  className="expert-btn success"
                  onClick={handleUpdate}
                  disabled={formLoading}
                >
                  {formLoading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* VIEW MODAL */}
      {activeModal === "view" &&
        selectedConfig &&
        ReactDOM.createPortal(
          <div className="expert-modal-overlay" onClick={closeModal}>
            <div
              className="expert-modal large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="expert-modal-header">
                <h2>
                  <Eye size={22} /> Chi tiết Expert
                </h2>
                <button className="expert-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="expert-modal-body">
                <div className="expert-view-header">
                  <div className="expert-view-avatar">
                    {selectedConfig.mediaUrl ? (
                      <img src={selectedConfig.mediaUrl} alt="" />
                    ) : (
                      <UserCog size={32} />
                    )}
                  </div>
                  <div className="expert-view-info">
                    <h3>{selectedConfig.jobRole}</h3>
                    <p>
                      {selectedConfig.domain} → {selectedConfig.industry}
                    </p>
                    <span
                      className={`expert-status-badge ${checkIsActive(selectedConfig) ? "active" : "inactive"}`}
                    >
                      {checkIsActive(selectedConfig) ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {selectedConfig.keywords && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4
                      style={{
                        margin: "0 0 0.75rem",
                        color: "#67e8f9",
                        fontSize: "0.85rem",
                      }}
                    >
                      Keywords
                    </h4>
                    <div className="expert-keywords">
                      {selectedConfig.keywords.split(",").map((kw, i) => (
                        <span key={i} className="expert-keyword-tag">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedConfig.domainRules && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4
                      style={{
                        margin: "0 0 0.75rem",
                        color: "#67e8f9",
                        fontSize: "0.85rem",
                      }}
                    >
                      Domain Rules
                    </h4>
                    <div className="expert-prompt-full">
                      <pre>{selectedConfig.domainRules}</pre>
                    </div>
                  </div>
                )}

                {selectedConfig.rolePrompt && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4
                      style={{
                        margin: "0 0 0.75rem",
                        color: "#67e8f9",
                        fontSize: "0.85rem",
                      }}
                    >
                      Role Prompt
                    </h4>
                    <div className="expert-prompt-full">
                      <pre>{selectedConfig.rolePrompt}</pre>
                    </div>
                  </div>
                )}

                <div>
                  <h4
                    style={{
                      margin: "0 0 0.75rem",
                      color: "#67e8f9",
                      fontSize: "0.85rem",
                    }}
                  >
                    System Prompt
                  </h4>
                  <div className="expert-prompt-full">
                    <pre>{selectedConfig.systemPrompt}</pre>
                  </div>
                </div>
              </div>
              <div className="expert-modal-footer">
                <button className="expert-btn secondary" onClick={closeModal}>
                  Đóng
                </button>
                <button
                  className="expert-btn primary"
                  onClick={() => openEditModal(selectedConfig)}
                >
                  <Edit3 size={16} /> Sửa
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* DELETE MODAL */}
      {activeModal === "delete" &&
        selectedConfig &&
        ReactDOM.createPortal(
          <div className="expert-modal-overlay" onClick={closeModal}>
            <div className="expert-modal" onClick={(e) => e.stopPropagation()}>
              <div className="expert-modal-header">
                <h2>
                  <Trash2 size={22} /> Xác nhận xóa
                </h2>
                <button className="expert-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="expert-modal-body">
                <p style={{ color: "#e5e7eb", marginBottom: "1rem" }}>
                  Bạn có chắc muốn xóa Expert này?
                </p>
                <div className="expert-delete-warning">
                  <strong>{selectedConfig.jobRole}</strong>
                  <p>
                    {selectedConfig.domain} → {selectedConfig.industry}
                  </p>
                </div>
                <p style={{ color: "#f87171", fontSize: "0.9rem" }}>
                  ⚠️ Không thể hoàn tác!
                </p>
              </div>
              <div className="expert-modal-footer">
                <button className="expert-btn secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button
                  className="expert-btn danger"
                  onClick={handleDelete}
                  disabled={formLoading}
                >
                  {formLoading ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* AI GENERATE MODAL */}
      {activeModal === "aiGenerate" &&
        ReactDOM.createPortal(
          <div className="expert-modal-overlay" onClick={closeModal}>
            <div
              className="expert-modal ai-generate"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="expert-modal-header">
                <h2>
                  <Sparkles size={22} /> Tạo Expert bằng AI
                </h2>
                <button className="expert-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="expert-modal-body">
                {/* Step Indicator */}
                <div className="expert-ai-steps">
                  {[
                    { n: 1, label: "Thiết lập" },
                    { n: 2, label: "Sinh nháp" },
                    { n: 3, label: "Duyệt & Lưu" },
                  ].map((step) => (
                    <div
                      key={step.n}
                      className={`expert-ai-step ${aiStep === step.n ? "active" : ""} ${aiStep > step.n ? "completed" : ""}`}
                    >
                      <div className="expert-ai-step-number">
                        {aiStep > step.n ? "✓" : step.n}
                      </div>
                      <div className="expert-ai-step-label">{step.label}</div>
                    </div>
                  ))}
                </div>

                {/* Step 1: Configure */}
                {aiStep === 1 && (
                  <>
                    <div className="expert-form-grid">
                      <div className="expert-form-group">
                        <label>
                          <Globe size={16} /> Domain{" "}
                          <span className="required">*</span>
                        </label>
                        <select
                          className="expert-select"
                          value={aiForm.domain}
                          onChange={(e) =>
                            setAiForm((p) => ({
                              ...p,
                              domain: e.target.value,
                              industry: "",
                            }))
                          }
                        >
                          <option value="">-- Chọn Domain --</option>
                          {uniqueDomains.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="expert-form-group">
                        <label>
                          <Building2 size={16} /> Industry{" "}
                          <span className="required">*</span>
                        </label>
                        <select
                          className="expert-select"
                          value={aiForm.industry}
                          onChange={(e) =>
                            setAiForm((p) => ({
                              ...p,
                              industry: e.target.value,
                            }))
                          }
                        >
                          <option value="">-- Chọn Industry --</option>
                          {aiForm.domain &&
                            getIndustriesForDomain(aiForm.domain).map((i) => (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="expert-form-group">
                        <label>
                          <UserCog size={16} /> Job Role{" "}
                          <span className="required">*</span>
                        </label>
                        <input
                          className="expert-input"
                          placeholder="VD: Rust Developer, Data Product Manager..."
                          value={aiForm.jobRole}
                          onChange={(e) =>
                            setAiForm((p) => ({
                              ...p,
                              jobRole: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="expert-form-group">
                        <label>
                          <FileText size={16} /> Keywords
                        </label>
                        <input
                          className="expert-input"
                          placeholder="rust, systems programming, wasm..."
                          value={aiForm.keywords}
                          onChange={(e) =>
                            setAiForm((p) => ({
                              ...p,
                              keywords: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="expert-form-group full-width">
                        <label>
                          <Zap size={16} /> Gợi ý cho AI (Generation Hint)
                        </label>
                        <textarea
                          className="expert-textarea"
                          style={{ minHeight: "80px" }}
                          placeholder="VD: Phù hợp cho fresh graduate, tập trung vào cloud-native, dành cho senior level..."
                          value={aiForm.generationHint}
                          onChange={(e) =>
                            setAiForm((p) => ({
                              ...p,
                              generationHint: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    {aiForm.domain && domainRulesMap.get(aiForm.domain) && (
                      <div className="expert-reference-hint">
                        <strong>📋 Reference domainRules:</strong> Sẽ dùng làm
                        context khi sinh prompt cho domain này.
                      </div>
                    )}
                  </>
                )}

                {/* Step 2: Generating */}
                {aiStep === 2 && (
                  <div
                    className="expert-loading-state"
                    style={{ minHeight: "300px" }}
                  >
                    <MeowlKuruLoader size="large" text="" />
                    <p style={{ color: "#67e8f9", marginTop: "1rem" }}>
                      Đang sinh nội dung Expert bằng AI...
                    </p>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.85rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      Vui lòng chờ trong giây lát
                    </p>
                  </div>
                )}

                {/* Step 3: Review & Edit */}
                {aiStep === 3 && (
                  <>
                    <div className="expert-generated-grid">
                      <div
                        className={`expert-generated-section ${draftEdited.domainRules ? "edited" : ""}`}
                      >
                        <label>
                          <span>Domain Rules</span>
                          <span className="expert-word-count">
                            {
                              draftDomainRules.split(/\s+/).filter(Boolean)
                                .length
                            }{" "}
                            từ
                          </span>
                        </label>
                        <textarea
                          value={draftDomainRules}
                          onChange={(e) => {
                            setDraftDomainRules(e.target.value);
                            setDraftEdited((p) => ({
                              ...p,
                              domainRules: true,
                            }));
                          }}
                        />
                        {draftEdited.domainRules && (
                          <span className="expert-edited-badge">
                            Đã chỉnh sửa
                          </span>
                        )}
                      </div>

                      <div
                        className={`expert-generated-section ${draftEdited.rolePrompt ? "edited" : ""}`}
                      >
                        <label>
                          <span>Role Prompt</span>
                          <span className="expert-word-count">
                            {
                              draftRolePrompt.split(/\s+/).filter(Boolean)
                                .length
                            }{" "}
                            từ
                          </span>
                        </label>
                        <textarea
                          value={draftRolePrompt}
                          onChange={(e) => {
                            setDraftRolePrompt(e.target.value);
                            setDraftEdited((p) => ({ ...p, rolePrompt: true }));
                          }}
                        />
                        {draftEdited.rolePrompt && (
                          <span className="expert-edited-badge">
                            Đã chỉnh sửa
                          </span>
                        )}
                      </div>
                    </div>

                    {generatedDraft?.suggestedKeywords && (
                      <div className="expert-keywords-preview">
                        <span className="expert-keywords-label">
                          Keywords gợi ý:
                        </span>
                        {generatedDraft.suggestedKeywords
                          .split(",")
                          .map((kw, i) => (
                            <span key={i} className="expert-keyword-tag">
                              {kw.trim()}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Full Preview */}
                    <div className="expert-preview-section">
                      <label>
                        <Eye size={14} /> Preview System Prompt (đầy đủ)
                      </label>
                      <div className="expert-preview-box">
                        <pre>{buildSystemPromptPreview()}</pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="expert-modal-footer">
                <button className="expert-btn secondary" onClick={closeModal}>
                  Hủy
                </button>
                {aiStep > 1 && (
                  <button
                    className="expert-btn secondary"
                    onClick={() => setAiStep((s) => (s - 1) as 1 | 2 | 3)}
                  >
                    ← Quay lại
                  </button>
                )}
                {aiStep === 1 && (
                  <button
                    className="expert-btn primary"
                    onClick={handleAiGenerate}
                    disabled={
                      aiGenerating ||
                      !aiForm.domain ||
                      !aiForm.industry ||
                      !aiForm.jobRole
                    }
                  >
                    {aiGenerating ? "Đang xử lý..." : "Tiếp tục →"}
                  </button>
                )}
                {aiStep === 3 && (
                  <>
                    <button
                      className="expert-btn secondary"
                      onClick={handleAiGenerate}
                      disabled={aiGenerating}
                    >
                      <Sparkles size={16} /> Tạo lại
                    </button>
                    <button
                      className="expert-btn success"
                      onClick={handleAiApprove}
                      disabled={formLoading}
                    >
                      {formLoading ? "Đang lưu..." : "Lưu Expert Config"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default AIExpertManagementTab;
