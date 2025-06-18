import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Image, Link, Bold, Italic, List, 
  Hash, Eye, Send, Save, X
} from 'lucide-react';
import '../../styles/BlogForm.css';

interface BlogFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  status: 'draft' | 'published';
}

const BlogForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft'
  });
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'discussion', name: 'Thảo Luận' },
    { id: 'tutorial', name: 'Hướng Dẫn' },
    { id: 'question', name: 'Câu Hỏi' },
    { id: 'showcase', name: 'Trưng Bày' },
    { id: 'news', name: 'Tin Tức' },
    { id: 'resource', name: 'Tài Nguyên' }
  ];

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    setIsSubmitting(true);
    
    const postData = {
      ...formData,
      status,
      createdAt: new Date().toISOString(),
      author: 'Current User', // This would come from auth context
      likes: 0,
      comments: 0,
      shares: 0
    };

    try {
      // Here you would make an API call to save the post
      // await fetch('https://685159d58612b47a2c09b031.mockapi.io/community', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(postData)
      // });

      console.log('Post saved:', postData);
      
      // Redirect to community page
      navigate('/community', { 
        state: { 
          message: status === 'published' ? 'Bài viết đã được đăng!' : 'Bài viết đã được lưu nháp!' 
        } 
      });
    } catch (error) {
      console.error('Error saving post:', error);
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
    <div className="blog-form-container">
      <div className="blog-form-content">
        {/* Header */}
        <div className="blog-form-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1 className="blog-form-title">Tạo Bài Viết Mới</h1>
          <div className="header-actions">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="preview-button"
            >
              <Eye size={20} />
              <span>{isPreview ? 'Chỉnh sửa' : 'Xem trước'}</span>
            </button>
          </div>
        </div>

        <div className="blog-form-layout">
          {!isPreview ? (
            /* Editor Mode */
            <div className="editor-section">
              {/* Title Input */}
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Tiêu đề bài viết..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="title-input"
                />
              </div>

              {/* Category Selection */}
              <div className="form-group">
                <label className="form-label">Danh mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="category-select"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Editor */}
              <div className="form-group">
                <label className="form-label">Nội dung</label>
                <div className="editor-toolbar">
                  <button type="button" className="toolbar-button" title="Bold">
                    <Bold size={16} />
                  </button>
                  <button type="button" className="toolbar-button" title="Italic">
                    <Italic size={16} />
                  </button>
                  <button type="button" className="toolbar-button" title="List">
                    <List size={16} />
                  </button>
                  <button type="button" className="toolbar-button" title="Link">
                    <Link size={16} />
                  </button>
                  <button type="button" className="toolbar-button" title="Image">
                    <Image size={16} />
                  </button>
                </div>
                <textarea
                  placeholder="Viết nội dung bài viết của bạn... 

Bạn có thể sử dụng:
- **text** để in đậm
- *text* để in nghiêng
- Xuống dòng để tạo đoạn mới"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="content-textarea"
                  rows={15}
                />
              </div>

              {/* Tags Input */}
              <div className="form-group">
                <label className="form-label">Thẻ</label>
                <div className="tags-container">
                  <div className="tags-list">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        <Hash size={12} />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="tag-remove"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Thêm thẻ và nhấn Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="tag-input"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="preview-section">
              <div className="preview-post">
                <div className="preview-header">
                  <h1 className="preview-title">
                    {formData.title || 'Tiêu đề bài viết'}
                  </h1>
                  <div className="preview-meta">
                    <span className="preview-category">
                      {categories.find(c => c.id === formData.category)?.name || 'Chưa chọn danh mục'}
                    </span>
                    <span className="preview-date">
                      {new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                
                <div className="preview-content">
                  {formData.content ? (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatContent(formData.content) 
                      }} 
                    />
                  ) : (
                    <p className="preview-placeholder">Nội dung bài viết sẽ hiển thị ở đây...</p>
                  )}
                </div>

                {formData.tags.length > 0 && (
                  <div className="preview-tags">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="preview-tag">
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
          <div className="sidebar-section">
            <div className="sidebar-card">
              <h3 className="sidebar-title">Hành động</h3>
              <div className="action-buttons">
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="action-button save-draft"
                >
                  <Save size={20} />
                  <span>Lưu nháp</span>
                </button>
                <button
                  onClick={() => handleSubmit('published')}
                  disabled={isSubmitting || !formData.title.trim() || !formData.content.trim() || !formData.category}
                  className="action-button publish"
                >
                  <Send size={20} />
                  <span>Đăng bài</span>
                </button>
              </div>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-title">Hướng dẫn viết bài</h3>
              <ul className="guidelines">
                <li>Sử dụng tiêu đề rõ ràng và hấp dẫn</li>
                <li>Chọn danh mục phù hợp với nội dung</li>
                <li>Thêm thẻ để dễ tìm kiếm</li>
                <li>Viết nội dung có giá trị và dễ hiểu</li>
                <li>Kiểm tra lại trước khi đăng</li>
              </ul>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-title">Định dạng văn bản</h3>
              <div className="formatting-help">
                <div className="format-item">
                  <code>**text**</code>
                  <span>In đậm</span>
                </div>
                <div className="format-item">
                  <code>*text*</code>
                  <span>In nghiêng</span>
                </div>
                <div className="format-item">
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

export default BlogForm;