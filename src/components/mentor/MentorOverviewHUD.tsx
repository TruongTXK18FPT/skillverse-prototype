import React, { useMemo, useState, useEffect } from "react";
import {
  Users,
  Star,
  DollarSign,
  Video,
  Clock,
  AlertCircle,
  ChevronRight,
  BarChart,
  Filter,
} from "lucide-react";
import walletService from "../../services/walletService";
import { WalletTransactionResponse } from "../../data/walletDTOs";
import {
  getMyMentorProfile,
} from "../../services/mentorProfileService";
import { getMyBookings, BookingResponse } from "../../services/bookingService";
import { getMyMentorReviewsPage, ReviewResponse } from "../../services/reviewService";
import { listCoursesByAuthor } from "../../services/courseService";
import { CourseSummaryDTO } from "../../data/courseDTOs";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import "./MentorOverviewHUD.css";

interface MentorOverviewHUDProps {
  onNavigate: (tab: string) => void;
  courseCount?: number;
}

interface MentorStats {
  totalStudents: number;
  rating: number;
  ratingCount: number;
  starDistribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  rangeEarnings: number;
  transactionCount: number;
  totalCourses: number;
  totalBookings: number;
  pendingGrading: number;
  pendingBookings: number;
}

type TimeFilterPreset = "THIS_MONTH" | "LAST_7_DAYS" | "CUSTOM" | "ALL_TIME";

interface DateRange {
  start: Date;
  end: Date;
}

