import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const response = await aiChatbotService.sendMessage({
        // ép AI trả lời bằng tiếng Việt bằng cách thêm hướng dẫn ngắn
        message: `Trả lời bằng tiếng Việt rõ ràng, ngắn gọn. Câu hỏi: ${userMessage.content}`,
        sessionId: sessionId
      });

      // Update session ID if this is first message
      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      const botMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.aiResponse,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      showError('Error', (error as Error).message);
      
      // Add error message to chat
      const errorMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau. Nếu vẫn không được, hãy tải lại trang.',
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
              <div className="chatbot-message__avatar">
                <Bot size={20} />
              </div>
              <div className="chatbot-message__content">
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
        </form>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="chatbot" />
    </div>
  );
};

export default AiChatbotPage;
