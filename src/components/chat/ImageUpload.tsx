import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, Camera } from 'lucide-react';
import './ImageUpload.css';

interface ImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string, file?: File) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ImageUpload: React.FC<ImageUploadProps> = ({
  isOpen,
  onClose,
  onImageSelect,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Chỉ chấp nhận: ${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`;
    }
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Kích thước tối đa: ${maxSizeMB}MB`;
    }
    
    return null;
  }, [acceptedTypes, maxSizeMB]);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setSelectedFile(file);
    };
    reader.onerror = () => {
      setError('Không thể đọc file');
    };
    reader.readAsDataURL(file);
  }, [validateFile]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  }, [processFile]);

  // Add paste listener when open
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('paste', handlePaste);
    }
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, handlePaste]);

  const handleConfirm = async () => {
    if (!preview || !selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // In a real app, you would upload to your server/cloud storage here
      // For now, we'll use the base64 data URL
      // You can replace this with actual upload logic
      
      // Simulating upload delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onImageSelect(preview, selectedFile);
      handleClear();
      onClose();
    } catch (err) {
      setError('Không thể tải lên hình ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="image-upload-overlay" onClick={handleClose}>
      <div className="image-upload-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="image-upload-header">
          <div className="image-upload-title">
            <Camera size={20} />
            <span>Gửi hình ảnh</span>
          </div>
          <button className="image-upload-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="image-upload-content">
          {!preview ? (
            <>
              {/* Drop zone */}
              <div
                ref={dropZoneRef}
                className={`image-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes.join(',')}
                  onChange={handleFileSelect}
                  className="image-upload-input"
                />
                
                <div className="image-upload-icon">
                  <Upload size={40} />
                </div>
                
                <div className="image-upload-text">
                  <p className="image-upload-main-text">
                    Kéo thả hình ảnh hoặc <span>nhấp để chọn</span>
                  </p>
                  <p className="image-upload-sub-text">
                    Hỗ trợ: JPG, PNG, GIF, WebP (Tối đa {maxSizeMB}MB)
                  </p>
                </div>

                <div className="image-upload-paste-hint">
                  <span>Hoặc dán (Ctrl+V) từ clipboard</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="image-upload-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="image-upload-preview">
                <div className="image-preview-container">
                  <img src={preview} alt="Preview" />
                  <button 
                    className="image-preview-remove"
                    onClick={handleClear}
                    title="Xóa"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {selectedFile && (
                  <div className="image-preview-info">
                    <ImageIcon size={14} />
                    <span className="image-preview-name">{selectedFile.name}</span>
                    <span className="image-preview-size">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="image-upload-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="image-upload-footer">
          <button 
            className="image-upload-btn cancel"
            onClick={handleClose}
            disabled={isUploading}
          >
            Hủy
          </button>
          <button 
            className="image-upload-btn confirm"
            onClick={handleConfirm}
            disabled={!preview || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="spinning" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Gửi hình ảnh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
