import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Map, Route, PlayCircle, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import MothershipDashboard from "../../components/dashboard-hud/MothershipDashboard";
import MeowlGuide from "../../components/meowl/MeowlGuide";
import { getUserEnrollments } from "../../services/enrollmentService";
import { getCourse } from "../../services/courseService";
import { getCourseLearningStatus } from "../../services/courseLearningService";
import { getGroupByCourse, joinGroup } from "../../services/groupChatService";
import {
  FeatureLimitInfo,
  UserCycleStats,
  getMyUsage,
  getCycleStats,
} from "../../services/usageLimitService";
import { getMyFavoriteMentors } from "../../services/mentorProfileService";
import aiRoadmapService from "../../services/aiRoadmapService";
import { RoadmapSessionSummary } from "../../types/Roadmap";
import { premiumService } from "../../services/premiumService";
import { taskBoardService } from "../../services/taskBoardService";
import { getWallet } from "../../services/gamificationService";
import journeyService from "../../services/journeyService";
import {
  JourneySummaryResponse,
  JourneyStatus,
  DOMAIN_OPTIONS,
} from "../../types/Journey";
import "../../styles/DashboardJourneyPrompt.css";

const POST_LOGIN_JOURNEY_PROMPT_KEY = "showPostLoginJourneyPrompt";
const JOURNEY_PROMPT_AUTO_CLOSE_SECONDS = 15;

