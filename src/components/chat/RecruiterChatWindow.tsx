import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Send,
  Smile,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  Star,
  Briefcase,
  Check,
  CheckCheck,
  Image as ImageIcon,
  User,
  AlertTriangle,
} from 'lucide-react';
import recruitmentChatService from '../../services/recruitmentChatService';
import businessService from '../../services/businessService';
import userService from '../../services/userService';
import { getPublicProfile } from '../../services/portfolioService';
import {
  RecruitmentSessionResponse,
  RecruitmentMessageResponse,
  RecruitmentSessionStatus,
} from '../../data/portfolioDTOs';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../services/axiosInstance';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import './RecruiterChatWindow.css';

interface RecruiterChatWindowProps {
  session: RecruitmentSessionResponse;
  currentUserId: number;
  currentUserName: string;
  onBack: () => void;
  onViewProfile?: (session: RecruitmentSessionResponse) => void;
  onUpdateStatus?: (sessionId: number, status: RecruitmentSessionStatus) => void;
}

const RecruiterChatWindow: React.FC<RecruiterChatWindowProps> = ({
  session,
  currentUserId,
  onBack,
  onViewProfile,
  onUpdateStatus,
}) => {
  const { showError, showSuccess } = useToast();
  const [sessionState, setSessionState] = useState<RecruitmentSessionResponse>(session);
  const [messages, setMessages] = useState<RecruitmentMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [counterpartName, setCounterpartName] = useState('');
  const [counterpartAvatar, setCounterpartAvatar] = useState('');
  const [counterpartSubtitle, setCounterpartSubtitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRecruiter = currentUserId === sessionState.recruiterId;
  const chatBlocked = sessionState.isChatAvailable === false;
  const blockedReason = sessionState.chatDisabledReason || 'Cuộc trò chuyện này hiện không thể tiếp tục.';

  useEffect(() => {
    setSessionState(session);
  }, [session]);

  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (trimmed.startsWith('/')) return `${apiRoot}${trimmed}`;
    return `${apiRoot}/${trimmed}`;
  };

  const refreshSession = useCallback(async () => {
    try {
      const freshSession = await recruitmentChatService.getSessionById(session.id);
      setSessionState(freshSession);
    } catch (error) {
      console.error('Failed to refresh recruitment session:', error);
    }
  }, [session.id]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const fetchCounterpartInfo = async () => {
      if (isRecruiter) {
        const name = sessionState.candidateFullName || 'Ứng viên';
        const title = sessionState.candidateTitle || 'Ứng viên';
        setCounterpartName(name);
        setCounterpartAvatar(sessionState.candidateAvatar || '');
        setCounterpartSubtitle(title);

        const needsName = !sessionState.candidateFullName || sessionState.candidateFullName === 'Unknown';
        const needsAvatar = !sessionState.candidateAvatar;
        if (!needsName && !needsAvatar) return;

        try {
          const userProfile = await userService.getUserProfile(sessionState.candidateId);
          setCounterpartName(userProfile.fullName || name);
          setCounterpartAvatar(userProfile.avatarMediaUrl || sessionState.candidateAvatar || '');
        } catch {
          try {
            const portfolioProfile = await getPublicProfile(sessionState.candidateId);
            setCounterpartName(portfolioProfile.fullName || name);
            setCounterpartAvatar(portfolioProfile.portfolioAvatarUrl || sessionState.candidateAvatar || '');
          } catch {
            // Keep session data fallback.
          }
        }
        return;
      }

      const recruiterName = sessionState.recruiterName || 'Nhà tuyển dụng';
      setCounterpartName(recruiterName);
      setCounterpartAvatar(sessionState.recruiterAvatar || '');
      setCounterpartSubtitle(sessionState.recruiterCompany || 'Nhà tuyển dụng');

      if (sessionState.recruiterAvatar) return;

      try {
        const businessProfile = await businessService.getBusinessProfile(sessionState.recruiterId);
        if (businessProfile.companyLogoUrl) {
          setCounterpartAvatar(businessProfile.companyLogoUrl);
          return;
        }
      } catch {
        // Fall through to user profile fallback.
      }

      try {
        const userProfile = await userService.getUserProfile(sessionState.recruiterId);
        setCounterpartName(userProfile.fullName || recruiterName);
        setCounterpartAvatar(userProfile.avatarMediaUrl || sessionState.recruiterAvatar || '');
      } catch {
        // Keep session data fallback.
      }
    };

    fetchCounterpartInfo();
  }, [
    isRecruiter,
    sessionState.candidateAvatar,
    sessionState.candidateFullName,
    sessionState.candidateId,
    sessionState.candidateTitle,
    sessionState.recruiterAvatar,
    sessionState.recruiterCompany,
    sessionState.recruiterId,
    sessionState.recruiterName,
  ]);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await recruitmentChatService.getSessionMessages(sessionState.id, 0, 50);
      setMessages(result.messages.reverse());
    } catch (error) {
      showError('Lỗi', 'Không thể tải tin nhắn');
    } finally {
      setIsLoading(false);
    }
  }, [sessionState.id, showError]);

  useEffect(() => {
    loadMessages();
    recruitmentChatService.markMessagesAsRead(sessionState.id).catch(console.error);
  }, [sessionState.id, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || chatBlocked) return;

    setIsSending(true);
    try {
      const message = await recruitmentChatService.sendMessage({
        sessionId: sessionState.id,
        content: newMessage.trim(),
        messageType: 'TEXT',
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      await refreshSession();
    } catch (error) {
      await refreshSession();
      const message = error instanceof Error ? error.message : 'Không thể gửi tin nhắn';
      showError('Lỗi', message);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: RecruitmentSessionStatus): string => {
    switch (status) {
      case RecruitmentSessionStatus.CONTACTED: return '#6b7280';
      case RecruitmentSessionStatus.INTERESTED: return '#10b981';
      case RecruitmentSessionStatus.INVITED: return '#22d3ee';
      case RecruitmentSessionStatus.APPLICATION_RECEIVED: return '#8b5cf6';
      case RecruitmentSessionStatus.SCREENING: return '#f59e0b';
      case RecruitmentSessionStatus.OFFER_SENT: return '#ec4899';
      case RecruitmentSessionStatus.HIRED: return '#22c55e';
      case RecruitmentSessionStatus.NOT_INTERESTED: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: RecruitmentSessionStatus): string => {
    switch (status) {
      case RecruitmentSessionStatus.CONTACTED: return 'Đã liên hệ';
      case RecruitmentSessionStatus.INTERESTED: return 'Quan tâm';
      case RecruitmentSessionStatus.INVITED: return 'Đã mời';
      case RecruitmentSessionStatus.APPLICATION_RECEIVED: return 'Nhận đơn';
      case RecruitmentSessionStatus.SCREENING: return 'Sàng lọc';
      case RecruitmentSessionStatus.OFFER_SENT: return 'Đã gửi offer';
      case RecruitmentSessionStatus.HIRED: return 'Đã tuyển';
      case RecruitmentSessionStatus.NOT_INTERESTED: return 'Không quan tâm';
      default: return status;
    }
  };

  const handleStatusUpdate = async (newStatus: RecruitmentSessionStatus) => {
    try {
      const updated = await recruitmentChatService.updateSessionStatus(sessionState.id, newStatus);
      setSessionState(updated);
      showSuccess('Thành công', 'Đã cập nhật trạng thái');
      onUpdateStatus?.(sessionState.id, newStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái';
      showError('Lỗi', message);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = async (gifUrl: string) => {
    if (chatBlocked) return;

    setShowGifPicker(false);
    setIsSending(true);
    try {
      const message = await recruitmentChatService.sendMessage({
        sessionId: sessionState.id,
        content: `[GIF]${gifUrl}`,
        messageType: 'TEXT',
      });
      setMessages((prev) => [...prev, message]);
      await refreshSession();
    } catch (error) {
      await refreshSession();
      const message = error instanceof Error ? error.message : 'Không thể gửi GIF';
      showError('Lỗi', message);
    } finally {
      setIsSending(false);
    }
  };

  const isGifContent = (content: string) => content.startsWith('[GIF]');
  const extractGifUrl = (content: string) =>
    content.startsWith('[GIF]') ? content.replace('[GIF]', '') : null;

  return (
    <div className="rcw-window">
      <div className="rcw-header">
        <button className="rcw-back-btn" onClick={onBack} title="Quay lại">
          <ArrowLeft size={18} />
        </button>

        <div className="rcw-candidate-info">
          {counterpartAvatar ? (
            <img
              src={resolveAvatarUrl(counterpartAvatar)}
              alt={counterpartName}
              className="rcw-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('rcw-avatar-fallback--hidden');
              }}
            />
          ) : null}
          <div className={`rcw-avatar-fallback${counterpartAvatar ? ' rcw-avatar-fallback--hidden' : ''}`}>
            <User size={22} />
          </div>
          <div className="rcw-info">
            <h3 className="rcw-info__name">{counterpartName}</h3>
            <span className="rcw-info__title">{counterpartSubtitle}</span>
          </div>
        </div>

        <div className="rcw-header-actions">
          <div
            className="rcw-status-badge"
            style={{ backgroundColor: getStatusColor(sessionState.status) }}
          >
            <Clock size={11} />
            {getStatusLabel(sessionState.status)}
          </div>
        </div>
      </div>

      {sessionState.jobId && (
        <div className="rcw-context">
          <Briefcase size={14} />
          <span className="rcw-context__job">{sessionState.jobTitle}</span>
          {sessionState.isRemote && (
            <span className="rcw-remote-tag">
              <Star size={10} />
              Remote
            </span>
          )}
          {sessionState.jobLocation && (
            <>
              <span className="rcw-context__divider">·</span>
              <span>{sessionState.jobLocation}</span>
            </>
          )}
          {sessionState.jobStatus && (
            <>
              <span className="rcw-context__divider">·</span>
              <span>Trạng thái job: {sessionState.jobStatus}</span>
            </>
          )}
          {sessionState.matchScore && (
            <span className="rcw-match-score">
              <Star size={12} />
              {sessionState.matchScore}% match
            </span>
          )}
        </div>
      )}

      {chatBlocked && (
        <div
          className="rcw-context"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            color: '#fecaca',
          }}
        >
          <AlertTriangle size={14} />
          <span>{blockedReason}</span>
        </div>
      )}

      <div className="rcw-actions">
        {onViewProfile && (
          <button
            className="rcw-action-btn"
            onClick={() => onViewProfile?.(sessionState)}
          >
            <Eye size={14} />
            Xem hồ sơ
          </button>
        )}

        {isRecruiter && (
          <div className="rcw-status-group">
            <button
              className="rcw-status-btn rcw-status-btn--interested"
              onClick={() => handleStatusUpdate(RecruitmentSessionStatus.INTERESTED)}
              disabled={chatBlocked || sessionState.status === RecruitmentSessionStatus.INTERESTED}
            >
              <CheckCircle size={13} />
              Quan tâm
            </button>
            <button
              className="rcw-status-btn rcw-status-btn--invite"
              onClick={() => handleStatusUpdate(RecruitmentSessionStatus.INVITED)}
              disabled={
                chatBlocked ||
                sessionState.status === RecruitmentSessionStatus.INVITED ||
                !sessionState.jobId
              }
            >
              <MessageSquare size={13} />
              Mời ứng tuyển
            </button>
            <button
              className="rcw-status-btn rcw-status-btn--screening"
              onClick={() => handleStatusUpdate(RecruitmentSessionStatus.SCREENING)}
              disabled={chatBlocked}
            >
              <Clock size={13} />
              Sàng lọc
            </button>
          </div>
        )}
      </div>

      <div className="rcw-messages">
        {isLoading ? (
          <div className="rcw-loading">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="rcw-empty">
            <MessageSquare size={44} />
            <p>Chưa có tin nhắn nào</p>
            <span>Bắt đầu cuộc trò chuyện trong đúng context tuyển dụng này</span>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`rcw-message ${isOwn ? 'rcw-message--own' : 'rcw-message--other'}`}
              >
                {!isOwn && (
                  <img
                    src={resolveAvatarUrl(message.senderAvatar || counterpartAvatar)}
                    alt={message.senderName || counterpartName}
                    className="rcw-message__avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="rcw-message__body">
                  {isGifContent(message.content) && extractGifUrl(message.content) ? (
                    <img
                      src={extractGifUrl(message.content)!}
                      alt="GIF"
                      className="rcw-message__gif"
                      onClick={() => window.open(extractGifUrl(message.content)!, '_blank')}
                    />
                  ) : (
                    <div className="rcw-message__bubble">{message.content}</div>
                  )}
                  <div className="rcw-message__meta">
                    <span>{formatTime(message.createdAt)}</span>
                    {isOwn && (
                      <span className="rcw-message__status">
                        {message.isRead ? <CheckCheck size={13} /> : <Check size={13} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="rcw-input">
        <button
          type="button"
          className="rcw-input__action"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
          }}
          title="Biểu tượng cảm xúc"
          disabled={chatBlocked || isSending}
        >
          <Smile size={18} />
        </button>

        <button
          type="button"
          className="rcw-input__action"
          onClick={() => {
            setShowGifPicker(!showGifPicker);
            setShowEmojiPicker(false);
          }}
          title="GIF"
          disabled={chatBlocked || isSending}
        >
          <ImageIcon size={18} />
        </button>

        <input
          className="rcw-input__field"
          type="text"
          placeholder={chatBlocked ? blockedReason : 'Nhập tin nhắn...'}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (newMessage.trim() && !isSending && !chatBlocked) {
                handleSendMessage(e as unknown as React.FormEvent);
              }
            }
          }}
          disabled={isSending || chatBlocked}
        />
        <button
          type="button"
          className="rcw-send-btn"
          onClick={(e) => handleSendMessage(e as unknown as React.FormEvent)}
          disabled={!newMessage.trim() || isSending || chatBlocked}
          title="Gửi"
        >
          <Send size={18} />
        </button>

        {showEmojiPicker && !chatBlocked && (
          <div className="rcw-emoji-wrap">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {showGifPicker && !chatBlocked && (
          <div className="rcw-gif-wrap">
            <GifPicker
              isOpen={showGifPicker}
              onGifSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterChatWindow;
