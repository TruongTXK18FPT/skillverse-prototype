import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  History,
  ArrowLeft,
  Award,
  Calendar,
  Info,
  Target,
  CheckSquare,
  Save,
  Eye,
  AlertTriangle
} from 'lucide-react';
import {
  AssignmentDetailDTO,
  AssignmentSubmissionDetailDTO,
  AssignmentSubmissionCreateDTO,
  SubmissionType,
  SubmissionStatus
} from '../../data/assignmentDTOs';
import {
  getAssignmentById,
  submitAssignment,
  getMySubmissions
} from '../../services/assignmentService';
import { uploadMedia } from '../../services/mediaService';
import { useAuth } from '../../context/AuthContext';
import './AssignmentPage.css';

const AssignmentPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [submissionText, setSubmissionText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load draft from localStorage
  useEffect(() => {
    if (assignmentId && user?.id) {
      const draftKey = `assignment_draft_${assignmentId}_${user.id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setSubmissionText(draft.text || '');
          setLinkUrl(draft.link || '');
          setDraftSaved(true);
        } catch (e) {
          console.error('Failed to load draft:', e);
        }
      }
    }
  }, [assignmentId, user?.id]);

  // Auto-save draft
  useEffect(() => {
    if (!assignmentId || !user?.id) return;
    
    const draftKey = `assignment_draft_${assignmentId}_${user.id}`;
    const timeoutId = setTimeout(() => {
      if (submissionText || linkUrl) {
        localStorage.setItem(draftKey, JSON.stringify({
          text: submissionText,
          link: linkUrl,
          savedAt: new Date().toISOString()
        }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [submissionText, linkUrl, assignmentId, user?.id]);

  useEffect(() => {
    loadData();
  }, [assignmentId, user?.id]);

  const loadData = async () => {
    if (!assignmentId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, submissionsData] = await Promise.all([
        getAssignmentById(parseInt(assignmentId)),
        getMySubmissions(parseInt(assignmentId))
      ]);
      setAssignment(assignmentData);
      setSubmissions(submissionsData);
      
      console.log('📝 Assignment loaded:', assignmentData);
      console.log('📋 Submissions:', submissionsData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true); // Show confirmation first
  };

  const confirmSubmit = async () => {
    if (!assignment || !user?.id) return;

    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const submissionData: AssignmentSubmissionCreateDTO = {};

      if (assignment.submissionType === SubmissionType.TEXT) {
        if (!submissionText.trim()) {
          setError('Please enter your submission text');
          setSubmitting(false);
          return;
        }
        submissionData.submissionText = submissionText;
      } else if (assignment.submissionType === SubmissionType.LINK) {
        if (!linkUrl.trim()) {
          setError('Please enter a URL');
          setSubmitting(false);
          return;
        }
        if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
          setError('URL must start with http:// or https://');
          setSubmitting(false);
          return;
        }
        submissionData.linkUrl = linkUrl;
      } else if (assignment.submissionType === SubmissionType.FILE) {
        if (!selectedFile) {
          setError('Please select a file to upload');
          setSubmitting(false);
          return;
        }
        setUploadProgress(10);
        const mediaResult = await uploadMedia(selectedFile, user.id);
        setUploadProgress(100);
        submissionData.fileMediaId = mediaResult.id;
      }

      await submitAssignment(parseInt(assignmentId!), submissionData);

      setSuccess('✅ Submission successful!');
      setSubmissionText('');
      setLinkUrl('');
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Clear draft from localStorage
      const draftKey = `assignment_draft_${assignmentId}_${user.id}`;
      localStorage.removeItem(draftKey);
      
      // Reload submissions
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDueDatePassed = assignment?.dueAt && new Date(assignment.dueAt) < new Date();
  const newestSubmission = submissions.find(s => s.isNewest);
  
  // Determine overall status
  const getAssignmentStatus = () => {
    if (!newestSubmission) return { text: 'Chưa nộp', icon: <AlertTriangle size={18} />, color: 'warning' };
    if (newestSubmission.status === SubmissionStatus.GRADED) {
      return { text: 'Đã chấm', icon: <CheckCircle size={18} />, color: 'success' };
    }
    return { text: 'Đã nộp', icon: <Clock size={18} />, color: 'pending' };
  };

  const status = getAssignmentStatus();

  if (loading) {
    return (
      <div className="assignment-page">
        <div className="assignment-loading">
          <div className="loading-spinner"></div>
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="assignment-page">
        <div className="assignment-error">
          <AlertCircle size={48} />
          <h2>Assignment not found</h2>
          <button onClick={() => navigate(-1)} className="btn-back">
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-page">
      {/* Header Navigation */}
      <div className="assignment-nav">
        <button onClick={() => navigate(-1)} className="btn-back-nav">
          <ArrowLeft size={20} />
          <span>Back to Course</span>
        </button>
      </div>

      <div className="assignment-container">
        {/* Left Panel - Assignment Details */}
        <div className="assignment-left-panel">
          {/* Title Section with Status */}
          <div className="assignment-header">
            <div className="header-top">
              <h1>{assignment.title}</h1>
              <div className={`assignment-overall-status status-${status.color}`}>
                {status.icon}
                <span>{status.text}</span>
              </div>
            </div>

            {/* Critical Metadata Cards */}
            <div className="assignment-critical-info">
              <div className={`info-card ${assignment.isRequired !== false ? 'required' : 'optional'}`}>
                <AlertCircle size={16} />
                <div>
                  <strong>{assignment.isRequired !== false ? 'BẮT BUỘC' : 'TÙY CHỌN'}</strong>
                  <p>{assignment.isRequired !== false ? 'Bài tập này là bắt buộc' : 'Bài tập không bắt buộc'}</p>
                </div>
              </div>
              
              <div className="info-card points">
                <Award size={16} />
                <div>
                  <strong>{assignment.maxScore} ĐIỂM</strong>
                  <p>Ảnh hưởng đến điểm tổng kết</p>
                </div>
              </div>
              
              {assignment.dueAt && (
                <div className={`info-card deadline ${isDueDatePassed ? 'overdue' : ''}`}>
                  <Calendar size={16} />
                  <div>
                    <strong>DEADLINE</strong>
                    <p>{formatDate(assignment.dueAt)}</p>
                    {isDueDatePassed && <span className="overdue-label">Đã quá hạn</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Type */}
            <div className="assignment-meta">
              <div className="meta-item">
                {assignment.submissionType === SubmissionType.TEXT && <FileText size={18} />}
                {assignment.submissionType === SubmissionType.LINK && <LinkIcon size={18} />}
                {assignment.submissionType === SubmissionType.FILE && <Upload size={18} />}
                <span>Submission Type: {assignment.submissionType}</span>
              </div>
            </div>
          </div>

          {/* Learning Outcome Section */}
          {assignment.learningOutcome && (
            <div className="learning-outcome-section">
              <div className="section-header">
                <Target size={20} />
                <h2>🎯 Mục tiêu bài tập</h2>
              </div>
              <div className="section-content">
                <p className="outcome-text">{assignment.learningOutcome}</p>
              </div>
            </div>
          )}

          {/* Grading Criteria Section */}
          {assignment.gradingCriteria && (
            <div className="grading-criteria-section">
              <div className="section-header">
                <CheckSquare size={20} />
                <h2>📊 Tiêu chí chấm điểm</h2>
              </div>
              <div className="section-content">
                <div dangerouslySetInnerHTML={{ __html: assignment.gradingCriteria }} />
              </div>
            </div>
          )}

          {/* Instructions/Description */}
          <div className="assignment-instructions">
            <div className="section-header">
              <Info size={20} />
              <h2>📋 Yêu cầu bài tập</h2>
            </div>
            <div className="instructions-content">
              {assignment.description ? (
                <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
              ) : (
                <div className="placeholder-content">
                  <h3>Yêu cầu chính:</h3>
                  <ul>
                    <li>Hoàn thành các task được giao trong bài tập</li>
                    <li>Đảm bảo code sạch và dễ đọc</li>
                  </ul>
                  <h3>Lưu ý:</h3>
                  <ul>
                    <li>Kiểm tra kỹ trước khi nộp</li>
                    <li>Đọc kỹ tiêu chí chấm điểm</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Submission Preview */}
          {newestSubmission && (
            <div className="submission-preview-section">
              <div className="section-header" onClick={() => setShowPreview(!showPreview)}>
                <Eye size={20} />
                <h3>👁️ Xem bài đã nộp</h3>
                <button className="toggle-btn">{showPreview ? '▲' : '▼'}</button>
              </div>
              {showPreview && (
                <div className="preview-content">
                  <div className="preview-meta">
                    <span>Nộp lúc: {formatDate(newestSubmission.submittedAt)}</span>
                    {newestSubmission.score !== undefined && newestSubmission.score !== null && (
                      <span className="preview-score">
                        Điểm: {newestSubmission.score}/{assignment.maxScore}
                      </span>
                    )}
                  </div>
                  <div className="preview-body">
                    {newestSubmission.submissionText && (
                      <div className="submitted-text">{newestSubmission.submissionText}</div>
                    )}
                    {newestSubmission.linkUrl && (
                      <a href={newestSubmission.linkUrl} target="_blank" rel="noopener noreferrer">
                        {newestSubmission.linkUrl}
                      </a>
                    )}
                  </div>
                  {newestSubmission.feedback && (
                    <div className="preview-feedback">
                      <strong>📝 Phản hồi từ mentor:</strong>
                      <p>{newestSubmission.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="submission-history">
              <div className="history-header" onClick={() => setShowHistory(!showHistory)}>
                <h3>
                  <History size={20} />
                  Lịch sử nộp bài ({submissions.length} lần)
                </h3>
                <button className="toggle-btn">
                  {showHistory ? '▲' : '▼'}
                </button>
              </div>
              {showHistory && (
                <div className="history-list">
                  {submissions.map((sub) => (
                    <div key={sub.id} className={`history-item ${sub.isNewest ? 'newest' : ''}`}>
                      <div className="history-item-header">
                        <span className="attempt-number">Lần nộp #{sub.attemptNumber}</span>
                        <span className={`status-badge status-${sub.status?.toLowerCase()}`}>
                          {sub.status}
                        </span>
                        {sub.isNewest && <span className="newest-badge">Mới nhất</span>}
                      </div>
                      <div className="history-item-meta">
                        <span>Nộp lúc: {formatDate(sub.submittedAt)}</span>
                        {sub.score !== undefined && sub.score !== null && (
                          <span className="score">Điểm: {sub.score}/{assignment.maxScore}</span>
                        )}
                      </div>
                      {sub.feedback && (
                        <div className="feedback">
                          <strong>Feedback:</strong> {sub.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Submission Form */}
        <div className="assignment-right-panel">
          <div className="submission-card">
            <h2>Nộp bài tập</h2>

            {/* Current Status */}
            {newestSubmission && (
              <div className={`current-status status-${newestSubmission.status?.toLowerCase()}`}>
                {newestSubmission.status === SubmissionStatus.GRADED ? (
                  <CheckCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
                <div>
                  <strong>Trạng thái: {newestSubmission.status}</strong>
                  {newestSubmission.score !== undefined && newestSubmission.score !== null && (
                    <p>Điểm: {newestSubmission.score}/{assignment.maxScore}</p>
                  )}
                </div>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Draft Saved Indicator */}
            {draftSaved && (
              <div className="draft-indicator">
                <Save size={14} />
                <span>Draft saved</span>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="submission-form">
              {assignment.submissionType === SubmissionType.TEXT && (
                <div className="form-group">
                  <label htmlFor="submission-text">Câu trả lời của bạn</label>
                  <textarea
                    id="submission-text"
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder=""
                    rows={10}
                    disabled={submitting}
                  />
                </div>
              )}

              {assignment.submissionType === SubmissionType.LINK && (
                <div className="form-group">
                  <label htmlFor="link-url">Link bài nộp</label>
                  <input
                    type="url"
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder=""
                    disabled={submitting}
                  />
                </div>
              )}

              {assignment.submissionType === SubmissionType.FILE && (
                <div className="form-group">
                  <label htmlFor="file-upload">Tải file lên</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    {selectedFile && (
                      <div className="file-preview">
                        <FileText size={16} />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="upload-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Reassurance Message - Prominent Position */}
              <div className="reassurance-box">
                <Info size={16} />
                <p>
                  <strong>💡 Bạn có thể nộp lại nhiều lần.</strong><br/>
                  Mentor sẽ chấm bài nộp mới nhất của bạn. Không giới hạn số lần nộp.
                </p>
              </div>

              {isDueDatePassed && (
                <div className="warning-box">
                  <AlertTriangle size={16} />
                  <p>
                    ⚠️ Đã quá deadline. Bài nộp trễ có thể bị trừ điểm.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="btn-submit"
                disabled={submitting || (assignment.submissionType === SubmissionType.TEXT && !submissionText.trim()) ||
                         (assignment.submissionType === SubmissionType.LINK && !linkUrl.trim()) ||
                         (assignment.submissionType === SubmissionType.FILE && !selectedFile)}
              >
                {submitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Nộp bài tập
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} />
              <h3>Xác nhận nộp bài</h3>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn nộp bài tập này không?</p>
              <ul className="modal-checklist">
                <li>✅ Đã kiểm tra kỹ nội dung</li>
                <li>✅ Đã đọc lại yêu cầu bài tập</li>
                <li>✅ Code/tài liệu đã hoàn chỉnh</li>
              </ul>
              <p className="modal-note">
                <Info size={14} />
                Bạn có thể nộp lại sau nếu cần chỉnh sửa.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-confirm" 
                onClick={confirmSubmit}
              >
                <Send size={16} />
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentPage;
