import React, { useState, useEffect } from 'react';
import { BookOpen, CheckSquare, Clock, MessageSquare, User, Users, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMyMentorReviewsPage,
  getMyMentorReviewStats,
  replyToReview,
  ReviewResponse,
  ReviewStatsResponse
} from '../../services/reviewService';
import { showAppError } from '../../context/ToastContext';
import Pagination from '../shared/Pagination';
import './ReviewsTab.css';

const ReviewsTab: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [stats, setStats] = useState<ReviewStatsResponse>({
    totalReviews: 0,
    averageRating: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0
  });
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    if (!user) return;
    fetchReviewStats();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    fetchReviews();
  }, [user?.id, currentPage, selectedRating, sortBy]);

  const mapSortToApi = () => {
    switch (sortBy) {
      case 'oldest':
        return 'createdAt,asc';
      case 'highest':
        return 'rating,desc';
      case 'lowest':
        return 'rating,asc';
      case 'newest':
      default:
        return 'createdAt,desc';
    }
  };

  const fetchReviewStats = async () => {
    if (!user) return;
    try {
      const statsData = await getMyMentorReviewStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch review stats', error);
    }
  };

  const fetchReviews = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const pageData = await getMyMentorReviewsPage(
        currentPage - 1,
        itemsPerPage,
        selectedRating,
        mapSortToApi()
      );

      if (currentPage > 1 && pageData.content.length === 0 && pageData.totalElements > 0) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        return;
      }

      setReviews(pageData.content || []);
      setTotalItems(pageData.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
      setReviews([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      await replyToReview(reviewId, { reply: replyText });
      // Refresh reviews
      await fetchReviews();
      await fetchReviewStats();
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Failed to reply', error);
      showAppError('Không thể gửi phản hồi', 'Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const averageRating = stats.averageRating || 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count:
      rating === 5 ? stats.fiveStarCount :
      rating === 4 ? stats.fourStarCount :
      rating === 3 ? stats.threeStarCount :
      rating === 2 ? stats.twoStarCount :
      stats.oneStarCount,
    percentage: stats.totalReviews > 0
      ? (
          (rating === 5 ? stats.fiveStarCount :
            rating === 4 ? stats.fourStarCount :
            rating === 3 ? stats.threeStarCount :
            rating === 2 ? stats.twoStarCount :
            stats.oneStarCount) / stats.totalReviews
        ) * 100
      : 0
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const REVIEW_TAG_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    CONTENT_QUALITY: { label: 'Chất lượng nội dung', icon: BookOpen },
    PUNCTUALITY: { label: 'Đúng giờ', icon: Clock },
    COMMUNICATION: { label: 'Giao tiếp tốt', icon: MessageSquare },
    PREPARATION: { label: 'Chuẩn bị kỹ', icon: CheckSquare },
    FRIENDLY: { label: 'Thân thiện', icon: Users },
    KNOWLEDGEABLE: { label: 'Chuyên môn cao', icon: Zap },
  };

  const parseReviewPayload = (raw?: string | null) => {
    const source = (raw || '').trim();
    const match = source.match(/^\[([A-Z_,\s]+)\]\s*(.*)$/s);
    if (!match) {
      return { tags: [] as string[], message: source };
    }

    const tags = match[1]
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => !!tag && !!REVIEW_TAG_META[tag]);

    return {
      tags,
      message: (match[2] || '').trim(),
    };
  };

  const renderStars = (rating: number, size: 'small' | 'medium' | 'large' = 'medium') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`mentor-reviews-star mentor-reviews-star-${size} ${i <= rating ? 'filled' : 'empty'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRating, sortBy]);

  if (loading) {
    return <div className="mentor-reviews-loading">Đang tải đánh giá...</div>;
  }

  return (
    <div className="mentor-reviews-tab">
      {/* Reviews Summary */}
      <div className="mentor-reviews-summary">
        <div className="mentor-reviews-overall-rating">
          <div className="mentor-reviews-rating-score">
            <div className="mentor-reviews-average">{averageRating.toFixed(1)}</div>
            <div className="mentor-reviews-stars-large">
              {renderStars(Math.round(averageRating), 'large')}
            </div>
            <p>Dựa trên {stats.totalReviews} đánh giá</p>
          </div>
        </div>

        <div className="mentor-reviews-rating-distribution">
          <h3>Phân Bố Đánh Giá</h3>
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="mentor-reviews-rating-row">
              <div className="mentor-reviews-rating-label">{rating} sao</div>
              <div className="mentor-reviews-rating-bar">
                <div 
                  className="mentor-reviews-rating-fill"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="mentor-reviews-rating-count">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mentor-reviews-controls">
        <div className="mentor-reviews-filters">
          <h4>Lọc Theo Đánh Giá:</h4>
          <div className="mentor-reviews-rating-filters">
            <button 
              className={`mentor-reviews-filter-btn ${selectedRating === null ? 'active' : ''}`}
              onClick={() => setSelectedRating(null)}
            >
              Tất Cả
            </button>
            {[5, 4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                className={`mentor-reviews-filter-btn ${selectedRating === rating ? 'active' : ''}`}
                onClick={() => setSelectedRating(rating)}
              >
                {rating} Sao
              </button>
            ))}
          </div>
        </div>

        <div className="mentor-reviews-sorting">
          <label htmlFor="sort-reviews">Sắp Xếp Theo:</label>
          <select 
            id="sort-reviews"
            className="mentor-reviews-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Mới Nhất</option>
            <option value="oldest">Cũ Nhất</option>
            <option value="highest">Đánh Giá Cao Nhất</option>
            <option value="lowest">Đánh Giá Thấp Nhất</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="mentor-reviews-list">
        {reviews.length > 0 ? (
          reviews.map(review => {
            const isAnonymousReviewer =
              Boolean(review.isAnonymous) ||
              !review.learnerName ||
              /anonymous|ẩn danh/i.test(review.learnerName);
            const parsed = parseReviewPayload(review.comment);

            return (
            <div key={review.id} className="mentor-reviews-card">
              <div className="mentor-reviews-header">
                <div className="mentor-reviews-student-info">
                  <div className="mentor-reviews-student-avatar">
                    {review.learnerAvatar && !isAnonymousReviewer ? (
                      <img src={review.learnerAvatar} alt={review.learnerName} />
                    ) : (
                      <div className="mentor-reviews-avatar-placeholder">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <div className="mentor-reviews-student-details">
                    <h4>{isAnonymousReviewer ? 'Học viên ẩn danh' : (review.learnerName || 'Học viên')}</h4>
                    <p className="mentor-reviews-session-topic">Booking #{review.bookingId}</p>
                  </div>
                </div>
                <div className="mentor-reviews-meta">
                  <div className="mentor-reviews-rating">
                    {renderStars(review.rating, 'small')}
                  </div>
                  <span className="mentor-reviews-date">{formatDate(review.createdAt)}</span>
                </div>
              </div>

              <div className="mentor-reviews-content">
                {parsed.tags.length > 0 && (
                  <div className="mentor-reviews-tag-list">
                    {parsed.tags.map((tag) => {
                      const TagIcon = REVIEW_TAG_META[tag].icon;
                      return (
                        <span key={tag} className="mentor-reviews-tag-chip">
                          <TagIcon size={14} />
                          {REVIEW_TAG_META[tag].label}
                        </span>
                      );
                    })}
                  </div>
                )}
                <p>{parsed.message || review.comment}</p>
              </div>

              {/* Reply Section */}
              {review.reply ? (
                <div className="mentor-reviews-reply">
                  <div className="mentor-reviews-reply-header">
                    <strong>Phản hồi của bạn:</strong>
                    <span className="mentor-reviews-reply-date">{formatDate(review.updatedAt)}</span>
                  </div>
                  <p>{review.reply}</p>
                </div>
              ) : (
                <div className="mentor-reviews-actions">
                  {replyingTo === review.id ? (
                    <div className="mentor-reviews-reply-form">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập phản hồi của bạn..."
                        rows={3}
                      />
                      <div className="mentor-reviews-reply-buttons">
                        <button 
                          className="mentor-btn-secondary" 
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        >
                          Hủy
                        </button>
                        <button 
                          className="mentor-btn-primary" 
                          onClick={() => handleReplySubmit(review.id)}
                          disabled={submittingReply}
                        >
                          {submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="mentor-btn-secondary"
                      onClick={() => setReplyingTo(review.id)}
                    >
                      Trả lời
                    </button>
                  )}
                </div>
              )}
            </div>
            );
          })
        ) : (
          <div className="mentor-reviews-no-reviews">
            <p>Không tìm thấy đánh giá nào phù hợp với bộ lọc của bạn.</p>
          </div>
        )}
      </div>
      {totalItems > 0 && (
        <Pagination
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default ReviewsTab;
