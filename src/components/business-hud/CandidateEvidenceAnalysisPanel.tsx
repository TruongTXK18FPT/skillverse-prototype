import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  HelpCircle,
  ShieldCheck,
  Target,
} from "lucide-react";
import { CandidateFitAnalysis } from "../../data/portfolioDTOs";

type Props = {
  analysis: CandidateFitAnalysis;
};

const pct = (value?: number | null) => `${Math.round((value || 0) * 100)}%`;

const normalizeSkill = (value?: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();

const statusMeta = (status?: string) => {
  switch (status) {
    case "VERIFIED":
      return {
        label: "Đã xác thực",
        tone: "verified",
        meaning: "Skill đã được mentor hoặc admin duyệt, có thể dùng làm bằng chứng năng lực chính.",
      };
    case "EVIDENCE_BACKED":
      return {
        label: "Có bằng chứng",
        tone: "evidence",
        meaning: "Skill có minh chứng từ mission, project hoặc chứng chỉ liên quan.",
      };
    case "POSSIBLE_EVIDENCE":
      return {
        label: "Cần kiểm tra",
        tone: "possible",
        meaning: "Skill chỉ xuất hiện trong mô tả, cần hỏi thêm hoặc yêu cầu minh chứng rõ hơn.",
      };
    case "DECLARED_ONLY":
      return {
        label: "Chỉ tự khai",
        tone: "declared",
        meaning: "Ứng viên tự ghi trong CV/top skills nhưng chưa có minh chứng đủ mạnh.",
      };
    default:
      return {
        label: "Còn thiếu",
        tone: "missing",
        meaning: "Chưa tìm thấy skill hoặc bằng chứng đáng tin trong hồ sơ.",
      };
  }
};

const verdictLabel = (verdict?: string) => {
  switch (verdict) {
    case "STRONG_VERIFIED_FIT":
      return "Phù hợp mạnh";
    case "PARTIAL_EVIDENCE_FIT":
      return "Có bằng chứng một phần";
    case "UNVERIFIED_CLAIM_ONLY":
      return "Chỉ tự khai";
    case "MISSING_CRITICAL_SKILLS":
      return "Thiếu kỹ năng quan trọng";
    case "SENIORITY_RISK":
      return "Rủi ro seniority";
    case "NEEDS_REVIEW":
      return "Cần kiểm tra thêm";
    default:
      return "Đang phân tích";
  }
};

const seniorityDecisionLabel = (value?: string) => {
  switch (value) {
    case "PASS":
      return "Đạt yêu cầu cấp bậc";
    case "FAIL_OVERQUALIFIED":
      return "Vượt cấp so với yêu cầu";
    case "FAIL_UNDERQUALIFIED":
      return "Chưa đạt cấp bậc yêu cầu";
    case "NEEDS_REVIEW":
      return "Cần kiểm tra thêm";
    case "NOT_APPLICABLE":
      return "Không áp dụng";
    default:
      return value || "Chưa rõ";
  }
};

const riskLabel = (value?: string) => {
  switch (value) {
    case "LOW":
      return "Thấp";
    case "MEDIUM":
      return "Trung bình";
    case "HIGH":
      return "Cao";
    default:
      return value || "Chưa rõ";
  }
};

const formatSource = (source: string) =>
  source
    .replace(/^Completed mission - Completed mission:/i, "Mission đã hoàn thành:")
    .replace(/^Completed mission:/i, "Mission đã hoàn thành:")
    .replace(/^Project - Project tool:/i, "Công cụ trong project:")
    .replace(/^Project tool:/i, "Công cụ trong project:")
    .replace(/^Certificate - Verified certificate:/i, "Chứng chỉ đã xác thực:")
    .replace(/^Verified skill - Mentor verified:/i, "Mentor xác thực:")
    .replace(/^Verified skill - Admin verified:/i, "Admin xác thực:")
    .replace(/^Possible project evidence - Project text:/i, "Mô tả project:")
    .replace(/^Possible certificate evidence - Unverified certificate:/i, "Chứng chỉ chưa xác thực:")
    .replace(/^Ứng viên tự khai trong CV\/top skills:/i, "Ứng viên tự khai:");

const uniqueSignals = (analysis: CandidateFitAnalysis) => {
  const map = new Map<string, NonNullable<CandidateFitAnalysis["requiredSkillSignals"]>[number]>();
  (analysis.requiredSkillSignals || []).forEach((signal) => {
    const key = normalizeSkill(signal.skill);
    const current = map.get(key);
    if (!current || signal.primary || current.status === "MISSING") {
      map.set(key, signal);
    }
  });
  return Array.from(map.values());
};

const buildActions = (analysis: CandidateFitAnalysis) => {
  const actions = new Set<string>();
  (analysis.nextActions || []).forEach((item) => actions.add(item));
  (analysis.missingRequirements || []).slice(0, 3).forEach((item) => {
    actions.add(`Hỏi trực tiếp hoặc giao bài test ngắn cho kỹ năng ${item.skill}.`);
  });
  (analysis.unverifiedSkillWarnings || []).slice(0, 2).forEach(() => {
    actions.add("Yêu cầu ứng viên bổ sung minh chứng cho kỹ năng tự khai.");
  });
  if (analysis.seniorityDecision === "NEEDS_REVIEW") {
    actions.add("Kiểm tra lại CV/portfolio để xác nhận cấp bậc trước khi mời phỏng vấn.");
  }
  return Array.from(actions).slice(0, 5);
};

export default function CandidateEvidenceAnalysisPanel({ analysis }: Props) {
  const signals = uniqueSignals(analysis);
  const actions = buildActions(analysis);
  const missingSignals = signals.filter((signal) => signal.status === "MISSING");
  const declaredSignals = signals.filter((signal) => signal.status === "DECLARED_ONLY");

  const metrics = [
    {
      label: "Đã xác thực",
      value: analysis.verifiedSkillMatchPercent,
      tone: "verified",
      description: "Tỷ lệ kỹ năng yêu cầu đã được mentor hoặc admin xác thực.",
    },
    {
      label: "Có bằng chứng",
      value: analysis.evidenceBackedSkillPercent,
      tone: "evidence",
      description: "Tỷ lệ kỹ năng có minh chứng từ mission, project hoặc chứng chỉ.",
    },
    {
      label: "Chỉ tự khai",
      value: analysis.declaredOnlySkillPercent,
      tone: "declared",
      description: "Tỷ lệ kỹ năng ứng viên tự ghi nhưng chưa có minh chứng đủ mạnh.",
    },
    {
      label: "Còn thiếu",
      value: analysis.missingSkillPercent,
      tone: "missing",
      description: "Tỷ lệ kỹ năng chưa tìm thấy trong hồ sơ hoặc bằng chứng.",
    },
  ];

  return (
    <section className="candidate-evidence-panel">
      <header className="candidate-evidence-panel__header">
        <div>
          <span className="candidate-evidence-panel__eyebrow">
            <FileSearch size={14} />
            Phân tích bằng thuật toán
          </span>
          <h3>{analysis.fitSummaryTitle || "Phân tích độ phù hợp"}</h3>
          <p>{analysis.fitSummaryReason || analysis.recommendation || "Hệ thống đang tổng hợp bằng chứng từ CV, portfolio, mission và chứng chỉ."}</p>
        </div>
        <span className={`candidate-evidence-panel__verdict candidate-evidence-panel__verdict--${(analysis.fitVerdict || "needs_review").toLowerCase()}`}>
          {verdictLabel(analysis.fitVerdict)}
        </span>
      </header>

      <div className="candidate-evidence-panel__metrics">
        {metrics.map((metric) => (
          <article className={`candidate-evidence-metric candidate-evidence-metric--${metric.tone}`} key={metric.label}>
            <strong>{pct(metric.value)}</strong>
            <span>{metric.label}</span>
            <p>{metric.description}</p>
          </article>
        ))}
      </div>

      <div className="candidate-evidence-panel__section-head">
        <Target size={16} />
        <div>
          <strong>Kỹ năng yêu cầu</strong>
          <span>Mỗi dòng cho biết kỹ năng đó đã có bằng chứng ở mức nào và recruiter nên hiểu ra sao.</span>
        </div>
      </div>

      <div className="candidate-evidence-table">
        {signals.map((signal) => {
          const meta = statusMeta(signal.status);
          return (
            <article className={`candidate-evidence-row candidate-evidence-row--${meta.tone}`} key={`${normalizeSkill(signal.skill)}-${signal.status}`}>
              <div className="candidate-evidence-row__top">
                <div>
                  <strong>{signal.skill}</strong>
                  {signal.primary && <span>Kỹ năng chính</span>}
                </div>
                <em>{meta.label}</em>
              </div>
              <div className="candidate-evidence-row__grid">
                <div>
                  <small>Vì sao hệ thống đánh giá như vậy?</small>
                  <p>{signal.businessMeaning || meta.meaning}</p>
                </div>
                <div>
                  <small>Nguồn minh chứng</small>
                  {(signal.sources?.length ?? 0) > 0 ? (
                    <ul>
                      {signal.sources!.slice(0, 4).map((source) => (
                        <li key={source}>{formatSource(source)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Chưa có nguồn minh chứng cụ thể.</p>
                  )}
                </div>
                <div>
                  <small>Ý nghĩa tuyển dụng</small>
                  <p>{meta.meaning}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {(declaredSignals.length > 0 || missingSignals.length > 0 || (analysis.unverifiedSkillWarnings?.length ?? 0) > 0) && (
        <div className="candidate-evidence-alerts">
          {declaredSignals.length > 0 && (
            <div className="candidate-evidence-alert candidate-evidence-alert--warning">
              <AlertTriangle size={16} />
              <p>
                Ứng viên có tự khai {declaredSignals.map((item) => item.skill).join(", ")}, nhưng chưa có mentor/admin xác thực hoặc minh chứng đủ rõ.
              </p>
            </div>
          )}
          {missingSignals.length > 0 && (
            <div className="candidate-evidence-alert candidate-evidence-alert--danger">
              <HelpCircle size={16} />
              <p>
                Chưa có bằng chứng cho {missingSignals.map((item) => item.skill).join(", ")}. Nên hỏi trực tiếp hoặc giao bài test ngắn.
              </p>
            </div>
          )}
        </div>
      )}

      {(analysis.senioritySummary || analysis.requiredSeniority) && (
        <article className={`candidate-evidence-seniority ${analysis.seniorityPass === false ? "candidate-evidence-seniority--risk" : ""}`}>
          <div className="candidate-evidence-panel__section-head">
            <ShieldCheck size={16} />
            <div>
              <strong>Seniority full-time</strong>
              <span>Đối chiếu cấp bậc job yêu cầu với CV và portfolio.</span>
            </div>
          </div>
          <div className="candidate-evidence-seniority__grid">
            <div>
              <small>Job yêu cầu</small>
              <strong>{analysis.requiredSeniority || "Không rõ"}</strong>
            </div>
            <div>
              <small>Ứng viên được suy luận</small>
              <strong>{analysis.inferredSeniority || "Chưa đủ dữ liệu"}</strong>
            </div>
            <div>
              <small>Kết luận</small>
              <strong>{seniorityDecisionLabel(analysis.seniorityDecision)}</strong>
            </div>
            <div>
              <small>Rủi ro</small>
              <strong>{riskLabel(analysis.seniorityRiskLevel)}</strong>
            </div>
          </div>
          <p>{analysis.senioritySummary}</p>
          {(analysis.seniorityEvidence?.length ?? 0) > 0 && (
            <ul>
              {analysis.seniorityEvidence!.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </article>
      )}

      {actions.length > 0 && (
        <article className="candidate-evidence-actions">
          <div className="candidate-evidence-panel__section-head">
            <ClipboardCheck size={16} />
            <div>
              <strong>Đề xuất hành động</strong>
              <span>Các bước nên làm trước khi ra quyết định tuyển dụng.</span>
            </div>
          </div>
          <ol>
            {actions.map((action) => (
              <li key={action}>
                <CheckCircle2 size={14} />
                {action}
              </li>
            ))}
          </ol>
        </article>
      )}
    </section>
  );
}
