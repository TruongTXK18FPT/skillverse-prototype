import React, { useState } from 'react';
import { Review } from '../../pages/main/MentorPage';
import './ReviewsTab.css';

const ReviewsTab: React.FC = () => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Mock data for reviews
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      studentName: 'Nguyễn Văn An',
      rating: 5,
      feedback: 'Mentor xuất sắc! Rất am hiểu về React và cung cấp các ví dụ thực tế. Buổi học được tổ chức tốt và tôi đã học được rất nhiều về các thực hành tốt nhất.',
      date: '2025-01-15T14:30:00',
      sessionTopic: 'Thực Hành Tốt Nhất React',
      studentAvatar: undefined
    },
    {
      id: '2',
      studentName: 'Trần Thị Bình',
      rating: 5,
      feedback: 'Buổi tư vấn nghề nghiệp tuyệt vời. Giúp tôi hiểu rõ hơn về ngành và đưa ra lời khuyên có thể thực hiện được cho việc tìm kiếm công việc.',
      date: '2025-01-14T16:00:00',
      sessionTopic: 'Hướng Dẫn Nghề Nghiệp',
      studentAvatar: undefined
    },
    {
      id: '3',
      studentName: 'Lê Văn Cường',
      rating: 4,
      feedback: 'Buổi học cơ bản TypeScript tốt. Có thể cần thêm ví dụ thực tế, nhưng tổng thể rất hữu ích.',
      date: '2025-01-13T10:15:00',
      sessionTopic: 'Cơ Bản TypeScript',
      studentAvatar: undefined
    },
    {
      id: '4',
      studentName: 'Phạm Thị Dung',
      rating: 5,
      feedback: 'Mentor xuất sắc! Rất kiên nhẫn và giải thích các khái niệm phức tạp một cách đơn giản. Rất khuyến khích!',
      date: '2025-01-12T09:30:00',
      sessionTopic: 'Chủ Đề Nâng Cao JavaScript',
      studentAvatar: undefined
    },
    {
      id: '5',
      studentName: 'Hoàng Văn Em',
      rating: 4,
      feedback: 'Buổi học phát triển web tuyệt vời. Học được về các framework hiện đại và thực hành tốt nhất. Sẽ đặt lịch lại.',
      date: '2025-01-11T15:45:00',
      sessionTopic: 'Tổng Quan Phát Triển Web',
      studentAvatar: undefined
    },
    {
      id: '6',
      studentName: 'Võ Thị Phương',
      rating: 5,
      feedback: 'Buổi học hoàn hảo! Giúp tôi giải quyết các vấn đề phức tạp trong dự án và tạo động lực để tiếp tục học tập.',
      date: '2025-01-10T11:20:00',
      sessionTopic: 'Debug Dự Án',
      studentAvatar: undefined
    }
  ]);

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
          className={`rt-star rt-star-${size} ${i <= rating ? 'filled' : 'empty'}`}
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
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
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

  return (
    <div className="rt-reviews-tab">
      {/* Reviews Summary */}
      <div className="rt-summary">
        <div className="rt-overall-rating">
          <div className="rt-rating-score">
            <span className="rt-average">{averageRating.toFixed(1)}</span>
            <div className="rt-stars-large">
              {renderStars(Math.round(averageRating), 'large')}
            </div>
            <p>Dựa trên {reviews.length} đánh giá</p>
          </div>
        </div>

        <div className="rt-rating-distribution">
          <h3>Phân Bố Đánh Giá</h3>
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="rt-rating-row">
              <span className="rt-rating-label">{rating} sao</span>
              <div className="rt-rating-bar">
                <div 
                  className="rt-rating-fill" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="rt-rating-count">({count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="rt-controls">
        <div className="rt-filters">
          <h4>Lọc theo Đánh Giá:</h4>
          <div className="rt-rating-filters">
            <button
              className={`rt-filter-btn ${selectedRating === null ? 'active' : ''}`}
              onClick={() => setSelectedRating(null)}
            >
              Tất Cả Đánh Giá
            </button>
            {[5, 4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                className={`rt-filter-btn ${selectedRating === rating ? 'active' : ''}`}
                onClick={() => setSelectedRating(rating)}
              >
                {rating} {renderStars(rating, 'small')}
              </button>
            ))}
          </div>
        </div>

        <div className="rt-sorting">
          <label htmlFor="sort-select">Sắp xếp theo:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rt-sort-select"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="rt-reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="rt-no-reviews">
            <p>Không tìm thấy đánh giá nào phù hợp với tiêu chí đã chọn.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="rt-review-card">
              <div className="rt-review-header">
                <div className="rt-student-info">
                  <div className="rt-student-avatar">
                    {review.studentAvatar ? (
                      <img src={review.studentAvatar} alt={review.studentName} />
                    ) : (
                      <span className="rt-avatar-placeholder">
                        {review.studentName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="rt-student-details">
                    <h4>{review.studentName}</h4>
                    <p className="rt-session-topic">{review.sessionTopic}</p>
                  </div>
                </div>
                
                <div className="rt-review-meta">
                  <div className="rt-rating">
                    {renderStars(review.rating, 'medium')}
                  </div>
                  <span className="rt-review-date">{formatDate(review.date)}</span>
                </div>
              </div>

              <div className="rt-review-content">
                <p>{review.feedback}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reviews Stats */}
      <div className="rt-stats">
        <div className="rt-stat-item">
          <span className="rt-stat-icon">📈</span>
          <div>
            <h4>Đánh Giá Trung Bình</h4>
            <p>{averageRating.toFixed(1)} trên 5.0</p>
          </div>
        </div>
        
        <div className="rt-stat-item">
          <span className="rt-stat-icon">⭐</span>
          <div>
            <h4>Đánh Giá 5 Sao</h4>
            <p>{ratingDistribution[0].count} ({ratingDistribution[0].percentage.toFixed(1)}%)</p>
          </div>
        </div>
        
        <div className="rt-stat-item">
          <span className="rt-stat-icon">💬</span>
          <div>
            <h4>Tổng Đánh Giá</h4>
            <p>{reviews.length} đánh giá đã nhận</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsTab;
