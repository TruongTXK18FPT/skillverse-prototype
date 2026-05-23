import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Layers3,
  Loader2,
  Sparkles,
} from "lucide-react";
import { careerTaxonomyService } from "../../services/careerTaxonomyService";
import type {
  Domain,
  JobPosition,
  JobPositionTrack,
  JobPositionTrackSkill,
} from "../../types/careerTaxonomy";

interface SkillFormProps {
  onComplete: (data: {
    domain: string;
    subCategory: string;
    jobRole: string;
    jobPositionId: number;
    jobPositionTrackId: number;
    targetLevel?: string;
    skills: string[];
  }) => void;
  onBack: () => void;
}

type SkillStep = "domain" | "job" | "track";

const DOMAIN_LABEL_OVERRIDES: Record<string, string> = {
  it: "Công nghệ thông tin",
  technology: "Công nghệ",
  software_engineering: "Công nghệ phần mềm",
  "software engineering": "Công nghệ phần mềm",
  design: "Thiết kế",
  business: "Kinh doanh",
  service: "Dịch vụ",
  education: "Giáo dục",
  healthcare: "Y tế",
  finance: "Tài chính",
  marketing: "Marketing",
};

const JOB_LABEL_OVERRIDES: Record<string, string> = {
  backend_developer: "Lập trình viên Backend",
  "backend developer": "Lập trình viên Backend",
  frontend_developer: "Lập trình viên Frontend",
  "frontend developer": "Lập trình viên Frontend",
  fullstack_developer: "Lập trình viên Full-stack",
  "fullstack developer": "Lập trình viên Full-stack",
  mobile_developer: "Lập trình viên Mobile",
  "mobile developer": "Lập trình viên Mobile",
  data_analyst: "Chuyên viên phân tích dữ liệu",
  "data analyst": "Chuyên viên phân tích dữ liệu",
  data_engineer: "Kỹ sư dữ liệu",
  "data engineer": "Kỹ sư dữ liệu",
  qa_tester: "Kiểm thử phần mềm",
  "qa tester": "Kiểm thử phần mềm",
  devops_engineer: "Kỹ sư DevOps",
  "devops engineer": "Kỹ sư DevOps",
  ui_ux_designer: "Nhà thiết kế UI/UX",
  "ui/ux designer": "Nhà thiết kế UI/UX",
};

const normalizeKey = (value?: string | null) =>
  (value || "").trim().toLowerCase();

