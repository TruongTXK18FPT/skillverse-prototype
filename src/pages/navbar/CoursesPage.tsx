import { useEffect, useState } from 'react';
import { Search, Clock, Users, Star, BookOpen, Trophy, Play, ChevronDown, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/CoursesPage.css';
import Pagination from '../../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { fetchAllCourses, parsePrice, isFreePrice, Course } from '../../services/courseService';
import MeowlGuide from '../../components/MeowlGuide';
type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'popular';
type PriceFilter = 'all' | 'free' | 'paid';

const CoursesPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 12;


useEffect(() => {
  setLoading(true);
  fetchAllCourses()
    .then(data => {
      // Debug: Log price values to console
      console.log('Course prices:', data.map((c: Course) => ({ id: c.id, title: c.title, price: c.price })));
      
      setCourses(data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching courses:', err);
      setLoading(false);
    });
}, []);

  // Sort courses
  const sortCourses = (coursesToSort: Course[]): Course[] => {
    return [...coursesToSort].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parsePrice(a.price ?? '') - parsePrice(b.price ?? '');
        case 'price-high':
          return parsePrice(b.price ?? '') - parsePrice(a.price ?? '');
        case 'rating':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'popular': {
          const aStudents = typeof a.students === 'number' ? a.students : parseInt(a.students ?? '0');
          const bStudents = typeof b.students === 'number' ? b.students : parseInt(b.students ?? '0');
          return bStudents - aStudents;
        }
        case 'oldest': {
          const aId = parseInt(String(a.id)) || 0;
          const bId = parseInt(String(b.id)) || 0;
          return aId - bId;
        }
        case 'newest':
        default: {
          const aId = parseInt(String(a.id)) || 0;
          const bId = parseInt(String(b.id)) || 0;
          return bId - aId;
        }
      }
    });
  };

  const filteredCourses = courses.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = selectedCategory === 'all' || course.category === selectedCategory;
    
    const matchPrice = priceFilter === 'all' || 
                      (priceFilter === 'free' && isFreePrice(course.price)) ||
                      (priceFilter === 'paid' && !isFreePrice(course.price));
    
    const matchLevel = levelFilter === 'all' || course.level?.toLowerCase() === levelFilter;
    
    return matchSearch && matchCategory && matchPrice && matchLevel;
  });

  const sortedCourses = sortCourses(filteredCourses);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = sortedCourses.slice(startIndex, startIndex + itemsPerPage);

  // Extract dynamic category counts
  const categoriesMap: Record<string, number> = courses.reduce((acc, course) => {
    acc[course.category] = (acc[course.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

const categories = [
  { id: 'all', name: 'Tất Cả', count: courses.length, icon: '📚' },
  { id: 'tech', name: 'Công Nghệ', count: categoriesMap['tech'] ?? 0, icon: '💻' },
  { id: 'design', name: 'Thiết Kế', count: categoriesMap['design'] ?? 0, icon: '🎨' },
  { id: 'business', name: 'Kinh Doanh', count: categoriesMap['business'] ?? 0, icon: '💼' },
  { id: 'marketing', name: 'Marketing', count: categoriesMap['marketing'] ?? 0, icon: '📊' },
  { id: 'language', name: 'Ngoại Ngữ', count: categoriesMap['language'] ?? 0, icon: '🌍' },
  { id: 'soft-skills', name: 'Kỹ Năng Mềm', count: categoriesMap['soft-skills'] ?? 0, icon: '🧠' }
];

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'price-low', label: 'Giá thấp đến cao' },
    { value: 'price-high', label: 'Giá cao đến thấp' },
    { value: 'rating', label: 'Đánh giá cao nhất' },
    { value: 'popular', label: 'Phổ biến nhất' }
  ];

  const priceOptions = [
    { value: 'all', label: 'Tất cả giá' },
    { value: 'free', label: 'Miễn phí' },
    { value: 'paid', label: 'Có phí' }
  ];

  const levelOptions = [
    { value: 'all', label: 'Tất cả cấp độ' },
    { value: 'basic', label: 'Cơ bản' },
    { value: 'intermediate', label: 'Trung cấp' },
    { value: 'advanced', label: 'Nâng cao' }
  ];

  if (loading) {
    return (
      <div className={`courses-container ${theme}`} data-theme={theme}>
        <div className="courses-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải khóa học...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`courses-container ${theme}`} data-theme={theme}>
      <div className="courses-content">
        {/* Hero Section */}
        <div className="courses-hero">
          <div className="hero-content">
            <h1 className="courses-title">
              <span className="hero-icon">🎓</span>
              {' '}Khóa Học Chuyên Nghiệp
            </h1>
            <p className="courses-description">
              Nâng cao kỹ năng với các khóa học chất lượng từ các chuyên gia hàng đầu
            </p>
            <div className="hero-stats">
              <div className="course-stat-item">
                <span className="stat-number">{courses.length}</span>
                <span className="course-stat-label">Khóa học</span>
              </div>
              <div className="course-stat-item">
                <span className="stat-number">{categories.length - 1}</span>
                <span className="course-stat-label">Lĩnh vực</span>
              </div>
              <div className="course-stat-item">
                <span className="stat-number">1000+</span>
                <span className="course-stat-label">Học viên</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="search-filter-container">
          <div className="search-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học, giảng viên..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-section">
            <button
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="filter-icon" />
              Bộ lọc
              <ChevronDown className={`chevron ${showFilters ? 'rotated' : ''}`} />
            </button>

            <div className="sort-section">
              <ArrowUpDown className="sort-icon" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="sort-select"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-group">
                <div className="filter-label">Giá</div>
                <div className="filter-options">
                  {priceOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`filter-option-btn ${priceFilter === option.value ? 'active' : ''}`}
                      onClick={() => setPriceFilter(option.value as PriceFilter)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-label">Cấp độ</div>
                <div className="filter-options">
                  {levelOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`filter-option-btn ${levelFilter === option.value ? 'active' : ''}`}
                      onClick={() => setLevelFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <div className="results-count">
            Tìm thấy <strong>{sortedCourses.length}</strong> khóa học
            {searchTerm && (
              <span className="search-term">
                {' '}cho "<em>{searchTerm}</em>"
              </span>
            )}
          </div>
          
          {(searchTerm || selectedCategory !== 'all' || priceFilter !== 'all' || levelFilter !== 'all') && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceFilter('all');
                setLevelFilter('all');
                setCurrentPage(1);
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="main-content">
          {/* Enhanced Sidebar */}
          <div className="course-sidebar">
            <div className="category-container">
              <h3 className="course-category-title">
                <span className="category-icon">📂</span>
                {' '}Danh Mục Khóa Học
              </h3>
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
                    <div className="category-info">
                      <span className="category-emoji">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <span className="category-count">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Info */}
            <div className="price-info-container">
              <h4 className="price-info-title">Thông tin giá</h4>
              <div className="price-stats">
                <div className="price-stat">
                  <span className="price-label">Miễn phí:</span>
                  <span className="price-value">
                    {courses.filter(c => isFreePrice(c.price)).length} khóa
                  </span>
                </div>
                <div className="price-stat">
                  <span className="price-label">Có phí:</span>
                  <span className="price-value">
                    {courses.filter(c => !isFreePrice(c.price)).length} khóa
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Courses Grid */}
          <div className="courses-section">
            {paginatedCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3 className="empty-title">Không tìm thấy khóa học</h3>
                <p className="empty-description">
                  Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn
                </p>
                <button
                  className="reset-search-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceFilter('all');
                    setLevelFilter('all');
                  }}
                >
                  Đặt lại tìm kiếm
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {paginatedCourses.map((course, index) => (
                  <div 
                    key={course.id} 
                    className="course-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate(`/courses/${course.id}`, {
                      state: { course: course }
                    })}
                  >
                    <div className="course-image-container">
                      <img src={course.image} alt={course.title} className="course-image" />
                      <div className="course-preview-overlay">
                        <button className="preview-button">
                          <Play className="play-icon" />
                          <span>Xem trước</span>
                        </button>
                      </div>
                      
                      {/* Enhanced Badges */}
                      <div className="course-badges">
                        {course.level && (
                          <div className={`course-level-badge level-${course.level?.toLowerCase()}`}>
                            {course.level}
                          </div>
                        )}
                        {(!course.price || isFreePrice(course.price)) && (
                          <div className="course-free-badge">Miễn phí</div>
                        )}
                        {course.certificate && (
                          <div className="course-certificate-badge">
                            <Trophy className="certificate-icon" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="course-content">
                      <div className="course-stats">
                        <div className="course-rating">
                          <Star className="rating-star filled" />
                          <span className="course-rating-value">{course.rating?.toFixed(1)}</span>
                        </div>
                        <span className="stats-divider">•</span>
                        <div className="course-students">
                          <Users className="students-icon" />
                          <span>
                            {typeof course.students === 'number' ? 
                              course.students.toLocaleString() : 
                              parseInt(course.students ?? '0').toLocaleString()
                            }
                          </span>
                        </div>
                      </div>

                      <h3 className="course-title">{course.title}</h3>
                      <p className="course-description">{course.description}</p>
                      <p className="course-instructor">
                        <span className="instructor-label">Giảng viên:</span>
                        {' '}{course.instructor}
                      </p>

                      <div className="course-meta">
                        <div className="meta-item">
                          <Clock className="meta-icon" />
                          <span>{course.duration ?? '4-6 tuần'}</span>
                        </div>
                        <div className="meta-item">
                          <BookOpen className="meta-icon" />
                          <span>{course.modules ?? 12} bài học</span>
                        </div>
                      </div>

                      <div className="course-footer">
                        <div className="price-section">
                          <span className="course-price">
                            {isFreePrice(course.price) ? 'Miễn phí' : (course.price ?? 'Miễn phí')}
                          </span>
                          {course.price && !isFreePrice(course.price) && (
                            <span className="price-period">/khóa</span>
                          )}
                        </div>
                        <button className="enroll-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course.id}`, {
                              state: { course: course }
                            });
                          }}
                        >
                          <span className="enroll-icon">⚡</span>
                          {' '}Đăng Ký Ngay
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Pagination */}
        {sortedCourses.length > itemsPerPage && (
          <div className="pagination-wrapper">
            <Pagination
              totalItems={sortedCourses.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="courses" />
    </div>
  );
};

export default CoursesPage;

