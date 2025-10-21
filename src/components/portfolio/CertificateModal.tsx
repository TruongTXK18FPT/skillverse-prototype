// Add External Certificate Modal
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { ExternalCertificateDTO, CertificateCategory } from '../../data/portfolioDTOs';
import '../../styles/PortfolioModals.css';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (certificate: ExternalCertificateDTO, image?: File) => Promise<void>;
  initialData?: ExternalCertificateDTO;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExternalCertificateDTO>({
    title: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
    certificateImageUrl: '',
    skills: [],
    category: CertificateCategory.TECHNICAL,
    isVerified: false,
  });

  const [image, setImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setImagePreview(initialData.certificateImageUrl || '');
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills?.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills?.filter(s => s !== skill) || []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData, image);
      onClose();
    } catch (error) {
      console.error('Error submitting certificate:', error);
      alert('Có lỗi xảy ra khi thêm chứng chỉ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pf-modal-overlay" onClick={onClose}>
      <div className="pf-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="pf-modal-header">
          <h2>Thêm Chứng Chỉ Ngoài</h2>
          <button className="pf-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pf-modal-body">
          <div className="pf-form-section">
            <h3>Thông Tin Chứng Chỉ</h3>
            
            <div className="pf-form-group">
              <label>Tên Chứng Chỉ *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: AWS Certified Solutions Architect"
                required
              />
            </div>

            <div className="pf-form-group">
              <label>Tổ Chức Cấp *</label>
              <input
                type="text"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
                placeholder="VD: Amazon Web Services"
                required
              />
            </div>

            <div className="pf-form-row">
              <div className="pf-form-group">
                <label>Danh Mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CertificateCategory })}
                >
                  <option value={CertificateCategory.TECHNICAL}>Kỹ Thuật</option>
                  <option value={CertificateCategory.DESIGN}>Thiết Kế</option>
                  <option value={CertificateCategory.BUSINESS}>Kinh Doanh</option>
                  <option value={CertificateCategory.SOFT_SKILLS}>Kỹ Năng Mềm</option>
                  <option value={CertificateCategory.LANGUAGE}>Ngôn Ngữ</option>
                  <option value={CertificateCategory.OTHER}>Khác</option>
                </select>
              </div>

              <div className="pf-form-group">
                <label>Ngày Cấp</label>
                <input
                  type="date"
                  value={formData.issueDate || ''}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>

              <div className="pf-form-group">
                <label>Ngày Hết Hạn</label>
                <input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="pf-form-group">
              <label>Mô Tả</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về chứng chỉ..."
                rows={3}
              />
            </div>
          </div>

          <div className="pf-form-section">
            <h3>Xác Thực</h3>
            
            <div className="pf-form-group">
              <label>Credential ID</label>
              <input
                type="text"
                value={formData.credentialId || ''}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                placeholder="VD: ABC123456"
              />
            </div>

            <div className="pf-form-group">
              <label>Link Xác Thực</label>
              <input
                type="url"
                value={formData.credentialUrl || ''}
                onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                placeholder="https://verify.example.com/cert/123"
              />
            </div>
          </div>

          <div className="pf-form-section">
            <h3>Ảnh Chứng Chỉ</h3>
            
            <div className="pf-form-group">
              <div className="pf-file-upload">
                {imagePreview && (
                  <img src={imagePreview} alt="Certificate preview" className="pf-preview-image-wide" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="cert-image-upload"
                />
                <label htmlFor="cert-image-upload" className="pf-upload-btn">
                  <Upload size={18} />
                  Tải Ảnh Chứng Chỉ
                </label>
              </div>
            </div>
          </div>

          <div className="pf-form-section">
            <h3>Kỹ Năng Liên Quan</h3>
            
            <div className="pf-form-group">
              <div className="pf-tags-input">
                <div className="pf-tags-list">
                  {formData.skills?.map((skill, idx) => (
                    <span key={idx} className="pf-tag">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="pf-tag-input-row">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Nhập kỹ năng và Enter"
                  />
                  <button type="button" onClick={handleAddSkill} className="pf-btn-add">+</button>
                </div>
              </div>
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
                'Thêm Chứng Chỉ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificateModal;
