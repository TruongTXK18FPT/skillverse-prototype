import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import HUDCard from './HUDCard';
import HoloProgressBar from './HoloProgressBar';
import { useScrollToListTopOnPagination } from '../../hooks/useScrollToListTopOnPagination';
import './ActiveModules.css';

type ActiveCourseSort = 'newest' | 'progress-desc' | 'progress-asc' | 'title-asc';
type ActiveCourseFilter = 'all' | 'just-started' | 'in-progress' | 'near-finish';

const COURSES_PER_PAGE = 3;

interface Course {
  id: number;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  instructor: string;
  thumbnail: string;
  lastAccessed?: string;
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
  onCourseClick?: (courseId: number, courseTitle?: string) => void;
  continueLabel?: string;
  onJoinGroup?: (groupId: number, isMember: boolean) => void;
}

const ActiveModules: React.FC<ActiveModulesProps> = ({
  courses,
  title = 'Khóa học đang học',
  onCourseClick,
  continueLabel = 'Tiếp tục học',
  onJoinGroup
}) => {
  const [sortBy, setSortBy] = useState<ActiveCourseSort>('newest');
  const [filterBy, setFilterBy] = useState<ActiveCourseFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { withPaginationScroll } = useScrollToListTopOnPagination();

  const formatEstimatedTime = (value: string): string => {
    if (!value) return '';

    return value
      .replace(/hours?/gi, 'giờ')
      .replace(/hrs?/gi, 'giờ')
      .replace(/minutes?|mins?/gi, 'phút')
      .replace(/days?/gi, 'ngày');
  };

  const formatNextObjective = (value: string): string => {
    if (!value) return 'Đang cập nhật';

    const normalized = value.trim().toLowerCase();
    if (normalized === 'continue learning') return 'Tiếp tục học';
    if (normalized === 'start learning') return 'Bắt đầu học';
    if (normalized === 'no lesson available') return 'Chưa có bài học';

    return value;
  };

  const getCourseRecencyScore = (course: Course) => {
    const parsedDate = Date.parse(course.lastAccessed || '');
    if (Number.isNaN(parsedDate)) {
      return course.id;
    }
    return parsedDate;
  };

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [course.title, course.instructor, course.nextLesson, course.group?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      let matchesFilter = true;
      if (filterBy === 'just-started') {
        matchesFilter = course.progress <= 25;
      }
      if (filterBy === 'in-progress') {
        matchesFilter = course.progress > 25 && course.progress < 80;
      }
      if (filterBy === 'near-finish') {
        matchesFilter = course.progress >= 80;
      }

      return matchesSearch && matchesFilter;
    });
  }, [courses, filterBy, searchTerm]);

  const sortedCourses = useMemo(() => {
    const next = [...filteredCourses];

    if (sortBy === 'progress-desc') {
      next.sort((a, b) => b.progress - a.progress || b.id - a.id);
      return next;
    }

    if (sortBy === 'progress-asc') {
      next.sort((a, b) => a.progress - b.progress || b.id - a.id);
      return next;
    }

    if (sortBy === 'title-asc') {
      next.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      return next;
    }

    next.sort((a, b) => getCourseRecencyScore(b) - getCourseRecencyScore(a));
    return next;
  }, [filteredCourses, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [courses.length, filterBy, sortBy, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / COURSES_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * COURSES_PER_PAGE;
    return sortedCourses.slice(start, start + COURSES_PER_PAGE);
  }, [currentPage, sortedCourses]);

  const showingStart = sortedCourses.length === 0 ? 0 : (currentPage - 1) * COURSES_PER_PAGE + 1;
  const showingEnd = sortedCourses.length === 0
    ? 0
    : Math.min(currentPage * COURSES_PER_PAGE, sortedCourses.length);

  return (
    <HUDCard title={title} subtitle={`${courses.length} khóa học đang học`} variant="chamfer" delay={0.3}>
      <div className="active-modules">
        <div className="active-modules__toolbar">
          <div className="active-modules__control">
            <label htmlFor="active-modules-sort">Sắp xếp</label>
            <select
              id="active-modules-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as ActiveCourseSort)}
            >
              <option value="newest">Mới nhất</option>
              <option value="progress-desc">Tiến độ giảm dần</option>
              <option value="progress-asc">Tiến độ tăng dần</option>
              <option value="title-asc">Tên A-Z</option>
            </select>
          </div>

          <div className="active-modules__control">
            <label htmlFor="active-modules-search">Tìm kiếm</label>
            <input
              id="active-modules-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên khóa học, giảng viên..."
            />
          </div>

          <div className="active-modules__control">
            <label htmlFor="active-modules-filter">Lọc</label>
            <select
              id="active-modules-filter"
              value={filterBy}
              onChange={(event) => setFilterBy(event.target.value as ActiveCourseFilter)}
            >
              <option value="all">Tất cả</option>
              <option value="just-started">Mới bắt đầu (0-25%)</option>
              <option value="in-progress">Đang học (26-79%)</option>
              <option value="near-finish">Sắp hoàn thành (từ 80%)</option>
            </select>
          </div>

          <div className="active-modules__summary">
            {sortedCourses.length === 0
              ? 'Không có khóa học phù hợp.'
              : `Hiển thị ${showingStart}-${showingEnd} / ${sortedCourses.length}`}
          </div>
        </div>

        {paginatedCourses.map((course, index) => (
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
            onClick={() => onCourseClick?.(course.id, course.title)}
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
                <p className="active-modules__instructor">Giảng viên: {course.instructor}</p>
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
                {course.totalLessons > 0 && (
                  <div className="active-modules__stat">
                    <span className="active-modules__stat-label">ĐÃ ĐỒNG BỘ</span>
                    <span className="active-modules__stat-value">
                      {course.completedLessons}/{course.totalLessons} BÀI
                    </span>
                  </div>
                )}
                <div className="active-modules__stat">
                  <span className="active-modules__stat-label">MỤC TIÊU TIẾP THEO</span>
                  <span className="active-modules__stat-value" title={formatNextObjective(course.nextLesson)}>
                    {formatNextObjective(course.nextLesson)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="active-modules__footer">
                <div className="active-modules__time">
                  <Clock size={14} />
                  <span>{formatEstimatedTime(course.estimatedTime)}</span>
                </div>
                <div className="active-modules__actions">
                    {course.group && (
                        <button
                            type="button"
                            className={`active-modules__button active-modules__button--group ${course.group.isMember ? 'active-modules__button--joined' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (course.group) {
                                    onJoinGroup?.(course.group.id, course.group.isMember);
                                }
                            }}
                        >
                            {course.group.isMember ? 'Vào nhóm chat' : 'Tham gia nhóm'}
                        </button>
                    )}
                    <button
                      type="button"
                      className="active-modules__button active-modules__button--primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCourseClick?.(course.id, course.title);
                      }}
                    >
                      <Play size={14} />
                      {continueLabel}
                    </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {paginatedCourses.length === 0 && (
          <div className="active-modules__empty">Hiện chưa có khóa học phù hợp với bộ lọc đã chọn.</div>
        )}

        {sortedCourses.length > COURSES_PER_PAGE && (
          <div className="active-modules__pagination">
            <button
              type="button"
              className="active-modules__page-btn"
              onClick={withPaginationScroll(() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              )}
              disabled={currentPage === 1}
            >
              Trang trước
            </button>
            <span className="active-modules__page-indicator">Trang {currentPage}/{totalPages}</span>
            <button
              type="button"
              className="active-modules__page-btn"
              onClick={withPaginationScroll(() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              )}
              disabled={currentPage === totalPages}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </HUDCard>
  );
};

export default ActiveModules;
