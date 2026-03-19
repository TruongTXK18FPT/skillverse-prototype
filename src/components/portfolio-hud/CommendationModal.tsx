import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronDown, Upload, Wand2, X } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { CertificateCategory, ExternalCertificateDTO } from '../../data/portfolioDTOs';
import { useScrollLock } from './useScrollLock';
import SystemAlertModal from './SystemAlertModal';
import './dossier-portfolio-styles.css';

interface CommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (certificate: ExternalCertificateDTO, image?: File) => Promise<void>;
  initialData?: ExternalCertificateDTO;
}

const CATEGORY_OPTIONS: Array<{ value: CertificateCategory; label: string; hint: string }> = [
  { value: CertificateCategory.TECHNICAL, label: 'Kỹ thuật', hint: 'Chứng chỉ công nghệ, lập trình, hệ thống.' },
  { value: CertificateCategory.DESIGN, label: 'Thiết kế', hint: 'Thiết kế sản phẩm, đồ họa, trải nghiệm người dùng.' },
  { value: CertificateCategory.BUSINESS, label: 'Kinh doanh', hint: 'Marketing, bán hàng, vận hành, quản trị.' },
  { value: CertificateCategory.SOFT_SKILLS, label: 'Kỹ năng mềm', hint: 'Giao tiếp, quản lý, thuyết trình, teamwork.' },
  { value: CertificateCategory.LANGUAGE, label: 'Ngôn ngữ', hint: 'Chứng chỉ ngoại ngữ hoặc năng lực ngôn ngữ.' },
  { value: CertificateCategory.OTHER, label: 'Khác', hint: 'Các chứng nhận chuyên môn khác.' },
];

const SKILL_SUGGESTIONS = [
  'UI/UX',
  'Frontend',
  'Backend',
  'Cloud',
  'Quản lý dự án',
  'Phân tích dữ liệu',
  'Giao tiếp',
  'Tiếng Anh',
];

const DESCRIPTION_TEMPLATE = [
  'Mục tiêu chứng chỉ: Chứng nhận năng lực hoặc kiến thức ở mảng nào?',
  'Nội dung trọng tâm: Chủ đề, công nghệ hoặc kỹ năng được xác nhận.',
  'Ứng dụng thực tế: Chứng chỉ này hỗ trợ công việc của bạn ra sao?',
].join('\n');

