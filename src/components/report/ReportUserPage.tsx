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
import './HUDReportStyles.css';

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
      <div className="hud-report-container">
        <div className="hud-report-card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }}>
          <div className="hud-report-icon-box" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--hud-accent-green)', color: 'var(--hud-accent-green)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
            <Check size={48} />
          </div>
          <h2 style={{ fontFamily: 'var(--hud-font-display)', color: 'var(--hud-accent-green)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Báo Cáo Đã Gửi Thành Công!</h2>
          <p style={{ color: 'var(--hud-text-secondary)', marginBottom: '2rem' }}>Cảm ơn bạn đã báo cáo. Đội ngũ quản trị sẽ xem xét và phản hồi sớm nhất.</p>
          
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px dashed var(--hud-border-bright)', padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--hud-accent-cyan)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Mã theo dõi:</span>
            <span style={{ fontFamily: 'var(--hud-font-display)', fontSize: '1.5rem', color: '#fff', letterSpacing: '3px' }}>{createdReport.reportCode}</span>
          </div>
          
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--hud-text-dim)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            <Info size={16} />
            Lưu mã này để theo dõi trạng thái báo cáo
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="hud-report-btn hud-report-btn-ghost" onClick={() => navigate('/my-reports')}>
              <FileStack size={18} />
              Xem lịch sử
            </button>
            <button className="hud-report-btn hud-report-btn-primary" onClick={() => {
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
    <div className="hud-report-container">
      <div className="hud-report-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div className="hud-report-header">
          <div className="hud-report-title-section">
            <div className="hud-report-icon-box">
              <Shield size={24} />
            </div>
            <div>
              <h1>Báo Cáo Vi Phạm</h1>
              <p>Hệ thống giám sát an ninh cộng đồng</p>
            </div>
          </div>
          {currentUserId && (
            <button 
              type="button"
              className="hud-report-btn hud-report-btn-ghost"
              onClick={() => navigate('/my-reports')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              <FileStack size={16} />
              <span>Lịch sử báo cáo</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--hud-accent-red)', 
            color: 'var(--hud-accent-red)',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <AlertTriangle size={20} />
            <span style={{ flex: 1 }}>{error}</span>
            <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Form */}
        <form className="hud-report-form" onSubmit={handleSubmit}>
          {/* Row 1: Title + Email */}
          <div className="hud-report-form-row">
            <div className="hud-report-field">
              <label>
                <FileText size={14} />
                Tiêu đề <span style={{ color: 'var(--hud-accent-red)' }}>*</span>
              </label>
              <input
                className="hud-report-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="MÔ TẢ NGẮN GỌN VẤN ĐỀ"
                maxLength={200}
                required
              />
            </div>
            
            <div className="hud-report-field">
              <label>
                <Mail size={14} />
                Email đối tượng <span style={{ color: 'var(--hud-accent-red)' }}>*</span>
              </label>
              <input
                className="hud-report-input"
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="EMAIL@EXAMPLE.COM"
                required
                disabled={!!initialEmail}
              />
            </div>
          </div>

          {/* Row 2: Type + Severity */}
          <div className="hud-report-form-row">
            <div className="hud-report-field">
              <label>
                <AlertTriangle size={14} />
                Loại vi phạm <span style={{ color: 'var(--hud-accent-red)' }}>*</span>
              </label>
              <select
                className="hud-report-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                required
              >
                <option value="">CHỌN LOẠI VI PHẠM</option>
                {Object.entries(REPORT_TYPES).map(([key, label]) => (
                  <option key={key} value={key} style={{ background: '#050b14' }}>{label.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            <div className="hud-report-field">
              <label>Mức độ nghiêm trọng</label>
              <div className="hud-severity-group">
                {Object.entries(REPORT_SEVERITIES).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`hud-severity-btn ${key.toLowerCase()} ${severity === key ? 'active' : ''}`}
                    onClick={() => setSeverity(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="hud-report-field">
            <label>
              <FileText size={14} />
              Chi tiết hành vi <span style={{ color: 'var(--hud-accent-red)' }}>*</span>
            </label>
            <textarea
              className="hud-report-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cung cấp chi tiết hành vi vi phạm: thời gian, bối cảnh, nội dung cụ thể..."
              rows={5}
              minLength={20}
              required
            />
            <span style={{ alignSelf: 'flex-end', fontSize: '0.7rem', color: 'var(--hud-text-dim)', marginTop: '0.2rem' }}>
              {description.length}/20+ KÝ TỰ
            </span>
          </div>

          {/* File Upload */}
          <div className="hud-report-field">
            <label>
              <Upload size={14} />
              Dữ liệu bằng chứng
            </label>
            
            <div style={{ 
              border: '1px dashed rgba(6, 182, 212, 0.3)', 
              background: 'rgba(6, 182, 212, 0.02)',
              borderRadius: '4px',
              padding: '2rem',
              textAlign: 'center',
              position: 'relative'
            }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,application/pdf"
                onChange={handleFileSelect}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                id="evidence-files"
              />
              <div style={{ pointerEvents: 'none' }}>
                <Upload size={32} style={{ color: 'var(--hud-accent-cyan)', marginBottom: '1rem', opacity: 0.7 }} />
                <div style={{ color: 'var(--hud-accent-cyan)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Kéo thả hoặc click để chọn file</div>
                <div style={{ color: 'var(--hud-text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Ảnh, Video, PDF • Tối đa 10MB/file</div>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {uploadedFiles.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    padding: '0.75rem', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px'
                  }}>
                    <div style={{ color: 'var(--hud-accent-cyan)' }}>
                      {getFileIcon(item.file)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ color: 'var(--hud-text-primary)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.file.name}</div>
                      <div style={{ color: 'var(--hud-text-dim)', fontSize: '0.7rem' }}>{formatFileSize(item.file.size)}</div>
                    </div>
                    <div>
                      {item.uploading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--hud-accent-cyan)', fontSize: '0.75rem' }}>
                          <Loader size={14} className="hud-spinning" />
                          <span>{item.progress}%</span>
                        </div>
                      ) : item.error ? (
                        <span style={{ color: 'var(--hud-accent-red)', fontSize: '0.75rem' }}>Lỗi</span>
                      ) : (
                        <Check size={16} style={{ color: 'var(--hud-accent-green)' }} />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={item.uploading}
                      style={{ background: 'none', border: 'none', color: 'var(--hud-text-dim)', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            {onClose && (
              <button type="button" className="hud-report-btn hud-report-btn-ghost" onClick={onClose}>
                Hủy
              </button>
            )}
            <button 
              type="submit" 
              className="hud-report-btn hud-report-btn-primary"
              disabled={loading || uploadedFiles.some(f => f.uploading)}
              style={{ minWidth: '180px' }}
            >
              {loading ? (
                <>
                  <Loader size={18} className="hud-spinning" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Gửi dữ liệu
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tips / Info */}
        <div style={{ 
          marginTop: '2.5rem', 
          padding: '1rem', 
          background: 'rgba(6, 182, 212, 0.05)', 
          borderLeft: '2px solid var(--hud-accent-cyan)',
          display: 'flex',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <Info size={18} style={{ color: 'var(--hud-accent-cyan)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--hud-accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Giao thức an toàn:</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: 'var(--hud-text-secondary)', listStyleType: 'square' }}>
              <li>Mọi dữ liệu báo cáo được mã hóa đa lớp</li>
              <li>Bằng chứng rõ ràng giúp tăng tốc độ xử lý của đơn vị phán quyết</li>
              <li>Thông tin người khởi tạo báo cáo được bảo mật tuyệt đối theo chuẩn Cosmic-Level</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportUserPage;
