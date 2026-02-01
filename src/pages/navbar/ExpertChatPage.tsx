import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Plus, Trash2, Zap, Code, ArrowLeft, Menu, X, ChevronDown, Bot, Lock } from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import meowlDefault from '../../assets/meowl-skin/meowl_default.png';
import userService from '../../services/userService';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import { useNavigate, useLocation } from 'react-router-dom';
// import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import careerChatService from '../../services/careerChatService';
import { UIMessage, ChatSession, ChatMode, ExpertContext } from '../../types/CareerChat';
import { useToast } from '../../hooks/useToast';
import MessageRenderer from '../../components/shared/MessageRenderer';
import { ThinkingIndicator } from '../../components/chat/ThinkingIndicator';
import { StreamingMessage } from '../../components/chat/StreamingMessage';
const ENABLE_TTS = false;
import { WavRecorder } from '../../shared/wavRecorder';
import { transcribeAudioViaBackend } from '../../shared/speechToText';
import { Mic, Square } from 'lucide-react';
import ExpertModeSelector from '../../components/shared/ExpertModeSelector';
import avaChat from '../../assets/chat/ava-chat.png';
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
  const [aiAgentMode, setAiAgentMode] = useState<'NORMAL' | 'DEEP_RESEARCH'>('NORMAL');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string | null>(user?.avatarUrl || null);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        try {
          // Load avatar
          userService.getMyProfile().then(profile => {
            if (profile.avatarMediaUrl) {
              setUserAvatar(profile.avatarMediaUrl);
            }
          }).catch(err => console.error('Failed to load user avatar', err));

          // Check subscription
          const sub = await premiumService.getCurrentSubscription();
          setSubscription(sub);
        } catch (error) {
          console.error('Failed to check subscription:', error);
        } finally {
          setCheckingAccess(false);
        }
      } else if (!loading) {
        setCheckingAccess(false);
      }
    };
    
    checkAccess();
  }, [user, loading]);
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
      showSuccess('ÄÃ£ táº£i', `ÄÃ£ táº£i lá»‹ch sá»­ phiÃªn ${selectedSessionId}`);
    } catch (error) {
      showError('Lá»—i', 'KhÃ´ng thá»ƒ táº£i lá»‹ch sá»­ cuá»™c trÃ² chuyá»‡n');
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
          content: `ðŸŽ¯ **HỆ THỐNG CHUYÊN GIA**\n\nâœ¨ Xin chÃ o! TÃ´i lÃ  chuyÃªn gia **${expertState.jobRole}** cá»§a SkillVerse.\n\n**LÄ©nh vá»±c**: ${expertState.domain}\n**NgÃ nh nghá»**: ${expertState.industry}\n**ChuyÃªn mÃ´n**: ${expertState.jobRole}\n\n---\n\nTÃ´i cÃ³ thá»ƒ tÆ° váº¥n chuyÃªn sÃ¢u vá»:\n- ðŸ“Š **Ká»¹ nÄƒng chuyÃªn mÃ´n** cáº§n thiáº¿t\n- ðŸš€ **Lá»™ trÃ¬nh phÃ¡t triá»ƒn** cá»¥ thá»ƒ\n- ðŸ’¼ **CÆ¡ há»™i nghá» nghiá»‡p** trong lÄ©nh vá»±c\n- ðŸŽ“ **TÃ i nguyÃªn há»c táº­p** cháº¥t lÆ°á»£ng cao\n- ðŸ’° **Má»©c lÆ°Æ¡ng & thá»‹ trÆ°á»ng** hiá»‡n táº¡i\n\nðŸ’¬ **HÃ£y há»i tÃ´i báº¥t cá»© Ä‘iá»u gÃ¬ vá» ${expertState.jobRole}!**`,
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
  if (isInitializing || checkingAccess) {
    return (
      <div className="chat-hud-viewport">
        <div className="chat-hud-main-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', color: 'var(--chat-hud-accent)' }}>
            <MeowlKuruLoader text="ÄANG KHá»žI Táº O Há»† THá»NG CHUYÃŠN GIA..." />
          </div>
        </div>
      </div>
    );
  }

  // Access Control Check
  const hasActiveSubscription = subscription && subscription.isActive;
  const isFreeTier = subscription?.plan?.planType === 'FREE_TIER';
  const isPremiumPlus = subscription?.plan?.planType === 'PREMIUM_PLUS';

  if (!hasActiveSubscription || isFreeTier) {
    return (
      <div className="chat-hud-viewport">
        <div className="chat-hud-main-area" style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--chat-hud-bg)' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)', padding: '48px',
            borderRadius: '24px', textAlign: 'center', maxWidth: '500px',
            border: '1px solid var(--chat-hud-accent)',
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.1)'
          }}>
            <Lock size={64} style={{ color: 'var(--chat-hud-accent)', marginBottom: '24px' }} />
            <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '16px', fontFamily: 'Space Grotesk' }}>
              ACCESS DENIED
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '32px', lineHeight: '1.6' }}>
              Cháº¿ Ä‘á»™ <strong>Expert Chat</strong> chá»‰ dÃ nh cho thÃ nh viÃªn Premium.<br/>
              Vui lÃ²ng nÃ¢ng cáº¥p tÃ i khoáº£n Ä‘á»ƒ truy cáº­p há»‡ thá»‘ng chuyÃªn gia AI.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/chatbot')} style={{
                background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', 
                padding: '12px 24px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer'
              }}>
                Quay láº¡i
              </button>
              <button onClick={() => navigate('/premium')} style={{
                background: 'linear-gradient(135deg, #06b6d4, #2563eb)', color: '#fff', border: 'none', 
                padding: '12px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
              }}>
                NÃ¢ng cáº¥p ngay
              </button>
            </div>
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
      content: `ðŸŽ¯ **HỆ THỐNG CHUYÊN GIA**\n\nâœ¨ Xin chÃ o! TÃ´i lÃ  chuyÃªn gia **${context.jobRole}** cá»§a SkillVerse.\n\n**LÄ©nh vá»±c**: ${context.domain}\n**NgÃ nh nghá»**: ${context.industry}\n**ChuyÃªn mÃ´n**: ${context.jobRole}\n\n---\n\nTÃ´i cÃ³ thá»ƒ tÆ° váº¥n chuyÃªn sÃ¢u vá»:\n- ðŸ“Š **Ká»¹ nÄƒng chuyÃªn mÃ´n** cáº§n thiáº¿t\n- ðŸš€ **Lá»™ trÃ¬nh phÃ¡t triá»ƒn** cá»¥ thá»ƒ\n- ðŸ’¼ **CÆ¡ há»™i nghá» nghiá»‡p** trong lÄ©nh vá»±c\n- ðŸŽ“ **TÃ i nguyÃªn há»c táº­p** cháº¥t lÆ°á»£ng cao\n- ðŸ’° **Má»©c lÆ°Æ¡ng & thá»‹ trÆ°á»ng** hiá»‡n táº¡i\n\nðŸ’¬ **HÃ£y há»i tÃ´i báº¥t cá»© Ä‘iá»u gÃ¬ vá» ${context.jobRole}!**`,
      timestamp: new Date(),
      expertContext: updatedContext
    }]);
    setShowExpertSelector(false);
    showSuccess('ThÃ nh cÃ´ng', `ÄÃ£ chuyá»ƒn sang chuyÃªn gia ${context.jobRole}`);
  };

  const handleDeleteSession = async (sessionIdToDelete: number) => {
    if (!window.confirm(`XÃ³a phiÃªn ${sessionIdToDelete}?`)) return;

    try {
      await careerChatService.deleteSession(sessionIdToDelete);
      await loadSessions();
      if (sessionId === sessionIdToDelete) handleNewChat();
      showSuccess('ÄÃ£ xÃ³a', `ÄÃ£ xÃ³a phiÃªn ${sessionIdToDelete}`);
    } catch (error) {
      showError('Lá»—i', 'KhÃ´ng thá»ƒ xÃ³a phiÃªn trÃ² chuyá»‡n');
    }
  };

  const handleBackToLanding = () => {
    navigate('/chatbot');
  };

  const speakText = async (_text: string) => { return; };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || inputMessage.trim();

    if (!textToSend || isLoading || !expertContext) return;

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
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
        aiAgentMode: aiAgentMode === 'DEEP_RESEARCH' ? 'deep-research-pro-preview-12-2025' : undefined,
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
        content: response.aiResponse || "",
        timestamp: new Date(response.timestamp),
        expertContext: response.expertContext,
        isStreaming: true
      } as UIMessage;
      setMessages(prev => [...prev, assistantMsg]);

      if (voiceMode && ENABLE_TTS) {
        speakText(assistantMsg.content);
      }
    } catch (error: any) {
      // Handle Premium Restriction (403) for Deep Research
      if (error?.response?.status === 403 && aiAgentMode === 'DEEP_RESEARCH') {
        showError(
          'Premium Required', 
          'Cháº¿ Ä‘á»™ Deep Research chá»‰ dÃ nh cho tÃ i khoáº£n Premium. Há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng chuyá»ƒn vá» Normal Agent.',
          6
        );
        
        // Retry with Normal Agent
        try {
          const retryResponse = await careerChatService.sendMessage({
            message: userMessage.content,
            sessionId: sessionId || undefined,
            chatMode: ChatMode.EXPERT_MODE,
            aiAgentMode: 'NORMAL',
            domain: expertContext.domain,
            industry: expertContext.industry,
            jobRole: expertContext.jobRole
          });

          if (!sessionId) {
            setSessionId(retryResponse.sessionId);
            loadSessions();
          }

          const assistantMsg = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: retryResponse.aiResponse,
            timestamp: new Date(retryResponse.timestamp),
            expertContext: retryResponse.expertContext,
            isStreaming: true
          } as UIMessage;
          setMessages(prev => [...prev, assistantMsg]);
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }

      showError('Lá»—i', error.message || 'KhÃ´ng thá»ƒ gá»­i tin nháº¯n');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'âš ï¸ Xin lá»—i, cÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i sau.',
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
          Há»† THá»NG CHUYÃŠN GIA
        </div>
        <button className="chat-hud-new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} /> Táº¡o trÃ² chuyá»‡n má»›i
        </button>
        <div className="chat-hud-session-list">
          {loadingSessions ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <MeowlKuruLoader size="tiny" text="" />
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(229, 231, 235, 0.6)', padding: '20px' }}>
              ChÆ°a cÃ³ phiÃªn lÃ m viá»‡c nÃ o
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
            ThoÃ¡t cháº¿ Ä‘á»™ chuyÃªn gia
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

          {/* Model Selector */}
          <div className="chat-model-selector">
            <button 
              className={`chat-model-btn ${aiAgentMode === 'DEEP_RESEARCH' ? 'premium' : ''}`}
              onClick={() => setShowModelDropdown(!showModelDropdown)}
            >
              {aiAgentMode === 'NORMAL' ? (
                <>
                  <Bot size={16} />
                  <span>Normal Agent</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Deep Research</span>
                </>
              )}
              <ChevronDown size={14} />
            </button>

            {showModelDropdown && (
              <div className="chat-model-dropdown">
                <div 
                  className={`chat-model-option ${aiAgentMode === 'NORMAL' ? 'active' : ''}`}
                  onClick={() => {
                    setAiAgentMode('NORMAL');
                    setShowModelDropdown(false);
                  }}
                >
                  <div className="model-icon">
                    <Bot size={18} />
                  </div>
                  <div className="model-info">
                    <span className="model-name">Normal Agent</span>
                    <span className="model-desc">Tá»‘c Ä‘á»™ tiÃªu chuáº©n, pháº£n há»“i nhanh</span>
                  </div>
                </div>

                <div 
                  className={`chat-model-option premium-opt ${aiAgentMode === 'DEEP_RESEARCH' ? 'active' : ''} ${!isPremiumPlus ? 'disabled' : ''}`}
                  onClick={() => {
                    if (isPremiumPlus) {
                      setAiAgentMode('DEEP_RESEARCH');
                      setShowModelDropdown(false);
                    } else {
                      showError('Premium Plus Required', 'Cháº¿ Ä‘á»™ Deep Research chá»‰ dÃ nh cho gÃ³i Premium Plus (Mentor Pro).');
                    }
                  }}
                  style={{ opacity: isPremiumPlus ? 1 : 0.6, cursor: isPremiumPlus ? 'pointer' : 'not-allowed' }}
                >
                  <div className="model-icon">
                    {isPremiumPlus ? <Sparkles size={18} /> : <Lock size={18} />}
                  </div>
                  <div className="model-info">
                    <span className="model-name">
                      Deep Research
                      <span className="premium-badge-mini">PLUS</span>
                    </span>
                    <span className="model-desc">
                      {isPremiumPlus ? 'PhÃ¢n tÃ­ch sÃ¢u, dá»¯ liá»‡u chi tiáº¿t' : 'YÃªu cáº§u gÃ³i Premium Plus'}
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                  <img 
                    src={userAvatar || meowlDefault} 
                    alt="User" 
                    style={{ width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover' }} 
                  />
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
                  <MessageRenderer 
                    content={msg.content} 
                    isExpertMode={true} 
                    onSuggestionClick={(text) => handleSendMessage(undefined, text)}
                  />
                )}
                {msg.role === 'assistant' && voiceMode && ENABLE_TTS && (
                  <div className="sv-tts-play-below" style={{ marginTop: '8px' }}>
                    {ttsPreparing && !speaking ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span className="sv-preview-loading" /> Äang chuáº©n bá»‹ audio...
                      </span>
                    ) : (
                      <button
                        className="sv-tts-play-btn"
                        type="button"
                        onClick={() => speakText(msg.content)}
                        disabled={speaking}
                        title="Äá»c to tin nháº¯n nÃ y"
                        style={{ background: 'none', border: 'none', color: 'var(--chat-hud-accent)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {speaking ? 'Äang phÃ¡t...' : 'ðŸ”Š Äá»c to'}
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
                <MeowlKuruLoader size="tiny" text="" />
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
                placeholder="Há»i chuyÃªn gia..."
                className="chat-hud-input"
                disabled={isLoading}
              />
              <button
                type="button"
                className={`chat-hud-mic-btn ${isRecording ? 'active' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? 'Dá»«ng ghi Ã¢m' : 'Báº¯t Ä‘áº§u ghi Ã¢m'}
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
                {isPreviewing ? 'Äang nháº­n diá»‡n...' : (isRecording ? 'Äang ghi Ã¢m...' : '')}
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

