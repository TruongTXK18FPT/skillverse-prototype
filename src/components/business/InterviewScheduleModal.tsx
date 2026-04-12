import React, { useState } from 'react';
import { Calendar, MapPin, Phone, Video, Loader2, Check } from 'lucide-react';
import {
  CreateInterviewRequest,
  MeetingType,
} from '../../services/interviewService';
import interviewService from '../../services/interviewService';
import { JobApplicationResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './InterviewScheduleModal.css';

interface InterviewScheduleModalProps {
  application: JobApplicationResponse;
  isRemote?: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const MEETING_TYPE_OPTIONS: { value: MeetingType; label: string; icon: React.ReactNode }[] = [
  { value: MeetingType.GOOGLE_MEET, label: 'Google Meet', icon: <Video size={14} /> },
  { value: MeetingType.SKILLVERSE_ROOM, label: 'SkillVerse Room', icon: <Video size={14} /> },
  { value: MeetingType.ZOOM, label: 'Zoom', icon: <Video size={14} /> },
  { value: MeetingType.MICROSOFT_TEAMS, label: 'Microsoft Teams', icon: <Video size={14} /> },
  { value: MeetingType.PHONE_CALL, label: 'Phone Call', icon: <Phone size={14} /> },
  { value: MeetingType.ONSITE, label: 'On-site', icon: <MapPin size={14} /> },
];

const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  application,
  isRemote = true,
  onClose,
  onScheduled,
}) => {
  const { showError, showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(60);
  // ONSITE jobs default to ONSITE meeting type
  const [meetingType, setMeetingType] = useState<MeetingType>(
    isRemote ? MeetingType.GOOGLE_MEET : MeetingType.ONSITE,
  );
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  const getCandidateInitials = () => {
    if (application.userFullName) {
      const parts = application.userFullName.trim().split(' ');
      const last = parts[parts.length - 1];
      const first = parts[0];
      return (first[0] + (last[0] || '')).toUpperCase();
    }
    return application.userEmail?.[0]?.toUpperCase() || '?';
  };

  const handleSubmit = async () => {
    // Validate
    if (!scheduledDate || !scheduledTime) {
      showError('Thiếu thông tin', 'Vui lòng chọn ngày và giờ phỏng vấn.');
      return;
    }

    const dateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledAt = new Date(dateTimeStr);
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      showError('Ngày giờ không hợp lệ', 'Thời gian phỏng vấn phải là ngày giờ trong tương lai.');
      return;
    }

    if (meetingType === MeetingType.ONSITE && !location.trim()) {
      showError('Thiếu địa điểm', 'Vui lòng nhập địa điểm phỏng vấn On-site.');
      return;
    }

    if (
      (meetingType === MeetingType.ZOOM ||
        meetingType === MeetingType.MICROSOFT_TEAMS ||
        meetingType === MeetingType.PHONE_CALL) &&
      !meetingLink.trim()
    ) {
      showError('Thiếu liên kết', 'Vui lòng nhập link cuộc họp hoặc số điện thoại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateInterviewRequest = {
        applicationId: application.id,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: duration,
        meetingType,
        meetingLink: meetingLink.trim() || undefined,
        location: meetingType === MeetingType.ONSITE ? location.trim() : undefined,
        interviewerName: interviewerName.trim() || undefined,
        interviewNotes: interviewNotes.trim() || undefined,
      };

      await interviewService.scheduleInterview(request);
      showSuccess(
        'Lịch phỏng vấn đã được xếp',
        `Đã gửi thông báo cho ${application.userFullName || application.userEmail}`,
      );
      onScheduled?.();
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      showError(
        'Lỗi xếp lịch',
        error instanceof Error ? error.message : 'Không thể xếp lịch phỏng vấn.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="am-interview-overlay" onClick={onClose}>
      <div className="am-interview-shell" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="am-interview-header">
          <div className="am-interview-title-row">
            <div className="am-interview-title">
              <span className="am-interview-title-icon">
                <Calendar size={16} />
              </span>
              <h3>Xếp Lịch Phỏng Vấn</h3>
            </div>
            <button
              className="am-interview-close"
              onClick={onClose}
              title="Đóng"
              type="button"
            >
              ×
            </button>
          </div>
          <p className="am-interview-subtitle">
            {isRemote
              ? 'Gửi lời mời phỏng vấn cho ứng viên'
              : `Phỏng vấn trực tiếp tại ${application.location || 'công ty'}`}
          </p>
        </div>

        {/* Body */}
        <div className="am-interview-body">
          {/* Candidate Banner */}
          <div className="am-interview-candidate-banner">
            {application.userAvatar ? (
              <img
                src={application.userAvatar}
                alt={application.userFullName}
                className="am-interview-candidate-avatar"
              />
            ) : (
              <div className="am-interview-candidate-avatar am-interview-candidate-avatar--fallback">
                {getCandidateInitials()}
              </div>
            )}
            <div className="am-interview-candidate-info">
              <h4>{application.userFullName || application.userEmail}</h4>
              <p>
                Ứng tuyển: {application.jobTitle}
                {application.userProfessionalTitle && ` · ${application.userProfessionalTitle}`}
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="am-interview-input-row">
            <div className="am-interview-section">
              <label className="am-interview-label">
                Ngày<span className="am-interview-required">*</span>
              </label>
              <input
                type="date"
                className="am-interview-datetime"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="am-interview-section">
              <label className="am-interview-label">
                Giờ<span className="am-interview-required">*</span>
              </label>
              <input
                type="time"
                className="am-interview-datetime"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="am-interview-section">
            <label className="am-interview-label">Thời lượng</label>
            <div className="am-interview-duration-row">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`am-interview-duration-pill ${duration === d ? 'am-interview-duration-pill--active' : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d} phút
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Type */}
          <div className="am-interview-section">
            <label className="am-interview-label">
              Hình thức<span className="am-interview-required">*</span>
            </label>
            <div className="am-interview-meeting-options">
              {MEETING_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`am-interview-meeting-option ${meetingType === option.value ? 'am-interview-meeting-option--active' : ''}`}
                  onClick={() => setMeetingType(option.value)}
                >
                  <span className="am-interview-meeting-dot" />
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic fields based on meeting type */}
          {meetingType === MeetingType.GOOGLE_MEET && (
            <div className="am-interview-section">
              <label className="am-interview-label">Link cuộc họp</label>
              <div className="am-interview-link-input">
                <span className="am-interview-link-icon">
                  <Video size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Link sẽ được tạo tự động nếu để trống"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
              <p className="am-interview-auto-notice">
                💡 Để trống để hệ thống tự tạo link Google Meet
              </p>
            </div>
          )}

          {meetingType === MeetingType.SKILLVERSE_ROOM && (
            <div className="am-interview-section">
              <label className="am-interview-label">SkillVerse Room</label>
              <div className="am-interview-room-badge">
                <Video size={14} />
                <code>sv-room-xxxxxxxx</code>
                <Check size={12} />
              </div>
              <p className="am-interview-auto-notice">
                💡 Phòng họp SkillVerse sẽ được tạo tự động
              </p>
            </div>
          )}

          {(meetingType === MeetingType.ZOOM ||
            meetingType === MeetingType.MICROSOFT_TEAMS ||
            meetingType === MeetingType.PHONE_CALL) && (
            <div className="am-interview-section">
              <label className="am-interview-label">
                {meetingType === MeetingType.PHONE_CALL ? 'Số điện thoại / Link' : 'Link cuộc họp'}
                <span className="am-interview-required">*</span>
              </label>
              <input
                type="text"
                className="am-interview-input"
                placeholder={
                  meetingType === MeetingType.PHONE_CALL
                    ? 'VD: +84 90x xxx xxx hoặc link call'
                    : 'VD: https://zoom.us/j/...'
                }
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          )}

          {meetingType === MeetingType.ONSITE && (
            <div className="am-interview-section">
              <label className="am-interview-label">
                Địa điểm<span className="am-interview-required">*</span>
              </label>
              <input
                type="text"
                className="am-interview-input"
                placeholder="VD: Tầng 10, Tòa nhà ABC, 123 Nguyễn Huệ, Q1, HCM"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          {/* Interviewer Name */}
          <div className="am-interview-section">
            <label className="am-interview-label">Người phỏng vấn</label>
            <input
              type="text"
              className="am-interview-input"
              placeholder="VD: Nguyễn Văn A - HR Manager"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="am-interview-section">
            <label className="am-interview-label">Ghi chú cho ứng viên</label>
            <textarea
              className="am-interview-textarea"
              placeholder="VD: Vui lòng chuẩn bị bằng cấp và laptop cá nhân..."
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="am-interview-footer">
          <button
            type="button"
            className="am-interview-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="am-interview-btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="am-interview-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Calendar size={15} />
                Xác nhận lịch phỏng vấn
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduleModal;
