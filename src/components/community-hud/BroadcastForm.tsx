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
    { id: 'discussion', name: 'Discussion' },
    { id: 'tutorial', name: 'Training Protocol' },
    { id: 'tips', name: 'Optimization Tips' },
    { id: 'news', name: 'Intel Report' },
    { id: 'career', name: 'Recruitment' },
    { id: 'showcase', name: 'Mission Showcase' },
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
      console.log('Transmission broadcasted:', postData);

      // Redirect to community page
      navigate('/community', {
        state: {
          message:
            status === 'published'
              ? 'Signal transmitted successfully!'
              : 'Transmission saved to logs!',
        },
      });
    } catch (error) {
      console.error('Error broadcasting signal:', error);
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
            <span>ABORT</span>
          </button>
          <h1 className="broadcast-form-title">NEW TRANSMISSION</h1>
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="broadcast-preview-btn"
          >
            <Eye size={20} />
            <span>{isPreview ? 'EDIT' : 'PREVIEW'}</span>
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
                  placeholder="Transmission Title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="broadcast-title-input"
                />
              </div>

              {/* Category */}
              <div className="broadcast-form-group">
                <label className="broadcast-form-label">Frequency Channel</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="broadcast-category-select"
                >
                  <option value="">Select Channel</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Editor */}
              <div className="broadcast-form-group">
                <label className="broadcast-form-label">Message Content</label>
                <div className="broadcast-toolbar">
                  <button type="button" className="broadcast-toolbar-btn" title="Bold">
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    className="broadcast-toolbar-btn"
                    title="Italic"
                  >
                    <Italic size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="List">
                    <List size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Link">
                    <Link size={16} />
                  </button>
                  <button type="button" className="broadcast-toolbar-btn" title="Image">
                    <Image size={16} />
                  </button>
                </div>
                <textarea
                  placeholder="Compose your transmission...

You can use:
- **text** for bold
- *text* for italic
- New lines for paragraphs"
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
                <label className="broadcast-form-label">Signal Tags</label>
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
                    placeholder="Add tags and press Enter..."
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
                    {formData.title || 'Untitled Transmission'}
                  </h1>
                  <div className="broadcast-preview-meta">
                    <span className="broadcast-preview-category">
                      {channels.find((c) => c.id === formData.category)?.name ||
                        'No Channel Selected'}
                    </span>
                    <span className="broadcast-preview-date">
                      {new Date().toLocaleDateString('en-US', {
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
                      Message content will appear here...
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
              <h3 className="broadcast-sidebar-title">Actions</h3>
              <div className="broadcast-action-buttons">
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="broadcast-action-btn save-draft"
                >
                  <Save size={20} />
                  <span>Save to Log</span>
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
                  <span>Transmit Signal</span>
                </button>
              </div>
            </div>

            <div className="broadcast-sidebar-card">
              <h3 className="broadcast-sidebar-title">Transmission Protocol</h3>
              <ul className="broadcast-guidelines">
                <li>Use clear and concise signal headers</li>
                <li>Select appropriate frequency channel</li>
                <li>Add tags for better signal routing</li>
                <li>Ensure message provides valuable intel</li>
                <li>Review transmission before broadcasting</li>
              </ul>
            </div>

            <div className="broadcast-sidebar-card">
              <h3 className="broadcast-sidebar-title">Format Codes</h3>
              <div className="broadcast-format-help">
                <div className="broadcast-format-item">
                  <code>**text**</code>
                  <span>Bold</span>
                </div>
                <div className="broadcast-format-item">
                  <code>*text*</code>
                  <span>Italic</span>
                </div>
                <div className="broadcast-format-item">
                  <code>Enter</code>
                  <span>New Line</span>
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