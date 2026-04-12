import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, ChevronDown, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThreads } from '../../services/preChatService';
import recruitmentChatService from '../../services/recruitmentChatService';
import { RecruitmentSessionResponse } from '../../data/portfolioDTOs';
import { API_BASE_URL } from '../../services/axiosInstance';
import '../../styles/NotificationDropdown.css';

interface DropdownChat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  channel: 'PRECHAT' | 'RECRUITMENT';
  isMyRoleMentor?: boolean;
  bookingId?: number;
}

type Props = { inline?: boolean; collapsible?: boolean };

const MessageDropdown: React.FC<Props> = ({ inline, collapsible }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<DropdownChat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inlineOpen, setInlineOpen] = useState<boolean>(!collapsible);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (trimmed.startsWith('/')) return `${apiRoot}${trimmed}`;
    return `${apiRoot}/${trimmed}`;
  };

  const mapRecruitmentChat = (session: RecruitmentSessionResponse): DropdownChat => {
    const isRecruiter = user?.roles.includes('RECRUITER') ?? false;
    return {
      id: session.id.toString(),
      name: isRecruiter
        ? session.candidateFullName || 'Ung vien'
        : session.recruiterName || session.recruiterCompany || 'Nha tuyen dung',
      avatar: resolveAvatarUrl(isRecruiter ? session.candidateAvatar : session.recruiterAvatar),
      lastMessage: session.lastMessagePreview || session.jobTitle || 'Cuoc tro chuyen tuyen dung',
      timestamp: session.lastMessageAt || session.createdAt,
      unread: session.unreadCount,
      channel: 'RECRUITMENT',
    };
  };

  const fetchChats = async () => {
    try {
      const canAccessRecruitment = Boolean(
        user?.roles.includes('RECRUITER') || user?.roles.includes('USER'),
      );

      const [threads, recruitmentResult] = await Promise.all([
        getThreads(),
        canAccessRecruitment
          ? (user?.roles.includes('RECRUITER')
              ? recruitmentChatService.getRecruiterSessions(0, 10)
              : recruitmentChatService.getCandidateSessions(0, 10))
          : Promise.resolve({ sessions: [] as RecruitmentSessionResponse[], totalElements: 0, totalPages: 0 }),
      ]);

      const mentorChats: DropdownChat[] = threads.map((thread) => ({
        id: `mentor-booking:${thread.bookingId}`,
        bookingId: thread.bookingId,
        name: thread.counterpartName || (thread.isMyRoleMentor ? 'Hoc vien' : 'Mentor'),
        avatar: resolveAvatarUrl(thread.counterpartAvatar),
        lastMessage: thread.lastContent,
        timestamp: thread.lastTime,
        unread: thread.unreadCount,
        channel: 'PRECHAT',
        isMyRoleMentor: thread.isMyRoleMentor,
      }));

      const recruitmentChats = recruitmentResult.sessions.map(mapRecruitmentChat);
      const mergedChats = [...mentorChats, ...recruitmentChats].sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      );

      setChats(mergedChats);
    } catch (error) {
      console.error('Failed to load chats', error);
    }
  };

  useEffect(() => {
    const shouldPoll = inline ? inlineOpen : isOpen;
    if (!shouldPoll) return;

    void fetchChats();
    const interval = window.setInterval(() => {
      void fetchChats();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [inline, inlineOpen, isOpen, user]);

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
      void fetchChats();
    }
    setIsOpen(!isOpen);
  };

  const handleChatClick = (chat: DropdownChat) => {
    setIsOpen(false);

    if (chat.channel === 'RECRUITMENT') {
      navigate('/messages', {
        state: {
          openChatWith: chat.id,
          type: 'RECRUITMENT',
        },
      });
      return;
    }

    navigate('/messages', {
      state: {
        openChatWith: chat.bookingId ?? chat.id,
        bookingId: chat.bookingId,
        type: 'MENTOR',
        name: chat.name,
        avatar: chat.avatar,
        isMyRoleMentor: chat.isMyRoleMentor,
      },
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} phut truoc`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} gio truoc`;

    return date.toLocaleDateString('vi-VN');
  };

  const totalUnread = chats.reduce((count, chat) => count + chat.unread, 0);

  if (inline) {
    return (
      <div className={`notification-inline ${inlineOpen ? '' : 'collapsed'}`} ref={dropdownRef}>
        <button
          className="inline-toggle"
          onClick={() => {
            setInlineOpen((value) => !value);
            if (!inlineOpen) void fetchChats();
          }}
        >
          <div className="inline-header-left">
            <MessageSquare size={16} />
            <span>Tin nhan</span>
          </div>
          <div className="inline-header-right">
            {totalUnread > 0 && (
              <span className="notification-badge inline-badge">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
            <ChevronDown size={16} className={`inline-chevron ${inlineOpen ? 'open' : ''}`} />
          </div>
        </button>

        <div className="notification-list compact">
          {chats.length === 0 ? (
            <div className="notification-empty">Khong co tin nhan</div>
          ) : (
            chats.slice(0, 5).map((chat) => (
              <div
                key={`${chat.channel}-${chat.id}`}
                className={`notification-item ${chat.unread > 0 ? 'unread' : ''}`}
                onClick={() => handleChatClick(chat)}
              >
                <div className="notification-icon-wrapper">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div className="notification-content">
                  <p className="notification-title">
                    {chat.channel === 'RECRUITMENT' && (
                      <Briefcase size={12} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    )}
                    {chat.name}
                  </p>
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
        {totalUnread > 0 && (
          <span className="notification-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Tin nhan</h3>
          </div>

          <div className="notification-list">
            {chats.length === 0 ? (
              <div className="notification-empty">Khong co tin nhan nao</div>
            ) : (
              chats.map((chat) => (
                <div
                  key={`${chat.channel}-${chat.id}`}
                  className={`notification-item ${chat.unread > 0 ? 'unread' : ''}`}
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="notification-icon-wrapper">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">
                      {chat.channel === 'RECRUITMENT' && (
                        <Briefcase size={12} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      )}
                      {chat.name}
                    </p>
                    <p
                      className="notification-message truncate"
                      style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {chat.lastMessage}
                    </p>
                    <span className="notification-time">{formatTime(chat.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button onClick={() => navigate('/messages')}>Xem tat ca</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDropdown;
