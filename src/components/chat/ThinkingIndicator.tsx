import { useState, useEffect } from 'react';
import { Sparkles, Cpu, Zap, Search, Brain } from 'lucide-react';

const PHRASES = [
  "Đang khởi tạo liên kết thần kinh...",      // Initializing neural link
  "Đang phân tích mẫu yêu cầu...",            // Analyzing request patterns
  "Đang 'nấu' dữ liệu...",                    // Cooking (Giữ chất meme)
  "Đang giả lập tư duy...",                   // Pontificating
  "Đang tổng hợp tri thức...",                // Synthesizing data
  "Đang tối ưu hóa véc-tơ giải pháp...",      // Optimizing solution vectors
  "Đang truy cập tàng thư chuyên gia...",     // Accessing expert archives

  // --- Thêm mới (Đậm chất Sci-Fi / Vũ trụ) ---
  "Đang kết nối vệ tinh Skillverse...",
  "Đang giải mã tín hiệu vũ trụ...",
  "Đang kích hoạt lõi xử lý lượng tử...",
  "Đang quét không gian dữ liệu...",
  "Đang đồng bộ hóa tần số não bộ...",
  "Đang hiệu chỉnh cảm biến AI...",
  "Đang trích xuất thông tin...",
  "Đang tải xuống tài nguyên...",
  "Đang nạp năng lượng...",
];

const ICONS = [Sparkles, Cpu, Zap, Search, Brain];

export const ThinkingIndicator = () => {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const Icon = ICONS[index % ICONS.length];

  return (
    <div className="chat-hud-thinking">
      <Icon className="animate-spin-slow" size={18} />
      <span className="thinking-text" key={index}>{PHRASES[index]}</span>
    </div>
  );
};