const humanizeFallback = (value?: string | null) =>
  (value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getDomainLabel = (domain?: Domain | null) => {
  if (!domain) return "";
  const byCode = DOMAIN_LABEL_OVERRIDES[normalizeKey(domain.code)];
  const byName = DOMAIN_LABEL_OVERRIDES[normalizeKey(domain.name)];
  return byCode || byName || humanizeFallback(domain.name || domain.code);
};

const getJobLabel = (job?: JobPosition | null) => {
  if (!job) return "";
  const byCode = JOB_LABEL_OVERRIDES[normalizeKey(job.code)];
  const byName = JOB_LABEL_OVERRIDES[normalizeKey(job.name)];
  return byCode || byName || humanizeFallback(job.name || job.code);
};

const getTrackLabel = (track?: JobPositionTrack | null) =>
  track ? humanizeFallback(track.name || track.code) : "";

const getTrackSkillName = (skill: JobPositionTrackSkill): string =>
  humanizeFallback(skill.skillName || skill.canonicalKey || `Kỹ năng #${skill.skillId}`);

const SkillForm: React.FC<SkillFormProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState<SkillStep>("domain");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [tracks, setTracks] = useState<JobPositionTrack[]>([]);
  const [trackSkills, setTrackSkills] = useState<JobPositionTrackSkill[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | "">("");
  const [selectedJobPositionId, setSelectedJobPositionId] = useState<number | "">("");
  const [selectedTrackId, setSelectedTrackId] = useState<number | "">("");
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingDomains(true);
    setError(null);
    careerTaxonomyService
      .getActiveDomains()
      .then((data) => {
        if (!cancelled) setDomains(data);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải danh sách lĩnh vực. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDomains(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedJobPositionId("");
    setSelectedTrackId("");
    setJobPositions([]);
    setTracks([]);
    setTrackSkills([]);
    if (!selectedDomainId) return;

    let cancelled = false;
    setLoadingJobs(true);
    setError(null);
    careerTaxonomyService
      .getActiveJobPositions(Number(selectedDomainId))
      .then((data) => {
        if (!cancelled) setJobPositions(data);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải danh sách vị trí công việc.");
      })
      .finally(() => {
        if (!cancelled) setLoadingJobs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDomainId]);

  useEffect(() => {
    setSelectedTrackId("");
    setTracks([]);
    setTrackSkills([]);
    if (!selectedJobPositionId) return;

    let cancelled = false;
    setLoadingTracks(true);
    setError(null);
    careerTaxonomyService
      .getActiveTracks(Number(selectedJobPositionId))
      .then((data) => {
        if (!cancelled) setTracks(data);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải lộ trình mục tiêu.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTracks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedJobPositionId]);

  useEffect(() => {
    setTrackSkills([]);
    if (!selectedTrackId) return;

    let cancelled = false;
    setLoadingSkills(true);
    setError(null);
    careerTaxonomyService
      .getTrackSkills(Number(selectedTrackId))
      .then((data) => {
        if (!cancelled) setTrackSkills(data);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải kỹ năng của lộ trình mục tiêu.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSkills(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTrackId]);

  const selectedDomain = useMemo(
    () => domains.find((domain) => domain.id === selectedDomainId),
    [domains, selectedDomainId],
  );
  const selectedJobPosition = useMemo(
    () => jobPositions.find((jobPosition) => jobPosition.id === selectedJobPositionId),
    [jobPositions, selectedJobPositionId],
  );
  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId),
    [tracks, selectedTrackId],
  );

  const selectedSkillNames = useMemo(
    () => trackSkills.map(getTrackSkillName).filter(Boolean),
    [trackSkills],
  );

  const canSubmit =
    Boolean(selectedDomain && selectedJobPosition && selectedTrack) &&
    selectedSkillNames.length > 0;

  const selectDomain = (domainId: number) => {
    setSelectedDomainId(domainId);
    setStep("job");
  };

  const selectJobPosition = (jobPositionId: number) => {
    setSelectedJobPositionId(jobPositionId);
    setStep("track");
  };

  const selectTrack = (trackId: number) => {
    setSelectedTrackId(trackId);
  };

  const handlePreviousStep = () => {
    if (step === "track") {
      setStep("job");
      return;
    }
    if (step === "job") {
      setStep("domain");
      return;
    }
    onBack();
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedDomain || !selectedJobPosition || !selectedTrack) {
      return;
    }

    onComplete({
      domain: selectedDomain.code,
      subCategory: selectedTrack.name,
      jobRole: selectedJobPosition.name,
      jobPositionId: selectedJobPosition.id,
      jobPositionTrackId: selectedTrack.id,
      skills: selectedSkillNames,
    });
  };

  const renderEmptyState = (text: string) => (
    <div className="gsj-skill-empty">
      <Sparkles size={18} />
      <span>{text}</span>
    </div>
  );

  return (
    <div className="gsj-skill-form">
      <div className="gsj-wizard-step">
        <div className="gsj-skill-hero">
          <span className="gsj-skill-hero__eyebrow">Thiết lập lộ trình đánh giá</span>
          <h2 className="gsj-skill-hero__title">
            Chọn đúng lĩnh vực, vị trí công việc và cấp độ mục tiêu
          </h2>
          <p className="gsj-skill-hero__subtitle">
            Hệ thống sẽ tự động lấy kỹ năng từ taxonomy đang hoạt động và tạo bài
            assessment 50 câu theo track bạn chọn.
          </p>
        </div>

        <div className="gsj-skill-steps" aria-label="Tiến trình chọn lộ trình">
          <button
            type="button"
            className={`gsj-skill-step ${step === "domain" ? "gsj-skill-step--active" : ""} ${selectedDomain ? "gsj-skill-step--done" : ""}`}
            onClick={() => setStep("domain")}
          >
            <span>1</span>
            <strong>Lĩnh vực</strong>
          </button>
          <button
            type="button"
            className={`gsj-skill-step ${step === "job" ? "gsj-skill-step--active" : ""} ${selectedJobPosition ? "gsj-skill-step--done" : ""}`}
            onClick={() => selectedDomain && setStep("job")}
            disabled={!selectedDomain}
          >
            <span>2</span>
            <strong>Vị trí</strong>
          </button>
          <button
            type="button"
            className={`gsj-skill-step ${step === "track" ? "gsj-skill-step--active" : ""} ${selectedTrack ? "gsj-skill-step--done" : ""}`}
            onClick={() => selectedJobPosition && setStep("track")}
            disabled={!selectedJobPosition}
          >
            <span>3</span>
            <strong>Mục tiêu</strong>
          </button>
        </div>

        {error && (
          <div className="gsj-alert gsj-alert--error gsj-mb-16">{error}</div>
        )}

        {step === "domain" && (
          <section className="gsj-skill-panel">
            <div className="gsj-skill-panel__head">
              <div>
                <h3>Chọn lĩnh vực</h3>
                <p>Danh sách này được lấy trực tiếp từ taxonomy do admin quản lý.</p>
              </div>
              {loadingDomains && <Loader2 className="gsj-spin" size={18} />}
            </div>

            {domains.length === 0 && !loadingDomains ? (
              renderEmptyState("Chưa có lĩnh vực đang hoạt động.")
            ) : (
              <div className="gsj-skill-domain-grid">
                {domains.map((domain) => {
                  const selected = selectedDomainId === domain.id;
                  return (
                    <button
                      type="button"
                      key={domain.id}
                      className={`gsj-skill-domain-card ${selected ? "gsj-skill-domain-card--selected" : ""}`}
                      onClick={() => selectDomain(domain.id)}
                    >
                      <span className="gsj-skill-card__icon">
                        <Layers3 size={22} />
                      </span>
                      <span className="gsj-skill-card__body">
                        <strong>{getDomainLabel(domain)}</strong>
                        <small>{domain.description || "Lĩnh vực học tập đang mở"}</small>
                      </span>
                      <ChevronRight size={18} className="gsj-skill-card__arrow" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {step === "job" && (
          <section className="gsj-skill-panel">
            <div className="gsj-skill-panel__head">
              <div>
                <h3>Chọn vị trí công việc</h3>
                <p>
                  Lĩnh vực đã chọn: <strong>{getDomainLabel(selectedDomain)}</strong>
                </p>
              </div>
              {loadingJobs && <Loader2 className="gsj-spin" size={18} />}
            </div>

            {jobPositions.length === 0 && !loadingJobs ? (
              renderEmptyState("Lĩnh vực này chưa có vị trí công việc đang hoạt động.")
            ) : (
              <div className="gsj-skill-job-grid">
                {jobPositions.map((jobPosition) => {
                  const selected = selectedJobPositionId === jobPosition.id;
                  return (
                    <button
                      type="button"
                      key={jobPosition.id}
                      className={`gsj-skill-job-card ${selected ? "gsj-skill-job-card--selected" : ""}`}
                      onClick={() => selectJobPosition(jobPosition.id)}
                    >
                      <span className="gsj-skill-card__icon">
                        <BriefcaseBusiness size={21} />
                      </span>
                      <span className="gsj-skill-card__body">
                        <strong>{getJobLabel(jobPosition)}</strong>
                        <small>
                          {jobPosition.description ||
                            "Chọn vị trí này để xem các track mục tiêu phù hợp."}
                        </small>
                      </span>
                      <ChevronRight size={18} className="gsj-skill-card__arrow" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {step === "track" && (
          <section className="gsj-skill-panel">
            <div className="gsj-skill-panel__head">
              <div>
                <h3>Chọn track và cấp độ mục tiêu</h3>
                <p>
                  Vị trí đã chọn: <strong>{getJobLabel(selectedJobPosition)}</strong>
                </p>
              </div>
              {(loadingTracks || loadingSkills) && <Loader2 className="gsj-spin" size={18} />}
            </div>

            {tracks.length === 0 && !loadingTracks ? (
              renderEmptyState("Vị trí này chưa có track mục tiêu đang hoạt động.")
            ) : (
              <div className="gsj-skill-track-grid">
                {tracks.map((track) => {
                  const selected = selectedTrackId === track.id;
                  return (
                    <button
                      type="button"
                      key={track.id}
                      className={`gsj-skill-track-card ${selected ? "gsj-skill-track-card--selected" : ""}`}
                      onClick={() => selectTrack(track.id)}
                    >
                      <strong>{getTrackLabel(track)}</strong>
                      <small>
                        {track.description ||
                          "Track này sẽ tự động kéo danh sách kỹ năng cần đánh giá."}
                      </small>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {selectedTrack && (
          <div className="gsj-target-summary gsj-target-summary--polished">
            <div className="gsj-target-summary__title">Đã chọn</div>
            <div className="gsj-target-summary__content">
              <div className="gsj-target-summary__group">
                <span className="gsj-target-summary__label">Track</span>
                <div className="gsj-target-summary__path">
                  <span>{getDomainLabel(selectedDomain)}</span>
                  <ChevronRight size={12} className="gsj-target-summary__path-separator" />
                  <span>{getJobLabel(selectedJobPosition)}</span>
                  <ChevronRight size={12} className="gsj-target-summary__path-separator" />
                  <strong className="gsj-target-summary__role">
                    {getTrackLabel(selectedTrack)}
                  </strong>
                </div>
              </div>

              <div className="gsj-target-summary__group gsj-target-summary__group--skills">
                <span className="gsj-target-summary__label">Kỹ năng tự động track</span>
                {selectedSkillNames.length === 0 ? (
                  <span className="gsj-chip">Đang tải kỹ năng</span>
                ) : (
                  selectedSkillNames.map((skill) => (
                    <span
                      key={skill}
                      className="gsj-chip gsj-chip--selected gsj-target-summary__chip"
                    >
                      <Check size={14} />
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="gsj-wizard-nav">
        <button
          type="button"
          className="gsj-btn gsj-btn--secondary"
          onClick={handlePreviousStep}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <button
          type="button"
          className="gsj-btn gsj-btn--primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          <Check size={16} />
          Xác nhận lộ trình
        </button>
      </div>
    </div>
  );
};

export default SkillForm;
