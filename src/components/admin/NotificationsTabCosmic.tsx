import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Send, Users, UserCheck, Building2, Shield,
  Bell, AlertTriangle, Megaphone, Wrench, Eye,
  RefreshCw, X, CheckCircle, XCircle, Clock, FileText,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft,
  AlignCenter, AlignRight, Type, Palette, Link, ImagePlus, Loader2, Trash2
} from 'lucide-react';
import { 
  adminEmailService, 
  TargetRole, 
  EmailType, 
  EmailNotificationRequest, 
  EmailSendingReport, 
  PreviewRecipientsResponse, 
  EmailStatistics 
} from '../../services/adminEmailService';
import { uploadImage, validateImage, UploadProgress } from '../../services/fileUploadService';
import './NotificationsTabCosmic.css';

interface UploadedImage {
  id: number;
  url: string;
  filename: string;
}

const NotificationsTabCosmic: React.FC = () => {
  // Form state
  const [targetRole, setTargetRole] = useState<TargetRole>(TargetRole.ALL);
  const [emailType, setEmailType] = useState<EmailType>(EmailType.ANNOUNCEMENT);
  const [subject, setSubject] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Data state
  const [previewData, setPreviewData] = useState<PreviewRecipientsResponse | null>(null);
  const [statistics, setStatistics] = useState<EmailStatistics | null>(null);
  
  // UI state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingReport, setSendingReport] = useState<EmailSendingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rich text editor commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const formatBold = () => execCommand('bold');
  const formatItalic = () => execCommand('italic');
  const formatUnderline = () => execCommand('underline');
  const formatStrikethrough = () => execCommand('strikeThrough');
  const formatUnorderedList = () => execCommand('insertUnorderedList');
  const formatOrderedList = () => execCommand('insertOrderedList');
  const formatAlignLeft = () => execCommand('justifyLeft');
  const formatAlignCenter = () => execCommand('justifyCenter');
  const formatAlignRight = () => execCommand('justifyRight');
  const formatFontSize = (size: string) => {
    execCommand('fontSize', size);
    setShowFontSizePicker(false);
  };
  const formatTextColor = (color: string) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const insertLink = () => {
    const url = prompt('Nhập URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const getEditorContent = (): string => {
    return editorRef.current?.innerHTML || '';
  };

  // Image upload handlers
  const handleImageUpload = async (file: File) => {
    const validation = validateImage(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'File không hợp lệ');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const result = await uploadImage(
        file, 
        undefined, // actorId is optional for admin
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
        }
      );

      const newImage: UploadedImage = {
        id: result.id,
        url: result.url,
        filename: result.fileName
      };

      setUploadedImages(prev => [...prev, newImage]);
      
      // Insert image into editor
      if (editorRef.current) {
        const imgHtml = `<img src="${result.url}" alt="${result.fileName}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`;
        execCommand('insertHTML', imgHtml);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.message || 'Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await adminEmailService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (targetRole) {
      loadPreview();
    }
  }, [targetRole, loadPreview]);

  const handleSendEmail = async () => {
    const htmlContent = getEditorContent();
    
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
      setShowReportModal(true);

      if (report.status === 'COMPLETED' || report.status === 'PARTIAL_FAILURE') {
        setSubject('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        setIsUrgent(false);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Gửi email thất bại! Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const getEmailTypeIcon = (type: EmailType) => {
    switch (type) {
      case EmailType.ANNOUNCEMENT: return <Megaphone size={18} />;
      case EmailType.PROMOTIONAL: return <Bell size={18} />;
      case EmailType.UPDATE: return <RefreshCw size={18} />;
      case EmailType.MAINTENANCE: return <Wrench size={18} />;
      default: return <Mail size={18} />;
    }
  };

  const getRoleIcon = (role: TargetRole) => {
    switch (role) {
      case TargetRole.USER: return <Users size={18} />;
      case TargetRole.MENTOR: return <UserCheck size={18} />;
      case TargetRole.RECRUITER: return <Building2 size={18} />;
      case TargetRole.ADMIN: return <Shield size={18} />;
      default: return <Users size={18} />;
    }
  };

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#ec4899', '#f43f5e', '#ffffff', '#000000', '#64748b'
  ];

  const fontSizes = [
    { label: 'Nhỏ', value: '2' },
    { label: 'Bình thường', value: '3' },
    { label: 'Vừa', value: '4' },
    { label: 'Lớn', value: '5' },
    { label: 'Rất lớn', value: '6' },
    { label: 'Tiêu đề', value: '7' }
  ];

  if (loading) {
    return (
      <div className="notif-cosmic">
        <div className="notif-loading">
          <RefreshCw size={48} className="spinning" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notif-cosmic">
      {/* Header Section - Purple/Violet */}
      <div className="notif-section notif-section-header">
        <div className="notif-header">
          <div className="notif-header-left">
            <Mail size={32} className="notif-header-icon" />
            <div>
              <h2>Gửi Email Hàng Loạt</h2>
              <p>Gửi thông báo, khuyến mãi đến người dùng theo nhóm</p>
            </div>
          </div>
          <button className="notif-refresh-btn" onClick={loadStatistics} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Section - Multi-color vibrant cards */}
      {statistics && (
        <div className="notif-section notif-section-stats">
          <div className="notif-stats-grid">
            <div className="notif-stat-card vibrant-purple">
              <div className="notif-stat-glow"></div>
              <div className="notif-stat-icon"><Users size={28} /></div>
              <div className="notif-stat-content">
                <div className="notif-stat-value">{statistics.totalUsers}</div>
                <div className="notif-stat-label">Tổng Users</div>
              </div>
            </div>
            <div className="notif-stat-card vibrant-green">
              <div className="notif-stat-glow"></div>
              <div className="notif-stat-icon"><Users size={28} /></div>
              <div className="notif-stat-content">
                <div className="notif-stat-value">{statistics.userCount}</div>
                <div className="notif-stat-label">Học Viên</div>
              </div>
            </div>
            <div className="notif-stat-card vibrant-blue">
              <div className="notif-stat-glow"></div>
              <div className="notif-stat-icon"><UserCheck size={28} /></div>
              <div className="notif-stat-content">
                <div className="notif-stat-value">{statistics.mentorCount}</div>
                <div className="notif-stat-label">Mentor</div>
              </div>
            </div>
            <div className="notif-stat-card vibrant-orange">
              <div className="notif-stat-glow"></div>
              <div className="notif-stat-icon"><Building2 size={28} /></div>
              <div className="notif-stat-content">
                <div className="notif-stat-value">{statistics.recruiterCount}</div>
                <div className="notif-stat-label">Doanh Nghiệp</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Form Section - Cyan/Teal */}
      <div className="notif-section notif-section-form">
        <div className="notif-form-container">
          <div className="notif-form-header">
            <FileText size={20} />
            <h3>Soạn Email Mới</h3>
          </div>

          <div className="notif-form-body">
            {/* Subject */}
            <div className="notif-form-group">
              <label>Tiêu đề email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Khuyến mãi đặc biệt cho Mentor"
                disabled={isSending}
              />
            </div>

            {/* Rich Text Editor */}
            <div className="notif-form-group">
              <label>Nội dung email</label>
              
              {/* Toolbar */}
              <div className="notif-editor-toolbar">
                <div className="notif-toolbar-group">
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatBold}
                    title="In đậm (Ctrl+B)"
                  >
                    <Bold size={16} />
                  </button>
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatItalic}
                    title="In nghiêng (Ctrl+I)"
                  >
                    <Italic size={16} />
                  </button>
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatUnderline}
                    title="Gạch chân (Ctrl+U)"
                  >
                    <Underline size={16} />
                  </button>
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatStrikethrough}
                    title="Gạch ngang"
                  >
                    <Type size={16} style={{ textDecoration: 'line-through' }} />
                  </button>
                </div>

                <div className="notif-toolbar-divider"></div>

                <div className="notif-toolbar-group">
                  <div className="notif-toolbar-dropdown">
                    <button 
                      className="notif-toolbar-btn"
                      onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                      title="Cỡ chữ"
                    >
                      <Type size={16} />
                      <span className="notif-btn-label">Cỡ chữ</span>
                    </button>
                    {showFontSizePicker && (
                      <div className="notif-dropdown-menu">
                        {fontSizes.map((size) => (
                          <button 
                            key={size.value}
                            className="notif-dropdown-item"
                            onClick={() => formatFontSize(size.value)}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="notif-toolbar-dropdown">
                    <button 
                      className="notif-toolbar-btn"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      title="Màu chữ"
                    >
                      <Palette size={16} />
                      <span className="notif-btn-label">Màu</span>
                    </button>
                    {showColorPicker && (
                      <div className="notif-color-picker">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className="notif-color-btn"
                            style={{ backgroundColor: color }}
                            onClick={() => formatTextColor(color)}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="notif-toolbar-divider"></div>

                <div className="notif-toolbar-group">
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatUnorderedList}
                    title="Danh sách"
                  >
                    <List size={16} />
                  </button>
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatOrderedList}
                    title="Danh sách số"
                  >
                    <ListOrdered size={16} />
                  </button>
                </div>

                <div className="notif-toolbar-divider"></div>

                <div className="notif-toolbar-group">
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatAlignLeft}
                    title="Căn trái"
                  >
                    <AlignLeft size={16} />
                  </button>
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatAlignCenter}
                    title="Căn giữa"
                  >
                    <AlignCenter size={16} />
                  </button>
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={formatAlignRight}
                    title="Căn phải"
                  >
                    <AlignRight size={16} />
                  </button>
                </div>

                <div className="notif-toolbar-divider"></div>

                <div className="notif-toolbar-group">
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={insertLink}
                    title="Chèn liên kết"
                  >
                    <Link size={16} />
                  </button>
                  <button 
                    className="notif-toolbar-btn" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Chèn hình ảnh"
                    disabled={isUploading}
                  >
                    <ImagePlus size={16} />
                  </button>
                </div>
              </div>

              {/* Editor Area */}
              <div
                ref={editorRef}
                className="notif-rich-editor"
                contentEditable={!isSending}
                data-placeholder="Nhập nội dung email của bạn tại đây..."
                onFocus={() => {
                  setShowColorPicker(false);
                  setShowFontSizePicker(false);
                }}
              />
            </div>

            {/* Image Upload Section */}
            <div className="notif-form-group notif-image-upload">
              <label>Thêm hình ảnh (Cloudinary)</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={isSending || isUploading}
              />
              <div 
                className={`notif-image-upload-area ${isDragging ? 'dragging' : ''}`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <>
                    <div className="notif-upload-icon">
                      <Loader2 size={32} className="spinning" />
                    </div>
                    <div className="notif-upload-text">
                      <p>Đang upload... {uploadProgress}%</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="notif-upload-icon">
                      <ImagePlus size={32} />
                    </div>
                    <div className="notif-upload-text">
                      <p>Kéo thả ảnh vào đây hoặc click để chọn</p>
                      <span>Hỗ trợ: JPG, PNG, GIF, WebP (Tối đa 10MB)</span>
                    </div>
                  </>
                )}
              </div>
              
              {uploadError && (
                <div className="notif-upload-error" style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {uploadError}
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="notif-image-preview">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="notif-preview-item">
                      <img src={img.url} alt={img.filename} />
                      <button 
                        className="notif-preview-remove"
                        onClick={() => removeImage(index)}
                        title="Xóa ảnh"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Target Role & Email Type */}
            <div className="notif-form-row">
              <div className="notif-form-group">
                <label>Gửi đến</label>
                <div className="notif-select-wrapper">
                  {getRoleIcon(targetRole)}
                  <select 
                    value={targetRole} 
                    onChange={(e) => setTargetRole(e.target.value as TargetRole)}
                    disabled={isSending}
                  >
                    <option value={TargetRole.ALL}>Tất cả ({statistics?.totalUsers || 0})</option>
                    <option value={TargetRole.USER}>Học viên ({statistics?.userCount || 0})</option>
                    <option value={TargetRole.MENTOR}>Mentor ({statistics?.mentorCount || 0})</option>
                    <option value={TargetRole.RECRUITER}>Doanh nghiệp ({statistics?.recruiterCount || 0})</option>
                    <option value={TargetRole.ADMIN}>Admin ({statistics?.adminCount || 0})</option>
                  </select>
                </div>
              </div>

              <div className="notif-form-group">
                <label>Loại email</label>
                <div className="notif-select-wrapper">
                  {getEmailTypeIcon(emailType)}
                  <select 
                    value={emailType} 
                    onChange={(e) => setEmailType(e.target.value as EmailType)}
                    disabled={isSending}
                  >
                    <option value={EmailType.ANNOUNCEMENT}>Thông báo</option>
                    <option value={EmailType.PROMOTIONAL}>Khuyến mãi</option>
                    <option value={EmailType.UPDATE}>Cập nhật</option>
                    <option value={EmailType.MAINTENANCE}>Bảo trì</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Urgent Checkbox */}
            <div className="notif-form-group">
              <label className="notif-checkbox-label">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  disabled={isSending}
                />
                <AlertTriangle size={16} />
                <span>Đánh dấu là khẩn cấp</span>
              </label>
            </div>

            {/* Actions */}
            <div className="notif-form-actions">
              <button
                className="notif-action-btn preview"
                onClick={() => setShowPreviewModal(true)}
                disabled={isSending}
              >
                <Eye size={18} />
                Xem người nhận ({previewData?.totalCount || 0})
              </button>
              <button
                className="notif-action-btn send"
                onClick={handleSendEmail}
                disabled={isSending || !subject.trim()}
              >
                {isSending ? (
                  <>
                    <Clock size={18} className="spinning" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Gửi ngay
                  </>
                )}
              </button>
            </div>

            {/* Sending Progress */}
            {isSending && (
              <div className="notif-sending-progress">
                <Clock size={20} className="spinning" />
                <div>
                  <p>Đang gửi email...</p>
                  <span>Hệ thống đang xử lý theo batch (50 emails/lần)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="notif-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <h3>Danh Sách Người Nhận</h3>
              <button className="notif-close-btn" onClick={() => setShowPreviewModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="notif-modal-body">
              <div className="notif-preview-stats">
                <div className="notif-preview-stat">
                  <Users size={20} />
                  <span>Tổng số: <strong>{previewData.totalCount}</strong></span>
                </div>
                <div className="notif-preview-stat">
                  {getRoleIcon(targetRole)}
                  <span>Nhóm: <strong>{previewData.targetRole}</strong></span>
                </div>
              </div>
              
              <div className="notif-email-list">
                <h4>Email mẫu (10 đầu tiên)</h4>
                <ul>
                  {previewData.sampleEmails.map((email, index) => (
                    <li key={index}>
                      <Mail size={14} />
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="notif-modal-footer">
              <button className="notif-modal-btn close" onClick={() => setShowPreviewModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && sendingReport && (
        <div className="notif-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <h3>Báo Cáo Gửi Email</h3>
              <button className="notif-close-btn" onClick={() => setShowReportModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="notif-modal-body">
              <div className={`notif-report-status ${sendingReport.status.toLowerCase()}`}>
                {sendingReport.status === 'COMPLETED' ? (
                  <CheckCircle size={24} />
                ) : sendingReport.status === 'PARTIAL_FAILURE' ? (
                  <AlertTriangle size={24} />
                ) : (
                  <XCircle size={24} />
                )}
                <span>{sendingReport.status}</span>
              </div>

              <div className="notif-report-grid">
                <div className="notif-report-item">
                  <label>Tổng số</label>
                  <span>{sendingReport.totalRecipients}</span>
                </div>
                <div className="notif-report-item success">
                  <label>Thành công</label>
                  <span>{sendingReport.successCount}</span>
                </div>
                <div className="notif-report-item failed">
                  <label>Thất bại</label>
                  <span>{sendingReport.failedCount}</span>
                </div>
                <div className="notif-report-item">
                  <label>Tỷ lệ</label>
                  <span>{sendingReport.successRate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="notif-report-time">
                <Clock size={16} />
                <span>{new Date(sendingReport.sentAt).toLocaleString('vi-VN')}</span>
              </div>

              {sendingReport.failedEmails.length > 0 && (
                <div className="notif-failed-list">
                  <h4>Emails thất bại</h4>
                  <ul>
                    {sendingReport.failedEmails.map((email, index) => (
                      <li key={index}>
                        <XCircle size={14} />
                        {email}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="notif-modal-footer">
              <button className="notif-modal-btn close" onClick={() => setShowReportModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsTabCosmic;
