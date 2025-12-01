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
                    {review.studentAvatar ? (
                      <img src={review.studentAvatar} alt={review.studentName} />
                    ) : (
                      <div className="mentor-reviews-avatar-placeholder">
                        {review.studentName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="mentor-reviews-student-details">
                    <h4>{review.studentName}</h4>
                    <p className="mentor-reviews-session-topic">{review.sessionTopic}</p>
                  </div>
                </div>
                <div className="mentor-reviews-meta">
                  <div className="mentor-reviews-rating">
                    {renderStars(review.rating, 'small')}
                  </div>
                  <span className="mentor-reviews-date">{formatDate(review.date)}</span>
                </div>
              </div>
              <div className="mentor-reviews-content">
                <p>{review.feedback}</p>
              </div>
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
