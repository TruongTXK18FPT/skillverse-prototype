import React, { useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Briefcase, Star, Filter, ArrowRight } from 'lucide-react';

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tất cả', count: 89 },
    { id: 'data-entry', name: 'Nhập liệu', count: 23 },
    { id: 'design', name: 'Thiết kế', count: 18 },
    { id: 'writing', name: 'Viết lách', count: 15 },
    { id: 'research', name: 'Nghiên cứu', count: 12 },
    { id: 'translation', name: 'Dịch thuật', count: 11 },
    { id: 'social-media', name: 'Social Media', count: 10 }
  ];

  const jobs = [
    {
      id: 1,
      title: 'Thiết kế Logo cho Startup',
      company: 'TechViet Solutions',
      category: 'design',
      budget: '500,000 - 1,000,000đ',
      duration: '3-5 ngày',
      location: 'Remote',
      postedTime: '2 giờ trước',
      description: 'Cần thiết kế logo chuyên nghiệp cho startup công nghệ. Yêu cầu sáng tạo, hiện đại và phù hợp với lĩnh vực fintech.',
      skills: ['Adobe Illustrator', 'Logo Design', 'Brand Identity'],
      urgency: 'high',
      proposals: 12,
      rating: 4.8,
      verified: true
    },
    {
      id: 2,
      title: 'Nhập liệu Excel từ PDF',
      company: 'Green Energy Corp',
      category: 'data-entry',
      budget: '200,000 - 300,000đ',
      duration: '1-2 ngày',
      location: 'Remote',
      postedTime: '4 giờ trước',
      description: 'Cần nhập dữ liệu từ 50 file PDF vào Excel. Dữ liệu bao gồm thông tin khách hàng và đơn hàng.',
      skills: ['Excel', 'Data Entry', 'Attention to Detail'],
      urgency: 'medium',
      proposals: 8,
      rating: 4.6,
      verified: true
    },
    {
      id: 3,
      title: 'Viết Content Marketing Blog',
      company: 'Digital Marketing Hub',
      category: 'writing',
      budget: '800,000 - 1,200,000đ',
      duration: '1 tuần',
      location: 'Remote',
      postedTime: '6 giờ trước',
      description: 'Cần viết 5 bài blog về digital marketing, mỗi bài 1000-1500 từ. Yêu cầu SEO-friendly và có kinh nghiệm marketing.',
      skills: ['Content Writing', 'SEO', 'Digital Marketing'],
      urgency: 'low',
      proposals: 15,
      rating: 4.9,
      verified: true
    },
    {
      id: 4,
      title: 'Nghiên cứu Thị trường E-commerce',
      company: 'Online Retail Pro',
      category: 'research',
      budget: '1,500,000 - 2,000,000đ',
      duration: '2 tuần',
      location: 'Remote',
      postedTime: '1 ngày trước',
      description: 'Phân tích thị trường e-commerce Việt Nam, đánh giá đối thủ cạnh tranh và xu hướng người tiêu dùng.',
      skills: ['Market Research', 'Data Analysis', 'Excel'],
      urgency: 'medium',
      proposals: 6,
      rating: 4.7,
      verified: false
    },
    {
      id: 5,
      title: 'Dịch tài liệu Anh-Việt',
      company: 'Global Translate',
      category: 'translation',
      budget: '300,000 - 500,000đ',
      duration: '3 ngày',
      location: 'Remote',
      postedTime: '1 ngày trước',
      description: 'Dịch tài liệu kỹ thuật từ tiếng Anh sang tiếng Việt, khoảng 20 trang A4.',
      skills: ['English Translation', 'Technical Writing', 'Vietnamese'],
      urgency: 'high',
      proposals: 20,
      rating: 4.5,
      verified: true
    },
    {
      id: 6,
      title: 'Quản lý Facebook Fanpage',
      company: 'Fashion Brand X',
      category: 'social-media',
      budget: '2,000,000 - 3,000,000đ',
      duration: '1 tháng',
      location: 'Remote',
      postedTime: '2 ngày trước',
      description: 'Quản lý fanpage Facebook, tạo content, tương tác với khách hàng và chạy ads cơ bản.',
      skills: ['Facebook Marketing', 'Content Creation', 'Social Media'],
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
      case 'high': return 'Khẩn cấp';
      case 'medium': return 'Trung bình';
      case 'low': return 'Không gấp';
      default: return 'Bình thường';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Việc làm Micro</h1>
          <p className="text-lg text-gray-600">
            Tìm các dự án ngắn hạn phù hợp với kỹ năng của bạn và bắt đầu kiếm tiền ngay hôm nay
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm công việc, công ty, kỹ năng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              <span>Bộ lọc nâng cao</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories */}
          <div className="lg:w-64">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-semibold mb-4">Danh mục công việc</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-sm text-gray-500">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">💡 Mẹo thành công</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Hoàn thiện profile để tăng uy tín</li>
                <li>• Đặt giá cạnh tranh cho dự án đầu</li>
                <li>• Giao tiếp rõ ràng với khách hàng</li>
                <li>• Giao hàng đúng thời hạn cam kết</li>
              </ul>
            </div>
          </div>

          {/* Jobs List */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Hiển thị {filteredJobs.length} công việc
              </p>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Mới nhất</option>
                <option>Lương cao nhất</option>
                <option>Ít đề xuất nhất</option>
                <option>Gần deadline</option>
              </select>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                          {job.title}
                        </h3>
                        {job.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                            ✓ Đã xác minh
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getUrgencyColor(job.urgency)}`}>
                          {getUrgencyText(job.urgency)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="font-medium">{job.company}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{job.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <span>{job.postedTime}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600 mb-1">{job.budget}</div>
                      <div className="text-sm text-gray-500">{job.duration}</div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.proposals} đề xuất</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{job.duration}</span>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <span>Ứng tuyển ngay</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy công việc</h3>
                <p className="text-gray-600">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;