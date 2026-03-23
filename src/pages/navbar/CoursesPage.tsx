import { useEffect, useState, useCallback } from 'react';
import { Users, Star, BookOpen, Play, Filter, TrendingUp, Folder, Radar, Zap, Target, Shield } from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/CoursesPageCockpit.css';
import Pagination from '../../components/shared/Pagination';
import { useLocation, useNavigate } from 'react-router-dom';
import { listCourses } from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';
import { getUserEnrollments } from '../../services/enrollmentService';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import { CourseSummaryDTO } from '../../data/courseDTOs';
import { buildCourseDetailPath } from '../../utils/courseRoute';

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'popular';
type PriceFilter = 'all' | 'free' | 'paid';

const CoursesPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const itemsPerPage = 12;
  const { user } = useAuth();

  // Helper: get effective price from course
  const getCoursePrice = (course: CourseSummaryDTO): number => {
    return course.purchaseOption?.price ?? course.price ?? 0;
  };

  // Helper: get effective currency from course
  const getCourseCurrency = (course: CourseSummaryDTO): string => {
    return course.purchaseOption?.currency ?? course.currency ?? 'VND';
  };

  // Helper: check if course is free
  const isCourseFree = (course: CourseSummaryDTO): boolean => {
    return getCoursePrice(course) === 0;
  };

  // Helper: get author display name
  const getAuthorName = (course: CourseSummaryDTO): string => {
    return course.authorName ||
      course.author?.fullName ||
      `${course.author?.firstName || ''} ${course.author?.lastName || ''}`.trim() ||
      'Unknown Instructor';
  };

  // Map sort options to Spring Pageable sort format
  const getServerSort = useCallback((sort: SortOption): { field: string; direction: 'asc' | 'desc' } => {
    switch (sort) {
      case 'newest': return { field: 'createdAt', direction: 'desc' };
      case 'oldest': return { field: 'createdAt', direction: 'asc' };
      case 'price-low': return { field: 'price', direction: 'asc' };
      case 'price-high': return { field: 'price', direction: 'desc' };
      default: return { field: 'createdAt', direction: 'desc' };
    }
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Fetch enrolled course IDs once
  useEffect(() => {
    if (user?.id) {
      getUserEnrollments(user.id)
        .then(res => setEnrolledIds(new Set((res.content || []).map((e) => e.courseId))))
        .catch(() => setEnrolledIds(new Set()));
    }
  }, [user?.id]);

  // Fetch courses from server with pagination
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const { field, direction } = getServerSort(sortBy);
        const result = await listCourses(
          currentPage - 1,       // 0-indexed for server
          itemsPerPage,
          undefined,              // level - not supported server-side yet
          'PUBLIC',               // always filter PUBLIC courses
          debouncedSearch || undefined,
          field,
          direction
        );

        // Filter out already-enrolled courses (client-side)
        const available = result.content.filter(c => !enrolledIds.has(c.id));
        setCourses(available);
        setTotalItems(result.totalElements);
      } catch (e) {
        setCourses([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, debouncedSearch, sortBy, enrolledIds, getServerSort]);

  // Client-side post-filters for category, price, level (applied to current page)
  // Note: search and sort are handled server-side
  const filteredCourses = courses.filter(course => {
    const matchCategory = selectedCategory === 'all' || course.category === selectedCategory;

    const matchPrice = priceFilter === 'all' ||
                      (priceFilter === 'free' && isCourseFree(course)) ||
                      (priceFilter === 'paid' && !isCourseFree(course));

    const matchLevel = levelFilter === 'all' || course.level?.toLowerCase() === levelFilter;

    return matchCategory && matchPrice && matchLevel;
  });

  // For rating/popular sort: client-side re-sort (server doesn't support these fields)
  const sortedCourses = (sortBy === 'rating' || sortBy === 'popular')
    ? [...filteredCourses].sort((a, b) =>
        sortBy === 'rating'
          ? (b.averageRating ?? 0) - (a.averageRating ?? 0)
          : (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0)
      )
    : filteredCourses;

  // Use server-provided totalItems for pagination
  const displayedCourses = sortedCourses;

  // Extract dynamic category counts for the filtering panel
  // We use all fetched courses (or a broader course set if available) to build the categories list
  const categoriesMap: { [key: string]: { name: string; count: number } } = courses.reduce((acc, course) => {
    const catId = course.category || 'general';
    const catName = course.categoryName || (catId.charAt(0).toUpperCase() + catId.slice(1));
    
    if (!acc[catId]) {
      acc[catId] = { name: catName, count: 0 };
    }
    acc[catId].count++;
    return acc;
  }, {} as { [key: string]: { name: string; count: number } });

  // Map icons to some common category IDs
  const getCategoryIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case 'tech': return Zap;
      case 'design': return Target;
      case 'business': return TrendingUp;
      case 'marketing': return Star;
      case 'language': return BookOpen;
      case 'soft-skills': return Users;
      default: return Folder;
    }
  };

  const categories = [
    { id: 'all', name: 'Tất Cả', count: courses.length, icon: Shield },
    ...Object.entries(categoriesMap).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
      icon: getCategoryIcon(id)
    }))
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
            <MeowlKuruLoader size="medium" text="" />
            <p className="cockpit-loading-text">Đang tải khóa học...</p>
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
            <span className="cockpit-scan-label">KẾT QUẢ:</span>
            <span className="cockpit-scan-count">{displayedCourses.length}</span>
            <span className="cockpit-scan-unit">KHÓA HỌC</span>
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
              <span className="cockpit-panel-title">Danh mục</span>
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
                    width: `${courses.length > 0 ? (courses.filter(c => isCourseFree(c)).length / courses.length * 100) : 0}%`
                  }}></div>
                </div>
                <span className="cockpit-status-label">Miễn phí: {courses.filter(c => isCourseFree(c)).length} khóa</span>
              </div>
              <div className="cockpit-status-item">
                <div className="cockpit-status-bar">
                  <div className="cockpit-status-fill cockpit-status-fill-alt" style={{
                    width: `${courses.length > 0 ? (courses.filter(c => !isCourseFree(c)).length / courses.length * 100) : 0}%`
                  }}></div>
                </div>
                <span className="cockpit-status-label">Có phí: {courses.filter(c => !isCourseFree(c)).length} khóa</span>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="cockpit-modules-section">
            {displayedCourses.length === 0 ? (
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
                {displayedCourses.map((course, index) => {
                  const authorName = getAuthorName(course);
                  const courseImage = course.thumbnailUrl || course.thumbnail?.url || '/images/default-course.jpg';
                  const price = getCoursePrice(course);

                  return (
                  <div
                    key={course.id}
                    className="cockpit-module-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(buildCourseDetailPath({ id: course.id, title: course.title }), {
                      state: {
                        course: course,
                        fromPath: location.pathname,
                        fromSearch: location.search,
                        fromHash: location.hash,
                        fromLabel: 'danh sách khóa học'
                      }
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
                      <img src={courseImage} alt={course.title} className="cockpit-module-image" />
                      <div className="cockpit-module-overlay">
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
                        <span className="cockpit-label">GIẢNG VIÊN:</span> {authorName === 'Unknown' || authorName === 'Unknown Instructor' ? 'Đang cập nhật' : authorName}
                      </p>

                      <div className="cockpit-module-stats">
                        <div className="cockpit-stat-item">
                          <BookOpen className="cockpit-stat-icon" />
                          <span>{course.moduleCount ?? 0} MODULES</span>
                        </div>
                        <div className="cockpit-stat-item">
                          <Users className="cockpit-stat-icon" />
                          <span>{(course.enrollmentCount ?? 0) === 0 ? 'MỚI' : `${course.enrollmentCount} HỌC VIÊN`}</span>
                        </div>
                      </div>

                      {/* Module Footer */}
                      <div className="cockpit-module-footer">
                        <div className="cockpit-price-display">
                          <span className="cockpit-price">
                            {price === 0 ? 'MIỄN PHÍ' : price.toLocaleString('vi-VN') + ' ' + getCourseCurrency(course)}
                          </span>
                        </div>
                        <button
                          className="cockpit-engage-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(buildCourseDetailPath({ id: course.id, title: course.title }), {
                              state: {
                                course: course,
                                fromPath: location.pathname,
                                fromSearch: location.search,
                                fromHash: location.hash,
                                fromLabel: 'danh sách khóa học'
                              }
                            });
                          }}
                        >
                          <Zap className="cockpit-btn-icon" />
                          XEM CHI TIẾT
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
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalItems > itemsPerPage && (
          <div className="cockpit-pagination-wrapper">
            <Pagination
              totalItems={totalItems}
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
