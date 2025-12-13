import { useState, useEffect } from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import '../../styles/MessageRenderer.css'; // Reuse styles

const PHRASES = [
  "Đang phân tích ngữ cảnh và ý định của bạn...",
  "Đang truy xuất dữ liệu thị trường lao động & xu hướng 2025...",
  "Đang kích hoạt mạng nơ-ron chuyên gia...",
  "Đang tra cứu yêu cầu kỹ năng và lộ trình thăng tiến...",
  "Đang so sánh mức lương và cơ hội việc làm thực tế...",
  "Đang tổng hợp các tài nguyên học tập uy tín nhất...",
  "Đang xây dựng chiến lược phát triển cá nhân hóa...",
  "Đang kiểm chứng thông tin và đánh giá rủi ro...",
  "Đang soạn thảo câu trả lời chi tiết...",
];

export const ThinkingIndicator = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 1200); // Slightly faster updates
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="msg-thinking-block" style={{ margin: 0, width: '100%', maxWidth: '100%' }}>
      <div className="msg-thinking-header">
        <Brain size={16} className="thinking-icon" />
        <span>Thinking Process</span>
        <ChevronDown size={16} />
      </div>
      <div className="msg-thinking-content">
        <p style={{ display: 'flex', alignItems: 'center' }}>
          {PHRASES[phraseIndex]}
          <span className="thinking-cursor">...</span>
        </p>
      </div>
    </div>
  );
};
