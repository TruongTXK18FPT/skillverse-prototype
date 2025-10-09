import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader, MessageSquare, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import aiChatbotService from '../../services/aiChatbotService';
import { UIMessage } from '../../types/Chat';
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
  const [sessions, setSessions] = useState<number[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError, showSuccess } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Use requestAnimationFrame to avoid jump
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [messages]);

  // Load user sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
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
      showError('Lỗi', 'Không thể tải lịch sử cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  };

  // Format message content for cleaner chat display (headings, bullets, code, tables, links)
  const renderMessageContent = (content: string) => {
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
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Frontend quick validations to avoid wasting tokens
      const lower = userMessage.content.toLowerCase();
      if (/ielts\s*(?:score|band)?\s*([0-9]+(?:\.[0-9])?)/i.test(lower)) {
        const m = /ielts\s*(?:score|band)?\s*([0-9]+(?:\.[0-9])?)/i.exec(lower);
        const score = m ? parseFloat(m[1]) : 0;
        if (score > 9.0) {
          throw new Error('Điểm IELTS tối đa là 9.0. Vui lòng nhập mục tiêu hợp lệ.');
        }
      }
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
      showError('Lỗi', (error as Error).message);
      
      // Add error message to chat
      const errorMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng nhập mục tiêu hợp lệ (ví dụ: "IELTS 7.0 trong 6 tháng", "Học React căn bản").',
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

  const quickPrompts = [
    "Xu hướng nghề nghiệp 2025 là gì?",
    "Nên chọn Khoa học Máy tính hay Kinh doanh?",
    "Lộ trình trở thành Lập trình viên phần mềm?",
    "Những kỹ năng đang có giá trị cao hiện nay?",
    "Theo đuổi Data Science có đáng không?",
    "Chuyển ngành sang công nghệ như thế nào?"
  ];

  return (
    <div className={`chatbot-page ${theme}`}>
      {/* Shooting stars effect */}
      <div className="shooting-stars">
        <div className="shooting-star" style={{ top: '10%', left: '80%', animationDelay: '0s' }}></div>
        <div className="shooting-star" style={{ top: '30%', left: '20%', animationDelay: '3s' }}></div>
        <div className="shooting-star" style={{ top: '50%', left: '70%', animationDelay: '6s' }}></div>
        <div className="shooting-star" style={{ top: '70%', left: '40%', animationDelay: '9s' }}></div>
        <div className="shooting-star" style={{ top: '20%', left: '50%', animationDelay: '12s' }}></div>
      </div>

      {/* Cosmic dust particles */}
      <div className="cosmic-dust">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="dust-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
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
                key={session}
                className={`chatbot-session-item ${sessionId === session ? 'active' : ''}`}
                onClick={() => handleLoadSession(session)}
              >
                <div className="chatbot-session-item__title">
                  Session #{session}
                </div>
                <div className="chatbot-session-item__time">
                  Click to load history
                </div>
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
