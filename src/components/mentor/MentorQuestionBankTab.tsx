import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileJson,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import SkillAutoResolve from "../shared/SkillAutoResolve";
import { useToast } from "../../hooks/useToast";
import {
  createQuestionBankSubmission,
  getMyQuestionBankSubmission,
  getMyQuestionBankSubmissions,
} from "../../services/questionBankService";
import {
  CreateQuestion,
  CreateQuestionBankSubmission,
  QuestionBankSubmission,
} from "../../data/questionBankDTOs";
import { getMyVerifiedSkills } from "../../services/mentorVerificationService";
import { getExpertDomainLabel } from "../../utils/expertFieldPresentation";
import { isSkillFuzzyVerified } from "../../utils/skillResolver";
import "./MentorQuestionBankTab.css";

type ComposerMode = "MANUAL" | "JSON_IMPORT";
type ComposerStep = "career" | "compose";

interface LocalQuestionItem extends CreateQuestion {
  id: string;
}

const DIFFICULTIES = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
] as const;
const CATEGORIES = ["KNOWLEDGE", "SKILL", "SITUATION", "ANALYSIS"] as const;
const MENTOR_ALLOWED_DOMAINS = ["IT", "BUSINESS", "DESIGN"] as const;

const difficultyLabels: Record<string, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Nâng cao",
  EXPERT: "Chuyên gia",
};

const categoryLabels: Record<string, string> = {
  KNOWLEDGE: "Kiến thức",
  SKILL: "Thực hành",
  SITUATION: "Tình huống",
  ANALYSIS: "Phân tích",
};

const createEmptyQuestion = (): LocalQuestionItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "A",
  explanation: "",
  difficulty: "INTERMEDIATE",
  skillArea: "",
  category: "KNOWLEDGE",
});

const normalizeSkillValue = (value: string): string =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase();

