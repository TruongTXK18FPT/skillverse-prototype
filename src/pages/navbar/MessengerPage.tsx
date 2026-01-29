import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Users, 
  UserCircle, 
  Home,
  MessageCircle,
  Settings,
  Bell,
  Filter,
  Check,
  CheckCheck,
  Pin,
  Archive,
  Trash2,
  Star,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GroupChatWindow, MentorChatWindow, FamilyChatWindow } from '../../components/chat';
import MessengerWelcome from '../../components/chat/MessengerWelcome';
import { getMyGroups, getGroupDetail, type GroupMemberDTO } from '../../services/groupChatService';
import { getThreads } from '../../services/preChatService';
import userService from '../../services/userService';
import { getMentorProfile } from '../../services/mentorProfileService';
import parentService from '../../services/parentService';
import studentLinkService from '../../services/studentLinkService';
import { API_BASE_URL } from '../../services/axiosInstance';
import '../../styles/MessengerPage.css';

interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  type: 'MENTOR' | 'FAMILY' | 'GROUP';
  isOnline?: boolean;
  isPinned?: boolean;
  memberCount?: number;
  mentorName?: string;
  isMyRoleMentor?: boolean; // For mentor chats: true if I'm the mentor
  isParent?: boolean; // For family chats: true if I'm the parent
}

