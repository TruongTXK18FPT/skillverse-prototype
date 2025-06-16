import React, { useState } from 'react';
import {
  MessageCircle, Heart, Share2, Bookmark, ThumbsUp,
  User, Clock, Tag, Filter, Search, Edit, TrendingUp,
  Users, Star, Award, Globe
} from 'lucide-react';
import '../../styles/CommunityPage.css';

const CommunityPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="community-container">
      <div className="community-content">
        {/* Header */}
        <div className="community-header">
          <h1 className="community-title">Community Hub</h1>
          <p className="community-description">
            Share knowledge, learn from others, and grow together with our vibrant tech community
          </p>
          <button className="create-post-button">
            <Edit className="button-icon" />
            <span>Create Post</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search posts, topics, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="filter-button">
            <Filter className="filter-icon" />
            <span>Filters</span>
          </button>
        </div>

        <div className="community-main">
          {/* Main Content */}
          <div className="posts-section">
            {/* Categories */}
            <div className="categories-list">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`category-button ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="category-count">({category.count})</span>
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="posts-grid">
              {posts.map((post) => (
                <article key={post.id} className="post-card">
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
                <Star className="sidebar-icon" />
                Top Contributors
              </h3>
              <div className="contributors-list">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="contributor-card">
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
                            <Award className="badge-icon" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="contribution-count">
                      <span>{contributor.contributions}</span>
                      <span>posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <TrendingUp className="sidebar-icon" />
                Trending Topics
              </h3>
              <div className="trending-topics">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="topic-card">
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
                <Globe className="sidebar-icon" />
                Community Stats
              </h3>
              <div className="community-stats">
                <div className="stat-card">
                  <Users className="stat-icon" />
                  <div className="stat-info">
                    <span className="stat-value">15,234</span>
                    <span className="stat-label">Members</span>
                  </div>
                </div>
                <div className="stat-card">
                  <MessageCircle className="stat-icon" />
                  <div className="stat-info">
                    <span className="stat-value">45,678</span>
                    <span className="stat-label">Posts</span>
                  </div>
                </div>
                <div className="stat-card">
                  <Heart className="stat-icon" />
                  <div className="stat-info">
                    <span className="stat-value">123,456</span>
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
