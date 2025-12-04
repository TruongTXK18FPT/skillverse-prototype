import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getReviewsByMentor, replyToReview, ReviewResponse } from '../../services/reviewService';
import './ReviewsTab.css';

const ReviewsTab: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getReviewsByMentor(user.id, 0, 100); // Fetch all for now
      // Backend returns a List, not a Page, so use data directly
      if (Array.isArray(data)) {
        setReviews(data);
      } else if (data.content) {
        setReviews(data.content);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Failed to fetch reviews', error);
      setReviews([]);
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
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Failed to reply', error);
      alert('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100
      : 0
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;
    
    // Filter by rating if selected
    if (selectedRating !== null) {
      filtered = reviews.filter(review => review.rating === selectedRating);
    }

    // Sort reviews
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredReviews = getFilteredAndSortedReviews();

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
            <p>Dựa trên {reviews.length} đánh giá</p>
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
        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => (
            <div key={review.id} className="mentor-reviews-card">
              <div className="mentor-reviews-header">
                <div className="mentor-reviews-student-info">
                  <div className="mentor-reviews-student-avatar">
                    {review.learnerAvatar ? (
                      <img src={review.learnerAvatar} alt={review.learnerName} />
                    ) : (
                      <div className="mentor-reviews-avatar-placeholder">
                        {review.learnerName ? review.learnerName.charAt(0) : 'U'}
                      </div>
                    )}
                  </div>
                  <div className="mentor-reviews-student-details">
                    <h4>{review.learnerName || 'Học viên ẩn danh'}</h4>
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
                <p>{review.comment}</p>
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
          ))
        ) : (
          <div className="mentor-reviews-no-reviews">
            <p>Không tìm thấy đánh giá nào phù hợp với bộ lọc của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsTab;
