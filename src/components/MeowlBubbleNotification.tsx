import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Sparkles, Crown, MapPin, BookOpen, Target, Heart, Shirt, Home, User, Briefcase, Users, Trophy, Wallet, GraduationCap, MessageCircle, Compass, Info, CreditCard, Zap, Gift, Star } from 'lucide-react';
import { useMeowlSkin } from '../context/MeowlSkinContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { premiumService } from '../services/premiumService';
import '../styles/MeowlBubbleNotification.css';

interface BubbleMessage {
  id: string;
  type: 'welcome' | 'premium' | 'skin' | 'roadmap' | 'course' | 'direction' | 'motivation' | 'tip' | 'page-intro';
  messageEn: string;
  messageVi: string;
  icon: React.ReactNode;
  actionUrl?: string;
  actionLabelEn?: string;
  actionLabelVi?: string;
  priority: number;
}

// Page introduction messages - shown when user navigates to a page
const PAGE_INTRODUCTIONS: Record<string, BubbleMessage> = {
  '/': {
    id: 'intro-home',
    type: 'page-intro',
    messageEn: "Welcome to SkillVerse! 🏠✨ This is your launchpad to learn, grow, and find opportunities!",
    messageVi: "Chào mừng đến SkillVerse! 🏠✨ Đây là bệ phóng để bạn học hỏi, phát triển và tìm cơ hội!",
    icon: <Home size={20} className="bubble-icon-home" />,
    priority: 10,
  },
  '/profile': {
    id: 'intro-profile',
    type: 'page-intro',
    messageEn: "This is your Profile! 👤 Update your info and pick a cute outfit for me here~ 🐱",
    messageVi: "Đây là Hồ sơ của bạn! 👤 Cập nhật thông tin và chọn trang phục cho mình ở đây nhé~ 🐱",
    icon: <User size={20} className="bubble-icon-user" />,
    priority: 10,
  },
  '/courses': {
    id: 'intro-courses',
    type: 'page-intro',
    messageEn: "Welcome to Courses! 📚 Discover micro-lessons that fit your schedule. Learn 5-15 mins a day!",
    messageVi: "Chào mừng đến Khóa học! 📚 Khám phá bài học ngắn phù hợp lịch trình. Học 5-15 phút mỗi ngày!",
    icon: <BookOpen size={20} className="bubble-icon-book" />,
    priority: 10,
  },
  '/roadmap': {
    id: 'intro-roadmap',
    type: 'page-intro',
    messageEn: "AI Roadmap is here! 🗺️ Let AI create a personalized learning path just for you~",
    messageVi: "Đây là Lộ trình AI! 🗺️ Để AI tạo lộ trình học tập cá nhân hóa cho bạn nhé~",
    icon: <MapPin size={20} className="bubble-icon-map" />,
    priority: 10,
  },
  '/mentorship': {
    id: 'intro-mentorship',
    type: 'page-intro',
    messageEn: "Find your Mentor! 🎓 Book 1:1 sessions with industry experts to accelerate your growth~",
    messageVi: "Tìm Mentor của bạn! 🎓 Đặt lịch 1:1 với chuyên gia để tăng tốc phát triển~",
    icon: <GraduationCap size={20} className="bubble-icon-mentor" />,
    priority: 10,
  },
  '/jobs': {
    id: 'intro-jobs',
    type: 'page-intro',
    messageEn: "Micro-job Marketplace! 💼 Find freelance gigs and real projects to build your portfolio~",
    messageVi: "Chợ Micro-job! 💼 Tìm việc freelance và dự án thật để xây dựng portfolio~",
    icon: <Briefcase size={20} className="bubble-icon-job" />,
    priority: 10,
  },
  '/community': {
    id: 'intro-community',
    type: 'page-intro',
    messageEn: "Welcome to Community! 👥 Connect, share, and learn with fellow learners~",
    messageVi: "Chào mừng đến Cộng đồng! 👥 Kết nối, chia sẻ và học hỏi cùng mọi người~",
    icon: <Users size={20} className="bubble-icon-community" />,
    priority: 10,
  },
  '/gamification': {
    id: 'intro-gamification',
    type: 'page-intro',
    messageEn: "Game Zone! 🎮 Earn XP, badges, and climb the leaderboard! Learning is fun here~",
    messageVi: "Khu vui chơi! 🎮 Kiếm XP, huy hiệu và leo bảng xếp hạng! Học mà vui~",
    icon: <Trophy size={20} className="bubble-icon-trophy" />,
    priority: 10,
  },
  '/portfolio': {
    id: 'intro-portfolio',
    type: 'page-intro',
    messageEn: "Your Skill Wallet! 💎 AI builds your digital portfolio automatically. Share it anywhere!",
    messageVi: "Ví Kỹ năng của bạn! 💎 AI tự động xây portfolio số. Chia sẻ khắp nơi!",
    icon: <Sparkles size={20} className="bubble-icon-sparkle" />,
    priority: 10,
  },
  '/cv': {
    id: 'intro-cv',
    type: 'page-intro',
    messageEn: "CV Builder! 📝 Create a professional resume with AI assistance~",
    messageVi: "Tạo CV! 📝 Tạo hồ sơ xin việc chuyên nghiệp với sự hỗ trợ của AI~",
    icon: <Target size={20} className="bubble-icon-target" />,
    priority: 10,
  },
  '/wallet': {
    id: 'intro-wallet',
    type: 'page-intro',
    messageEn: "Your Wallet! 💰 Check your coins, rewards, and transaction history here~",
    messageVi: "Ví của bạn! 💰 Xem xu, phần thưởng và lịch sử giao dịch ở đây~",
    icon: <Wallet size={20} className="bubble-icon-wallet" />,
    priority: 10,
  },
  '/my-wallet': {
    id: 'intro-mywallet',
    type: 'page-intro',
    messageEn: "Your Wallet! 💰 Manage coins, top up balance, and track all transactions here~",
    messageVi: "Ví của bạn! 💰 Quản lý xu, nạp tiền và theo dõi giao dịch tại đây~",
    icon: <Wallet size={20} className="bubble-icon-wallet" />,
    actionUrl: '/payment',
    actionLabelEn: 'Top Up Now 💳',
    actionLabelVi: 'Nạp tiền ngay 💳',
    priority: 10,
  },
  '/payment': {
    id: 'intro-payment',
    type: 'page-intro',
    messageEn: "Payment Center! 💳 Securely top up your account and unlock premium features~",
    messageVi: "Trung tâm Thanh toán! 💳 Nạp tiền an toàn và mở khóa tính năng premium~",
    icon: <CreditCard size={20} className="bubble-icon-payment" />,
    priority: 10,
  },
  '/manager': {
    id: 'intro-manager',
    type: 'page-intro',
    messageEn: "Manager Dashboard! 📊 Overview of your learning progress and activities~",
    messageVi: "Bảng quản lý! 📊 Tổng quan tiến trình học tập và hoạt động của bạn~",
    icon: <Target size={20} className="bubble-icon-target" />,
    priority: 10,
  },
  '/help-center': {
    id: 'intro-help',
    type: 'page-intro',
    messageEn: "Help Center! 🆘 Find answers, guides, and support for any questions~",
    messageVi: "Trung tâm Hỗ trợ! 🆘 Tìm câu trả lời, hướng dẫn và hỗ trợ mọi thắc mắc~",
    icon: <Info size={20} className="bubble-icon-info" />,
    priority: 10,
  },
  '/premium': {
    id: 'intro-premium',
    type: 'page-intro',
    messageEn: "Premium Plans! 👑 Unlock unlimited features and level up your learning experience!",
    messageVi: "Gói Premium! 👑 Mở khóa tính năng không giới hạn và nâng cấp trải nghiệm!",
    icon: <Crown size={20} className="bubble-icon-crown" />,
    priority: 10,
  },
  '/chatbot': {
    id: 'intro-chatbot',
    type: 'page-intro',
    messageEn: "Career Chat Hub! 💬 Choose General (free AI) or Expert (real humans) mode~",
    messageVi: "Trung tâm Tư vấn! 💬 Chọn chế độ Chung (AI miễn phí) hoặc Chuyên gia (người thật)~",
    icon: <MessageCircle size={20} className="bubble-icon-chat" />,
    priority: 10,
  },
  '/explore': {
    id: 'intro-explore',
    type: 'page-intro',
    messageEn: "Explore the Galaxy! 🌌 Navigate through SkillVerse's universe of opportunities~",
    messageVi: "Khám phá Vũ trụ! 🌌 Điều hướng qua vũ trụ cơ hội của SkillVerse~",
    icon: <Compass size={20} className="bubble-icon-compass" />,
    priority: 10,
  },
  '/about': {
    id: 'intro-about',
    type: 'page-intro',
    messageEn: "About SkillVerse! 🚀 Learn about our mission and the amazing team behind the platform~",
    messageVi: "Về SkillVerse! 🚀 Tìm hiểu sứ mệnh và đội ngũ tuyệt vời đằng sau nền tảng~",
    icon: <Info size={20} className="bubble-icon-info" />,
    priority: 10,
  },
  '/dashboard': {
    id: 'intro-dashboard',
    type: 'page-intro',
    messageEn: "Your Dashboard! 📊 Track your progress, achievements, and upcoming tasks~",
    messageVi: "Bảng điều khiển! 📊 Theo dõi tiến trình, thành tích và công việc sắp tới~",
    icon: <Target size={20} className="bubble-icon-target" />,
    priority: 10,
  },
  '/seminar': {
    id: 'intro-seminar',
    type: 'page-intro',
    messageEn: "Seminars & Events! 🎤 Join live sessions and workshops with industry experts~",
    messageVi: "Hội thảo & Sự kiện! 🎤 Tham gia buổi học trực tiếp với chuyên gia ngành~",
    icon: <Users size={20} className="bubble-icon-community" />,
    priority: 10,
  },
};

