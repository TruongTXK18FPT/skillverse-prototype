import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  MessageSquare,
  CreditCard,
  Star,
  AlertCircle,
  ChevronDown,
  Briefcase,
  Scale,
  ShieldAlert,
  Lock,
} from "lucide-react";
import {
  notificationService,
  Notification,
} from "../../services/notificationService";
import { formatNotificationDisplay } from "../../utils/notificationDisplay";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/NotificationDropdown.css";

type Props = { inline?: boolean; collapsible?: boolean };
const LEARNER_ROLES = ["USER", "LEARNER", "STUDENT", "CANDIDATE"];

const NotificationDropdown: React.FC<Props> = ({ inline, collapsible }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inlineOpen, setInlineOpen] = useState<boolean>(!collapsible);
  interface RecentChat {
    mentorId: string;
    mentorName: string;
    mentorAvatar: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
  }
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  type NotificationTarget = {
    pathname: string;
    state?: Record<string, unknown>;
  };

  const getUserRoles = (): string[] =>
    Array.isArray(user?.roles)
      ? user.roles.map((role) => role.toUpperCase())
      : [];

  const hasAnyRole = (roles: string[]): boolean => {
    const userRoles = getUserRoles();
    return roles.some((role) => userRoles.includes(role));
  };

  const isAdminUser = (): boolean => {
    const roles = getUserRoles();
    return (
      roles.includes("ADMIN") || roles.some((role) => role.endsWith("_ADMIN"))
    );
  };

  const isMentorUser = (): boolean => hasAnyRole(["MENTOR"]);
  const isRecruiterUser = (): boolean => hasAnyRole(["RECRUITER"]);
  const isLearnerUser = (): boolean =>
    hasAnyRole(LEARNER_ROLES) &&
    !isMentorUser() &&
    !isRecruiterUser() &&
    !isAdminUser() &&
    !hasAnyRole(["PARENT"]);

  const buildBusinessTarget = (
    activeSection:
      | "overview"
      | "fulltime"
      | "shortterm"
      | "candidates"
      | "seminar" = "overview",
  ): NotificationTarget => ({
    pathname: "/business",
    state: { activeSection },
  });

  const buildJobLabTarget = ({
    viewMode = "applications",
    jobType = "ALL",
    selectedApplicationId,
    applicationType,
  }: {
    viewMode?:
      | "dashboard"
      | "applications"
      | "workspace"
      | "contracts"
      | "interviews"
      | "offers"
      | "disputes";
    jobType?: "ALL" | "REGULAR" | "SHORT_TERM";
    selectedApplicationId?: string;
    applicationType?: "REGULAR" | "SHORT_TERM";
  } = {}): NotificationTarget => ({
    pathname: "/my-applications",
    state: {
      viewMode,
      jobType,
      selectedApplicationId,
      applicationType,
    },
  });

  const buildContractTarget = (
    relatedId: string,
    type: string,
  ): NotificationTarget => {
    if (!relatedId) {
      return isRecruiterUser()
        ? { pathname: "/business/contracts" }
        : { pathname: "/my-contracts" };
    }

    if (type === "CONTRACT_SENT_FOR_SIGNATURE" && isLearnerUser()) {
      return { pathname: `/contracts/${relatedId}/sign` };
    }

    return isRecruiterUser()
      ? { pathname: `/business/contracts/${relatedId}` }
      : { pathname: `/contracts/${relatedId}` };
  };

  const getNotificationTarget = (
    notification: Notification,
  ): NotificationTarget => {
    const normalizedMessage =
      `${notification.title} ${notification.message}`.toLowerCase();

    switch (notification.type) {
      case "LIKE":
      case "COMMENT":
        return { pathname: `/community/${notification.relatedId}` };
      case "PRECHAT_MESSAGE":
      case "PRECHAT_NEW_MESSAGE":
        return {
          pathname: "/messages",
          state: {
            openChatWith: notification.relatedId,
            bookingId: notification.relatedId,
            type: "MENTOR",
          },
        };
      case "RECRUITMENT_MESSAGE":
        return {
          pathname: "/messages",
          state: {
            openChatWith: notification.relatedId,
            type: "RECRUITMENT",
          },
        };
      case "PREMIUM_PURCHASE":
      case "PREMIUM_EXPIRATION":
      case "PREMIUM_CANCEL":
      case "AUTO_RENEWAL_DISABLED":
      case "AUTO_RENEWAL_ENABLED":
        return { pathname: "/premium" };
      case "WALLET_DEPOSIT":
      case "COIN_PURCHASE":
      case "WITHDRAWAL_APPROVED":
      case "WITHDRAWAL_REJECTED":
      case "ESCROW_FUNDED":
      case "ESCROW_RELEASED":
        return { pathname: "/my-wallet" };
      case "ESCROW_REFUNDED":
      case "REVIEW_WINDOW_EXPIRING":
        return isRecruiterUser()
          ? buildBusinessTarget("shortterm")
          : { pathname: "/my-wallet" };
      case "BOOKING_CREATED":
      case "BOOKING_CONFIRMED":
      case "BOOKING_REJECTED":
      case "BOOKING_REMINDER":
      case "BOOKING_COMPLETED":
      case "BOOKING_CANCELLED":
      case "BOOKING_REFUND":
      case "BOOKING_STARTED":
      case "BOOKING_MENTOR_COMPLETED":
      case "ROADMAP_FOLLOW_UP_MEETING_CREATED":
        return notification.relatedId
          ? { pathname: `/bookings/${notification.relatedId}` }
          : isMentorUser()
            ? { pathname: "/mentor" }
            : { pathname: "/my-bookings" };
      case "MENTOR_REVIEW_RECEIVED":
      case "MENTOR_LEVEL_UP":
      case "MENTOR_BADGE_AWARDED":
        return { pathname: "/mentor" };
      case "TASK_DEADLINE":
      case "TASK_OVERDUE":
      case "TASK_REVIEW":
        return { pathname: "/study-planner" };
      case "ASSIGNMENT_SUBMITTED":
        return isMentorUser() || isAdminUser()
          ? { pathname: "/mentor" }
          : { pathname: "/courses" };
      case "ASSIGNMENT_GRADED":
      case "ASSIGNMENT_LATE":
      case "COURSE_REJECTED":
      case "COURSE_SUSPENDED":
      case "COURSE_RESTORED":
        return isMentorUser() || isAdminUser()
          ? { pathname: "/mentor" }
          : { pathname: "/courses" };
      case "DISPUTE_ELIGIBILITY_UNLOCKED":
        return buildJobLabTarget({
          viewMode: "workspace",
          jobType: "SHORT_TERM",
          selectedApplicationId: notification.relatedId,
          applicationType: "SHORT_TERM",
        });
      case "ADMIN_DISPUTE_ESCALATED":
        return { pathname: "/admin" };
      case "DISPUTE_OPENED":
        if (isRecruiterUser()) return buildBusinessTarget("shortterm");
        if (isMentorUser()) return { pathname: "/mentor" };
        return { pathname: "/my-bookings" };
      case "DISPUTE_RESOLVED":
        if (isRecruiterUser()) return buildBusinessTarget("shortterm");
        if (isMentorUser()) return { pathname: "/mentor" };
        if (!isLearnerUser()) return { pathname: "/notifications" };
        return normalizedMessage.includes("job") ||
          normalizedMessage.includes("công việc") ||
          normalizedMessage.includes("outcome") ||
          normalizedMessage.includes("one of your jobs")
          ? buildJobLabTarget({
              viewMode: "disputes",
              jobType: "SHORT_TERM",
              applicationType: "SHORT_TERM",
            })
          : { pathname: "/my-bookings" };
      case "JOB_APPROVED":
      case "JOB_REJECTED":
      case "JOB_DELETED":
      case "JOB_BANNED":
      case "JOB_UNBANNED":
      case "SHORT_TERM_APPLICATION_SUBMITTED":
      case "SHORT_TERM_WORK_SUBMITTED":
      case "RECRUITER_AUTO_APPROVED_WARNING":
        return buildBusinessTarget("shortterm");
      case "SHORT_TERM_APPLICATION_ACCEPTED":
        return buildJobLabTarget({
          viewMode: "workspace",
          jobType: "SHORT_TERM",
          selectedApplicationId: notification.relatedId,
          applicationType: "SHORT_TERM",
        });
      case "SHORT_TERM_APPLICATION_REJECTED":
        return buildJobLabTarget({
          viewMode: "applications",
          jobType: "SHORT_TERM",
          selectedApplicationId: notification.relatedId,
          applicationType: "SHORT_TERM",
        });
      case "SHORT_TERM_WORK_APPROVED":
      case "WORKER_AUTO_APPROVED":
        return buildJobLabTarget({
          viewMode: "workspace",
          jobType: "SHORT_TERM",
          selectedApplicationId: notification.relatedId,
          applicationType: "SHORT_TERM",
        });
      case "FULLTIME_APPLICATION_REVIEWED":
      case "FULLTIME_APPLICATION_ACCEPTED":
      case "FULLTIME_APPLICATION_REJECTED":
        return buildJobLabTarget({
          viewMode: "applications",
          jobType: "REGULAR",
          selectedApplicationId: notification.relatedId,
          applicationType: "REGULAR",
        });
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEW_COMPLETED":
        return isRecruiterUser()
          ? buildBusinessTarget("fulltime")
          : buildJobLabTarget({
              viewMode: "interviews",
              jobType: "REGULAR",
              selectedApplicationId: notification.relatedId,
              applicationType: "REGULAR",
            });
      case "OFFER_SENT":
      case "OFFER_ACCEPTED":
      case "OFFER_REJECTED":
        return isRecruiterUser()
          ? buildBusinessTarget("fulltime")
          : buildJobLabTarget({
              viewMode: "offers",
              jobType: "REGULAR",
              selectedApplicationId: notification.relatedId,
              applicationType: "REGULAR",
            });
      case "WORKER_CANCELLATION_REQUESTED":
        return isRecruiterUser()
          ? buildBusinessTarget("shortterm")
          : buildJobLabTarget({
              viewMode: "disputes",
              jobType: "SHORT_TERM",
              applicationType: "SHORT_TERM",
            });
      case "WORKER_AUTO_CANCELLED":
      case "WORKER_CANCELLATION_REJECTED":
        return isRecruiterUser()
          ? buildBusinessTarget("shortterm")
          : buildJobLabTarget({
              viewMode: "applications",
              jobType: "SHORT_TERM",
              applicationType: "SHORT_TERM",
            });
      case "ADMIN_CANCELLATION_REJECTED":
        return isRecruiterUser()
          ? buildBusinessTarget("shortterm")
          : buildJobLabTarget({
              viewMode: "applications",
              jobType: "SHORT_TERM",
              applicationType: "SHORT_TERM",
            });
      case "CONTRACT_SENT_FOR_SIGNATURE":
      case "CONTRACT_SIGNED":
      case "CONTRACT_REJECTED":
      case "CONTRACT_CANCELLED":
      case "CONTRACT_EXPIRED":
        return buildContractTarget(notification.relatedId, notification.type);
      case "VIOLATION_REPORT":
        return { pathname: "/my-reports" };
      case "WELCOME":
        return { pathname: "/dashboard" };
      case "SYSTEM":
      case "WARNING":
      default:
        return { pathname: "/notifications" };
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getUserNotifications(0, 10);
      setNotifications(data.content);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentChats = () => {
    try {
      const stored = localStorage.getItem("recent_chats");
      if (stored) {
        setRecentChats(JSON.parse(stored));
      } else {
        setRecentChats([]);
      }
    } catch (error) {
      console.error("Failed to load chats", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for unread count every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (inline) {
      fetchNotifications();
      fetchRecentChats();
    }
  }, [inline]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
      fetchRecentChats();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);

      // Trigger event for Header to update its unread count
      window.dispatchEvent(
        new CustomEvent("notification:read", {
          detail: { unreadCount: newCount },
        }),
      );
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Trigger event for Header to update its unread count
      window.dispatchEvent(
        new CustomEvent("notification:read", { detail: { unreadCount: 0 } }),
      );
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id, {
        stopPropagation: () => {},
      } as React.MouseEvent);
    }

    const target = getNotificationTarget(notification);
    if (target.state) {
      navigate(target.pathname, { state: target.state });
    } else {
      navigate(target.pathname);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE":
      case "COMMENT":
        return (
          <MessageSquare size={16} className="notification-icon-community" />
        );
      case "PRECHAT_NEW_MESSAGE":
        return (
          <MessageSquare size={16} className="notification-icon-community" />
        );
      case "RECRUITMENT_MESSAGE":
        return <Briefcase size={16} className="notification-icon-community" />;
      case "PREMIUM_PURCHASE":
      case "PREMIUM_EXPIRATION":
        return <Star size={16} className="notification-icon-premium" />;
      case "WALLET_DEPOSIT":
      case "COIN_PURCHASE":
        return <CreditCard size={16} className="notification-icon-payment" />;
      case "WITHDRAWAL_APPROVED":
        return <Check size={16} className="notification-icon-payment" />;
      case "WITHDRAWAL_REJECTED":
        return (
          <AlertCircle
            size={16}
            className="notification-icon-info"
            style={{ color: "#ef4444" }}
          />
        );
      case "DISPUTE_OPENED":
        return (
          <AlertCircle size={16} className="notification-icon-dispute-open" />
        );
      case "DISPUTE_RESOLVED":
        return (
          <Scale size={16} className="notification-icon-dispute-resolved" />
        );
      case "ADMIN_DISPUTE_ESCALATED":
        return (
          <ShieldAlert
            size={16}
            className="notification-icon-dispute-escalated"
          />
        );
      case "WORKER_CANCELLATION_REQUESTED":
      case "ADMIN_CANCELLATION_REJECTED":
      case "WORKER_CANCELLATION_REJECTED":
        return (
          <AlertCircle
            size={16}
            className="notification-icon-dispute-escalated"
          />
        );
      case "DISPUTE_ELIGIBILITY_UNLOCKED":
        return (
          <Lock size={16} className="notification-icon-dispute-eligible" />
        );
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEW_COMPLETED":
      case "OFFER_SENT":
      case "OFFER_ACCEPTED":
      case "OFFER_REJECTED":
        return <Briefcase size={16} className="notification-icon-community" />;
      case "WELCOME":
        return <Info size={16} className="notification-icon-info" />;
      default:
        return <Info size={16} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    return date.toLocaleDateString("vi-VN");
  };

  if (inline) {
    return (
      <div
        className={`notification-inline ${inlineOpen ? "" : "collapsed"}`}
        ref={dropdownRef}
      >
        <div className="inline-header">
          <button
            className="inline-toggle"
            onClick={() => {
              setInlineOpen((v) => !v);
              if (!inlineOpen) {
                fetchNotifications();
                fetchRecentChats();
              }
            }}
          >
            <div className="inline-header-left">
              <Bell size={16} />
              <span>Thông báo</span>
            </div>
            <div className="inline-header-right">
              {unreadCount > 0 && (
                <span className="notification-badge inline-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`inline-chevron ${inlineOpen ? "open" : ""}`}
              />
            </div>
          </button>

          <button
            type="button"
            className="mark-all-read inline-mark-all"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck size={14} />
            <span>Đánh dấu đã đọc</span>
          </button>
        </div>

        <div className="inline-divider" />

        <div className="notification-list compact">
          {recentChats
            .filter((c) => c.unread > 0)
            .slice(0, 2)
            .map((chat) => (
              <div
                key={`prechat-${chat.mentorId}`}
                className="notification-item unread"
                onClick={() => navigate("/messages")}
              >
                <div className="notification-icon-wrapper">
                  <img
                    src={chat.mentorAvatar}
                    alt={chat.mentorName}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div className="notification-content">
                  <p className="notification-title">Tin nhắn prechat mới</p>
                  <p className="notification-message truncate">
                    {chat.mentorName}: {chat.lastMessage}
                  </p>
                  <span className="notification-time">
                    {formatTime(chat.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          {loading ? (
            <div className="notification-loading">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">Không có thông báo</div>
          ) : (
            notifications.slice(0, 3).map((notification) => {
              const display = formatNotificationDisplay(notification);

              return (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-wrapper">
                    {notification.senderAvatar ? (
                      <img
                        src={notification.senderAvatar}
                        alt={notification.senderName || "User"}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      getIcon(notification.type)
                    )}
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{display.title}</p>
                    <p
                      className={`notification-message ${display.isDispute ? "notification-message--dispute" : ""}`}
                    >
                      {notification.senderName && (
                        <span
                          style={{ fontWeight: "bold", marginRight: "4px" }}
                        >
                          {notification.senderName}
                        </span>
                      )}
                      {display.message}
                    </p>
                    {display.disputeOutcomeLabel && (
                      <span
                        className={`notification-dispute-pill notification-dispute-pill--${display.disputeOutcomeTone || "neutral"}`}
                      >
                        Kết quả: {display.disputeOutcomeLabel}
                      </span>
                    )}
                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <button
                      className="mark-read-btn"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      title="Đánh dấu đã đọc"
                    >
                      <div className="unread-dot"></div>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="notification-footer">
          <button onClick={() => navigate("/notifications")}>Xem tất cả</button>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="notification-trigger" onClick={handleToggle}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            <button className="mark-all-read" onClick={handleMarkAllAsRead}>
              <CheckCheck size={14} />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          </div>

          <div className="notification-list">
            {recentChats
              .filter((c) => c.unread > 0)
              .map((chat) => (
                <div
                  key={`prechat-${chat.mentorId}`}
                  className="notification-item unread"
                  onClick={() => navigate("/messages")}
                >
                  <div className="notification-icon-wrapper">
                    <img
                      src={chat.mentorAvatar}
                      alt={chat.mentorName}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">Tin nhắn prechat mới</p>
                    <p className="notification-message truncate">
                      {chat.mentorName}: {chat.lastMessage}
                    </p>
                    <span className="notification-time">
                      {formatTime(chat.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            {loading ? (
              <div className="notification-loading">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">Không có thông báo nào</div>
            ) : (
              notifications.map((notification) => {
                const display = formatNotificationDisplay(notification);

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon-wrapper">
                      {notification.senderAvatar ? (
                        <img
                          src={notification.senderAvatar}
                          alt={notification.senderName || "User"}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        getIcon(notification.type)
                      )}
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">{display.title}</p>
                      <p
                        className={`notification-message ${display.isDispute ? "notification-message--dispute" : ""}`}
                      >
                        {notification.senderName && (
                          <span
                            style={{ fontWeight: "bold", marginRight: "4px" }}
                          >
                            {notification.senderName}
                          </span>
                        )}
                        {display.message}
                      </p>
                      {display.disputeOutcomeLabel && (
                        <span
                          className={`notification-dispute-pill notification-dispute-pill--${display.disputeOutcomeTone || "neutral"}`}
                        >
                          Kết quả: {display.disputeOutcomeLabel}
                        </span>
                      )}
                      <span className="notification-time">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        title="Đánh dấu đã đọc"
                      >
                        <div className="unread-dot"></div>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="notification-footer">
            <button onClick={() => navigate("/notifications")}>
              Xem tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
