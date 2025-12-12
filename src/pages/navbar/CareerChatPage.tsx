import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader, Plus, Trash2, Mic, Square, ArrowLeft, Menu, X, Bot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import careerChatService from '../../services/careerChatService';
import { UIMessage, ChatSession, ChatMode, ExpertContext } from '../../types/CareerChat';
import { useToast } from '../../hooks/useToast';
import MessageRenderer from '../../components/MessageRenderer';
import { ThinkingIndicator } from '../../components/chat/ThinkingIndicator';
import { StreamingMessage } from '../../components/chat/StreamingMessage';
import { WavRecorder } from '../../shared/wavRecorder';
import { transcribeAudioViaBackend } from '../../shared/speechToText';
import '../../styles/ChatHUD.css';
import '../../styles/VoiceSelector.css';
import aiAvatar from '../../assets/aiChatBot.png';
const ENABLE_TTS = false;

const CareerChatPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToast();

  // Get expert mode state from landing page
  const expertState = location.state as { domain?: string; industry?: string; jobRole?: string; mediaUrl?: string } | null;

  const [messages, setMessages] = useState<UIMessage[]>([{
    id: '1', role: 'assistant',
    content: `### 👋 Xin chào! Mình là Meowl 🐾

**Cố vấn nghề nghiệp AI** của SkillVerse, luôn sẵn sàng đồng hành cùng bạn!

---

### 💡 Mình có thể giúp bạn:

**🎓 Định hướng nghề nghiệp**
- Tìm ngành học phù hợp với đam mê
- Phân tích điểm mạnh, điểm yếu
- Gợi ý lộ trình phát triển

**📊 Thông tin thị trường**
- Xu hướng nghề nghiệp 2024-2025
- Mức lương theo vị trí
- Cơ hội việc làm

**🚀 Phát triển kỹ năng**
- Kỹ năng cần thiết cho từng ngành
- Khóa học & chứng chỉ đề xuất
- Roadmap học tập cá nhân hóa

**💼 Chuyển đổi sự nghiệp**
- Tư vấn chuyển ngành
- Chuẩn bị CV & phỏng vấn
- Chiến lược tìm việc

---

✨ **Hãy chia sẻ với mình về mục tiêu nghề nghiệp của bạn nhé!**`,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.GENERAL_CAREER_ADVISOR);
  const [expertContext, setExpertContext] = useState<ExpertContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice related state (kept for future use or if re-enabled)
  const [speaking] = useState<boolean>(false);
  const [ttsPreparing] = useState<boolean>(false);
  const [voiceMode] = useState<boolean>(false); // Default false for now

  const [recorder] = useState(() => new WavRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [previewText, setPreviewText] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated) loadSessions();
  }, [isAuthenticated]);

  // Set expert mode if coming from landing page
  useEffect(() => {
    if (expertState && expertState.domain && expertState.industry && expertState.jobRole) {
      setChatMode(ChatMode.EXPERT_MODE);
      setExpertContext({
        domain: expertState.domain,
        industry: expertState.industry,
        jobRole: expertState.jobRole,
        expertName: `${expertState.jobRole} Expert`,
        mediaUrl: expertState.mediaUrl
      });
    }
  }, [expertState]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const userSessions = await careerChatService.getSessions(ChatMode.GENERAL_CAREER_ADVISOR);
      setSessions(Array.isArray(userSessions) ? userSessions : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setChatMode(ChatMode.GENERAL_CAREER_ADVISOR);
    setExpertContext(null);
    setMessages([{
      id: '1', role: 'assistant',
      content: `### 👋 Xin chào! Mình là Meowl 🐾

**Cố vấn nghề nghiệp AI** của SkillVerse, luôn sẵn sàng đồng hành cùng bạn!

---

### � Mình có thể giúp bạn:

**🎓 Định hướng nghề nghiệp**
- Tìm ngành học phù hợp với đam mê
- Phân tích điểm mạnh, điểm yếu
- Gợi ý lộ trình phát triển

**📊 Thông tin thị trường**
- Xu hướng nghề nghiệp 2024-2025
- Mức lương theo vị trí
- Cơ hội việc làm

**🚀 Phát triển kỹ năng**
- Kỹ năng cần thiết cho từng ngành
- Khóa học & chứng chỉ đề xuất
- Roadmap học tập cá nhân hóa

**💼 Chuyển đổi sự nghiệp**
- Tư vấn chuyển ngành
- Chuẩn bị CV & phỏng vấn
- Chiến lược tìm việc

---

✨ **Hãy chia sẻ với mình về mục tiêu nghề nghiệp của bạn nhé!**`,
      timestamp: new Date()
    }]);
    showSuccess('Thành công', 'Đã tạo cuộc trò chuyện mới!');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
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

  // STT: chỉ mở khi bấm nút chế độ âm thanh
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
            await handleSendMessage(new Event('submit') as any);
          }
        } catch (e) {
          const fallbackText = previewText.trim();
          if (fallbackText) {
            setInputMessage(fallbackText);
            await handleSendMessage(new Event('submit') as any);
          }
        }
      }
    } catch (err) {
      console.error('Unable to stop recording or transcribe:', err);
      setIsRecording(false);
    }
  };

  const speakText = async (_text: string) => { return; };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !inputMessage.trim() || isLoading) return;

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
        chatMode,
        domain: expertContext?.domain,
        industry: expertContext?.industry,
        jobRole: expertContext?.jobRole
      });

      if (!sessionId) {
        setSessionId(response.sessionId);
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-hud-viewport">
        <div className="chat-hud-main-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)', padding: '48px',
            borderRadius: '24px', textAlign: 'center', maxWidth: '400px',
            border: '1px solid var(--chat-hud-accent)'
          }}>
            <Bot size={64} style={{ color: 'var(--chat-hud-accent)', marginBottom: '24px' }} />
            <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '16px' }}>Yêu cầu đăng nhập</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }}>
              Vui lòng đăng nhập để trò chuyện với Meowl
            </p>
            <button onClick={() => navigate('/login')} style={{
              background: 'var(--chat-hud-accent)', color: '#000', border: 'none', padding: '14px 32px',
              borderRadius: '4px', fontSize: '16px', fontWeight: 600, cursor: 'pointer'
            }}>Đăng nhập ngay</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-hud-viewport">
      {/* Sidebar */}
      <div className={`chat-hud-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="chat-hud-sidebar-header">
          Lịch sử Chat
        </div>
        <button className="chat-hud-new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} /> Cuộc trò chuyện mới
        </button>
        <div className="chat-hud-session-list">
          {loadingSessions ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Loader size={24} className="animate-spin" style={{ color: 'var(--chat-hud-accent)' }} />
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(229, 231, 235, 0.6)', padding: '20px' }}>
              Chưa có cuộc trò chuyện
            </p>
          ) : (
            sessions.map(s => (
              <div key={s.sessionId} className={`chat-hud-session-item ${sessionId === s.sessionId ? 'active' : ''}`}>
                <div 
                  onClick={() => {
                    careerChatService.getHistory(s.sessionId).then(h => {
                      const msgs: UIMessage[] = [];
                      h.forEach((m, i) => {
                        msgs.push({ id: `${s.sessionId}-${i}-u`, role: 'user', content: m.userMessage, timestamp: new Date(m.createdAt) });
                        msgs.push({ id: `${s.sessionId}-${i}-a`, role: 'assistant', content: m.aiResponse, timestamp: new Date(m.createdAt) });
                      });
                      setMessages(msgs);
                      setSessionId(s.sessionId);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    });
                  }}
                  style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
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
          
          <div className="chat-hud-title">
            <Sparkles size={18} style={{ marginRight: '8px', color: 'var(--chat-hud-accent)' }} />
            Meowl Assistant
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
                  <img src={aiAvatar} alt="AI" />
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
                    isExpertMode={false}
                    scrollToBottom={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                    onComplete={() => {
                      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isStreaming: false } : m));
                    }}
                  />
                ) : (
                  <MessageRenderer 
                    content={msg.content} 
                    isExpertMode={false}
                  />
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
                <img src={aiAvatar} alt="AI" />
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
                placeholder="Nhập câu hỏi của bạn..."
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
        </div>
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
  );
};

export default CareerChatPage;
