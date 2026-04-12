import React from 'react';
import { MentorProfile } from '../../../services/mentorProfileService';
import { ReviewStatsResponse } from '../../../services/reviewService';
import { Camera } from 'lucide-react';
import './CommanderStyles.css';

interface CommanderHeaderProps {
  profile: MentorProfile | null;
  reviewStats?: ReviewStatsResponse | null;
  onAvatarUpload: (file: File) => void | Promise<void>;
  preChatEnabled: boolean;
  onTogglePreChat: () => void;
}

const CommanderHeader: React.FC<CommanderHeaderProps> = ({
  profile,
  reviewStats,
  onAvatarUpload,
  preChatEnabled,
  onTogglePreChat,
}) => {
  const hasReviewStats = Boolean(reviewStats && reviewStats.totalReviews > 0);
  const resolvedAverageRating = hasReviewStats
    ? reviewStats!.averageRating
    : typeof profile?.ratingAverage === 'number' && (profile?.ratingCount ?? 0) > 0
      ? profile.ratingAverage
      : null;
  const resolvedRatingCount = hasReviewStats
    ? reviewStats!.totalReviews
    : typeof profile?.ratingCount === 'number' && profile.ratingCount > 0
      ? profile.ratingCount
      : null;

  const stats = [
    {
      label: 'Kinh nghiệm',
      value:
        typeof profile?.experience === 'number' && profile.experience > 0
          ? `${profile.experience} năm`
          : null,
    },
    {
      label: 'Đánh giá',
      value:
        typeof resolvedAverageRating === 'number'
          ? resolvedAverageRating.toFixed(1)
          : null,
    },
    {
      label: 'Lượt đánh giá',
      value:
        typeof resolvedRatingCount === 'number'
          ? resolvedRatingCount.toLocaleString('vi-VN')
          : null,
    },
    {
      label: 'Học phí / giờ',
      value:
        typeof profile?.hourlyRate === 'number' && profile.hourlyRate > 0
          ? `${profile.hourlyRate.toLocaleString('vi-VN')} đ`
          : null,
    },
  ].filter((item) => !!item.value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onAvatarUpload(selectedFile);
    }

    // Reset input so selecting the same file still triggers onChange.
    e.target.value = '';
  };

  return (
    <div className="cmdr-header">
      <div className="cmdr-avatar-container">
        <div className="cmdr-avatar-ring"></div>
        <img 
          src={profile?.avatar || 'https://via.placeholder.com/150'} 
          alt="Commander Avatar" 
          className="cmdr-avatar-img"
        />
        
        {/* Hidden File Input for Avatar Upload */}
        <input 
          type="file" 
          id="avatar-upload" 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
        />
        <label 
          htmlFor="avatar-upload" 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            right: 0, 
            background: 'var(--cmdr-accent-blue)', 
            color: '#fff', 
            padding: '5px', 
            borderRadius: '50%', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <Camera size={24} />
        </label>
      </div>

      <div className="cmdr-info-col">
        <div className="cmdr-rank-badge">
          {profile?.specialization
            ? profile.specialization.toUpperCase()
            : 'CHƯA CẬP NHẬT CHUYÊN MÔN'}
        </div>
        <h1 className="cmdr-name">
          {profile?.firstName || profile?.lastName
            ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
            : 'GIẢNG VIÊN'}
        </h1>

        {stats.length > 0 && (
          <div className="cmdr-stats-row">
            {stats.map((stat) => (
              <div className="cmdr-stat-item" key={stat.label}>
                <span className="cmdr-stat-label">{stat.label}</span>
                <span className="cmdr-stat-value">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cmdr-actions-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', marginLeft: 'auto' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--cmdr-text-dim)', marginBottom: '0.5rem', letterSpacing: '1px' }}>
          TRẠNG THÁI
        </div>
        <button 
          type="button"
          className={`cmdr-btn ${preChatEnabled ? 'cmdr-btn-primary' : 'cmdr-btn-danger'}`}
          onClick={onTogglePreChat}
          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
        >
          {preChatEnabled ? 'TRỰC TUYẾN' : 'NGOẠI TUYẾN'}
        </button>
      </div>
    </div>
  );
};

export default CommanderHeader;
