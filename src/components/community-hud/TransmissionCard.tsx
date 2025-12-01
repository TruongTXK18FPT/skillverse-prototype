import React from 'react';
import { Clock, ThumbsUp, ThumbsDown, MessageCircle, Share2, Bookmark, Tag } from 'lucide-react';
import communityService from '../../services/communityService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { decodeHtml } from '../../utils/htmlDecoder';

export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  likes: number;
  dislikes?: number;
  comments: number;
  shares: number;
  isBookmarked: boolean;
  timeAgo: string;
  readTime: string;
  image?: string;
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
  const [isDisliked, setIsDisliked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(post.isBookmarked);
  const [likeCount, setLikeCount] = React.useState(post.likes);
  const [dislikeCount, setDislikeCount] = React.useState(post.dislikes || 0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const ensureAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth()) return;
    try {
      await communityService.likePost(post.id);
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
        if (isDisliked) {
          setIsDisliked(false);
          setDislikeCount((c) => Math.max(0, c - 1));
        }
      }
    } catch (e) { console.debug('like failed', e); }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth()) return;
    try {
      await communityService.dislikePost(post.id);
      if (isDisliked) {
        setIsDisliked(false);
        setDislikeCount((c) => Math.max(0, c - 1));
      } else {
        setIsDisliked(true);
        setDislikeCount((c) => c + 1);
        if (isLiked) {
          setIsLiked(false);
          setLikeCount((c) => Math.max(0, c - 1));
        }
      }
    } catch (e) { console.debug('dislike failed', e); }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth()) return;
    try {
      await communityService.savePost(post.id);
      setIsBookmarked(true);
    } catch (e) { console.debug('bookmark failed', e); }
  };

  // Format timestamp as "T-Minus" or "Log Date"
  const formatTimestamp = (timeAgo: string) => {
    const lower = timeAgo.toLowerCase();
    if (lower.includes('hour') || lower.includes('min')) {
      const vi = lower
        .replace('hours', 'giờ')
        .replace('hour', 'giờ')
        .replace('minutes', 'phút')
        .replace('minute', 'phút')
        .replace('min', 'phút')
        .replace('ago', 'trước');
      return `Cách đây ${vi}`;
    }
    return `Ngày ghi: ${timeAgo}`;
  };

  const categoryViMap: Record<string, string> = {
    tips: 'Mẹo hay',
    discussion: 'Thảo luận',
    tutorial: 'Hướng dẫn',
    news: 'Tin tức',
    career: 'Tuyển dụng',
    showcase: 'Trưng bày',
    all: 'Tất cả',
  };

  const decodedTitle = decodeHtml(post.title);
  const decodedContent = decodeHtml(post.content);
  // Remove markdown images from preview text
  const plainContent = decodedContent.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/<img[^>]*>/g, '');

  return (
    <article
      className="transmission-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header with Hexagon Avatar */}
      <div className="transmission-card-header">
        <img
          src={post.authorAvatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'}
          alt={post.author}
          className="transmission-avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';
          }}
        />
        <div className="transmission-author-info">
          <h4 className="transmission-author-name">{post.author}</h4>
          <p className="transmission-author-role">Người đăng // {categoryViMap[post.category] || 'Chủ đề'}</p>
        </div>
        <div className="transmission-timestamp">
          <Clock size={14} />
          <span>{formatTimestamp(post.timeAgo)}</span>
        </div>
      </div>

      {/* Content */}
      <h2 className="transmission-title">{decodedTitle}</h2>
      <p className="transmission-content">
        {plainContent.length > 200
          ? `${plainContent.substring(0, 200)}...`
          : plainContent}
      </p>

      {/* Post Thumbnail if available */}
      {post.image && (
        <div className="transmission-thumbnail" style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={post.image} alt="thumbnail" style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover' }} />
        </div>
      )}

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
          title="Thích"
        >
          <ThumbsUp size={18} />
          <span>{formatNumber(likeCount)}</span>
        </button>
        <button
          className={`transmission-action-btn ${isDisliked ? 'active' : ''}`}
          onClick={handleDislike}
          title="Không thích"
        >
          <ThumbsDown size={18} />
          <span>{formatNumber(dislikeCount)}</span>
        </button>
        <button
          className="transmission-action-btn"
          title="Bình luận"
        >
          <MessageCircle size={18} />
          <span>{formatNumber(post.comments)}</span>
        </button>
        <button
          className="transmission-action-btn"
          title="Chia sẻ"
        >
          <Share2 size={18} />
          <span>{formatNumber(post.shares)}</span>
        </button>
        <button
          className={`transmission-action-btn ${isBookmarked ? 'active' : ''}`}
          onClick={handleBookmark}
          title="Lưu"
        >
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
};

export default TransmissionCard;
