import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, CheckCheck, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotificationDropdown.css'; // Reuse styles
import { getThreads } from '../services/preChatService';

interface RecentChat {
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  lastMessage: string;
  timestamp: string; // JSON stringified date
  unread: number;
  isMyRoleMentor?: boolean;
}

type Props = { inline?: boolean; collapsible?: boolean };

const MessageDropdown: React.FC<Props> = ({ inline, collapsible }) => {
  const [chats, setChats] = useState<RecentChat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [inlineOpen, setInlineOpen] = useState<boolean>(!collapsible);

  const fetchChats = async () => {
    try {
      const threads = await getThreads();
      const mapped: RecentChat[] = threads.map(t => ({
        mentorId: t.counterpartId.toString(),
        mentorName: t.counterpartName,
        mentorAvatar: t.counterpartAvatar || '/images/meowl.jpg',
        lastMessage: t.lastContent,
        timestamp: t.lastTime,
        unread: t.unreadCount,
        isMyRoleMentor: t.isMyRoleMentor
      }));
      setChats(mapped);
    } catch (error) {
      console.error('Failed to load chats', error);
    }
  };

  useEffect(() => {
    fetchChats();
    // Poll for updates
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchChats();
    }
    setIsOpen(!isOpen);
  };

  const handleChatClick = (chat: RecentChat) => {
    setIsOpen(false);
    // Navigate to mentorship page with state to open chat
    navigate('/mentorship', { 
      state: { 
        openChatWith: chat.mentorId,
        name: chat.mentorName,
        avatar: chat.mentorAvatar,
        isMyRoleMentor: chat.isMyRoleMentor
      } 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  if (inline) {
    return (
      <div className={`notification-inline ${inlineOpen ? '' : 'collapsed'}`} ref={dropdownRef}>
        <button
          className="inline-toggle"
          onClick={() => {
            setInlineOpen(v => !v);
            if (!inlineOpen) fetchChats();
          }}
        >
          <div className="inline-header-left">
            <MessageSquare size={16} />
            <span>Tin nhắn</span>
          </div>
          <div className="inline-header-right">
             <ChevronDown size={16} className={`inline-chevron ${inlineOpen ? 'open' : ''}`} />
          </div>
        </button>

        <div className="notification-list compact">
          {chats.length === 0 ? (
            <div className="notification-empty">Không có tin nhắn</div>
          ) : (
            chats.slice(0, 5).map(chat => (
              <div
                key={chat.mentorId}
                className="notification-item"
                onClick={() => handleChatClick(chat)}
              >
                <div className="notification-icon-wrapper">
                  <img
                    src={chat.mentorAvatar}
                    alt={chat.mentorName}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div className="notification-content">
                  <p className="notification-title">{chat.mentorName}</p>
                  <p className="notification-message truncate">{chat.lastMessage}</p>
                  <span className="notification-time">{formatTime(chat.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="notification-trigger" onClick={handleToggle}>
        <MessageSquare size={20} />
        {/* Badge could go here if we tracked unread count globally */}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Tin nhắn</h3>
          </div>

          <div className="notification-list">
            {chats.length === 0 ? (
              <div className="notification-empty">Không có tin nhắn nào</div>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.mentorId} 
                  className="notification-item"
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="notification-icon-wrapper">
                    <img 
                      src={chat.mentorAvatar} 
                      alt={chat.mentorName} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{chat.mentorName}</p>
                    <p className="notification-message truncate" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.lastMessage}
                    </p>
                    <span className="notification-time">{formatTime(chat.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="notification-footer">
            <button onClick={() => navigate('/messages')}>Xem tất cả</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDropdown;
