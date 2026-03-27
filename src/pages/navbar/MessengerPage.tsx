import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  UserCircle,
  Home,
  MessageCircle,
  Settings,
  Pin,
  X,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  GroupChatWindow,
  MentorChatWindow,
  FamilyChatWindow,
  RecruiterChatWindow,
} from '../../components/chat';
import MessengerWelcome from '../../components/chat/MessengerWelcome';
import { getMyGroups } from '../../services/groupChatService';
import { getThreads } from '../../services/preChatService';
import recruitmentChatService from '../../services/recruitmentChatService';
import userService from '../../services/userService';
import { getMentorProfile } from '../../services/mentorProfileService';
import parentService from '../../services/parentService';
import studentLinkService from '../../services/studentLinkService';
import { API_BASE_URL } from '../../services/axiosInstance';
import { RecruitmentSessionResponse } from '../../data/portfolioDTOs';
import { useChatSettings } from '../../context/ChatSettingsContext';
import { showAppInfo } from '../../context/ToastContext';
import '../../styles/MessengerPage.css';

interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  type: 'MENTOR' | 'FAMILY' | 'GROUP' | 'RECRUITMENT';
  isOnline?: boolean;
  isPinned?: boolean;
  memberCount?: number;
  mentorName?: string;
  isMyRoleMentor?: boolean;
  isParent?: boolean;
  recruitmentSession?: RecruitmentSessionResponse;
}

