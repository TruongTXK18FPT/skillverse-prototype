import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle, Send, X, Mail, FileText,
  Plus, Check, Info, Shield, FileStack,
  Upload, Loader, Trash2, Image, Film, FileArchive
} from 'lucide-react';
import violationReportService, {
  CreateViolationReportRequest,
  EvidenceRequest,
  ViolationReportResponse,
  REPORT_TYPES,
  REPORT_SEVERITIES
} from '../../services/violationReportService';
import { uploadImage, UploadProgress } from '../../services/fileUploadService';
import './ReportUserPage.css';

interface ReportUserPageProps {
  reportedUserEmail?: string;
  onClose?: () => void;
  onSuccess?: (report: ViolationReportResponse) => void;
}

interface UploadedFile {
  file: File;
  url?: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

const ReportUserPage: React.FC<ReportUserPageProps> = ({
  reportedUserEmail: initialEmail,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentUserId = user?.id || null;
  
  // Form state
  const [title, setTitle] = useState('');
  const [targetEmail, setTargetEmail] = useState(initialEmail || '');
  const [reportType, setReportType] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdReport, setCreatedReport] = useState<ViolationReportResponse | null>(null);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" không được hỗ trợ. Chỉ chấp nhận: ảnh, video, PDF`);
        continue;
      }
      
      if (file.size > maxSize) {
        setError(`File "${file.name}" quá lớn. Tối đa 10MB`);
        continue;
      }
      
