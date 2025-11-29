import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader, MessageSquare, Plus, Trash2, Bot, Mic, Square } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import careerChatService from '../../services/careerChatService';
import { UIMessage, ChatSession, ChatMode, ExpertContext } from '../../types/CareerChat';
import { useToast } from '../../hooks/useToast';
import MessageRenderer from '../../components/MessageRenderer';
import { WavRecorder } from '../../shared/wavRecorder';
import { transcribeAudioViaBackend } from '../../shared/speechToText';
import '../../styles/CareerChatDark.css';
import '../../styles/VoiceSelector.css';
import aiAvatar from '../../assets/aiChatBot.png';
const ENABLE_TTS = false;

const CareerChatPage = () => {
  const { theme } = useTheme();
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
  const [selectedVoice, setSelectedVoice] = useState<string>('banmai');
  const [previewLoadingVoice, setPreviewLoadingVoice] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [ttsPreparing, setTtsPreparing] = useState<boolean>(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [recorder] = useState(() => new WavRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [previewText, setPreviewText] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

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

  const previewVoice = async (_voiceId: string) => { return; };

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

  const quickSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSendMessage(fakeEvent);
  };

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
        expertContext: response.expertContext
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
      <div className={`career-chat-page ${theme}`}>
        <div className="cosmic-dust">
          {[...Array(5)].map((_, i) => <div key={i} className="dust-particle" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`
          }} />)}
        </div>
        <div className="career-chat-sidebar">
          <div className="career-chat-sidebar__header">
            <h2 className="career-chat-sidebar__title"><MessageSquare size={20} />Chat Sessions</h2>
          </div>
          <div className="career-chat-sidebar__sessions">
            <p style={{ textAlign: 'center', color: 'rgba(229, 231, 235, 0.6)', padding: '20px' }}>
              Vui lòng đăng nhập
            </p>
          </div>
        </div>
        <div className="career-chat-container">
          <div className="career-chat-header">
            <div className="career-chat-header__avatar">
              <img src={aiAvatar} alt="Meowl" style={{ width: 56, height: 56, borderRadius: '50%' }} />
            </div>
            <div className="career-chat-header__info">
              <h1 className="career-chat-header__title"><Sparkles size={24} />Meowl - Trợ Lý Nghề Nghiệp AI</h1>
              <p className="career-chat-header__subtitle">Nhận tư vấn nghề nghiệp cá nhân hóa</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '48px',
              borderRadius: '24px', textAlign: 'center', maxWidth: '400px'
            }}>
              <Bot size={64} style={{ color: '#fff', marginBottom: '24px' }} />
              <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '16px' }}>Yêu cầu đăng nhập</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }}>
                Vui lòng đăng nhập để trò chuyện với Meowl
              </p>
              <button onClick={() => navigate('/login')} style={{
                background: '#10b981', color: '#fff', border: 'none', padding: '14px 32px',
                borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer'
              }}>Đăng nhập ngay</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`career-chat-page ${theme} ${chatMode === ChatMode.EXPERT_MODE ? 'expert-mode' : 'general-mode'}`}>
      <div className="cosmic-dust">
        {[...Array(8)].map((_, i) => <div key={i} className="dust-particle" style={{
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`
        }} />)}
      </div>

      <div className="career-chat-sidebar">
        <div className="career-chat-sidebar__header">
          <h2 className="career-chat-sidebar__title"><MessageSquare size={20} />Chat Sessions</h2>
          <button className="career-chat-sidebar__new-chat" onClick={handleNewChat}>
            <Plus size={18} />New Chat
          </button>
        </div>
        <div className="career-chat-sidebar__sessions">
          {loadingSessions ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Loader size={24} className="animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(229, 231, 235, 0.6)', padding: '20px' }}>
              Chưa có cuộc trò chuyện
            </p>
          ) : (
            sessions.map(s => (
              <div key={s.sessionId} className={`career-chat-session-item ${sessionId === s.sessionId ? 'active' : ''}`}>
                <div 
                  onClick={() => careerChatService.getHistory(s.sessionId).then(h => {
                    const msgs: UIMessage[] = [];
                    h.forEach((m, i) => {
                      msgs.push({ id: `${s.sessionId}-${i}-u`, role: 'user', content: m.userMessage, timestamp: new Date(m.createdAt) });
                      msgs.push({ id: `${s.sessionId}-${i}-a`, role: 'assistant', content: m.aiResponse, timestamp: new Date(m.createdAt) });
                    });
                    setMessages(msgs);
                    setSessionId(s.sessionId);
                  })}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <div className="career-chat-session-item__title">{s.title}</div>
                  <div className="career-chat-session-item__time">
                    {s.messageCount} tin nhắn · {new Date(s.lastMessageAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.sessionId); }}
                  className="career-chat-session-delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="career-chat-container">
        <div className="career-chat-header">
          <div className="career-chat-header__avatar">
            <img src={aiAvatar} alt="Meowl" style={{ width: 56, height: 56, borderRadius: '50%' }} />
          </div>
          <div className="career-chat-header__info">
            <h1 className="career-chat-header__title"><Sparkles size={24} />Meowl - Trợ Lý Nghề Nghiệp AI</h1>
            <p className="career-chat-header__subtitle">Nhận tư vấn nghề nghiệp cá nhân hóa</p>
          </div>
        </div>
        {/* Mode toggle moved to input area; mic shown only in voice mode */}

        {(isRecording || isPreviewing) && (
          <></>
        )}

        {ENABLE_TTS && (<></>)}

        <div className="career-chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`career-chat-message ${msg.role}`}>
              <div className="career-chat-message__avatar">
                {msg.role === 'assistant' ? (
                  <img src={aiAvatar} alt="AI" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className="career-chat-message__content">
                <div className="career-chat-message__bubble">
                  <MessageRenderer 
                    content={msg.content} 
                    isExpertMode={false}
                  />
                  {msg.role === 'assistant' && voiceMode && ENABLE_TTS && (
                    <div className="sv-tts-play-below">
                      {ttsPreparing && !speaking ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span className="sv-preview-loading" /> Đang chuẩn bị audio...
                        </span>
                      ) : (
                        <button
                          className="sv-tts-play-btn"
                          type="button"
                          onClick={() => speakText(msg.content)}
                          disabled={speaking}
                          title="Đọc to tin nhắn này"
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {speaking ? 'Đang phát...' : 'Đọc to'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="career-chat-message assistant">
              <div className="career-chat-message__avatar">
                <img src={aiAvatar} alt="AI" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              </div>
              <div className="career-chat-message__content">
                <div className="career-chat-message__bubble">
                  <div className="career-chat-loading"><Loader size={16} className="animate-spin" />Meowl đang suy nghĩ...</div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="career-chat-input-area">
          <form onSubmit={handleSendMessage} className="career-chat-input-wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="career-chat-input"
              disabled={isLoading}
            />
            <button type="submit" className="career-chat-send-btn" disabled={!inputMessage.trim() || isLoading}>
              <Send size={18} />Gửi
            </button>
            <button
              type="button"
              className="career-chat-send-btn"
              onClick={isRecording ? stopRecording : startRecording}
              aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
              aria-pressed={isRecording}
              style={{ marginLeft: 8 }}
            >
              {isRecording ? <Square size={16} /> : <Mic size={16} />} {isRecording ? 'Dừng ghi' : 'Ghi âm'}
            </button>
          </form>
          {(isRecording || isPreviewing) && previewText && (
            <div className="career-preview-text" aria-live="polite" style={{ marginTop: 8, opacity: 0.9 }}>
              {previewText}
            </div>
          )}
          <div className="sv-audio-control__status" aria-live="polite" style={{ marginTop: 6 }}>
            {isPreviewing ? 'Đang nhận diện...' : (isRecording ? 'Đang ghi âm...' : '')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerChatPage;
