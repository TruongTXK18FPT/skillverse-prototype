// DATA COMPILER MODAL - CV Generation with Mothership Theme
import React, { useState } from 'react';
import { X, Loader, Sparkles, FileText } from 'lucide-react';
import { CVGenerationRequest } from '../../data/portfolioDTOs';
import { useScrollLock } from './useScrollLock';
import './dossier-portfolio-styles.css';

interface DataCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CVGenerationRequest) => Promise<void>;
}

export const DataCompilerModal: React.FC<DataCompilerModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  // Scroll lock when modal is open
  useScrollLock(isOpen);

  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('PROFESSIONAL');
  const [alertModal, setAlertModal] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'warning' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });
  const [formData, setFormData] = useState<CVGenerationRequest>({
    templateName: 'PROFESSIONAL',
    targetRole: '',
    targetIndustry: '',
    additionalInstructions: '',
    includeProjects: true,
    includeCertificates: true,
    includeReviews: true,
  });

  const templates = [
    {
      name: 'PROFESSIONAL',
      title: 'PROTOCOL ALPHA',
      subtitle: '(Professional)',
      description: 'Blueprint-style tactical format',
      icon: '💼',
      style: 'blueprint'
    },
    {
      name: 'CREATIVE',
      title: 'HOLO-STREAM',
      subtitle: '(Creative)',
      description: 'RGB gradient visual enhancement',
      icon: '🎨',
      style: 'holo'
    },
    {
      name: 'MINIMAL',
      title: 'RAW DATA',
      subtitle: '(Minimal)',
      description: 'Terminal green monospace',
      icon: '📄',
      style: 'terminal'
    },
    {
      name: 'MODERN',
      title: 'CYBER PROTOCOL',
      subtitle: '(Modern)',
      description: 'Advanced UI framework',
      icon: '✨',
      style: 'cyber'
    }
  ];

  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    setFormData({ ...formData, templateName });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error generating CV:', error);
      setAlertModal({
        show: true,
        message: 'Có lỗi xảy ra khi tạo CV. Vui lòng thử lại.',
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
        {/* Header */}
        <div className="dossier-modal-header">
          <div>
            <h2 className="dossier-modal-title">
              <Sparkles size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
              COMPILE DEPLOYMENT DATA
            </h2>
            <p className="dossier-modal-subtitle">AI will generate tactical CV from pilot records</p>
          </div>
          <button className="dossier-modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="dossier-modal-body">
          {/* Template Selection */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">SELECT OUTPUT PROTOCOL</h3>

            <div className="dossier-template-grid">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className={`dossier-template-card ${selectedTemplate === template.name ? 'dossier-template-card--selected' : ''}`}
                  onClick={() => handleTemplateSelect(template.name)}
                >
                  <div className="dossier-template-icon">{template.icon}</div>
                  <h4 className="dossier-template-name">{template.title}</h4>
                  <p className="dossier-template-subtitle">{template.subtitle}</p>
                  <p className="dossier-template-desc">{template.description}</p>
                  {selectedTemplate === template.name && (
                    <div className="dossier-template-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Target Configuration */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">MISSION PARAMETERS (OPTIONAL)</h3>

            <div className="dossier-form-row">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Target Position</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.targetRole || ''}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder="e.g., Senior Full Stack Developer"
                />
                <small style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  AI will optimize for this role
                </small>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Industry Sector</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.targetIndustry || ''}
                  onChange={(e) => setFormData({ ...formData, targetIndustry: e.target.value })}
                  placeholder="e.g., Fintech, E-commerce"
                />
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Special Instructions</label>
              <textarea
                className="dossier-textarea"
                value={formData.additionalInstructions || ''}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                placeholder="e.g., Emphasize React and Node.js experience..."
                rows={3}
              />
            </div>
          </div>

          {/* Content Selection */}
          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">DATA MODULES</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.includeProjects || false}
                  onChange={(e) => setFormData({ ...formData, includeProjects: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <FileText size={18} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--dossier-cyan)' }} />
                  <strong style={{ color: 'var(--dossier-silver)' }}>Include Mission Logs</strong>
                  <small style={{ display: 'block', color: 'var(--dossier-silver-dark)', marginTop: '0.25rem' }}>
                    Add portfolio projects to CV
                  </small>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.includeCertificates || false}
                  onChange={(e) => setFormData({ ...formData, includeCertificates: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <FileText size={18} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--dossier-cyan)' }} />
                  <strong style={{ color: 'var(--dossier-silver)' }}>Include Commendations</strong>
                  <small style={{ display: 'block', color: 'var(--dossier-silver-dark)', marginTop: '0.25rem' }}>
                    Add earned certificates
                  </small>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.includeReviews || false}
                  onChange={(e) => setFormData({ ...formData, includeReviews: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <FileText size={18} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--dossier-cyan)' }} />
                  <strong style={{ color: 'var(--dossier-silver)' }}>Include Assessments</strong>
                  <small style={{ display: 'block', color: 'var(--dossier-silver-dark)', marginTop: '0.25rem' }}>
                    Add mentor reviews
                  </small>
                </div>
              </label>
            </div>
          </div>

          {/* AI Info Banner */}
          <div className="dossier-ai-banner">
            <Sparkles size={20} />
            <div>
              <strong>AUTOMATED OPTIMIZATION FEATURES:</strong>
              <ul style={{ marginTop: '0.5rem', lineHeight: '1.8' }}>
                <li>Professional summary generation from pilot records</li>
                <li>Optimized data structure for maximum impact</li>
                <li>Strategic skill highlighting for target sector</li>
                <li>ATS (Applicant Tracking System) keyword optimization</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="dossier-modal-footer" style={{ marginTop: '2rem', borderTop: 'none', paddingTop: 0 }}>
            <button
              type="button"
              onClick={onClose}
              className="dossier-btn-secondary"
              disabled={loading}
            >
              ABORT
            </button>
            <button
              type="submit"
              className="dossier-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="dossier-spinner" size={18} />
                  COMPILING DATA...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  COMPILE CV
                </>
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

export default DataCompilerModal;