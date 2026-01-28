import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Bot,
  Coins,
  Calendar,
  FileUser,
  Crown,
  MessageSquare,
  Trophy,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Heart,
  Gift,
  Lightbulb,
  CheckCircle2,
  Zap,
  Shield,
  Star,
  Code,
  Palette,
  Database,
  Cloud,
  Smartphone,
  Lock,
  Gamepad2,
  LineChart,
  Building2,
  Music,
  HeartPulse,
  Wallet,
} from "lucide-react";
import "./PremiumFAQ.css";

interface FAQItem {
  id: string;
  question: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

const PremiumFAQ: React.FC = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  const faqItems: FAQItem[] = [
    {
      id: "roadmap",
      question: "Vì sao lại cần có Roadmap?",
      icon: <Map size={24} />,
      color: "#8b5cf6",
      content: (
        <div className="pfaq-content">
          {/* Problem Section */}
          <div className="pfaq-problem-box">
            <div className="pfaq-box-header">
              <span className="pfaq-emoji">😰</span>
              <h4>Vấn đề thường gặp</h4>
            </div>
            <ul className="pfaq-problem-list">
              <li>
                <span className="pfaq-bullet red">✗</span>
                Không biết bắt đầu học từ đâu
              </li>
              <li>
                <span className="pfaq-bullet red">✗</span>
                Học tràn lan, thiếu định hướng rõ ràng
              </li>
              <li>
                <span className="pfaq-bullet red">✗</span>
                Không rõ kỹ năng nào cần thiết cho nghề nghiệp mục tiêu
              </li>
              <li>
                <span className="pfaq-bullet red">✗</span>
                Khó đánh giá tiến độ học tập của bản thân
              </li>
            </ul>
          </div>

          {/* Solution Section */}
          <div className="pfaq-solution-box">
            <div className="pfaq-box-header">
              <span className="pfaq-emoji">✨</span>
              <h4>Giải pháp - Roadmap AI</h4>
            </div>
            <p className="pfaq-desc">
              <strong>Roadmap</strong> là lộ trình học tập được thiết kế bởi AI,
              cá nhân hóa hoàn toàn dựa trên:
            </p>
            <div className="pfaq-tag-grid">
              <div className="pfaq-tag purple">
                <Target size={16} />
                <span>Nghề nghiệp mục tiêu</span>
              </div>
              <div className="pfaq-tag pink">
                <Star size={16} />
                <span>Kỹ năng hiện có</span>
              </div>
              <div className="pfaq-tag blue">
                <Clock size={16} />
                <span>Thời gian có thể học</span>
              </div>
            </div>
          </div>

          {/* Roadmap Structure */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">📊</span>
              Cấu trúc Roadmap
            </h4>
            <div className="pfaq-roadmap-visual">
              <div className="pfaq-roadmap-title">
                🎯 Roadmap: "Trở thành Frontend Developer"
              </div>
              <div className="pfaq-phase phase-1">
                <div className="pfaq-phase-header">
                  <span className="pfaq-phase-badge">Phase 1</span>
                  <span className="pfaq-phase-name">Nền tảng (4 tuần)</span>
                </div>
                <div className="pfaq-skill-list">
                  <span className="pfaq-skill">HTML/CSS Cơ bản</span>
                  <span className="pfaq-skill">JavaScript Fundamentals</span>
                  <span className="pfaq-skill">Git & Version Control</span>
                </div>
              </div>
              <div className="pfaq-phase phase-2">
                <div className="pfaq-phase-header">
                  <span className="pfaq-phase-badge">Phase 2</span>
                  <span className="pfaq-phase-name">Framework (6 tuần)</span>
                </div>
                <div className="pfaq-skill-list">
                  <span className="pfaq-skill">React.js Basics</span>
                  <span className="pfaq-skill">State Management</span>
                  <span className="pfaq-skill">API Integration</span>
                </div>
              </div>
              <div className="pfaq-phase phase-3">
                <div className="pfaq-phase-header">
                  <span className="pfaq-phase-badge">Phase 3</span>
                  <span className="pfaq-phase-name">Chuyên sâu (4 tuần)</span>
                </div>
                <div className="pfaq-skill-list">
                  <span className="pfaq-skill">TypeScript</span>
                  <span className="pfaq-skill">Testing (Jest, RTL)</span>
                  <span className="pfaq-skill">Performance Optimization</span>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Table */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">🎁</span>
              Lợi ích khi có Roadmap
            </h4>
            <div className="pfaq-benefits-table">
              <div className="pfaq-benefit-row">
                <div className="pfaq-benefit-icon">
                  <Target size={20} />
                </div>
                <div className="pfaq-benefit-content">
                  <strong>Có định hướng rõ ràng</strong>
                  <span>Biết chính xác học gì, theo thứ tự nào</span>
                </div>
              </div>
              <div className="pfaq-benefit-row">
                <div className="pfaq-benefit-icon">
                  <Clock size={20} />
                </div>
                <div className="pfaq-benefit-content">
                  <strong>Tiết kiệm thời gian</strong>
                  <span>Không lãng phí thời gian học những thứ không cần</span>
                </div>
              </div>
              <div className="pfaq-benefit-row">
                <div className="pfaq-benefit-icon">
                  <TrendingUp size={20} />
                </div>
                <div className="pfaq-benefit-content">
                  <strong>Đo lường tiến độ</strong>
                  <span>Theo dõi % hoàn thành, skills đã master</span>
                </div>
              </div>
              <div className="pfaq-benefit-row">
                <div className="pfaq-benefit-icon">
                  <Award size={20} />
                </div>
                <div className="pfaq-benefit-content">
                  <strong>Tạo Portfolio</strong>
                  <span>Mỗi skill hoàn thành = 1 badge cho Portfolio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "meowl",
      question: "AI Assistant Meowl có tác dụng gì?",
      icon: <Bot size={24} />,
      color: "#ec4899",
      content: (
        <div className="pfaq-content">
          {/* Meowl Introduction */}
          <div className="pfaq-meowl-intro">
            <div className="pfaq-meowl-avatar">
              <span className="pfaq-meowl-emoji">🐱</span>
              <div className="pfaq-meowl-glow"></div>
            </div>
            <div className="pfaq-meowl-info">
              <h4>Meowl là ai?</h4>
              <p>
                <strong>Meowl</strong> là trợ lý AI thông minh của SkillVerse,
                được thiết kế với hình ảnh chú mèo cú dễ thương, thân thiện với
                người dùng.
              </p>
            </div>
          </div>

          {/* Meowl Features */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">⚡</span>
              Các chức năng chính
            </h4>

            <div className="pfaq-feature-grid">
              <div className="pfaq-feature-card purple">
                <div className="pfaq-feature-icon">
                  <BookOpen size={24} />
                </div>
                <h5>🎓 Hỗ trợ học tập</h5>
                <ul>
                  <li>Giải đáp thắc mắc về các chủ đề trong roadmap</li>
                  <li>Giải thích khái niệm khó theo nhiều cách</li>
                  <li>Đưa ra ví dụ thực tế, code samples</li>
                  <li>Quiz và kiểm tra kiến thức</li>
                </ul>
              </div>

              <div className="pfaq-feature-card blue">
                <div className="pfaq-feature-icon">
                  <TrendingUp size={24} />
                </div>
                <h5>📊 Phân tích & Báo cáo</h5>
                <ul>
                  <li>
                    Tạo <strong>Learning Report</strong> phân tích tiến độ
                  </li>
                  <li>Đưa ra nhận xét về điểm mạnh, điểm yếu</li>
                  <li>Gợi ý cải thiện dựa trên dữ liệu học tập</li>
                </ul>
              </div>

              <div className="pfaq-feature-card pink">
                <div className="pfaq-feature-icon">
                  <MessageSquare size={24} />
                </div>
                <h5>💬 Các chế độ chat</h5>
                <div className="pfaq-chat-modes">
                  <div className="pfaq-chat-mode">
                    <span className="pfaq-mode-name">General Chat</span>
                    <span className="pfaq-mode-desc">
                      Trò chuyện chung, hỗ trợ mọi vấn đề
                    </span>
                  </div>
                  <div className="pfaq-chat-mode premium">
                    <span className="pfaq-mode-name">
                      Career Chat <span className="pfaq-premium-tag">PRO</span>
                    </span>
                    <span className="pfaq-mode-desc">
                      Tư vấn định hướng nghề nghiệp
                    </span>
                  </div>
                  <div className="pfaq-chat-mode premium">
                    <span className="pfaq-mode-name">
                      Expert Chat <span className="pfaq-premium-tag">PRO</span>
                    </span>
                    <span className="pfaq-mode-desc">
                      12 chuyên gia AI theo từng lĩnh vực
                    </span>
                  </div>
                </div>
              </div>

              <div className="pfaq-feature-card green">
                <div className="pfaq-feature-icon">
                  <Heart size={24} />
                </div>
                <h5>🎯 Động lực học tập</h5>
                <ul>
                  <li>Nhắc nhở học tập hàng ngày</li>
                  <li>Chúc mừng khi hoàn thành milestone</li>
                  <li>Speech bubbles thay đổi theo mood</li>
                  <li>Easter eggs và mini-games</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Example */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">💬</span>
              Ví dụ tương tác
            </h4>
            <div className="pfaq-chat-example">
              <div className="pfaq-chat-bubble user">
                <span className="pfaq-chat-text">
                  "Em không hiểu Redux là gì?"
                </span>
              </div>
              <div className="pfaq-chat-bubble meowl">
                <span className="pfaq-chat-avatar">🐱</span>
                <div className="pfaq-chat-reply">
                  <p>
                    <strong>Meowl giải thích nha!</strong> 🐱
                  </p>
                  <p>
                    Redux giống như một <strong>'kho chứa'</strong> (store) tập
                    trung cho toàn bộ dữ liệu của app. Thay vì mỗi component tự
                    giữ state riêng, tất cả đều lấy từ 1 nơi.
                  </p>
                  <div className="pfaq-chat-tip">
                    💡 Ví dụ: Giống như ngân hàng trung ương quản lý tiền tệ,
                    Redux quản lý state của app vậy đó!
                  </div>
                  <p className="pfaq-chat-ask">
                    Bạn muốn Meowl cho code example không? ✨
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "coin",
      question: "Coin dùng để làm gì?",
      icon: <Coins size={24} />,
      color: "#fbbf24",
      content: (
        <div className="pfaq-content">
          {/* Coin Introduction */}
          <div className="pfaq-coin-intro">
            <div className="pfaq-coin-visual">
              <span className="pfaq-coin-emoji">🪙</span>
              <div className="pfaq-coin-sparkle"></div>
            </div>
            <div className="pfaq-coin-info">
              <h4>Hệ thống Gamification</h4>
              <p>
                <strong>Coin</strong> là đơn vị tiền tệ ảo trong SkillVerse, tạo
                động lực học tập thông qua gamification.
              </p>
            </div>
          </div>

          {/* How to earn */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">💰</span>
              Cách kiếm Coin
            </h4>
            <div className="pfaq-coin-table">
              <div className="pfaq-coin-row">
                <span className="pfaq-coin-action">
                  Hoàn thành 1 skill trong roadmap
                </span>
                <span className="pfaq-coin-amount">+50 🪙</span>
              </div>
              <div className="pfaq-coin-row">
                <span className="pfaq-coin-action">
                  Duy trì streak học tập (7 ngày)
                </span>
                <span className="pfaq-coin-amount">+100 🪙</span>
              </div>
              <div className="pfaq-coin-row">
                <span className="pfaq-coin-action">Hoàn thành daily task</span>
                <span className="pfaq-coin-amount">+10 🪙</span>
              </div>
              <div className="pfaq-coin-row">
                <span className="pfaq-coin-action">
                  Đạt quiz score {"≥"} 80%
                </span>
                <span className="pfaq-coin-amount">+30 🪙</span>
              </div>
              <div className="pfaq-coin-row">
                <span className="pfaq-coin-action">
                  Hoàn thành 1 phase roadmap
                </span>
                <span className="pfaq-coin-amount">+200 🪙</span>
              </div>
              <div className="pfaq-coin-row">
                <span className="pfaq-coin-action">First login trong ngày</span>
                <span className="pfaq-coin-amount">+5 🪙</span>
              </div>
              <div className="pfaq-coin-row highlight">
                <span className="pfaq-coin-action">
                  🎉 Refer bạn bè thành công
                </span>
                <span className="pfaq-coin-amount">+500 🪙</span>
              </div>
            </div>
          </div>

          {/* How to use */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">🎁</span>
              Cách sử dụng Coin
            </h4>
            <div className="pfaq-use-grid">
              <div className="pfaq-use-card">
                <Gift size={28} />
                <h5>Đổi thưởng</h5>
                <p>
                  Avatar frames đặc biệt, themes tùy chỉnh, stickers độc quyền
                </p>
              </div>
              <div className="pfaq-use-card">
                <Zap size={28} />
                <h5>Mở khóa tính năng</h5>
                <p>
                  AI chat tokens bổ sung, export certificate đẹp, priority queue
                </p>
              </div>
              <div className="pfaq-use-card">
                <Trophy size={28} />
                <h5>Xếp hạng</h5>
                <p>
                  Leaderboard theo tuần/tháng, badge "Top Learner", hiển thị
                  profile
                </p>
              </div>
            </div>
          </div>

          {/* Important note */}
          <div className="pfaq-note-box gold">
            <Shield size={20} />
            <div>
              <strong>💰 Lưu ý quan trọng về Coin:</strong>
              <p>
                Coin <u>CÓ THỂ</u> mua bằng tiền thật để sử dụng các tính năng
                premium. Tuy nhiên, Coin <u>KHÔNG THỂ</u> rút ra thành tiền mặt.
                Coin chỉ dùng trong hệ thống SkillVerse!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "studyplan",
      question: "Study Plan bằng AI khác gì Roadmap?",
      icon: <Calendar size={24} />,
      color: "#22c55e",
      content: (
        <div className="pfaq-content">
          {/* Introduction */}
          <div className="pfaq-intro-box green">
            <p>
              Roadmap và Study Plan <strong>bổ trợ cho nhau</strong> để giúp bạn
              học tập hiệu quả nhất!
            </p>
          </div>

          {/* Comparison Table */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">📊</span>
              So sánh chi tiết
            </h4>
            <div className="pfaq-compare-table">
              <div className="pfaq-compare-header">
                <div className="pfaq-compare-col">Tiêu chí</div>
                <div className="pfaq-compare-col roadmap">
                  <Map size={16} /> Roadmap
                </div>
                <div className="pfaq-compare-col studyplan">
                  <Calendar size={16} /> Study Plan
                </div>
              </div>
              <div className="pfaq-compare-row">
                <div className="pfaq-compare-label">Phạm vi</div>
                <div className="pfaq-compare-value">3-12 tháng</div>
                <div className="pfaq-compare-value">Ngày/Tuần</div>
              </div>
              <div className="pfaq-compare-row">
                <div className="pfaq-compare-label">Nội dung</div>
                <div className="pfaq-compare-value">
                  Skills cần học để đạt mục tiêu
                </div>
                <div className="pfaq-compare-value">
                  Tasks cụ thể cần làm hôm nay
                </div>
              </div>
              <div className="pfaq-compare-row">
                <div className="pfaq-compare-label">Mức độ chi tiết</div>
                <div className="pfaq-compare-value">Tổng quan, high-level</div>
                <div className="pfaq-compare-value">
                  Chi tiết, có giờ cụ thể
                </div>
              </div>
              <div className="pfaq-compare-row">
                <div className="pfaq-compare-label">Cập nhật</div>
                <div className="pfaq-compare-value">
                  Ít thay đổi, theo giai đoạn
                </div>
                <div className="pfaq-compare-value">Cập nhật hàng ngày</div>
              </div>
              <div className="pfaq-compare-row highlight">
                <div className="pfaq-compare-label">Mục đích</div>
                <div className="pfaq-compare-value accent-purple">
                  <strong>WHAT</strong> to learn
                </div>
                <div className="pfaq-compare-value accent-green">
                  <strong>WHEN & HOW</strong> to learn
                </div>
              </div>
            </div>
          </div>

          {/* Visual Example */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">📋</span>
              Ví dụ trực quan
            </h4>
            <div className="pfaq-plan-compare">
              <div className="pfaq-plan-box roadmap">
                <div className="pfaq-plan-header">
                  <Map size={18} />
                  <span>Roadmap</span>
                </div>
                <div className="pfaq-plan-goal">
                  🎯 Mục tiêu: Frontend Developer
                </div>
                <div className="pfaq-plan-items">
                  <div className="pfaq-plan-item done">
                    ✅ HTML/CSS (Hoàn thành)
                  </div>
                  <div className="pfaq-plan-item done">
                    ✅ JavaScript (Hoàn thành)
                  </div>
                  <div className="pfaq-plan-item progress">
                    🔄 React.js (Đang học - 60%)
                  </div>
                  <div className="pfaq-plan-item pending">⏳ TypeScript</div>
                  <div className="pfaq-plan-item pending">⏳ Testing</div>
                </div>
              </div>

              <div className="pfaq-plan-box studyplan">
                <div className="pfaq-plan-header">
                  <Calendar size={18} />
                  <span>Study Plan - Hôm nay</span>
                </div>
                <div className="pfaq-time-block">
                  <span className="pfaq-time">🌅 Sáng (8:00 - 10:00)</span>
                  <ul>
                    <li>[30p] Review React hooks từ hôm qua</li>
                    <li>[1h] Học useEffect deep dive</li>
                    <li>[30p] Làm bài tập thực hành</li>
                  </ul>
                </div>
                <div className="pfaq-time-block">
                  <span className="pfaq-time">🌆 Chiều (14:00 - 16:00)</span>
                  <ul>
                    <li>[1h] Build mini project: Todo App</li>
                    <li>[1h] Code review với Meowl AI</li>
                  </ul>
                </div>
                <div className="pfaq-daily-target">
                  ✅ Daily target: 4h | 🔥 Streak: 7 ngày
                </div>
              </div>
            </div>
          </div>

          {/* AI Factors */}
          <div className="pfaq-ai-box">
            <div className="pfaq-ai-header">
              <Lightbulb size={20} />
              <h5>AI Study Plan Generator dựa trên:</h5>
            </div>
            <div className="pfaq-ai-factors">
              <span className="pfaq-factor">📍 Roadmap hiện tại</span>
              <span className="pfaq-factor">⏰ Thời gian rảnh của bạn</span>
              <span className="pfaq-factor">📈 Tốc độ học cá nhân</span>
              <span className="pfaq-factor">🎯 Mục tiêu deadline</span>
              <span className="pfaq-factor">
                📚 Phong cách học (video, đọc, hands-on)
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "portfolio",
      question: "Portfolio AI tự động là gì?",
      icon: <FileUser size={24} />,
      color: "#3b82f6",
      content: (
        <div className="pfaq-content">
          {/* Introduction */}
          <div className="pfaq-intro-box blue">
            <p>
              <strong>Portfolio AI</strong> là hồ sơ năng lực được tạo{" "}
              <u>tự động</u> từ quá trình học tập trên SkillVerse - không cần tự
              viết!
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">🔄</span>
              Cách hoạt động
            </h4>
            <div className="pfaq-flow-diagram">
              <div className="pfaq-flow-step">
                <div className="pfaq-flow-icon">📚</div>
                <h5>Học tập</h5>
                <p>Hoàn thành skills, projects, quizzes trên SkillVerse</p>
              </div>
              <div className="pfaq-flow-arrow">→</div>
              <div className="pfaq-flow-step">
                <div className="pfaq-flow-icon">🤖</div>
                <h5>AI Thu thập</h5>
                <p>
                  Skills đã hoàn thành, Projects đã làm, Quiz scores,
                  Certificates
                </p>
              </div>
              <div className="pfaq-flow-arrow">→</div>
              <div className="pfaq-flow-step highlight">
                <div className="pfaq-flow-icon">✨</div>
                <h5>Tạo Portfolio</h5>
                <p>
                  Skill matrix, Project showcase, Achievement badges, AI Summary
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio Components */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">📄</span>
              Thành phần Portfolio AI
            </h4>

            <div className="pfaq-portfolio-preview">
              {/* Skill Matrix */}
              <div className="pfaq-portfolio-card">
                <h5>🎯 Skill Matrix</h5>
                <div className="pfaq-skill-bars">
                  <div className="pfaq-skill-bar-item">
                    <span className="pfaq-skill-name">HTML/CSS</span>
                    <div className="pfaq-skill-progress">
                      <div
                        className="pfaq-skill-fill"
                        style={{ width: "95%" }}
                      ></div>
                    </div>
                    <span className="pfaq-skill-percent">95%</span>
                  </div>
                  <div className="pfaq-skill-bar-item">
                    <span className="pfaq-skill-name">JavaScript</span>
                    <div className="pfaq-skill-progress">
                      <div
                        className="pfaq-skill-fill"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                    <span className="pfaq-skill-percent">85%</span>
                  </div>
                  <div className="pfaq-skill-bar-item">
                    <span className="pfaq-skill-name">React.js</span>
                    <div className="pfaq-skill-progress">
                      <div
                        className="pfaq-skill-fill"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                    <span className="pfaq-skill-percent">75%</span>
                  </div>
                  <div className="pfaq-skill-bar-item">
                    <span className="pfaq-skill-name">TypeScript</span>
                    <div className="pfaq-skill-progress">
                      <div
                        className="pfaq-skill-fill"
                        style={{ width: "50%" }}
                      ></div>
                    </div>
                    <span className="pfaq-skill-percent">50%</span>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="pfaq-portfolio-card">
                <h5>🏆 Achievements & Badges</h5>
                <div className="pfaq-badge-grid">
                  <div className="pfaq-badge gold">
                    <span>🥇</span>
                    <span>React Master</span>
                  </div>
                  <div className="pfaq-badge fire">
                    <span>🔥</span>
                    <span>30 Day Streak</span>
                  </div>
                  <div className="pfaq-badge perfect">
                    <span>💯</span>
                    <span>Perfect Score x5</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="pfaq-portfolio-card">
                <h5>📊 Learning Statistics</h5>
                <div className="pfaq-stats-grid">
                  <div className="pfaq-stat">
                    <span className="pfaq-stat-value">245</span>
                    <span className="pfaq-stat-label">Tổng giờ học</span>
                  </div>
                  <div className="pfaq-stat">
                    <span className="pfaq-stat-value">12</span>
                    <span className="pfaq-stat-label">Skills đã master</span>
                  </div>
                  <div className="pfaq-stat">
                    <span className="pfaq-stat-value">8</span>
                    <span className="pfaq-stat-label">Projects hoàn thành</span>
                  </div>
                  <div className="pfaq-stat">
                    <span className="pfaq-stat-value">3</span>
                    <span className="pfaq-stat-label">Certificates</span>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="pfaq-portfolio-card ai-summary">
                <h5>📝 AI-Generated Summary</h5>
                <blockquote>
                  "Nguyễn Văn A là một Frontend Developer với 6 tháng học tập
                  chuyên sâu về React ecosystem. Thế mạnh nổi bật là UI/UX
                  implementation và responsive design. Đang phát triển thêm kỹ
                  năng TypeScript và Testing."
                </blockquote>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">✅</span>
              Lợi ích
            </h4>
            <div className="pfaq-benefit-chips">
              <div className="pfaq-benefit-chip">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Khách quan</strong>
                  <span>Dữ liệu từ quá trình học thực tế, không tự viết</span>
                </div>
              </div>
              <div className="pfaq-benefit-chip">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Cập nhật realtime</strong>
                  <span>Tự động update khi hoàn thành skill mới</span>
                </div>
              </div>
              <div className="pfaq-benefit-chip">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Verifiable</strong>
                  <span>Nhà tuyển dụng có thể verify qua SkillVerse</span>
                </div>
              </div>
              <div className="pfaq-benefit-chip">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Shareable</strong>
                  <span>Link public hoặc PDF export chuyên nghiệp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "crown",
      question: "Crown Profile (Silver/Gold/Diamond) là gì?",
      icon: <Crown size={24} />,
      color: "#f59e0b",
      content: (
        <div className="pfaq-content">
          {/* Introduction */}
          <div className="pfaq-intro-box gold">
            <p>
              <strong>Crown Profile</strong> là hệ thống premium membership của
              SkillVerse, mỗi gói có biểu tượng vương miện khác nhau thể hiện
              cấp độ thành viên.
            </p>
          </div>

          {/* Tier Cards */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">👑</span>
              Các gói Premium
            </h4>
            <div className="pfaq-tier-grid">
              <div className="pfaq-tier-card silver">
                <div className="pfaq-tier-crown">🥈</div>
                <h5>Silver Crown</h5>
                <div className="pfaq-tier-price">99,000đ/tháng</div>
                <div className="pfaq-tier-for">Cho người mới bắt đầu</div>
                <ul>
                  <li>✓ 200 AI tokens/ngày</li>
                  <li>✓ 3 roadmap active</li>
                  <li>✓ 5 Expert sessions/tháng</li>
                  <li>✓ Career Chat</li>
                  <li>✓ Email support 48h</li>
                </ul>
              </div>

              <div className="pfaq-tier-card gold popular">
                <div className="pfaq-popular-badge">⭐ PHỔ BIẾN</div>
                <div className="pfaq-tier-crown">🥇</div>
                <h5>Gold Crown</h5>
                <div className="pfaq-tier-price">199,000đ/tháng</div>
                <div className="pfaq-tier-for">Cho người học nghiêm túc</div>
                <ul>
                  <li>✓ Unlimited AI tokens</li>
                  <li>✓ Unlimited roadmaps</li>
                  <li>✓ 20 Expert sessions/tháng</li>
                  <li>✓ Job Matching AI</li>
                  <li>✓ Premium Portfolio</li>
                  <li>✓ Email support 24h</li>
                </ul>
              </div>

              <div className="pfaq-tier-card diamond">
                <div className="pfaq-tier-crown">💎</div>
                <h5>Diamond Crown</h5>
                <div className="pfaq-tier-price">399,000đ/tháng</div>
                <div className="pfaq-tier-for">Cho professional</div>
                <ul>
                  <li>✓ Everything in Gold</li>
                  <li>✓ Unlimited Expert sessions</li>
                  <li>✓ Priority Job Matching</li>
                  <li>✓ Premium+ Portfolio</li>
                  <li>✓ Priority support 4h</li>
                  <li>✓ Exclusive features</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Profile Badge Demo */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">🎖️</span>
              Profile Badge hiển thị
            </h4>
            <div className="pfaq-profile-demo">
              <div className="pfaq-demo-avatar">👤</div>
              <div className="pfaq-demo-info">
                <div className="pfaq-demo-name">Nguyễn Văn A</div>
                <div className="pfaq-demo-badge">💎 Diamond Member</div>
                <div className="pfaq-demo-stats">
                  <span>🎯 Frontend Dev</span>
                  <span>📊 245h learned</span>
                  <span>🔥 30 days streak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "chat-compare",
      question: "Career Chat khác gì Expert Chat?",
      icon: <MessageSquare size={24} />,
      color: "#06b6d4",
      content: (
        <div className="pfaq-content">
          {/* Comparison Cards */}
          <div className="pfaq-block">
            <div className="pfaq-chat-compare">
              <div className="pfaq-chat-type career">
                <div className="pfaq-chat-header">
                  <span className="pfaq-chat-icon">🎯</span>
                  <h5>Career Chat</h5>
                </div>
                <div className="pfaq-chat-info">
                  <div className="pfaq-info-row">
                    <strong>Mục đích:</strong>
                    <span>Định hướng nghề nghiệp tổng quan</span>
                  </div>
                  <div className="pfaq-info-row">
                    <strong>Phạm vi:</strong>
                    <span>Rộng, cross-domain</span>
                  </div>
                  <div className="pfaq-info-row">
                    <strong>Đối tượng:</strong>
                    <span>Người chưa rõ muốn làm gì</span>
                  </div>
                </div>
                <div className="pfaq-chat-topics">
                  <h6>📋 Các chủ đề:</h6>
                  <ul>
                    <li>Phân tích tính cách, sở thích → gợi ý nghề</li>
                    <li>So sánh ngành nghề (salary, growth)</li>
                    <li>Lộ trình chuyển ngành</li>
                    <li>Thị trường lao động</li>
                  </ul>
                </div>
              </div>

              <div className="pfaq-vs-divider">VS</div>

              <div className="pfaq-chat-type expert">
                <div className="pfaq-chat-header">
                  <span className="pfaq-chat-icon">🧑‍💼</span>
                  <h5>Expert Chat</h5>
                </div>
                <div className="pfaq-chat-info">
                  <div className="pfaq-info-row">
                    <strong>Mục đích:</strong>
                    <span>Tư vấn chuyên sâu theo lĩnh vực</span>
                  </div>
                  <div className="pfaq-info-row">
                    <strong>Phạm vi:</strong>
                    <span>Sâu, specific domain</span>
                  </div>
                  <div className="pfaq-info-row">
                    <strong>Đối tượng:</strong>
                    <span>Người đã chọn ngành, cần chuyên môn</span>
                  </div>
                </div>
                <div className="pfaq-expert-grid">
                  <h6>👨‍💼 12 Domain Experts:</h6>
                  <div className="pfaq-expert-tags">
                    <span>
                      <Code size={14} /> Dev
                    </span>
                    <span>
                      <Palette size={14} /> Design
                    </span>
                    <span>
                      <Database size={14} /> Data
                    </span>
                    <span>
                      <Cloud size={14} /> Cloud
                    </span>
                    <span>
                      <Smartphone size={14} /> Mobile
                    </span>
                    <span>
                      <Lock size={14} /> Security
                    </span>
                    <span>
                      <Gamepad2 size={14} /> Game
                    </span>
                    <span>
                      <LineChart size={14} /> Marketing
                    </span>
                    <span>
                      <Building2 size={14} /> Business
                    </span>
                    <span>
                      <Music size={14} /> Creative
                    </span>
                    <span>
                      <HeartPulse size={14} /> Health
                    </span>
                    <span>
                      <Wallet size={14} /> Finance
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* When to use */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">💡</span>
              Khi nào dùng gì?
            </h4>
            <div className="pfaq-when-grid">
              <div className="pfaq-when-card career">
                <span className="pfaq-when-q">"Không biết học ngành gì?"</span>
                <span className="pfaq-when-a">→ Career Chat</span>
              </div>
              <div className="pfaq-when-card career">
                <span className="pfaq-when-q">"Frontend hay Backend?"</span>
                <span className="pfaq-when-a">→ Career Chat</span>
              </div>
              <div className="pfaq-when-card expert">
                <span className="pfaq-when-q">"Review code React của em"</span>
                <span className="pfaq-when-a">→ Expert (Dev)</span>
              </div>
              <div className="pfaq-when-card expert">
                <span className="pfaq-when-q">"Thiết kế UI cho app"</span>
                <span className="pfaq-when-a">→ Expert (Design)</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ranking",
      question: "Xếp hạng hiển thị ứng viên là gì?",
      icon: <Trophy size={24} />,
      color: "#f97316",
      content: (
        <div className="pfaq-content">
          {/* Introduction */}
          <div className="pfaq-intro-box orange">
            <p>
              <strong>Candidate Ranking</strong> là hệ thống AI xếp hạng profile
              khi ứng tuyển việc làm, giúp nhà tuyển dụng tìm được ứng viên phù
              hợp nhất.
            </p>
          </div>

          {/* Formula */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">🧮</span>
              Công thức tính điểm
            </h4>
            <div className="pfaq-formula">
              <code>Ranking Score = Σ (Factor × Weight)</code>
            </div>
            <div className="pfaq-factors">
              <div className="pfaq-factor-row">
                <span className="pfaq-factor-name">Skill Match</span>
                <div className="pfaq-factor-bar">
                  <div
                    className="pfaq-factor-fill"
                    style={{ width: "40%" }}
                  ></div>
                </div>
                <span className="pfaq-factor-weight">40%</span>
              </div>
              <div className="pfaq-factor-row">
                <span className="pfaq-factor-name">Learning Commitment</span>
                <div className="pfaq-factor-bar">
                  <div
                    className="pfaq-factor-fill"
                    style={{ width: "20%" }}
                  ></div>
                </div>
                <span className="pfaq-factor-weight">20%</span>
              </div>
              <div className="pfaq-factor-row">
                <span className="pfaq-factor-name">Portfolio Quality</span>
                <div className="pfaq-factor-bar">
                  <div
                    className="pfaq-factor-fill"
                    style={{ width: "15%" }}
                  ></div>
                </div>
                <span className="pfaq-factor-weight">15%</span>
              </div>
              <div className="pfaq-factor-row">
                <span className="pfaq-factor-name">Profile Completeness</span>
                <div className="pfaq-factor-bar">
                  <div
                    className="pfaq-factor-fill"
                    style={{ width: "10%" }}
                  ></div>
                </div>
                <span className="pfaq-factor-weight">10%</span>
              </div>
              <div className="pfaq-factor-row">
                <span className="pfaq-factor-name">Activity Score</span>
                <div className="pfaq-factor-bar">
                  <div
                    className="pfaq-factor-fill"
                    style={{ width: "10%" }}
                  ></div>
                </div>
                <span className="pfaq-factor-weight">10%</span>
              </div>
              <div className="pfaq-factor-row premium">
                <span className="pfaq-factor-name">
                  👑 Premium Boost <span className="pfaq-premium-tag">PRO</span>
                </span>
                <div className="pfaq-factor-bar">
                  <div
                    className="pfaq-factor-fill premium"
                    style={{ width: "5%" }}
                  ></div>
                </div>
                <span className="pfaq-factor-weight">+5%</span>
              </div>
            </div>
          </div>

          {/* Ranking Preview */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">🔍</span>
              Hiển thị cho Recruiter
            </h4>
            <div className="pfaq-ranking-preview">
              <div className="pfaq-rank-item rank-1">
                <span className="pfaq-rank-number">1</span>
                <div className="pfaq-rank-info">
                  <div className="pfaq-rank-name">💎 Nguyễn Văn A</div>
                  <div className="pfaq-rank-skills">
                    React: 95% | TypeScript: 80%
                  </div>
                  <div className="pfaq-rank-stats">
                    🔥 60 day streak | 300h learned
                  </div>
                </div>
                <div className="pfaq-rank-score">95</div>
              </div>
              <div className="pfaq-rank-item rank-2">
                <span className="pfaq-rank-number">2</span>
                <div className="pfaq-rank-info">
                  <div className="pfaq-rank-name">🥇 Trần Thị B</div>
                  <div className="pfaq-rank-skills">
                    React: 90% | Node.js: 75%
                  </div>
                  <div className="pfaq-rank-stats">
                    🔥 30 day streak | 200h learned
                  </div>
                </div>
                <div className="pfaq-rank-score">88</div>
              </div>
              <div className="pfaq-rank-item rank-3">
                <span className="pfaq-rank-number">3</span>
                <div className="pfaq-rank-info">
                  <div className="pfaq-rank-name">🥈 Lê Văn C</div>
                  <div className="pfaq-rank-skills">React: 85% | CSS: 90%</div>
                  <div className="pfaq-rank-stats">
                    🔥 15 day streak | 150h learned
                  </div>
                </div>
                <div className="pfaq-rank-score">82</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "job-matching",
      question: "Gợi ý việc làm & micro-job từ AI hoạt động thế nào?",
      icon: <Briefcase size={24} />,
      color: "#10b981",
      content: (
        <div className="pfaq-content">
          {/* How AI Matching Works */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">🔄</span>
              Cách AI Matching hoạt động
            </h4>
            <div className="pfaq-job-flow">
              <div className="pfaq-job-step">
                <div className="pfaq-job-icon">👤</div>
                <h5>User Profile</h5>
                <p>Skills, Roadmap, Goals, Location</p>
              </div>
              <div className="pfaq-job-plus">+</div>
              <div className="pfaq-job-step">
                <div className="pfaq-job-icon">💼</div>
                <h5>Job Database</h5>
                <p>Full-time, Part-time, Freelance, Micro-job</p>
              </div>
              <div className="pfaq-job-arrow">↓</div>
              <div className="pfaq-job-step ai">
                <div className="pfaq-job-icon">🤖</div>
                <h5>AI Matching Engine</h5>
                <p>Skill analysis + Preference learning + Market trends</p>
              </div>
              <div className="pfaq-job-arrow">↓</div>
              <div className="pfaq-job-step result">
                <div className="pfaq-job-icon">✨</div>
                <h5>Personalized Jobs</h5>
                <p>Gợi ý việc làm phù hợp 95%+ với bạn</p>
              </div>
            </div>
          </div>

          {/* Job Types */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">📋</span>
              Loại công việc được gợi ý
            </h4>
            <div className="pfaq-job-types">
              <div className="pfaq-job-type">
                <span className="pfaq-job-emoji">💼</span>
                <h5>Full-time</h5>
                <p>Vị trí chính thức, match với career goal</p>
              </div>
              <div className="pfaq-job-type">
                <span className="pfaq-job-emoji">⏰</span>
                <h5>Part-time</h5>
                <p>Phù hợp sinh viên, linh hoạt thời gian</p>
              </div>
              <div className="pfaq-job-type">
                <span className="pfaq-job-emoji">🌐</span>
                <h5>Freelance</h5>
                <p>Dự án ngắn hạn, làm remote</p>
              </div>
              <div className="pfaq-job-type highlight">
                <span className="pfaq-job-emoji">⚡</span>
                <h5>Micro-jobs</h5>
                <p>Tasks nhỏ 1-8 giờ, nhận tiền ngay!</p>
              </div>
            </div>
          </div>

          {/* Micro-job Examples */}
          <div className="pfaq-block">
            <h4 className="pfaq-block-title">
              <span className="pfaq-emoji">⚡</span>
              Ví dụ Micro-jobs
            </h4>
            <div className="pfaq-microjob-list">
              <div className="pfaq-microjob">
                <div className="pfaq-mj-info">
                  <span className="pfaq-mj-name">Fix responsive bug</span>
                  <span className="pfaq-mj-skills">CSS • 2h</span>
                </div>
                <span className="pfaq-mj-price">200,000đ</span>
              </div>
              <div className="pfaq-microjob">
                <div className="pfaq-mj-info">
                  <span className="pfaq-mj-name">Design logo cho startup</span>
                  <span className="pfaq-mj-skills">Figma • 4h</span>
                </div>
                <span className="pfaq-mj-price">500,000đ</span>
              </div>
              <div className="pfaq-microjob">
                <div className="pfaq-mj-info">
                  <span className="pfaq-mj-name">
                    Code review React project
                  </span>
                  <span className="pfaq-mj-skills">React • 1h</span>
                </div>
                <span className="pfaq-mj-price">150,000đ</span>
              </div>
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="pfaq-smart-box">
            <div className="pfaq-smart-header">
              <Sparkles size={20} />
              <h5>AI học từ hành vi của bạn</h5>
            </div>
            <div className="pfaq-smart-insights">
              <div className="pfaq-insight">
                <span>📊</span>
                <p>
                  Bạn thường accept jobs về <strong>React</strong>, bỏ qua
                  Angular
                </p>
              </div>
              <div className="pfaq-insight">
                <span>🏠</span>
                <p>
                  Bạn prefer <strong>remote work</strong> hơn onsite
                </p>
              </div>
              <div className="pfaq-insight">
                <span>⏱️</span>
                <p>
                  Bạn hoàn thành micro-jobs frontend nhanh hơn{" "}
                  <strong>40%</strong> trung bình
                </p>
              </div>
            </div>
            <div className="pfaq-smart-result">
              → AI sẽ ưu tiên React jobs, remote work, và notify đúng giờ bạn
              online!
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="pfaq-section">
      {/* Background Effects */}
      <div className="pfaq-bg-effects">
        <div className="pfaq-orb pfaq-orb-1"></div>
        <div className="pfaq-orb pfaq-orb-2"></div>
        <div className="pfaq-orb pfaq-orb-3"></div>
      </div>

      {/* Inner Container */}
      <div className="pfaq-inner">
        {/* Header */}
        <motion.div
          className="pfaq-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="pfaq-badge">
            <Lightbulb size={18} />
            <span>Câu hỏi thường gặp</span>
          </div>
          <h2 className="pfaq-title">
            <Sparkles className="pfaq-title-icon" size={32} />
            Khám Phá SkillVerse
            <Sparkles className="pfaq-title-icon" size={32} />
          </h2>
          <p className="pfaq-subtitle">
            Tìm hiểu chi tiết về các tính năng độc đáo giúp bạn phát triển sự
            nghiệp
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="pfaq-list">
          {faqItems.map((item, index) => (
            <motion.div
              key={item.id}
              className={`pfaq-item ${openItem === item.id ? "pfaq-item--open" : ""}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              style={{ "--pfaq-accent": item.color } as React.CSSProperties}
            >
              <button
                className="pfaq-trigger"
                onClick={() => toggleItem(item.id)}
              >
                <div className="pfaq-trigger-left">
                  <span className="pfaq-icon">{item.icon}</span>
                  <span className="pfaq-question">{item.question}</span>
                </div>
                <span className="pfaq-chevron">
                  {openItem === item.id ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </span>
              </button>
              <AnimatePresence mode="wait">
                {openItem === item.id && (
                  <motion.div
                    className="pfaq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: [0.4, 0, 0.2, 1],
                      opacity: { duration: 0.15 },
                    }}
                  >
                    <div className="pfaq-answer-inner">{item.content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumFAQ;
