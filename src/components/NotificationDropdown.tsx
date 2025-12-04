import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Info, MessageSquare, CreditCard, Star, AlertCircle, ChevronDown } from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import '../styles/NotificationDropdown.css';

type Props = { inline?: boolean; collapsible?: boolean };
const NotificationDropdown: React.FC<Props> = ({ inline, collapsible }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [inlineOpen, setInlineOpen] = useState<boolean>(!collapsible);
  interface RecentChat {
    mentorId: string;
    mentorName: string;
    mentorAvatar: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
  }
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getUserNotifications(0, 10);
      setNotifications(data.content);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentChats = () => {
    try {
      const stored = localStorage.getItem('recent_chats');
      if (stored) {
        setRecentChats(JSON.parse(stored));
      } else {
        setRecentChats([]);
      }
    } catch (error) {
      console.error('Failed to load chats', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for unread count every minute
    const interval = setInterval(fetchUnreadCount, 60000);
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

  useEffect(() => {
    if (inline) {
      fetchNotifications();
      fetchRecentChats();
    }
  }, [inline]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
      fetchRecentChats();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id, { stopPropagation: () => {} } as React.MouseEvent);
    }
    
    // Navigate based on type
    switch (notification.type) {
      case 'LIKE':
      case 'COMMENT':
        navigate(`/community/${notification.relatedId}`);
        break;
      case 'PRECHAT_NEW_MESSAGE':
        navigate('/mentorship', { state: { openChatWith: notification.relatedId } });
        break;
      case 'PREMIUM_PURCHASE':
      case 'PREMIUM_EXPIRATION':
        navigate('/premium');
        break;
      case 'WALLET_DEPOSIT':
      case 'COIN_PURCHASE':
      case 'WITHDRAWAL_APPROVED':
      case 'WITHDRAWAL_REJECTED':
        navigate('/my-wallet');
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
      case 'COMMENT':
        return <MessageSquare size={16} className="notification-icon-community" />;
      case 'PRECHAT_NEW_MESSAGE':
        return <MessageSquare size={16} className="notification-icon-community" />;
      case 'PREMIUM_PURCHASE':
      case 'PREMIUM_EXPIRATION':
        return <Star size={16} className="notification-icon-premium" />;
      case 'WALLET_DEPOSIT':
      case 'COIN_PURCHASE':
        return <CreditCard size={16} className="notification-icon-payment" />;
      case 'WITHDRAWAL_APPROVED':
        return <Check size={16} className="notification-icon-payment" />;
      case 'WITHDRAWAL_REJECTED':
        return <AlertCircle size={16} className="notification-icon-info" style={{ color: '#ef4444' }} />;
      case 'WELCOME':
        return <Info size={16} className="notification-icon-info" />;
      default:
        return <Info size={16} />;
    }
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
            if (!inlineOpen) {
              fetchNotifications();
              fetchRecentChats();
            }
          }}
        >
          <div className="inline-header-left">
            <Bell size={16} />
            <span>Thông báo</span>
          </div>
          <div className="inline-header-right">
            {unreadCount > 0 && <span className="notification-badge inline-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            <ChevronDown size={16} className={`inline-chevron ${inlineOpen ? 'open' : ''}`} />
          </div>
        </button>

        <div className="notification-header">
          <h3>Gần đây</h3>
          <button className="mark-all-read" onClick={handleMarkAllAsRead}>
            <CheckCheck size={14} />
            <span>Đánh dấu đã đọc</span>
          </button>
        </div>
        <div className="notification-list compact">
          {recentChats.filter(c => c.unread > 0).slice(0, 3).map(chat => (
            <div
              key={`prechat-${chat.mentorId}`}
              className="notification-item unread"
              onClick={() => navigate('/mentorship', { state: { openChatWith: chat.mentorId } })}
            >
              <div className="notification-icon-wrapper">
                <img
                  src={chat.mentorAvatar}
                  alt={chat.mentorName}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <div className="notification-content">
                <p className="notification-title">Tin nhắn prechat mới</p>
                <p className="notification-message truncate">{chat.mentorName}: {chat.lastMessage}</p>
                <span className="notification-time">{formatTime(chat.timestamp)}</span>
              </div>
            </div>
          ))}
          {loading ? (
            <div className="notification-loading">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">Không có thông báo</div>
          ) : (
            notifications.slice(0, 5).map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon-wrapper">
                  {notification.senderAvatar ? (
                    <img
                      src={notification.senderAvatar}
                      alt={notification.senderName || 'User'}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    getIcon(notification.type)
                  )}
                </div>
                <div className="notification-content">
                  <p className="notification-title">{notification.title}</p>
                  <p className="notification-message">
                    {notification.senderName && <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{notification.senderName}</span>}
                    {notification.message}
                  </p>
                  <span className="notification-time">{formatTime(notification.createdAt)}</span>
                </div>
                {!notification.isRead && (
                  <button
                    className="mark-read-btn"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    title="Đánh dấu đã đọc"
                  >
                    <div className="unread-dot"></div>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <div className="notification-footer">
          <button onClick={() => navigate('/notifications')}>Xem tất cả</button>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="notification-trigger" onClick={handleToggle}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            <button className="mark-all-read" onClick={handleMarkAllAsRead}>
              <CheckCheck size={14} />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          </div>

      <div className="notification-list">
          {recentChats.filter(c => c.unread > 0).map(chat => (
            <div 
              key={`prechat-${chat.mentorId}`}
              className="notification-item unread"
              onClick={() => navigate('/mentorship', { state: { openChatWith: chat.mentorId } })}
            >
              <div className="notification-icon-wrapper">
                <img 
                  src={chat.mentorAvatar} 
                  alt={chat.mentorName} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <div className="notification-content">
                <p className="notification-title">Tin nhắn prechat mới</p>
                <p className="notification-message truncate">{chat.mentorName}: {chat.lastMessage}</p>
                <span className="notification-time">{formatTime(chat.timestamp)}</span>
              </div>
            </div>
          ))}
          {loading ? (
            <div className="notification-loading">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">Không có thông báo nào</div>
          ) : (
            notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-wrapper">
                    {notification.senderAvatar ? (
                      <img 
                        src={notification.senderAvatar} 
                        alt={notification.senderName || 'User'} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      getIcon(notification.type)
                    )}
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">
                      {notification.senderName && <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{notification.senderName}</span>}
                      {notification.message}
                    </p>
                    <span className="notification-time">{formatTime(notification.createdAt)}</span>
                  </div>
                  {!notification.isRead && (
                    <button 
                      className="mark-read-btn"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      title="Đánh dấu đã đọc"
                    >
                      <div className="unread-dot"></div>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="notification-footer">
            <button onClick={() => navigate('/notifications')}>Xem tất cả</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
