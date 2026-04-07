import React from 'react';
import {
  Calendar, Clock, MapPin, DollarSign, Star, FileText,
  ExternalLink, X, MessageSquare, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompletedMissionDTO } from '../../data/portfolioDTOs';
import MarkdownRenderer from '../learning-report/MarkdownRenderer';
import './dossier-portfolio-styles.css';
import './mission-description.css';

interface MissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: CompletedMissionDTO | null;
}

const MissionDetailModal: React.FC<MissionDetailModalProps> = ({ isOpen, onClose, mission }) => {
  if (!mission) return null;

  const formatBudget = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? 'var(--dossier-cyan)' : 'transparent'}
            color={star <= rating ? 'var(--dossier-cyan)' : 'var(--dossier-silver-dark)'}
          />
        ))}
        <span style={{ marginLeft: '4px', color: 'var(--dossier-cyan)', fontSize: '0.85rem', fontWeight: 600 }}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const isPaid = mission.status === 'PAID';
  const cyanOrGreen = isPaid ? 'var(--dossier-green)' : 'var(--dossier-cyan)';
  const cyanOrGreenBorder = isPaid ? 'rgba(16, 185, 129, 0.3)' : 'var(--dossier-cyan-border)';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="dossier-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="dossier-modal-container"
            style={{ maxWidth: '720px', maxHeight: '85vh' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="dossier-modal-header">
              <div>
                <h2 className="dossier-modal-title">{mission.jobTitle}</h2>
                <p className="dossier-modal-subtitle">
                  Nhiệm vụ đã hoàn thành &mdash; #{mission.applicationId}
                </p>
              </div>
              <button className="dossier-modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="dossier-modal-body">
              {/* Recruiter + Status Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {mission.recruiterAvatar ? (
                    <img
                      src={mission.recruiterAvatar}
                      alt={mission.recruiterName}
                      style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${cyanOrGreenBorder}`, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${isPaid ? '#059669' : 'var(--dossier-cyan-dark)'}, ${isPaid ? 'var(--dossier-green)' : 'var(--dossier-cyan)'})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#000', fontWeight: 700, fontSize: '1.1rem'
                    }}>
                      {mission.recruiterName?.[0] || 'R'}
                    </div>
                  )}
                  <div>
                    <p style={{ color: 'var(--dossier-silver)', fontWeight: 600, margin: 0 }}>{mission.recruiterName}</p>
                    {mission.recruiterCompanyName && (
                      <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.8rem', margin: 0 }}>{mission.recruiterCompanyName}</p>
                    )}
                  </div>
                </div>
                <span style={{
                  padding: '0.3rem 0.8rem',
                  background: `linear-gradient(135deg, ${isPaid ? '#059669' : 'var(--dossier-cyan-dark)'}, ${isPaid ? 'var(--dossier-green)' : 'var(--dossier-cyan)'})`,
                  color: '#000',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="dossier-missions-led-dot"></span>
                  {isPaid ? 'ĐÃ THANH TOÁN' : 'HOÀN THÀNH'}
                </span>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {[
                  { icon: DollarSign, label: 'Thu nhập', value: mission.budget ? formatBudget(mission.budget) : 'N/A', color: cyanOrGreen },
                  { icon: Calendar, label: 'Ngày hoàn thành', value: mission.completedAt ? new Date(mission.completedAt).toLocaleDateString('vi-VN') : 'N/A', color: 'var(--dossier-silver)' },
                  { icon: Clock, label: 'Thời hạn ước tính', value: mission.estimatedDuration || 'N/A', color: 'var(--dossier-silver)' },
                  { icon: mission.isRemote ? Zap : MapPin, label: 'Hình thức', value: mission.isRemote ? 'Remote' : (mission.location || 'N/A'), color: 'var(--dossier-silver)' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${cyanOrGreenBorder}`,
                    padding: '0.85rem',
                    textAlign: 'center'
                  }}>
                    <Icon size={16} color={color} style={{ marginBottom: '0.3rem' }} />
                    <p style={{ color, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.25rem 0' }}>{label}</p>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Job Description — rendered as Markdown */}
              {mission.jobDescription && (
                <div className="dossier-form-section">
                  <h3 className="dossier-form-section-title">Mô tả công việc</h3>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.04)',
                    border: '1px solid var(--dossier-cyan-border)',
                    padding: '1rem',
                    borderRadius: '4px'
                  }}>
                    <MarkdownRenderer content={mission.jobDescription} className="mission-md" />
                  </div>
                </div>
              )}

              {/* Work Note */}
              {mission.workNote && (
                <div className="dossier-form-section">
                  <h3 className="dossier-form-section-title">
                    <MessageSquare size={14} style={{ marginRight: '0.5rem', display: 'inline' }} />
                    Ghi chú bàn giao
                  </h3>
                  <p style={{ color: 'var(--dossier-silver)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {mission.workNote}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              {mission.requiredSkills && mission.requiredSkills.length > 0 && (
                <div className="dossier-form-section">
                  <h3 className="dossier-form-section-title">Kỹ năng yêu cầu</h3>
                  <div className="dossier-module-tags">
                    {mission.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="dossier-module-tag" style={{ borderColor: cyanOrGreenBorder, color: cyanOrGreen }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              {mission.rating && (
                <div className="dossier-form-section">
                  <h3 className="dossier-form-section-title">
                    <Star size={14} style={{ marginRight: '0.5rem', display: 'inline' }} />
                    Đánh giá từ Nhà tuyển dụng
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    {renderStars(mission.rating)}
                  </div>

                  {/* Rating breakdown */}
                  {(mission.communicationRating || mission.qualityRating || mission.timelinessRating || mission.professionalismRating) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      {[
                        { label: 'Giao tiếp', value: mission.communicationRating },
                        { label: 'Chất lượng', value: mission.qualityRating },
                        { label: 'Đúng hạn', value: mission.timelinessRating },
                        { label: 'Chuyên nghiệp', value: mission.professionalismRating },
                      ].filter(item => item.value).map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(15, 23, 42, 0.4)', border: `1px solid ${cyanOrGreenBorder}` }}>
                          <span style={{ color: 'var(--dossier-silver)', fontSize: '0.8rem' }}>{label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={10} fill={s <= (value || 0) ? cyanOrGreen : 'transparent'}
                                color={s <= (value || 0) ? cyanOrGreen : 'var(--dossier-silver-dark)'} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mission.reviewComment && (
                    <div style={{
                      background: 'rgba(20, 184, 166, 0.05)',
                      border: '1px solid rgba(20, 184, 166, 0.2)',
                      padding: '1rem',
                      borderRadius: '4px'
                    }}>
                      <p style={{ color: 'var(--dossier-silver)', fontSize: '0.875rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                        &ldquo;{mission.reviewComment}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Deliverables */}
              {mission.deliverables && mission.deliverables.length > 0 && (
                <div className="dossier-form-section" style={{ marginBottom: 0 }}>
                  <h3 className="dossier-form-section-title">
                    <FileText size={14} style={{ marginRight: '0.5rem', display: 'inline' }} />
                    Tài liệu bàn giao ({mission.deliverables.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {mission.deliverables.map((d, idx) => (
                      <a
                        key={idx}
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dossier-entry-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem 0.85rem',
                          background: 'rgba(15, 23, 42, 0.4)',
                          border: `1px solid ${cyanOrGreenBorder}`,
                          color: cyanOrGreen,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = `${cyanOrGreen}15`;
                          (e.currentTarget as HTMLElement).style.borderColor = cyanOrGreen;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(15, 23, 42, 0.4)';
                          (e.currentTarget as HTMLElement).style.borderColor = cyanOrGreenBorder;
                        }}
                      >
                        <FileText size={14} />
                        <span style={{ flex: 1 }}>{d.fileName}</span>
                        {d.type && (
                          <span style={{
                            padding: '0.1rem 0.4rem',
                            background: `${cyanOrGreen}25`,
                            border: `1px solid ${cyanOrGreenBorder}`,
                            fontSize: '0.65rem',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: cyanOrGreen
                          }}>
                            {d.type}
                          </span>
                        )}
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MissionDetailModal;