const formatSkillLabel = (value?: string): string => {
  if (!value) return "Chưa chọn skill";
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const statusLabelMap: Record<string, string> = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

// [Question Bank Contribution] Mentor chỉ được gửi bộ câu hỏi cho skill đã xác thực và admin sẽ duyệt trước khi lưu.
const MentorQuestionBankTab: React.FC = () => {
  const { showError, showSuccess, showWarning } = useToast();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [step, setStep] = useState<ComposerStep>("career");
  const [mode, setMode] = useState<ComposerMode>("MANUAL");
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<QuestionBankSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    number | null
  >(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<QuestionBankSubmission | null>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<
    number | null
  >(null);
  const [historySearch, setHistorySearch] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [importedFileName, setImportedFileName] = useState("");
  const [form, setForm] = useState<{
    domain: string;
    industry: string;
    jobRole: string;
    title: string;
    description: string;
  }>({
    domain: "",
    industry: "",
    jobRole: "",
    title: "",
    description: "",
  });
  const [questions, setQuestions] = useState<LocalQuestionItem[]>([
    createEmptyQuestion(),
  ]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [skills, mySubmissions] = await Promise.all([
        getMyVerifiedSkills(),
        getMyQuestionBankSubmissions(),
      ]);
      setVerifiedSkills(skills || []);
      setSubmissions(mySubmissions || []);
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu đóng góp ngân hàng câu hỏi.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const verifiedSkillSet = useMemo(
    () => new Set(verifiedSkills.map((skill) => normalizeSkillValue(skill))),
    [verifiedSkills],
  );

  const normalizedSkill = useMemo(
    () => normalizeSkillValue(skillInput),
    [skillInput],
  );
  // [Skill Auto-Resolve] Use fuzzy verification so "react" matches verified "REACTJS" etc.
  const isVerifiedSkill = useMemo(
    () =>
      normalizedSkill.length > 0 &&
      (verifiedSkillSet.has(normalizedSkill) ||
        isSkillFuzzyVerified(skillInput, verifiedSkills)),
    [normalizedSkill, verifiedSkillSet, skillInput, verifiedSkills],
  );

  const pendingCount = useMemo(
    () =>
      submissions.filter((submission) => submission.status === "PENDING")
        .length,
    [submissions],
  );

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase();
    if (!normalizedSearch) return submissions;
    return submissions.filter((submission) =>
      [
        submission.title,
        submission.skillName,
        submission.jobRole,
        submission.industry,
        submission.status,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [historySearch, submissions]);

  const mapDomainToEnum = (domain: string): string => {
    const upper = domain.toUpperCase();
    if (
      upper === "IT" ||
      upper.includes("INFORMATION TECHNOLOGY") ||
      upper.includes("CÔNG NGHỆ THÔNG TIN")
    )
      return "IT";
    if (
      upper === "BUSINESS" ||
      upper.includes("BUSINESS") ||
      upper.includes("KINH DOANH") ||
      upper.includes("MARKETING")
    )
      return "BUSINESS";
    if (
      upper === "DESIGN" ||
      upper.includes("DESIGN") ||
      upper.includes("THIẾT KẾ") ||
      upper.includes("SÁNG TẠO")
    )
      return "DESIGN";
    return upper;
  };

  // [Skill Auto-Resolve] Callback from SkillAutoResolve when user confirms a resolved career path.
  const handleAutoResolve = useCallback(
    (data: {
      domain: string;
      industry: string;
      jobRole: string;
      keywords?: string;
    }) => {
      const mappedDomain = mapDomainToEnum(data.domain);
      setForm({
        domain: mappedDomain,
        industry: data.industry,
        jobRole: data.jobRole,
        title: `Bộ câu hỏi mentor - ${formatSkillLabel(normalizedSkill)} / ${data.jobRole}`,
        description: `Bộ câu hỏi do mentor đóng góp cho skill ${formatSkillLabel(normalizedSkill)} thuộc lộ trình ${data.jobRole}.`,
      });
      setStep("compose");
    },
    [normalizedSkill],
  );

  const resetComposer = () => {
    setStep("career");
    setMode("MANUAL");
    setSkillInput("");
    setImportedFileName("");
    setForm({
      domain: "",
      industry: "",
      jobRole: "",
      title: "",
      description: "",
    });
    setQuestions([createEmptyQuestion()]);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.length === 1 ? prev : prev.filter((question) => question.id !== id),
    );
  };

  const updateQuestion = (id: string, patch: Partial<LocalQuestionItem>) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
  };

  const updateOption = (id: string, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== id) return question;
        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;
        return { ...question, options: nextOptions };
      }),
    );
  };

  const validateQuestions = (): boolean => {
    if (questions.length === 0) {
      showWarning("Thiếu dữ liệu", "Bạn cần ít nhất 1 câu hỏi để gửi duyệt.");
      return false;
    }

    for (const question of questions) {
      if (!question.questionText.trim()) {
        showWarning("Thiếu câu hỏi", "Mọi câu hỏi đều phải có nội dung.");
        return false;
      }
      if (question.options.some((option) => !option.trim())) {
        showWarning("Thiếu đáp án", "Mỗi câu hỏi cần đủ 4 đáp án.");
        return false;
      }
      if (!question.correctAnswer) {
        showWarning(
          "Thiếu đáp án đúng",
          "Hãy chọn đáp án đúng cho từng câu hỏi.",
        );
        return false;
      }
    }

    return true;
  };

  // [Question Bank Contribution] Import JSON được parse ngay ở client để mentor thấy trước số câu hỏi trước khi submit.
  const handleImportJson = async (file: File) => {
    try {
      const rawText = await file.text();
      const payload = JSON.parse(rawText);

      if (!Array.isArray(payload)) {
        showWarning("Sai định dạng", "File JSON phải là một mảng các câu hỏi.");
        return;
      }

      const importedQuestions: LocalQuestionItem[] = payload.map(
        (item, index) => {
          if (
            !item ||
            typeof item !== "object" ||
            !Array.isArray(item.options) ||
            item.options.length !== 4
          ) {
            throw new Error(`Mục số ${index + 1} không đúng cấu trúc câu hỏi.`);
          }

          return {
            id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
            questionText: String(item.questionText || ""),
            options: item.options.map((option: unknown) =>
              String(option || ""),
            ),
            correctAnswer: String(item.correctAnswer || "A")
              .toUpperCase()
              .slice(0, 1),
            explanation: String(item.explanation || ""),
            difficulty: String(item.difficulty || "INTERMEDIATE").toUpperCase(),
            skillArea: String(item.skillArea || ""),
            category: String(item.category || "KNOWLEDGE").toUpperCase(),
          };
        },
      );

      setQuestions(
        importedQuestions.length > 0
          ? importedQuestions
          : [createEmptyQuestion()],
      );
      setImportedFileName(file.name);
      showSuccess(
        "Đã nạp file",
        `Đã đọc ${importedQuestions.length} câu hỏi từ ${file.name}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đọc file JSON.";
      showError("Không thể nhập file", message);
    }
  };

  const loadSubmissionDetail = useCallback(
    async (submissionId: number) => {
      try {
        setHistoryLoading(true);
        const detail = await getMyQuestionBankSubmission(submissionId);
        setSelectedSubmissionId(submissionId);
        setSelectedSubmission(detail);
      } catch {
        showError("Lỗi", "Không thể tải chi tiết bộ câu hỏi đã gửi.");
      } finally {
        setHistoryLoading(false);
      }
    },
    [showError],
  );

  // [Question Bank Contribution] Payload gửi đi dùng chung cho nhập tay và import JSON, chỉ khác trường source.
  const handleSubmit = async () => {
    if (!form.domain || !form.industry || !form.jobRole) {
      showWarning(
        "Thiếu lộ trình",
        "Hãy chọn đầy đủ domain, ngành và job role.",
      );
      return;
    }
    if (!isVerifiedSkill) {
      showWarning(
        "Skill chưa hợp lệ",
        "Bạn chỉ được gửi bộ câu hỏi cho skill đã xác thực.",
      );
      return;
    }
    if (!validateQuestions()) {
      return;
    }

    const payload: CreateQuestionBankSubmission = {
      domain: form.domain,
      industry: form.industry,
      jobRole: form.jobRole,
      skillName: normalizedSkill,
      title:
        form.title.trim() ||
        `Bộ câu hỏi mentor - ${formatSkillLabel(normalizedSkill)} / ${form.jobRole}`,
      description: form.description.trim() || undefined,
      source: mode,
      questions: questions.map(({ id, ...question }) => ({
        ...question,
        questionText: question.questionText.trim(),
        options: question.options.map((option) => option.trim()),
        explanation: question.explanation?.trim() || undefined,
        skillArea: question.skillArea?.trim() || undefined,
        category: question.category?.trim() || undefined,
      })),
    };

    try {
      setSubmitting(true);
      const created = await createQuestionBankSubmission(payload);
      showSuccess("Gửi thành công", "Bộ câu hỏi đã được gửi cho admin duyệt.");
      resetComposer();
      await loadData();
      await loadSubmissionDetail(created.id);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể gửi bộ câu hỏi.";
      showError("Gửi thất bại", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="mentor-qb-status-badge approved">
            <CheckCircle2 size={14} /> Đã duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className="mentor-qb-status-badge rejected">
            <XCircle size={14} /> Từ chối
          </span>
        );
      default:
        return (
          <span className="mentor-qb-status-badge pending">
            <Clock3 size={14} /> Đang chờ duyệt
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="mentor-qb-page">
        <div className="mentor-qb-loading">
          <RefreshCw size={20} className="mentor-qb-spin" />
          <span>Đang tải khu vực đóng góp câu hỏi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-qb-page">
      <section className="mentor-qb-hero">
        <div>
          <span className="mentor-qb-eyebrow">Ngân hàng câu hỏi mentor</span>
          <h2>Đóng góp bộ câu hỏi cho nền tảng</h2>
          <p>
            Chọn đúng lộ trình nghề nghiệp, gắn với skill đã được xác thực và
            gửi bộ câu hỏi để admin kiểm duyệt trước khi đưa vào hệ thống.
          </p>
        </div>
        <div className="mentor-qb-heroStats">
          <div className="mentor-qb-heroStat">
            <strong>{verifiedSkills.length}</strong>
            <span>Skill đã xác thực</span>
          </div>
          <div className="mentor-qb-heroStat">
            <strong>{submissions.length}</strong>
            <span>Bộ câu hỏi đã gửi</span>
          </div>
          <div className="mentor-qb-heroStat">
            <strong>{pendingCount}</strong>
            <span>Đang chờ duyệt</span>
          </div>
        </div>
      </section>

      <div className="mentor-qb-layout">
        <section className="mentor-qb-composerCard">
          <div className="mentor-qb-sectionHeader">
            <div>
              <h3>
                <ListChecks size={20} /> Soạn bộ câu hỏi mới
              </h3>
              <p>
                Mentor chỉ được gửi bộ câu hỏi cho skill đã được admin xác thực.
              </p>
            </div>
            <div className="mentor-qb-headerActions">
              <button
                type="button"
                className="mentor-qb-btn subtle"
                onClick={resetComposer}
              >
                <RefreshCw size={16} /> Làm mới form
              </button>
            </div>
          </div>

          {step === "career" ? (
            <div className="mentor-qb-careerShell">
              <SkillAutoResolve
                skillInput={skillInput}
                onSkillChange={setSkillInput}
                onResolve={handleAutoResolve}
                allowedDomains={[...MENTOR_ALLOWED_DOMAINS]}
                verifiedSkills={verifiedSkills}
                onSkillChipClick={(skill) => setSkillInput(skill)}
                showManualFallback={false}
                onBack={resetComposer}
                label="Nhập skill để tự động xác định lộ trình"
                description="Hệ thống sẽ tự động xác định domain, ngành và nghề phù hợp với skill bạn nhập."
                placeholder="Ví dụ: React, Java Spring Boot, UI Design..."
              />
            </div>
          ) : (
            <div className="mentor-qb-composeShell">
              <div className="mentor-qb-selectionBar">
                <div className="mentor-qb-selectionMeta">
                  <span>{getExpertDomainLabel(form.domain)}</span>
                  <span>{form.industry}</span>
                  <span>{form.jobRole}</span>
                  <span className={isVerifiedSkill ? "active" : ""}>
                    {formatSkillLabel(normalizedSkill)}
                  </span>
                </div>
                <button
                  type="button"
                  className="mentor-qb-btn subtle"
                  onClick={() => setStep("career")}
                >
                  <ArrowLeft size={16} /> Chọn lại lộ trình
                </button>
              </div>

              <div className="mentor-qb-formGrid">
                <label className="mentor-qb-field">
                  <span>Skill đóng góp</span>
                  <input
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                  />
                </label>
                <label className="mentor-qb-field">
                  <span>Tên bộ câu hỏi</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Tên bộ câu hỏi hiển thị cho admin"
                  />
                </label>
                <label className="mentor-qb-field full">
                  <span>Mô tả</span>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Mô tả ngắn phạm vi kiến thức, đối tượng và điểm nổi bật của bộ câu hỏi..."
                  />
                </label>
              </div>

              <div className="mentor-qb-modeSwitch">
                <button
                  type="button"
                  className={`mentor-qb-modeCard ${mode === "MANUAL" ? "active" : ""}`}
                  onClick={() => {
                    setMode("MANUAL");
                    setImportedFileName("");
                  }}
                >
                  <Plus size={18} />
                  <strong>Tạo thủ công</strong>
                  <span>Nhập trực tiếp từng câu hỏi ngay trên màn hình.</span>
                </button>
                <button
                  type="button"
                  className={`mentor-qb-modeCard ${mode === "JSON_IMPORT" ? "active" : ""}`}
                  onClick={() => setMode("JSON_IMPORT")}
                >
                  <FileJson size={18} />
                  <strong>Nhập từ JSON</strong>
                  <span>
                    Nạp file JSON rồi chỉnh sửa lại trước khi gửi duyệt.
                  </span>
                </button>
              </div>

              {mode === "JSON_IMPORT" && (
                <div className="mentor-qb-importCard">
                  <div>
                    <strong>Nhập file JSON</strong>
                    <p>
                      Định dạng mong đợi: mảng câu hỏi với `questionText`,
                      `options`, `correctAnswer`, `difficulty`...
                    </p>
                  </div>
                  <div className="mentor-qb-importActions">
                    <button
                      type="button"
                      className="mentor-qb-btn secondary"
                      onClick={() => importInputRef.current?.click()}
                    >
                      <Upload size={16} /> Chọn file JSON
                    </button>
                    {importedFileName && (
                      <span className="mentor-qb-fileName">
                        {importedFileName}
                      </span>
                    )}
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".json,application/json"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleImportJson(file);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mentor-qb-questionHeader">
                <div>
                  <h4>
                    <Sparkles size={18} /> Danh sách câu hỏi
                  </h4>
                  <p>{questions.length} câu hỏi đang sẵn sàng gửi duyệt.</p>
                </div>
                <button
                  type="button"
                  className="mentor-qb-btn primary"
                  onClick={addQuestion}
                >
                  <Plus size={16} /> Thêm câu hỏi
                </button>
              </div>

              <div className="mentor-qb-questionList">
                {questions.map((question, questionIndex) => (
                  <article key={question.id} className="mentor-qb-questionCard">
                    <div className="mentor-qb-questionCardHeader">
                      <div>
                        <span className="mentor-qb-questionIndex">
                          Câu {questionIndex + 1}
                        </span>
                        <h5>
                          {question.questionText.trim() ||
                            "Câu hỏi chưa hoàn thiện"}
                        </h5>
                      </div>
                      <button
                        type="button"
                        className="mentor-qb-iconBtn"
                        onClick={() => removeQuestion(question.id)}
                        disabled={questions.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <label className="mentor-qb-field full">
                      <span>Nội dung câu hỏi</span>
                      <textarea
                        rows={3}
                        value={question.questionText}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            questionText: event.target.value,
                          })
                        }
                        placeholder="Nhập nội dung câu hỏi..."
                      />
                    </label>

                    <div className="mentor-qb-optionsGrid">
                      {question.options.map((option, optionIndex) => {
                        const letter = String.fromCharCode(65 + optionIndex);
                        return (
                          <label
                            key={`${question.id}-${letter}`}
                            className="mentor-qb-field option"
                          >
                            <span>Đáp án {letter}</span>
                            <input
                              value={option}
                              onChange={(event) =>
                                updateOption(
                                  question.id,
                                  optionIndex,
                                  event.target.value,
                                )
                              }
                              placeholder={`Nhập đáp án ${letter}`}
                            />
                          </label>
                        );
                      })}
                    </div>

                    <div className="mentor-qb-formGrid compact">
                      <label className="mentor-qb-field">
                        <span>Đáp án đúng</span>
                        <select
                          value={question.correctAnswer}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              correctAnswer: event.target.value,
                            })
                          }
                        >
                          {["A", "B", "C", "D"].map((answer) => (
                            <option key={answer} value={answer}>
                              {answer}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="mentor-qb-field">
                        <span>Độ khó</span>
                        <select
                          value={question.difficulty}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              difficulty: event.target.value,
                            })
                          }
                        >
                          {DIFFICULTIES.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                              {difficultyLabels[difficulty]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="mentor-qb-field">
                        <span>Phạm vi kỹ năng</span>
                        <input
                          value={question.skillArea || ""}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              skillArea: event.target.value,
                            })
                          }
                          placeholder="Ví dụ: React Hooks"
                        />
                      </label>
                      <label className="mentor-qb-field">
                        <span>Nhóm câu hỏi</span>
                        <select
                          value={question.category || "KNOWLEDGE"}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              category: event.target.value,
                            })
                          }
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {categoryLabels[category]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="mentor-qb-field full">
                      <span>Giải thích</span>
                      <textarea
                        rows={2}
                        value={question.explanation || ""}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            explanation: event.target.value,
                          })
                        }
                        placeholder="Giải thích ngắn vì sao đáp án đúng..."
                      />
                    </label>
                  </article>
                ))}
              </div>

              <div className="mentor-qb-submitBar">
                <div className="mentor-qb-submitMeta">
                  <strong>{questions.length}</strong>
                  <span>câu hỏi sẽ được gửi duyệt</span>
                  <span
                    className={`mentor-qb-skillPill ${isVerifiedSkill ? "valid" : "invalid"}`}
                  >
                    {isVerifiedSkill
                      ? "Skill hợp lệ"
                      : "Skill chưa được xác thực"}
                  </span>
                </div>
                <button
                  type="button"
                  className="mentor-qb-btn success"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Đang gửi..." : "Gửi admin duyệt"}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="mentor-qb-historyCard">
          <div className="mentor-qb-sectionHeader">
            <div>
              <h3>
                <Clock3 size={20} /> Lịch sử đóng góp
              </h3>
              <p>Theo dõi trạng thái duyệt và phản hồi từ admin.</p>
            </div>
            <button
              type="button"
              className="mentor-qb-btn subtle"
              onClick={loadData}
            >
              <RefreshCw size={16} /> Tải lại
            </button>
          </div>

          <div className="mentor-qb-historySearch">
            <Search size={18} />
            <input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Tìm theo tiêu đề, skill, trạng thái..."
            />
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="mentor-qb-emptyState">
              <ListChecks size={36} />
              <p>Chưa có bộ câu hỏi nào được gửi.</p>
            </div>
          ) : (
            <div className="mentor-qb-historyList">
              {filteredSubmissions.map((submission) => {
                const expanded = expandedSubmissionId === submission.id;
                return (
                  <article
                    key={submission.id}
                    className="mentor-qb-historyItem"
                  >
                    <button
                      type="button"
                      className="mentor-qb-historyMain"
                      onClick={() => {
                        setExpandedSubmissionId(
                          expanded ? null : submission.id,
                        );
                        if (
                          !expanded ||
                          selectedSubmissionId !== submission.id
                        ) {
                          loadSubmissionDetail(submission.id);
                        }
                      }}
                    >
                      <div>
                        <strong>{submission.title}</strong>
                        <span>
                          {formatSkillLabel(submission.skillName)} ·{" "}
                          {submission.questionCount} câu hỏi
                        </span>
                      </div>
                      <div className="mentor-qb-historyMeta">
                        {renderStatusBadge(submission.status)}
                        {expanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </button>
                    {expanded && (
                      <div className="mentor-qb-historyDetail">
                        <div className="mentor-qb-detailFacts">
                          <span>{getExpertDomainLabel(submission.domain)}</span>
                          <span>{submission.industry}</span>
                          <span>{submission.jobRole}</span>
                        </div>
                        <p>{submission.description || "Không có mô tả."}</p>
                        <div className="mentor-qb-detailMetrics">
                          <div>
                            <strong>{submission.savedQuestionCount}</strong>
                            <span>Câu sẽ lưu</span>
                          </div>
                          <div>
                            <strong>{submission.duplicateQuestionCount}</strong>
                            <span>Câu trùng</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mentor-qb-btn secondary small"
                          onClick={() => loadSubmissionDetail(submission.id)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      <section className="mentor-qb-detailPanel">
        <div className="mentor-qb-sectionHeader">
          <div>
            <h3>
              <Sparkles size={20} /> Chi tiết bộ gửi duyệt
            </h3>
            <p>Xem trước chính xác bộ câu hỏi admin sẽ kiểm duyệt.</p>
          </div>
        </div>

        {historyLoading ? (
          <div className="mentor-qb-loading">
            <RefreshCw size={18} className="mentor-qb-spin" />
            <span>Đang tải chi tiết bộ gửi duyệt...</span>
          </div>
        ) : !selectedSubmission ? (
          <div className="mentor-qb-emptyState large">
            <FileJson size={42} />
            <p>Chọn một bộ gửi duyệt trong lịch sử để xem chi tiết.</p>
          </div>
        ) : (
          <div className="mentor-qb-detailContent">
            <div className="mentor-qb-detailTop">
              <div>
                <h4>{selectedSubmission.title}</h4>
                <p>{selectedSubmission.description || "Không có mô tả."}</p>
              </div>
              {renderStatusBadge(selectedSubmission.status)}
            </div>

            <div className="mentor-qb-detailFacts large">
              <span>{getExpertDomainLabel(selectedSubmission.domain)}</span>
              <span>{selectedSubmission.industry}</span>
              <span>{selectedSubmission.jobRole}</span>
              <span>{formatSkillLabel(selectedSubmission.skillName)}</span>
              <span>
                {statusLabelMap[selectedSubmission.status] ||
                  selectedSubmission.status}
              </span>
            </div>

            <div className="mentor-qb-detailMetrics large">
              <div>
                <strong>{selectedSubmission.questionCount}</strong>
                <span>Tổng câu hỏi</span>
              </div>
              <div>
                <strong>{selectedSubmission.savedQuestionCount}</strong>
                <span>Câu có thể lưu</span>
              </div>
              <div>
                <strong>{selectedSubmission.duplicateQuestionCount}</strong>
                <span>Câu trùng</span>
              </div>
            </div>

            {selectedSubmission.reviewNote && (
              <div className="mentor-qb-reviewNote">
                <strong>Ghi chú từ admin</strong>
                <p>{selectedSubmission.reviewNote}</p>
              </div>
            )}

            <div className="mentor-qb-questionPreviewList">
              {(selectedSubmission.questions || []).map((question, index) => (
                <article
                  key={question.id || `${selectedSubmission.id}-${index}`}
                  className="mentor-qb-previewCard"
                >
                  <div className="mentor-qb-previewHeader">
                    <strong>Câu {question.displayOrder || index + 1}</strong>
                    <span>
                      {difficultyLabels[question.difficulty] ||
                        question.difficulty}
                    </span>
                  </div>
                  <p>{question.questionText}</p>
                  <div className="mentor-qb-previewOptions">
                    {question.options.map((option, optionIndex) => {
                      const letter = String.fromCharCode(65 + optionIndex);
                      return (
                        <div
                          key={`${question.id || index}-${letter}`}
                          className={`mentor-qb-previewOption ${question.correctAnswer === letter ? "correct" : ""}`}
                        >
                          <strong>{letter}</strong>
                          <span>{option}</span>
                        </div>
                      );
                    })}
                  </div>
                  {(question.skillArea || question.category) && (
                    <div className="mentor-qb-previewTags">
                      {question.skillArea && <span>{question.skillArea}</span>}
                      {question.category && (
                        <span>
                          {categoryLabels[question.category] ||
                            question.category}
                        </span>
                      )}
                    </div>
                  )}
                  {question.explanation && (
                    <small>{question.explanation}</small>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MentorQuestionBankTab;
