import React, { useEffect, useState } from "react";
import { Link2, MapPin, Phone, Video, Calendar, Clock3, Building2 } from "lucide-react";
import interviewService, {
  InterviewScheduleResponse,
  InterviewStatus,
  MeetingType,
} from "../../services/interviewService";
import "./InterviewListPanel.css";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "amber",
  CONFIRMED: "cyan",
  COMPLETED: "green",
  CANCELLED: "slate",
  NO_SHOW: "red",
};

const MEETING_ICONS: Record<string, React.ReactNode> = {
  GOOGLE_MEET: <Video size={14} />,
  ZOOM: <Video size={14} />,
  MICROSOFT_TEAMS: <Video size={14} />,
  SKILLVERSE_ROOM: <Video size={14} />,
  PHONE_CALL: <Phone size={14} />,
  ONSITE: <MapPin size={14} />,
};

const MEETING_LABELS: Record<string, string> = {
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  MICROSOFT_TEAMS: "Microsoft Teams",
  SKILLVERSE_ROOM: "SkillVerse Room",
  PHONE_CALL: "Cuộc gọi điện thoại",
  ONSITE: "Phỏng vấn trực tiếp",
};

const formatDateTime = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCountdown = (date?: string): string => {
  if (!date) return "";
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Đã qua";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days} ngày ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

interface InterviewListPanelProps {
  applicationId?: number;
}

const InterviewListPanel: React.FC<InterviewListPanelProps> = ({ applicationId }) => {
  const [interviews, setInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadInterviews();
  }, [applicationId]);

  const loadInterviews = async () => {
    setLoading(true);
    setError("");
    try {
      let data: InterviewScheduleResponse[];
      if (applicationId) {
        data = await interviewService.getInterviewByApplication(applicationId).then((r) => [r]);
      } else {
        data = await interviewService.getMyInterviews();
      }
      setInterviews(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải lịch phỏng vấn.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ilp-loading">
        <div className="ilp-spinner" />
        <span>Đang tải lịch phỏng vấn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ilp-empty">
        <Calendar size={32} />
        <div>
          <strong>Lỗi tải dữ liệu</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!interviews.length) {
    return (
      <div className="ilp-empty">
        <Calendar size={32} />
        <div>
          <strong>Chưa có lịch phỏng vấn nào</strong>
          <p>Bạn sẽ nhận thông báo khi nhà tuyển dụng xếp lịch phỏng vấn.</p>
        </div>
      </div>
    );
  }

  const upcoming = interviews.filter((i) =>
    [InterviewStatus.PENDING, InterviewStatus.CONFIRMED].includes(i.status as InterviewStatus),
  );
  const past = interviews.filter((i) =>
    [InterviewStatus.COMPLETED, InterviewStatus.CANCELLED, InterviewStatus.NO_SHOW].includes(i.status as InterviewStatus),
  );

  return (
    <div className="ilp-root">
      {upcoming.length > 0 && (
        <section className="ilp-section">
          <div className="ilp-section__head">
            <Calendar size={14} />
            <span>Lịch sắp tới</span>
            <span className="ilp-section__count">{upcoming.length}</span>
          </div>
          <div className="ilp-list">
            {upcoming.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="ilp-section">
          <div className="ilp-section__head">
            <Clock3 size={14} />
            <span>Đã kết thúc</span>
            <span className="ilp-section__count">{past.length}</span>
          </div>
          <div className="ilp-list">
            {past.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const InterviewCard: React.FC<{ interview: InterviewScheduleResponse }> = ({ interview }) => {
  const tone = STATUS_TONE[interview.status] || "slate";
  const label = STATUS_LABELS[interview.status] || interview.status;
  const meetingLabel = MEETING_LABELS[interview.meetingType] || interview.meetingType;
  const meetingIcon = MEETING_ICONS[interview.meetingType] || <Calendar size={14} />;
  const countdown = getCountdown(interview.scheduledAt);
  const isUpcoming = [InterviewStatus.PENDING, InterviewStatus.CONFIRMED].includes(interview.status as InterviewStatus);
  const isPast = [InterviewStatus.COMPLETED, InterviewStatus.CANCELLED, InterviewStatus.NO_SHOW].includes(interview.status as InterviewStatus);

  return (
    <article className={`ilp-card ilp-card--${tone}${isPast ? " ilp-card--past" : ""}`}>
      <div className="ilp-card__head">
        <div className="ilp-card__meeting-type">
          <span className="ilp-card__meeting-icon">{meetingIcon}</span>
          <span>{meetingLabel}</span>
        </div>
        <span className={`ilp-status is-${tone}`}>{label}</span>
      </div>

      <div className="ilp-card__job">
        <Building2 size={13} />
        <span>{interview.jobTitle}</span>
      </div>

      <div className="ilp-card__meta">
        <div className="ilp-card__meta-item">
          <Calendar size={13} />
          <span>{formatDateTime(interview.scheduledAt)}</span>
        </div>
        <div className="ilp-card__meta-item">
          <Clock3 size={13} />
          <span>{interview.durationMinutes} phút</span>
        </div>
      </div>

      {isUpcoming && countdown && (
        <div className="ilp-card__countdown">
          <span className="ilp-countdown-dot" />
          <span>Còn {countdown}</span>
        </div>
      )}

      {interview.location && (
        <div className="ilp-card__location">
          <MapPin size={12} />
          <span>{interview.location}</span>
        </div>
      )}

      {interview.meetingLink && (
        <div className="ilp-card__link">
          <Link2 size={12} />
          <a href={interview.meetingLink} target="_blank" rel="noreferrer">
            {interview.meetingLink}
          </a>
        </div>
      )}

      {interview.interviewerName && (
        <div className="ilp-card__interviewer">
          <span>Người phỏng vấn: <strong>{interview.interviewerName}</strong></span>
        </div>
      )}
    </article>
  );
};

export default InterviewListPanel;