      // Add file to list
      const newFile: UploadedFile = {
        file,
        uploading: true,
        progress: 0
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      // Upload file
      try {
        const result = await uploadImage(
          file,
          currentUserId || undefined,
          (progress: UploadProgress) => {
            setUploadedFiles(prev => prev.map(f => 
              f.file === file ? { ...f, progress: progress.percentage } : f
            ));
          }
        );
        
        setUploadedFiles(prev => prev.map(f => 
          f.file === file ? { ...f, url: result.url, uploading: false } : f
        ));
      } catch (err: any) {
        setUploadedFiles(prev => prev.map(f => 
          f.file === file ? { ...f, uploading: false, error: 'Upload thất bại' } : f
        ));
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={20} />;
    if (file.type.startsWith('video/')) return <Film size={20} />;
    return <FileArchive size={20} />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get evidence type from file
  const getEvidenceType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'SCREENSHOT';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type === 'application/pdf') return 'DOCUMENT';
    return 'OTHER';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUserId) {
      setError('Bạn cần đăng nhập để gửi báo cáo');
      return;
    }

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề báo cáo');
      return;
    }

    if (!targetEmail.trim()) {
      setError('Vui lòng nhập email người dùng cần báo cáo');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setError('Email không hợp lệ');
      return;
    }

    if (!reportType) {
      setError('Vui lòng chọn loại vi phạm');
      return;
    }

    if (description.length < 20) {
      setError('Mô tả phải có ít nhất 20 ký tự');
      return;
    }

    // Check if any file is still uploading
    if (uploadedFiles.some(f => f.uploading)) {
      setError('Vui lòng đợi upload file hoàn tất');
      return;
    }

    setLoading(true);

    try {
      // Build evidences from uploaded files
      const evidences: EvidenceRequest[] = uploadedFiles
        .filter(f => f.url && !f.error)
        .map(f => ({
          evidenceType: getEvidenceType(f.file),
          fileUrl: f.url,
          fileName: f.file.name,
          fileSize: f.file.size,
          mimeType: f.file.type
        }));

      const request: CreateViolationReportRequest = {
        title: title.trim(),
        reportedUserId: 0, // Will be resolved by email on backend
        reportedUserEmail: targetEmail.trim(),
        reportType,
        severity,
        description: description.trim(),
        evidences: evidences.length > 0 ? evidences : undefined
      };

      const response = await violationReportService.createReport(currentUserId, request);
      setCreatedReport(response);
      setSuccess(true);

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      console.error('Error creating report:', err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo';
      if (errMsg.includes('not found') || errMsg.includes('không tìm thấy')) {
        setError('Không tìm thấy người dùng với email này');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Success view
  if (success && createdReport) {
    return (
      <div className="vr-page">
        <div className="vr-success-card">
          <div className="vr-success-icon">
            <Check size={48} />
          </div>
          <h2>Báo Cáo Đã Gửi Thành Công!</h2>
          <p>Cảm ơn bạn đã báo cáo. Đội ngũ quản trị sẽ xem xét và phản hồi sớm nhất.</p>
          
          <div className="vr-tracking-code">
            <span className="vr-label">Mã theo dõi:</span>
            <span className="vr-code">{createdReport.reportCode}</span>
          </div>
          
          <p className="vr-note">
            <Info size={16} />
            Lưu mã này để theo dõi trạng thái báo cáo
          </p>
          
          <div className="vr-success-buttons">
            <button className="vr-btn vr-btn-outline" onClick={() => navigate('/my-reports')}>
              <FileStack size={18} />
              Xem lịch sử
            </button>
            <button className="vr-btn vr-btn-primary" onClick={() => {
              setSuccess(false);
              setTitle('');
              setTargetEmail('');
              setReportType('');
              setSeverity('MEDIUM');
              setDescription('');
              setUploadedFiles([]);
            }}>
              <Plus size={18} />
              Báo cáo mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vr-page">
      {/* Header */}
      <div className="vr-header">
        <div className="vr-header-left">
          <div className="vr-header-icon">
            <Shield size={24} />
          </div>
          <div className="vr-header-text">
            <h1>Báo Cáo Vi Phạm</h1>
            <p>Giúp cộng đồng an toàn hơn</p>
          </div>
        </div>
        {currentUserId && (
          <button 
            type="button"
            className="vr-btn vr-btn-ghost"
            onClick={() => navigate('/my-reports')}
          >
            <FileStack size={18} />
            <span>Lịch sử báo cáo</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="vr-alert vr-alert-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="vr-alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form */}
      <form className="vr-form" onSubmit={handleSubmit}>
        {/* Row 1: Title + Email */}
        <div className="vr-form-row">
          <div className="vr-field">
            <label>
              <FileText size={16} />
              Tiêu đề <span className="vr-required">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mô tả ngắn gọn vấn đề"
              maxLength={200}
              required
            />
          </div>
          
          <div className="vr-field">
            <label>
              <Mail size={16} />
              Email người vi phạm <span className="vr-required">*</span>
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="email@example.com"
              required
              disabled={!!initialEmail}
            />
          </div>
        </div>

        {/* Row 2: Type + Severity */}
        <div className="vr-form-row">
          <div className="vr-field">
            <label>
              <AlertTriangle size={16} />
              Loại vi phạm <span className="vr-required">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              required
            >
              <option value="">Chọn loại vi phạm</option>
              {Object.entries(REPORT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="vr-field">
            <label>Mức độ nghiêm trọng</label>
            <div className="vr-severity-group">
              {Object.entries(REPORT_SEVERITIES).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`vr-severity-btn ${key.toLowerCase()} ${severity === key ? 'active' : ''}`}
                  onClick={() => setSeverity(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="vr-field vr-field-full">
          <label>
            <FileText size={16} />
            Mô tả chi tiết <span className="vr-required">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết hành vi vi phạm: thời gian, bối cảnh, nội dung cụ thể..."
            rows={4}
            minLength={20}
            required
          />
          <span className="vr-char-count">{description.length}/20+ ký tự</span>
        </div>

        {/* File Upload */}
        <div className="vr-field vr-field-full">
          <label>
            <Upload size={16} />
            Bằng chứng đính kèm
          </label>
          
          <div className="vr-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,application/pdf"
              onChange={handleFileSelect}
              className="vr-file-input"
              id="evidence-files"
            />
            <label htmlFor="evidence-files" className="vr-upload-label">
              <Upload size={32} />
              <span className="vr-upload-text">Kéo thả hoặc click để chọn file</span>
              <span className="vr-upload-hint">Ảnh, Video, PDF • Tối đa 10MB/file</span>
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="vr-files-list">
              {uploadedFiles.map((item, index) => (
                <div key={index} className={`vr-file-item ${item.error ? 'error' : ''}`}>
                  <div className="vr-file-icon">
                    {getFileIcon(item.file)}
                  </div>
                  <div className="vr-file-info">
                    <span className="vr-file-name">{item.file.name}</span>
                    <span className="vr-file-size">{formatFileSize(item.file.size)}</span>
                  </div>
                  <div className="vr-file-status">
                    {item.uploading ? (
                      <div className="vr-upload-progress">
                        <Loader size={16} className="vr-spinner" />
                        <span>{item.progress}%</span>
                      </div>
                    ) : item.error ? (
                      <span className="vr-file-error">{item.error}</span>
                    ) : (
                      <Check size={16} className="vr-file-success" />
                    )}
                  </div>
                  <button
                    type="button"
                    className="vr-file-remove"
                    onClick={() => handleRemoveFile(index)}
                    disabled={item.uploading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="vr-form-actions">
          {onClose && (
            <button type="button" className="vr-btn vr-btn-ghost" onClick={onClose}>
              Hủy
            </button>
          )}
          <button 
            type="submit" 
            className="vr-btn vr-btn-primary vr-btn-submit"
            disabled={loading || uploadedFiles.some(f => f.uploading)}
          >
            {loading ? (
              <>
                <Loader size={18} className="vr-spinner" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={18} />
                Gửi báo cáo
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="vr-tips">
        <Info size={18} />
        <div>
          <strong>Lưu ý:</strong>
          <ul>
            <li>Cung cấp bằng chứng giúp xử lý nhanh hơn</li>
            <li>Báo cáo sai sự thật có thể bị xử lý ngược</li>
            <li>Thông tin người báo cáo được bảo mật</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportUserPage;