const getInitialCertificateState = (): ExternalCertificateDTO => ({
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

export const CommendationModal: React.FC<CommendationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  useScrollLock(isOpen);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExternalCertificateDTO>(getInitialCertificateState());
  const [image, setImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...getInitialCertificateState(),
          ...initialData,
          skills: initialData.skills || [],
          category: initialData.category || CertificateCategory.TECHNICAL,
        });
        setImagePreview(initialData.certificateImageUrl || '');
        setShowAdvanced(Boolean(initialData.expiryDate || initialData.credentialId || initialData.credentialUrl));
      } else {
        setFormData(getInitialCertificateState());
        setImagePreview('');
        setShowAdvanced(false);
      }

      setImage(undefined);
      setSkillInput('');
    }
  }, [initialData, isOpen]);

  const activeCategory = useMemo(
    () => CATEGORY_OPTIONS.find((option) => option.value === formData.category),
    [formData.category],
  );

  const updateField = <K extends keyof ExternalCertificateDTO>(field: K, value: ExternalCertificateDTO[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAlertModal({
        show: true,
        message: 'Vui lòng chọn một tệp ảnh hợp lệ cho chứng chỉ.',
        type: 'warning',
      });
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const addSkill = (value = skillInput) => {
    const nextValue = value.trim();
    if (!nextValue) {
      return;
    }

    if ((formData.skills || []).some((skill) => skill.toLowerCase() === nextValue.toLowerCase())) {
      setSkillInput('');
      return;
    }

    updateField('skills', [...(formData.skills || []), nextValue]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    updateField('skills', (formData.skills || []).filter((item) => item !== skill));
  };

  const appendDescriptionTemplate = () => {
    updateField(
      'description',
      formData.description
        ? `${formData.description.trim()}\n\n${DESCRIPTION_TEMPLATE}`
        : DESCRIPTION_TEMPLATE,
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit(
        {
          ...formData,
          category: formData.category || CertificateCategory.TECHNICAL,
          skills: formData.skills || [],
        },
        image,
      );
      onClose();
    } catch (error) {
      console.error('Error submitting certificate:', error);
      setAlertModal({
        show: true,
        message: 'Không thể lưu chứng chỉ. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dossier-modal-overlay" onClick={onClose}>
      <div className="dossier-modal-container dossier-modal-container--wide" onClick={(event) => event.stopPropagation()}>
        <div className="dossier-modal-header">
          <div>
            <h2 className="dossier-modal-title">Thêm chứng chỉ</h2>
            <p className="dossier-modal-subtitle">Làm rõ năng lực đã được xác nhận từ tổ chức hoặc nền tảng uy tín.</p>
          </div>
          <button className="dossier-modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form id="commendation-form" onSubmit={handleSubmit} className="dossier-modal-body">
          <div className="dossier-entry-banner">
            <div className="dossier-entry-banner__content">
              <h3 className="dossier-entry-banner__title">Ưu tiên thông tin xác thực và khả năng ứng dụng</h3>
              <p className="dossier-entry-banner__text">
                Một chứng chỉ tốt nên cho thấy bạn học gì, được xác nhận bởi ai và nó liên quan thế nào đến công việc thực tế.
              </p>
            </div>
            <div className="dossier-entry-banner__meta">{activeCategory?.label || 'Chứng chỉ'}</div>
          </div>

          <div className="dossier-entry-grid">
            <div className="dossier-form-section">
              <h3 className="dossier-form-section-title">Thông tin chính</h3>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Tên chứng chỉ *</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Ví dụ: Google UX Design Professional Certificate"
                  required
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Tổ chức cấp *</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.issuingOrganization}
                  onChange={(event) => updateField('issuingOrganization', event.target.value)}
                  placeholder="Ví dụ: Coursera, Google, AWS, Microsoft"
                  required
                />
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Danh mục</label>
                <div className="dossier-entry-pill-row">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`dossier-entry-pill ${formData.category === option.value ? 'dossier-entry-pill--active' : ''}`}
                      onClick={() => updateField('category', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="dossier-entry-help">{activeCategory?.hint}</p>
              </div>

              <div className="dossier-entry-field-grid">
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Ngày cấp</label>
                  <input
                    type="date"
                    className="dossier-input"
                    value={formData.issueDate || ''}
                    onChange={(event) => updateField('issueDate', event.target.value)}
                  />
                </div>

                <div className="dossier-form-group">
                  <label className="dossier-form-label">Ngày hết hạn</label>
                  <input
                    type="date"
                    className="dossier-input"
                    value={formData.expiryDate || ''}
                    onChange={(event) => updateField('expiryDate', event.target.value)}
                  />
                </div>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Mô tả</label>
                <textarea
                  className="dossier-textarea"
                  value={formData.description || ''}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Tóm tắt nội dung chứng chỉ và giá trị ứng dụng của nó trong công việc."
                  rows={7}
                />
                <div className="dossier-entry-inline" style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="dossier-btn-secondary" onClick={appendDescriptionTemplate}>
                    <Wand2 size={16} />
                    Chèn mẫu mô tả
                  </button>
                </div>
              </div>
            </div>

            <div className="dossier-form-section">
              <h3 className="dossier-form-section-title">Ảnh chứng chỉ</h3>

              <div className="dossier-entry-upload">
                {imagePreview ? (
                  <img src={imagePreview} alt="Xem trước chứng chỉ" className="dossier-entry-upload__preview" />
                ) : (
                  <div className="dossier-entry-upload__placeholder">
                    <Upload size={28} />
                    <strong>Thêm ảnh hoặc snapshot chứng chỉ</strong>
                    <span>Ảnh rõ tên chứng chỉ và đơn vị cấp sẽ giúp hồ sơ đáng tin hơn.</span>
                  </div>
                )}

                <div className="dossier-entry-upload__meta">
                  Bạn có thể dùng ảnh chụp màn hình chứng chỉ, badge hoặc bản scan đơn giản, rõ thông tin chính.
                </div>

                <input
                  id="commendation-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="commendation-upload" className="dossier-btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={16} />
                  {imagePreview ? 'Đổi ảnh chứng chỉ' : 'Tải ảnh chứng chỉ'}
                </label>
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Kỹ năng liên quan</h3>

            <div className="dossier-entry-support-grid" style={{ marginBottom: '1rem' }}>
              <div className="dossier-entry-support-card">
                <h4 className="dossier-entry-support-title">Nên thêm kỹ năng nào</h4>
                <p className="dossier-entry-support-text">Chọn đúng kỹ năng được chứng thực để recruiter nhìn thấy nhanh năng lực liên quan.</p>
              </div>
              <div className="dossier-entry-support-card">
                <h4 className="dossier-entry-support-title">Ít nhưng đúng</h4>
                <p className="dossier-entry-support-text">Tập trung 3 đến 6 kỹ năng thực sự gắn với nội dung chứng chỉ là đủ rõ ràng.</p>
              </div>
            </div>

            <div className="dossier-entry-chipbox">
              <div className="dossier-module-tags">
                {(formData.skills || []).map((skill) => (
                  <span key={skill} className="dossier-module-tag">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="dossier-entry-inline">
                <input
                  type="text"
                  className="dossier-input"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Ví dụ: Cloud, Quản lý dự án, UI/UX"
                />
                <button type="button" className="dossier-btn-primary" onClick={() => addSkill()}>
                  Thêm
                </button>
              </div>

              <div className="dossier-entry-pill-row">
                {SKILL_SUGGESTIONS.map((skill) => (
                  <button key={skill} type="button" className="dossier-entry-pill" onClick={() => addSkill(skill)}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <button
              type="button"
              className="dossier-entry-advanced-toggle"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              <span>Thông tin xác minh nâng cao</span>
              <ChevronDown
                size={16}
                style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              />
            </button>

            {showAdvanced && (
              <div style={{ marginTop: '1rem' }}>
                <div className="dossier-entry-field-grid">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Mã chứng chỉ</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={formData.credentialId || ''}
                      onChange={(event) => updateField('credentialId', event.target.value)}
                      placeholder="Ví dụ: AWS-2026-001234"
                    />
                  </div>

                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Link xác minh</label>
                    <input
                      type="url"
                      className="dossier-input"
                      value={formData.credentialUrl || ''}
                      onChange={(event) => updateField('credentialUrl', event.target.value)}
                      placeholder="https://verify.example.com/certificate/123"
                    />
                  </div>
                </div>

                <label className="dossier-toggle-card">
                  <input
                    type="checkbox"
                    className="dossier-toggle-input"
                    checked={formData.isVerified || false}
                    onChange={(event) => updateField('isVerified', event.target.checked)}
                  />
                  <span className="dossier-toggle-content">
                    <span className="dossier-toggle-title">Đánh dấu đã xác minh</span>
                    <span className="dossier-toggle-desc">Bật khi bạn đã có link xác minh hoặc nguồn kiểm tra công khai.</span>
                  </span>
                </label>
              </div>
            )}
          </div>
        </form>

        <div className="dossier-modal-footer">
          <button type="button" onClick={onClose} className="dossier-btn-secondary" disabled={loading}>
            Hủy
          </button>
          <button type="submit" form="commendation-form" className="dossier-btn-primary" disabled={loading}>
            {loading ? (
              <>
                <MeowlKuruLoader size="tiny" text="" />
                Đang lưu...
              </>
            ) : (
              <>
                <BadgeCheck size={16} />
                Lưu chứng chỉ
              </>
            )}
          </button>
        </div>

        <SystemAlertModal
          isOpen={alertModal.show}
          onClose={() => setAlertModal((prev) => ({ ...prev, show: false }))}
          message={alertModal.message}
          type={alertModal.type}
        />
      </div>
    </div>
  );
};

export default CommendationModal;