const MentorOverviewHUD: React.FC<MentorOverviewHUDProps> = ({
  onNavigate,
  courseCount: _courseCount,
}) => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [timePreset, setTimePreset] = useState<TimeFilterPreset>("THIS_MONTH");
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([]);
  const [latestTransactions, setLatestTransactions] = useState<WalletTransactionResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [stats, setStats] = useState<MentorStats>({
    totalStudents: 0,
    rating: 0,
    ratingCount: 0,
    starDistribution: {
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    },
    rangeEarnings: 0,
    transactionCount: 0,
    totalCourses: 0,
    totalBookings: 0,
    pendingGrading: 0,
    pendingBookings: 0,
  });
  useEffect(() => {
    loadMentorOverview();
  }, [user?.id]);

  const parseDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const normalizeStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const normalizeEndOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const effectiveDateRange = useMemo<DateRange>(() => {
    const now = new Date();

    if (timePreset === "ALL_TIME") {
      return {
        start: new Date(1970, 0, 1),
        end: normalizeEndOfDay(now),
      };
    }

    if (timePreset === "LAST_7_DAYS") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return {
        start: normalizeStartOfDay(start),
        end: normalizeEndOfDay(now),
      };
    }

    if (timePreset === "CUSTOM" && customFromDate && customToDate) {
      const from = new Date(customFromDate);
      const to = new Date(customToDate);
      const startDate = from <= to ? from : to;
      const endDate = from <= to ? to : from;
      return {
        start: normalizeStartOfDay(startDate),
        end: normalizeEndOfDay(endDate),
      };
    }

    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: normalizeStartOfDay(start),
      end: normalizeEndOfDay(now),
    };
  }, [timePreset, customFromDate, customToDate]);

  const inRange = (dateLike?: string | null) => {
    const parsed = parseDate(dateLike);
    if (!parsed) return false;
    return parsed >= effectiveDateRange.start && parsed <= effectiveDateRange.end;
  };

  const periodLabel = useMemo(() => {
    if (timePreset === "ALL_TIME") return "Tất cả";
    if (timePreset === "LAST_7_DAYS") return "7 ngày qua";
    if (timePreset === "CUSTOM") return "Tùy chỉnh";
    return "Tháng này";
  }, [timePreset]);

  useEffect(() => {
    const filteredBookings = bookings.filter((booking) => inRange(booking.startTime));
    const filteredCourses = courses.filter((course) => inRange(course.createdAt));
    const filteredReviews = reviews.filter((review) => inRange(review.createdAt));
    const filteredTransactions = transactions.filter((tx) => inRange(tx.createdAt));

    const studentIds = new Set<number>();
    filteredBookings.forEach((booking) => {
      if (typeof booking.learnerId === "number") {
        studentIds.add(booking.learnerId);
      }
    });

    filteredReviews.forEach((review) => {
      if (typeof review.learnerId === "number") {
        studentIds.add(review.learnerId);
      }
    });

    const ratingCount = filteredReviews.length;
    const totalRatingPoint = filteredReviews.reduce(
      (sum, review) => sum + (review.rating || 0),
      0,
    );
    const rating = ratingCount > 0 ? totalRatingPoint / ratingCount : 0;

    const fiveStar = filteredReviews.filter((review) => review.rating === 5).length;
    const fourStar = filteredReviews.filter((review) => review.rating === 4).length;
    const threeStar = filteredReviews.filter((review) => review.rating === 3).length;
    const twoStar = filteredReviews.filter((review) => review.rating === 2).length;
    const oneStar = filteredReviews.filter((review) => review.rating === 1).length;

    const EARNING_TYPE_KEYWORDS = [
      "MENTOR_BOOKING",
      "EARN_FROM_SESSION",
      "SEMINAR_PAYOUT",
      "EARN_FROM_COURSE",
      "COURSE_PAYOUT",
      "JOB_PAYOUT",
    ];

    const earningsTransactions = filteredTransactions.filter((tx) => {
      const normalizedType = (tx.transactionType || "").toUpperCase();
      const normalizedTypeName = (tx.transactionTypeName || "").toLowerCase();
      const normalizedDescription = (tx.description || "").toLowerCase();
      const isCompletedLike =
        !tx.status || tx.status === "COMPLETED" || tx.status === "PROCESSING";
      const isCashIncomeType = EARNING_TYPE_KEYWORDS.some((keyword) =>
        normalizedType.includes(keyword),
      );
      const isIncomeByText =
        normalizedTypeName.includes("thu nhập") ||
        normalizedDescription.includes("thu nhập") ||
        normalizedDescription.includes("mentoring");
      const isCreditIncome = Boolean(tx.isCredit) && (tx.cashAmount || 0) > 0;

      const isIncomeTransaction =
        isCashIncomeType || isIncomeByText || isCreditIncome;

      return isCompletedLike && isIncomeTransaction;
    });

    const rangeEarnings = earningsTransactions.reduce(
      (sum, tx) => sum + Math.max(0, tx.cashAmount || 0),
      0,
    );

    const pendingBookings = filteredBookings.filter(
      (booking) => booking.status === "PENDING",
    ).length;

    const latest = [...filteredTransactions]
      .sort((a, b) => {
        const aTime = parseDate(a.createdAt)?.getTime() || 0;
        const bTime = parseDate(b.createdAt)?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    setStats({
      totalStudents: studentIds.size,
      rating,
      ratingCount,
      starDistribution: {
        fiveStar,
        fourStar,
        threeStar,
        twoStar,
        oneStar,
      },
      rangeEarnings,
      transactionCount: filteredTransactions.length,
      totalCourses: filteredCourses.length,
      totalBookings: filteredBookings.length,
      pendingGrading: 0,
      pendingBookings,
    });

    setLatestTransactions(latest);
  }, [bookings, courses, reviews, transactions, effectiveDateRange]);

  const loadMentorOverview = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await getMyMentorProfile();

      const fetchAllCourses = async () => {
        let page = 0;
        let total = 1;
        const merged: CourseSummaryDTO[] = [];
        do {
          const response = await listCoursesByAuthor(user.id, page, 100);
          merged.push(...(response.content || []));
          total = response.totalPages || 1;
          page += 1;
        } while (page < total);
        return merged;
      };

      const fetchAllTransactions = async () => {
        let page = 0;
        let total = 1;
        const merged: WalletTransactionResponse[] = [];
        do {
          const response = await walletService.getTransactions(page, 100);
          merged.push(...(response.content || []));
          total = response.totalPages || 1;
          page += 1;
        } while (page < total);
        return merged;
      };

      const fetchAllBookings = async () => {
        let page = 0;
        let total = 1;
        const merged: BookingResponse[] = [];
        do {
          const response = await getMyBookings(true, page, 100);
          merged.push(...(response.content || []));
          total = response.totalPages || 1;
          page += 1;
        } while (page < total);
        return merged;
      };

      const fetchAllReviews = async () => {
        let page = 0;
        let total = 1;
        const merged: ReviewResponse[] = [];
        do {
          const response = await getMyMentorReviewsPage(page, 100, null, "createdAt,desc");
          merged.push(...(response.content || []));
          total = response.totalPages || 1;
          page += 1;
        } while (page < total);
        return merged;
      };

      const [allCourses, allTransactions, allBookings, allReviews] = await Promise.all([
        fetchAllCourses(),
        fetchAllTransactions(),
        fetchAllBookings().catch(() => []),
        fetchAllReviews().catch(() => []),
      ]);

      setCourses(allCourses);
      setTransactions(allTransactions);
      setBookings(allBookings);
      setReviews(allReviews);
    } catch (error) {
      console.error("Error loading mentor overview:", error);
      showError("Lỗi", "Không thể tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString?: string | null) => {
    const parsed = parseDate(dateString);
    if (!parsed) return "--";
    return parsed.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionStatusLabel = (status?: string | null) => {
    switch ((status || "").toUpperCase()) {
      case "COMPLETED":
        return "Hoàn thành";
      case "PENDING":
        return "Đang xử lý";
      case "PROCESSING":
        return "Đang xử lý";
      case "FAILED":
        return "Thất bại";
      default:
        return status || "--";
    }
  };

  const getTransactionStatusClass = (status?: string | null) => {
    switch ((status || "").toUpperCase()) {
      case "COMPLETED":
        return "is-completed";
      case "PENDING":
      case "PROCESSING":
        return "is-processing";
      case "FAILED":
        return "is-failed";
      default:
        return "";
    }
  };

  return (
    <div className="mentor-overview">
      {loading ? (
        <div className="loading-state">
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <div className="mentor-overview__toolbar">
            <div className="mentor-overview__toolbar-title">
              <Filter size={16} className="icon--cyan" />
              <span>BỘ LỌC THỜI GIAN TỔNG QUÁT</span>
            </div>
            <div className="mentor-overview__time-filter-group">
              <select
                className="mentor-overview__time-select"
                value={timePreset}
                onChange={(e) => setTimePreset(e.target.value as TimeFilterPreset)}
              >
                <option value="ALL_TIME">Tất cả</option>
                <option value="THIS_MONTH">Tháng này</option>
                <option value="LAST_7_DAYS">7 ngày qua</option>
                <option value="CUSTOM">Tùy chỉnh</option>
              </select>

              {timePreset === "CUSTOM" && (
                <div className="mentor-overview__custom-date-wrap">
                  <input
                    type="date"
                    className="mentor-overview__date-input"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                  />
                  <span>đến</span>
                  <input
                    type="date"
                    className="mentor-overview__date-input"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mentor-overview__grid mentor-overview__grid--summary">
            {/* Stats Summary */}
            <div className="mentor-overview__card mentor-overview__stats-summary-card">
              <div className="mentor-overview__card-header">
                <BarChart size={18} className="icon--yellow" />
                <span>THỐNG KÊ TỔNG QUAN • {periodLabel.toUpperCase()}</span>
              </div>
              <div className="mentor-overview__card-body">
                {/* Review Stats */}
                <div className="mentor-overview__stat-section">
                  <div className="mentor-overview__section-headline">
                    <h4 className="mentor-overview__stat-section-title">Đánh giá</h4>
                    <button
                      className="mentor-overview__detail-link"
                      onClick={() => onNavigate("reviews")}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                  <div className="mentor-overview__rating-overview">
                    <div className="mentor-overview__rating-score">
                      <Star size={32} fill="#FFD700" color="#FFD700" />
                      <div className="mentor-overview__rating-value">
                        <span className="mentor-overview__rating-number">
                          {stats.rating.toFixed(1)}
                        </span>
                        <span className="mentor-overview__rating-count">
                          ({stats.ratingCount} đánh giá)
                        </span>
                      </div>
                    </div>
                    <div className="mentor-overview__star-distribution">
                      <div className="mentor-overview__star-bar">
                        <span className="mentor-overview__star-label">5★</span>
                        <div className="mentor-overview__bar-container">
                          <div
                            className="mentor-overview__bar-fill"
                            style={{
                              width: `${stats.ratingCount > 0 ? (stats.starDistribution.fiveStar / stats.ratingCount) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="mentor-overview__star-count">
                          {stats.starDistribution.fiveStar}
                        </span>
                      </div>
                      <div className="mentor-overview__star-bar">
                        <span className="mentor-overview__star-label">4★</span>
                        <div className="mentor-overview__bar-container">
                          <div
                            className="mentor-overview__bar-fill"
                            style={{
                              width: `${stats.ratingCount > 0 ? (stats.starDistribution.fourStar / stats.ratingCount) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="mentor-overview__star-count">
                          {stats.starDistribution.fourStar}
                        </span>
                      </div>
                      <div className="mentor-overview__star-bar">
                        <span className="mentor-overview__star-label">3★</span>
                        <div className="mentor-overview__bar-container">
                          <div
                            className="mentor-overview__bar-fill"
                            style={{
                              width: `${stats.ratingCount > 0 ? (stats.starDistribution.threeStar / stats.ratingCount) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="mentor-overview__star-count">
                          {stats.starDistribution.threeStar}
                        </span>
                      </div>
                      <div className="mentor-overview__star-bar">
                        <span className="mentor-overview__star-label">2★</span>
                        <div className="mentor-overview__bar-container">
                          <div
                            className="mentor-overview__bar-fill"
                            style={{
                              width: `${stats.ratingCount > 0 ? (stats.starDistribution.twoStar / stats.ratingCount) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="mentor-overview__star-count">
                          {stats.starDistribution.twoStar}
                        </span>
                      </div>
                      <div className="mentor-overview__star-bar">
                        <span className="mentor-overview__star-label">1★</span>
                        <div className="mentor-overview__bar-container">
                          <div
                            className="mentor-overview__bar-fill"
                            style={{
                              width: `${stats.ratingCount > 0 ? (stats.starDistribution.oneStar / stats.ratingCount) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="mentor-overview__star-count">
                          {stats.starDistribution.oneStar}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Stats */}
                <div className="mentor-overview__stat-section">
                  <div className="mentor-overview__section-headline">
                    <h4 className="mentor-overview__stat-section-title">Thu nhập</h4>
                    <button
                      className="mentor-overview__detail-link"
                      onClick={() => onNavigate("earnings")}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                  <div className="mentor-overview__stat-grid">
                    <div className="mentor-overview__stat-item">
                      <DollarSign size={20} className="mentor-overview__stat-item-icon" />
                      <div className="mentor-overview__stat-item-info">
                        <span className="mentor-overview__stat-item-label">Thu nhập trong kỳ</span>
                        <span className="mentor-overview__stat-item-value">
                          {formatCurrency(stats.rangeEarnings)}
                        </span>
                      </div>
                    </div>
                    <div className="mentor-overview__stat-item">
                      <DollarSign size={20} className="mentor-overview__stat-item-icon" />
                      <div className="mentor-overview__stat-item-info">
                        <span className="mentor-overview__stat-item-label">Giao dịch trong kỳ</span>
                        <span className="mentor-overview__stat-item-value">
                          {stats.transactionCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="mentor-overview__stat-section">
                  <div className="mentor-overview__section-headline">
                    <h4 className="mentor-overview__stat-section-title">Hoạt động</h4>
                    <button
                      className="mentor-overview__detail-link"
                      onClick={() => onNavigate("bookings")}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                  <div className="mentor-overview__stat-grid">
                    <button
                      className="mentor-overview__stat-item mentor-overview__stat-item--button"
                      onClick={() => onNavigate("bookings")}
                    >
                      <Users size={20} className="mentor-overview__stat-item-icon" />
                      <div className="mentor-overview__stat-item-info">
                        <span className="mentor-overview__stat-item-label">Học viên</span>
                        <span className="mentor-overview__stat-item-value">
                          {stats.totalStudents}
                        </span>
                      </div>
                    </button>
                    <button
                      className="mentor-overview__stat-item mentor-overview__stat-item--button"
                      onClick={() => onNavigate("courses")}
                    >
                      <Video size={20} className="mentor-overview__stat-item-icon" />
                      <div className="mentor-overview__stat-item-info">
                        <span className="mentor-overview__stat-item-label">Khóa học</span>
                        <span className="mentor-overview__stat-item-value">
                          {stats.totalCourses}
                        </span>
                      </div>
                    </button>
                    <button
                      className="mentor-overview__stat-item mentor-overview__stat-item--button"
                      onClick={() => onNavigate("bookings")}
                    >
                      <Clock size={20} className="mentor-overview__stat-item-icon" />
                      <div className="mentor-overview__stat-item-info">
                        <span className="mentor-overview__stat-item-label">Buổi booking</span>
                        <span className="mentor-overview__stat-item-value">
                          {stats.totalBookings}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Class Card */}
            <div className="mentor-overview__card mentor-overview__next-class-card">
              <div className="mentor-overview__card-header">
                <Video size={18} className="icon--cyan" />
                <span>LỚP HỌC TIẾP THEO</span>
                <div className="mentor-overview__header-status-dot pulse"></div>
              </div>
              <div className="mentor-overview__card-body">
                <div className="mentor-overview__no-class">
                  <p>Không có lớp học sắp diễn ra</p>
                  <button
                    className="mentor-overview__view-schedule-btn"
                    onClick={() => onNavigate("schedule")}
                  >
                    Xem lịch trình
                  </button>
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="mentor-overview__card mentor-overview__pending-tasks-card">
              <div className="mentor-overview__card-header">
                <AlertCircle size={18} className="icon--red" />
                <span>TÁC VỤ CẦN XỬ LÝ GẤP</span>
              </div>
              <div className="mentor-overview__card-body">
                <div
                  className="mentor-overview__task-item"
                  onClick={() => onNavigate("grading")}
                >
                  <div className="mentor-overview__task-info">
                    <span className="mentor-overview__task-count">{stats.pendingGrading}</span>
                    <span className="mentor-overview__task-label">Bài tập cần chấm</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
                <div
                  className="mentor-overview__task-item"
                  onClick={() => onNavigate("bookings")}
                >
                  <div className="mentor-overview__task-info">
                    <span className="mentor-overview__task-count">{stats.pendingBookings}</span>
                    <span className="mentor-overview__task-label">Yêu cầu đặt lịch mới</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="mentor-overview__bottom">
            <div className="overview-transactions">
              <div className="mentor-overview__section-headline">
                <h3>LỊCH SỬ GIAO DỊCH MỚI NHẤT</h3>
                <button
                  className="mentor-overview__detail-link"
                  onClick={() => onNavigate("earnings")}
                >
                  Xem thêm
                </button>
              </div>

              <div className="overview-transactions__table-wrap">
                {latestTransactions.length === 0 ? (
                  <div className="overview-transactions__empty">
                    Không có giao dịch trong khoảng thời gian đã chọn.
                  </div>
                ) : (
                  <table className="overview-transactions__table">
                    <thead>
                      <tr>
                        <th>Loại</th>
                        <th>Ngày</th>
                        <th>Mô tả</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestTransactions.map((tx) => (
                        <tr key={tx.transactionId}>
                          <td>{tx.transactionTypeName || tx.transactionType || "--"}</td>
                          <td>{formatDateTime(tx.createdAt)}</td>
                          <td>{tx.description || "--"}</td>
                          <td className={tx.isCredit ? "is-credit" : "is-debit"}>
                            {tx.isCredit ? "+" : "-"}
                            {formatCurrency(tx.cashAmount || 0)}
                          </td>
                          <td>
                            <span className={`overview-transactions__status ${getTransactionStatusClass(tx.status)}`}>
                              {getTransactionStatusLabel(tx.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MentorOverviewHUD;
