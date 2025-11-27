import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronDown, MessageCircle, BookOpen, Shield, CreditCard, 
  Users, Mail, Phone, HelpCircle, Send, CheckCircle, AlertCircle,
  Sparkles, Ticket, Clock, FileText, List, RefreshCw, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import supportService, { TicketResponse, TicketMessageResponse } from '../../services/supportService';
import '../../styles/HelpCenter.css';

interface FAQItem { question: string; answer: string; }
interface FAQCategory { title: string; icon: React.ElementType; faqs: FAQItem[]; }
interface TicketForm { subject: string; category: string; priority: string; description: string; email: string; }

const HelpCenter = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'create' | 'mytickets'>('faq');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCode, setTicketCode] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  
  // My Tickets state
  const [myTickets, setMyTickets] = useState<TicketResponse[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingError, setTrackingError] = useState('');
  
  // Chat state
  const [showChatModal, setShowChatModal] = useState(false);
  const [messages, setMessages] = useState<TicketMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    subject: '', category: 'general', priority: 'medium', description: '', email: user?.email || ''
  });

  const faqCategories: FAQCategory[] = [
    { title: 'Tài Khoản & Bảo Mật', icon: Shield, faqs: [
      { question: 'Làm thế nào để thay đổi mật khẩu?', answer: 'Vào Cài đặt > Bảo mật > Đổi mật khẩu.' },
      { question: 'Tôi quên mật khẩu phải làm sao?', answer: 'Sử dụng tính năng "Quên mật khẩu" trên trang đăng nhập.' },
      { question: 'Làm sao để bật xác thực 2 lớp?', answer: 'Vào Cài đặt > Bảo mật > Xác thực 2 lớp.' }
    ]},
    { title: 'Khóa Học & Học Tập', icon: BookOpen, faqs: [
      { question: 'Làm sao để tìm khóa học phù hợp?', answer: 'Sử dụng công cụ tìm kiếm hoặc bộ lọc theo chủ đề.' },
      { question: 'Tôi có thể học thử không?', answer: 'Có, mỗi khóa học đều có bài học thử miễn phí.' },
      { question: 'Chứng chỉ có giá trị như thế nào?', answer: 'Chứng chỉ SkillVerse được nhiều doanh nghiệp công nhận.' }
    ]},
    { title: 'Thanh Toán & Gói Dịch Vụ', icon: CreditCard, faqs: [
      { question: 'Các phương thức thanh toán?', answer: 'Thẻ tín dụng/ghi nợ, Momo, ZaloPay, chuyển khoản.' },
      { question: 'Chính sách hoàn tiền?', answer: 'Hoàn tiền trong 7 ngày nếu chưa học quá 30%.' },
      { question: 'Premium có những quyền lợi gì?', answer: 'Truy cập không giới hạn, Chat AI, Roadmap cá nhân.' }
    ]},
    { title: 'Cộng Đồng & Hỗ Trợ', icon: Users, faqs: [
      { question: 'Kết nối với học viên khác?', answer: 'Tham gia nhóm học tập, diễn đàn và sự kiện.' },
      { question: 'Hỗ trợ kỹ thuật 24/7?', answer: 'Đội ngũ hỗ trợ làm việc 8h-22h hàng ngày.' },
      { question: 'Meowl AI có thể giúp gì?', answer: 'Tìm khóa học, giải đáp thắc mắc, tư vấn nghề nghiệp.' }
    ]}
  ];

  const ticketCategories = [
    { value: 'general', label: 'Câu hỏi chung' },
    { value: 'technical', label: 'Lỗi kỹ thuật' },
    { value: 'payment', label: 'Thanh toán & Hoàn tiền' },
    { value: 'account', label: 'Tài khoản & Bảo mật' },
    { value: 'course', label: 'Khóa học & Nội dung' },
    { value: 'suggestion', label: 'Góp ý & Đề xuất' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Thấp', color: '#10b981' },
    { value: 'medium', label: 'Trung bình', color: '#f59e0b' },
    { value: 'high', label: 'Cao', color: '#ef4444' }
  ];

  const filteredFAQs = searchQuery
    ? faqCategories.map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
    : faqCategories;

  const fetchMyTickets = async () => {
    if (!user?.id && !user?.email) return;
    setLoadingTickets(true);
    try {
      const tickets = user?.id 
        ? await supportService.getMyTickets(user.id)
        : await supportService.getTicketsByEmail(user?.email || '');
      setMyTickets(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleTrackTicket = async () => {
    if (!trackingCode.trim()) return;
    setTrackingError('');
    setLoadingTickets(true);
    try {
      const ticket = await supportService.getTicketByCode(trackingCode.trim());
      setSelectedTicket(ticket);
    } catch {
      setTrackingError('Không tìm thấy ticket với mã này');
      setSelectedTicket(null);
    } finally {
      setLoadingTickets(false);
    }
  };

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || selectedTicket.status === 'CLOSED') return;
    setSendingMessage(true);
    try {
      const msg = await supportService.sendTicketMessage(selectedTicket.ticketCode, {
        content: newMessage,
        senderEmail: user?.email || selectedTicket.email,
        senderName: user?.email?.split('@')[0] || 'Người dùng',
        senderType: 'USER',
        senderId: user?.id
      });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || selectedTicket.status === 'CLOSED') return;
    if (!confirm('Bạn có chắc muốn đóng ticket này? Sau khi đóng, bạn sẽ không thể gửi tin nhắn nữa.')) return;
    try {
      const updated = await supportService.closeTicket(selectedTicket.id);
      setSelectedTicket(updated);
      // Update in myTickets list
      setMyTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'mytickets' && user) fetchMyTickets();
  }, [activeTab, user]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await supportService.createTicket({
        email: ticketForm.email,
        subject: ticketForm.subject,
        category: ticketForm.category.toUpperCase(),
        priority: ticketForm.priority.toUpperCase(),
        description: ticketForm.description,
        userId: user?.id
      });
      setTicketCode(response.ticketCode);
      setTicketSubmitted(true);
      setTicketForm({ subject: '', category: 'general', priority: 'medium', description: '', email: user?.email || '' });
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTicketForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'PENDING': { label: 'Đang chờ', color: '#f59e0b' },
      'RESPONDED': { label: 'Đã phản hồi', color: '#00d4ff' },
      'IN_PROGRESS': { label: 'Đang xử lý', color: '#8b5cf6' },
      'COMPLETED': { label: 'Hoàn thành', color: '#10b981' },
      'CLOSED': { label: 'Đã đóng', color: '#6b7280' }
    };
    return map[status] || { label: status, color: '#6b7280' };
  };

  const getCategoryLabel = (cat: string) => ticketCategories.find(c => c.value === cat.toLowerCase())?.label || cat;
  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="help-page">
      <div className="help-bg-effects">
        <div className="help-grid-overlay"></div>
        <div className="help-glow-orb orb-1"></div>
        <div className="help-glow-orb orb-2"></div>
        <div className="help-glow-orb orb-3"></div>
      </div>

      <section className="help-hero">
        <motion.div className="hero-content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="hero-icon-container">
            <HelpCircle size={64} className="hero-icon" />
            <div className="icon-glow-ring"></div>
          </div>
          <h1 className="hero-title"><span className="title-gradient">TRUNG TÂM HỖ TRỢ</span></h1>
          <p className="hero-tagline">HELP CENTER</p>
          <p className="hero-description">Chúng tôi luôn sẵn sàng giúp đỡ bạn.</p>
          <div className="help-search">
            <Search size={20} className="search-icon" />
            <input type="text" className="search-input" placeholder="Tìm kiếm câu hỏi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </motion.div>
      </section>

      <div className="help-quick-actions">
        <motion.button className={`quick-action-btn ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => { setActiveTab('faq'); setTicketSubmitted(false); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <FileText size={20} /><span>Câu hỏi thường gặp</span>
        </motion.button>
        <motion.button className={`quick-action-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Ticket size={20} /><span>Gửi yêu cầu hỗ trợ</span>
        </motion.button>
        <motion.button className={`quick-action-btn ${activeTab === 'mytickets' ? 'active' : ''}`} onClick={() => setActiveTab('mytickets')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <List size={20} /><span>Tra cứu ticket</span>
        </motion.button>
      </div>

      <div className="help-content">
        {activeTab === 'faq' && (
          <div className="help-faq">
            {filteredFAQs.map((category, idx) => (
              <motion.div key={idx} className="faq-category" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                <div className={`faq-category-header ${selectedCategory === idx ? 'expanded' : ''}`} onClick={() => setSelectedCategory(selectedCategory === idx ? null : idx)}>
                  <div className="faq-category-icon"><category.icon size={24} /></div>
                  <h2 className="faq-category-title">{category.title}</h2>
                  <ChevronDown className={`faq-arrow ${selectedCategory === idx ? 'rotated' : ''}`} size={20} />
                </div>
                <div className={`faq-list ${selectedCategory === idx ? 'expanded' : ''}`}>
                  {category.faqs.map((faq, i) => (
                    <div key={i} className="faq-item">
                      <h3 className="faq-question">{faq.question}</h3>
                      <p className="faq-answer">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <motion.div className="ticket-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {ticketSubmitted ? (
              <div className="ticket-success">
                <div className="success-icon"><CheckCircle size={64} /></div>
                <h2>Gửi yêu cầu thành công!</h2>
                <p>Chúng tôi sẽ phản hồi trong vòng 24 giờ.</p>
                <p className="success-note">Mã ticket: <strong>{ticketCode}</strong></p>
                <button className="btn-new-ticket" onClick={() => setTicketSubmitted(false)}>Gửi yêu cầu mới</button>
              </div>
            ) : (
              <form className="ticket-form" onSubmit={handleTicketSubmit}>
                <div className="ticket-form-header">
                  <Ticket size={28} />
                  <div><h2>Gửi yêu cầu hỗ trợ</h2><p>Đội ngũ sẽ phản hồi trong 24 giờ</p></div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Email liên hệ *</label>
                    <input type="email" name="email" value={ticketForm.email} onChange={handleInputChange} placeholder="email@example.com" required />
                  </div>
                  <div className="form-group">
                    <label>Danh mục *</label>
                    <select name="category" value={ticketForm.category} onChange={handleInputChange} required>
                      {ticketCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Tiêu đề *</label>
                    <input type="text" name="subject" value={ticketForm.subject} onChange={handleInputChange} placeholder="Tóm tắt vấn đề" required />
                  </div>
                  <div className="form-group">
                    <label>Mức độ ưu tiên</label>
                    <div className="priority-options">
                      {priorityLevels.map(p => (
                        <label key={p.value} className={`priority-option ${ticketForm.priority === p.value ? 'selected' : ''}`} style={{ '--priority-color': p.color } as React.CSSProperties}>
                          <input type="radio" name="priority" value={p.value} checked={ticketForm.priority === p.value} onChange={handleInputChange} />
                          <span className="priority-dot"></span><span>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>Mô tả chi tiết *</label>
                    <textarea name="description" value={ticketForm.description} onChange={handleInputChange} placeholder="Mô tả vấn đề..." rows={6} required />
                  </div>
                </div>
                <div className="form-note"><AlertCircle size={16} /><span>Cung cấp đầy đủ thông tin để được hỗ trợ nhanh nhất.</span></div>
                {submitError && <div className="form-error"><AlertCircle size={16} /><span>{submitError}</span></div>}
                <button type="submit" className="btn-submit-ticket" disabled={isSubmitting}>
                  {isSubmitting ? <><div className="spinner"></div><span>Đang gửi...</span></> : <><Send size={18} /><span>Gửi yêu cầu</span></>}
                </button>
              </form>
            )}
          </motion.div>
        )}

        {activeTab === 'mytickets' && (
          <motion.div className="mytickets-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="tracking-box">
              <h3><Search size={20} /> Tra cứu ticket</h3>
              <div className="tracking-input-group">
                <input type="text" placeholder="Nhập mã ticket (VD: TK-ABC12345)" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
                <button onClick={handleTrackTicket} disabled={loadingTickets}>
                  {loadingTickets ? <RefreshCw size={18} className="spin" /> : <Search size={18} />}
                </button>
              </div>
              {trackingError && <p className="tracking-error"><AlertCircle size={14} /> {trackingError}</p>}
            </div>

            {selectedTicket && (
              <div className="ticket-detail-card">
                <div className="ticket-detail-header">
                  <span className="ticket-code">{selectedTicket.ticketCode}</span>
                  <span className="ticket-status" style={{ '--status-color': getStatusInfo(selectedTicket.status).color } as React.CSSProperties}>
                    {getStatusInfo(selectedTicket.status).label}
                  </span>
                  <button className="close-detail" onClick={() => setSelectedTicket(null)}><XCircle size={20} /></button>
                </div>
                <h4>{selectedTicket.subject}</h4>
                <div className="ticket-meta">
                  <span><Clock size={14} /> {formatDate(selectedTicket.createdAt)}</span>
                  <span>{getCategoryLabel(selectedTicket.category)}</span>
                </div>
                <div className="ticket-desc">{selectedTicket.description}</div>
                {selectedTicket.adminResponse && (
                  <div className="admin-response">
                    <h5>Phản hồi từ Admin:</h5>
                    <p>{selectedTicket.adminResponse}</p>
                  </div>
                )}
              </div>
            )}

            {user && (
              <div className="my-tickets-list">
                <div className="list-header">
                  <h3><List size={20} /> Tickets của bạn</h3>
                  <button className="refresh-btn" onClick={fetchMyTickets} disabled={loadingTickets}>
                    <RefreshCw size={16} className={loadingTickets ? 'spin' : ''} />
                  </button>
                </div>
                {loadingTickets ? (
                  <div className="loading-state"><RefreshCw size={24} className="spin" /> Đang tải...</div>
                ) : myTickets.length === 0 ? (
                  <div className="empty-state"><Ticket size={32} /><p>Bạn chưa có ticket nào</p></div>
                ) : (
                  <div className="tickets-grid">
                    {myTickets.map(ticket => (
                      <div key={ticket.id} className="ticket-card">
                        <div className="card-header">
                          <span className="ticket-code">{ticket.ticketCode}</span>
                          <span className="ticket-status" style={{ '--status-color': getStatusInfo(ticket.status).color } as React.CSSProperties}>
                            {getStatusInfo(ticket.status).label}
                          </span>
                        </div>
                        <h4>{ticket.subject}</h4>
                        <div className="card-meta">
                          <span><Clock size={12} /> {formatDate(ticket.createdAt)}</span>
                        </div>
                        <button className="chat-btn" onClick={() => handleOpenChat(ticket)}><MessageCircle size={14} /> Chat với Support</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="login-prompt">
                <p>Đăng nhập để xem danh sách ticket của bạn hoặc sử dụng mã ticket để tra cứu.</p>
              </div>
            )}
          </motion.div>
        )}

        <motion.section className="help-contact" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="contact-header"><Sparkles size={24} /><h2>Liên hệ trực tiếp</h2></div>
          <p className="contact-subtitle">Cần hỗ trợ nhanh hơn?</p>
          <div className="contact-grid">
            <a href="mailto:support@skillverse.vn" className="contact-card">
              <div className="contact-icon"><Mail size={28} /></div>
              <div className="contact-info"><span className="contact-label">Email</span><span className="contact-value">support@skillverse.vn</span></div>
            </a>
            <a href="tel:0931430662" className="contact-card">
              <div className="contact-icon"><Phone size={28} /></div>
              <div className="contact-info"><span className="contact-label">Hotline</span><span className="contact-value">0931 430 662</span></div>
            </a>
            <div className="contact-card">
              <div className="contact-icon"><Clock size={28} /></div>
              <div className="contact-info"><span className="contact-label">Giờ làm việc</span><span className="contact-value">8:00 - 22:00</span></div>
            </div>
            <div className="contact-card">
              <div className="contact-icon"><MessageCircle size={28} /></div>
              <div className="contact-info"><span className="contact-label">Meowl Chat</span><span className="contact-value">AI 24/7</span></div>
            </div>
          </div>
        </motion.section>
      </div>

      <div className="help-footer">
        <div className="footer-line"></div>
        <div className="footer-content"><Sparkles size={16} /><span>SkillVerse - Luôn sẵn sàng hỗ trợ bạn</span><Sparkles size={16} /></div>
        <div className="footer-line"></div>
      </div>

      {/* User Chat Modal */}
      <AnimatePresence>
        {showChatModal && selectedTicket && (
          <motion.div className="user-chat-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowChatModal(false)}>
            <motion.div className="user-chat-modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="user-chat-header">
                <div className="user-chat-title">
                  <MessageCircle size={22} />
                  <div>
                    <span className="user-chat-code">{selectedTicket.ticketCode}</span>
                    <span className="user-chat-subject">{selectedTicket.subject}</span>
                  </div>
                </div>
                <span className="user-chat-status" style={{ '--status-color': getStatusInfo(selectedTicket.status).color } as React.CSSProperties}>
                  {getStatusInfo(selectedTicket.status).label}
                </span>
                <button className="user-chat-close" onClick={() => setShowChatModal(false)}><XCircle size={24} /></button>
              </div>

              <div className="user-chat-body">
                <div className="user-chat-info">
                  <span><Clock size={14} /> {formatDate(selectedTicket.createdAt)}</span>
                  <span>{getCategoryLabel(selectedTicket.category)}</span>
                </div>
                
                <div className="user-chat-original">
                  <label>Nội dung ban đầu:</label>
                  <p>{selectedTicket.description}</p>
                </div>

                <div className="user-chat-messages">
                  {messages.length === 0 ? (
                    <div className="user-chat-empty">
                      <MessageCircle size={32} />
                      <p>Chưa có tin nhắn nào. Gửi tin nhắn để bắt đầu cuộc hội thoại.</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`user-chat-message ${msg.senderType.toLowerCase()}`}>
                        <div className="user-chat-bubble">{msg.content}</div>
                        <div className="user-chat-meta">
                          <span>{msg.senderName}</span>
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="user-chat-footer">
                {selectedTicket.status === 'CLOSED' ? (
                  <div className="user-chat-closed">
                    <XCircle size={18} />
                    <span>Ticket đã đóng. Không thể gửi tin nhắn.</span>
                  </div>
                ) : (
                  <>
                    <textarea 
                      placeholder="Nhập tin nhắn của bạn..." 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    />
                    <button className="user-chat-send" onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
                      <Send size={20} />
                    </button>
                  </>
                )}
              </div>
              
              {selectedTicket.status !== 'CLOSED' && (
                <div className="user-chat-actions">
                  <button className="user-close-ticket-btn" onClick={handleCloseTicket}>
                    <XCircle size={16} /> Đóng ticket
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpCenter;
