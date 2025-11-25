import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader, MessageSquare, Plus, Trash2, Zap, Code, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import careerChatService from '../../services/careerChatService';
import { UIMessage, ChatSession, ChatMode, ExpertContext } from '../../types/CareerChat';
import { useToast } from '../../hooks/useToast';
import MessageRenderer from '../../components/MessageRenderer';
import ExpertModeSelector from '../../components/ExpertModeSelector';
import avaChat from '../../assets/ava-chat.png';
import '../../styles/ExpertChatTech.css';

/**
 * Expert Chat Page - Hologram Galaxy Universe Theme
 * Specialized AI expert consultation with futuristic design
 */
const ExpertChatPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToast();

  const expertState = location.state as { domain?: string; industry?: string; jobRole?: string; mediaUrl?: string } | null;

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [expertContext, setExpertContext] = useState<ExpertContext | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExpertSelector, setShowExpertSelector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const userSessions = await careerChatService.getSessions(ChatMode.EXPERT_MODE);
      setSessions(Array.isArray(userSessions) ? userSessions : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLoadSession = async (selectedSessionId: number) => {
    try {
      setIsLoading(true);
      const history = await careerChatService.getHistory(selectedSessionId);
      
      const uiMessages: UIMessage[] = [];
      let extractedExpertContext: ExpertContext | null = null;
      
      history.forEach((msg, index) => {
        uiMessages.push({
          id: `${selectedSessionId}-${index}-user`,
          role: 'user',
          content: msg.userMessage,
          timestamp: new Date(msg.createdAt)
        });
        uiMessages.push({
          id: `${selectedSessionId}-${index}-ai`,
          role: 'assistant',
          content: msg.aiResponse,
          timestamp: new Date(msg.createdAt),
          expertContext: expertContext || undefined
        });
      });

      // Try to extract expert context from the session
      const session = sessions.find(s => s.sessionId === selectedSessionId);
      if (session && session.title.startsWith('Expert ')) {
        const jobRole = session.title.replace('Expert ', '');
        // For now, we'll set a basic context. In a real implementation, 
        // you might want to store the full context in the session or backend
        extractedExpertContext = {
          domain: 'Technology', // Default, should be stored elsewhere
          industry: 'Software', // Default, should be stored elsewhere
          jobRole: jobRole,
          expertName: `${jobRole} Expert`,
          mediaUrl: avaChat
        };
        setExpertContext(extractedExpertContext);
      }

      setMessages(uiMessages);
      setSessionId(selectedSessionId);
      showSuccess('Đã tải', `Đã tải lịch sử phiên ${selectedSessionId}`);
    } catch (error) {
      showError('Lỗi', 'Không thể tải lịch sử cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      // Wait for auth to finish loading
      if (loading) {
        return;
      }
      
      // Wait for state to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      // Check if we have expert state from navigation
      if (expertState && expertState.domain && expertState.industry && expertState.jobRole) {
        // Set expert context from navigation state
        setExpertContext({
          domain: expertState.domain,
          industry: expertState.industry,
          jobRole: expertState.jobRole,
          expertName: `${expertState.jobRole} Expert`,
          mediaUrl: expertState.mediaUrl || avaChat
        });

        // Set welcome message
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `🎯 **EXPERT SYSTEM INITIALIZED**\n\n✨ Xin chào! Tôi là chuyên gia **${expertState.jobRole}** của SkillVerse.\n\n**Lĩnh vực**: ${expertState.domain}\n**Ngành nghề**: ${expertState.industry}\n**Chuyên môn**: ${expertState.jobRole}\n\n---\n\nTôi có thể tư vấn chuyên sâu về:\n- 📊 **Kỹ năng chuyên môn** cần thiết\n- 🚀 **Lộ trình phát triển** cụ thể\n- 💼 **Cơ hội nghề nghiệp** trong lĩnh vực\n- 🎓 **Tài nguyên học tập** chất lượng cao\n- 💰 **Mức lương & thị trường** hiện tại\n\n💬 **Hãy hỏi tôi bất cứ điều gì về ${expertState.jobRole}!**`,
          timestamp: new Date(),
          expertContext: {
            domain: expertState.domain,
            industry: expertState.industry,
            jobRole: expertState.jobRole,
            expertName: `${expertState.jobRole} Expert`,
            mediaUrl: expertState.mediaUrl || avaChat
          }
        }]);
      } else {
        // Handle reload case - no expert state available
        // Try to load the most recent expert session or show selector
        try {
          const userSessions = await careerChatService.getSessions(ChatMode.EXPERT_MODE);
          if (userSessions.length > 0) {
            // Load the most recent session
            const mostRecentSession = userSessions[0];
            handleLoadSession(mostRecentSession.sessionId);
          } else {
            // No sessions exist, show expert selector
            setShowExpertSelector(true);
          }
        } catch (error) {
          console.error('Error loading sessions:', error);
          setShowExpertSelector(true);
        }
      }
      
      setIsInitializing(false);
    };
    
    initializePage();
  }, [loading, isAuthenticated, expertState, navigate, showError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated) loadSessions();
  }, [isAuthenticated]);

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="expert-chat-page">
        <div className="expert-holo-bg">
          <div className="holo-scanlines"></div>
          <div className="holo-grid"></div>
        </div>
        <div className="expert-loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <Zap size={24} className="pulse" />
            <span>ĐANG KHỞI TẠO HỆ THỐNG CHUYÊN GIA...</span>
          </div>
          <div className="loading-bar">
            <div className="loading-bar-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleNewChat = () => {
    setShowExpertSelector(true);
  };

  const handleSelectNewExpert = (context: ExpertContext) => {
    // Ensure the context has the meowl avatar as default
    const updatedContext = {
      ...context,
      mediaUrl: context.mediaUrl || avaChat
    };
    
    setExpertContext(updatedContext);
    setSessionId(null);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `🎯 **EXPERT SYSTEM INITIALIZED**\n\n✨ Xin chào! Tôi là chuyên gia **${context.jobRole}** của SkillVerse.\n\n**Lĩnh vực**: ${context.domain}\n**Ngành nghề**: ${context.industry}\n**Chuyên môn**: ${context.jobRole}\n\n---\n\nTôi có thể tư vấn chuyên sâu về:\n- 📊 **Kỹ năng chuyên môn** cần thiết\n- 🚀 **Lộ trình phát triển** cụ thể\n- 💼 **Cơ hội nghề nghiệp** trong lĩnh vực\n- 🎓 **Tài nguyên học tập** chất lượng cao\n- 💰 **Mức lương & thị trường** hiện tại\n\n💬 **Hãy hỏi tôi bất cứ điều gì về ${context.jobRole}!**`,
      timestamp: new Date(),
      expertContext: updatedContext
    }]);
    setShowExpertSelector(false);
    showSuccess('Thành công', `Đã chuyển sang chuyên gia ${context.jobRole}`);
  };

  const handleDeleteSession = async (sessionIdToDelete: number) => {
    if (!window.confirm(`Xóa phiên ${sessionIdToDelete}?`)) return;

    try {
      await careerChatService.deleteSession(sessionIdToDelete);
      await loadSessions();
      if (sessionId === sessionIdToDelete) handleNewChat();
      showSuccess('Đã xóa', `Đã xóa phiên ${sessionIdToDelete}`);
    } catch (error) {
      showError('Lỗi', 'Không thể xóa phiên trò chuyện');
    }
  };

  const handleBackToLanding = () => {
    navigate('/chatbot');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !expertContext) return;

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
      const response = await careerChatService.sendMessage({
        message: userMessage.content,
        sessionId: sessionId || undefined,
        chatMode: ChatMode.EXPERT_MODE,
        domain: expertContext.domain,
        industry: expertContext.industry,
        jobRole: expertContext.jobRole
      });

      if (!sessionId) {
        setSessionId(response.sessionId);
        // Rename the session to the job role for new sessions
        try {
          await careerChatService.renameSession(response.sessionId, `Expert ${expertContext.jobRole}`);
        } catch (renameError) {
          console.error('Failed to rename session:', renameError);
        }
        loadSessions();
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.aiResponse,
        timestamp: new Date(response.timestamp),
        expertContext: response.expertContext
      }]);
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể gửi tin nhắn');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`expert-chat-page ${theme}`}>
      {/* Hologram background effects */}
      <div className="expert-holo-bg">
        <div className="holo-scanlines"></div>
        <div className="holo-grid"></div>
        <div className="holo-particles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="holo-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className={`expert-chat-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="expert-sidebar-corners">
          <div className="corner tl"></div>
          <div className="corner tr"></div>
          <div className="corner bl"></div>
          <div className="corner br"></div>
        </div>
        
        <div className="expert-chat-sidebar__header">
          <div className="expert-status">
            <Zap size={16} />
            <span>HỆ THỐNG CHUYÊN GIA</span>
          </div>
          <h2 className="expert-chat-sidebar__title">
            <MessageSquare size={20} />
            Phiên làm việc
          </h2>
          <button className="expert-chat-sidebar__new-chat" onClick={handleNewChat}>
            <Plus size={18} />
            Tạo trò chuyện mới
          </button>
          <button className="expert-chat-sidebar__exit" onClick={handleBackToLanding}>
            Thoát chế độ chuyên gia
          </button>
        </div>

        <div className="expert-chat-sidebar__sessions">
          {loadingSessions ? (
            <div className="expert-loading">
              <Loader size={24} className="spin" />
              <p>Đang tải...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="expert-empty">
              <p>Chưa có phiên làm việc nào</p>
            </div>
          ) : (
            sessions.map(s => (
              <div key={s.sessionId} className={`expert-session-item ${sessionId === s.sessionId ? 'active' : ''}`}>
                <div onClick={() => handleLoadSession(s.sessionId)} style={{ flex: 1, cursor: 'pointer' }}>
                  <div className="expert-session-title">{s.title}</div>
                  <div className="expert-session-meta">
                    {s.messageCount} tin nhắn · {new Date(s.lastMessageAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.sessionId); }}
                  className="expert-session-delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat */}
      <div className={`expert-chat-container ${!isSidebarOpen ? 'expanded' : ''}`}>
        {/* Header */}
        <div className="expert-chat-header">
          <div className="expert-header-line"></div>
          
          <button 
            className="expert-sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Đóng Sidebar" : "Mở Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>

          <div className="expert-chat-header__avatar">
            {expertContext?.mediaUrl ? (
              <img src={expertContext.mediaUrl} alt="Expert" />
            ) : (
              <Code size={32} />
            )}
            <div className="avatar-corners">
              <div className="corner tl"></div>
              <div className="corner tr"></div>
              <div className="corner bl"></div>
              <div className="corner br"></div>
            </div>
          </div>

          <div className="expert-chat-header__info">
            <div className="expert-badge-main">
              <Sparkles size={14} />
              <span>{expertContext?.expertName || 'Expert'}</span>
            </div>
            <h1 className="expert-chat-header__title">{expertContext?.jobRole || 'Expert'}</h1>
            <p className="expert-chat-header__subtitle">
              {expertContext?.domain} → {expertContext?.industry}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="expert-chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`expert-chat-message ${msg.role}`}>
              <div className="expert-message-avatar">
                {msg.role === 'assistant' ? (
                  expertContext?.mediaUrl ? (
                    <img src={expertContext.mediaUrl} alt="Expert" />
                  ) : (
                    <Code size={24} />
                  )
                ) : (
                  user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={24} />
                  )
                )}
                {msg.role === 'assistant' && (
                  <div className="avatar-glow"></div>
                )}
              </div>

              <div className="expert-message-content">
                <div className="expert-message-bubble">
                  <div className="bubble-corners">
                    <div className="corner tl"></div>
                    <div className="corner tr"></div>
                    <div className="corner bl"></div>
                    <div className="corner br"></div>
                  </div>
                  <MessageRenderer content={msg.content} isExpertMode={true} />
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="expert-chat-message assistant">
              <div className="expert-message-avatar">
                <Loader size={24} className="spin" />
                <div className="avatar-glow"></div>
              </div>
              <div className="expert-message-content">
                <div className="expert-message-bubble">
                  <div className="expert-loading-text">
                    <Zap size={16} className="pulse" />
                    Chuyên gia đang phân tích...
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="expert-chat-input-area">
          <div className="input-line"></div>
          <form onSubmit={handleSendMessage} className="expert-chat-input-wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi chuyên gia..."
              className="expert-chat-input"
              disabled={isLoading}
            />
            <button type="submit" className="expert-chat-send-btn" disabled={!inputMessage.trim() || isLoading}>
              <Send size={18} />
              <span>GỬI</span>
            </button>
          </form>
        </div>
      </div>

      {/* Expert Mode Selector Modal */}
      <ExpertModeSelector
        isOpen={showExpertSelector}
        onClose={() => setShowExpertSelector(false)}
        onSelect={(domain, industry, jobRole, mediaUrl) => {
          const context: ExpertContext = {
            domain,
            industry,
            jobRole,
            expertName: `${jobRole} Expert`,
            mediaUrl
          };
          handleSelectNewExpert(context);
        }}
      />
    </div>
  );
};

export default ExpertChatPage;
