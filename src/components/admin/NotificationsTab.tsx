import React, { useState, useEffect, useCallback } from 'react';
import { adminEmailService, TargetRole, EmailType, EmailNotificationRequest, EmailSendingReport, PreviewRecipientsResponse, EmailStatistics } from '../../services/adminEmailService';
import './NotificationsTab.css';

const NotificationsTab: React.FC = () => {
  const [targetRole, setTargetRole] = useState<TargetRole>(TargetRole.ALL);
  const [emailType, setEmailType] = useState<EmailType>(EmailType.ANNOUNCEMENT);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Editor mode: 'text' or 'html'
  const [editorMode, setEditorMode] = useState<'text' | 'html'>('text');
  const [textContent, setTextContent] = useState('');
  
  // Preview and statistics
  const [previewData, setPreviewData] = useState<PreviewRecipientsResponse | null>(null);
  const [statistics, setStatistics] = useState<EmailStatistics | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [sendingReport, setSendingReport] = useState<EmailSendingReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  
  // Convert plain text to HTML
  const convertTextToHtml = (text: string): string => {
    if (!text.trim()) return '';
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    let html = '';
    paragraphs.forEach(para => {
      const trimmed = para.trim();
      
      // Check if it's a heading (starts with #)
      if (trimmed.startsWith('# ')) {
        html += `<h1>${trimmed.substring(2)}</h1>\n`;
      } else if (trimmed.startsWith('## ')) {
        html += `<h2>${trimmed.substring(3)}</h2>\n`;
      } else if (trimmed.startsWith('### ')) {
        html += `<h3>${trimmed.substring(4)}</h3>\n`;
      } else {
        // Regular paragraph - preserve single line breaks as <br>
        const withBreaks = trimmed.replace(/\n/g, '<br>');
        html += `<p>${withBreaks}</p>\n`;
      }
    });
    
    return html;
  };
  
  // Handle text content change
  const handleTextContentChange = (text: string) => {
    setTextContent(text);
    // Auto-convert to HTML
    const html = convertTextToHtml(text);
    setHtmlContent(html);
  };
  
  // Handle editor mode toggle
  const handleEditorModeChange = (mode: 'text' | 'html') => {
    setEditorMode(mode);
    if (mode === 'text' && htmlContent && !textContent) {
      // When switching to text mode, try to preserve content
      // (simple HTML to text conversion)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      setTextContent(tempDiv.textContent || '');
    }
  };
  
  const loadStatistics = async () => {
    try {
      const stats = await adminEmailService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };
  
  const loadPreview = useCallback(async () => {
    try {
      const preview = await adminEmailService.previewRecipients(targetRole);
      setPreviewData(preview);
    } catch (error) {
      console.error('Failed to load preview:', error);
    }
  }, [targetRole]);
  
  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, []);
  
  // Load preview when role changes
  useEffect(() => {
    if (targetRole) {
      loadPreview();
    }
  }, [targetRole, loadPreview]);
  
  const handlePreviewRecipients = () => {
    setShowPreview(true);
  };
  
  const handleSendEmail = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung email!');
      return;
    }
    
    const confirmed = window.confirm(
      `Bạn có chắc muốn gửi email đến ${previewData?.totalCount || 0} người dùng?`
    );
    
    if (!confirmed) return;
    
    setIsSending(true);
    setSendingReport(null);
    
    try {
      const request: EmailNotificationRequest = {
        subject,
        htmlContent,
        targetRole,
        emailType,
        isUrgent
      };
      
      const report = await adminEmailService.sendBulkEmail(request);
      setSendingReport(report);
      setShowReport(true);
      
      // Reset form on success
      if (report.status === 'COMPLETED' || report.status === 'PARTIAL_FAILURE') {
        setSubject('');
        setHtmlContent('');
        setTextContent('');
        setIsUrgent(false);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Gửi email thất bại! Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="administrator-notifications">
      <div className="administrator-notifications-header">
        <h2>📧 Gửi Email Hàng Loạt</h2>
        <p>Gửi email HTML đến người dùng theo role với batch processing tự động</p>
        {statistics && (
          <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '14px' }}>
            <span>👥 Tổng: <strong>{statistics.totalUsers}</strong></span>
            <span>👤 User: <strong>{statistics.userCount}</strong></span>
            <span>🎓 Mentor: <strong>{statistics.mentorCount}</strong></span>
            <span>💼 Recruiter: <strong>{statistics.recruiterCount}</strong></span>
            <span>⚙️ Admin: <strong>{statistics.adminCount}</strong></span>
          </div>
        )}
      </div>
      
      <div className="administrator-notifications-form">
        <h3>✉️ Soạn Email Mới</h3>
        
        <div className="administrator-notifications-form-group">
          <label>Tiêu đề email:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ví dụ: Khuyến mãi đặc biệt cho Mentor"
            disabled={isSending}
          />
        </div>

        <div className="administrator-notifications-form-group">
          <label>
            Nội dung email:
            <div style={{ float: 'right', display: 'flex', gap: '10px', fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => handleEditorModeChange('text')}
                style={{
                  padding: '4px 12px',
                  background: editorMode === 'text' ? '#667eea' : '#e2e8f0',
                  color: editorMode === 'text' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: editorMode === 'text' ? '600' : '400'
                }}
                disabled={isSending}
              >
                📝 Text (Tự động)
              </button>
              <button
                type="button"
                onClick={() => handleEditorModeChange('html')}
                style={{
                  padding: '4px 12px',
                  background: editorMode === 'html' ? '#667eea' : '#e2e8f0',
                  color: editorMode === 'html' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: editorMode === 'html' ? '600' : '400'
                }}
                disabled={isSending}
              >
                💻 HTML (Thủ công)
              </button>
            </div>
          </label>
          
          {editorMode === 'text' ? (
            <>
              <textarea
                value={textContent}
                onChange={(e) => handleTextContentChange(e.target.value)}
                placeholder="Nhập nội dung bình thường, hệ thống sẽ tự động chuyển sang HTML.&#10;&#10;Hướng dẫn:&#10;- Dòng trống để tạo đoạn mới&#10;- # Tiêu đề lớn&#10;- ## Tiêu đề vừa&#10;- ### Tiêu đề nhỏ"
                rows={8}
                disabled={isSending}
              />
              <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '4px', fontSize: '12px', color: '#0369a1' }}>
                💡 <strong>Preview HTML:</strong> {htmlContent ? `${htmlContent.length} ký tự HTML` : 'Chưa có nội dung'}
              </div>
            </>
          ) : (
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Nhập HTML thuần... Ví dụ: <h1>Chào mừng!</h1><p>Nội dung email...</p>"
              rows={8}
              disabled={isSending}
            />
          )}
        </div>

        <div className="administrator-notifications-form-group">
          <label>Gửi đến:</label>
          <select value={targetRole} onChange={(e) => setTargetRole(e.target.value as TargetRole)} disabled={isSending}>
            <option value={TargetRole.ALL}>Tất cả người dùng ({statistics?.totalUsers || 0})</option>
            <option value={TargetRole.USER}>Chỉ Users/Students ({statistics?.userCount || 0})</option>
            <option value={TargetRole.MENTOR}>Chỉ Mentors ({statistics?.mentorCount || 0})</option>
            <option value={TargetRole.RECRUITER}>Chỉ Recruiters ({statistics?.recruiterCount || 0})</option>
            <option value={TargetRole.ADMIN}>Chỉ Admins ({statistics?.adminCount || 0})</option>
          </select>
        </div>

        <div className="administrator-notifications-form-group">
          <label>Loại email:</label>
          <select value={emailType} onChange={(e) => setEmailType(e.target.value as EmailType)} disabled={isSending}>
            <option value={EmailType.ANNOUNCEMENT}>Thông báo</option>
            <option value={EmailType.PROMOTIONAL}>Khuyến mãi</option>
            <option value={EmailType.UPDATE}>Cập nhật tính năng</option>
            <option value={EmailType.MAINTENANCE}>Bảo trì hệ thống</option>
          </select>
        </div>

        <div className="administrator-notifications-form-group">
          <label>
            <input 
              type="checkbox" 
              checked={isUrgent} 
              onChange={(e) => setIsUrgent(e.target.checked)}
              disabled={isSending}
            />
            <span style={{ marginLeft: '8px' }}>Đánh dấu là khẩn cấp</span>
          </label>
        </div>

        <div className="administrator-notifications-actions">
          <button 
            className="administrator-notifications-btn preview"
            onClick={handlePreviewRecipients}
            disabled={isSending}
          >
            👀 Xem người nhận ({previewData?.totalCount || 0})
          </button>
          <button 
            className="administrator-notifications-btn send" 
            onClick={handleSendEmail}
            disabled={isSending || !subject.trim() || !htmlContent.trim()}
          >
            {isSending ? '⏳ Đang gửi...' : '📨 Gửi ngay'}
          </button>
        </div>
        
        {isSending && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#0369a1' }}>⏳ Đang gửi email... Vui lòng đợi...</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#64748b' }}>
              Hệ thống đang xử lý theo batch (50 emails/lần) để tránh overload server.
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="administrator-notifications-modal" onClick={() => setShowPreview(false)}>
          <div className="administrator-notifications-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>👥 Danh Sách Người Nhận</h3>
            <p><strong>Tổng số:</strong> {previewData.totalCount} người</p>
            <p><strong>Role:</strong> {previewData.targetRole}</p>
            <div style={{ marginTop: '15px' }}>
              <strong>Email mẫu (10 đầu tiên):</strong>
              <ul style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
                {previewData.sampleEmails.map((email, index) => (
                  <li key={index}>{email}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => setShowPreview(false)} style={{ marginTop: '20px' }}>Đóng</button>
          </div>
        </div>
      )}
      
      {/* Sending Report Modal */}
      {showReport && sendingReport && (
        <div className="administrator-notifications-modal" onClick={() => setShowReport(false)}>
          <div className="administrator-notifications-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📊 Báo Cáo Gửi Email</h3>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Trạng thái:</strong> <span style={{ 
                color: sendingReport.status === 'COMPLETED' ? '#10b981' : 
                       sendingReport.status === 'PARTIAL_FAILURE' ? '#f59e0b' : '#ef4444'
              }}>{sendingReport.status}</span></p>
              <p><strong>Tổng số:</strong> {sendingReport.totalRecipients} emails</p>
              <p><strong>Thành công:</strong> <span style={{ color: '#10b981' }}>{sendingReport.successCount}</span></p>
              <p><strong>Thất bại:</strong> <span style={{ color: '#ef4444' }}>{sendingReport.failedCount}</span></p>
              <p><strong>Tỷ lệ thành công:</strong> {sendingReport.successRate.toFixed(2)}%</p>
              <p><strong>Thời gian:</strong> {new Date(sendingReport.sentAt).toLocaleString('vi-VN')}</p>
              
              {sendingReport.failedEmails.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Emails thất bại:</strong>
                  <ul style={{ marginTop: '10px', maxHeight: '150px', overflow: 'auto', color: '#ef4444' }}>
                    {sendingReport.failedEmails.map((email, index) => (
                      <li key={index}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button onClick={() => setShowReport(false)} style={{ marginTop: '20px' }}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
