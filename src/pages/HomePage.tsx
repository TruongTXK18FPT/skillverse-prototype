import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Briefcase, User, MessageSquare, Award, TrendingUp, Users, Star } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'Tư vấn nghề nghiệp AI',
      description: 'Chatbot thông minh hỗ trợ định hướng nghề nghiệp và lựa chọn kỹ năng phù hợp',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BookOpen,
      title: 'Khóa học micro',
      description: 'Thư viện khóa học ngắn, tập trung vào kỹ năng thực tế và ứng dụng ngay',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: User,
      title: 'Tạo CV tự động',
      description: 'Công cụ tự động tạo CV và portfolio chuyên nghiệp từ thông tin cá nhân',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Briefcase,
      title: 'Việc làm micro',
      description: 'Marketplace dự án nhỏ giúp sinh viên kiếm tiền và tích lũy kinh nghiệm',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { label: 'Sinh viên đã tham gia', value: '10,000+', icon: Users },
    { label: 'Khóa học chất lượng', value: '500+', icon: BookOpen },
    { label: 'Dự án đã hoàn thành', value: '2,500+', icon: Briefcase },
    { label: 'Đánh giá 5 sao', value: '95%', icon: Star }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Học tập • Thực hành • Thành công
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Hệ sinh thái tích hợp duy nhất tại Việt Nam kết hợp định hướng nghề nghiệp, 
              đào tạo kỹ năng và cơ hội việc làm trong một nền tảng
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/courses"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 group"
              >
                <span>Khám phá khóa học</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/chatbot"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Tư vấn nghề nghiệp
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn Skillverse?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khác biệt với các nền tảng khác, Skillverse tích hợp đầy đủ quy trình từ định hướng 
              đến học tập và thực hành trong một hệ sinh thái duy nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cách thức hoạt động
            </h2>
            <p className="text-xl text-gray-600">
              Quy trình đơn giản để bắt đầu hành trình phát triển kỹ năng của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Tư vấn & Định hướng</h3>
              <p className="text-gray-600">
                Sử dụng AI chatbot để khám phá sở thích, thế mạnh và lựa chọn con đường nghề nghiệp phù hợp
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Học tập & Rèn luyện</h3>
              <p className="text-gray-600">
                Tham gia các khóa học micro, hoàn thành dự án thực tế và nhận chứng chỉ có giá trị
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Thực hành & Kiếm tiền</h3>
              <p className="text-gray-600">
                Ứng dụng kỹ năng vào các dự án thực tế, xây dựng portfolio và kiếm thu nhập
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sẵn sàng bắt đầu hành trình của bạn?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Tham gia cộng đồng hơn 10,000 sinh viên đang phát triển kỹ năng và xây dựng sự nghiệp
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <TrendingUp className="h-5 w-5" />
              <span>Bắt đầu ngay</span>
            </Link>
            <Link
              to="/courses"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <Award className="h-5 w-5" />
              <span>Xem khóa học</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;