import React from 'react';
import { Clock, ThumbsUp, MessageCircle, Share2, Bookmark, Tag } from 'lucide-react';

export interface CommunityPost {
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

interface TransmissionCardProps {
  post: CommunityPost;
  index?: number;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const TransmissionCard: React.FC<TransmissionCardProps> = ({ post, index = 0 }) => {
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(post.isBookmarked);
  const [likeCount, setLikeCount] = React.useState(post.likes);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  // Format timestamp as "T-Minus" or "Log Date"
  const formatTimestamp = (timeAgo: string) => {
    if (timeAgo.includes('hour') || timeAgo.includes('min')) {
      return `T-MINUS ${timeAgo.toUpperCase()}`;
    }
    return `LOG DATE: ${timeAgo.toUpperCase()}`;
  };

  return (
    <article
      className="transmission-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header with Hexagon Avatar */}
      <div className="transmission-card-header">
        <img
          src={post.image}
          alt={post.author}
          className="transmission-avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';
          }}
        />
        <div className="transmission-author-info">
          <h4 className="transmission-author-name">{post.author}</h4>
          <p className="transmission-author-role">PILOT // {post.category.toUpperCase()}</p>
        </div>
        <div className="transmission-timestamp">
          <Clock size={14} />
          <span>{formatTimestamp(post.timeAgo)}</span>
        </div>
      </div>

      {/* Content */}
      <h2 className="transmission-title">{post.title}</h2>
      <p className="transmission-content">
        {post.content.length > 200
          ? `${post.content.substring(0, 200)}...`
          : post.content}
      </p>

      {/* Frequency Channels (Tags) */}
      {post.tags.length > 0 && (
        <div className="transmission-tags">
          {post.tags.map((tag, tagIndex) => (
            <span key={tagIndex} className="transmission-tag">
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Signal Actions */}
      <div className="transmission-actions">
        <button
          className={`transmission-action-btn ${isLiked ? 'active' : ''}`}
          onClick={handleLike}
          title="Signal Boost"
        >
          <ThumbsUp size={18} />
          <span>{formatNumber(likeCount)}</span>
        </button>
        <button
          className="transmission-action-btn"
          title="Responses"
        >
          <MessageCircle size={18} />
          <span>{formatNumber(post.comments)}</span>
        </button>
        <button
          className="transmission-action-btn"
          title="Relay Signal"
        >
          <Share2 size={18} />
          <span>{formatNumber(post.shares)}</span>
        </button>
        <button
          className={`transmission-action-btn ${isBookmarked ? 'active' : ''}`}
          onClick={handleBookmark}
          title="Archive"
        >
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
};

export default TransmissionCard;