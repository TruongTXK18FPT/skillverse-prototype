import React, { useState } from 'react';
import { Search, Filter, Clock, Users, Star, BookOpen, Trophy, Play } from 'lucide-react';

const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tất cả', count: 156 },
    { id: 'tech', name: 'Công nghệ', count: 45 },
    { id: 'design', name: 'Thiết kế', count: 32 },
    { id: 'business', name: 'Kinh doanh', count: 28 },
    { id: 'marketing', name: 'Marketing', count: 25 },
    { id: 'language', name: 'Ngoại ngữ', count: 18 },
    { id: 'soft-skills', name: 'Kỹ năng mềm', count: 8 }
  ];

  const courses = [
    {
      id: 1,
      title: 'React.js Cơ bản đến Nâng cao',
      instructor: 'Nguyễn Văn A',
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
      title: 'UI/UX Design Thực hành',
      instructor: 'Trần Thị B',
      category: 'design',
      rating: 4.9,
      students: 892,
      duration: '6 giờ',
      price: '299,000đ',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Cơ bản',
      description: 'Thiết kế giao diện người dùng chuyên nghiệp với Figma',
      modules: 8,
      certificate: true
    },
    {
      id: 3,
      title: 'Digital Marketing A-Z',
      instructor: 'Lê Văn C',
      category: 'marketing',
      rating: 4.7,
      students: 1567,
      duration: '10 giờ',
      price: '499,000đ',
      image: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Nâng cao',
      description: 'Chiến lược marketing số toàn diện cho doanh nghiệp',
      modules: 15,
      certificate: true
    },
    {
      id: 4,
      title: 'Python cho Người Mới Bắt đầu',
      instructor: 'Phạm Văn D',
      category: 'tech',
      rating: 4.6,
      students: 2103,
      duration: '12 giờ',
      price: 'Miễn phí',
      image: 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Cơ bản',
      description: 'Lập trình Python từ con số 0 với các bài tập thực hành',
      modules: 20,
      certificate: true
    },
    {
      id: 5,
      title: 'Kỹ năng Thuyết trình Chuyên nghiệp',
      instructor: 'Hoàng Thị E',
      category: 'soft-skills',
      rating: 4.8,
      students: 756,
      duration: '4 giờ',
      price: '199,000đ',
      image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400',
      level: 'Trung cấp',
      description: 'Nâng cao kỹ năng thuyết trình và giao tiếp công sở',
      modules: 6,
      certificate: true
    },
    {
      id: 6,
      title: 'Quản lý Dự án Agile',
      instructor: 'Vũ Văn F',
      category: 'business',
      rating: 4.7,
      students: 634,
      duration: '7 giờ',
      price: '399,000đ',
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Khóa học Micro</h1>
          <p className="text-lg text-gray-600">
            Học các kỹ năng thực tế với khóa học ngắn gọn, tập trung và có thể ứng dụng ngay
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories */}
          <div className="lg:w-64">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Danh mục</h3>
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
          </div>

          {/* Course Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Hiển thị {filteredCourses.length} khóa học
              </p>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Mới nhất</option>
                <option>Phổ biến nhất</option>
                <option>Đánh giá cao nhất</option>
                <option>Giá thấp đến cao</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  <div className="relative">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white text-blue-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors">
                        <Play className="h-4 w-4" />
                        <span>Xem trước</span>
                      </button>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        course.level === 'Cơ bản' ? 'bg-green-100 text-green-800' :
                        course.level === 'Trung cấp' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.level}
                      </span>
                    </div>
                    {course.price === 'Miễn phí' && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Miễn phí
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{course.rating}</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{course.students.toLocaleString()}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">Giảng viên: {course.instructor}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.modules} bài học</span>
                      </div>
                      {course.certificate && (
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4" />
                          <span>Chứng chỉ</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">{course.price}</span>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Học ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy khóa học</h3>
                <p className="text-gray-600">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;