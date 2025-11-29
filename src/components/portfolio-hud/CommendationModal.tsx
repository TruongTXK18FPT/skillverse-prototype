// COMMENDATION MODAL - Certificate Add with Mothership Theme
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { ExternalCertificateDTO, CertificateCategory } from '../../data/portfolioDTOs';
import { useScrollLock } from './useScrollLock';
import SystemAlertModal from './SystemAlertModal';
import './dossier-portfolio-styles.css';

interface CommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (certificate: ExternalCertificateDTO, image?: File) => Promise<void>;
  initialData?: ExternalCertificateDTO;
}

export const CommendationModal: React.FC<CommendationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  useScrollLock(isOpen);

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
  const [alertModal, setAlertModal] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'warning' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });

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
      setAlertModal({
        show: true,
        message: 'Error adding commendation. Please try again.',
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
            <h2 className="dossier-modal-title">ADD COMMENDATION</h2>
            <p className="dossier-modal-subtitle">Register external certification</p>
          </div>
          <button className="dossier-modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dossier-modal-body">
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">CERTIFICATE DETAILS</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Certificate Name *</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., AWS Certified Solutions Architect"
                required
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Issuing Organization *</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
                placeholder="e.g., Amazon Web Services"
                required
              />
            </div>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Category</label>
                <select
                  className="dossier-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CertificateCategory })}
                >
                  <option value={CertificateCategory.TECHNICAL}>Technical</option>
                  <option value={CertificateCategory.DESIGN}>Design</option>
                  <option value={CertificateCategory.BUSINESS}>Business</option>
                  <option value={CertificateCategory.SOFT_SKILLS}>Soft Skills</option>
                  <option value={CertificateCategory.LANGUAGE}>Language</option>
                  <option value={CertificateCategory.OTHER}>Other</option>
                </select>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Issue Date</label>
                <input
                  type="date"
                  className="dossier-input"
                  value={formData.issueDate || ''}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Expiry Date</label>
                <input
                  type="date"
                  className="dossier-input"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Description</label>
              <textarea
                className="dossier-textarea"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of certificate..."
                rows={3}
              />
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">VERIFICATION</h3>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Credential ID</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.credentialId || ''}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                placeholder="e.g., ABC123456"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Verification URL</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.credentialUrl || ''}
                onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                placeholder="https://verify.example.com/cert/123"
              />
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">CERTIFICATE IMAGE</h3>

            <div className="dossier-form-group">
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '1rem', textAlign: 'center' }}>
                {imagePreview && (
                  <img src={imagePreview} alt="Certificate" style={{ width: '100%', height: '150px', objectFit: 'cover', marginBottom: '1rem' }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="cert-image-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="cert-image-upload" className="dossier-btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={18} />
                  Upload Image
                </label>
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">RELATED SKILLS</h3>

            <div className="dossier-form-group">
              <div style={{ border: '1px solid var(--dossier-border-silver)', padding: '0.75rem' }}>
                <div className="dossier-module-tags" style={{ marginBottom: '0.75rem' }}>
                  {formData.skills?.map((skill, idx) => (
                    <span key={idx} className="dossier-module-tag">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--dossier-cyan)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="dossier-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill and press Enter"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddSkill} className="dossier-btn-primary">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="dossier-modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
            <button type="button" onClick={onClose} className="dossier-btn-secondary" disabled={loading}>
              CANCEL
            </button>
            <button type="submit" className="dossier-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="dossier-spinner" size={18} />
                  SAVING...
                </>
              ) : (
                'ADD COMMENDATION'
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

export default CommendationModal;