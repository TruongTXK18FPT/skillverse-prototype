import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, User, Sparkles, Loader, MessageSquare, Plus, Trash2, Lock, LogIn, MoreVertical, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import aiChatbotService from '../../services/aiChatbotService';
import { UIMessage, ChatSession } from '../../types/Chat';
import { useToast } from '../../hooks/useToast';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/AiChatbot.css';
import aiAvatar from '../../assets/aiChatBot.png';

/**
 * AI-powered Career Counseling Chatbot Page
 * Integrated with Gemini API for personalized career guidance
 */
const AiChatbotPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Xin chào! Mình là **Meowl**, cố vấn nghề nghiệp AI của **SkillVerse**! 🐾

Mình có thể giúp bạn:
• 🎓 **Chọn ngành học** — Phù hợp với sở thích và mục tiêu
• 📈 **Xu hướng nghề nghiệp** — Ngành nào đang hot hiện nay
• 🚀 **Phát triển kỹ năng** — Bạn cần học những gì
• 💼 **Chuyển hướng sự nghiệp** — Tự tin đổi nghề
• 💰 **Mức lương tham khảo** — Định vị giá trị của bạn
• 🎯 **Lộ trình học tập** — Từng bước rõ ràng để đạt mục tiêu

💬 **Hãy thử hỏi:**
- "Xu hướng nghề nghiệp công nghệ 2025 là gì?"
- "Nên học Khoa học Máy tính hay Kinh doanh?"
- "Làm sao để trở thành Data Scientist?"
- "Kỹ năng quan trọng nhất hiện nay là gì?"

✨ *Hôm nay bạn muốn khám phá điều gì?*`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [openMenuSessionId, setOpenMenuSessionId] = useState<number | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError, showSuccess } = useToast();

  // Optimized auto-scroll with throttling to prevent lag
  useEffect(() => {
    // Throttle scroll to prevent excessive calls during rapid message updates
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 150); // Increased delay to reduce scroll frequency
    
    return () => clearTimeout(timeoutId);
  }, [messages.length]); // Only depend on message count, not entire messages array

  // Optimized click outside handler with useCallback
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (openMenuSessionId !== null) {
      const target = event.target as HTMLElement;
      const isInsideMenu = target.closest('.chatbot-session-menu-dropdown');
      const isMenuButton = target.closest('.chatbot-session-menu-btn');
      
      if (!isInsideMenu && !isMenuButton) {
        setOpenMenuSessionId(null);
      }
    }
  }, [openMenuSessionId]);

  // Close menu when clicking outside - optimized
  useEffect(() => {
    if (openMenuSessionId !== null) {
      // Use passive listener for better performance
      document.addEventListener('click', handleClickOutside, { passive: true });
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuSessionId, handleClickOutside]);

  // Load user sessions on mount - WITH AUTH CHECK
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    } else {
      setSessions([]);
      setLoadingSessions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadSessions = async () => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lịch sử trò chuyện');
      return;
    }

    try {
      setLoadingSessions(true);
      const userSessions = await aiChatbotService.getSessions();
      // Defensive: ensure we always store an array. Some backends may return null/object when empty.
      if (Array.isArray(userSessions)) {
        setSessions(userSessions);
      } else if (userSessions && Array.isArray((userSessions as any).sessions)) {
        // support shape { sessions: [] }
        setSessions((userSessions as any).sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      const message = (error as Error).message;
      if (message.includes('401') || message.includes('Unauthorized')) {
        showError('Chưa đăng nhập', 'Vui lòng đăng nhập để sử dụng tính năng này');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showError('Lỗi', 'Không thể tải danh sách phiên trò chuyện');
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `👋 Xin chào! Mình là **Meowl**, cố vấn nghề nghiệp AI của **SkillVerse**! 🐾

Mình có thể giúp bạn:
• 🎓 **Chọn ngành học** — Phù hợp với sở thích và mục tiêu
• 📈 **Xu hướng nghề nghiệp** — Ngành nào đang hot hiện nay
• 🚀 **Phát triển kỹ năng** — Bạn cần học những gì
• 💼 **Chuyển hướng sự nghiệp** — Tự tin đổi nghề
• 💰 **Mức lương tham khảo** — Định vị giá trị của bạn
• 🎯 **Lộ trình học tập** — Từng bước rõ ràng để đạt mục tiêu

