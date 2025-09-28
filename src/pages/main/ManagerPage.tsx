import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Eye, Search, Filter, 
  Users, BookOpen, MessageSquare, Briefcase, Star
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/ManagerPage.css';

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  price: number;
  students: number;
  rating: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  purchased: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  budget: string;
  category: string;
  status: 'active' | 'closed' | 'pending';
  applications: number;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  title: string;
  author: string;
  category: string;
  likes: number;
  comments: number;
  status: 'published' | 'draft' | 'reported';
  createdAt: string;
}

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  sessions: number;
  hourlyRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const ManagerPage = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  const itemsPerPage = 10;

  // Mock data for demonstration
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock courses data
    setCourses([
      {
        id: '1',
        title: 'React.js Advanced',
        instructor: 'John Smith',
        category: 'Technology',
        price: 690000,
        students: 1234,
        rating: 4.8,
        status: 'active',
        createdAt: '2024-01-15',
        purchased: 856
      },
      {
        id: '2',
        title: 'UI/UX Design Fundamentals',
        instructor: 'Sarah Johnson',
        category: 'Design',
        price: 590000,
        students: 892,
        rating: 4.9,
        status: 'active',
        createdAt: '2024-01-10',
        purchased: 623
      }
    ]);

    // Mock jobs data
    setJobs([
      {
        id: '1',
        title: 'Frontend Developer',
        company: 'Tech Corp',
        budget: '15-25 triệu',
        category: 'Technology',
        status: 'active',
        applications: 45,
        createdAt: '2024-01-20'
      }
    ]);

    // Mock community posts
    setPosts([
      {
        id: '1',
        title: 'Best React Practices 2024',
        author: 'Nguyễn Văn A',
        category: 'Discussion',
        likes: 234,
        comments: 56,
        status: 'published',
        createdAt: '2024-01-18'
      }
    ]);

    // Mock mentors data
    setMentors([
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        expertise: ['React', 'Vue.js', 'TypeScript'],
        rating: 4.9,
        sessions: 128,
        hourlyRate: 120,
        status: 'active',
        createdAt: '2024-01-01'
      }
    ]);
  };

  const handleDelete = (id: string, type: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
      switch (type) {
        case 'courses':
          setCourses(courses.filter(item => item.id !== id));
          break;
        case 'jobs':
          setJobs(jobs.filter(item => item.id !== id));
          break;
        case 'posts':
          setPosts(posts.filter(item => item.id !== id));
          break;
        case 'mentors':
          setMentors(mentors.filter(item => item.id !== id));
          break;
      }
    }
  };

  const handleAddCourse = (courseData: Omit<Course, 'id' | 'students' | 'rating' | 'status' | 'createdAt' | 'purchased'>) => {
    const newCourse: Course = {
      id: Date.now().toString(),
      students: 0,
      rating: 0,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      purchased: 0,
      ...courseData
    };
    setCourses([...courses, newCourse]);
    setShowAddForm(false);
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'courses': return courses;
      case 'jobs': return jobs;
      case 'posts': return posts;
      case 'mentors': return mentors;
      default: return [];
    }
  };

  const filteredData = getCurrentData().filter((item: Course | Job | CommunityPost | Mentor) =>
    ('title' in item ? item.title?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    ('name' in item ? item.name?.toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const stats = [
    {
      title: 'Tổng Khóa Học',
      value: courses.length,
      icon: BookOpen,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Việc Làm Đang Mở',
      value: jobs.filter(j => j.status === 'active').length,
      icon: Briefcase,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Bài Viết Cộng Đồng',
      value: posts.length,
      icon: MessageSquare,
      color: 'purple',
      change: '+15%'
    },
    {
      title: 'Mentor Hoạt Động',
      value: mentors.filter(m => m.status === 'active').length,
      icon: Users,
      color: 'orange',
      change: '+5%'
    }
  ];

  return (
    <div className="manager-container">
      <div className="manager-content">
        {/* Header */}
        <div className="manager-header">
          <h1 className="manager-title">Quản Lý Hệ Thống</h1>
          <p className="manager-description">
            Quản lý khóa học, việc làm, bài viết cộng đồng và mentor
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card stat-card--${stat.color}`}>
              <div className="stat-icon">
                <stat.icon size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-title">{stat.title}</p>
                <span className="stat-change">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="manager-tabs">
          {[
            { id: 'courses', label: 'Khóa Học', icon: BookOpen },
            { id: 'jobs', label: 'Việc Làm', icon: Briefcase },
            { id: 'posts', label: 'Bài Viết', icon: MessageSquare },
            { id: 'mentors', label: 'Mentor', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="manager-controls">
          <div className="search-filter">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="filter-button">
              <Filter size={20} />
              <span>Bộ lọc</span>
            </button>
          </div>
          
          {activeTab === 'courses' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="add-button"
            >
              <Plus size={20} />
              <span>Thêm Khóa Học</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="data-table">
          <table className="table">
            <thead>
              <tr>
                {activeTab === 'courses' && (
                  <>
                    <th>Tên Khóa Học</th>
                    <th>Giảng Viên</th>
                    <th>Danh Mục</th>
                    <th>Giá</th>
                    <th>Học Viên</th>
                    <th>Đã Mua</th>
                    <th>Đánh Giá</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </>
                )}
                {activeTab === 'jobs' && (
                  <>
                    <th>Tiêu Đề</th>
                    <th>Công Ty</th>
                    <th>Ngân Sách</th>
                    <th>Danh Mục</th>
                    <th>Ứng Viên</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </>
                )}
                {activeTab === 'posts' && (
                  <>
                    <th>Tiêu Đề</th>
                    <th>Tác Giả</th>
                    <th>Danh Mục</th>
                    <th>Lượt Thích</th>
                    <th>Bình Luận</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </>
                )}
                {activeTab === 'mentors' && (
                  <>
                    <th>Tên</th>
                    <th>Chuyên Môn</th>
                    <th>Đánh Giá</th>
                    <th>Buổi Học</th>
                    <th>Giá/Giờ</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr key={item.id}>
                  {activeTab === 'courses' && (
                    <>
                      <td className="title-cell">{item.title}</td>
                      <td>{item.instructor}</td>
                      <td>{item.category}</td>
                      <td>{item.price.toLocaleString('vi-VN')}đ</td>
                      <td>{item.students}</td>
                      <td className="purchased-cell">
                        <span className="purchased-count">{item.purchased}</span>
                        <span className="purchased-percentage">
                          ({((item.purchased / item.students) * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td>
                        <div className="rating">
                          <Star className="star-icon" />
                          <span>{item.rating}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status status--${item.status}`}>
                          {item.status === 'active' ? 'Hoạt động' : 
                           item.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="action-btn view">
                            <Eye size={16} />
                          </button>
                          <button className="action-btn edit">
                            <Edit size={16} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDelete(item.id, 'courses')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                  {/* Similar patterns for other tabs... */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

        {/* Add Course Form Modal */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Thêm Khóa Học Mới</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleAddCourse({
                  title: formData.get('title') as string,
                  instructor: formData.get('instructor') as string,
                  category: formData.get('category') as string,
                  price: Number(formData.get('price'))
                });
              }}>
                <div className="form-group">
                  <label>Tên Khóa Học</label>
                  <input type="text" name="title" required />
                </div>
                <div className="form-group">
                  <label>Giảng Viên</label>
                  <input type="text" name="instructor" required />
                </div>
                <div className="form-group">
                  <label>Danh Mục</label>
                  <select name="category" required>
                    <option value="">Chọn danh mục</option>
                    <option value="Technology">Công Nghệ</option>
                    <option value="Design">Thiết Kế</option>
                    <option value="Business">Kinh Doanh</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá (VNĐ)</label>
                  <input type="number" name="price" required />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowAddForm(false)}>
                    Hủy
                  </button>
                  <button type="submit">Thêm Khóa Học</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="manager" />
    </div>
  );
};

export default ManagerPage;