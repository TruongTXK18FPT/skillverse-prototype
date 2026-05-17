import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileCheck2,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Send,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppToast } from "../../context/ToastContext";
import { careerTaxonomyService } from "../../services/careerTaxonomyService";
import roadmapPackageService from "../../services/roadmapPackageService";
import { listCoursesByAuthor } from "../../services/courseService";
import type { CourseSummaryDTO } from "../../data/courseDTOs";
import type {
  Domain,
  ImportanceLevel,
  JobPosition,
  JobPositionTrack,
  JobPositionTrackSkill,
  RequirementType,
} from "../../types/careerTaxonomy";
import type {
  RoadmapOfferingRequest,
  RoadmapOfferingResponse,
  RoadmapOfferingStatus,
  RoadmapTemplateNodeRequest,
  RoadmapTemplateRequest,
  RoadmapTemplateResponse,
  RoadmapTemplateStatus,
} from "../../types/roadmapPackage";
import "./MentorRoadmapPackagesTab.css";

type NodeDraft = RoadmapTemplateNodeRequest & {
  localId: string;
};

type TemplateForm = {
  editingId?: number;
  title: string;
  description: string;
  domainId: string;
  jobPositionId: string;
  jobPositionTrackId: string;
  targetRole: string;
  targetLevel: string;
  nodes: NodeDraft[];
  courseIds: string[];
};

type OfferingForm = {
  editingId?: number;
  templateId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  maxStudents: string;
};

const emptyNode = (index: number): NodeDraft => ({
  localId: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
  title: "",
  description: "",
  orderIndex: index,
  requirementType: "REQUIRED",
  importanceLevel: "MEDIUM",
  difficulty: "trung bình",
  estimatedHours: 4,
  expectedOutput: "",
  rubric: "",
});

const emptyTemplateForm = (): TemplateForm => ({
  title: "",
  description: "",
  domainId: "",
  jobPositionId: "",
  jobPositionTrackId: "",
  targetRole: "",
  targetLevel: "",
  nodes: [emptyNode(1)],
  courseIds: [],
});

const emptyOfferingForm = (): OfferingForm => ({
  templateId: "",
  title: "",
  description: "",
  price: "",
  currency: "VND",
  maxStudents: "",
});

const getApiErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const toNumberOrNull = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toSlug = (value: string, fallback: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
};

const formatCurrency = (value?: number | string | null, currency = "VND") => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const statusClass = (status: string) => status.toLowerCase().replace(/_/g, "-");

const templateStatusLabel: Record<RoadmapTemplateStatus, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  ARCHIVED: "Đã lưu trữ",
};

const offeringStatusLabel: Record<RoadmapOfferingStatus, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang bán",
  PAUSED: "Tạm dừng",
  ARCHIVED: "Đã lưu trữ",
};

const courseStatusLabel: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  PUBLIC: "Công khai",
  ARCHIVED: "Đã lưu trữ",
  REJECTED: "Bị từ chối",
  SUSPENDED: "Tạm khóa",
};

