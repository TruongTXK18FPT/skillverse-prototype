import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Search, MoreVertical, User } from 'lucide-react';
import '../../styles/MessengerPage.css';
import { getThreads, getConversation, sendMessage, sendAsMentor, markRead } from '../../services/preChatService';
import userService from '../../services/userService';
import parentService from '../../services/parentService';
import chatService from '../../services/chatService';
import { getMyMentorProfile, getMentorProfile } from '../../services/mentorProfileService';
import { API_BASE_URL } from '../../services/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosInstance from '../../services/axiosInstance';

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
  type?: 'MENTOR' | 'FAMILY';
}


const MessengerPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [tempContact, setTempContact] = useState<ChatContact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHandledNav = useRef(false);
  const [activeTab, setActiveTab] = useState<'MENTOR' | 'FAMILY'>('MENTOR');
  const [pendingFamilyLinks, setPendingFamilyLinks] = useState<number>(0);
  
  // WebSocket for Family Chat
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

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

  // Auto-switch tab based on role
  useEffect(() => {
    if (user && !loading) {
      // USER = regular student/learner, PARENT = parent account
      if ((user.roles.includes('PARENT') || user.roles.includes('USER')) && !user.roles.includes('MENTOR')) {
        setActiveTab('FAMILY');
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    loadContacts();
    const interval = setInterval(loadContacts, 5000);
    return () => clearInterval(interval);
  }, [user, loading]);

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
              isMyRoleMentor: false,
              type: location.state.type || 'MENTOR'
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

  useEffect(() => {
    // Disconnect previous connection if any
    if (stompClientRef.current && stompClientRef.current.active) {
        stompClientRef.current.deactivate();
        setConnected(false);
    }

    let currentContact = contacts.find(c => c.mentorId === selectedContactId && 
        (activeTab === 'FAMILY' ? c.type === 'FAMILY' : c.type !== 'FAMILY'));

    if (!currentContact && tempContact && tempContact.mentorId === selectedContactId) {
        // Only use tempContact if it matches the active tab type (or if we are in MENTOR tab and temp is MENTOR/default)
        // Actually tempContact usually comes from navigation which sets the type.
        if (activeTab === 'FAMILY' && tempContact.type === 'FAMILY') {
             currentContact = tempContact;
        } else if (activeTab !== 'FAMILY' && tempContact.type !== 'FAMILY') {
             currentContact = tempContact;
        }
    }

    if (currentContact?.type === 'FAMILY' && user) {
        const socketUrl = API_BASE_URL.replace(/\/api\/?$/, '/ws');
        const token = localStorage.getItem('token');
        const socket = new SockJS(`${socketUrl}?token=${token}`);
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                setConnected(true);
                // Subscribe to user-specific queue
                // Spring's convertAndSendToUser uses the principal name, so we subscribe to /user/queue/messages
                client.subscribe(`/user/${user.id}/queue/messages`, (message) => {
                    const receivedMsg = JSON.parse(message.body);
                    console.log('Received family message:', receivedMsg);
                    // Check if message belongs to current conversation
                    if (receivedMsg.senderId.toString() === selectedContactId || receivedMsg.recipientId.toString() === selectedContactId) {
                        setMessages(prev => {
                            // Avoid duplicate messages
                            const exists = prev.some(m => m.id === receivedMsg.id?.toString());
                            if (exists) return prev;
                            return [...prev, {
                                id: receivedMsg.id?.toString() || Date.now().toString(),
                                sender: receivedMsg.senderId === user.id ? 'user' : 'mentor',
                                content: receivedMsg.content,
                                timestamp: new Date(receivedMsg.timestamp)
                            }];
                        });
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onWebSocketClose: () => {
                console.log('WebSocket closed');
                setConnected(false);
            }
        });

        client.activate();
        stompClientRef.current = client;
    }

    return () => {
        if (stompClientRef.current && stompClientRef.current.active) {
            stompClientRef.current.deactivate();
        }
    };
  }, [selectedContactId, contacts, user, tempContact, activeTab]);

  const loadContacts = async () => {
    if (!user) return;
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
            type: 'MENTOR'
          };
        })
      );

      let allContacts = mapped;

      if (user?.roles.includes('PARENT')) {
          try {
              const dashboard = await parentService.getDashboard();
              const familyContacts: ChatContact[] = dashboard.students.map(s => ({
                  mentorId: s.id.toString(),
                  mentorName: (s.firstName || '') + ' ' + (s.lastName || '') || s.email,
                  mentorAvatar: resolveAvatarUrl(s.avatarUrl) || '/images/meowl.jpg',
                  lastMessage: 'Chat with your child', 
                  timestamp: new Date().toISOString(),
                  unread: 0,
                  type: 'FAMILY'
              }));
              allContacts = [...allContacts, ...familyContacts];
          } catch (e) {
              console.error("Failed to fetch family contacts", e);
          }
      }

      // USER role = regular student/learner account
      if (user?.roles.includes('USER')) {
          try {
              console.log('Fetching student links for user:', user.id, 'roles:', user.roles);
              const links = await parentService.getStudentLinks();
              console.log('Student links fetched:', links);
              // Track pending links for notification
              const pendingCount = links.filter(link => link.status === 'PENDING').length;
              const activeCount = links.filter(link => link.status === 'ACTIVE').length;
              console.log('Pending:', pendingCount, 'Active:', activeCount);
              setPendingFamilyLinks(pendingCount);
              
              const familyContacts: ChatContact[] = links
                  .filter(link => link.status === 'ACTIVE')
                  .map(link => {
                      console.log('Mapping parent link:', link.parent);
                      return {
                          mentorId: link.parent.id.toString(),
                          mentorName: ((link.parent.firstName || '') + ' ' + (link.parent.lastName || '')).trim() || link.parent.email,
                          mentorAvatar: resolveAvatarUrl(link.parent.avatarUrl) || '/images/meowl.jpg',
                          lastMessage: 'Chat với phụ huynh',
                          timestamp: new Date().toISOString(),
                          unread: 0,
                          type: 'FAMILY'
                      };
                  });
              console.log('Family contacts created:', familyContacts);
              allContacts = [...allContacts, ...familyContacts];
          } catch (e) {
              console.error("Failed to fetch parent contacts", e);
          }
      }

      // Deduplicate contacts by mentorId and type
      const uniqueContacts = new Map<string, ChatContact>();
      allContacts.forEach(c => {
        const key = `${c.mentorId}-${c.type}`;
        if (!uniqueContacts.has(key)) {
          uniqueContacts.set(key, c);
        }
      });
      
      setContacts(Array.from(uniqueContacts.values()));
    } catch (error) {
      console.error('Failed to load contacts', error);
    }
  };

  const loadMessages = async (mentorId: string) => {
    if (!user) return;
    
    const currentContact = contacts.find(c => c.mentorId === mentorId && 
        (activeTab === 'FAMILY' ? c.type === 'FAMILY' : c.type !== 'FAMILY'));

    if (currentContact?.type === 'FAMILY') {
        try {
            const history = await chatService.getChatHistory(user.id, parseInt(mentorId));
            const mapped: Message[] = history.map(m => ({
                id: m.id?.toString() || Date.now().toString(),
                sender: m.senderId === user.id ? 'user' : 'mentor',
                content: m.content,
                timestamp: new Date(m.timestamp)
            }));
            setMessages(mapped);
        } catch (error) {
            console.error("Failed to fetch chat history", error);
        }
        return;
    }

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
    // Find contact based on active tab to avoid ambiguity
    const contact = allContacts.find(c => c.mentorId === selectedContactId && 
        (activeTab === 'FAMILY' ? c.type === 'FAMILY' : c.type !== 'FAMILY'));
    
    if (!contact) return;

    setInputValue('');

    if (contact.type === 'FAMILY') {
        if (stompClientRef.current && connected) {
            const chatMessage = {
                senderId: user.id,
                recipientId: parseInt(selectedContactId),
                senderName: user.fullName || user.email,
                recipientName: contact.mentorName,
                content: content,
                timestamp: new Date().toISOString()
            };

            stompClientRef.current.publish({
                destination: "/app/chat",
                body: JSON.stringify(chatMessage)
            });
            
            // Optimistic update
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'user',
                content: content,
                timestamp: new Date()
            }]);
        } else {
            console.error("WebSocket not connected");
            setInputValue(content);
        }
        return;
    }

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

  const filteredContacts = allContacts.filter(c => {
      if (activeTab === 'FAMILY') return c.type === 'FAMILY';
      return c.type !== 'FAMILY';
  });

  return (
    <div className="sv-messenger-container">
      {/* Sidebar */}
      <div className="sv-messenger-sidebar">
        <div className="sv-messenger-header">
          <h2>Tin Nhắn</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                  onClick={() => setActiveTab('MENTOR')}
                  style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'MENTOR' ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                  }}
              >
                  Mentors
              </button>
              <button 
                  onClick={() => setActiveTab('FAMILY')}
                  style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'FAMILY' ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      position: 'relative'
                  }}
              >
                  Gia Đình
                  {pendingFamilyLinks > 0 && (
                      <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                      }}>
                          {pendingFamilyLinks}
                      </span>
                  )}
              </button>
          </div>
        </div>
        <div className="sv-messenger-list">
          {filteredContacts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              {activeTab === 'FAMILY' ? (
                  <div>
                      <p>Chưa có liên kết gia đình hoạt động.</p>
                      {user?.roles.includes('USER') && (
                          <>
                              {pendingFamilyLinks > 0 ? (
                                  <div style={{ background: 'rgba(234, 179, 8, 0.2)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.75rem' }}>
                                      <p style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                          🔔 Bạn có {pendingFamilyLinks} yêu cầu kết nối đang chờ!
                                      </p>
                                      <a href="/student-parent-request" style={{ 
                                          fontSize: '0.9rem', 
                                          marginTop: '0.5rem', 
                                          display: 'inline-block',
                                          background: '#3b82f6',
                                          color: 'white',
                                          padding: '0.5rem 1rem',
                                          borderRadius: '6px',
                                          textDecoration: 'none'
                                      }}>
                                          Xem và chấp nhận yêu cầu
                                      </a>
                                  </div>
                              ) : (
                                  <>
                                      <a href="/student-parent-request" style={{ color: '#60a5fa', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block' }}>
                                          Kiểm tra yêu cầu kết nối
                                      </a>
                                      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#64748b' }}>
                                          Phụ huynh có thể gửi yêu cầu kết nối từ tài khoản của họ.
                                          Bạn cần chấp nhận yêu cầu trước khi có thể chat.
                                      </p>
                                  </>
                              )}
                          </>
                      )}
                      {user?.roles.includes('PARENT') && (
                          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#64748b' }}>
                              Hãy gửi yêu cầu kết nối đến con bạn từ Parent Dashboard.
                          </p>
                      )}
                  </div>
              ) : 'Chưa có tin nhắn nào.'}
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div
                key={`${contact.mentorId}-${contact.type}`}
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
