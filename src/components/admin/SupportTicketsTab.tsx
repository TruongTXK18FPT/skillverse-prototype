import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Search, Filter, Clock, AlertCircle, CheckCircle, 
  XCircle, RefreshCw, Inbox, Send, Trash2, MessageSquare, Settings
} from 'lucide-react';
import supportService, { TicketResponse, TicketStatsResponse, TicketMessageResponse } from '../../services/supportService';
import './SupportTicketsTab.css';

const SupportTicketsTab: React.FC = () => {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [stats, setStats] = useState<TicketStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(null);
  
  // Modal states
  const [showChatModal, setShowChatModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Status form
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Chat
  const [messages, setMessages] = useState<TicketMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Đang chờ', color: '#f59e0b' },
    { value: 'RESPONDED', label: 'Đã phản hồi', color: '#00d4ff' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý', color: '#8b5cf6' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: '#10b981' },
    { value: 'CLOSED', label: 'Đã đóng', color: '#6b7280' }
  ];

  const categoryOptions = [
    { value: '', label: 'Tất cả danh mục' },
    { value: 'GENERAL', label: 'Câu hỏi chung' },
    { value: 'TECHNICAL', label: 'Lỗi kỹ thuật' },
    { value: 'PAYMENT', label: 'Thanh toán' },
    { value: 'ACCOUNT', label: 'Tài khoản' },
    { value: 'COURSE', label: 'Khóa học' },
    { value: 'SUGGESTION', label: 'Góp ý' }
  ];

  const priorityOptions = [
    { value: '', label: 'Tất cả ưu tiên' },
    { value: 'HIGH', label: 'Cao', color: '#ef4444' },
    { value: 'MEDIUM', label: 'Trung bình', color: '#f59e0b' },
    { value: 'LOW', label: 'Thấp', color: '#10b981' }
  ];

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await supportService.getAllTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        page: currentPage,
        size: 10
      });
      setTickets(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, currentPage]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await supportService.getTicketStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // fetchTickets and fetchStats moved into useCallback above

  const fetchMessages = async (ticketCode: string) => {
    try {
      const msgs = await supportService.getTicketMessages(ticketCode);
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleOpenChat = async (ticket: TicketResponse) => {
    setSelectedTicket(ticket);
    setShowChatModal(true);
    await fetchMessages(ticket.ticketCode);
  };

  const handleOpenStatus = (ticket: TicketResponse) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setShowStatusModal(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSendingMessage(true);
    try {
      const msg = await supportService.sendTicketMessage(selectedTicket.ticketCode, {
        content: newMessage,
        senderEmail: 'admin@skillverse.vn',
        senderName: 'Admin Support',
        senderType: 'ADMIN'
      });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      const updated = await supportService.updateTicket(selectedTicket.id, { status: newStatus });
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTicket(updated);
      fetchStats();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa ticket này?')) return;
    try {
      await supportService.deleteTicket(id);
      setTickets(prev => prev.filter(t => t.id !== id));
      fetchStats();
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const getStatusInfo = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    return { label: opt?.label || status, color: opt?.color || '#6b7280' };
  };

  const getPriorityInfo = (priority: string) => {
    const opt = priorityOptions.find(o => o.value === priority);
    return { label: opt?.label || priority, color: opt?.color || '#6b7280' };
  };

  const getCategoryLabel = (category: string) => {
    return categoryOptions.find(o => o.value === category)?.label || category;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredTickets = tickets.filter(ticket =>
    searchQuery === '' ||
    ticket.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="stt-container">
      {/* Header */}
      <div className="stt-header">
        <div className="stt-header-left">
          <Ticket size={28} className="stt-header-icon" />
          <div>
            <h2>Quản lý Tickets Hỗ Trợ</h2>
            <p>Xử lý yêu cầu và chat với người dùng</p>
          </div>
        </div>
        <button className="stt-refresh-btn" onClick={() => { fetchTickets(); fetchStats(); }}>
          <RefreshCw size={18} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stt-stats-grid">
          <motion.div className="stt-stat-card pending" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="stt-stat-icon"><AlertCircle size={24} /></div>
            <div className="stt-stat-info">
              <span className="stt-stat-value">{stats.openTickets}</span>
              <span className="stt-stat-label">Đang chờ</span>
            </div>
          </motion.div>
          <motion.div className="stt-stat-card responded" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="stt-stat-icon"><MessageSquare size={24} /></div>
            <div className="stt-stat-info">
              <span className="stt-stat-value">{stats.respondedTickets || 0}</span>
              <span className="stt-stat-label">Đã phản hồi</span>
            </div>
          </motion.div>
          <motion.div className="stt-stat-card progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="stt-stat-icon"><Clock size={24} /></div>
            <div className="stt-stat-info">
              <span className="stt-stat-value">{stats.inProgressTickets}</span>
              <span className="stt-stat-label">Đang xử lý</span>
            </div>
          </motion.div>
          <motion.div className="stt-stat-card completed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="stt-stat-icon"><CheckCircle size={24} /></div>
            <div className="stt-stat-info">
              <span className="stt-stat-value">{stats.resolvedTickets}</span>
              <span className="stt-stat-label">Hoàn thành</span>
            </div>
          </motion.div>
          <motion.div className="stt-stat-card closed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="stt-stat-icon"><Inbox size={24} /></div>
            <div className="stt-stat-info">
              <span className="stt-stat-value">{stats.totalTickets}</span>
              <span className="stt-stat-label">Tổng cộng</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="stt-filters">
        <div className="stt-search-box">
          <Search size={18} />
          <input type="text" placeholder="Tìm theo mã, tiêu đề, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="stt-filter-group">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="stt-tickets-container">
        {loading ? (
          <div className="stt-loading"><RefreshCw size={32} className="stt-spin" /><span>Đang tải...</span></div>
        ) : filteredTickets.length === 0 ? (
          <div className="stt-empty"><Inbox size={48} /><span>Không có ticket nào</span></div>
        ) : (
          <div className="stt-table">
            <div className="stt-table-header">
              <div>Mã Ticket</div>
              <div>Tiêu đề</div>
              <div className="stt-th-category">Danh mục</div>
              <div>Ưu tiên</div>
              <div>Trạng thái</div>
              <div className="stt-th-date">Ngày tạo</div>
              <div>Thao tác</div>
            </div>
            {filteredTickets.map((ticket, index) => (
              <motion.div key={ticket.id} className="stt-table-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                <div className="stt-ticket-code">{ticket.ticketCode}</div>
                <div className="stt-td-subject">
                  <span className="stt-subject-text">{ticket.subject}</span>
                  <span className="stt-email-text">{ticket.email}</span>
                </div>
                <div className="stt-td-category stt-category-badge">{getCategoryLabel(ticket.category)}</div>
                <div><span className="stt-priority-badge" style={{ '--priority-color': getPriorityInfo(ticket.priority).color } as React.CSSProperties}>{getPriorityInfo(ticket.priority).label}</span></div>
                <div><span className="stt-status-badge" style={{ '--status-color': getStatusInfo(ticket.status).color } as React.CSSProperties}>{getStatusInfo(ticket.status).label}</span></div>
                <div className="stt-td-date">{formatDate(ticket.createdAt)}</div>
                <div className="stt-td-actions">
                  <button className="stt-action-btn chat" title="Chat" onClick={() => handleOpenChat(ticket)}><MessageSquare size={16} /></button>
                  <button className="stt-action-btn status" title="Trạng thái" onClick={() => handleOpenStatus(ticket)}><Settings size={16} /></button>
                  <button className="stt-action-btn delete" title="Xóa" onClick={() => handleDeleteTicket(ticket.id)}><Trash2 size={16} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="stt-pagination">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>Trước</button>
            <span>Trang {currentPage + 1} / {totalPages}</span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>Sau</button>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChatModal && selectedTicket && (
          <motion.div className="stt-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowChatModal(false)}>
            <motion.div className="stt-chat-modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="stt-chat-modal-header">
                <div className="stt-chat-modal-title">
                  <MessageSquare size={22} />
                  <div>
                    <span className="stt-chat-ticket-code">{selectedTicket.ticketCode}</span>
                    <span className="stt-chat-ticket-subject">{selectedTicket.subject}</span>
                  </div>
                </div>
                <button className="stt-close-btn" onClick={() => setShowChatModal(false)}><XCircle size={24} /></button>
              </div>

              <div className="stt-chat-modal-body">
                {/* Ticket Info */}
                <div className="stt-chat-ticket-info">
                  <span><strong>Email:</strong> {selectedTicket.email}</span>
                  <span><strong>Danh mục:</strong> {getCategoryLabel(selectedTicket.category)}</span>
                  <span className="stt-status-badge" style={{ '--status-color': getStatusInfo(selectedTicket.status).color } as React.CSSProperties}>
                    {getStatusInfo(selectedTicket.status).label}
                  </span>
                </div>

                {/* Original Description */}
                <div className="stt-chat-description">
                  <label>Nội dung ban đầu:</label>
                  <p>{selectedTicket.description}</p>
                </div>

                {/* Messages */}
                <div className="stt-chat-messages">
                  {messages.length === 0 ? (
                    <div className="stt-chat-empty">Chưa có tin nhắn nào</div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`stt-chat-message ${msg.senderType.toLowerCase()}`}>
                        <div className="stt-chat-bubble">{msg.content}</div>
                        <div className="stt-chat-meta">
                          <span>{msg.senderName}</span>
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="stt-chat-modal-footer">
                <textarea 
                  placeholder="Nhập phản hồi..." 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <button className="stt-chat-send" onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Modal */}
      <AnimatePresence>
        {showStatusModal && selectedTicket && (
          <motion.div className="stt-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStatusModal(false)}>
            <motion.div className="stt-status-modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="stt-status-modal-header">
                <div className="stt-status-modal-title">
                  <Settings size={22} />
                  <span>Cập nhật trạng thái</span>
                </div>
                <button className="stt-close-btn" onClick={() => setShowStatusModal(false)}><XCircle size={24} /></button>
              </div>

              <div className="stt-status-modal-body">
                <div className="stt-status-ticket-info">
                  <div className="stt-status-info-row">
                    <span className="stt-status-label">Mã ticket:</span>
                    <span className="stt-status-value stt-ticket-code">{selectedTicket.ticketCode}</span>
                  </div>
                  <div className="stt-status-info-row">
                    <span className="stt-status-label">Tiêu đề:</span>
                    <span className="stt-status-value">{selectedTicket.subject}</span>
                  </div>
                  <div className="stt-status-info-row">
                    <span className="stt-status-label">Ưu tiên:</span>
                    <span className="stt-priority-badge" style={{ '--priority-color': getPriorityInfo(selectedTicket.priority).color } as React.CSSProperties}>
                      {getPriorityInfo(selectedTicket.priority).label}
                    </span>
                  </div>
                </div>

                <div className="stt-status-select-group">
                  <label>Chọn trạng thái mới:</label>
                  <div className="stt-status-options">
                    {statusOptions.filter(o => o.value && o.value !== 'CLOSED').map(opt => (
                      <button
                        key={opt.value}
                        className={`stt-status-option ${newStatus === opt.value ? 'active' : ''}`}
                        style={{ '--status-color': opt.color } as React.CSSProperties}
                        onClick={() => setNewStatus(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="stt-status-note">* Chỉ người dùng mới có thể đóng ticket</p>
                </div>
              </div>

              <div className="stt-status-modal-footer">
                <button className="stt-btn-cancel" onClick={() => setShowStatusModal(false)}>Hủy</button>
                <button className="stt-btn-save" onClick={handleUpdateStatus} disabled={isUpdating}>
                  {isUpdating ? <><RefreshCw size={16} className="stt-spin" /> Đang lưu...</> : 'Cập nhật'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTicketsTab;
