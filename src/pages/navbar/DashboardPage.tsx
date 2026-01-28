import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import MothershipDashboard from "../../components/dashboard-hud/MothershipDashboard";
import MeowlGuide from "../../components/meowl/MeowlGuide";
import { getUserEnrollments } from "../../services/enrollmentService";
import { getCourse } from "../../services/courseService";
import { getGroupByCourse, joinGroup } from "../../services/groupChatService";
import { getMyUsage, getCycleStats } from "../../services/usageLimitService";
import { getMyFavoriteMentors } from "../../services/mentorProfileService";
import aiRoadmapService from "../../services/aiRoadmapService";
import { RoadmapSessionSummary } from "../../types/Roadmap";
import { premiumService } from "../../services/premiumService";
import { taskBoardService } from "../../services/taskBoardService";
import { getWallet } from "../../services/gamificationService";

const DashboardPage = () => {
  const { translations } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [favoriteMentors, setFavoriteMentors] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureUsage, setFeatureUsage] = useState<any[]>([]);
  const [cycleStats, setCycleStats] = useState<any>(null);
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

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          // Fetch limits, stats, premium status, task board, and wallet in parallel with enrollments
          const [
            enrollments,
            limits,
            cStats,
            favorites,
            userRoadmaps,
            premiumStatus,
            taskBoard,
            wallet,
          ] = await Promise.all([
            getUserEnrollments(user.id),
            getMyUsage().catch((e) => []),
            getCycleStats().catch((e) => null),
            getMyFavoriteMentors().catch((e) => []),
            aiRoadmapService.getUserRoadmaps().catch((e) => []),
            premiumService.checkPremiumStatus().catch((e) => false),
            taskBoardService.getBoard().catch((e) => []),
            getWallet().catch((e) => null),
          ]);

          setFeatureUsage(limits);
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
                const [courseData, groupData] = await Promise.all([
                  getCourse(enrollment.courseId),
                  getGroupByCourse(enrollment.courseId, user.id).catch(
                    () => null,
                  ),
                ]);

                // Calculate total lessons in the course
                let totalLessons = 0;
                courseData.modules?.forEach(
                  (m: any) => (totalLessons += m.lessons?.length || 0),
                );

                // Estimate completed lessons based on progress percent
                // This is an estimation because enrollment doesn't explicitly give completed lessons count in the basic DTO
                const completedLessons = Math.round(
                  ((enrollment.progressPercent || 0) / 100) * totalLessons,
                );

                return {
                  id: courseData.id,
                  title: courseData.title,
                  progress: enrollment.progressPercent || 0,
                  totalLessons: totalLessons || 0,
                  completedLessons: completedLessons,
                  instructor:
                    courseData.author?.fullName || "Unknown Instructor",
                  thumbnail:
                    courseData.thumbnailUrl ||
                    "https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=200", // Fallback image
                  lastAccessed: "Recently",
                  nextLesson: "Continue Learning",
                  estimatedTime: (courseData as any).duration
                    ? `${(courseData as any).duration} min`
                    : "N/A",
                  rawDuration: (courseData as any).duration || 0,
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
          setLoading(false);
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
        onJoinGroup={handleJoinGroup}
      />

      {/* Meowl Guide Assistant */}
      <MeowlGuide />
    </div>
  );
};

export default DashboardPage;