const STORAGE_KEYS = {
  LAST_VISIT: 'meowl-last-visit',
  LAST_PREMIUM_PROMPT: 'meowl-last-premium-prompt',
  LAST_SKIN_PROMPT: 'meowl-last-skin-prompt',
  BUBBLE_SHOWN_COUNT: 'meowl-bubble-count',
  SESSION_BUBBLES: 'meowl-session-bubbles',
  INTRODUCED_PAGES: 'meowl-introduced-pages',
  BUBBLE_DISABLED: 'meowl-bubble-disabled',
};

const BUBBLE_MESSAGES: BubbleMessage[] = [
  // Welcome messages
  {
    id: 'welcome-1',
    type: 'welcome',
    messageEn: "Welcome back! 🎉 Meowl missed you~ Ready to learn something new today?",
    messageVi: "Chào mừng trở lại! 🎉 Meowl nhớ bạn lắm~ Hôm nay học gì nào?",
    icon: <Heart size={20} className="bubble-icon-heart" />,
    priority: 10,
  },
  {
    id: 'welcome-2',
    type: 'welcome',
    messageEn: "Meow! 🐱 You're back! Let's continue your learning journey together~",
    messageVi: "Meo! 🐱 Bạn đã quay lại! Cùng tiếp tục hành trình học tập nào~",
    icon: <Sparkles size={20} className="bubble-icon-sparkle" />,
    priority: 10,
  },
  {
    id: 'welcome-3',
    type: 'welcome',
    messageEn: "Hey there! ✨ Meowl is so happy to see you again!",
    messageVi: "Hế lô! ✨ Meowl vui quá khi gặp lại bạn!",
    icon: <Heart size={20} className="bubble-icon-heart" />,
    priority: 10,
  },

  // Premium suggestions
  {
    id: 'premium-1',
    type: 'premium',
    messageEn: "Psst~ 🌟 Want unlimited Expert Chat and exclusive features? Check out Premium!",
    messageVi: "Này~ 🌟 Muốn chat với chuyên gia không giới hạn? Xem gói Premium nhé!",
    icon: <Crown size={20} className="bubble-icon-crown" />,
    actionUrl: '/premium',
    actionLabelEn: 'View Premium ✨',
    actionLabelVi: 'Xem Premium ✨',
    priority: 5,
  },
  {
    id: 'premium-2',
    type: 'premium',
    messageEn: "Meowl thinks you deserve the best! 👑 Premium unlocks amazing features~",
    messageVi: "Meowl nghĩ bạn xứng đáng với điều tốt nhất! 👑 Premium mở khóa nhiều tính năng hay lắm~",
    icon: <Crown size={20} className="bubble-icon-crown" />,
    actionUrl: '/premium',
    actionLabelEn: 'Upgrade Now 🚀',
    actionLabelVi: 'Nâng cấp ngay 🚀',
    priority: 5,
  },

  // Skin/Outfit suggestions
  {
    id: 'skin-1',
    type: 'skin',
    messageEn: "Meowl wants a new outfit! 👗✨ Help me choose one in your Profile?",
    messageVi: "Meowl muốn thay đồ mới! 👗✨ Giúp mình chọn trong Hồ sơ nhé?",
    icon: <Shirt size={20} className="bubble-icon-shirt" />,
    actionUrl: '/profile',
    actionLabelEn: 'Choose Outfit 🐱',
    actionLabelVi: 'Chọn Trang phục 🐱',
    priority: 3,
  },
  {
    id: 'skin-2',
    type: 'skin',
    messageEn: "Do you like my current look? 🎭 There are so many cute costumes to try!",
    messageVi: "Bạn có thích bộ đồ hiện tại của mình không? 🎭 Còn nhiều trang phục dễ thương lắm!",
    icon: <Shirt size={20} className="bubble-icon-shirt" />,
    actionUrl: '/profile',
    actionLabelEn: 'See All Skins ✨',
    actionLabelVi: 'Xem tất cả Skin ✨',
    priority: 3,
  },

  // Roadmap suggestions
  {
    id: 'roadmap-1',
    type: 'roadmap',
    messageEn: "Do you have your learning roadmap yet? 🗺️ Let AI help you plan!",
    messageVi: "Bạn đã có lộ trình học tập chưa? 🗺️ Để AI giúp bạn lên kế hoạch nhé!",
    icon: <MapPin size={20} className="bubble-icon-map" />,
    actionUrl: '/roadmap',
    actionLabelEn: 'Create Roadmap 🗺️',
    actionLabelVi: 'Tạo Lộ trình 🗺️',
    priority: 7,
  },
  {
    id: 'roadmap-2',
    type: 'roadmap',
    messageEn: "A clear roadmap = faster success! 🚀 Have you set yours?",
    messageVi: "Lộ trình rõ ràng = thành công nhanh hơn! 🚀 Bạn đã có chưa?",
    icon: <MapPin size={20} className="bubble-icon-map" />,
    actionUrl: '/roadmap',
    actionLabelEn: 'Start Planning 📍',
    actionLabelVi: 'Bắt đầu lập kế hoạch 📍',
    priority: 7,
  },

  // Course suggestions
  {
    id: 'course-1',
    type: 'course',
    messageEn: "So many exciting courses waiting for you! 📚 Shall we explore?",
    messageVi: "Nhiều khóa học thú vị đang chờ bạn lắm! 📚 Cùng khám phá nhé?",
    icon: <BookOpen size={20} className="bubble-icon-book" />,
    actionUrl: '/courses',
    actionLabelEn: 'Explore Courses 📚',
    actionLabelVi: 'Khám phá Khóa học 📚',
    priority: 6,
  },
  {
    id: 'course-2',
    type: 'course',
    messageEn: "Learn something new today! 🌟 Meowl found some great courses for you~",
    messageVi: "Học điều mới hôm nay nào! 🌟 Meowl tìm được vài khóa học hay cho bạn~",
    icon: <BookOpen size={20} className="bubble-icon-book" />,
    actionUrl: '/courses',
    actionLabelEn: 'Browse Now 🎓',
    actionLabelVi: 'Xem ngay 🎓',
    priority: 6,
  },

  // Career direction suggestions
  {
    id: 'direction-1',
    type: 'direction',
    messageEn: "Have you found your career direction yet? 🎯 Let's figure it out together!",
    messageVi: "Bạn đã có định hướng nghề nghiệp chưa? 🎯 Cùng tìm hiểu nhé!",
    icon: <Target size={20} className="bubble-icon-target" />,
    actionUrl: '/chatbot/general',
    actionLabelEn: 'Career Chat 💬',
    actionLabelVi: 'Tư vấn nghề nghiệp 💬',
    priority: 6,
  },
  {
    id: 'direction-2',
    type: 'direction',
    messageEn: "Confused about your future? 🤔 Meowl can help you explore career paths!",
    messageVi: "Còn mông lung về tương lai? 🤔 Meowl có thể giúp bạn khám phá các hướng đi!",
    icon: <Target size={20} className="bubble-icon-target" />,
    actionUrl: '/chatbot/general',
    actionLabelEn: 'Get Advice 🌟',
    actionLabelVi: 'Nhận tư vấn 🌟',
    priority: 6,
  },

  // Motivational messages
  {
    id: 'motivation-1',
    type: 'motivation',
    messageEn: "You're doing amazing! 💪✨ Keep up the great work~",
    messageVi: "Bạn làm tốt lắm! 💪✨ Cố lên nhé~",
    icon: <Sparkles size={20} className="bubble-icon-sparkle" />,
    priority: 2,
  },
  {
    id: 'motivation-2',
    type: 'motivation',
    messageEn: "Every expert was once a beginner! 🌱 You got this!",
    messageVi: "Mọi chuyên gia đều từng là người mới! 🌱 Bạn làm được mà!",
    icon: <Sparkles size={20} className="bubble-icon-sparkle" />,
    priority: 2,
  },
  {
    id: 'motivation-3',
    type: 'motivation',
    messageEn: "Small steps lead to big achievements! 🚀 Meowl believes in you~",
    messageVi: "Bước nhỏ dẫn đến thành tựu lớn! 🚀 Meowl tin bạn~",
    icon: <Heart size={20} className="bubble-icon-heart" />,
    priority: 2,
  },

  // Tips
  {
    id: 'tip-1',
    type: 'tip',
    messageEn: "Pro tip: Consistency beats intensity! 📈 Learn a little every day~",
    messageVi: "Mẹo hay: Đều đặn hơn cố gắng quá sức! 📈 Học một ít mỗi ngày nhé~",
    icon: <Sparkles size={20} className="bubble-icon-sparkle" />,
    priority: 4,
  },
  {
    id: 'tip-2',
    type: 'tip',
    messageEn: "Remember to take breaks! 🍵 A rested mind learns better~",
    messageVi: "Nhớ nghỉ ngơi nhé! 🍵 Đầu óc thoải mái học hiệu quả hơn~",
    icon: <Heart size={20} className="bubble-icon-heart" />,
    priority: 4,
  },

  // Quick Top-up / Deposit prompts
  {
    id: 'topup-1',
    type: 'tip',
    messageEn: "⚡ Quick top-up available! Add coins to unlock courses and features~",
    messageVi: "⚡ Nạp tiền nhanh! Thêm xu để mở khóa khóa học và tính năng~",
    icon: <Zap size={20} className="bubble-icon-zap" />,
    actionUrl: '/payment',
    actionLabelEn: 'Top Up ⚡',
    actionLabelVi: 'Nạp ngay ⚡',
    priority: 5,
  },
  {
    id: 'topup-2',
    type: 'tip',
    messageEn: "💳 Low on coins? Top up now and continue your learning journey!",
    messageVi: "💳 Hết xu rồi? Nạp ngay để tiếp tục hành trình học tập!",
    icon: <CreditCard size={20} className="bubble-icon-payment" />,
    actionUrl: '/payment',
    actionLabelEn: 'Add Coins 💰',
    actionLabelVi: 'Nạp xu 💰',
    priority: 5,
  },
  {
    id: 'reward-1',
    type: 'motivation',
    messageEn: "🎁 Daily rewards waiting! Complete missions to earn free coins~",
    messageVi: "🎁 Phần thưởng hàng ngày đang chờ! Hoàn thành nhiệm vụ để nhận xu miễn phí~",
    icon: <Gift size={20} className="bubble-icon-gift" />,
    actionUrl: '/gamification',
    actionLabelEn: 'Claim Rewards 🎁',
    actionLabelVi: 'Nhận thưởng 🎁',
    priority: 4,
  },
  {
    id: 'star-1',
    type: 'motivation',
    messageEn: "⭐ You're a star learner! Keep shining bright~",
    messageVi: "⭐ Bạn là ngôi sao học tập! Tiếp tục tỏa sáng nhé~",
    icon: <Star size={20} className="bubble-icon-star" />,
    priority: 3,
  },
];

