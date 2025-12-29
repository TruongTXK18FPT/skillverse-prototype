import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
  Code,
  Database,
  Server,
  Globe,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './UserGuide.css';

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
  const { user, isAuthenticated } = useAuth();
  const [activeRole, setActiveRole] = useState<'student' | 'parent' | 'mentor' | 'business' | 'guest' | 'proposal'>('guest');

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.roles.includes('PARENT')) setActiveRole('parent');
      else if (user.roles.includes('MENTOR')) setActiveRole('mentor');
      else if (user.roles.includes('RECRUITER')) setActiveRole('business');
      else setActiveRole('student');
    } else {
      setActiveRole('guest');
    }
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
          title: 'Bước 1: Đăng Ký Tài Khoản',
          description: 'Tạo tài khoản Skillverse để truy cập vào hệ sinh thái học tập toàn diện.',
          icon: <UserPlus />,
          steps: [
            'Nhấn vào nút "Đăng Ký" ở góc trên bên phải.',
            'Điền thông tin cá nhân hoặc đăng nhập nhanh bằng Google.',
            'Xác thực email để kích hoạt tài khoản.'
          ],
          link: '/register',
          linkText: 'Đăng Ký Ngay'
        },
        {
          title: 'Bước 2: Chọn Vai Trò',
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
          title: 'Bước 3: Bắt Đầu Hành Trình',
          description: 'Sau khi đăng nhập, bạn sẽ được hướng dẫn chi tiết theo vai trò đã chọn.',
          icon: <ArrowRight />,
          steps: [
            'Truy cập Dashboard cá nhân.',
            'Khám phá các tính năng dành riêng cho bạn.',
            'Kết nối với cộng đồng Skillverse.'
          ]
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
          link: '/jobs/create', // Giả định route
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
          link: '/candidates', // Giả định route
          linkText: 'Tìm Ứng Viên'
        }
      ]
    }
  ];

  const visibleRoles = (() => {
    if (!isAuthenticated || !user) {
      return roles;
    }

    const userRole: RoleGuide['id'] = user.roles.includes('PARENT') ? 'parent'
      : user.roles.includes('MENTOR') ? 'mentor'
      : user.roles.includes('RECRUITER') ? 'business'
      : 'student';

    return roles.filter(r => r.id === 'proposal' || r.id === userRole);
  })();

  const activeData = roles.find(r => r.id === activeRole);

  return (
    <div className="user-guide-container">
      <div className="user-guide-background" />
      
      <div className="user-guide-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="user-guide-hero"
        >
          <h1 className="user-guide-title">Skillverse Guide</h1>
          <p className="user-guide-subtitle">
            {isAuthenticated 
              ? `Chào mừng trở lại, ${user?.fullName || 'User'}. Đây là hướng dẫn dành riêng cho vai trò ${activeData?.title} của bạn.`
              : 'Hướng dẫn toàn diện để bạn khai phá tối đa tiềm năng của vũ trụ Skillverse. Đăng nhập để xem hướng dẫn chi tiết cho vai trò của bạn.'}
          </p>
          
          {!isAuthenticated && (
            <div style={{ marginTop: '2rem' }}>
              <Link to="/login" className="user-guide-link-btn" style={{ marginRight: '1rem' }}>
                <LogIn size={18} style={{ marginRight: '0.5rem' }} /> Đăng Nhập
              </Link>
              <Link to="/register" className="user-guide-link-btn" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Đăng Ký
              </Link>
            </div>
          )}
        </motion.div>

        {/* Role Tabs */}
        <div className="user-guide-role-selector">
            {visibleRoles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`user-guide-role-card ${activeRole === role.id ? 'active' : ''}`}
                onClick={() => setActiveRole(role.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="user-guide-role-icon user-guide-float">
                  {role.icon}
                </div>
                <h3 className="user-guide-role-name">{role.title}</h3>
                <p className="user-guide-role-desc">{role.description}</p>
              </motion.div>
            ))}
          </div>

        <AnimatePresence mode="wait">
          {activeRole === 'proposal' ? (
            <motion.div
              key="proposal-view"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
              className="proposal-container"
            >
              {/* Hero Section */}
              <div className="proposal-hero">
                <h1>Skillverse Ecosystem</h1>
                <p className="tagline">
                  Nền tảng hướng nghiệp và phát triển kỹ năng toàn diện dựa trên AI, kết nối Học sinh, Phụ huynh, Mentor và Doanh nghiệp trong một vũ trụ học tập thống nhất.
                </p>
              </div>

              {/* Problem & Solution */}
              <div className="proposal-section">
                <h2 className="proposal-section-title"><Sparkles size={32} /> Tầm Nhìn & Sứ Mệnh</h2>
                <div className="ecosystem-grid">
                  <div className="ecosystem-card">
                    <h3>Vấn Đề</h3>
                    <p>
                      Sự mất kết nối giữa đào tạo và nhu cầu thực tế của doanh nghiệp. Học sinh thiếu định hướng, phụ huynh thiếu công cụ giám sát, và doanh nghiệp khó tìm nhân tài phù hợp.
                    </p>
                  </div>
                  <div className="ecosystem-card">
                    <h3>Giải Pháp</h3>
                    <p>
                      Skillverse cung cấp lộ trình học tập cá nhân hóa bằng AI, hệ thống Mentor 1-1, và cổng thông tin việc làm, tạo ra một vòng khép kín từ Học tập &rarr; Thực hành &rarr; Việc làm.
                    </p>
                  </div>
                  <div className="ecosystem-card">
                    <h3>Giá Trị Cốt Lõi</h3>
                    <p>
                      Minh bạch trong đánh giá năng lực. Cá nhân hóa trải nghiệm học tập. Kết nối thực tế với chuyên gia và doanh nghiệp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Features */}
              <div className="proposal-section">
                <h2 className="proposal-section-title"><Cpu size={32} /> Chức Năng Đột Phá</h2>
                <div className="ecosystem-grid">
                  <div className="ecosystem-card">
                    <div className="user-guide-feature-icon"><Map /></div>
                    <h3>AI Roadmap Generator</h3>
                    <p>Tự động tạo lộ trình học tập chi tiết dựa trên mục tiêu nghề nghiệp và trình độ hiện tại của người học.</p>
                  </div>
                  <div className="ecosystem-card">
                    <div className="user-guide-feature-icon"><MessageSquare /></div>
                    <h3>Expert AI Chat</h3>
                    <p>Hệ thống tư vấn nghề nghiệp 24/7 với các Persona chuyên gia trong từng lĩnh vực (IT, Marketing, Design...).</p>
                  </div>
                  <div className="ecosystem-card">
                    <div className="user-guide-feature-icon"><LayoutDashboard /></div>
                    <h3>Parent Dashboard</h3>
                    <p>Cổng thông tin dành cho phụ huynh để theo dõi tiến độ, quản lý tài chính và đồng hành cùng con cái.</p>
                  </div>
                  <div className="ecosystem-card">
                    <div className="user-guide-feature-icon"><Briefcase /></div>
                    <h3>Recruitment Portal</h3>
                    <p>Hệ thống tuyển dụng thông minh, tự động khớp hồ sơ ứng viên (Portfolio) với yêu cầu công việc của doanh nghiệp.</p>
                  </div>
                </div>
              </div>

              {/* Technology Stack */}
              <div className="proposal-section">
                <h2 className="proposal-section-title"><Code size={32} /> Công Nghệ Cốt Lõi</h2>
                <div className="tech-stack-grid">
                  <div className="tech-item">
                    <div className="tech-icon"><Globe /></div>
                    <h4>Frontend</h4>
                    <p>React, TypeScript, Vite, Framer Motion, TailwindCSS</p>
                  </div>
                  <div className="tech-item">
                    <div className="tech-icon"><Server /></div>
                    <h4>Backend</h4>
                    <p>Java Spring Boot, Microservices, Spring Security, JWT</p>
                  </div>
                  <div className="tech-item">
                    <div className="tech-icon"><Database /></div>
                    <h4>Database</h4>
                    <p>PostgreSQL, Redis (Caching), Flyway Migration</p>
                  </div>
                  <div className="tech-item">
                    <div className="tech-icon"><Cpu /></div>
                    <h4>AI & Cloud</h4>
                    <p>OpenAI API, Docker, AWS/Azure Deployment</p>
                  </div>
                </div>
              </div>

              {/* Business Model */}
              <div className="proposal-section">
                <h2 className="proposal-section-title"><Wallet size={32} /> Mô Hình Kinh Doanh</h2>
                <div className="business-model-container">
                  <div className="revenue-stream">
                    <h3>B2C (Business to Consumer)</h3>
                    <ul className="revenue-list">
                      <li><strong>Freemium:</strong> Miễn phí tính năng cơ bản.</li>
                      <li><strong>Subscription:</strong> Gói Premium (Tháng/Năm) cho AI nâng cao và Unlimited Chat.</li>
                      <li><strong>Virtual Goods:</strong> Bán Skin, Item trang trí cho Meowl Assistant.</li>
                      <li><strong>Course Sales:</strong> Phí tham gia các khóa học chuyên sâu.</li>
                    </ul>
                  </div>
                  <div className="revenue-stream">
                    <h3>B2B (Business to Business)</h3>
                    <ul className="revenue-list">
                      <li><strong>Recruitment Fee:</strong> Phí đăng tin tuyển dụng và xem hồ sơ ứng viên cao cấp.</li>
                      <li><strong>Commission:</strong> Phí hoa hồng từ các buổi Booking Mentor thành công (10-20%).</li>
                      <li><strong>Partnership:</strong> Hợp tác đào tạo với các trung tâm và trường học.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : activeData && (
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="user-guide-section"
            >
              <div className="user-guide-section-header">
                <div className="user-guide-feature-icon" style={{ fontSize: '2rem', width: '64px', height: '64px' }}>
                  {activeData.icon}
                </div>
                <div>
                  <h2 className="user-guide-section-title">
                    {activeRole === 'guest' ? 'Bắt Đầu Hành Trình' : 
                     `Hướng Dẫn Cho ${activeData.title}`}
                  </h2>
                  <p style={{ color: '#94a3b8' }}>
                    {activeRole === 'guest' ? 'Làm theo các bước sau để gia nhập Skillverse' : 
                     'Các tính năng và quy trình làm việc chính'}
                  </p>
                </div>
              </div>

              <div className="user-guide-grid">
                {activeData.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.2 }}
                    className={`user-guide-feature-card ${feature.isPremium ? 'premium' : ''}`}
                  >
                    {feature.isPremium && (
                      <div className="premium-badge">
                        <Crown size={12} fill="#ffd700" /> Premium Feature
                      </div>
                    )}
                    <div className="user-guide-feature-icon">
                      {feature.icon}
                    </div>
                    <h4 className="user-guide-feature-title">{feature.title}</h4>
                    <p className="user-guide-feature-text">{feature.description}</p>
                    
                    {feature.steps && (
                      <ul style={{ 
                        listStyle: 'none', 
                        padding: 0, 
                        margin: '0 0 1.5rem 0', 
                        color: '#cbd5e1',
                        fontSize: '0.9rem'
                      }}>
                        {feature.steps.map((step, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ color: feature.isPremium ? '#ffd700' : '#8b5cf6', marginTop: '4px' }}>•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    )}

                    {feature.example && (
                      <div className="feature-example">
                        <strong>Ví dụ:</strong>
                        {feature.example}
                      </div>
                    )}

                    {isAuthenticated && feature.link ? (
                      <Link to={feature.link} className="user-guide-link-btn">
                        {feature.linkText || 'Truy Cập'} <ArrowRight size={16} />
                      </Link>
                    ) : (
                      !isAuthenticated && activeRole === 'guest' && feature.link ? (
                         <Link to={feature.link} className="user-guide-link-btn">
                          {feature.linkText || 'Truy Cập'} <ArrowRight size={16} />
                        </Link>
                      ) : feature.link ? (
                        <div className="user-guide-link-btn" style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: '#64748b' }}>
                          <Lock size={14} style={{ marginRight: '0.5rem' }} /> Đăng nhập để truy cập
                        </div>
                      ) : null
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
