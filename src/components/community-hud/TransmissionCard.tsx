import React from 'react';
import { Clock, ThumbsUp, ThumbsDown, MessageCircle, Tag } from 'lucide-react';
import communityService from '../../services/communityService';
import { useAuth } from '../../context/AuthContext';
import LoginRequiredModal from '../auth/LoginRequiredModal';
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
  likedByCurrentUser?: boolean;
  dislikedByCurrentUser?: boolean;
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

const normalizeReactionState = (post: CommunityPost) => ({
  isLiked: !!post.likedByCurrentUser,
  isDisliked: !!post.dislikedByCurrentUser,
  likeCount: typeof post.likes === 'number' ? post.likes : 0,
  dislikeCount: typeof post.dislikes === 'number' ? post.dislikes : 0,
});

const TransmissionCard: React.FC<TransmissionCardProps> = ({ post, index = 0 }) => {
  const [isLiked, setIsLiked] = React.useState(!!post.likedByCurrentUser);
  const [isDisliked, setIsDisliked] = React.useState(!!post.dislikedByCurrentUser);
  const [isBookmarked, setIsBookmarked] = React.useState(post.isBookmarked);
  const [likeCount, setLikeCount] = React.useState(post.likes);
  const [dislikeCount, setDislikeCount] = React.useState(post.dislikes || 0);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    const reactionState = normalizeReactionState(post);
    setIsLiked(reactionState.isLiked);
    setIsDisliked(reactionState.isDisliked);
    setLikeCount(reactionState.likeCount);
    setDislikeCount(reactionState.dislikeCount);
    setIsBookmarked(post.isBookmarked);
  }, [post]);

  const ensureAuth = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth()) return;
    try {
      const updatedPost = await communityService.likePost(post.id);
      setIsLiked(!!updatedPost.likedByCurrentUser);
      setIsDisliked(!!updatedPost.dislikedByCurrentUser);
      setLikeCount(typeof updatedPost.likeCount === 'number' ? updatedPost.likeCount : 0);
      setDislikeCount(typeof updatedPost.dislikeCount === 'number' ? updatedPost.dislikeCount : 0);
    } catch (e) { console.debug('like failed', e); }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth()) return;
    try {
      const updatedPost = await communityService.dislikePost(post.id);
      setIsLiked(!!updatedPost.likedByCurrentUser);
      setIsDisliked(!!updatedPost.dislikedByCurrentUser);
      setLikeCount(typeof updatedPost.likeCount === 'number' ? updatedPost.likeCount : 0);
      setDislikeCount(typeof updatedPost.dislikeCount === 'number' ? updatedPost.dislikeCount : 0);
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

  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const decodedTitle = decodeHtml(post.title);
  const decodedContent = decodeHtml(post.content);
  // Strip all HTML tags for preview
  const plainContent = stripHtml(decodedContent);

  return (
    <>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để tương tác cộng đồng"
        message="Bạn cần đăng nhập để like, bình luận hoặc lưu bài viết"
        feature="Cộng đồng"
      />

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
        </div>
        <div className="transmission-timestamp">
          <Clock size={14} />
          <span>{post.timeAgo}</span>
        </div>
      </div>

      {/* Content */}
      <h2 className="transmission-title">{decodedTitle}</h2>
      <p className="transmission-content">
        {plainContent.length > 150
          ? `${plainContent.substring(0, 150)}...`
          : plainContent}
      </p>

      {/* Post Thumbnail if available */}
      {post.image && (
        <div className="transmission-thumbnail" style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={post.image} alt="thumbnail" style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover' }} />
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
          className={`transmission-action-btn liked ${isLiked ? 'active' : ''}`}
          onClick={handleLike}
          title="Thích"
        >
          <ThumbsUp size={16} />
          <span>{formatNumber(likeCount)}</span>
        </button>
        <button
          className={`transmission-action-btn disliked ${isDisliked ? 'active' : ''}`}
          onClick={handleDislike}
          title="Không thích"
        >
          <ThumbsDown size={16} />
          <span>{formatNumber(dislikeCount)}</span>
        </button>
        <button
          className="transmission-action-btn"
          title="Bình luận"
        >
          <MessageCircle size={16} />
          <span>{formatNumber(post.comments)}</span>
        </button>
      </div>
      </article>
    </>
  );
};

export default TransmissionCard;
