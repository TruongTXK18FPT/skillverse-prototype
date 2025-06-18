import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, Heart, Share2, Bookmark, ThumbsUp,
  User, Clock, Tag, Filter, Search, Edit, TrendingUp,
  Users, Star, Award, Globe, Sparkles, Plus
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination';
import '../../styles/CommunityPage.css';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  timePosted: string;
  isVerified: boolean;
}

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
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { translations } = useLanguage();
  const navigate = useNavigate();

  const postsPerPage = 6;

  useEffect(() => {
    setIsVisible(true);
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Fetch from MockAPI
      const response = await fetch('https://685159d58612b47a2c09b031.mockapi.io/community');
      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedPosts = data.map((post: any) => ({
        id: post.id,
        title: post.title || 'Untitled Post',
        content: post.content || post.description || '',
        author: {
          name: post.author || post.name || 'Anonymous',
          avatar: post.avatar || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
          role: post.role || 'Thành viên'
        },
        category: post.category || 'discussion',
        tags: post.tags || ['General'],
        engagement: {
          likes: post.likes || Math.floor(Math.random() * 500),
          comments: post.comments || Math.floor(Math.random() * 100),
          shares: post.shares || Math.floor(Math.random() * 50)
        },
        timePosted: post.createdAt || new Date().toISOString(),
        isVerified: post.verified || Math.random() > 0.5
      }));
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Fallback to mock data
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  // Mock data as fallback
  const mockPosts: CommunityPost[] = [
    {
      id: '1',
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
      id: '2',
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
    }
  ];

  const categories = [
    { id: 'all', name: 'Tất Cả', count: posts.length },
    { id: 'discussions', name: 'Thảo Luận', count: posts.filter(p => p.category === 'discussions').length },
    { id: 'questions', name: 'Câu Hỏi', count: posts.filter(p => p.category === 'questions').length },
    { id: 'projects', name: 'Dự Án', count: posts.filter(p => p.category === 'projects').length },
    { id: 'events', name: 'Sự Kiện', count: posts.filter(p => p.category === 'events').length },
    { id: 'resources', name: 'Tài Nguyên', count: posts.filter(p => p.category === 'resources').length },
    { id: 'jobs', name: 'Việc Làm', count: posts.filter(p => p.category === 'jobs').length }
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

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const handleCreatePost = () => {
    navigate('/community/create');
  };

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
          <button className="create-post-button" onClick={handleCreatePost}>
            <Plus className="button-icon" size={18} />
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
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage(1);
                  }}
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
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải bài viết...</p>
              </div>
            ) : (
              <div className="posts-grid">
                {currentPosts.map((post, index) => (
                  <article 
                    key={post.id} 
                    className="post-card"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
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

                {filteredPosts.length === 0 && !loading && (
                  <div className="empty-state">
                    <MessageCircle className="empty-icon" />
                    <h3>Không tìm thấy bài viết</h3>
                    <p>Thử điều chỉnh bộ lọc hoặc tạo bài viết mới</p>
                    <button onClick={handleCreatePost} className="create-first-post">
                      Tạo bài viết đầu tiên
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {filteredPosts.length > postsPerPage && (
              <Pagination
                totalItems={filteredPosts.length}
                itemsPerPage={postsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}
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
                    <span className="stat-value">{formatNumber(posts.length)}</span>
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