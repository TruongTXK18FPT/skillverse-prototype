import React, { useState, useEffect } from 'react';
import {
  MessageCircle, Heart, Share2, Bookmark, ThumbsUp,
  User, Clock, Tag, Filter, Search, Edit, TrendingUp,
  Users, Star, Award, Globe, Sparkles
} from 'lucide-react';
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

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const categories = [
    { id: 'all', name: 'All Posts', count: 256 },
    { id: 'tips', name: 'Tips & Tricks', count: 84 },
    { id: 'discussion', name: 'Discussions', count: 67 },
    { id: 'showcase', name: 'Project Showcase', count: 45 },
    { id: 'questions', name: 'Questions', count: 34 },
    { id: 'news', name: 'Tech News', count: 26 }
  ];

  const posts = [
    {
      id: 1,
      title: '10 Essential React Hooks You Should Know in 2024',
      content: 'React Hooks have revolutionized how we write React components. Here are the most important hooks that every React developer should master...',
      author: {
        name: 'Sarah Johnson',
        avatar: 'https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg?auto=compress&cs=tinysrgb&w=400',
        role: 'Senior Frontend Developer'
      },
      category: 'tips',
      tags: ['React', 'JavaScript', 'Web Development'],
      likes: 234,
      comments: 45,
      shares: 12,
      isBookmarked: false,
      timeAgo: '2 hours ago',
      readTime: '8 min read',
      image: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Building Scalable Node.js Applications: Best Practices',
      content: "Learn how to structure your Node.js applications for scalability. We'll cover architectural patterns, performance optimization...",
      author: {
        name: 'Michael Chen',
        avatar: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400',
        role: 'Backend Engineer'
      },
      category: 'tips',
      tags: ['Node.js', 'Backend', 'Architecture'],
      likes: 189,
      comments: 32,
      shares: 8,
      isBookmarked: true,
      timeAgo: '5 hours ago',
      readTime: '12 min read',
      image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 3,
      title: 'My Journey from Junior to Senior Developer',
      content: 'I want to share my experience and the lessons learned during my journey from a junior developer to a senior role...',
      author: {
        name: 'Emily Davis',
        avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
        role: 'Senior Full Stack Developer'
      },
      category: 'discussion',
      tags: ['Career', 'Personal Growth', 'Tech Journey'],
      likes: 423,
      comments: 78,
      shares: 45,
      isBookmarked: false,
      timeAgo: '1 day ago',
      readTime: '15 min read',
      image: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=400'
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

  return (
    <div className={`community-container ${isVisible ? 'visible' : ''}`}>
      <div className="community-content">
        {/* Header */}
        <div className="community-header">
          <h1 className="community-title">
            <Sparkles className="title-icon" size={24} />
            Community Hub
          </h1>
          <p className="community-description">
            Join our vibrant tech community to share knowledge, learn from experts, and grow together
          </p>
          <button className="create-post-button">
            <Edit className="button-icon" size={18} />
            <span>Share Your Knowledge</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="community-search-section">
          <div className="community-search-wrapper">
            <Search className="community-search-icon" size={18} />
            <input
              type="text"
              placeholder="Discover posts, topics, or connect with others..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="community-search-input"
            />
          </div>
          <button className="community-filter-button">
            <Filter className="filter-icon" size={16} />
            <span>Filter</span>
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
              {posts.map((post, index) => (
                <article 
                  key={post.id} 
                  className="post-card"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {post.image && (
                    <div className="post-image-container">
                      <img
                        src={post.image}
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
                        <span>{post.timeAgo}</span>
                        <span className="dot">•</span>
                        <span>{post.readTime}</span>
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
                        <span>{post.likes}</span>
                      </button>
                      <button className="action-button">
                        <MessageCircle className="action-icon" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="action-button">
                        <Share2 className="action-icon" />
                        <span>{post.shares}</span>
                      </button>
                      <button
                        className={`action-button bookmark ${
                          post.isBookmarked ? 'active' : ''
                        }`}
                      >
                        <Bookmark className="action-icon" />
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
                Top Contributors
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
                Trending Topics
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
