import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import MothershipDashboard from '../../components/dashboard-hud/MothershipDashboard';
import MeowlGuide from '../../components/MeowlGuide';
import { getUserEnrollments } from '../../services/enrollmentService';
import { getCourse } from '../../services/courseService';
import { getMyUsage, getCycleStats } from '../../services/usageLimitService';
import { getMyFavoriteMentors } from '../../services/mentorProfileService';
import aiRoadmapService from '../../services/aiRoadmapService';
import { RoadmapSessionSummary } from '../../types/Roadmap';

const DashboardPage = () => {
  const { translations } = useLanguage();
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [favoriteMentors, setFavoriteMentors] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureUsage, setFeatureUsage] = useState<any[]>([]);
  const [cycleStats, setCycleStats] = useState<any>(null);
  const [stats, setStats] = useState({
      totalCourses: 0,
      totalHours: 0,
      completedProjects: 0,
      certificates: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          // Fetch limits and stats in parallel with enrollments
          const [enrollments, limits, cStats, favorites, userRoadmaps] = await Promise.all([
            getUserEnrollments(user.id),
            getMyUsage().catch(e => []),
            getCycleStats().catch(e => null),
            getMyFavoriteMentors().catch(e => []),
            aiRoadmapService.getUserRoadmaps().catch(e => [])
          ]);

          setFeatureUsage(limits);
          setCycleStats(cStats);
          setFavoriteMentors(favorites);
          setRoadmaps(userRoadmaps);
          
          // Fetch details for each course to get title, thumbnail, etc.
          const coursesPromises = enrollments.content.map(async (enrollment) => {
             try {
                 const courseData = await getCourse(enrollment.courseId);
                 
                 // Calculate total lessons in the course
                 let totalLessons = 0;
                 courseData.modules?.forEach(m => totalLessons += (m.lessons?.length || 0));
                 
                 // Estimate completed lessons based on progress percent
                 // This is an estimation because enrollment doesn't explicitly give completed lessons count in the basic DTO
                 const completedLessons = Math.round((enrollment.progressPercent || 0) / 100 * totalLessons);
                 
                 return {
                     id: courseData.id,
                     title: courseData.title,
                     progress: enrollment.progressPercent || 0,
                     totalLessons: totalLessons || 0,
                     completedLessons: completedLessons,
                     instructor: courseData.author?.fullName || 'Unknown Instructor',
                     thumbnail: courseData.thumbnailUrl || 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=200', // Fallback image
                     lastAccessed: 'Recently', 
                     nextLesson: 'Continue Learning', 
                     estimatedTime: courseData.duration ? `${courseData.duration} min` : 'N/A',
                     rawDuration: courseData.duration || 0
                 };
             } catch (e) {
                 console.error(`Failed to fetch details for course ${enrollment.courseId}`, e);
                 return null;
             }
          });
          
          const courses = (await Promise.all(coursesPromises)).filter(c => c !== null);
          setEnrolledCourses(courses);

          // Calculate stats
          // Duration is usually in minutes, convert to hours
          const totalMinutes = courses.reduce((acc, curr) => acc + (curr.rawDuration || 0), 0);
          const calculatedTotalHours = Math.round(totalMinutes / 60);
          
          setStats(prev => ({
              ...prev,
              totalCourses: courses.length,
              totalHours: cStats?.totalHoursStudied ?? calculatedTotalHours,
              completedProjects: cStats?.completedProjectsCount ?? 0,
              certificates: cStats?.certificatesCount ?? 0
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

  return (
    <>
      <MothershipDashboard 
        userName={user?.fullName || 'Explorer'}
        translations={translations}
        enrolledCourses={enrolledCourses}
        favoriteMentors={favoriteMentors}
        roadmaps={roadmaps}
        userStats={stats}
        featureUsage={featureUsage}
        cycleStats={cycleStats}
      />
      <MeowlGuide currentPage="dashboard" />
    </>
  );
};

export default DashboardPage;
