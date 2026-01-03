import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import HUDCard from './HUDCard';
import HoloProgressBar from './HoloProgressBar';
import './ActiveModules.css';

interface Course {
  id: number;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  instructor: string;
  thumbnail: string;
  lastAccessed: string;
  nextLesson: string;
  estimatedTime: string;
  group?: {
    id: number;
    name: string;
    isMember: boolean;
  };
}

interface ActiveModulesProps {
  courses: Course[];
  title?: string;
  onCourseClick?: (courseId: number) => void;
  continueLabel?: string;
  onJoinGroup?: (groupId: number, isMember: boolean) => void;
}

const ActiveModules: React.FC<ActiveModulesProps> = ({
  courses,
  title = 'Active Simulations',
  onCourseClick,
  continueLabel = 'Continue',
  onJoinGroup
}) => {
  return (
    <HUDCard title={title} subtitle={`${courses.length} Running Modules`} variant="chamfer" delay={0.3}>
      <div className="active-modules">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.4 + index * 0.1,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="active-modules__card"
            onClick={() => onCourseClick?.(course.id)}
          >
            {/* Thumbnail */}
            <div className="active-modules__thumbnail">
              <img src={course.thumbnail} alt={course.title} />
              <div className="active-modules__thumbnail-overlay">
                <Play className="active-modules__play-icon" size={24} />
              </div>
              <div className="active-modules__progress-badge">
                {course.progress}%
              </div>
            </div>

            {/* Content */}
            <div className="active-modules__content">
              <div className="active-modules__header">
                <h4 className="active-modules__title">{course.title}</h4>
                <p className="active-modules__instructor">BY: {course.instructor.toUpperCase()}</p>
              </div>

              {/* Progress */}
              <HoloProgressBar
                value={course.progress}
                color="cyan"
                height="sm"
                showPercentage={false}
                animated={false}
              />

              {/* Stats */}
              <div className="active-modules__stats">
                <div className="active-modules__stat">
                  <span className="active-modules__stat-label">LESSONS</span>
                  <span className="active-modules__stat-value">
                    {course.completedLessons}/{course.totalLessons}
                  </span>
                </div>
                <div className="active-modules__stat">
                  <span className="active-modules__stat-label">NEXT</span>
                  <span className="active-modules__stat-value">{course.nextLesson}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="active-modules__footer">
                <div className="active-modules__time">
                  <Clock size={14} />
                  <span>{course.estimatedTime}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {course.group && (
                        <button 
                            className="active-modules__button"
                            style={{ 
                                background: course.group.isMember ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                                color: course.group.isMember ? '#10b981' : '#3b82f6',
                                borderColor: course.group.isMember ? '#10b981' : '#3b82f6'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (course.group) {
                                    onJoinGroup?.(course.group.id, course.group.isMember);
                                }
                            }}
                        >
                            {course.group.isMember ? 'Chat' : 'Join Group'}
                        </button>
                    )}
                    <button className="active-modules__button">
                      <Play size={14} />
                      {continueLabel}
                    </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </HUDCard>
  );
};

export default ActiveModules;