const MessengerPage: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { settings, updateSetting } = useChatSettings();

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  // Synthetic contact created from booking navigation (when no thread exists yet)
  const [syntheticContact, setSyntheticContact] = useState<ChatContact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'MENTOR' | 'FAMILY' | 'GROUP' | 'RECRUITMENT'>('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [recruitmentSessions, setRecruitmentSessions] = useState<RecruitmentSessionResponse[]>([]);

  const hasHandledNav = useRef(false);
  const hasHandledSessionParam = useRef(false);
  const canAccessRecruitmentMessages = Boolean(
    user?.roles.includes('RECRUITER') || user?.roles.includes('USER')
  );

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('skillverse_messenger_welcome_seen');
    if (!hasSeenWelcome && user) {
      setShowWelcome(true);
    }
  }, [user]);

  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (trimmed.startsWith('/')) return `${apiRoot}${trimmed}`;
    return `${apiRoot}/${trimmed}`;
  };

  const loadRecruitmentSessions = async (): Promise<RecruitmentSessionResponse[]> => {
    if (!user) return [];

    try {
      const isRecruiter = user.roles.includes('RECRUITER');
      const isCandidate = user.roles.includes('USER');

      if (!isRecruiter && !isCandidate) {
        setRecruitmentSessions([]);
        return [];
      }

      const result = isRecruiter
        ? await recruitmentChatService.getRecruiterSessions(0, 50)
        : await recruitmentChatService.getCandidateSessions(0, 50);

      setRecruitmentSessions(result.sessions);
      return result.sessions;
    } catch (error) {
      console.error('Failed to load recruitment sessions:', error);
      return [];
    }
  };

  const mapRecruitmentContact = (session: RecruitmentSessionResponse): ChatContact => {
    const isRecruiter = user?.roles.includes('RECRUITER') ?? false;
    const displayName = isRecruiter
      ? session.candidateFullName || 'Ứng viên'
      : session.recruiterName || session.recruiterCompany || 'Nhà tuyển dụng';
    const displayAvatar = isRecruiter ? session.candidateAvatar : session.recruiterAvatar;
    const lastMessage = session.lastMessagePreview
      || (session.jobTitle
        ? `${isRecruiter ? 'Ứng viên chờ' : 'Trao đổi về'} ${session.jobTitle}`
        : 'Cuộc trò chuyện tuyển dụng');

    return {
      id: session.id.toString(),
      name: displayName,
      avatar: resolveAvatarUrl(displayAvatar),
      lastMessage,
      timestamp: session.lastMessageAt || session.createdAt,
      unread: session.unreadCount,
      type: 'RECRUITMENT',
      recruitmentSession: session,
    };
  };

  useEffect(() => {
    if (!user || loading) return;
    loadContacts();
    const interval = setInterval(loadContacts, 10000);
    return () => clearInterval(interval);
  }, [user, loading, activeTab]);

  useEffect(() => {
    if (hasHandledNav.current || !location.state?.openChatWith) return;

    const targetId = location.state.openChatWith.toString();
    const type = location.state.type || 'GROUP';

    if (type === 'GROUP') {
      setActiveTab('GROUP');
    } else if (type === 'FAMILY') {
      setActiveTab('FAMILY');
    } else if (type === 'RECRUITMENT') {
      const sessionExists = recruitmentSessions.some((session) => session.id.toString() === targetId);
      if (sessionExists || recruitmentSessions.length === 0) {
        setActiveTab('RECRUITMENT');
      }
    } else {
      setActiveTab('MENTOR');
      // When navigating from a booking, create a synthetic contact if no thread exists yet.
      // This allows the user to start chatting with the mentor even if they've never pre-chatted before.
      const existingContact = contacts.find(c => c.id === targetId && c.type === 'MENTOR');
      if (!existingContact && location.state.name) {
        const synthetic: ChatContact = {
          id: targetId,
          name: location.state.name || `Mentor #${targetId}`,
          avatar: resolveAvatarUrl(location.state.avatar || ''),
          lastMessage: 'Bắt đầu cuộc trò chuyện',
          timestamp: new Date().toISOString(),
          unread: 0,
          type: 'MENTOR',
          isOnline: Math.random() > 0.5,
          isMyRoleMentor: location.state.isMyRoleMentor ?? false,
        };
        setSyntheticContact(synthetic);
      }
    }

    setSelectedContactId(targetId);
    hasHandledNav.current = true;
  }, [location.state, recruitmentSessions, contacts]);

  // Handle direct navigation to a recruitment session via URL param (e.g. /messenger?sessionId=123)
  useEffect(() => {
    const sessionIdParam = searchParams.get('sessionId');
    if (!sessionIdParam || hasHandledSessionParam.current) return;

    const found = recruitmentSessions.find((s) => s.id.toString() === sessionIdParam);
    if (found) {
      hasHandledSessionParam.current = true;
      setActiveTab('RECRUITMENT');
      setSelectedContactId(sessionIdParam);
    }
  }, [searchParams, recruitmentSessions]);

  const loadContacts = async () => {
    if (!user) return;

    try {
      let allContacts: ChatContact[] = [];

      if (activeTab === 'GROUP' || activeTab === 'ALL') {
        const groups = await getMyGroups(user.id);
        const groupContacts: ChatContact[] = groups.map((group) => ({
          id: group.id.toString(),
          name: group.name,
          avatar: resolveAvatarUrl(group.avatarUrl),
          lastMessage: 'Nhóm học tập',
          timestamp: group.createdAt,
          unread: 0,
          type: 'GROUP',
          memberCount: group.memberCount || 0,
          mentorName: group.mentorName,
        }));
        allContacts = [...allContacts, ...groupContacts];
      }

      if (activeTab === 'MENTOR' || activeTab === 'ALL') {
        const threads = await getThreads();
        const mentorContacts: ChatContact[] = await Promise.all(
          threads.map(async (thread) => {
            let avatar = resolveAvatarUrl(thread.counterpartAvatar);

            try {
              if (thread.isMyRoleMentor) {
                const profile = await userService.getUserProfile(thread.counterpartId);
                avatar = resolveAvatarUrl(profile.avatarMediaUrl);
              } else {
                const profile = await getMentorProfile(thread.counterpartId);
                avatar = resolveAvatarUrl(profile.avatar);
              }
            } catch {
              // Keep fallback avatar.
            }

            return {
              id: thread.counterpartId.toString(),
              name: thread.counterpartName,
              avatar,
              lastMessage: thread.lastContent,
              timestamp: thread.lastTime,
              unread: thread.unreadCount,
              type: 'MENTOR',
              isOnline: Math.random() > 0.5,
              isMyRoleMentor: thread.isMyRoleMentor,
            };
          })
        );
        allContacts = [...allContacts, ...mentorContacts];
      }

      if (activeTab === 'FAMILY' || activeTab === 'ALL') {
        if (user.roles.includes('PARENT')) {
          try {
            const dashboard = await parentService.getDashboard();
            const familyContacts: ChatContact[] = dashboard.students.map((student) => ({
              id: student.id.toString(),
              name: student.displayName || student.fullName || `${student.firstName} ${student.lastName}`.trim(),
              avatar: resolveAvatarUrl(student.avatarUrl),
              lastMessage: 'Trò chuyện với con',
              timestamp: new Date().toISOString(),
              unread: 0,
              type: 'FAMILY',
              isOnline: false,
              isParent: true,
            }));
            allContacts = [...allContacts, ...familyContacts];
          } catch (error) {
            console.error('Failed to load family contacts:', error);
          }
        }

        if (user.roles.includes('USER') && !user.roles.includes('PARENT')) {
          try {
            const links = await studentLinkService.getStudentLinks();
            const activeParentLinks = links.filter(
              (link) => link.status === 'ACTIVE' && link.student.id === user.id
            );
            const parentContacts: ChatContact[] = activeParentLinks.map((link) => ({
              id: link.parent.id.toString(),
              name: link.parent.fullName || 'Phụ huynh',
              avatar: resolveAvatarUrl(link.parent.avatarUrl),
              lastMessage: 'Trò chuyện với phụ huynh',
              timestamp: link.updatedAt || new Date().toISOString(),
              unread: 0,
              type: 'FAMILY',
              isOnline: false,
              isParent: false,
            }));
            allContacts = [...allContacts, ...parentContacts];
          } catch (error) {
            console.log('Parent links not available:', error);
          }
        }
      }

      if (canAccessRecruitmentMessages && (activeTab === 'RECRUITMENT' || activeTab === 'ALL')) {
        const sessions = await loadRecruitmentSessions();
        const recruitmentContacts = sessions.map(mapRecruitmentContact);
        allContacts = [...allContacts, ...recruitmentContacts];
      }

      allContacts.sort((left, right) => {
        const leftTime = new Date(left.timestamp).getTime();
        const rightTime = new Date(right.timestamp).getTime();
        return rightTime - leftTime;
      });

      setContacts(allContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL' || contact.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId)
    ?? (syntheticContact?.id === selectedContactId ? syntheticContact : null);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('skillverse_messenger_welcome_seen', 'true');
  };

  const handleGetStarted = () => {
    handleWelcomeClose();
    const firstGroup = contacts.find((contact) => contact.type === 'GROUP');
    if (firstGroup) {
      setSelectedContactId(firstGroup.id);
      setActiveTab('GROUP');
    }
  };

  if (loading) {
    return (
      <div className="messenger-page">
        <div className="messenger-loading-container">
          <Users size={48} className="spinning" />
          <p>Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messenger-page">
      {showWelcome && (
        <MessengerWelcome
          onClose={handleWelcomeClose}
          onGetStarted={handleGetStarted}
        />
      )}

      {showSettings && (
        <div className="neon-settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="neon-settings-modal" onClick={(event) => event.stopPropagation()}>
            <div className="neon-settings-header">
              <h2>Cài đặt</h2>
              <button className="neon-settings-close" onClick={() => setShowSettings(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="neon-settings-body">
              <div className="neon-settings-section">
                <h3 className="neon-settings-section__title">THÔNG BÁO</h3>
                <div className="neon-settings-list">
                  <label className="neon-settings-item">
                    <div className="neon-settings-item__left">
                      <div className="neon-settings-item__icon neon-settings-item__icon--pink">
                        <MessageCircle size={16} />
                      </div>
                      <div>
                        <span className="neon-settings-item__label">Thông báo tin nhắn</span>
                        <span className="neon-settings-item__desc">Nhận thông báo khi có tin nhắn mới</span>
                      </div>
                    </div>
                    <label className="neon-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notifyNewMessage}
                        onChange={(e) => updateSetting('notifyNewMessage', e.target.checked)}
                      />
                      <span className="neon-toggle__slider neon-toggle__slider--pink" />
                    </label>
                  </label>
                  <label className="neon-settings-item">
                    <div className="neon-settings-item__left">
                      <div className="neon-settings-item__icon neon-settings-item__icon--pink">
                        <span className="neon-sound-icon">♪</span>
                      </div>
                      <div>
                        <span className="neon-settings-item__label">Âm thanh thông báo</span>
                        <span className="neon-settings-item__desc">Phát âm thanh khi có tin nhắn mới</span>
                      </div>
                    </div>
                    <label className="neon-toggle">
                      <input
                        type="checkbox"
                        checked={settings.soundNotification}
                        onChange={(e) => updateSetting('soundNotification', e.target.checked)}
                      />
                      <span className="neon-toggle__slider neon-toggle__slider--pink" />
                    </label>
                  </label>
                </div>
              </div>

              <div className="neon-settings-section">
                <h3 className="neon-settings-section__title">HIỂN THỊ</h3>
                <div className="neon-settings-list">
                  <label className="neon-settings-item">
                    <div className="neon-settings-item__left">
                      <div className="neon-settings-item__icon neon-settings-item__icon--cyan">
                        <UserCircle size={16} />
                      </div>
                      <div>
                        <span className="neon-settings-item__label">Hiển thị ảnh đại diện</span>
                        <span className="neon-settings-item__desc">Hiện ảnh đại diện của người nhắn tin</span>
                      </div>
                    </div>
                    <label className="neon-toggle">
                      <input
                        type="checkbox"
                        checked={settings.showAvatar}
                        onChange={(e) => updateSetting('showAvatar', e.target.checked)}
                      />
                      <span className="neon-toggle__slider neon-toggle__slider--cyan" />
                    </label>
                  </label>
                  <label className="neon-settings-item">
                    <div className="neon-settings-item__left">
                      <div className="neon-settings-item__icon neon-settings-item__icon--cyan">
                        <div className="neon-online-dot" />
                      </div>
                      <div>
                        <span className="neon-settings-item__label">Hiển thị trạng thái online</span>
                        <span className="neon-settings-item__desc">Thấy người khác đang trực tuyến hay không</span>
                      </div>
                    </div>
                    <label className="neon-toggle">
                      <input
                        type="checkbox"
                        checked={settings.showOnlineStatus}
                        onChange={(e) => updateSetting('showOnlineStatus', e.target.checked)}
                      />
                      <span className="neon-toggle__slider neon-toggle__slider--cyan" />
                    </label>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateNew && (
        <div className="modal-overlay" onClick={() => setShowCreateNew(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo cuộc trò chuyện mới</h2>
              <button onClick={() => setShowCreateNew(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="create-new-options">
                <button
                  className="create-option"
                  onClick={() => {
                    setShowCreateNew(false);
                    showAppInfo('Tính năng đang phát triển', 'Tính năng tạo nhóm mới đang phát triển');
                  }}
                >
                  <Users size={32} />
                  <h3>Tạo nhóm học tập</h3>
                  <p>Tạo nhóm mới với mentor và học viên</p>
                </button>
                <button
                  className="create-option"
                  onClick={() => {
                    setShowCreateNew(false);
                    setActiveTab('MENTOR');
                  }}
                >
                  <UserCircle size={32} />
                  <h3>Nhắn tin với Mentor</h3>
                  <p>Bắt đầu cuộc trò chuyện 1-1</p>
                </button>
                {user && user.roles.includes('PARENT') && (
                  <button
                    className="create-option"
                    onClick={() => {
                      setShowCreateNew(false);
                      setActiveTab('FAMILY');
                    }}
                  >
                    <MessageCircle size={32} />
                    <h3>Chat với con</h3>
                    <p>Trò chuyện với con em</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`messenger-sidebar ${selectedContactId ? 'mobile-hidden' : ''}`}>
        <div className="messenger-sidebar-header">
          <div className="header-title">
            <MessageCircle size={24} />
            <h2>Tin nhắn</h2>
          </div>
          <div className="header-actions">
            <button
              className="header-action-btn"
              title="Cài đặt"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} />
            </button>
            <button
              className="header-action-btn"
              title="Tạo mới"
              onClick={() => setShowCreateNew(true)}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="messenger-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="search-input"
          />
        </div>

        <div className="messenger-tabs">
          <button
            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            <Home size={16} />
            <span>Tất cả</span>
            {contacts.filter((contact) => contact.unread > 0).length > 0 && (
              <span className="tab-badge">
                {contacts.filter((contact) => contact.unread > 0).length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'GROUP' ? 'active' : ''}`}
            onClick={() => setActiveTab('GROUP')}
          >
            <Users size={16} />
            <span>Nhóm</span>
            {contacts.filter((contact) => contact.type === 'GROUP' && contact.unread > 0).length > 0 && (
              <span className="tab-badge">
                {contacts.filter((contact) => contact.type === 'GROUP' && contact.unread > 0).length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'MENTOR' ? 'active' : ''}`}
            onClick={() => setActiveTab('MENTOR')}
          >
            <UserCircle size={16} />
            <span>Mentor</span>
          </button>
          {canAccessRecruitmentMessages && (
            <button
              className={`tab-btn ${activeTab === 'RECRUITMENT' ? 'active' : ''}`}
              onClick={() => setActiveTab('RECRUITMENT')}
            >
              <Briefcase size={16} />
              <span>Tuyển dụng</span>
              {contacts.filter((contact) => contact.type === 'RECRUITMENT' && contact.unread > 0).length > 0 && (
                <span className="tab-badge">
                  {contacts.filter((contact) => contact.type === 'RECRUITMENT' && contact.unread > 0).length}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="messenger-contact-list">
          {filteredContacts.length === 0 ? (
            <div className="contact-list-empty">
              <MessageCircle size={48} />
              <p>Không có tin nhắn</p>
              <span>Bắt đầu cuộc trò chuyện mới</span>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={`${contact.id}-${contact.type}`}
                className={`contact-item ${selectedContactId === contact.id ? 'active' : ''} ${contact.isPinned ? 'pinned' : ''}`}
                onClick={() => setSelectedContactId(contact.id)}
              >
                <div className="contact-avatar-wrapper">
                  {settings.showAvatar && (
                    <img src={contact.avatar} alt={contact.name} className="contact-avatar" />
                  )}
                  {settings.showOnlineStatus && contact.isOnline && <div className="online-indicator" />}
                  {contact.type === 'GROUP' && (
                    <div className="contact-type-badge group">
                      <Users size={12} />
                    </div>
                  )}
                </div>

                <div className="contact-info">
                  <div className="contact-header">
                    <h4 className="contact-name">
                      {contact.name}
                      {contact.isPinned && <Pin size={12} className="pin-icon" />}
                    </h4>
                    <span className="contact-time">{formatTimestamp(contact.timestamp)}</span>
                  </div>

                  <div className="contact-message">
                    {contact.type === 'GROUP' && (
                      <span className="message-prefix">
                        {contact.memberCount} thành viên •{' '}
                      </span>
                    )}
                    <span className="message-text">{contact.lastMessage}</span>
                    {contact.unread > 0 && (
                      <span className="unread-badge">{contact.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="messenger-main">
        {selectedContact ? (
          selectedContact.type === 'GROUP' ? (
            <GroupChatWindow
              groupId={selectedContact.id}
              currentUserId={user!.id.toString()}
              currentUserName={user!.fullName || user!.email || 'User'}
              currentUserAvatar={resolveAvatarUrl(user!.avatarUrl)}
              onBack={() => setSelectedContactId(null)}
            />
          ) : selectedContact.type === 'MENTOR' ? (
            <MentorChatWindow
              counterpartId={parseInt(selectedContact.id, 10)}
              counterpartName={selectedContact.name}
              counterpartAvatar={selectedContact.avatar}
              isMyRoleMentor={selectedContact.isMyRoleMentor || false}
              currentUserId={user!.id}
              onBack={() => setSelectedContactId(null)}
            />
          ) : selectedContact.type === 'FAMILY' ? (
            <FamilyChatWindow
              familyMemberId={parseInt(selectedContact.id, 10)}
              familyMemberName={selectedContact.name}
              familyMemberAvatar={selectedContact.avatar}
              currentUserId={user!.id}
              currentUserName={user!.fullName || user!.email || 'User'}
              isParent={selectedContact.isParent || false}
              onBack={() => setSelectedContactId(null)}
            />
          ) : selectedContact.type === 'RECRUITMENT' && selectedContact.recruitmentSession ? (
            <RecruiterChatWindow
              session={selectedContact.recruitmentSession}
              currentUserId={user!.id}
              currentUserName={user!.fullName || user!.email || 'User'}
              onBack={() => setSelectedContactId(null)}
              onViewProfile={user?.roles.includes('RECRUITER')
                ? ((session) => {
                    if (session.candidateSlug) {
                      window.open(`/portfolio/${session.candidateSlug}`, '_blank');
                    } else {
                      window.open(`/portfolio/profile/${session.candidateId}`, '_blank');
                    }
                  })
                : undefined}
              onUpdateStatus={(sessionId, status) => {
                setRecruitmentSessions((previous) =>
                  previous.map((session) =>
                    session.id === sessionId ? { ...session, status } : session
                  )
                );
                setContacts((previous) =>
                  previous.map((contact) =>
                    contact.recruitmentSession?.id === sessionId
                      ? {
                          ...contact,
                          recruitmentSession: {
                            ...contact.recruitmentSession,
                            status,
                          },
                        }
                      : contact
                  )
                );
              }}
            />
          ) : (
            <div className="messenger-placeholder">
              <MessageCircle size={64} />
              <h3>Tin nhắn</h3>
              <p>Loại chat không được hỗ trợ</p>
            </div>
          )
        ) : (
          <div className="messenger-placeholder">
            <MessageCircle size={80} />
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Chọn từ danh sách bên trái để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerPage;