const DashboardPage = () => {
  const { translations } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [favoriteMentors, setFavoriteMentors] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapSessionSummary[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureLimitInfo[]>([]);
  const [featureUsageError, setFeatureUsageError] = useState<string | null>(null);
  const [featureUsageLoading, setFeatureUsageLoading] = useState(false);
  const [cycleStats, setCycleStats] = useState<UserCycleStats | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [taskSummary, setTaskSummary] = useState<{
    criticalOverdue: number; // >30 days overdue
    overdue: number; // 1-30 days overdue
    pending: number; // not yet due
    upcomingTasks: Array<{
      title: string;
      deadline: string;
      daysOverdue: number;
      estimatedMinutes?: number;
    }>;
  }>({ criticalOverdue: 0, overdue: 0, pending: 0, upcomingTasks: [] });
  const [userLevel, setUserLevel] = useState(1);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalHours: 0,
    completedProjects: 0,
    certificates: 0,
  });
  const [showJourneyPrompt, setShowJourneyPrompt] = useState(false);
  const [journeyPromptLoading, setJourneyPromptLoading] = useState(false);
  const [journeyPromptError, setJourneyPromptError] = useState<string | null>(
    null,
  );
  const [journeyPromptJourneys, setJourneyPromptJourneys] = useState<
    JourneySummaryResponse[]
  >([]);
  const [journeyPromptCloseCountdown, setJourneyPromptCloseCountdown] =
    useState(JOURNEY_PROMPT_AUTO_CLOSE_SECONDS);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const clearJourneyPromptFlag = () => {
    sessionStorage.removeItem(POST_LOGIN_JOURNEY_PROMPT_KEY);
  };

  const closeJourneyPrompt = () => {
    clearJourneyPromptFlag();
    setShowJourneyPrompt(false);
  };

  const handleOpenJourneyFromPrompt = (journeyId: number) => {
    clearJourneyPromptFlag();
    setShowJourneyPrompt(false);
    navigate("/journey", {
      state: { autoOpenJourneyId: journeyId, fromPostLogin: true },
    });
  };

  const handleGoToJourneyList = () => {
    clearJourneyPromptFlag();
    setShowJourneyPrompt(false);
    navigate("/journey");
  };

  const handleStartFirstJourney = () => {
    clearJourneyPromptFlag();
    setShowJourneyPrompt(false);
    navigate("/journey/create");
  };

  const getDomainLabel = (domain: string): string => {
    const matched = DOMAIN_OPTIONS.find((item) => item.value === domain);
    return matched?.label || domain;
  };

  const getJourneyStatusLabel = (status: JourneyStatus): string => {
    const labels: Record<JourneyStatus, string> = {
      [JourneyStatus.NOT_STARTED]: "Chưa bắt đầu",
      [JourneyStatus.ASSESSMENT_PENDING]: "Chờ đánh giá",
      [JourneyStatus.TEST_IN_PROGRESS]: "Đang làm quiz",
      [JourneyStatus.TEST_COMPLETED]: "Đã làm quiz",
      [JourneyStatus.EVALUATION_PENDING]: "Đang đánh giá",
      [JourneyStatus.ROADMAP_GENERATING]: "Đang tạo roadmap",
      [JourneyStatus.ROADMAP_READY]: "Roadmap sẵn sàng",
      [JourneyStatus.STUDY_PLANS_READY]: "Kế hoạch sẵn sàng",
      [JourneyStatus.IN_PROGRESS]: "Đang học",
      [JourneyStatus.PAUSED]: "Tạm dừng",
      [JourneyStatus.COMPLETED]: "Hoàn thành",
      [JourneyStatus.CANCELLED]: "Đã hủy",
    };
    return labels[status] ?? status;
  };

  const getJourneyStatusClass = (status: JourneyStatus): string => {
    if (status === JourneyStatus.COMPLETED) return "is-completed";
    if (status === JourneyStatus.PAUSED) return "is-paused";
    if (status === JourneyStatus.CANCELLED) return "is-cancelled";
    return "is-active";
  };

  const journeyPromptCount = journeyPromptJourneys.length;
  const journeyPromptActiveCount = journeyPromptJourneys.filter((journey) =>
    [
      JourneyStatus.ASSESSMENT_PENDING,
      JourneyStatus.TEST_IN_PROGRESS,
      JourneyStatus.TEST_COMPLETED,
      JourneyStatus.EVALUATION_PENDING,
      JourneyStatus.ROADMAP_GENERATING,
      JourneyStatus.ROADMAP_READY,
      JourneyStatus.STUDY_PLANS_READY,
      JourneyStatus.IN_PROGRESS,
    ].includes(journey.status),
  ).length;
  const journeyPromptCompletedCount = journeyPromptJourneys.filter(
    (journey) => journey.status === JourneyStatus.COMPLETED,
  ).length;
  const journeyPromptAverageProgress =
    journeyPromptCount > 0
      ? Math.round(
          journeyPromptJourneys.reduce(
            (total, journey) => total + (journey.progressPercentage ?? 0),
            0,
          ) / journeyPromptCount,
        )
      : 0;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?.id) return;

    const shouldShowPrompt =
      sessionStorage.getItem(POST_LOGIN_JOURNEY_PROMPT_KEY) === "1";
    if (!shouldShowPrompt) return;

    let isCancelled = false;
    setShowJourneyPrompt(true);
    setJourneyPromptLoading(true);
    setJourneyPromptError(null);

    const loadJourneysForPrompt = async () => {
      try {
        const journeyPage = await journeyService.getUserJourneys(0, 6);
        if (isCancelled) return;
        setJourneyPromptJourneys(journeyPage.content);
      } catch (error) {
        if (isCancelled) return;
        console.error("Failed to load journeys for post-login prompt:", error);
        setJourneyPromptJourneys([]);
        setJourneyPromptError("Không thể tải danh sách hành trình lúc này.");
      } finally {
        if (!isCancelled) {
          setJourneyPromptLoading(false);
        }
      }
    };

    void loadJourneysForPrompt();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!showJourneyPrompt) return;

    setJourneyPromptCloseCountdown(JOURNEY_PROMPT_AUTO_CLOSE_SECONDS);

    const autoHideTimer = window.setTimeout(() => {
      clearJourneyPromptFlag();
      setShowJourneyPrompt(false);
    }, JOURNEY_PROMPT_AUTO_CLOSE_SECONDS * 1000);

    const countdownTimer = window.setInterval(() => {
      setJourneyPromptCloseCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => {
      window.clearTimeout(autoHideTimer);
      window.clearInterval(countdownTimer);
    };
  }, [showJourneyPrompt]);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        setFeatureUsageLoading(true);
        setFeatureUsageError(null);

        try {
          const usagePromise = getMyUsage()
            .then((data) => ({ data, error: null as string | null }))
            .catch((error) => {
              console.error("Error fetching usage limits", error);
              const err = error as {
                response?: {
                  data?: {
                    message?: string;
                  };
                };
              };
              const serverMessage =
                err.response?.data?.message &&
                typeof err.response.data.message === "string"
                  ? err.response.data.message
                  : null;
              return {
                data: [] as FeatureLimitInfo[],
                error: serverMessage || "Không thể tải giới hạn sử dụng lúc này.",
              };
            });

          // Fetch limits, stats, premium status, task board, and wallet in parallel with enrollments
          const [
            enrollments,
            usageResult,
            cStats,
            favorites,
            userRoadmaps,
            premiumStatus,
            taskBoard,
            wallet,
          ] = await Promise.all([
            getUserEnrollments(user.id),
            usagePromise,
            getCycleStats().catch((error) => {
              console.error("Error fetching cycle stats", error);
              return null;
            }),
            getMyFavoriteMentors().catch((error) => {
              console.error("Error fetching favorite mentors", error);
              return [];
            }),
            aiRoadmapService.getUserRoadmaps().catch((error) => {
              console.error("Error fetching user roadmaps", error);
              return [];
            }),
            premiumService.checkPremiumStatus().catch((error) => {
              console.error("Error checking premium status", error);
              return false;
            }),
            taskBoardService.getBoard().catch((error) => {
              console.error("Error fetching task board", error);
              return [];
            }),
            getWallet().catch((error) => {
              console.error("Error fetching wallet", error);
              return null;
            }),
          ]);

          setFeatureUsage(usageResult.data);
          setFeatureUsageError(usageResult.error);
          setCycleStats(cStats);
          setFavoriteMentors(favorites);
          setRoadmaps(userRoadmaps);
          setHasPremium(premiumStatus);

          // Calculate user level from XP (level = floor(sqrt(xp / 100)) + 1)
          if (wallet && wallet.totalXp) {
            const calculatedLevel =
              Math.floor(Math.sqrt(wallet.totalXp / 100)) + 1;
            setUserLevel(calculatedLevel);
          }

          // Count and categorize tasks
          const now = new Date();
          let criticalOverdue = 0;
          let overdueCount = 0;
          let pendingCount = 0;
          const allTasks: Array<{
            title: string;
            deadline: string;
            daysOverdue: number;
          }> = [];

          taskBoard.forEach((column) => {
            // Don't count tasks in "Done" columns
            const isDoneColumn =
              column.name.toLowerCase().includes("done") ||
              column.name.toLowerCase().includes("hoàn thành") ||
              column.name.toLowerCase().includes("xong");
            if (!isDoneColumn) {
              column.tasks.forEach((task) => {
                if (task.deadline) {
                  const deadline = new Date(task.deadline);
                  const diffTime = now.getTime() - deadline.getTime();
                  const daysOverdue = Math.floor(
                    diffTime / (1000 * 60 * 60 * 24),
                  );

                  if (daysOverdue > 0) {
                    // Task is overdue
                    if (daysOverdue > 30) {
                      criticalOverdue++;
                    } else {
                      overdueCount++;
                    }
                    allTasks.push({
                      title: task.title,
                      deadline: task.deadline,
                      daysOverdue,
                      estimatedMinutes: Math.floor(Math.random() * 90) + 30, // 30-120 minutes (random for now)
                    });
                  } else {
                    pendingCount++;
                  }
                } else {
                  // No deadline = pending
                  pendingCount++;
                }
              });
            }
          });

          // Sort by days overdue (farthest deadline first = most overdue) and take top 10
          const sortedTasks = allTasks
            .sort((a, b) => b.daysOverdue - a.daysOverdue)
            .slice(0, 10);

          setTaskSummary({
            criticalOverdue,
            overdue: overdueCount,
            pending: pendingCount,
            upcomingTasks: sortedTasks,
          });

          // Fetch details for each course to get title, thumbnail, etc.
          const coursesPromises = enrollments.content.map(
            async (enrollment) => {
              try {
                const [courseData, progressData, groupData] = await Promise.all([
                  getCourse(enrollment.courseId),
                  getCourseLearningStatus(enrollment.courseId).catch(() => null),
                  getGroupByCourse(enrollment.courseId, user.id).catch(
                    () => null,
                  ),
                ]);

                // Use actual lesson counts if available from progress service
                const totalLessons = progressData?.totalLessonCount || 0;
                const completedLessons = progressData?.completedLessonCount || 0;

                // Determine next lesson or item name
                let nextLessonLabel = "Continue Learning";
                if (progressData) {
                  if (progressData.percent === 100) {
                    nextLessonLabel = "Course Completed";
                  } else {
                    // Try to find the first uncompleted lesson in the module structure
                    const allItems: any[] = [];
                    courseData.modules?.forEach((m: any) => {
                      m.lessons?.forEach((l: any) => allItems.push({ ...l, type: 'lesson' }));
                    });

                    const firstUncompleted = allItems.find(item => 
                      !progressData.completedLessonIds.includes(item.id)
                    );
                    
                    if (firstUncompleted) {
                      nextLessonLabel = firstUncompleted.title;
                    }
                  }
                }

                return {
                  id: courseData.id,
                  title: courseData.title,
                  progress: progressData?.percent ?? enrollment.progressPercent ?? 0,
                  totalLessons: totalLessons,
                  completedLessons: completedLessons,
                  instructor:
                    courseData.author?.fullName || "Unknown Instructor",
                  thumbnail:
                    courseData.thumbnailUrl ||
                    "https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=200", // Fallback image
                  lastAccessed: "Recently",
                  nextLesson: nextLessonLabel,
                  estimatedTime: courseData.estimatedDurationHours
                    ? `${courseData.estimatedDurationHours} hours`
                    : "N/A",
                  rawDuration: courseData.estimatedDurationHours ? courseData.estimatedDurationHours * 60 : 0,
                  group: groupData,
                };
              } catch (e) {
                console.error(
                  `Failed to fetch details for course ${enrollment.courseId}`,
                  e,
                );
                return null;
              }
            },
          );

          const courses = (await Promise.all(coursesPromises)).filter(
            (c) => c !== null,
          );
          setEnrolledCourses(courses);

          // Calculate stats
          // Duration is usually in minutes, convert to hours
          const totalMinutes = courses.reduce(
            (acc, curr) => acc + (curr.rawDuration || 0),
            0,
          );
          const calculatedTotalHours = Math.round(totalMinutes / 60);

          setStats((prev) => ({
            ...prev,
            totalCourses: courses.length,
            totalHours: cStats?.totalHoursStudied ?? calculatedTotalHours,
            completedProjects: cStats?.completedProjectsCount ?? 0,
            certificates: cStats?.certificatesCount ?? 0,
          }));
        } catch (error) {
          console.error("Error fetching dashboard data", error);
        } finally {
          setFeatureUsageLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleJoinGroup = async (groupId: number, isMember: boolean) => {
    if (!user) return;
    try {
      if (!isMember) {
        await joinGroup(groupId, user.id);
        // Update local state to reflect membership
        setEnrolledCourses((prev) =>
          prev.map((c) => {
            if (c.group && c.group.id === groupId) {
              return { ...c, group: { ...c.group, isMember: true } };
            }
            return c;
          }),
        );
      }
      navigate("/messages", {
        state: { openChatWith: groupId, type: "GROUP" },
      });
    } catch (e) {
      console.error("Failed to join/open group", e);
      alert("Không thể tham gia nhóm. Vui lòng thử lại.");
    }
  };

  return (
    <div className="dashboard-page">
      <MothershipDashboard
        userName={user?.fullName || user?.email}
        userRoles={user?.roles || []}
        userLevel={userLevel}
        hasPremium={hasPremium}
        taskSummary={taskSummary}
        translations={translations}
        enrolledCourses={enrolledCourses}
        favoriteMentors={favoriteMentors}
        roadmaps={roadmaps}
        userStats={stats}
        cycleStats={cycleStats}
        featureUsage={featureUsage}
        featureUsageLoading={featureUsageLoading}
        featureUsageError={featureUsageError}
        onJoinGroup={handleJoinGroup}
      />

      {showJourneyPrompt && (
        <div className="dashboard-journey-prompt__overlay">
          <section className="dashboard-journey-prompt__panel">
            <button
              type="button"
              className="dashboard-journey-prompt__close"
              onClick={closeJourneyPrompt}
              aria-label="Đóng bảng gợi ý"
            >
              <X size={18} />
            </button>

            <header className="dashboard-journey-prompt__header">
              <div className="dashboard-journey-prompt__countdown">
                <span>Tự đóng sau</span>
                <strong>{journeyPromptCloseCountdown}s</strong>
              </div>
              <h2>
                {journeyPromptJourneys.length > 0
                  ? "Tiếp tục hành trình của bạn"
                  : "Chào mừng đến Journey AI"}
              </h2>
              <p>
                {journeyPromptJourneys.length > 0
                  ? "Chọn một hành trình để tiếp tục ngay từ bước đang làm."
                  : "Bạn chưa có journey. Đây là luồng tiêu chuẩn để bắt đầu đúng ngay từ lần đầu."}
              </p>
            </header>

            <div className="dashboard-journey-prompt__meowl-notify" aria-hidden="true"></div>

            {!journeyPromptLoading && !journeyPromptError && (
              <div className="dashboard-journey-prompt__summary">
                <article className="dashboard-journey-prompt__summary-card">
                  <strong>{journeyPromptCount}</strong>
                  <span>Journey</span>
                </article>
                <article className="dashboard-journey-prompt__summary-card">
                  <strong>{journeyPromptActiveCount}</strong>
                  <span>Đang hoạt động</span>
                </article>
                <article className="dashboard-journey-prompt__summary-card">
                  <strong>
                    {journeyPromptCount > 0
                      ? `${journeyPromptAverageProgress}%`
                      : `${journeyPromptCompletedCount}`}
                  </strong>
                  <span>
                    {journeyPromptCount > 0
                      ? "Tiến độ TB"
                      : "Hoàn thành"}
                  </span>
                </article>
              </div>
            )}

            {journeyPromptLoading && (
              <div className="dashboard-journey-prompt__loading">
                Đang tải dữ liệu hành trình...
              </div>
            )}

            {!journeyPromptLoading && journeyPromptError && (
              <div className="dashboard-journey-prompt__error">
                {journeyPromptError}
              </div>
            )}

            {!journeyPromptLoading && journeyPromptJourneys.length > 0 && (
              <div className="dashboard-journey-prompt__list">
                {journeyPromptJourneys.map((journey) => (
                  <button
                    key={journey.id}
                    type="button"
                    className="dashboard-journey-prompt__item"
                    onClick={() => handleOpenJourneyFromPrompt(journey.id)}
                  >
                    <div className="dashboard-journey-prompt__item-main">
                      <h3>{getDomainLabel(journey.domain)}</h3>
                      <p>{journey.jobRole || journey.subCategory || journey.goal}</p>
                      <div className="dashboard-journey-prompt__item-progress-track">
                        <div
                          className="dashboard-journey-prompt__item-progress-fill"
                          style={{ width: `${journey.progressPercentage ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="dashboard-journey-prompt__item-meta">
                      <span className={getJourneyStatusClass(journey.status)}>
                        {getJourneyStatusLabel(journey.status)}
                      </span>
                      <strong>{journey.progressPercentage ?? 0}%</strong>
                    </div>
                    <span className="dashboard-journey-prompt__item-open">
                      Tiếp tục
                      <ArrowRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!journeyPromptLoading && journeyPromptJourneys.length === 0 && (
              <div className="dashboard-journey-prompt__onboarding">
                <div className="dashboard-journey-prompt__features">
                  <article>
                    <span className="dashboard-journey-prompt__feature-step">01</span>
                    <Map size={18} />
                    <div>
                      <h3>Đánh giá năng lực đầu vào</h3>
                      <p>Quiz theo ngành và vai trò để xác định level chính xác.</p>
                    </div>
                  </article>
                  <article>
                    <span className="dashboard-journey-prompt__feature-step">02</span>
                    <Brain size={18} />
                    <div>
                      <h3>AI phân tích điểm mạnh/yếu</h3>
                      <p>Kết quả dễ đọc, có khuyến nghị cụ thể theo kỹ năng.</p>
                    </div>
                  </article>
                  <article>
                    <span className="dashboard-journey-prompt__feature-step">03</span>
                    <Route size={18} />
                    <div>
                      <h3>Roadmap học cá nhân hóa</h3>
                      <p>Tạo lộ trình ngay sau đánh giá để học theo bước rõ ràng.</p>
                    </div>
                  </article>
                </div>

                <div className="dashboard-journey-prompt__first-step">
                  <PlayCircle size={18} />
                  <span>
                    Bước đầu tiên cần làm: <strong>Tạo hành trình mới</strong> và hoàn thành bài quiz đầu vào.
                  </span>
                </div>
              </div>
            )}

            <footer className="dashboard-journey-prompt__actions">
              {journeyPromptJourneys.length > 0 ? (
                <>
                  <button
                    type="button"
                    className="dashboard-journey-prompt__btn dashboard-journey-prompt__btn--primary"
                    onClick={handleGoToJourneyList}
                  >
                    Xem tất cả journey
                  </button>
                  <button
                    type="button"
                    className="dashboard-journey-prompt__btn dashboard-journey-prompt__btn--ghost"
                    onClick={closeJourneyPrompt}
                  >
                    Để sau
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="dashboard-journey-prompt__btn dashboard-journey-prompt__btn--primary"
                    onClick={handleStartFirstJourney}
                  >
                    Bắt đầu journey đầu tiên
                  </button>
                  <button
                    type="button"
                    className="dashboard-journey-prompt__btn dashboard-journey-prompt__btn--ghost"
                    onClick={handleGoToJourneyList}
                  >
                    Xem trang Journey
                  </button>
                </>
              )}
            </footer>
          </section>
        </div>
      )}

      {/* Meowl Guide Assistant */}
      <MeowlGuide />
    </div>
  );
};

export default DashboardPage;
