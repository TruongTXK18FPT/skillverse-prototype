import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import aiChatbotService from '../../services/aiChatbotService';
import { UIMessage } from '../../types/Chat';
import { useToast } from '../../hooks/useToast';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/AiChatbot.css';

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
      content: `👋 Hi there! I'm **Meowl**, your AI career counselor at **SkillVerse**! 🐾

I can help you with:
• 🎓 **Choosing a major** — Find the best fit for your interests
• 📈 **Career trends** — Discover what's hot in the job market
• 🚀 **Skill development** — Learn what skills you need
• 💼 **Career transitions** — Switch careers with confidence
• 💰 **Salary insights** — Know your worth
• 🎯 **Learning roadmaps** — Step-by-step career paths

💬 **Try asking:**
- "What are trending careers in tech?"
- "Should I major in Computer Science?"
- "How do I become a Data Scientist?"
- "What skills do I need for UX Design?"

✨ *What would you like to explore today?*`,
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
        message: userMessage.content,
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
        content: 'I apologize, but I encountered an error. Please try again. If the problem persists, try refreshing the page.',
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
    "What are trending careers in 2025?",
    "Should I major in Computer Science or Business?",
    "How do I become a Software Engineer?",
    "What skills are most valuable right now?",
    "Is a Data Science career worth it?",
    "How to transition to tech from another field?"
  ];

  return (
    <div className={`chatbot-page ${theme}`}>
      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header__avatar">
            <Bot size={32} />
          </div>
          <div className="chatbot-header__info">
            <h1 className="chatbot-header__title">
              <Sparkles className="inline mr-2" size={24} />
              Meowl - AI Career Counselor
            </h1>
            <p className="chatbot-header__subtitle">
              Get personalized career guidance powered by AI
            </p>
          </div>
        </div>

        {/* Quick Prompts (show only when no messages sent yet) */}
        {messages.length === 1 && (
          <div className="chatbot-prompts">
            <p className="chatbot-prompts__title">💡 Quick Start Questions:</p>
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
                  <Bot size={20} />
                )}
              </div>
              <div className="chatbot-message__content">
                <div className="chatbot-message__text">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
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
                  <span>Meowl is thinking...</span>
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
            placeholder="Ask me about careers, majors, skills, or anything career-related..."
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
