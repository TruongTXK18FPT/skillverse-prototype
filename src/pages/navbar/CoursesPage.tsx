import { useEffect, useState } from 'react';
import { Clock, Users, Star, BookOpen, Award, Play, ChevronDown, Filter, TrendingUp, GraduationCap, Folder, Radar, Zap, Target, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/CoursesPageCockpit.css';
import Pagination from '../../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { parsePrice, isFreePrice, listPublishedCourses, Course } from '../../services/courseService';
import MeowlGuide from '../../components/MeowlGuide';
import { CourseSummaryDTO } from '../../data/courseDTOs';

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
  listPublishedCourses(0, 100)
    .then(response => {
      const legacyCourses = response.content.map((dto: CourseSummaryDTO) => {
        const authorFullName = dto.authorName ||
                              (dto.author?.fullName) ||
                              `${dto.author?.firstName || ''} ${dto.author?.lastName || ''}`.trim() ||
                              'Unknown Instructor';

        // Get price from purchaseOption first, fallback to dto.price
        const actualPrice = dto.purchaseOption?.price ?? dto.price ?? 0;
        const actualCurrency = dto.purchaseOption?.currency ?? dto.currency ?? 'VND';

        return {
          id: dto.id.toString(),
          title: dto.title,
          instructor: authorFullName,
          category: 'general',
          image: dto.thumbnailUrl || '/images/default-course.jpg',
          level: (dto.level || 'BEGINNER').toLowerCase(),
          price: (actualPrice !== null && actualPrice !== undefined && actualPrice !== 0)
            ? `${actualPrice} ${actualCurrency}`
            : '0',
          rating: 0,
          students: dto.enrollmentCount || 0,
          description: dto.title || '',
          duration: '0',
          modules: (dto.moduleCount !== null && dto.moduleCount !== undefined) ? dto.moduleCount : 0,
          certificate: false
        };
      });

      setCourses(legacyCourses);
      setLoading(false);
    })
    .catch(() => {
      setCourses([]);
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
  { id: 'all', name: 'Tất Cả', count: courses.length, icon: Shield },
  { id: 'tech', name: 'Công Nghệ', count: categoriesMap['tech'] ?? 0, icon: Zap },
  { id: 'design', name: 'Thiết Kế', count: categoriesMap['design'] ?? 0, icon: Target },
  { id: 'business', name: 'Kinh Doanh', count: categoriesMap['business'] ?? 0, icon: TrendingUp },
  { id: 'marketing', name: 'Marketing', count: categoriesMap['marketing'] ?? 0, icon: Star },
  { id: 'language', name: 'Ngoại Ngữ', count: categoriesMap['language'] ?? 0, icon: BookOpen },
  { id: 'soft-skills', name: 'Kỹ Năng Mềm', count: categoriesMap['soft-skills'] ?? 0, icon: Users }
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
      <div className={`cockpit-courses-container ${theme}`} data-theme={theme}>
        <div className="cockpit-hud-frame">
          <div className="cockpit-loading-container">
            <div className="cockpit-radar-spinner">
              <div className="cockpit-radar-sweep"></div>
              <div className="cockpit-radar-blip"></div>
            </div>
            <p className="cockpit-loading-text">KHỞI ĐỘNG HỆ THỐNG...</p>
            <div className="cockpit-loading-bar">
              <div className="cockpit-loading-progress"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cockpit-courses-container ${theme}`} data-theme={theme}>
      {/* HUD Corner Decorations */}
      <div className="cockpit-hud-corners">
        <div className="cockpit-corner cockpit-corner-tl"></div>
        <div className="cockpit-corner cockpit-corner-tr"></div>
        <div className="cockpit-corner cockpit-corner-bl"></div>
        <div className="cockpit-corner cockpit-corner-br"></div>
      </div>

      {/* Main HUD Frame */}
      <div className="cockpit-hud-frame">
        {/* Header HUD */}
        <div className="cockpit-header-hud">
          <div className="cockpit-header-left">
            <div className="cockpit-system-indicator">
              <div className="cockpit-pulse-dot"></div>
              <span className="cockpit-system-text">SYS ONLINE</span>
            </div>
          </div>

          <div className="cockpit-header-center">
            <h1 className="cockpit-main-title">KHÁM PHÁ <br />THIÊN HÀ TRI THỨC</h1>
            <div className="cockpit-subtitle">Data Upgrade Modules</div>
          </div>

          <div className="cockpit-header-right">
            <div className="cockpit-stats-mini">
              <div className="cockpit-stat-mini-item">
                <span className="cockpit-stat-label">MODULES</span>
                <span className="cockpit-stat-value">{courses.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radar Search Section */}
        <div className="cockpit-radar-search-section">
          <div className="cockpit-radar-icon-wrapper">
            <Radar className="cockpit-radar-icon" />
            <div className="cockpit-radar-pulse"></div>
          </div>

          <div className="cockpit-search-input-container">
            <input
              type="text"
              placeholder="BẮT ĐẦU QUÉT DỮ LIỆU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="cockpit-search-input"
            />
            <div className="cockpit-search-scan-line"></div>
          </div>

          <button
            className={`cockpit-filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="cockpit-icon" />
            <span>BỘ LỌC</span>
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="cockpit-filters-panel">
            <div className="cockpit-filter-group">
              <div className="cockpit-filter-label">
                <Zap className="cockpit-filter-icon" />
                GIÁ
              </div>
              <div className="cockpit-filter-options">
                {priceOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`cockpit-filter-btn ${priceFilter === option.value ? 'active' : ''}`}
                    onClick={() => setPriceFilter(option.value as PriceFilter)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cockpit-filter-group">
              <div className="cockpit-filter-label">
                <Target className="cockpit-filter-icon" />
                CẤP ĐỘ
              </div>
              <div className="cockpit-filter-options">
                {levelOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`cockpit-filter-btn ${levelFilter === option.value ? 'active' : ''}`}
                    onClick={() => setLevelFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cockpit-filter-group">
              <div className="cockpit-filter-label">
                <TrendingUp className="cockpit-filter-icon" />
                SẮP XẾP
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="cockpit-sort-select"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="cockpit-results-info">
          <div className="cockpit-scan-result">
            <span className="cockpit-scan-label">SCAN RESULT:</span>
            <span className="cockpit-scan-count">{sortedCourses.length}</span>
            <span className="cockpit-scan-unit">MODULES DETECTED</span>
          </div>
          {(searchTerm || selectedCategory !== 'all' || priceFilter !== 'all' || levelFilter !== 'all') && (
            <button
              className="cockpit-clear-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceFilter('all');
                setLevelFilter('all');
                setCurrentPage(1);
              }}
            >
              RESET FILTERS
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="cockpit-main-grid">
          {/* Control Panel Sidebar */}
          <div className="cockpit-control-panel">
            <div className="cockpit-panel-header">
              <Folder className="cockpit-panel-icon" />
              <span className="cockpit-panel-title">BẢNG ĐIỀU KHIỂN</span>
            </div>

            <div className="cockpit-categories-list">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setCurrentPage(1);
                    }}
                    className={`cockpit-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  >
                    <div className="cockpit-category-content">
                      <IconComponent className="cockpit-category-icon" />
                      <span className="cockpit-category-name">{category.name}</span>
                    </div>
                    <div className="cockpit-category-badge">{category.count}</div>
                  </button>
                );
              })}
            </div>

            {/* System Status */}
            <div className="cockpit-system-status">
              <div className="cockpit-status-header">TRẠNG THÁI HỆ THỐNG</div>
              <div className="cockpit-status-item">
                <div className="cockpit-status-bar">
                  <div className="cockpit-status-fill" style={{
                    width: `${courses.length > 0 ? (courses.filter(c => isFreePrice(c.price)).length / courses.length * 100) : 0}%`
                  }}></div>
                </div>
                <span className="cockpit-status-label">Miễn phí: {courses.filter(c => isFreePrice(c.price)).length} khóa</span>
              </div>
              <div className="cockpit-status-item">
                <div className="cockpit-status-bar">
                  <div className="cockpit-status-fill cockpit-status-fill-alt" style={{
                    width: `${courses.length > 0 ? (courses.filter(c => !isFreePrice(c.price)).length / courses.length * 100) : 0}%`
                  }}></div>
                </div>
                <span className="cockpit-status-label">Có phí: {courses.filter(c => !isFreePrice(c.price)).length} khóa</span>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="cockpit-modules-section">
            {paginatedCourses.length === 0 ? (
              <div className="cockpit-empty-state">
                <div className="cockpit-empty-icon">
                  <Radar className="cockpit-radar-empty" />
                </div>
                <h3 className="cockpit-empty-title">KHÔNG PHÁT HIỆN MODULE</h3>
                <p className="cockpit-empty-text">
                  Điều chỉnh thông số quét hoặc đặt lại bộ lọc
                </p>
                <button
                  className="cockpit-reset-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceFilter('all');
                    setLevelFilter('all');
                  }}
                >
                  ĐẶT LẠI HỆ THỐNG
                </button>
              </div>
            ) : (
              <div className="cockpit-modules-grid">
                {paginatedCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="cockpit-module-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/courses/${course.id}`, {
                      state: { course: course }
                    })}
                  >
                    {/* Module Header */}
                    <div className="cockpit-module-header">
                      <div className="cockpit-module-level-indicator">
                        <div className="cockpit-level-dot"></div>
                        <span className="cockpit-level-text">LEVEL</span>
                      </div>
                      <div className="cockpit-module-id">#{course.id}</div>
                    </div>

                    {/* Module Image */}
                    <div className="cockpit-module-image-container">
                      <img src={course.image} alt={course.title} className="cockpit-module-image" />
                      <div className="cockpit-module-overlay">
                        <button className="cockpit-preview-btn">
                          <Play className="cockpit-play-icon" />
                          <span>XEM TRƯỚC</span>
                        </button>
                      </div>

                      {/* Energy Crystal Icon */}
                      <div className="cockpit-energy-crystal">
                        <div className="cockpit-crystal-glow"></div>
                      </div>
                    </div>

                    {/* Module Info */}
                    <div className="cockpit-module-info">
                      <h3 className="cockpit-module-title">{course.title}</h3>
                      <p className="cockpit-module-instructor">
                        <span className="cockpit-label">INSTRUCTOR:</span> {course.instructor}
                      </p>

                      <div className="cockpit-module-stats">
                        <div className="cockpit-stat-item">
                          <BookOpen className="cockpit-stat-icon" />
                          <span>{course.modules ?? 12} LESSONS</span>
                        </div>
                        <div className="cockpit-stat-item">
                          <Users className="cockpit-stat-icon" />
                          <span>{course.students} ENROLLED</span>
                        </div>
                      </div>

                      {/* Module Footer */}
                      <div className="cockpit-module-footer">
                        <div className="cockpit-price-display">
                          <span className="cockpit-price">
                            {(() => {
                              const numPrice = parseInt(course.price?.replace(/[^\d]/g, '') || '0');
                              return numPrice === 0 ? 'FREE' : course.price;
                            })()}
                          </span>
                        </div>
                        <button
                          className="cockpit-engage-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course.id}`, {
                              state: { course: course }
                            });
                          }}
                        >
                          <Zap className="cockpit-btn-icon" />
                          KHỞI ĐỘNG
                        </button>
                      </div>
                    </div>

                    {/* Card Corner Accents */}
                    <div className="cockpit-card-corners">
                      <div className="cockpit-card-corner cockpit-card-corner-tl"></div>
                      <div className="cockpit-card-corner cockpit-card-corner-tr"></div>
                      <div className="cockpit-card-corner cockpit-card-corner-bl"></div>
                      <div className="cockpit-card-corner cockpit-card-corner-br"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {sortedCourses.length > itemsPerPage && (
          <div className="cockpit-pagination-wrapper">
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