const MentorRoadmapPackagesTab = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useAppToast();
  const [templates, setTemplates] = useState<RoadmapTemplateResponse[]>([]);
  const [offerings, setOfferings] = useState<RoadmapOfferingResponse[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [tracks, setTracks] = useState<JobPositionTrack[]>([]);
  const [trackSkills, setTrackSkills] = useState<JobPositionTrackSkill[]>([]);
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingOffering, setSavingOffering] = useState(false);
  const [templateActionId, setTemplateActionId] = useState<number | null>(null);
  const [offeringActionId, setOfferingActionId] = useState<number | null>(null);
  const [templateForm, setTemplateForm] =
    useState<TemplateForm>(emptyTemplateForm);
  const [offeringForm, setOfferingForm] =
    useState<OfferingForm>(emptyOfferingForm);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const [templateData, offeringData] = await Promise.all([
        roadmapPackageService.getMyTemplates(),
        roadmapPackageService.getMyOfferings(),
      ]);
      setTemplates(templateData);
      setOfferings(offeringData);
    } catch (error) {
      showError(
        "Không thể tải gói roadmap",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        const [domainData, coursePage] = await Promise.all([
          careerTaxonomyService.getActiveDomains(),
          user?.id
            ? listCoursesByAuthor(user.id, 0, 60).catch(() => ({
                content: [],
                page: 0,
                size: 0,
                totalElements: 0,
                totalPages: 0,
                first: true,
                last: true,
                empty: true,
              }))
            : Promise.resolve({
                content: [],
                page: 0,
                size: 0,
                totalElements: 0,
                totalPages: 0,
                first: true,
                last: true,
                empty: true,
              }),
        ]);
        setDomains(domainData);
        setCourses(coursePage.content ?? []);
      } catch (error) {
        showError(
          "Không thể tải tùy chọn",
          getApiErrorMessage(error, "Taxonomy hoặc khóa học chưa sẵn sàng."),
        );
      }
    };
    void loadInitialOptions();
  }, [showError, user?.id]);

  const approvedTemplates = useMemo(
    () => templates.filter((template) => template.status === "APPROVED"),
    [templates],
  );

  const templateStats = useMemo(
    () => ({
      draft: templates.filter((item) => item.status === "DRAFT").length,
      submitted: templates.filter((item) => item.status === "SUBMITTED").length,
      approved: approvedTemplates.length,
    }),
    [approvedTemplates.length, templates],
  );

  const offeringStats = useMemo(
    () => ({
      draft: offerings.filter((item) => item.status === "DRAFT").length,
      active: offerings.filter((item) => item.status === "ACTIVE").length,
      paused: offerings.filter((item) => item.status === "PAUSED").length,
    }),
    [offerings],
  );

  const handleDomainChange = async (domainId: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      domainId,
      jobPositionId: "",
      jobPositionTrackId: "",
    }));
    setJobPositions([]);
    setTracks([]);
    setTrackSkills([]);

    const parsedDomainId = toNumberOrNull(domainId);
    if (!parsedDomainId) return;

    setTaxonomyLoading(true);
    try {
      const data = await careerTaxonomyService.getActiveJobPositions(
        parsedDomainId,
      );
      setJobPositions(data);
    } catch (error) {
      showError(
        "Không thể tải vị trí công việc",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setTaxonomyLoading(false);
    }
  };

  const handleJobPositionChange = async (jobPositionId: string) => {
    const selectedJob = jobPositions.find(
      (job) => job.id === Number(jobPositionId),
    );
    setTemplateForm((prev) => ({
      ...prev,
      jobPositionId,
      jobPositionTrackId: "",
      targetRole: selectedJob?.name || prev.targetRole,
      targetRoleSnapshot: selectedJob?.name || prev.targetRole,
    } as TemplateForm));
    setTracks([]);
    setTrackSkills([]);

    const parsedJobId = toNumberOrNull(jobPositionId);
    if (!parsedJobId) return;

    setTaxonomyLoading(true);
    try {
      const data = await careerTaxonomyService.getActiveTracks(parsedJobId);
      setTracks(data);
    } catch (error) {
      showError(
        "Không thể tải track",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setTaxonomyLoading(false);
    }
  };

  const handleTrackChange = async (trackId: string) => {
    const selectedTrack = tracks.find((track) => track.id === Number(trackId));
    setTemplateForm((prev) => ({
      ...prev,
      jobPositionTrackId: trackId,
      targetLevel: selectedTrack?.targetLevel || prev.targetLevel,
    }));
    setTrackSkills([]);

    const parsedTrackId = toNumberOrNull(trackId);
    if (!parsedTrackId) return;

    setTaxonomyLoading(true);
    try {
      const skills = await careerTaxonomyService.getTrackSkills(parsedTrackId);
      setTrackSkills(skills.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      showError(
        "Không thể tải track skills",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setTaxonomyLoading(false);
    }
  };

  const updateNode = <K extends keyof NodeDraft>(
    localId: string,
    field: K,
    value: NodeDraft[K],
  ) => {
    setTemplateForm((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.localId === localId ? { ...node, [field]: value } : node,
      ),
    }));
  };

  const addNode = () => {
    setTemplateForm((prev) => ({
      ...prev,
      nodes: [...prev.nodes, emptyNode(prev.nodes.length + 1)],
    }));
  };

  const removeNode = (localId: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      nodes: prev.nodes
        .filter((node) => node.localId !== localId)
        .map((node, index) => ({ ...node, orderIndex: index + 1 })),
    }));
  };

  const autofillFromTrack = () => {
    if (trackSkills.length === 0) {
      showInfo("Chưa có track skills", "Hãy chọn track có skill mapping trước.");
      return;
    }

    const selectedJob = jobPositions.find(
      (job) => job.id === Number(templateForm.jobPositionId),
    );
    const selectedTrack = tracks.find(
      (track) => track.id === Number(templateForm.jobPositionTrackId),
    );

    setTemplateForm((prev) => ({
      ...prev,
      title:
        prev.title ||
        `${selectedJob?.name || "Track kỹ năng"} - ${selectedTrack?.targetLevel || "Roadmap"}`,
      description:
        prev.description ||
        selectedTrack?.description ||
        "Gói roadmap có mentor đồng hành được tạo từ taxonomy nghề nghiệp.",
      targetRole: selectedJob?.name || prev.targetRole,
      targetLevel: selectedTrack?.targetLevel || prev.targetLevel,
      nodes: trackSkills.map((skill, index) => ({
        localId: `${skill.skillId}-${index}-${Date.now()}`,
        nodeKey: toSlug(skill.canonicalKey || skill.skillName, `node-${index + 1}`),
        title: skill.skillName,
        description: `Thành thạo ${skill.skillName} thông qua mentor đánh giá và sản phẩm thực hành.`,
        orderIndex: index + 1,
        skillId: skill.skillId,
        skillNameSnapshot: skill.skillName,
        skillCanonicalKeySnapshot: skill.canonicalKey,
        requirementType: skill.requirementType,
        importanceLevel: skill.importanceLevel,
        difficulty: index < 2 ? "cơ bản" : index < 5 ? "trung bình" : "nâng cao",
        estimatedHours:
          skill.importanceLevel === "CRITICAL"
            ? 10
            : skill.importanceLevel === "HIGH"
              ? 8
              : 5,
        expectedOutput: `Sản phẩm thể hiện ${skill.skillName} và sẵn sàng đưa vào portfolio.`,
        rubric:
          "Mentor xác minh độ chính xác kiến thức, mức hoàn thiện thực hành và chất lượng phản tư.",
      })),
    }));
  };

  const selectCourse = (courseId: number, checked: boolean) => {
    setTemplateForm((prev) => ({
      ...prev,
      courseIds: checked
        ? Array.from(new Set([...prev.courseIds, String(courseId)]))
        : prev.courseIds.filter((id) => id !== String(courseId)),
    }));
  };

  const buildTemplatePayload = (): RoadmapTemplateRequest => {
    const nodes = templateForm.nodes
      .filter((node) => node.title.trim())
      .map((node, index) => ({
        nodeKey: node.nodeKey || toSlug(node.title, `node-${index + 1}`),
        title: node.title.trim(),
        description: node.description?.trim() || undefined,
        orderIndex: index + 1,
        skillId: node.skillId || undefined,
        skillNameSnapshot: node.skillNameSnapshot?.trim() || undefined,
        skillCanonicalKeySnapshot:
          node.skillCanonicalKeySnapshot?.trim() || undefined,
        requirementType: node.requirementType || "REQUIRED",
        importanceLevel: node.importanceLevel || "MEDIUM",
        difficulty: node.difficulty?.trim() || "trung bình",
        estimatedHours:
          node.estimatedHours != null && Number(node.estimatedHours) > 0
            ? Number(node.estimatedHours)
            : undefined,
        expectedOutput: node.expectedOutput?.trim() || undefined,
        rubric: node.rubric?.trim() || undefined,
      }));

    return {
      domainId: toNumberOrNull(templateForm.domainId),
      jobPositionId: toNumberOrNull(templateForm.jobPositionId),
      jobPositionTrackId: toNumberOrNull(templateForm.jobPositionTrackId),
      title: templateForm.title.trim(),
      description: templateForm.description.trim() || undefined,
      targetRole: templateForm.targetRole.trim() || undefined,
      targetLevel: templateForm.targetLevel.trim() || undefined,
      targetRoleSnapshot: templateForm.targetRole.trim() || undefined,
      targetLevelSnapshot: templateForm.targetLevel.trim() || undefined,
      nodes,
      courses: templateForm.courseIds
        .map((id, index) => ({
          courseId: Number(id),
          displayOrder: index + 1,
          required: true,
        }))
        .filter((course) => Number.isFinite(course.courseId)),
    };
  };

  const saveTemplate = async () => {
    if (!templateForm.title.trim()) {
      showError("Thiếu tiêu đề", "Template cần có tiêu đề.");
      return;
    }
    if (templateForm.nodes.filter((node) => node.title.trim()).length === 0) {
      showError("Thiếu node", "Template cần ít nhất một mốc học tập.");
      return;
    }

    setSavingTemplate(true);
    try {
      const payload = buildTemplatePayload();
      const saved = templateForm.editingId
        ? await roadmapPackageService.updateTemplate(
            templateForm.editingId,
            payload,
          )
        : await roadmapPackageService.createTemplate(payload);
      showSuccess(
        templateForm.editingId ? "Đã cập nhật template" : "Đã tạo template",
        "Bạn có thể gửi template để admin duyệt.",
      );
      await loadPackages();
      editTemplate(saved);
    } catch (error) {
      showError(
        "Lưu template thất bại",
        getApiErrorMessage(error, "Kiểm tra dữ liệu và thử lại."),
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const editTemplate = (template: RoadmapTemplateResponse) => {
    setTemplateForm({
      editingId: template.id,
      title: template.title || "",
      description: template.description || "",
      domainId: template.domainId ? String(template.domainId) : "",
      jobPositionId: template.jobPositionId ? String(template.jobPositionId) : "",
      jobPositionTrackId: template.jobPositionTrackId
        ? String(template.jobPositionTrackId)
        : "",
      targetRole: template.targetRole || template.targetRoleSnapshot || "",
      targetLevel: template.targetLevel || template.targetLevelSnapshot || "",
      nodes:
        template.nodes?.length > 0
          ? template.nodes.map((node, index) => ({
              ...node,
              localId: `saved-${node.id}`,
              orderIndex: index + 1,
            }))
          : [emptyNode(1)],
      courseIds:
        template.courses?.map((course) => String(course.courseId)) ?? [],
    });
  };

  const submitTemplate = async (template: RoadmapTemplateResponse) => {
    setTemplateActionId(template.id);
    try {
      await roadmapPackageService.submitTemplate(template.id);
      showSuccess("Đã gửi duyệt", "Template đã vào hàng đợi admin duyệt.");
      await loadPackages();
    } catch (error) {
      showError(
        "Gửi duyệt thất bại",
        getApiErrorMessage(error, "Template cần ít nhất một node."),
      );
    } finally {
      setTemplateActionId(null);
    }
  };

  const buildOfferingPayload = (): RoadmapOfferingRequest => ({
    templateId: Number(offeringForm.templateId),
    title: offeringForm.title.trim(),
    description: offeringForm.description.trim() || undefined,
    price: Number(offeringForm.price),
    currency: offeringForm.currency.trim() || "VND",
    maxStudents: toNumberOrNull(offeringForm.maxStudents),
  });

  const saveOffering = async () => {
    if (!offeringForm.templateId || !offeringForm.title.trim()) {
      showError("Thiếu dữ liệu", "Gói bán cần template APPROVED và tiêu đề.");
      return;
    }
    if (!Number.isFinite(Number(offeringForm.price)) || Number(offeringForm.price) < 0) {
      showError("Giá không hợp lệ", "Giá gói phải lớn hơn hoặc bằng 0.");
      return;
    }

    setSavingOffering(true);
    try {
      const payload = buildOfferingPayload();
      const saved = offeringForm.editingId
        ? await roadmapPackageService.updateOffering(
            offeringForm.editingId,
            payload,
          )
        : await roadmapPackageService.createOffering(payload);
      showSuccess(
        offeringForm.editingId ? "Đã cập nhật gói bán" : "Đã tạo gói bán",
        "Đăng bán gói này để học viên có thể mua.",
      );
      await loadPackages();
      setOfferingForm({
        editingId: saved.id,
        templateId: String(saved.templateId),
        title: saved.title,
        description: saved.description || "",
        price: String(saved.price),
        currency: saved.currency || "VND",
        maxStudents: saved.maxStudents ? String(saved.maxStudents) : "",
      });
    } catch (error) {
      showError(
        "Lưu gói bán thất bại",
        getApiErrorMessage(error, "Chỉ template APPROVED mới tạo được gói bán."),
      );
    } finally {
      setSavingOffering(false);
    }
  };

  const editOffering = (offering: RoadmapOfferingResponse) => {
    setOfferingForm({
      editingId: offering.id,
      templateId: String(offering.templateId),
      title: offering.title,
      description: offering.description || "",
      price: String(offering.price),
      currency: offering.currency || "VND",
      maxStudents: offering.maxStudents ? String(offering.maxStudents) : "",
    });
  };

  const publishOffering = async (offering: RoadmapOfferingResponse) => {
    setOfferingActionId(offering.id);
    try {
      await roadmapPackageService.publishOffering(offering.id);
      showSuccess("Đã đăng bán", "Học viên có thể thấy và mua gói này.");
      await loadPackages();
    } catch (error) {
      showError(
        "Đăng bán thất bại",
        getApiErrorMessage(error, "Template phải được admin APPROVED."),
      );
    } finally {
      setOfferingActionId(null);
    }
  };

  const pauseOffering = async (offering: RoadmapOfferingResponse) => {
    setOfferingActionId(offering.id);
    try {
      await roadmapPackageService.pauseOffering(offering.id);
      showSuccess("Đã tạm dừng", "Gói bán không còn hiển thị trên marketplace.");
      await loadPackages();
    } catch (error) {
      showError(
        "Tạm dừng thất bại",
        getApiErrorMessage(error, "Vui lòng thử lại."),
      );
    } finally {
      setOfferingActionId(null);
    }
  };

  return (
    <div className="mentor-rp">
      <section className="mentor-rp__hero">
        <div>
          <span className="mentor-rp__eyebrow">
            <Rocket size={18} />
            Trình tạo gói roadmap
          </span>
          <h1>Bán gói roadmap có mentor đồng hành</h1>
          <p>
            Tạo template từ taxonomy, gửi cho admin duyệt, sau đó đăng bán gói
            để học viên mua trực tiếp bằng ví.
          </p>
        </div>
        <button
          type="button"
          className="mentor-rp__refresh"
          onClick={() => void loadPackages()}
          disabled={loading}
          title="Tải lại"
        >
          {loading ? <Loader2 className="mentor-rp__spin" size={18} /> : <RefreshCw size={18} />}
        </button>
      </section>

      <div className="mentor-rp__stats">
        <div>
          <strong>{templateStats.draft}</strong>
          <span>Template nháp</span>
        </div>
        <div>
          <strong>{templateStats.submitted}</strong>
          <span>Đang chờ duyệt</span>
        </div>
        <div>
          <strong>{templateStats.approved}</strong>
          <span>Đã duyệt</span>
        </div>
        <div>
          <strong>{offeringStats.active}</strong>
          <span>Gói đang bán</span>
        </div>
      </div>

      <div className="mentor-rp__layout">
        <section className="mentor-rp__builder">
          <div className="mentor-rp__section-head">
            <div>
              <h2>{templateForm.editingId ? "Sửa template" : "Tạo template"}</h2>
              <p>Template APPROVED/ARCHIVED không thể sửa từ backend.</p>
            </div>
            <button
              type="button"
              className="mentor-rp__ghost-btn"
              onClick={() => {
                setTemplateForm(emptyTemplateForm());
                setTrackSkills([]);
              }}
            >
              <Plus size={16} />
              Template mới
            </button>
          </div>

          <div className="mentor-rp__form-grid">
            <label>
              <span>Tiêu đề</span>
              <input
                value={templateForm.title}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Frontend Developer Junior Roadmap"
              />
            </label>
            <label>
              <span>Vai trò mục tiêu</span>
              <input
                value={templateForm.targetRole}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    targetRole: e.target.value,
                  }))
                }
                placeholder="Frontend Developer"
              />
            </label>
            <label>
              <span>Domain</span>
              <select
                value={templateForm.domainId}
                onChange={(e) => void handleDomainChange(e.target.value)}
              >
                <option value="">Chọn domain</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Vị trí công việc</span>
              <select
                value={templateForm.jobPositionId}
                onChange={(e) => void handleJobPositionChange(e.target.value)}
              >
                <option value="">Chọn job</option>
                {jobPositions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Track</span>
              <select
                value={templateForm.jobPositionTrackId}
                onChange={(e) => void handleTrackChange(e.target.value)}
              >
                <option value="">Chọn track</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name} ({track.targetLevel})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Cấp độ mục tiêu</span>
              <input
                value={templateForm.targetLevel}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    targetLevel: e.target.value,
                  }))
                }
                placeholder="JUNIOR"
              />
            </label>
          </div>

          <label className="mentor-rp__wide-field">
            <span>Mô tả</span>
            <textarea
              rows={3}
              value={templateForm.description}
              onChange={(e) =>
                setTemplateForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Mô tả mục tiêu, outcome và cách mentor đồng hành."
            />
          </label>

          <div className="mentor-rp__node-toolbar">
            <div>
              <h3>Milestone</h3>
              <p>
                {trackSkills.length > 0
                  ? `${trackSkills.length} skill từ taxonomy đã sẵn sàng tự điền.`
                  : "Nhập node thủ công hoặc chọn taxonomy track."}
              </p>
            </div>
            <div>
              <button
                type="button"
                className="mentor-rp__ghost-btn"
                onClick={autofillFromTrack}
                disabled={taxonomyLoading}
              >
                {taxonomyLoading ? <Loader2 className="mentor-rp__spin" size={15} /> : <Layers3 size={15} />}
                Tự điền
              </button>
              <button
                type="button"
                className="mentor-rp__ghost-btn"
                onClick={addNode}
              >
                <Plus size={15} />
                Thêm node
              </button>
            </div>
          </div>

          <div className="mentor-rp__nodes">
            {templateForm.nodes.map((node, index) => (
              <article className="mentor-rp__node" key={node.localId}>
                <div className="mentor-rp__node-index">{index + 1}</div>
                <div className="mentor-rp__node-body">
                  <div className="mentor-rp__node-grid">
                    <label>
                      <span>Tiêu đề node</span>
                      <input
                        value={node.title}
                        onChange={(e) =>
                          updateNode(node.localId, "title", e.target.value)
                        }
                        placeholder="Xây dựng UI responsive"
                      />
                    </label>
                    <label>
                      <span>Tên skill</span>
                      <input
                        value={node.skillNameSnapshot || ""}
                        onChange={(e) =>
                          updateNode(
                            node.localId,
                            "skillNameSnapshot",
                            e.target.value,
                          )
                        }
                        placeholder="React"
                      />
                    </label>
                    <label>
                      <span>Yêu cầu</span>
                      <select
                        value={node.requirementType || "REQUIRED"}
                        onChange={(e) =>
                          updateNode(
                            node.localId,
                            "requirementType",
                            e.target.value as RequirementType,
                          )
                        }
                      >
                        <option value="REQUIRED">Bắt buộc</option>
                        <option value="OPTIONAL">Tùy chọn</option>
                      </select>
                    </label>
                    <label>
                      <span>Mức quan trọng</span>
                      <select
                        value={node.importanceLevel || "MEDIUM"}
                        onChange={(e) =>
                          updateNode(
                            node.localId,
                            "importanceLevel",
                            e.target.value as ImportanceLevel,
                          )
                        }
                      >
                        <option value="LOW">Thấp</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                        <option value="CRITICAL">Rất quan trọng</option>
                      </select>
                    </label>
                    <label>
                      <span>Độ khó</span>
                      <input
                        value={node.difficulty || ""}
                        onChange={(e) =>
                          updateNode(node.localId, "difficulty", e.target.value)
                        }
                        placeholder="trung bình"
                      />
                    </label>
                    <label>
                      <span>Số giờ</span>
                      <input
                        type="number"
                        min={0}
                        value={node.estimatedHours ?? ""}
                        onChange={(e) =>
                          updateNode(
                            node.localId,
                            "estimatedHours",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </label>
                  </div>
                  <label className="mentor-rp__wide-field">
                    <span>Mô tả</span>
                    <textarea
                      rows={2}
                      value={node.description || ""}
                      onChange={(e) =>
                        updateNode(node.localId, "description", e.target.value)
                      }
                    />
                  </label>
                  <div className="mentor-rp__node-grid mentor-rp__node-grid--wide">
                    <label>
                      <span>Sản phẩm kỳ vọng</span>
                      <textarea
                        rows={2}
                        value={node.expectedOutput || ""}
                        onChange={(e) =>
                          updateNode(
                            node.localId,
                            "expectedOutput",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Rubric</span>
                      <textarea
                        rows={2}
                        value={node.rubric || ""}
                        onChange={(e) =>
                          updateNode(node.localId, "rubric", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  className="mentor-rp__danger-icon"
                  onClick={() => removeNode(node.localId)}
                  disabled={templateForm.nodes.length === 1}
                  title="Xóa node"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>

          {courses.length > 0 && (
            <section className="mentor-rp__course-picker">
              <div className="mentor-rp__section-head">
                <div>
                  <h3>Gắn khóa học của mentor</h3>
                  <p>Khóa học sẽ được gửi lên backend ở cấp template.</p>
                </div>
              </div>
              <div className="mentor-rp__course-list">
                {courses.slice(0, 10).map((course) => (
                  <label key={course.id} className="mentor-rp__course-option">
                    <input
                      type="checkbox"
                      checked={templateForm.courseIds.includes(String(course.id))}
                      onChange={(e) => selectCourse(course.id, e.target.checked)}
                    />
                    <span>{course.title}</span>
                    <small>{courseStatusLabel[course.status] || course.status}</small>
                  </label>
                ))}
              </div>
            </section>
          )}

          <div className="mentor-rp__actions">
            <button
              type="button"
              className="mentor-rp__primary-btn"
              onClick={() => void saveTemplate()}
              disabled={savingTemplate}
            >
              {savingTemplate ? <Loader2 className="mentor-rp__spin" size={17} /> : <Save size={17} />}
              Lưu template
            </button>
          </div>
        </section>

        <aside className="mentor-rp__side">
          <section className="mentor-rp__panel">
            <div className="mentor-rp__section-head">
              <div>
                <h2>Template của tôi</h2>
                <p>Danh sách nháp, chờ duyệt và đã duyệt.</p>
              </div>
              <ClipboardList size={20} />
            </div>

            <div className="mentor-rp__list">
              {loading ? (
                <div className="mentor-rp__mini-loading">
                  <Loader2 className="mentor-rp__spin" />
                  Đang tải...
                </div>
              ) : templates.length === 0 ? (
                <div className="mentor-rp__empty">
                  <AlertCircle size={22} />
                  <span>Chưa có template nào.</span>
                </div>
              ) : (
                templates.map((template) => (
                  <article className="mentor-rp__template-card" key={template.id}>
                    <div>
                      <span className={`mentor-rp__status mentor-rp__status--${statusClass(template.status)}`}>
                        {templateStatusLabel[template.status]}
                      </span>
                      <small>#{template.id}</small>
                    </div>
                    <h3>{template.title}</h3>
                    <p>{template.nodes?.length ?? 0} node</p>
                    <div className="mentor-rp__compact-actions">
                      <button type="button" onClick={() => editTemplate(template)}>
                        <Eye size={15} />
                        Sửa
                      </button>
                      {template.status !== "SUBMITTED" &&
                        template.status !== "APPROVED" &&
                        template.status !== "ARCHIVED" && (
                          <button
                            type="button"
                            onClick={() => void submitTemplate(template)}
                            disabled={templateActionId === template.id}
                          >
                            {templateActionId === template.id ? (
                              <Loader2 className="mentor-rp__spin" size={15} />
                            ) : (
                              <Send size={15} />
                            )}
                            Gửi duyệt
                          </button>
                        )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="mentor-rp__panel">
            <div className="mentor-rp__section-head">
              <div>
                <h2>{offeringForm.editingId ? "Sửa gói bán" : "Tạo gói bán"}</h2>
                <p>Chỉ template APPROVED mới được đăng bán.</p>
              </div>
              <WalletCards size={20} />
            </div>

            <div className="mentor-rp__offering-form">
              <label>
                <span>Template đã duyệt</span>
                <select
                  value={offeringForm.templateId}
                  onChange={(e) => {
                    const template = approvedTemplates.find(
                      (item) => item.id === Number(e.target.value),
                    );
                    setOfferingForm((prev) => ({
                      ...prev,
                      templateId: e.target.value,
                      title: prev.title || template?.title || "",
                      description: prev.description || template?.description || "",
                    }));
                  }}
                >
                  <option value="">Chọn template</option>
                  {approvedTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tiêu đề</span>
                <input
                  value={offeringForm.title}
                  onChange={(e) =>
                    setOfferingForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Giá</span>
                <input
                  type="number"
                  min={0}
                  value={offeringForm.price}
                  onChange={(e) =>
                    setOfferingForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="1200000"
                />
              </label>
              <label>
                <span>Số học viên tối đa</span>
                <input
                  type="number"
                  min={1}
                  value={offeringForm.maxStudents}
                  onChange={(e) =>
                    setOfferingForm((prev) => ({
                      ...prev,
                      maxStudents: e.target.value,
                    }))
                  }
                  placeholder="Tùy chọn"
                />
              </label>
              <label className="mentor-rp__wide-field">
                <span>Mô tả</span>
                <textarea
                  rows={3}
                  value={offeringForm.description}
                  onChange={(e) =>
                    setOfferingForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="mentor-rp__primary-btn"
                onClick={() => void saveOffering()}
                disabled={savingOffering}
              >
                {savingOffering ? <Loader2 className="mentor-rp__spin" size={17} /> : <FileCheck2 size={17} />}
                Lưu gói bán
              </button>
            </div>
          </section>

          <section className="mentor-rp__panel">
            <div className="mentor-rp__section-head">
              <div>
                <h2>Gói bán</h2>
                <p>
                  {offeringStats.draft} nháp, {offeringStats.active} đang bán,{" "}
                  {offeringStats.paused} tạm dừng
                </p>
              </div>
              <BadgeCheck size={20} />
            </div>
            <div className="mentor-rp__list">
              {offerings.length === 0 ? (
                <div className="mentor-rp__empty">
                  <BookOpen size={22} />
                  <span>Chưa có gói bán nào.</span>
                </div>
              ) : (
                offerings.map((offering) => (
                  <article className="mentor-rp__template-card" key={offering.id}>
                    <div>
                      <span className={`mentor-rp__status mentor-rp__status--${statusClass(offering.status)}`}>
                        {offeringStatusLabel[offering.status]}
                      </span>
                      <small>#{offering.id}</small>
                    </div>
                    <h3>{offering.title}</h3>
                    <p>{formatCurrency(offering.price, offering.currency)}</p>
                    <div className="mentor-rp__compact-actions">
                      <button type="button" onClick={() => editOffering(offering)}>
                        <Eye size={15} />
                        Sửa
                      </button>
                      {offering.status !== "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => void publishOffering(offering)}
                          disabled={offeringActionId === offering.id}
                        >
                          {offeringActionId === offering.id ? (
                            <Loader2 className="mentor-rp__spin" size={15} />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                          Đăng bán
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void pauseOffering(offering)}
                          disabled={offeringActionId === offering.id}
                        >
                          {offeringActionId === offering.id ? (
                            <Loader2 className="mentor-rp__spin" size={15} />
                          ) : (
                            <AlertCircle size={15} />
                          )}
                          Tạm dừng
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MentorRoadmapPackagesTab;
