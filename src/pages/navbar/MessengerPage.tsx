import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Search, MoreVertical, User } from 'lucide-react';
import '../../styles/MessengerPage.css';
import { getThreads, getConversation, sendMessage, sendAsMentor, markRead } from '../../services/preChatService';
import userService from '../../services/userService';
import { getMyMentorProfile, getMentorProfile } from '../../services/mentorProfileService';
import { API_BASE_URL } from '../../services/axiosInstance';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'mentor';
  content: string;
  timestamp: Date;
}

interface ChatContact {
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isMyRoleMentor?: boolean;
}

const MessengerPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [tempContact, setTempContact] = useState<ChatContact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHandledNav = useRef(false);

  const [myUserAvatar, setMyUserAvatar] = useState<string | undefined>(undefined);
  const [myMentorAvatar, setMyMentorAvatar] = useState<string | undefined>(undefined);

  const resolveAvatarUrl = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (trimmed.startsWith('/')) return `${apiRoot}${trimmed}`;
    return `${apiRoot}/${trimmed}`;
  };

  useEffect(() => {
    const fetchMyAvatars = async () => {
      if (!user) return;
      
      try {
        const userProf = await userService.getUserProfile(user.id);
        setMyUserAvatar(resolveAvatarUrl(userProf.avatarMediaUrl));
      } catch (e) {
        setMyUserAvatar(resolveAvatarUrl(user.avatarUrl));
      }

      if (user.roles.includes('MENTOR')) {
        try {
          const mentorProf = await getMyMentorProfile();
          setMyMentorAvatar(resolveAvatarUrl(mentorProf.avatar));
        } catch (e) {
          console.error("Failed to fetch my mentor profile", e);
        }
      }
    };
    
    fetchMyAvatars();
  }, [user]);

  useEffect(() => {
    loadContacts();
    const interval = setInterval(loadContacts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNav = async () => {
      if (hasHandledNav.current) return;
      if (location.state?.openChatWith) {
        const targetId = location.state.openChatWith.toString();
        hasHandledNav.current = true;

        // Check if already in contacts (contacts might be empty initially)
        const existing = contacts.find(c => c.mentorId === targetId);
        if (existing) {
          setSelectedContactId(targetId);
        } else {
          // Fetch profile and create temp contact
          try {
            const profile = await userService.getUserProfile(parseInt(targetId));
            const newContact: ChatContact = {
              mentorId: targetId,
              mentorName: profile.fullName || `User #${targetId}`,
              mentorAvatar: profile.avatarMediaUrl || '/images/meowl.jpg',
              lastMessage: 'Bắt đầu cuộc trò chuyện mới',
              timestamp: new Date().toISOString(),
              unread: 0,
              isMyRoleMentor: false
            };
            setTempContact(newContact);
            setSelectedContactId(targetId);
          } catch (e) {
            console.error("Failed to fetch mentor profile", e);
          }
        }
      }
    };
    handleNav();
  }, [location.state, contacts]); // Re-run if contacts load and we haven't handled it? 
  // Actually if we depend on contacts, it might run multiple times. 
  // But hasHandledNav prevents that. 
  // Wait, if contacts are empty initially, we fetch profile. 
  // If contacts load later and contain the user, we should switch to using the contact from list?
  // The render logic will handle merging.

  useEffect(() => {
    if (selectedContactId) {
      loadMessages(selectedContactId);
      // Poll messages for active chat
      const msgInterval = setInterval(() => loadMessages(selectedContactId), 3000);
      return () => clearInterval(msgInterval);
    }
  }, [selectedContactId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContacts = async () => {
    try {
      const threads = await getThreads();

      const mapped: ChatContact[] = await Promise.all(
        threads.map(async (t) => {
          let avatar = resolveAvatarUrl(t.counterpartAvatar);
          
          try {
            if (t.isMyRoleMentor) {
               // I am Mentor, Counterpart is User -> Fetch User Profile
               const prof = await userService.getUserProfile(t.counterpartId);
               avatar = resolveAvatarUrl(prof.avatarMediaUrl) || avatar;
            } else {
               // I am User, Counterpart is Mentor -> Fetch Mentor Profile
               const prof = await getMentorProfile(t.counterpartId);
               avatar = resolveAvatarUrl(prof.avatar) || avatar;
            }
          } catch (e) {
             // Fallback
             if (!avatar) {
                try {
                   const prof = await userService.getUserProfile(t.counterpartId);
                   avatar = resolveAvatarUrl(prof.avatarMediaUrl) || avatar;
                } catch (_e) { void 0; }
             }
          }
          
          if (!avatar) avatar = '/images/meowl.jpg';

          return {
            mentorId: t.counterpartId.toString(),
            mentorName: t.counterpartName,
            mentorAvatar: avatar,
            lastMessage: t.lastContent,
            timestamp: t.lastTime,
            unread: t.unreadCount,
            isMyRoleMentor: t.isMyRoleMentor,
          };
        })
      );

      setContacts(mapped);
    } catch (error) {
      console.error('Failed to load contacts', error);
    }
  };

  const loadMessages = async (mentorId: string) => {
    if (!user) return;
    try {
      const data = await getConversation(parseInt(mentorId));
      const mapped: Message[] = data.content.map(m => ({
        id: m.id.toString(),
        sender: m.senderId === user.id ? 'user' : 'mentor',
        content: m.content,
        timestamp: new Date(m.createdAt)
      }));
      setMessages(mapped);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const allContacts = [...contacts];
  if (tempContact && !allContacts.find(c => c.mentorId === tempContact.mentorId)) {
    allContacts.unshift(tempContact);
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedContactId || !user) return;

    const content = inputValue.trim();
    const contact = allContacts.find(c => c.mentorId === selectedContactId);
    if (!contact) return;

    setInputValue('');

    try {
      if (contact.isMyRoleMentor) {
        await sendAsMentor(parseInt(selectedContactId), content);
      } else {
        await sendMessage(parseInt(selectedContactId), content);
      }
      await loadMessages(selectedContactId);
      await loadContacts();
    } catch (error) {
      console.error('Failed to send message', error);
      setInputValue(content); // Restore on error
    }
  };

  const selectedContact = allContacts.find(c => c.mentorId === selectedContactId);

  return (
    <div className="sv-messenger-container">
      {/* Sidebar */}
      <div className="sv-messenger-sidebar">
        <div className="sv-messenger-header">
          <h2>Tin Nhắn</h2>
        </div>
        <div className="sv-messenger-list">
          {allContacts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Chưa có tin nhắn nào.
            </div>
          ) : (
            allContacts.map(contact => (
              <div
                key={contact.mentorId}
                className={`sv-messenger-item ${selectedContactId === contact.mentorId ? 'active' : ''}`}
                onClick={() => setSelectedContactId(contact.mentorId)}
              >
                <img src={contact.mentorAvatar} alt={contact.mentorName} className="sv-messenger-avatar" />
                <div className="sv-messenger-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="sv-messenger-name">{contact.mentorName}</div>
                    <div className="sv-messenger-time">
                      {new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="sv-messenger-preview">{contact.lastMessage}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="sv-messenger-main">
        {selectedContact ? (
          <>
            <div className="sv-messenger-chat-header">
              <img src={selectedContact.mentorAvatar} alt={selectedContact.mentorName} className="sv-messenger-chat-avatar" />
              <div className="sv-messenger-chat-name">{selectedContact.mentorName}</div>
              <div style={{ marginLeft: 'auto' }}>
                <MoreVertical size={20} color="#94a3b8" />
              </div>
            </div>

            <div className="sv-messenger-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`sv-msg-row ${msg.sender === 'user' ? 'sv-msg-row-user' : 'sv-msg-row-mentor'}`} style={{ display: 'flex', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', marginBottom: '1rem' }}>
                  <div className="sv-msg-avatar">
                    {msg.sender === 'user' ? (
                      <img 
                        src={
                          (selectedContact?.isMyRoleMentor && myMentorAvatar) 
                          ? myMentorAvatar 
                          : (myUserAvatar || user?.avatarUrl || '/images/meowl.jpg')
                        } 
                        alt="Me" 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--uplink-primary)' }} 
                        onError={(e) => {
                          e.currentTarget.src = '/images/meowl.jpg';
                        }}
                      />
                    ) : (
                      <img 
                        src={selectedContact?.mentorAvatar || '/images/meowl.jpg'} 
                        alt={selectedContact?.mentorName} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--uplink-border)' }} 
                        onError={(e) => {
                          e.currentTarget.src = '/images/meowl.jpg';
                        }}
                      />
                    )}
                  </div>
                  <div className={`sv-msg-bubble ${msg.sender === 'user' ? 'sv-msg-user' : 'sv-msg-mentor'}`} style={{ maxWidth: 'calc(100% - 40px)' }}>
                    {msg.content}
                    <span className="sv-msg-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="sv-messenger-input-area">
              <input
                type="text"
                className="sv-messenger-input"
                placeholder="Nhập tin nhắn..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="sv-messenger-send-btn" onClick={handleSendMessage}>
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="sv-messenger-empty">
            Chọn một cuộc hội thoại để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerPage;
