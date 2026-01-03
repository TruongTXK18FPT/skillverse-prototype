import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  ArrowLeft,
  User,
  MoreVertical,
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { 
  getConversation, 
  sendMessage as sendPreChatMessage, 
  sendAsMentor,
  markRead,
  type PreChatMessageResponse 
} from '../../services/preChatService';
import { API_BASE_URL } from '../../services/axiosInstance';
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
  onBack
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

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load conversation
  useEffect(() => {
    loadMessages();
    // Mark as read
    if (!isMyRoleMentor) {
      markRead(counterpartId).catch(err => console.error('Mark read failed:', err));
    }
  }, [counterpartId]);

  const loadMessages = async () => {
    try {
      const response = await getConversation(counterpartId, 0, 100);
      const formattedMessages: Message[] = response.content.map((msg: PreChatMessageResponse) => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.createdAt
      }));
      setMessages(formattedMessages.reverse()); // Oldest first
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      let response: PreChatMessageResponse;
      if (isMyRoleMentor) {
        // I'm mentor, sending to learner
        response = await sendAsMentor(counterpartId, messageText);
      } else {
        // I'm learner, sending to mentor
        response = await sendPreChatMessage(counterpartId, messageText);
      }

      // Add to messages
      const newMessage: Message = {
        id: response.id,
        senderId: response.senderId,
        content: response.content,
        timestamp: response.createdAt
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Gửi tin nhắn thất bại');
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

  const handleEmojiSelect = (emoji: string, isCustom?: boolean, customUrl?: string) => {
    // emoji is the actual emoji character or URL, not an object
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = async (gifUrl: string, previewUrl: string) => {
    setShowGifPicker(false);
    setIsSending(true);
    
    try {
      let response: PreChatMessageResponse;
      // Send GIF URL as message content
      if (isMyRoleMentor) {
        response = await sendAsMentor(counterpartId, `[GIF]${gifUrl}`);
      } else {
        response = await sendPreChatMessage(counterpartId, `[GIF]${gifUrl}`);
      }

      const newMessage: Message = {
        id: response.id,
        senderId: response.senderId,
        content: response.content,
        timestamp: response.createdAt
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send GIF:', error);
      alert('Gửi GIF thất bại');
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
      minute: '2-digit'
    });
  };

  return (
    <div className="mentor-chat-window">
      {/* Header */}
      <div className="mentor-chat-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        
        <div className="mentor-chat-header-info">
          <img 
            src={resolveAvatarUrl(counterpartAvatar)} 
            alt={counterpartName}
            className="mentor-avatar"
          />
          <div className="mentor-info">
            <h3>{counterpartName}</h3>
            <span className="mentor-role">
              {isMyRoleMentor ? 'Học viên' : 'Mentor'}
            </span>
          </div>
        </div>

        <div className="mentor-chat-header-actions">
          <button className="header-action-btn" title="Tìm kiếm">
            <Search size={20} />
          </button>
          <button className="header-action-btn" title="Thêm">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="mentor-chat-messages">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          const isGif = msg.content.startsWith('[GIF]');
          const gifUrl = isGif ? msg.content.replace('[GIF]', '') : null;
          
          return (
            <div 
              key={msg.id} 
              className={`mentor-message ${isMine ? 'mine' : 'theirs'}`}
            >
              {!isMine && (
                <img 
                  src={resolveAvatarUrl(counterpartAvatar)} 
                  alt="" 
                  className="msg-avatar"
                />
              )}
              <div className="msg-content">
                <div className={`msg-bubble ${isGif ? 'gif-message' : ''}`}>
                  {isGif && gifUrl ? (
                    <img 
                      src={gifUrl} 
                      alt="GIF" 
                      className="msg-gif-image"
                      onClick={() => window.open(gifUrl, '_blank')}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="msg-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mentor-chat-input">
        <button 
          className="input-action-btn"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
          }}
          title="Emoji"
        >
          <Smile size={22} />
        </button>

        <button 
          className="input-action-btn gif-btn"
          onClick={() => {
            setShowGifPicker(!showGifPicker);
            setShowEmojiPicker(false);
          }}
          title="GIF"
        >
          <ImageIcon size={22} />
        </button>

        <textarea
          className="message-input"
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />

        <button 
          className="send-btn"
          onClick={handleSendMessage}
          disabled={isSending || !inputText.trim()}
        >
          <Send size={20} />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="gif-picker-container">
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