💬 **Hãy thử hỏi:**
- "Xu hướng nghề nghiệp công nghệ 2025 là gì?"
- "Nên học Khoa học Máy tính hay Kinh doanh?"
- "Làm sao để trở thành Data Scientist?"
- "Kỹ năng quan trọng nhất hiện nay là gì?"

✨ *Hôm nay bạn muốn khám phá điều gì?*`,
        timestamp: new Date()
      }
    ]);
    showSuccess('Thành công', 'Đã tạo cuộc trò chuyện mới!');
  };

  const handleLoadSession = async (selectedSessionId: number) => {
    // STRICT AUTH CHECK
    if (!isAuthenticated || !user?.id) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lịch sử');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      setIsLoading(true);
      const history = await aiChatbotService.getHistory(selectedSessionId);
      
      // Convert ChatMessage[] to UIMessage[]
      const uiMessages: UIMessage[] = [];
      history.forEach((msg, index) => {
        // Add user message
        uiMessages.push({
          id: `${selectedSessionId}-${index}-user`,
          role: 'user',
          content: msg.userMessage,
          timestamp: new Date(msg.createdAt)
        });
        // Add AI response
        uiMessages.push({
          id: `${selectedSessionId}-${index}-ai`,
          role: 'assistant',
          content: msg.aiResponse,
          timestamp: new Date(msg.createdAt)
        });
      });

      setMessages(uiMessages);
      setSessionId(selectedSessionId);
      showSuccess('Đã tải', `Đã tải lịch sử phiên ${selectedSessionId}`);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('401') || message.includes('Unauthorized')) {
        showError('Chưa đăng nhập', 'Phiên đăng nhập đã hết hạn');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showError('Lỗi', 'Không thể tải lịch sử cuộc trò chuyện');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a chat session
   */
  const handleDeleteSession = async (sessionIdToDelete: number) => {
    if (!isAuthenticated) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xóa phiên');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa phiên ${sessionIdToDelete}?\nLịch sử trò chuyện sẽ bị xóa vĩnh viễn.`)) {
      return;
    }

    try {
      await aiChatbotService.deleteSession(sessionIdToDelete);
      await loadSessions(); // Reload session list
      
      // If deleted current session, start new chat
      if (sessionId === sessionIdToDelete) {
        handleNewChat();
      }
      
      showSuccess('Đã xóa', `Đã xóa phiên ${sessionIdToDelete}`);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('401') || message.includes('Unauthorized')) {
        showError('Chưa đăng nhập', 'Vui lòng đăng nhập để xóa phiên');
        setTimeout(() => navigate('/login'), 1500);
      } else if (message.includes('403') || message.includes('Forbidden')) {
        showError('Không có quyền', 'Bạn không có quyền xóa phiên này');
      } else {
        showError('Lỗi', 'Không thể xóa phiên trò chuyện');
      }
    }
  };

  /**
   * Rename a chat session
   */
  const handleRenameSession = async (sessionIdToRename: number) => {
    console.log('🔄 handleRenameSession called with sessionId:', sessionIdToRename);
    console.log('👤 Current user:', user);
    
    if (!user?.id) {
      console.error('❌ No user found, showing error toast');
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để đổi tên phiên');
      return;
    }

    // Start rename mode
    console.log('✅ Starting rename mode for session:', sessionIdToRename);
    setRenamingSessionId(sessionIdToRename);
    const currentSession = sessions.find(s => s.sessionId === sessionIdToRename);
    console.log('📝 Current session title:', currentSession?.title);
    setNewTitle(currentSession?.title || '');
    setOpenMenuSessionId(null);
  };

  /**
   * Save renamed session title
   */
  const handleSaveRename = async (sessionIdToRename: number) => {
    if (!newTitle.trim()) {
      showError('Lỗi', 'Tiêu đề không được để trống');
      return;
    }

    try {
      // Call backend API to update title
      const updatedSession = await aiChatbotService.renameSession(sessionIdToRename, newTitle.trim());
      
      // Update local state with response
      setSessions(prev => prev.map(s => 
        s.sessionId === sessionIdToRename ? { ...s, title: updatedSession.title } : s
      ));
      
      showSuccess('Đã đổi tên', `Đã đổi tên phiên thành "${updatedSession.title}"`);
      setRenamingSessionId(null);
      setNewTitle('');
    } catch (error: any) {
      const message = error.message || 'Không thể đổi tên phiên trò chuyện';
      showError('Lỗi', message);
    }
  };

  /**
   * Cancel rename operation
   */
  const handleCancelRename = () => {
    setRenamingSessionId(null);
    setNewTitle('');
  };

  // Memoized message content renderer for better performance
  const renderMessageContent = useCallback((content: string) => {
    const stripBold = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1');
    const renderInline = (text: string) => {
      // links [text](url)
      const withLinks = text.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      // inline code `code`
      const withCode = withLinks.replace(/`([^`]+)`/g, '<code class="chatbot-code-inline">$1</code>');
      return withCode;
    };

    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let currentTable: string[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul className="chatbot-list" key={`list-${elements.length}`}>
            {currentList.map((item, idx) => (
              <li key={`li-${idx}`} dangerouslySetInnerHTML={{ __html: renderInline(stripBold(item)) }} />
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const flushTable = () => {
      if (currentTable.length >= 2) {
        const [headerLine, ...bodyLines] = currentTable;
        const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
        const rows = bodyLines
          .filter(r => r.includes('|'))
          .map(r => r.split('|').map(c => c.trim()).filter(Boolean));
        elements.push(
          <div className="chatbot-table-wrapper" key={`tbl-${elements.length}`}>
            <table className="chatbot-table">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={`th-${i}`} dangerouslySetInnerHTML={{ __html: renderInline(stripBold(h)) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((cols, rIdx) => (
                  <tr key={`tr-${rIdx}`}>
                    {cols.map((c, cIdx) => (
                      <td key={`td-${rIdx}-${cIdx}`} dangerouslySetInnerHTML={{ __html: renderInline(stripBold(c)) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else if (currentTable.length === 1) {
        // Single line with pipes -> treat as paragraph
        elements.push(
          <p className="chatbot-paragraph" key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: renderInline(stripBold(currentTable[0])) }} />
        );
      }
      currentTable = [];
    };

    const flushCode = () => {
      if (codeBuffer.length > 0) {
        elements.push(
          <pre className="chatbot-code" key={`code-${elements.length}`}>
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
      }
    };

    for (const raw of lines) {
      const line = raw.replace(/\r$/, '');
      if (/^```/.test(line.trim())) {
        if (inCodeBlock) {
          inCodeBlock = false;
          flushCode();
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      const trimmed = line.trim();
      const isBullet = /^[-•]\s+/.test(trimmed);
      const isTableLike = trimmed.includes('|');

      // Headings
      const h3 = /^###\s+/.test(trimmed);
      const h2 = /^##\s+/.test(trimmed);
      const h1 = /^#\s+/.test(trimmed);

      if (isBullet) {
        flushTable();
        currentList.push(trimmed.replace(/^[-•]\s+/, ''));
        continue;
      }

      if (isTableLike) {
        // accumulate possible table block
        currentTable.push(trimmed);
        // flush later when a non-table line appears
        continue;
      }

      // If we reach here and there is a pending table, finish it (requires header + separator at least)
      if (currentTable.length > 0) {
        // Validate table by checking second line is separator
        if (currentTable.length >= 2 && /^\|?\s*[-: ]+/.test(currentTable[1])) {
          flushList();
          flushTable();
        } else {
          // not a valid table, render each as paragraph
          flushList();
          currentTable.forEach(tl => {
            elements.push(
              <p className="chatbot-paragraph" key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: renderInline(stripBold(tl)) }} />
            );
          });
          currentTable = [];
        }
      }

      if (trimmed === '') {
        flushList();
        elements.push(<div className="chatbot-paragraph-sep" key={`sep-${elements.length}`} />);
        continue;
      }

      flushList();
      if (h3 || h2 || h1) {
        const text = stripBold(trimmed.replace(/^###\s+|^##\s+|^#\s+/, ''));
        elements.push(
          <p className={`chatbot-heading ${h1 ? 'h1' : h2 ? 'h2' : 'h3'}`} key={`h-${elements.length}`} dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
        );
      } else {
        elements.push(
          <p className="chatbot-paragraph" key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: renderInline(stripBold(trimmed)) }} />
        );
      }
    }

    // flush any remaining blocks
    if (currentTable.length > 0) {
      if (currentTable.length >= 2 && isNaN(0)) {
        // we can't evaluate separator again here, just try to flush as table
      }
      flushTable();
    }
    flushList();
    flushCode();
    return <>{elements}</>;
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // STRICT AUTH CHECK: Multiple layers of validation
    if (!isAuthenticated || !user?.id) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để gửi tin nhắn');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // Additional security: Check if user data is valid
    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (!inputMessage.trim() || isLoading) return;

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Let AI handle auto-correction for IELTS scores (no frontend validation)
      // Frontend validation removed to allow AI to auto-correct IELTS 10.0 → 9.0
      const response = await aiChatbotService.sendMessage({
        // ép AI trả lời bằng tiếng Việt bằng cách thêm hướng dẫn ngắn
        message: `Trả lời bằng tiếng Việt rõ ràng, ngắn gọn. Câu hỏi: ${userMessage.content}`,
        sessionId: sessionId
      });

      // Update session ID if this is first message
      if (!sessionId) {
        setSessionId(response.sessionId);
        // Reload sessions to show the new one
        loadSessions();
      }

      const botMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.aiResponse,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const message = (error as Error).message;
      
      // Check for 401 errors (authentication)
      if (message.includes('401') || message.includes('Unauthorized')) {
        showError('Chưa đăng nhập', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showError('Lỗi', message || 'Không thể gửi tin nhắn');
      }
      
      // Add error message to chat
      const errorMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt);
  };

  // Memoized quick prompts to prevent re-creation on every render
  const quickPrompts = useMemo(() => [
    "Xu hướng nghề nghiệp 2025 là gì?",
    "Nên chọn Khoa học Máy tính hay Kinh doanh?",
    "Lộ trình trở thành Lập trình viên phần mềm?",
    "Những kỹ năng đang có giá trị cao hiện nay?",
    "Theo đuổi Data Science có đáng không?",
    "Chuyển ngành sang công nghệ như thế nào?"
  ], []);

  // LOGIN OVERLAY - Show when not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`chatbot-page ${theme}`} style={{ position: 'relative', minHeight: '80vh' }}>
        {/* Simplified cosmic dust particles - reduced for better performance */}
        <div className="cosmic-dust">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="dust-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${25 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        {/* Sidebar for Chat Sessions - Always Visible */}
        <div className="chatbot-sidebar">
          <div className="chatbot-sidebar__header">
            <h2 className="chatbot-sidebar__title">
              <MessageSquare size={20} />
              Chat Sessions
            </h2>
          </div>
          
          <div className="chatbot-sidebar__sessions">
            <div className="chatbot-sidebar__empty">
              <p>Vui lòng đăng nhập để xem lịch sử trò chuyện</p>
            </div>
          </div>
        </div>

        <div className="chatbot-container">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header__avatar">
              <img src={aiAvatar} alt="Meowl AI" style={{ width: 56, height: 56, borderRadius: '50%' }} />
            </div>
            <div className="chatbot-header__info">
              <h1 className="chatbot-header__title">
                <Sparkles className="inline mr-2" size={24} />
                Meowl - Trợ Lý Nghề Nghiệp AI
              </h1>
              <p className="chatbot-header__subtitle">
                Nhận tư vấn nghề nghiệp cá nhân hóa bằng trí tuệ nhân tạo
              </p>
            </div>
          </div>

          {/* Login Modal - Positioned below header, not overlaying */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            padding: '40px 20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '48px',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%'
            }}>
              <Lock size={64} style={{ color: '#fff', marginBottom: '24px' }} />
              <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '16px', fontWeight: 600 }}>
                Yêu cầu đăng nhập
              </h2>
              <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                marginBottom: '32px', 
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                Vui lòng đăng nhập để trò chuyện với Meowl và nhận tư vấn nghề nghiệp cá nhân hóa
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <LogIn size={20} />
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>

        {/* Meowl Guide */}
        <MeowlGuide currentPage="chatbot" />
      </div>
    );
  }

  // MAIN CHAT UI - Only rendered when authenticated
  return (
    <div className={`chatbot-page ${theme}`}>
      {/* Simplified cosmic dust particles - reduced for better performance */}
      <div className="cosmic-dust">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="dust-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Sidebar for Chat Sessions - Always Visible */}
      <div className="chatbot-sidebar">
        <div className="chatbot-sidebar__header">
          <h2 className="chatbot-sidebar__title">
            <MessageSquare size={20} />
            Chat Sessions
          </h2>
          <button 
            className="chatbot-sidebar__new-chat"
            onClick={handleNewChat}
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>
        
        <div className="chatbot-sidebar__sessions">
          {loadingSessions ? (
            <div className="chatbot-sidebar__loading">
              <div className="animate-spin" style={{ display: 'inline-block' }}>
                <Loader size={24} />
              </div>
              <p style={{ marginTop: '8px' }}>Đang tải...</p>
            </div>
          ) : !Array.isArray(sessions) ? (
            <div className="chatbot-sidebar__empty">
              <p>Không có dữ liệu phiên hợp lệ.</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="chatbot-sidebar__empty">
              <p>Chưa có cuộc trò chuyện nào.</p>
              <p>Bắt đầu chat với Meowl ngay!</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.sessionId}
                className={`chatbot-session-item ${sessionId === session.sessionId ? 'active' : ''}`}
              >
                {renamingSessionId === session.sessionId ? (
                  // Rename mode
                  <div className="chatbot-session-rename-container">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(session.sessionId);
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      autoFocus
                      className="chatbot-session-rename-input"
                    />
                    <button
                      onClick={() => handleSaveRename(session.sessionId)}
                      className="chatbot-session-rename-btn chatbot-session-rename-btn--save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelRename}
                      className="chatbot-session-rename-btn chatbot-session-rename-btn--cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div 
                      className="chatbot-session-item__content"
                      onClick={() => handleLoadSession(session.sessionId)}
                    >
                      <div className="chatbot-session-item__title">
                        {session.title}
                      </div>
                      <div className="chatbot-session-item__time">
                        {session.messageCount} tin nhắn · {new Date(session.lastMessageAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    
                    {/* Three-dot menu button */}
                    <div className="chatbot-session-item__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuSessionId(openMenuSessionId === session.sessionId ? null : session.sessionId);
                        }}
                        className="chatbot-session-menu-btn"
                        title="Tùy chọn"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown menu */}
                      {openMenuSessionId === session.sessionId && (
                        <div className="chatbot-session-menu-dropdown">
                          <button
                            onClick={(e) => {
                              console.log('🖱️ Rename button clicked for session:', session.sessionId);
                              e.stopPropagation();
                              handleRenameSession(session.sessionId);
                            }}
                            className="chatbot-session-menu-item"
                          >
                            <Edit2 size={16} />
                            Đổi tên
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.sessionId);
                              setOpenMenuSessionId(null);
                            }}
                            className="chatbot-session-menu-item chatbot-session-menu-item--delete"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header__avatar">
            <img src={aiAvatar} alt="Meowl AI" style={{ width: 56, height: 56, borderRadius: '50%' }} />
          </div>
          <div className="chatbot-header__info">
            <h1 className="chatbot-header__title">
              <Sparkles className="inline mr-2" size={24} />
              Meowl - Trợ Lý Nghề Nghiệp AI
            </h1>
            <p className="chatbot-header__subtitle">
              Nhận tư vấn nghề nghiệp cá nhân hóa bằng trí tuệ nhân tạo
            </p>
          </div>
        </div>

        {/* Quick Prompts (show only when no messages sent yet) */}
        {messages.length === 1 && (
          <div className="chatbot-prompts">
            <p className="chatbot-prompts__title">💡 Câu hỏi gợi ý bắt đầu nhanh:</p>
            <div className="chatbot-prompts__grid">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="chatbot-prompt-btn"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbot-message chatbot-message--${message.role}`}
            >
              <div className="chatbot-message__avatar">
                {message.role === 'user' ? (
                  <User size={20} />
                ) : (
                  <img src={aiAvatar} alt="AI" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                )}
              </div>
              <div className="chatbot-message__content">
                <div className="chatbot-message__text">
                  {renderMessageContent(message.content)}
                </div>
                <div className="chatbot-message__time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="chatbot-message chatbot-message--assistant">
              <div className="chatbot-message__content" style={{ marginLeft: 42 }}>
                <div className="chatbot-typing">
                  <Loader className="animate-spin" size={20} />
                  <span>Meowl đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chatbot-input" onSubmit={handleSendMessage}>
          <div className="chatbot-input__wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hãy hỏi về nghề nghiệp, ngành học, kỹ năng hoặc bất cứ điều gì liên quan..."
              className="chatbot-input__field"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chatbot-input__btn"
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="chatbot" />
    </div>
  );
};

export default AiChatbotPage;
