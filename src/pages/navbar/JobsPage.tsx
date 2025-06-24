import React, { useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Briefcase, Star, Filter, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/JobsPage.css';

const JobsPage = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { translations } = useLanguage();

  const categories = [
    { id: 'all', name: 'Tất Cả', count: 89 },
    { id: 'data-entry', name: 'Nhập Liệu', count: 23 },
    { id: 'design', name: 'Thiết Kế', count: 18 },
    { id: 'writing', name: 'Viết Lách', count: 15 },
    { id: 'research', name: 'Nghiên Cứu', count: 12 },
    { id: 'translation', name: 'Dịch Thuật', count: 11 },
    { id: 'social-media', name: 'Mạng Xã Hội', count: 10 }
  ];

  const jobs = [
    {
      id: 1,
      title: 'Thiết Kế Logo cho Startup',
      company: 'TechViet Solutions',
      category: 'design',
      budget: '1.150.000đ - 2.300.000đ',
      duration: '3-5 ngày',
      location: 'Từ xa',
      postedTime: '2 giờ trước',
      description: 'Cần thiết kế logo chuyên nghiệp cho startup công nghệ. Tìm kiếm thiết kế sáng tạo, hiện đại phù hợp với ngành fintech.',
      skills: ['Adobe Illustrator', 'Thiết Kế Logo', 'Nhận Diện Thương Hiệu'],
      urgency: 'high',
      proposals: 12,
      rating: 4.8,
      verified: true
    },
    {
      id: 2,
      title: 'Nhập Dữ Liệu từ PDF vào Excel',
      company: 'Green Energy Corp',
      category: 'data-entry',
      budget: '460.000đ - 690.000đ',
      duration: '1-2 ngày',
      location: 'Từ xa',
      postedTime: '4 giờ trước',
      description: 'Cần nhập dữ liệu từ 50 file PDF vào Excel. Dữ liệu bao gồm thông tin khách hàng và chi tiết đơn hàng.',
      skills: ['Excel', 'Nhập Liệu', 'Tỉ Mỉ'],
      urgency: 'medium',
      proposals: 8,
      rating: 4.6,
      verified: true
    },
    {
      id: 3,
      title: 'Viết Bài Blog Marketing',
      company: 'Digital Marketing Hub',
      category: 'writing',
      budget: '1.840.000đ - 2.760.000đ',
      duration: '1 tuần',
      location: 'Từ xa',
      postedTime: '6 giờ trước',
      description: 'Viết 5 bài blog về marketing số, mỗi bài 1000-1500 từ. Yêu cầu tối ưu SEO và có kinh nghiệm marketing.',
      skills: ['Viết Content', 'SEO', 'Marketing Số'],
      urgency: 'low',
      proposals: 15,
      rating: 4.9,
      verified: true
    },
    {
      id: 4,
      title: 'Nghiên Cứu Thị Trường TMĐT',
      company: 'Online Retail Pro',
      category: 'research',
      budget: '3.450.000đ - 4.600.000đ',
      duration: '2 tuần',
      location: 'Từ xa',
      postedTime: '1 ngày trước',
      description: 'Phân tích xu hướng thị trường TMĐT, phân tích cạnh tranh, và nghiên cứu hành vi người tiêu dùng.',
      skills: ['Nghiên Cứu Thị Trường', 'Phân Tích Dữ Liệu', 'Excel'],
      urgency: 'medium',
      proposals: 6,
      rating: 4.7,
      verified: false
    },
    {
      id: 5,
      title: 'Dịch Anh-Việt',
      company: 'Global Translate',
      category: 'translation',
      budget: '690.000đ - 1.150.000đ',
      duration: '3 ngày',
      location: 'Từ xa',
      postedTime: '1 ngày trước',
      description: 'Dịch tài liệu kỹ thuật từ tiếng Anh sang tiếng Việt, khoảng 20 trang A4.',
      skills: ['Dịch Tiếng Anh', 'Viết Kỹ Thuật', 'Tiếng Việt'],
      urgency: 'high',
      proposals: 20,
      rating: 4.5,
      verified: true
    },
    {
      id: 6,
      title: 'Quản Lý Trang Facebook',
      company: 'Fashion Brand X',
      category: 'social-media',
      budget: '4.600.000đ - 6.900.000đ',
      duration: '1 tháng',
      location: 'Từ xa',
      postedTime: '2 ngày trước',
      description: 'Quản lý trang Facebook, tạo nội dung, tương tác với khách hàng và chạy quảng cáo cơ bản.',
      skills: ['Marketing Facebook', 'Tạo Nội Dung', 'Mạng Xã Hội'],
      urgency: 'low',
      proposals: 25,
      rating: 4.4,
      verified: true
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Gấp';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Bình thường';
    }
  };
  return (
    <div className={`sv-jobs-container ${theme}`} data-theme={theme}>
      <div className="sv-jobs-content">
        {/* Header */}
        <div className="sv-jobs-header">
          <h1 className="sv-jobs-header__title">Việc Làm Tự Do</h1>
          <p className="sv-jobs-header__description">
            Tìm kiếm cơ hội việc làm phù hợp với kỹ năng của bạn
          </p>
        </div>

        {/* Search and Filter */}
        <div className="sv-jobs-search">
          <div className="sv-jobs-search__form">
            <div className="sv-jobs-search__input-wrapper">
              <Search className="sv-jobs-search__icon" />
              <input
                type="text"
                placeholder="Tìm kiếm việc làm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sv-jobs-search__input"
              />
            </div>
            <button className="sv-jobs-search__filter-btn">
              <Filter />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>

        <div className="sv-jobs-main">
          {/* Sidebar Categories */}
          <div className="sv-jobs-sidebar">
            <div className="sv-jobs-categories">
              <h3 className="sv-jobs-categories__title">Danh Mục</h3>
              <div className="sv-jobs-categories__list">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`sv-jobs-category-btn ${
                      selectedCategory === category.id ? 'sv-jobs-category-btn--active' : ''
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="sv-jobs-category-btn__count">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="sv-jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="sv-job-card">
                <div className="sv-job-card__header">
                  <div>
                    <h3 className="sv-job-card__title">{job.title}</h3>
                    <p className="sv-job-card__company">{job.company}</p>
                  </div>
                  <div className="sv-job-card__meta">
                    <div className="sv-job-card__meta-item">
                      <MapPin />
                      <span>{job.location}</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <Clock />
                      <span>{job.duration}</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <DollarSign />
                      <span>{job.budget}</span>
                    </div>
                  </div>
                </div>

                <p className="sv-job-card__description">{job.description}</p>

                <div className="sv-job-card__tags">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="sv-job-card__tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="sv-job-card__footer">
                  <div className="sv-job-card__stats">
                    <div className="sv-job-card__meta-item">
                      <Briefcase />
                      <span>{job.proposals} đề xuất</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <Star className="fill-current" />
                      <span>{job.rating}</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <Clock />
                      <span>{job.postedTime}</span>
                    </div>
                  </div>
                  <button className="sv-job-card__apply-btn">
                    <span>Ứng Tuyển Ngay</span>
                    <ArrowRight />
                  </button>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="sv-jobs-empty">
                <Briefcase className="sv-jobs-empty__icon" />
                <h3 className="sv-jobs-empty__title">Không tìm thấy việc làm</h3>
                <p className="sv-jobs-empty__description">Vui lòng điều chỉnh tìm kiếm hoặc bộ lọc của bạn</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;