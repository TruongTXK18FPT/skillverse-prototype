import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  Smile,
  ArrowLeft,
  MoreVertical,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getConversation,
  sendMessage as sendMentorChatMessage,
  markRead,
  type PreChatMessageResponse,
} from '../../services/preChatService';
import { API_BASE_URL } from '../../services/axiosInstance';
import { showAppError } from '../../context/ToastContext';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import './MentorChatWindow.css';

interface MentorChatWindowProps {
  bookingId: number;
  counterpartId: number;
  counterpartName: string;
  counterpartAvatar?: string;
  isMyRoleMentor: boolean;
  currentUserId: number;
  chatEnabled: boolean;
  bookingStatus?: string;
  bookingStartTime?: string;
  bookingEndTime?: string;
  onBack: () => void;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
}

const MentorChatWindow: React.FC<MentorChatWindowProps> = ({
  bookingId,
  counterpartId,
  counterpartName,
  counterpartAvatar,
  isMyRoleMentor,
  currentUserId,
  chatEnabled,
  bookingStatus,
  bookingStartTime,
  bookingEndTime,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [resolvedCounterpartName, setResolvedCounterpartName] = useState(counterpartName);
  const [resolvedCounterpartAvatar, setResolvedCounterpartAvatar] = useState(counterpartAvatar || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sortMessagesByTimeAsc = (items: Message[]): Message[] => {
    return [...items].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  };

  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (raw.startsWith('/')) return `${apiRoot}${raw}`;
    return `${apiRoot}/${raw}`;
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setResolvedCounterpartName(counterpartName?.trim() || (isMyRoleMentor ? 'Học viên' : 'Mentor'));
    setResolvedCounterpartAvatar(counterpartAvatar?.trim() || '');
  }, [counterpartAvatar, counterpartName, isMyRoleMentor]);

  useEffect(() => {
    void loadMessages();
    markRead(bookingId).catch((err) =>
      console.error('Mark read failed:', err),
    );
  }, [bookingId]);

  const loadMessages = async () => {
    try {
      const response = await getConversation(bookingId, 0, 100);
      const formattedMessages: Message[] = response.content.map(
        (msg: PreChatMessageResponse) => ({
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          timestamp: msg.createdAt,
        }),
      );
      setMessages(sortMessagesByTimeAsc(formattedMessages));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatEnabled || !inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const response = await sendMentorChatMessage(bookingId, messageText);
      const newMessage: Message = {
        id: response.id,
        senderId: response.senderId,
        content: response.content,
        timestamp: response.createdAt,
      };
      setMessages((prev) => sortMessagesByTimeAsc([...prev, newMessage]));
    } catch (error) {
      console.error('Failed to send message:', error);
      showAppError('Gửi tin nhắn thất bại', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    if (!chatEnabled) return;

    setIsSending(true);
    try {
      const response = await sendMentorChatMessage(bookingId, `[GIF]${gifUrl}`);
      const newMessage: Message = {
        id: response.id,
        senderId: response.senderId,
        content: response.content,
        timestamp: response.createdAt,
      };
      setMessages((prev) => sortMessagesByTimeAsc([...prev, newMessage]));
    } catch (error) {
      console.error('Failed to send GIF:', error);
      showAppError('Gửi GIF thất bại', 'Không thể gửi GIF. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  };

  const formatBookingTime = (timestamp?: string): string | null => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  };

  const bookingWindowLabel = bookingStartTime && bookingEndTime
    ? `${formatBookingTime(bookingStartTime)} - ${formatBookingTime(bookingEndTime)}`
    : null;

  return (
    <div className="mcw-window">
      <div className="mcw-header">
        <button className="mcw-back-btn" onClick={onBack} title="Quay lại">
          <ArrowLeft size={18} />
        </button>

        <div className="mcw-info">
          <img
            src={resolveAvatarUrl(resolvedCounterpartAvatar)}
            alt={resolvedCounterpartName}
            className="mcw-avatar"
          />
          <div className="mcw-user-info">
            <h3 className="mcw-user-info__name">{resolvedCounterpartName}</h3>
            <span className="mcw-user-info__role">
              {isMyRoleMentor ? 'Học viên' : 'Mentor'}
            </span>
          </div>
        </div>

        <div className="mcw-header-actions">
          <button className="mcw-header-btn" title="Tìm kiếm">
            <Search size={18} />
          </button>
          <button className="mcw-header-btn" title="Them">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="mcw-msg__time" style={{ padding: '0 16px 8px', display: 'block' }}>
        {bookingStatus ? `Booking ${bookingStatus}` : `Mentor booking #${bookingId}`}
        {bookingWindowLabel ? ` • ${bookingWindowLabel}` : ''}
        {!chatEnabled ? ' • Chat đã đóng' : ''}
      </div>

      <div className="mcw-messages">
        {messages.length === 0 && (
          <div className="mcw-empty">
            <p className="mcw-empty__title">Chưa có tin nhắn nào</p>
            <p className="mcw-empty__desc">
              {chatEnabled
                ? 'Hãy bắt đầu cuộc trò chuyện cho booking này ngay bên dưới.'
                : 'Booking này đã đóng chat.'}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          const isGif = msg.content.startsWith('[GIF]');
          const gifUrl = isGif ? msg.content.replace('[GIF]', '') : null;

          return (
            <div
              key={msg.id}
              className={`mcw-msg ${isMine ? 'mcw-msg--mine' : 'mcw-msg--theirs'}`}
            >
              {!isMine && (
                <img
                  src={resolveAvatarUrl(resolvedCounterpartAvatar)}
                  alt={resolvedCounterpartName || `${counterpartId}`}
                  className="mcw-msg__avatar"
                />
              )}
              <div className="mcw-msg__body">
                <div
                  className={`mcw-msg__bubble${isGif ? ' mcw-msg__bubble--gif' : ''}`}
                >
                  {isGif && gifUrl ? (
                    <img
                      src={gifUrl}
                      alt="GIF"
                      className="mcw-msg__gif"
                      onClick={() => window.open(gifUrl, '_blank')}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="mcw-msg__time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="mcw-input">
        <button
          className="mcw-input__action"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
          }}
          title="Biểu tượng cảm xúc"
          disabled={!chatEnabled}
        >
          <Smile size={20} />
        </button>

        <button
          className="mcw-input__action"
          onClick={() => {
            setShowGifPicker(!showGifPicker);
            setShowEmojiPicker(false);
          }}
          title="GIF"
          disabled={!chatEnabled}
        >
          <ImageIcon size={20} />
        </button>

        <textarea
          className="mcw-input__textarea"
          placeholder={chatEnabled ? 'Nhập tin nhắn...' : 'Session chat đã đóng'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={!chatEnabled}
        />

        <button
          className="mcw-send-btn"
          onClick={() => void handleSendMessage()}
          disabled={!chatEnabled || isSending || !inputText.trim()}
          title="Gửi"
        >
          <Send size={18} />
        </button>

        {showEmojiPicker && (
          <div className="mcw-emoji-wrap">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {showGifPicker && (
          <div className="mcw-gif-wrap">
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

export default MentorChatWindow;
