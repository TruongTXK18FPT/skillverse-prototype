import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  CreditCard, 
  Star, 
  Info, 
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail
} from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/NotificationPage.css';

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const [total, unread] = await Promise.all([
        notificationService.getTotalCount(),
        notificationService.getUnreadCount()
      ]);
      setTotalCount(total);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let isReadParam: boolean | undefined = undefined;
      if (filter === 'unread') isReadParam = false;
      if (filter === 'read') isReadParam = true;

      const data = await notificationService.getUserNotifications(page, 10, isReadParam);
      setNotifications(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchStats();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const handleModalAction = () => {
    if (!selectedNotification) return;
    
    const { type, relatedId } = selectedNotification;
    setSelectedNotification(null);

    switch (type) {
      case 'LIKE':
      case 'COMMENT':
        navigate(`/community/${relatedId}`);
        break;
      case 'PREMIUM_PURCHASE':
      case 'PREMIUM_EXPIRATION':
      case 'PREMIUM_CANCEL':
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
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
      case 'COMMENT':
        return <MessageSquare size={24} />;
      case 'PREMIUM_PURCHASE':
      case 'PREMIUM_EXPIRATION':
      case 'PREMIUM_CANCEL':
        return <Star size={24} />;
      case 'WALLET_DEPOSIT':
      case 'COIN_PURCHASE':
        return <CreditCard size={24} />;
      case 'WITHDRAWAL_APPROVED':
        return <CheckCircle size={24} color="var(--notif-accent)" />;
      case 'WITHDRAWAL_REJECTED':
        return <XCircle size={24} color="var(--notif-error)" />;
      case 'WELCOME':
        return <Info size={24} />;
      default:
        return <Bell size={24} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="notification-page">
      <Header />
      
      {/* Background Effects */}
      <div className="notif-bg-effects">
        <div className="notif-grid-overlay"></div>
        <div className="notif-glow-orb orb-1"></div>
        <div className="notif-glow-orb orb-2"></div>
        <div className="notif-glow-orb orb-3"></div>
      </div>

      {/* Hero Section */}
      <section className="notif-hero">
        <motion.div 
          className="hero-content" 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <div className="hero-icon-container">
            <Bell size={64} className="hero-icon" />
            <div className="icon-glow-ring"></div>
          </div>
          <h1 className="hero-title"><span className="title-gradient">TRUNG TÂM THÔNG BÁO</span></h1>
          <p className="hero-tagline">NOTIFICATION CENTER</p>
          
          <button className="filter-btn" onClick={handleMarkAllAsRead} style={{ margin: '0 auto' }}>
            <CheckCheck size={18} />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <motion.div 
        className="notif-stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="notif-stat-card">
          <div className="stat-icon-wrapper total">
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <h3>Tổng thông báo</h3>
            <p className="stat-value">{totalCount}</p>
          </div>
        </div>
        <div className="notif-stat-card">
          <div className="stat-icon-wrapper unread">
            <Mail size={24} />
          </div>
          <div className="stat-content">
            <h3>Chưa đọc</h3>
            <p className="stat-value">{unreadCount}</p>
          </div>
        </div>
        <div className="notif-stat-card">
          <div className="stat-icon-wrapper read">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Đã đọc</h3>
            <p className="stat-value">{totalCount - unreadCount}</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="notif-filters"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => { setFilter('all'); setPage(0); }}
        >
          <Filter size={18} />
          <span>Tất cả</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => { setFilter('unread'); setPage(0); }}
        >
          <Mail size={18} />
          <span>Chưa đọc</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => { setFilter('read'); setPage(0); }}
        >
          <CheckCircle size={18} />
          <span>Đã đọc</span>
        </button>
      </motion.div>

      {/* Notification List */}
      <div className="notif-list-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--notif-text-dim)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--notif-text-dim)' }}>
            <Bell size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {notifications.map((notification, index) => (
              <motion.div 
                key={notification.id} 
                className={`notif-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="notif-icon-wrapper">
                  {notification.senderAvatar ? (
                    <img 
                      src={notification.senderAvatar} 
                      alt={notification.senderName || 'User'} 
                      style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                    />
                  ) : (
                    getIcon(notification.type)
                  )}
                </div>
                <div className="notif-content">
                  <div className="notif-header-row">
                    <h4 className="notif-title">{notification.title}</h4>
                    <span className="notif-time">
                      <Clock size={14} />
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="notif-message">
                    {notification.senderName && <span style={{ fontWeight: 'bold', color: 'var(--notif-primary)', marginRight: '6px' }}>{notification.senderName}</span>}
                    {notification.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button 
            className="pagination-btn"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="pagination-text">
            Trang {page + 1} / {totalPages}
          </span>
          <button 
            className="pagination-btn"
            disabled={page === totalPages - 1}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div 
            className="notif-modal-overlay" 
            onClick={() => setSelectedNotification(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="notif-modal"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button className="modal-close-btn" onClick={() => setSelectedNotification(null)}>
                <XCircle size={24} />
              </button>
              
              <div className="modal-content-wrapper">
                <div className="modal-icon-large">
                  {selectedNotification.senderAvatar ? (
                    <img 
                      src={selectedNotification.senderAvatar} 
                      alt={selectedNotification.senderName || 'User'} 
                      style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }}
                    />
                  ) : getIcon(selectedNotification.type)}
                </div>
                
                <h2 className="modal-title">
                  {selectedNotification.title}
                </h2>
                
                <p className="modal-message">
                  {selectedNotification.senderName && <div style={{ fontWeight: 'bold', color: 'var(--notif-primary)', marginBottom: '8px' }}>{selectedNotification.senderName}</div>}
                  {selectedNotification.message}
                </p>

                <div className="modal-actions">
                  <button className="modal-btn" onClick={handleModalAction}>
                    Xem Chi Tiết
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPage;
