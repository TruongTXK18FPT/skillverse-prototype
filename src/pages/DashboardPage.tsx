import React from 'react';
import { TrendingUp, BookOpen, Briefcase, Award, Clock, Star, Users, Target, Calendar, ArrowRight } from 'lucide-react';

const DashboardPage = () => {
  const stats = [
    {
      title: 'Khóa học đã hoàn thành',
      value: '12',
      change: '+3 tháng này',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Dự án đã thực hiện',
      value: '8',
      change: '+2 tuần này',
      icon: Briefcase,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Chứng chỉ đạt được',
      value: '15',
      change: '+5 tháng này',
      icon: Award,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Tổng thu nhập',
      value: '12.5M',
      change: '+2.3M tháng này',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const recentCourses = [
    {
      id: 1,
      title: 'Advanced React Patterns',
      progress: 75,
      totalLessons: 20,
      completedLessons: 15,
      instructor: 'Nguyễn Văn A',
      thumbnail: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=200'
    },
    {
      id: 2,
      title: 'UI/UX Design Principles',
      progress: 60,
      totalLessons: 16,
      completedLessons: 10,
      instructor: 'Trần Thị B',
      thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=200'
    },
    {
      id: 3,
      title: 'Digital Marketing Strategy',
      progress: 90,
      totalLessons: 12,
      completedLessons: 11,
      instructor: 'Lê Văn C',
      thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=200'
    }
  ];

  const availableJobs = [
    {
      id: 1,
      title: 'Thiết kế logo cho startup',
      budget: '500K - 1M',
      deadline: '3 ngày',
      skills: ['Logo Design', 'Illustrator'],
      urgency: 'high'
    },
    {
      id: 2,
      title: 'Phát triển landing page',
      budget: '2M - 3M',
      deadline: '1 tuần',
      skills: ['React', 'CSS', 'JavaScript'],
      urgency: 'medium'
    },
    {
      id: 3,
      title: 'Viết content blog',
      budget: '300K - 500K',
      deadline: '5 ngày',
      skills: ['Content Writing', 'SEO'],
      urgency: 'low'
    }
  ];

  const achievements = [
    { title: 'First Course Completed', icon: '🎓', date: '2024-01-15' },
    { title: 'Top Performer', icon: '🏆', date: '2024-02-20' },
    { title: 'Perfect Rating', icon: '⭐', date: '2024-03-10' },
    { title: 'Skill Master', icon: '💎', date: '2024-03-25' }
  ];

  const upcomingDeadlines = [
    { task: 'Hoàn thành khóa React Advanced', date: '2024-04-05', type: 'course' },
    { task: 'Nộp dự án UI Design', date: '2024-04-07', type: 'project' },
    { task: 'Meeting với client ABC', date: '2024-04-10', type: 'meeting' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Chào mừng bạn trở lại! Theo dõi tiến độ học tập và công việc của bạn.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-green-600">{stat.change}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">{stat.title}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Courses */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Khóa học đang theo học</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">Giảng viên: {course.instructor}</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {course.completedLessons}/{course.totalLessons}
                        </span>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Tiếp tục
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Jobs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Việc làm phù hợp</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Xem thêm
                </button>
              </div>
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        job.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        job.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {job.urgency === 'high' ? 'Khẩn cấp' : job.urgency === 'medium' ? 'Trung bình' : 'Không gấp'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium text-green-600">{job.budget}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{job.deadline}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                      <span>Ứng tuyển ngay</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Progress Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan tiến độ</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Hoàn thành khóa học</span>
                    <span className="font-medium">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Dự án hoàn thành</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Mục tiêu tháng</span>
                    <span className="font-medium">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thành tích gần đây</h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{achievement.title}</div>
                      <div className="text-sm text-gray-500">{achievement.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deadline sắp tới</h3>
              <div className="space-y-3">
                {upcomingDeadlines.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.task}</div>
                      <div className="text-sm text-gray-600 flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{item.date}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.type === 'course' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'project' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {item.type === 'course' ? 'Khóa học' : item.type === 'project' ? 'Dự án' : 'Họp'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;