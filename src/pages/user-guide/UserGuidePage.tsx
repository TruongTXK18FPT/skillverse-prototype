import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  Briefcase, 
  Map, 
  Calendar, 
  MessageSquare, 
  Award, 
  Wallet, 
  LayoutDashboard, 
  Search, 
  UserCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  LogIn,
  UserPlus,
  CheckCircle,
  Lock,
  Building2,
  Crown,
  FileText,
  Globe,
  Cpu,
  Terminal,
  Rocket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import './UserGuideV2.css';

interface GuideFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: string;
  linkText?: string;
  steps?: string[];
  isPremium?: boolean;
  example?: string;
}

interface RoleGuide {
  id: 'student' | 'parent' | 'mentor' | 'business' | 'guest' | 'proposal';
  title: string;
  description: string;
  icon: React.ReactNode;
  features: GuideFeature[];
}

const UserGuidePage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'proposal' | 'guide'>('guide');
  
  // Determine the initial role based on auth state to prevent flicker
  const getInitialRole = () => {
    if (isAuthenticated && user) {
      if (user.roles.includes('PARENT')) return 'parent';
      if (user.roles.includes('MENTOR')) return 'mentor';
      if (user.roles.includes('RECRUITER')) return 'business';
      return 'student';
    }
    return 'guest';
  };

  const [activeRole, setActiveRole] = useState<'student' | 'parent' | 'mentor' | 'business' | 'guest'>(getInitialRole());

  useEffect(() => {
    setActiveRole(getInitialRole());
  }, [isAuthenticated, user]);

  const roles: RoleGuide[] = [
    {
      id: 'proposal',
      title: 'Project Proposal',
      description: 'Chi tiết đề xuất dự án Skillverse và các chức năng hệ thống.',
      icon: <FileText />,
      features: [
        {
          title: 'Hệ Sinh Thái Skillverse',
          description: 'Nền tảng hướng nghiệp và phát triển kỹ năng toàn diện dựa trên AI.',
          icon: <Globe />,
          steps: [
            'Kết nối 4 đối tượng: Học sinh, Phụ huynh, Mentor, Doanh nghiệp.',
            'Cá nhân hóa lộ trình học tập với AI Roadmap.',
            'Hệ thống Gamification tăng cường động lực học tập.',
            'Tích hợp thị trường việc làm và kết nối chuyên gia.'
          ]
        },
        {
          title: 'Công Nghệ Cốt Lõi',
          description: 'Stack công nghệ hiện đại đảm bảo hiệu năng và trải nghiệm.',
          icon: <Cpu />,
          steps: [
            'Frontend: React, TypeScript, Vite, Framer Motion (Animations).',
            'Backend: Java Spring Boot, Microservices Architecture.',
            'Database: PostgreSQL, Redis (Caching).',
            'AI Integration: OpenAI API, Custom ML Models cho gợi ý lộ trình.'
          ]
        },
        {
          title: 'Chức Năng Chính: Student',
          description: 'Tập trung vào trải nghiệm học tập và phát triển sự nghiệp.',
          icon: <GraduationCap />,
          steps: [
            'AI Roadmap Generator: Tạo lộ trình học tập tự động.',
            'Study Planner: Lên lịch học thông minh.',
            'Expert Chat: Tư vấn nghề nghiệp 1-1 với AI chuyên gia.',
            'Portfolio Builder: Tự động tạo CV từ kết quả học tập.'
          ]
        },
        {
          title: 'Chức Năng Chính: Parent',
          description: 'Công cụ giám sát và đồng hành cùng con.',
          icon: <Users />,
          steps: [
            'Parent Dashboard: Theo dõi tiến độ, điểm số, thời gian học.',
            'Wallet Management: Quản lý ngân sách, nạp tiền học.',
            'Student Linking: Liên kết và quản lý nhiều tài khoản con.',
            'Alert System: Nhận thông báo về tình hình học tập.'
          ]
        },
        {
          title: 'Chức Năng Chính: Mentor & Business',
          description: 'Mở rộng kết nối và cơ hội nghề nghiệp.',
          icon: <Briefcase />,
          steps: [
            'Mentor Booking: Hệ thống đặt lịch hẹn và video call.',
            'Recruitment Portal: Đăng tin tuyển dụng, tìm kiếm ứng viên.',
            'Verified Profiles: Hồ sơ năng lực được xác thực bởi hệ thống.',
            'Community Hub: Chia sẻ kiến thức và xây dựng thương hiệu.'
          ]
        },
        {
          title: 'Mô Hình Kinh Doanh',
          description: 'Các luồng doanh thu và gói dịch vụ.',
          icon: <Wallet />,
          steps: [
            'Freemium Model: Miễn phí tính năng cơ bản, thu phí nâng cao.',
            'Subscription Plans: Gói Premium cho Student (AI, Unlimited Chat).',
            'Commission Fee: Phí hoa hồng từ Booking Mentor và Tuyển dụng.',
            'Virtual Goods: Bán Skin, Item trong Meowl Shop.'
          ]
        }
      ]
    },
    {
      id: 'guest',
      title: 'Khách Tham Quan',
      description: 'Khám phá Skillverse và bắt đầu hành trình của bạn.',
      icon: <Sparkles />,
      features: [
        {
          title: 'Bước 1: Chọn Vai Trò',
          description: 'Xác định mục tiêu của bạn tại Skillverse.',
          icon: <Users />,
          steps: [
            'Student: Người học muốn phát triển kỹ năng.',
            'Parent: Phụ huynh muốn đồng hành cùng con.',
            'Mentor: Chuyên gia muốn chia sẻ kiến thức.',
            'Business: Doanh nghiệp tìm kiếm nhân tài.'
          ],
          link: '/choose-role',
          linkText: 'Chọn Vai Trò'
        },
        {
          title: 'Bước 2: Đăng Ký Tài Khoản',
          description: 'Tạo tài khoản Skillverse để truy cập vào hệ sinh thái học tập toàn diện.',
          icon: <UserPlus />,
          steps: [
            'Nhấn vào nút "Đăng Ký" ở góc trên bên phải.',
            'Điền thông tin cá nhân của bạn.',
            'Xác thực email để kích hoạt tài khoản.',
            'Meowl nhắc bạn nè! Click vào logo để quay lại trang chủ bất cứ lúc nào.'
          ]
        },
        {
          title: 'Bước 3: Bắt Đầu Hành Trình',
          description: 'Sau khi đăng nhập, bạn sẽ được hướng dẫn chi tiết theo vai trò đã chọn.',
          icon: <ArrowRight />,
          steps: [
            'Truy cập Dashboard cá nhân.',
            'Khám phá các tính năng dành riêng cho bạn.',
            'Kết nối với cộng đồng Skillverse.'
          ],
          link: '/login',
          linkText: 'Trải Nghiệm Ngay'
        }
      ]
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Chinh phục lộ trình nghề nghiệp với AI Roadmap và trợ lý Meowl.',
      icon: <GraduationCap />,
      features: [
        {
          title: 'AI Roadmap (Lộ Trình Học)',
          description: 'Tạo lộ trình học tập cá nhân hóa dựa trên mục tiêu nghề nghiệp.',
          icon: <Map />,
          steps: [
            'Truy cập trang "Lộ Trình Học Tập".',
            'Chọn lĩnh vực nghề nghiệp (VD: IT, Marketing).',
            'Nhập mục tiêu và trình độ hiện tại.',
            'AI sẽ tạo ra lộ trình chi tiết từng bước.',
            'Theo dõi tiến độ và hoàn thành các cột mốc.'
          ],
          example: 'Ví dụ: Nhập "Frontend Developer", chọn trình độ "Beginner", mục tiêu "Đi làm trong 6 tháng".',
          link: '/roadmap',
          linkText: 'Tạo Roadmap Ngay'
        },
        {
          title: 'Study Planner (Lập Kế Hoạch)',
          description: 'Sử dụng AI để tự động sắp xếp lịch học tối ưu.',
          icon: <Calendar />,
          isPremium: true,
          steps: [
            'Truy cập "Lập Kế Hoạch".',
            'Chọn các môn học hoặc Roadmap cần học.',
            'Nhập thời gian rảnh trong tuần.',
            'Bấm "Generate Schedule" để AI sắp xếp lịch.',
            'Đồng bộ với Google Calendar.'
          ],
          example: 'Ví dụ: Chọn "Học ReactJS", rảnh "Thứ 2, 4, 6 từ 19h-21h". AI sẽ tự động điền lịch.',
          link: '/study-planner',
          linkText: 'Lên Lịch Học'
        },
        {
          title: 'Expert Career Chat',
          description: 'Trò chuyện chuyên sâu với AI Expert trong từng lĩnh vực.',
          icon: <MessageSquare />,
          isPremium: true,
          steps: [
            'Vào "Career Chat" → Chọn tab "Expert".',
            'Chọn chuyên gia (VD: Senior Java Dev, Marketing Manager).',
            'Đặt câu hỏi chuyên môn hoặc nhờ review CV/Code.',
            'Nhận phản hồi chi tiết và chuyên sâu.'
          ],
          example: 'Ví dụ: Hỏi "Làm sao để tối ưu performance cho React App?" hoặc "Review đoạn code này giúp tôi".',
          link: '/chatbot/expert',
          linkText: 'Chat Với Expert'
        },
        {
          title: 'Khóa Học & Học Tập',
          description: 'Truy cập kho khóa học đa dạng và chất lượng cao.',
          icon: <BookOpen />,
          steps: [
            'Vào mục "Khóa Học" trên thanh menu.',
            'Tìm kiếm khóa học theo kỹ năng hoặc lĩnh vực.',
            'Đăng ký và bắt đầu học qua video, bài đọc.',
            'Làm bài kiểm tra (Quiz) để củng cố kiến thức.',
            'Nhận chứng chỉ sau khi hoàn thành.'
          ],
          link: '/courses',
          linkText: 'Xem Khóa Học'
        },
        {
          title: 'Portfolio Generator',
          description: 'Tự động tạo CV và Portfolio chuyên nghiệp.',
          icon: <Briefcase />,
          isPremium: true,
          steps: [
            'Hệ thống tự động ghi nhận kỹ năng từ Roadmap.',
            'Vào trang "Hồ Sơ" → Chọn "Xuất CV/Portfolio".',
            'Chọn mẫu thiết kế (Template) ưng ý.',
            'Tải xuống dưới dạng PDF hoặc chia sẻ link.'
          ],
          example: 'Ví dụ: Bấm "Export CV", chọn template "Modern Dark", hệ thống sẽ điền sẵn kỹ năng và dự án.',
          link: '/portfolio',
          linkText: 'Tạo Portfolio'
        },
        {
          title: 'Gamification & Meowl Shop',
          description: 'Học tập thú vị hơn với hệ thống thưởng.',
          icon: <Award />,
          steps: [
            'Hoàn thành bài học để nhận điểm thưởng.',
            'Vào "Meowl Shop" để mua Skin cho trợ lý ảo.',
            'Xem bảng xếp hạng thành tích.',
            'Tham gia các mini-game để giải trí.'
          ],
          link: '/gamification',
          linkText: 'Vào Shop'
        }
      ]
    },
    {
      id: 'parent',
      title: 'Parent',
      description: 'Đồng hành cùng con trên con đường học tập và phát triển.',
      icon: <Users />,
      features: [
        {
          title: 'Liên Kết Tài Khoản Con',
          description: 'Kết nối để theo dõi quá trình học tập.',
          icon: <UserPlus />,
          steps: [
            'Yêu cầu con gửi Mã Mời (Invite Code) từ tài khoản Student.',
            'Vào trang Profile hoặc Dashboard.',
            'Nhập mã mời để xác nhận liên kết.',
            'Một phụ huynh có thể liên kết nhiều con.'
          ],
          link: '/profile',
          linkText: 'Liên Kết Ngay'
        },
        {
          title: 'Parent Dashboard',
          description: 'Trung tâm theo dõi và giám sát.',
          icon: <LayoutDashboard />,
          steps: [
            'Xem tổng quan tiến độ học tập của các con.',
            'Kiểm tra điểm số, kỹ năng đã đạt được.',
            'Xem thời gian học tập hàng tuần (Streak).',
            'Nhận cảnh báo nếu con xao nhãng.'
          ],
          link: '/parent-dashboard',
          linkText: 'Xem Dashboard'
        },
        {
          title: 'Quản Lý Tài Chính (Wallet)',
          description: 'Đầu tư cho giáo dục an toàn và minh bạch.',
          icon: <Wallet />,
          steps: [
            'Nạp tiền vào ví Skillverse qua ngân hàng/thẻ.',
            'Mua gói Premium hoặc khóa học cho con.',
            'Xem lịch sử giao dịch chi tiết.',
            'Kiểm soát ngân sách học tập.'
          ],
          link: '/my-wallet',
          linkText: 'Ví Của Tôi'
        }
      ]
    },
    {
      id: 'mentor',
      title: 'Mentor',
      description: 'Chia sẻ kiến thức và dẫn dắt thế hệ trẻ.',
      icon: <UserCircle />,
      features: [
        {
          title: 'Xây Dựng Hồ Sơ Mentor',
          description: 'Tạo thương hiệu cá nhân uy tín.',
          icon: <CheckCircle />,
          steps: [
            'Cập nhật thông tin chuyên môn, kinh nghiệm.',
            'Thêm các chứng chỉ, bằng cấp.',
            'Thiết lập lĩnh vực mentoring.',
            'Viết giới thiệu bản thân hấp dẫn.'
          ],
          link: '/mentor-profile',
          linkText: 'Cập Nhật Hồ Sơ'
        },
        {
          title: 'Quản Lý Lịch Hẹn (Booking)',
          description: 'Kết nối với học viên.',
          icon: <Calendar />,
          steps: [
            'Thiết lập khung giờ rảnh (Availability).',
            'Nhận yêu cầu booking từ học viên.',
            'Chấp nhận hoặc từ chối yêu cầu.',
            'Tham gia buổi mentoring qua video call.'
          ],
          link: '/my-bookings',
          linkText: 'Quản Lý Lịch'
        },
        {
          title: 'Đóng Góp Cộng Đồng',
          description: 'Lan tỏa tri thức.',
          icon: <MessageSquare />,
          steps: [
            'Đăng bài chia sẻ kiến thức trên diễn đàn.',
            'Trả lời thắc mắc của học viên.',
            'Nhận huy hiệu (Badge) đóng góp tích cực.'
          ],
          link: '/community',
          linkText: 'Vào Cộng Đồng'
        }
      ]
    },
    {
      id: 'business',
      title: 'Business',
      description: 'Tìm kiếm nhân tài và xây dựng đội ngũ.',
      icon: <Briefcase />,
      features: [
        {
          title: 'Hồ Sơ Doanh Nghiệp',
          description: 'Quảng bá thương hiệu tuyển dụng.',
          icon: <Building2 />,
          steps: [
            'Cập nhật thông tin công ty, văn hóa, phúc lợi.',
            'Đăng tải hình ảnh/video giới thiệu.',
            'Xác thực tài khoản doanh nghiệp.'
          ],
          link: '/profile/business',
          linkText: 'Hồ Sơ Công Ty'
        },
        {
          title: 'Đăng Tin Tuyển Dụng',
          description: 'Tiếp cận ứng viên tiềm năng.',
          icon: <Search />,
          steps: [
            'Tạo tin tuyển dụng mới (Job Posting).',
            'Mô tả yêu cầu công việc và mức lương.',
            'Chọn các kỹ năng yêu cầu (để khớp với Portfolio học viên).',
            'Quản lý danh sách tin đăng.'
          ],
          link: '/jobs/create',
          linkText: 'Đăng Tin'
        },
        {
          title: 'Tìm Kiếm Ứng Viên',
          description: 'Săn nhân tài chất lượng.',
          icon: <Users />,
          steps: [
            'Tìm kiếm ứng viên theo kỹ năng, lĩnh vực.',
            'Xem Portfolio và CV đã được hệ thống xác thực.',
            'Mời ứng viên phỏng vấn.',
            'Lưu hồ sơ ứng viên tiềm năng.'
          ],
          link: '/candidates',
          linkText: 'Tìm Ứng Viên'
        }
      ]
    }
  ];

  const visibleRoles = (() => {
    if (!isAuthenticated || !user) {
      return roles.filter(r => r.id === 'guest');
    }

    const userRole: RoleGuide['id'] = user.roles.includes('PARENT') ? 'parent'
      : user.roles.includes('MENTOR') ? 'mentor'
      : user.roles.includes('RECRUITER') ? 'business'
      : 'student';

    return roles.filter(r => r.id === userRole);
  })();

  const proposalData = roles.find(r => r.id === 'proposal');
  const activeRoleData = roles.find(r => r.id === activeRole);

  if (loading) {
    return (
      <div className="guide-v2-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MeowlKuruLoader text="ACCESSING MISSION DATA..." size="large" />
      </div>
    );
  }

  return (
    <div className="guide-v2-container">
      <div className="guide-v2-content">
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="guide-v2-header"
        >
          <h1 className="guide-v2-title">Hướng Dẫn Sử Dụng</h1>
          <p className="guide-v2-subtitle">
            {isAuthenticated 
              ? `Chào mừng trở lại, ${user?.fullName || 'bạn'}! Hãy khám phá hướng dẫn dành cho vai trò: ${activeRoleData?.title}.`
              : 'Chào mừng bạn đến với Skillverse. Hãy tìm hiểu cách sử dụng nền tảng.'}
          </p>
        </motion.header>

        {/* Mission Selector (Tabs) */}
        <div className="guide-v2-mission-selector">
          <div 
            className={`guide-v2-tab ${activeTab === 'proposal' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposal')}
          >
            <span className="guide-v2-tab-label">Tính Năng Chính</span>
          </div>
          <div 
            className={`guide-v2-tab ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <span className="guide-v2-tab-label">Hướng Dẫn Theo Vai Trò</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'proposal' ? (
            <motion.div
              key="proposal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="guide-v2-blueprint-box"
            >
              <h2 className="guide-v2-blueprint-header">
                <Terminal size={32} /> TÍNH NĂNG NỔI BẬT
              </h2>
              
              <div className="guide-v2-blueprint-grid">
                {proposalData?.features.map((feature, idx) => (
                  <div key={idx} className="guide-v2-blueprint-card">
                    <span className="guide-v2-blueprint-number">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <div style={{ color: 'var(--guide-v2-primary)', marginBottom: '1rem' }}>
                      {feature.icon}
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>

                    {feature.steps && (
                      <ul className="guide-v2-blueprint-steps">
                        {feature.steps.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ul>
                    )}

                    {feature.link && isAuthenticated && (
                      <Link to={feature.link} className="guide-v2-cta" style={{ marginTop: '1rem' }}>
                        {feature.linkText || 'ACCESS'} <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {!isAuthenticated && (
                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                  <Link to="/login" className="guide-v2-cta" style={{ fontSize: '1.2rem', padding: '1rem 3rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Rocket size={24} /> INITIALIZE PROJECT
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="guide"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="guide-v2-protocol-container"
            >
              {/* Role Navigation */}
              <div className="guide-v2-role-nav">
                {visibleRoles.map((role) => (
                  <button
                    key={role.id}
                    className={`guide-v2-role-btn ${activeRole === role.id ? 'active' : ''}`}
                    onClick={() => setActiveRole(role.id as any)}
                  >
                    {role.icon} {role.title.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="guide-v2-timeline">
                {activeRoleData?.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`guide-v2-step-card ${feature.isPremium ? 'premium' : ''}`}
                  >
                    
                    <div className="guide-v2-step-icon">
                      {feature.icon}
                    </div>

                    {feature.isPremium && (
                      <div className="guide-v2-premium-badge">
                        <Crown size={12} fill="currentColor" /> PRO ACCESS
                      </div>
                    )}

                    <h3 className="guide-v2-step-title">{feature.title}</h3>
                    <p className="guide-v2-step-desc">{feature.description}</p>

                    {feature.steps && (
                      <ul className="guide-v2-protocol-steps">
                        {feature.steps.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ul>
                    )}

                    {feature.example && (
                      <div className="guide-v2-example">
                        <strong>EXAMPLE:</strong> {feature.example}
                      </div>
                    )}

                    {feature.link && (
                      isAuthenticated || activeRole === 'guest' ? (
                        <Link to={feature.link} className="guide-v2-cta">
                          {feature.linkText || 'ACCESS MODULE'} <ArrowRight size={16} />
                        </Link>
                      ) : (
                        <div className="guide-v2-cta guide-v2-cta-secondary" style={{ cursor: 'not-allowed', opacity: 0.6 }}>
                          <Lock size={16} /> LOGIN REQUIRED
                        </div>
                      )
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserGuidePage;
