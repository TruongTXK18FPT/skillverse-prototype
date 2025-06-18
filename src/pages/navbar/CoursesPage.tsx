import React, { useState } from 'react';
import { Search, Filter, Clock, Users, Star, BookOpen, Trophy, Play } from 'lucide-react';
import '../../styles/CoursesPage.css';

const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tất Cả', count: 156 },
    { id: 'tech', name: 'Công Nghệ', count: 45 },
    { id: 'design', name: 'Thiết Kế', count: 32 },
    { id: 'business', name: 'Kinh Doanh', count: 28 },
    { id: 'marketing', name: 'Marketing', count: 25 },
    { id: 'language', name: 'Ngoại Ngữ', count: 18 },
    { id: 'soft-skills', name: 'Kỹ Năng Mềm', count: 8 }
  ];

  const courses = [
    {
      id: 1,
      title: 'React.js Cơ Bản đến Nâng Cao',
      instructor: 'John Smith',
      category: 'tech',
      rating: 4.8,
      students: 1234,
      duration: '8 giờ',
      price: 'Miễn phí',
      image: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Trung cấp',
      description: 'Học React.js từ cơ bản đến nâng cao với các dự án thực tế',
      modules: 12,
      certificate: true
    },
    {
      id: 2,
      title: 'Thiết Kế UI/UX Thực Hành',
      instructor: 'Sarah Johnson',
      category: 'design',
      rating: 4.9,
      students: 892,
      duration: '6 giờ',
      price: '690.000đ',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Sơ cấp',
      description: 'Thiết kế UI/UX chuyên nghiệp với Figma',
      modules: 8,
      certificate: true
    },
    {
      id: 3,
      title: 'Marketing Số Từ A-Z',
      instructor: 'Michael Brown',
      category: 'marketing',
      rating: 4.7,
      students: 1567,
      duration: '10 giờ',
      price: '1.150.000đ',
      image: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Nâng cao',
      description: 'Chiến lược marketing số toàn diện cho doanh nghiệp',
      modules: 15,
      certificate: true
    },
    {
      id: 4,
      title: 'Python cho Người Mới Bắt Đầu',
      instructor: 'David Wilson',
      category: 'tech',
      rating: 4.6,
      students: 2103,
      duration: '12 giờ',
      price: 'Miễn phí',
      image: 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Sơ cấp',
      description: 'Bắt đầu lập trình với Python từ con số 0 với các bài tập thực hành',
      modules: 20,
      certificate: true
    },
    {
      id: 5,
      title: 'Kỹ Năng Thuyết Trình Chuyên Nghiệp',
      instructor: 'Emma Davis',
      category: 'soft-skills',
      rating: 4.8,
      students: 756,
      duration: '4 giờ',
      price: '460.000đ',
      image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Trung cấp',
      description: 'Nâng cao kỹ năng thuyết trình và giao tiếp trong công việc',
      modules: 6,
      certificate: true
    },
    {
      id: 6,
      title: 'Quản Lý Dự Án Agile',
      instructor: 'Robert Taylor',
      category: 'business',
      rating: 4.7,
      students: 634,
      duration: '7 giờ',
      price: '920.000đ',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Nâng cao',
      description: 'Phương pháp quản lý dự án Agile hiệu quả',
      modules: 10,
      certificate: true
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="courses-container">
      <div className="courses-content">
        {/* Header */}
        <div className="courses-header">
          <h1 className="courses-title">Khóa Học Ngắn Hạn</h1>
          <p className="courses-description">
            Học các kỹ năng thực tế với các khóa học ngắn gọn, tập trung mà bạn có thể áp dụng ngay lập tức
          </p>
        </div>

        {/* Search and Filter */}
        <div className="search-container">
          <div className="search-form">
            <div className="search-input-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          {/* Sidebar Categories */}
          <div className="sidebar">
            <div className="category-container">
              <h3 className="category-title">Danh Mục</h3>
              <div className="category-list">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                  >
                    <span>{category.name}</span>
                    <span className="category-count">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-image-container">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="course-image"
                  />
                  <div className="course-preview-overlay">
                    <button className="preview-button">
                      <Play />
                      <span>Xem trước</span>
                    </button>
                  </div>
                  <div className={`course-level-badge level-${course.level.toLowerCase()}`}>
                    {course.level}
                  </div>
                  {course.price === 'Miễn phí' && (
                    <div className="course-free-badge">
                      Miễn phí
                    </div>
                  )}
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
                      <span>{course.students.toLocaleString()}</span>
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

            {filteredCourses.length === 0 && (
              <div className="empty-state">
                <BookOpen className="empty-icon" />
                <h3 className="empty-title">Không tìm thấy khóa học</h3>
                <p className="empty-description">Vui lòng điều chỉnh tìm kiếm hoặc bộ lọc của bạn</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;