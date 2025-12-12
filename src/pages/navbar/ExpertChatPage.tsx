import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader, Plus, Trash2, Zap, Code, ArrowLeft, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
// import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import careerChatService from '../../services/careerChatService';
import { UIMessage, ChatSession, ChatMode, ExpertContext } from '../../types/CareerChat';
import { useToast } from '../../hooks/useToast';
import MessageRenderer from '../../components/MessageRenderer';
import { ThinkingIndicator } from '../../components/chat/ThinkingIndicator';
import { StreamingMessage } from '../../components/chat/StreamingMessage';
const ENABLE_TTS = false;
import { WavRecorder } from '../../shared/wavRecorder';
import { transcribeAudioViaBackend } from '../../shared/speechToText';
import { Mic, Square } from 'lucide-react';
import ExpertModeSelector from '../../components/ExpertModeSelector';
import avaChat from '../../assets/ava-chat.png';
import '../../styles/ChatHUD.css';
import '../../styles/VoiceSelector.css';

/**
 * Expert Chat Page - Hologram Galaxy Universe Theme
 * Specialized AI expert consultation with futuristic design
 */
const ExpertChatPage = () => {
  // const { theme } = useTheme();
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
  const [speaking] = useState<boolean>(false);
  const [ttsPreparing] = useState<boolean>(false);
  const [voiceMode] = useState<boolean>(false);
  const [recorder] = useState(() => new WavRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [previewText, setPreviewText] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

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

  // STT toggle via audio mode button
  const startRecording = async () => {
    try {
      await recorder.start();
      setIsRecording(true);

      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const recog = new SR();
          recognitionRef.current = recog;
          recog.lang = 'vi-VN';
          recog.continuous = true;
          recog.interimResults = true;
          setPreviewText('');
          recog.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0]?.transcript || '';
              if (event.results[i].isFinal) final += transcript + ' ';
              else interim += transcript + ' ';
            }
            setPreviewText(final || interim);
          };
          recog.onerror = () => {};
          recog.onend = () => { setIsPreviewing(false); };
          recog.start();
          setIsPreviewing(true);
        } catch {
          setIsPreviewing(false);
        }
      } else {
        setIsPreviewing(false);
      }
    } catch (err) {
      console.error('Unable to start recording:', err);
    }
  };

  const stopRecording = async () => {
    try {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      } catch (err) { void 0; }
      setIsPreviewing(false);

      const result = await recorder.stop();
      setIsRecording(false);

      if (result.audioBlob) {
        try {
          const stt = await transcribeAudioViaBackend(result.audioBlob);
          const text = stt?.text?.trim() || '';
          const finalText = text || previewText.trim();
          if (finalText) {
            setInputMessage(finalText);
            // submit
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            await handleSendMessage(fakeEvent);
          }
        } catch (e) {
          const fallbackText = previewText.trim();
          if (fallbackText) {
            setInputMessage(fallbackText);
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            await handleSendMessage(fakeEvent);
          }
        }
      }
    } catch (err) {
      console.error('Unable to stop recording or transcribe:', err);
      setIsRecording(false);
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
      <div className="chat-hud-viewport">
        <div className="chat-hud-main-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', color: 'var(--chat-hud-accent)' }}>
            <Loader size={48} className="animate-spin" />
            <div style={{ fontSize: '1.2rem', letterSpacing: '2px' }}>ĐANG KHỞI TẠO HỆ THỐNG CHUYÊN GIA...</div>
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

  const speakText = async (_text: string) => { return; };

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

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.aiResponse,
        timestamp: new Date(response.timestamp),
        expertContext: response.expertContext,
        isStreaming: true
      } as UIMessage;
      setMessages(prev => [...prev, assistantMsg]);

      if (voiceMode && ENABLE_TTS) {
        speakText(assistantMsg.content);
      }
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
    <div className="chat-hud-viewport">
      {/* Sidebar */}
      <div className={`chat-hud-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="chat-hud-sidebar-header">
          HỆ THỐNG CHUYÊN GIA
        </div>
        <button className="chat-hud-new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} /> Tạo trò chuyện mới
        </button>
        <div className="chat-hud-session-list">
          {loadingSessions ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Loader size={24} className="animate-spin" style={{ color: 'var(--chat-hud-accent)' }} />
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(229, 231, 235, 0.6)', padding: '20px' }}>
              Chưa có phiên làm việc nào
            </p>
          ) : (
            sessions.map(s => (
              <div key={s.sessionId} className={`chat-hud-session-item ${sessionId === s.sessionId ? 'active' : ''}`}>
                <div onClick={() => handleLoadSession(s.sessionId)} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.sessionId); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '10px', borderTop: '1px solid var(--chat-hud-border)' }}>
           <button className="chat-hud-new-chat-btn" onClick={handleBackToLanding} style={{ width: 'calc(100% - 20px)', margin: '0 10px' }}>
            Thoát chế độ chuyên gia
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="chat-hud-main-area">
        {/* Header */}
        <div className="chat-hud-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="chat-hud-mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <button className="chat-hud-back-btn" onClick={() => navigate('/chatbot')}>
              <ArrowLeft size={18} /> Quay lại
            </button>
          </div>
          
          <div className="chat-hud-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--chat-hud-accent)' }} />
              {expertContext?.jobRole || 'Expert'}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'normal' }}>
              {expertContext?.domain}
            </span>
          </div>

          <div className="chat-hud-status">
            <div className="chat-hud-status-dot"></div>
            ONLINE
          </div>
        </div>

        {/* Message List */}
        <div className="chat-hud-message-list">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-hud-message-row ${msg.role}`}>
              <div className="chat-hud-avatar">
                {msg.role === 'assistant' ? (
                  expertContext?.mediaUrl ? (
                    <img src={expertContext.mediaUrl} alt="Expert" />
                  ) : (
                    <Code size={24} />
                  )
                ) : (
                  user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" style={{ width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155', color: '#fff' }}>
                      <User size={20} />
                    </div>
                  )
                )}
              </div>
              <div className="chat-hud-bubble">
                {msg.role === 'assistant' && msg.isStreaming ? (
                  <StreamingMessage 
                    content={msg.content} 
                    isExpertMode={true}
                    scrollToBottom={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                    onComplete={() => {
                      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isStreaming: false } : m));
                    }}
                  />
                ) : (
                  <MessageRenderer content={msg.content} isExpertMode={true} />
                )}
                {msg.role === 'assistant' && voiceMode && ENABLE_TTS && (
                  <div className="sv-tts-play-below" style={{ marginTop: '8px' }}>
                    {ttsPreparing && !speaking ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span className="sv-preview-loading" /> Đang chuẩn bị audio...
                      </span>
                    ) : (
                      <button
                        className="sv-tts-play-btn"
                        type="button"
                        onClick={() => speakText(msg.content)}
                        disabled={speaking}
                        title="Đọc to tin nhắn này"
                        style={{ background: 'none', border: 'none', color: 'var(--chat-hud-accent)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {speaking ? 'Đang phát...' : '🔊 Đọc to'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-hud-message-row assistant">
              <div className="chat-hud-avatar">
                <Loader size={24} className="animate-spin" />
              </div>
              <div className="chat-hud-bubble" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                <ThinkingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-hud-input-area">
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'flex-end' }}>
            <div className="chat-hud-input-wrapper">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi chuyên gia..."
                className="chat-hud-input"
                disabled={isLoading}
              />
              <button
                type="button"
                className={`chat-hud-mic-btn ${isRecording ? 'active' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
              >
                {isRecording ? <Square size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <button type="submit" className="chat-hud-send-btn" disabled={!inputMessage.trim() || isLoading}>
              <Send size={20} />
            </button>
          </form>
          {(isRecording || isPreviewing) && previewText && (
            <div style={{ position: 'absolute', bottom: '80px', left: '20px', right: '20px', background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '4px', color: '#fff', zIndex: 100 }}>
              {previewText}
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                {isPreviewing ? 'Đang nhận diện...' : (isRecording ? 'Đang ghi âm...' : '')}
              </div>
            </div>
          )}
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
