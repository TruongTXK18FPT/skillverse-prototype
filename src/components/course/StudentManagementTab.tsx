import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock
} from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { getCourseEnrollments, EnrollmentDetailDTO } from '../../services/enrollmentService';
import UserService from '../../services/userService';
import { UserProfileResponse } from '../../data/userDTOs';
import { QuizSummaryDTO, QuizAttemptDTO } from '../../data/quizDTOs';
import { getUserQuizAttemptsBatch } from '../../services/quizService';
import { listModulesWithContent } from '../../services/moduleService';
import { useToast } from '../../hooks/useToast';
import '../../styles/StudentManagementTab.css';

interface StudentManagementTabProps {
  courseId: number;
  currentUserId: number;
  quizzes?: QuizSummaryDTO[];
}

interface StudentData {
  enrollment: EnrollmentDetailDTO;
  profile: UserProfileResponse | null;
  quizResults: Record<number, QuizAttemptDTO[]>; // quizId -> attempts
  quizLoaded?: boolean;
}

const StudentManagementTab: React.FC<StudentManagementTabProps> = ({ courseId, quizzes, currentUserId }) => {
  const { showError } = useToast();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [courseQuizzes, setCourseQuizzes] = useState<QuizSummaryDTO[]>(quizzes || []);
  const [loadingQuizUsers, setLoadingQuizUsers] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadStudents();
  }, [courseId]);

  useEffect(() => {
    if (quizzes) {
      setCourseQuizzes(quizzes);
      return;
    }
    loadCourseQuizzes();
  }, [courseId, quizzes]);

  const loadCourseQuizzes = async () => {
    setQuizLoading(true);
    try {
      const modules = await listModulesWithContent(courseId);
      const quizList = modules.flatMap(m => m.quizzes || []);
      setCourseQuizzes(quizList);
    } catch (error) {
      console.error('Error loading course quizzes:', error);
      showError('Error', 'Không thể tải danh sách quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      // 1. Fetch enrollments
      const enrollmentsResponse = await getCourseEnrollments(courseId, currentUserId, 0, 100); // Fetch first 100 for now
      const enrollments = enrollmentsResponse.content;

      // 2. Fetch user profiles and quiz results for each enrollment
      const studentsData: StudentData[] = await Promise.all(
        enrollments.map(async (enrollment) => {
          let profile: UserProfileResponse | null = null;
          try {
            profile = await UserService.getUserProfile(enrollment.userId);
          } catch (error) {
            console.error(`Failed to load profile for user ${enrollment.userId}`, error);
          }

          return {
            enrollment,
            profile,
            quizResults: {},
            quizLoaded: false
          };
        })
      );

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      showError('Error', 'Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  const getQuizScore = (student: StudentData, quizId: number) => {
    const attempts = student.quizResults[quizId];
    if (!attempts || attempts.length === 0) return '-';
    
    // Get best score
    const bestAttempt = attempts.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev
    );
    
    return `${bestAttempt.score}%`;
  };

  const getQuizStatus = (student: StudentData, quizId: number) => {
    const attempts = student.quizResults[quizId];
    if (!attempts || attempts.length === 0) return 'not-started';
    
    const hasPassed = attempts.some(a => a.passed);
    return hasPassed ? 'passed' : 'failed';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'completed' && student.enrollment.completed) ||
      (filterStatus === 'in-progress' && !student.enrollment.completed);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="smt-loading-container">
        <MeowlKuruLoader size="medium" text="" />
        <p>Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="smt-container">
      <div className="smt-header">
        <div className="smt-stats-cards">
          <div className="smt-stat-card">
            <div className="smt-stat-icon">
              <Users size={24} />
            </div>
            <div className="smt-stat-info">
              <span className="smt-stat-value">{students.length}</span>
              <span className="smt-stat-label">Total Students</span>
            </div>
          </div>
          <div className="smt-stat-card">
            <div className="smt-stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="smt-stat-info">
              <span className="smt-stat-value">
                {students.filter(s => s.enrollment.completed).length}
              </span>
              <span className="smt-stat-label">Completed</span>
            </div>
          </div>
          <div className="smt-stat-card">
            <div className="smt-stat-icon warning">
              <Clock size={24} />
            </div>
            <div className="smt-stat-info">
              <span className="smt-stat-value">
                {students.filter(s => !s.enrollment.completed).length}
              </span>
              <span className="smt-stat-label">In Progress</span>
            </div>
          </div>
        </div>

        <div className="smt-controls-bar">
          <div className="smt-search-box">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="smt-filter-box">
            <Filter size={20} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>
      </div>

      <div className="smt-table-container">
        <table className="smt-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Enrolled Date</th>
              <th>Progress</th>
              {courseQuizzes.map(quiz => (
                <th key={quiz.id} title={quiz.title}>
                  Quiz: {quiz.title.length > 15 ? quiz.title.substring(0, 15) + '...' : quiz.title}
                </th>
              ))}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.enrollment.id}>
                  <td>
                    <div className="smt-student-info">
                      <div className="smt-student-avatar">
                        {student.profile?.avatarMediaUrl ? (
                          <img src={student.profile.avatarMediaUrl} alt={student.profile.fullName} />
                        ) : (
                          <div className="smt-avatar-placeholder">
                            {student.profile?.fullName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="smt-student-details">
                        <span className="smt-student-name">
                          {student.profile?.fullName || `User ${student.enrollment.userId}`}
                        </span>
                        <span className="smt-student-email">{student.profile?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {new Date(student.enrollment.enrolledAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="smt-progress-cell">
                      <div className="smt-progress-bar">
                        <div 
                          className="smt-progress-fill" 
                          style={{ width: `${student.enrollment.progressPercent}%` }}
                        ></div>
                      </div>
                      <span className="smt-progress-text">{student.enrollment.progressPercent}%</span>
                    </div>
                  </td>
                  {courseQuizzes.map(quiz => (
                    <td key={quiz.id} className="smt-quiz-score-cell">
                      <span className={`smt-score-badge ${getQuizStatus(student, quiz.id)}`}>
                        {getQuizScore(student, quiz.id)}
                      </span>
                    </td>
                  ))}
                  <td>
                    <span className={`smt-status-badge ${student.enrollment.completed ? 'completed' : 'active'}`}>
                      {student.enrollment.completed ? 'Completed' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="smt-action-btn"
                      onClick={() => {
                        const userId = student.enrollment.userId;
                        if (loadingQuizUsers[userId]) return;
                        setLoadingQuizUsers(prev => ({ ...prev, [userId]: true }));
                        const quizIds = courseQuizzes.map(quiz => quiz.id);
                        if (quizIds.length === 0) {
                          setStudents(prev => prev.map(s => (
                            s.enrollment.userId === userId ? { ...s, quizResults: {}, quizLoaded: true } : s
                          )));
                          setLoadingQuizUsers(prev => ({ ...prev, [userId]: false }));
                          return;
                        }

                        getUserQuizAttemptsBatch(quizIds, userId)
                          .then((attempts) => {
                            const nextResults: Record<number, QuizAttemptDTO[]> = {};
                            quizIds.forEach(id => {
                              nextResults[id] = [];
                            });
                            attempts.forEach(attempt => {
                              if (!nextResults[attempt.quizId]) {
                                nextResults[attempt.quizId] = [];
                              }
                              nextResults[attempt.quizId].push(attempt);
                            });
                            setStudents(prev => prev.map(s => (
                              s.enrollment.userId === userId
                                ? { ...s, quizResults: nextResults, quizLoaded: true }
                                : s
                            )));
                          })
                          .catch(() => {
                            setStudents(prev => prev.map(s => (
                              s.enrollment.userId === userId
                                ? { ...s, quizResults: {}, quizLoaded: true }
                                : s
                            )));
                          })
                          .finally(() => {
                            setLoadingQuizUsers(prev => ({ ...prev, [userId]: false }));
                          });
                      }}
                      title={student.quizLoaded ? 'Tải lại kết quả quiz' : 'Tải kết quả quiz'}
                      disabled={courseQuizzes.length === 0 || loadingQuizUsers[student.enrollment.userId]}
                    >
                      {loadingQuizUsers[student.enrollment.userId] ? (
                        <span>Đang tải...</span>
                      ) : (
                        <span>{student.quizLoaded ? 'Làm mới' : 'Tải quiz'}</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5 + courseQuizzes.length} className="smt-empty-state">
                  No students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {quizLoading && (
        <div className="smt-loading-container">
          <p>Đang tải danh sách quiz...</p>
        </div>
      )}
    </div>
  );
};

export default StudentManagementTab;
