import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Image,
  Link,
  Bold,
  Italic,
  List,
  Hash,
  Eye,
  Send,
  Save,
  X,
  Loader,
} from 'lucide-react';
import './broadcast-form-styles.css';
import communityService from '../../services/communityService';
import { useAuth } from '../../context/AuthContext';
import { uploadImage as uploadImageFile, validateImage } from '../../services/fileUploadService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface BroadcastFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  status: 'draft' | 'published';
}

const BroadcastForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    image: undefined,
    status: 'draft',
  });
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingContent, setIsUploadingContent] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [contentUploadProgress, setContentUploadProgress] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const inlineImageInputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const channels = [
    { id: 'discussion', name: 'Thảo luận' },
    { id: 'tutorial', name: 'Hướng dẫn' },
    { id: 'tips', name: 'Mẹo hay' },
    { id: 'news', name: 'Tin tức' },
    { id: 'career', name: 'Tuyển dụng' },
    { id: 'showcase', name: 'Trưng bày' },
  ];

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()],
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    setIsSubmitting(true);
    if (!isAuthenticated) {
      navigate('/login');
      setIsSubmitting(false);
      return;
    }

    try {
      const content = formData.content.trim();
      // We now send thumbnailUrl as a separate field, but we can still keep it in markdown if desired.
      // For now, let's just send it as a field to the backend.
      
      const created = await communityService.createPost({
        title: formData.title.trim(),
        content,
        status: status === 'published' ? 'PUBLISHED' : 'DRAFT',
        thumbnailUrl: thumbnailUrl,
        category: formData.category,
        tags: formData.tags,
      });
      navigate(`/community/${created.id}`);
    } catch (error) {
      console.error('Lỗi đăng bài:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyWrap = (prefix: string, suffix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = formData.content.substring(0, start);
    const selected = formData.content.substring(start, end) || '';
    const after = formData.content.substring(end);
    const next = `${before}${prefix}${selected}${suffix}${after}`;
    setFormData({ ...formData, content: next });
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length + selected.length;
    }, 0);
  };

  const handleBold = () => applyWrap('**', '**');
  const handleItalic = () => applyWrap('*', '*');
  const handleList = () => applyWrap('\n- ', '');
  const handleLink = () => applyWrap('[text](', ')');

  const triggerInlineImage = () => inlineImageInputRef.current?.click();
  const triggerThumbnail = () => thumbnailInputRef.current?.click();

  const onInlineImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user?.id) {
      alert('Vui lòng đăng nhập để upload ảnh');
      return;
    }

    const validation = validateImage(file);
    if (!validation.valid) {
      alert(validation.error || 'Ảnh không hợp lệ');
      return;
    }

    try {
      setIsUploadingContent(true);
      setContentUploadProgress(0);
      const res = await uploadImageFile(
        file,
        user.id,
        (progress) => setContentUploadProgress(progress.percentage)
      );
      const url = res.url;
      // Insert Markdown image
      setFormData({ ...formData, content: `${formData.content}\n![image](${url})\n` });
    } catch (err) {
      console.error('Upload ảnh nội dung thất bại', err);
    } finally {
      setIsUploadingContent(false);
      setContentUploadProgress(0);
      e.target.value = '';
    }
  };

  const onThumbnailSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      alert('Vui lòng đăng nhập để upload ảnh');
      return;
    }

    const validation = validateImage(file);
    if (!validation.valid) {
      alert(validation.error || 'Ảnh không hợp lệ');
      return;
    }

    try {
      setIsUploadingThumbnail(true);
      setThumbnailProgress(0);
      const res = await uploadImageFile(
        file,
        user.id,
        (progress) => setThumbnailProgress(progress.percentage)
      );
      setThumbnailUrl(res.url);
    } catch (err) {
      console.error('Upload thumbnail thất bại', err);
    } finally {
      setIsUploadingThumbnail(false);
      setThumbnailProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="broadcast-form-layout">
      <div className="broadcast-form-container">
        {/* Header */}
        <div className="broadcast-form-header">
          <button onClick={() => navigate('/community')} className="broadcast-back-btn">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1 className="broadcast-form-title">Tạo bài viết</h1>
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="broadcast-preview-btn"
          >
            <Eye size={20} />
            <span>{isPreview ? 'Chỉnh sửa' : 'Xem trước'}</span>
          </button>
        </div>

        <div className="broadcast-form-grid">
          {!isPreview ? (
            /* Editor Mode */
            <div className="broadcast-editor">
              {/* Title */}
              <div className="broadcast-form-group">
                <input
                  type="text"
                  placeholder="Tiêu đề bài viết..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="broadcast-title-input"
                />
              </div>

              {/* Category */}
              <div className="broadcast-form-group">
                <label className="broadcast-form-label">Chuyên mục</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="broadcast-category-select"
                >
                  <option value="">Chọn chuyên mục</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Editor */}
              <div className="broadcast-form-group">
                <label className="broadcast-form-label">Nội dung</label>
                <div className="broadcast-toolbar">
                  <button type="button" className="broadcast-toolbar-btn" title="In đậm" onClick={handleBold}>
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    className="broadcast-toolbar-btn"
                    title="In nghiêng"
                    onClick={handleItalic}
                  >
                    <Italic size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Danh sách" onClick={handleList}>
                    <List size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Liên kết" onClick={handleLink}>
                    <Link size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Ảnh" onClick={triggerInlineImage} disabled={isUploadingContent}>
                    {isUploadingContent ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Image size={16} />}
                  </button>
                  <input ref={inlineImageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onInlineImageSelected} />
                </div>
                <textarea
                  placeholder="Soạn nội dung bài viết...

Bạn có thể dùng:
- **text** để in đậm
- *text* để in nghiêng
- Xuống dòng để tạo đoạn"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="broadcast-content-textarea"
                  ref={textareaRef}
                  rows={15}
                />
              </div>

              {/* Thumbnail Upload */}
              <div className="broadcast-form-group">
                <label className="broadcast-form-label">Ảnh thumbnail</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button type="button" className="broadcast-toolbar-btn" title="Chọn thumbnail" onClick={triggerThumbnail} disabled={isUploadingThumbnail}>
                    {isUploadingThumbnail ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Image size={16} />}
                    <span style={{ marginLeft: 6 }}>{isUploadingThumbnail ? `Đang tải... ${thumbnailProgress}%` : 'Chọn ảnh'}</span>
                  </button>
                  <input ref={thumbnailInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onThumbnailSelected} />
                  {thumbnailUrl && (
                    <img src={thumbnailUrl} alt="thumbnail" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="broadcast-form-group">
                <label className="broadcast-form-label">Thẻ</label>
                <div className="broadcast-tags-wrapper">
                  {formData.tags.length > 0 && (
                    <div className="broadcast-tags-list">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="broadcast-tag">
                          <Hash size={12} />
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="broadcast-tag-remove"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Thêm thẻ và nhấn Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="broadcast-tag-input"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="broadcast-preview-section">
              <div className="broadcast-preview-post">
                <div className="broadcast-preview-header">
                  <h1 className="broadcast-preview-title">
                    {formData.title || 'Bài viết chưa có tiêu đề'}
                  </h1>
                  <div className="broadcast-preview-meta">
                    <span className="broadcast-preview-category">
                      {channels.find((c) => c.id === formData.category)?.name ||
                        'Chưa chọn chuyên mục'}
                    </span>
                    <span className="broadcast-preview-date">
                      {new Date().toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="broadcast-preview-content markdown-content">
                  {formData.content ? (
                    <ReactMarkdown
                      children={formData.content}
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        img: ({ node, ...props }) => (
                          <img
                            style={{ maxWidth: '100%', borderRadius: 8, margin: '1rem 0' }}
                            {...props}
                          />
                        ),
                      }}
                    />
                  ) : (
                    <p className="broadcast-preview-placeholder">
                      Nội dung sẽ hiển thị tại đây...
                    </p>
                  )}
                </div>

                {formData.tags.length > 0 && (
                  <div className="broadcast-preview-tags">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="broadcast-preview-tag">
                        <Hash size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sidebar */}
          <div className="broadcast-sidebar">
            <div className="broadcast-sidebar-card">
              <h3 className="broadcast-sidebar-title">Thao tác</h3>
              <div className="broadcast-action-buttons">
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="broadcast-action-btn save-draft"
                >
                  <Save size={20} />
                  <span>Lưu bản nháp</span>
                </button>
                <button
                  onClick={() => handleSubmit('published')}
                  disabled={
                    isSubmitting ||
                    !formData.title.trim() ||
                    !formData.content.trim() ||
                    !formData.category
                  }
                  className="broadcast-action-btn transmit"
                >
                  <Send size={20} />
                  <span>Đăng bài viết</span>
                </button>
              </div>
            </div>

            <div className="broadcast-sidebar-card">
              <h3 className="broadcast-sidebar-title">Hướng dẫn đăng bài</h3>
              <ul className="broadcast-guidelines">
                <li>Đặt tiêu đề rõ ràng và ngắn gọn</li>
                <li>Chọn đúng chuyên mục phù hợp</li>
                <li>Thêm thẻ để dễ tìm kiếm</li>
                <li>Nội dung hữu ích và có giá trị</li>
                <li>Kiểm tra bài trước khi đăng</li>
              </ul>
            </div>

            <div className="broadcast-sidebar-card">
              <h3 className="broadcast-sidebar-title">Định dạng văn bản</h3>
              <div className="broadcast-format-help">
                <div className="broadcast-format-item">
                  <code>**text**</code>
                  <span>In đậm</span>
                </div>
                <div className="broadcast-format-item">
                  <code>*text*</code>
                  <span>In nghiêng</span>
                </div>
                <div className="broadcast-format-item">
                  <code>Enter</code>
                  <span>Xuống dòng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastForm;
