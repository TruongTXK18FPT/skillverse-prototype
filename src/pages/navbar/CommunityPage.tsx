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
  id: number;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isBookmarked: boolean;
  timeAgo: string;
  readTime: string;
  image: string;
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

const categories = [
  { id: 'all', name: 'Tất cả', count: 0 },
  { id: 'tips', name: 'Mẹo hay', count: 0 },
  { id: 'discussion', name: 'Thảo luận', count: 0 },
  { id: 'tutorial', name: 'Hướng dẫn', count: 0 },
  { id: 'news', name: 'Tin tức', count: 0 },
  { id: 'career', name: 'Nghề nghiệp', count: 0 }
];

const topContributors = [
  {
    name: 'Alice Johnson',
    role: 'Senior Developer',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    badges: ['Expert', 'Mentor'],
    contributions: 1250
  },
  {
    name: 'Bob Smith',
    role: 'UI/UX Designer',
    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
    badges: ['Creative', 'Helper'],
    contributions: 890
  },
  {
    name: 'Carol Davis',
    role: 'Product Manager',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    badges: ['Leader', 'Innovator'],
    contributions: 675
  }
];

const trendingTopics = [
  { name: 'React 18', posts: 145, trend: 'up' },
  { name: 'TypeScript', posts: 120, trend: 'up' },
  { name: 'Web3', posts: 98, trend: 'up' },
  { name: 'AI/ML', posts: 87, trend: 'up' },
  { name: 'Next.js', posts: 76, trend: 'up' }
];

const CommunityPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { translations } = useLanguage();
  const navigate = useNavigate();

  const postsPerPage = 6;

  useEffect(() => {
    setIsVisible(true);
    fetchPosts();
  }, []);
  // Debug logging for button behavior
  useEffect(() => {
    const button = document.querySelector('.create-post-button');
    if (button) {
      const clickHandler = () => {
      };
      button.addEventListener('click', clickHandler);
      return () => button.removeEventListener('click', clickHandler);
    }
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://68426af6e1347494c31cbc60.mockapi.io/api/skillverse/Community');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedPosts = data.map((post: any) => ({
        id: parseInt(post.id),
        title: post.title || 'Untitled Post',
        content: post.content || post.description || '',
        author: typeof post.author === 'string' ? post.author : 'Anonymous',
        category: post.category || 'discussion',
        tags: Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? [post.tags] : ['General']),
        likes: parseInt(post.likes) || Math.floor(Math.random() * 500),
        comments: parseInt(post.comments) || Math.floor(Math.random() * 100),
        shares: parseInt(post.shares) || Math.floor(Math.random() * 50),
        isBookmarked: Boolean(post.isBookmarked) || false,
        timeAgo: post.timeAgo || '2 hours ago',
        readTime: post.readTime || '5 min read',
        image: post.image || 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400'
      }));
      
      setPosts(transformedPosts);
      
      // Update category counts
      categories.forEach(category => {
        if (category.id === 'all') {
          category.count = transformedPosts.length;
        } else {
          category.count = transformedPosts.filter((post: CommunityPost) => post.category === category.id).length;
        }
      });
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
  const handleCreatePost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Create post button clicked', {
      timestamp: Date.now(),
      loading,
      error
    });
    
    try {
      navigate('/community/create');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/community/create';
    }
  };

  const handleRetry = () => {
    fetchPosts();
  };

  return (
    <div className={`community-container ${isVisible ? 'visible' : ''}`}>
      <div className="community-content">        {/* Header */}
        <div className="community-header">
          <h1 className="community-title">
            <Sparkles className="title-icon" size={24} />
            {translations.community.communityHub}
          </h1>
          <p className="community-description">
            {translations.community.description}
          </p>
          <div className="create-post-wrapper">
            <button 
              className="create-post-button" 
              onClick={handleCreatePost}
              disabled={false}
              type="button"
              aria-label="Create new post"
            >
              <Plus className="button-icon" size={18} />
              <span>{translations.community.createPost}</span>
            </button>
          </div>
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
                  <span className="community-category-count">({category.count})</span>
                </button>
              ))}
            </div>

            {/* Posts */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải bài viết...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <MessageCircle className="error-icon" size={48} />
                <h3>Không thể tải bài viết</h3>
                <p>{error}</p>
                <button onClick={handleRetry} className="retry-button">
                  Thử lại
                </button>
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
                            src={post.image}
                            alt={post.author}
                            className="author-avatar"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';
                            }}
                          />
                          <div>
                            <h4 className="author-name">{post.author}</h4>
                            <p className="author-role">Member</p>
                          </div>
                        </div>
                        <div className="post-time">
                          <Clock className="time-icon" />
                          <span>{post.timeAgo}</span>
                        </div>
                      </div>

                      <h2 className="post-title">{post.title}</h2>
                      <p className="post-excerpt">{post.content}</p>

                      <div className="post-tags">
                        {post.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="tag">
                            <Tag className="tag-icon" />
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="post-actions">
                        <button className="community-action-button">
                          <ThumbsUp className="community-action-icon" />
                          <span>{formatNumber(post.likes)}</span>
                        </button>
                        <button className="community-action-button">
                          <MessageCircle className="community-action-icon" />
                          <span>{formatNumber(post.comments)}</span>
                        </button>
                        <button className="community-action-button">
                          <Share2 className="community-action-icon" />
                          <span>{formatNumber(post.shares)}</span>
                        </button>
                        <button className="community-action-button">
                          <Bookmark className={`community-action-icon ${post.isBookmarked ? 'bookmarked' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {filteredPosts.length === 0 && !loading && !error && (
                  <div className="empty-state">
                    <MessageCircle className="empty-icon" />
                    <h3>Không tìm thấy bài viết</h3>
                    <p>Thử điều chỉnh bộ lọc hoặc tạo bài viết mới</p>
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
              <h3 className="community-sidebar-title">
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
                          <span key={badgeIndex} className="contributor-badge">
                            <Award className="contributor-badge-icon" size={12} />
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
              <h3 className="community-sidebar-title">
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
              <h3 className="community-sidebar-title">
                <Globe className="sidebar-icon" size={16} />
                Community Stats
              </h3>
              <div className="community-stats">
                <div className="community-stat-card">
                  <div className="stat-name-section">
                    <span className="community-stat-value">Members</span>
                  </div>
                  <div className="topic-stats">
                    <span>{formatNumber(15234)}</span>
                  </div>
                </div>
                <div className="community-stat-card">
                  <div className="stat-name-section">
                    <span className="community-stat-value">Posts</span>
                  </div>
                  <div className="topic-stats">
                    <span>{formatNumber(posts.length)}</span>
                  </div>
                </div>
                <div className="community-stat-card">
                  <div className="stat-name-section">
                    <span className="community-stat-value">Reactions</span>
                  </div>
                  <div className="topic-stats">
                    <span>{formatNumber(123456)}</span>
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