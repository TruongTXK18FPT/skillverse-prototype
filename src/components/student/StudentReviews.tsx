import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  MessageSquare,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { getMyStudentReviews, ReviewResponse } from '../../services/reviewService';
import Pagination from '../shared/Pagination';
import '../../styles/StudentReviews.css';

type StudentReviewSort = 'newest' | 'oldest';

const REVIEWS_PER_PAGE = 3;

const REVIEW_TAG_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
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
    return {
      tags: [] as string[],
      message: source,
    };
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

const StudentReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<StudentReviewSort>('newest');
  const [currentPage, setCurrentPage] = useState(1);

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
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="student-review-card__stars" aria-label={`${rating} sao`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={`student-review-star ${index < rating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [reviews, sortBy]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    return sortedReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [sortedReviews, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  useEffect(() => {
    const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE);
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [sortedReviews.length, currentPage]);

  if (loading) {
    return (
      <div className="student-reviews-feedback student-reviews-feedback--loading">
        Đang tải đánh giá...
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-reviews-feedback student-reviews-feedback--error">
        {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="student-reviews-feedback student-reviews-feedback--empty">
        <MessageSquare className="empty-icon" />
        <p>Bạn chưa có đánh giá nào.</p>
      </div>
    );
  }

  return (
    <div className="student-reviews-container">
      <div className="student-reviews-toolbar">
        <h3 className="student-reviews-title">Lịch sử đánh giá của bạn</h3>
        <div className="student-reviews-toolbar__actions">
          <div className="student-reviews-sort">
            <label htmlFor="student-reviews-sort">Sắp xếp</label>
            <select
              id="student-reviews-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as StudentReviewSort)
              }
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>

          <span className="student-reviews-count">{reviews.length} đánh giá</span>
        </div>
      </div>

      <div className="student-reviews-list">
        {paginatedReviews.map((review) => {
          const parsedComment = parseReviewPayload(review.comment);
          const parsedReply = parseReviewPayload(review.reply);

          return (
            <article key={review.id} className="student-review-card">
              <header className="student-review-card__header">
                <div className="student-review-card__mentor">
                  <div className="student-review-card__avatar">
                    <User size={18} />
                  </div>
                  <div className="student-review-card__mentor-meta">
                    <h4>Mentor #{review.mentorId}</h4>
                    <p>Booking #{review.bookingId}</p>
                  </div>
                </div>
                <div className="student-review-card__meta">
                  {renderStars(review.rating)}
                  <span className="student-review-card__date">
                    <Calendar size={13} />
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </header>

              {parsedComment.tags.length > 0 && (
                <div className="student-review-card__tags">
                  {parsedComment.tags.map((tag) => {
                    const TagIcon = REVIEW_TAG_META[tag].icon;
                    return (
                      <span key={tag} className="student-review-card__tag-chip">
                        <TagIcon size={14} />
                        {REVIEW_TAG_META[tag].label}
                      </span>
                    );
                  })}
                </div>
              )}

              <p className="student-review-card__comment">
                {parsedComment.message || review.comment || 'Không có nội dung đánh giá.'}
              </p>

              {review.reply && (
                <div className="student-review-card__reply">
                  <div className="student-review-card__reply-header">
                    <span>Phản hồi từ Mentor</span>
                    <span>{formatDate(review.updatedAt)}</span>
                  </div>
                  <p>{parsedReply.message || review.reply}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Pagination
        totalItems={sortedReviews.length}
        itemsPerPage={REVIEWS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StudentReviews;
