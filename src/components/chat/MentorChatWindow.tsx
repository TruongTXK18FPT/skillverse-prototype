import React, { useState, useEffect, useRef } from 'react';
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
  sendMessage as sendPreChatMessage,
  sendAsMentor,
  markRead,
  type PreChatMessageResponse,
} from '../../services/preChatService';
import { API_BASE_URL } from '../../services/axiosInstance';
import { showAppError } from '../../context/ToastContext';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import './MentorChatWindow.css';

interface MentorChatWindowProps {
  counterpartId: number;
  counterpartName: string;
  counterpartAvatar?: string;
  isMyRoleMentor: boolean;
  currentUserId: number;
  onBack: () => void;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
}

const MentorChatWindow: React.FC<MentorChatWindowProps> = ({
  counterpartId,
  counterpartName,
  counterpartAvatar,
  isMyRoleMentor,
  currentUserId,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (raw.startsWith('/')) return `${apiRoot}${raw}`;
    return `${apiRoot}/${raw}`;
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load conversation
  useEffect(() => {
    loadMessages();
    if (!isMyRoleMentor) {
      markRead(counterpartId).catch((err) =>
        console.error('Mark read failed:', err),
      );
    }
  }, [counterpartId]);

  const loadMessages = async () => {
    try {
      const response = await getConversation(counterpartId, 0, 100);
      const formattedMessages: Message[] = response.content.map(
        (msg: PreChatMessageResponse) => ({
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          timestamp: msg.createdAt,
        }),
      );
      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      let response: PreChatMessageResponse;
      if (isMyRoleMentor) {
        response = await sendAsMentor(counterpartId, messageText);
      } else {
        response = await sendPreChatMessage(counterpartId, messageText);
      }

      const newMessage: Message = {
        id: response.id,
        senderId: response.senderId,
        content: response.content,
        timestamp: response.createdAt,
      };
      setMessages((prev) => [...prev, newMessage]);
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
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    setIsSending(true);

    try {
      let response: PreChatMessageResponse;
      if (isMyRoleMentor) {
        response = await sendAsMentor(counterpartId, `[GIF]${gifUrl}`);
      } else {
        response = await sendPreChatMessage(counterpartId, `[GIF]${gifUrl}`);
      }

      const newMessage: Message = {
        id: response.id,
        senderId: response.senderId,
        content: response.content,
        timestamp: response.createdAt,
      };
      setMessages((prev) => [...prev, newMessage]);
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
    if (diffHours < 24)
      return `${diffHours} giờ trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  };

  return (
    <div className="mcw-window">
      {/* Header */}
      <div className="mcw-header">
        <button className="mcw-back-btn" onClick={onBack} title="Quay lại">
          <ArrowLeft size={18} />
        </button>

        <div className="mcw-info">
          <img
            src={resolveAvatarUrl(counterpartAvatar)}
            alt={counterpartName}
            className="mcw-avatar"
          />
          <div className="mcw-user-info">
            <h3 className="mcw-user-info__name">{counterpartName}</h3>
            <span className="mcw-user-info__role">
              {isMyRoleMentor ? 'Học viên' : 'Mentor'}
            </span>
          </div>
        </div>

        <div className="mcw-header-actions">
          <button className="mcw-header-btn" title="Tìm kiếm">
            <Search size={18} />
          </button>
          <button className="mcw-header-btn" title="Thêm">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="mcw-messages">
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
                  src={resolveAvatarUrl(counterpartAvatar)}
                  alt=""
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

      {/* Input */}
      <div className="mcw-input">
        <button
          className="mcw-input__action"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
          }}
          title="Biểu tượng cảm xúc"
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
        >
          <ImageIcon size={20} />
        </button>

        <textarea
          className="mcw-input__textarea"
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />

        <button
          className="mcw-send-btn"
          onClick={handleSendMessage}
          disabled={isSending || !inputText.trim()}
          title="Gửi"
        >
          <Send size={18} />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mcw-emoji-wrap">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* GIF Picker */}
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
