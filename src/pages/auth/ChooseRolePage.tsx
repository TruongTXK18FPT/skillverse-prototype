import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Briefcase, Check } from 'lucide-react';
import '../../styles/ChooseRolePage.css';

// Import Meowl images
import meowlUser from '../../assets/space-role/meowl-user.png';
import meowlMentor from '../../assets/space-role/meowl-mentor.png';
import meowlBusiness from '../../assets/space-role/meowl-business.png';
import backgroundSpace from '../../assets/space-role/background-space.png';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  dialogText: string;
  image: string;
  route: string;
  icon: React.ElementType;
  color: string;
}

const ChooseRolePage = () => {
  const navigate = useNavigate();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles: RoleOption[] = [
    {
      id: 'user',
      title: 'Người Học',
      description: 'Bắt đầu hành trình học tập của bạn',
      dialogText: 'Nếu bạn là người học, hãy chọn tôi!',
      image: meowlUser,
      route: '/register',
      icon: User,
      color: '#4dabf7'
    },
    {
      id: 'mentor',
      title: 'Người Dạy',
      description: 'Chia sẻ kiến thức và kinh nghiệm',
      dialogText: 'Nếu bạn là người dạy học, hãy chọn tôi!',
      image: meowlMentor,
      route: '/register/mentor',
      icon: GraduationCap,
      color: '#ffd43b'
    },
    {
      id: 'business',
      title: 'Nhà Tuyển Dụng',
      description: 'Tìm kiếm nhân tài xuất sắc',
      dialogText: 'Nếu bạn là nhà tuyển dụng, hãy chọn tôi!',
      image: meowlBusiness,
      route: '/register/business',
      icon: Briefcase,
      color: '#ff6b6b'
    }
  ];

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role.id);
    setTimeout(() => {
      navigate(role.route);
    }, 300);
  };

  return (
    <div 
      className="choose-role-page"
      style={{ backgroundImage: `url(${backgroundSpace})` }}
    >
      <div className="choose-role-overlay"></div>
      
      <div className="choose-role-container">
        {/* Header */}
        <div className="choose-role-header">
          <h1 className="choose-role-title">Chào Mừng Đến Với SkillVerse</h1>
          <p className="choose-role-subtitle">
            Hãy chọn vai trò của bạn
          </p>
        </div>

        {/* Role Cards */}
        <div className="role-cards-grid">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`role-card ${hoveredRole === role.id ? 'hovered' : ''} ${selectedRole === role.id ? 'selected' : ''}`}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => handleRoleSelect(role)}
              style={{ '--role-color': role.color } as React.CSSProperties}
            >
              {/* Meowl Image */}
              <div className="choose-role-meowl-wrapper">
                <img 
                  src={role.image} 
                  alt={role.title}
                  className="choose-role-meowl-character"
                />
              </div>

              {/* Dialog Bubble */}
              <div className={`choose-role-speech-bubble ${hoveredRole === role.id ? 'visible' : ''}`}>
                <div className="choose-role-speech-content">
                  <p className="choose-role-speech-text">{role.dialogText}</p>
                </div>
                <div className="choose-role-speech-tail"></div>
              </div>

              {/* Role Badge */}
              <div className="choose-role-badge" style={{ '--badge-color': role.color } as React.CSSProperties}>
                <span className="choose-role-badge-text">{role.title}</span>
                {selectedRole === role.id && (
                  <div className="choose-role-checkmark">
                    <Check size={24} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="role-card-content">
                <p className="choose-role-card-description">{role.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="cosmic-stars">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChooseRolePage;
