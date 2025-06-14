import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Lightbulb, BookOpen, Briefcase, Award, MessageSquare } from 'lucide-react';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Chào bạn! Tôi là AI Career Advisor của Skillverse. Tôi có thể giúp bạn định hướng nghề nghiệp, lựa chọn kỹ năng cần học và tìm kiếm cơ hội việc làm phù hợp. Bạn muốn tư vấn về vấn đề gì?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickSuggestions = [
    {
      icon: Lightbulb,
      title: 'Khám phá sở thích',
      message: 'Tôi muốn khám phá sở thích và tìm nghề nghiệp phù hợp'
    },
    {
      icon: BookOpen,
      title: 'Lộ trình học tập',
      message: 'Hãy đề xuất lộ trình học tập cho ngành tôi quan tâm'
    },
    {
      icon: Briefcase,
      title: 'Cơ hội việc làm',
      message: 'Cho tôi biết về cơ hội việc làm trong lĩnh vực này'
    },
    {
      icon: Award,
      title: 'Phát triển kỹ năng',
      message: 'Tôi cần phát triển những kỹ năng nào để thành công?'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(content);
      const botMessage = {
        id: messages.length + 2,
        type: 'bot' as const,
        content: botResponse,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('sở thích') || input.includes('nghề nghiệp phù hợp')) {
      return `Tuyệt vời! Để giúp bạn khám phá nghề nghiệp phù hợp, tôi sẽ hỏi một vài câu hỏi:

🎯 **Câu hỏi 1**: Bạn thích làm việc với:
- A) Máy tính và công nghệ
- B) Con người và giao tiếp
- C) Sáng tạo và nghệ thuật
- D) Số liệu và phân tích

Hãy chọn đáp án và tôi sẽ tiếp tục hướng dẫn bạn!`;
    }
    
    if (input.includes('lộ trình học tập') || input.includes('học gì')) {
      return `Để đề xuất lộ trình học tập phù hợp, tôi cần biết thêm về bạn:

📚 **Thông tin cần thiết**:
1. Bạn đang học/làm ngành gì?
2. Mục tiêu nghề nghiệp của bạn là gì?
3. Thời gian bạn có thể dành để học mỗi tuần?

**Một số ngành hot hiện tại**:
• **Công nghệ**: Web Development, Data Science, AI/ML
• **Thiết kế**: UI/UX Design, Graphic Design
• **Marketing**: Digital Marketing, Content Marketing
• **Kinh doanh**: E-commerce, Project Management

Hãy chia sẻ thêm để tôi tư vấn cụ thể hơn!`;
    }
    
    if (input.includes('việc làm') || input.includes('cơ hội')) {
      return `Thị trường việc làm hiện tại rất sôi động! Đây là những thông tin hữu ích:

💼 **Ngành có nhiều cơ hội**:
• **IT & Technology**: Lương cao, nhiều việc làm
• **Digital Marketing**: Phát triển mạnh với e-commerce  
• **Thiết kế UI/UX**: Nhu cầu tăng cao
• **Data Analysis**: Xu hướng tương lai

🎯 **Lời khuyên**:
1. Bắt đầu với micro-jobs để tích lũy kinh nghiệm
2. Xây dựng portfolio chuyên nghiệp
3. Network với các chuyên gia trong ngành
4. Học liên tục và cập nhật kỹ năng

Bạn quan tâm đến ngành nào? Tôi sẽ tư vấn cụ thể hơn!`;
    }
    
    if (input.includes('kỹ năng') || input.includes('skill')) {
      return `Kỹ năng là chìa khóa thành công! Đây là những kỹ năng quan trọng:

🚀 **Kỹ năng cứng (Hard Skills)**:
• **Lập trình**: JavaScript, Python, React
• **Thiết kế**: Figma, Adobe Creative Suite
• **Marketing**: Google Ads, SEO, Analytics
• **Phân tích**: Excel, SQL, Power BI

💡 **Kỹ năng mềm (Soft Skills)**:
• Giao tiếp và thuyết trình
• Tư duy phản biện
• Quản lý thời gian
• Làm việc nhóm

📈 **Cách phát triển**:
1. Tham gia khóa học micro trên Skillverse
2. Thực hành qua các dự án thực tế
3. Tìm mentor trong ngành
4. Tham gia cộng đồng chuyên môn

Bạn muốn phát triển kỹ năng nào trước?`;
    }

    // Default response
    return `Cảm ơn bạn đã chia sẻ! Tôi hiểu bạn đang quan tâm đến "${userInput}".

Để tư vấn chính xác hơn, bạn có thể:
• Sử dụng các gợi ý phía dưới
• Hỏi cụ thể về ngành nghề quan tâm
• Chia sẻ mục tiêu nghề nghiệp của bạn

Tôi luôn sẵn sàng hỗ trợ bạn! 😊`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
              <Bot className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Career Advisor</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trò chuyện với AI thông minh để nhận tư vấn nghề nghiệp cá nhân hóa, 
            khám phá kỹ năng cần thiết và lộ trình phát triển sự nghiệp
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <div className={`px-4 py-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex space-x-3 max-w-xs">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Gợi ý nhanh:</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(suggestion.message)}
                    className="flex items-center space-x-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <suggestion.icon className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{suggestion.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  disabled={isTyping}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Gửi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Khám phá sở thích</h3>
            <p className="text-sm text-gray-600">Tìm hiểu về bản thân và nghề nghiệp phù hợp với tính cách của bạn</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lộ trình học tập</h3>
            <p className="text-sm text-gray-600">Nhận lộ trình học tập cá nhân hóa cho mục tiêu nghề nghiệp của bạn</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Phát triển kỹ năng</h3>
            <p className="text-sm text-gray-600">Xác định kỹ năng cần thiết và cách phát triển để thành công</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;