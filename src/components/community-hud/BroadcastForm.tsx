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
} from 'lucide-react';
import './broadcast-form-styles.css';

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
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft',
  });
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const postData = {
      ...formData,
      status,
      createdAt: new Date().toISOString(),
      author: 'Current Pilot', // This would come from auth context
      likes: 0,
      comments: 0,
      shares: 0,
    };

    try {
      // Here you would make an API call to save the post
      // For now, we'll just log it and redirect
      console.log('Đã đăng bài viết:', postData);

      // Redirect to community page
      navigate('/community', {
        state: {
          message:
            status === 'published'
              ? 'Đăng bài viết thành công!'
              : 'Đã lưu bản nháp!',
        },
      });
    } catch (error) {
      console.error('Lỗi đăng bài:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="broadcast-form-layout">
      <div className="broadcast-form-container">
        {/* Header */}
        <div className="broadcast-form-header">
          <button onClick={() => navigate(-1)} className="broadcast-back-btn">
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
                  <button type="button" className="broadcast-toolbar-btn" title="In đậm">
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    className="broadcast-toolbar-btn"
                    title="In nghiêng"
                  >
                    <Italic size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Danh sách">
                    <List size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Liên kết">
                    <Link size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Ảnh">
                    <Image size={16} />
                  </button>
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
                  rows={15}
                />
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

                <div className="broadcast-preview-content">
                  {formData.content ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatContent(formData.content),
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
