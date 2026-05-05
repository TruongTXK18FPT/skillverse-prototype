import React from "react";
import {
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  Bell,
  AlertTriangle,
  CreditCard,
  Banknote,
  Crown,
  Ticket,
  Brain,
  LibraryBig,
  MessageSquare,
  Briefcase,
  Shirt,
  Image,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  ListChecks,
  Route,
  ShieldCheck,
  Activity,
} from "lucide-react";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRoles: string[];
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  userRoles,
  isCollapsed,
  setIsCollapsed,
}) => {
  const allGroups = [
    {
      label: "HỆ THỐNG",
      items: [
        {
          id: "analytics",
          label: "Thống Kê",
          icon: BarChart3,
          allowedRoles: ["ADMIN"],
        },
        {
          id: "notifications",
          label: "Thông Báo",
          icon: Bell,
          allowedRoles: ["SUPPORT_ADMIN", "ADMIN"],
        },
      ],
    },
    {
      label: "NGƯỜI DÙNG",
      items: [
        {
          id: "users",
          label: "Người Dùng",
          icon: Users,
          allowedRoles: ["USER_ADMIN", "ADMIN"],
        },
        {
          id: "verification",
          label: "Xác Thực Account",
          icon: UserCheck,
          allowedRoles: ["USER_ADMIN", "ADMIN"],
        },
        {
          id: "mentor-skills",
          label: "Duyệt Skill Mentor",
          icon: ShieldCheck,
          allowedRoles: ["USER_ADMIN", "ADMIN"],
        },
      ],
    },
    {
      label: "NỘI DUNG",
      items: [
        {
          id: "courses",
          label: "Quản Lý Khóa Học",
          icon: BookOpen,
          allowedRoles: ["CONTENT_ADMIN", "ADMIN"],
        },
        {
          id: "jobs",
          label: "Tuyển Dụng",
          icon: Briefcase,
          allowedRoles: ["CONTENT_ADMIN", "ADMIN"],
        },
        {
          id: "sliders",
          label: "Sliders",
          icon: Image,
          allowedRoles: ["CONTENT_ADMIN", "SYSTEM_ADMIN", "ADMIN"],
        },
      ],
    },
    {
      label: "CỘNG ĐỒNG",
      items: [
        {
          id: "community",
          label: "Cộng Đồng",
          icon: MessageSquare,
          allowedRoles: ["COMMUNITY_ADMIN", "ADMIN"],
        },
        {
          id: "reports",
          label: "Báo Cáo",
          icon: AlertTriangle,
          allowedRoles: [
            "COMMUNITY_ADMIN",
            "FINANCE_ADMIN",
            "USER_ADMIN",
            "ADMIN",
          ],
        },
        {
          id: "support",
          label: "Hỗ Trợ",
          icon: Ticket,
          allowedRoles: ["SUPPORT_ADMIN", "ADMIN"],
        },
      ],
    },
    {
      label: "TÀI CHÍNH",
      items: [
        {
          id: "payments",
          label: "Thanh Toán",
          icon: CreditCard,
          allowedRoles: ["FINANCE_ADMIN", "ADMIN"],
        },
        {
          id: "bookings",
          label: "Bookings",
          icon: Calendar,
          allowedRoles: ["FINANCE_ADMIN", "SUPPORT_ADMIN", "ADMIN"],
        },
        {
          id: "withdrawals",
          label: "Rút Tiền",
          icon: Banknote,
          allowedRoles: ["FINANCE_ADMIN", "ADMIN"],
        },
      ],
    },
    {
      label: "PREMIUM",
      items: [
        {
          id: "premium",
          label: "Gói Premium",
          icon: Crown,
          allowedRoles: ["PREMIUM_ADMIN", "ADMIN"],
        },
      ],
    },
    {
      label: "AI & TÀI NGUYÊN",
      items: [
        {
          id: "ai-experts",
          label: "Chuyên Gia AI",
          icon: Brain,
          allowedRoles: ["AI_ADMIN", "ADMIN"],
        },
                {
          id: "ai-knowledge",
          label: "Tài Liệu AI",
          icon: LibraryBig,
          allowedRoles: ["AI_ADMIN", "ADMIN"],
        },
        {
          id: "ai-token-usage",
          label: "Token AI",
          icon: Activity,
          allowedRoles: ["AI_ADMIN", "ADMIN"],
        },
        {
          id: "question-bank",
          label: "Ngân Hàng Câu Hỏi",
          icon: ListChecks,
          allowedRoles: ["AI_ADMIN", "ADMIN"],
        },
        {
          id: "journey-ops",
          label: "Lộ Trình",
          icon: Route,
          allowedRoles: ["AI_ADMIN", "ADMIN"],
        },
        {
          id: "skin-upload",
          label: "Quản lý Skin",
          icon: Shirt,
          allowedRoles: ["AI_ADMIN", "ADMIN"],
        },
      ],
    },
  ];

  const filteredGroups = allGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          userRoles.includes("ADMIN") ||
          item.allowedRoles.some((role) => userRoles.includes(role)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="admin-sidebar-header">
        {!isCollapsed && (
          <div className="admin-sidebar-logo">
            <Shield size={24} className="logo-icon" />
            <span>SYSTEM CORE</span>
          </div>
        )}
        <button
          className="admin-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="admin-sidebar-nav">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="admin-sidebar-group">
            {!isCollapsed && (
              <h4 className="admin-sidebar-group-label">{group.label}</h4>
            )}
            <div className="admin-sidebar-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    className={`admin-sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon size={20} className="item-icon" />
                    {!isCollapsed && (
                      <span className="item-label">{item.label}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="active-indicator" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-sidebar-footer">
        {!isCollapsed && (
          <div className="admin-status">
            <div className="status-dot-pulse" />
            <span>CORE ACTIVE</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
