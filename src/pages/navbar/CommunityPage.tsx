import React, { useState, useEffect } from 'react';
import {
  MessageCircle, Heart, Share2, Bookmark, ThumbsUp,
  User, Clock, Tag, Filter, Search, Edit, TrendingUp,
  Users, Star, Award, Globe, Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/CommunityPage.css';

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const CommunityPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const { translations } = useLanguage();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const categories = [
    { id: 'all', name: 'Tất Cả', count: 156 },
    { id: 'discussions', name: 'Thảo Luận', count: 45 },
    { id: 'questions', name: 'Câu Hỏi', count: 32 },
    { id: 'projects', name: 'Dự Án', count: 28 },
    { id: 'events', name: 'Sự Kiện', count: 25 },
    { id: 'resources', name: 'Tài Nguyên', count: 18 },
    { id: 'jobs', name: 'Việc Làm', count: 8 }
  ];

  const posts = [
    {
      id: 1,
      type: 'discussion',
      title: 'Xu Hướng Công Nghệ AI 2024',
      author: {
        name: 'Nguyễn Văn A',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
        role: 'Chuyên Gia AI'
      },
      content: 'Cùng thảo luận về các xu hướng AI mới nhất và tác động của chúng đến ngành công nghệ trong năm 2024.',
      category: 'discussions',
      tags: ['AI', 'Machine Learning', 'Công Nghệ'],
      engagement: {
        likes: 234,
        comments: 56,
        shares: 12
      },
      timePosted: '2 giờ trước',
      isVerified: true
    },
    {
      id: 2,
      type: 'question',
      title: 'Giúp đỡ với React Hooks',
      author: {
        name: 'Trần Thị B',
        avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
        role: 'Lập Trình Viên Frontend'
      },
      content: 'Tôi đang gặp vấn đề với useEffect hook trong React. Làm thế nào để tránh re-render không cần thiết?',
      category: 'questions',
      tags: ['React', 'JavaScript', 'Frontend'],
      engagement: {
        likes: 45,
        comments: 23,
        shares: 5
      },
      timePosted: '4 giờ trước',
      isVerified: false
    },
    {
      id: 3,
      type: 'project',
      title: 'Dự Án Mã Nguồn Mở: Ứng Dụng Học Ngôn Ngữ',
      author: {
        name: 'Lê Văn C',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
        role: 'Nhà Phát Triển Full-stack'
      },
      content: 'Tìm kiếm cộng tác viên cho dự án ứng dụng học ngôn ngữ mã nguồn mở. Stack công nghệ: React Native, Node.js, MongoDB.',
      category: 'projects',
      tags: ['Open Source', 'React Native', 'Node.js'],
      engagement: {
        likes: 189,
        comments: 45,
        shares: 28
      },
      timePosted: '1 ngày trước',
      isVerified: true
    },
    {
      id: 4,
      type: 'event',
      title: 'Workshop: DevOps Cơ Bản',
      author: {
        name: 'Phạm Thị D',
        avatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100',
        role: 'Kỹ Sư DevOps'
      },
      content: 'Workshop trực tuyến miễn phí về DevOps cơ bản. Chủ đề: Docker, Kubernetes, và CI/CD. Đăng ký ngay!',
      category: 'events',
      tags: ['DevOps', 'Docker', 'Kubernetes'],
      engagement: {
        likes: 156,
        comments: 34,
        shares: 67
      },
      timePosted: '2 ngày trước',
      isVerified: true
    },
    {
      id: 5,
      type: 'resource',
      title: 'Tài Liệu Học Python Miễn Phí',
      author: {
        name: 'Hoàng Văn E',
        avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=100',
        role: 'Giảng Viên Python'
      },
      content: 'Tổng hợp tài liệu học Python từ cơ bản đến nâng cao, bao gồm bài tập và dự án thực hành.',
      category: 'resources',
      tags: ['Python', 'Lập Trình', 'Học Tập'],
      engagement: {
        likes: 423,
        comments: 89,
        shares: 145
      },
      timePosted: '3 ngày trước',
      isVerified: true
    },
    {
      id: 6,
      type: 'job',
      title: 'Tuyển Dụng Frontend Developer',
      author: {
        name: 'Vũ Thị F',
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100',
        role: 'HR Manager'
      },
      content: 'Công ty công nghệ tìm kiếm Frontend Developer có kinh nghiệm React/Vue. Mức lương hấp dẫn, môi trường năng động.',
      category: 'jobs',
      tags: ['Việc Làm', 'Frontend', 'React'],
      engagement: {
        likes: 89,
        comments: 34,
        shares: 56
      },
      timePosted: '4 ngày trước',
      isVerified: true
    }
  ];

  const topContributors = [
    {
      name: 'David Wilson',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      role: 'Tech Lead',
      contributions: 156,
      badges: ['Top Writer', 'Expert']
    },
    {
      name: 'Lisa Chen',
      avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
      role: 'Senior Developer',
      contributions: 134,
      badges: ['Mentor', 'Top Contributor']
    },
    {
      name: 'Mark Johnson',
      avatar: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400',
      role: 'DevOps Engineer',
      contributions: 98,
      badges: ['Problem Solver']
    }
  ];

  const trendingTopics = [
    { name: 'React', posts: 234, trend: 'up' },
    { name: 'TypeScript', posts: 189, trend: 'up' },
    { name: 'Next.js', posts: 156, trend: 'up' },
    { name: 'AI Development', posts: 145, trend: 'up' },
    { name: 'Web3', posts: 98, trend: 'down' }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`community-container ${isVisible ? 'visible' : ''}`}>
      <div className="community-content">
        {/* Header */}
        <div className="community-header">
          <h1 className="community-title">
            <Sparkles className="title-icon" size={24} />
            {translations.community.communityHub}
          </h1>
          <p className="community-description">
            {translations.community.description}
          </p>
          <button className="create-post-button">
            <Edit className="button-icon" size={18} />
            <span>{translations.community.createPost}</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="community-search-section">
          <div className="community-search-wrapper">
            <Search className="community-search-icon" size={18} />
            <input
              type="text"
              placeholder={translations.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="community-search-input"
            />
          </div>
          <button className="community-filter-button">
            <Filter className="filter-icon" size={16} />
            <span>{translations.common.filter}</span>
          </button>
        </div>

        <div className="community-main">
          {/* Main Content */}
          <div className="posts-section">
            {/* Categories */}
            <div className="categories-list">
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`category-button ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span>{category.name}</span>
                  <span className="category-count">({category.count})</span>
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="posts-grid">
              {filteredPosts.map((post, index) => (
                <article 
                  key={post.id} 
                  className="post-card"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {post.author.avatar && (
                    <div className="post-image-container">
                      <img
                        src={post.author.avatar}
                        alt={post.title}
                        className="post-image"
                      />
                    </div>
                  )}
                  <div className="post-content">
                    <div className="post-meta">
                      <div className="post-author">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="author-avatar"
                        />
                        <div>
                          <h4 className="author-name">{post.author.name}</h4>
                          <p className="author-role">{post.author.role}</p>
                        </div>
                      </div>
                      <div className="post-time">
                        <Clock className="time-icon" />
                        <span>{post.timePosted}</span>
                      </div>
                    </div>

                    <h2 className="post-title">{post.title}</h2>
                    <p className="post-excerpt">{post.content}</p>

                    <div className="post-tags">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          <Tag className="tag-icon" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="post-actions">
                      <button className="action-button">
                        <ThumbsUp className="action-icon" />
                        <span>{post.engagement.likes}</span>
                      </button>
                      <button className="action-button">
                        <MessageCircle className="action-icon" />
                        <span>{post.engagement.comments}</span>
                      </button>
                      <button className="action-button">
                        <Share2 className="action-icon" />
                        <span>{post.engagement.shares}</span>
                      </button>
                      <button
                        className={`action-button bookmark ${
                          post.isVerified ? 'verified' : ''
                        }`}
                      >
                        {post.isVerified && (
                          <span className="verified-badge" title="Tài khoản xác thực">
                            ✓
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="community-sidebar">
            {/* Top Contributors */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <Star className="sidebar-icon" size={16} />
                {translations.community.topContributors}
              </h3>
              <div className="contributors-list">
                {topContributors.map((contributor, index) => (
                  <div 
                    key={index} 
                    className="contributor-card"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <img
                      src={contributor.avatar}
                      alt={contributor.name}
                      className="contributor-avatar"
                    />
                    <div className="contributor-info">
                      <h4 className="contributor-name">{contributor.name}</h4>
                      <p className="contributor-role">{contributor.role}</p>
                      <div className="contributor-badges">
                        {contributor.badges.map((badge, badgeIndex) => (
                          <span key={badgeIndex} className="badge">
                            <Award className="badge-icon" size={12} />
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="contribution-count">
                      <span>{formatNumber(contributor.contributions)}</span>
                      <span>posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <TrendingUp className="sidebar-icon" size={18} />
                {translations.community.trending}
              </h3>
              <div className="trending-topics">
                {trendingTopics.map((topic, index) => (
                  <div 
                    key={index} 
                    className="topic-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="topic-name">{topic.name}</span>
                    <div className="topic-stats">
                      <span className="topic-posts">{topic.posts} posts</span>
                      <TrendingUp
                        className={`trend-icon ${
                          topic.trend === 'up' ? 'up' : 'down'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <Globe className="sidebar-icon" size={16} />
                Community Stats
              </h3>
              <div className="community-stats">
                <div className="stat-card">
                  <Users className="stat-icon" size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(15234)}</span>
                    <span className="stat-label">Members</span>
                  </div>
                </div>
                <div className="stat-card">
                  <MessageCircle className="stat-icon" size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(45678)}</span>
                    <span className="stat-label">Posts</span>
                  </div>
                </div>
                <div className="stat-card">
                  <Heart className="stat-icon" size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(123456)}</span>
                    <span className="stat-label">Reactions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
