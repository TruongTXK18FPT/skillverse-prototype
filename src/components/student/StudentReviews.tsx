import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, User } from 'lucide-react';
import { getMyStudentReviews, ReviewResponse } from '../../services/reviewService';
import '../../styles/StudentReviews.css';

const StudentReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getMyStudentReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Không thể tải lịch sử đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="student-reviews-loading">Đang tải đánh giá...</div>;
  }

  if (error) {
    return <div className="student-reviews-error">{error}</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="student-reviews-empty">
        <MessageSquare className="empty-icon" />
        <p>Bạn chưa có đánh giá nào.</p>
      </div>
    );
  }

  return (
    <div className="student-reviews-container">
      <h2 className="student-reviews-title">Lịch Sử Đánh Giá Của Bạn</h2>
      <div className="student-reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="student-review-card">
            <div className="review-header">
              <div className="review-mentor-info">
                {/* Ideally we would have mentor info here, but the DTO might need adjustment or we use what we have */}
                <div className="mentor-avatar-placeholder">
                  <User size={20} />
                </div>
                <span className="mentor-id">Mentor #{review.mentorId}</span>
              </div>
              <div className="review-date">
                <Calendar size={14} />
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
            
            <div className="review-rating">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < review.rating ? 'star-filled' : 'star-empty'}
                  fill={i < review.rating ? '#fbbf24' : 'none'}
                  color={i < review.rating ? '#fbbf24' : '#d1d5db'}
                />
              ))}
            </div>

            <div className="review-content">
              <p>"{review.comment}"</p>
            </div>

            {review.reply && (
              <div className="review-reply">
                <div className="reply-header">
                  <span className="reply-label">Phản hồi từ Mentor:</span>
                </div>
                <p className="reply-content">{review.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentReviews;
