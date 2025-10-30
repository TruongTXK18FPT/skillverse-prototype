import React, { useState } from 'react';
import { X, MapPin, Clock, DollarSign, Briefcase, Calendar, Building2 } from 'lucide-react';
import jobService from '../../services/jobService';
import { JobPostingResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './JobDetailsModal.css';

interface JobDetailsModalProps {
  job: JobPostingResponse;
  onClose: () => void;
  onApplySuccess: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onApplySuccess }) => {
  const { showSuccess, showError } = useToast();
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingApplied, setIsCheckingApplied] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Check if current user is the recruiter who owns this job
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  const userRole = localStorage.getItem('userRole');
  const isOwnJob = userRole === 'RECRUITER' && job.recruiterUserId === currentUserId;

  React.useEffect(() => {
    checkIfApplied();
  }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkIfApplied = async () => {
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
    <div className="jdm-modal-overlay" onClick={onClose}>
      <div className="jdm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="jdm-modal-header">
          <div>
            <h2 className="jdm-job-title">{job.title}</h2>
            <div className="jdm-company-info">
              <Building2 size={16} />
              <span>{job.recruiterCompanyName}</span>
            </div>
          </div>
          <button className="jdm-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="jdm-modal-body">
          {/* Job Meta Info */}
          <div className="jdm-job-meta">
            <div className="jdm-meta-item">
              <DollarSign size={18} />
              <div>
                <strong>Ngân Sách</strong>
                <span>{formatBudget(job.minBudget, job.maxBudget)}</span>
              </div>
            </div>
            <div className="jdm-meta-item">
              <Calendar size={18} />
              <div>
                <strong>Hạn Chót</strong>
                <span>{formatDate(job.deadline)}</span>
              </div>
            </div>
            <div className="jdm-meta-item">
              <MapPin size={18} />
              <div>
                <strong>Làm Việc</strong>
                <span>{job.isRemote ? '🌐 Từ Xa' : `📍 ${job.location}`}</span>
              </div>
            </div>
            <div className="jdm-meta-item">
              <Briefcase size={18} />
              <div>
                <strong>Ứng Viên</strong>
                <span>{job.applicantCount} người</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="jdm-section">
            <h3 className="jdm-section-title">Mô Tả Công Việc</h3>
            <p className="jdm-description">{job.description}</p>
          </div>

          {/* Skills */}
          <div className="jdm-section">
            <h3 className="jdm-section-title">Kỹ Năng Yêu Cầu</h3>
            <div className="jdm-skills">
              {job.requiredSkills.map((skill, idx) => (
                <span key={idx} className="jdm-skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Apply Form */}
          {!showApplyForm && (
            <div className="jdm-apply-section">
              {isOwnJob ? (
                <div className="jdm-applied-badge" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#f97316', border: '2px solid rgba(251, 146, 60, 0.3)' }}>
                  📝 Đây là công việc bạn đã đăng
                </div>
              ) : isCheckingApplied ? (
                <button className="jdm-apply-btn" disabled>
                  <Clock size={18} />
                  Đang kiểm tra...
                </button>
              ) : hasApplied ? (
                <div className="jdm-applied-badge">
                  ✅ Bạn đã ứng tuyển cho công việc này
                </div>
              ) : (
                <button
                  className="jdm-apply-btn"
                  onClick={() => setShowApplyForm(true)}
                >
                  🚀 Ứng Tuyển Ngay
                </button>
              )}
            </div>
          )}

          {showApplyForm && !hasApplied && (
            <form onSubmit={handleApply} className="jdm-apply-form">
              <div className="jdm-form-group">
                <label htmlFor="coverLetter">
                  Cover Letter (Tùy chọn)
                  {coverLetter && (
                    <span className="jdm-char-count">
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
                <small className="jdm-helper-text">
                  Viết một lời giới thiệu ngắn gọn để tăng cơ hội được chọn.
                </small>
              </div>

              <div className="jdm-form-actions">
                <button
                  type="button"
                  className="jdm-btn-secondary"
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
                  className="jdm-btn-primary"
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
