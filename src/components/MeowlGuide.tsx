import React, { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import '../styles/MeowlGuide.css';

interface GuideStep {
  id: number;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
}

const guideSteps: GuideStep[] = [
  {
    id: 1,
    titleEn: "Meow-hello there! 🐱✨",
    titleVi: "Meo-ào chào bạn! 🐱✨",
    contentEn: "Hiya! I'm Meowl — your purr-sonal guide through this whisker-tastic world. Got your paws ready? Let’s take the first step and sniff out all the cool places together!",
    contentVi: "Xin chào! Mình là Meowl — hướng dẫn viên cú mèo siêu dễ thương của bạn. Sẵn sàng vươn vuốt khám phá chưa? Cùng mình tìm hiểu mọi ngóc ngách thú vị ở đây nhé!"
  },
  {
    id: 2,
    titleEn: "📚 Time to Learn-Meow!",
    titleVi: "📚 Đến Giờ Học Meo Rồi!",
    contentEn: "Wanna hear a secret? This platform's bursting with juicy lessons — from coding tricks to design magic. It’s like a treat jar that never empties! Come on, let’s crack it open!",
    contentVi: "Muốn nghe bí mật không? Ở đây có cả kho kiến thức xịn xò — từ lập trình đến thiết kế, chẳng khác nào hộp bánh thưởng không đáy! Đi nào, khám phá ngay thôi!"
  },
  {
    id: 3,
    titleEn: "🤖 AI Coach is Purr-fect!",
    titleVi: "🤖 Trợ Lý AI Siêu Mèo!",
    contentEn: "Our AI coach? It’s got the brains of nine cats combined! It'll sniff out the perfect skills just for you. Trust it — this clever kitty knows the shortcut to success!",
    contentVi: "Trợ lý AI của chúng tớ? Thông minh như chín con mèo hợp lại! Nó sẽ tìm ra kỹ năng phù hợp nhất cho bạn. Tin mình đi — chú mèo này biết rõ lối tắt đến thành công đấy!"
  },
  {
    id: 4,
    titleEn: "💼 Show Off Your Claws!",
    titleVi: "💼 Xòe Vuốt Tài Năng Nào!",
    contentEn: "It's your time to shine! Craft a portfolio so sharp, companies will be clawing to get you onboard. Don’t be shy — flex those creative paws!",
    contentVi: "Đến lúc toả sáng rồi! Hãy tạo một hồ sơ sắc lẹm khiến nhà tuyển dụng phải tranh nhau kéo bạn về! Đừng ngại — giơ vuốt tài năng lên nào!"
  },
  {
    id: 5,
    titleEn: "🎯 Track Your Paw-gress!",
    titleVi: "🎯 Theo Dõi Mỗi Bước Chân Mèo!",
    contentEn: "Keep an eye on your path like a curious kitty on the hunt! Our dashboard tracks every new skill and shiny trophy you earn. You're leveling up like a true hero-cat!",
    contentVi: "Dõi theo hành trình của bạn như mèo rình chuột nhé! Bảng điều khiển sẽ hiển thị từng kỹ năng mới và thành tích lung linh bạn đạt được. Bạn đang thăng cấp như một anh hùng mèo thực thụ đấy!"
  }
];


interface MeowlGuideProps {
  // Optional override for language, will use context if not provided
  languageOverride?: 'en' | 'vi';
}

const MeowlGuide: React.FC<MeowlGuideProps> = ({ languageOverride }) => {
  const { language: contextLanguage } = useLanguage();
  const language = languageOverride || contextLanguage;
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const handleDialogClick = () => {
    handleNext();
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleMascotClick = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  // Stop propagation when clicking on close button or links
  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const currentGuide = guideSteps[currentStep];
  const title = language === 'en' ? currentGuide.titleEn : currentGuide.titleVi;
  const content = language === 'en' ? currentGuide.contentEn : currentGuide.contentVi;

  return (
    <>
      {/* Mascot Button */}
      <div className={`meowl-mascot ${isOpen ? 'mascot-active' : ''}`} onClick={handleMascotClick}>
        <div className="quest-indicator">
          <HelpCircle size={22} />
        </div>
        <img 
          src="/images/meowl_bg_clear.png" 
          alt="Meowl Guide" 
          className="mascot-image"
        />
        <div className="mascot-pulse"></div>
      </div>

      {/* Guide Dialog */}
      {isOpen && (
        <div className="meowl-dialog-overlay" onClick={handleDialogClick}>
          <div className="meowl-dialog">
            {/* Avatar Section */}
            <div className="dialog-avatar">
              <img 
                src="/images/meowl_bg_clear.png" 
                alt="Meowl" 
                className="avatar-image"
              />
            </div>

            {/* Dialog Content */}
            <div className="dialog-content">
              {/* Header */}
              <div className="dialog-header">
                <div className="character-name">Meowl</div>
                <button className="close-btn" onClick={handleStopPropagation}>
                  <div className="close-btn-inner" onClick={handleClose}>
                    <X size={18} />
                  </div>
                </button>
              </div>

              {/* Chat Bubble */}
              <div className="chat-bubble">
                <div className="chat-content">
                  <h3 className="chat-title">{title}</h3>
                  <div className="chat-text">
                    {currentStep === 1 && (
                      <p>
                        {language === 'en' 
                          ? <>Wanna hear a secret? This platform's bursting with juicy <Link to="/courses" onClick={handleStopPropagation}>lessons</Link> — from coding tricks to design magic. It's like a treat jar that never empties! Come on, let's crack it open!</> 
                          : <>Muốn nghe bí mật không? Ở đây có cả kho <Link to="/courses" onClick={handleStopPropagation}>kiến thức</Link> xịn xò — từ lập trình đến thiết kế, chẳng khác nào hộp bánh thưởng không đáy! Đi nào, khám phá ngay thôi!</>
                        }
                      </p>
                    )}
                    {currentStep === 2 && (
                      <p>
                        {language === 'en' 
                          ? <>Our <Link to="/chatbot" onClick={handleStopPropagation}>AI coach</Link>? It's got the brains of nine cats combined! It'll sniff out the perfect skills just for you. Trust it — this clever kitty knows the shortcut to success!</> 
                          : <>Trợ lý <Link to="/chatbot" onClick={handleStopPropagation}>AI</Link> của chúng tớ? Thông minh như chín con mèo hợp lại! Nó sẽ tìm ra kỹ năng phù hợp nhất cho bạn. Tin mình đi — chú mèo này biết rõ lối tắt đến thành công đấy!</>
                        }
                      </p>
                    )}
                    {currentStep === 3 && (
                      <p>
                        {language === 'en' 
                          ? <>It's your time to shine! Craft a <Link to="/portfolio" onClick={handleStopPropagation}>portfolio</Link> so sharp, companies will be clawing to get you onboard. Don't be shy — flex those creative paws!</> 
                          : <>Đến lúc toả sáng rồi! Hãy tạo một <Link to="/portfolio" onClick={handleStopPropagation}>hồ sơ</Link> sắc lẹm khiến nhà tuyển dụng phải tranh nhau kéo bạn về! Đừng ngại — giơ vuốt tài năng lên nào!</>
                        }
                      </p>
                    )}
                    {currentStep === 4 && (
                      <p>
                        {language === 'en' 
                          ? <>Keep an eye on your path like a curious kitty on the hunt! Our <Link to="/dashboard" onClick={handleStopPropagation}>dashboard</Link> tracks every new skill and shiny trophy you earn. You're leveling up like a true hero-cat!</> 
                          : <>Dõi theo hành trình của bạn như mèo rình chuột nhé! <Link to="/dashboard" onClick={handleStopPropagation}>Bảng điều khiển</Link> sẽ hiển thị từng kỹ năng mới và thành tích lung linh bạn đạt được. Bạn đang thăng cấp như một anh hùng mèo thực thụ đấy!</>
                        }
                      </p>
                    )}
                    {(currentStep === 0 || currentStep >= 5) && (
                      <p>{content}</p>
                    )}
                  </div>
                </div>
                <div className="continue-hint">
                  {language === 'en' ? 'Click anywhere to continue...' : 'Nhấn để tiếp tục...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MeowlGuide;