interface MeowlBubbleNotificationProps {
  disabled?: boolean;
}

const MeowlBubbleNotification: React.FC<MeowlBubbleNotificationProps> = ({ disabled = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSkinImage } = useMeowlSkin();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  
  const [currentBubble, setCurrentBubble] = useState<BubbleMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [lastPath, setLastPath] = useState<string>('');
  const [isBubbleDisabled, setIsBubbleDisabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.BUBBLE_DISABLED) === 'true';
  });



  // Listen for external toggle events
  useEffect(() => {
    const handleStorageChange = () => {
      const isDisabled = localStorage.getItem(STORAGE_KEYS.BUBBLE_DISABLED) === 'true';
      setIsBubbleDisabled(isDisabled);
      if (isDisabled) {
        setIsVisible(false);
        setCurrentBubble(null);
      }
    };

    window.addEventListener('meowl-bubble-toggle', handleStorageChange);
    return () => {
      window.removeEventListener('meowl-bubble-toggle', handleStorageChange);
    };
  }, []);

  // Check premium status
  useEffect(() => {
    const checkPremium = async () => {
      if (!isAuthenticated) return;
      try {
        const subscription = await premiumService.getCurrentSubscription();
        setIsPremium(Boolean(subscription?.isActive && subscription.plan.planType !== 'FREE_TIER'));
      } catch {
        setIsPremium(false);
      }
    };
    checkPremium();
  }, [isAuthenticated]);

  // Get page introduction if available and not shown yet
  const getPageIntroduction = useCallback((pathname: string): BubbleMessage | null => {
    // Get the base path (without dynamic segments)
    const basePath = pathname.split('/').slice(0, 2).join('/') || '/';
    
    // Check if we have an introduction for this page
    const intro = PAGE_INTRODUCTIONS[pathname] || PAGE_INTRODUCTIONS[basePath];
    if (!intro) return null;

    // Check if this page was already introduced in this session
    const introducedPages = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.INTRODUCED_PAGES) || '[]');
    if (introducedPages.includes(intro.id)) return null;

    // Mark page as introduced
    introducedPages.push(intro.id);
    sessionStorage.setItem(STORAGE_KEYS.INTRODUCED_PAGES, JSON.stringify(introducedPages));

    return intro;
  }, []);

  // Select appropriate bubble message (for non-page-intro scenarios)
  const selectRandomBubble = useCallback((): BubbleMessage | null => {
    const now = Date.now();
    const lastPremiumPrompt = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_PREMIUM_PROMPT) || '0');
    const lastSkinPrompt = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SKIN_PROMPT) || '0');
    const sessionBubbles = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION_BUBBLES) || '[]');

    const hoursSincePremiumPrompt = (now - lastPremiumPrompt) / (1000 * 60 * 60);
    const hoursSinceSkinPrompt = (now - lastSkinPrompt) / (1000 * 60 * 60);

    // Priority 1: Premium suggestion if not premium and hasn't been prompted in 4 hours
    if (!isPremium && hoursSincePremiumPrompt > 4) {
      localStorage.setItem(STORAGE_KEYS.LAST_PREMIUM_PROMPT, now.toString());
      const premiumMessages = BUBBLE_MESSAGES.filter(m => m.type === 'premium');
      return premiumMessages[Math.floor(Math.random() * premiumMessages.length)];
    }

    // Priority 2: Skin suggestion if hasn't been prompted in 6 hours
    if (hoursSinceSkinPrompt > 6) {
      localStorage.setItem(STORAGE_KEYS.LAST_SKIN_PROMPT, now.toString());
      const skinMessages = BUBBLE_MESSAGES.filter(m => m.type === 'skin');
      return skinMessages[Math.floor(Math.random() * skinMessages.length)];
    }

    // Priority 3: Random helpful message (exclude already shown in this session)
    const availableMessages = BUBBLE_MESSAGES.filter(
      m => !['welcome', 'premium'].includes(m.type) && !sessionBubbles.includes(m.id)
    );

    if (availableMessages.length > 0) {
      const selected = availableMessages[Math.floor(Math.random() * availableMessages.length)];
      sessionBubbles.push(selected.id);
      localStorage.setItem(STORAGE_KEYS.SESSION_BUBBLES, JSON.stringify(sessionBubbles.slice(-10)));
      return selected;
    }

    return null;
  }, [isPremium]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setCurrentBubble(null);
    }, 300);
  }, []);

  // Show bubble helper
  const showBubble = useCallback((bubble: BubbleMessage, autoHideDelay: number = 8000) => {
    // Don't show if disabled
    if (isBubbleDisabled) return;
    
    setCurrentBubble(bubble);
    setIsVisible(true);
    setIsClosing(false);

    // Auto-hide after delay
    const hideTimeout = setTimeout(() => {
      handleClose();
    }, autoHideDelay);

    return () => clearTimeout(hideTimeout);
  }, [handleClose, isBubbleDisabled]);

  // Handle page navigation - show page introduction
  useEffect(() => {
    if (disabled || !isAuthenticated) return;
    if (location.pathname === lastPath) return;

    setLastPath(location.pathname);

    // Close any existing bubble first
    if (isVisible) {
      handleClose();
    }

    // Check for page introduction
    const pageIntro = getPageIntroduction(location.pathname);
    
    if (pageIntro) {
      // Show page intro after a short delay
      const timer = setTimeout(() => {
        showBubble(pageIntro, 7000);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, disabled, isAuthenticated, lastPath, isVisible, handleClose, getPageIntroduction, showBubble]);

  // Show welcome back or random bubble on initial load
  useEffect(() => {
    if (disabled || !isAuthenticated) return;

    const now = Date.now();
    const lastVisit = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_VISIT) || '0');
    const hoursSinceLastVisit = (now - lastVisit) / (1000 * 60 * 60);

    // Update last visit
    localStorage.setItem(STORAGE_KEYS.LAST_VISIT, now.toString());

    // Clear introduced pages on new session (if more than 1 hour)
    if (hoursSinceLastVisit > 1) {
      sessionStorage.removeItem(STORAGE_KEYS.INTRODUCED_PAGES);
    }

    // Show welcome back message if been away for more than 1 hour
    if (hoursSinceLastVisit > 1) {
      const welcomeMessages = BUBBLE_MESSAGES.filter(m => m.type === 'welcome');
      const welcomeBubble = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      const timer = setTimeout(() => {
        showBubble(welcomeBubble, 6000);
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Otherwise show page intro or random bubble after longer delay
    const timer = setTimeout(() => {
      // Check if page intro was already shown
      const pageIntro = getPageIntroduction(location.pathname);
      if (pageIntro) {
        showBubble(pageIntro, 7000);
      } else {
        // Show random bubble with 30% chance
        if (Math.random() < 0.3) {
          const randomBubble = selectRandomBubble();
          if (randomBubble) {
            showBubble(randomBubble, 8000);
          }
        }
      }
    }, 3000 + Math.random() * 2000);

    return () => clearTimeout(timer);
  }, [disabled, isAuthenticated, showBubble, getPageIntroduction, selectRandomBubble, location.pathname]);

  // Random bubble every 15 seconds (when not showing any bubble)
  useEffect(() => {
    if (disabled || !isAuthenticated) return;

    const intervalId = setInterval(() => {
      // Only show if no bubble is currently visible
      if (!isVisible) {
        // 40% chance to show a random bubble
        if (Math.random() < 0.4) {
          const randomBubble = selectRandomBubble();
          if (randomBubble) {
            showBubble(randomBubble, 6000);
          }
        }
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(intervalId);
  }, [disabled, isAuthenticated, isVisible]);

  const handleAction = () => {
    if (currentBubble?.actionUrl) {
      navigate(currentBubble.actionUrl);
    }
    handleClose();
  };

  // If disabled, do nothing (button is now in MeowlGuide)
  if (isBubbleDisabled) return null;

  if (!isVisible || !currentBubble || !isAuthenticated) return null;

  const message = language === 'en' ? currentBubble.messageEn : currentBubble.messageVi;
  const actionLabel = language === 'en' ? currentBubble.actionLabelEn : currentBubble.actionLabelVi;

  return (
    <div className={`meowl-bubble-container ${isClosing ? 'meowl-bubble--closing' : ''}`}>

      {/* Speech Bubble */}
      <div className={`meowl-bubble-speech meowl-bubble-speech--${currentBubble.type}`}>
        {/* Close button */}
        <button className="meowl-bubble-close" onClick={handleClose} aria-label="Close">
          <X size={14} />
        </button>



        {/* Icon */}
        <div className="meowl-bubble-icon">
          {currentBubble.icon}
        </div>

        {/* Message */}
        <p className="meowl-bubble-message">{message}</p>

        {/* Action button */}
        {currentBubble.actionUrl && actionLabel && (
          <button className="meowl-bubble-action" onClick={handleAction}>
            {actionLabel}
          </button>
        )}

        {/* Decorative elements */}
        <div className="meowl-bubble-sparkle meowl-bubble-sparkle--1">✨</div>
        <div className="meowl-bubble-sparkle meowl-bubble-sparkle--2">⭐</div>
        <div className="meowl-bubble-sparkle meowl-bubble-sparkle--3">💫</div>
      </div>
    </div>
  );
};

export default MeowlBubbleNotification;
