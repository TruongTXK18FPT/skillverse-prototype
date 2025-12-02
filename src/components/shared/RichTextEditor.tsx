import React, { useRef, useState, useEffect } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft,
  AlignCenter, AlignRight, Type, Palette, Link, ImagePlus, Loader2, Trash2
} from 'lucide-react';
import { uploadImage, validateImage, UploadProgress } from '../../services/fileUploadService';
import './RichTextEditor.css';

interface RichTextEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  userId?: number; // Required for image upload
}

interface UploadedImage {
  id: number;
  url: string;
  filename: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent = '', onChange, placeholder, userId }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Modal State
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<UploadedImage | null>(null);
  const [captionText, setCaptionText] = useState('');

  // Initialize content
  useEffect(() => {
    if (editorRef.current && initialContent && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
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

  const handleImageUpload = async (file: File) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để upload ảnh');
      return;
    }

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
        userId,
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
      
      // Open caption modal instead of direct insert
      setPendingImage(newImage);
      setCaptionText('');
      setShowCaptionModal(true);
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

  const handleInsertImage = () => {
    if (!pendingImage || !editorRef.current) return;

    let imgHtml = '';
    if (captionText.trim()) {
      imgHtml = `
        <figure style="margin: 1rem 0; text-align: center;">
          <img src="${pendingImage.url}" alt="${captionText}" style="max-width: 100%; height: auto; border-radius: 8px;" />
          <figcaption style="margin-top: 0.5rem; color: #888; font-style: italic; font-size: 0.9rem;">${captionText}</figcaption>
        </figure>
        <p><br/></p>
      `;
    } else {
      imgHtml = `<img src="${pendingImage.url}" alt="${pendingImage.filename}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`;
    }
    
    execCommand('insertHTML', imgHtml);
    
    // Reset modal state
    setShowCaptionModal(false);
    setPendingImage(null);
    setCaptionText('');
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

  return (
    <div className="rich-text-editor-container">
      {/* Toolbar */}
      <div className="rte-toolbar">
        <div className="rte-toolbar-group">
          <button className="rte-toolbar-btn" onClick={formatBold} title="In đậm (Ctrl+B)"><Bold size={16} /></button>
          <button className="rte-toolbar-btn" onClick={formatItalic} title="In nghiêng (Ctrl+I)"><Italic size={16} /></button>
          <button className="rte-toolbar-btn" onClick={formatUnderline} title="Gạch chân (Ctrl+U)"><Underline size={16} /></button>
          <button className="rte-toolbar-btn" onClick={formatStrikethrough} title="Gạch ngang"><Type size={16} style={{ textDecoration: 'line-through' }} /></button>
        </div>

        <div className="rte-toolbar-divider"></div>

        <div className="rte-toolbar-group">
          <div className="rte-toolbar-dropdown">
            <button className="rte-toolbar-btn" onClick={() => setShowFontSizePicker(!showFontSizePicker)} title="Cỡ chữ">
              <Type size={16} />
            </button>
            {showFontSizePicker && (
              <div className="rte-dropdown-menu">
                {fontSizes.map((size) => (
                  <button key={size.value} className="rte-dropdown-item" onClick={() => formatFontSize(size.value)}>{size.label}</button>
                ))}
              </div>
            )}
          </div>
          
          <div className="rte-toolbar-dropdown">
            <button className="rte-toolbar-btn" onClick={() => setShowColorPicker(!showColorPicker)} title="Màu chữ">
              <Palette size={16} />
            </button>
            {showColorPicker && (
              <div className="rte-color-picker">
                {colors.map((color) => (
                  <button key={color} className="rte-color-btn" style={{ backgroundColor: color }} onClick={() => formatTextColor(color)} title={color} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rte-toolbar-divider"></div>

        <div className="rte-toolbar-group">
          <button className="rte-toolbar-btn" onClick={formatUnorderedList} title="Danh sách"><List size={16} /></button>
          <button className="rte-toolbar-btn" onClick={formatOrderedList} title="Danh sách số"><ListOrdered size={16} /></button>
        </div>

        <div className="rte-toolbar-divider"></div>

        <div className="rte-toolbar-group">
          <button className="rte-toolbar-btn" onClick={formatAlignLeft} title="Căn trái"><AlignLeft size={16} /></button>
          <button className="rte-toolbar-btn" onClick={formatAlignCenter} title="Căn giữa"><AlignCenter size={16} /></button>
          <button className="rte-toolbar-btn" onClick={formatAlignRight} title="Căn phải"><AlignRight size={16} /></button>
        </div>

        <div className="rte-toolbar-divider"></div>

        <div className="rte-toolbar-group">
          <button className="rte-toolbar-btn" onClick={insertLink} title="Chèn liên kết"><Link size={16} /></button>
          <button className="rte-toolbar-btn" onClick={() => fileInputRef.current?.click()} title="Chèn hình ảnh" disabled={isUploading}>
            <ImagePlus size={16} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        className="rte-content"
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder || "Nhập nội dung..."}
        onFocus={() => {
          setShowColorPicker(false);
          setShowFontSizePicker(false);
        }}
      />

      {/* Image Upload Hidden Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload Status Overlay */}
      {isUploading && (
        <div className="rte-upload-status">
          <Loader2 size={20} className="spinning" />
          <span>Đang tải ảnh... {uploadProgress}%</span>
        </div>
      )}
      
      {uploadError && (
        <div className="rte-error-msg">{uploadError}</div>
      )}

      {/* Caption Modal */}
      {showCaptionModal && pendingImage && (
        <div className="rte-modal-overlay">
          <div className="rte-modal">
            <div className="rte-modal-header">
              <h3>Thêm mô tả cho ảnh</h3>
            </div>
            <div className="rte-modal-body">
              <div className="rte-modal-preview">
                <img src={pendingImage.url} alt="Preview" />
              </div>
              <textarea
                className="rte-modal-input"
                placeholder="Nhập mô tả (caption) cho hình ảnh này..."
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="rte-modal-footer">
              <button 
                className="rte-btn rte-btn-secondary"
                onClick={() => {
                  // Skip caption
                  setCaptionText('');
                  handleInsertImage();
                }}
              >
                Bỏ qua
              </button>
              <button 
                className="rte-btn rte-btn-primary"
                onClick={handleInsertImage}
              >
                Thêm vào bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
