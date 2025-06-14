import React, { useState } from 'react';
import { Download, Edit, Share2, Eye, Star, Award, Briefcase, GraduationCap, User, Mail, Phone, MapPin, Globe, Github, Linkedin } from 'lucide-react';

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState('portfolio');

  const userProfile = {
    name: 'Nguyễn Văn An',
    title: 'Full-stack Developer & UI/UX Designer',
    email: 'nguyenvanan@email.com',
    phone: '+84 123 456 789',
    location: 'Hà Nội, Việt Nam',
    website: 'www.nguyenvanan.dev',
    linkedin: 'linkedin.com/in/nguyenvanan',
    github: 'github.com/nguyenvanan',
    bio: 'Sinh viên năm cuối chuyên ngành Công nghệ Thông tin tại Đại học Bách Khoa Hà Nội. Đam mê phát triển web và thiết kế giao diện người dùng. Có kinh nghiệm làm việc với React, Node.js, và các công nghệ hiện đại.',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200'
  };

  const completedCourses = [
    {
      id: 1,
      title: 'React.js Advanced',
      provider: 'Skillverse',
      completionDate: '2024-03-15',
      grade: 'A+',
      certificate: true,
      skills: ['React', 'Redux', 'TypeScript']
    },
    {
      id: 2,
      title: 'UI/UX Design Fundamentals',
      provider: 'Skillverse',
      completionDate: '2024-02-28',
      grade: 'A',
      certificate: true,
      skills: ['Figma', 'Design Thinking', 'Prototyping']
    },
    {
      id: 3,
      title: 'Node.js Backend Development',
      provider: 'Skillverse',
      completionDate: '2024-01-20',
      grade: 'A+',
      certificate: true,
      skills: ['Node.js', 'Express', 'MongoDB']
    }
  ];

  const projects = [
    {
      id: 1,
      title: 'E-commerce Website Redesign',
      client: 'Fashion Store ABC',
      type: 'Micro-job',
      completionDate: '2024-03-10',
      budget: '2,500,000đ',
      rating: 5,
      description: 'Thiết kế lại giao diện website bán hàng online, tăng conversion rate 35%',
      technologies: ['React', 'Tailwind CSS', 'Figma'],
      image: 'https://images.pexels.com/photos/34577/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Restaurant Management System',
      client: 'Local Restaurant Chain',
      type: 'Freelance',
      completionDate: '2024-02-15',
      budget: '5,000,000đ',
      rating: 5,
      description: 'Phát triển hệ thống quản lý nhà hàng với tính năng đặt bàn và quản lý menu',
      technologies: ['Vue.js', 'Laravel', 'MySQL'],
      image: 'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 3,
      title: 'Mobile App UI Design',
      client: 'Tech Startup XYZ',
      type: 'Micro-job',
      completionDate: '2024-01-30',
      budget: '1,800,000đ',
      rating: 4,
      description: 'Thiết kế giao diện ứng dụng mobile cho startup fintech',
      technologies: ['Figma', 'Adobe XD', 'Principle'],
      image: 'https://images.pexels.com/photos/147413/twitter-facebook-together-exchange-of-information-147413.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const skills = [
    { name: 'React.js', level: 90, category: 'Frontend' },
    { name: 'Node.js', level: 85, category: 'Backend' },
    { name: 'TypeScript', level: 80, category: 'Programming' },
    { name: 'UI/UX Design', level: 75, category: 'Design' },
    { name: 'MongoDB', level: 70, category: 'Database' },
    { name: 'Figma', level: 85, category: 'Design' }
  ];

  const achievements = [
    {
      id: 1,
      title: 'Top Performer',
      description: 'Top 5% sinh viên xuất sắc tháng 3/2024',
      date: '2024-03-15',
      icon: Award,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      id: 2,
      title: 'Perfect Rating',
      description: '20 dự án hoàn thành với rating 5 sao',
      date: '2024-02-28',
      icon: Star,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      id: 3,
      title: 'Course Completion',
      description: 'Hoàn thành 15 khóa học chuyên nghiệp',
      date: '2024-01-20',
      icon: GraduationCap,
      color: 'text-blue-600 bg-blue-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Portfolio & CV</h1>
          <p className="text-lg text-gray-600">
            Tạo và quản lý hồ sơ chuyên nghiệp từ các khóa học đã hoàn thành và dự án đã thực hiện
          </p>
        </div>

        {/* Profile Preview Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Hồ sơ của bạn</h2>
              <p className="text-gray-600">Được cập nhật tự động từ hoạt động học tập và làm việc</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Eye className="h-4 w-4" />
                <span>Xem trước</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit className="h-4 w-4" />
                <span>Chỉnh sửa</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="h-4 w-4" />
                <span>Chia sẻ</span>
              </button>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Tải CV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
                { id: 'courses', label: 'Khóa học', icon: GraduationCap },
                { id: 'skills', label: 'Kỹ năng', icon: Award },
                { id: 'profile', label: 'Thông tin cá nhân', icon: User }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < project.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Client: {project.client}</p>
                        <p className="text-gray-700 text-sm mb-4">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-green-600">{project.budget}</span>
                          <span className="text-gray-500">{project.completionDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {completedCourses.map((course) => (
                    <div key={course.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
                          <p className="text-gray-600">{course.provider}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 mb-1">{course.grade}</div>
                          {course.certificate && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                              Có chứng chỉ
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {course.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        Hoàn thành: {course.completionDate}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Achievements */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Thành tích</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${achievement.color}`}>
                            <achievement.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                            <p className="text-xs text-gray-500">{achievement.date}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {['Frontend', 'Backend', 'Design', 'Database', 'Programming'].map((category) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
                      <div className="space-y-4">
                        {skills
                          .filter(skill => skill.category === category)
                          .map((skill, index) => (
                            <div key={index}>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                                <span className="text-sm text-gray-500">{skill.level}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${skill.level}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <div className="flex items-center space-x-6 mb-8">
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
                    <p className="text-lg text-gray-600 mb-2">{userProfile.title}</p>
                    <button className="text-blue-600 text-sm hover:text-blue-700">Thay đổi ảnh đại diện</button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giới thiệu bản thân</label>
                    <textarea
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={userProfile.bio}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          className="flex-1 border-none outline-none"
                          defaultValue={userProfile.email}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          className="flex-1 border-none outline-none"
                          defaultValue={userProfile.phone}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          className="flex-1 border-none outline-none"
                          defaultValue={userProfile.location}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          className="flex-1 border-none outline-none"
                          defaultValue={userProfile.website}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <Linkedin className="h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          className="flex-1 border-none outline-none"
                          defaultValue={userProfile.linkedin}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <Github className="h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          className="flex-1 border-none outline-none"
                          defaultValue={userProfile.github}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Hủy
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;