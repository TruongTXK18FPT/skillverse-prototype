import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import recruitmentChatService from '../../services/recruitmentChatService';
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
  currentUserName,
  onBack,
  onViewProfile,
  onUpdateStatus,
}) => {
  const { showError, showSuccess } = useToast();
  const [messages, setMessages] = useState<RecruitmentMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [candidateName, setCandidateName] = useState(session.candidateFullName || 'Ứng viên');
  const [candidateAvatar, setCandidateAvatar] = useState(session.candidateAvatar || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch candidate profile if name/avatar missing from session
  useEffect(() => {
    const fetchCandidateInfo = async () => {
      // If name is missing or uses default, try to fetch
      const needsName = !session.candidateFullName || session.candidateFullName === 'Unknown';
      const needsAvatar = !session.candidateAvatar;

      if (!needsName && !needsAvatar) {
        setCandidateName(session.candidateFullName);
        setCandidateAvatar(session.candidateAvatar || '');
        return;
      }

      if (!session.candidateId) return;

      try {
        // Try userService first (basic profile)
        const userProfile = await userService.getUserProfile(session.candidateId);
        if (needsName && userProfile.fullName) {
          setCandidateName(userProfile.fullName);
        }
        if (needsAvatar && userProfile.avatarMediaUrl) {
          setCandidateAvatar(userProfile.avatarMediaUrl);
        }
      } catch {
        // Fallback: try portfolioService
        try {
          const portfolioProfile = await getPublicProfile(session.candidateId);
          if (needsName && portfolioProfile.fullName) {
            setCandidateName(portfolioProfile.fullName);
          }
          if (needsAvatar && portfolioProfile.portfolioAvatarUrl) {
            setCandidateAvatar(portfolioProfile.portfolioAvatarUrl);
          }
        } catch {
          // Both failed — keep default name
        }
      }
    };

    fetchCandidateInfo();
  }, [session.candidateId, session.candidateFullName, session.candidateAvatar]);

  // Resolve avatar URL
  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (trimmed.startsWith('/')) return `${apiRoot}${trimmed}`;
    return `${apiRoot}/${trimmed}`;
  };

  // Load messages
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await recruitmentChatService.getSessionMessages(session.id, 0, 50);
      setMessages(result.messages.reverse());
    } catch (error) {
      showError('Lỗi', 'Không thể tải tin nhắn');
    } finally {
      setIsLoading(false);
    }
  }, [session.id, showError]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
    recruitmentChatService.markMessagesAsRead(session.id).catch(console.error);
  }, [session.id, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const message = await recruitmentChatService.sendMessage({
        sessionId: session.id,
        content: newMessage.trim(),
        messageType: 'TEXT',
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      showError('Lỗi', 'Không thể gửi tin nhắn');
    } finally {
      setIsSending(false);
    }
  };

  // Get status color
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

  // Get status label
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

  // Handle status update
  const handleStatusUpdate = async (newStatus: RecruitmentSessionStatus) => {
    try {
      await recruitmentChatService.updateSessionStatus(session.id, newStatus);
      showSuccess('Thành công', 'Đã cập nhật trạng thái');
      if (onUpdateStatus) {
        onUpdateStatus(session.id, newStatus);
      }
    } catch (error) {
      showError('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  // Check if current user is recruiter
  const isRecruiter = currentUserId === session.recruiterId;

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle GIF selection
  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    setIsSending(true);
    try {
      const message = await recruitmentChatService.sendMessage({
        sessionId: session.id,
        content: `[GIF]${gifUrl}`,
        messageType: 'TEXT',
      });
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      showError('Lỗi', 'Không thể gửi GIF');
    } finally {
      setIsSending(false);
    }
  };

  // Handle GIF display in message
  const isGifContent = (content: string) => content.startsWith('[GIF]');
  const extractGifUrl = (content: string) =>
    content.startsWith('[GIF]') ? content.replace('[GIF]', '') : null;

  return (
    <div className="rcw-window">
      {/* Header */}
      <div className="rcw-header">
        <button className="rcw-back-btn" onClick={onBack} title="Quay lại">
          <ArrowLeft size={18} />
        </button>

        <div className="rcw-candidate-info">
          {candidateAvatar ? (
            <img
              src={resolveAvatarUrl(candidateAvatar)}
              alt={candidateName}
              className="rcw-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('rcw-avatar-fallback--hidden');
              }}
            />
          ) : null}
          <div className={`rcw-avatar-fallback${candidateAvatar ? ' rcw-avatar-fallback--hidden' : ''}`}>
            <User size={22} />
          </div>
          <div className="rcw-info">
            <h3 className="rcw-info__name">{candidateName}</h3>
            <span className="rcw-info__title">
              {session.candidateTitle || 'Ứng viên'}
            </span>
          </div>
        </div>

        <div className="rcw-header-actions">
          <div
            className="rcw-status-badge"
            style={{ backgroundColor: getStatusColor(session.status) }}
          >
            <Clock size={11} />
            {getStatusLabel(session.status)}
          </div>
        </div>
      </div>

      {/* Context Info Bar */}
      {session.jobId && (
        <div className="rcw-context">
          <Briefcase size={14} />
          <span className="rcw-context__job">{session.jobTitle}</span>
          {session.isRemote && (
            <span className="rcw-remote-tag">
              <Star size={10} />
              Remote
            </span>
          )}
          {session.jobLocation && (
            <>
              <span className="rcw-context__divider">·</span>
              <span>{session.jobLocation}</span>
            </>
          )}
          {session.matchScore && (
            <span className="rcw-match-score">
              <Star size={12} />
              {session.matchScore}% match
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="rcw-actions">
        <button
          className="rcw-action-btn"
          onClick={() => onViewProfile?.(session)}
        >
          <Eye size={14} />
          Xem hồ sơ
        </button>

        {isRecruiter && (
          <div className="rcw-status-group">
            <button
              className="rcw-status-btn rcw-status-btn--interested"
              onClick={() =>
                handleStatusUpdate(RecruitmentSessionStatus.INTERESTED)
              }
              disabled={session.status === RecruitmentSessionStatus.INTERESTED}
            >
              <CheckCircle size={13} />
              Quan tâm
            </button>
            <button
              className="rcw-status-btn rcw-status-btn--invite"
              onClick={() =>
                handleStatusUpdate(RecruitmentSessionStatus.INVITED)
              }
              disabled={
                session.status === RecruitmentSessionStatus.INVITED ||
                !session.jobId
              }
            >
              <MessageSquare size={13} />
              Mời ứng tuyển
            </button>
            <button
              className="rcw-status-btn rcw-status-btn--screening"
              onClick={() =>
                handleStatusUpdate(RecruitmentSessionStatus.SCREENING)
              }
            >
              <Clock size={13} />
              Sàng lọc
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="rcw-messages">
        {isLoading ? (
          <div className="rcw-loading">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="rcw-empty">
            <MessageSquare size={44} />
            <p>Chưa có tin nhắn nào</p>
            <span>Bắt đầu cuộc trò chuyện với ứng viên</span>
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
                    src={resolveAvatarUrl(message.senderAvatar || candidateAvatar)}
                    alt={message.senderName || candidateName}
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
                      onClick={() =>
                        window.open(extractGifUrl(message.content)!, '_blank')
                      }
                    />
                  ) : (
                    <div className="rcw-message__bubble">{message.content}</div>
                  )}
                  <div className="rcw-message__meta">
                    <span>{formatTime(message.createdAt)}</span>
                    {isOwn && (
                      <span className="rcw-message__status">
                        {message.isRead ? (
                          <CheckCheck size={13} />
                        ) : (
                          <Check size={13} />
                        )}
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

      {/* Input */}
      <div className="rcw-input">
        <button
          type="button"
          className="rcw-input__action"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
          }}
          title="Biểu tượng cảm xúc"
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
        >
          <ImageIcon size={18} />
        </button>

        <input
          className="rcw-input__field"
          type="text"
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (newMessage.trim() && !isSending) {
                handleSendMessage(e as unknown as React.FormEvent);
              }
            }
          }}
          disabled={isSending}
        />
        <button
          type="button"
          className="rcw-send-btn"
          onClick={(e) => handleSendMessage(e as unknown as React.FormEvent)}
          disabled={!newMessage.trim() || isSending}
          title="Gửi"
        >
          <Send size={18} />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="rcw-emoji-wrap">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* GIF Picker */}
        {showGifPicker && (
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
