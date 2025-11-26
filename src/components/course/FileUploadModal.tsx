import React, { useState } from 'react';
import { X, Upload, FileVideo, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import HoloProgressBar from '../dashboard-hud/HoloProgressBar'; // ✅ TÁI SỬ DỤNG
import { 
  uploadVideo, 
  uploadDocument, 
  validateVideo, 
  validateDocument,
  formatFileSize,
  UploadProgress,
  UploadResponse
} from '../../services/fileUploadService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ModalsEnhanced.css'; // ✅ TÁI SỬ DỤNG CSS
import './FileUploadModal.css';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: UploadResponse) => void;
  type: 'video' | 'document';
  title?: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  title
}) => {
  const { user } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  if (!isOpen) return null;
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('[FILE_UPLOAD_MODAL] File selected:', file.name);
    
    // Validate
    const validation = type === 'video' 
      ? validateVideo(file) 
      : validateDocument(file);
      
    if (!validation.valid) {
      console.error('[FILE_UPLOAD_MODAL] Validation failed:', validation.error);
      setError(validation.error || 'File không hợp lệ');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    console.log('[FILE_UPLOAD_MODAL] File validated successfully');
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !user) {
      console.error('[FILE_UPLOAD_MODAL] Missing file or user');
      return;
    }
    
    console.log('[FILE_UPLOAD_MODAL] Starting upload...');
    
    try {
      setUploading(true);
      setError(null);
      setUploadProgress({ loaded: 0, total: selectedFile.size, percentage: 0 });
      
      const uploadFn = type === 'video' ? uploadVideo : uploadDocument;
      const result = await uploadFn(
        selectedFile,
        user.id,
        (progress) => {
          setUploadProgress(progress);
          console.log(`[FILE_UPLOAD_MODAL] Progress: ${progress.percentage}%`);
        }
      );
      
      console.log('[FILE_UPLOAD_MODAL] Upload successful:', result.mediaId);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess(result);
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('[FILE_UPLOAD_MODAL] Upload failed:', err);
      setError(err.response?.data?.message || 'Upload thất bại. Vui lòng thử lại.');
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };
  
  const getIcon = () => {
    if (success) return <CheckCircle size={48} className="text-green-500" />;
    if (error) return <AlertCircle size={48} className="text-red-500" />;
    return type === 'video' 
      ? <FileVideo size={48} className="text-cyan-400" />
      : <FileText size={48} className="text-purple-400" />;
  };
  
  const getTitle = () => {
    if (title) return title;
    return type === 'video' ? '📹 Upload Video' : '📄 Upload Document';
  };
  
  const getAcceptTypes = () => {
    return type === 'video' 
      ? 'video/mp4,video/webm,video/quicktime,video/x-msvideo'
      : 'application/pdf,.docx,.pptx';
  };
  
  const getHint = () => {
    return type === 'video' 
      ? 'Tối đa 300MB • MP4, WebM, MOV, AVI'
      : 'Tối đa 20MB • PDF, DOCX, PPTX';
  };
  
  return (
    <div className="lesson-modal-overlay"> {/* ✅ TÁI SỬ DỤNG CLASS */}
      <div className="lesson-modal-content file-upload-modal-content"> {/* ✅ TÁI SỬ DỤNG CLASS */}
        <div className="lesson-modal-header">
          <h2>{getTitle()}</h2>
          <button 
            onClick={onClose} 
            className="lesson-modal-close-btn" 
            disabled={uploading}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="lesson-modal-body">
          {/* File Input Zone */}
          {!selectedFile && !uploading && !success && (
            <div className="file-input-zone">
              <input
                type="file"
                accept={getAcceptTypes()}
                onChange={handleFileSelect}
                id="file-input"
                className="file-input-hidden"
              />
              <label htmlFor="file-input" className="file-input-label">
                {getIcon()}
                <p className="file-input-text">
                  Click để chọn {type === 'video' ? 'video' : 'tài liệu'}
                </p>
                <small className="file-input-hint">{getHint()}</small>
              </label>
            </div>
          )}
          
          {/* Selected File Info */}
          {selectedFile && !uploading && !success && (
            <div className="selected-file-info">
              {getIcon()}
              <div className="file-details">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button 
                onClick={() => setSelectedFile(null)} 
                className="remove-file-btn"
                aria-label="Remove file"
              >
                <X size={20} />
              </button>
            </div>
          )}
          
          {/* Upload Progress */}
          {uploading && uploadProgress && (
            <div className="upload-progress-section">
              <div className="upload-info">
                {type === 'video' ? <FileVideo size={24} /> : <FileText size={24} />}
                <div>
                  <p className="upload-filename">{selectedFile?.name}</p>
                  <p className="upload-stats">
                    {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
                  </p>
                </div>
              </div>
              
              {/* ✅ TÁI SỬ DỤNG HoloProgressBar */}
              <HoloProgressBar
                value={uploadProgress.percentage}
                label="Đang upload..."
                color="cyan"
                height="md"
                showPercentage={true}
                animated={false}
              />
              
              <p className="upload-tip">
                ⏳ Đang upload... Vui lòng không đóng cửa sổ này
              </p>
            </div>
          )}
          
          {/* Success State */}
          {success && (
            <div className="upload-success">
              <CheckCircle size={64} className="success-icon" />
              <p className="success-message">Upload thành công!</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="lesson-modal-footer">
          {!uploading && !success && (
            <>
              <button 
                onClick={onClose} 
                className="btn-secondary"
              >
                Hủy
              </button>
              <button 
                onClick={handleUpload} 
                className="btn-primary"
                disabled={!selectedFile}
              >
                <Upload size={20} />
                Upload
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
