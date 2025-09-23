import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MeowlChat.css';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const systemPrompt = {
    en: `You are Meowl, a helpful AI assistant for SkillVerse - an educational platform focused on skill development and learning. 

Your role is to:
1. Help users with questions about courses, learning paths, and skill development
2. Provide guidance on using the SkillVerse platform features
3. Offer study tips and learning strategies
4. Answer questions about programming, technology, business skills, and professional development
5. Help with career guidance and educational planning

Please keep your responses:
- Friendly and encouraging
- Concise but informative (2-3 sentences maximum)
- Educational and supportive
- Platform-focused when relevant

You should NOT:
- Provide medical, legal, or financial advice
- Engage in inappropriate conversations
- Discuss topics unrelated to education and skill development
- Generate harmful or offensive content

Always maintain a helpful, educational tone while staying within your expertise of learning and skill development.`,
    
    vi: `Bạn là Meowl, trợ lý AI hữu ích của SkillVerse - nền tảng giáo dục tập trung vào phát triển kỹ năng và học tập.

Vai trò của bạn là:
1. Giúp người dùng với các câu hỏi về khóa học, lộ trình học tập và phát triển kỹ năng
2. Cung cấp hướng dẫn sử dụng các tính năng của nền tảng SkillVerse
3. Đưa ra lời khuyên về học tập và chiến lược học tập
4. Trả lời câu hỏi về lập trình, công nghệ, kỹ năng kinh doanh và phát triển chuyên môn
5. Hỗ trợ định hướng nghề nghiệp và lập kế hoạch giáo dục

Vui lòng giữ câu trả lời của bạn:
- Thân thiện và khích lệ
- Ngắn gọn nhưng đầy đủ thông tin (tối đa 2-3 câu)
- Mang tính giáo dục và hỗ trợ
- Tập trung vào nền tảng khi phù hợp

Bạn KHÔNG nên:
- Cung cấp lời khuyên y tế, pháp lý hoặc tài chính
- Tham gia vào các cuộc trò chuyện không phù hợp
- Thảo luận các chủ đề không liên quan đến giáo dục và phát triển kỹ năng
- Tạo ra nội dung có hại hoặc xúc phạm

Luôn duy trì giọng điệu hữu ích, mang tính giáo dục trong khi ở trong chuyên môn về học tập và phát triển kỹ năng.`
  };

  const welcomeMessage = {
    en: "Hi! I'm Meowl, your learning assistant. How can I help you with your SkillVerse journey today?",
    vi: "Xin chào! Tôi là Meowl, trợ lý học tập của bạn. Tôi có thể giúp gì cho hành trình SkillVerse của bạn hôm nay?"
  };

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
  }, [isOpen, language, messages.length]);

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

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_MEOWL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt[language] },
            ...messages.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage.content }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
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
                  <div className="message-avatar">
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
