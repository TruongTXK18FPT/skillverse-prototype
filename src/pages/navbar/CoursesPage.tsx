import React, { useEffect, useState } from 'react';
import { Search, Filter, Clock, Users, Star, BookOpen, Trophy, Play } from 'lucide-react';
import '../../styles/CoursesPage.css';
import Pagination from '../../components/Pagination';

type Course = {
  id: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  level?: string;
  price?: string;
  rating?: number;
  students?: string | number;
  description?: string;
  duration?: string;
  modules?: number;
  certificate?: boolean;
};
const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


useEffect(() => {
  fetch('https://685174ec8612b47a2c0a2925.mockapi.io/Course')
    .then(res => res.json())
    .then(data => {
      // Normalize category string
      const normalized = (str: string) => str.trim().toLowerCase();
      const updatedCourses = data.map((course: Course) => ({
        ...course,
        category: normalized(course.category)
      }));
      setCourses(updatedCourses);
    })
    .catch(err => console.error('Error fetching courses:', err));
}, []);

  const filteredCourses = courses.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

  // Extract dynamic category counts
  const categoriesMap: Record<string, number> = courses.reduce((acc, course) => {
    acc[course.category] = (acc[course.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

const categories = [
  { id: 'all', name: 'Tất Cả', count: courses.length },
  { id: 'tech', name: 'Công Nghệ', count: categoriesMap['tech'] || 0 },
  { id: 'design', name: 'Thiết Kế', count: categoriesMap['design'] || 0 },
  { id: 'business', name: 'Kinh Doanh', count: categoriesMap['business'] || 0 },
  { id: 'marketing', name: 'Marketing', count: categoriesMap['marketing'] || 0 },
  { id: 'language', name: 'Ngoại Ngữ', count: categoriesMap['language'] || 0 },
  { id: 'soft-skills', name: 'Kỹ Năng Mềm', count: categoriesMap['soft-skills'] || 0 }
];

  return (
    <div className="courses-container">
      <div className="courses-content">
        <div className="courses-header">
          <h1 className="courses-title">Khóa Học Ngắn Hạn</h1>
          <p className="courses-description">
            Học các kỹ năng thực tế với các khóa học ngắn gọn, tập trung mà bạn có thể áp dụng ngay lập tức
          </p>
        </div>

        <div className="search-container">
          <div className="search-form">
            <div className="search-input-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
            <button className="filter-button">
              <Filter />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="sidebar">
            <div className="category-container">
              <h3 className="category-title">Danh Mục</h3>
              <div className="category-list">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setCurrentPage(1);
                    }}
                    className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                  >
                    <span>{category.name}</span>
                    <span className="category-count">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="courses-grid">
            {paginatedCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-image-container">
                  <img src={course.image} alt={course.title} className="course-image" />
                  <div className="course-preview-overlay">
                    <button className="preview-button">
                      <Play />
                      <span>Xem trước</span>
                    </button>
                  </div>
                  <div className={`course-level-badge level-${course.level?.toLowerCase()}`}>{course.level}</div>
                  {course.price?.toLowerCase() === 'miễn phí' && <div className="course-free-badge">Miễn phí</div>}
                </div>

                <div className="course-content">
                  <div className="course-stats">
                    <div className="course-rating">
                      <Star className="rating-star" />
                      <span>{course.rating}</span>
                    </div>
                    <span className="stats-divider">•</span>
                    <div className="course-students">
                      <Users />
                      <span>{typeof course.students === 'number' ? course.students.toLocaleString() : parseInt(course.students || '0').toLocaleString()}</span>
                    </div>
                  </div>

                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <p className="course-instructor">Giảng viên: {course.instructor}</p>

                  <div className="course-meta">
                    <div className="meta-item">
                      <Clock className="meta-icon" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="meta-item">
                      <BookOpen className="meta-icon" />
                      <span>{course.modules} bài học</span>
                    </div>
                    {course.certificate && (
                      <div className="meta-item">
                        <Trophy className="meta-icon" />
                        <span>Chứng chỉ</span>
                      </div>
                    )}
                  </div>

                  <div className="course-footer">
                    <span className="course-price">{course.price}</span>
                    <button className="enroll-button">
                      Đăng Ký Ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {paginatedCourses.length === 0 && (
              <div className="empty-state">
                <BookOpen className="empty-icon" />
                <h3 className="empty-title">Không tìm thấy khóa học</h3>
                <p className="empty-description">Vui lòng điều chỉnh tìm kiếm hoặc bộ lọc của bạn</p>
              </div>
            )}
          </div>
        </div>

        <Pagination
          totalItems={filteredCourses.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CoursesPage;

