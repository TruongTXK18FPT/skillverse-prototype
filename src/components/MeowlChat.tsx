import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import '../styles/MeowlChat.css';
import { guardUserInput, pickFallback } from "./MeowlGuard";
import axiosInstance from '../services/axiosInstance';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MeowlChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const MeowlChat: React.FC<MeowlChatProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const welcomeMessage = useMemo(() => ({
    en: "Hi! I'm Meowl, your learning assistant. How can I help you with your SkillVerse journey today?",
    vi: "Xin chào! Tôi là Meowl, trợ lý học tập của bạn. Tôi có thể giúp gì cho hành trình SkillVerse của bạn hôm nay?"
  }), []);

  const placeholderText = {
    en: "Ask me anything about learning and skills...",
    vi: "Hỏi tôi bất cứ điều gì về học tập và kỹ năng..."
  };

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage[language],
        timestamp: new Date()
      };
      setMessages([welcome]);
    }
  }, [isOpen, language, messages.length, welcomeMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // 🛡️ Guard check before sending
    const guard = guardUserInput(userMessage.content);
    if (!guard.allow) {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: pickFallback(guard.reason, language === 'vi' ? 'vi' : 'en'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, fallback]);
      setInputValue('');
      return;
    }

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend Meowl Chat API using axiosInstance
      const response = await axiosInstance.post('/v1/meowl/chat', {
        message: userMessage.content,
        language: language === 'vi' ? 'vi' : 'en',
        userId: user?.id || null,
        includeReminders: true,
        chatHistory: messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const data = response.data;
      
      // Use the cute response from backend
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.originalMessage || '...',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Log reminders and notifications if available (for future use)
      if (data.reminders && data.reminders.length > 0) {
        console.log('Reminders:', data.reminders);
      }
      if (data.notifications && data.notifications.length > 0) {
        console.log('Notifications:', data.notifications);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'en'
          ? 'Sorry, I\'m having trouble connecting right now. Please try again later.'
          : 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="meowl-dialog-overlay chat-mode" onClick={(e) => e.stopPropagation()}>
      <div className="meowl-chat-container" onClick={(e) => e.stopPropagation()}>
        {/* Chat Header */}
        <div className="dialog-header">
          <div className="character-name">
            {language === 'en' ? 'Meowl is here!' : 'Meowl đây!'}
          </div>
          <button className="meowlchat-close-btn" onClick={onClose}>
            <div className="close-btn-inner">
              <X size={18} />
            </div>
          </button>
        </div>

        {/* Messages Container */}
        <div className="chat-messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <div className="message-content">
                {message.role === 'assistant' && (
                  <div className="meowl-chat-message-avatar">
                    <img src="/images/meowl_bg_clear.png" alt="Meowl" />
                  </div>
                )}
                <div className="message-bubble">
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="message-content">
                <div className="message-avatar">
                  <img src="/images/meowl_bg_clear.png" alt="Meowl" />
                </div>
                <div className="message-bubble loading">
                  <Loader2 size={16} className="animate-spin" />
                  <span>{language === 'en' ? 'Meowl is thinking...' : 'Meowl đang suy nghĩ...'}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholderText[language]}
              className="chat-input"
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeowlChat;
