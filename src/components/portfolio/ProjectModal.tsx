// Add/Edit Project Modal
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { PortfolioProjectDTO, ProjectType } from '../../data/portfolioDTOs';
import '../../styles/PortfolioModals.css';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: PortfolioProjectDTO, thumbnail?: File) => Promise<void>;
  initialData?: PortfolioProjectDTO;
  mode: 'create' | 'edit';
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PortfolioProjectDTO>({
    title: '',
    description: '',
    clientName: '',
    projectType: ProjectType.PERSONAL,
    duration: '',
    completionDate: '',
    tools: [],
    outcomes: [],
    rating: 5,
    clientFeedback: '',
    projectUrl: '',
    githubUrl: '',
    thumbnailUrl: '',
    isFeatured: false,
  });

  const [thumbnail, setThumbnail] = useState<File | undefined>();
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
  const [toolInput, setToolInput] = useState('');
  const [outcomeInput, setOutcomeInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setThumbnailPreview(initialData.thumbnailUrl || '');
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnail(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTool = () => {
    if (toolInput.trim() && !formData.tools?.includes(toolInput.trim())) {
      setFormData({
        ...formData,
        tools: [...(formData.tools || []), toolInput.trim()]
      });
      setToolInput('');
    }
  };

  const handleRemoveTool = (tool: string) => {
    setFormData({
      ...formData,
      tools: formData.tools?.filter(t => t !== tool) || []
    });
  };

  const handleAddOutcome = () => {
    if (outcomeInput.trim() && !formData.outcomes?.includes(outcomeInput.trim())) {
      setFormData({
        ...formData,
        outcomes: [...(formData.outcomes || []), outcomeInput.trim()]
      });
      setOutcomeInput('');
    }
  };

  const handleRemoveOutcome = (outcome: string) => {
    setFormData({
      ...formData,
      outcomes: formData.outcomes?.filter(o => o !== outcome) || []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData, thumbnail);
      onClose();
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Có lỗi xảy ra khi lưu dự án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pf-modal-overlay" onClick={onClose}>
      <div className="pf-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="pf-modal-header">
          <h2>{mode === 'create' ? 'Thêm Dự Án Mới' : 'Chỉnh Sửa Dự Án'}</h2>
          <button className="pf-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pf-modal-body">
          {/* Basic Info */}
          <div className="pf-form-section">
            <h3>Thông Tin Cơ Bản</h3>
            
            <div className="pf-form-group">
              <label>Tên Dự Án *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Thiết kế lại trang E-commerce"
                required
              />
            </div>

            <div className="pf-form-group">
              <label>Mô Tả *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về dự án..."
                rows={4}
                required
              />
            </div>

            <div className="pf-form-row">
              <div className="pf-form-group">
                <label>Loại Dự Án *</label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value as ProjectType })}
                  required
                >
                  <option value={ProjectType.MICROJOB}>Micro-Job</option>
                  <option value={ProjectType.FREELANCE}>Freelance</option>
                  <option value={ProjectType.PERSONAL}>Cá Nhân</option>
                  <option value={ProjectType.ACADEMIC}>Học Thuật</option>
                  <option value={ProjectType.OPEN_SOURCE}>Mã Nguồn Mở</option>
                </select>
              </div>

              <div className="pf-form-group">
                <label>Khách Hàng</label>
                <input
                  type="text"
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="VD: ABC Company"
                />
              </div>
            </div>

            <div className="pf-form-row">
              <div className="pf-form-group">
                <label>Thời Gian</label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="VD: 3 tuần"
                />
              </div>

              <div className="pf-form-group">
                <label>Ngày Hoàn Thành</label>
                <input
                  type="date"
                  value={formData.completionDate || ''}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="pf-form-section">
            <h3>Ảnh Đại Diện</h3>
            
            <div className="pf-form-group">
              <div className="pf-file-upload">
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="pf-preview-image-wide" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="thumbnail-upload"
                />
                <label htmlFor="thumbnail-upload" className="pf-upload-btn">
                  <Upload size={18} />
                  Tải Ảnh Đại Diện
                </label>
              </div>
            </div>
          </div>

          {/* Tools & Technologies */}
          <div className="pf-form-section">
            <h3>Công Nghệ & Công Cụ</h3>
            
            <div className="pf-form-group">
              <label>Công Nghệ Sử Dụng</label>
              <div className="pf-tags-input">
                <div className="pf-tags-list">
                  {formData.tools?.map((tool, idx) => (
                    <span key={idx} className="pf-tag">
                      {tool}
                      <button type="button" onClick={() => handleRemoveTool(tool)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="pf-tag-input-row">
                  <input
                    type="text"
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTool())}
                    placeholder="VD: React, Node.js, MongoDB"
                  />
                  <button type="button" onClick={handleAddTool} className="pf-btn-add">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Outcomes */}
          <div className="pf-form-section">
            <h3>Kết Quả Đạt Được</h3>
            
            <div className="pf-form-group">
              <label>Outcomes & Achievements</label>
              <div className="pf-tags-input">
                <div className="pf-tags-list">
                  {formData.outcomes?.map((outcome, idx) => (
                    <span key={idx} className="pf-tag">
                      {outcome}
                      <button type="button" onClick={() => handleRemoveOutcome(outcome)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="pf-tag-input-row">
                  <input
                    type="text"
                    value={outcomeInput}
                    onChange={(e) => setOutcomeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOutcome())}
                    placeholder="VD: Tăng 35% tỷ lệ chuyển đổi"
                  />
                  <button type="button" onClick={handleAddOutcome} className="pf-btn-add">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Links & Rating */}
          <div className="pf-form-section">
            <h3>Liên Kết & Đánh Giá</h3>
            
            <div className="pf-form-group">
              <label>Link Dự Án</label>
              <input
                type="url"
                value={formData.projectUrl || ''}
                onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                placeholder="https://project-demo.com"
              />
            </div>

            <div className="pf-form-group">
              <label>GitHub Repository</label>
              <input
                type="url"
                value={formData.githubUrl || ''}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/user/repo"
              />
            </div>

            <div className="pf-form-row">
              <div className="pf-form-group">
                <label>Đánh Giá (1-5 sao)</label>
                <input
                  type="number"
                  value={formData.rating || 5}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="5"
                />
              </div>

              <div className="pf-form-group">
                <label>Dự Án Nổi Bật?</label>
                <div className="pf-form-checkbox">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured || false}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <label htmlFor="isFeatured">Đánh dấu là dự án nổi bật</label>
                </div>
              </div>
            </div>

            <div className="pf-form-group">
              <label>Phản Hồi Khách Hàng</label>
              <textarea
                value={formData.clientFeedback || ''}
                onChange={(e) => setFormData({ ...formData, clientFeedback: e.target.value })}
                placeholder="Feedback từ khách hàng về dự án này..."
                rows={3}
              />
            </div>
          </div>

          <div className="pf-modal-footer">
            <button type="button" onClick={onClose} className="pf-btn pf-btn-secondary" disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="pf-btn pf-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="pf-spinner" size={18} />
                  Đang lưu...
                </>
              ) : (
                mode === 'create' ? 'Thêm Dự Án' : 'Lưu Thay Đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
