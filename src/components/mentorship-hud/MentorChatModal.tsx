import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, User } from 'lucide-react';
import './uplink-styles.css';
import { getConversation, sendMessage, sendAsMentor, markRead } from '../../services/preChatService';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'mentor';
  content: string;
  timestamp: Date;
}

interface MentorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string; // This is counterpartId
  mentorName: string;
  mentorAvatar: string;
  isMyRoleMentor?: boolean;
}

const MentorChatModal: React.FC<MentorChatModalProps> = ({
  isOpen,
  onClose,
  mentorId,
  mentorName,
  mentorAvatar,
  isMyRoleMentor = false
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = async () => {
    if (!mentorId || !user) return;
    try {
      const data = await getConversation(parseInt(mentorId));
      const mapped: Message[] = data.content.map(m => ({
        id: m.id.toString(),
        // If I am the sender, it's 'user' (right side). If not, it's 'mentor' (left side).
        sender: m.senderId === user.id ? 'user' : 'mentor',
        content: m.content,
        timestamp: new Date(m.createdAt)
      }));
      setMessages(mapped);
      
      // Mark as read
      if (isMyRoleMentor) {
          await markRead(user.id);
      } else {
          await markRead(parseInt(mentorId));
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  useEffect(() => {
    if (isOpen && mentorId) {
      fetchMessages();
      // Poll every 3 seconds
      pollingRef.current = setInterval(fetchMessages, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, mentorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const content = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      if (isMyRoleMentor) {
        await sendAsMentor(parseInt(mentorId), content);
      } else {
        await sendMessage(parseInt(mentorId), content);
      }
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message', error);
      // Restore input on error?
      setInputValue(content);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="uplink-modal-overlay" onClick={onClose}>
      <div className="uplink-chat-window" onClick={e => e.stopPropagation()}>
        <div className="uplink-chat-header">
          <div className="uplink-chat-user">
            <img src={mentorAvatar} alt={mentorName} className="uplink-chat-avatar" />
            <div>
              <h3 className="uplink-chat-name">{mentorName}</h3>
              <span className="uplink-chat-status">Trực tuyến</span>
            </div>
          </div>
          <button className="uplink-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="uplink-chat-messages">
          {messages.length === 0 && (
             <div className="uplink-message uplink-message-mentor">
               <div className="uplink-message-bubble">
                 {isMyRoleMentor 
                   ? `Bắt đầu trò chuyện với học viên ${mentorName}`
                   : `Xin chào! Tôi là ${mentorName}. Tôi có thể giúp gì cho bạn?`}
               </div>
             </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`uplink-message ${msg.sender === 'user' ? 'uplink-message-user' : 'uplink-message-mentor'}`}>
              <div style={{ display: 'flex', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                <div className="uplink-message-avatar">
                  {msg.sender === 'user' ? (
                    user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt="Me" 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--uplink-primary)' }} 
                      />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--uplink-primary)' }}>
                        <User size={16} color="white" />
                      </div>
                    )
                  ) : (
                    mentorAvatar ? (
                      <img 
                        src={mentorAvatar} 
                        alt={mentorName} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--uplink-border)' }} 
                      />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--uplink-border)' }}>
                        <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{mentorName.charAt(0)}</span>
                      </div>
                    )
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: 'calc(100% - 40px)' }}>
                  <div className="uplink-message-bubble">
                    {msg.content}
                  </div>
                  <span className="uplink-message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="uplink-message uplink-message-user">
              <div className="uplink-message-bubble typing">
                <Loader2 size={16} className="animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="uplink-chat-input-area">
          <input
            type="text"
            className="uplink-chat-input"
            placeholder="Nhập tin nhắn..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <button className="uplink-send-btn" onClick={handleSendMessage} disabled={isLoading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorChatModal;
