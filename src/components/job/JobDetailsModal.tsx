import React, { useState } from 'react';
import { X, MapPin, Clock, DollarSign, Briefcase, Calendar, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobService from '../../services/jobService';
import { JobPostingResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './JobDetailsModal-odyssey.css';

interface JobDetailsModalProps {
  job: JobPostingResponse;
  onClose: () => void;
  onApplySuccess: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onApplySuccess }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [hasApplied, setHasApplied] = useState(false);

  // Determine modal theme based on salary (same logic as FateCard)
  const getModalTheme = (): 'gold' | 'crimson' | 'blue' => {
    const avgSalary = (job.minBudget + job.maxBudget) / 2;
    
    if (avgSalary > 5000000) return 'crimson'; // Above 5M VND - Red
    if (avgSalary >= 1000000) return 'gold';   // 1M-5M VND - Gold
    return 'blue';                            // Below 1M VND - Blue
  };

  const modalTheme = getModalTheme();
  const [isCheckingApplied, setIsCheckingApplied] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Check if current user is the recruiter who owns this job
  const currentUserId = user?.id || 0;
  const userRole = user?.roles?.[0];
  const isOwnJob = userRole === 'RECRUITER' && job.recruiterUserId === currentUserId;

  React.useEffect(() => {
    checkIfApplied();
  }, [job.id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disable body scroll when modal opens
  React.useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const checkIfApplied = async () => {
    // Don't check if not authenticated
    if (!isAuthenticated) {
      setIsCheckingApplied(false);
      return;
    }
    
    setIsCheckingApplied(true);
    try {
      const applied = await jobService.hasAppliedToJob(job.id);
      setHasApplied(applied);
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setIsCheckingApplied(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOwnJob) {
      showError('Không Được Phép', '⛔ Bạn không thể ứng tuyển vào công việc của chính mình!');
      return;
    }

    if (hasApplied) {
      showError('Đã Ứng Tuyển', 'Bạn đã ứng tuyển cho công việc này rồi');
      return;
    }

    setIsSubmitting(true);

    try {
      await jobService.applyToJob(job.id, {
        coverLetter: coverLetter.trim() || null
      });

      showSuccess('Thành Công', '🎉 Bạn đã ứng tuyển thành công!');
      setHasApplied(true);
      setShowApplyForm(false);
      setCoverLetter('');
      onApplySuccess();
    } catch (error) {
      console.error('Error applying to job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể ứng tuyển. Vui lòng thử lại.';
      
      // Show specific error for recruiter self-apply
      if (errorMessage.includes('own job') || errorMessage.includes('Recruiters cannot')) {
        showError('Không Được Phép', '⛔ Nhà tuyển dụng không thể ứng tuyển vào công việc của chính mình!');
      } else {
        showError('Lỗi Ứng Tuyển', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="jdm-odyssey-modal-overlay" onClick={onClose}>
      <div className={`jdm-odyssey-modal-content jdm-odyssey-modal-content--${modalTheme}`} onClick={(e) => e.stopPropagation()}>
        <div className="jdm-odyssey-modal-header">
          <div>
            <h2 className="jdm-odyssey-job-title">{job.title}</h2>
            <div className="jdm-odyssey-company-info">
              <Building2 size={16} />
              <span>{job.recruiterCompanyName}</span>
            </div>
          </div>
          <button className="jdm-odyssey-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="jdm-odyssey-modal-body">
          {/* Job Meta Info */}
          <div className="jdm-odyssey-job-meta">
            <div className="jdm-odyssey-meta-item">
              <DollarSign size={18} />
              <div>
                <strong>Ngân Sách</strong>
                <span>{formatBudget(job.minBudget, job.maxBudget)}</span>
              </div>
            </div>
            <div className="jdm-odyssey-meta-item">
              <Calendar size={18} />
              <div>
                <strong>Hạn Chót</strong>
                <span>{formatDate(job.deadline)}</span>
              </div>
            </div>
            <div className="jdm-odyssey-meta-item">
              <MapPin size={18} />
              <div>
                <strong>Làm Việc</strong>
                <span>{job.isRemote ? '🌐 Từ Xa' : `📍 ${job.location}`}</span>
              </div>
            </div>
            <div className="jdm-odyssey-meta-item">
              <Briefcase size={18} />
              <div>
                <strong>Ứng Viên</strong>
                <span>{job.applicantCount} người</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="jdm-odyssey-section">
            <h3 className="jdm-odyssey-section-title">Mô Tả Công Việc</h3>
            <p className="jdm-odyssey-description">{job.description}</p>
          </div>

          {/* Skills */}
          <div className="jdm-odyssey-section">
            <h3 className="jdm-odyssey-section-title">Kỹ Năng Yêu Cầu</h3>
            <div className="jdm-odyssey-skills">
              {job.requiredSkills.map((skill, idx) => (
                <span key={idx} className="jdm-odyssey-skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Apply Form */}
          {!showApplyForm && (
            <div className="jdm-odyssey-apply-section">
              {!isAuthenticated ? (
                <button
                  className="jdm-odyssey-apply-btn"
                  onClick={() => navigate('/login')}
                >
                  🔒 Đăng nhập để ứng tuyển
                </button>
              ) : isOwnJob ? (
                <div className="jdm-odyssey-applied-badge" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#f97316', border: '2px solid rgba(251, 146, 60, 0.3)' }}>
                  📝 Đây là công việc bạn đã đăng
                </div>
              ) : isCheckingApplied ? (
                <button className="jdm-odyssey-apply-btn" disabled>
                  <Clock size={18} />
                  Đang kiểm tra...
                </button>
              ) : hasApplied ? (
                <div className="jdm-odyssey-applied-badge">
                  ✅ Bạn đã ứng tuyển cho công việc này
                </div>
              ) : (
                <button
                  className="jdm-odyssey-apply-btn"
                  onClick={() => setShowApplyForm(true)}
                >
                  🚀 Ứng Tuyển Ngay
                </button>
              )}
            </div>
          )}

          {showApplyForm && !hasApplied && (
            <form onSubmit={handleApply} className="jdm-odyssey-apply-form">
              <div className="jdm-odyssey-form-group">
                <label htmlFor="coverLetter">
                  Thư ứng tuyển (Tùy chọn)
                  {coverLetter && (
                    <span className="jdm-odyssey-char-count">
                      {coverLetter.length} ký tự
                    </span>
                  )}
                </label>
                <textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Giới thiệu bản thân và lý do bạn phù hợp với công việc này..."
                  rows={6}
                  maxLength={1000}
                />
                <small className="jdm-odyssey-helper-text">
                  Viết một lời giới thiệu ngắn gọn để tăng cơ hội được chọn.
                </small>
              </div>

              <div className="jdm-odyssey-form-actions">
                <button
                  type="button"
                  className="jdm-odyssey-btn-secondary"
                  onClick={() => {
                    setShowApplyForm(false);
                    setCoverLetter('');
                  }}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="jdm-odyssey-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '⏳ Đang Gửi...' : '✅ Xác Nhận Ứng Tuyển'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