const MessengerPage: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // State
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'MENTOR' | 'FAMILY' | 'GROUP'>('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  
  const hasHandledNav = useRef(false);

  // Check if first time user
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('skillverse_messenger_welcome_seen');
    if (!hasSeenWelcome && user) {
      setShowWelcome(true);
    }
  }, [user]);

  // Helper to resolve avatar URL
  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (trimmed.startsWith('/')) return `${apiRoot}${trimmed}`;
    return `${apiRoot}/${trimmed}`;
  };

  // Load contacts on mount and tab change
  useEffect(() => {
    if (!user || loading) return;
    loadContacts();
    const interval = setInterval(loadContacts, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [user, loading, activeTab]);

  // Handle navigation state (e.g., from other pages)
  useEffect(() => {
    if (hasHandledNav.current || !location.state?.openChatWith) return;
    
    const targetId = location.state.openChatWith.toString();
    const type = location.state.type || 'GROUP';
    
    if (type === 'GROUP') setActiveTab('GROUP');
    else if (type === 'FAMILY') setActiveTab('FAMILY');
    else setActiveTab('MENTOR');
    
    setSelectedContactId(targetId);
    hasHandledNav.current = true;
  }, [location.state]);

  const loadContacts = async () => {
    if (!user) return;
    
    try {
      let allContacts: ChatContact[] = [];

      // Load group chats if GROUP tab or ALL
      if (activeTab === 'GROUP' || activeTab === 'ALL') {
        const groups = await getMyGroups(user.id);
        const groupContacts: ChatContact[] = groups.map(g => ({
          id: g.id.toString(),
          name: g.name,
          avatar: resolveAvatarUrl(g.avatarUrl),
          lastMessage: 'Nhóm học tập',
          timestamp: g.createdAt,
          unread: 0,
          type: 'GROUP' as const,
          memberCount: g.memberCount || 0,
          mentorName: g.mentorName
        }));
        allContacts = [...allContacts, ...groupContacts];
      }

      // Load mentor/1-on-1 chats if MENTOR tab or ALL
      if (activeTab === 'MENTOR' || activeTab === 'ALL') {
        const threads = await getThreads();
        const mentorContacts: ChatContact[] = await Promise.all(
          threads.map(async (t) => {
            let avatar = resolveAvatarUrl(t.counterpartAvatar);
            
            try {
              if (t.isMyRoleMentor) {
                const prof = await userService.getUserProfile(t.counterpartId);
                avatar = resolveAvatarUrl(prof.avatarMediaUrl);
              } else {
                const prof = await getMentorProfile(t.counterpartId);
                avatar = resolveAvatarUrl(prof.avatar);
              }
            } catch (e) {
              // Fallback to default
            }

            return {
              id: t.counterpartId.toString(),
              name: t.counterpartName,
              avatar,
              lastMessage: t.lastContent,
              timestamp: t.lastTime,
              unread: t.unreadCount,
              type: 'MENTOR' as const,
              isOnline: Math.random() > 0.5, // TODO: Implement real online status
              isMyRoleMentor: t.isMyRoleMentor
            };
          })
        );
        allContacts = [...allContacts, ...mentorContacts];
      }

      // Load family chats if FAMILY tab or ALL
      // For PARENT role: load children (students)
      // For USER role: load parent links (upcoming feature)
      if (activeTab === 'FAMILY' || activeTab === 'ALL') {
        // Parents see their children
        if (user.roles.includes('PARENT')) {
          try {
            const dashboard = await parentService.getDashboard();
            const familyContacts: ChatContact[] = dashboard.students.map(student => ({
              id: student.id.toString(),
              name: student.displayName || student.fullName || `${student.firstName} ${student.lastName}`.trim(),
              avatar: resolveAvatarUrl(student.avatarUrl),
              lastMessage: 'Chat với con',
              timestamp: new Date().toISOString(),
              unread: 0,
              type: 'FAMILY' as const,
              isOnline: false,
              isParent: true
            }));
            allContacts = [...allContacts, ...familyContacts];
          } catch (error) {
            console.error('Failed to load family contacts:', error);
          }
        }
        // Students (USER role) see their linked parents (if any)
        if (user.roles.includes('USER') && !user.roles.includes('PARENT')) {
          try {
            // Load parent-student links for the student
            // The API returns links where this user is either parent or student
            const links = await studentLinkService.getStudentLinks();
            // Filter to get only ACTIVE links where current user is the student
            const activeParentLinks = links.filter(
              link => link.status === 'ACTIVE' && link.student.id === user.id
            );
            const parentContacts: ChatContact[] = activeParentLinks.map((link) => ({
              id: link.parent.id.toString(),
              name: link.parent.fullName || 'Phụ huynh',
              avatar: resolveAvatarUrl(link.parent.avatarUrl),
              lastMessage: 'Chat với phụ huynh',
              timestamp: link.updatedAt || new Date().toISOString(),
              unread: 0,
              type: 'FAMILY' as const,
              isOnline: false,
              isParent: false // I'm the student, not the parent
            }));
            allContacts = [...allContacts, ...parentContacts];
          } catch (error) {
            // Parent link API may not exist yet
            console.log('Parent links not available:', error);
          }
        }
      }

      // Sort by timestamp (most recent first)
      allContacts.sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return bTime - aTime;
      });

      setContacts(allContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL' || contact.type === activeTab;
    return matchesSearch && matchesTab;
  });

  // Get selected contact
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Format timestamp
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
    // Auto-select first group if available
    const firstGroup = contacts.find(c => c.type === 'GROUP');
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
      {/* Welcome Modal */}
      {showWelcome && (
        <MessengerWelcome
          onClose={handleWelcomeClose}
          onGetStarted={handleGetStarted}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cài đặt</h2>
              <button onClick={() => setShowSettings(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <h3>Thông báo</h3>
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Thông báo tin nhắn mới</span>
                </label>
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Âm thanh thông báo</span>
                </label>
              </div>
              <div className="settings-section">
                <h3>Hiển thị</h3>
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Hiển thị ảnh đại diện</span>
                </label>
                <label>
                  <input type="checkbox" />
                  <span>Chế độ tối</span>
                </label>
              </div>
              <div className="settings-section">
                <h3>Quyền riêng tư</h3>
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Cho phép người lạ nhắn tin</span>
                </label>
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Hiển thị trạng thái online</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Modal */}
      {showCreateNew && (
        <div className="modal-overlay" onClick={() => setShowCreateNew(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo cuộc trò chuyện mới</h2>
              <button onClick={() => setShowCreateNew(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="create-new-options">
                <button className="create-option" onClick={() => {
                  setShowCreateNew(false);
                  alert('Tính năng tạo nhóm mới đang phát triển');
                }}>
                  <Users size={32} />
                  <h3>Tạo nhóm học tập</h3>
                  <p>Tạo nhóm mới với mentor và học viên</p>
                </button>
                <button className="create-option" onClick={() => {
                  setShowCreateNew(false);
                  setActiveTab('MENTOR');
                }}>
                  <UserCircle size={32} />
                  <h3>Nhắn tin với Mentor</h3>
                  <p>Bắt đầu cuộc trò chuyện 1-1</p>
                </button>
                {user && user.roles.includes('PARENT') && (
                  <button className="create-option" onClick={() => {
                    setShowCreateNew(false);
                    setActiveTab('FAMILY');
                  }}>
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

      {/* Sidebar */}
      <div className={`messenger-sidebar ${selectedContactId ? 'mobile-hidden' : ''}`}>
        {/* Header */}
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

        {/* Search */}
        <div className="messenger-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Tabs */}
        <div className="messenger-tabs">
          <button
            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            <Home size={16} />
            <span>Tất cả</span>
            {contacts.filter(c => c.unread > 0).length > 0 && (
              <span className="tab-badge">
                {contacts.filter(c => c.unread > 0).length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'GROUP' ? 'active' : ''}`}
            onClick={() => setActiveTab('GROUP')}
          >
            <Users size={16} />
            <span>Nhóm</span>
            {contacts.filter(c => c.type === 'GROUP' && c.unread > 0).length > 0 && (
              <span className="tab-badge">
                {contacts.filter(c => c.type === 'GROUP' && c.unread > 0).length}
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
          {user && (user.roles.includes('PARENT') || user.roles.includes('USER')) && (
            <button
              className={`tab-btn ${activeTab === 'FAMILY' ? 'active' : ''}`}
              onClick={() => setActiveTab('FAMILY')}
            >
              <Home size={16} />
              <span>Gia đình</span>
            </button>
          )}
        </div>

        {/* Contact List */}
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
                  <img src={contact.avatar} alt={contact.name} className="contact-avatar" />
                  {contact.isOnline && <div className="online-indicator" />}
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

      {/* Main Chat Area */}
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
              counterpartId={parseInt(selectedContact.id)}
              counterpartName={selectedContact.name}
              counterpartAvatar={selectedContact.avatar}
              isMyRoleMentor={selectedContact.isMyRoleMentor || false}
              currentUserId={user!.id}
              onBack={() => setSelectedContactId(null)}
            />
          ) : selectedContact.type === 'FAMILY' ? (
            <FamilyChatWindow
              familyMemberId={parseInt(selectedContact.id)}
              familyMemberName={selectedContact.name}
              familyMemberAvatar={selectedContact.avatar}
              currentUserId={user!.id}
              currentUserName={user!.fullName || user!.email || 'User'}
              isParent={selectedContact.isParent || false}
              onBack={() => setSelectedContactId(null)}
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
