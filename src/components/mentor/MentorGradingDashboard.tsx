import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { useAuth } from '../../context/AuthContext';
import { PendingSubmissionItemDTO } from '../../data/assignmentDTOs';
import { getAllPendingForMentor } from '../../services/assignmentService';
import '../../styles/MentorGradingDashboard.css';

interface Course {
  id: number;
  title: string;
  [key: string]: any;
}

interface MentorGradingDashboardProps {
  courses: Course[];
}

const MentorGradingDashboard: React.FC<MentorGradingDashboardProps> = ({ courses }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmissionItemDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all pending submissions via single batch endpoint
  const loadAllPendingSubmissions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const items = await getAllPendingForMentor();
      setPendingSubmissions(items);
    } catch (e) {
      console.error('Failed to load pending submissions', e);
      setError('Không thể tải danh sách bài chấm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courses.length > 0) {
      loadAllPendingSubmissions();
    }
  }, [courses, user]);

  if (loading) {
    return (
      <div className="mentor-grading-loading">
        <MeowlKuruLoader size="small" text="" />
        <p>Đang tải danh sách bài chấm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mentor-grading-error">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p>{error}</p>
        <button onClick={loadAllPendingSubmissions} className="retry-btn">
          Thử lại
        </button>
      </div>
    );
  }

  if (pendingSubmissions.length === 0) {
    return (
      <div className="mentor-grading-empty">
        <CheckCircle className="w-16 h-16" />
        <h3>Không có bài nào cần chấm</h3>
        <p>Tất cả bài tập đã được chấm điểm!</p>
      </div>
    );
  }

  return (
    <div className="mentor-grading-dashboard">
      <div className="mentor-grading-header">
        <h2>Bài Tập Cần Chấm</h2>
        <p className="mentor-grading-count">
          <AlertCircle className="w-5 h-5" />
          {pendingSubmissions.length} bài chờ chấm điểm
        </p>
      </div>

      <div className="mentor-grading-table">
        <table className="mentor-submissions-table">
          <thead>
            <tr>
              <th>Học Viên</th>
              <th>Khóa Học</th>
              <th>Module</th>
              <th>Bài Tập</th>
              <th>Ngày Nộp</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {pendingSubmissions.map(({ submission, courseName, courseId, moduleId, moduleName, assignmentName }) => (
              <tr key={submission.id}>
                <td>
                  <div className="student-info">
                    <span className="student-name">{submission.userName}</span>
                  </div>
                </td>
                <td>
                  <span className="course-name">{courseName}</span>
                </td>
                <td>
                  <span className="module-name">{moduleName}</span>
                </td>
                <td>
                  <span className="assignment-name">{assignmentName}</span>
                </td>
                <td>
                  <span className="submission-date">
                    {new Date(submission.submittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </td>
                <td>
                  <span className={`submission-status ${submission.isLate ? 'late' : 'on-time'}`}>
                    {submission.isLate ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Nộp trễ
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Đúng hạn
                      </>
                    )}
                  </span>
                </td>
                <td>
                  <button
                    className="mentor-grade-btn"
                    onClick={() => navigate(`/mentor/assignments/${submission.assignmentId}/grade`, {
                      state: {
                        courseName,
                        courseId,
                        moduleName,
                        moduleId,
                        assignmentName,
                        fromGradingDashboard: true
                      }
                    })}
                  >
                    <FileText className="w-4 h-4" />
                    Chấm điểm
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MentorGradingDashboard;
