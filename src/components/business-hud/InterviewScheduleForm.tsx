import React, { useState } from 'react';
import {
  Calendar,
  Video,
  Phone,
  MapPin,
  Building2,
  User,
  Loader2,
  CheckCircle2,
  X,
  Link2,
  Monitor,
} from 'lucide-react';
import { CreateInterviewRequest, MeetingType } from '../../services/interviewService';
import interviewService from '../../services/interviewService';
import { JobApplicationResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import GoogleMeetLogo from '../../assets/meeting/ggmeet.png';
import ZoomLogo from '../../assets/meeting/zoomicon.webp';
import TeamsLogo from '../../assets/meeting/mslogo.png';
import SkillVerseLogo from '../../assets/brand/skillverse.png';
import './InterviewScheduleForm.css';

interface InterviewScheduleFormProps {
  application: JobApplicationResponse;
  isRemote: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const MEETING_TYPES: {
  value: MeetingType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}[] = [
  {
    value: MeetingType.GOOGLE_MEET,
    label: 'Google Meet',
    icon: <img src={GoogleMeetLogo} alt="Google Meet" className="isf-type__logo" />,
    color: '#00f5ff',
    description: 'Nhập link Google Meet để tạo cuộc họp',
  },
  {
    value: MeetingType.SKILLVERSE_ROOM,
    label: 'SkillVerse Room',
    icon: <img src={SkillVerseLogo} alt="SkillVerse" className="isf-type__logo" />,
    color: '#00f5ff',
    description: 'Phòng họp riêng trên nền tảng',
  },
  {
    value: MeetingType.ZOOM,
    label: 'Zoom',
    icon: <img src={ZoomLogo} alt="Zoom" className="isf-type__logo" />,
    color: '#2eeccb',
    description: 'Nhập link cuộc họp Zoom',
  },
  {
    value: MeetingType.MICROSOFT_TEAMS,
    label: 'MS Teams',
    icon: <img src={TeamsLogo} alt="MS Teams" className="isf-type__logo" />,
    color: '#5b8ef7',
    description: 'Nhập link Microsoft Teams',
  },
  {
    value: MeetingType.PHONE_CALL,
    label: 'Điện thoại',
    icon: <Phone size={14} />,
    color: '#ff9f43',
    description: 'Gọi điện trực tiếp cho ứng viên',
  },
  {
    value: MeetingType.ONSITE,
    label: 'Trực tiếp',
    icon: <Building2 size={14} />,
    color: '#aa55ff',
    description: 'Phỏng vấn tại văn phòng công ty',
  },
];

// ONSITE jobs: only ONSITE meeting type is allowed
const ONSITE_MEETING_TYPE = MEETING_TYPES.filter(
  (type) => type.value === MeetingType.ONSITE,
);

const MEETING_COLORS: Record<MeetingType, string> = {
  [MeetingType.GOOGLE_MEET]: '#00f5ff',
  [MeetingType.SKILLVERSE_ROOM]: '#00f5ff',
  [MeetingType.ZOOM]: '#2eeccb',
  [MeetingType.MICROSOFT_TEAMS]: '#5b8ef7',
  [MeetingType.PHONE_CALL]: '#ff9f43',
  [MeetingType.ONSITE]: '#aa55ff',
};

const InterviewScheduleForm: React.FC<InterviewScheduleFormProps> = ({
  application,
  isRemote,
  onClose,
  onScheduled,
}) => {
  const { showError, showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [meetingType, setMeetingType] = useState<MeetingType>(
    isRemote ? MeetingType.GOOGLE_MEET : MeetingType.ONSITE,
  );
  const [meetingLink, setMeetingLink] = useState('');
  const [skillverseRoomId] = useState('');
  const [location, setLocation] = useState(application.location || '');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  const accentColor = MEETING_COLORS[meetingType];

  const getInitials = () => {
    if (application.userFullName) {
      const parts = application.userFullName.trim().split(' ');
      const last = parts[parts.length - 1];
      return (parts[0][0] + (last[0] || '')).toUpperCase();
    }
    return application.userEmail?.[0]?.toUpperCase() || '?';
  };

  const handleSubmit = async () => {
    if (!scheduledDate || !scheduledTime) {
      showError('Thiếu ngày giờ', 'Vui lòng chọn ngày và giờ phỏng vấn.');
      return;
    }

    const dateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledAt = new Date(`${dateTimeStr}+07:00`);
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      showError('Ngày giờ không hợp lệ', 'Thời gian phỏng vấn phải là ngày giờ trong tương lai.');
      return;
    }

    if (
      meetingType === MeetingType.GOOGLE_MEET ||
      meetingType === MeetingType.ZOOM ||
      meetingType === MeetingType.MICROSOFT_TEAMS ||
      meetingType === MeetingType.PHONE_CALL
    ) {
      if (!meetingLink.trim()) {
        showError('Thiếu liên kết', 'Vui lòng nhập link cuộc họp hoặc số điện thoại.');
        return;
      }
    }

    if (meetingType === MeetingType.ONSITE && !location.trim()) {
      showError('Thiếu địa điểm', 'Vui lòng nhập địa điểm phỏng vấn trực tiếp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateInterviewRequest = {
        applicationId: application.id,
        scheduledAt: `${scheduledDate}T${scheduledTime}:00+07:00`,
        durationMinutes: duration,
        meetingType,
        meetingLink: meetingLink.trim() || undefined,
        skillverseRoomId: skillverseRoomId || undefined,
        location: meetingType === MeetingType.ONSITE ? location.trim() : undefined,
        interviewerName: interviewerName.trim() || undefined,
        interviewNotes: interviewNotes.trim() || undefined,
      };

      await interviewService.scheduleInterview(request);
      showSuccess('Lịch phỏng vấn đã được xếp', `Đã gửi thông báo cho ứng viên.`);
      onScheduled();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      showError('Lỗi xếp lịch', error instanceof Error ? error.message : 'Không thể xếp lịch phỏng vấn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="isf-root"
      style={{ '--isf-accent': accentColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className="isf-header">
        <div className="isf-header__left">
          <div className="isf-header__icon">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="isf-header__title">Xếp lịch phỏng vấn</h3>
            <p className="isf-header__subtitle">
              {isRemote ? 'Phỏng vấn từ xa' : `Tại ${application.location || 'công ty'}`}
            </p>
          </div>
        </div>
        <button type="button" className="isf-close" onClick={onClose} title="Đóng">
          <X size={16} />
        </button>
      </div>

      {/* Candidate */}
      <div className="isf-candidate">
        {application.userAvatar ? (
          <img src={application.userAvatar} alt="" className="isf-candidate__avatar" />
        ) : (
          <div className="isf-candidate__avatar isf-candidate__avatar--fallback">{getInitials()}</div>
        )}
        <div className="isf-candidate__info">
          <strong>{application.userFullName || application.userEmail}</strong>
          <span>
            Ứng tuyển: {application.jobTitle}
            {application.userProfessionalTitle && ` · ${application.userProfessionalTitle}`}
          </span>
        </div>
      </div>

      {/* Form Grid */}
      <div className="isf-grid">
        {/* Date & Time */}
        <div className="isf-field isf-field--half">
          <label className="isf-label">
            Ngày<span className="isf-required">*</span>
          </label>
          <input
            type="date"
            className="isf-input"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="isf-field isf-field--half">
          <label className="isf-label">
            Giờ<span className="isf-required">*</span>
          </label>
          <input
            type="time"
            className="isf-input"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </div>

        {/* Duration */}
        <div className="isf-field">
          <label className="isf-label">Thời lượng</label>
          <div className="isf-durations">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`isf-duration ${duration === d ? 'isf-duration--active' : ''}`}
                onClick={() => setDuration(d)}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        {/* Meeting Type */}
        <div className="isf-field">
          <label className="isf-label">
            Hình thức<span className="isf-required">*</span>
            {!isRemote && (
              <span className="isf-label-tag">Onsite chỉ hỗ trợ trực tiếp</span>
            )}
          </label>
          <div className="isf-meeting-types">
            {(isRemote
              ? MEETING_TYPES.filter((type) => type.value !== MeetingType.ONSITE)
              : ONSITE_MEETING_TYPE
            ).map((type) => (
              <button
                key={type.value}
                type="button"
                className={`isf-type ${meetingType === type.value ? 'isf-type--active' : ''}`}
                style={
                  meetingType === type.value
                    ? ({ '--type-color': type.color } as React.CSSProperties)
                    : undefined
                }
                onClick={() => setMeetingType(type.value)}
              >
                <span className="isf-type__icon">{type.icon}</span>
                <span className="isf-type__text">
                  <span className="isf-type__label">{type.label}</span>
                  <span className="isf-type__desc">{type.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic link input per meeting type */}
        {meetingType === MeetingType.GOOGLE_MEET && (
          <div className="isf-field">
            <label className="isf-label">
              <Link2 size={12} />
              Link cuộc họp<span className="isf-required">*</span>
            </label>
            <input
              type="text"
              className="isf-input isf-input--mono"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>
        )}

        {meetingType === MeetingType.SKILLVERSE_ROOM && (
          <div className="isf-field">
            <label className="isf-label">
              <Monitor size={12} />
              SkillVerse Room
            </label>
            <div className="isf-svroom-badge">
              <Monitor size={14} />
              <code>sv-room-xxxxxxxx</code>
              <CheckCircle2 size={12} />
            </div>
            <p className="isf-hint">Phòng họp SkillVerse sẽ được tạo tự động</p>
          </div>
        )}

        {(meetingType === MeetingType.ZOOM || meetingType === MeetingType.MICROSOFT_TEAMS) && (
          <div className="isf-field">
            <label className="isf-label">
              <Link2 size={12} />
              Link cuộc họp<span className="isf-required">*</span>
            </label>
            <input
              type="text"
              className="isf-input isf-input--mono"
              placeholder={
                meetingType === MeetingType.ZOOM
                  ? 'https://zoom.us/j/...'
                  : 'https://teams.microsoft.com/l/meetup-join/...'
              }
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>
        )}

        {meetingType === MeetingType.PHONE_CALL && (
          <div className="isf-field">
            <label className="isf-label">
              <Phone size={12} />
              Số điện thoại / Link gọi<span className="isf-required">*</span>
            </label>
            <input
              type="text"
              className="isf-input isf-input--mono"
              placeholder="VD: +84 90x xxx xxx hoặc link call"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>
        )}

        {meetingType === MeetingType.ONSITE && (
          <div className="isf-field">
            <label className="isf-label">
              <MapPin size={12} />
              Địa điểm công ty<span className="isf-required">*</span>
            </label>
            <input
              type="text"
              className="isf-input"
              placeholder="VD: Tầng 10, Tòa nhà ABC, 123 Nguyễn Huệ, Q1, HCM"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        )}

        {/* Interviewer */}
        <div className="isf-field">
          <label className="isf-label">
            <User size={12} />
            Người phỏng vấn
          </label>
          <input
            type="text"
            className="isf-input"
            placeholder="VD: Nguyễn Văn A - HR Manager"
            value={interviewerName}
            onChange={(e) => setInterviewerName(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="isf-field">
          <label className="isf-label">Ghi chú cho ứng viên</label>
          <textarea
            className="isf-textarea"
            placeholder="VD: Mang theo laptop và bằng cấp liên quan..."
            value={interviewNotes}
            onChange={(e) => setInterviewNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="isf-actions">
        <button type="button" className="isf-btn isf-btn--cancel" onClick={onClose} disabled={isSubmitting}>
          Hủy
        </button>
        <button
          type="button"
          className="isf-btn isf-btn--submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ '--isf-accent-btn': accentColor } as React.CSSProperties}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="isf-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Calendar size={14} />
              Xác nhận lịch phỏng vấn
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InterviewScheduleForm;
