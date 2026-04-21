import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CheckSquare,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Star,
  PenTool,
  Shield,
} from "lucide-react";
import "./MentorSidebar.css";

interface MentorSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  pendingGradingCount?: number;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  pendingGradingCount = 0,
}) => {
  type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
  };
  
  type NavGroup = {
    label: string;
    items: NavItem[];
  };

  const groups: NavGroup[] = [
    {
      label: "MAIN",
      items: [
        { id: "overview", label: "Bảng điều khiển", icon: LayoutDashboard },
      ],
    },
    {
      label: "TEACHING",
      items: [
        { id: "courses", label: "Quản lý khóa học", icon: BookOpen },
        { id: "schedule", label: "Lịch trình", icon: Calendar },
      ],
    },
    {
      label: "MENTORING",
      items: [
        { id: "bookings", label: "Quản lý booking", icon: Calendar },
        { id: "earnings", label: "Quản lý doanh thu", icon: DollarSign },
        { id: "reviews", label: "Đánh giá", icon: Star },
      ],
    },
    {
      label: "ACTIONS",
      items: [
        {
          id: "grading",
          label: "Chấm bài",
          icon: CheckSquare,
          badge: pendingGradingCount > 0 ? pendingGradingCount : undefined,
        },
      ],
    },
    {
      label: "SETTINGS",
      items: [
        { id: "certificate-settings", label: "Cài đặt chứng chỉ", icon: PenTool },
        { id: "verification", label: "Xác thực skill", icon: Shield },
      ],
    },
  ];

  return (
    <aside
      className={`mentor-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
    >
      <div className="mentor-sidebar__header">
        {!isCollapsed && (
          <span className="mentor-sidebar__logo">COMMAND BRIDGE</span>
        )}
        <button
          className="mentor-sidebar__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="mentor-sidebar__nav">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="mentor-sidebar__group">
            {!isCollapsed && (
              <h4 className="mentor-sidebar__group-label">{group.label}</h4>
            )}
            <div className="mentor-sidebar__items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`mentor-sidebar__item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon size={20} className="mentor-sidebar__item-icon" />
                    {!isCollapsed && (
                      <span className="mentor-sidebar__item-label">
                        {item.label}
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`mentor-sidebar__badge ${item.id === "grading" ? "badge--critical" : ""}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mentor-sidebar__footer">
        {!isCollapsed && (
          <div className="mentor-sidebar__user-mini">
            <div className="user-mini__status"></div>
            <span className="user-mini__text">SYSTEM ONLINE</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default MentorSidebar;
