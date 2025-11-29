// MISSION LOG MODAL - Project Add/Edit with Mothership Theme
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { PortfolioProjectDTO, ProjectType } from '../../data/portfolioDTOs';
import { useScrollLock } from './useScrollLock';
import SystemAlertModal from './SystemAlertModal';
import './dossier-portfolio-styles.css';

interface MissionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: PortfolioProjectDTO, thumbnail?: File) => Promise<void>;
  initialData?: PortfolioProjectDTO;
  mode: 'create' | 'edit';
}

export const MissionLogModal: React.FC<MissionLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  useScrollLock(isOpen);

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
  const [alertModal, setAlertModal] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'warning' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });

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
      setAlertModal({
        show: true,
        message: 'Lỗi khi lưu dự án. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dossier-modal-overlay" onClick={onClose}>
      <div className="dossier-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="dossier-modal-header">
          <div>
            <h2 className="dossier-modal-title">
              {mode === 'create' ? 'Thêm dự án' : 'Cập nhật dự án'}
            </h2>
            <p className="dossier-modal-subtitle">Ghi lại hoạt động dự án</p>
          </div>
          <button className="dossier-modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dossier-modal-body">
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Chi tiết dự án</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Tên dự án *</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Thiết kế lại nền tảng E-Commerce"
                required
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Mô tả *</label>
              <textarea
                className="dossier-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết dự án..."
                rows={4}
                required
              />
            </div>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Loại dự án *</label>
                <select
                  className="dossier-select"
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value as ProjectType })}
                  required
                >
                  <option value={ProjectType.MICROJOB}>Việc nhỏ</option>
                  <option value={ProjectType.FREELANCE}>Tự do</option>
                  <option value={ProjectType.PERSONAL}>Cá nhân</option>
                  <option value={ProjectType.ACADEMIC}>Học thuật</option>
                  <option value={ProjectType.OPEN_SOURCE}>Mã nguồn mở</option>
                </select>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Khách hàng</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Ví dụ: Công ty ABC"
                />
              </div>
            </div>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Thời gian</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Ví dụ: 3 tuần"
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Ngày hoàn thành</label>
                <input
                  type="date"
                  className="dossier-input"
                  value={formData.completionDate || ''}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Ảnh dự án</h3>

            <div className="dossier-form-group">
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '1rem', textAlign: 'center' }}>
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="Thumbnail" style={{ width: '100%', height: '150px', objectFit: 'cover', marginBottom: '1rem' }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="thumbnail-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="thumbnail-upload" className="dossier-btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={18} />
                  Tải ảnh
                </label>
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Công nghệ sử dụng</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Công nghệ sử dụng</label>
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '0.75rem' }}>
                <div className="dossier-module-tags" style={{ marginBottom: '0.75rem' }}>
                  {formData.tools?.map((tool, idx) => (
                    <span key={idx} className="dossier-module-tag">
                      {tool}
                      <button type="button" onClick={() => handleRemoveTool(tool)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--dossier-cyan)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="dossier-input"
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTool())}
                    placeholder="Ví dụ: React, Node.js, MongoDB"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddTool} className="dossier-btn-primary">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Kết quả</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Thành tựu</label>
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '0.75rem' }}>
                <div className="dossier-module-tags" style={{ marginBottom: '0.75rem' }}>
                  {formData.outcomes?.map((outcome, idx) => (
                    <span key={idx} className="dossier-module-tag">
                      {outcome}
                      <button type="button" onClick={() => handleRemoveOutcome(outcome)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--dossier-cyan)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="dossier-input"
                    value={outcomeInput}
                    onChange={(e) => setOutcomeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOutcome())}
                    placeholder="Ví dụ: Tăng tỷ lệ chuyển đổi 35%"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddOutcome} className="dossier-btn-primary">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Liên kết & đánh giá</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">URL dự án</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.projectUrl || ''}
                onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                placeholder="https://project-demo.com"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Kho GitHub</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.githubUrl || ''}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/user/repo"
              />
            </div>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
              <label className="dossier-form-label">Đánh giá (1-5)</label>
                <input
                  type="number"
                  className="dossier-input"
                  value={formData.rating || 5}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="5"
                />
              </div>

              <div className="dossier-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginTop: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured || false}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--dossier-silver)' }}>Dự án nổi bật</span>
                </label>
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Phản hồi khách hàng</label>
              <textarea
                className="dossier-textarea"
                value={formData.clientFeedback || ''}
                onChange={(e) => setFormData({ ...formData, clientFeedback: e.target.value })}
                placeholder="Phản hồi của khách hàng về dự án..."
                rows={3}
              />
            </div>
          </div>

          <div className="dossier-modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
            <button type="button" onClick={onClose} className="dossier-btn-secondary" disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="dossier-btn-primary" disabled={loading}>
              {loading ? (
                <>
                <Loader className="dossier-spinner" size={18} />
                Đang lưu...
                </>
              ) : (
                mode === 'create' ? 'Thêm dự án' : 'Cập nhật'
              )}
            </button>
          </div>
        </form>
      </div>

      <SystemAlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({...alertModal, show: false})}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default MissionLogModal;
